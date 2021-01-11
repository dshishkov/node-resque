import _ from 'lodash/fp'
import F from 'futil'
import fs from 'fs'
import cron from '../util/cron'
import { getWorker, getQueue, getScheduler } from '../util/resque'

export default async app => {
  let enabledJobs = app.get('enabledJobs')
  let jobs = _.flow(
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

  let queue = (app.queue = await getQueue(jobs))
  let [worker, scheduler] = await Promise.all([getWorker(jobs), getScheduler()])

  cron({ queue, scheduler, jobs })
  app.worker = worker
  worker.on('job', async () => {
    console.info('queue stats', await queue.stats())
  })

  let shutdown = async () => {
    await queue.end()
    await scheduler.end()
    await worker.end()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
