// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibTasks.sol";

contract QuestboardFacet {
    function getParticipantTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].participantTasks.length;
    }

    function getAuditParticipantTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].auditParticipantTasks.length;
    }

    function getAgreedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].agreedTasks.length;
    }

    function getAuditAgreedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].auditAgreedTasks.length;
    }

    function getCompletedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].completedTasks.length;
    }

    function getAuditCompletedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].auditCompletedTasks.length;
    }

    function getCustomerRatingsCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].customerRatings.length;
    }

    function getPerformerRatingsCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].performerRatings.length;
    }

    function getCustomerAgreedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].customerAgreedTasks.length;
    }

    function getPerformerAuditedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].performerAuditedTasks.length;
    }

    function getCustomerAuditedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].customerAuditedTasks.length;
    }

    function getCustomerCompletedTasksCount(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].customerCompletedTasks.length;
    }

    function getSpentTokenBalance(address account, string memory tokenName) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].spentTokenBalances[tokenName];
    }

    function getEarnedTokenBalance(address account, string memory tokenName) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[account].earnedTokenBalances[tokenName];
    }
}