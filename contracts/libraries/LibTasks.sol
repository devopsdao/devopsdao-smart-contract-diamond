// SPDX-License-Identifier: MIT
//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";

import "../libraries/LibInterchain.sol";

import "../interfaces/IAccountFacet.sol";
import "../interfaces/ITokenDataFacet.sol";
import "../interfaces/IInterchainFacet.sol";

import {IERC165} from "../interfaces/IERC165.sol";
import {IERC1155} from "../interfaces/IERC1155.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IERC721} from "../interfaces/IERC721.sol";


error RevertReason (string message);


struct TaskData{
    string nanoId;
    string taskType;
    string title;
    string description;
    string repository;
    string[] tags;
    // string[][] tokenNames;
    // uint256[] amounts;
    address[] tokenContracts;
    // mapping(address => Token) tokens;
    uint256[][] tokenIds;
    uint256[][] tokenAmounts;
    // mapping(string => string) ext;
    // mapping(string => bool) extMapping;
}

// struct Token {
//     string name;
//     uint256[] tokenIds;
//     uint256[] tokenAmounts;    
// }

struct TaskStorage {
    Task task;
    // mapping(address => Task) tasks;
    address[] taskContracts;
    mapping(address => bool) taskContractsMapping;
    address[] taskContractsBlacklist;
    mapping(address => bool) taskContractsBlacklistMapping;
    mapping(address => Account) accounts;
    address[] accountsList;
    mapping(address => bool) accountsMapping;
    address[] accountsBlacklist;
    mapping(address => bool) accountsBlacklistMapping;
    mapping(string => address) identities;
    // mapping(address => address[]) ownerTasks;
    // mapping(address => address[]) participantTasks;
    // mapping(address => address[]) auditParticipantTasks;
    // uint256 countNew;
    // uint256 countAgreed;
    // uint256 countProgress;
    // uint256 countReview;
    // uint256 countCompleted;
    // uint256 countCanceled;
    // string stateNew;
}

struct Task {
    string nanoId;
    uint256 createTime;
    string taskType;
    string title;
    string description;
    string repository;
    string[] tags;
    uint256[] tagsNFT;
    // string[][] tokenNames;
    address[] tokenContracts;
    uint256[][] tokenIds;
    uint256[][] tokenAmounts;
    // mapping(string => string) ext;
    // mapping(string => bool) extMapping;
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
    // uint256 countMessages;
    address contractParent;
}

struct TaskWithBalance {
    Task task;
    string[][] tokenNames;
    // address[] tokenContracts;
    // uint256[][] tokenIds;
    // uint256[][] tokenAmounts;
    uint256[][] tokenBalances;
}

struct Message {
    uint256 id;
    string text;
    uint256 timestamp;
    address sender;
    string taskState;
    uint256 replyTo;
}

struct Account {
    address accountOwner;
    string identity;
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
    mapping(string => uint256) spentTokenBalances;
    string[] earnedTokenNames;
    mapping(string => uint256) earnedTokenBalances;
}

struct Accounts {
    mapping(address => Account) accounts;
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
    bool public constant contractLibTasks = true;

    event Logs(address contractAdr, string message);

    // function appStorage() internal pure returns (TaskStorage storage ds) {
    //     assembly {
    //         ds.slot := 0
    //     }
    // }

    // function taskStorage() internal pure returns (TaskStorage storage ds) {
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

    function taskParticipate(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external {
        TaskStorage storage _storage = taskStorage();
        require(_storage.accountsBlacklistMapping[_sender] != true, 'account is blacklisted');

        InterchainStorage storage _storageInterchain = LibInterchain.interchainStorage();
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
            && msg.sender != _storage.task.contractParent
        ){
            _sender = payable(msg.sender);
        }
        // (ConfigAxelar memory configAxelar, ConfigHyperlane memory configHyperlane, ConfigLayerzero memory configLayerzero, ConfigWormhole memory configWormhole) = IInterchainFacet(_storage.task.contractParent).getInterchainConfigs();
        // if(msg.sender != configAxelar.sourceAddress 
        //     && msg.sender != configHyperlane.sourceAddress 
        //     && msg.sender != configLayerzero.sourceAddress
        //     && msg.sender != configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }

        // (bool success, bytes memory result) = _storage.task.contractParent.call(abi.encodeWithSignature("addParticipantTask(address,address)", _sender, address(this)));
        require(
            _sender != _storage.task.contractOwner,
            "contract owner cannot participate"
        );
        // console.log('taskState');
        // console.log(address(this));
        // console.log(_storage.task.taskState);
        require(
            keccak256(bytes(_storage.task.taskState)) ==
                keccak256(bytes(TASK_STATE_NEW)),
            "task is not in new state"
        );

        // for (uint i = 0; i < _storage.task.tokenContracts.length; i++){
        //     if(_storage.task.tokenContracts[i] == address(0x0)){
        //         //do nothing if it's a native token
        //     }
        //     else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(0x4e2312e0)){
        //         IERC1155(_storage.task.tokenContracts[i]).safeBatchTransferFrom(_sender, address(this), _storage.task.tokenIds[i], _storage.task.tokenAmounts[i], bytes(''));
        //     }
        //     else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC20).interfaceId)){
        //         IERC20(_storage.task.tokenContracts[i]).transferFrom(_sender, address(this), _storage.task.tokenAmounts[i][0]);
        //     }
        //     else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC721).interfaceId)){
        //         for (uint id = 0; id < _storage.task.tokenIds[i].length; id++){
        //             IERC721(_storage.task.tokenContracts[i]).safeTransferFrom(_sender, address(this), _storage.task.tokenIds[i][id]);
        //         }
        //     }
        // }

        //   _storage.task.countMessages++;
        Message memory message;
        message.id = _storage.task.messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = TASK_STATE_NEW;
        message.replyTo = _replyTo;
        bool existed = false;

        //assess if "if clause" should be removed, just keeping the loop
        if (_storage.task.participants.length == 0) {
            _storage.task.participants.push(_sender);
            _storage.task.messages.push(message);
            IAccountFacet(_storage.task.contractParent).addParticipantTask(_sender, address(this));
            // (bool success, bytes memory result) = _storage.task.contractParent.call{gas: 500000}(abi.encodeWithSignature("addParticipantTask(address,address)", _sender, address(this)));
            // console.log(success);
        } else {
            for (
                uint256 i = 0;
                i < _storage.task.participants.length;
                i++
            ) {
                if (_storage.task.participants[i] == _sender) {
                    existed = true;
                }
            }
            if (!existed) {
                _storage.task.participants.push(_sender);
                // _storage.accounts[_sender].participantTasks.push(address(this));
                _storage.task.messages.push(message);

                // bytes4 functionSelector = bytes4(keccak256("addParticipantTask(address,address)"));
                // address test = address(_storage.task.contractParent);
                // bytes memory myFunctionCall = abi.encodeWithSelector(bytes4(keccak256("addParticipantTask(address,address)")), 4);
                IAccountFacet(_storage.task.contractParent).addParticipantTask(_sender, address(this));
                // (bool success, bytes memory result) = _storage.task.contractParent.call(abi.encodeWithSignature("addParticipantTask(address,address)", _sender, address(this)));
                // console.log(success);
                // console.log(result);
                // _storage.task.contractParent.addParticipantTask(_sender, address(this));

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
        require(_storage.accountsBlacklistMapping[_sender] != true, 'account is blacklisted');

        InterchainStorage storage _storageInterchain = LibInterchain.interchainStorage();
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
            && msg.sender != _storage.task.contractParent
        ){
            _sender = payable(msg.sender);
        }
        
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
        // address contractOwner = _storage.task.contractOwner;
        // string memory taskType = _storage.task.taskType;
        // string memory taskState = _storage.task.taskState;
        // string memory auditState = _storage.task.auditState;
        // address[] memory participants = _storage
        //     .task
        //     .participants;
        address[] memory auditors = _storage.task.auditors;
        //_storage.task.countMessages++;
        Message memory message;
        message.id = _storage.task.messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.taskState = _state;
        message.replyTo = _replyTo;
        if (
            _sender == _storage.task.contractOwner &&
            _sender != _participant &&
            keccak256(bytes(_storage.task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) &&
            (keccak256(bytes(_storage.task.taskType)) ==
                keccak256(bytes(TASK_TYPE_PRIVATE)) ||
                keccak256(bytes(_storage.task.taskType)) ==
                keccak256(bytes(TASK_TYPE_PUBLIC)))
        ) {
            bool participantApplied = false;
            for (uint256 i = 0; i < _storage
            .task
            .participants.length; i++) {
                if (_storage
            .task
            .participants[i] == _participant) {
                    participantApplied = true;
                    break;
                }
            }
            if (participantApplied) {
                _storage.task.taskState = _state;
                _storage.task.participant = _participant;
                _storage.task.messages.push(message);
                IAccountFacet(_storage.task.contractParent).addPerformerAgreedTask(_participant, address(this));
                IAccountFacet(_storage.task.contractParent).addCustomerAgreedTask(_storage.task.contractOwner, address(this));
                // IAccountFacet(_storage.task.contractParent).addAgreedTask(_participant, _storage.task.contractOwner, address(this));
            } else {
                revert("participant has not applied");
            }
        } else if (
            _sender == _storage.task.contractOwner &&
            _sender != _participant &&
            keccak256(bytes(_storage.task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED)) &&
            keccak256(bytes(_storage.task.taskType)) == keccak256(bytes(TASK_TYPE_HACKATON))
        ) {
            if (_storage
            .task
            .participants.length > 0) {
                _storage.task.taskState = _state;
                _storage.task.messages.push(message);
            } else {
                revert("participants have not applied");
            }
        } else if (
            _sender == _storage.task.participant &&
            keccak256(bytes(_storage.task.taskState)) ==
            keccak256(bytes(TASK_STATE_AGREED)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_PROGRESS))
        ) {
            // string[] memory tokenNames = _storage.task.tokenNames;
            // uint256[] memory amounts = _storage.task.amounts;
            // ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
            // for (uint i = 0; i < tokenNames.length; i++) {
            //     if (_tokenStorage.tokenNames[tokenNames[i]] > 0) {
            //         if (_tokenStorage.tokenNames[tokenNames[i]] > 0) {
            //             uint256 tokenBalance = TokenFacet(
            //                 _storage.task.contractParent
            //             ).balanceOf(
            //                     address(this),
            //                     _tokenStorage.tokenNames[tokenNames[i]]
            //                 );
            //             if (tokenBalance >= amounts[i]) {
            //                 TokenFacet(
            //                     _storage.task.contractParent
            //                 ).safeTransferFrom(
            //                         address(this),
            //                         _participant,
            //                         _tokenStorage.tokenNames[tokenNames[i]],
            //                         amounts[i],
            //                         bytes("")
            //                     );
            //             }
            //         }
            //     }
            // }

            _storage.task.taskState = TASK_STATE_PROGRESS;
            _storage.task.messages.push(message);
        } else if (
            _sender == _storage.task.participant &&
            keccak256(bytes(_storage.task.taskState)) ==
            keccak256(bytes(TASK_STATE_PROGRESS)) &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_REVIEW))
        ) {
            _storage.task.taskState = TASK_STATE_REVIEW;
            _storage.task.messages.push(message);
        } else if (
            _sender == _storage.task.contractOwner &&
            _sender != _storage.task.participant &&
            keccak256(bytes(_storage.task.taskState)) ==
            keccak256(bytes(TASK_STATE_REVIEW)) &&
            keccak256(bytes(_state)) ==
            keccak256(bytes(TASK_STATE_COMPLETED)) &&
            _rating != 0 &&
            _rating <= 5
        ) {
            _storage.task.taskState = TASK_STATE_COMPLETED;
            _storage.task.performerRating = _rating;
            _storage.task.messages.push(message);
            // IAccountFacet(_storage.task.contractParent).addPerformerCompletedTask(_storage.task.participant, address(this));
            // IAccountFacet(_storage.task.contractParent).addCustomerCompletedTask(_storage.task.contractOwner, address(this));
            IAccountFacet(_storage.task.contractParent).addCompletedTask(_storage.task.participant, _storage.task.contractOwner, address(this));
            IAccountFacet(_storage.task.contractParent).addPerformerRating(_storage.task.participant, address(this), _rating);


            for (uint i = 0; i < _storage.task.tokenContracts.length; i++) {
                string[] memory tokenNames;
                uint256[] memory tokenAmounts;

                if (_storage.task.tokenContracts[i] == address(0x0)) {
                    // Handle native token (ETH)
                    tokenNames = new string[](1);
                    tokenNames[0] = 'ETH';
                    tokenAmounts = new uint256[](1);
                    tokenAmounts[0] = _storage.task.tokenAmounts[i][0];
                } else {
                    // Handle ERC20, ERC721, or ERC1155 tokens
                    tokenNames = ITokenDataFacet(_storage.task.contractParent).getTokenNames(_storage.task.tokenIds[i]);
                    tokenAmounts = _storage.task.tokenAmounts[i];
                }

                // Add earned tokens for performer
                IAccountFacet(_storage.task.contractParent).addPerformerEarnedTokens(_storage.task.participant, tokenNames, tokenAmounts);

                // Add spent tokens for customer
                IAccountFacet(_storage.task.contractParent).addCustomerSpentTokens(_storage.task.contractOwner, tokenNames, tokenAmounts);
            }


        } else if (
            keccak256(bytes(_storage.task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) &&
            _sender == _storage.task.contractOwner &&
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_CANCELED))
        ) {
            _storage.task.taskState = TASK_STATE_CANCELED;
            _storage.task.performerRating = _rating;
            _storage.task.messages.push(message);
            IAccountFacet(_storage.task.contractParent).addPerformerRating(_storage.task.participant, address(this), _rating);
        } else if (
            keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AUDIT))
        ) {
            if (
                _sender == _storage.task.contractOwner &&
                _sender != _storage.task.participant &&
                (keccak256(bytes(_storage.task.taskState)) ==
                    keccak256(bytes(TASK_STATE_AGREED)) ||
                    keccak256(bytes(_storage.task.taskState)) ==
                    keccak256(bytes(TASK_STATE_PROGRESS)) ||
                    keccak256(bytes(_storage.task.taskState)) ==
                    keccak256(bytes(TASK_STATE_REVIEW)))
            ) {
                _storage.task.taskState = TASK_STATE_AUDIT;
                _storage.task.auditInitiator = _sender;
                _storage
                    .task
                    .auditState = TASK_AUDIT_STATE_REQUESTED;
                _storage.task.messages.push(message);
            } else if (
                _sender == _storage.task.participant &&
                (keccak256(bytes(_storage.task.taskState)) ==
                    keccak256(bytes(TASK_STATE_REVIEW)))
            ) {
                _storage.task.taskState = TASK_STATE_AUDIT;
                _storage.task.auditInitiator = _sender;
                _storage
                    .task
                    .auditState = TASK_AUDIT_STATE_REQUESTED;
                _storage.task.messages.push(message);
                //TODO: audit history need to add
            } else if (
                _sender == _storage.task.contractOwner &&
                keccak256(bytes(_storage.task.taskState)) ==
                keccak256(bytes(TASK_STATE_AUDIT)) &&
                keccak256(bytes(_storage.task.auditState)) ==
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
                        .task
                        .auditState = TASK_AUDIT_STATE_PERFORMING;
                    _storage.task.auditor = _participant;
                    _storage.task.messages.push(message);
                    IAccountFacet(_storage.task.contractParent).addAuditAgreedTask(_participant, address(this));
                    IAccountFacet(_storage.task.contractParent).addPerformerAuditedTask(_storage.task.participant, address(this));
                    IAccountFacet(_storage.task.contractParent).addCustomerAuditedTask(_storage.task.contractOwner, address(this));
                } else {
                    revert("auditor has not applied");
                }
            }
            else {
                revert("conditions are not met");
            }
        } else {
            revert("conditions are not met");
        }
    }

}
