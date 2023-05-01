//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
pragma abicoder v2;

import "../../external/layerzero/interfaces/ILayerZeroEndpoint.sol";
import "../../external/layerzero/interfaces/ILayerZeroReceiver.sol";
import "../TaskCreateFacet.sol";

contract LayerzeroFacet is ILayerZeroReceiver {
    InterchainStorage internal _storage;

    event ReceiveMsg(
        uint16 _srcChainId,
        address _from,
        uint16 _count,
        bytes _payload
    );
    
    event Logs(string logname, uint16 sourceChain, bytes sourceAddress, uint _nonce, bytes payload);

    function createTaskContractLayerzero(
        address _sender,
        TaskData memory _taskData
    ) external payable {
        bytes memory funcPayload = abi.encode(
            _sender,
            _taskData
        );
        bytes memory payload = abi.encode("createTaskContract", funcPayload);

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    function taskParticipateLayerzero(
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

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    function taskAuditParticipateLayerzero(
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
        bytes memory payload = abi.encode("taskAuditParticipate", funcPayload);

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    function taskStateChangeLayerzero(
        address _sender,
        address _contractAddress,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external payable{
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

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    function taskAuditDecisionLayerzero(
        address _sender,
        address _contractAddress,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external payable{
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _favour,
            _message,
            _replyTo,
            _rating
        );
        bytes memory payload = abi.encode("taskAuditDecision", funcPayload);

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    function sendMessageLayerzero(
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
        bytes memory payload = abi.encode("sendMessage", funcPayload);

        bytes memory remoteAndLocalAddresses = abi.encodePacked(address(_storage.configLayerzero.destinationAddress), address(this));
        bytes memory _adapterParams = abi.encodePacked(uint16(1), uint(3000000));

        ILayerZeroEndpoint(_storage.configLayerzero.endpoint).send{value: msg.value}(
            _storage.configLayerzero.destinationChain,
            remoteAndLocalAddresses,
            payload,
            payable(msg.sender),
            address(this),
            _adapterParams
        );
    }

    event TaskContractCreating(
        address _sender,
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string[] _tags,
        string[][] _tokenNames
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

    event taskAuditDecisioning(
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


    function lzReceive(
        uint16 _srcChainId,
        bytes memory _from,
        uint64 _nonce,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(_storage.configLayerzero.endpoint));
        address from;
        assembly {
            from := mload(add(_from, 20))
        }
        if (
            keccak256(abi.encodePacked((_payload))) ==
            keccak256(abi.encodePacked((bytes10("ff"))))
        ) {
            ILayerZeroEndpoint(_storage.configLayerzero.endpoint).receivePayload(
                1,
                bytes(""),
                address(0x0),
                1,
                1,
                bytes("")
            );
        }
        
        (string memory functionName, bytes memory funcPayload) = abi.decode(_payload, (string, bytes));
        
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
                _taskData.tags,
                _taskData.tokenNames
                // _taskData.amounts
            );
            TaskCreateFacet(_storage.configLayerzero.destinationDiamond)
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
            emit taskAuditDecisioning(
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
    
    // Endpoint.sol estimateFees() returns the fees for the message
    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        return
            ILayerZeroEndpoint(_storage.configLayerzero.endpoint).estimateFees(
                _dstChainId,
                _userApplication,
                _payload,
                _payInZRO,
                _adapterParams
            );
    }
}