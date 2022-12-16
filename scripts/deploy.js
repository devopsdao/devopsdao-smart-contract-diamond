/* global ethers */
/* eslint prefer-const: "off" */
const { ethers } = require("hardhat");
const fs = require('fs').promises;
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

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // Deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded or deployed to initialize state variables
  // Read about how the diamondCut function works in the EIP2535 Diamonds standard
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)


  const LibNames = ['LibAppStorage', 'LibInterchain', 'LibUtils'];
  let libAddresses = {};

  for (const LibName of LibNames) {
    const Lib = await ethers.getContractFactory(LibName);
    const lib = await Lib.deploy();
    await lib.deployed();
    libAddresses[LibName] = lib.address;
    console.log(`${LibName} deployed:`, lib.address)
  }

  // Deploy facets and set the `facetCuts` variable
  console.log('')
  console.log('Deploying facets')
  const FacetInits = [
    {
      name: 'DiamondCutFacet',
    },
    {
      name: 'DiamondLoupeFacet',
    },
    {
      name: 'OwnershipFacet',
    },
    {
      name: 'TasksFacet',
      libraries: {
        'LibAppStorage': libAddresses.LibAppStorage,
        'LibAppStorage': libAddresses.LibAppStorage,
        'LibUtils': libAddresses.LibUtils,
      }
    },
    {
      name: 'AxelarFacet',
      libraries: {
        'LibInterchain': libAddresses.LibAppStorage,
      }
    },
    {
      name: 'HyperlaneFacet',
      libraries: {
        'LibInterchain': libAddresses.LibAppStorage,
      }
    },
    {
      name: 'LayerzeroFacet',
      libraries: {
        'LibInterchain': libAddresses.LibAppStorage,
      }
    },
    {
      name: 'WormholeFacet',
      libraries: {
        'LibInterchain': libAddresses.LibAppStorage,
      }
    },
  ]

  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const facetCuts = []
  for (const FacetInit of FacetInits) {
    let Facet;
    if(typeof FacetInit.name === 'undefined'){
      continue;
    }
    else if(typeof FacetInit.name !== 'undefined' && typeof FacetInit.libraries === 'undefined'){
      Facet = await ethers.getContractFactory(FacetInit.name)
    }
    else if(typeof FacetInit.name !== 'undefined' && typeof FacetInit.libraries !== 'undefined'){
      console.log(`${FacetInit.name} libraries: ${JSON.stringify(FacetInit.libraries)}`)
      Facet = await ethers.getContractFactory(FacetInit.name, {libraries: FacetInit.libraries})
    }
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetInit.name} deployed: ${facet.address}`)
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // goerliGateway = '0xe432150cce91c13a887f7D836923d5597adD8E31'
  // goerliGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'
  // moonbaseGateway = '0x5769D84DD62a6fD969856c75c7D321b84d455929'
  // moonbaseGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'

  // const AxelarGMP = await ethers.getContractFactory('AxelarGMP')
  // const axelarGMP = await AxelarGMP.deploy(goerliGateway, goerliGasService)
  // await axelarGMP.deployed()

  // facetCuts.push({
  //   facetAddress: axelarGMP.address,
  //   action: FacetCutAction.Add,
  //   functionSelectors: getSelectors(AxelarGMP)
  // })

  // Creating a function call
  // This call gets executed during deployment and can also be executed in upgrades
  // It is `executed` with delegatecall on the DiamondInit address.
  let functionCall = diamondInit.interface.encodeFunctionData('init')

  // Setting arguments that will be used in the diamond constructor
  const diamondArgs = {
    owner: contractOwner.address,
    init: diamondInit.address,
    initCalldata: functionCall
  }

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(facetCuts, diamondArgs)
  await diamond.deployed()
  console.log()
  console.log('Diamond deployed:', diamond.address)
  // let contractAddresses = {
  //   'contracts': {
  //     31337:{
  //     "Diamond": diamond.address
  //     },
  //   }
  // }



  const existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`);
  if(typeof existingAddresses !== 'undefined'){
    contractAddresses = JSON.parse(existingAddresses);
  }
  else{
    contractAddresses = {
      "contracts":{}
    };
  }

  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId] = {};
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = diamond.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return diamond.address
}

async function upgradeDiamondTasksFacet () {
  const existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`);
  let contractAddresses;
  if(typeof existingAddresses !== 'undefined'){
    contractAddresses = JSON.parse(existingAddresses);
  }
  else{
    return false;
  }
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  console.log(`upgrading Diamond: ${diamondAddress}`)


  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const existingTasksFacet = await ethers.getContractAt('TasksFacet', diamondAddress)
  const existingTasksFacetSelectors = getSelectors(existingTasksFacet)

  // tx = await diamondCutFacet.diamondCut(
  //   [{
  //     facetAddress: ethers.constants.AddressZero,
  //     action: FacetCutAction.Remove,
  //     functionSelectors: existingTasksFacetSelectors
  //   }],
  //   ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  // receipt = await tx.wait()

  const LibNames = ['LibAppStorage', 'LibUtils'];
  let libAddresses = {};

  for (const LibName of LibNames) {
    const Lib = await ethers.getContractFactory(LibName);
    const lib = await Lib.deploy();
    await lib.deployed();
    libAddresses[LibName] = lib.address;
    console.log(`${LibName} deployed:`, lib.address)
  }  

  
  const TasksFacet = await ethers.getContractFactory('TasksFacet', {libraries: {
    'LibAppStorage': libAddresses.LibAppStorage,
    'LibUtils': libAddresses.LibUtils,
  }})
  const tasksFacet = await TasksFacet.deploy();
  console.log(`tasksFacet deployed:`, tasksFacet.address)

  // Any number of functions from any number of facets can be added/replaced/removed in a
  // single transaction
  const cut = [
    {
      facetAddress: tasksFacet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(TasksFacet)
    }
  ]
  tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log(`Diamond cut:`, tx)

  const facets = await diamondLoupeFacet.facets()
  // const facetAddresses = await diamondLoupeFacet.facetAddresses()
  console.log(facets[findAddressPositionInFacets(tasksFacet.address, facets)][1])
  // console.log(getSelectors(TasksFacet))
  // assert.sameMembers(facets[findAddressPositionInFacets(tasksFacet.address, facets)][1], getSelectors(TasksFacet))
}

async function upgradeDiamondAxelarFacet () {
  const existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`);
  let contractAddresses;
  if(typeof existingAddresses !== 'undefined'){
    contractAddresses = JSON.parse(existingAddresses);
  }
  else{
    return false;
  }
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  console.log(`upgrading Diamond: ${diamondAddress}`)


  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const existingAxelarGMPFacet = await ethers.getContractAt('AxelarGMP', diamondAddress)
  const existingAxelarGMPFacetSelectors = getSelectors(existingAxelarGMPFacet)

  // console.log(`existingAxelarGMPFacet: ${existingAxelarGMPFacet.address}`);

  // tx = await diamondCutFacet.diamondCut(
  //   [{
  //     facetAddress: ethers.constants.AddressZero,
  //     action: FacetCutAction.Remove,
  //     functionSelectors: existingAxelarGMPFacetSelectors
  //   }],
  //   ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
  // receipt = await tx.wait()

  goerliGateway = '0xe432150cce91c13a887f7D836923d5597adD8E31'
  goerliGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'
  moonbaseGateway = '0x5769D84DD62a6fD969856c75c7D321b84d455929'
  moonbaseGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'

  const AxelarGMP = await ethers.getContractFactory('AxelarGMP')
  const axelarGMP = await AxelarGMP.deploy(goerliGateway, goerliGasService)
  await axelarGMP.deployed()

  // const facetCuts = []

  // facetCuts.push({
  //   facetAddress: axelarGMP.address,
  //   action: FacetCutAction.Add,
  //   functionSelectors: getSelectors(AxelarGMP)
  // })

  console.log(`axelarGMP facet deployed:`, axelarGMP.address)

  
  // Any number of functions from any number of facets can be added/replaced/removed in a
  // single transaction
  const cut = [
    {
      facetAddress: axelarGMP.address,
      action: FacetCutAction.Replace,
      functionSelectors: getSelectors(AxelarGMP)
    }
  ]
  tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log(`Diamond cut:`, tx)

  const facets = await diamondLoupeFacet.facets()
  // const facetAddresses = await diamondLoupeFacet.facetAddresses()
  console.log(facets[findAddressPositionInFacets(axelarGMP.address, facets)][2])
  // console.log(getSelectors(TasksFacet))
  // assert.sameMembers(facets[findAddressPositionInFacets(tasksFacet.address, facets)][1], getSelectors(TasksFacet))
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
function run(){
  if (require.main === module) {
    deployDiamond()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error)
        process.exit(1)
      })
  }
}

if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}


exports.deployDiamond = deployDiamond
