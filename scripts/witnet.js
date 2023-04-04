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

    // await witnetBytecodes.on("NewDataSourceHash", (NewDataSourceHash, event) => {
    //   console.log("received event");
    //   console.log(NewDataSourceHash);
    // });


    const dataSource = await witnetBytecodes.verifyDataSource(
      1, // requestMethod
      /* requestSchema */ "",
      /* requestAuthority */ "https://api.github.com", // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
      /* requestPath */ "repos/\\0\\/pulls8", // => will by substituted w/ tokenId on next mint
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
    

    let NewDataSourceHash;
    if(typeof dataSourceReceipt.events[0].args !=='undefined' && typeof dataSourceReceipt.events[0].args.hash !== 'undefined'){
      console.log(`NewDataSourceHash`)
      console.log(dataSourceReceipt.events[0].args.hash)
      NewDataSourceHash = dataSourceReceipt.events[0].args.hash;
    }

    else{
      NewDataSourceHash = await witnetBytecodes.callStatic.verifyDataSource(
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
    }
    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewDataSourceHash = NewDataSourceHash;
  }

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

    let NewRadonReducerHash;
    if(typeof radonReducerReceipt.events[0].args !=='undefined' && typeof radonReducerReceipt.events[0].args.hash !== 'undefined'){
      console.log(`NewRadonReducerHash`)
      console.log(radonReducerReceipt.events[0].args.hash)
      NewRadonReducerHash = radonReducerReceipt.events[0].args.hash;
    }

    else{
      NewRadonReducerHash = await witnetBytecodes.callStatic.verifyRadonReducer([
        11, // opcode: ConcatenateAndHash
        [], // filters
        "0x", // script
      ]
      , { gasLimit: 8000000 }
      );
    }
    requestHashes.hashes[this.__hardhatContext.environment.network.config.chainId].NewRadonReducerHash = NewRadonReducerHash;

  }

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

    let NewSlaHash;
    if(typeof radonSLAReceipt.events[0].args !=='undefined' && typeof radonSLAReceipt.events[0].args.hash !== 'undefined'){
      console.log(`NewSlaHash`)
      console.log(radonSLAReceipt.events[0].args.hash)
      NewSlaHash = radonSLAReceipt.events[0].args.hash;
    }

    else{
      NewSlaHash = await witnetBytecodes.callStatic.verifyRadonSLA([
        witnetSLA.numWitnesses,
        witnetSLA.minConsensusPercentage,
        witnetSLA.witnessReward,
        witnetSLA.witnessCollateral,
        witnetSLA.minerCommitFee,
      ]
      , { gasLimit: 8000000 }
      );
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
