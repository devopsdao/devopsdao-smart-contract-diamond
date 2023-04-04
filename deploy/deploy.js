/* global ethers */
/* eslint prefer-const: "off" */
// const { ethers } = require("hardhat");
const fs = require('fs').promises;
const { arrayCompare } = require('arweave/node/lib/merkle.js');
const path = require('node:path');
var _ = require('underscore');


const { utils, Wallet } = require("zksync-web3");
// import * as ethers = require("ethers");
const { HardhatRuntimeEnvironment } = require("hardhat/types");
const { Deployer }  = require("@matterlabs/hardhat-zksync-deploy");

const { config }  = require("hardhat");

// console.log(hre.network.config.accounts.mnemonic)

// console.log('Accounts from config:', config.networks.mainnet.accounts);




// const ecosystem = "moonbeam"
// const network = "moonbeam.moonbase"


const ecosystem = "polygon"
const network = "polygon.goerli"

let zksync = true;

const witnetAddresses = require("witnet-solidity-bridge/migrations/witnet.addresses")[ecosystem][network]
console.log(witnetAddresses)


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
    name: 'LibUtils',
  },
  {
    name: 'LibAddress',
  },
  {
    name: 'LibTasks',
  },
  {
    name: 'LibTasksAudit',
  },
  {
    name: 'LibChat',
  },
  {
    name: 'LibWithdraw',
    libraries: [
      'LibUtils'
    ],
  },
  {
    name: 'LibTokens',
  },
  {
    name: 'LibTokenData',
  },
  {
    name: 'LibInterchain',
  },
  {
    name: 'LibWitnetRequest'
  }
]

const diamondFacets = [
  {
    name: 'DiamondCutFacet',
  },
  {
    name: 'DiamondLoupeFacet',
  },
  {
    name: 'OwnershipFacet',
  },
]

const dodaoFacets = [
  {
    name: 'TaskCreateFacet',
    libraries: [
      'LibTasks',
      'LibTasksAudit',
      'LibChat',
      'LibWithdraw'
    ]
  },
  {
    name: 'TaskDataFacet',
  },
  {
    name: 'AccountFacet',
  },
  {
    name: 'TokenFacet',
    libraries: [
      'LibTokens',
      'LibTokenData'
    ]
  },
  {
    name: 'TokenDataFacet',
    libraries: [
      'LibTokenData',
    ]
  },
  {
    name: 'InterchainFacet',
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
]

if(zksync === false){
  dodaoFacets.push(
    {
    name: 'WitnetFacet',
    arguments: [witnetAddresses.WitnetRequestBoard, witnetAddresses.WitnetRequestFactory],
    libraries: [
      'LibUtils',
    ]
    },
  )
}

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

let deployer;


async function deployZkSync(){
 

  console.log(`Running deploy script`);

  // Initialize the wallet.
  const privateKey = ethers.Wallet.fromMnemonic(hre.network.config.accounts.mnemonic);
  const wallet = new Wallet(privateKey);


  // Create deployer object and load the artifact of the contract we want to deploy.
  deployer = new Deployer(hre, wallet);

  // console.log(deployer.zkWallet.address)

  const depositAmount = ethers.utils.parseEther("1");

  const depositHandle = await deployer.zkWallet.deposit({
    to: deployer.zkWallet.address,
    token: utils.ETH_ADDRESS,
    amount: depositAmount,
  });
  // Wait until the deposit is processed on zkSync
  await depositHandle.wait();

  console.log(`deposited ${depositAmount}`)
  await deployDiamond();

}


async function upgradeZkSync(){
 

  console.log(`Running upgrade script`);

  // Initialize the wallet.
  const privateKey = ethers.Wallet.fromMnemonic(hre.network.config.accounts.mnemonic);
  const wallet = new Wallet(privateKey);


  // Create deployer object and load the artifact of the contract we want to deploy.
  deployer = new Deployer(hre, wallet);

  // console.log(deployer.zkWallet.address)

  // const depositAmount = ethers.utils.parseEther("0.1");

  // const depositHandle = await deployer.zkWallet.deposit({
  //   to: deployer.zkWallet.address,
  //   token: utils.ETH_ADDRESS,
  //   amount: depositAmount,
  // });
  // // Wait until the deposit is processed on zkSync
  // await depositHandle.wait();

  // console.log(`deposited ${depositAmount}`)

  const taskArguments = {
    facets: 'WitnetFacet'
  }

  console.log(taskArguments)
  console.log("upgrading Diamond");
  console.log('')


  let upgradeFacets = []
  let facetNames = []



  if(taskArguments.facets === 'all'){
    upgradeFacets = dodaoFacets
  }
  else{
    if(taskArguments.facets.indexOf(',') != -1){
      facetNames = taskArguments.facets.split(',')
    }
    else{
      facetNames.push(taskArguments.facets)
    }

    console.log(dodaoFacets)
    for(const facetName of facetNames){
      const facet = dodaoFacets.find(facet => facet.name === facetName)
      if(typeof facet != 'undefined'){
        upgradeFacets.push(facet)
      }
      else{
        console.log(`facet contract "${facetName}" is not found`)
      }
    }
  }

  if(taskArguments.facets === 'all' || upgradeFacets.length === facetNames.length){
    console.log('going to deploy the following facets:')
    console.log(upgradeFacets)
    await upgradeDiamondFacets(upgradeFacets, libraries)
  }
  else{
    console.log('please specify only existing facet contracts')
  }

}

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]
  console.log(`using wallet: ${contractOwner.address}`)

  //a hack for zksync-era testnet
  if(zksync === true){
    this.__hardhatContext.environment.network.config.chainId = 280
  }

  // Deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded or deployed to initialize state variables
  // Read about how the diamondCut function works in the EIP2535 Diamonds standard
  let DiamondInit;
  let diamondInit;

  if(zksync === false){
    DiamondInit = await ethers.getContractFactory('DiamondInit')
    diamondInit = await DiamondInit.deploy({type: 2})
    await diamondInit.deployed()
  }
  else{
    DiamondInit = await deployer.loadArtifact("DiamondInit");
    diamondInit = await deployer.deploy(DiamondInit);
  }
  console.log('DiamondInit deployed:', diamondInit.address)

  const libAddresses = await deployLibs(libraries)

  // Deploy facets and set the `facetCuts` variable
  console.log('')
  console.log('Deploying facets')
  
  const facets = diamondFacets.concat(dodaoFacets)

  // The `facetCuts` variable is the FacetCut[] that contains the functions to add during diamond deployment
  const {facetCuts, facetAddresses} = await deployFacets(facets, libAddresses)

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

  console.log(diamondArgs)

  console.log(facetCuts)

  // deploy Diamond

  let Diamond
  let diamond
  if(zksync === false){
    Diamond = await ethers.getContractFactory('Diamond')
    diamond = await Diamond.deploy(facetCuts, diamondArgs, {type: 2})
    await diamond.deployed()  }
  else{
    Diamond = await deployer.loadArtifact("Diamond");
    diamond = await deployer.deploy(Diamond, [facetCuts, diamondArgs]);
  }

  console.log('')
  console.log('Diamond deployed:', diamond.address)

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

  await fs.writeFile(path.join(__dirname, `../abi/addresses.json`), JSON.stringify(contractAddresses));

  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return {diamondAddress: diamond.address, facetCount: facetCuts.length}
}


async function upgradeDiamondFacets(facets, libraries) {
  const existingAddresses = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  let contractAddresses;
  if(typeof existingAddresses !== 'undefined'){
    contractAddresses = JSON.parse(existingAddresses);
  }
  else{
    return false;
  }

  if(zksync === true){
    this.__hardhatContext.environment.network.config.chainId = 280
  }

  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  console.log(`upgrading Diamond: ${diamondAddress}`)


  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)

  console.log('getting existing facets and its libs from diamond')
  let existingFacets = {}
  let existingFacetSelectors = {}
  let libNames = []
  const facetsDeployed = await diamondLoupeFacet.facets()
  for(const facet of facets){
    const existingFacet = await ethers.getContractAt(facet.name, diamondAddress)
    if(typeof existingFacet != 'undefined'){
      let equal;
      for (facetDeployed of facetsDeployed){
        // console.log(`checking ${facet.name}`)
        equal = _.isEqual(facetDeployed.functionSelectors, getSelectors(existingFacet));
        if(equal){
          break;
        }
      }
      if(equal){
        console.log(`found ${facet.name}`)
        existingFacets[facet.name] = existingFacet
        existingFacetSelectors[facet.name] = getSelectors(existingFacet)
      }
      else{
        console.log(`not found ${facet.name}`)
      }
      if(typeof facet.libraries != 'undefined'){
        libNames = libNames.concat(facet.libraries)
      }
    }
  }

  //make uniq
  libNames = [...new Set(libNames)]

  console.log('deploying libraries')
  let libs = [];
  for(const libName of libNames){
    const lib = libraries.find(library => library.name === libName)
    libs.push(lib)
  }

  for(const lib of libs){
    if(typeof lib.libraries != 'undefined'){
      for (const libLibrary of lib.libraries){
        const libDep = libraries.find(library => library.name === libLibrary)
        libs.push(libDep)
      }
    }
  }

  //sort first libraries which have no dependencies
  libs.sort(function(left, right) {
    return left.hasOwnProperty("libraries") ? 1 : right.hasOwnProperty("libraries") ? -1 : 0
  });

  const libAddresses  = await deployLibs(libs);

  console.log('removing existingFacetSelectors')
  // console.log(existingFacets)
  // console.log(facets)
  // const facetsDeployed = await diamondLoupeFacet.facets()
  // console.log(facetsDeployed)

  // console.log('test')
  // console.log(facetsDeployed)
  // console.log(facetsDeployed[3].functionSelectors)
  // console.log('test2')
  // console.log(getSelectors(existingFacets['TaskCreateFacet']))

  // assert.sameMembers(facetsDeployed[10].functionSelectors, getSelectors(existingFacets['TaskCreateFacet']))  

  // assert.sameMembers(facetsDeployed[12].functionSelectors, getSelectors(existingFacets['TaskCreateFacet']))  

  for(const facet of facets){
    if(typeof existingFacets[facet.name] != 'undefined'){
      tx = await diamondCutFacet.diamondCut(
        [{
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: existingFacetSelectors[facet.name]
        }],
        ethers.constants.AddressZero, '0x', { type: 2 })
      receipt = await tx.wait()
      console.log(`${facet.name} removed`)
    }
    else{
      console.log(`facet ${facet.name} was not present in diamond`)
    }
  }


  console.log('deploying new facets')
  const {facetCuts, facetAddresses} = await deployFacets(facets, libAddresses)

  console.log('upgrading diamond with a new facets')
  // Any number of functions from any number of facets can be added/replaced/removed in a
  tx = await diamondCutFacet.diamondCut(facetCuts, ethers.constants.AddressZero, '0x', { type: 2 })
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  // console.log(`Diamond cut:`, tx)
  console.log(`Diamond cut.`)

  // const facetsDeployed = await diamondLoupeFacet.facets()

  // for(const id of facets.keys()){
  //   console.log(facetsDeployed[findAddressPositionInFacets(facetAddresses[facets[id].name], facets)])
  //   // console.log(getSelectors(TasksFacet))
  //   // assert.sameMembers(facets[findAddressPositionInFacets(tasksFacet.address, facets)][1], getSelectors(TasksFacet))  
  // }

  // const facetAddresses = await diamondLoupeFacet.facetAddresses()
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
  tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { type: 2 })
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

async function deployLibs(libraries){
  let libAddresses = {};
  for (const library of libraries) {
    let Lib;
    if(typeof library.name === 'undefined'){
      continue;
    }
    else if(typeof library.name !== 'undefined' && typeof library.libraries === 'undefined'){
      if(zksync === false){
        Lib = await ethers.getContractFactory(library.name)
      }
      else{
        Lib = await deployer.loadArtifact(library.name)
      }
    }
    else if(typeof library.name !== 'undefined' && typeof library.libraries !== 'undefined'){

      let Libs = {}
      for(const LibName of library.libraries){
        Libs[LibName] = libAddresses[LibName];
      }
      console.log(`${library.name} libraries: ${JSON.stringify(Libs)}`)
      if(zksync === false){
        Lib = await ethers.getContractFactory(library.name, {libraries: Libs})
      }
      else{
        Lib = await deployer.loadArtifact(library.name, {libraries: Libs})
      }
    }
    let lib
    if(zksync === false){
      lib = await Lib.deploy({type: 2});
      await lib.deployed();    
    }
    else{
      lib = await deployer.deploy(Lib);
    }

    libAddresses[library.name] = lib.address;
    console.log(`${library.name} deployed:`, lib.address)
  }
  return libAddresses
}

async function deployFacets(FacetInits, libAddresses){
  const facetCuts = []
  const facetAddresses = {}
  for (const FacetInit of FacetInits) {
    let Facet;
    if(typeof FacetInit.name === 'undefined'){
      continue
    }
    else if(typeof FacetInit.name !== 'undefined' && typeof FacetInit.libraries === 'undefined'){
      if(zksync === false){
        Facet = await ethers.getContractFactory(FacetInit.name)
      }
      else{
        Facet = await deployer.loadArtifact(FacetInit.name)
      }
    }
    else if(typeof FacetInit.name !== 'undefined' && typeof FacetInit.libraries !== 'undefined'){
      let Libs = {}
      for(const LibName of FacetInit.libraries){
        Libs[LibName] = libAddresses[LibName];
      }
      console.log(`${FacetInit.name} libraries: ${JSON.stringify(Libs)}`)
      if(zksync === false){
        Facet = await ethers.getContractFactory(FacetInit.name, {libraries: Libs})
      }
      else{
        Facet = await deployer.loadArtifact(FacetInit.name, {libraries: Libs})
      }
    }
    let facet;
    if(typeof FacetInit.arguments != 'undefined'){
      if(zksync === false){
        facet = await Facet.deploy(...FacetInit.arguments, { type: 2 })
        await facet.deployed();    
      }
      else{
        facet = await deployer.deploy(Facet, FacetInit.arguments);
      }
    }
    else{
      if(zksync === false){
        facet = await Facet.deploy({ type: 2 })
        await facet.deployed()
      }
      else{
        facet = await deployer.deploy(Facet);
      }
    }
    console.log(`${FacetInit.name} deployed: ${facet.address}`)
    facetCuts.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
    facetAddresses[facet.name] = facet.address
  }


  return {facetCuts, facetAddresses}
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


// task(
//   "diamondDeploy",
//   "deploys Diamond'",
//   async function (taskArguments, hre, runSuper) {
//     console.log("deploying Diamond");
//     console.log('')
//     // console.log('Deploying facets')
//     await deployDiamond()
//   }
// );

// task(
//   "diamondUpgrade",
//   "upgrades Diamond'")
//   .addParam("facets", "facets to add or upgrade")
//   .setAction(
//   async function (taskArguments, hre, runSuper) {
//     console.log(taskArguments)
//     console.log("upgrading Diamond");
//     console.log('')


//     let upgradeFacets = []
//     let facetNames = []



//     if(taskArguments.facets === 'all'){
//       upgradeFacets = dodaoFacets
//     }
//     else{
//       if(taskArguments.facets.indexOf(',') != -1){
//         facetNames = taskArguments.facets.split(',')
//       }
//       else{
//         facetNames.push(taskArguments.facets)
//       }
  
//       console.log(dodaoFacets)
//       for(const facetName of facetNames){
//         const facet = dodaoFacets.find(facet => facet.name === facetName)
//         if(typeof facet != 'undefined'){
//           upgradeFacets.push(facet)
//         }
//         else{
//           console.log(`facet contract "${facetName}" is not found`)
//         }
//       }
//     }
  
//     if(taskArguments.facets === 'all' || upgradeFacets.length === facetNames.length){
//       console.log('going to deploy the following facets:')
//       console.log(upgradeFacets)
//       await upgradeDiamondFacets(upgradeFacets, libraries)
//     }
//     else{
//       console.log('please specify only existing facet contracts')
//     }

//   }
// );



exports.deployDiamond = deployDiamond
exports.upgradeDiamondFacets = upgradeDiamondFacets
exports.default = deployZkSync
