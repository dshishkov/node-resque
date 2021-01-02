import _ from 'lodash/fp'
import F from 'futil'
import fs from 'fs'

export default app => {
  let enabledQueues = app.get('enabledJobs')
  return F.arrayToObject(
    name => name.replace('.js', ''),
    name => {
      name = name.replace('.js', '')
      let jobDefinition = require(`${__dirname}/${name}`).default
      let job = _.isFunction(jobDefinition) ? jobDefinition(app) : jobDefinition
      job.enabled = _.isEmpty(enabledQueues) || _.includes(enabledQueues, name)
      return job
    },
    _.flow(fs.readdirSync, _.pull('index.js'))(__dirname),
  )
}
