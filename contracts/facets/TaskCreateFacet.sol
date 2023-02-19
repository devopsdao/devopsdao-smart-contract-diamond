// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';


// import "../libraries/LibTasks.sol";
// import "../libraries/LibInterchain.sol";
import "../libraries/LibUtils.sol";

import "../contracts/TaskContract.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../interfaces/ITokenFacet.sol";

// import "../facets/TokenFacet.sol";

import "hardhat/console.sol";



contract TaskCreateFacet is ERC1155StorageFacet {
    // TaskStorage internal _storage;
    InterchainStorage internal _storageInterchain;

    event TaskCreated(address contractAdr, string message, uint timestamp);


    function createTaskContract(address payable _sender, TaskData calldata taskData)
    external
    payable
    returns (address)
    {
        TaskStorage storage _storage = LibTasks.taskStorage();

        // address sender;
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
        ){
            _sender = payable(msg.sender);
        }


        address taskContractAddress = address(new TaskContract{value: msg.value}(
            _sender, taskData
        ));

        // string[] memory symbols;
        // mapping (string => uint) nfts;

        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        for (uint i = 0; i < taskData.symbols.length; i++){
            if(_tokenStorage.tokenNames[taskData.symbols[i]] > 0){
                TokenFacet(address(this)).safeTransferFrom(_sender, taskContractAddress, _tokenStorage.tokenNames[taskData.symbols[i]], 1, bytes(''));
            }
            else if (keccak256(bytes(taskData.symbols[i])) != keccak256(bytes("ETH"))) {
                address tokenAddress = IAxelarGateway(0x5769D84DD62a6fD969856c75c7D321b84d455929).tokenAddresses(taskData.symbols[i]);
                // amount = IERC20(tokenAddress).balanceOf(contractAddress);
                IERC20(tokenAddress).transferFrom(msg.sender, taskContractAddress, taskData.amounts[i]);
            }
        }



        // IERC20(tokenAddress).approve(address(gateway), _amount);
        _storage.taskContracts.push(taskContractAddress);
        _storage.accounts[_sender].ownerTasks.push(taskContractAddress);


        if(_storage.accountsMapping[_sender] != true){
            _storage.accountsList.push(_sender);
            _storage.accountsMapping[_sender] = true;
        }
        emit TaskCreated(taskContractAddress, 'createTaskContract', block.timestamp);

        // console.log(taskContractAddress);
        return taskContractAddress;
    }

    // function getTaskContracts()
    // external
    // view
    // returns (string memory)
    // {
    //     TaskStorage storage _storage = LibTasks.taskStorage();
    //     // console.log(
    //     // "msg.sender %s",
    //     //     msg.sender
    //     // );
    //     return "_storage.taskContracts";
    // }
    
}

