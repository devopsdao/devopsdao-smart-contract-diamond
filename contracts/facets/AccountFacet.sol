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
    bool public constant contractAccountFacet = true;

    event AccountCreated(address ownerAddr, string message, uint timestamp);


    function addAccountToBlacklist(address accountAddress)
    external
    {
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'governor');
        require(balance > 0, 'must hold Governor NFT to add to blacklist');
        require(_storage.accountsMapping[accountAddress] == true, 'account does not exist');
        require(_storage.accountsBlacklistMapping[accountAddress] != true, 'account is already blacklisted');
        _storage.accountsBlacklist.push(accountAddress);
        _storage.accountsBlacklistMapping[accountAddress] = true;
    }

    function removeAccountFromBlacklist(address accountAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'governor');
        require(balance > 0, 'must hold Governor NFT to remove from blacklist');
        require(_storage.accountsMapping[accountAddress] == true, 'account does not exist');

        for (uint256 index = 0; index < _storage.accountsBlacklist.length; index++) {
            if(_storage.accountsBlacklist[index] == accountAddress){
                _storage.accountsBlacklistMapping[accountAddress] = false;
                for (uint i = index; i<_storage.accountsBlacklist.length-1; i++){
                    _storage.accountsBlacklist[i] = _storage.accountsBlacklist[i+1];
                }
                _storage.accountsBlacklist.pop();
            }
        }
    }

    function addAccountData(address _sender, string calldata identity, string calldata about) external{
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
        _storage.accounts[_sender].identity = identity;
        _storage.accounts[_sender].about = about;
        _storage.identities[identity] = _sender;
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

    //for old task compatibility
    function addAgreedTask(address _performer, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_performer].accountOwner == address(0x0)){
            _storage.accounts[_performer].accountOwner = _performer;
        }
        // if(_storage.accounts[_customer].accountOwner == address(0x0)){
        //     _storage.accounts[_customer].accountOwner = _customer;
        // }
        _storage.accounts[_performer].agreedTasks.push(taskAddress);
        // _storage.accounts[_customer].customerAgreedTasks.push(taskAddress);
    }

    function addPerformerAgreedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].agreedTasks.push(taskAddress);
    }

    function addCustomerAgreedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].customerAgreedTasks.push(taskAddress);
    }

    function addAuditAgreedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].auditAgreedTasks.push(taskAddress);
    }

    function addPerformerAuditedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].performerAuditedTasks.push(taskAddress);
    }

    function addCustomerAuditedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].customerAuditedTasks.push(taskAddress);
    }

    function addCompletedTask(address _performer, address _customer, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_performer].accountOwner == address(0x0)){
            _storage.accounts[_performer].accountOwner = _performer;
        }
        if(_storage.accounts[_customer].accountOwner == address(0x0)){
            _storage.accounts[_customer].accountOwner = _customer;
        }
        _storage.accounts[_performer].completedTasks.push(taskAddress);
        _storage.accounts[_customer].customerCompletedTasks.push(taskAddress);
    }

    function addPerformerCompletedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].completedTasks.push(taskAddress);
    }

    function addCustomerCompletedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].customerCompletedTasks.push(taskAddress);
    }

    function addAuditCompletedTask(address _sender, address taskAddress) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        // if(_storage.accountsMapping[_sender] != true){
        //     _storage.accountsList.push(_sender);
        //     _storage.accountsMapping[_sender] = true;
        // }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
        }
        _storage.accounts[_sender].auditCompletedTasks.push(taskAddress);
    }

    function addPerformerRating(address _account, address taskAddress, uint256 rating) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        _storage.accounts[_account].performerRatings.push(rating);
    }

    function addCustomerRating(address _account, address taskAddress, uint256 rating) external{
        TaskStorage storage _storage = LibTasks.taskStorage();
        require(_storage.taskContractsMapping[msg.sender] == true, 'task does not exist');
        require(msg.sender == taskAddress, 'sender must be task contract');

        _storage.accounts[_account].customerRatings.push(rating);
    }


    function addTokenBalance(address account, string memory tokenName, uint256 tokenBalance, bool isSpent) internal {
        TaskStorage storage _storage = LibTasks.taskStorage();
        
        if (isSpent) {
            if (_storage.accounts[account].spentTokenBalances[tokenName] == 0) {
                _storage.accounts[account].spentTokenNames.push(tokenName);
            }
            _storage.accounts[account].spentTokenBalances[tokenName] += tokenBalance;
        } else {
            if (_storage.accounts[account].earnedTokenBalances[tokenName] == 0) {
                _storage.accounts[account].earnedTokenNames.push(tokenName);
            }
            _storage.accounts[account].earnedTokenBalances[tokenName] += tokenBalance;
        }
    }

    function addPerformerSpentTokens(address performer, string[] memory tokenNames, uint256[] memory tokenBalances) external {
        // require(msg.sender == tx.origin, "Only EOA");
        
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // require(_storage.accounts[performer].accountOwner == performer, "Invalid performer");
        
        for (uint256 i = 0; i < tokenNames.length; i++) {
            addTokenBalance(performer, tokenNames[i], tokenBalances[i], true);
        }
    }

    function addPerformerEarnedTokens(address performer, string[] memory tokenNames, uint256[] memory tokenBalances) external {
        // require(msg.sender == tx.origin, "Only EOA");
        
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // require(_storage.accounts[performer].accountOwner == performer, "Invalid performer");
        
        for (uint256 i = 0; i < tokenNames.length; i++) {
            addTokenBalance(performer, tokenNames[i], tokenBalances[i], false);
        }
    }

    function addCustomerSpentTokens(address customer, string[] memory tokenNames, uint256[] memory tokenBalances) external {
        // require(msg.sender == tx.origin, "Only EOA");
        
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // require(_storage.accounts[customer].accountOwner == customer, "Invalid customer");
        
        for (uint256 i = 0; i < tokenNames.length; i++) {
            addTokenBalance(customer, tokenNames[i], tokenBalances[i], true);
        }
    }

    function addCustomerEarnedTokens(address customer, string[] memory tokenNames, uint256[] memory tokenBalances) external {
        // require(msg.sender == tx.origin, "Only EOA");
        
        // TaskStorage storage _storage = LibTasks.taskStorage();
        // require(_storage.accounts[customer].accountOwner == customer, "Invalid customer");
        
        for (uint256 i = 0; i < tokenNames.length; i++) {
            addTokenBalance(customer, tokenNames[i], tokenBalances[i], false);
        }
    }





}

