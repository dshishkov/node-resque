import fetch from 'node-fetch'
import { Plugins } from 'node-resque'

export default app => ({
  plugins: [Plugins.QueueLock, Plugins.Retry],
  pluginOptions: {
    Retry: {
      retryLimit: 3,
      backoffStrategy: [1000, 1000 * 5, 1000 * 10],
    },
  },
  async perform() {
    let pingUrl = app.get('pingUrl')
    if (pingUrl) {
      console.info(await fetch(pingUrl).then(r => r.json()))
    }
  },
  cron: {
    schedule: '0/1 * * * *',
  },
})
