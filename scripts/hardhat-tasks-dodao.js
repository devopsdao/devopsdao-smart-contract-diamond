// const { ethers } = require("hardhat");
const Arweave = require('arweave')
const fs = require('fs/promises')
const path = require('node:path');


// async function main(){

//     await mintNFTs();

// }
let contractAddresses;

(async() => {
  const contractAddressesJson = await fs.readFile(path.join(__dirname, `../abi/addresses.json`));
  if(typeof contractAddressesJson !== 'undefined'){
    contractAddresses = JSON.parse(contractAddressesJson);
  }
  else{
    console.log(`contract addresses file not found at ../abi/addresses.json`)
}
})()



task(
  "devCreateTask",
  "create a dodao task")
  .addParam("type", "task type")
  .addParam("title", "task title")
  .addParam("description", "task description")
  .addParam("tags", "task tags")
  .addParam("symbols", "task reward symbols(DEV, aUSDC, NFT tokens)")
  .addParam("amounts", "symbol amounts")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    signers = await ethers.getSigners();
    const diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
    taskCreateFacet = await ethers.getContractAt('TaskCreateFacet', diamondAddress)

    let tags = []

    if(taskArguments.tags.indexOf(',') != -1){
      tags = taskArguments.tags.split(',')
    }
    else{
      tags.push(taskArguments.tags)
    }

    let symbols = []
    if(taskArguments.symbols.indexOf(',') != -1){
      symbols = taskArguments.symbols.split(',')
    }
    else{
      symbols.push(taskArguments.symbols)
    }

    let amounts = []

    if(taskArguments.amounts.indexOf(',') != -1){
      amounts = taskArguments.amounts.split(',')
    }
    else{
      amounts.push(taskArguments.amounts)
    }

    if(symbols.length === amounts.length){
      const taskData = {
        nanoId: 'nanoId1',
        taskType: taskArguments.type,
        title: taskArguments.title,
        description: taskArguments.description,
        tags : tags,
        symbols: symbols,
        amounts: amounts
      }
      console.log(taskData)

      tx = await taskCreateFacet.createTaskContract(signers[0].address, taskData,
      { gasLimit: 30000000 })
      const receipt = await tx.wait()
      const event = receipt.events[0]
      console.log(`created new task contract ${event.address}`)
    }
    else{
      console.log('--symbols and --amounts argument count must match')
    }

  }
);

task(
  "devTaskParticipate",
  "participate in a dodao task")
  .addParam("taskcontract", "task contract")
  .addParam("message", "message text")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    signers = await ethers.getSigners();

    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskcontract)
    tx = await taskContract.connect(signers[2]).taskParticipate(signers[1].address, taskArguments.message, 0)
    const receipt = await tx.wait()
    const event = receipt.events[0]
    const { contractAdr, message, timestamp } = event.args
    console.log(`updated task contract ${contractAdr}`)
  }
);

task(
  "devTaskAuditParticipate",
  "participate in a dodao task audit")
  .addParam("taskContract", "task contract")
  .addParam("messageText", "message text")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
    tx = await taskContract.connect(signers[1]).taskAuditParticipate(signers[1].address, taskArguments.messageText, 0)
    const receipt = await tx.wait()
    const event = receipt.events[0]
    const { contractAdr, message, timestamp } = event.args
    console.log(`updated task contract ${contractAdr}`)

  }
);

const taskStateNew = 'new'
const taskStateAgreed = 'agreed'
const taskStateProgress = 'progress'
const taskStateReview = 'review'
const taskStateAudit = 'audit'
const taskAuditStatePerforming = 'performing'
const taskAuditStateFinished = 'finished'
taskStateAuditDecision = 'canceled'
taskStateAuditDecision = 'completed'


task(
  "devTaskStateChange",
  "change dodao task state")
  .addParam("taskContract", "task contract")
  .addParam("taskState", "task state, can be: new, agreed, review, audit, performing or finished")
  .addParam("messageText", "message text")
  .addOptionalParam("participant", "NFT names")

  .setAction(
  async function (taskArguments, hre, runSuper) {

    if(typeof taskArguments.participant != 'undefined'){
      participant = taskArguments.participant
    }
    else{
      participant = '0x0000000000000000000000000000000000000000'
    }

    if(taskArguments.taskState === taskStateAgreed){
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
      tx = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, participant, taskStateAgreed, taskArguments.messageText, 0, 0);
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`updated task contract ${contractAdr}`)    }

    if(taskArguments.taskState === taskStateProgress){
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
      tx = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, participant, taskStateProgress, taskArguments.messageText, 0, 0);
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`updated task contract ${contractAdr}`)    }

    if(taskArguments.taskState === taskStateReview){
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
      tx = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, participant, taskStateReview, taskArguments.messageText, 0, 0);
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`updated task contract ${contractAdr}`)    }
    
    if(taskArguments.taskState === taskStateAudit){
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
      tx = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, participant, taskStateAudit, taskArguments.messageText, 0, 0);
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`updated task contract ${contractAdr}`)    }
  }
);


task(
  "devTaskAuditDecision",
  "take dodao task audit decision")
  .addParam("taskContract", "task contract")
  .addParam("favour", "task audit decision can be taken in favour of customer or performer")
  .addParam("messageText", "message text")
  .addParam("rating", "rating of the performer")

  .setAction(
  async function (taskArguments, hre, runSuper) {

    if(taskArguments.favour != 'customer' && taskArguments.favour != 'performer'){

      console.log(`task audit can be settled either in customer or performer favour`)
    }
    else{
      if(typeof taskArguments.rating != 'undefined'){
        rating = taskArguments.rating
      }
      else{
        rating = 0
      }
      const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
      tx = await taskContract.connect(signers[2]).taskAuditDecision(signers[2].address, taskArguments.favour, taskArguments.messageText, 0, rating);
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`updated task contract ${contractAdr}`)    }


  }
);

// (async() => {
//     await main()
//   })()