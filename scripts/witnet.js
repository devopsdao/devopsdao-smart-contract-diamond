const fs = require("fs/promises");
const path = require("node:path");

const web3 = require("web3")

// const ecosystem = "moonbeam";
// const network = "moonbeam.moonbase";

const ecosystem = "polygon";
const network = "polygon.goerli";

const witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[ecosystem][network];

console.log(witnetAddresses)

let contractAddresses;

(async () => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if (typeof contractAddressesJson !== "undefined") {
    contractAddresses = JSON.parse(contractAddressesJson);
  } else {
    console.log(`contract addresses file not found at ../abi/addresses.json`);
  }
})();

task("witnetConfig", "configure Witnet facet")
  // .addParam("taskContract", "task contract")
  // .addParam("messageText", "message text")
  .setAction(async function (taskArguments, hre, runSuper) {
    await configureWitnet();
    console.log(`updated witnet config`);
  });

async function configureWitnet() {
  let requestHashes;
  try {
    const existingRequestHashes = await fs.readFile(path.join(__dirname, `../abi/witnet-requesthashes.json`));
    if (typeof existingRequestHashes !== "undefined") {
      requestHashes = JSON.parse(existingRequestHashes);
    }
  } catch (error) {
    requestHashes = {
      hashes: {},
    };
  }

  console.log("verifying");
  if(typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined"){
    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] = {};
  }

  const witnetBytecodes = await ethers.getContractAt("IWitnetBytecodes", witnetAddresses.WitnetBytecodes);
  // const witnetV2 = await ethers.getContractAt('WitnetV2', diamondAddress)

  // WitnetV2.DataRequestMethods
  // /* 0 */ Unknown,
  // /* 1 */ HttpGet,
  // /* 2 */ Rng,
  // /* 3 */ HttpPost
console.log(requestHashes)

  if (
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash ==
      "undefined"
  ) {
    console.log(`verifying datasource`);

    await witnetBytecodes.on("NewDataSourceHash", (NewDataSourceHash, event) => {
      console.log("received event");
      console.log(NewDataSourceHash, type);
    });



    // let eventFilter = witnetBytecodes.filters.NewDataSourceHash()
    // let events = await witnetBytecodes.queryFilter(eventFilter) //not working if I specify blocks
    // console.log(events)

    // web3.eth.subscribe("logs", logOptions ={}, (e, raw) => {
    //     const iface = new ethers.utils.Interface(witnetBytecodes);
    //     const parsed = iface.parseLog(raw);
    //     console.log(parsed)
    // });

    // const startBlockNumber = await provider.getBlockNumber();

    // contract.on(filter, (...args) => {
    //   const event = args[args.length - 1];
    //   if(event.blockNumber <= startBlockNumber) return; // do not react to this event
      
    //   // further logic
    // })

    const dataSource = await witnetBytecodes.verifyDataSource(
      1, // requestMethod
      /* requestSchema */ "",
      /* requestAuthority */ "https://api.github.com", // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
      /* requestPath */ "repos/\\0\\/pulls", // => will by substituted w/ tokenId on next mint
      /* requestQuery */ "state=all",
      /* requestBody */ "",
      [], // requestHeaders
      "0x8218771869" // requestRadonScript
      , { gasLimit: 8000000 }
    );


    // /* requestAuthority */ "\\0\\",         // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
    // /* requestPath */      "image/\\1\\",   // => will by substituted w/ tokenId on next mint
    // /* requestQuery */     "digest=sha-256",
    // /* requestBody */      "",
    // /* requestHeader */    new string[2][](0),
    // /* requestScript */    hex"80"

    const dataSourceReceipt = await dataSource.wait();
    console.log(dataSourceReceipt)

    const typesArray = [
      {type: 'bytes32', name: 'hash'}
    ];

    const newDataSourceHash = ethers.utils.defaultAbiCoder.decode(typesArray, dataSourceReceipt.events[0].data);
    
    // let iface = new ethers.utils.defaultAbiCoder;

    console.log(newDataSourceHash)


    // const parsedLogs = dataSourceReceipt.logs.map(log => {
    //   try {
    //     // only ABIs from witnetBytecodes contract are used to decode the logs
    //     return witnetBytecodes.interface.parseLog(log)
    //   } catch(e) {
    //     console.log(e)
    //     return null
    //   }
    // })
    // console.log(parsedLogs)
    
    // // or just find the log you are interested in
    // const log = dataSourceReceipt.logs[0]
    // witnetBytecodes.interface.parseLog(log)

    // const parsedLogs = dataSourceReceipt.logs.map(log => witnetBytecodes.interface.parseLog(log))

    // console.log(parsedLogs[0].args.prop)

    // let iface = new ethers.utils.Interface(abi);
    // let log = witnetBytecodes.interface.parseLog(dataSourceReceipt.logs[0]); //


    // let abi = [ "event NewDataSourceHash(bytes32 hash)" ];
    // let iface = new ethers.utils.Interface(abi);
    // let log = iface.parseLog(dataSourceReceipt.events[0]); // her
    

    // const topic = witnetBytecodes.interface.getEventTopic('NewDataSourceHash');
    // console.log(topic)

    // // const log = dataSourceReceipt.logs.find(x => x.topics.indexOf(topic) >= 0);

    // const logParsed = witnetBytecodes.interface.parseLog(dataSourceReceipt.logs[0]);
    // console.log(logParsed)

    // console.log('taskContracts:');
    // console.log(getTaskContracts)

    // let events = await witnetBytecodes.queryFilter('NewDataSourceHash', 0);
    // console.log(events)

    // const NewDataSourceHashEvent = dataSourceReceipt.events[0];
    // console.log(dataSourceReceipt)
    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash =
    newDataSourceHash[0];

    // console.log(NewDataSourceHashEvent.data);
  }

  // console.log(dataSource)
  if (
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash ==
      "undefined"
  ) {
    console.log(`verifying radon reducer`);
    const radonReducer = await witnetBytecodes.verifyRadonReducer([
      11, // opcode: ConcatenateAndHash
      [], // filters
      "0x", // script
    ]
    , { gasLimit: 8000000 }
    );

    const radonReducerReceipt = await radonReducer.wait();

    // const NewRadonReducerHashEvent = radonReducerReceipt.events[0];

    const typesArray = [
      {type: 'bytes32', name: 'hash'}
    ];

    const newRadonReducerHash = ethers.utils.defaultAbiCoder.decode(typesArray, radonReducerReceipt.events[0].data);


    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash = newRadonReducerHash[0];

    // console.log(NewRadonReducerHashEvent.data);
  }

  // console.log(radonReducer) // radon reducer hash
  // console.log(NewRadHash); // radon request hash

  const witnetSLA = {
    numWitnesses: 17,
    minConsensusPercentage: 66, // %
    minerCommitFee: "100000000", // 0.1 WIT
    witnessReward: "1000000000", // 1.0 WIT
    witnessCollateral: "15000000000", // 15.0 WIT
  };

  // console.log(witnetSLA)

  if (
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewSlaHash ==
      "undefined"
  ) {
    console.log(`verifying radon SLA`);
    const radonSLA = await witnetBytecodes.verifyRadonSLA([
      witnetSLA.numWitnesses,
      witnetSLA.minConsensusPercentage,
      witnetSLA.witnessReward,
      witnetSLA.witnessCollateral,
      witnetSLA.minerCommitFee,
    ]
    , { gasLimit: 8000000 }
    );

    const radonSLAReceipt = await radonSLA.wait();
    // const NewSlaHashEvent = radonSLAReceipt.events[0];

    const typesArray = [
      {type: 'bytes32', name: 'hash'}
    ];

    const newRadonReducerHash = ethers.utils.defaultAbiCoder.decode(typesArray, radonSLAReceipt.events[0].data);

    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewSlaHash =
    newRadonReducerHash[0];

    // console.log(NewSlaHashEvent.data);

    // console.log(NewSlaHash) //SLA hash

    // console.log(radonSLA)
  }

  console.log(requestHashes)

  await fs.writeFile(path.join(__dirname, `../abi/witnet-requesthashes.json`), JSON.stringify(requestHashes));
  // else{
  //   console.log("will use existing verified hashes")
  //   console.log(requestHashes);
  // }


  let IWitnetRequestFactory = await ethers.getContractAt("IWitnetRequestFactory", witnetAddresses.WitnetRequestFactory);

  // const witnetRequestFactory = new IWitnetRequestFactory(witnetAddresses.WitnetRequestFactory)

  console.log(`NewDataSourceHash`)
  console.log(requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash)

  console.log(`NewRadonReducerHash`)
  console.log(requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash)

  const valuesArrayRequestTemplate = await IWitnetRequestFactory.buildRequestTemplate(
    /* retrieval templates */ [requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash],
    /* aggregation reducer */ requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash,
    /* witnessing reducer  */ requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash,
    /* (reserved) */ 0
  );

  console.log(valuesArrayRequestTemplate)

  // const diamondAddress =
  //   contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]["Diamond"];
  // console.log(`using Diamond: ${diamondAddress}`);

  // let witnetFacet = await ethers.getContractAt("WitnetFacet", diamondAddress);

  // console.log("building witnet request template");
  // // console.log(witnetAddresses.WitnetRequestFactory)
  // console.log(requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash)
  // console.log(requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash)


  // const requestTemplate = await witnetFacet.buildRequestTemplate(
  //   requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash,
  //   requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash
  // );
  // console.log(requestTemplate)
}
