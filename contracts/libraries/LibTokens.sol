// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "./structs/ERC1155FacetStorage.sol";
import "../interfaces/IERC1155TokenReceiver.sol";
import "./LibAddress.sol";

library LibTokens {
    bool public constant contractLibTokens = true;
    using LibAddress for address;
    bytes4 internal constant ERC1155_ACCEPTED = 0xf23a6e61; // bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))
    bytes4 internal constant ERC1155_BATCH_ACCEPTED = 0xbc197c81; // bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))
    bytes4 constant private INTERFACE_SIGNATURE_URI = 0x0e89341c;
        /*
        bytes4(keccak256('supportsInterface(bytes4)'));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC165 = 0x01ffc9a7;

    /*
        bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)")) ^
        bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)")) ^
        bytes4(keccak256("balanceOf(address,uint256)")) ^
        bytes4(keccak256("balanceOfBatch(address[],uint256[])")) ^
        bytes4(keccak256("setApprovalForAll(address,bool)")) ^
        bytes4(keccak256("isApprovedForAll(address,address)"));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC1155 = 0xd9b67a26;


    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );

    /**
     * @dev Equivalent to multiple {TransferSingle} events, where `operator`, `from` and `to` are the same for all
     * transfers.
     */
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );

    /**
     * @dev Emitted when `account` grants or revokes permission to `operator` to transfer their tokens, according to
     * `approved`.
     */
    event ApprovalForAll(
        address indexed account,
        address indexed operator,
        bool approved
    );

    /**
     * @dev Emitted when the URI for token type `id` changes to `value`, if it is a non-programmatic URI.
     *
     * If an {URI} event was emitted for `id`, the standard
     * https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that `value` will equal the value
     * returned by {IERC1155MetadataURI-uri}.
     */
    event URI(string value, uint256 indexed id);

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

    // function mint(address to) public returns (bool) {
    //     console.log("mint");
    //     console.log(to);
    //     // TaskStorage storage _storage = LibTasks.diamondStorage();
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     _tokenStorage.baseURI = "https://ipfs.io/ipfs/";
    //     _mint(to, "Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu", 1);
    //     console.log("minted");
    //     return true;
    // }

    // function uri(uint256 tokenID_) public view returns (string memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     string memory _tokenURI = _tokenStorage.tokenURIs[tokenID_];
    //     string memory _base = _tokenStorage.baseURI;

    //     if (bytes(_base).length == 0) {
    //         return _tokenURI;
    //     } else if (bytes(_tokenURI).length > 0) {
    //         return string(abi.encodePacked(_base, _tokenURI));
    //     }

    //     return "";
    // }

    // function uri(uint256 _id) external view returns (string memory){
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     if (bytes(_tokenStorage.tokenURIs[_id]).length > 0) {
    //         return _tokenStorage.tokenURIs[_id];
    //     }
    //     else{
    //         return "";
    //     }
    // }

    // function uriOfName(string calldata _name) external view returns (string memory){
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256 baseType = _tokenStorage.tokenNames[_name];
    //     if (bytes(_tokenStorage.tokenURIs[baseType]).length > 0) {
    //         return _tokenStorage.tokenURIs[baseType];
    //     }
    //     else{
    //         return "";
    //     }
    // }

    // function uriOfBatch(uint256[] memory _ids) external view returns (string[] memory){
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        
    //     string[] memory tokenURIs = new string[](_ids.length);

    //     for (uint256 i = 0; i < _ids.length; ++i) {
    //         uint256 id = _ids[i];
    //         if (bytes(_tokenStorage.tokenURIs[id]).length > 0) {
    //             tokenURIs[i] = _tokenStorage.tokenURIs[id];
    //         }
    //         else{
    //             tokenURIs[i] = "";
    //         }
    //     }
        
    //     return tokenURIs;
    // }

    // function uriOfBatchName(string[] memory _names) external view returns (string[] memory){
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     string[] memory tokenURIs = new string[](_names.length);

    //     for (uint256 i = 0; i < _names.length; ++i) {
    //         uint256 baseType = _tokenStorage.tokenNames[_names[i]];
    //         tokenURIs[i] = _tokenStorage.tokenURIs[baseType];
    //     }
    //     return tokenURIs;
    // }

    // function totalSupply(uint256 id_) public view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     return _tokenStorage.totalSupply[id_];
    // }

    // function totalSupplyOfNfType(uint256 id_) public view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     if (isNonFungible(id_)) {
    //         uint256 baseType = getNonFungibleBaseType(id_);
    //         return _tokenStorage.nfTypeSupply[baseType];
    //     }
    //     else{
    //         return 0;
    //     }
    // }
    
    // function totalSupplyOfName(
    //     string calldata _name
    // ) external view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256 baseType = _tokenStorage.tokenNames[_name];
    //     return _tokenStorage.nfTypeSupply[baseType];
    // }

    // function totalSupplyOfBatch(
    //     uint256[] calldata _ids
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     uint256[] memory totalSupplies_ = new uint256[](_ids.length);

    //     for (uint256 i = 0; i < _ids.length; ++i) {
    //         uint256 id = _ids[i];
    //         totalSupplies_[i] = _tokenStorage.totalSupply[id];
    //     }
        
    //     return totalSupplies_;
    // }

    // function totalSupplyOfBatchNfType(
    //     uint256[] calldata _ids
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256[] memory totalSupplies_ = new uint256[](_ids.length);

    //     for (uint256 i = 0; i < _ids.length; ++i) {
    //         if (isNonFungible(_ids[i])) {
    //             uint256 baseType = getNonFungibleBaseType(_ids[i]);
    //             totalSupplies_[i] = _tokenStorage.nfTypeSupply[baseType];
    //         }
    //         else{
    //             totalSupplies_[i] = 0;
    //         }
    //     }
        
    //     return totalSupplies_;
    // }

    // function totalSupplyOfBatchName(
    //     string[] calldata _names
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256[] memory totalSupplies_ = new uint256[](_names.length);

    //     for (uint256 i = 0; i < _names.length; ++i) {
    //         uint256 baseType = _tokenStorage.tokenNames[_names[i]];
    //         if(isNonFungibleBaseType(baseType)){
    //             totalSupplies_[i] = _tokenStorage.nfTypeSupply[baseType];
    //         }
    //         else{
    //             totalSupplies_[i] = _tokenStorage.totalSupply[baseType];
    //         }
    //     }
        
    //     return totalSupplies_;
    // }

    // function exists(uint256 id_) public view returns (bool) {
    //     return totalSupply(id_) > 0;
    // }
    
    // function existsNfType(uint256 id_) public view returns (bool) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     if (isNonFungible(id_)) {
    //         uint256 baseType = getNonFungibleBaseType(id_);
    //         return _tokenStorage.nfTypeSupply[baseType] > 0;
    //     }
    //     else{
    //         return false;
    //     }
    // }

    // function existsName(
    //     string calldata _name
    // ) external view returns (bool) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256 baseType = _tokenStorage.tokenNames[_name];
    //     return _tokenStorage.nfTypeSupply[baseType] > 0;
    // }

    // function totalSupplyOfBatch(
    //     address[] calldata _owners,
    //     uint256[] calldata _ids
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     require(_owners.length == _ids.length);

    //     uint256[] memory balances_ = new uint256[](_owners.length);

    //     for (uint256 i = 0; i < _owners.length; ++i) {
    //         uint256 id = _ids[i];
    //         if (isNonFungibleItem(id)) {
    //             balances_[i] = _tokenStorage.nfOwners[id] == _owners[i] ? 1 : 0;
    //         } else {
    //             balances_[i] = _tokenStorage.balances[id][_owners[i]];
    //         }
    //     }
    //     return balances_;
    // }


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

    modifier creatorOnly(uint256 _id) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        // console.log('check creator:');
        // console.log(_tokenStorage.creators[_id]);
        require(_tokenStorage.creators[_id] == msg.sender, 'can be executed only by creator');
        _;
    }

    function supportsInterface(bytes4 _interfaceId)
    public
    pure
    returns (bool) {
         if (_interfaceId == INTERFACE_SIGNATURE_ERC165 ||
             _interfaceId == INTERFACE_SIGNATURE_ERC1155) {
            return true;
         }

         return false;
    }

    // This function only creates the type.
    function create(
        string calldata _uri,
        string calldata _name,
        bool _isNF
    ) external returns (uint256 _type) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        require (_tokenStorage.tokenNames[_name] == 0, 'token name is already used');
        // Store the type in the upper 128 bits
        _type = (++_tokenStorage.nonce << 128);

        // Set a flag if this is an NFI.
        if (_isNF) _type = _type | TYPE_NF_BIT;

        // This will allow restricted access to creators.
        _tokenStorage.creators[_type] = msg.sender;
        _tokenStorage.tokenURIs[_type] = _uri;
        _tokenStorage.tokenNames[_name] = _type;
        _tokenStorage.tokenTypeNames[_type] = _name;
        _tokenStorage.createdTokenNames.push(_name);

        // console.log('created NFT:');
        // console.log(_type);
        // console.log('created NFT URI:');
        // console.log(_uri);
        // console.log('NFT creator:');
        // console.log(_tokenStorage.creators[_type]);

        // emit a Transfer event with Create semantic to help with discovery.
        emit TransferSingle(msg.sender, address(0x0), address(0x0), _type, 0);

        if (bytes(_uri).length > 0) emit URI(_uri, _type);
        return _type;
    }

    function mintNonFungible(
        uint256 _type,
        address[] calldata _to
    ) public {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        // No need to check this is a nf type rather than an id since
        // creatorOnly() will only let a type pass through.
        require(isNonFungible(_type));

        // Index are 1-based.
        uint256 index = _tokenStorage.maxIndex[_type] + 1;
        _tokenStorage.maxIndex[_type] = _to.length + _tokenStorage.maxIndex[_type];

        for (uint256 i = 0; i < _to.length; ++i) {
            // console.log('minted NFT');
            address dst = _to[i];
            _requireNonZero(dst);
            uint256 id = _type | (index + i);
            // console.log(id);

            _tokenStorage.nfOwners[id] = dst;
            _tokenStorage.ownerTokens[_to[i]].push(id);
            _tokenStorage.totalSupply[id] = 1;
            _tokenStorage.nfTypeSupply[_type] = _tokenStorage.nfTypeSupply[_type] + 1;
            // console.log(_tokenStorage.nfOwners[id]);

            // You could use base-type id to store NF type balances if you wish.
            _tokenStorage.balances[_type][dst] = _tokenStorage.balances[_type][dst] + 1;

            emit TransferSingle(msg.sender, address(0x0), dst, id, 1);

            if (dst.isContract()) {
                _doSafeTransferAcceptanceCheck(
                    msg.sender,
                    msg.sender,
                    dst,
                    id,
                    1,
                    ""
                );
            }
        }
    }

    function mintNonFungibleByName(
        string calldata _name,
        address[] calldata _to
    ) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        mintNonFungible(baseType, _to);
    }


    function mintFungible(
        uint256 _id,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) public creatorOnly(_id) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        // console.log('minting fungible');
        require(isFungible(_id), 'id is not fungible');

        for (uint256 i = 0; i < _to.length; ++i) {
            address to = _to[i];
            _requireNonZero(to);
            uint256 quantity = _quantities[i];

            // Grant the items to the caller
            _tokenStorage.balances[_id][to] = quantity + _tokenStorage.balances[_id][to];
            _tokenStorage.totalSupply[_id] = quantity + _tokenStorage.totalSupply[_id];

            // Emit the Transfer/Mint event.
            // the 0x0 source address implies a mint
            // It will also provide the circulating supply info.
            emit TransferSingle(msg.sender, address(0x0), to, _id, quantity);

            if (to.isContract()) {
                _doSafeTransferAcceptanceCheck(
                    msg.sender,
                    msg.sender,
                    to,
                    _id,
                    quantity,
                    ""
                );
            }
        }
    }

    function mintFungibleByName2(
        string calldata _name,
        address[] calldata _to,
        uint256[] calldata _quantities
    ) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        mintFungible(baseType, _to, _quantities);
    }

    function setURI(
        string calldata _uri,
        uint256 _id
    ) public creatorOnly(_id) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        _tokenStorage.tokenURIs[_id] = _uri;
        emit URI(_uri, _id);
    }

    function setURIOfName(
        string calldata _uri,
        string calldata _name
    ) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        uint256 baseType = _tokenStorage.tokenNames[_name];
        setURI(_uri, baseType);
    }

    // override
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        require(_to != address(0x0), "cannot send to zero address");
        require(
            _from == msg.sender ||
                _tokenStorage.operatorApproval[_from][msg.sender] == true,
            "Need operator approval for 3rd party transfers."
        );
        _requireBalance(_from, _id, _value);

        if (isNonFungible(_id)) {
            require(_tokenStorage.nfOwners[_id] == _from);
            _tokenStorage.nfOwners[_id] = _to;
            // You could keep balance of NF type in base type id like so:
            uint256 baseType = getNonFungibleBaseType(_id);
            _tokenStorage.balances[baseType][_from] = _tokenStorage.balances[baseType][_from] - _value;
            _tokenStorage.balances[baseType][_to]   = _tokenStorage.balances[baseType][_to] + _value;

            //maintain ownerTokens
            for (uint256 index = 0; index < _tokenStorage.ownerTokens[_from].length; index++) {
                if(_tokenStorage.ownerTokens[_from][index] == _id){
                    // _storage.taskContractsBlacklistMapping[taskAddress] = false;
                    for (uint i = index; i < _tokenStorage.ownerTokens[_from].length-1; i++){
                        _tokenStorage.ownerTokens[_from][i] = _tokenStorage.ownerTokens[_from][i+1];
                    }
                    _tokenStorage.ownerTokens[_from].pop();
                }
                _tokenStorage.ownerTokens[_to].push(_id);
            }


        } else {
            _tokenStorage.balances[_id][_from] =
                _tokenStorage.balances[_id][_from] -
                _value;
            _tokenStorage.balances[_id][_to] =
                _value + _tokenStorage.balances[_id][_to];
        }

        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(
                msg.sender,
                _from,
                _to,
                _id,
                _value,
                _data
            );
        }
    }

    // override
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        require(_to != address(0x0), "cannot send to zero address");
        require(_ids.length == _values.length, "Array length must match");

        // Only supporting a global operator approval allows us to do only 1 check and not to touch storage to handle allowances.
        require(
            _from == msg.sender ||
                _tokenStorage.operatorApproval[_from][msg.sender] == true,
            "Need operator approval for 3rd party transfers."
        );
        for (uint256 i = 0; i < _ids.length; ++i) {
            // Cache value to local variable to reduce read costs.(cannot use this because of variable count limit)
            // uint256 id = _ids[i];
            // uint256 value = _values[i];

            _requireBalance(_from, _ids[i], _values[i]);

            if (isNonFungible(_ids[i])) {
                require(_tokenStorage.nfOwners[_ids[i]] == _from);
                _tokenStorage.nfOwners[_ids[i]] = _to;

                // You could keep balance of NF type in base type id like so:
                uint256 baseType = getNonFungibleBaseType(_ids[i]);
                _tokenStorage.balances[baseType][_from] = _tokenStorage.balances[baseType][_from] - _values[i];
                _tokenStorage.balances[baseType][_to]   = _tokenStorage.balances[baseType][_to] + _values[i];

                //maintain ownerTokens
                console.log('_tokenStorage.ownerTokens[_from].length');
                console.log(_tokenStorage.ownerTokens[_from].length);
                for (uint256 index = 0; index < _tokenStorage.ownerTokens[_from].length; index++) {
                    console.log('_tokenStorage.ownerTokens[_from][index]');
                    console.log(_tokenStorage.ownerTokens[_from][index]);
                    console.log('_ids[i]');
                    console.log(_ids[i]);
                    if(_tokenStorage.ownerTokens[_from][index] == _ids[i]){
                        // _storage.taskContractsBlacklistMapping[taskAddress] = false;
                        for (uint idx = index; idx < _tokenStorage.ownerTokens[_from].length-1; idx++){
                            _tokenStorage.ownerTokens[_from][idx] = _tokenStorage.ownerTokens[_from][idx+1];
                        }
                        _tokenStorage.ownerTokens[_from].pop();
                    }
                    _tokenStorage.ownerTokens[_to].push(_ids[i]);
                }
                
            } else {
                _tokenStorage.balances[_ids[i]][_from] = _tokenStorage
                .balances[_ids[i]][_from] - _values[i];
                _tokenStorage.balances[_ids[i]][_to] = _values[i] +
                    _tokenStorage.balances[_ids[i]][_to];
            }
        }

        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        if (_to.isContract()) {
            _doSafeBatchTransferAcceptanceCheck(
                msg.sender,
                _from,
                _to,
                _ids,
                _values,
                _data
            );
        }
    }

    // function balanceOf(
    //     address _owner,
    //     uint256 _id
    // ) public view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //                 console.log('NFT balance:');

    //     if (isNonFungibleItem(_id)){
    //         return _tokenStorage.nfOwners[_id] == _owner ? 1 : 0;
    //     }
    //     return _tokenStorage.balances[_id][_owner];
    // }

    // function balanceOfNfType(
    //     address _owner,
    //     uint256 _id
    // ) public view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     console.log('NFT balance:');
    //     if (isNonFungible(_id)){
    //         uint256 baseType = getNonFungibleBaseType(_id);
    //         return _tokenStorage.balances[baseType][_owner];
    //     }
    //     else{
    //         return 0;
    //     }
    // }

    // function balanceOfName(
    //     address _owner,
    //     string calldata _name
    // ) external view returns (uint256) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256 baseType = _tokenStorage.tokenNames[_name];
    //     if(isNonFungibleBaseType(baseType)){
    //         return balanceOfNfType(_owner, baseType);
    //     }
    //     else{
    //         return balanceOf(_owner, baseType);
    //     }
    // }

    // function balanceOfBatch(
    //     address[] calldata _owners,
    //     uint256[] calldata _ids
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     require(_owners.length == _ids.length);

    //     uint256[] memory balances_ = new uint256[](_owners.length);

    //     for (uint256 i = 0; i < _owners.length; ++i) {
    //         uint256 id = _ids[i];
    //         if (isNonFungibleItem(id)) {
    //             balances_[i] = _tokenStorage.nfOwners[id] == _owners[i] ? 1 : 0;
    //         } else {
    //             balances_[i] = _tokenStorage.balances[id][_owners[i]];
    //         }
    //     }

    //     return balances_;
    // }

    // function balanceOfBatchNfType(
    //     address[] calldata _owners,
    //     uint256[] calldata _ids
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     require(_owners.length == _ids.length);

    //     uint256[] memory balances_ = new uint256[](_owners.length);

    //     for (uint256 i = 0; i < _owners.length; ++i) {
    //         uint256 id = _ids[i];
    //         if (isNonFungible(id)){
    //             uint256 baseType = getNonFungibleBaseType(id);
    //             balances_[i] = _tokenStorage.balances[baseType][_owners[i]];
    //         }
    //         else{
    //             balances_[i] = 0;
    //         }
    //     }

    //     return balances_;
    // }

    // function balanceOfBatchName(
    //     address[] calldata _owners,
    //     string[] calldata _names
    // ) external view returns (uint256[] memory) {
    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

    //     require(_owners.length == _names.length);

    //     uint256[] memory balances_ = new uint256[](_owners.length);
        
    //     for (uint256 i = 0; i < _owners.length; ++i) {
    //         uint256 baseType = _tokenStorage.tokenNames[_names[i]];
    //         balances_[i] = _tokenStorage.balances[baseType][_owners[i]];
    //     }

    //     return balances_;
    // }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param _operator  Address to add to the set of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address _operator, bool _approved) external {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        require(
            msg.sender != _operator,
            "ERC1155: Cannot set approval status for self"
        );

        _tokenStorage.operatorApproval[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The owner of the Tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public view returns (bool) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        return _tokenStorage.operatorApproval[_owner][_operator];
    }

    function setShouldReject(bool _value) public {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        _tokenStorage.shouldReject = _value;
    }

    function onERC1155Received(
        address /*_operator*/,
        address /*_from*/,
        uint256 /*_id*/,
        uint256 /*_value*/,
        bytes memory /*_data*/
    ) public view returns (bytes4) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (_tokenStorage.shouldReject == true) {
            revert("onERC1155Received: transfer not accepted");
        } else {
            return ERC1155_ACCEPTED;
        }
    }

    function onERC1155BatchReceived(
        address /*_operator*/,
        address /*_from*/,
        uint256[] calldata /*_ids*/,
        uint256[] calldata /*_values*/,
        bytes calldata /*_data*/
    ) public view returns (bytes4) {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
        if (_tokenStorage.shouldReject == true) {
            revert("onERC1155BatchReceived: transfer not accepted");
        } else {
            return ERC1155_BATCH_ACCEPTED;
        }
    }

    function _doSafeTransferAcceptanceCheck(address _operator, address _from, address _to, uint256 _id, uint256 _value, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.


        // Note: if the below reverts in the onERC1155Received function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155Received(_operator, _from, _id, _value, _data) == ERC1155_ACCEPTED, "contract returned an unknown value from onERC1155Received");
    }

    function _doSafeBatchTransferAcceptanceCheck(address _operator, address _from, address _to, uint256[] memory _ids, uint256[] memory _values, bytes memory _data) internal {

        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.

        // Note: if the below reverts in the onERC1155BatchReceived function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_BATCH_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155BatchReceived(_operator, _from, _ids, _values, _data) == ERC1155_BATCH_ACCEPTED, "contract returned an unknown value from onERC1155BatchReceived");
    }

    // function _mint(address to_, string memory uri_, uint256 amount_) internal {
    //     _mint(to_, uri_, amount_, "");
    // }

    // function _mint(
    //     address to_,
    //     string memory uri_,
    //     uint256 amount_,
    //     bytes memory data_
    // ) internal {
    //     _requireNonZero(to_);

    //     ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
    //     uint256 _id = _tokenStorage.uriID[uri_];
    //     if (_id == 0) {
    //         _tokenStorage.idx++;
    //         _id = _tokenStorage.idx;
    //         _tokenStorage.tokenURIs[_id] = uri_;
    //         _tokenStorage.uriID[uri_] = _id;
    //     }

    //     _tokenStorage.totalSupply[_id] += amount_;
    //     _tokenStorage.balances[_id][to_] += amount_;

    //     emit TransferSingle(msg.sender, address(0), to_, _id, amount_);

    //     _requireReceiver(address(0), to_, _id, amount_, data_);
    // }

    function _requireAuth(address account_) private view {
        require(
            account_ == msg.sender || isApprovedForAll(account_, msg.sender),
            "ERC1155: caller is not token owner or approved"
        );
    }

    function _requireNonZero(address account_) private pure {
        require(
            account_ != address(0),
            "ERC1155: address zero is not a valid owner"
        );
    }

    function 
    _requireBalance(
        address account_,
        uint256 id_,
        uint256 amount_
    ) private view {
        ERC1155FacetStorage storage _tokenStorage = erc1155Storage();

        if (isNonFungibleItem(id_)){
            require(
            _tokenStorage.nfOwners[id_] == account_,
                "ERC1155: Insufficient balance"
            );
        }
        else{
            // require(
            //     amount_ > 0,
            //     "ERC1155: Cannot send 0"
            // );
            require(
                _tokenStorage.balances[id_][account_] >= amount_,
                "ERC1155: Insufficient balance"
            );
        }
    }

    // function _requireReceiver(
    //     address from_,
    //     address to_,
    //     uint256 tokenID_,
    //     uint256 amount_,
    //     bytes memory data_
    // ) private {
    //     require(
    //         _checkOnERC1155Received(from_, to_, tokenID_, amount_, data_),
    //         "ERC1155: transfer to non ERC1155Receiver implementer"
    //     );
    // }

    // function _requireBatchReceiver(
    //     address from_,
    //     address to_,
    //     uint256[] memory tokenIDs_,
    //     uint256[] memory amounts_,
    //     bytes memory data_
    // ) private {
    //     require(
    //         _checkOnERC1155BatchReceived(
    //             from_,
    //             to_,
    //             tokenIDs_,
    //             amounts_,
    //             data_
    //         ),
    //         "ERC1155: transfer to non ERC1155Receiver implementer"
    //     );
    // }

    // function _hasContract(address account_) private view returns (bool) {
    //     return account_.code.length > 0;
    // }

    // function _checkOnERC1155Received(
    //     address from_,
    //     address to_,
    //     uint256 tokenID_,
    //     uint256 amount_,
    //     bytes calldata data_
    // ) private returns (bool) {
    //     if (_hasContract(to_)) {
    //         try
    //             onERC1155Received(msg.sender, from_, tokenID_, amount_, data_)
    //         returns (bytes4 retval) {
    //             return retval == IERC1155TokenReceiver.onERC1155Received.selector;
    //         } catch (bytes memory reason) {
    //             if (reason.length == 0) {
    //                 revert(
    //                     "ERC1155: transfer to non ERC1155Receiver implementer"
    //                 );
    //             } else {
    //                 /// @solidity memory-safe-assembly
    //                 assembly {
    //                     revert(add(32, reason), mload(reason))
    //                 }
    //             }
    //         }
    //     } else {
    //         return true;
    //     }
    // }

    // function _checkOnERC1155BatchReceived(
    //     address from_,
    //     address to_,
    //     uint256[] memory tokenIDs_,
    //     uint256[] memory amounts_,
    //     bytes memory data_
    // ) private returns (bool) {
    //     if (_hasContract(to_)) {
    //         try
    //             onERC1155BatchReceived(
    //                 msg.sender,
    //                 from_,
    //                 tokenIDs_,
    //                 amounts_,
    //                 data_
    //             )
    //         returns (bytes4 retval) {
    //             return retval == IERC1155TokenReceiver.onERC1155Received.selector;
    //         } catch (bytes memory reason) {
    //             if (reason.length == 0) {
    //                 revert(
    //                     "ERC1155: transfer to non ERC1155Receiver implementer"
    //                 );
    //             } else {
    //                 /// @solidity memory-safe-assembly
    //                 assembly {
    //                     revert(add(32, reason), mload(reason))
    //                 }
    //             }
    //         }
    //     } else {
    //         return true;
    //     }
    // }
}
