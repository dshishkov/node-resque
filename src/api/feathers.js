import _ from 'lodash/fp'
import fs from 'fs'
import configuration from '@feathersjs/configuration'
import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'
import compress from 'compression'
import helmet from 'helmet'

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
// Register a nicer error handler than the default Express one
app.use(express.errorHandler())

let dirs = _.filter(
  x => x.isDirectory(),
  fs.readdirSync(__dirname, { withFileTypes: true }),
)

export default async () => {
  for (let dir of dirs) {
    let service = require(`${__dirname}/${dir.name}`).default
    await service(app)
  }
  app
    .listen(port)
    .on('listening', () => console.info('Feathers server started'))
  return app
}
