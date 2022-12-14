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
  console.log(`wallet: ${contractOwner.address}`);

  goerliGateway = '0xe432150cce91c13a887f7D836923d5597adD8E31'
  goerliGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'
  maticGateway = '0xBF62ef1486468a6bd26Dd669C06db43dEd5B849B'
  maticGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'
  moonbaseGateway = '0x5769D84DD62a6fD969856c75c7D321b84d455929'
  moonbaseGasService = '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6'

  destinationChain = 'Moonbeam';
  destinationAddress = '0x35beAD8D8056292E390EAea0DDb74E51E021da26'; //moonbeam
  // destinationAddress = '0x536423D551fd05D814d3A8b35A37189ceeA530E3' //mumbai
  destinationDiamond = '0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01'; //moonbeam
  //destinationDiamond = '0x8bbF9b0f29f5507e3a366b1aa78D8418997E08F8'; //mumbai


  const AxelarGMP = await ethers.getContractFactory('AxelarGMP')
  const axelarGMP = await AxelarGMP.deploy(maticGateway, maticGasService, destinationChain, destinationAddress, destinationDiamond)
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
