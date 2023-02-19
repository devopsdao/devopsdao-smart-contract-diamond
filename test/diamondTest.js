/* global describe it before ethers */
const { ethers } = require("hardhat");
// const crypto = require('crypto');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const path = require('node:path');
const fs = require('fs');


const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert } = require('chai')

describe('DiamondTest', async function () {
  let diamondAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let tx
  let receipt
  let result
  let addresses = []

  before(async function () {
    diamondAddress = await deployDiamond()
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    taskCreateFacet = await ethers.getContractAt('TaskCreateFacet', diamondAddress)
    taskDataFacet = await ethers.getContractAt('TaskDataFacet', diamondAddress)
    tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
    tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)
    axelarFacet = await ethers.getContractAt('AxelarFacet', diamondAddress)
    hyperlaneFacet = await ethers.getContractAt('HyperlaneFacet', diamondAddress)
    layerzeroFacet = await ethers.getContractAt('LayerzeroFacet', diamondAddress)
    wormholeFacet = await ethers.getContractAt('WormholeFacet', diamondAddress)

    signers = await ethers.getSigners();
  })

  it('should have ten facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
      // console.log(address);
    }

    assert.equal(addresses.length, 11)
  })

  // it('should test NFTFacet', async () => {
  //   const NFTFacet = await ethers.getContractFactory('NFTFacet')
  //   const NFTFacetDepl = await NFTFacet.deploy();
  //   const nftContract = await NFTFacetDepl.mintAuditorNFT(signers[2].address, 5);
  //   const nftContract2 = await NFTFacetDepl.mintAuditorNFT(signers[0].address, 1);
  //   const nftContract3 = await NFTFacetDepl.mintAuditorNFT(signers[0].address, 1);

  //   const balance = await NFTFacetDepl.balanceOf(signers[2].address, 5);
  //   const balance2 = await NFTFacetDepl.balanceOf(signers[0].address, 1);
  //   console.log(balance)
  //   console.log(balance2)
  // })

  it('remove all functions and facets except \'diamondCut\' and \'facets\'', async () => {
    let selectors = []
    let facets = await diamondLoupeFacet.facets()
    // console.log(facets)
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors)
    }
    selectors = removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)'])
    // console.log(selectors)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    facets = await diamondLoupeFacet.facets()
    // console.log('removed facets')
    // console.log(facets)
    assert.equal(facets.length, 2)
    assert.equal(facets[0][0], addresses[0])
    assert.sameMembers(facets[0][1], ['0x1f931c1c'])
    assert.equal(facets[1][0], addresses[1])
    assert.sameMembers(facets[1][1], ['0x7a0ed627'])
  })

  it('add most functions and facets', async () => {

    // const LibNames = ['LibAppStorage', 'LibUtils'];
    // let libAddresses = {};
  
    // for (const LibName of LibNames) {
    //   const Lib = await ethers.getContractFactory(LibName);
    //   const lib = await Lib.deploy();
    //   await lib.deployed();
    //   libAddresses[LibName] = lib.address;
    //   console.log(`${LibName} deployed:`, lib.address)
    // }

    
    // const taskCreateFacet = await ethers.getContractFactory('taskCreateFacet', {libraries: {
    //   'LibAppStorage': libAddresses.LibAppStorage,
    //   'LibUtils': libAddresses.LibUtils,
    // }})

    // const taskCreateFacet = await taskCreateFacet.deploy();
    // console.log(`taskCreateFacet deployed:`, taskCreateFacet.address)
    // addresses.push(taskCreateFacet.address)

    // Any number of functions from any number of facets can be added/replaced/removed in a
    // single transaction
    const cut = [
      {
        facetAddress: addresses[3],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(taskCreateFacet)
      },
      {
        facetAddress: addresses[4],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(taskDataFacet)
      },
      {
        facetAddress: addresses[5],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(tokenFacet)
      },
      {
        facetAddress: addresses[6],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(tokenDataFacet)
      },
      {
        facetAddress: addresses[7],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(axelarFacet)
      },
      {
        facetAddress: addresses[8],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(hyperlaneFacet)
      },
      {
        facetAddress: addresses[9],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(layerzeroFacet)
      },
      {
        facetAddress: addresses[10],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(wormholeFacet)
      },
    ]
    tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    // console.log(addr)
    const facets = await diamondLoupeFacet.facets()
    // console.log(facets)
    // console.log(addresses)
    // addresses = []
    // for (const address of await diamondLoupeFacet.facetAddresses()) {
    //   addresses.push(address)
    //   // console.log(address);
    // }
    // const facetAddresses = await diamondLoupeFacet.facetAddresses()
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(taskCreateFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[5], facets)][1], getSelectors(tokenFacet))
  })




  async function testAuditDecision(favour){
    signers = await ethers.getSigners();

    // const taskCreateFacet = await ethers.getContractAt('taskCreateFacet', diamondAddress)
    const taskType = 'private';
    const nanoId = 'test';
    const title = 'test job';
    const description = 'test desc';
    const symbol = 'ETH';

    const taskData = {
      nanoId: 'test',
      taskType: 'private',
      title: 'test job',
      description: 'test desc',
      tags : ['ETH'],
      symbols: ['ETH'],
      amounts: [1]
    }

    //debug abi call data
    // const dir = path.resolve(
    //   __dirname,
    //   "../artifacts/contracts/facets/TaskCreateFacet.sol/TaskCreateFacet.json"
    // )
    // const file = fs.readFileSync(dir, "utf8")
    // const json = JSON.parse(file)
    // const abi = json.abi
    // console.log(`abi`, abi)
    // iface = new ethers.utils.Interface(abi);
    // const encodedCall = iface.encodeFunctionData("createTaskContract", [signers[0].address, taskData])
    // // const encodedCall = taskCreateFacet.encodeFunctionData(signers[0].address, taskData,
    // //   { gasLimit: 30000000 });
    // console.log(encodedCall)

    createTaskContract = await taskCreateFacet.createTaskContract(signers[0].address, taskData,
    { gasLimit: 30000000 })


    //test event listener
    // await tokenFacet.on("URI", (URI, type, event) => {
    //   console.log('received event')
    //   console.log(URI, type);
    // });

    const createAuditorNFT = await tokenFacet.connect(signers[0]).create('https://example.com/{id}', 'auditor', true)
    const createAuditorNFTReceipt = await createAuditorNFT.wait()

    getTaskContracts = await taskDataFacet.getTaskContracts()
    // console.log('taskContracts:');
    // console.log(getTaskContracts)

    const createAuditorNFTEvent = createAuditorNFTReceipt.events[1]
    const { value:createdAuditorNFTuri, id:createdAuditorNftBaseType } = createAuditorNFTEvent.args
    assert.equal(createdAuditorNFTuri, "https://example.com/{id}")


    const auditorNFTURI = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType)
    assert.equal(auditorNFTURI, 'https://example.com/{id}')

    const auditorNFTURIOfBatch = await tokenDataFacet.connect(signers[2]).uriOfBatch([createdAuditorNftBaseType])
    assert.deepEqual(auditorNFTURIOfBatch, ['https://example.com/{id}'])

    const auditorNFTURIOfBatchName = await tokenDataFacet.connect(signers[2]).uriOfBatchName(['auditor'])
    assert.deepEqual(auditorNFTURIOfBatchName, ['https://example.com/{id}'])


    const auditorSetNFTURI = await tokenFacet.connect(signers[0]).setURI('https://example2.com/{id}', createdAuditorNftBaseType)
    const auditorNFTURI2 = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType)
    assert.equal(auditorNFTURI2, 'https://example2.com/{id}')

    const auditorSetNFTURIofName = await tokenFacet.connect(signers[0]).setURIOfName('https://example3.com/{id}', 'auditor')
    const auditorNFTURI3 = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType)
    assert.equal(auditorNFTURI3, 'https://example3.com/{id}')

    const auditorNFTTokenBaseType = await tokenDataFacet.connect(signers[2]).getTokenBaseType('auditor')
    assert.deepEqual(auditorNFTTokenBaseType, createdAuditorNftBaseType)

    //openzeppelin test helpers, not compatible with ethers.js
    // await expectEvent(createAuditorNFTReceipt, 'URI', {
    //   value: this.value,
    // });

    const mintAuditorNFT = await tokenFacet.connect(signers[0]).mintNonFungible(createdAuditorNftBaseType, [signers[2].address])
    const mintAuditorNFTReceipt = await mintAuditorNFT.wait()

    const mintAuditorNFTEvent = mintAuditorNFTReceipt.events[0];
    const { value:mintedAuditorNFTamount, id:mintedAuditorNFTid } = mintAuditorNFTEvent.args;
    assert.equal(mintedAuditorNFTamount, 1)

    const mintedAuditorNFTURI = await tokenDataFacet.connect(signers[2]).uri(mintedAuditorNFTid)
    assert.equal(mintedAuditorNFTURI, auditorNFTURI3)

    const auditorNFTExists = await tokenDataFacet.connect(signers[2]).exists(mintedAuditorNFTid)
    assert.equal(auditorNFTExists, true)

    const auditorNFTExistsNfType = await tokenDataFacet.connect(signers[2]).existsNfType(mintedAuditorNFTid)
    assert.equal(auditorNFTExistsNfType, true)

    const auditorNFTExistsName = await tokenDataFacet.connect(signers[2]).existsName('auditor')
    assert.equal(auditorNFTExistsName, true)

    const auditorNFTTotalSupply = await tokenDataFacet.connect(signers[2]).totalSupply(mintedAuditorNFTid)
    assert.equal(auditorNFTTotalSupply, 1)

    const auditorNFTTotalSupplyNfType = await tokenDataFacet.connect(signers[2]).totalSupplyOfNfType(mintedAuditorNFTid)
    assert.equal(auditorNFTTotalSupplyNfType, 1)

    const auditorNFTTotalSupplyName = await tokenDataFacet.connect(signers[2]).totalSupplyOfName('auditor')
    assert.equal(auditorNFTTotalSupplyName, 1)

    const auditorNFTTotalSupplyOfBatch = await tokenDataFacet.connect(signers[2]).totalSupplyOfBatch([mintedAuditorNFTid])
    assert.deepEqual(auditorNFTTotalSupplyOfBatch, [ethers.BigNumber.from(1)])

    const auditorNFTTotalSupplyOfBatchNfType = await tokenDataFacet.connect(signers[2]).totalSupplyOfBatchNfType([mintedAuditorNFTid])
    assert.deepEqual(auditorNFTTotalSupplyOfBatchNfType, [ethers.BigNumber.from(1)])

    const auditorNFTTotalSupplyOfBatchName = await tokenDataFacet.connect(signers[2]).totalSupplyOfBatchName(['auditor'])
    assert.deepEqual(auditorNFTTotalSupplyOfBatchName, [ethers.BigNumber.from(1)])

    const auditorNFTBalanceOf = await tokenFacet.connect(signers[2]).balanceOf(signers[2].address, mintedAuditorNFTid)
    assert.equal(auditorNFTBalanceOf, 1)

    const auditorNFTBalanceOfNfType = await tokenDataFacet.connect(signers[2]).balanceOfNfType(signers[2].address, mintedAuditorNFTid)
    assert.equal(auditorNFTBalanceOfNfType, 1)

    const auditorNFTBalanceOfName = await tokenDataFacet.connect(signers[2]).balanceOfName(signers[2].address, 'auditor')
    assert.equal(auditorNFTBalanceOfName, 1)

    const auditorNFTBalanceOfBatch = await tokenFacet.connect(signers[2]).balanceOfBatch([signers[2].address], [mintedAuditorNFTid])
    assert.deepEqual(auditorNFTBalanceOfBatch, [ethers.BigNumber.from(1)])

    const auditorNFTBalanceOfBatchNfType = await tokenDataFacet.connect(signers[2]).balanceOfBatchNfType([signers[2].address], [mintedAuditorNFTid])
    assert.deepEqual(auditorNFTBalanceOfBatchNfType, [ethers.BigNumber.from(1)])

    const auditorNFTBalanceOfBatchName = await tokenDataFacet.connect(signers[2]).balanceOfBatchName([signers[2].address], ['auditor'])
    assert.deepEqual(auditorNFTBalanceOfBatchName, [ethers.BigNumber.from(1)])

    // const auditorNftBaseType = await tokenFacet.connect(signers[2]).getTokenBaseType(mintedAuditorNFTid)
    // assert.equal(auditorNftBaseType, createdAuditorNftBaseType)

    const auditorNftName = await tokenDataFacet.connect(signers[2]).getTokenName(mintedAuditorNFTid)
    assert.equal(auditorNftName, 'auditor')

    const ownedTokenIds = await tokenDataFacet.connect(signers[2]).getTokenIds(signers[2].address)
    assert.deepEqual(ownedTokenIds, [mintedAuditorNFTid])
    
    const ownedTokenNames = await tokenDataFacet.connect(signers[2]).getTokenNames(signers[2].address)
    assert.deepEqual(ownedTokenNames, ['auditor'])

    const getNewTaskContractsBeforeBlacklist = await taskDataFacet.connect(signers[0]).getTaskContractsByState("new")
    // expect(getNewTaskContractsBeforeBlacklist).to.have.members(getTaskContracts);
    assert.deepEqual(getNewTaskContractsBeforeBlacklist, getTaskContracts)
    
    const addContractToBlacklist = await taskDataFacet.connect(signers[2]).addTaskToBlacklist(getTaskContracts[getTaskContracts.length - 1])

    const getNewTaskContractsAfterBlacklist = await taskDataFacet.connect(signers[0]).getTaskContractsByState("new")
    assert.deepEqual(getNewTaskContractsAfterBlacklist, [])
    
    const removeContractFromBlacklist = await taskDataFacet.connect(signers[2]).removeTaskFromBlacklist(getTaskContracts[getTaskContracts.length - 1])

    const getNewTaskContractsAfterBlacklistRemoval = await taskDataFacet.connect(signers[0]).getTaskContractsByState("new")
    assert.deepEqual(getNewTaskContractsAfterBlacklistRemoval, getTaskContracts)

    //check if account0 has customer contracts, must be equal to all contracts(1)
    const getTaskContractsCustomer = await taskDataFacet.connect(signers[0]).getTaskContractsCustomer(signers[0].address)
    assert.deepEqual(getTaskContractsCustomer, getTaskContracts)

    //check if account1 has customer contracts, must be empty
    const getTaskContractsCustomer1 = await taskDataFacet.connect(signers[0]).getTaskContractsCustomer(signers[1].address)
    assert.deepEqual(getTaskContractsCustomer1, [])

    //check if account0 has performer contracts, must be empty
    const getTaskContractsPerformer = await taskDataFacet.connect(signers[0]).getTaskContractsPerformer(signers[0].address)
    assert.deepEqual(getTaskContractsPerformer, [])

    const taskContract = await ethers.getContractAt('TaskContract', getTaskContracts[getTaskContracts.length - 1])
    getTaskInfoNew = await taskContract.getTaskInfo()
    // console.log(getTaskInfoNew)
    // createTime;

    assert.isAbove(getTaskInfoNew.createTime, 1666113343, 'create time is more than 0');
    assert.equal(getTaskInfoNew.contractParent, taskCreateFacet.address)

    const taskStateNew = 'new'
    assert.equal(getTaskInfoNew.nanoId, nanoId)
    assert.equal(getTaskInfoNew.title, title)
    assert.equal(getTaskInfoNew.description, description)
    // assert.equal(getTaskInfoNew.symbols, taskData.symbols)
    // assert.equal(getTaskInfoNew.amounts, taskData.amounts)
    assert.equal(getTaskInfoNew.taskState, taskStateNew)
    assert.equal(getTaskInfoNew.contractOwner, signers[0].address)
    const messageTextParticipate = 'I am the best to make it'
    const messageReplyTo = 0

    //first participant
    taskParticipate = await taskContract.connect(signers[1]).taskParticipate(signers[1].address, messageTextParticipate, messageReplyTo)
    getTaskInfoParticipate = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoParticipate.participants[0], signers[1].address)
    assert.equal(getTaskInfoParticipate.messages[0].id, 1)
    assert.equal(getTaskInfoParticipate.messages[0].text, messageTextParticipate)
    assert.isAbove(getTaskInfoParticipate.messages[0].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoParticipate.messages[0].sender, signers[1].address)
    assert.equal(getTaskInfoParticipate.messages[0].taskState, taskStateNew)
    assert.equal(getTaskInfoParticipate.messages[0].replyTo, messageReplyTo)

    //second participant
    taskParticipate = await taskContract.connect(signers[3]).taskParticipate(signers[3].address, messageTextParticipate, messageReplyTo)
    getTaskInfoParticipate = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoParticipate.participants[1], signers[3].address)
    assert.equal(getTaskInfoParticipate.messages[1].id, 2)
    assert.equal(getTaskInfoParticipate.messages[1].text, messageTextParticipate)
    assert.isAbove(getTaskInfoParticipate.messages[1].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoParticipate.messages[1].sender, signers[3].address)
    assert.equal(getTaskInfoParticipate.messages[1].taskState, taskStateNew)
    assert.equal(getTaskInfoParticipate.messages[1].replyTo, messageReplyTo)


    const taskStateAgreed = 'agreed'
    const messageTextAgreed = 'selected you for the first task'
    taskStateChangeAgreed = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, getTaskInfoParticipate.participants[0], taskStateAgreed, messageTextAgreed, messageReplyTo, 0);
    getTaskInfoAgreed = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoAgreed.taskState, taskStateAgreed)
    assert.equal(getTaskInfoAgreed.participant, signers[1].address)
    assert.equal(getTaskInfoAgreed.messages[2].id, 3)
    assert.equal(getTaskInfoAgreed.messages[2].text, messageTextAgreed)
    assert.isAbove(getTaskInfoAgreed.messages[2].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAgreed.messages[2].sender, signers[0].address)
    assert.equal(getTaskInfoAgreed.messages[2].taskState, taskStateAgreed)
    assert.equal(getTaskInfoAgreed.messages[2].replyTo, messageReplyTo)

    const taskStateProgress = 'progress'
    const messageTextProgress = 'starting job!'
    taskStateChangeProgress = await taskContract.connect(signers[1]).taskStateChange(signers[1].address, '0x0000000000000000000000000000000000000000', taskStateProgress, messageTextProgress, messageReplyTo, 0);
    getTaskInfoProgress = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoProgress.taskState, taskStateProgress)
    assert.equal(getTaskInfoProgress.messages[3].id, 4)
    assert.equal(getTaskInfoProgress.messages[3].text, messageTextProgress)
    assert.isAbove(getTaskInfoProgress.messages[3].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoProgress.messages[3].sender, signers[1].address)
    assert.equal(getTaskInfoProgress.messages[3].taskState, taskStateProgress)
    assert.equal(getTaskInfoProgress.messages[3].replyTo, messageReplyTo)

    const taskStateReview = 'review'
    const messageTextReview = 'please kindly review!'
    taskStateChangeReview = await taskContract.connect(signers[1]).taskStateChange(signers[1].address, '0x0000000000000000000000000000000000000000', taskStateReview, messageTextReview, messageReplyTo, 0);
    getTaskInfoReview = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoReview.taskState, taskStateReview)
    assert.equal(getTaskInfoReview.messages[4].id, 5)
    assert.equal(getTaskInfoReview.messages[4].text, messageTextReview)
    assert.isAbove(getTaskInfoReview.messages[4].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoReview.messages[4].sender, signers[1].address)
    assert.equal(getTaskInfoReview.messages[4].taskState, taskStateReview)
    assert.equal(getTaskInfoReview.messages[4].replyTo, messageReplyTo)

    const taskStateAudit = 'audit'
    const messageTextAudit = 'work is not done :('
    const taskAuditStateRequested = 'requested';
    taskStateChangeAudit = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, '0x0000000000000000000000000000000000000000', taskStateAudit, messageTextAudit, messageReplyTo, 0);
    getTaskInfoAudit = await taskContract.getTaskInfo()
    // console.log(getTaskInfoAudit)
    assert.equal(getTaskInfoAudit.taskState, taskStateAudit)
    assert.equal(getTaskInfoAudit.auditState, taskAuditStateRequested)
    assert.equal(getTaskInfoAudit.auditInitiator, signers[0].address)
    assert.equal(getTaskInfoAudit.messages[5].id, 6)
    assert.equal(getTaskInfoAudit.messages[5].text, messageTextAudit)
    assert.isAbove(getTaskInfoAudit.messages[5].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAudit.messages[5].sender, signers[0].address)
    assert.equal(getTaskInfoAudit.messages[5].taskState, taskStateAudit)
    assert.equal(getTaskInfoAudit.messages[5].replyTo, messageReplyTo)
    
    

    const messageTextAuditParticipate = 'I am honorable auditor'
    taskAuditParticipate = await taskContract.connect(signers[2]).taskAuditParticipate(signers[2].address, messageTextAuditParticipate, messageReplyTo)
    getTaskInfoAuditParticipate = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoAuditParticipate.auditors[0], signers[2].address)
    assert.equal(getTaskInfoAuditParticipate.messages[6].id, 7)
    assert.equal(getTaskInfoAuditParticipate.messages[6].text, messageTextAuditParticipate)
    assert.isAbove(getTaskInfoAuditParticipate.messages[6].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAuditParticipate.messages[6].sender, signers[2].address)
    assert.equal(getTaskInfoAuditParticipate.messages[6].taskState, taskStateAudit)
    assert.equal(getTaskInfoAuditParticipate.messages[6].replyTo, messageReplyTo)

    const messageTextSelectAuditor = 'selected a proper auditor'
    const taskAuditStatePerforming = 'performing'
    taskStateChangeSelectAuditor = await taskContract.connect(signers[0]).taskStateChange(signers[0].address, getTaskInfoAuditParticipate.auditors[0], taskStateAudit, messageTextSelectAuditor, messageReplyTo, 0);
    getTaskInfoSelectAuditor = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoSelectAuditor.auditState, taskAuditStatePerforming)
    assert.equal(getTaskInfoSelectAuditor.auditor, signers[2].address)
    assert.equal(getTaskInfoSelectAuditor.messages[7].id, 8)
    assert.equal(getTaskInfoSelectAuditor.messages[7].text, messageTextSelectAuditor)
    assert.isAbove(getTaskInfoSelectAuditor.messages[7].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoSelectAuditor.messages[7].sender, signers[0].address)
    assert.equal(getTaskInfoSelectAuditor.messages[7].taskState, taskStateAudit)
    assert.equal(getTaskInfoSelectAuditor.messages[7].replyTo, messageReplyTo)


    const messageTextAuditDecision = `${favour} is right`
    const taskAuditStateFinished = 'finished'
    let taskStateAuditDecision;
    let rating
    if(favour == 'customer'){
      taskStateAuditDecision = 'canceled'
      rating = 1
    }
    else if(favour == 'performer'){
      taskStateAuditDecision = 'completed'
      rating = 5
    }
    taskAuditDecision = await taskContract.connect(signers[2]).taskAuditDecision(signers[2].address, favour, messageTextAuditDecision, 0, rating)
    getTaskInfoDecision = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoDecision.taskState, taskStateAuditDecision)
    assert.equal(getTaskInfoDecision.auditState, taskAuditStateFinished)
    assert.equal(getTaskInfoDecision.rating, rating)
    assert.equal(getTaskInfoDecision.messages[8].id, 9)
    assert.equal(getTaskInfoDecision.messages[8].text, messageTextAuditDecision)
    assert.isAbove(getTaskInfoDecision.messages[8].timestamp, 1666113343, 'timestamp is more than 0')
    assert.equal(getTaskInfoDecision.messages[8].sender, signers[2].address)
    assert.equal(getTaskInfoDecision.messages[8].taskState, taskStateAuditDecision)
    assert.equal(getTaskInfoDecision.messages[8].replyTo, messageReplyTo)

    assert.equal(getTaskInfoDecision.messages.length, 9)
    // console.log(getTaskInfoDecision)
  }

  it('should test createTaskContract, getTaskContracts, taskParticipate, getTaskInfo, taskStateChange(all except canceled), taskAuditParticipate, taskAuditDecision(in customer favour) ', async () => {
    await testAuditDecision('customer')
  })

  // it('should test createTaskContract, getTaskContracts, taskParticipate, getTaskInfo, taskStateChange(all except canceled), taskAuditParticipate, taskAuditDecision(in performer favour) ', async () => {
  //   await testAuditDecision('performer')
  // })
  
  // it('should test NFTFacet', async () => {
  //   // const mint = await tokenFacet.mint();
  //   const balance = await tokenFacet.balanceOf(signers[2].address, 1);
  //   console.log(balance)
  // })

})
