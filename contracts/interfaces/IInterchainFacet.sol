
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "../libraries/LibInterchain.sol";
    
    interface IInterchainFacet {
        function getInterchainConfigs() external returns(ConfigAxelar memory, ConfigHyperlane memory, ConfigLayerzero memory, ConfigWormhole memory);
    }