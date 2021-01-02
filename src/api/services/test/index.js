export default async app => app.use('test', {
  async find() {
    return {
      test: true,
    }
  },
  async create(data) {
    return data
  },
})
