// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ITaskContract {
    // Struct definitions
    struct Task {
        string nanoId;
        uint256 createTime;
        string taskType;
        string title;
        string description;
        string repository;
        string[] tags;
        uint256[] tagsNFT;
        address[] tokenContracts;
        uint256[][] tokenIds;
        uint256[][] tokenAmounts;
        string taskState;
        string auditState;
        uint256 performerRating;
        uint256 customerRating;
        address payable contractOwner;
        address payable participant;
        address auditInitiator;
        address auditor;
        address[] participants;
        address[] funders;
        address[] auditors;
        Message[] messages;
        address contractParent;
    }

    struct Message {
        uint256 id;
        string text;
        uint256 timestamp;
        address sender;
        string taskState;
        uint256 replyTo;
    }

    // Function declarations
    function getTaskData() external view returns (Task memory);
    
    function taskParticipate(address _sender, string memory _message, uint256 _replyTo) external;
    
    function taskAuditParticipate(address _sender, string memory _message, uint256 _replyTo) external;
    
    function taskStateChange(
        address _sender,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external;
    
    function taskAuditDecision(
        address _sender,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 rating
    ) external;
    
    function sendMessage(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external;
    
    function withdrawAndRate(
        address _sender,
        address payable _addressToSend,
        string memory _chain,
        uint256 rating
    ) external payable;
}