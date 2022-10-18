
/* global ethers task */
require('@nomiclabs/hardhat-waffle')
require('hardhat-contract-sizer');
require("hardhat-interface-generator")

// This is a sample Hardhat task. To learn how to create your own go to

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.17',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
      details: { yul: false }
    },
    contractSizer: {
      alphaSort: true,
      disambiguatePaths: false,
      runOnCompile: true,
      strict: true,
      // only: [':ERC20$'],
    }
  }
}
