# dodao.dev EIP-2535 Diamond smart contract

    TLDR;

> I will describe below how we useful was Diamonds standard to implement
> dodao Task management, mint ERC-1155 tokens, connect Diamonds between
> multiple EVM chains and call github Web2 API.

  ## motivation to use Diamonds

When starting developing [Dodao.dev](https://dodao.dev) we had a proof-of-concept smart contract which was quite simple and non-upgradable.

At the step of MVP development, I have started researching EIPs to find a best way to manage contract upgradability and came across [EIP-2535 Diamond standard](https://eips.ethereum.org/EIPS/eip-2535) draft which was in the **`last call`** state at that moment.

Diamonds EIP is giving you the idea of Diamonds itself and the technology behind it, so it was a great booster for me to get familiar with in-depth solidity features such as `DELEGATECALL` which is used to redirect function calls from main Diamond contract to its Facets and storage structs on which Diamond Storage is based on.

Diamond consists of diamond facade contract and its facets.
Diamonds rely on the feature of `DELEGATECALL`, which executes the remote smart contracts code in the caller smart contract storage context.

`A -> Diamond -> Facet (delegatecall) msg.sender = A (updates happen on Diamond's storage)`
[More..](https://blog.cryptostars.is/solidity-call-and-delegatecall-function-17b483a3c538)

The facade Diamond is usually generic and `DELEGATECALL`s into its facets to implementation specific function calls.

> Diamond storage relies on Solidity structs that contain sets of state
> variables that are easy to read and write. A struct can be defined
> with state variables and then used in a particular position in
> contract storage. The position can be determined by a hash of a unique
> string. [More..](https://dev.to/mudgen/how-diamond-storage-works-90e)

## How I have started

For dodao project I have taken [EIP-2535 Diamond-1 reference implementation](https://eips.ethereum.org/assets/eip-2535/reference/EIP2535-Diamonds-Reference-Implementation.zip), which provides Diamond facade, Diamond init used for facet deployment and upgrades, DiamondCut facet for used for adding and removing facet functions from the Diamond, OwnerShip facet which maintains contract ownership and Louper facet which allows Diamond inspection. **Diamond-1 reference implementation** is the generic, not very optimized Diamond implementation which is easy to understand, there are also Diamond-2 and Diamond-3 implementations which [optimize Diamond Cuts and Louper functions for different use cases](https://github.com/mudgen/diamond).

Diamond reference implementation deploy scripts and tests are written for **hardhat**, I have modified it to include project specific facets and added functions for facets add, upgrade and removal and exposed it as Hardhat tasks to be used from CLI. To minimize facets size in order to fit into [24KB EVM limitation](https://ethereum.org/en/developers/tutorials/downsizing-contracts-to-fight-the-contract-size-limit/) I have implemented facet library linking and deployment. There is a great [hardhat contract-sizer](https://www.npmjs.com/package/hardhat-contract-sizer)  plugin which allows monitoring your facets sizes.

Additionally I have added functions to [programmatically verify deployed contracts](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#using-programmatically).

  

> Louper facet allows inspecting Diamonds programmatically both on and
> off-chain. There is a great project [louper.dev](louper.dev) which allows Diamond
> inspection from your web browser.

  

Diamonds standard allows **flexible smart contract development**, by keeping the main Diamond facade contract as a single entry point address and allowing deploy required facets when it is ready.

  
## how Dodao Diamond looks like
> dodao.dev is a decentralized and permission-less task marketplace for
> tech talents and art creators, and relies on several facet and library
> groups implementing its on-chain functionality, which are constantly
> being developed and upgraded while keeping the simple and maintainable
> code structure.

  

### Task and user account facets:

**TaskCreateFacet.sol** - creates non-upgradable Task contracts, which are not linked to the Diamond directly, use their own storage and use `CALL`s to push necessary data back to the main diamond.

**TaskDataFacet.sol** - contains functions which read Tasks data from the Task contracts created by `TaskCreateFacet`, it also manages Task contracts blacklist.

**LibTasks.sol** and **LibTasksAudit.sol** - provide underlying functions for the above facets.

**LibChat.sol** - provides in-Task chat functions.

**AccountsFacet.sol** - manages user accounts, it is being called by Task contracts when a user participates or completes the Task, it also manages Accounts blacklist.

  

### Token facets:

**TokenFacet.sol** - creates ERC-1155 compatible fungible and non-fungible(NFT) tokens, its implementation is based on Enjin reference implementation rewritten to use Diamond storage and some project-specific functions and features added. When I have rewrote the original Enjin ERC-1155 test for this implementation it was amazing to see that it has finally passed!

**LibTokens.sol** - provides underlying functions for the `TokenFacet` facet.

**TokenDataFacet.sol** - contains more project specific functions, again with Diamonds you can easily distribute necessary functions between several facets to maintain the 24KB EVM limitation.

**LibTokenData.sol** - provides underlying functions for the `TokenDataFacet` facet.

  

> The only drawback of using a Diamond for ERC-1155 tokens is that only
> one token ticker(name) can be set for a single contract address, it
> can be mitigated by creating several Diamonds sharing the same facets.

  

### Connected contracts facets:

**InterchainFacet.sol** - implements [Moonbeam Connected contracts](https://moonbeam.network/blog/cross-chain-smart-contracts/) concept by enabling connection with Axelar/Hyperlane/LayerZero and Wormhole omnichain protocols. Diamond concept of facede contract and Diamond Storage for protocol specific configuration simplified the implementation of the idea to connect contracts between different chains a lot, it is always much easier to know that there is a single static contract address on every chain to be called, which enables better maintainability and security.

**LibTokenData.sol** - provides underlying functions for the `Interchain` facet.

**LibUtils.sol** - provide some generic functions to be reused by multiple facets.

  

### Witnet oracle facets:

**WitnetFacet.sol** - implements the connection with [Witnet oracles](https://docs.witnet.io/) to query Github repository data used to automatically sign Task review.

**LibWitnetRequest.sol** - provides underlying functions for the `WitnetFacet` facet.

Feel free to clone, fork, reuse or contribute to [dodao smart contract diamond](https://github.com/devopsdao/devopsdao-smart-contract-diamond).
  
  

All the facets use and share several Diamond storages and an AppStorage(it is not recommended to mix Diamond storage and contract storage because of the way how solidity stores data in structs), Diamond storage allows great flexibility of storing and accessing data as the data at a certain pointer can be access from every facet linked to the Diamond.

  
  

    thanks for reading, we hope it’s a TS;WM xD
    
