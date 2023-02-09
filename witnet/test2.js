import * as Witnet from "witnet-requests"

const binance = new Witnet.Source("https://api.binance.US/api/v3/trades?symbol=ETHUSD")
  .parseJSONMap()
  .getFloat("price")
  .multiply(10 ** 6)
  .round()

// const coinbase = new Witnet.Source("https://api.coinbase.com/v2/exchange-rates?currency=ETH")
//   .parseJSONMap()
//   .getMap("data")
//   .getMap("rates")
//   .getFloat("USD")
//   .multiply(10 ** 6)
//   .round()

//   const kraken = new Witnet.Source("https://api.kraken.com/0/public/Ticker?pair=ETHUSD")
//   .parseJSONMap()
//   .getMap("result")
//   .getMap("XETHZUSD")
//   .getArray("a")
//   .getFloat(0)
//   .multiply(10 ** 6)
//   .round()

  const aggregator = Witnet.Aggregator.deviationAndMean(1.5)

  const tally = Witnet.Tally.deviationAndMean(2.5)

  const query = new Witnet.Query()
  .addSource(binance)
//   .addSource(coinbase)
//   .addSource(kraken)
  .setAggregator(aggregator) // Set the aggregator function
  .setTally(tally) // Set the tally function
  // .setQuorum(10, 51) // Set witness count and minimum consensus percentage
  // .setFees(5 * 10 ** 9, 10 ** 9) // Witnessing nodes will be rewarded 5 $WIT each
  // .setCollateral(50 * 10 ** 9) // Require each witness node to stake 50 $WIT

// Do not forget to export the query object
export { query as default }
