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
}

struct ConfigAxelar {
    string destinationChain;
    address gateway;
    address gasReceiver;
    string destinationAddress;
    address destinationDiamond;
}

struct ConfigHyperlane {
    uint32 destinationDomain;
    address ethereumOutbox;
    address destinationAddress;
    address destinationDiamond;
}

struct ConfigLayerzero {
    uint16 destinationChain;
    address endpoint;
    address destinationAddress;
    address destinationDiamond;
}

struct ConfigWormhole {
    uint16 chainId;
    uint16 destChainId;
    address bridgeAddress;
    address destinationAddress;
    address destinationDiamond;
}

import { LibDiamond } from "../libraries/LibDiamond.sol";


library LibInterchain {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.interchain.storage");


    // struct ChainAddresses {
    //     mapping(string => address) chainAddresses;
    // }


    function diamondStorage() internal pure returns (InterchainStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
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
        InterchainStorage storage _storage = diamondStorage();
        _storage.intechainAddresses[interchainName][chainName] = contractAddress;
    }

    function addConfigAxelar(
        string memory destinationChain,
        address gateway,
        address gasReceiver,
        string memory destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = diamondStorage();
        _storage.configAxelar.gateway = gateway;
        _storage.configAxelar.gasReceiver = gasReceiver;
        _storage.configAxelar.destinationChain = destinationChain;
        _storage.configAxelar.destinationAddress = destinationAddress;
        _storage.configAxelar.destinationDiamond = destinationDiamond;
    }

    function addConfigHyperlane(
        uint32 destinationDomain,
        address ethereumOutbox,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = diamondStorage();
        _storage.configHyperlane.destinationDomain = destinationDomain;
        _storage.configHyperlane.ethereumOutbox = ethereumOutbox;
        _storage.configHyperlane.destinationAddress = destinationAddress;
        _storage.configHyperlane.destinationDiamond = destinationDiamond;
    }

    function addConfigLayerzero(
        uint16 destinationChain,
        address endpoint,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = diamondStorage();
        _storage.configLayerzero.destinationChain = destinationChain;
        _storage.configLayerzero.endpoint = endpoint;
        _storage.configLayerzero.destinationAddress = destinationAddress;
        _storage.configLayerzero.destinationDiamond = destinationDiamond;
    }

    function addConfigWormhole(
        uint16 chainId,
        uint16 destChainId,
        address bridgeAddress,
        address destinationAddress,
        address destinationDiamond
    ) external {
        LibDiamond.enforceIsContractOwner();
        InterchainStorage storage _storage = diamondStorage();
        _storage.configWormhole.chainId = chainId;
        _storage.configWormhole.destChainId = destChainId;
        _storage.configWormhole.bridgeAddress = bridgeAddress;
        _storage.configWormhole.destinationAddress = destinationAddress;
        _storage.configWormhole.destinationDiamond = destinationDiamond;
    }

}
