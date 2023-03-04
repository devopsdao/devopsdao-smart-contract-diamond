// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';


import "../libraries/LibTasks.sol";
// import "../libraries/LibInterchain.sol";
import "../libraries/LibUtils.sol";

import "../contracts/TaskContract.sol";
// import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../facets/TokenFacet.sol";
// import "../facets/TokenDataFacet.sol";


import "hardhat/console.sol";



contract TaskDataFacet  {
    // TaskStorage internal _storage;
    // InterchainStorage internal _storageInterchain;

    event TaskCreated(address contractAdr, string message, uint timestamp);

    // struct TaskContractData{
    //     address sender;
    //     string nanoId;
    //     string taskType;
    //     string title;
    //     string description;
    //     string[] tags;
    //     string[] symbols;
    //     uint256[] amounts;
    // }



    // initial: new, contractor chosen: agreed, work in progress: progress, completed: completed, canceled

    function addTaskToBlacklist(address taskAddress)
    external
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'auditor');
        // require(balance > 0, 'must hold Auditor NFT to add to blacklist');
        require(_storage.taskContractsBlacklistMapping[taskAddress] != true, 'task is already blacklisted');
        _storage.taskContractsBlacklist.push(taskAddress);
        _storage.taskContractsBlacklistMapping[taskAddress] = true;
    }

    function removeTaskFromBlacklist(address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'auditor');
        require(balance > 0, 'must hold Auditor NFT to add to blacklist');
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
        TaskStorage storage _storage = LibTasks.taskStorage();
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // console.log(
        // "msg.sender %s",
        //     msg.sender
        // );
        return _storage.taskContracts;
    }

    function getTaskContractsByState(string calldata _taskState)
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 taskCount = 0;
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            Task memory task = TaskContract(address(_storage.taskContracts[i])).getTaskData();
            if(keccak256(bytes(task.taskState)) == keccak256(bytes(_taskState))
            && ((keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) && _storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false) 
            || keccak256(bytes(task.taskState)) != keccak256(bytes(TASK_STATE_NEW)))
            ){
                taskCount++;
            }
        }
        address[] memory taskContracts = new address[](taskCount);
        uint256 foundTaskId = 0;
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            Task memory task = TaskContract(address(_storage.taskContracts[i])).getTaskData();
            if(keccak256(bytes(task.taskState)) == keccak256(bytes(_taskState))
            && ((keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) && _storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false) 
            || keccak256(bytes(task.taskState)) != keccak256(bytes(TASK_STATE_NEW)))
            ){
                taskContracts[foundTaskId] = _storage.taskContracts[i];
                foundTaskId++;
            }
        }
        return taskContracts;
    }


    function getTaskContractsCustomers(address[] calldata contractOwners)
    public
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // if(ownerTasks[contractOwner].length > 0){
        //     return ownerTasks[contractOwner];
        // }
        uint256 contractCount = 0;
        for (uint256 i = 0; i < contractOwners.length; i++) {
            // return _storage.accounts[contractOwner].ownerTasks;
            contractCount = contractCount + _storage.accounts[contractOwners[i]].ownerTasks.length;
        }

        address[] memory ownerTasks = new address[](contractCount);
        for (uint256 i = 0; i < contractOwners.length; i++) {
            // return _storage.accounts[contractOwner].ownerTasks;
            for(uint256 idx = 0; idx < _storage.accounts[contractOwners[i]].ownerTasks.length; idx++){
                ownerTasks[i] = _storage.accounts[contractOwners[i]].ownerTasks[idx];
            }
        }
        return ownerTasks;
    }

    function getTaskContractsPerformers(address[] calldata participants)
    public
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // if(ownerTasks[contractOwner].length > 0){
        //     return ownerTasks[contractOwner];
        // }
        uint256 contractCount = 0;
        for (uint256 i = 0; i < participants.length; i++) {
            // return _storage.accounts[contractOwner].ownerTasks;
            contractCount = contractCount + _storage.accounts[participants[i]].participantTasks.length;
        }

        address[] memory participantTasks = new address[](contractCount);
        for (uint256 i = 0; i < participants.length; i++) {
            // return _storage.accounts[contractOwner].ownerTasks;
            for(uint256 idx = 0; idx < _storage.accounts[participants[i]].participantTasks.length; idx++){
                participantTasks[i] = _storage.accounts[participants[i]].participantTasks[idx];
            }
        }
        return participantTasks;
    }


    function getTaskContractsCustomer(address contractOwner)
    public
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        // if(ownerTasks[contractOwner].length > 0){
        //     return ownerTasks[contractOwner];
        // }
        return _storage.accounts[contractOwner].ownerTasks;
    }

    function getTaskContractsPerformer(address participant)
    public
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accounts[participant].participantTasks;
    }

    function getTasksData(address[] calldata taskContracts)
    external
    view
    returns (TaskWithBalance[] memory)
    {
        TaskWithBalance[] memory tasks = new TaskWithBalance[](taskContracts.length);
        
        for (uint256 i = 0; i < taskContracts.length; i++) {
            TaskWithBalance memory taskWithBalance;
            // tasks[i] = TaskContract(address(_storage.taskContracts[i])).getTaskData();
            taskWithBalance.task = TaskContract(taskContracts[i]).getTaskData();
            taskWithBalance.tokenNames = new string[](taskWithBalance.task.symbols.length);
            taskWithBalance.tokenBalances = new uint256[](taskWithBalance.task.symbols.length);

            for (uint256 idx = 0; idx < taskWithBalance.task.symbols.length; idx++) {
                taskWithBalance.tokenNames[idx] = taskWithBalance.task.symbols[idx];
                if(keccak256(bytes(taskWithBalance.task.symbols[idx])) == keccak256(bytes('ETH'))){
                    taskWithBalance.tokenBalances[idx] = TaskContract(taskContracts[i]).getBalance();
                }
                else{
                    taskWithBalance.tokenBalances[idx] = TokenDataFacet(address(this)).balanceOfName(taskContracts[i], taskWithBalance.task.symbols[idx]);
                }
            }
            tasks[i] = taskWithBalance;
            // symbolCount = symbolCount + task.symbols.length;
        }
        return tasks;
    }

}

