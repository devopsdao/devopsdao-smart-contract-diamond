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
  if(typeof requestHashes.hashes[hre.network.config.chainId] == "undefined"){
    requestHashes.hashes[hre.network.config.chainId] = {};
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
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash ==
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
    const requestPath = "repos/\\0\\/pulls1111111111111111111";
    const requestQuery = "state=all";
    const requestBody = "";
    const requestHeaders = [];
    const requestRadonScript = "0x8218771869";

    let dataSourceHash = await witnetBytecodes.callStatic.verifyRadonRetrieval(
        requestMethod,
        requestSchema,
        requestAuthority,
        requestPath,
        requestQuery,
        requestBody,
        requestHeaders,
        requestRadonScript
        , { type: 2 }
      )

      // await expect(
      //   witnetBytecodes.callStatic.verifyDataSource(
      //     requestMethod,
      //     requestSchema,
      //     requestAuthority,
      //     requestPath,
      //     requestQuery,
      //     requestBody,
      //     requestHeaders,
      //     requestRadonScript
      //     , { type: 2 }
      //   )
      // ).to.be.reverted;

    let dataSourceLookup;
    try{
      dataSourceLookup = await witnetBytecodes.callStatic.lookupRadonRetrieval(dataSourceHash);
      console.log(dataSourceLookup)
    }
    catch{
      console.log(`unknown datasource`)
    }
    let NewDataSourceHash;
    if(typeof dataSourceLookup !== 'undefined' && dataSourceLookup.method === requestMethod && dataSourceLookup.url == `${requestAuthority}/${requestPath}?${requestQuery}`
    && dataSourceLookup.body === requestBody && _.isEqual(dataSourceLookup.headers,requestHeaders)
    && dataSourceLookup.script === requestRadonScript){
      NewDataSourceHash = dataSourceHash;
    }
    else{
      const dataSource = await witnetBytecodes.verifyRadonRetrieval(
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
      console.log(dataSourceReceipt)
      const eventFilter = witnetBytecodes.filters.NewRadonRetrievalHash()
      const dataSourceEvents = await witnetBytecodes.queryFilter(eventFilter, dataSourceReceipt.blockNumber, dataSourceReceipt.blockNumber) //not working if I specify blocks
      console.log(`dataSourceEvents`)
      console.log(dataSourceEvents)

      if(typeof dataSourceEvents[0].args !=='undefined' && typeof dataSourceEvents[0].args.hash !== 'undefined'){
        console.log(`NewDataSourceHash`)
        console.log(dataSourceEvents[0].args.hash)
        NewDataSourceHash = dataSourceEvents[0].args.hash;
      }
      else{
        console.log('could not verify the datasource');
      }

    }

    requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash = NewDataSourceHash;



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
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash ==
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


    let radonReducerLookup;
    try{
      radonReducerLookup = await witnetBytecodes.lookupRadonReducer(radonReducerHash);
      console.log(radonReducerLookup)
    }
    catch{
      console.log(`unknown radon reducer`)
    }
    let NewRadonReducerHash;
    if(typeof radonReducerLookup !== 'undefined' && radonReducerLookup.opcode === opcode && _.isEqual(radonReducerLookup.filters, filters)
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

      const eventFilter = witnetBytecodes.filters.NewRadonReducerHash()
      const radonReducerEvents = await witnetBytecodes.queryFilter(eventFilter, radonReducerReceipt.blockNumber, radonReducerReceipt.blockNumber) //not working if I specify blocks
      console.log(`radonReducerEvents`)
      console.log(radonReducerEvents)

      if(typeof radonReducerEvents[0].args !=='undefined' && typeof radonReducerEvents[0].args.hash !== 'undefined'){
        console.log(`NewRadonReducerHash`)
        console.log(radonReducerEvents[0].args.hash)
        NewRadonReducerHash = radonReducerEvents[0].args.hash;
      }

      else{
        console.log('could not verify the radon reducer');
      }
    }
    requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash = NewRadonReducerHash;
  }

  const witnetSLA = {
    numWitnesses: 9,
    minConsensusPercentage: 66, // %
    minerCommitRevealFee: 100000000, // 0.1 WIT
    witnessReward: 1000000000, // 1.0 WIT
    witnessCollateral: 15000000000, // 15.0 WIT
  };

  // console.log(witnetSLA)

  if (
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewSlaHash ==
      "undefined"
  ) {
    console.log(`verifying radon SLA`);


    slaHash = await witnetBytecodes.callStatic.verifyRadonSLA([
      witnetSLA.numWitnesses,
      witnetSLA.minConsensusPercentage,
      witnetSLA.witnessReward,
      witnetSLA.witnessCollateral,
      witnetSLA.minerCommitRevealFee,
    ]
    , { type: 2 }
    );

    let radonSLALookup;
    try{
      radonSLALookup = await witnetBytecodes.lookupRadonSLA(slaHash);
      console.log(radonSLALookup)
    }
    catch{
      console.log(`unknown radon SLA`)
    }

    let NewSlaHash;
    if(typeof radonSLALookup !== 'undefined' && radonSLALookup.numWitnesses.toNumber() === witnetSLA.numWitnesses 
      && radonSLALookup.minConsensusPercentage.toNumber() === witnetSLA.minConsensusPercentage
      && radonSLALookup.witnessReward.toNumber() === witnetSLA.witnessReward 
      && radonSLALookup.witnessCollateral.toNumber() === witnetSLA.witnessCollateral
      && radonSLALookup.minerCommitRevealFee.toNumber() === witnetSLA.minerCommitRevealFee){
        NewSlaHash = slaHash;
    }
    else{
      const radonSLA = await witnetBytecodes.verifyRadonSLA([
        witnetSLA.numWitnesses,
        witnetSLA.minConsensusPercentage,
        witnetSLA.witnessReward,
        witnetSLA.witnessCollateral,
        witnetSLA.minerCommitRevealFee,
      ]
      , { gasLimit: 8000000 }
      );  
      const radonSLAReceipt = await radonSLA.wait();

      const eventFilter = witnetBytecodes.filters.NewSlaHash()
      const radonSLAEvents = await witnetBytecodes.queryFilter(eventFilter, radonSLAReceipt.blockNumber, radonSLAReceipt.blockNumber) //not working if I specify blocks
      console.log(`radonSLAEvents`)
      console.log(radonSLAEvents)

      if(typeof radonSLAEvents[0].args !=='undefined' && typeof radonSLAEvents[0].args.hash !== 'undefined'){
        console.log(`NewSlaHash`)
        console.log(radonSLAEvents[0].args.hash)
        NewSlaHash = radonSLAEvents[0].args.hash;
      }
  
      else{
        console.log('could not verify the radon SLA');
  
      }
    }

    requestHashes.hashes[hre.network.config.chainId].NewSlaHash = NewSlaHash;

  }

  console.log(requestHashes)




  let IWitnetRequestFactory = await ethers.getContractAt("IWitnetRequestFactory", witnetAddresses.WitnetRequestFactory);


  let requestTemplateLookup;
  try{
    requestTemplateLookup = await IWitnetRequestFactory.callStatic.buildRequestTemplate(
      /* retrieval templates */ [requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash],
      /* aggregation reducer */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* witnessing reducer  */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* (reserved) */ 0
    );
    console.log(`found existing request template`)
    console.log(requestTemplateLookup)
  }
  catch{
    console.log(`unknown datasource`)
  }

  let requestTemplateAddress;
  if(typeof requestTemplateLookup !== 'undefined'){
    requestTemplateAddress = requestTemplateLookup;
  }
  else{
    const requestTemplate = await IWitnetRequestFactory.buildRequestTemplate(
      /* retrieval templates */ [requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash],
      /* aggregation reducer */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* witnessing reducer  */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* (reserved) */ 0
    );
  
    const requestTemplateReceipt = await requestTemplate.wait();
  
    console.log(`RequestTemplate`)
    // console.log(requestTemplateReceipt.events);
    // console.log(requestTemplateReceipt.events[0].args)
  
    let eventFilter = IWitnetRequestFactory.filters.WitnetRequestTemplateBuilt()
    let WitnetRequestTemplateBuiltEvents = await IWitnetRequestFactory.queryFilter(eventFilter, requestTemplateReceipt.blockNumber, requestTemplateReceipt.blockNumber) //not working if I specify blocks
    
    if(typeof WitnetRequestTemplateBuiltEvents !== 'undefined' && typeof WitnetRequestTemplateBuiltEvents[0].args.template !== 'undefined'){
      requestTemplateAddress = WitnetRequestTemplateBuiltEvents[0].args.template;
      console.log(requestTemplateAddress)
    }
  }
  requestHashes.hashes[hre.network.config.chainId].WitnetRequestTemplate = requestTemplateAddress;


  await fs.writeFile(path.join(__dirname, `../abi/witnet-requesthashes.json`), JSON.stringify(requestHashes));


  
  // console.log(requestTemplateReceipt)

  // const diamondAddress =
  //   contractAddresses.contracts[hre.network.config.chainId]["Diamond"];
  // console.log(`using Diamond: ${diamondAddress}`);

  // let witnetFacet = await ethers.getContractAt("WitnetFacet", diamondAddress);

  // console.log("building witnet request template");
  // // console.log(witnetAddresses.WitnetRequestFactory)
  // console.log(requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash)
  // console.log(requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash)


  // const requestTemplate = await witnetFacet.buildRequestTemplate(
  //   requestHashes.hashes[hre.network.config.chainId].NewDataSourceHash,
  //   requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash
  // );
  // console.log(requestTemplate)
}
