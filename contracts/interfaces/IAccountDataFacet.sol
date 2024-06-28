// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

struct AccountData {
    address accountOwner;
    string nickname;
    string about;
    address[] ownerTasks;
    address[] participantTasks;
    address[] auditParticipantTasks;
    address[] agreedTasks;
    address[] auditAgreedTasks;
    address[] completedTasks;
    address[] auditCompletedTasks;
    uint256[] customerRatings;
    uint256[] performerRatings;
    address[] customerAgreedTasks;
    address[] performerAuditedTasks;
    address[] customerAuditedTasks;
    address[] customerCompletedTasks;
    string[] spentTokenNames;
    uint256[] spentTokenBalances;
    string[] earnedTokenNames;
    uint256[] earnedTokenBalances;
}


interface IAccountDataFacet {

    function getAccountsList() external view returns (address[] memory);
    function getAccountsBlacklist() external view returns (address[] memory);
    function getRawAccountsList() external view returns (address[] memory);
    function getRawAccountsCount() external view returns (uint256);
    function getAccountsData(address[] memory accountAddresses) external view returns (AccountData[] memory);
    function getIdentitiesAddresses(string[] memory identities) external view returns (address[] memory);
}