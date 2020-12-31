import jobs from './jobs'
import cron from './util/cron'
import {
  getWorker,
  getQueue,
  retryFailedJobs,
  getScheduler,
} from './util/resque'
import './feathers'

let init = async () => {
  let [queue, worker, scheduler] = await Promise.all([
    getQueue(jobs),
    getWorker(jobs),
    getScheduler(),
  ])

  await retryFailedJobs(queue)

  await cron({ queue, scheduler, jobs })

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

init().catch(e => {
  console.trace(e)
  process.exit(1)
})
