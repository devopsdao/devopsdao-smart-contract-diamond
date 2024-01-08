// SPDX-License-Identifier: MIT
//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import {IERC20} from "../interfaces/IERC20.sol";


import "../libraries/LibTasks.sol";
import "../libraries/LibUtils.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";

import {IERC165} from "../interfaces/IERC165.sol";
import {IERC1155} from "../interfaces/IERC1155.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IERC721} from "../interfaces/IERC721.sol";


library LibWithdraw {
    event Logs(address contractAdr, string message);

    function appStorage() internal pure returns (TaskStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

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


    function withdraw(address _sender, address payable _addressToSend, string memory _chain, uint256 _rating) external{
        
        TaskStorage storage _storage = taskStorage();

        InterchainStorage storage _storageInterchain = LibInterchain.interchainStorage();
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
            && msg.sender != _storage.task.contractParent
        ){
            _sender = payable(msg.sender);
        }
        
        if(_sender != _storage.task.participant && _sender != _storage.task.contractOwner){
            revert('not a participant or contractOwner');
        }

        // address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;

        if (keccak256(bytes(_storage.task.taskState)) == keccak256(bytes(TASK_STATE_CANCELED)) && _sender == _storage.task.contractOwner) {
            _storage.task.contractOwner.transfer(address(this).balance);
            if (address(this).balance!= 0) {
                emit Logs(address(this), string.concat("withdrawing ETH to Ethereum address: ",LibUtils.addressToString(_storage.task.participant)));
                _storage.task.contractOwner.transfer(address(this).balance);
            }

            for (uint i = 0; i < _storage.task.tokenContracts.length; i++){
                if(_storage.task.tokenContracts[i] == address(0x0)){
                    //do nothing if it's a native token
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(0x4e2312e0)){
                    IERC1155(_storage.task.tokenContracts[i]).safeBatchTransferFrom(address(this), _storage.task.contractOwner, _storage.task.tokenIds[i], _storage.task.tokenAmounts[i], bytes(''));
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC20).interfaceId)){
                    IERC20(_storage.task.tokenContracts[i]).transferFrom(address(this), _storage.task.contractOwner, _storage.task.tokenAmounts[i][0]);
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC721).interfaceId)){
                    for (uint id = 0; id < _storage.task.tokenIds[i].length; id++){
                        IERC721(_storage.task.tokenContracts[i]).safeTransferFrom(address(this), _storage.task.contractOwner, _storage.task.tokenIds[i][id]);
                    }
                }
            }

            // IAccountFacet(_storage.task.contractParent).addCustomerRating(_sender, address(this), _rating);

        } else if (
            keccak256(bytes(_storage.task.taskState)) == keccak256(bytes(TASK_STATE_COMPLETED)) && _sender == _storage.task.participant
        ) {

            if (address(this).balance!= 0) {
                emit Logs(address(this), string.concat("withdrawing ETH to Ethereum address: ",LibUtils.addressToString(_storage.task.participant)));
                _storage.task.participant.transfer(address(this).balance);
            }

            for (uint i = 0; i < _storage.task.tokenContracts.length; i++){
                if(_storage.task.tokenContracts[i] == address(0x0)){
                    //do nothing if it's a native token
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(0x4e2312e0)){
                    IERC1155(_storage.task.tokenContracts[i]).safeBatchTransferFrom(address(this), _storage.task.participant, _storage.task.tokenIds[i], _storage.task.tokenAmounts[i], bytes(''));
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC20).interfaceId)){
                    IERC20(_storage.task.tokenContracts[i]).transferFrom(address(this), _storage.task.participant, _storage.task.tokenAmounts[i][0]);
                }
                else if(IERC165(_storage.task.tokenContracts[i]).supportsInterface(type(IERC721).interfaceId)){
                    for (uint id = 0; id < _storage.task.tokenIds[i].length; id++){
                        IERC721(_storage.task.tokenContracts[i]).safeTransferFrom(address(this), _storage.task.participant, _storage.task.tokenIds[i][id]);
                    }
                }
            }

            IAccountFacet(_storage.task.contractParent).addCustomerRating(_sender, address(this), _rating);


            // for(uint i; i < _storage.task.symbols.length; i++) {
            //     bytes memory symbolBytes = bytes(_storage.task.symbols[i]);
            //     bytes memory chainBytes = bytes(_chain);
                
            //     //check ETH balance
            //     if (address(this).balance!= 0) {
            //         emit Logs(address(this), string.concat("withdrawing ", _storage.task.symbols[i], " to Ethereum address: ",LibUtils.addressToString(_storage.task.participant)));
            //         _storage.task.participant.transfer(address(this).balance);
            //     }
                
            //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
            //     if(_tokenStorage.tokenNames[_storage.task.symbols[i]] > 0){
            //         if(_tokenStorage.tokenNames[_storage.task.symbols[i]] > 0){
            //             uint256 tokenBalance = TokenFacet(_storage.task.contractParent).balanceOf(address(this), _tokenStorage.tokenNames[_storage.task.symbols[i]]);
            //             if(tokenBalance > 0){
            //                 TokenFacet(_storage.task.contractParent).safeTransferFrom(address(this), _storage.task.participant, _tokenStorage.tokenNames[_storage.task.symbols[i]], tokenBalance, bytes(''));
            //             }
            //         }
            //     }
            //     else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && (
            //         keccak256(chainBytes) == keccak256(bytes("Ethereum")) || 
            //         keccak256(chainBytes) == keccak256(bytes("Binance")) ||
            //         keccak256(chainBytes) == keccak256(bytes("Fantom")) ||
            //         keccak256(chainBytes) == keccak256(bytes("Avalanche")) ||
            //         keccak256(chainBytes) == keccak256(bytes("Polygon"))
            //     )) {
            //         //check USDC balance
            //         address tokenAddress = IAxelarGateway(gateway_).tokenAddresses("aUSDC");
            //         uint256 contractUSDCAmount = IERC20(tokenAddress).balanceOf(address(this));
            //         IERC20(tokenAddress).approve(gateway_, contractUSDCAmount);
            //         IAxelarGateway(gateway_).sendToken(_chain, LibUtils.addressToString(_storage.task.participant), "aUSDC", contractUSDCAmount);
            //     } else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && keccak256(chainBytes) == keccak256(bytes("Moonbase"))) {
            //         emit Logs(address(this), string.concat("withdrawing ", _storage.task.symbols[i], " to ", _chain, "address:",LibUtils.addressToString(_storage.task.participant)));
            //         //check USDC balance
            //         address tokenAddress = IAxelarGateway(gateway_).tokenAddresses("aUSDC");
            //         uint256 contractUSDCAmount = IERC20(tokenAddress).balanceOf(address(this));
            //         IERC20(tokenAddress).approve(address(this), contractUSDCAmount);
            //         IERC20(tokenAddress).transferFrom(address(this), _storage.task.participant, contractUSDCAmount);
            //     }
            //     // else{
            //     //     revert RevertReason({
            //     //         message: "invalid destination network"
            //     //     });
            //     // }
            // }
        
        }
        else{
            revert('task is completed or canceled');
        }
    }
}
