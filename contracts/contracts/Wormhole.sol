//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../external/wormhole/interfaces/IWormhole.sol";
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import "../facets/TasksFacet.sol";
import "../contracts/TaskContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Wormhole is Ownable {
    mapping(address => string) public lastMessage;

    IWormhole immutable core_bridge;

    mapping(bytes32 => mapping(uint16 => bool)) public myTrustedContracts;
    mapping(bytes32 => bool) public processedMessages;
    uint16 immutable chainId;
    uint16 immutable destChainId;
    address destAddress;
    address destinationDiamond;
    uint16 nonce = 0;

    constructor(uint16 _chainId, uint16 destChainId_, address wormhole_core_bridge_address, address destinationAddress_, address destinationDiamond_) {
        chainId = _chainId;
        core_bridge = IWormhole(wormhole_core_bridge_address);
        destAddress = destinationAddress_;
        destinationDiamond = destinationDiamond_;
        destChainId = destChainId_;
    }

    // This function defines a super simple Wormhole 'module'.
    // A module is just a piece of code which knows how to emit a composable message
    // which can be utilized by other contracts.
    function _sendMessageToRecipient(
        address recipient,
        uint16 _chainId,
        bytes memory _payload,
        uint32 _nonce
    ) private returns (uint64) {
        bytes memory payload = abi.encode(
            recipient,
            _chainId,
            msg.sender,
            _payload
        );

        // Nonce is passed though to the core bridge.
        // This allows other contracts to utilize it for batching or processing.

        // 1 is the consistency level, this message will be emitted after only 1 block
        uint64 sequence = core_bridge.publishMessage(_nonce, payload, 1);

        // The sequence is passed back to the caller, which can be useful relay information.
        // Relaying is not done here, because it would 'lock' others into the same relay mechanism.
        return sequence;
    }

    function addTrustedAddress(bytes32 sender, uint16 _chainId) onlyOwner external {
        myTrustedContracts[sender][_chainId] = true;
    }

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
        bytes memory payload = abi.encode("createTaskContract", funcPayload);

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
    }


    function taskParticipate(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("taskParticipate", funcPayload);

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
    }

    function taskAuditParticipate(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("taskAuditParticipate", funcPayload);

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
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

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
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

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
    }

    function sendMessage(address _contractAddress, string memory _message, uint256 _replyTo)
    external
    payable
    {

        bytes memory funcPayload = abi.encode(_contractAddress, _message, _replyTo);
        bytes memory payload = abi.encode("sendMessage", funcPayload);

        _sendMessageToRecipient(destAddress, destChainId, payload, nonce);
        nonce++;
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
    

    function processMyMessage(bytes memory VAA) public {
        // This call accepts single VAAs and headless VAAs
        (IWormhole.VM memory vm, bool valid, string memory reason) = core_bridge
            .parseAndVerifyVM(VAA);

        // Ensure core contract verifies the VAA
        require(valid, reason);

        // Ensure the emitterAddress of this VAA is a trusted address
        require(
            myTrustedContracts[vm.emitterAddress][vm.emitterChainId],
            "Invalid emitter address!"
        );

        // Check that the VAA hasn't already been processed (replay protection)
        require(!processedMessages[vm.hash], "Message already processed");

        // Parse intended data
        // You could attempt to parse the sender from the bytes32, but that's hard, hence why address was included in the payload
        (
            address intendedRecipient,
            uint16 _chainId,
            address sender,
            bytes memory payload
        ) = abi.decode(vm.payload, (address, uint16, address, bytes));

        // Check that the contract which is processing this VAA is the intendedRecipient
        // If the two aren't equal, this VAA may have bypassed its intended entrypoint.
        // This exploit is referred to as 'scooping'.
        require(
            intendedRecipient == address(this),
            "Not the intended receipient!"
        );

        // Check that the contract that is processing this VAA is the intended chain.
        // By default, a message is accessible by all chains, so we have to define a destination chain & check for it.
        require(_chainId == chainId, "Not the intended chain!");

        // Add the VAA to processed messages so it can't be replayed
        processedMessages[vm.hash] = true;

        // The message content can now be trusted, slap into messages
        // lastMessage[sender] = message;

        (string memory functionName, bytes memory funcPayload) = abi.decode(payload, (string, bytes));

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