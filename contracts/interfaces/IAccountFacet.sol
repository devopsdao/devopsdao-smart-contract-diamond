// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IAccountFacet {

    function addAccountToBlacklist(address accountAddress) external;
    function removeAccountFromBlacklist(address accountAddress) external;
    function addAccountData(address _sender, string calldata identity, string calldata about) external;
    function addParticipantTask(address _sender, address taskAddress) external;
    function addAuditParticipantTask(address _sender, address taskAddress) external;
    function addAgreedTask(address _performer, address taskAddress) external;
    function addPerformerAgreedTask(address _sender, address taskAddress) external;
    function addCustomerAgreedTask(address _sender, address taskAddress) external;
    function addAuditAgreedTask(address _sender, address taskAddress) external;
    function addPerformerAuditedTask(address _sender, address taskAddress) external;
    function addCustomerAuditedTask(address _sender, address taskAddress) external;
    function addCompletedTask(address _performer, address _customer, address taskAddress) external;
    function addPerformerCompletedTask(address _sender, address taskAddress) external;
    function addCustomerCompletedTask(address _sender, address taskAddress) external;
    function addAuditCompletedTask(address _sender, address taskAddress) external;
    function addPerformerRating(address _account, address taskAddress, uint256 rating) external;
    function addCustomerRating(address _account, address taskAddress, uint256 rating) external;
    function addPerformerSpentTokens(address performer, string[] memory tokenNames, uint256[] memory tokenBalances) external;
    function addPerformerEarnedTokens(address performer, string[] memory tokenNames, uint256[] memory tokenBalances) external;
    function addCustomerSpentTokens(address customer, string[] memory tokenNames, uint256[] memory tokenBalances) external;
    function addCustomerEarnedTokens(address customer, string[] memory tokenNames, uint256[] memory tokenBalances) external;
}