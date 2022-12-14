//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../external/wormhole/interfaces/IWormhole.sol";
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import "../facets/TasksFacet.sol";
import "../contracts/TaskContract.sol";


contract Wormhole {
    mapping(address => string) public lastMessage;

    IWormhole immutable core_bridge;

    mapping(bytes32 => mapping(uint16 => bool)) public myTrustedContracts;
    mapping(bytes32 => bool) public processedMessages;
    uint16 immutable chainId;
    string destinationAddress;
    address destinationDiamond;
    uint16 nonce = 0;

    constructor(uint16 _chainId, address wormhole_core_bridge_address, string memory destinationAddress_, address destinationDiamond_) {
        chainId = _chainId;
        core_bridge = IWormhole(wormhole_core_bridge_address);
        destinationAddress = destinationAddress_;
        destinationDiamond = destinationDiamond_;
    }

        // Public facing function to send a message across chains
    function sendMessage(
        string memory message,
        address destAddress,
        uint16 destChainId
    ) external payable {
        // Wormhole recommends that message-publishing functions should return their sequence value
        _sendMessageToRecipient(destAddress, destChainId, message, nonce);
        nonce++;
    }

    // This function defines a super simple Wormhole 'module'.
    // A module is just a piece of code which knows how to emit a composable message
    // which can be utilized by other contracts.
    function _sendMessageToRecipient(
        address recipient,
        uint16 _chainId,
        string memory message,
        uint32 _nonce
    ) private returns (uint64) {
        bytes memory payload = abi.encode(
            recipient,
            _chainId,
            msg.sender,
            message
        );

        // Nonce is passed though to the core bridge.
        // This allows other contracts to utilize it for batching or processing.

        // 1 is the consistency level, this message will be emitted after only 1 block
        uint64 sequence = core_bridge.publishMessage(_nonce, payload, 1);

        // The sequence is passed back to the caller, which can be useful relay information.
        // Relaying is not done here, because it would 'lock' others into the same relay mechanism.
        return sequence;
    }

    // TODO: A production app would add onlyOwner security, but this is for testing.
    function addTrustedAddress(bytes32 sender, uint16 _chainId) external {
        myTrustedContracts[sender][_chainId] = true;
    }


    // constructor(address gateway_, address gasReceiver_, string memory destinationChain_, string memory destinationAddress_, address destinationDiamond_) AxelarExecutable(gateway_) {
    //     gasReceiver = IAxelarGasService(gasReceiver_);
    //     destinationChain = destinationChain_;
    //     destinationAddress = destinationAddress_;
    //     destinationDiamond = destinationDiamond_;
        
    // }

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
        bytes memory payload = abi.encode("createTaskContract", funcPayload);

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


    function taskParticipate(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("taskParticipate", funcPayload);

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

    function taskAuditParticipate(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("taskAuditParticipate", funcPayload);

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

    function taskStateChange(
        address _contractAddress,
        address payable _participant,
        string memory _state,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    )
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _participant, _state, _message, _replyTo, _rating);
        bytes memory payload = abi.encode("taskStateChange", funcPayload);

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

    function taskAuditDecision(
        address _contractAddress,
        string memory _favour,
        string memory _message,
        uint256 _replyTo,
        uint256 _rating
    )
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _favour, _message, _replyTo, _rating);
        bytes memory payload = abi.encode("taskAuditDecision", funcPayload);

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

    function sendMessage(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("sendMessage", funcPayload);

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

    event Logs(string logname, string sourceChain, string sourceAddress, bytes payload);
    event LogSimple(string logname);

    event TaskContractCreating(
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string _symbol,
        uint256 _amount
    );

    event TaskParticipating(
        address _contractAddress, 
        string _message, 
        uint256 _replyTo
    );

    event TaskStateChanging(
        address _contractAddress,
        address _participant,
        string _state,
        string _message,
        uint256 _replyTo,
        uint256 _rating
    );

    event taskAuditDecisioning(
        address _contractAddress,
        string _favour,
        string _message,
        uint256 _replyTo,
        uint256 _rating
    );

    event TaskSendMessaging(
        address _contractAddress, 
        string _message, 
        uint256 _replyTo
    );
    
    // Handles calls created by setAndSend. Updates this contract's value
    function _execute(
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal override {
        emit Logs('axelarExecute', _sourceChain, _sourceAddress, _payload);

        (string memory functionName, bytes memory funcPayload) = abi.decode(_payload, (string, bytes));

        if(keccak256(bytes(functionName)) == keccak256("createTaskContract")){
            (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(funcPayload, (string, string, string, string, string, uint256));
            emit TaskContractCreating(_nanoId, _taskType, _title, _description, _symbol, _amount);
            TasksFacet(destinationDiamond).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
        }

        else if(keccak256(bytes(functionName)) == keccak256("taskParticipate")){
            (address payable _contractAddress, string memory _message, uint256 _replyTo) = abi.decode(funcPayload, (address, string, uint256));
            emit TaskParticipating(_contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).taskParticipate(_message, _replyTo);
        }

        else if(keccak256(bytes(functionName)) == keccak256("taskAuditParticipate")){
            (address payable _contractAddress, string memory _message, uint256 _replyTo) = abi.decode(funcPayload, (address, string, uint256));
            emit TaskParticipating(_contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).taskAuditParticipate(_message, _replyTo);
        }

        else if(keccak256(bytes(functionName)) == keccak256("taskStateChange")){
            (address payable _contractAddress,
                address payable _participant,
                string memory _state,
                string memory _message,
                uint256 _replyTo,
                uint256 _rating) = abi.decode(funcPayload, (address, address, string, string, uint256, uint256));
            emit TaskStateChanging(_contractAddress, _participant, _state, _message, _replyTo, _rating);
            TaskContract(_contractAddress).taskStateChange(_participant, _state, _message, _replyTo, _rating);
        }

        else if(keccak256(bytes(functionName)) == keccak256("taskAuditDecision")){
            (address payable _contractAddress,
                string memory _favour,
                string memory _message,
                uint256 _replyTo,
                uint256 _rating) = abi.decode(funcPayload, (address, string, string, uint256, uint256));
            emit taskAuditDecisioning(_contractAddress, _favour, _message, _replyTo, _rating);
            TaskContract(_contractAddress).taskAuditDecision(_favour, _message, _replyTo, _rating);
        }

        else if(keccak256(bytes(functionName)) == keccak256("sendMessage")){
            (address payable _contractAddress, string memory _message, uint256 _replyTo) = abi.decode(funcPayload, (address, string, uint256));
            emit TaskSendMessaging(_contractAddress, _message, _replyTo);
            TaskContract(_contractAddress).sendMessage(_message, _replyTo);
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

    //     TasksFacet(address(this)).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
    // }
}