import _ from 'lodash/fp'
import F from 'futil'
import fs from 'fs'

export default F.arrayToObject(
  name => name.replace('.js', ''),
  name => require(`${__dirname}/${name}`).default,
  _.flow(fs.readdirSync, _.pull('index.js'))(__dirname),
)
