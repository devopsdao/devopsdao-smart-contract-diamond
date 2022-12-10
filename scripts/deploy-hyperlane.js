/* global ethers */
/* eslint prefer-const: "off" */
const { ethers } = require("hardhat");
const fs = require('fs').promises;
// const { program } = require('commander');

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

async function deploy () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  destinationDomain = '0x6d6f2d61'
  moonbaseOutbox = '0x54148470292C24345fb828B003461a9444414517'

  const Hyperlane = await ethers.getContractFactory('Hyperlane')
  const hyperlane = await Hyperlane.deploy()
  await hyperlane.deployed()

  console.log(`Hyperlane deployed:`, hyperlane.address)

  let existingAddresses;
  try {
    existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/hyperlane-addresses.json`);
  } catch (error) {
    console.log('deploying first time')
  }
  if(typeof existingAddresses !== 'undefined'){
    contractAddresses = JSON.parse(existingAddresses);
  }
  else{
    contractAddresses = {
      "contracts":{}
    };
  }

  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId] = {};
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = hyperlane.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/hyperlane-addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return hyperlane.address
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
function run(){
  if (require.main === module) {
    deploy()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error)
        process.exit(1)
      })
  }
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}


exports.deploy = deploy
