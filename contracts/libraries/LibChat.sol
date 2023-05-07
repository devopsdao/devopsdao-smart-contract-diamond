//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import "../libraries/LibTasks.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";



library LibChat {
    event Logs(address contractAdr, string message);

    // function appStorage() internal pure returns (TaskStorage storage ds) {
    //     assembly {
    //         ds.slot := 0
    //     }
    // }

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

    function sendMessage(
        address _sender,
        string memory _message,
        uint256 _replyTo
    ) external {
        TaskStorage storage _storage = LibTasks.taskStorage();

        InterchainStorage storage _storageInterchain = LibInterchain.interchainStorage();
        if(msg.sender != _storageInterchain.configAxelar.sourceAddress 
            && msg.sender != _storageInterchain.configHyperlane.sourceAddress 
            && msg.sender != _storageInterchain.configLayerzero.sourceAddress
            && msg.sender != _storageInterchain.configWormhole.sourceAddress
            && msg.sender != _storage.task.contractParent
        ){
            _sender = payable(msg.sender);
        }

        (ConfigAxelar memory configAxelar, ConfigHyperlane memory configHyperlane, ConfigLayerzero memory configLayerzero, ConfigWormhole memory configWormhole) = IInterchainFacet(_storage.task.contractParent).getInterchainConfigs();
        if(msg.sender != configAxelar.sourceAddress 
            && msg.sender != configHyperlane.sourceAddress 
            && msg.sender != configLayerzero.sourceAddress
            && msg.sender != configWormhole.sourceAddress
        ){
            _sender = payable(msg.sender);
        }

        require(
            (_storage.task.participants.length == 0 &&
                keccak256(bytes(_storage.task.taskState)) ==
                keccak256(bytes(TASK_STATE_NEW))) ||
                (_sender == _storage.task.contractOwner ||
                    _sender == _storage.task.participant ||
                    _sender == _storage.task.auditor),
            "only task owner, participant or auditor can send a message when a participant is selected"
        );
        Message memory message;
        message.id = _storage.task.messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.replyTo = _replyTo;
        message.taskState = _storage.task.taskState;
        _storage.task.messages.push(message);
    }
}
