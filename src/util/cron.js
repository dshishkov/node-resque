import F from 'futil'
import jobScheduler from 'node-cron'

export default ({ queue, scheduler, jobs }) => F.eachIndexed(({ cron }, job) => {
  if (cron) {
    jobScheduler.schedule(cron.schedule, async () => {
      if (scheduler.leader) {
        console.info(`cron job: ${job}`)
        await queue.enqueue(job, job)
      }
    })
  }
}, jobs)
