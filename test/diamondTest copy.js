/* global describe it before ethers */
const { ethers } = require("hardhat");
// const crypto = require('crypto');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

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
  const addresses = []

  before(async function () {
    diamondAddress = await deployDiamond()
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    signers = await ethers.getSigners();
  })

  it('should have four facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
      // console.log(address);
    }

    assert.equal(addresses.length, 4)
  })

  it('should test NFTFacet', async () => {
    const NFTFacet = await ethers.getContractFactory('NFTFacet')
    const NFTFacetDepl = await NFTFacet.deploy();
    const nftContract = await NFTFacetDepl.mintAuditorNFT(5);
    const nftContract2 = await NFTFacetDepl.mintAuditorNFT(1);
    const nftContract3 = await NFTFacetDepl.mintAuditorNFT(1);

    const balance = await NFTFacetDepl.balanceOf(signers[2].address, 5);
    const balance2 = await NFTFacetDepl.balanceOf(signers[0].address, 1);
    console.log(balance)
    console.log(balance2)
  })

  it('remove all functions and facets accept \'diamondCut\' and \'facets\'', async () => {
    let selectors = []
    let facets = await diamondLoupeFacet.facets()
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors)
    }
    selectors = removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)'])
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    facets = await diamondLoupeFacet.facets()
    assert.equal(facets.length, 2)
    assert.equal(facets[0][0], addresses[0])
    assert.sameMembers(facets[0][1], ['0x1f931c1c'])
    assert.equal(facets[1][0], addresses[1])
    assert.sameMembers(facets[1][1], ['0x7a0ed627'])
  })

  it('add most functions and facets', async () => {

    const LibNames = ['LibAppStorage', 'LibUtils'];
    let libAddresses = {};
  
    for (const LibName of LibNames) {
      const Lib = await ethers.getContractFactory(LibName);
      const lib = await Lib.deploy();
      await lib.deployed();
      libAddresses[LibName] = lib.address;
      console.log(`${LibName} deployed:`, lib.address)
    }  

    
    const TasksFacet = await ethers.getContractFactory('TasksFacet', {libraries: {
      'LibAppStorage': libAddresses.LibAppStorage,
      'LibUtils': libAddresses.LibUtils,
    }})
    await TasksFacet.deploy();

    // Any number of functions from any number of facets can be added/replaced/removed in a
    // single transaction
    const cut = [
      {
        facetAddress: addresses[3],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(TasksFacet)
      }
    ]
    tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }

    const facets = await diamondLoupeFacet.facets()
    // const facetAddresses = await diamondLoupeFacet.facetAddresses()
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(TasksFacet))
  })




  async function testAuditDecision(favour){
    signers = await ethers.getSigners();

    const tasksFacet = await ethers.getContractAt('TasksFacet', diamondAddress)
    const taskType = 'private';
    const nanoId = 'test';
    const title = 'test job';
    const description = 'test desc';
    const symbol = 'ETH';
    createTaskContract = await tasksFacet.createTaskContract(nanoId, taskType, title, description, symbol, "1",
    { gasLimit: 30000000 })
    getTaskContracts = await tasksFacet.getTaskContracts()
    const taskContract = await ethers.getContractAt('TaskContract', getTaskContracts[getTaskContracts.length - 1])
    getTaskInfoNew = await taskContract.getTaskInfo()
    // createTime;

    assert.isAbove(getTaskInfoNew.createTime, 1666113343, 'create time is more than 0');
    assert.equal(getTaskInfoNew.contractParent, tasksFacet.address)

    const taskStateNew = 'new'
    assert.equal(getTaskInfoNew.nanoId, nanoId)
    assert.equal(getTaskInfoNew.title, title)
    assert.equal(getTaskInfoNew.description, description)
    assert.equal(getTaskInfoNew.symbol, symbol)
    assert.equal(getTaskInfoNew.taskState, taskStateNew)
    assert.equal(getTaskInfoNew.contractOwner, signers[0].address)
    const messageTextParticipate = 'work is not done :('
    const messageReplyTo = 0
    taskParticipate = await taskContract.connect(signers[1]).taskParticipate(messageTextParticipate, messageReplyTo)
    getTaskInfoParticipate = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoParticipate.participants[0], signers[1].address)
    assert.equal(getTaskInfoParticipate.messages[0].id, 1)
    assert.equal(getTaskInfoParticipate.messages[0].text, messageTextParticipate)
    assert.isAbove(getTaskInfoParticipate.messages[0].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoParticipate.messages[0].sender, signers[1].address)
    assert.equal(getTaskInfoParticipate.messages[0].taskState, taskStateNew)
    assert.equal(getTaskInfoParticipate.messages[0].replyTo, messageReplyTo)


    const taskStateAgreed = 'agreed'
    const messageTextAgreed = 'selected you for the first task'
    taskStateChangeAgreed = await taskContract.connect(signers[0]).taskStateChange(getTaskInfoParticipate.participants[0], taskStateAgreed, messageTextAgreed, messageReplyTo, 0);
    getTaskInfoAgreed = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoAgreed.taskState, taskStateAgreed)
    assert.equal(getTaskInfoAgreed.participant, signers[1].address)
    assert.equal(getTaskInfoAgreed.messages[1].id, 2)
    assert.equal(getTaskInfoAgreed.messages[1].text, messageTextAgreed)
    assert.isAbove(getTaskInfoAgreed.messages[1].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAgreed.messages[1].sender, signers[0].address)
    assert.equal(getTaskInfoAgreed.messages[1].taskState, taskStateAgreed)
    assert.equal(getTaskInfoAgreed.messages[1].replyTo, messageReplyTo)

    const taskStateProgress = 'progress'
    const messageTextProgress = 'starting job!'
    taskStateChangeProgress = await taskContract.connect(signers[1]).taskStateChange('0x0000000000000000000000000000000000000000', taskStateProgress, messageTextProgress, messageReplyTo, 0);
    getTaskInfoProgress = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoProgress.taskState, taskStateProgress)
    assert.equal(getTaskInfoProgress.messages[2].id, 3)
    assert.equal(getTaskInfoProgress.messages[2].text, messageTextProgress)
    assert.isAbove(getTaskInfoProgress.messages[2].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoProgress.messages[2].sender, signers[1].address)
    assert.equal(getTaskInfoProgress.messages[2].taskState, taskStateProgress)
    assert.equal(getTaskInfoProgress.messages[2].replyTo, messageReplyTo)

    const taskStateReview = 'review'
    const messageTextReview = 'please kindly review!'
    taskStateChangeReview = await taskContract.connect(signers[1]).taskStateChange('0x0000000000000000000000000000000000000000', taskStateReview, messageTextReview, messageReplyTo, 0);
    getTaskInfoReview = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoReview.taskState, taskStateReview)
    assert.equal(getTaskInfoReview.messages[3].id, 4)
    assert.equal(getTaskInfoReview.messages[3].text, messageTextReview)
    assert.isAbove(getTaskInfoReview.messages[3].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoReview.messages[3].sender, signers[1].address)
    assert.equal(getTaskInfoReview.messages[3].taskState, taskStateReview)
    assert.equal(getTaskInfoReview.messages[3].replyTo, messageReplyTo)

    const taskStateAudit = 'audit'
    const messageTextAudit = 'work is not done :('
    const taskAuditStateRequested = 'requested';
    taskStateChangeAudit = await taskContract.connect(signers[0]).taskStateChange('0x0000000000000000000000000000000000000000', taskStateAudit, messageTextAudit, messageReplyTo, 0);
    getTaskInfoAudit = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoAudit.taskState, taskStateAudit)
    assert.equal(getTaskInfoAudit.auditState, taskAuditStateRequested)
    assert.equal(getTaskInfoAudit.auditInitiator, signers[0].address)
    assert.equal(getTaskInfoAudit.messages[4].id, 5)
    assert.equal(getTaskInfoAudit.messages[4].text, messageTextAudit)
    assert.isAbove(getTaskInfoAudit.messages[4].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAudit.messages[4].sender, signers[0].address)
    assert.equal(getTaskInfoAudit.messages[4].taskState, taskStateAudit)
    assert.equal(getTaskInfoAudit.messages[4].replyTo, messageReplyTo)


    const messageTextAuditParticipate = 'I am honorable auditor'
    taskAuditParticipate = await taskContract.connect(signers[2]).taskAuditParticipate(messageTextAuditParticipate, messageReplyTo)
    getTaskInfoAuditParticipate = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoAuditParticipate.auditors[0], signers[2].address)
    assert.equal(getTaskInfoAuditParticipate.messages[5].id, 6)
    assert.equal(getTaskInfoAuditParticipate.messages[5].text, messageTextAuditParticipate)
    assert.isAbove(getTaskInfoAuditParticipate.messages[5].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoAuditParticipate.messages[5].sender, signers[2].address)
    assert.equal(getTaskInfoAuditParticipate.messages[5].taskState, taskStateAudit)
    assert.equal(getTaskInfoAuditParticipate.messages[5].replyTo, messageReplyTo)

    const messageTextSelectAuditor = 'selected a proper auditor'
    const taskAuditStatePerforming = 'performing';
    taskStateChangeSelectAuditor = await taskContract.connect(signers[0]).taskStateChange(getTaskInfoAuditParticipate.auditors[0], taskStateAudit, messageTextSelectAuditor, messageReplyTo, 0);
    getTaskInfoSelectAuditor = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoSelectAuditor.auditState, taskAuditStatePerforming)
    assert.equal(getTaskInfoSelectAuditor.auditor, signers[2].address)
    assert.equal(getTaskInfoSelectAuditor.messages[6].id, 7)
    assert.equal(getTaskInfoSelectAuditor.messages[6].text, messageTextSelectAuditor)
    assert.isAbove(getTaskInfoSelectAuditor.messages[6].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoSelectAuditor.messages[6].sender, signers[0].address)
    assert.equal(getTaskInfoSelectAuditor.messages[6].taskState, taskStateAudit)
    assert.equal(getTaskInfoSelectAuditor.messages[6].replyTo, messageReplyTo)


    const messageTextAuditDecision = `${favour} is right`
    const taskAuditStateFinished = 'finished';
    let taskStateAuditDecision;
    let rating;
    if(favour == 'customer'){
      taskStateAuditDecision = 'canceled'
      rating = 1;
    }
    else if(favour == 'performer'){
      taskStateAuditDecision = 'completed'
      rating = 5;
    }
    taskAuditDecision = await taskContract.connect(signers[2]).taskAuditDecision(favour, messageTextAuditDecision, 0, rating);
    getTaskInfoDecision = await taskContract.getTaskInfo()
    assert.equal(getTaskInfoDecision.taskState, taskStateAuditDecision)
    assert.equal(getTaskInfoDecision.auditState, taskAuditStateFinished)
    assert.equal(getTaskInfoDecision.rating, rating)
    assert.equal(getTaskInfoDecision.messages[7].id, 8)
    assert.equal(getTaskInfoDecision.messages[7].text, messageTextAuditDecision)
    assert.isAbove(getTaskInfoDecision.messages[7].timestamp, 1666113343, 'timestamp is more than 0');
    assert.equal(getTaskInfoDecision.messages[7].sender, signers[2].address)
    assert.equal(getTaskInfoDecision.messages[7].taskState, taskStateAuditDecision)
    assert.equal(getTaskInfoDecision.messages[7].replyTo, messageReplyTo)

    assert.equal(getTaskInfoDecision.messages.length, 8)
    // console.log(getTaskInfoDecision)
  }

  it('should test createTaskContract, getTaskContracts, taskParticipate, getTaskInfo, taskStateChange(all except canceled), taskAuditParticipate, taskAuditDecision(in customer favour) ', async () => {
    await testAuditDecision('customer')
  })

  // it('should test createTaskContract, getTaskContracts, taskParticipate, getTaskInfo, taskStateChange(all except canceled), taskAuditParticipate, taskAuditDecision(in performer favour) ', async () => {
  //   await testAuditDecision('performer')
  // })
  
})
