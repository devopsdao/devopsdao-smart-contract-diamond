// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';


import "../libraries/LibTasks.sol";
import "../libraries/LibInterchain.sol";
// import "../libraries/LibUtils.sol";

// import "../contracts/TaskContract.sol";
// import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../facets/TokenFacet.sol";
import "../facets/TokenDataFacet.sol";


import "hardhat/console.sol";



contract InterchainFacet  {
    bool public constant contractInterchainFacet = true;

    event InterchainUpdate(address ownerAddr, string message, uint timestamp);

    function getInterchainConfigs()
    external
    view
    returns (ConfigAxelar memory, ConfigHyperlane memory, ConfigLayerzero memory, ConfigWormhole memory)
    {
        InterchainStorage storage _storage = LibInterchain.interchainStorage();
        return (_storage.configAxelar, _storage.configHyperlane, _storage.configLayerzero, _storage.configWormhole);
    }


}

