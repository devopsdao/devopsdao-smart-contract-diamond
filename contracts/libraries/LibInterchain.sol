// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.0;

string constant IC_AXELAR = 'axelar';
string constant IC_HYPERLANE = 'hyperlane';
string constant IC_LAYERZERO = 'layerzero';
string constant IC_WORMHOLE = 'wormhole';

struct InterchainStorage {
    mapping(string => mapping(string => address)) intechainAddresses;
    ConfigAxelar configAxelar;
    ConfigHyperlane configHyperlane;
    ConfigLayerzero configLayerzero;
    ConfigWormhole configWormhole;
    dataWormhole dataWormhole;
}

struct ConfigAxelar {
    string destinationChain;
    address gateway;
    address gasReceiver;
    address sourceAddress;
    string destinationAddress;
    address destinationDiamond;
}

struct ConfigHyperlane {
    uint32 destinationDomain;
    address ethereumOutbox;
    address sourceAddress;
    address destinationAddress;
    address destinationDiamond;
}

struct ConfigLayerzero {
    uint16 destinationChain;
    address endpoint;
    address sourceAddress;
    address destinationAddress;
    address destinationDiamond;
}

struct ConfigWormhole {
    uint16 chainId;
    uint16 destChainId;
    address bridgeAddress;
    address sourceAddress;
    address destinationAddress;
    address destinationDiamond;
}

struct dataWormhole {
    mapping(bytes32 => mapping(uint16 => bool)) myTrustedContracts;
    mapping(bytes32 => bool) processedMessages;
    uint16 nonce;
}

import { LibDiamond } from "../libraries/LibDiamond.sol";


library LibInterchain {


    // struct ChainAddresses {
    //     mapping(string => address) chainAddresses;
    // }


    function interchainStorage() internal pure returns (InterchainStorage storage ds) {
        bytes32 position = keccak256("diamond.interchain.storage");
        assembly {
            ds.slot := position
        }
    }

    function addTrustedInterchainContractAddress(
        string memory interchainName,
        string memory chainName,
        address contractAddress
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = interchainStorage();
        _storage.intechainAddresses[interchainName][chainName] = contractAddress;
    }

    function addConfigAxelar(
        string memory destinationChain,
        address gateway,
        address gasReceiver,
        address sourceAddress,
        string memory destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = interchainStorage();
        _storage.configAxelar.gateway = gateway;
        _storage.configAxelar.gasReceiver = gasReceiver;
        _storage.configAxelar.sourceAddress = sourceAddress;
        _storage.configAxelar.destinationChain = destinationChain;
        _storage.configAxelar.destinationAddress = destinationAddress;
        _storage.configAxelar.destinationDiamond = destinationDiamond;
    }

    function addConfigHyperlane(
        uint32 destinationDomain,
        address ethereumOutbox,
        address sourceAddress,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = interchainStorage();
        _storage.configHyperlane.destinationDomain = destinationDomain;
        _storage.configHyperlane.ethereumOutbox = ethereumOutbox;
        _storage.configHyperlane.sourceAddress = sourceAddress;
        _storage.configHyperlane.destinationAddress = destinationAddress;
        _storage.configHyperlane.destinationDiamond = destinationDiamond;
    }

    function addConfigLayerzero(
        uint16 destinationChain,
        address endpoint,
        address sourceAddress,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = interchainStorage();
        _storage.configLayerzero.destinationChain = destinationChain;
        _storage.configLayerzero.endpoint = endpoint;
        _storage.configLayerzero.sourceAddress = sourceAddress;
        _storage.configLayerzero.destinationAddress = destinationAddress;
        _storage.configLayerzero.destinationDiamond = destinationDiamond;
    }

    function addConfigWormhole(
        uint16 chainId,
        uint16 destChainId,
        address bridgeAddress,
        address sourceAddress,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = interchainStorage();
        _storage.configWormhole.chainId = chainId;
        _storage.configWormhole.destChainId = destChainId;
        _storage.configWormhole.bridgeAddress = bridgeAddress;
        _storage.configWormhole.sourceAddress = sourceAddress;
        _storage.configWormhole.destinationAddress = destinationAddress;
        _storage.configWormhole.destinationDiamond = destinationDiamond;
    }

}
