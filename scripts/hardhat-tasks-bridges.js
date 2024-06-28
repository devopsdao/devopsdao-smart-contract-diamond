// const { ethers } = require("hardhat");
const Arweave = require('arweave')
const fs = require('fs/promises')
const path = require('node:path');

const {bridgeBlast} = require('./blast-bridge.js')

// async function main(){

//     await mintNFTs();

// }
let contractAddresses;

(async() => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if(typeof contractAddressesJson !== 'undefined'){
    contractAddresses = JSON.parse(contractAddressesJson);
  }
  else{
    console.log(`contract addresses file not found at ../abi/addresses.json`)
}
})()


task(
  "bridgeBlast",
  "bridge to blast")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    signers = await ethers.getSigners();
    console.log(`using wallet: ${signers[0].address}`);
    await bridgeBlast();
  }
);


// (async() => {
//     await main()
//   })()