// import "../libraries/LibAppStorage.sol";
// import "../libraries/LibUtils.sol";

// import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
// import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';

// string constant TASK_STATE_NEW = "new";
// string constant TASK_STATE_AGREED = "agreed";
// string constant TASK_STATE_PROGRESS = "progress";
// string constant TASK_STATE_REVIEW = "review";
// string constant TASK_STATE_AUDIT = "audit";
// string constant TASK_STATE_COMPLETED = "completed";
// string constant TASK_STATE_CANCELED = "cancelled";

// string constant JOB_AUDIT_STATE_REQUESTED = "requested";
// string constant JOB_AUDIT_STATE_PERFORMING = "performing";
// string constant JOB_AUDIT_STATE_FINISHED = "finished";

// error RevertReason (string message);

// library LibTransfer{
    


// function transferToaddress(address payable _addressToSend, string memory _chain) external payable {
//         TasksStorage storage _storage = LibAppStorage.diamondStorage();
//         address gateway_ = 0x5769D84DD62a6fD969856c75c7D321b84d455929;
//         IAxelarGateway gateway = IAxelarGateway(gateway_);

//         address payable contractOwner = _storage.tasks[address(this)].contractOwner;
//         address payable participant = _storage.tasks[address(this)].participant;
//         uint256 balance = address(this).balance;
//         string memory jobState = _storage.tasks[address(this)].jobState;
//         string memory symbol = _storage.tasks[address(this)].symbol;

//         if(msg.sender != participant || msg.sender != contractOwner){
//             revert('caller not allowed');
//         }

//         if (keccak256(bytes(jobState)) == keccak256(bytes(TASK_STATE_CANCELED))) {
//             contractOwner.transfer(balance);
//         } else if (
//             keccak256(bytes(jobState)) == keccak256(bytes(TASK_STATE_COMPLETED)) //|| 1==1
//         ) {
//             bytes memory symbolBytes = bytes(symbol);
//             bytes memory chainBytes = bytes(_chain);

//             //check USDC balance
//             address tokenAddress = gateway.tokenAddresses("aUSDC");
//             uint256 contractUSDCAmount = IERC20(tokenAddress).balanceOf(address(this))/10;
            
//             //check ETH balance
//             if (balance!= 0) {
//                 // emit Logs(address(this), string.concat("withdrawing ", symbol, " to Ethereum address: ",LibUtils.addressToString(participant)));
//                 participant.transfer(balance);
//             } 
//             // if (contractUSDCAmount !=0 && (
//             //     keccak256(chainBytes) == keccak256(bytes("PolygonAxelar"))
//             // )) {
//             //     emit Logs(address(this), string.concat("withdrawing via sendToMany ", symbol, " to ", _chain, "value: ", LibUtils.uint2str(msg.value), " address:",LibUtils.addressToString(participant)));
//             //     emit LogsValue(address(this), string.concat("msg.sender: ", LibUtils.addressToString(msg.sender)," call value: "), msg.value);
//             //     // string memory _addressToSend2 = bytes(_addressToSend);
//             //     IERC20(tokenAddress).approve(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A, contractUSDCAmount);
//             //     address[] memory destinationAddresses;
//             //     destinationAddresses[0] = participant;
//             //     IDistributionExecutable(0xE9F4b6dB26f964E5B62Fa3bEC5115a56B4DBd79A).sendToMany{value: msg.value}("polygon", LibUtils.addressToString(0xEAAA71f74b01617BA2235083334a1c952BAC0a6C), destinationAddresses, 'aUSDC', contractUSDCAmount);
//             // }
//             else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && (
//                 keccak256(chainBytes) == keccak256(bytes("Ethereum")) || 
//                 keccak256(chainBytes) == keccak256(bytes("Binance")) ||
//                 keccak256(chainBytes) == keccak256(bytes("Fantom")) ||
//                 keccak256(chainBytes) == keccak256(bytes("Avalanche")) ||
//                 keccak256(chainBytes) == keccak256(bytes("Polygon"))
//             )) {
//                 // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participant)));
//                 // _destinationAddresses.push(_addressToSend);
//                 // distributor.sendToMany(chain, _addressToSend, _destinationAddresses, 'aUSDC', contractAddress.balance);
//                 // string memory _addressToSend2 = bytes(_addressToSend);

//                 IERC20(tokenAddress).approve(address(gateway), contractUSDCAmount);
//                 // gateway.sendToken(chain, toAsciiString(participant), "aUSDC", amount);
//                 gateway.sendToken(_chain, LibUtils.addressToString(participant), "aUSDC", contractUSDCAmount);
//             } else if (keccak256(symbolBytes) == keccak256(bytes("aUSDC")) && keccak256(chainBytes) == keccak256(bytes("Moonbase"))) {
//                 // revert InvalidToken({
//                 //     token: string.concat("we are in moonbase, participant",LibUtils.addressToString(participant))
//                 // });
//                 // emit Logs(address(this), string.concat("withdrawing ", symbol, " to ", _chain, "address:",LibUtils.addressToString(participant)));
//                 IERC20(tokenAddress).approve(address(this), contractUSDCAmount);
//                 IERC20(tokenAddress).transferFrom(address(this), participant, contractUSDCAmount);
//             }
//             else{
//                 revert RevertReason({
//                     message: "invalid destination network"
//                 });
//             }
//         }
//         else{
//             revert('job is completed or canceled');
//         }
//     }
// }

