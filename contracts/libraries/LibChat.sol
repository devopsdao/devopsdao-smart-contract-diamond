//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

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
        TaskStorage storage _storage = taskStorage();
        require(
            (_storage.tasks[address(this)].participants.length == 0 &&
                keccak256(bytes(_storage.tasks[address(this)].taskState)) ==
                keccak256(bytes(TASK_STATE_NEW))) ||
                (_sender == _storage.tasks[address(this)].contractOwner ||
                    _sender == _storage.tasks[address(this)].participant ||
                    _sender == _storage.tasks[address(this)].auditor),
            "only task owner, participant or auditor can send a message when a participant is selected"
        );
        Message memory message;
        message.id = _storage.tasks[address(this)].messages.length + 1;
        message.text = _message;
        message.timestamp = block.timestamp;
        message.sender = _sender;
        message.replyTo = _replyTo;
        message.taskState = _storage.tasks[address(this)].taskState;
        _storage.tasks[address(this)].messages.push(message);
    }
}
