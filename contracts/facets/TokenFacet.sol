// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from "../libraries/LibDiamond.sol";
// import "../libraries/LibTasks.sol";
import "../libraries/LibTokens.sol";
import "../libraries/LibTokenData.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../interfaces/IERC1155.sol";
import "../interfaces/IERC1155Receiver.sol";

import "hardhat/console.sol";

contract TokenFacet is ERC1155StorageFacet, IERC1155 {

    function name() public pure returns(string memory){
        return "dodao.dev token";
    }

    function symbol() public pure returns(string memory){
        return "dodao";
    }


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

    function mintNonFungibleByName(
        string calldata _name,
        address[] calldata _to
    ) public {
        LibTokens.mintNonFungibleByName(_name, _to);
    }

    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) public {
        LibTokens.mintFungible(_id, _to, _quantities);
    }

    function mintFungibleByName(
        string calldata _name,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) public {
        LibTokens.mintFungibleByName(_name, _to, _quantities);
    }

    function setURI(
        string calldata _uri,
        uint256 _id
    ) public {
        LibTokens.setURI(_uri, _id);
    }

    function setURIOfName(
        string calldata _uri,
        string calldata _name
    ) external {
        LibTokens.setURIOfName(_uri, _name);
    }

    function uri(uint256 id_) public view virtual returns (string memory) {
        return LibTokenData.uri(id_);
    }

    function uriOfBatch(uint256[] calldata ids_) public view virtual returns (string[] memory) {
        return LibTokenData.uriOfBatch(ids_);
    }

    function uriOfBatchName(string[] calldata names_) public view virtual returns (string[] memory) {
        return LibTokenData.uriOfBatchName(names_);
    }

    function totalSupply(uint256 id_) public view virtual returns (uint256) {
        return LibTokenData.totalSupply(id_);
    }

    function totalSupplyOfNfType(uint256 id_) public view virtual returns (uint256) {
        return LibTokenData.totalSupplyOfNfType(id_);
    }

    function totalSupplyOfName(
        string calldata name_
    ) public view virtual returns (uint256) {
        return LibTokenData.totalSupplyOfName(name_);
    }

    function exists(uint256 id_) public view virtual returns (bool) {
        return LibTokenData.exists(id_);
    }

    function existsNfType(uint256 id_) public view virtual returns (bool) {
        return LibTokenData.existsNfType(id_);
    }

    function existsName(string calldata name_) public view virtual returns (bool) {
        return LibTokenData.existsName(name_);
    }

    function getTokenId(
        string calldata _name
    ) public view virtual returns (uint256) {
      return LibTokenData.getTokenId(_name);
    }

    function totalSupplyOfBatch(
        uint256[] calldata _ids
    ) public view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatch(_ids);
    }

    function totalSupplyOfBatchNfType(
        uint256[] calldata _ids
    ) public view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatchNfType(_ids);
    }

    function totalSupplyOfBatchName(
        string[] calldata _names
    ) public view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatchName(_names);
    }

    function balanceOf(
        address account_,
        uint256 id_
    ) public view returns (uint256) {
        return LibTokenData.balanceOf(account_, id_);
    }
    
    function balanceOfNfType(
        address account_,
        uint256 id_
    ) public view returns (uint256) {
        return LibTokenData.balanceOfNfType(account_, id_);
    }

    function balanceOfName(
        address account_,
        string calldata name_
    ) public view returns (uint256) {
        return LibTokenData.balanceOfName(account_, name_);
    }

    function balanceOfBatch(
        address[] calldata accounts_,
        uint256[] calldata ids_
    ) external view returns (uint256[] memory) {
        return LibTokenData.balanceOfBatch(accounts_, ids_);
    }

    function balanceOfBatchNfType(
        address[] calldata accounts_,
        uint256[] calldata ids_
    ) external view returns (uint256[] memory) {
        return LibTokenData.balanceOfBatchNfType(accounts_, ids_);
    }

    function balanceOfBatchName(
        address[] calldata accounts_,
        string[] calldata names_
    ) external view returns (uint256[] memory) {
        return LibTokenData.balanceOfBatchName(accounts_, names_);
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
