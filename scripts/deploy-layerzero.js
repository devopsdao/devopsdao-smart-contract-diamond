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
    existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/layerzero-addresses.json`);
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

  const LZ_CHAINIDS = require("../contracts/external/layerzero/constants/chainIds.json")
  const LZ_ENDPOINTS = require("../contracts/external/layerzero/constants/layerzeroEndpoints.json")

  const endpointAddr = LZ_ENDPOINTS[hre.network.name]
  console.log(`[${hre.network.name}] Endpoint address: ${endpointAddr}`)

  destinationChain = 10126;
  // destinationAddress = '0x68F86D6Cd8149103A61e5AaF1e31E9a8C6f0DFEd'; //moonbeam
  destinationDiamond = '0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01'; //moonbeam


  const Layerzero = await ethers.getContractFactory('Layerzero')
  const layerzero = await Layerzero.deploy(endpointAddr, destinationChain, destinationAddress, destinationDiamond)
  await layerzero.deployed()

  console.log(`Layerzero deployed:`, layerzero.address)

  // v1 adapterParams, encoded for version 1 style, and 200k gas quote
  let adapterParams = ethers.utils.solidityPack(
    ['uint16','uint256'],
    [1, 3000000]
  )

  const fees = await layerzero.estimateFees(10126, "0x2fE1fe0aADdAA09157419B5857Cd3fbBCf7dBc24", formatBytes32String("EndpointEndpointEndpointEn"), false, adapterParams)

  // console.log(`fees ${fees}`)

  // const tx = await layerzero.createTaskContract("testtesttest", "public", "layerzero", "layerzero", "ETH", "0", { value: 6304049920340000 });
  // console.log(tx);

  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId] = {};
  contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'] = layerzero.address;


  await fs.writeFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/layerzero-addresses.json`, JSON.stringify(contractAddresses));

  // returning the address of the diamond
  return layerzero.address
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
