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


let nonces = {};

async function getNonce(address, incremental) {
  if(typeof nonces[address] == 'undefined'){
    nonces[address] = await ethers.provider.getTransactionCount(address);
  }
  let currentNonce = nonces[address];
  if(incremental == true){
    nonces[address] = currentNonce + 1;
  }
  else{
    nonces[address] = await ethers.provider.getTransactionCount(address);
  }
  console.log(`current nonce: ${currentNonce}`)
  return currentNonce;
}


async function createNFT(nfType){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  console.log(`using Diamond: ${diamondAddress}`)

  const metadataJSON = await fs.readFile(path.join(__dirname,`./metadata/${nfType}.json`), 'utf-8');
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)

  // const metadataURI = await uploadMetadata(nfType)
  const metadataURI = 'https://example.com'
  console.log(metadataURI)

  const createNFT = await tokenFacet.create(metadataURI, nfType.toString(), true)
  const createNFTReceipt = await createNFT.wait()

  const createNFTEvent = createNFTReceipt.events[1]
  const { value:createdNFTuri, id:createdNFTbaseType } = createNFTEvent.args

  return createdNFTbaseType
}

async function mintNFTs(account, nfType, receivers){
    signers = await ethers.getSigners();
    const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
    console.log(`using Diamond: ${diamondAddress} and ${signers[account].address} account`)

    // const metadataJSON = await fs.readFile(path.join(__dirname,`./metadata/${nfType}.json`), 'utf-8');
    let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
    let tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)

    const baseType = await tokenDataFacet.getTokenBaseType(nfType)

    // console.log(receivers)

    //gasPrice: ethers.utils.parseUnits('10', 'gwei'), gasLimit: 5000000
    // const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, receivers, {nonce: await getNonce(signers[0].address, true), type: 2, maxFeePerGas: ethers.utils.parseUnits('10', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('10', 'gwei') })
    let feeData = await ethers.provider.getFeeData();
    // console.log(feeData)
    let mintNFTReceipt;
    let gasMultiplier = 1;
    let txSuccess = false;
    while(!txSuccess){
      try{
        //your logic
        console.log(`sending tx`)
        const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas+gasMultiplier, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas+gasMultiplier  })
        mintNFTReceipt = await mintNFT.wait()
        txSuccess = true;
      }catch(error){
        console.log(error);
        gasMultiplier = gasMultiplier+1;
        console.log(`retrying with ${gasMultiplier} gasMultiplier`);
        continue;
      }
    }

    // try {
    //   const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas  })
    //   mintNFTReceipt = await mintNFT.wait()
    // } catch (error) {
    //   console.log(error);
    //   if(error.message === 'already known'){
    //     console.log('resubmitting with a higher gas')
    //     gasMultiplier = gasMultiplier+1;
    //     try {
    //       const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas*gasMultiplier, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*gasMultiplier  })
    //       mintNFTReceipt = await mintNFT.wait()
    //     } catch (error) {
    //       gasMultiplier = gasMultiplier+1;
    //       try {
    //         const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas*gasMultiplier, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*gasMultiplier  })
    //         mintNFTReceipt = await mintNFT.wait()
    //       } catch (error) {
    //         gasMultiplier = gasMultiplier+1;
    //         const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas*gasMultiplier, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*gasMultiplier  })
    //         mintNFTReceipt = await mintNFT.wait()
    //       }
    //     }
    //   }
    //   else if(error.code === 'REPLACEMENT_UNDERPRICED'){
    //     console.log('resubmitting with a higher gas')
    //     gasMultiplier = gasMultiplier+2;
    //     const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, [signers[account].address], {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas*gasMultiplier, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*gasMultiplier  })
    //     mintNFTReceipt = await mintNFT.wait()
    //   }
    //   //error.name === 'ProviderError'
    //   // if(error.message === 'already known'){
    //   //   console.log('resubmitting with a higher gas')
    //   //   const mintNFT = await tokenFacet.connect(signers[account]).mintNonFungible(baseType, receivers, {nonce: await getNonce(signers[account].address, false), type: 2, maxFeePerGas: feeData.maxFeePerGas*5, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas*5  })
    //   //   mintNFTReceipt = await mintNFT.wait()
    //   // }
    //   // console.log(error);
    // }
    // console.log(mintNFTReceipt)

    if(typeof mintNFTReceipt !== 'undefined'){
      const ids = []
      for(const event of mintNFTReceipt.events){
        const mintNFTEvent = mintNFTReceipt.events[0]
        const { operator, from, to, id, value } = mintNFTEvent.args
        ids.push(id)
      }
  
      return ids
    }

    // return 
}

async function setURIOfName(metadataURI, nfType){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  console.log(`setting URI for ${nfType} to ${metadataURI}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const tx = await tokenFacet.setURIOfName(metadataURI, nfType)
  const receipt = await tx.wait()
  const event = receipt.events[0]
  // console.log(receipt)
  const { value:uri, id:nftID } = event.args
  // assert.equal(uri, nftURI)
  return nftID
}

async function safeBatchTransferFrom(from, to, nftIds, values, data){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const balance = await tokenFacet.safeBatchTransferFrom(from, to, nftIds, values, data)
  // console.log(balance);
  // assert.equal(uri, nftURI)
  return balance
}

async function getCreatedTokenNames(){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)
  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const names = await tokenDataFacet.getCreatedTokenNames()
  // console.log(balance);
  // assert.equal(uri, nftURI)
  return names
}

async function balanceOf(account, nftId){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const balance = await tokenFacet.connect(account).balanceOf(account, nftId)
  // console.log(balance);
  // assert.equal(uri, nftURI)
  return balance
}

async function balanceOfName(account, name){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  let tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)

  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const balance = await tokenDataFacet.connect(account).balanceOfName(account, name)
  // console.log(balance);
  // assert.equal(uri, nftURI)
  return balance
}

async function totalSupplyOfName(account, name){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  let tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)

  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const supply = await tokenDataFacet.connect(account).totalSupplyOfName(name)
  // console.log(balance);
  // assert.equal(uri, nftURI)
  return supply
}



async function balanceOfBatchName(accounts, names){
  const diamondAddress = contractAddresses.contracts[this.__hardhatContext.environment.network.config.chainId]['Diamond'];
  let tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
  let tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)

  // console.log(`getting balance of ${account} ${nftId}`)
  // const baseType = await tokenFacet.getTokenBaseType(nfType)
  const balance = await tokenDataFacet.connect(accounts[0]).balanceOfBatchName(accounts, names)
  console.log(balance);
  // assert.equal(uri, nftURI)
  return balance
}


function fromAscii(str, padding) {
  var hex = '0x';
  for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      var n = code.toString(16);
      hex += n.length < 2 ? '0' + n : n;
  }
  return hex + '0'.repeat(padding*2 - hex.length + 2);
};


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
  .addParam("accounts", "account ids")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    let accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }
    // signers = await ethers.getSigners();
    // console.log(signers)
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

    for(const account of accounts){
      for(const nftName of nftNames){
        console.log(`going to create ${nftName} token`)
        const createdNFTbaseType = await createNFT(nftNames)
        console.log(createdNFTbaseType)
      }
    }
  }
);

task(
  "nftMint",
  "mint a NFT")
  .addParam("accounts", "account ids")
  .addParam("names", "NFT names")
  // .addParam("receivers", "NFT receivers")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    let accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }

    let nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    // let nftReceivers = []

    // if(taskArguments.receivers.indexOf(',') != -1){
    //   nftReceivers = taskArguments.receivers.split(',')
    // }
    // else{
    //   nftReceivers.push(taskArguments.receivers)
    // }
    let nftIds = []
    for(const account of accounts){
      for(const nftName of nftNames){
        // console.log(`going to mint "${nftName}" from ${accounts} token for: ${nftReceivers}`)
        console.log(`going to mint "${nftName}" from ${accounts} token`)
        const nftId = await mintNFTs(account, nftName, {})
        nftIds.push(nftId)
        console.log(`minted`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
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
  "nftSafeBatchTransferFrom",
  "send nfts in batch")
  .addParam("from", "source address")
  .addParam("to", "destination address")
  .addParam("ids", "NFT ids")
  .addParam("values", "values")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const nftIds = []
    if(taskArguments.ids.indexOf(',') != -1){
      nftIds = taskArguments.ids.split(',')
    }
    else{
      nftIds.push(taskArguments.ids)
    }

    const values = []
    if(taskArguments.values.indexOf(',') != -1){
      values = taskArguments.values.split(',')
    }
    else{
      values.push(taskArguments.values)
    }

    const tx = await safeBatchTransferFrom(taskArguments.from, taskArguments.to, nftIds, values, fromAscii(''))

  }
);





task(
  "nftCreatedTokenNames",
  "get created token names")
  .setAction(
  async function (taskArguments, hre, runSuper) {
    console.log(`get created token names`)
    const names = await getCreatedTokenNames()
    console.log(names.length)
  }
);


task(
  "nftBalanceOf",
  "get NFT balance")
  .addParam("accounts", "NFT ids")
  .addParam("ids", "NFT ids")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }


    const nftIds = []
    if(taskArguments.ids.indexOf(',') != -1){
      nftIds = taskArguments.ids.split(',')
    }
    else{
      nftIds.push(taskArguments.ids)
    }

    let id = 0;
    for(const account of accounts){
      console.log(`get "${account}" balance for ${nftIds[id]}`)
      const balance = await balanceOf(account, nftIds[id])
      console.log(balance);
      id++;
    }
  }
);


task(
  "nftBalanceOfName",
  "get NFT balance")
  .addParam("accounts", "NFT ids")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }


    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let id = 0;
    for(const account of accounts){
      console.log(`get "${account}" balance for ${nftNames[id]}`)
      const balance = await balanceOfName(account, nftNames[id])
      console.log(balance);
      id++;
    }
  }
);

task(
  "nftTotalSupplyOfName",
  "get NFT total supply")
  .addParam("accounts", "NFT ids")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }


    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    let id = 0;
    for(const account of accounts){
      console.log(`get "${account}" balance for ${nftNames[id]}`)
      const balance = await totalSupplyOfName(account, nftNames[id])
      console.log(balance);
      id++;
    }
  }
);


task(
  "nftBalanceOfBatchName",
  "get NFT balance")
  .addParam("accounts", "NFT ids")
  .addParam("names", "NFT names")
  .setAction(
  async function (taskArguments, hre, runSuper) {

    const accounts = []
    if(taskArguments.accounts.indexOf(',') != -1){
      accounts = taskArguments.accounts.split(',')
    }
    else{
      accounts.push(taskArguments.accounts)
    }


    const nftNames = []
    if(taskArguments.names.indexOf(',') != -1){
      nftNames = taskArguments.names.split(',')
    }
    else{
      nftNames.push(taskArguments.names)
    }

    const balances = await balanceOfBatchName(accounts, nftNames)
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


// (async() => {
//     await main()
//   })()