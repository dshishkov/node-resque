import _ from 'lodash/fp'
import config from 'config'
import { Queue, Scheduler, MultiWorker } from 'node-resque'

let redisConnection = _.pick(['host', 'pkg'], config.get('redis'))

export let getQueue = async jobs => {
  let queue = new Queue({ connection: redisConnection }, jobs)
  queue.on('error', error => {
    console.error(error)
  })
  await queue.connect()
  return queue
}

export let retryFailedJobs = async queue => {
  let failed
  do {
    failed = await queue.failed(0, 100)
    await Promise.all(failed.map(job => queue.retryAndRemoveFailed(job)))
  } while (failed.length > 0)
}

export let getWorker = async jobs => {
  let worker = new MultiWorker({ connection: redisConnection }, jobs)
  worker.on('start', () => {
    console.info('worker started')
  })
  worker.on('end', () => {
    console.info('worker ended')
  })
  worker.on('job', (queue, job) => {
    console.info(`working job ${queue} ${JSON.stringify(job)}`)
  })
  worker.on('reEnqueue', (queue, job, plugin) => {
    console.info(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`)
  })
  worker.on('success', (queue, job, result) => {
    console.info(
      `job success ${queue} ${JSON.stringify(job)} >> ${
        result && JSON.stringify(result)
      }`,
    )
  })
  worker.on('failure', (queue, job, failure) => {
    console.info(`job failure ${queue} ${JSON.stringify(job)} >> ${failure}`)
  })
  worker.on('error', (error, queue, job) => {
    console.info(`error ${queue} ${JSON.stringify(job)}  >> ${error}`)
  })
  await worker.start()
  return worker
}

export let getScheduler = _.memoize(async () => {
  let scheduler = new Scheduler({
    connection: redisConnection,
    stuckWorkerTimeout: 2 * 60 * 1000,
    retryStuckJobs: true,
  })
  await scheduler.connect()
  await scheduler.start()

  scheduler.on('start', () => {
    console.info('scheduler started')
  })
  scheduler.on('end', () => {
    console.info('scheduler ended')
  })
  scheduler.on('error', error => {
    console.info(`scheduler error >> ${error}`)
  })
  return scheduler
})
