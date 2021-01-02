import { disallow } from 'feathers-hooks-common'

export let disableExternalWrite = {
  before: {
    create: [disallow('external')],
    update: [disallow('external')],
    patch: [disallow('external')],
    remove: [disallow('external')],
  },
}
