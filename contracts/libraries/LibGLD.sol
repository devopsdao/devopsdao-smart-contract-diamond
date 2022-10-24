// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import {LibStorage, AppStorage, ArtefactType} from "./LibStorage.sol";
// import "@solidstate/contracts/token/ERC1155/base/ERC1155BaseStorage.sol";
// // import {ERC1155Facet} from "../facets/ERC1155Facet.sol";
// import "../facets/ERC1155Facet.sol";
// import "./LibERC1155Internal.sol";

// // Handles all the $GLD token logic
// library LibGLD {
//     //CONSTANTS
//     uint256 constant GLD_ID = 0;

//     //STORAGE GETTERS:
//     // common storage
//     function s() internal pure returns (AppStorage storage) {
//         return LibStorage.diamondStorage();
//     }

//     //erc1155 storage (NOTE: you should prefer calling LibERC1155, but it can be usefull)
//     function s1155() internal pure returns (ERC1155BaseStorage.Layout storage) {
//         return ERC1155BaseStorage.layout();
//     }


//     //GLD LOGIC
//     function _getBalance(address addr) internal view returns (uint256) {
//         return LibERC1155Internal._balanceOf(addr, GLD_ID);
//     }

//     function _mint(address to, uint256 amount) internal {
//         LibERC1155Internal._mint(to, GLD_ID, amount, "");
//     }

//     // ...
// }