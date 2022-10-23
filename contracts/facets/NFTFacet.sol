// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

import "./ERC5633Demo.sol";

import "hardhat/console.sol";
// Example library to show a simple example of diamond storage

contract NFTFacet is ERC5633Demo {
    event MintedNFTEvent(uint256 _type, string _uri, address to);
    // ERC5633Demo erc5633;

    // constructor(){
    //     erc5633 = new ERC5633Demo();
    // }

   function mintAuditorNFT(uint256 nftType) external {
        // string memory _uri = 'https://devopsdao';
        // uint256 _type = ERC1155MixedFungibleMintable.create(_uri);
        // uint256 nftType = 5;
        uint256 amount = 1;
        string memory data = "test2";
        mint(msg.sender, nftType, amount, bytes(data));
        // event(_type, _uri, msg.sender);
    }

    // function balanceOf(address account, uint256 id) public override view returns (uint256) {
    //     require(account != address(0), "ERC1155: address zero is not a valid owner");
    //     // erc5633 = new ERC5633Demo();
    //     uint256 balance = erc5633.balanceOf(account, id);
    //     console.log(balance);
    //     return balance;
    // }
}
