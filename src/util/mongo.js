import _ from 'lodash/fp'
import config from 'config'
import { MongoClient } from 'mongodb'

let getMongoDb = _.memoize(async () => {
  let configuration = config.get('mongo')
  let client = await MongoClient.connect(configuration.uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  return client.db(configuration.dbName)
})

export let getMongoCollection = _.memoize(async name => (await getMongoDb()).collection(name))

export default getMongoDb
