// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../contracts/TaskContract.sol";
import "../libraries/LibTasks.sol";

contract TaskStatsFacet {
    bool public constant contractTaskStatsFacet = true;
   function getTaskStatsWithTimestamps(uint256 offset, uint256 limit) external view returns (TaskStatsWithTimestamps memory) {
        TaskStatsWithTimestamps memory stats;

        stats.createTimestamps = new uint256[](limit);
        // stats.newTimestamps = new uint256[](limit);
        // stats.agreedTimestamps = new uint256[](limit);
        // stats.progressTimestamps = new uint256[](limit);
        // stats.reviewTimestamps = new uint256[](limit);
        // stats.completedTimestamps = new uint256[](limit);
        // stats.canceledTimestamps = new uint256[](limit);

        countTasksByState(offset, limit, stats);
        countTasksByType(offset, limit, stats);
        calculateAvgTaskDuration(offset, limit, stats);
        calculateAvgRatings(offset, limit, stats);
        getTopTags(offset, limit, stats);
        getTopTokenNamesAndBalances(offset, limit, stats);

        return stats;
    }

    function countTasksByState(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            // stats.createTimestamps[i] = task.createTime;
            stats.createTimestamps[i - offset] = task.createTime;
            if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_NEW))) {
                stats.countNew++;
                // stats.newTimestamps[stats.countNew - 1] = task.createTime;
            } else if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_AGREED))) {
                stats.countAgreed++;
                // stats.agreedTimestamps[stats.countAgreed - 1] = task.createTime;
            } else if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_PROGRESS))) {
                stats.countProgress++;
                // stats.progressTimestamps[stats.countProgress - 1] = task.createTime;
            } else if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_REVIEW))) {
                stats.countReview++;
                // stats.reviewTimestamps[stats.countReview - 1] = task.createTime;
            } else if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_COMPLETED))) {
                stats.countCompleted++;
                // stats.completedTimestamps[stats.countCompleted - 1] = task.createTime;
            } else if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_CANCELED))) {
                stats.countCanceled++;
                // stats.canceledTimestamps[stats.countCanceled - 1] = task.createTime;
            }
        }
    }

    function countTasksByType(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            if (keccak256(bytes(task.taskType)) == keccak256(bytes(TASK_TYPE_PRIVATE))) {
                stats.countPrivate++;
            } else if (keccak256(bytes(task.taskType)) == keccak256(bytes(TASK_TYPE_PUBLIC))) {
                stats.countPublic++;
            } else if (keccak256(bytes(task.taskType)) == keccak256(bytes(TASK_TYPE_HACKATON))) {
                stats.countHackaton++;
            }
        }
    }

    function calculateAvgTaskDuration(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 totalDuration;
        uint256 completedTaskCount;
        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            if (keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_COMPLETED))) {
                totalDuration += block.timestamp - task.createTime;
                completedTaskCount++;
            }
        }
        if (completedTaskCount > 0) {
            stats.avgTaskDuration = totalDuration / completedTaskCount;
        }
    }

    function calculateAvgRatings(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 totalPerformerRating;
        uint256 totalCustomerRating;
        uint256 ratedTaskCount;
        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            if (task.performerRating > 0) {
                totalPerformerRating += task.performerRating;
                ratedTaskCount++;
            }
            if (task.customerRating > 0) {
                totalCustomerRating += task.customerRating;
                ratedTaskCount++;
            }
        }
        if (ratedTaskCount > 0) {
            stats.avgPerformerRating = totalPerformerRating / ratedTaskCount;
            stats.avgCustomerRating = totalCustomerRating / ratedTaskCount;
        }
    }

    function getTopTags(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        string[] memory tags = new string[](0); // Empty initial array
        uint256[] memory tagCounts = new uint256[](0); // Empty initial array

        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            for (uint256 j = 0; j < task.tags.length; j++) {
                string memory tag = task.tags[j];
                bool found = false;
                for (uint256 k = 0; k < tags.length; k++) {
                    if (keccak256(bytes(tags[k])) == keccak256(bytes(tag))) {
                        tagCounts[k]++;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // Extend the arrays by one element
                    string[] memory newTags = new string[](tags.length + 1);
                    uint256[] memory newTagCounts = new uint256[](tagCounts.length + 1);
                    for (uint256 m = 0; m < tags.length; m++) {
                        newTags[m] = tags[m];
                        newTagCounts[m] = tagCounts[m];
                    }
                    newTags[tags.length] = tag;
                    newTagCounts[tagCounts.length] = 1;
                    tags = newTags;
                    tagCounts = newTagCounts;
                }
            }
        }

        stats.topTags = tags;
        stats.topTagCounts = tagCounts;
    }

    function getTopTokenNamesAndBalances(uint256 offset, uint256 limit, TaskStatsWithTimestamps memory stats) internal view {
        TaskStorage storage _storage = LibTasks.taskStorage();
        string[] memory topTokenNames = new string[](0); // Empty initial array
        uint256[] memory topTokenBalances = new uint256[](0); // Empty initial array
        uint256[] memory topETHBalances = new uint256[](limit);
        uint256[] memory topETHAmounts = new uint256[](limit);

        for (uint256 i = offset; i < _storage.taskContracts.length && i < offset + limit; i++) {
            Task memory task = TaskContract(payable(_storage.taskContracts[i])).getTaskData();
            for (uint256 j = 0; j < task.tokenContracts.length; j++) {
                for (uint256 k = 0; k < task.tokenIds[j].length; k++) {
                    string memory tokenName = TokenDataFacet(address(this)).getTokenName(task.tokenIds[j][k]);
                    bool found = false;
                    for (uint256 l = 0; l < topTokenNames.length; l++) {
                        if (keccak256(bytes(topTokenNames[l])) == keccak256(bytes(tokenName))) {
                            topTokenBalances[l]++;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // Extend the arrays by one element
                        string[] memory newTopTokenNames = new string[](topTokenNames.length + 1);
                        uint256[] memory newTopTokenBalances = new uint256[](topTokenBalances.length + 1);
                        for (uint256 m = 0; m < topTokenNames.length; m++) {
                            newTopTokenNames[m] = topTokenNames[m];
                            newTopTokenBalances[m] = topTokenBalances[m];
                        }
                        newTopTokenNames[topTokenNames.length] = tokenName;
                        newTopTokenBalances[topTokenBalances.length] = 1;
                        topTokenNames = newTopTokenNames;
                        topTokenBalances = newTopTokenBalances;
                    }
                }
                if (task.tokenContracts[j] == address(0)) {
                    topETHBalances[i - offset] = _storage.taskContracts[i].balance;
                    topETHAmounts[i - offset] = task.tokenAmounts[j][0];
                }
            }
        }

        stats.topTokenNames = topTokenNames;
        stats.topTokenBalances = topTokenBalances;
        stats.topETHBalances = topETHBalances;
        stats.topETHAmounts = topETHAmounts;
    }

//  function getAccountStats(uint256 offset, uint256 limit) external view returns (AccountStats memory) {
//     TaskStorage storage _storage = LibTasks.taskStorage();
//     AccountStats memory stats;

//     uint256 accountCount = _storage.accountsList.length < offset + limit ? _storage.accountsList.length - offset : limit;

//     stats.accountAddresses = new address[](accountCount);
//     stats.nicknames = new string[](accountCount);
//     stats.aboutTexts = new string[](accountCount);
//     stats.ownerTaskCounts = new uint256[](accountCount);
//     stats.participantTaskCounts = new uint256[](accountCount);
//     stats.auditParticipantTaskCounts = new uint256[](accountCount);
//     stats.agreedTaskCounts = new uint256[](accountCount);
//     stats.auditAgreedTaskCounts = new uint256[](accountCount);
//     stats.completedTaskCounts = new uint256[](accountCount);
//     stats.auditCompletedTaskCounts = new uint256[](accountCount);
//     stats.avgCustomerRatings = new uint256[](accountCount);
//     stats.avgPerformerRatings = new uint256[](accountCount);

//     for (uint256 i = offset; i < offset + accountCount; i++) {
//         address accountAddress = _storage.accountsList[i];
//         Account storage account = _storage.accounts[accountAddress];

//         stats.accountAddresses[i - offset] = accountAddress;
//         stats.nicknames[i - offset] = account.nickname;
//         stats.aboutTexts[i - offset] = account.about;

//         stats.ownerTaskCounts[i - offset] = account.ownerTasks.length;
//         stats.participantTaskCounts[i - offset] = account.participantTasks.length;
//         stats.auditParticipantTaskCounts[i - offset] = account.auditParticipantTasks.length;
//         stats.agreedTaskCounts[i - offset] = account.agreedTasks.length;
//         stats.auditAgreedTaskCounts[i - offset] = account.auditAgreedTasks.length;
//         stats.completedTaskCounts[i - offset] = account.completedTasks.length;
//         stats.auditCompletedTaskCounts[i - offset] = account.auditCompletedTasks.length;

//         (uint256 customerRatingSum, uint256 performerRatingSum) = calculateRatingSums(account);
//         stats.avgCustomerRatings[i - offset] = calculateAvgRating(customerRatingSum, account.customerRatings.length);
//         stats.avgPerformerRatings[i - offset] = calculateAvgRating(performerRatingSum, account.performerRatings.length);
//     }

//     (stats.overallAvgCustomerRating, stats.overallAvgPerformerRating) = calculateOverallRatings(stats.avgCustomerRatings, stats.avgPerformerRatings);

//     return stats;
// }

function calculateRatingSums(Account storage account) internal view returns (uint256 customerRatingSum, uint256 performerRatingSum) {
    for (uint256 j = 0; j < account.customerRatings.length; j++) {
        customerRatingSum += account.customerRatings[j];
    }

    for (uint256 j = 0; j < account.performerRatings.length; j++) {
        performerRatingSum += account.performerRatings[j];
    }
}

function calculateAvgRating(uint256 ratingSum, uint256 ratingCount) internal pure returns (uint256) {
    if (ratingCount > 0) {
        return ratingSum / ratingCount;
    }
    return 0;
}

function calculateOverallRatings(uint256[] memory customerRatings, uint256[] memory performerRatings) internal pure returns (uint256 overallAvgCustomerRating, uint256 overallAvgPerformerRating) {
    uint256 totalCustomerRating;
    uint256 totalPerformerRating;
    uint256 ratedCustomerCount;
    uint256 ratedPerformerCount;

    for (uint256 i = 0; i < customerRatings.length; i++) {
        if (customerRatings[i] > 0) {
            totalCustomerRating += customerRatings[i];
            ratedCustomerCount++;
        }
    }

    for (uint256 i = 0; i < performerRatings.length; i++) {
        if (performerRatings[i] > 0) {
            totalPerformerRating += performerRatings[i];
            ratedPerformerCount++;
        }
    }

    if (ratedCustomerCount > 0) {
        overallAvgCustomerRating = totalCustomerRating / ratedCustomerCount;
    }

    if (ratedPerformerCount > 0) {
        overallAvgPerformerRating = totalPerformerRating / ratedPerformerCount;
    }
}

}




struct TaskStatsWithTimestamps {
    uint256 countNew;
    uint256 countAgreed;
    uint256 countProgress;
    uint256 countReview;
    uint256 countCompleted;
    uint256 countCanceled;
    uint256 countPrivate;
    uint256 countPublic;
    uint256 countHackaton;
    uint256 avgTaskDuration;
    uint256 avgPerformerRating;
    uint256 avgCustomerRating;
    string[] topTags;
    uint256[] topTagCounts;
    string[] topTokenNames;
    uint256[] topTokenBalances;
    uint256[] topETHBalances;
    uint256[] topETHAmounts;
    uint256[] createTimestamps;
    // uint256[] newTimestamps;
    // uint256[] agreedTimestamps;
    // uint256[] progressTimestamps;
    // uint256[] reviewTimestamps;
    // uint256[] completedTimestamps;
    // uint256[] canceledTimestamps;
}

struct AccountStats {
    address[] accountAddresses;
    string[] identities;
    string[] aboutTexts;
    uint256[] ownerTaskCounts;
    uint256[] participantTaskCounts;
    uint256[] auditParticipantTaskCounts;
    uint256[] agreedTaskCounts;
    uint256[] auditAgreedTaskCounts;
    uint256[] completedTaskCounts;
    uint256[] auditCompletedTaskCounts;
    uint256[] avgCustomerRatings;
    uint256[] avgPerformerRatings;
    uint256 overallAvgCustomerRating;
    uint256 overallAvgPerformerRating;
}