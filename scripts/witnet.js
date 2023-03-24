


// const ecosystem = utils.getRealmNetworkFromArgs()[0]
// const network = network.split("-")[0]

const fs = require('fs/promises')
const path = require('node:path');



const ecosystem = "moonbeam"
const network = "moonbeam.moonbase"

// if (!addresses[ecosystem]) addresses[ecosystem] = {}
// if (!addresses[ecosystem][network]) addresses[ecosystem][network] = {}

const witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[ecosystem][network]
console.log(witnetAddresses)
let WitnetBytecodes = {}
let WitnetRequestBoard = {}
let WitnetRequestFactory = {}
WitnetBytecodes.address = witnetAddresses.WitnetBytecodes
WitnetRequestBoard.address = witnetAddresses.WitnetRequestBoard
WitnetRequestFactory.address = witnetAddresses.WitnetRequestFactory


let contractAddresses;

(async() => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if(typeof contractAddressesJson !== 'undefined'){
    contractAddresses = JSON.parse(contractAddressesJson);
  }
  else{
    console.log(`contract addresses file not found at ../abi/addresses.json`)
}
})()

// const diamondAddress

task(
  "witnetConfig",
  "configure Witnet facet")
  // .addParam("taskContract", "task contract")
  // .addParam("messageText", "message text")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    await configureWitnet()
    console.log(`updated witnet config`)

  }
);

async function configureWitnet () {

const witnetBytecodes = await ethers.getContractAt('IWitnetBytecodes', WitnetBytecodes.address)
// const witnetV2 = await ethers.getContractAt('WitnetV2', diamondAddress)


// const WitnetBytecodes = artifacts.require("WitnetBytecodes")
// const WitnetV2 = artifacts.require("WitnetV2")



    console.log(`verifying datasource`);
    // WitnetV2.DataRequestMethods
    // /* 0 */ Unknown,
    // /* 1 */ HttpGet,
    // /* 2 */ Rng,
    // /* 3 */ HttpPost
    const dataSource = await witnetBytecodes.verifyDataSource(
    1, // requestMethod 
    /* requestSchema */    "",
    /* requestAuthority */ "https://api.github.com",         // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
    /* requestPath */      "repos/\\0\\/pulls",   // => will by substituted w/ tokenId on next mint
    /* requestQuery */     "state=all",
    /* requestBody */      "",
    [], // requestHeaders
    "0x8218771869", // requestRadonScript
    )

    console.log(dataSource)

    console.log(`verifying radon reducer`);
    const radonReducer = await witnetBytecodes.verifyRadonReducer([
        11, // opcode: ConcatenateAndHash
        [], // filters
        "0x", // script
      ])

      console.log(radonReducer)


      const witnetSLA = {
        numWitnesses: 17,
        minConsensusPercentage: 66,  // %
        minerCommitFee: "100000000", // 0.1 WIT
        witnessReward: "1000000000", // 1.0 WIT
        witnessCollateral: "15000000000", // 15.0 WIT
      };

      console.log(witnetSLA)


      console.log(`verifying radon SLA`);
      const radonSLA = await witnetBytecodes.verifyRadonSLA([
        witnetSLA.numWitnesses,
        witnetSLA.minConsensusPercentage,
        witnetSLA.witnessReward,
        witnetSLA.witnessCollateral,
        witnetSLA.minerCommitFee
      ]);

      console.log(radonSLA)

      const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
      console.log(`using Diamond: ${diamondAddress}`)

      let witnetFacet = await ethers.getContractAt('WitnetFacet', diamondAddress)


      const requestTemplate = await witnetFacet.buildRequestTemplate(WitnetRequestBoard, WitnetRequestFactory, dataSource, radonReducer)
      console.log(requestTemplate)

    //   const radonRequest = await witnetBytecodes.verifyRadonRequest(
    //     [ // source
    //       binanceTickerHash,
    //     ],
    //     stdev15ReducerHash, // aggregator
    //     stdev25ReducerHash, // tally
    //     0, // resultMaxVariableSize,
    //     [
    //       ["BTC", "USD"], // binance ticker args
    //     ],
    //   )

// httpGetImageDigest = registry.verifyDataSource(
//     /* requestMethod */    WitnetV2.DataRequestMethods.HttpGet,
//     /* requestSchema */    "",
//     /* requestAuthority */ "\\0\\",         // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
//     /* requestPath */      "image/\\1\\",   // => will by substituted w/ tokenId on next mint
//     /* requestQuery */     "digest=sha-256",
//     /* requestBody */      "",
//     /* requestHeader */    new string[2][](0),
//     /* requestScript */    hex"80"
//                            // <= WitnetScript([ Witnet.TYPES.STRING ])
// );
// httpGetValuesArray = registry.verifyDataSource(
//     /* requestMethod    */ WitnetV2.DataRequestMethods.HttpGet,
//     /* requestSchema    */ "",
//     /* requestAuthority */ "\\0\\",         // => will be substituted w/ WittyPixelsLib.baseURI() on every new mint
//     /* requestPath      */ "stats/\\1\\",   // => will by substituted w/ tokenId on next mint
//     /* requestQuery     */ "",
//     /* requestBody      */ "",
//     /* requestHeader    */ new string[2][](0),
//     /* requestScript    */ hex"8218771869"
//                            // <= WitnetScript([ Witnet.TYPES.STRING ]).parseJSONMap().valuesAsArray()
// );
// reducerModeNoFilters = registry.verifyRadonReducer(
//     WitnetV2.RadonReducer({
//         opcode: WitnetV2.RadonReducerOpcodes.Mode,
//         filters: new WitnetV2.RadonFilter[](0),
//         script: hex""
//     })
// );

    }