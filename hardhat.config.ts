/* global ethers task */
// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
// require("@sebasgoldberg/hardhat-wsprovider");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("hardhat-interface-generator");
require("solidity-coverage");
// require("hardhat-gas-reporter");
require("hardhat-tracer");
require("hardhat-abi-exporter");
require("@openzeppelin/test-helpers");
// const { ethers } = require("ethers");
// require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");

require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-solc");

require("./scripts/accounts.js");
require("./scripts/deploy.js");
// require("./scripts/hardhat-tasks-diamond.js");
require("./scripts/hardhat-tasks-dodao.js");
require("./scripts/hardhat-tasks-nft.js");
require("./scripts/witnet.js");

const fs = require("fs");



// You need to export an object to set up your config
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import { HardhatUserConfig } from 'hardhat/config';

let keys;

const keysJSON = fs.readFileSync(`./keys.json`);
keys = JSON.parse(keysJSON);
// console.log(keys)

// let key = ethers.Wallet.fromMnemonic(MNEMONIC);
// console.log(key);

module.exports = {
  solidity: "0.8.17",
  zksolc: {
    version: "1.3.5",
    compilerSource: "binary",
    settings: {},
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    tanssi: {
      url: "https://fraa-dancebox-3041-rpc.a.dancebox.tanssi.network", // URL of the zkSync network RPC
      ethNetwork: "dodao", // Can also be the RPC URL of the Ethereum network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: false,
      chainId: 855456,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
    },
    zkSyncTestnet: {
      url: "https://zksync2-testnet.zksync.dev", // URL of the zkSync network RPC
      ethNetwork: "goerli", // Can also be the RPC URL of the Ethereum network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      chainId: 280,
      zksync: true,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
    },
    moonbase: {
      url: `https://moonbase-alpha.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f`,
      // url: `https://moonbeam-alpha.api.onfinality.io/rpc?apikey=a574e9f5-b1db-4984-8362-89b749437b81`,
      // url: "https://rpc.api.moonbase.moonbeam.network",
      // url: "https://moonbase.unitedbloc.com:1000",
      // url: 'https://moonbeam-mainnet.gateway.pokt.network/v1/lb/629a2b5650ec8c0039bb30f0',
      chainId: 1287,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      witnet: true,
      // mnemonic: MNEMONIC
    },
    // goerli: {
    //   // url: 'https://rpc.ankr.com/eth_goerli',
    //   // url: 'https://goerli.infura.io/v3/8fc30a844b8e42e794f1410dd02bc19e',
    //   url: "https://eth-sepolia.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f",
    //   chainId: 5,
    //   accounts: {
    //     mnemonic: keys.mnemonic1,
    //   },
    //   zksync: false,
    //   witnet: false,
    //   // mnemonic: MNEMONIC
    // },
    mumbai: {
      // url: `https://moonbase-alpha.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f`,
      // url: `https://moonbeam-alpha.api.onfinality.io/rpc?apikey=a574e9f5-b1db-4984-8362-89b749437b81`,
      // url: "https://polygon-mumbai.g.alchemy.com/v2/-sn0RpRj5k290N7WqZprO5t7awxg3NVT",
      url: "https://polygon-testnet.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f",
      // url: "https://rpc-mumbai.maticvigil.com",
      // url: 'https://moonbeam-mainnet.gateway.pokt.network/v1/lb/629a2b5650ec8c0039bb30f0',
      chainId: 80001,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      witnet: true,
      // mnemonic: MNEMONIC
    },
    ftmTestnet: {
      // url: "https://rpc.testnet.fantom.network",
      url: "https://fantom-testnet.blastapi.io/5adb17c5-f79f-4542-b37c-b9cf98d6b28f",
      chainId: 4002,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      // mnemonic: MNEMONIC
    },
    sonic: {
      url: "https://rpc.sonic.fantom.network/",
      chainId: 64165,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      // mnemonic: MNEMONIC
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      chainId: 534351,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      witnet: false,
      // mnemonic: MNEMONIC
    },
    ethereumSepolia: {
      url: "https://rpc2.sepolia.org/",
      chainId: 11155111,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
      witnet: false,
      // mnemonic: MNEMONIC
    },
    ganache: {
      url: "http://localhost:8500/0",
      chainId: 2500,
      accounts: {
        mnemonic: keys.mnemonic1,
      },
      zksync: false,
    },
    localhost: {
      chainId: 31337,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      ftmTestnet: keys.ftmscan,
      "Fantom Sonic Testnet": "lore-public" // api key is not required for contract verification

    },
    customChains: [
      {
        network: "Fantom Sonic Testnet",
        chainId: 64165,
        urls: {
          apiURL: " https://api.lorescan.com/64165",
          browserURL: "https://sonicscan.io/"
        }
      }
    ]
  },
  settings: {
    viaIR: true,
    optimizer: {
      enabled: true,
      runs: 1000,
      details: { yul: false },
    },

    contractSizer: {
      alphaSort: true,
      disambiguatePaths: false,
      runOnCompile: true,
      strict: true,
      // only: [':ERC20$'],
    },
  },
  abiExporter: [
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
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
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":TaskContract$"],
      rename: () => "TaskContract.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":TaskCreateFacet$"],
      rename: () => "TaskCreateFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":TaskDataFacet$"],
      rename: () => "TaskDataFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":AccountFacet$"],
      rename: () => "AccountFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":TokenFacet$"],
      rename: () => "TokenFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":TokenDataFacet$"],
      rename: () => "TokenDataFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":AxelarFacet$"],
      rename: () => "AxelarFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":HyperlaneFacet$"],
      rename: () => "HyperlaneFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":LayerzeroFacet$"],
      rename: () => "LayerzeroFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":WormholeFacet$"],
      rename: () => "WormholeFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":WitnetFacet$"],
      rename: () => "WitnetFacet.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":IERC165$"],
      rename: () => "IERC165.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":IERC20$"],
      rename: () => "IERC20.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":IERC721$"],
      rename: () => "IERC721.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":IERC1155$"],
      rename: () => "IERC1155.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
    {
      // path: '../devopsdao/build/abi',
      path: "../devopsdao/lib/blockchain/abi",
      runOnCompile: true,
      // clear: true,
      // flat: true,
      only: [":IERC1155Enumerable$"],
      rename: () => "IERC1155Enumerable.abi",
      spacing: 2,
      // pretty: true,
      format: "json",
    },
  ],
  mocha: {
    timeout: 1000000000
  },
};
