/* global ethers */
/* eslint prefer-const: "off" */
// const { ethers } = require("hardhat");
const fs = require("fs").promises;
const { arrayCompare } = require("arweave/node/lib/merkle.js");
// const { ethers } = require("hardhat");
const path = require("node:path");
var _ = require("underscore");

// import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// const { program } = require('commander');

// program
//   .name('devopsdao-contract-deploy')
//   .description('CLI to deploy devopsdao contract')
//   .version('0.0.1');

// program.command('deploy')
//   .description('Deploy smart contract to the chain')
//   .argument('<chain>', 'chain name')
//   .option('-d, --diamond', 'deploy diamond completely')
//   .option('-c, --facet-cut <facet>', 'upgrade facet')
//   .action((str, options) => {
//     // const limit = options.first ? 1 : undefined;
//     // console.log(str.split(options.separator, limit));
//     run();
//   });

// program.command('upgrade')
//   .description('Upgrade diamond facet')
//   .argument('<chain>', 'chain name')
//   .option('-c, --facet <facet>', 'upgrade facet')
//   .action((str, options) => {
//     // const limit = options.first ? 1 : undefined;
//     // console.log(str.split(options.separator, limit));
//     upgradeDiamond();
//   });

// program.parse();

// const args = program.commands
// const options = program.opts();

// const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

const libraries = [
  {
    name: "LibUtils",
  },
  {
    name: "LibAddress",
  },
  {
    name: "LibTasks",
  },
  {
    name: "LibTasksAudit",
  },
  {
    name: "LibChat",
  },
  {
    name: "LibWithdraw",
    libraries: ["LibUtils"],
  },
  {
    name: "LibTokens",
  },
  {
    name: "LibTokenData",
  },
  {
    name: "LibInterchain",
  },
  {
    name: "LibWitnetFacet",
  },
];

const diamondFacets = [
  {
    name: "DiamondCutFacet",
  },
  {
    name: "DiamondLoupeFacet",
  },
  {
    name: "OwnershipFacet",
  },
];

const witnetSLA = {
  numWitnesses: 9,
  minConsensusPercentage: 66, // %
  witnessReward: 1000000000, // 1.0 WIT
  witnessCollateral: 15000000000, // 15.0 WIT
  minerCommitRevealFee: 100000000, // 0.1 WIT
};

console.log(Object.values(witnetSLA));

const dodaoFacets = [
  {
    name: "TaskCreateFacet",
    libraries: ["LibTasks", "LibTasksAudit", "LibChat", "LibWithdraw"],
  },
  {
    name: "TaskDataFacet",
  },
  {
    name: "AccountFacet",
  },
  {
    name: "TokenFacet",
    libraries: ["LibTokens", "LibTokenData"],
  },
  {
    name: "TokenDataFacet",
    libraries: ["LibTokenData"],
  },
  {
    name: 'InterchainFacet',
    // libraries: ["LibInterchain", "LibTasks"],
  },
  {
    name: 'AxelarFacet',
  },
  {
    name: 'HyperlaneFacet',
  },
  {
    name: 'LayerzeroFacet',
  },
  {
    name: 'WormholeFacet',
  },
];

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");

let witnetAddresses;
let requestHashes;

async function configureWitnet(){
  console.log('loading witnet contract addresses')
  let ecosystem;
  let network


  if(hre.network.config.witnet){
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
    requestHashes = require(`../abi/witnet-requesthashes.json`)["hashes"][hre.network.config.chainId];
  
    // console.log(requestHashes)


    dodaoFacets.push(
      {
      name: "WitnetFacet",
      arguments: [witnetAddresses.WitnetRequestBoard, requestHashes.WitnetRequestTemplate, Object.values(witnetSLA)],
      libraries: [
        'LibUtils',
      ]
      }
    );
    console.log(dodaoFacets)
  }
}

let deployedContracts;

async function deployDiamond() {
  await configureWitnet();
  const accounts = await ethers.getSigners();
  // console.log(accounts);
  const contractOwner = accounts[0];
  console.log(`using wallet: ${contractOwner.address}`);

  
  try{
    const existingDeployedContracts = await fs.readFile(path.join(__dirname, `../abi/deployed-contracts.json`));
    deployedContracts = JSON.parse(existingDeployedContracts);
  }
  catch{
    console.log(`existing ../abi/deployed-contracts.json not found, will create new`);
    deployedContracts = {
      deployArgs: {},
    };
  }
  deployedContracts.deployArgs[hre.network.config.chainId] = {};

  // Deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded or deployed to initialize state variables
  // Read about how the diamondCut function works in the EIP2535 Diamonds standard
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  
  let feeData = await ethers.provider.getFeeData();
  
  // const diamondInit = await DiamondInit.deploy({ type: 2, gasPrice: feeData.gasPrice });
  const diamondInit = await DiamondInit.deploy({ type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  deployedContracts.deployArgs[hre.network.config.chainId]["DiamondInit"] = {};
  deployedContracts.deployArgs[hre.network.config.chainId]["DiamondInit"]['address'] = diamondInit.address;

  const libAddresses = await deployLibs(libraries);

  // Deploy facets and set the `facetCuts` variable
  console.log("");
  console.log("Deploying facets");

  const facets = diamondFacets.concat(dodaoFacets);

  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const { facetCuts, facetAddresses } = await deployFacets(facets, libAddresses);

  console.log("Facets deployed")

  // Creating a function call
  // This call gets executed during deployment and can also be executed in upgrades
  // It is `executed` with delegatecall on the DiamondInit address.
  let functionCall = diamondInit.interface.encodeFunctionData("init");

  // Setting arguments that will be used in the diamond constructor
  const diamondArgs = {
    owner: contractOwner.address,
    init: diamondInit.address,
    initCalldata: functionCall,
  };

  // console.log(diamondArgs)

  // console.log(facetCuts)

  // deploy Diamond
  feeData = await ethers.provider.getFeeData();

  const Diamond = await ethers.getContractFactory("Diamond");

  // console.log(facetCuts);
  
  // const diamond = await Diamond.deploy(facetCuts, diamondArgs, { type: 2, gasPrice: feeData.gasPrice });
  const diamond = await Diamond.deploy(facetCuts, diamondArgs, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });

  await diamond.deployed();
  console.log("");
  console.log("Diamond deployed:", diamond.address);

  let contractAddresses;
  try{
    const existingAddresses = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
    contractAddresses = JSON.parse(existingAddresses);
  }
  catch{
    console.log(`existing ../abi/addresses.json not found, will create new`);
    contractAddresses = {
      contracts: {},
    };
  }

  contractAddresses.contracts[hre.network.config.chainId] = {};
  contractAddresses.contracts[hre.network.config.chainId]["Diamond"] = diamond.address;

  await fs.writeFile(path.join(__dirname, `../abi/addresses.json`), JSON.stringify(contractAddresses, null, 2));

  await fs.writeFile(`${hre.config.abiExporter[0].path}/addresses.json`, JSON.stringify(contractAddresses, null, 2));


  deployedContracts.deployArgs[hre.network.config.chainId]["Diamond"] = {};
  deployedContracts.deployArgs[hre.network.config.chainId]["Diamond"]['address'] = diamond.address;
  deployedContracts.deployArgs[hre.network.config.chainId]["Diamond"]["deployArgs"] = [facetCuts, diamondArgs];


  // await hre.run("verify:verify", {
  //   address: diamond.address,
  //   constructorArguments: [facetCuts, diamondArgs],
  // });


  // for(const contractName of Object.keys(deployedContracts.deployArgs[hre.network.config.chainId])){
  //   console.log(`verifying contract ${contractName}`)
  //   const contractAddress = deployedContracts.deployArgs[hre.network.config.chainId][contractName]['address'];
  //   const deployArgs = deployedContracts.deployArgs[hre.network.config.chainId][contractName]['deployArgs'];
  //   if (typeof deployArgs != "undefined") {
  //     deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name]["deployArgs"] = FacetInit.arguments;
  //     // await hre.run("verify:verify", {
  //     //   address: contractAddress,
  //     //   constructorArguments: deployArgs,
  //     // });
  //   }
  //   // else{
  //   //   await hre.run("verify:verify", {
  //   //     address: contractAddress
  //   //   });
  //   // }
  //   console.log(`${contractName} verified: ${contractAddress}`);
  // }
  await fs.writeFile(path.join(__dirname, `../abi/deployed-contracts.json`), JSON.stringify(deployedContracts, null, 2));


  // returning the address of the diamond
  console.log("deploy complete");
  return { diamondAddress: diamond.address, facetCount: facetCuts.length };
}

async function upgradeDiamondFacets(facets, libraries) {
  const existingAddresses = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  let contractAddresses;
  if (typeof existingAddresses !== "undefined") {
    contractAddresses = JSON.parse(existingAddresses);
  } else {
    return false;
  }
  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]["Diamond"];
  console.log(`upgrading Diamond: ${diamondAddress}`);

  const diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress);
  const diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", diamondAddress);

  console.log("getting existing facets and its libs from diamond");
  let facetsDeployedByName = {};
  let facetsCompiled = {};
  let facetsCompiledSelectors = {};
  let facetsDeployedSelectors = {};
  let libNames = [];
  const facetsDeployed = await diamondLoupeFacet.facets();
  for (const facet of facets) {
    const facetNameKeccak = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('contract'+facet.name+'()')).substr(0, 10);
    const facetCompiled = await ethers.getContractAt(facet.name, diamondAddress);
    if (typeof facetCompiled != "undefined") {
      let equal;
      for (facetDeployed of facetsDeployed) {
        // console.log(`checking ${facet.name}`)
        //equal = _.isEqual(facetDeployed.functionSelectors, getSelectors(facetCompiled));
        found = _.contains(facetDeployed.functionSelectors, facetNameKeccak);
        if (found) {
          break;
        }
      }
      if (found) {
        console.log(`found ${facet.name}`);
        facetsDeployedSelectors[facet.name] = facetDeployed.functionSelectors;
        // facetsCompiled[facet.name] = facetCompiled;
        // facetsCompiledSelectors[facet.name] = getSelectors(facetCompiled);
      } else {
        console.log(`not found ${facet.name}`);
      }
      if (typeof facet.libraries != "undefined") {
        libNames = libNames.concat(facet.libraries);
      }
    }
  }

  //make uniq
  libNames = [...new Set(libNames)];

  console.log("deploying libraries");
  let libs = [];
  for (const libName of libNames) {
    const lib = libraries.find((library) => library.name === libName);
    libs.push(lib);
  }

  for (const lib of libs) {
    if (typeof lib.libraries != "undefined") {
      for (const libLibrary of lib.libraries) {
        const libDep = libraries.find((library) => library.name === libLibrary);
        libs.push(libDep);
      }
    }
  }

  //sort first libraries which have no dependencies
  libs.sort(function (left, right) {
    return left.hasOwnProperty("libraries") ? 1 : right.hasOwnProperty("libraries") ? -1 : 0;
  });

  const libAddresses = await deployLibs(libs);

  console.log("removing facetsCompiledSelectors");


  for (const facet of facets) {
    if (typeof facetsDeployedSelectors[facet.name] != "undefined") {
      tx = await diamondCutFacet.diamondCut(
        [
          {
            facetAddress: ethers.constants.AddressZero,
            action: FacetCutAction.Remove,
            functionSelectors: facetsDeployedSelectors[facet.name],
          },
        ],
        ethers.constants.AddressZero,
        "0x",
        { type: 2 }
      );
      receipt = await tx.wait();
      console.log(`${facet.name} removed`);
    } else {
      console.log(`facet ${facet.name} was not present in diamond`);
    }
  }

  console.log("deploying new facets");
  const { facetCuts, facetAddresses } = await deployFacets(facets, libAddresses);

  console.log("upgrading diamond with a new facets");
  // Any number of functions from any number of facets can be added/replaced/removed in a
  tx = await diamondCutFacet.diamondCut(facetCuts, ethers.constants.AddressZero, "0x", { type: 2 });
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  // console.log(`Diamond cut:`, tx)
  console.log(`Diamond cut.`);

  // const facetsDeployed = await diamondLoupeFacet.facets()

  // for(const id of facets.keys()){
  //   console.log(facetsDeployed[findAddressPositionInFacets(facetAddresses[facets[id].name], facets)])
  //   // console.log(getSelectors(TasksFacet))
  //   // assert.sameMembers(facets[findAddressPositionInFacets(tasksFacet.address, facets)][1], getSelectors(TasksFacet))
  // }

  // const facetAddresses = await diamondLoupeFacet.facetAddresses()
}

async function deployLibs(libraries) {
  let libAddresses = {};
  for (const library of libraries) {
    let Lib;
    if (typeof library.name === "undefined") {
      continue;
    } else if (typeof library.name !== "undefined" && typeof library.libraries === "undefined") {
      Lib = await ethers.getContractFactory(library.name);
    } else if (typeof library.name !== "undefined" && typeof library.libraries !== "undefined") {
      let Libs = {};
      for (const LibName of library.libraries) {
        Libs[LibName] = libAddresses[LibName];
      }
      console.log(`${library.name} libraries: ${JSON.stringify(Libs)}`);
      Lib = await ethers.getContractFactory(library.name, { libraries: Libs });
    }
    const feeData = await ethers.provider.getFeeData();
    // const lib = await Lib.deploy({ type: 2, gasPrice: feeData.gasPrice });
    const lib = await Lib.deploy({ type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas});
    // const lib = await Lib.deploy({ type: 2, gasLimit: 20000, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas});
    await lib.deployed();
    libAddresses[library.name] = lib.address;
    console.log(`${library.name} deployed:`, lib.address);

    deployedContracts.deployArgs[hre.network.config.chainId][library.name] = {};
    deployedContracts.deployArgs[hre.network.config.chainId][library.name]['address'] = lib.address;
  }
  return libAddresses;
}

async function deployFacets(FacetInits, libAddresses) {
  const facetCuts = [];
  const facetAddresses = {};
  for (const FacetInit of FacetInits) {
    let Facet;
    if (typeof FacetInit.name === "undefined") {
      continue;
    } else if (typeof FacetInit.name !== "undefined" && typeof FacetInit.libraries === "undefined") {
      Facet = await ethers.getContractFactory(FacetInit.name);
    } else if (typeof FacetInit.name !== "undefined" && typeof FacetInit.libraries !== "undefined") {
      let Libs = {};
      for (const LibName of FacetInit.libraries) {
        Libs[LibName] = libAddresses[LibName];
      }
      console.log(`${FacetInit.name} libraries: ${JSON.stringify(Libs)}`);
      Facet = await ethers.getContractFactory(FacetInit.name, { libraries: Libs });
    }
    const feeData = await ethers.provider.getFeeData();
    let facet;
    if (typeof FacetInit.arguments != "undefined") {
      console.log('deploying facet');
      // facet = await Facet.deploy(...FacetInit.arguments, { type: 2, gasPrice: feeData.gasPrice });
      facet = await Facet.deploy(...FacetInit.arguments, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
    } else {
      console.log('deploying facet');
      // facet = await Facet.deploy({ type: 2, gasPrice: feeData.gasPrice });
      facet = await Facet.deploy({ type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
    }

    const tx = await facet.deployed();
    // const raw = hre.ethers.getRawTransaction(tx);
    console.log(`${FacetInit.name} deployed: ${facet.address}`);
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
    facetAddresses[facet.name] = facet.address;

    // console.log('verifying contract')
    deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name] = {};
    deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name]['address'] = facet.address;
    if (typeof FacetInit.arguments != "undefined") {
      deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name]["deployArgs"] = FacetInit.arguments;
    }
    // if (typeof FacetInit.arguments != "undefined") {
    //   deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name]["deployArgs"] = FacetInit.arguments;
    //   await hre.run("verify:verify", {
    //     address: facet.address,
    //     constructorArguments: FacetInit.arguments,
    //   });
    // }
    // else{
    //   await hre.run("verify:verify", {
    //     address: facet.address
    //   });
    // }
    // console.log(`${FacetInit.name} verified: ${facet.address}`);
  }

  return { facetCuts, facetAddresses };
}

async function verifyContracts(){
  // let deployedContracts;
  try{
    const existingDeployedContracts = await fs.readFile(path.join(__dirname, `../abi/deployed-contracts.json`));
    deployedContracts = JSON.parse(existingDeployedContracts);
  }
  catch{
    console.log(`existing ../abi/deployed-contracts.json not found, will create new`);
    deployedContracts = {
      deployArgs: {},
    };
  }
  for(const contractName of Object.keys(deployedContracts.deployArgs[hre.network.config.chainId])){
    console.log(`verifying contract ${contractName}`)
    const contractAddress = deployedContracts.deployArgs[hre.network.config.chainId][contractName]['address'];
    const deployArgs = deployedContracts.deployArgs[hre.network.config.chainId][contractName]['deployArgs'];
    if (typeof deployArgs != "undefined") {
      deployedContracts.deployArgs[hre.network.config.chainId][FacetInit.name]["deployArgs"] = FacetInit.arguments;
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: deployArgs,
      });
    }
    else{
      await hre.run("verify:verify", {
        address: contractAddress
      });
    }
    console.log(`${contractName} verified: ${contractAddress}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
function run() {
  if (require.main === module) {
    deployDiamond()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

task("diamondDeploy", "deploys Diamond'", async function (taskArguments, hre, runSuper) {
  console.log("deploying Diamond");
  console.log("");
  // console.log('Deploying facets')
  await deployDiamond();
});

task("diamondUpgrade", "upgrades Diamond'")
  .addParam("facets", "facets to add or upgrade")
  .setAction(async function (taskArguments, hre, runSuper) {
    console.log(taskArguments);
    console.log("upgrading Diamond");
    await configureWitnet();
    console.log("");

    let upgradeFacets = [];
    let facetNames = [];

    if (taskArguments.facets === "all") {
      upgradeFacets = dodaoFacets;
    } else {
      if (taskArguments.facets.indexOf(",") != -1) {
        facetNames = taskArguments.facets.split(",");
      } else {
        facetNames.push(taskArguments.facets);
      }

      console.log(dodaoFacets);
      for (const facetName of facetNames) {
        const facet = dodaoFacets.find((facet) => facet.name === facetName);
        if (typeof facet != "undefined") {
          upgradeFacets.push(facet);
        } else {
          console.log(`facet contract "${facetName}" is not found`);
        }
      }
    }

    if (taskArguments.facets === "all" || upgradeFacets.length === facetNames.length) {
      console.log("going to deploy the following facets:");
      console.log(upgradeFacets);
      await upgradeDiamondFacets(upgradeFacets, libraries);
    } else {
      console.log("please specify only existing facet contracts");
    }
  });

  task("diamondVerify", "verifies Diamond contracts", async function (taskArguments, hre, runSuper) {
    console.log("verifying Diamond contracts");
    console.log("");
    // console.log('Deploying facets')
    await verifyContracts();
  });

exports.deployDiamond = deployDiamond;
exports.upgradeDiamondFacets = upgradeDiamondFacets;
