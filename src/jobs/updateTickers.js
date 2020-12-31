import _ from 'lodash/fp'
import config from 'config'
import bluebird from 'bluebird'
import { Plugins } from 'node-resque'
import Alpaca from '@alpacahq/alpaca-trade-api'
import { getMongoCollection } from '../util/mongo'

let alpaca = new Alpaca(config.get('alpaca'))

export let getTickerData = async () => {
  let symbols = config.get('symbols')
  let postCollection = await getMongoCollection('post')
  let postSymbols = await postCollection
    .aggregate([
      {
        $unwind: '$tickers',
      },
      {
        $group: {
          _id: '$tickers',
          postCount: { $sum: 1 },
        },
      },
    ])
    .toArray()
  let postSymbolsMap = _.keyBy('_id', postSymbols)

  let invalidSymbolCollection = await getMongoCollection('invalidSymbol')
  let invalidSymbols = _.map(
    'symbol',
    await invalidSymbolCollection.find().toArray(),
  )

  invalidSymbols = [...invalidSymbols, ...config.get('blacklistedSymbols')]

  symbols = _.uniq([...symbols, ..._.map('_id', postSymbols)])
  symbols = _.difference(symbols, invalidSymbols)

  let tickerResults = await bluebird.map(symbols, x => alpaca.getLastTrade(x), {
    concurrency: 5,
  })

  invalidSymbols = _.flow(
    _.reject({ status: 'success' }),
    _.map('symbol'),
  )(tickerResults)

  if (!_.isEmpty(invalidSymbols)) {
    await invalidSymbolCollection.bulkWrite(
      _.map(
        symbol => ({
          replaceOne: {
            filter: { symbol },
            replacement: { symbol },
            upsert: true,
          },
        }),
        invalidSymbols,
      ),
    )
  }

  let tickers = _.flow(
    _.filter({ status: 'success' }),
    _.map(({ symbol, last }) => ({
      ...last,
      symbol,
      ...(last.timestamp && { updatedAt: new Date() }),
      postCount: postSymbolsMap[symbol] ? postSymbolsMap[symbol].postCount : 0,
    })),
  )(tickerResults)

  let tickerCollection = await getMongoCollection('ticker')
  await tickerCollection.bulkWrite(
    _.map(
      x => ({
        replaceOne: {
          filter: { symbol: x.symbol },
          replacement: x,
          upsert: true,
        },
      }),
      tickers,
    ),
  )
}

export default {
  plugins: [Plugins.QueueLock],
  async perform() {
    console.info('updateTickers', new Date())
    await getTickerData()
    return true
  },
  cron: {
    schedule: '0/30 * * * * *',
  },
}
