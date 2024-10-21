// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibTasks.sol";
import "../contracts/TaskContract.sol";

contract QuestboardFacet {

    bool public constant contractQuestboardFacet = true;

    // Existing functions
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



    function getCurrentDateStartTimestamp() internal view returns (uint256) {
        return (block.timestamp / 86400) * 86400; // Start of the current day
    }

    function getLastSevenDaysStartTimestamp() internal view returns (uint256) {
        uint256 currentTimestamp = block.timestamp;
        return currentTimestamp - (7 * 86400); // Start of the last 7 days
    }

    // function isTaskRelevantToday(address taskAddress) internal view returns (bool) {
    //     Task memory task = TaskContract(payable(taskAddress)).getTaskData();
    //     uint256 todayStart = getLastSevenDaysStartTimestamp();
        
    //     if (task.messages.length > 0) {
    //         return task.messages[task.messages.length - 1].timestamp >= todayStart;
    //     } else {
    //         return task.createTime >= todayStart;
    //     }
    // }

    function isTaskRelevantToday(address taskAddress) internal view returns (bool) {
        Task memory task = TaskContract(payable(taskAddress)).getTaskData();
        uint256 todayStart = getLastSevenDaysStartTimestamp();
        uint256 relevantTimestamp;

        if (task.messages.length > 0) {
            relevantTimestamp = task.messages[task.messages.length - 1].timestamp;
        } else {
            relevantTimestamp = task.createTime;
        }

        // Add a small buffer (1 hour) to account for potential time discrepancies
        return relevantTimestamp >= todayStart - 1 hours;
    }

    function getCustomerCreatedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].ownerTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].ownerTasks[i])) {
                count++;
            }
        }
        return count;
    }


    function getParticipantTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].participantTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].participantTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getAuditParticipantTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].auditParticipantTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].auditParticipantTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getAgreedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].agreedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].agreedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getAuditAgreedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].auditAgreedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].auditAgreedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getCompletedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].completedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].completedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getAuditCompletedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].auditCompletedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].auditCompletedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getCustomerAgreedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].customerAgreedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].customerAgreedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getPerformerAuditedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].performerAuditedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].performerAuditedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getCustomerAuditedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].customerAuditedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].customerAuditedTasks[i])) {
                count++;
            }
        }
        return count;
    }

    function getCustomerCompletedTasksCountToday(address account) external view returns (uint256) {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 count = 0;
        for (uint256 i = 0; i < _storage.accounts[account].customerCompletedTasks.length; i++) {
            if (isTaskRelevantToday(_storage.accounts[account].customerCompletedTasks[i])) {
                count++;
            }
        }
        return count;
    }

}