// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import {LibDiamond} from "../libraries/LibDiamond.sol";
// import "../libraries/LibTasks.sol";
import "../libraries/LibTokens.sol";
import "../libraries/LibTokenData.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../interfaces/IERC1155.sol";
// import "../interfaces/IERC1155Receiver.sol";

import "hardhat/console.sol";

contract TokenDataFacet {


    function uri(uint256 id_) public view returns (string memory) {
        return LibTokenData.uri(id_);
    }

    function uriOfBatch(uint256[] calldata ids_) external view virtual returns (string[] memory) {
        return LibTokenData.uriOfBatch(ids_);
    }

    function uriOfBatchName(string[] calldata names_) external view virtual returns (string[] memory) {
        return LibTokenData.uriOfBatchName(names_);
    }

    function totalSupply(uint256 id_) external view virtual returns (uint256) {
        return LibTokenData.totalSupply(id_);
    }

    function totalSupplyOfNfType(uint256 id_) external view virtual returns (uint256) {
        return LibTokenData.totalSupplyOfNfType(id_);
    }

    function totalSupplyOfName(
        string calldata name_
    ) external view virtual returns (uint256) {
        return LibTokenData.totalSupplyOfName(name_);
    }

    function exists(uint256 id_) external view virtual returns (bool) {
        return LibTokenData.exists(id_);
    }

    function existsNfType(uint256 id_) external view virtual returns (bool) {
        return LibTokenData.existsNfType(id_);
    }

    function existsName(string calldata name_) external view virtual returns (bool) {
        return LibTokenData.existsName(name_);
    }

    function getTokenBaseType(
        string calldata _name
    ) external view virtual returns (uint256) {
      return LibTokenData.getTokenBaseType(_name);
    }

    function getTokenName(
        uint256 _id
    ) external view virtual returns (string memory) {
      return LibTokenData.getTokenName(_id);
    }

    function getTokenIds(
        address _owner
    ) external view virtual returns (uint256[] memory) {
      return LibTokenData.getTokenIds(_owner);
    }

    function getTokenNames(
        address _owner
    ) external view virtual returns (string[] memory) {
      return LibTokenData.getTokenNames(_owner);
    }

    function totalSupplyOfBatch(
        uint256[] calldata _ids
    ) external view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatch(_ids);
    }

    function totalSupplyOfBatchNfType(
        uint256[] calldata _ids
    ) external view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatchNfType(_ids);
    }

    function totalSupplyOfBatchName(
        string[] calldata _names
    ) external view virtual returns (uint256[] memory) {
        return LibTokenData.totalSupplyOfBatchName(_names);
    }
    
    function balanceOfNfType(
        address account_,
        uint256 id_
    ) external view returns (uint256) {
        return LibTokenData.balanceOfNfType(account_, id_);
    }

    function balanceOfName(
        address account_,
        string calldata name_
    ) public view returns (uint256) {
        return LibTokenData.balanceOfName(account_, name_);
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

}
