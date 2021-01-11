import api from './api'
import allJobs from './jobs'

let init = async () => {
  let app = await api()
  await allJobs(app)
}

init().catch(e => {
  console.trace(e)
  process.exit(1)
})
