// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';

// import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
// import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';


// import "../libraries/LibTasks.sol";
// import "../libraries/LibInterchain.sol";
import "../libraries/LibUtils.sol";

import "../contracts/TaskContract.sol";
// import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../interfaces/ITokenFacet.sol";

import {IERC165} from "../interfaces/IERC165.sol";
import {IERC1155} from "../interfaces/IERC1155.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IERC721} from "../interfaces/IERC721.sol";


import "../facets/TokenDataFacet.sol";

import "hardhat/console.sol";



contract TaskCreateFacet {
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

        // ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        // for (uint i = 0; i < taskData.symbols.length; i++){
        //     if(_tokenStorage.tokenNames[taskData.symbols[i]] > 0){
        //         TokenFacet(address(this)).safeTransferFrom(_sender, taskContractAddress, _tokenStorage.tokenNames[taskData.symbols[i]], 1, bytes(''));
        //     }
        //     else if (keccak256(bytes(taskData.symbols[i])) != keccak256(bytes("ETH"))) {
        //         address tokenAddress = IAxelarGateway(0x5769D84DD62a6fD969856c75c7D321b84d455929).tokenAddresses(taskData.symbols[i]);
        //         // amount = IERC20(tokenAddress).balanceOf(contractAddress);
        //         IERC20(tokenAddress).transferFrom(msg.sender, taskContractAddress, taskData.amounts[i]);
        //     }
        // }

        require(taskData.tokenContracts.length == taskData.tokenIds.length && taskData.tokenContracts.length == taskData.tokenAmounts.length
        , "invalid NFT data");

        for (uint i = 0; i < taskData.tokenContracts.length; i++){
            if(taskData.tokenContracts[i] == address(0x0)){
                    //do nothing if it's a native token
            }
            else if(IERC165(taskData.tokenContracts[i]).supportsInterface(0x4e2312e0)){
                // console.log('safeBatchTransferFrom supportsInterface');
                // console.log(_sender);
                // console.log(taskContractAddress);
                // console.log(taskData.tokenIds[i][0]);
                // console.log(taskData.tokenAmounts[i][0]);
                // IERC1155(taskData.tokenContracts[i]).setApprovalForAll(taskContractAddress, true);
                IERC1155(taskData.tokenContracts[i]).safeBatchTransferFrom(_sender, taskContractAddress, taskData.tokenIds[i], taskData.tokenAmounts[i], bytes(''));
            }
            else if(IERC165(taskData.tokenContracts[i]).supportsInterface(type(IERC20).interfaceId)){
                IERC20(taskData.tokenContracts[i]).transferFrom(_sender, taskContractAddress, taskData.tokenAmounts[i][0]);
            }
            else if(IERC165(taskData.tokenContracts[i]).supportsInterface(type(IERC721).interfaceId)){
                for (uint id = 0; id < taskData.tokenIds[i].length; id++){
                    IERC721(taskData.tokenContracts[i]).safeTransferFrom(_sender, taskContractAddress, taskData.tokenIds[i][id]);
                }
            }
        }


        // for (uint i = 0; i < taskData.nftIds.length; i++){
        //     TokenFacet(address(this)).safeBatchTransferFrom(_sender, taskContractAddress, taskData.nftIds, [1], bytes(''));
        // }



        // IERC20(tokenAddress).approve(address(gateway), _amount);
        _storage.taskContracts.push(taskContractAddress);
        _storage.taskContractsMapping[taskContractAddress] = true;
        _storage.accounts[_sender].ownerTasks.push(taskContractAddress);

        if(_storage.accountsMapping[_sender] != true){
            _storage.accountsList.push(_sender);
            _storage.accountsMapping[_sender] = true;
        }
        //set the account owner if it is not set
        if(_storage.accounts[_sender].accountOwner == address(0x0)){
            _storage.accounts[_sender].accountOwner = _sender;
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

