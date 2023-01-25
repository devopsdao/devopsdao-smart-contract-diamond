// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {LibDiamond} from '../libraries/LibDiamond.sol';

import '../interfaces/IDiamondLoupe.sol';

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';


import "../libraries/LibAppStorage.sol";
import "../libraries/LibUtils.sol";

import "../contracts/TaskContract.sol";

import "hardhat/console.sol";



contract TasksFacet {
    TasksStorage internal _storage;
    IAxelarGateway public immutable gateway;

    event TaskCreated(address contractAdr, string message, uint timestamp);


    event JobContractCreated(
        string nanoId,
        address taskAddress,
        address taskOwner,
        string title,
        string description,
        string symbol,
        uint256 amount
    );


    constructor() {
        address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;
        gateway = IAxelarGateway(gateway_);
    }

    // initial: new, contractor chosen: agreed, work in progress: progress, completed: completed, canceled

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    returns (address)
    {
        TaskContract taskContract = new TaskContract{value: msg.value}(
            _nanoId,
            _taskType,
            _title,
            _description,
            _symbol,
            payable(msg.sender)
        );


        if (keccak256(bytes(_symbol)) != keccak256(bytes("ETH"))) {
            address tokenAddress = gateway.tokenAddresses(_symbol);
            // amount = IERC20(tokenAddress).balanceOf(contractAddress);
            IERC20(tokenAddress).transferFrom(msg.sender, address(taskContract), _amount);
        }
        // IERC20(tokenAddress).approve(address(gateway), _amount);
        _storage.taskContracts.push(address(taskContract));
        _storage.ownerTasks[msg.sender].push(address(taskContract));
        emit TaskCreated(address(taskContract), 'createTaskContract', block.timestamp);

        return address(taskContract);
    }

    function addTaskToBlacklist(address taskAddress)
    external
    {
        _storage.taskContractsBlacklist.push(taskAddress);
        _storage.taskContractsBlacklistMapping[taskAddress] = true;
    }

    function removeTaskFromBlacklist(address taskAddress) external{
        for (uint256 index = 0; index < _storage.taskContractsBlacklist.length; index++) {
            if(_storage.taskContractsBlacklist[index] == taskAddress){
                _storage.taskContractsBlacklistMapping[taskAddress] = false;
                for (uint i = index; i<_storage.taskContractsBlacklist.length-1; i++){
                    _storage.taskContractsBlacklist[i] = _storage.taskContractsBlacklist[i+1];
                }
                _storage.taskContractsBlacklist.pop();
            }
        }
    }

    function getTaskContracts()
    external
    view
    returns (address[] memory)
    {
        // console.log(
        // "msg.sender %s",
        //     msg.sender
        // );
        return _storage.taskContracts;
    }

    function getTaskContractsByState(string memory _taskState)
    external
    view
    returns (address[] memory)
    {
        address[] memory taskContracts;
        uint256 taskCount = 0;
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            if(keccak256(bytes(_storage.tasks[_storage.taskContracts[i]].taskState)) == keccak256(bytes(_taskState))
            && ((keccak256(bytes(_storage.tasks[_storage.taskContracts[i]].taskState)) == keccak256(bytes(TASK_STATE_NEW)) && _storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false) 
            || keccak256(bytes(_storage.tasks[_storage.taskContracts[i]].taskState)) != keccak256(bytes(TASK_STATE_NEW)))){
                taskContracts[taskCount] = _storage.taskContracts[i];
                taskCount++;
            }
        }
        return taskContracts;
    }


    function getTaskContractsCustomer(address contractOwner)
    external
    view
    returns (address[] memory)
    {
        // if(ownerTasks[contractOwner].length > 0){
        //     return ownerTasks[contractOwner];
        // }
        return _storage.ownerTasks[contractOwner];
    }

    function getTaskContractsPerformer(address participant)
    external
    view
    returns (address[] memory)
    {
        return _storage.participantTasks[participant];
    }
}


