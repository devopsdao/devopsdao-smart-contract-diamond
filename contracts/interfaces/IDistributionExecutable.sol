// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

interface IDistributionExecutable {

    /********************\
    |* Public Functions *|
    \********************/

    function sendToMany(
        string calldata destinationChain,
        string memory destinationAddress,
        address[] calldata destinationAddresses,
        string calldata symbol,
        uint256 amount
    ) external payable;
}
