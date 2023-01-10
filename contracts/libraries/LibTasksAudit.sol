//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

import "../libraries/LibTasks.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";


library LibTasksAudit {
    event Logs(address contractAdr, string message);

    // function appStorage() internal pure returns (TaskStorage storage ds) {
    //     assembly {
    //         ds.slot := 0
    //     }
    // }

    function taskStorage()
        internal
        pure
        returns (TaskStorage storage ds)
    {
        bytes32 position = keccak256("diamond.tasks.storage");
        assembly {
            ds.slot := position
        }
    }

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
        TaskStorage storage _storage = taskStorage();
        require(
            _sender != _storage.tasks[address(this)].contractOwner &&
                _sender != _storage.tasks[address(this)].participant,
            "contract owner or participant cannot audit"
        );
        require(
            keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                keccak256(bytes(TASK_STATE_AUDIT)),
            "task is not in the audit state"
        );
        // TODO: add NFT based auditor priviledge check
        //_storage.tasks[address(this)].countMessages++;
        Message memory message;
        message.id = _storage.tasks[address(this)].messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = TASK_STATE_AUDIT;
        message.replyTo = _replyTo;
        bool existed = false;
        if (_storage.tasks[address(this)].auditors.length == 0) {
            _storage.tasks[address(this)].auditors.push(_sender);
            _storage.tasks[address(this)].messages.push(message);
        } else {
            for (
                uint256 i = 0;
                i < _storage.tasks[address(this)].auditors.length;
                i++
            ) {
                if (_storage.tasks[address(this)].auditors[i] == _sender) {
                    existed = true;
                    break;
                }
            }
            if (!existed) {
                _storage.tasks[address(this)].auditors.push(_sender);
                _storage.auditParticipantTasks[_sender].push(address(this));
                _storage.tasks[address(this)].messages.push(message);
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
        TaskStorage storage _storage = taskStorage();
        require(
            _replyTo == 0 ||
                _replyTo <= _storage.tasks[address(this)].messages.length + 1,
            "invalid replyTo id"
        );
        address auditor = _storage.tasks[address(this)].auditor;
        string memory taskType = _storage.tasks[address(this)].taskType;
        string memory taskState = _storage.tasks[address(this)].taskState;
        string memory auditState = _storage.tasks[address(this)].auditState;
        // TODO: add NFT based auditor priviledge check
        //_storage.tasks[address(this)].countMessages++;
        Message memory message;
        message.id = _storage.tasks[address(this)].messages.length + 1;
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
                .tasks[address(this)]
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
            _storage.tasks[address(this)].rating = _rating;
            message.taskState = TASK_STATE_CANCELED;
            _storage.tasks[address(this)].messages.push(message);
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
                .tasks[address(this)]
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.tasks[address(this)].taskState = TASK_STATE_NEW;
            _storage.tasks[address(this)].rating = _rating;
            message.taskState = TASK_STATE_NEW;
            _storage.tasks[address(this)].messages.push(message);
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
                .tasks[address(this)]
                .auditState = TASK_AUDIT_STATE_FINISHED;
            _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
            _storage.tasks[address(this)].rating = _rating;
            message.taskState = TASK_STATE_COMPLETED;
            _storage.tasks[address(this)].messages.push(message);
        } else revert("conditions are not met");
    }

}
