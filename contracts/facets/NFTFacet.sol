pragma solidity ^0.8.4;

import "erc1155diamondstorage/contracts/ERC1155.sol";
// import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

contract NFTFacet is ERC1155 {
    // Take note of the initializer modifiers.
    // - `initializerERC1155` for `ERC1155-Diamond`.
    // - `initializer` for OpenZeppelin's `OwnableUpgradeable`.
    function initialize(string memory uri_) initializerERC1155 public {
        __ERC1155_init(uri_);
        // __Ownable_init();
    }

    function mintAuditorNFT(address to, uint256 nftType) external {
        // string memory _uri = 'https://devopsdao';
        // uint256 _type = ERC1155MixedFungibleMintable.create(_uri);
        // uint256 nftType = 5;
        uint256 amount = 1;
        string memory data = "test2";
        ERC1155._mint(to, nftType, amount, bytes(data));
        // event(_type, _uri, msg.sender);
    }

    function balanceOf (address addr, uint256 nftType) public view override returns (uint256) {
        return ERC1155.balanceOf(addr, nftType);
        // return 1;
    }

}