// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "witnet-solidity-bridge/contracts/WitnetRequestBoard.sol";
import "witnet-solidity-bridge/contracts/libs/WitnetCBOR.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequest.sol";

library LibWitnetFacet {

    using WitnetCBOR for WitnetCBOR.CBOR;
    
    struct Storage {
       bytes32 slaHash;
       mapping (/* appId */ uint256 => Query) queries;
       mapping (/* appId */ uint256 => Result) results;
    }

    struct Args {
        string subpath;
        string title;
    }

    struct Query {
        uint256 id;
        bytes32 radHash;
    }

    struct Result {
        bool merged;
        string status;
    }

    function witnetFacetStorage()
        internal pure
        returns (Storage storage ds)
    {
        bytes32 position = keccak256("diamond.witnet.storage");
        assembly {
            ds.slot := position
        }
    }
    
    /// ===============================================================================================================
    /// --- Witnet-related helper functions ---------------------------------------------------------------------------

    /// @notice Checks availability of a Witnet response to the given query, trying
    /// @notice to deserialize it into a Result value, if so.
    /// @dev Reverts should there not be an underlying Witnet request, should it have failed, or if not able to deserialize result data.
    function fetchResult(WitnetRequestBoard witnet, uint256 appId)
        internal returns (Result storage)
    {
        Storage storage self = witnetFacetStorage();
        uint _witnetQueryId = self.queries[appId].id;

        // Revert if no query bound to give appId:
        require(_witnetQueryId > 0, "LibWitnetFacet: no query");
        
        Witnet.Result memory _witnetResult = witnet.readResponseResult(_witnetQueryId);
        require(_witnetResult.success, "LibWitnetFacet: failed query");
        self.results[appId] = _decodeResult(_witnetResult.value);
        return self.results[appId];
    }

    /// @notice Make the template generate a valid Witnet Request radHash based on given arguments.
    function verifyRadonRequest(WitnetRequestTemplate self, Args memory args) internal returns (bytes32 radHash) {
        string[][] memory _args = new string[][](1);
        _args[0] = new string[](2);
        _args[0][0] = args.subpath;
        _args[0][1] = args.title;
        radHash = self.verifyRadonRequest(_args);
    }

    /// @dev Deserialize a CBOR-encoded result as provided by Witnet
    /// @dev into a LibWitnetFacet.Result structure
    function _decodeResult(WitnetCBOR.CBOR memory cbor)
        private pure
        returns (Result memory)
    {
        WitnetCBOR.CBOR[] memory fields = cbor.readArray();
        if (fields.length == 1) {
            return Result({
                merged: false,
                status: fields[0].readString()
            });
        } else if (fields.length == 2) {
            return Result({
                merged: true,
                status: fields[1].readString()
            });
        } else {
            revert("LibWitnetFacet: invalid result");
        }
    }
}