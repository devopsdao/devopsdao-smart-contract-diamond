// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct ERC1155FacetStorage {
  mapping(uint256 => mapping(address => uint256)) balances;
  mapping(address => mapping(address => bool)) operatorApproval;
  mapping(uint256 => uint256) totalSupply;
  mapping(uint256 => uint256) nfTypeSupply; //total supply of nf tokens of a type
  string baseURI;
  mapping(uint256 => string) tokenURIs;
  // uint256 idx;
  mapping (string => uint) tokenNames;
  mapping (string => uint) nfType;
  mapping(uint256 => address) nfOwners;
  mapping (uint256 => address) creators;
  uint256 nonce; // A nonce to ensure we have a unique id each time we mint.
  mapping (uint256 => uint256) maxIndex;
  bool shouldReject;
}
