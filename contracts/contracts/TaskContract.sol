import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

import "../libraries/LibAppStorage.sol";
import "../libraries/LibUtils.sol";


error RevertReason (string message);


contract TaskContract  {
    // IDistributionExecutable public immutable distributor;
    TasksStorage internal _storage;

    IAxelarGateway public immutable gateway;


    event Logs(address contractAdr, string message);
    event LogsValue(address contractAdr, string message, uint value);

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
        // console.log(
        // "createTaskContract %s to %s %stokens",
        //     msg.sender,
        //     _nanoId,
        //     _title
        // );
    }

    // event OneEventForAll2(address contractAdr);

    // function createJob(string memory _content, uint256 _index) public {
    //     jobStructDataArray.push();

    //     jobStructData(
    //         _content,
    //         true,
    //         address(this),
    //         msg.sender,
    //         block.timestamp
    //     );
    //     emit jobCreated(_content, _index);
    // }

    function getTaskInfo() external view returns (Task memory task)
    {
        return _storage.tasks[address(this)];
    }


    function getBalance() public view returns (uint256) {
        uint256 balance = address(this).balance;
        return balance;
    }

    // function transferToaddress(address payable _addressToSend) public payable {
    //     address contractOwner = _storage.tasks[address(this)].contractOwner;
    //     uint256 balance = address(this).balance;
    //     string memory taskState = _storage.tasks[address(this)].taskState;
    //     if (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_CANCELED))) {
    //         if (_addressToSend == contractOwner) {
    //             _addressToSend.transfer(balance);
    //         }
    //     } else if (
    //         keccak256(bytes(taskState)) == keccak256(bytes("completed"))
    //     ) {
    //         address payable participant = _storage.tasks[address(this)].participant;
    //         participant.transfer(balance);
    //     }
    // }

    // function testTransfer() external payable{
    //     bytes4 functionSelector = bytes4(keccak256("myFunction(uint256)"));
    //     // get facet address of function
    //     address facet = _storage.selectorToFacet[functionSelector];
    //     bytes memory myFunctionCall = abi.encodeWithSelector(functionSelector, 4);
    //     (bool success, uint result) = address(facet).delegatecall(myFunctionCall);
    //     require(success, "myFunction failed");

    // }

    // function transferToaddressLib() external payable{
    //     delegatecall();
    // }




    function transferToaddress(address payable _addressToSend, string memory _chain) external payable {
        address payable contractOwner = _storage.tasks[address(this)].contractOwner;
        address payable participant = _storage.tasks[address(this)].participant;
        uint256 balance = address(this).balance;
        string memory taskState = _storage.tasks[address(this)].taskState;
        string memory symbol = _storage.tasks[address(this)].symbol;

        if(msg.sender != participant || msg.sender != contractOwner){
            revert('caller not allowed');
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
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to Ethereum address: ",LibUtils.addressToString(participant)));
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
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participant)));
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
    }

    function taskParticipate(string memory _message, uint256 _replyTo) external {
        LibAppStorage.taskParticipate(_message, _replyTo);
    }


    // function jobParticipate() external {
    //     require(keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_NEW)), "task is not in the new state");
    //     bool existed = false;
    //     if (_storage.tasks[address(this)].participants.length == 0) {
    //         _storage.tasks[address(this)].participants.push(msg.sender);
    //     } else {
    //         for (uint256 i = 0; i < _storage.tasks[address(this)].participants.length; i++) {
    //             if (_storage.tasks[address(this)].participants[i] == msg.sender) {
    //                 existed = true;
    //             }
    //         }
    //         if (!existed) {
    //             _storage.tasks[address(this)].participants.push(msg.sender);
    //             _storage.participantTasks[msg.sender].push(address(this));
    //         }
    //     }
    // }
    function taskAuditParticipate(string memory _message, uint256 _replyTo) external {
        //uint256 auditorNFTbalance = NFTFacet(address(this)).balanceOf(msg.sender, 5);
        //require(auditorNFTbalance > 0, 'no auditor priviledge');
        LibAppStorage.taskAuditParticipate(_message, _replyTo);
    }

    // function jobAuditParticipate() external {
    //     require(keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_AUDIT)), "task is not in the audit state");
    //     // TODO: add NFT based auditor priviledge check
    //     bool existed = false;
    //     if (_storage.tasks[address(this)].auditors.length == 0) {
    //         _storage.tasks[address(this)].auditors.push(msg.sender);
    //     } else {
    //         for (uint256 i = 0; i < _storage.tasks[address(this)].auditors.length; i++) {
    //             if (_storage.tasks[address(this)].auditors[i] == msg.sender) {
    //                 existed = true;
    //                 break;
    //             }
    //         }
    //         if (!existed) {
    //             _storage.tasks[address(this)].auditors.push(msg.sender);
    //             _storage.auditParticipantTasks[msg.sender].push(address(this));
    //         }
    //     }
    // }
    function taskStateChange(
            address payable _participant,
            string memory _state,
            string memory _message,
            uint256 _replyTo,
            uint256 _score
        ) external {
            LibAppStorage.taskStateChange(_participant, _state, _message, _replyTo, _score);
        }
    // //todo: only allow calling child contract functions from the parent contract!!!
    // function taskStateChange(
    //     address payable _participant,
    //     string memory _state,
    //     uint _score,
    //     string memory _message,
    //     string memory _replyTo
    // ) external {
    //     address contractOwner = _storage.tasks[address(this)].contractOwner;
    //     string memory taskState = _storage.tasks[address(this)].taskState;
    //     string memory auditState = _storage.tasks[address(this)].auditState;
    //     address[] memory participants = _storage.tasks[address(this)].participants;
    //     address[] memory auditors = _storage.tasks[address(this)].auditors;
    //     Message memory message;
    //     message.text = _message;
    //     message.timestamp = block.timestamp;
    //     message.sender = msg.sender;
    //     message.taskState = _state;
    //     message.replyTo = _replyTo;
    //     if (msg.sender == contractOwner && msg.sender != _participant && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW)) && 
    //     keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED))) {
    //         for (uint256 i = 0; i < participants.length; i++) {
    //             if (participants[i] == _participant) {
    //                 _storage.tasks[address(this)].taskState = _state;
    //                 _storage.tasks[address(this)].participant = _participant;
    //                 _storage.tasks[address(this)].messages.push(message);
    //             }
    //             else{
    //                 revert('participant has not applied');
    //             }
    //         }
    //     } else if (msg.sender == _storage.tasks[address(this)].participant &&
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_PROGRESS))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_PROGRESS;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (msg.sender == _storage.tasks[address(this)].participant && 
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_REVIEW))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_REVIEW;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participant &&
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_COMPLETED)) &&
    //         _score != 0 && _score <= 5) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
    //         _storage.tasks[address(this)].rating = _score;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW)) && msg.sender == contractOwner && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_CANCELED))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AUDIT))){
    //         if(msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participant &&
    //             (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)))){
    //             _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
    //             _storage.tasks[address(this)].auditInitiator = msg.sender;
    //             _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_REQUESTED;
    //             _storage.tasks[address(this)].messages.push(message);
    //         }
    //         else if(msg.sender == _storage.tasks[address(this)].participant &&
    //             (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW))))

    //         {
    //             _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
    //             _storage.tasks[address(this)].auditInitiator = msg.sender;
    //             _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_REQUESTED;
    //             _storage.tasks[address(this)].messages.push(message);
    //             //TODO: audit history need to add 
    //         }
    //         else if(msg.sender == contractOwner &&
    //             keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT)) && 
    //             keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_REQUESTED)) &&
    //             auditors.length != 0){
    //             for (uint256 i = 0; i < auditors.length; i++) {
    //                 if (auditors[i] == _participant) {
    //                     _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_PERFORMING;
    //                     _storage.tasks[address(this)].messages.push(message);
    //                     _storage.tasks[address(this)].auditor = _participant;
    //                     break;
    //                 }
    //             }
    //         }
    //     }
    //     else{
    //         revert('conditions are not met');
    //     }
    // }

    function taskAuditDecision(
    string memory _favour,
    string memory _message,
    uint256 _replyTo,
    uint256 rating
    ) external {
        LibAppStorage.taskAuditDecision(_favour, _message, _replyTo, rating);
    }

    function sendMessage(
    string memory _message,
    uint256 _replyTo
    ) external {
        LibAppStorage.sendMessage(_message, _replyTo);
    }


    // function getNFTBalance(address account, uint256 id) public view{
    //     //NFTFacet(address(this)).balanceOf(account, id);
    // }

    // function getNFTBalance2() public view{
    //     IDiamondLoupe.facetAddress();
    // }


    // function getNFTBalance() public view returns (uint256 balance){
    //     // LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    //     bytes4 functionSelector = bytes4(keccak256("myFunction(uint256)"));
    //     // get facet address of function

    //     LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    //     address facetAddress_ = ds.facetAddressAndSelectorPosition[functionSelector].facetAddress;

    //     bytes memory myFunctionCall = abi.encodeWithSelector(functionSelector, 4);
    //     (bool success, bytes memory result) = address(facetAddress_).delegatecall(myFunctionCall);
    //     require(success, "myFunction failed");
    //     balance = abi.decode(result, (uint256));
    // }
    // function jobAuditDecision(
    //     string memory _favour,
    //     string memory _message,
    //     string memory _replyTo
    // ) external {
    //     address auditor = _storage.tasks[address(this)].auditor;
    //     string memory taskState = _storage.tasks[address(this)].taskState;
    //     string memory auditState = _storage.tasks[address(this)].auditState;
    //     // TODO: add NFT based auditor priviledge check
    //     Message memory message;
    //     message.text = _message;
    //     message.timestamp = block.timestamp;
    //     message.sender = msg.sender;
    //     message.replyTo = _replyTo;
    //     if (msg.sender == auditor && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
    //     && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
    //     && keccak256(bytes(_favour)) == keccak256(bytes("customer"))) {
    //         _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
    //         _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
    //         message.taskState = TASK_STATE_CANCELED;
    //         _storage.tasks[address(this)].messages.push(message);
    //     }
    //     else if (msg.sender == auditor && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
    //     && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
    //     && keccak256(bytes(_favour)) == keccak256(bytes("perfomer"))) {
    //         _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
    //         _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
    //         message.taskState = TASK_STATE_COMPLETED;
    //         _storage.tasks[address(this)].messages.push(message);
    //     }
    //     else revert('conditions are not met');
    // }

    receive() external payable {}

}