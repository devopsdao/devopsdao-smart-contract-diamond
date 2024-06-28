// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibTasks.sol";
import "../interfaces/IAccountDataFacet.sol";

contract AccountDataFacet {
    bool public constant contractAccountDataFacet = true;


    function getAccountsList()
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // return _storage.accountsList;
        // for (uint256 i = 0; i < _storage.accountsList.length; i++) {
        //     if(_storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false)
        //     {
        //         taskCount++;
        //     }
        // }
        address[] memory accounts = new address[](_storage.accountsList.length - _storage.accountsBlacklist.length);
        uint256 accountId = 0;
        for (uint256 i = 0; i < _storage.accountsList.length; i++) {
            if(_storage.accountsBlacklistMapping[_storage.accountsList[i]] == false)
            {
                accounts[accountId] = _storage.accountsList[i];
                accountId++;
            }
        }
        return accounts;
    }

    function getAccountsBlacklist()
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accountsBlacklist;
    }

    function getRawAccountsList()
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accountsList;
    }

    function getRawAccountsCount()
    external
    view
    returns (uint256)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accountsList.length;
    }

    function getAccountsData(address[] memory accountAddresses) external view returns (AccountData[] memory) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        AccountData[] memory accountsData = new AccountData[](accountAddresses.length);

        for (uint256 i = 0; i < accountAddresses.length; i++) {
            Account storage account = _storage.accounts[accountAddresses[i]];

            uint256[] memory spentBalances = new uint256[](account.spentTokenNames.length);
            for (uint256 j = 0; j < account.spentTokenNames.length; j++) {
                spentBalances[j] = account.spentTokenBalances[account.spentTokenNames[j]];
            }

            uint256[] memory earnedBalances = new uint256[](account.earnedTokenNames.length);
            for (uint256 j = 0; j < account.earnedTokenNames.length; j++) {
                earnedBalances[j] = account.earnedTokenBalances[account.earnedTokenNames[j]];
            }

            accountsData[i] = AccountData(
                account.accountOwner,
                account.identity,
                account.about,
                account.ownerTasks,
                account.participantTasks,
                account.auditParticipantTasks,
                account.agreedTasks,
                account.auditAgreedTasks,
                account.completedTasks,
                account.auditCompletedTasks,
                account.customerRatings,
                account.performerRatings,
                account.customerAgreedTasks,
                account.performerAuditedTasks,
                account.customerAuditedTasks,
                account.customerCompletedTasks,
                account.spentTokenNames,
                spentBalances,
                account.earnedTokenNames,
                earnedBalances
            );
        }

        return accountsData;
    }


    function getIdentitiesAddresses(string[] memory identities)
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        address[] memory addresses = new address[](identities.length);
        for (uint256 i = 0; i < identities.length; i++) {
            addresses[i] = _storage.identities[identities[i]];
        }
        return addresses;
    }

}