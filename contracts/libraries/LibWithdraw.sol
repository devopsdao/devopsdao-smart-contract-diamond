//LibTasks.sol

pragma solidity ^0.8.17;
// import "../interfaces/ITaskContract.sol";

// struct AppStorage {
//     uint256 secondVar;
//     uint256 firstVar;
//     uint256 lastVar;
//   }

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

import "../libraries/LibTasks.sol";
import "../libraries/LibUtils.sol";
import "../facets/tokenstorage/ERC1155StorageFacet.sol";
import "../facets/TokenFacet.sol";



library LibWithdraw {
    event Logs(address contractAdr, string message);

    function appStorage() internal pure returns (TaskStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function taskStorage()
        internal
        pure
        returns (TaskStorage storage ds)
    {
        bytes32 position = keccak256("diamond.tasks.storage");
        assembly {
            ds.slot := position
        }
    }

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


    function withdraw(address payable _addressToSend, string memory _chain, string[] memory tokenNames, int256[] memory tokenValues) external{
        TaskStorage storage _storage = taskStorage();
        if(msg.sender != _storage.tasks[address(this)].participant && msg.sender != _storage.tasks[address(this)].contractOwner){
            revert('not a participant or contractOwner');
        }

        address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;

        if (keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_CANCELED))) {
            _storage.tasks[address(this)].contractOwner.transfer(address(this).balance);
        } else if (
            keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_COMPLETED)) //|| 1==1
        ) {
            for(uint i; i < _storage.tasks[address(this)].symbols.length; i++) {
                bytes memory symbolBytes = bytes(_storage.tasks[address(this)].symbols[i]);
                bytes memory chainBytes = bytes(_chain);

                //check USDC balance
                address tokenAddress = IAxelarGateway(gateway_).tokenAddresses("aUSDC");
                uint256 contractUSDCAmount = IERC20(tokenAddress).balanceOf(address(this))/10;
                
                //check ETH balance
                if (address(this).balance!= 0) {
                    emit Logs(address(this), string.concat("withdrawing ", _storage.tasks[address(this)].symbols[i], " to Ethereum address: ",LibUtils.addressToString(_storage.tasks[address(this)].participant)));
                    _storage.tasks[address(this)].participant.transfer(address(this).balance);
                }
                
                ERC1155FacetStorage storage _tokenStorage = erc1155Storage();
                if(_tokenStorage.tokenNames[_storage.tasks[address(this)].symbols[i]] > 0){
                    if(_tokenStorage.tokenNames[_storage.tasks[address(this)].symbols[i]] > 0){
                        uint256 tokenBalance = TokenFacet(_storage.tasks[address(this)].contractParent).balanceOf(address(this), _tokenStorage.tokenNames[_storage.tasks[address(this)].symbols[i]]);
                        if(tokenBalance > 0){
                            TokenFacet(_storage.tasks[address(this)].contractParent).safeTransferFrom(address(this), _storage.tasks[address(this)].participant, _tokenStorage.tokenNames[_storage.tasks[address(this)].symbols[i]], tokenBalance, bytes(''));
                        }
                    }
                }
                else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && (
                    keccak256(chainBytes) == keccak256(bytes("Ethereum")) || 
                    keccak256(chainBytes) == keccak256(bytes("Binance")) ||
                    keccak256(chainBytes) == keccak256(bytes("Fantom")) ||
                    keccak256(chainBytes) == keccak256(bytes("Avalanche")) ||
                    keccak256(chainBytes) == keccak256(bytes("Polygon"))
                )) {
                    IERC20(tokenAddress).approve(gateway_, contractUSDCAmount);
                    IAxelarGateway(gateway_).sendToken(_chain, LibUtils.addressToString(_storage.tasks[address(this)].participant), "aUSDC", contractUSDCAmount);
                } else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && keccak256(chainBytes) == keccak256(bytes("Moonbase"))) {
                    emit Logs(address(this), string.concat("withdrawing ", _storage.tasks[address(this)].symbols[i], " to ", _chain, "address:",LibUtils.addressToString(_storage.tasks[address(this)].participant)));
                    IERC20(tokenAddress).approve(address(this), contractUSDCAmount);
                    IERC20(tokenAddress).transferFrom(address(this), _storage.tasks[address(this)].participant, contractUSDCAmount);
                }
                else{
                    revert RevertReason({
                        message: "invalid destination network"
                    });
                }
            }
        
        }
        else{
            revert('task is completed or canceled');
        }
    }
}
