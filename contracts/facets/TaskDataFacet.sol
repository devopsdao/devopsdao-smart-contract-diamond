// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';


// import "../libraries/LibTasks.sol";
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

    function getTaskContractsByState(string memory _taskState)
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 taskCount = 0;
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            Task memory task = TaskContract(address(_storage.taskContracts[i])).getTaskInfo();
            if(keccak256(bytes(task.taskState)) == keccak256(bytes(_taskState))
            && ((keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) && _storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false) 
            || keccak256(bytes(task.taskState)) != keccak256(bytes(TASK_STATE_NEW)))
            ){
                taskCount++;
            }
        }
        address[] memory taskContracts = new address[](taskCount);
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            Task memory task = TaskContract(address(_storage.taskContracts[i])).getTaskInfo();
            if(keccak256(bytes(task.taskState)) == keccak256(bytes(_taskState))
            && ((keccak256(bytes(task.taskState)) == keccak256(bytes(TASK_STATE_NEW)) && _storage.taskContractsBlacklistMapping[_storage.taskContracts[i]] == false) 
            || keccak256(bytes(task.taskState)) != keccak256(bytes(TASK_STATE_NEW)))
            ){
                taskContracts[taskCount-1] = _storage.taskContracts[i];
            }
        }
        return taskContracts;
    }


    function getTaskContractsCustomer(address contractOwner)
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
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
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.participantTasks[participant];
    }

}

