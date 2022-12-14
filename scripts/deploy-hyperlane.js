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
  ethereumOutbox = '0x54148470292C24345fb828B003461a9444414517'

  // destinationDomain = 80001; //mumbai
  destinationDomain = '0x6d6f2d61'; //moonbase
  ethereumOutbox = '0x54148470292C24345fb828B003461a9444414517'; //moonbase
  // ethereumOutbox = 0xe17c37212d785760E8331D4A4395B17b34Ba8cDF; //mumbai
  destinationAddress = '0xf2E3439ca3acf8B63Adb3C576299395576C8fF19';
  destinationDiamond = '0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01'; //moonbeam
  // destinationDiamond = '0x8bbF9b0f29f5507e3a366b1aa78D8418997E08F8'; //mumbai

  const Hyperlane = await ethers.getContractFactory('Hyperlane')
  const hyperlane = await Hyperlane.deploy(destinationDomain, ethereumOutbox, destinationAddress, destinationDiamond)
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
