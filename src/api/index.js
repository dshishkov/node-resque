import _ from 'lodash/fp'
import fs from 'fs'
import configuration from '@feathersjs/configuration'
import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'
import compress from 'compression'
import helmet from 'helmet'
import getMongoDb, { getMongoClient } from '../util/mongo'

let setupServices = async app => {
  let serviceDir = `${__dirname}/services`
  let dirs = _.filter(
    x => x.isDirectory(),
    fs.readdirSync(serviceDir, { withFileTypes: true }),
  )
  app.mongo = {
    client: await getMongoClient(),
    db: await getMongoDb(),
  }
  for (let dir of dirs) {
    let service = require(`${serviceDir}/${dir.name}`).default
    await service(app)
  }
}

export default async () => {
  let app = express(feathers())
  app.configure(configuration())
  let { port = 80 } = app.get('feathers')

  // Helmet
  app.use(helmet())
  // Use gzip compression
  app.use(compress())
  // Parse URL-encoded params
  app.use(express.urlencoded({ extended: true }))
  // https://expressjs.com/en/api.html#express.json
  app.use(express.json({ limit: '100mb' }))
  // Host static files from the current folder
  app.use(express.static(__dirname.replace('/src/api', '/public')))
  // Add REST API support
  app.configure(express.rest())

  await setupServices(app)
  // Configure middleware for 404s
  app.use(express.notFound())
  // Register a nicer error handler than the default Express one
  app.use(express.errorHandler())

  app
    .listen(port)
    .on('listening', () => console.info('Feathers server started'))
  return app
}
