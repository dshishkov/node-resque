import configuration from '@feathersjs/configuration'
import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'

let app = express(feathers())
app.configure(configuration())

// Parse HTTP JSON bodies
app.use(express.json())
// Parse URL-encoded params
app.use(express.urlencoded({ extended: true }))
// Host static files from the current folder
app.use(express.static(__dirname.replace('/src', '/public')))
// Add REST API support
app.configure(express.rest())
// Register a nicer error handler than the default Express one
app.use(express.errorHandler())

app.use('test', {
  async find() {
    return {
      test: true,
    }
  },
  async create(data) {
    return data
  },
})

let { port = 80 } = app.get('feathers')
app.listen(port).on('listening', () => console.info('Feathers server started'))

export default app
