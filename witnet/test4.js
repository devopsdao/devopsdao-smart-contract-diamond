import * as Witnet from "witnet-requests"


const github = new Witnet.Script()
  .parseJSONArray()
  .getMap(0)
  .getMap("title2222")


  const aggregator = new Witnet.Aggregator({
    filters: [
     [Witnet.Types.FILTERS.deviationStandard, 1.5]
    ],
    reducer: Witnet.Types.REDUCERS.averageMean
  })
  
  // Filters out any value that is more than 1.5 times the standard
  // deviationaway from the average, then computes the average mean of the
  // values that pass the filter.
  const tally = new Witnet.Tally({
    filters: [
     [Witnet.Types.FILTERS.deviationStandard, 1.5]
    ],
    reducer: Witnet.Types.REDUCERS.averageMean
  })
  

  const request = new Witnet.Request()
  .addSource(github)        
  .setAggregator(aggregator)    // Set the aggregation script
  .setTally(tally)              // Set the tally script
//   .setQuorum(25)                // Set witnesses count
//   .setFees(1000000, 1000000)    // Set economic incentives (e.g. witness reward: 1 mWit, commit/reveal fee: 1 mWit)
//   .setCollateral(10000000000)   // Set


  // Do not forget to export the request object
export { github as default }