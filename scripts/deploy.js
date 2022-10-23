/* global ethers */
/* eslint prefer-const: "off" */
const { ethers } = require("hardhat");
const fs = require('fs').promises;


const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

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


  const LibNames = ['LibAppStorage', 'LibUtils'];
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
    // {
    //   name: 'NFTFacet',
    // },
    {
      name: 'TasksFacet',
      libraries: {
        'LibAppStorage': libAddresses.LibAppStorage,
        'LibUtils': libAddresses.LibUtils,
      }
    }
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond
