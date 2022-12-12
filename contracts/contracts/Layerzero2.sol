//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "../external/layerzero/interfaces/ILayerZeroEndpoint.sol";
import "../external/layerzero/interfaces/ILayerZeroReceiver.sol";

import "../facets/TasksFacet.sol";

contract LayerZeroDemo1 is ILayerZeroReceiver {
    event ReceiveMsg(
        uint16 _srcChainId,
        address _from,
        uint16 _count,
        bytes _payload
    );

    ILayerZeroEndpoint public endpoint;
    uint16 public messageCount;
    bytes public message;

    constructor(address _endpoint) {
        endpoint = ILayerZeroEndpoint(_endpoint);
    }    
    
    event Logs(string logname, uint16 sourceChain, bytes sourceAddress, uint _nonce, bytes payload);
        event TaskContractCreating(
        string _nanoId,
        string _taskType,
        string _title,
        string _description,
        string _symbol,
        uint256 _amount
    );
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
        NonblockingLzApp.setTrustedRemote();
        _lzSend(_dstChainId, payload, payable(msg.sender), address(0x0), bytes(""), msg.value);


    }

    function sendMsg(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata payload
    ) public payable {
        endpoint.send{value: msg.value}(
            _dstChainId,
            _destination,
            payload,
            payable(msg.sender),
            address(this),
            bytes("")
        );
    }

    function lzReceive(
        uint16 _srcChainId,
        bytes memory _from,
        uint64,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(endpoint));
        address from;
        assembly {
            from := mload(add(_from, 20))
        }
        if (
            keccak256(abi.encodePacked((_payload))) ==
            keccak256(abi.encodePacked((bytes10("ff"))))
        ) {
            endpoint.receivePayload(
                1,
                bytes(""),
                address(0x0),
                1,
                1,
                bytes("")
            );
        }
        message = _payload;
        messageCount += 1;
        emit ReceiveMsg(_srcChainId, from, messageCount, message);
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
            endpoint.estimateFees(
                _dstChainId,
                _userApplication,
                _payload,
                _payInZRO,
                _adapterParams
            );
    }
}