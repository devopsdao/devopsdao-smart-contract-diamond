//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import "../facets/TasksFacet.sol";


contract AxelarGMP is AxelarExecutable {
    IAxelarGasService public immutable gasReceiver;

    constructor(address gateway_, address gasReceiver_) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
    }

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    {

        bytes memory payload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
        string memory destinationChain = 'Moonbeam';
        string memory destinationAddress = '0xc1630769E8828dac92Ddf213037FD04BE4f52827';

        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    // function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    // external
    // payable
    // {
    //     address tokenAddress = gateway.tokenAddresses(_symbol);
    //     IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);
    //     IERC20(tokenAddress).approve(address(gateway), _amount);
    //     bytes memory payload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
    //     string memory destinationChain = 'Moonbase';
    //     string memory destinationAddress = '0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01';
    //     if (msg.value > 0) {
    //         gasReceiver.payNativeGasForContractCallWithToken{ value: msg.value }(
    //             address(this),
    //             destinationChain,
    //             destinationAddress,
    //             payload,
    //             _symbol,
    //             _amount,
    //             msg.sender
    //         );
    //     }
    //     gateway.callContractWithToken(destinationChain, destinationAddress, payload, _symbol, _amount);
    // }

    event Logs(string sourceChain, string sourceAddress, bytes payload);

    event TaskContractCreating(
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string _symbol,
        uint256 _amount
    );
    // Handles calls created by setAndSend. Updates this contract's value
    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        emit Logs(sourceChain_, sourceAddress_, payload_);
        (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(payload_, (string, string, string, string, string, uint256));
        emit TaskContractCreating(_nanoId, _taskType, _title, _description, _symbol, _amount);
        TasksFacet(address(0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01)).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
    }


    // function _executeWithToken(
    //     string calldata,
    //     string calldata,
    //     bytes calldata payload,
    //     string calldata tokenSymbol,
    //     uint256 amount
    // ) internal override //returns(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    // {
    //     (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(payload, (string, string, string, string, string, uint256));

    //     TasksFacet(address(this)).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
    // }
}