// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "witnet-solidity-bridge/contracts/WitnetRequestBoard.sol";
import "witnet-solidity-bridge/contracts/requests/WitnetRequest.sol";

library LibWitnetFacet {

    // using Witnet for Witnet.Result;
    // using WitnetCBOR for WitnetCBOR.CBOR;
    
    struct Storage {
       bytes32 slaHash;
       mapping (/* taskAddress */ address => Query) queries;
       mapping (/* taskAddress */ address => Result) results;
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
        bool failed;
        bool pendingMerge;
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

    /// @notice Make the template generate a valid Witnet Request radHash based on given arguments.
    function verifyRadonRequest(WitnetRequestTemplate self, Args memory args) internal returns (bytes32 radHash) {
        string[][] memory _args = new string[][](1);
        _args[0] = new string[](2);
        _args[0][0] = args.subpath;
        _args[0][1] = args.title;
        radHash = self.verifyRadonRequest(_args);
    }
}