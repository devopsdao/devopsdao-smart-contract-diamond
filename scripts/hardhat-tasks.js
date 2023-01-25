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



async function createNFT(nfType){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  console.log(`using Diamond: ${diamondAddress}`)

  const metadataJSON = await fs.readFile(path.join(__dirname,`./metadata/${nfType}.json`), 'utf-8');
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)

  const metadataURI = await uploadMetadata(nfType)
  console.log(metadataURI)

  const createNFT = await tokenFacet.create(metadataURI, nfType.toString(), true)
  const createNFTReceipt = await createNFT.wait()

  const createNFTEvent = createNFTReceipt.events[1]
  const { value:createdNFTuri, id:createdNFTbaseType } = createNFTEvent.args

  return createdNFTbaseType
}

async function mintNFTs(nfType, receivers){
    const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
    console.log(`using Diamond: ${diamondAddress}`)

    const metadataJSON = await fs.readFile(path.join(__dirname,`./metadata/${nfType}.json`), 'utf-8');
    let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)

    const baseType = await tokenFacet.getTokenId(nfType)

    const mintNFT = await tokenFacet.mintNonFungible(baseType, receivers)
    const mintNFTReceipt = await mintNFT.wait()
    // console.log(mintNFTReceipt)

    const ids = []
    for(const event of mintNFTReceipt.events){
      const mintNFTEvent = mintNFTReceipt.events[0]
      const { operator, from, to, id, value } = mintNFTEvent.args
      ids.push(id)
    }

    return ids
    // return 
}

async function setURIOfName(metadataURI, nfType){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  console.log(`setting URI for ${nfType} to ${metadataURI}`)
  // const baseType = await tokenFacet.getTokenId(nfType)
  const tx = await tokenFacet.setURIOfName(metadataURI, nfType)
  const receipt = await tx.wait()
  const event = receipt.events[0]
  // console.log(receipt)
  const { value:uri, id:nftID } = event.args
  // assert.equal(uri, nftURI)
  return nftID
}

async function uploadMetadata(nfType){
    const metadataJSON = await fs.readFile(path.join(__dirname,`./metadata/${nfType}.json`), 'utf-8');
    // console.log(metadataJSON)
    let metadata = {}
    if(typeof metadataJSON !== 'undefined'){
      metadata = JSON.parse(metadataJSON)
    }
    const image = await fs.readFile(path.join(__dirname,`./metadata/images/${nfType}.png`));
    
    // Or to specify a gateway when running from NodeJS you might use

    console.log('uploading image')
    const imageURI = await arweaveUpload(image, 'image/png')

    metadata.image = imageURI

    console.log('uploading metadata')
    const metadataURI = await arweaveUpload(JSON.stringify(metadata), 'application/json')

    // let key = await arweave.wallets.generate();
    // Plain text
    // return `ar://${transaction.id}`
    return metadataURI
}

async function arweaveUploadFile(fileName, contentType){
  const data = await fs.readFile(path.join(__dirname,`./${fileName}`));
  await arweaveUpload(data, contentType)
}

async function arweaveUpload(data, contentType){

  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  })


  let keyJSON = await fs.readFile(path.join(__dirname, `../../keys/arweave-key-yR1-xOZST_-iN5C-GM68V9d0HHpVSwUru0FOp5zBp2A.json`))
  let key = JSON.parse(keyJSON)


  let transaction = await arweave.createTransaction({
      data: data
  }, key)

  // // Buffer
  // let transactionB = await arweave.createTransaction({
  //     data: Buffer.from('Some data', 'utf8')
  // }, key);

  transaction.addTag('Content-Type', contentType)

  await arweave.transactions.sign(transaction, key)

  let uploader = await arweave.transactions.getUploader(transaction)

  while (!uploader.isComplete) {
      await uploader.uploadChunk()
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`)
  }

  // console.log(transaction)
  console.log(`https://arweave.net/${transaction.id}`)
  return `https://arweave.net/${transaction.id}`
}


task(
  "nftCreate",
  "create a NFT")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    signers = await ethers.getSigners();
    console.log(signers)
    console.log(taskArguments)
    console.log("creating NFTs");
    console.log('')

    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    for(const nftName of nftNames){
      console.log(`going to create ${nftName} token`)
      const createdNFTbaseType = await createNFT(nftNames)
      console.log(createdNFTbaseType)
    }
  }
);

task(
  "nftMint",
  "mint a NFT")
  .addParam("names", "NFT names")
  .addParam("receivers", "NFT receivers")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let nftReceivers = []

    if(taskArguments.receivers.indexOf(',') != -1){
      nftReceivers = taskArguments.receivers.split(',')
    }
    else{
      nftReceivers.push(taskArguments.receivers)
    }
    let nftIds = []
    for(const nftName of nftNames){
      console.log(`going to mint "${nftName}" token for: ${nftReceivers}`)
      const nftId = await mintNFTs(nftName, nftReceivers)
      nftIds.push(nftId)
    }
    console.log(`minted NFT ids ${nftIds}`)
  }
);

task(
  "nftUris",
  "set NFT URI")
  .addParam("names", "NFT names")
  .addParam("uris", "NFT URIs")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let nftURIs = []

    if(taskArguments.uris.indexOf(',') != -1){
      nftURIs = taskArguments.uris.split(',')
    }
    else{
      nftURIs.push(taskArguments.uris)
    }

    if(nftNames.length === nftURIs.length){
      let id = 0;
      for(const nftName of nftNames){
        console.log(`going to set "${nftName}" metadata to: ${nftURIs[id]}`)
        const tx = await setURIOfName(nftName, nftURIs[id])
        const receipt = await tx.wait()
        const event = receipt.events[0]
        const { value:uri, id:nftID } = event.args
        assert.equal(uri, nftURI)
        id++;
      }
      console.log(`updated NFT URIs ${nftIds}`)
    }
    else{
      console.log('--names and --uris argument count must match')
    }
  }
);

task(
  "nftUpdateMetadata",
  "update NFT metadata")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let id = 0;
    let nftIds = []
    for(const nftName of nftNames){
      console.log(`going to set "${nftName}" metadata`)
      const metadataURI = await uploadMetadata(nftName)
      // const metadataURI = 'https://example.com'
      const nftID = await setURIOfName(metadataURI, nftName)
      nftIds.push(nftID)
    }
    console.log(`updated NFT URIs ${nftNames} ${nftIds}`)



  }
);

task(
  "arweaveUpload",
  "upload files to Arweave")
  .addParam("filenames", "file names")
  .addParam("mimes", "mime types")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let nftURIs = []

    if(taskArguments.uris.indexOf(',') != -1){
      nftURIs = taskArguments.uris.split(',')
    }
    else{
      nftURIs.push(taskArguments.uris)
    }
    for(const nftName of nftNames){
      for(const nftURI of nftURIs){
        console.log(`going to set "${nftName}" URI to: ${nftURI}`)
        const tx = await setURIOfName(nftName, nftURI)
        const receipt = await tx.wait()
        const event = receipt.events[0]
        const { value:uri, id:nftID } = createAuditorNFTEvent.args
        assert.equal(uri, nftURI)
      }
    }
    console.log(`updated NFT URIs ${nftIds}`)
  }
);


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

    let tags = []

    if(taskArguments.tags.indexOf(',') != -1){
      tags = taskArguments.tags.split(',')
    }
    else{
      tags.push(taskArguments.tags)
    }

    let symbols = []
    names
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
        nanoId: taskArguments.nanoId,
        taskType: taskArguments.taskType,
        title: taskArguments.title,
        description: taskArguments.description,
        tags : tags,
        symbols: symbols,
        amounts: amounts
      }
      tx = await taskCreateFacet.createTaskContract(signers[0].address, taskData,
      { gasLimit: 30000000 })
      const receipt = await tx.wait()
      const event = receipt.events[0]
      const { contractAdr, message, timestamp } = event.args
      console.log(`created new task contract ${contractAdr}`)
    }
    else{
      console.log('--symbols and --amounts argument count must match')
    }

  }
);

task(
  "devTaskParticipate",
  "participate in a dodao task")
  .addParam("taskContract", "task contract")
  .addParam("messageText", "message text")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const taskContract = await ethers.getContractAt('TaskContract', taskArguments.taskContract)
    tx = await taskContract.connect(signers[1]).taskParticipate(signers[1].address, taskArguments.messageText, 0)
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