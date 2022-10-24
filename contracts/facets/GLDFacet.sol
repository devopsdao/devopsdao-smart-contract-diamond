// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.9;
import "../libraries/LibGLD.sol";
import {LibStorage, AppStorage, ArtefactType} from "../libraries/LibStorage.sol";
import {Modifiers} from "../libraries/LibStorage.sol";

contract ArtefactFacet is Modifiers {
    // ----- GETTERS -----
    function getMyGLDBalance(address addr) external view returns (uint256) {
        return LibGLD._getBalance(msg.sender);
    }

    // ...

    // ----- SETTERS -----
    // ...

}
