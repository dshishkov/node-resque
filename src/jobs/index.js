import _ from 'lodash/fp'
import F from 'futil'
import fs from 'fs'

export default app => {
  let enabledJobs = app.get('enabledJobs')
  return _.flow(
    fs.readdirSync,
    _.pull('index.js'),
    F.arrayToObject(
      name => name.replace('.js', ''),
      name => {
        name = name.replace('.js', '')
        let jobDefinition = require(`${__dirname}/${name}`).default
        let job = _.isFunction(jobDefinition)
          ? jobDefinition(app)
          : jobDefinition
        job.enabled = _.isEmpty(enabledJobs) || _.includes(enabledJobs, name)
        return job
      },
    ),
    _.filter('enabled'),
  )(__dirname)
}
