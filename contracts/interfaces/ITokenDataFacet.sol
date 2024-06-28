// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITokenDataFacet {
    function uri(uint256 id_) external view returns (string memory);
    function uriOfBatch(uint256[] calldata ids_) external view returns (string[] memory);
    function uriOfBatchName(string[] calldata names_) external view returns (string[] memory);
    function totalSupply(uint256 id_) external view returns (uint256);
    function totalSupplyOfNfType(uint256 id_) external view returns (uint256);
    function totalSupplyOfName(string calldata name_) external view returns (uint256);
    function exists(uint256 id_) external view returns (bool);
    function existsNfType(uint256 id_) external view returns (bool);
    function existsName(string calldata name_) external view returns (bool);
    function getTokenBaseType(string calldata _name) external view returns (uint256);
    function getTokenName(uint256 _id) external view returns (string memory);
    function getTokenNames(uint256[] calldata _ids) external view returns (string[] memory);
    function tokensByAccount(address _owner) external view returns (uint256[] memory);
    function getTokenIds(address _owner) external view returns (uint256[] memory);
    function getTokenNames(address _owner) external view returns (string[] memory);
    function getCreatedTokenNames() external view returns (string[] memory);
    function totalSupplyOfBatch(uint256[] calldata _ids) external view returns (uint256[] memory);
    function totalSupplyOfBatchNfType(uint256[] calldata _ids) external view returns (uint256[] memory);
    function totalSupplyOfBatchName(string[] calldata _names) external view returns (uint256[] memory);
    function balanceOfNfType(address account_, uint256 id_) external view returns (uint256);
    function balanceOfName(address account_, string calldata name_) external view returns (uint256);
    function balanceOfBatchNfType(address[] calldata accounts_, uint256[] calldata ids_) external view returns (uint256[] memory);
    function balanceOfBatchName(address[] calldata accounts_, string[] calldata names_) external view returns (uint256[] memory);
}