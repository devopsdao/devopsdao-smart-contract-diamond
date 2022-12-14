const { ethers } = require("hardhat");
const fs = require('fs').promises;


async function mintTokens(){
    const existingAddresses = await fs.readFile(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`);
    if(typeof existingAddresses !== 'undefined'){
        contractAddresses = JSON.parse(existingAddresses)
    }

    diamondAddress = contractAddresses['contracts'][31337]['Diamond']

    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    tasksFacet = await ethers.getContractAt('TasksFacet', diamondAddress)
    tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
    signers = await ethers.getSigners();


    await tokenFacet.mint(signers[2].address);
    const balance = await tokenFacet.balanceOf(signers[2].address, 1)
    console.log(`NFT balance of ${signers[2].address}: ${balance}`)
}

if (require.main === module) {
    mintTokens()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error)
        process.exit(1)
      })
  }
  
