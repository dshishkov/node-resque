import createService from 'feathers-mongodb'
import hooks from './hooks'

export default async app => {
  let paginate = app.get('paginate')
  let Model = app.mongo.db.collection('ticker')
  app.use('/ticker', createService({ Model, paginate }))
  app.service('ticker').hooks(hooks)
}
