import * as Witnet from "witnet-requests"

const bitstamp = new Witnet.Source("https://www.bitstamp.net/api/ticker/")
  .parseJSONMap()
  .getFloat("last")

const coindesk = new Witnet.Source("https://api.coindesk.com/v1/bpi/currentprice.json")
  .parseJSONMap()
  .getMap("bpi")
  .getMap("USD")
  .getFloat("rate_float")

const aggregator = new Witnet.Aggregator({
  filters: [
   [Witnet.Types.FILTERS.deviationStandard, 1.5]
  ],
  reducer: Witnet.Types.REDUCERS.averageMean
})

const tally = new Witnet.Tally({
  filters: [
   [Witnet.Types.FILTERS.deviationStandard, 1.5]
  ],
  reducer: Witnet.Types.REDUCERS.averageMean
})

const request = new Witnet.Request()
  .addSource(bitstamp)
  .addSource(coindesk)
  .setAggregator(aggregator)
  .setTally(tally)
  .setQuorum(25)
  .setFees(1000000, 1000000)
  .setCollateral(10000000000)

export { request as default }