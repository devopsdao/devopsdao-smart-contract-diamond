pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./structs/ERC1155FacetStorage.sol";

library LibTokenData {

    function erc1155Storage()
        internal
        pure
        returns (ERC1155FacetStorage storage ds)
    {
        bytes32 position = keccak256("diamond.erc1155.storage");
        assembly {
            ds.slot := position
        }
    }

    function uri(uint256 _id) external view returns (string memory){
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 id;
        if (isNonFungible(_id)) {
            id = getNonFungibleBaseType(_id);
        }
        else{
            id = _id;
        }
        if (bytes(_tokenStorage.tokenURIs[id]).length > 0) {
            return _tokenStorage.tokenURIs[id];
        }
        else{
            return "";
        }
    }

    function uriOfName(string calldata _name) external view returns (string memory){
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        if (bytes(_tokenStorage.tokenURIs[baseType]).length > 0) {
            return _tokenStorage.tokenURIs[baseType];
        }
        else{
            return "";
        }
    }

    function uriOfBatch(uint256[] memory _ids) external view returns (string[] memory){
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        
        string[] memory tokenURIs = new string[](_ids.length);

        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 id = _ids[i];
            if (bytes(_tokenStorage.tokenURIs[id]).length > 0) {
                tokenURIs[i] = _tokenStorage.tokenURIs[id];
            }
            else{
                tokenURIs[i] = "";
            }
        }
        
        return tokenURIs;
    }

    function uriOfBatchName(string[] memory _names) external view returns (string[] memory){
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        string[] memory tokenURIs = new string[](_names.length);

        for (uint256 i = 0; i < _names.length; ++i) {
            uint256 baseType = _tokenStorage.tokenNames[_names[i]];
            tokenURIs[i] = _tokenStorage.tokenURIs[baseType];
        }
        return tokenURIs;
    }

    function totalSupply(uint256 id_) public view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        return _tokenStorage.totalSupply[id_];
    }

    function totalSupplyOfNfType(uint256 id_) public view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (isNonFungible(id_)) {
            uint256 baseType = getNonFungibleBaseType(id_);
            return _tokenStorage.nfTypeSupply[baseType];
        }
        else{
            return 0;
        }
    }
    
    function totalSupplyOfName(
        string calldata _name
    ) external view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        return _tokenStorage.nfTypeSupply[baseType];
    }

    function totalSupplyOfBatch(
        uint256[] calldata _ids
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        uint256[] memory totalSupplies_ = new uint256[](_ids.length);

        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 id = _ids[i];
            totalSupplies_[i] = _tokenStorage.totalSupply[id];
        }
        
        return totalSupplies_;
    }

    function totalSupplyOfBatchNfType(
        uint256[] calldata _ids
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256[] memory totalSupplies_ = new uint256[](_ids.length);

        for (uint256 i = 0; i < _ids.length; ++i) {
            if (isNonFungible(_ids[i])) {
                uint256 baseType = getNonFungibleBaseType(_ids[i]);
                totalSupplies_[i] = _tokenStorage.nfTypeSupply[baseType];
            }
            else{
                totalSupplies_[i] = 0;
            }
        }
        
        return totalSupplies_;
    }

    function totalSupplyOfBatchName(
        string[] calldata _names
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256[] memory totalSupplies_ = new uint256[](_names.length);

        for (uint256 i = 0; i < _names.length; ++i) {
            uint256 baseType = _tokenStorage.tokenNames[_names[i]];
            if(isNonFungibleBaseType(baseType)){
                totalSupplies_[i] = _tokenStorage.nfTypeSupply[baseType];
            }
            else{
                totalSupplies_[i] = _tokenStorage.totalSupply[baseType];
            }
        }
        
        return totalSupplies_;
    }

    function balanceOf(
        address _owner,
        uint256 _id
    ) public view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (isNonFungibleItem(_id)){
            return _tokenStorage.nfOwners[_id] == _owner ? 1 : 0;
        }
        return _tokenStorage.balances[_id][_owner];
    }

    function balanceOfNfType(
        address _owner,
        uint256 _id
    ) public view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (isNonFungible(_id)){
            uint256 baseType = getNonFungibleBaseType(_id);
            return _tokenStorage.balances[baseType][_owner];
        }
        else{
            return 0;
        }
    }

    function balanceOfName(
        address _owner,
        string calldata _name
    ) external view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        if(isNonFungibleBaseType(baseType)){
            return balanceOfNfType(_owner, baseType);
        }
        else{
            return balanceOf(_owner, baseType);
        }
    }

    function balanceOfBatch(
        address[] calldata _owners,
        uint256[] calldata _ids
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        require(_owners.length == _ids.length);

        uint256[] memory balances_ = new uint256[](_owners.length);

        for (uint256 i = 0; i < _owners.length; ++i) {
            uint256 id = _ids[i];
            if (isNonFungibleItem(id)) {
                balances_[i] = _tokenStorage.nfOwners[id] == _owners[i] ? 1 : 0;
            } else {
                balances_[i] = _tokenStorage.balances[id][_owners[i]];
            }
        }

        return balances_;
    }

    function balanceOfBatchNfType(
        address[] calldata _owners,
        uint256[] calldata _ids
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        require(_owners.length == _ids.length);

        uint256[] memory balances_ = new uint256[](_owners.length);

        for (uint256 i = 0; i < _owners.length; ++i) {
            uint256 id = _ids[i];
            if (isNonFungible(id)){
                uint256 baseType = getNonFungibleBaseType(id);
                balances_[i] = _tokenStorage.balances[baseType][_owners[i]];
            }
            else{
                balances_[i] = 0;
            }
        }

        return balances_;
    }

    function balanceOfBatchName(
        address[] calldata _owners,
        string[] calldata _names
    ) external view returns (uint256[] memory) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        require(_owners.length == _names.length);

        uint256[] memory balances_ = new uint256[](_owners.length);
        
        for (uint256 i = 0; i < _owners.length; ++i) {
            uint256 baseType = _tokenStorage.tokenNames[_names[i]];
            balances_[i] = _tokenStorage.balances[baseType][_owners[i]];
        }

        return balances_;
    }

    function exists(uint256 id_) public view returns (bool) {
        return totalSupply(id_) > 0;
    }
    
    function existsNfType(uint256 id_) public view returns (bool) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (isNonFungible(id_)) {
            uint256 baseType = getNonFungibleBaseType(id_);
            return _tokenStorage.nfTypeSupply[baseType] > 0;
        }
        else{
            return false;
        }
    }

    function existsName(
        string calldata _name
    ) external view returns (bool) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        return _tokenStorage.nfTypeSupply[baseType] > 0;
    }

    function getTokenId(
        string calldata _name
    ) external view returns (uint256) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        return _tokenStorage.tokenNames[_name];
    }

    // taken from Enjin 1155 implementation
    // Use a split bit implementation.
    // Store the type in the upper 128 bits..
    uint256 constant TYPE_MASK = uint256(type(uint128).max) << 128;

    // ..and the non-fungible index in the lower 128
    uint256 constant NF_INDEX_MASK = type(uint128).max;

    // The top bit is a flag to tell if this is a NFI.
    uint256 constant TYPE_NF_BIT = 1 << 255;

    // mapping(uint256 => address) nfOwners;

    // Only to make code clearer. Should not be functions
    function isNonFungible(uint256 _id) public pure returns (bool) {
        return _id & TYPE_NF_BIT == TYPE_NF_BIT;
    }

    function isFungible(uint256 _id) public pure returns (bool) {
        return _id & TYPE_NF_BIT == 0;
    }

    function getNonFungibleIndex(uint256 _id) public pure returns (uint256) {
        return _id & NF_INDEX_MASK;
    }

    function getNonFungibleBaseType(uint256 _id) public pure returns (uint256) {
        return _id & TYPE_MASK;
    }

    function isNonFungibleBaseType(uint256 _id) public pure returns (bool) {
        // A base type has the NF bit but does not have an index.
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK == 0);
    }

    function isNonFungibleItem(uint256 _id) public pure returns (bool) {
        // A base type has the NF bit but does has an index.
        return (_id & TYPE_NF_BIT == TYPE_NF_BIT) && (_id & NF_INDEX_MASK != 0);
    }

    function ownerOf(uint256 _id) public view returns (address) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        return _tokenStorage.nfOwners[_id];
    }

}
