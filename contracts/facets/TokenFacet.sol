// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "../libraries/LibDiamond.sol";
// import "../libraries/LibTasks.sol";
import "../libraries/LibTokens.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../interfaces/IERC1155.sol";
import "../interfaces/IERC1155Receiver.sol";

import "hardhat/console.sol";

contract TokenFacet is ERC1155StorageFacet, IERC1155 {

    function create(
        string calldata _uri,
        string calldata _name,
        bool _isNF
    ) external returns (uint256 _type) {
        return LibTokens.create(_uri, _name, _isNF);
    }
    function mintNonFungible(
        uint256 _type,
        address[] calldata _to
    ) public {
        LibTokens.mintNonFungible(_type, _to);
    }

    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) public {
        LibTokens.mintFungible(_id, _to, _quantities);
    }

    function uri(uint256 tokenID_) public view virtual returns (string memory) {
        return LibTokens.uri(tokenID_);
    }

    function totalSupply(uint256 id_) public view virtual returns (uint256) {
        return LibTokens.totalSupply(id_);
    }

    function exists(uint256 id_) public view virtual returns (bool) {
        return LibTokens.exists(id_);
    }

    function balanceOf(
        address account_,
        uint256 id_
    ) public view returns (uint256) {
        return LibTokens.balanceOf(account_, id_);
    }

    function balanceOfBatch(
        address[] calldata accounts_,
        uint256[] calldata ids_
    ) external view returns (uint256[] memory) {
        return LibTokens.balanceOfBatch(accounts_, ids_);
    }

    function balanceOfName(
        address account_,
        string calldata name_
    ) public view returns (uint256) {
        return LibTokens.balanceOfName(account_, name_);
    }

    function setApprovalForAll(address operator_, bool approved_) external {
        LibTokens.setApprovalForAll(operator_, approved_);
    }

    function isApprovedForAll(
        address account_,
        address operator_
    ) public view returns (bool) {
        return LibTokens.isApprovedForAll(account_, operator_);
    }

    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes calldata data_
    ) external {
        LibTokens.safeTransferFrom(from_, to_, id_, amount_, data_);
    }

    function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] calldata ids_,
        uint256[] calldata amounts_,
        bytes calldata data_
    ) external {
        LibTokens.safeBatchTransferFrom(from_, to_, ids_, amounts_, data_);
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }
}
