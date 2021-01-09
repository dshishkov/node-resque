import { Plugins } from 'node-resque'

export default {
  plugins: [Plugins.QueueLock, Plugins.Retry],
  pluginOptions: {
    Retry: {
      retryLimit: 3,
      backoffStrategy: [1000, 1000 * 5, 1000 * 10],
    },
  },
  async perform() {
    console.info('badJob', new Date())
    throw new Error('I am bad')
  },
  cron: {
    schedule: '0/1 * * * * *',
  },
}
