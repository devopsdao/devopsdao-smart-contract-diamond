// // SPDX-License-Identifier: CC0-1.0
// pragma solidity ^0.8.9;

// // import "./ERC5633Demo.sol";
// import "@solidstate/contracts/token/ERC1155/SolidStateERC1155.sol";

// // import "../libraries/LibNFT.sol";

// import "hardhat/console.sol";
// // Example library to show a simple example of diamond storage

// contract NFTFacet is SolidStateERC1155{
//     event MintedNFTEvent(uint256 nftType, string _uri, address to);
//     // ERC5633Demo erc5633;

//     // constructor(){
//     //     erc5633 = new ERC5633Demo();
//     // }

// //    function mintAuditorNFT(uint256 nftType) external {
// //         // string memory _uri = 'https://devopsdao';
// //         // uint256 _type = ERC1155MixedFungibleMintable.create(_uri);
// //         // uint256 nftType = 5;
// //         uint256 amount = 1;
// //         string memory data = "test2";
// //         _mint(msg.sender, nftType, amount, bytes(data));
// //         // event(_type, _uri, msg.sender);
// //     }

//     // function balanceOf(address addr, uint256 nftType) public view returns (uint256) {
//     //     // return balanceOf(addr, nftType)
//     //     return 0;
//     // }

//     // function balanceOf(address account, uint256 id) public override view returns (uint256) {
//     //     require(account != address(0), "ERC1155: address zero is not a valid owner");
//     //     // erc5633 = new ERC5633Demo();
//     //     uint256 balance = erc5633.balanceOf(account, id);
//     //     console.log(balance);
//     //     return balance;
//     // }
// }
