const fs = require("fs/promises");
const path = require("node:path");

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

    const dataSourceReceipt = await dataSource.wait();
    console.log(dataSourceReceipt.events[0])
    }
}
