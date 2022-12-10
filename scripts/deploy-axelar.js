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

  goerliGateway = '0xe432150cce91c13a887f7D836923d5597adD8E31'
  goerliGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'
  moonbaseGateway = '0x5769D84DD62a6fD969856c75c7D321b84d455929'
  moonbaseGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'

  const AxelarGMP = await ethers.getContractFactory('AxelarGMP')
  const axelarGMP = await AxelarGMP.deploy(goerliGateway, goerliGasService)
  await axelarGMP.deployed()

  console.log(`AxelarGMP deployed:`, axelarGMP.address)

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
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = axelarGMP.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/axelar-addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return axelarGMP.address
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
