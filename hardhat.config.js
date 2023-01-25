
/* global ethers task */
require('@nomiclabs/hardhat-waffle')
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require("hardhat-interface-generator");
require('solidity-coverage');
// require("hardhat-gas-reporter");
require("hardhat-tracer");
require('hardhat-abi-exporter');
require("@openzeppelin/test-helpers");
// const { ethers } = require("ethers");


require('./scripts/deploy.js');
require('./scripts/hardhat-tasks.js');

const fs = require('fs');


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

let keys;

const keysJSON = fs.readFileSync(`./keys.json`);
keys =  JSON.parse(keysJSON)
// console.log(keys)

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
        mnemonic: keys.mnemonic1
      }
      // mnemonic: MNEMONIC
    },
    goerli: {
      // url: `https://moonbase-alpha.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f`,
      // url: `https://moonbeam-alpha.api.onfinality.io/rpc?apikey=a574e9f5-b1db-4984-8362-89b749437b81`,
      // url: 'https://rpc.ankr.com/eth_goerli',
      url: 'https://eth-goerli.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f',
      // url: 'https://moonbeam-mainnet.gateway.pokt.network/v1/lb/629a2b5650ec8c0039bb30f0',
      chainId: 5,
      accounts: {
        mnemonic: keys.mnemonic1
      }
      // mnemonic: MNEMONIC
    },
    mumbai: {
      // url: `https://moonbase-alpha.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f`,
      // url: `https://moonbeam-alpha.api.onfinality.io/rpc?apikey=a574e9f5-b1db-4984-8362-89b749437b81`,
      url: 'https://rpc-mumbai.maticvigil.com',
      // url: 'https://moonbeam-mainnet.gateway.pokt.network/v1/lb/629a2b5650ec8c0039bb30f0',
      chainId: 80001,
      accounts: {
        mnemonic: keys.mnemonic1
      }
      // mnemonic: MNEMONIC
    },
    localhost:{
      chainId: 31337
    },
    ganache:{
      url: 'http://localhost:8500/0',
      chainId: 2500,
      accounts: {
        mnemonic: keys.mnemonic1
      }
    }
  },
  settings: {
    viaIR: true,
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
    only: [':TokenFacet$'],
    rename: () => 'TokenFacet.abi',
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
    only: [':AxelarFacet$'],
    rename: () => 'AxelarFacet.abi',
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
    only: [':HyperlaneFacet$'],
    rename: () => 'HyperlaneFacet.abi',
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
    only: [':LayerzeroFacet$'],
    rename: () => 'LayerzeroFacet.abi',
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
    only: [':WormholeFacet$'],
    rename: () => 'WormholeFacet.abi',
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
