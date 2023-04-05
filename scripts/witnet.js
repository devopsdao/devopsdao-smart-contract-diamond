const fs = require("fs/promises");
const path = require("node:path");
const { methods } = require("underscore");

const _ = require("lodash");

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

    // await witnetBytecodes.on("NewDataSourceHash", (NewDataSourceHash, event) => {
    //   console.log("received event");
    //   console.log(NewDataSourceHash);
    // });

    const requestMethod = 1;
    const requestSchema = "";
    const requestAuthority = "https://api.github.com";
    const requestPath = "repos/\\0\\/pulls";
    const requestQuery = "state=all";
    const requestBody = "";
    const requestHeaders = [];
    const requestRadonScript = "0x8218771869";



    let NewDataSourceHash;
    let dataSourceHash = await witnetBytecodes.callStatic.verifyDataSource(
      requestMethod,
      requestSchema,
      requestAuthority,
      requestPath,
      requestQuery,
      requestBody,
      requestHeaders,
      requestRadonScript
      , { type: 2 }
    );


    const dataSourceLookup = await witnetBytecodes.callStatic.lookupDataSource(dataSourceHash);
    console.log(dataSourceLookup)
    if(dataSourceLookup.method === requestMethod && dataSourceLookup.url == `${requestAuthority}/${requestPath}?${requestQuery}`
    && dataSourceLookup.body === requestBody && _.isEqual(dataSourceLookup.headers,requestHeaders)
    && dataSourceLookup.script === requestRadonScript){
      NewDataSourceHash = dataSourceHash;
    }
    else{
      const dataSource = await witnetBytecodes.verifyDataSource(
        requestMethod,
        requestSchema,
        requestAuthority,
        requestPath,
        requestQuery,
        requestBody,
        requestHeaders,
        requestRadonScript
        , { type: 2 }
      );
      const dataSourceReceipt = await dataSource.wait();
      if(typeof dataSourceReceipt.events[0].args !=='undefined' && typeof dataSourceReceipt.events[0].args.hash !== 'undefined'){
        console.log(`NewDataSourceHash`)
        console.log(dataSourceReceipt.events[0].args.hash)
        NewDataSourceHash = dataSourceReceipt.events[0].args.hash;
      }
      else{
        console.log('could not verify the datasource');
      }

    }

    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash = NewDataSourceHash;



    // /* requestAuthority */ "\\0\\",         // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
    // /* requestPath */      "image/\\1\\",   // => will by substituted w/ tokenId on next mint
    // /* requestQuery */     "digest=sha-256",
    // /* requestBody */      "",
    // /* requestHeader */    new string[2][](0),
    // /* requestScript */    hex"80"


    //other ways to parse events
    // let eventFilter = witnetBytecodes.filters.NewDataSourceHash()
    // let events = await witnetBytecodes.queryFilter(eventFilter) //not working if I specify blocks
    // console.log(events)
    
    // use start block and end block as receipt.blockNumber
    // const dataSourceEvent = await witnetBytecodes.queryFilter('NewDataSourceHash(bytes32 hash)', dataSourceReceipt.blockNumber, dataSourceReceipt.blockNumber)


    
    // const typesArray = [
    //   {type: 'bytes32', name: 'hash'},
    // ];
    // const newDataSourceHash = ethers.utils.defaultAbiCoder.decode(typesArray, dataSourceReceipt.events[0].data);
    

    // let NewDataSourceHash;

  }

  if (
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash ==
      "undefined"
  ) {
    console.log(`verifying radon reducer`);

    let radonReducerHash;

    const opcode = 11; //ConcatenateAndHash
    const filters = [];
    const reducerScript = "0x";

    radonReducerHash = await witnetBytecodes.callStatic.verifyRadonReducer([
      opcode,
      filters,
      reducerScript,
    ]
    , { type: 2 }
    );

    const radonReducerLookup = await witnetBytecodes.lookupRadonReducer(radonReducerHash);
    console.log(radonReducerLookup)

    let NewRadonReducerHash;
    if(radonReducerLookup.opcode === opcode && _.isEqual(radonReducerLookup.filters, filters)
    && radonReducerLookup.script === reducerScript){
      NewRadonReducerHash = radonReducerHash;
    }
    else{

      const radonReducer = await witnetBytecodes.verifyRadonReducer([
        11, // opcode: ConcatenateAndHash
        [], // filters
        "0x", // script
      ]
      , { gasLimit: 8000000 }
      );

      const radonReducerReceipt = await radonReducer.wait();

      if(typeof radonReducerReceipt.events[0].args !=='undefined' && typeof radonReducerReceipt.events[0].args.hash !== 'undefined'){
        console.log(`NewRadonReducerHash`)
        console.log(radonReducerReceipt.events[0].args.hash)
        NewRadonReducerHash = radonReducerReceipt.events[0].args.hash;
      }

      else{
        console.log('could not verify the radon reducer');
      }
    }
    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash = NewRadonReducerHash;
  }

  const witnetSLA = {
    numWitnesses: 17,
    minConsensusPercentage: 66, // %
    minerCommitFee: 100000000, // 0.1 WIT
    witnessReward: 1000000000, // 1.0 WIT
    witnessCollateral: 15000000000, // 15.0 WIT
  };

  // console.log(witnetSLA)

  if (
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewSlaHash ==
      "undefined"
  ) {
    console.log(`verifying radon SLA`);


    slaHash = await witnetBytecodes.callStatic.verifyRadonSLA([
      witnetSLA.numWitnesses,
      witnetSLA.minConsensusPercentage,
      witnetSLA.witnessReward,
      witnetSLA.witnessCollateral,
      witnetSLA.minerCommitFee,
    ]
    , { type: 2 }
    );

    const radonSLALookup = await witnetBytecodes.lookupRadonSLA(slaHash);
    console.log(radonSLALookup)

    let NewSlaHash;
    if(radonSLALookup.numWitnesses.toNumber() === witnetSLA.numWitnesses 
      && radonSLALookup.minConsensusPercentage.toNumber() === witnetSLA.minConsensusPercentage
      && radonSLALookup.witnessReward.toNumber() === witnetSLA.witnessReward 
      && radonSLALookup.witnessCollateral.toNumber() === witnetSLA.witnessCollateral
      && radonSLALookup.minerCommitFee.toNumber() === witnetSLA.minerCommitFee){
        NewSlaHash = slaHash;
    }
    else{
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

      if(typeof radonSLAReceipt.events[0].args !=='undefined' && typeof radonSLAReceipt.events[0].args.hash !== 'undefined'){
        console.log(`NewSlaHash`)
        console.log(radonSLAReceipt.events[0].args.hash)
        NewSlaHash = radonSLAReceipt.events[0].args.hash;
      }
  
      else{
        console.log('could not verify the radon SLA');
  
      }
    }

    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewSlaHash = NewSlaHash;

  }

  console.log(requestHashes)

  await fs.writeFile(path.join(__dirname, `../abi/witnet-requesthashes.json`), JSON.stringify(requestHashes));



  let IWitnetRequestFactory = await ethers.getContractAt("IWitnetRequestFactory", witnetAddresses.WitnetRequestFactory);


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
