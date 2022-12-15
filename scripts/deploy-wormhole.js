/* global ethers */
/* eslint prefer-const: "off" */
const { ethers } = require("hardhat");
const { formatBytes32String } = require("ethers/lib/utils");

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

  let existingAddresses;
  try {
    existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/wormhole-addresses.json`);
  } catch (error) {
    console.log('deploying first time')
  }
  if (typeof existingAddresses !== 'undefined') {
    contractAddresses = JSON.parse(existingAddresses);
  }
  else {
    contractAddresses = {
      "contracts": {}
    };
  }

  let destinationAddress;

  if (typeof contractAddresses.contracts[1287] != 'undefined') {
    destinationAddress = contractAddresses.contracts[1287]['Diamond'];
  } 

  if (hre.network.name == 'moonbase') {
    currentChain = '16';
    destinationChain = '16';
  } else {
    currentChain = '5';
    destinationChain = '16';
  }

  wormhole_core_bridge_address = '0xa5B7D85a8f27dd7907dc8FdC21FA5657D5E2F901';
  destinationDiamond = '0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01'; //moonbeam
  
  const Wormhole = await ethers.getContractFactory('Wormhole')
  const wormhole = await Wormhole.deploy(destinationChain, wormhole_core_bridge_address, destinationAddress, destinationDiamond)
  await wormhole.deployed()

  console.log(`Wormhole deployed:`, wormhole.address)

  if (hre.network.name == 'moonbase') {
    wormhole.addTrustedAddress(contractAddresses.contracts[80001], 5);
  }

  // const Wormhole = await ethers.getContractFactory('Wormhole')
  // const wormhole = Wormhole.attach("0xfFA70Cdf11790f641850559414673D94dece744e")


  // const tx = await wormhole.createTaskContract("testtesttest", "public", "wormhole", "wormhole", "ETH", "0", { value: 6304049920340000 });
  // console.log(tx);

  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId] = {};
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = wormhole.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/wormhole-addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return wormhole.address
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
