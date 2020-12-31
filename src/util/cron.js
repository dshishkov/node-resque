import F from 'futil'
import * as schedule from 'node-schedule'

export default ({ queue, scheduler, jobs }) => F.eachIndexed(({ cron }, job) => {
  if (cron) {
    schedule.scheduleJob(cron.schedule, async () => {
      if (scheduler.leader) {
        console.info(`cron job: ${job}`)
        await queue.enqueue(job, job)
      }
    })
  }
}, jobs)
