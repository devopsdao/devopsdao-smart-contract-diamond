// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// import "@hyperlane-xyz/core/interfaces/IMailbox.sol";
import '../external/hyperlane/interfaces/IInbox.sol';
import '../external/hyperlane/interfaces/IOutbox.sol';
import "../facets/TasksFacet.sol";

contract Hyperlane {


    // uint32 constant destinationDomain = 80001; //mumbai
    uint32 constant destinationDomain = 0x6d6f2d61; //moonbase
    address constant recipient = 0xf2E3439ca3acf8B63Adb3C576299395576C8fF19;
    address constant ethereumOutbox = 0xe17c37212d785760E8331D4A4395B17b34Ba8cDF; //mumbai
    // address constant ethereumOutbox = 0x54148470292C24345fb828B003461a9444414517; //moonbase
    event SentMessage(uint32 destinationDomain, address recipient, bytes payload);

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    {
        bytes memory payload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
        IOutbox(ethereumOutbox).dispatch(
            destinationDomain,
            addressToBytes32(recipient),
            payload
        );
        emit SentMessage(destinationDomain, recipient, payload);
    }

    event ReceivedMessage(uint32 origin, bytes32 sender, bytes message);
    event TaskContractCreating(
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string _symbol,
        uint256 _amount
    );
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _payload
    ) external {
        emit ReceivedMessage(_origin, _sender, _payload);
        (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(_payload, (string, string, string, string, string, uint256));
        emit TaskContractCreating(_nanoId, _taskType, _title, _description, _symbol, _amount);
        address moonbeamDiaomond = 0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01;
        address mumbaiDiaomond = 0x8bbF9b0f29f5507e3a366b1aa78D8418997E08F8;
        TasksFacet(moonbeamDiaomond).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
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

pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";


