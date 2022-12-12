// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../external/layerzero/lzApp/NonblockingLzApp.sol";

import "../facets/TasksFacet.sol";

/// @title A LayerZero example sending a cross chain message from a source chain to a destination chain to increment a counter
contract OmniCounter is NonblockingLzApp {

    constructor(address _lzEndpoint) NonblockingLzApp(_lzEndpoint) {}
    event Logs(string logname, uint16 sourceChain, bytes sourceAddress, uint _nonce, bytes payload);
        event TaskContractCreating(
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string _symbol,
        uint256 _amount
    );
    // event LogSimple(string logname);
    function _nonblockingLzReceive(uint16 _srcChainId, bytes memory _srcAddress, uint _nonce, bytes memory _payload) internal override {
        // emit LogSimple('axelarExecute');
        emit Logs('axelarExecute', _srcChainId, _srcAddress, _nonce, _payload);
        (string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount) = abi.decode(payload_, (string, string, string, string, string, uint256));
        emit TaskContractCreating(_nanoId, _taskType, _title, _description, _symbol, _amount);
        address moonbeamDiaomond = 0xb437AB13C2613d36eA831c6F3E993AC6ea69Cd01;
        address mumbaiDiaomond = 0x8bbF9b0f29f5507e3a366b1aa78D8418997E08F8;
        TasksFacet(moonbeamDiaomond).createTaskContract(_nanoId, _taskType, _title, _description, _symbol, _amount);
    }

    function createTaskContract(string memory _nanoId, string memory _taskType, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    {

        bytes memory payload = abi.encode(_nanoId, _taskType, _title, _description, _symbol, _amount);
        uint16 _dstChainId = 10126; //moonbase
        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), bytes(""), msg.value);


    }
}