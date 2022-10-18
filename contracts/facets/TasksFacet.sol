// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// import { IDistributionExecutable } from '../interfaces/IDistributionExecutable.sol';


// import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
// import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';


import "../libraries/LibAppStorage.sol";
import "../libraries/LibUtils.sol";
import "hardhat/console.sol";
// import "../libraries/LibTransfer.sol";
// import "../interfaces/ITaskContract.sol";

error RevertReason (string message);


contract TasksFacet {
    TasksStorage internal _storage;
    IAxelarGateway public immutable gateway;

    // TaskContract[] public jobArray;

    event OneEventForAll(address contractAdr, string message);


    event JobContractCreated(
        string nanoId,
        address taskAddress,
        address taskOwner,
        string title,
        string description,
        string symbol,
        uint256 amount
    );


    constructor() {
        address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;
        gateway = IAxelarGateway(gateway_);
    }

    // initial: new, contractor choosed: agreed, work in progress: progress, completed: completed, canceled

    // function indexCalculation(string memory _state) public returns (uint256) {}

    function createTaskContract(string memory _nanoId, string memory _title, string memory _description, string memory _symbol, uint256 _amount)
    external
    payable
    returns (address)
    {
        // console.log("createTaskContract %s to %s %s tokens", msg.sender, _nanoId, _title);


        // TasksStorage storage _storage = LibAppStorage.diamondStorage();
        TaskContract taskContract = new TaskContract{value: msg.value}(
            _nanoId,
            _title,
            _description,
            _symbol,
            payable(msg.sender)
        );


        if (keccak256(bytes(_symbol)) != keccak256(bytes("ETH"))) {
            address tokenAddress = gateway.tokenAddresses(_symbol);
            // amount = IERC20(tokenAddress).balanceOf(contractAddress);
            IERC20(tokenAddress).transferFrom(msg.sender, address(taskContract), _amount);
        }
        // IERC20(tokenAddress).approve(address(gateway), _amount);
        _storage.taskContracts.push(address(taskContract));
        _storage.ownerTasks[msg.sender].push(address(taskContract));

        return address(taskContract);


        // _storage.tasks[address(taskContract)] = taskContract.getJobInfo();
        // _storage.countNew++;
        // jobArray.push(job);
        // countNew++;
        // emit JobContractCreated(_nanoId, address(taskContract), msg.sender, _title, _description, _symbol, _amount);
        // emit OneEventForAll(address(taskContract), 'createJobContract success');
    }

    function getTaskContracts()
    external
    view
    returns (address[] memory)
    {
        // console.log(
        // "msg.sender %s",
        //     msg.sender
        // );
        return _storage.taskContracts;
    }

    function getTaskContractsbyState(string memory _taskState)
    external
    view
    returns (address[] memory)
    {
        address[] memory newTaskContracts;
        uint256 newTaskCount = 0;
        for (uint256 i = 0; i < _storage.taskContracts.length; i++) {
            if(keccak256(bytes(_storage.tasks[_storage.taskContracts[i]].taskState)) == keccak256(bytes(_taskState))){
                newTaskContracts[newTaskCount] = _storage.taskContracts[i];
                newTaskCount++;
            }
        }
        return newTaskContracts;
    }

    // function findJobs(uint256 _myIndex) external view returns (address) {
    //     return address(jobArray[_myIndex]);
    // }

    // function allJobs() external view returns (Job[] memory _jobs) {
    //     _jobs = new Job[](jobArray.length);
    //     uint256 count;
    //     for (uint256 i = 0; i < jobArray.length; i++) {
    //         _jobs[count] = jobArray[i];
    //         count++;
    //     }
    // }


    // function jobParticipate(TaskContract _taskContract) external {
    //     // TasksStorage storage _storage = LibAppStorage.diamondStorage();
    //     // _storage.tasks[address(taskContract)].jobParticipate(msg.sender);
    //     _taskContract.jobParticipate(msg.sender);
    //     emit OneEventForAll(address(_taskContract), 'jobParticipate success');
    // }

    // function jobAuditParticipate(TaskContract _taskContract) external {
    //     _taskContract.jobAuditParticipate(msg.sender);
    //     emit OneEventForAll(address(_taskContract), 'jobParticipate success');
    // }

    // function jobRating(TaskContract _taskContract, uint256 _score) external {
    //     _taskContract.jobRate(_score, msg.sender);
    //     emit OneEventForAll(address(_taskContract), 'jobParticipate success');
    // }


    // function taskStateChange(
    //     TaskContract _taskContract,
    //     address payable participantAddress,
    //     string memory _state
    // ) external {
    //     _taskContract.taskStateChange(participantAddress, _state, msg.sender);
    //     emit OneEventForAll(address(_taskContract), 'taskStateChange success');
    // }
    

    // function jobAuditStateChange(
    //     TaskContract _taskContract,
    //     string memory _favour
    // ) external {
    //     _taskContract.jobAuditDecision(_favour);
    //     emit OneEventForAll(address(_taskContract), 'jobAuditStateChange success');
    // }

    // function transferToaddress(TaskContract _taskContract, address payable addressToSend)
    // external
    // payable
    // {
    //     // addressToSend.transfer(0.5 ether);
    //     _taskContract.transferToaddress(addressToSend);
    //     emit OneEventForAll(address(_taskContract), 'transferToaddress success');
    // }


    // function transferToaddressChain2(TaskContract _taskContract, address payable _addressToSend, string memory _chain)
    // external
    // payable
    // {
    //     _taskContract.transferToaddressChain2{value: msg.value}(_addressToSend, _chain);
    //     emit OneEventForAll(address(_taskContract), 'transferToaddressChain2 success');
    // }

    // function getBalance(TaskContract _taskContract) external view returns (uint256) {
    //     uint256 _balance = _taskContract.getBalance();
    //     return _balance;
    // }


    // function getJobInfo(TaskContract _taskContract)
    // external
    // view
    // returns (Task memory jobInfo)
    // {
    //     return _taskContract.getJobInfo();
    // }

    // receive() external payable {}
}

// string constant TASK_STATE_NEW = "new";
// string constant TASK_STATE_AGREED = "agreed";
// string constant TASK_STATE_PROGRESS = "progress";
// string constant TASK_STATE_REVIEW = "review";
// string constant TASK_STATE_AUDIT = "audit";
// string constant TASK_STATE_COMPLETED = "completed";
// string constant TASK_STATE_CANCELED = "cancelled";

// string constant TASK_AUDIT_STATE_REQUESTED = "requested";
// string constant TASK_AUDIT_STATE_PERFORMING = "performing";
// string constant TASK_AUDIT_STATE_FINISHED = "finished";

contract TaskContract  {
    // IDistributionExecutable public immutable distributor;
    TasksStorage internal _storage;

    IAxelarGateway public immutable gateway;


    event Logs(address contractAdr, string message);
    event LogsValue(address contractAdr, string message, uint value);

    constructor(
        string memory _nanoId,
        string memory _title,
        string memory _description,
        string memory _symbol,
        address payable _contractOwner
        // uint256 _rating
    ) payable {
        // data = _data;

        _storage.tasks[address(this)].nanoId = _nanoId;
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
    //         address payable participantAddress = _storage.tasks[address(this)].participantAddress;
    //         participantAddress.transfer(balance);
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
        address payable participantAddress = _storage.tasks[address(this)].participantAddress;
        uint256 balance = address(this).balance;
        string memory taskState = _storage.tasks[address(this)].taskState;
        string memory symbol = _storage.tasks[address(this)].symbol;

        if(msg.sender != participantAddress || msg.sender != contractOwner){
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
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to Ethereum address: ",LibUtils.addressToString(participantAddress)));
                participantAddress.transfer(balance);
            } 
            // if (contractUSDCAmount !=0 && (
            //     keccak256(chainBytes) == keccak256(bytes("PolygonAxelar"))
            // )) {
            //     emit Logs(address(this), string.concat("withdrawing via sendToMany ", symbol, " to ", _chain, "value: ", LibUtils.uint2str(msg.value), " address:",LibUtils.addressToString(participantAddress)));
            //     emit LogsValue(address(this), string.concat("msg.sender: ", LibUtils.addressToString(msg.sender)," call value: "), msg.value);
            //     // string memory _addressToSend2 = bytes(_addressToSend);
            //     IERC20(tokenAddress).approve(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A, contractUSDCAmount);
            //     address[] memory destinationAddresses;
            //     destinationAddresses[0] = participantAddress;
            //     IDistributionExecutable(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A).sendToMany{value: msg.value}("polygon", LibUtils.addressToString(0xEAAA71f74b01617BA2235083334a1c952BAC0a6C), destinationAddresses, 'aUSDC', contractUSDCAmount);
            // }
            else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && (
                keccak256(chainBytes) == keccak256(bytes("Ethereum")) || 
                keccak256(chainBytes) == keccak256(bytes("Binance")) ||
                keccak256(chainBytes) == keccak256(bytes("Fantom")) ||
                keccak256(chainBytes) == keccak256(bytes("Avalanche")) ||
                keccak256(chainBytes) == keccak256(bytes("Polygon"))
            )) {
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participantAddress)));
                // _destinationAddresses.push(_addressToSend);
                // distributor.sendToMany(chain, _addressToSend, _destinationAddresses, 'aUSDC', contractAddress.balance);
                // string memory _addressToSend2 = bytes(_addressToSend);

                IERC20(tokenAddress).approve(address(gateway), contractUSDCAmount);
                // gateway.sendToken(chain, toAsciiString(participantAddress), "aUSDC", amount);
                gateway.sendToken(_chain, LibUtils.addressToString(participantAddress), "aUSDC", contractUSDCAmount);
            } else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && keccak256(chainBytes) == keccak256(bytes("Moonbase"))) {
                // revert InvalidToken({
                //     token: string.concat("we are in moonbase, participantAddress",LibUtils.addressToString(participantAddress))
                // });
                // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participantAddress)));
                IERC20(tokenAddress).approve(address(this), contractUSDCAmount);
                IERC20(tokenAddress).transferFrom(address(this), participantAddress, contractUSDCAmount);
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
        LibAppStorage.taskAuditParticipate(_message, _replyTo);
    }

    // function jobAuditParticipate() external {
    //     require(keccak256(bytes(_storage.tasks[address(this)].taskState)) == keccak256(bytes(TASK_STATE_AUDIT)), "task is not in the audit state");
    //     // TODO: add NFT based auditor priviledge check
    //     bool existed = false;
    //     if (_storage.tasks[address(this)].auditParticipants.length == 0) {
    //         _storage.tasks[address(this)].auditParticipants.push(msg.sender);
    //     } else {
    //         for (uint256 i = 0; i < _storage.tasks[address(this)].auditParticipants.length; i++) {
    //             if (_storage.tasks[address(this)].auditParticipants[i] == msg.sender) {
    //                 existed = true;
    //                 break;
    //             }
    //         }
    //         if (!existed) {
    //             _storage.tasks[address(this)].auditParticipants.push(msg.sender);
    //             _storage.auditParticipantTasks[msg.sender].push(address(this));
    //         }
    //     }
    // }
    function taskStateChange(
            address payable _participantAddress,
            string memory _state,
            string memory _message,
            uint256 _replyTo,
            uint256 _score
        ) external {
            LibAppStorage.taskStateChange(_participantAddress, _state, _message, _replyTo, _score);
        }
    // //todo: only allow calling child contract functions from the parent contract!!!
    // function taskStateChange(
    //     address payable _participantAddress,
    //     string memory _state,
    //     uint _score,
    //     string memory _message,
    //     string memory _replyTo
    // ) external {
    //     address contractOwner = _storage.tasks[address(this)].contractOwner;
    //     string memory taskState = _storage.tasks[address(this)].taskState;
    //     string memory auditState = _storage.tasks[address(this)].auditState;
    //     address[] memory participants = _storage.tasks[address(this)].participants;
    //     address[] memory auditParticipants = _storage.tasks[address(this)].auditParticipants;
    //     Message memory message;
    //     message.text = _message;
    //     message.timestamp = block.timestamp;
    //     message.sender = msg.sender;
    //     message.taskState = _state;
    //     message.replyTo = _replyTo;
    //     if (msg.sender == contractOwner && msg.sender != _participantAddress && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW)) && 
    //     keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AGREED))) {
    //         for (uint256 i = 0; i < participants.length; i++) {
    //             if (participants[i] == _participantAddress) {
    //                 _storage.tasks[address(this)].taskState = _state;
    //                 _storage.tasks[address(this)].participantAddress = _participantAddress;
    //                 _storage.tasks[address(this)].messages.push(message);
    //             }
    //             else{
    //                 revert('participant has not applied');
    //             }
    //         }
    //     } else if (msg.sender == _storage.tasks[address(this)].participantAddress &&
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_PROGRESS))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_PROGRESS;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (msg.sender == _storage.tasks[address(this)].participantAddress && 
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_REVIEW))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_REVIEW;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participantAddress &&
    //         keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)) && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_COMPLETED)) &&
    //         _score != 0 && _score <= 5) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_COMPLETED;
    //         _storage.tasks[address(this)].rating = _score;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_NEW)) && msg.sender == contractOwner && keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_CANCELED))) {
    //         _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
    //         _storage.tasks[address(this)].messages.push(message);
    //     } else if (keccak256(bytes(_state)) == keccak256(bytes(TASK_STATE_AUDIT))){
    //         if(msg.sender == contractOwner &&  msg.sender != _storage.tasks[address(this)].participantAddress &&
    //             (keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AGREED)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_PROGRESS)) || keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_REVIEW)))){
    //             _storage.tasks[address(this)].taskState = TASK_STATE_AUDIT;
    //             _storage.tasks[address(this)].auditInitiator = msg.sender;
    //             _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_REQUESTED;
    //             _storage.tasks[address(this)].messages.push(message);
    //         }
    //         else if(msg.sender == _storage.tasks[address(this)].participantAddress &&
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
    //             auditParticipants.length != 0){
    //             for (uint256 i = 0; i < auditParticipants.length; i++) {
    //                 if (auditParticipants[i] == _participantAddress) {
    //                     _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_PERFORMING;
    //                     _storage.tasks[address(this)].messages.push(message);
    //                     _storage.tasks[address(this)].auditorAddress = _participantAddress;
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

    // function jobAuditDecision(
    //     string memory _favour,
    //     string memory _message,
    //     string memory _replyTo
    // ) external {
    //     address auditorAddress = _storage.tasks[address(this)].auditorAddress;
    //     string memory taskState = _storage.tasks[address(this)].taskState;
    //     string memory auditState = _storage.tasks[address(this)].auditState;
    //     // TODO: add NFT based auditor priviledge check
    //     Message memory message;
    //     message.text = _message;
    //     message.timestamp = block.timestamp;
    //     message.sender = msg.sender;
    //     message.replyTo = _replyTo;
    //     if (msg.sender == auditorAddress && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
    //     && keccak256(bytes(auditState)) == keccak256(bytes(TASK_AUDIT_STATE_PERFORMING))
    //     && keccak256(bytes(_favour)) == keccak256(bytes("customer"))) {
    //         _storage.tasks[address(this)].auditState = TASK_AUDIT_STATE_FINISHED;
    //         _storage.tasks[address(this)].taskState = TASK_STATE_CANCELED;
    //         message.taskState = TASK_STATE_CANCELED;
    //         _storage.tasks[address(this)].messages.push(message);
    //     }
    //     else if (msg.sender == auditorAddress && keccak256(bytes(taskState)) == keccak256(bytes(TASK_STATE_AUDIT))
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
