// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

import "../libraries/LibTasks.sol";
import "../libraries/LibTasksAudit.sol";
import "../libraries/LibChat.sol";
import "../libraries/LibWithdraw.sol";
// import "../libraries/LibInterchain.sol";

// import "../facets/TokenDataFacet.sol";

import "../external/erc1155/Common.sol";
import "../interfaces/IERC1155TokenReceiver.sol";
import "../interfaces/ITokenDataFacet.sol";

// import "../facets/DiamondLoupeFacet.sol";

import "hardhat/console.sol";

// error RevertReason (string message);


contract TaskContract is ERC1155TokenReceiver, CommonConstants  {
    // TaskStorage internal _storage;
    bool immutable shouldRejectERC1155 = false;
    // InterchainStorage internal _storageInterchain;

    event Logs(address contractAdr, string message);
    event LogsValue(address contractAdr, string message, uint value);
    event TaskUpdated(address contractAdr, string message, uint timestamp);

    constructor(
        address payable _sender,
        TaskData memory _taskData
    ) payable {

        TaskStorage storage _storage = LibTasks.taskStorage();
        _storage.task.nanoId = _taskData.nanoId;
        _storage.task.taskType = _taskData.taskType;
        _storage.task.title = _taskData.title;
        _storage.task.description = _taskData.description;
        _storage.task.repository = _taskData.repository;
        _storage.task.tags = _taskData.tags;
        // _storage.task.tokenNames = _taskData.tokenNames;
        // _storage.task.amounts = _taskData.amounts;
        _storage.task.tokenContracts = _taskData.tokenContracts;
        _storage.task.tokenIds = _taskData.tokenIds;
        _storage.task.tokenAmounts = _taskData.tokenAmounts;

        _storage.task.taskState = TASK_STATE_NEW;
        _storage.task.contractParent = msg.sender;
        _storage.task.contractOwner = _sender;
        _storage.task.createTime = block.timestamp;

        emit TaskUpdated(address(this), 'TaskContract', block.timestamp);
    }

    function getTaskData() external view returns (Task memory task)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // uint256 balance = TokenFacet(_storage.task.contractParent).balanceOf(msg.sender, 1);
        // task = _storage.task;
        // for(uint i; i < task.tags.length; i++) {
        //     task.tags[i];
        // }
        return _storage.task;
    }


    // function getBalance() public view returns (uint256) {
    //     return address(this).balance;
    // }

    function withdrawAndRate(address _sender, address payable _addressToSend, string memory _chain, uint256 rating) external payable {
        // address payable contractOwner = _storage.task.contractOwner;
        // address payable participant = _storage.task.participant;
        // uint256 balance = address(this).balance;
        // string memory taskState = _storage.task.taskState;
        // string[] memory symbols = _storage.task.symbols;
        // uint256[] memory amounts = _storage.task.amounts;
        LibWithdraw.withdraw(_sender, _addressToSend, _chain, rating);
        emit TaskUpdated(address(this), 'transferToaddress', block.timestamp);
    }

    // function transferToaddress(address payable _addressToSend, string memory _chain) external payable {
    //     // address payable contractOwner = _storage.task.contractOwner;
    //     // address payable participant = _storage.task.participant;
    //     // uint256 balance = address(this).balance;
    //     // string memory taskState = _storage.task.taskState;
    //     // string[] memory symbols = _storage.task.symbols;
    //     // uint256[] memory amounts = _storage.task.amounts;

    //     LibWithdraw.withdraw(_addressToSend, _chain);
    //     emit TaskUpdated(address(this), 'transferToaddress', block.timestamp);
    // }

    function taskParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        LibTasks.taskParticipate(_sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'taskParticipate', block.timestamp);
    }


    function taskAuditParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // address[] memory to = new address[](1);
        // uint256[] memory amount = new uint256[](1);
        // to[0] = _sender;
        // amount[0] = uint256(1);
        // TokenFacet(_storage.task.contractParent).mintFungible(1, to, amount);
        // uint256 balance = ITokenDataFacet(_storage.task.contractParent).balanceOfName(msg.sender, 'auditor');
        // // // console.log(balance);
        // require(balance>0, 'must hold Auditor NFT to audit');
        

        LibTasksAudit.taskAuditParticipate(_sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'taskAuditParticipate', block.timestamp);
    }

    function taskStateChange(
        address _sender,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _score
    ) external {
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
        //     && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
        //     && msg.sender != _storageInterchain.configLayerzero.sourceAddress
        //     && msg.sender != _storageInterchain.configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }

        LibTasks.taskStateChange(_sender, _participant, _state, _message, _replyTo, _score);
        emit TaskUpdated(address(this), 'taskStateChange', block.timestamp);
    }

    function taskAuditDecision(
        address _sender,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 rating
    ) external {
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // uint256 balance = ITokenDataFacet(_storage.task.contractParent).balanceOfName(msg.sender, 'auditor');
        // // // console.log(balance);
        // require(balance>0, 'must hold Auditor NFT to audit');

        // if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
        //     && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
        //     && msg.sender != _storageInterchain.configLayerzero.sourceAddress
        //     && msg.sender != _storageInterchain.configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }
        LibTasksAudit.taskAuditDecision(_sender, _favour, _message, _replyTo, rating);
        emit TaskUpdated(address(this), 'taskAuditDecision', block.timestamp);
    }

    function sendMessage(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external {
        // if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
        //     && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
        //     && msg.sender != _storageInterchain.configLayerzero.sourceAddress
        //     && msg.sender != _storageInterchain.configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }
        LibChat.sendMessage(_sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'sendMessage', block.timestamp);
    }

    receive() payable external {
        emit TaskUpdated(address(this), 'topup', block.timestamp);
    }

    function onERC1155Received(address /*_operator*/, address /*_from*/, uint256 /*_id*/, uint256 /*_value*/, bytes calldata /*_data*/) external view returns(bytes4) {
        if (shouldRejectERC1155 == true) {
            revert("onERC1155Received: transfer not accepted");
        } else {
            return ERC1155_ACCEPTED;
        }
    }

    function onERC1155BatchReceived(address /*_operator*/, address /*_from*/, uint256[] calldata /*_ids*/, uint256[] calldata /*_values*/, bytes calldata /*_data*/) external view returns(bytes4) {
        if (shouldRejectERC1155 == true) {
            revert("onERC1155BatchReceived: transfer not accepted");
        } else {
            return ERC1155_BATCH_ACCEPTED;
        }
    }

    // ERC165 interface support
    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return  interfaceID == 0x01ffc9a7 ||    // ERC165
                interfaceID == 0x4e2312e0;      // ERC1155_ACCEPTED ^ ERC1155_BATCH_ACCEPTED;
    }

}