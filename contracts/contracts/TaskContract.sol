import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

import "../libraries/LibAppStorage.sol";
import "../libraries/LibUtils.sol";
import {LibDiamond} from '../libraries/LibDiamond.sol';
import "../libraries/LibInterchain.sol";

import "../facets/TokenFacet.sol";
import "../facets/DiamondLoupeFacet.sol";

import "hardhat/console.sol";

error RevertReason (string message);


contract TaskContract  {
    TasksStorage internal _storage;
    InterchainStorage internal _storageInterchain;

    IAxelarGateway public immutable gateway;


    event Logs(address contractAdr, string message);
    event LogsValue(address contractAdr, string message, uint value);
    event TaskUpdated(address contractAdr, string message, uint timestamp);

    constructor(
        string memory _nanoId,
        string memory _taskType,
        string memory _title,
        string memory _description,
        string memory _symbol,
        address payable _contractOwner
        // uint256 _rating
    ) payable {
        // data = _data;

        _storage.tasks[address(this)].nanoId = _nanoId;
        _storage.tasks[address(this)].taskType = _taskType;
        _storage.tasks[address(this)].title = _title;
        _storage.tasks[address(this)].description = _description;
        _storage.tasks[address(this)].symbol = _symbol;
        _storage.tasks[address(this)].taskState = TASK_STATE_NEW;
        _storage.tasks[address(this)].contractParent = msg.sender;
        _storage.tasks[address(this)].contractOwner = _contractOwner;
        _storage.tasks[address(this)].createTime = block.timestamp;
        // _storage.tasks[address(this)].index = _index;
        address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;
        gateway = IAxelarGateway(gateway_);

        emit TaskUpdated(address(this), 'TaskContract', block.timestamp);
    }

    function getTaskInfo() external view returns (Task memory task)
    {
        return _storage.tasks[address(this)];
    }


    function getBalance() public view returns (uint256) {
        uint256 balance = address(this).balance;
        return balance;
    }


    function transferToaddress(address payable _addressToSend, string memory _chain) external payable {
        address payable contractOwner = _storage.tasks[address(this)].contractOwner;
        address payable participant = _storage.tasks[address(this)].participant;
        uint256 balance = address(this).balance;
        string memory taskState = _storage.tasks[address(this)].taskState;
        string memory symbol = _storage.tasks[address(this)].symbol;

        if(msg.sender != participant && msg.sender != contractOwner){
            revert('not a participant or contractOwner');
        }

        if (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_CANCELED))) {
            contractOwner.transfer(balance);
        } else if (
            keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_COMPLETED)) //|| 1==1
        ) {
            bytes memory symbolBytes = bytes(symbol);
            bytes memory chainBytes = bytes(_chain);

            //check USDC balance
            address tokenAddress = gateway.tokenAddresses("aUSDC");
            uint256 contractUSDCAmount = IERC20(tokenAddress).balanceOf(address(this))/10;
            
            //check ETH balance
            if (balance!= 0) {
                emit Logs(address(this), string.concat("withdrawing ", symbol, " to Ethereum address: ",LibUtils.addressToString(participant)));
                participant.transfer(balance);
            } 
            // if (contractUSDCAmount !=0 && (
            //     keccak256(chainBytes) == keccak256(bytes("PolygonAxelar"))
            // )) {
            //     emit Logs(address(this), string.concat("withdrawing via sendToMany ", symbol, " to ", _chain, "value: ", LibUtils.uint2str(msg.value), " address:",LibUtils.addressToString(participant)));
            //     emit LogsValue(address(this), string.concat("msg.sender: ", LibUtils.addressToString(msg.sender)," call value: "), msg.value);
            //     // string memory _addressToSend2 = bytes(_addressToSend);
            //     IERC20(tokenAddress).approve(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A, contractUSDCAmount);
            //     address[] memory destinationAddresses;
            //     destinationAddresses[0] = participant;
            //     IDistributionExecutable(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A).sendToMany{value: msg.value}("polygon", LibUtils.addressToString(0xEAAA71f74b01617BA2235083334a1c952BAC0a6C), destinationAddresses, 'aUSDC', contractUSDCAmount);
            // }
            else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && (
                keccak256(chainBytes) == keccak256(bytes("Ethereum")) || 
                keccak256(chainBytes) == keccak256(bytes("Binance")) ||
                keccak256(chainBytes) == keccak256(bytes("Fantom")) ||
                keccak256(chainBytes) == keccak256(bytes("Avalanche")) ||
                keccak256(chainBytes) == keccak256(bytes("Polygon"))
            )) {
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participant)));
                // _destinationAddresses.push(_addressToSend);
                // distributor.sendToMany(chain, _addressToSend, _destinationAddresses, 'aUSDC', contractAddress.balance);
                // string memory _addressToSend2 = bytes(_addressToSend);

                IERC20(tokenAddress).approve(address(gateway), contractUSDCAmount);
                // gateway.sendToken(chain, toAsciiString(participant), "aUSDC", amount);
                gateway.sendToken(_chain, LibUtils.addressToString(participant), "aUSDC", contractUSDCAmount);
            } else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && keccak256(chainBytes) == keccak256(bytes("Moonbase"))) {
                // revert InvalidToken({
                //     token: string.concat("we are in moonbase, participant",LibUtils.addressToString(participant))
                // });
                emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participant)));
                IERC20(tokenAddress).approve(address(this), contractUSDCAmount);
                IERC20(tokenAddress).transferFrom(address(this), participant, contractUSDCAmount);
            }
            else{
                revert RevertReason({
                    message: "invalid destination network"
                });
            }
        }
        else{
            revert('task is completed or canceled');
        }
        emit TaskUpdated(address(this), 'transferToaddress', block.timestamp);
    }

    function taskParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        address sender;
        if(msg.sender == _storageInterchain.configAxelar.sourceAddress 
            || msg.sender == _storageInterchain.configHyperlane.sourceAddress 
            || msg.sender == _storageInterchain.configLayerzero.sourceAddress
            || msg.sender == _storageInterchain.configWormhole.sourceAddress
        ){
            sender = _sender;
        }
        else{
            sender = msg.sender;
        }
        LibAppStorage.taskParticipate(sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'taskParticipate', block.timestamp);
    }


    function taskAuditParticipate(address _sender, string memory _message, uint256 _replyTo) external {
        uint256 balance = TokenFacet(_storage.tasks[address(this)].contractParent).balanceOf(msg.sender, 1);
        console.log(balance);
        require(balance>0, 'must hold Auditor NFT to audit');
        
        address sender;
        if(msg.sender == _storageInterchain.configAxelar.sourceAddress 
            || msg.sender == _storageInterchain.configHyperlane.sourceAddress 
            || msg.sender == _storageInterchain.configLayerzero.sourceAddress
            || msg.sender == _storageInterchain.configWormhole.sourceAddress
        ){
            sender = _sender;
        }
        else{
            sender = msg.sender;
        }
        // require(auditorNFTbalance > 0, 'no auditor priviledge');
        LibAppStorage.taskAuditParticipate(sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'taskAuditParticipate', block.timestamp);
    }

    function taskStateChange(
            address _sender,
            address payable _participant,
            string memory _state,
            string memory _message,
            uint256 _replyTo,
            uint256 _score
        ) external {
        address sender;
        if(msg.sender == _storageInterchain.configAxelar.sourceAddress 
            || msg.sender == _storageInterchain.configHyperlane.sourceAddress 
            || msg.sender == _storageInterchain.configLayerzero.sourceAddress
            || msg.sender == _storageInterchain.configWormhole.sourceAddress
        ){
            sender = _sender;
        }
        else{
            sender = msg.sender;
        }
            LibAppStorage.taskStateChange(sender, _participant, _state, _message, _replyTo, _score);
            emit TaskUpdated(address(this), 'taskStateChange', block.timestamp);
        }

    function taskAuditDecision(
    address _sender,
    string memory _favour,
    string memory _message,
    uint256 _replyTo,
    uint256 rating
    ) external {
        address sender;
        if(msg.sender == _storageInterchain.configAxelar.sourceAddress 
            || msg.sender == _storageInterchain.configHyperlane.sourceAddress 
            || msg.sender == _storageInterchain.configLayerzero.sourceAddress
            || msg.sender == _storageInterchain.configWormhole.sourceAddress
        ){
            sender = _sender;
        }
        else{
            sender = msg.sender;
        }
        LibAppStorage.taskAuditDecision(sender, _favour, _message, _replyTo, rating);
        emit TaskUpdated(address(this), 'taskAuditDecision', block.timestamp);
    }

    function sendMessage(
    address _sender,
    string memory _message,
    uint256 _replyTo
    ) external {
        address sender;
        if(msg.sender == _storageInterchain.configAxelar.sourceAddress 
            || msg.sender == _storageInterchain.configHyperlane.sourceAddress 
            || msg.sender == _storageInterchain.configLayerzero.sourceAddress
            || msg.sender == _storageInterchain.configWormhole.sourceAddress
        ){
            sender = _sender;
        }
        else{
            sender = msg.sender;
        }
        LibAppStorage.sendMessage(sender, _message, _replyTo);
        emit TaskUpdated(address(this), 'sendMessage', block.timestamp);
    }

}