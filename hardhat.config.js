
/* global ethers task */
require('@nomiclabs/hardhat-waffle')
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require("hardhat-interface-generator");
require('solidity-coverage');
// require("hardhat-gas-reporter");
require("hardhat-tracer");
require('hardhat-abi-exporter');
// const { ethers } = require("ethers");


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

const BLASTAPI_KEY = '5adb17c5-f79f-4542-b37c-b9cf98d6b28f';
const ONFINALITY_API_KEY = 'a574e9f5-b1db-4984-8362-89b749437b81';

const MNEMONIC = `possible claw silk quiz decade ozone decide monster tired material crazy maple`

// let key = ethers.Wallet.fromMnemonic(MNEMONIC);
// console.log(key);

module.exports = {
  solidity: '0.8.17',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    moonbase: {
      // url: `https://moonbase-alpha.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f`,
      // url: `https://moonbeam-alpha.api.onfinality.io/rpc?apikey=a574e9f5-b1db-4984-8362-89b749437b81`,
      url: 'https://rpc.api.moonbase.moonbeam.network',
      // url: 'https://moonbeam-mainnet.gateway.pokt.network/v1/lb/629a2b5650ec8c0039bb30f0',
      chainId: 1287,
      accounts: {
        mnemonic: MNEMONIC
      }
      // mnemonic: MNEMONIC
    },
    localhost:{
      chainId: 31337
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
  },
  abiExporter: 
  [
    {
    // path: '../devopsdao/build/abi',
    path: '../devopsdao/lib/blockchain/abi',
    runOnCompile: true,
    // clear: true,
    flat: true,
    // only: [':ERC20$'],
    spacing: 2,
    // pretty: true,
    format: "json",
  },
  {
    // path: '../devopsdao/build/abi',
    path: '../devopsdao/lib/blockchain/abi',
    runOnCompile: true,
    // clear: true,
    // flat: true,
    only: [':TaskContract$'],
    rename: () => 'TaskContract.abi',
    spacing: 2,
    // pretty: true,
    format: "json",
  },
  {
    // path: '../devopsdao/build/abi',
    path: '../devopsdao/lib/blockchain/abi',
    runOnCompile: true,
    // clear: true,
    // flat: true,
    only: [':TasksFacet$'],
    rename: () => 'TasksFacet.abi',
    spacing: 2,
    // pretty: true,
    format: "json",
  },
  {
    // path: '../devopsdao/build/abi',
    path: '../devopsdao/lib/blockchain/abi',
    runOnCompile: true,
    // clear: true,
    // flat: true,
    only: [':IERC20$'],
    rename: () => 'IERC20.abi',
    spacing: 2,
    // pretty: true,
    format: "json",
  }
],
}
