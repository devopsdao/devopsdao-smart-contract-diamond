# Dodao.dev smart contract

This is Dodao.dev EIP-2535 based smart-contract, with Axelar, Hyperlane, Layerzero and Wormhole integrations, using Witnet Oracle to access Web2.

## Installation

1. Install NPM packages:
```console
npm install
```

## Deployment

```console
npx hardhat run scripts/deploy.js
```

### How the scripts/deploy.js script works

The [scripts/deploy.js](scripts/deploy.js) deployment script includes comments to explain how it works.

## Run tests:
```console
npx hardhat test
```

## Upgrade a diamond

Use deploy.js with --upgrade argument

## Facet Information

## Deploying

Please first deploy to Moonbase-alpha, and then to Mumbai network, in order for interchain smart contracts to work out of the box.

This repository contains both standalone interchain contracts in ./contracts/contracts and Diamond interchain facets in ./facets/interchain.

The `scripts/deploy.js` file shows how to deploy a diamond.

Standalone interchain:

`scripts/deploy-axelar.js`to deploy Axelar integration.

`scripts/deploy-hyperlane.js` to deploy Hyperlane integration.

`scripts/deploy-layerzero.js` to deploy Layerzero integration.

`scripts/deploy-wormhole.js` to deploy Wormhole integration.

`scripts/deploy-wormhole.js` to mint NFT tokens.

The `test/diamondTest.js` file gives tests for the `diamondCut` function and the Diamond Loupe functions.


## Author

Dodao.dev team
