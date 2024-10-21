const Arweave = require('arweave');
const fs = require('fs/promises');
const path = require('node:path');

let contractAddresses;

(async () => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if (typeof contractAddressesJson !== 'undefined') {
    contractAddresses = JSON.parse(contractAddressesJson);
  } else {
    console.log(`contract addresses file not found at ../abi/addresses.json`);
  }
})();

function fromAscii(str, padding) {
  let hex = '0x';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const n = code.toString(16);
    hex += n.length < 2 ? '0' + n : n;
  }
  return hex + '0'.repeat(padding * 2 - hex.length + 2);
}

let nonces = {};

async function getNonce(address, incremental) {
  if (typeof nonces[address] == 'undefined') {
    nonces[address] = await ethers.provider.getTransactionCount(address);
  }
  let currentNonce = nonces[address];
  if (incremental) {
    nonces[address] = currentNonce + 1;
  } else {
    nonces[address] = await ethers.provider.getTransactionCount(address);
  }
  console.log(`current nonce: ${currentNonce}`);
  return currentNonce;
}

task("getWalletAddress", "Get the wallet address for a given account ID")
  .addParam("account", "The account ID")
  .setAction(async (taskArgs, hre) => {
    const signers = await hre.ethers.getSigners();
    const walletAddress = await signers[taskArgs.account].getAddress();
    console.log(walletAddress);
  });

task("devCreateTask", "create a dodao task")
  .addParam("account", "account id")
  .addParam("type", "task type")
  .addParam("title", "task title")
  .addParam("description", "task description")
  .addParam("tags", "task tags")
  .addParam("tokens", "task reward symbols(DEV, aUSDC, NFT tokens)")
  .addParam("amounts", "symbol amounts")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskCreateFacet = await ethers.getContractAt('TaskCreateFacet', diamondAddress);

    const account = taskArguments.account;
    const tags = taskArguments.tags.indexOf(',') !== -1 ? taskArguments.tags.split(',') : [taskArguments.tags];
    const tokens = taskArguments.tokens.indexOf(',') !== -1 ? taskArguments.tokens.split(',') : [taskArguments.tokens];
    const amounts = taskArguments.amounts.indexOf(',') !== -1 ? taskArguments.amounts.split(',') : [taskArguments.amounts];

    const { customAlphabet } = require('nanoid');
    const nanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 12)();

    if (tokens.length === amounts.length) {
      const taskData = {
        nanoId: nanoId,
        taskType: taskArguments.type,
        title: taskArguments.title,
        description: taskArguments.description,
        repository: "",
        tags: tags,
        tokenContracts: ["0x0000000000000000000000000000000000000000"],
        tokenIds: [[0]],
        tokenAmounts: [[0]],
      };

      console.log(taskData);
      console.log(`using Diamond: ${diamondAddress} and ${signers[account].address} account`);

      let feeData = await ethers.provider.getFeeData();
      // console.log(feeData);
      let gasMultiplier = 1;
      let txSuccess = false;
      let event;

      while (!txSuccess) {
        try {
          console.log(`sending tx`);
          const tx = await taskCreateFacet.connect(signers[account]).createTaskContract(signers[account].address, taskData, {
            nonce: await getNonce(signers[account].address, false),
            type: 2,
            maxFeePerGas: feeData.maxFeePerGas + gasMultiplier,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas + gasMultiplier,
          });
          const receipt = await tx.wait();
          event = receipt.events[0];
          txSuccess = true;
        } catch (error) {
          console.log(error);
          gasMultiplier += 1;
          console.log(`retrying with ${gasMultiplier} gasMultiplier`);
        }
      }

      console.log(`created new task contract ${event.address}`);
    } else {
      console.log('--tokens and --amounts argument count must match');
    }
  });

task("devTaskParticipate", "participate in a dodao task")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .addParam("message", "message text")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskcontract);
    const tx = await taskContract.connect(signers[taskArguments.account]).taskParticipate(signers[taskArguments.account].address, taskArguments.message, 0);
    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(`updated task contract ${contractAdr}`);
  });

task("devTaskAuditParticipate", "participate in a dodao task audit")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .addParam("messagetext", "message text")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskcontract);
    const tx = await taskContract.connect(signers[taskArguments.account]).taskAuditParticipate(signers[taskArguments.account].address, taskArguments.messagetext, 0);
    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(`updated task contract ${contractAdr}`);
  });

const taskStateNew = 'new';
const taskStateAgreed = 'agreed';
const taskStateProgress = 'progress';
const taskStateReview = 'review';
const taskStateAudit = 'audit';
const taskStateCompleted = 'completed';
const taskStateCanceled = 'canceled';
const taskAuditStatePerforming = 'performing';
const taskAuditStateFinished = 'finished';
const taskStateAuditDecision = 'canceled';

task("devTaskStateChange", "change dodao task state")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .addParam("taskstate", "task state, can be: new, agreed, review, audit, performing or finished")
  .addParam("messagetext", "message text")
  .addOptionalParam("participant", "participant address")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    const participant = taskArguments.participant || '0x0000000000000000000000000000000000000000';
    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskcontract);

    if (
      taskArguments.taskState === taskStateAgreed ||
      taskArguments.taskState === taskStateProgress ||
      taskArguments.taskState === taskStateReview ||
      taskArguments.taskState === taskStateAudit
    ) {
      const tx = await taskContract.connect(signers[taskArguments.account]).taskStateChange(
        signers[taskArguments.account].address,
        participant,
        taskArguments.taskState,
        taskArguments.messageText,
        0,
        0
      );
      const receipt = await tx.wait();
      const event = receipt.events[0];
      const { contractAdr, message, timestamp } = event.args;
      console.log(`updated task contract ${contractAdr}`);
    } else {
      console.log('Invalid task state provided');
    }
  });

task("devTaskAuditDecision", "take dodao task audit decision")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .addParam("favour", "task audit decision can be taken in favour of customer or performer")
  .addParam("messageText", "message text")
  .addParam("rating", "rating of the performer")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    if (taskArguments.favour !== 'customer' && taskArguments.favour !== 'performer') {
      console.log(`task audit can be settled either in customer or performer favour`);
    } else {
      const rating = taskArguments.rating || 0;
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract);
      const tx = await taskContract.connect(signers[taskArguments.account]).taskAuditDecision(
        signers[taskArguments.account].address,
        taskArguments.favour,
        taskArguments.messageText,
        0,
        rating
      );
      const receipt = await tx.wait();
      const event = receipt.events[0];
      const { contractAdr, message, timestamp } = event.args;
      console.log(`updated task contract ${contractAdr}`);
    }
  });


  task("devAddTaskToBlacklist", "add task")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const tx = await taskContract.connect(signers[taskArguments.account]).addTaskToBlacklist(taskArguments.taskContract);
    const receipt = await tx.wait();
    console.log(`blacklisted task contract ${taskArguments.taskContract}`);
  });

task("devGetTaskContractsByState", "Get task contracts by state")
  .addParam("taskState", "The task state to filter by")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`Calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContractsByState = await taskContract.getTaskContractsByState(taskArgs.taskState);
    console.log(taskContractsByState);
  });

task("devGetTaskContractsByStateLimit", "Get task contracts by state")
  .addParam("taskState", "The task state to filter by")
  .addParam("offset", "Offet")
  .addParam("limit", "Limit")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`Calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContractsByState = await taskContract.getTaskContractsByStateLimit(taskArgs.taskState, taskArgs.offset, taskArgs.limit);
    console.log(JSON.stringify(taskContractsByState, null, 4)); 
  });


  task("devGetTaskContractsByStateLimitCount", "Get task contracts by state")
  .addParam("taskState", "The task state to filter by")
  .addParam("offset", "Offet")
  .addParam("limit", "Limit")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`Calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContractsByState = await taskContract.getTaskContractsByStateLimit(taskArgs.taskState, taskArgs.offset, taskArgs.limit);
    console.log(taskContractsByState.length);
  });

task("devGetTaskContractsCustomer", "get task contracts for a customer")
  .addParam("address", "customer address")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const call = await taskContract.getTaskContractsCustomer(taskArguments.address);
    console.log(call);
  });

task("devGetTaskContractsPerformer", "Get task contracts for a given performer")
  .addParam("address", "The address of the performer")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`Calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const performerTaskContracts = await taskContract.getTaskContractsPerformer(taskArgs.address);
    console.log(performerTaskContracts);
  });
  

task("devGetTaskContracts", "Get task contracts")
.setAction(async (taskArgs, hre) => {
  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
  // console.log(`Calling ${diamondAddress}`);

  const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
  const taskContracts = await taskContract.getTaskContracts();
  // console.log(taskContracts);
  console.log(JSON.stringify(taskContracts, null, 4)); 
});

task("devGetTaskContractsCount", "Get task contracts count")
.setAction(async (taskArgs, hre) => {
  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
  // console.log(`Calling ${diamondAddress}`);

  const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
  const taskContractsCount = await taskContract.getTaskContractsCount();
  // console.log(taskContracts);
  console.log(JSON.stringify(taskContractsCount, null, 4)); 
});

task("devGetTaskContractsBlacklist", "Get blacklisted task contracts")
.setAction(async (taskArgs, hre) => {
  const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
  // console.log(`Calling ${diamondAddress}`);

  const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
  const blacklistedTaskContracts = await taskContract.getTaskContractsBlacklistMapping();
  console.log(blacklistedTaskContracts);
});

task("devGetTasksData", "get task data for a list of task contracts")
  .addParam("taskcontracts", "array of task contract addresses")
  .setAction(async function (taskArguments, hre, runSuper) {

    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    console.log(taskArguments.taskcontracts);
    const taskContracts = JSON.parse(taskArguments.taskcontracts);
    // console.log(`calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const tasksData = await taskContract.getTasksData(taskContracts);
    console.log(tasksData);
  });


  task("devGetTasksDataCount", "get task data for a list of task contracts")
  .addParam("taskcontracts", "array of task contract addresses")
  .setAction(async function (taskArguments, hre, runSuper) {

    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    console.log(taskArguments.taskcontracts);
    const taskContracts = JSON.parse(taskArguments.taskcontracts);
    // console.log(`calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const tasksData = await taskContract.getTasksData(taskContracts);
    console.log(tasksData.length);
  });

  task("devGetAccountStats", "Get account stats")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    const taskStatsContract = await ethers.getContractAt('TaskStatsFacet', diamondAddress);

    const accountStats = await taskStatsContract.getAccountStats(0, 100);

    console.log(JSON.stringify(accountStats, null, 2));
  });

  task("devGetRawAccountCount", "Get account count")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    const accountDataFacet = await ethers.getContractAt('AccountDataFacet', diamondAddress);

    const accountCount = await accountDataFacet.getRawAccountsCount();

    console.log(JSON.stringify(accountCount, null, 2));
  });

  task("devGetAccountsList", "Get accounts list")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    const accountDataFacet = await ethers.getContractAt('AccountDataFacet', diamondAddress);

    const accountList = await accountDataFacet.getAccountsList();

    console.log(JSON.stringify(accountList, null, 2));
  });

task("devGetTaskStatsWithTimestamps", "Get task stats with timestamps")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];

    const taskStatsContract = await ethers.getContractAt('TaskStatsFacet', diamondAddress);

    const taskStats = await taskStatsContract.getTaskStatsWithTimestamps(0, 50);

    console.log(JSON.stringify(taskStats, null, 2));
  });

task("devTokenGetBalanceOf", "get token balance")
  .addParam("address", "customer address")
  .addParam("id", "token ID")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`calling ${diamondAddress}`);

    const taskContract = await ethers.getContractAt('TokenFacet', diamondAddress);
    const call = await taskContract.balanceOf(taskArguments.address, taskArguments.id);
    console.log(call);
    // console.log(call.length);
  });


task("devBalanceOfName", "Get the balance of an NFT by name for a given account")
  .addParam("address", "The account address")
  .addParam("name", "The name of the NFT")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`Calling ${diamondAddress}`);

    const tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress);

    const balance = await tokenDataFacet.balanceOfName(taskArgs.address, taskArgs.name);
    // console.log(`Balance of NFT "${taskArgs.name}" for account ${taskArgs.address}: ${balance}`);
    console.log(balance);
  });


task("devTransferNFT", "send NFT")
  .addParam("address", "destination address")
  .addParam("id", "token id")
  .addParam("amount", "amount")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    // console.log(`calling ${diamondAddress}`);

    const signers = await ethers.getSigners();
    const tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress);
    const call = await tokenFacet.connect(signers[1]).safeTransferFrom(
      signers[1].address,
      taskArguments.address,
      taskArguments.id,
      taskArguments.amount,
      fromAscii('')
    );
    console.log(call);
    // console.log(call.length);
  });

task("devWithdrawAndRate", "withdraw funds and rate the task")
  .addParam("account", "account id")
  .addParam("taskContract", "task contract")
  .addParam("addressToSend", "address to send the funds")
  .addParam("chain", "chain name or ID")
  .addParam("rating", "rating for the task")
  .setAction(async function (taskArguments, hre, runSuper) {
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract);

    const tx = await taskContract.connect(signers[taskArguments.account]).withdrawAndRate(
      signers[taskArguments.account].address,
      taskArguments.addresstosend,
      taskArguments.chain,
      taskArguments.rating
    );

    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(`updated task contract ${contractAdr}`);
  });

  task("devSendMessage", "Send a message for a task")
  .addParam("account", "The account ID")
  .addParam("taskContract", "The task contract address")
  .addParam("messagetext", "The message text")
  .addParam("replyto", "The ID of the message to reply to (0 for a new message)")
  .addOptionalParam("to", "The address to send the message to (optional)")
  .setAction(async (taskArgs, hre, runSuper) => {
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', taskArgs.taskcontract);

    let tx;
    if (taskArgs.to) {
      tx = await taskContract.connect(signers[taskArgs.account]).sendMessage(
        signers[taskArgs.account].address,
        taskArgs.messagetext,
        taskArgs.replyto,
        taskArgs.to
      );
    } else {
      tx = await taskContract.connect(signers[taskArgs.account]).sendMessage(
        signers[taskArgs.account].address,
        taskArgs.messagetext,
        taskArgs.replyto
      );
    }

    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(`Updated task contract ${contractAdr}`);
  });