// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// import {LibDiamond} from '../libraries/LibDiamond.sol';

// import '../interfaces/IDiamondLoupe.sol';


import "../libraries/LibTasks.sol";
// import "../libraries/LibInterchain.sol";
import "../libraries/LibUtils.sol";
import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/apps/WitnetRequestFactory.sol";

import "../libraries/LibWitnetRequest.sol";

import "../contracts/TaskContract.sol";
// import "../facets/tokenstorage/ERC1155StorageFacet.sol";
// import "../facets/TokenFacet.sol";
// import "../facets/TokenDataFacet.sol";


import "hardhat/console.sol";


contract WitnetFacet is
        UsingWitnet  {

    constructor(
            WitnetRequestBoard _witnetRequestBoard
            // WitnetRequestFactory _witnetRequestFactory
        )
        UsingWitnet(WitnetRequestBoard(_witnetRequestBoard))
    {
        // require(
        //     _witnetRequestFactory.supportsInterface(type(IWitnetRequestFactory).interfaceId),
        //     "WittyPixelsToken: uncompliant WitnetRequestFactory"
        // );
        // WitnetRequestTemplate valuesArrayRequestTemplate;
        // valuesArrayRequestTemplate = LibWitnetRequest.buildHttpRequestTemplates(_witnetRequestFactory);

    }

    // TaskStorage internal _storage;
    // InterchainStorage internal _storageInterchain;

    // initial: new, contractor chosen: agreed, work in progress: progress, completed: completed, canceled

    function buildRequestTemplate(WitnetRequestFactory factory, bytes32 httpGetValuesArray, bytes32 reducerModeNoFilters) public         returns (
        WitnetRequestTemplate valuesArrayRequestTemplate
    ){
        // IWitnetBytecodes registry = factory.registry();
        bytes32[] memory retrievals = new bytes32[](1);
        // {
        //     retrievals[0] = httpGetImageDigest;
        //     imageDigestRequestTemplate = factory.buildRequestTemplate(
        //         /* retrieval templates */ retrievals,
        //         /* aggregation reducer */ reducerModeNoFilters,
        //         /* witnessing reducer  */ reducerModeNoFilters,
        //         /* (reserved) */ 0
        //     );
        // }
        {
            retrievals[0] = httpGetValuesArray;
            valuesArrayRequestTemplate = factory.buildRequestTemplate(
                /* retrieval templates */ retrievals,
                /* aggregation reducer */ reducerModeNoFilters,
                /* witnessing reducer  */ reducerModeNoFilters,
                /* (reserved) */ 0
            );
        }
    }

    // function createWitnetRequest(address taskAddress)
    // external
    // {
    //     TaskStorage storage _storage = LibTasks.taskStorage();
    //     // uint256 balance = TokenDataFacet(address(this)).balanceOfName(msg.sender, 'auditor');
    //     // require(balance > 0, 'must hold Auditor NFT to add to blacklist');
    //     // require(_storage.taskContractsBlacklistMapping[taskAddress] != true, 'task is already blacklisted');


    //     // WitnetRequestTemplate memory valuesArrayRequestTemplate;

    //     // valuesArrayRequestTemplate = WittyPixelsLib.buildHttpRequestTemplates(_witnetRequestFactory);


    //     // string[][] memory _args = new string[][](1);
    //     // _args[0] = new string[](2);
    //     // _args[0][0] = _baseuri;
    //     // _args[0][1] = _tokenId.toString();
    //     // __wpx721().tokenWitnetRequests[_tokenId] = WittyPixels.ERC721TokenWitnetRequests({
    //     //     imageDigest: imageDigestRequestTemplate.settleArgs(_args),
    //     //     tokenStats: valuesArrayRequestTemplate.settleArgs(_args)
    //     // });

    //     // {
    //     //     uint _usedFunds;
    //     //     // Ask Witnet to retrieve token's metadata stats from the token base uri provider:            
    //     //     (__witnetQueries.tokenStatsId, _usedFunds) = _witnetPostRequest(
    //     //         __witnetRequests.tokenStats.modifySLA(_witnetSLA)
    //     //     );
    //     //     _totalUsedFunds += _usedFunds;
    //     // }


    // }


}


