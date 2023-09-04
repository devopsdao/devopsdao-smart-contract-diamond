// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITokenFacet {
function create(
        string calldata _uri,
        bool _isNF
    ) external returns (uint256 _type);

    function mintNonFungible(
        uint256 _type,
        address[] calldata _to
    ) external;

    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) external;

    function uri(uint256 tokenID_) external view returns (string memory);

    function totalSupply(uint256 id_) external view returns (uint256);

    function exists(uint256 id_) external view returns (bool);

    function balanceOf(
        address account_,
        uint256 id_
    ) external view returns (uint256);

    function balanceOfBatch(
        address[] calldata accounts_,
        uint256[] calldata ids_
    ) external view returns (uint256[] memory);

    function setApprovalForAll(address operator_, bool approved_) external;

    function isApprovedForAll(
        address account_,
        address operator_
    ) external view returns (bool);

    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        uint256 amount_,
        bytes calldata data_
    ) external;

    function safeBatchTransferFrom(
        address from_,
        address to_,
        uint256[] calldata ids_,
        uint256[] calldata amounts_,
        bytes calldata data_
    ) external;

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4);
}