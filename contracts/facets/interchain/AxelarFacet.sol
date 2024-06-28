//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import "../TaskCreateFacet.sol";
import "../../contracts/TaskContract.sol";


contract AxelarFacet is IAxelarExecutable {
    bool public constant contractAxelarFacet = true;
    InterchainStorage internal _storage;

    IAxelarGateway public gateway;

    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external override {
        bytes32 payloadHash = keccak256(payload);
        if (!gateway.validateContractCall(commandId, sourceChain, sourceAddress, payloadHash))
            revert NotApprovedByGateway();
        _execute(sourceChain, sourceAddress, payload);
    }

    function executeWithToken(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external override {
        bytes32 payloadHash = keccak256(payload);
        if (
            !IAxelarGateway(_storage.configAxelar.gateway)
                .validateContractCallAndMint(
                    commandId,
                    sourceChain,
                    sourceAddress,
                    payloadHash,
                    tokenSymbol,
                    amount
                )
        ) revert NotApprovedByGateway();

        //@todo implement execution with token
        // _executeWithToken(sourceChain, sourceAddress, payload, tokenSymbol, amount);
    }

    function createTaskContractAxelar(
        address _sender,
        TaskData memory _taskData
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _taskData
        );
        bytes memory payload = abi.encode("createTaskContract", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    function taskParticipateAxelar(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external payable{
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("taskParticipate", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    function taskAuditParticipateAxelar(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("taskAuditParticipate", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    function taskStateChangeAxelar(
        address _sender,
        address _contractAddress,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _participant,
            _state,
            _message,
            _replyTo,
            _rating
        );
        bytes memory payload = abi.encode("taskStateChange", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    function taskAuditDecisionAxelar(
        address _sender,
        address _contractAddress,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _favour,
            _message,
            _replyTo,
            _rating
        );
        bytes memory payload = abi.encode("taskAuditDecision", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    function sendMessageAxelar(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("sendMessage", funcPayload);

        if (msg.value > 0) {
            IAxelarGasService(_storage.configAxelar.gasReceiver)
                .payNativeGasForContractCall{value: msg.value}(
                address(this),
                _storage.configAxelar.destinationChain,
                _storage.configAxelar.destinationAddress,
                payload,
                msg.sender
            );
        }
        IAxelarGateway(_storage.configAxelar.gateway).callContract(
            _storage.configAxelar.destinationChain,
            _storage.configAxelar.destinationAddress,
            payload
        );
    }

    event Logs(
        string logname,
        string sourceChain,
        string sourceAddress,
        bytes payload
    );
    event LogSimple(string logname);

    event TaskContractCreating(
        address _sender,
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string[] _tags
        // string[][] _tokenNames
        // uint256[] _amount
    );

    event TaskParticipating(
        address _sender,
        address _contractAddress,
        string _message,
        uint256 _replyTo
    );

    event TaskStateChanging(
        address _sender,
        address _contractAddress,
        address _participant,
        string _state,
        string _message,
        uint256 _replyTo,
        uint256 _rating
    );

    event TaskAuditDecisioning(
        address _sender,
        address _contractAddress,
        string _favour,
        string _message,
        uint256 _replyTo,
        uint256 _rating
    );

    event TaskSendMessaging(
        address _sender,
        address _contractAddress,
        string _message,
        uint256 _replyTo
    );

    // Handles calls created by setAndSend. Updates this contract's value
    function _execute(
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal {
        emit Logs("axelarExecute", _sourceChain, _sourceAddress, _payload);

        (string memory functionName, bytes memory funcPayload) = abi.decode(
            _payload,
            (string, bytes)
        );

        if (keccak256(bytes(functionName)) == keccak256("createTaskContract")) {
            (
                address _sender,
                TaskData memory _taskData
            ) = abi.decode(
                    funcPayload,
                    (address, TaskData)
                );
            emit TaskContractCreating(
                _sender,
                _taskData.nanoId,
                _taskData.taskType,
                _taskData.title,
                _taskData.description,
                _taskData.tags
                // _taskData.tokenNames
                // _taskData.amounts
            );
            TaskCreateFacet(_storage.configAxelar.destinationDiamond)
                .createTaskContract(
                    payable(_sender),
                    _taskData
                );
        } else if (
            keccak256(bytes(functionName)) == keccak256("taskParticipate")
        ) {
            (
                address _sender,
                address payable _contractAddress,
                string memory _message,
                uint256 _replyTo
            ) = abi.decode(funcPayload, (address, address, string, uint256));
            emit TaskParticipating(_sender, _contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).taskParticipate(_sender, _message, _replyTo);
        } else if (
            keccak256(bytes(functionName)) == keccak256("taskAuditParticipate")
        ) {
            (
                address _sender,
                address payable _contractAddress,
                string memory _message,
                uint256 _replyTo
            ) = abi.decode(funcPayload, (address, address, string, uint256));
            emit TaskParticipating(_sender, _contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).taskAuditParticipate(
                _sender,
                _message,
                _replyTo
            );
        } else if (
            keccak256(bytes(functionName)) == keccak256("taskStateChange")
        ) {
            (
                address _sender,
                address payable _contractAddress,
                address payable _participant,
                string memory _state,
                string memory _message,
                uint256 _replyTo,
                uint256 _rating
            ) = abi.decode(
                    funcPayload,
                    (address, address, address, string, string, uint256, uint256)
                );
            emit TaskStateChanging(
                _sender,
                _contractAddress,
                _participant,
                _state,
                _message,
                _replyTo,
                _rating
            );
            TaskContract(_contractAddress).taskStateChange(
                _sender,
                _participant,
                _state,
                _message,
                _replyTo,
                _rating
            );
        } else if (
            keccak256(bytes(functionName)) == keccak256("taskAuditDecision")
        ) {
            (
                address _sender,
                address payable _contractAddress,
                string memory _favour,
                string memory _message,
                uint256 _replyTo,
                uint256 _rating
            ) = abi.decode(
                    funcPayload,
                    (address, address, string, string, uint256, uint256)
                );
            emit TaskAuditDecisioning(
                _sender,
                _contractAddress,
                _favour,
                _message,
                _replyTo,
                _rating
            );
            TaskContract(_contractAddress).taskAuditDecision(
                _sender,
                _favour,
                _message,
                _replyTo,
                _rating
            );
        } else if (keccak256(bytes(functionName)) == keccak256("sendMessage")) {
            (
                address _sender,
                address payable _contractAddress,
                string memory _message,
                uint256 _replyTo
            ) = abi.decode(funcPayload, (address, address, string, uint256));
            emit TaskSendMessaging(_sender, _contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).sendMessage(_sender, _message, _replyTo);
        }
    }

    //@TODO implement sending with Token
    // function _executeWithToken(
    //     string calldata,
    //     string calldata,
    //     bytes calldata payload,
    //     string calldata tokenSymbol,
    //     uint256 amount
    // ) internal override //returns(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    // {
    //     (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(payload, (string, string, string, string, string, uint256));

    //     TaskCreateFacet(address(this)).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
    // }
    // function gateway() external view override returns (IAxelarGateway) {}
}