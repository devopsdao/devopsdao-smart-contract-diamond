// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequest.sol";

import "../libraries/LibWitnetFacet.sol";

import "../libraries/LibUtils.sol";


contract WitnetFacet
    is
        UsingWitnet
{
    using LibWitnetFacet for WitnetRequestBoard;
    using LibWitnetFacet for WitnetRequestTemplate;

    event NewRadonRequestHash(bytes32 hash);
    event Logs(address indexed addr, string message);

    WitnetRequestTemplate public immutable witnetRequestTemplate;

    constructor(
            WitnetRequestBoard _witnetRequestBoard,
            WitnetRequestTemplate _witnetRequestTemplate,
            WitnetV2.RadonSLA memory _witnetRadonSLA
        )
        UsingWitnet(_witnetRequestBoard)
    {
        require(
            address(_witnetRequestTemplate).code.length > 0 &&
            _witnetRequestTemplate.class() == type(WitnetRequestTemplate).interfaceId
                && _witnetRequestTemplate.getRadonRetrievalsCount() == 1
                && _witnetRequestTemplate.parameterized()
                && _witnetRequestTemplate.resultDataType() == WitnetV2.RadonDataTypes.Array
            , "WitnetFacet: uncompliant WitnetRequestTemplate"
        );
        witnetRequestTemplate = _witnetRequestTemplate;
        __storage().slaHash = witnetRequestTemplate.factory().registry().verifyRadonSLA(_witnetRadonSLA);
    }

    function updateRadonSLA(bytes32 slaHash) external {
        __storage().slaHash = slaHash;
    }

    function witnetRadonSLA() external view returns (WitnetV2.RadonSLA memory) {
        return witnetRequestTemplate.factory().registry().lookupRadonSLA(__storage().slaHash);
    }

    function checkResultAvailability(uint256 _appId) external view{
        _checkResultAvailability(_appId);
    }

    function readResult(uint256 _appId) external view
        returns (Witnet.Result memory)
    {
        uint256 _witnetQueryId = __storage().queries[_appId].id;
        return _witnetReadResult(_witnetQueryId);
    }

    function _checkResultAvailability(uint256 _appId)
        internal view
        returns (bool)
    {
        uint256 _witnetQueryId = __storage().queries[_appId].id;
        return (
            _witnetQueryId > 0
                && _witnetCheckResultAvailability(_witnetQueryId)
        );
    }

    function _checkResultSuccess(uint256 _appId)
        internal view
        returns (bool)
    {
        uint256 _witnetQueryId = __storage().queries[_appId].id;
        if (_witnetQueryId > 0 && _witnetCheckResultAvailability(_witnetQueryId)) {
            return _witnetReadResult(_witnetQueryId).success;
        } else {
            return false;
        }
    }

    function postRequest(uint256 _appId, LibWitnetFacet.Args memory _args)
        public payable
        returns (uint256 _witnetQueryId)
    {
        return _postRequest(
            _appId,
            witnetRequestTemplate.verifyRadonRequest(_args)
        );
    }

    function postRequest2(uint256 _appId, bytes32 _witnetRadHash)
        public payable
        returns (uint256 _witnetQueryId)
    {
        return _postRequest(
            _appId,
            _witnetRadHash
        );
    }

    function _postRequest(uint256 _appId, LibWitnetFacet.Args memory _args)
        internal
        returns (uint256 _witnetQueryId)
    {
        bytes32 hash;
        hash = witnetRequestTemplate.verifyRadonRequest(_args);
        emit NewRadonRequestHash(hash);

        return _postRequest(
            _appId,
            hash
        );
    }

    function _postRequest(uint256 _appId, bytes32 _witnetRadHash)
        internal
        returns (uint256 _witnetQueryId)
    {

        emit Logs(address(this), string.concat("witnetQuery"));


        uint _usedFunds;
        LibWitnetFacet.Query storage __query = __storage().queries[_appId];
        _witnetQueryId = __query.id;

        emit Logs(address(this), string.concat("witnetQuery", LibUtils.uint2str(_witnetQueryId)));



        if (_witnetQueryId == 0) {
            // first attempt: request to the WRB
            emit Logs(address(this), string.concat("_witnetRadHash", string(abi.encodePacked(_witnetRadHash))));
             emit Logs(address(this), string.concat("__storage().slaHash", string(abi.encodePacked(__storage().slaHash))));
            (_witnetQueryId, _usedFunds) = _witnetPostRequest(
                _witnetRadHash,
                __storage().slaHash
            );
            __query.id = _witnetQueryId;
            __query.radHash = _witnetRadHash;
        } else {
            require(
                _witnetRadHash == __query.radHash,
                "WitnetFacet: radHash mistmatch"
            );
            if (!_witnetCheckResultAvailability(_witnetQueryId)) {
                _usedFunds = _witnetUpgradeReward(_witnetQueryId);
            } else {
                Witnet.Result memory _result = _witnetReadResult(_witnetQueryId);
                require(_result.success == false, "WitnetFact: solved query");
                // if last attempt failed, retry by posting new request to the WRB
                (_witnetQueryId, _usedFunds) = _witnetPostRequest(
                    _witnetRadHash,
                    __storage().slaHash
                );
                __query.id = _witnetQueryId;
            }
        }
        // transfer back unused funds
        if (_usedFunds < msg.value) {
            payable(msg.sender).transfer(msg.value - _usedFunds);
        }
    }

    function __storage() internal pure returns (LibWitnetFacet.Storage storage) {
        return LibWitnetFacet.witnetFacetStorage();
    }
}