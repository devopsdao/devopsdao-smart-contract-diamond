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
    console.log(JSON.stringify({ walletAddress }));
  });

task("devCreateTask", "create a dodao task")
  .addParam("input", "JSON input containing task details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskCreateFacet = await ethers.getContractAt('TaskCreateFacet', diamondAddress);

    const { account, type, title, description, tags, tokens, amounts } = input;
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
    const amountArray = Array.isArray(amounts) ? amounts : [amounts];

    const { customAlphabet } = require('nanoid');
    const nanoId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 12)();

    if (tokenArray.length === amountArray.length) {
      const taskData = {
        nanoId: nanoId,
        taskType: type,
        title: title,
        description: description,
        repository: "",
        tags: tagArray,
        tokenContracts: ["0x0000000000000000000000000000000000000000"],
        tokenIds: [[0]],
        tokenAmounts: [[0]],
      };

      console.log(taskData);
      console.log(`using Diamond: ${diamondAddress} and ${signers[account].address} account`);

      let feeData = await ethers.provider.getFeeData();
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

      console.log(JSON.stringify({ taskContract: event.address }));
    } else {
      console.log(JSON.stringify({ error: 'Invalid input: tokens and amounts arrays must have the same length' }));
    }
  });

task("devTaskParticipate", "participate in a dodao task")
  .addParam("input", "JSON input containing participation details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);
    const tx = await taskContract.connect(signers[input.account]).taskParticipate(signers[input.account].address, input.message, 0);
    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(JSON.stringify({ contractAdr, message, timestamp }));
  });

task("devTaskAuditParticipate", "participate in a dodao task audit")
  .addParam("input", "JSON input containing audit participation details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);
    const tx = await taskContract.connect(signers[input.account]).taskAuditParticipate(signers[input.account].address, input.messagetext, 0);
    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(JSON.stringify({ contractAdr, message, timestamp }));
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
  .addParam("input", "JSON input containing task state change details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    const participant = input.participant || '0x0000000000000000000000000000000000000000';
    const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);

    if (
      input.taskstate === taskStateAgreed ||
      input.taskstate === taskStateProgress ||
      input.taskstate === taskStateReview ||
      input.taskstate === taskStateAudit
    ) {
      const tx = await taskContract.connect(signers[input.account]).taskStateChange(
        signers[input.account].address,
        participant,
        input.taskstate,
        input.messagetext,
        0,
        0
      );
      const receipt = await tx.wait();
      const event = receipt.events[0];
      const { contractAdr, message, timestamp } = event.args;
      console.log(JSON.stringify({ contractAdr, message, timestamp }));
    } else {
      console.log(JSON.stringify({ error: 'Invalid task state provided' }));
    }
  });

task("devTaskAuditDecision", "take dodao task audit decision")
  .addParam("input", "JSON input containing audit decision details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    if (input.favour !== 'customer' && input.favour !== 'performer') {
      console.log(JSON.stringify({ error: 'Task audit can be settled either in customer or performer favour' }));
    } else {
      const rating = input.rating || 0;
      const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);
      const tx = await taskContract.connect(signers[input.account]).taskAuditDecision(
        signers[input.account].address,
        input.favour,
        input.messagetext,
        0,
        rating
      );
      const receipt = await tx.wait();
      const event = receipt.events[0];
      const { contractAdr, message, timestamp } = event.args;
      console.log(JSON.stringify({ contractAdr, message, timestamp }));
    }
  });

task("devGetTaskContractsByState", "Get task contracts by state")
  .addParam("taskstate", "The task state to filter by")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContractsByState = await taskContract.getTaskContractsByState(taskArgs.taskstate);
    console.log(JSON.stringify({ taskContracts: taskContractsByState }));
  });

task("devGetTaskContractsCustomer", "get task contracts for a customer")
  .addParam("customeraddress", "customer address")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContracts = await taskContract.getTaskContractsCustomer(taskArguments.customeraddress);
    console.log(JSON.stringify({ taskContracts }));
  });

task("devGetTaskContractsPerformer", "Get task contracts for a given performer")
  .addParam("performeraddress", "The address of the performer")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const performerTaskContracts = await taskContract.getTaskContractsPerformer(taskArgs.performeraddress);
    console.log(JSON.stringify({ taskContracts: performerTaskContracts }));
  });

task("devGetTasksData", "get task data for a list of task contracts")
  .addParam("taskcontracts", "JSON array of task contract addresses")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskContract = await ethers.getContractAt('TaskDataFacet', diamondAddress);
    const taskContracts = JSON.parse(taskArguments.taskcontracts);
    const tasksData = await taskContract.getTasksData(taskContracts);
    console.log(JSON.stringify({ tasksData }));
  });

task("devTokenGetBalanceOf", "get token balance")
  .addParam("address", "customer address")
  .addParam("id", "token ID")
  .setAction(async function (taskArguments, hre, runSuper) {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const taskContract = await ethers.getContractAt('TokenFacet', diamondAddress);
    const balance = await taskContract.balanceOf(taskArguments.address, taskArguments.id);
    console.log(JSON.stringify({ balance }));
  });

task("devBalanceOfName", "Get the balance of an NFT by name for a given account")
  .addParam("account", "The account address")
  .addParam("name", "The name of the NFT")
  .setAction(async (taskArgs, hre) => {
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress);
    const accounts = await tokenDataFacet.balanceOfName(taskArgs.account, taskArgs.name);
    console.log(JSON.stringify({ accounts }));
  });

task("devTransferNFT", "send NFT")
  .addParam("input", "JSON input containing NFT transfer details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    const signers = await ethers.getSigners();
    const tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress);
    const tx = await tokenFacet.connect(signers[1]).safeTransferFrom(
      signers[1].address,
      input.toaccount,
      input.id,
      input.amount,
      fromAscii('')
    );
    const receipt = await tx.wait();
    console.log(JSON.stringify({ receipt }));
  });

task("devWithdrawAndRate", "withdraw funds and rate the task")
  .addParam("input", "JSON input containing withdrawal and rating details")
  .setAction(async function (taskArguments, hre, runSuper) {
    const input = JSON.parse(taskArguments.input);
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);

    const tx = await taskContract.connect(signers[input.account]).withdrawAndRate(
      signers[input.account].address,
      input.addresstosend,
      input.chain,
      input.rating
    );

    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(JSON.stringify({ contractAdr, message, timestamp }));
  });

task("devSendMessage", "Send a message for a task")
  .addParam("input", "JSON input containing message details")
  .setAction(async (taskArgs, hre, runSuper) => {
    const input = JSON.parse(taskArgs.input);
    const signers = await ethers.getSigners();
    const taskContract = await ethers.getContractAt('TaskContract', input.taskcontract);

    let tx;
    if (input.to) {
      tx = await taskContract.connect(signers[input.account]).sendMessage(
        signers[input.account].address,
        input.messagetext,
        input.replyto,
        input.to
      );
    } else {
      tx = await taskContract.connect(signers[input.account]).sendMessage(
        signers[input.account].address,
        input.messagetext,
        input.replyto
      );
    }

    const receipt = await tx.wait();
    const event = receipt.events[0];
    const { contractAdr, message, timestamp } = event.args;
    console.log(JSON.stringify({ contractAdr, message, timestamp }));
  });