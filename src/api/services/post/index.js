import createService from 'feathers-mongodb'
import hooks from './hooks'

export default async app => {
  let paginate = app.get('paginate')
  let Model = app.mongo.db.collection('post')
  app.use('/post', createService({ Model, paginate }))
  app.service('post').hooks(hooks)
}
