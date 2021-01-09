import allJobs from './jobs'
import cron from './util/cron'
import { getWorker, getQueue, getScheduler } from './util/resque'
import api from './api'

let init = async () => {
  let app = await api()
  let jobs = allJobs(app)
  let queue = (app.queue = await getQueue(jobs))
  let [worker, scheduler] = await Promise.all([getWorker(jobs), getScheduler()])

  cron({ queue, scheduler, jobs })

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
