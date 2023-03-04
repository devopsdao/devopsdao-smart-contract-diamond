pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

import "../libraries/LibTasks.sol";
import "../libraries/LibTasksAudit.sol";
import "../libraries/LibChat.sol";
import "../libraries/LibWithdraw.sol";
import "../libraries/LibInterchain.sol";

import "../facets/TokenDataFacet.sol";


// import "../facets/DiamondLoupeFacet.sol";

import "hardhat/console.sol";

// error RevertReason (string message);


contract TaskContract is ERC1155StorageFacet  {
    // TaskStorage internal _storage;
    InterchainStorage internal _storageInterchain;

    event Logs(address contractAdr, string message);
    event LogsValue(address contractAdr, string message, uint value);
    event TaskUpdated(address contractAdr, string message, uint timestamp);

    constructor(
        address payable _sender,
        TaskData memory _taskData
    ) payable {
        TaskStorage storage _storage = LibTasks.taskStorage();
        _storage.tasks[address(this)].nanoId = _taskData.nanoId;
        _storage.tasks[address(this)].taskType = _taskData.taskType;
        _storage.tasks[address(this)].title = _taskData.title;
        _storage.tasks[address(this)].description = _taskData.description;
        _storage.tasks[address(this)].tags = _taskData.tags;
        _storage.tasks[address(this)].symbols = _taskData.symbols;
        _storage.tasks[address(this)].amounts = _taskData.amounts;
        _storage.tasks[address(this)].taskState = TASK_STATE_NEW;
        _storage.tasks[address(this)].contractParent = msg.sender;
        _storage.tasks[address(this)].contractOwner = _sender;
        _storage.tasks[address(this)].createTime = block.timestamp;

        emit TaskUpdated(address(this), 'TaskContract', block.timestamp);
    }

    function getTaskData() external view returns (Task memory task)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // uint256 balance = TokenFacet(_storage.tasks[address(this)].contractParent).balanceOf(msg.sender, 1);
        task = _storage.tasks[address(this)];
        for(uint i; i < task.tags.length; i++) {
            task.tags[i];
        }
        return _storage.tasks[address(this)];
    }


    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function transferToaddress(address payable _addressToSend, string memory _chain) external payable {
        // address payable contractOwner = _storage.tasks[address(this)].contractOwner;
        // address payable participant = _storage.tasks[address(this)].participant;
        // uint256 balance = address(this).balance;
        // string memory taskState = _storage.tasks[address(this)].taskState;
        // string[] memory symbols = _storage.tasks[address(this)].symbols;
        // uint256[] memory amounts = _storage.tasks[address(this)].amounts;

        LibWithdraw.withdraw(_addressToSend, _chain);
        emit TaskUpdated(address(this), 'transferToaddress', block.timestamp);
    }

    function taskParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        LibTasks.taskParticipate(_sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'taskParticipate', block.timestamp);
    }


    function taskAuditParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // address[] memory to = new address[](1);
        // uint256[] memory amount = new uint256[](1);
        // to[0] = _sender;
        // amount[0] = uint256(1);
        // TokenFacet(_storage.tasks[address(this)].contractParent).mintFungible(1, to, amount);
        // uint256 balance = TokenDataFacet(_storage.tasks[address(this)].contractParent).balanceOfName(msg.sender, 'auditor');
        // // console.log(balance);
        // require(balance>0, 'must hold Auditor NFT to audit');
        
        // if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
        //     && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
        //     && msg.sender != _storageInterchain.configLayerzero.sourceAddress
        //     && msg.sender != _storageInterchain.configWormhole.sourceAddress
        // ){
        //     _sender = payable(msg.sender);
        // }
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
        TaskStorage storage _storage = LibTasks.taskStorage();
        // uint256 balance = TokenDataFacet(_storage.tasks[address(this)].contractParent).balanceOfName(msg.sender, 'auditor');
        // // console.log(balance);
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

}