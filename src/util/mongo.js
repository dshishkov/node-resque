import _ from 'lodash/fp'
import config from 'config'
import { MongoClient } from 'mongodb'

export let getMongoClient = _.memoize(() => {
  let configuration = config.get('mongo')
  return MongoClient.connect(configuration.uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
})

let getMongoDb = _.memoize(async () => {
  let client = await getMongoClient()
  return client.db(config.get('mongo').dbName)
})

export let getMongoCollection = _.memoize(async name => (await getMongoDb()).collection(name))

export default getMongoDb
