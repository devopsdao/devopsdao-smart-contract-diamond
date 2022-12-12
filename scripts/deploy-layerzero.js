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

const LZ_ENDPOINTS = require("../contracts/external/layerzero/constants/layerzeroEndpoints.json")

const endpointAddr = LZ_ENDPOINTS[hre.network.name]
console.log(`[${hre.network.name}] Endpoint address: ${endpointAddr}`)

async function deploy () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]
  console.log(`wallet: ${contractOwner.address}`);

  const LayerZero = await ethers.getContractFactory('LayerZero')
  const layerZero = await LayerZero.deploy(endpointAddr)
  await layerZero.deployed()

  console.log(`LayerZero deployed:`, layerZero.address)

  let existingAddresses;
  try {
    existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/axelar-addresses.json`);
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
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = layerZero.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/axelar-addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return layerZero.address
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
