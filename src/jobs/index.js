import _ from 'lodash/fp'
import F from 'futil'
import fs from 'fs'

export default app => F.arrayToObject(
  name => name.replace('.js', ''),
  name => {
    let jobDefinition = require(`${__dirname}/${name}`).default
    return _.isFunction(jobDefinition) ? jobDefinition(app) : jobDefinition
  },
  _.flow(fs.readdirSync, _.pull('index.js'))(__dirname),
)
