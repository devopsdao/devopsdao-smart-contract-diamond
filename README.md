# Devopsdao smart contract

This is Devopsdao EIP-2535 based smart-contract, with Axelar, Hyperlane, Layerzero and Wormhole integrations.

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

**Note:** In this implementation the loupe functions are NOT gas optimized. The `facets`, `facetFunctionSelectors`, `facetAddresses` loupe functions are not meant to be called on-chain and may use too much gas or run out of gas when called in on-chain transactions. In this implementation these functions should be called by off-chain software like websites and Javascript libraries etc., where gas costs do not matter as much.

However the `facetAddress` loupe function is gas efficient and can be called in on-chain transactions.

The `contracts/Diamond.sol` file shows an example of implementing a diamond.

The `contracts/facets/DiamondCutFacet.sol` file shows how to implement the `diamondCut` external function.

The `contracts/facets/DiamondLoupeFacet.sol` file shows how to implement the four standard loupe functions.

The `contracts/libraries/LibDiamond.sol` file shows how to implement Diamond Storage and a `diamondCut` internal function.

The `scripts/deploy.js` file shows how to deploy a diamond.
`scripts/deploy-axelar.js`to deploy Axelar integration.
`scripts/deploy-hyperlane.js` to deploy Hyperlane integration.
`scripts/deploy-layerzero.js` to deploy Layerzero integration.
`scripts/deploy-wormhole.js` to deploy Wormhole integration.

`scripts/deploy-wormhole.js` to mint NFT tokens.

The `test/diamondTest.js` file gives tests for the `diamondCut` function and the Diamond Loupe functions.



## Author

Devopsdao team
