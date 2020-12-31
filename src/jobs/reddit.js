import _ from 'lodash/fp'
import config from 'config'
import { Plugins } from 'node-resque'
import Snoowrap from 'snoowrap'
import { getMongoCollection } from '../util/mongo'

let r = new Snoowrap(config.get('reddit'))

export let getComments = async post => ({
  ...post,
  // comments: _.orderBy('ups', 'desc', await post.comments.fetchAll())
})

let tickerRegex = /[A-Z]{3,4}/gm

export let getPosts = async () => {
  let limit = 20
  let subreddit = await r.getSubreddit('SPACs')
  let topHourlyPosts = _.map(
    x => ({ ...x, type: 'topHour' }),
    await subreddit.getTop({ time: 'hour', limit }),
  )
  let topDailyPosts = _.map(
    x => ({ ...x, type: 'topDaily' }),
    await subreddit.getTop({ time: 'day', limit }),
  )
  let risingHourlyPosts = _.map(
    x => ({ ...x, type: 'topHourRising' }),
    await subreddit.getRising({ time: 'hour', limit }),
  )
  let hotHourlyPosts = _.map(
    x => ({ ...x, type: 'topHourHot' }),
    await subreddit.getHot({ time: 'hour', limit }),
  )
  let hotDailyPosts = _.map(
    x => ({ ...x, type: 'topHourHot' }),
    await subreddit.getHot({ time: 'day', limit }),
  )

  let posts = _.uniqBy('name', [
    ...topHourlyPosts,
    ...topDailyPosts,
    ...risingHourlyPosts,
    ...hotHourlyPosts,
    ...hotDailyPosts,
  ])

  let collection = await getMongoCollection('post')
  await collection.bulkWrite(
    _.map(post => {
      let titleTickers = post.title.match(tickerRegex)
      let textTickers = post.selftext.match(tickerRegex)

      return {
        replaceOne: {
          filter: { name: post.name },
          replacement: {
            name: post.name,
            title: post.title,
            text: post.selftext,
            ups: post.ups,
            url: post.url,
            type: post.type,
            tickers: _.uniq([
              ...(!_.isEmpty(textTickers) ? textTickers : []),
              ...(!_.isEmpty(titleTickers) ? titleTickers : []),
            ]),
          },
          upsert: true,
        },
      }
    }, await Promise.all(posts.map(getComments))),
  )
}

export default {
  plugins: [Plugins.QueueLock],
  async perform() {
    console.info('reddit', new Date())
    await getPosts()
    return true
  },
  cron: {
    schedule: '0/30 * * * * *',
  },
}
