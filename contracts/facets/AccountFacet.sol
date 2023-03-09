// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';


import "../libraries/LibTasks.sol";
import "../libraries/LibInterchain.sol";
// import "../libraries/LibUtils.sol";

// import "../contracts/TaskContract.sol";
// import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../facets/TokenFacet.sol";
import "../facets/TokenDataFacet.sol";


import "hardhat/console.sol";



contract AccountFacet  {

    event AccountCreated(address ownerAddr, string message, uint timestamp);


    function addAccountToBlacklist(address taskAddress)
    external
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'auditor');
        require(balance > 0, 'must hold Auditor NFT to add to blacklist');
        require(_storage.taskContractsMapping[taskAddress] == true, 'task does not exist');
        require(_storage.accountsBlacklistMapping[taskAddress] != true, 'task is already blacklisted');
        _storage.accountsBlacklist.push(taskAddress);
        _storage.accountsBlacklistMapping[taskAddress] = true;
    }

    function removeAccountFromBlacklist(address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'auditor');
        require(balance > 0, 'must hold Auditor NFT to add to blacklist');
        require(_storage.taskContractsMapping[taskAddress] == true, 'task does not exist');

        for (uint256 index = 0; index < _storage.accountsBlacklist.length; index++) {
            if(_storage.accountsBlacklist[index] == taskAddress){
                _storage.accountsBlacklistMapping[taskAddress] = false;
                for (uint i = index; i<_storage.accountsBlacklist.length-1; i++){
                    _storage.accountsBlacklist[i] = _storage.accountsBlacklist[i+1];
                }
                _storage.accountsBlacklist.pop();
            }
        }
    }

    function addAccountData(address _sender, string calldata nickname, string calldata about) external{
        InterchainStorage storage _storageInterchain = LibInterchain.interchainStorage();
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
        ){
            _sender = payable(msg.sender);
        }
        require(msg.sender == _sender, 'sender must be account owner');
        TaskStorage storage _storage = LibTasks.taskStorage();
        _storage.accounts[_sender].nickname = nickname;
        _storage.accounts[_sender].nickname = about;
    }

    function addParticipantTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        if(_storage.accountsMapping[_sender] != true){
            _storage.accountsList.push(_sender);
            _storage.accountsMapping[_sender] = true;
        }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].participantTasks.push(taskAddress);
    }

    function addAuditParticipantTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        if(_storage.accountsMapping[_sender] != true){
            _storage.accountsList.push(_sender);
            _storage.accountsMapping[_sender] = true;
        }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].auditParticipantTasks.push(taskAddress);
    }

    function addPerformerRating(address _sender, address taskAddress, uint256 rating) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        _storage.accounts[_sender].performerRatings.push(rating);
    }

    function addCustomerRating(address _sender, address taskAddress, uint256 rating) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        _storage.accounts[_sender].customerRatings.push(rating);
    }


    function getAccountsList()
    external
    view
    returns (address[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        return _storage.accountsList;
    }

    function getAccountsData(address[] memory accountAddresses)
    external
    view
    returns (Account[] memory)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        Account[] memory accounts = new Account[](accountAddresses.length);
        for (uint256 i = 0; i < accountAddresses.length; i++) {
            accounts[i] = _storage.accounts[accountAddresses[i]];
        }
        return accounts;
    }

    // function getAccountsDataDyn(address[] memory accountAddresses)
    // external
    // view
    // returns (Account[] memory)
    // {
    //     TaskStorage storage _storage = LibTasks.taskStorage();
    //     Account[] memory accounts = new Account[](accountAddresses.length);
    //     for (uint256 i = 0; i < accountAddresses.length; i++) {
    //         Account memory account;
    //         address[] memory customerContracts = getTaskContractsCustomer(accountAddresses[i]);
    //         uint256 symbolCount = 0;
    //         for (uint256 idx = 0; idx < customerContracts.length; idx++) {
    //             Task memory task = TaskContract(customerContracts[idx]).getTaskData();
    //             symbolCount = symbolCount + task.symbols.length;
    //         }
    //         string[] memory spentSymbols = new string[](symbolCount);
    //         uint256[] memory spentSymbolAmounts = new uint256[](symbolCount);
    //         uint256 symbolIdx = 0;
    //         for (uint256 idx = 0; idx < customerContracts.length; idx++) {
    //             Task memory task = TaskContract(customerContracts[idx]).getTaskData();
    //             for (uint256 index = 0; index < task.symbols.length; index++) {
    //                 spentSymbols[symbolIdx] = task.symbols[symbolIdx];
    //                 spentSymbolAmounts[symbolIdx] = task.amounts[symbolIdx];
    //                 symbolIdx++;
    //             }
    //         }
    //         address[] memory performerContracts = getTaskContractsPerformer(accountAddresses[i]);
    //         account.performerTaskCount = performerContracts.length;
    //         accounts[i] = account;
    //     }
    //     return accounts;
    // }

}

