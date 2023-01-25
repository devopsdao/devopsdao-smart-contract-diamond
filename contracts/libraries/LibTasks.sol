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

import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";

error RevertReason (string message);


struct TaskData{
    string nanoId;
    string taskType;
    string title;
    string description;
    string[] tags;
    string[] symbols;
    uint256[] amounts;
    // mapping(string => string) ext;
    // mapping(string => bool) extMapping;
}

struct TaskStorage {
    mapping(address => Task) tasks;
    mapping(address => address[]) ownerTasks;
    mapping(address => address[]) participantTasks;
    mapping(address => address[]) auditParticipantTasks;
    address[] taskContracts;
    uint256 countNew;
    uint256 countAgreed;
    uint256 countProgress;
    uint256 countReview;
    uint256 countCompleted;
    uint256 countCanceled;
    string stateNew;
    address[] taskContractsBlacklist;
    mapping(address => bool) taskContractsBlacklistMapping;
}

struct Task {
    string nanoId;
    uint256 createTime;
    string taskType;
    string title;
    string description;
    string[] tags;
    uint256[] tagsNFT;
    string[] symbols;
    uint256[] amounts;
    // mapping(string => string) ext;
    // mapping(string => bool) extMapping;
    string taskState;
    string auditState;
    uint256 rating;
    address payable contractOwner;
    address payable participant;
    address auditInitiator;
    address auditor;
    address[] participants;
    address[] funders;
    address[] auditors;
    Message[] messages;
    // uint256 countMessages;
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

string constant TASK_TYPE_PRIVATE = "private";
string constant TASK_TYPE_PUBLIC = "public";
string constant TASK_TYPE_HACKATON = "hackaton";

string constant TASK_STATE_NEW = "new";
string constant TASK_STATE_AGREED = "agreed";
string constant TASK_STATE_PROGRESS = "progress";
string constant TASK_STATE_REVIEW = "review";
string constant TASK_STATE_AUDIT = "audit";
string constant TASK_STATE_COMPLETED = "completed";
string constant TASK_STATE_CANCELED = "canceled";

string constant TASK_AUDIT_STATE_REQUESTED = "requested";
string constant TASK_AUDIT_STATE_PERFORMING = "performing";
string constant TASK_AUDIT_STATE_FINISHED = "finished";

library LibTasks {
    event Logs(address contractAdr, string message);

    // function appStorage() internal pure returns (TaskStorage storage ds) {
    //     assembly {
    //         ds.slot := 0
    //     }
    // }

    function taskStorage() internal pure returns (TaskStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    // function taskStorage()
    //     internal
    //     pure
    //     returns (TaskStorage storage ds)
    // {
    //     bytes32 position = keccak256("diamond.tasks.storage");
    //     assembly {
    //         ds.slot := position
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

    function taskParticipate(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external {
        TaskStorage storage _storage = taskStorage();
        require(
            _sender != _storage.tasks[address(this)].contractOwner,
            "contract owner cannot participate"
        );
        // console.log('taskState');
        // console.log(address(this));
        // console.log(_storage.tasks[address(this)].taskState);
        require(
            keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                keccak256(bytes(TASK_STATE_NEW)),
            "task is not in the new state"
        );
        //   _storage.tasks[address(this)].countMessages++;
        Message memory message;
        message.id = _storage.tasks[address(this)].messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = TASK_STATE_NEW;
        message.replyTo = _replyTo;
        bool existed = false;
        if (_storage.tasks[address(this)].participants.length == 0) {
            _storage.tasks[address(this)].participants.push(_sender);
            _storage.tasks[address(this)].messages.push(message);
        } else {
            for (
                uint256 i = 0;
                i < _storage.tasks[address(this)].participants.length;
                i++
            ) {
                if (_storage.tasks[address(this)].participants[i] == _sender) {
                    existed = true;
                }
            }
            if (!existed) {
                _storage.tasks[address(this)].participants.push(_sender);
                _storage.participantTasks[_sender].push(address(this));
                _storage.tasks[address(this)].messages.push(message);
            }
        }
    }

    //todo: only allow calling child contract functions from the parent contract!!!
    function taskStateChange(
        address _sender,
        address payable _participant,
        string memory _state,
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
        // address contractOwner = _storage.tasks[address(this)].contractOwner;
        // string memory taskType = _storage.tasks[address(this)].taskType;
        // string memory taskState = _storage.tasks[address(this)].taskState;
        // string memory auditState = _storage.tasks[address(this)].auditState;
        // address[] memory participants = _storage
        //     .tasks[address(this)]
        //     .participants;
        address[] memory auditors = _storage.tasks[address(this)].auditors;
        //_storage.tasks[address(this)].countMessages++;
        Message memory message;
        message.id = _storage.tasks[address(this)].messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = _state;
        message.replyTo = _replyTo;
        if (
            _sender == _storage.tasks[address(this)].contractOwner &&
            _sender != _participant &&
            keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) &&
            (keccak256(bytes(_storage.tasks[address(this)].taskType)) ==
                keccak256(bytes(TASK_TYPE_PRIVATE)) ||
                keccak256(bytes(_storage.tasks[address(this)].taskType)) ==
                keccak256(bytes(TASK_TYPE_PUBLIC)))
        ) {
            bool participantApplied = false;
            for (uint256 i = 0; i < _storage
            .tasks[address(this)]
            .participants.length; i++) {
                if (_storage
            .tasks[address(this)]
            .participants[i] == _participant) {
                    participantApplied = true;
                    break;
                }
            }
            if (participantApplied) {
                _storage.tasks[address(this)].taskState = _state;
                _storage.tasks[address(this)].participant = _participant;
                _storage.tasks[address(this)].messages.push(message);
            } else {
                revert("participant has not applied");
            }
        } else if (
            _sender == _storage.tasks[address(this)].contractOwner &&
            _sender != _participant &&
            keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) &&
            keccak256(bytes(_storage.tasks[address(this)].taskType)) == keccak256(bytes(TASK_TYPE_HACKATON))
        ) {
            if (_storage
            .tasks[address(this)]
            .participants.length > 0) {
                _storage.tasks[address(this)].taskState = _state;
                _storage.tasks[address(this)].messages.push(message);
            } else {
                revert("participants have not applied");
            }
        } else if (
            _sender == _storage.tasks[address(this)].participant &&
            keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
            keccak256(bytes(TASK_STATE_AGREED)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_PROGRESS))
        ) {
            string[] memory symbols = _storage.tasks[address(this)].symbols;
            uint256[] memory amounts = _storage.tasks[address(this)].amounts;
            ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
            for (uint i = 0; i < symbols.length; i++) {
                if (_tokenStorage.tokenNames[symbols[i]] > 0) {
                    if (_tokenStorage.tokenNames[symbols[i]] > 0) {
                        uint256 tokenBalance = TokenFacet(
                            _storage.tasks[address(this)].contractParent
                        ).balanceOf(
                                address(this),
                                _tokenStorage.tokenNames[symbols[i]]
                            );
                        if (tokenBalance >= amounts[i]) {
                            TokenFacet(
                                _storage.tasks[address(this)].contractParent
                            ).safeTransferFrom(
                                    address(this),
                                    _participant,
                                    _tokenStorage.tokenNames[symbols[i]],
                                    amounts[i],
                                    bytes("")
                                );
                        }
                    }
                }
            }

            _storage.tasks[address(this)].taskState = TASK_STATE_PROGRESS;
            _storage.tasks[address(this)].messages.push(message);
        } else if (
            _sender == _storage.tasks[address(this)].participant &&
            keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
            keccak256(bytes(TASK_STATE_PROGRESS)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_REVIEW))
        ) {
            _storage.tasks[address(this)].taskState = TASK_STATE_REVIEW;
            _storage.tasks[address(this)].messages.push(message);
        } else if (
            _sender == _storage.tasks[address(this)].contractOwner &&
            _sender != _storage.tasks[address(this)].participant &&
            keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
            keccak256(bytes(TASK_STATE_REVIEW)) &&
            keccak256(bytes(_state)) ==
            keccak256(bytes(TASK_STATE_COMPLETED)) &&
            _rating != 0 &&
            _rating <= 5
        ) {
            _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
            _storage.tasks[address(this)].rating = _rating;
            _storage.tasks[address(this)].messages.push(message);
        } else if (
            keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            _sender == _storage.tasks[address(this)].contractOwner &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_CANCELED))
        ) {
            _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
            _storage.tasks[address(this)].messages.push(message);
        } else if (
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AUDIT))
        ) {
            if (
                _sender == _storage.tasks[address(this)].contractOwner &&
                _sender != _storage.tasks[address(this)].participant &&
                (keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                    keccak256(bytes(TASK_STATE_AGREED)) ||
                    keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                    keccak256(bytes(TASK_STATE_PROGRESS)) ||
                    keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                    keccak256(bytes(TASK_STATE_REVIEW)))
            ) {
                _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
                _storage.tasks[address(this)].auditInitiator = _sender;
                _storage
                    .tasks[address(this)]
                    .auditState = TASK_AUDIT_STATE_REQUESTED;
                _storage.tasks[address(this)].messages.push(message);
            } else if (
                _sender == _storage.tasks[address(this)].participant &&
                (keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                    keccak256(bytes(TASK_STATE_REVIEW)))
            ) {
                _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
                _storage.tasks[address(this)].auditInitiator = _sender;
                _storage
                    .tasks[address(this)]
                    .auditState = TASK_AUDIT_STATE_REQUESTED;
                _storage.tasks[address(this)].messages.push(message);
                //TODO: audit history need to add
            } else if (
                _sender == _storage.tasks[address(this)].contractOwner &&
                keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                keccak256(bytes(TASK_STATE_AUDIT)) &&
                keccak256(bytes(_storage.tasks[address(this)].auditState)) ==
                keccak256(bytes(TASK_AUDIT_STATE_REQUESTED)) &&
                auditors.length != 0
            ) {
                bool auditorApplied = false;
                for (uint256 i = 0; i < auditors.length; i++) {
                    if (auditors[i] == _participant) {
                        auditorApplied = true;
                        break;
                    }
                }
                if (auditorApplied) {
                    _storage
                        .tasks[address(this)]
                        .auditState = TASK_AUDIT_STATE_PERFORMING;
                    _storage.tasks[address(this)].messages.push(message);
                    _storage.tasks[address(this)].auditor = _participant;
                } else {
                    revert("auditor has not applied");
                }
            }
        } else {
            revert("conditions are not met");
        }
    }

}
