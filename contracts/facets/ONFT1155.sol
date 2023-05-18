// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.0;

// import "../interfaces/IONFT1155.sol";
// import "@layerzerolabs/solidity-examples/contracts/token/onft/ONFT1155Core.sol";
// import "./TokenFacet.sol";

// // NOTE: this ONFT contract has no public minting logic.
// // must implement your own minting logic in child classes
// contract ONFT1155 is ONFT1155Core, TokenFacet, IONFT1155 {
//     constructor(string memory _uri, address _lzEndpoint) TokenFacet(_uri) ONFT1155Core(_lzEndpoint) {}

//     function supportsInterface(bytes4 interfaceId) public view virtual override(ONFT1155Core, TokenFacet, IERC165) returns (bool) {
//         return interfaceId == type(IONFT1155).interfaceId || super.supportsInterface(interfaceId);
//     }

//     function _debitFrom(address _from, uint16, bytes memory, uint[] memory _tokenIds, uint[] memory _amounts) internal virtual override {
//         address spender = _msgSender();
//         require(spender == _from || isApprovedForAll(_from, spender), "ONFT1155: send caller is not owner nor approved");
//         _burnBatch(_from, _tokenIds, _amounts);
//     }

//     function _creditTo(uint16, address _toAddress, uint[] memory _tokenIds, uint[] memory _amounts) internal virtual override {
//         _mintBatch(_toAddress, _tokenIds, _amounts, "");
//     }
// }
