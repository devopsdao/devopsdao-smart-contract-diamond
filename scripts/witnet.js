const fs = require("fs/promises");
const path = require("node:path");
const { methods } = require("underscore");

const _ = require("lodash");

const web3 = require("web3");

const Witnet = require("witnet-requests");

// const ecosystem = "moonbeam";
// const network = "moonbeam.moonbase";

// const ecosystem = "polygon";
// const network = "polygon.goerli";

// const witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[ecosystem][network];

// console.log(witnetAddresses)

let ecosystem;
let network;
let witnetAddresses;
let requestHashes;

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

task("witnetQuery", "query Witnet facet")
  // .addParam("taskContract", "task contract")
  // .addParam("messageText", "message text")
  .setAction(async function (taskArguments, hre, runSuper) {
    await queryWitnet();
    console.log(`query complete`);
  });

task("witnetRead", "read Witnet facet")
  // .addParam("taskContract", "task contract")
  // .addParam("messageText", "message text")
  .setAction(async function (taskArguments, hre, runSuper) {
    await readWitnet();
    console.log(`query complete`);
  });

async function loadConfig() {
  if (hre.network.config.witnet) {
    if (hre.network.config.chainId === 31337) {
      ecosystem = "hardhat";
      network = "hardhat.localhost";
    } else if (hre.network.config.chainId === 1287) {
      ecosystem = "moonbeam";
      network = "moonbeam.moonbase";
    } else if (hre.network.config.chainId === 4002) {
      ecosystem = "fantom";
      network = "fantom.goerli";
    } else if (hre.network.config.chainId === 80001) {
      ecosystem = "polygon";
      network = "polygon.goerli";
    } else if (hre.network.config.chainId === 280) {
      ecosystem = "zksync";
      network = "zksync.goerli";
    }

    witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[ecosystem][network];
    // requestHashes = require(`../abi/witnet-requesthashes.json`)["hashes"][hre.network.config.chainId];
  }
}

async function queryWitnet() {
  await loadConfig();

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

  console.log("querying");
  if (typeof requestHashes.hashes[hre.network.config.chainId] == "undefined") {
    requestHashes.hashes[hre.network.config.chainId] = {};
  }

  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]["Diamond"];
  console.log(`using Diamond: ${diamondAddress}`);

  let WitnetRequestTemplate = await ethers.getContractAt(
    "WitnetRequestTemplate",
    requestHashes.hashes[hre.network.config.chainId].WitnetRequestTemplate
  );

  // const args = ["devopsdao/devopsdao-smart-contract-diamond", "Merge pull request #11 from devopsdao/release"];
  const args = ["devopsdao/devopsdao-smart-contract-diamond", "preparing witnet release"];

  // console.log(WitnetRequestTemplate)

  let witnetRequestTemplate = await WitnetRequestTemplate.verifyRadonRequest([args]);
  const witnetRequestTemplateReceipt = await witnetRequestTemplate.wait();

  console.log(witnetRequestTemplateReceipt);

  const witnetBytecodes = await ethers.getContractAt("IWitnetBytecodes", witnetAddresses.WitnetBytecodes);
  const witnetBytecodesEvents = await ethers.getContractAt("IWitnetBytecodesEvents", witnetAddresses.WitnetBytecodes);

  let eventFilter = witnetBytecodesEvents.filters.NewRadHash();
  let WitnetRequestEvents = await witnetBytecodes.queryFilter(
    eventFilter,
    witnetRequestTemplateReceipt.blockNumber,
    witnetRequestTemplateReceipt.blockNumber
  ); //not working if I specify blocks

  let NewRadonRequestHash;
  if (
    typeof WitnetRequestEvents !== "undefined" &&
    WitnetRequestEvents.length > 0 &&
    typeof WitnetRequestEvents[0].args !== "undefined" &&
    typeof WitnetRequestEvents[0].args.hash !== "undefined"
  ) {
    NewRadonRequestHash = WitnetRequestEvents[0].args.hash;
    console.log(NewRadonRequestHash);
  }

  NewRadonRequestHash = await WitnetRequestTemplate.callStatic.verifyRadonRequest([args]);

  // console.log(witnetRequestTemplate)

  let witnetFacet = await ethers.getContractAt("WitnetFacet", diamondAddress);

  // let witnetRequest = await witnetFacet.postRequest(0, args, options);

  console.log("NewRadonRequestHash");
  console.log(NewRadonRequestHash);

  console.log("updateRadonSLA");
  console.log(requestHashes.hashes[hre.network.config.chainId].NewSlaHash);

  let witnetUpdateSLA = await witnetFacet.updateRadonSLA(requestHashes.hashes[hre.network.config.chainId].NewSlaHash);

  console.log(witnetUpdateSLA);

  feeData = await ethers.provider.getFeeData();

  const options = { type: 2, gasPrice: feeData.gasPrice, value: ethers.utils.parseEther("0.01") };

  let witnetPostRequest = await witnetFacet["postRequest(uint256,bytes32)"](22, NewRadonRequestHash, options);

  // let witnetPostRequest = await witnetFacet['postRequest(uint256,bytes32)'](15, args, options);

  const witnetPostRequestReceipt = await witnetPostRequest.wait();

  let witnetRequestEventFilter = witnetFacet.filters.NewRadonRequestHash();
  let witnetPostRequestEvents = await witnetFacet.queryFilter(
    witnetRequestEventFilter,
    witnetPostRequestReceipt.blockNumber,
    witnetPostRequestReceipt.blockNumber
  ); //not working if I specify blocks

  let NewRadonRequestHash2;
  if (
    typeof witnetPostRequestEvents !== "undefined" &&
    witnetPostRequestEvents.length > 0 &&
    typeof witnetPostRequestEvents[0].args !== "undefined" &&
    typeof witnetPostRequestEvents[0].args.hash !== "undefined"
  ) {
    NewRadonRequestHash2 = witnetPostRequestEvents[0].args.hash;
    console.log(NewRadonRequestHash2);
  }

  console.log(NewRadonRequestHash2);

  if (
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash == "undefined"
  ) {
    console.log(`querying datasource`);
  }
}

async function readWitnet() {
  await loadConfig();

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

  // let WitnetRequestTemplate = await ethers.getContractAt("WitnetRequestTemplate", requestHashes.hashes[hre.network.config.chainId].WitnetRequestTemplate);

  // const resultDataType = await WitnetRequestTemplate.callStatic.resultDataType();
  // console.log(resultDataType);

  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]["Diamond"];
  console.log(`using Diamond: ${diamondAddress}`);

  let witnetFacet = await ethers.getContractAt("WitnetFacet", diamondAddress);

  let resultAvailability = await witnetFacet.callStatic.checkResultAvailability(20);

  console.log(resultAvailability);

  let witnetRead = await witnetFacet.callStatic.getLastResult(20);

  console.log(witnetRead);

  // let witnetFetch = await witnetFacet.callStatic.fetchResult(witnetAddresses.WitnetRequestBoard, 15);

  // console.log(witnetFetch);
}

async function configureWitnet() {
  await loadConfig();

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
  if (typeof requestHashes.hashes[hre.network.config.chainId] == "undefined") {
    requestHashes.hashes[hre.network.config.chainId] = {};
  }

  console.log(witnetAddresses);

  const witnetBytecodes = await ethers.getContractAt("IWitnetBytecodes", witnetAddresses.WitnetBytecodes);
  const witnetBytecodesEvents = await ethers.getContractAt("IWitnetBytecodesEvents", witnetAddresses.WitnetBytecodes);
  // const witnetV2 = await ethers.getContractAt('WitnetV2', diamondAddress)

  // WitnetV2.DataRequestMethods
  // /* 0 */ Unknown, const bytecode = Witnet.Script([ Witnet.TYPES.STRING ])
  // /* 1 */ HttpGet,
  // /* 2 */ Rng,
  // /* 3 */ HttpPost
  console.log(requestHashes);

  console.log("compiling witnet script");

  const bytecode = Witnet.Script([Witnet.TYPES.STRING])
    .parseJSONArray()
    .filter(
      new Witnet.Script([Witnet.TYPES.MAP])
        // from all elements in the array,
        // select the ones which "title" field
        // match wildcard #1
        .getString("title")
        .match({ "\\1\\": true }, false)
    )
    .filter(
      // from all elements in the array,
      // select the ones which "merged_at" field
      // string length is greater than zero
      new Witnet.Script([Witnet.TYPES.MAP]).getString("merged_at").length().greaterThan(0)
    )
    .getMap(0)
    .getString("state");

  let requestRadonScript = "0x" + bytecode.encode().toString("hex");

  console.log("request radon script:");
  console.log(requestRadonScript);

  if (
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash == "undefined"
  ) {
    console.log(`verifying datasource`);

    // await witnetBytecodes.on("NewRadonRetrievalHash", (NewRadonRetrievalHash, event) => {
    //   console.log("received event");
    //   console.log(NewRadonRetrievalHash);
    // });

    const requestMethod = 1;
    const requestSchema = "";
    const requestAuthority = "https://api.github.com";
    const requestPath = "repos/\\0\\/pulls";
    const requestQuery = "state=all";
    const requestBody = "";
    const requestHeaders = [];
    // const requestRadonScript = "0x8218771869";
    // const requestRadonScript =
    //   "0x851876821182821867657469746c65831875a1635c315cf5f4821183821867696d65726765645f617418748218430082181800821867657374617465";

    let radonRetrievalHash = await witnetBytecodes.callStatic.verifyRadonRetrieval(
      requestMethod,
      requestSchema,
      requestAuthority,
      requestPath,
      requestQuery,
      requestBody,
      requestHeaders,
      requestRadonScript,
      { type: 2 }
    );

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
    try {
      dataSourceLookup = await witnetBytecodes.callStatic.lookupRadonRetrieval(radonRetrievalHash);
      console.log(dataSourceLookup);
    } catch {
      console.log(`unknown datasource`);
    }
    let NewRadonRetrievalHash;
    if (
      typeof dataSourceLookup !== "undefined" &&
      dataSourceLookup.method === requestMethod &&
      dataSourceLookup.url == `${requestAuthority}/${requestPath}?${requestQuery}` &&
      dataSourceLookup.body === requestBody &&
      _.isEqual(dataSourceLookup.headers, requestHeaders) &&
      dataSourceLookup.script === requestRadonScript
    ) {
      NewRadonRetrievalHash = radonRetrievalHash;
    } else {
      const dataSource = await witnetBytecodes.verifyRadonRetrieval(
        requestMethod,
        requestSchema,
        requestAuthority,
        requestPath,
        requestQuery,
        requestBody,
        requestHeaders,
        requestRadonScript,
        { type: 2 }
      );
      const dataSourceReceipt = await dataSource.wait();
      // console.log(dataSourceReceipt)
      const eventFilter = witnetBytecodesEvents.filters.NewRadonRetrievalHash();
      const dataSourceEvents = await witnetBytecodes.queryFilter(
        eventFilter,
        dataSourceReceipt.blockNumber,
        dataSourceReceipt.blockNumber
      ); //not working if I specify blocks
      // console.log(`dataSourceEvents`)
      // console.log(dataSourceEvents)

      if (typeof dataSourceEvents[0].args !== "undefined" && typeof dataSourceEvents[0].args.hash !== "undefined") {
        console.log(`NewRadonRetrievalHash`);
        console.log(dataSourceEvents[0].args.hash);
        NewRadonRetrievalHash = dataSourceEvents[0].args.hash;
      } else {
        console.log("could not verify the datasource");
      }
    }

    requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash = NewRadonRetrievalHash;

    // /* requestAuthority */ "\\0\\",         // => will be substituted w/ WittyPixelsLib.baseURI() on next mint
    // /* requestPath */      "image/\\1\\",   // => will by substituted w/ tokenId on next mint
    // /* requestQuery */     "digest=sha-256",
    // /* requestBody */      "",
    // /* requestHeader */    new string[2][](0),
    // /* requestScript */    hex"80"

    //other ways to parse events
    // let eventFilter = witnetBytecodes.filters.NewRadonRetrievalHash()
    // let events = await witnetBytecodes.queryFilter(eventFilter) //not working if I specify blocks
    // console.log(events)

    // use start block and end block as receipt.blockNumber
    // const dataSourceEvent = await witnetBytecodes.queryFilter('NewRadonRetrievalHash(bytes32 hash)', dataSourceReceipt.blockNumber, dataSourceReceipt.blockNumber)

    // const typesArray = [
    //   {type: 'bytes32', name: 'hash'},
    // ];
    // const NewRadonRetrievalHash = ethers.utils.defaultAbiCoder.decode(typesArray, dataSourceReceipt.events[0].data);

    // let NewRadonRetrievalHash;
  }

  if (
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash == "undefined"
  ) {
    console.log(`verifying radon reducer`);

    let radonReducerHash;

    const opcode = 2; //Mode
    const filters = [];
    const reducerScript = "0x";

    radonReducerHash = await witnetBytecodes.callStatic.verifyRadonReducer([opcode, filters, reducerScript], {
      type: 2,
    });

    let radonReducerLookup;
    try {
      radonReducerLookup = await witnetBytecodes.lookupRadonReducer(radonReducerHash);
      console.log(radonReducerLookup);
    } catch {
      console.log(`unknown radon reducer`);
    }
    let NewRadonReducerHash;
    if (
      typeof radonReducerLookup !== "undefined" &&
      radonReducerLookup.opcode === opcode &&
      _.isEqual(radonReducerLookup.filters, filters) &&
      radonReducerLookup.script === reducerScript
    ) {
      NewRadonReducerHash = radonReducerHash;
    } else {
      const radonReducer = await witnetBytecodes.verifyRadonReducer(
        [
          opcode, // opcode: ConcatenateAndHash
          filters, // filters
          reducerScript, // script
        ],
        { gasLimit: 8000000 }
      );

      const radonReducerReceipt = await radonReducer.wait();

      const eventFilter = witnetBytecodesEvents.filters.NewRadonReducerHash();
      const radonReducerEvents = await witnetBytecodes.queryFilter(
        eventFilter,
        radonReducerReceipt.blockNumber,
        radonReducerReceipt.blockNumber
      ); //not working if I specify blocks
      console.log(`radonReducerEvents`);
      console.log(radonReducerEvents);

      if (typeof radonReducerEvents[0].args !== "undefined" && typeof radonReducerEvents[0].args.hash !== "undefined") {
        console.log(`NewRadonReducerHash`);
        console.log(radonReducerEvents[0].args.hash);
        NewRadonReducerHash = radonReducerEvents[0].args.hash;
      } else {
        console.log("could not verify the radon reducer");
      }
    }
    requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash = NewRadonReducerHash;
  }

  const witnetSLA = {
    numWitnesses: 5,
    minConsensusPercentage: 66, // %
    witnessReward: 1000000000, // 1.0 WIT
    witnessCollateral: 15000000000, // 15.0 WIT
    minerCommitRevealFee: 100000000, // 0.1 WIT
  };

  // console.log(witnetSLA)

  if (
    typeof requestHashes.hashes[hre.network.config.chainId] == "undefined" ||
    typeof requestHashes.hashes[hre.network.config.chainId].NewSlaHash == "undefined"
  ) {
    console.log(`verifying radon SLA`);

    slaHash = await witnetBytecodes.callStatic.verifyRadonSLA(
      [
        witnetSLA.numWitnesses,
        witnetSLA.minConsensusPercentage,
        witnetSLA.witnessReward,
        witnetSLA.witnessCollateral,
        witnetSLA.minerCommitRevealFee,
      ],
      { type: 2 }
    );

    let radonSLALookup;
    try {
      radonSLALookup = await witnetBytecodes.lookupRadonSLA(slaHash);
      console.log(radonSLALookup);
    } catch {
      console.log(`unknown radon SLA`);
    }

    let NewSlaHash;
    if (
      typeof radonSLALookup !== "undefined" &&
      radonSLALookup.numWitnesses.toNumber() === witnetSLA.numWitnesses &&
      radonSLALookup.minConsensusPercentage.toNumber() === witnetSLA.minConsensusPercentage &&
      radonSLALookup.witnessReward.toNumber() === witnetSLA.witnessReward &&
      radonSLALookup.witnessCollateral.toNumber() === witnetSLA.witnessCollateral &&
      radonSLALookup.minerCommitRevealFee.toNumber() === witnetSLA.minerCommitRevealFee
    ) {
      NewSlaHash = slaHash;
    } else {
      const radonSLA = await witnetBytecodes.verifyRadonSLA(
        [
          witnetSLA.numWitnesses,
          witnetSLA.minConsensusPercentage,
          witnetSLA.witnessReward,
          witnetSLA.witnessCollateral,
          witnetSLA.minerCommitRevealFee,
        ],
        { gasLimit: 8000000 }
      );
      const radonSLAReceipt = await radonSLA.wait();

      const eventFilter = witnetBytecodesEvents.filters.NewSlaHash();
      const radonSLAEvents = await witnetBytecodes.queryFilter(
        eventFilter,
        radonSLAReceipt.blockNumber,
        radonSLAReceipt.blockNumber
      ); //not working if I specify blocks
      console.log(`radonSLAEvents`);
      console.log(radonSLAEvents);

      if (typeof radonSLAEvents[0].args !== "undefined" && typeof radonSLAEvents[0].args.hash !== "undefined") {
        console.log(`NewSlaHash`);
        console.log(radonSLAEvents[0].args.hash);
        NewSlaHash = radonSLAEvents[0].args.hash;
      } else {
        console.log("could not verify the radon SLA");
      }
    }

    requestHashes.hashes[hre.network.config.chainId].NewSlaHash = NewSlaHash;
  }

  console.log(requestHashes);

  let IWitnetRequestFactory = await ethers.getContractAt("IWitnetRequestFactory", witnetAddresses.WitnetRequestFactory);

  let requestTemplateLookup;
  try {
    requestTemplateLookup = await IWitnetRequestFactory.callStatic.buildRequestTemplate(
      /* retrieval templates */ [requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash],
      /* aggregation reducer */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* witnessing reducer  */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* (reserved) */ 0
    );
    // console.log(`found existing request template`)
  } catch {
    console.log(`error looking up request template`);
  }

  let requestTemplateAddress;
  const code = await hre.ethers.provider.getCode(requestTemplateLookup);
  if (typeof requestTemplateLookup !== "undefined" && code !== "0x") {
    console.log(`found existing request template`);
    console.log(requestTemplateLookup);
    requestTemplateAddress = requestTemplateLookup;
  } else {
    console.log(`building request template`);
    const requestTemplate = await IWitnetRequestFactory.buildRequestTemplate(
      /* retrieval templates */ [requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash],
      /* aggregation reducer */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* witnessing reducer  */ requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash,
      /* (reserved) */ 0
    );

    const requestTemplateReceipt = await requestTemplate.wait();

    // console.log(`RequestTemplate`)
    // console.log(requestTemplateReceipt.events);
    // console.log(requestTemplateReceipt.events[0].args)

    let eventFilter = IWitnetRequestFactory.filters.WitnetRequestTemplateBuilt();
    let WitnetRequestTemplateBuiltEvents = await IWitnetRequestFactory.queryFilter(
      eventFilter,
      requestTemplateReceipt.blockNumber,
      requestTemplateReceipt.blockNumber
    ); //not working if I specify blocks

    if (
      typeof WitnetRequestTemplateBuiltEvents !== "undefined" &&
      typeof WitnetRequestTemplateBuiltEvents[0].args !== "undefined" &&
      typeof WitnetRequestTemplateBuiltEvents[0].args.template !== "undefined"
    ) {
      requestTemplateAddress = WitnetRequestTemplateBuiltEvents[0].args.template;
      console.log(requestTemplateAddress);
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
  // console.log(requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash)
  // console.log(requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash)

  // const requestTemplate = await witnetFacet.buildRequestTemplate(
  //   requestHashes.hashes[hre.network.config.chainId].NewRadonRetrievalHash,
  //   requestHashes.hashes[hre.network.config.chainId].NewRadonReducerHash
  // );
  // console.log(requestTemplate)
}
