// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../libraries/LibUtils.sol";
import "witnet-solidity-bridge/contracts/UsingWitnet.sol";
import "witnet-solidity-bridge/contracts/apps/WitnetRequestFactory.sol";

import "../libraries/LibWitnetRequest.sol";


import "hardhat/console.sol";


contract WitnetFacet is UsingWitnet
          {
    event Logs(address contractAdr, string message);
    address public immutable witnetRequestFactory;

    constructor(
            address _witnetRequestBoard,
            address _witnetRequestFactory
        )
        UsingWitnet(WitnetRequestBoard(_witnetRequestBoard))
    {
        witnetRequestFactory = _witnetRequestFactory;

        // WitnetRequestStorage storage _storage = LibWitnetRequest.witnetRequestStorage();
        // _storage.factory = WitnetRequestFactory(_witnetRequestFactory);
        // _storage.WitnetRequestFactoryAddress = _witnetRequestFactory;
        require(
            WitnetRequestFactory(witnetRequestFactory).supportsInterface(type(IWitnetRequestFactory).interfaceId),
            "WitnetFacet: uncompliant WitnetRequestFactory"
        );
        emit Logs(address(this), string.concat("WitnetRequestFactory: ", LibUtils.addressToString(witnetRequestFactory)));

    }

    function buildRequestTemplate(bytes32 httpGetValuesArray, bytes32 reducerModeNoFilters) public         returns 
    (
        WitnetRequestTemplate valuesArrayRequestTemplate
    )
    {
        // WitnetRequestStorage storage _storage = LibWitnetRequest.witnetRequestStorage();
        // WitnetRequestFactory _witnetRequestFactory = _storage.factory;

        emit Logs(address(this), string.concat("WitnetRequestFactory: ", LibUtils.addressToString(witnetRequestFactory)));
        require(
            WitnetRequestFactory(witnetRequestFactory).supportsInterface(type(IWitnetRequestFactory).interfaceId),
            "WitnetFacet: uncompliant WitnetRequestFactory"
        );
        // IWitnetBytecodes registry = factory.registry();
        bytes32[] memory dataSources = new bytes32[](1);
        dataSources[0] = httpGetValuesArray;

        emit Logs(address(this), string.concat("dataSources: ", string(abi.encodePacked(httpGetValuesArray)), "retrievals: ", string(abi.encodePacked(reducerModeNoFilters))));

        valuesArrayRequestTemplate = IWitnetRequestFactory(witnetRequestFactory).buildRequestTemplate(
            /* retrieval templates */ dataSources,
            /* aggregation reducer */ reducerModeNoFilters,
            /* witnessing reducer  */ reducerModeNoFilters,
            /* (reserved) */ 0
        );
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


