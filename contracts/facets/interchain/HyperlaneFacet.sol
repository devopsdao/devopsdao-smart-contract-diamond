// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import "@hyperlane-xyz/core/interfaces/IMailbox.sol";
import '../../external/hyperlane/interfaces/IInbox.sol';
import '../../external/hyperlane/interfaces/IOutbox.sol';
import "../TaskCreateFacet.sol";

contract HyperlaneFacet {
    bool public constant contractHyperlaneFacet = true;
    InterchainStorage internal _storage;

    event SentMessage(uint32 destinationDomain, address destinationAddress, bytes payload);

    function createTaskContractHyperlane(
        address _sender,
        TaskData memory _taskData
    ) external {
        bytes memory funcPayload = abi.encode(
            _sender,
            _taskData
        );
        bytes memory payload = abi.encode("createTaskContract", funcPayload);
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }

    function taskParticipateHyperlane(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("taskParticipate", funcPayload);
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }

    function taskAuditParticipateHyperlane(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("taskAuditParticipate", funcPayload);
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }

    function taskStateChangeHyperlane(
        address _sender,
        address _contractAddress,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external {
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
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }

    function taskAuditDecisionHyperlane(
        address _sender,
        address _contractAddress,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    ) external {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _favour,
            _message,
            _replyTo,
            _rating
        );
        bytes memory payload = abi.encode("taskAuditDecision", funcPayload);
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }

    function sendMessageHyperlane(
        address _sender,
        address _contractAddress,
        string memory _message,
        uint256 _replyTo
    ) external {
        bytes memory funcPayload = abi.encode(
            _sender,
            _contractAddress,
            _message,
            _replyTo
        );
        bytes memory payload = abi.encode("sendMessage", funcPayload);
        IOutbox(_storage.configHyperlane.ethereumOutbox).dispatch(
            _storage.configHyperlane.destinationDomain,
            addressToBytes32(_storage.configHyperlane.destinationAddress),
            payload
        );
        emit SentMessage(_storage.configHyperlane.destinationDomain, _storage.configHyperlane.destinationAddress, payload);
    }



    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);


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

    function handle(
        uint32 _origin,
        bytes32 _sourceAddress,
        bytes calldata _payload
    ) external {
        emit ReceivedMessage(_origin, _sourceAddress, _payload);
        
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
                _taskData.tags
                // _taskData.tokenNames
                // _taskData.amounts
            );
            TaskCreateFacet(_storage.configHyperlane.destinationDiamond)
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


    // alignment preserving cast
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    // alignment preserving cast
    function bytes32ToAddress(bytes32 _buf) internal pure returns (address) {
        return address(uint160(uint256(_buf)));
    }

}



