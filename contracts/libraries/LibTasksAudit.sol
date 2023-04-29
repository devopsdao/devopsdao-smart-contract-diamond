//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }s

import "../libraries/LibTasks.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";

import "../libraries/LibInterchain.sol";

import "../interfaces/IAccountFacet.sol";
import "../interfaces/IInterchainFacet.sol";

library LibTasksAudit {
    event Logs(address contractAdr, string message);

    // function appStorage() internal pure returns (TaskStorage storage ds) {
    //     assembly {
    //         ds.slot := 0
    //     }
    // }

    function erc1155Storage()
        internal
        pure
        returns (ERC1155FacetStorage storage ds)
    {
        bytes32 position = keccak256("diamond.erc1155.storage");
        assembly {
            ds.slot := position
        }
    }


    function taskAuditParticipate(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external {
        TaskStorage storage _storage = LibTasks.taskStorage();

        // (ConfigAxelar memory configAxelar, ConfigHyperlane memory configHyperlane, ConfigLayerzero memory configLayerzero, ConfigWormhole memory configWormhole) = IInterchainFacet(_storage.task.contractParent).getInterchainConfigs();
        // if(msg.sender != configAxelar.sourceAddress 
        //     && msg.sender != configHyperlane.sourceAddress 
        //     && msg.sender != configLayerzero.sourceAddress
        //     && msg.sender != configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }

        require(
            _sender != _storage.task.contractOwner &&
                _sender != _storage.task.participant,
            "contract owner or participant cannot audit"
        );
        // console.log(address(this));
        // console.log(TASK_STATE_AUDIT);
        require(
            keccak256(bytes(_storage.task.taskState)) ==
                keccak256(bytes(TASK_STATE_AUDIT)),
            "task is not in the audit state"
        );
        // TODO: add NFT based auditor priviledge check
        //_storage.task.countMessages++;
        Message memory message;
        message.id = _storage.task.messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = TASK_STATE_AUDIT;
        message.replyTo = _replyTo;
        bool existed = false;
        if (_storage.task.auditors.length == 0) {
            _storage.task.auditors.push(_sender);
            _storage.task.messages.push(message);
            IAccountFacet(_storage.task.contractParent).addAuditParticipantTask(_sender, address(this));
        } else {
            for (
                uint256 i = 0;
                i < _storage.task.auditors.length;
                i++
            ) {
                if (_storage.task.auditors[i] == _sender) {
                    existed = true;
                    break;
                }
            }
            if (!existed) {
                _storage.task.auditors.push(_sender);
                _storage.accounts[_sender].auditParticipantTasks.push(address(this));
                _storage.task.messages.push(message);
                IAccountFacet(_storage.task.contractParent).addAuditParticipantTask(_sender, address(this));
            }
        }
    }

    

    function taskAuditDecision(
        address _sender,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external {
        TaskStorage storage _storage = LibTasks.taskStorage();

        // (ConfigAxelar memory configAxelar, ConfigHyperlane memory configHyperlane, ConfigLayerzero memory configLayerzero, ConfigWormhole memory configWormhole) = IInterchainFacet(_storage.task.contractParent).getInterchainConfigs();
        // if(msg.sender != configAxelar.sourceAddress 
        //     && msg.sender != configHyperlane.sourceAddress 
        //     && msg.sender != configLayerzero.sourceAddress
        //     && msg.sender != configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }

        require(
            _replyTo == 0 ||
                _replyTo <= _storage.task.messages.length + 1,
            "invalid replyTo id"
        );
        address auditor = _storage.task.auditor;
        string memory taskType = _storage.task.taskType;
        string memory taskState = _storage.task.taskState;
        string memory auditState = _storage.task.auditState;
        // TODO: add NFT based auditor priviledge check
        //_storage.task.countMessages++;
        Message memory message;
        message.id = _storage.task.messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.replyTo = _replyTo;
        if (
            _sender == auditor &&
            keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT)) &&
            keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PRIVATE)) &&
            keccak256(bytes(auditState)) ==
            keccak256(bytes(TASK_AUDIT_STATE_PERFORMING)) &&
            keccak256(bytes(_favour)) == keccak256(bytes("customer")) &&
            _rating != 0 &&
            _rating <= 5
        ) {
            _storage
                .task
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.task.taskState = TASK_STATE_CANCELED;
            // _storage.task.rating = _rating;
            message.taskState = TASK_STATE_CANCELED;
            _storage.task.messages.push(message);
        } else if (
            _sender == auditor &&
            keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT)) &&
            keccak256(bytes(taskType)) == keccak256(bytes(TASK_TYPE_PUBLIC)) &&
            keccak256(bytes(auditState)) ==
            keccak256(bytes(TASK_AUDIT_STATE_PERFORMING)) &&
            keccak256(bytes(_favour)) == keccak256(bytes("customer")) &&
            _rating != 0 &&
            _rating <= 5
        ) {
            _storage
                .task
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.task.taskState = TASK_STATE_NEW;
            // _storage.task.rating = _rating;
            message.taskState = TASK_STATE_NEW;
            _storage.task.messages.push(message);
        } else if (
            _sender == auditor &&
            keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT)) &&
            keccak256(bytes(auditState)) ==
            keccak256(bytes(TASK_AUDIT_STATE_PERFORMING)) &&
            keccak256(bytes(_favour)) == keccak256(bytes("performer")) &&
            _rating != 0 &&
            _rating <= 5
        ) {
            _storage
                .task
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.task.taskState = TASK_STATE_COMPLETED;
            _storage.task.rating = _rating;
            message.taskState = TASK_STATE_COMPLETED;
            _storage.task.messages.push(message);
        } else revert("conditions are not met");
    }

}
