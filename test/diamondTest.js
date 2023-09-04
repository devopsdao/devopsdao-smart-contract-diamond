/* global describe it before ethers */
const { ethers } = require("hardhat");
// const crypto = require('crypto');
const path = require("node:path");
const fs = require("fs");

// const {
//   BN, // Big Number support
//   constants, // Common constants, like the zero address and largest integers
//   expectEvent, // Assertions for emitted events
//   expectRevert, // Assertions for transactions that should fail
// } = require("@openzeppelin/test-helpers");

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets,
} = require("../scripts/libraries/diamond.js");

const { deployDiamond } = require("../scripts/deploy.js");

const { deployZkSync } = require("../deploy/deploy.js");

// const { assert } = require("chai");

describe("DiamondTest", async function () {
  let diamondAddress;
  let facetCount;
  let diamondCutFacet;
  let diamondLoupeFacet;
  let ownershipFacet;
  let tx;
  let receipt;
  let result;
  let addresses = [];

  before(async function () {

    // signers = await ethers.getSigners();
    // console.log(signers)

    // console.log(`${this.__hardhatContext.environment.config.abiExporter[0].path}/addresses.json`)

    // console.log('HREEEEEEEEEEEEEEEEEEEEEEEEEEEE')
    // console.log(`${hre.config.abiExporter[0].path}/addresses.json`)
    // console.log(fandnadofndaonfdo)

    const existingAddresses = fs.readFileSync(path.join(__dirname, `../abi/addresses.json`));
    let contractAddresses;

    // console.log(hre.network.config.chainId)

    testExistingDiamond = false

    let zksync = false;

    if(typeof existingAddresses !== 'undefined' && testExistingDiamond){
      contractAddresses = JSON.parse(existingAddresses);
    }
    // console.log(contractAddresses)

    if(typeof contractAddresses !== 'undefined'){
      console.log('using existing diamond')
      diamondAddress = contractAddresses.contracts[hre.network.config.chainId]['Diamond'];
      facetCount = 14;
    }
    else{
      if(zksync === false){
        console.log('deploying diamond');
        ({diamondAddress, facetCount} = await deployDiamond());
      }
      else{
        console.log('deploying diamond to zksync');
        ({diamondAddress, facetCount} = await deployZkSync());
        console.log('deployed diamond to zksync');
      }
      console.log('deployed diamond');
    }
    console.log(`testing Diamond: ${diamondAddress}`);



    diamondCutFacet = await hre.ethers.getContractAt("DiamondCutFacet", diamondAddress);
    diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress);
    ownershipFacet = await ethers.getContractAt("OwnershipFacet", diamondAddress);
    taskCreateFacet = await ethers.getContractAt("TaskCreateFacet", diamondAddress);
    taskDataFacet = await ethers.getContractAt("TaskDataFacet", diamondAddress);
    accountFacet = await ethers.getContractAt("AccountFacet", diamondAddress);
    tokenFacet = await ethers.getContractAt("TokenFacet", diamondAddress);
    tokenDataFacet = await ethers.getContractAt("TokenDataFacet", diamondAddress);
    accountFacet = await ethers.getContractAt("AccountFacet", diamondAddress);
    axelarFacet = await ethers.getContractAt("AxelarFacet", diamondAddress);
    hyperlaneFacet = await ethers.getContractAt("HyperlaneFacet", diamondAddress);
    layerzeroFacet = await ethers.getContractAt("LayerzeroFacet", diamondAddress);
    wormholeFacet = await ethers.getContractAt("WormholeFacet", diamondAddress);

    signers = await ethers.getSigners();
  });

  it("should have ten facets -- call to facetAddresses function", async () => {

    // console.log(diamondLoupeFacet)
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address);
      // console.log(address);
    }

    assert.equal(addresses.length, facetCount);
  });

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

  it("remove all functions and facets except 'diamondCut' and 'facets'", async () => {
    let selectors = [];
    let facets = await diamondLoupeFacet.facets();
    // console.log(facets)
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors);
    }
    selectors = removeSelectors(selectors, ["facets()", "diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)"]);
    // console.log(selectors)
    tx = await diamondCutFacet.diamondCut(
      [
        {
          facetAddress: ethers.constants.AddressZero,
          action: FacetCutAction.Remove,
          functionSelectors: selectors,
        },
      ],
      ethers.constants.AddressZero,
      "0x",
      { gasLimit: 8000000 }
    );
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    facets = await diamondLoupeFacet.facets();
    // console.log('removed facets')
    // console.log(facets)
    assert.equal(facets.length, 2);
    assert.equal(facets[0][0], addresses[0]);
    assert.sameMembers(facets[0][1], ["0x1f931c1c"]);
    assert.equal(facets[1][0], addresses[1]);
    assert.sameMembers(facets[1][1], ["0x7a0ed627"]);
  });

  it("add most functions and facets", async () => {
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
        functionSelectors: getSelectors(taskCreateFacet),
      },
      {
        facetAddress: addresses[4],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(taskDataFacet),
      },
      {
        facetAddress: addresses[5],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(accountFacet),
      },
      {
        facetAddress: addresses[6],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(tokenFacet),
      },
      {
        facetAddress: addresses[7],
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(tokenDataFacet),
      },
      // {
      //   facetAddress: addresses[8],
      //   action: FacetCutAction.Add,
      //   functionSelectors: getSelectors(axelarFacet),
      // },
      // {
      //   facetAddress: addresses[9],
      //   action: FacetCutAction.Add,
      //   functionSelectors: getSelectors(hyperlaneFacet),
      // },
      // {
      //   facetAddress: addresses[10],
      //   action: FacetCutAction.Add,
      //   functionSelectors: getSelectors(layerzeroFacet),
      // },
      // {
      //   facetAddress: addresses[11],
      //   action: FacetCutAction.Add,
      //   functionSelectors: getSelectors(wormholeFacet),
      // },
    ];
    tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, "0x", { gasLimit: 8000000 });
    receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    // console.log(addr)
    const facets = await diamondLoupeFacet.facets();
    // console.log(facets)
    // console.log(addresses)
    // addresses = []
    // for (const address of await diamondLoupeFacet.facetAddresses()) {
    //   addresses.push(address)
    //   // console.log(address);
    // }
    // const facetAddresses = await diamondLoupeFacet.facetAddresses()
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(taskCreateFacet));
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[6], facets)][1], getSelectors(tokenFacet));
  });
});

describe("dodao facets test", async function () {
  // async function testAuditDecision(favour){
  let signers;
  let taskData;


//   struct TaskData{
//     string nanoId;
//     string taskType;
//     string title;
//     string description;
//     string repository;
//     string[] tags;
//     // string[][] tokenNames;
//     // uint256[] amounts;
//     address[] tokenContracts;
//     // mapping(address => Token) tokens;
//     uint256[][] tokenIds;
//     uint256[][] tokenAmounts;
//     // mapping(string => string) ext;
//     // mapping(string => bool) extMapping;
// }

  before(async function () {
    signers = await ethers.getSigners();
    taskData = {
      nanoId: "test",
      taskType: "private",
      title: "test job",
      description: "test desc",
      repository: "https://github.com/devopsdao/dodao-diamond",
      tags: ["ETH"],
      tokenContracts: ["0x0000000000000000000000000000000000000000"],
      tokenIds: [[0]],
      tokenAmounts: [[0]],
    };
  });

  let createdAuditorNftBaseType;
  it("tokenFacet createAuditorNFT", async () => {
    const createAuditorNFT = await tokenFacet.connect(signers[0]).create("https://example.com/{id}", "auditor", true);
    const createAuditorNFTReceipt = await createAuditorNFT.wait();

    // console.log('taskContracts:');
    // console.log(getTaskContracts)

    const createAuditorNFTEvent = createAuditorNFTReceipt.events[1];
    let createdAuditorNFTuri;
    ({ value: createdAuditorNFTuri, id: createdAuditorNftBaseType } = createAuditorNFTEvent.args);
    assert.equal(createdAuditorNFTuri, "https://example.com/{id}");
  });

  it("tokenDataFacet created NFT uri", async () => {
    const auditorNFTURI = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType);
    assert.equal(auditorNFTURI, "https://example.com/{id}");
  });

  it("tokenDataFacet created NFT uriOfBatch", async () => {
    const auditorNFTURIOfBatch = await tokenDataFacet.connect(signers[2]).uriOfBatch([createdAuditorNftBaseType]);
    assert.deepEqual(auditorNFTURIOfBatch, ["https://example.com/{id}"]);
  });

  it("tokenDataFacet created NFT uriOfBatchName", async () => {
    const auditorNFTURIOfBatchName = await tokenDataFacet.connect(signers[2]).uriOfBatchName(["auditor"]);
    assert.deepEqual(auditorNFTURIOfBatchName, ["https://example.com/{id}"]);
  });

  it("tokenDataFacet created NFT setURI", async () => {
    let feeData = await ethers.provider.getFeeData();

    const auditorSetNFTURI = await tokenFacet
      .connect(signers[0])
      .setURI("https://example2.com/{id}", createdAuditorNftBaseType, { type: 2, gasPrice: feeData.gasPrice });
    await auditorSetNFTURI.wait();
    const auditorNFTURI2 = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType);
    assert.equal(auditorNFTURI2, "https://example2.com/{id}");
  });

  let auditorNFTURI3;

  it("tokenDataFacet created NFT setURIOfName", async () => {
    let feeData = await ethers.provider.getFeeData();

    const auditorSetNFTURIofName = await tokenFacet
      .connect(signers[0])
      .setURIOfName("https://example3.com/{id}", "auditor", { type: 2, gasPrice: feeData.gasPrice });
    await auditorSetNFTURIofName.wait();
    auditorNFTURI3 = await tokenDataFacet.connect(signers[2]).uri(createdAuditorNftBaseType);
    assert.equal(auditorNFTURI3, "https://example3.com/{id}");
  });

  it("tokenDataFacet created NFT getTokenBaseType", async () => {
    const auditorNFTTokenBaseType = await tokenDataFacet.connect(signers[2]).getTokenBaseType("auditor");
    assert.deepEqual(auditorNFTTokenBaseType, createdAuditorNftBaseType);
  });

  let mintedAuditorNFTid;
  it("tokenDataFacet mintNonFungible", async () => {
    // openzeppelin test helpers, not compatible with ethers.js
    // await expectEvent(createAuditorNFTReceipt, 'URI', {
    //   value: this.value,
    // });
    let feeData = await ethers.provider.getFeeData();

    const mintAuditorNFT = await tokenFacet
      .connect(signers[0])
      .mintNonFungible(createdAuditorNftBaseType, [signers[2].address], { type: 2, gasPrice: feeData.gasPrice });
    const mintAuditorNFTReceipt = await mintAuditorNFT.wait();

    const mintAuditorNFTEvent = mintAuditorNFTReceipt.events[0];
    let mintedAuditorNFTamount;
    ({ value: mintedAuditorNFTamount, id: mintedAuditorNFTid } = mintAuditorNFTEvent.args);
    assert.equal(mintedAuditorNFTamount, 1);
  });

  it("tokenDataFacet minted NFT uri", async () => {
    const mintedAuditorNFTURI = await tokenDataFacet.connect(signers[2]).uri(mintedAuditorNFTid);
    assert.equal(mintedAuditorNFTURI, auditorNFTURI3);
  });

  it("tokenDataFacet minted created NFT names", async () => {
    const createdTokenNames = await tokenDataFacet.connect(signers[2]).getCreatedTokenNames();
    assert.deepEqual(createdTokenNames, ['auditor']);
  });

  it("tokenDataFacet minted NFT exists", async () => {
    const auditorNFTExists = await tokenDataFacet.connect(signers[2]).exists(mintedAuditorNFTid);
    assert.equal(auditorNFTExists, true);
  });

  it("tokenDataFacet minted NFT existsNfType", async () => {
    const auditorNFTExistsNfType = await tokenDataFacet.connect(signers[2]).existsNfType(mintedAuditorNFTid);
    assert.equal(auditorNFTExistsNfType, true);
  });

  it("tokenDataFacet minted NFT existsName", async () => {
    const auditorNFTExistsName = await tokenDataFacet.connect(signers[2]).existsName("auditor");
    assert.equal(auditorNFTExistsName, true);
  });

  it("tokenDataFacet minted NFT totalSupply", async () => {
    const auditorNFTTotalSupply = await tokenDataFacet.connect(signers[2]).totalSupply(mintedAuditorNFTid);
    assert.equal(auditorNFTTotalSupply, 1);
  });

  it("tokenDataFacet minted NFT totalSupplyOfNfType", async () => {
    const auditorNFTTotalSupplyNfType = await tokenDataFacet
      .connect(signers[2])
      .totalSupplyOfNfType(mintedAuditorNFTid);
    assert.equal(auditorNFTTotalSupplyNfType, 1);
  });

  it("tokenDataFacet minted NFT totalSupplyOfName", async () => {
    const auditorNFTTotalSupplyName = await tokenDataFacet.connect(signers[2]).totalSupplyOfName("auditor");
    assert.equal(auditorNFTTotalSupplyName, 1);
  });

  it("tokenDataFacet minted NFT totalSupplyOfBatch", async () => {
    const auditorNFTTotalSupplyOfBatch = await tokenDataFacet
      .connect(signers[2])
      .totalSupplyOfBatch([mintedAuditorNFTid]);
    assert.deepEqual(auditorNFTTotalSupplyOfBatch, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet minted NFT totalSupplyOfBatchNfType", async () => {
    const auditorNFTTotalSupplyOfBatchNfType = await tokenDataFacet
      .connect(signers[2])
      .totalSupplyOfBatchNfType([mintedAuditorNFTid]);
    assert.deepEqual(auditorNFTTotalSupplyOfBatchNfType, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet minted NFT totalSupplyOfBatchName", async () => {
    const auditorNFTTotalSupplyOfBatchName = await tokenDataFacet
      .connect(signers[2])
      .totalSupplyOfBatchName(["auditor"]);
    assert.deepEqual(auditorNFTTotalSupplyOfBatchName, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet minted NFT balanceOf", async () => {
    const auditorNFTBalanceOf = await tokenFacet.connect(signers[2]).balanceOf(signers[2].address, mintedAuditorNFTid);
    assert.equal(auditorNFTBalanceOf, 1);
  });

  it("tokenDataFacet minted NFT balanceOfNfType", async () => {
    const auditorNFTBalanceOfNfType = await tokenDataFacet
      .connect(signers[2])
      .balanceOfNfType(signers[2].address, mintedAuditorNFTid);
    assert.equal(auditorNFTBalanceOfNfType, 1);
  });

  it("tokenDataFacet minted NFT balanceOfName", async () => {
    const auditorNFTBalanceOfName = await tokenDataFacet
      .connect(signers[2])
      .balanceOfName(signers[2].address, "auditor");
    assert.equal(auditorNFTBalanceOfName, 1);
  });

  it("tokenDataFacet minted NFT balanceOfBatch", async () => {
    const auditorNFTBalanceOfBatch = await tokenFacet
      .connect(signers[2])
      .balanceOfBatch([signers[2].address], [mintedAuditorNFTid]);
    assert.deepEqual(auditorNFTBalanceOfBatch, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet minted NFT balanceOfBatchNfType", async () => {
    const auditorNFTBalanceOfBatchNfType = await tokenDataFacet
      .connect(signers[2])
      .balanceOfBatchNfType([signers[2].address], [mintedAuditorNFTid]);
    assert.deepEqual(auditorNFTBalanceOfBatchNfType, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet minted NFT balanceOfBatchName", async () => {
    const auditorNFTBalanceOfBatchName = await tokenDataFacet
      .connect(signers[2])
      .balanceOfBatchName([signers[2].address], ["auditor"]);
    assert.deepEqual(auditorNFTBalanceOfBatchName, [ethers.BigNumber.from(1)]);
  });

  it("tokenDataFacet uri", async () => {
    // const auditorNftBaseType = await tokenFacet.connect(signers[2]).getTokenBaseType(mintedAuditorNFTid)
    // assert.equal(auditorNftBaseType, createdAuditorNftBaseType)
  });

  it("tokenDataFacet minted NFT getTokenName", async () => {
    const auditorNftName = await tokenDataFacet.connect(signers[2]).getTokenName(mintedAuditorNFTid);
    assert.equal(auditorNftName, "auditor");
  });

  it("tokenDataFacet minted NFT getTokenIds", async () => {
    const ownedTokenIds = await tokenDataFacet.connect(signers[2]).getTokenIds(signers[2].address);
    assert.deepEqual(ownedTokenIds, [mintedAuditorNFTid]);
  });

  // it("tokenDataFacet mintNonFungible", async () => {
  //   // openzeppelin test helpers, not compatible with ethers.js
  //   // await expectEvent(createAuditorNFTReceipt, 'URI', {
  //   //   value: this.value,
  //   // });
  //   let feeData = await ethers.provider.getFeeData();

  //   const mintAuditorNFT = await tokenFacet
  //     .connect(signers[0])
  //     .mintNonFungible(createdAuditorNftBaseType, [signers[2].address], { type: 2, gasPrice: feeData.gasPrice });
  //   const mintAuditorNFTReceipt = await mintAuditorNFT.wait();

  //   const mintAuditorNFTEvent = mintAuditorNFTReceipt.events[0];
  //   let mintedAuditorNFTamount;
  //   ({ value: mintedAuditorNFTamount, id: mintedAuditorNFTid } = mintAuditorNFTEvent.args);
  //   assert.equal(mintedAuditorNFTamount, 1);
  // });

  it("tokenDataFacet minted NFT getTokenNames", async () => {
    // console.log(signers[2].address);
    const ownedTokenNames = await tokenDataFacet.connect(signers[2])['getTokenNames(address)'](signers[2].address);
    assert.deepEqual(ownedTokenNames, ["auditor"]);
  });

  for (const favour of ["customer", "performer", "no_audit"]) {
    it(`createTaskContract - audit resolved in ${favour} favour`, async () => {
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

      let feeData = await ethers.provider.getFeeData();

      // const taskData = {
      //   nanoId: "test",
      //   taskType: "private",
      //   title: "test job",
      //   description: "test desc",
      //   tags: ["ETH"],
      //   symbols: ["ETH"],
      //   amounts: [1],
      // };

      // console.log(taskCreateFacet);

      // console.log(taskData);

      const createTaskContract = await taskCreateFacet.createTaskContract(signers[0].address, taskData, { type: 2, gasPrice: feeData.gasPrice });
      await createTaskContract.wait();

      // test event listener
      await tokenFacet.on("URI", (URI, type, event) => {
        console.log("received event");
        console.log(URI, type);
      });
    });

    let getTaskContracts;
    it("tokenDataFacet getTaskContracts", async () => {
      getTaskContracts = await taskDataFacet.getTaskContracts();

      const getNewTaskContractsBeforeBlacklist = await taskDataFacet.connect(signers[0]).getTaskContractsByState("new");
      const getCompletedTaskContracts = await taskDataFacet.connect(signers[0]).getTaskContractsByState("completed");
      const getCanceledTaskContracts = await taskDataFacet.connect(signers[0]).getTaskContractsByState("canceled");
      const allTasks = getCanceledTaskContracts.concat(
        getCompletedTaskContracts,
        getNewTaskContractsBeforeBlacklist
      );
      // expect(getNewTaskContractsBeforeBlacklist).to.have.members(getTaskContracts);
      assert.deepEqual(allTasks, getTaskContracts);
    });

    it("tokenDataFacet addTaskToBlacklist", async () => {

      let feeData = await ethers.provider.getFeeData();

      const addContractToBlacklist = await taskDataFacet
        .connect(signers[2])
        .addTaskToBlacklist(getTaskContracts[getTaskContracts.length - 1], { type: 2, gasPrice: feeData.gasPrice });
      await addContractToBlacklist.wait();

      const getNewTaskContractsAfterBlacklist = await taskDataFacet.connect(signers[0]).getTaskContractsByState("new");
      assert.deepEqual(getNewTaskContractsAfterBlacklist, []);
    });

    it("tokenDataFacet removeTaskFromBlacklist", async () => {

      let feeData = await ethers.provider.getFeeData();

      const removeContractFromBlacklist = await taskDataFacet
        .connect(signers[2])
        .removeTaskFromBlacklist(getTaskContracts[getTaskContracts.length - 1], { type: 2, gasPrice: feeData.gasPrice });
      await removeContractFromBlacklist.wait();

      const getNewTaskContractsAfterBlacklistRemoval = await taskDataFacet
        .connect(signers[0])
        .getTaskContractsByState("new");
      const getCompletedTaskContracts = await taskDataFacet.connect(signers[0]).getTaskContractsByState("completed");
      const getCanceledTaskContracts = await taskDataFacet.connect(signers[0]).getTaskContractsByState("canceled");
      const allTasks = getCanceledTaskContracts.concat(
        getCompletedTaskContracts,
        getNewTaskContractsAfterBlacklistRemoval
      );
      assert.deepEqual(allTasks, getTaskContracts);
    });

    it("tokenDataFacet getTaskContractsCustomer", async () => {
      //check if account0 has customer contracts, must be equal to all contracts(1)
      const getTaskContractsCustomer = await taskDataFacet
        .connect(signers[0])
        .getTaskContractsCustomer(signers[0].address);
      assert.deepEqual(getTaskContractsCustomer, getTaskContracts);
    });

    it("tokenDataFacet getTaskContractsCustomer", async () => {
      //check if account1 has customer contracts, must be empty
      const getTaskContractsCustomer1 = await taskDataFacet
        .connect(signers[0])
        .getTaskContractsCustomer(signers[1].address);
      assert.deepEqual(getTaskContractsCustomer1, []);
    });

    it("tokenDataFacet getTaskContractsPerformer", async () => {
      // check if account0 has performer contracts, must be empty
      const getTaskContractsPerformer = await taskDataFacet
        .connect(signers[0])
        .getTaskContractsPerformer(signers[0].address);
      assert.deepEqual(getTaskContractsPerformer, []);
    });

    let taskContract;
    const taskStateNew = "new";
    it("TaskContract getTaskData", async () => {
      taskContract = await ethers.getContractAt("TaskContract", getTaskContracts[getTaskContracts.length - 1]);
      getTaskDataNew = await taskContract.getTaskData();
      // console.log(getTaskDataNew)
      // createTime;

      assert.isAbove(getTaskDataNew.createTime, 1666113343, "create time is more than 0");
      assert.equal(getTaskDataNew.contractParent, taskCreateFacet.address);

      assert.equal(getTaskDataNew.nanoId, taskData.nanoId);
      assert.equal(getTaskDataNew.title, taskData.title);
      assert.equal(getTaskDataNew.description, taskData.description);
      // assert.equal(getTaskDataNew.symbols, taskData.symbols)
      // assert.equal(getTaskDataNew.amounts, taskData.amounts)
      assert.equal(getTaskDataNew.taskState, taskStateNew);
      assert.equal(getTaskDataNew.contractOwner, signers[0].address);
    });

    const messageReplyTo = 0;
    const messageTextParticipate = "I am the best to make it";

    it("taskContract taskParticipate", async () => {

      let feeData = await ethers.provider.getFeeData();

      //first participant
      taskParticipate = await taskContract
        .connect(signers[1])
        .taskParticipate(signers[1].address, messageTextParticipate, messageReplyTo, { type: 2, gasPrice: feeData.gasPrice });
      await taskParticipate.wait();
      getTaskDataParticipate = await taskContract.getTaskData();
      assert.equal(getTaskDataParticipate.participants[0], signers[1].address);
      assert.equal(getTaskDataParticipate.messages[0].id, 1);
      assert.equal(getTaskDataParticipate.messages[0].text, messageTextParticipate);
      assert.isAbove(getTaskDataParticipate.messages[0].timestamp, 1666113343, "timestamp is more than 0");
      assert.equal(getTaskDataParticipate.messages[0].sender, signers[1].address);
      assert.equal(getTaskDataParticipate.messages[0].taskState, taskStateNew);
      assert.equal(getTaskDataParticipate.messages[0].replyTo, messageReplyTo);
    });

    it("taskContract taskParticipate 2", async () => {

      let feeData = await ethers.provider.getFeeData();

      //second participant
      taskParticipate = await taskContract
        .connect(signers[3])
        .taskParticipate(signers[3].address, messageTextParticipate, messageReplyTo, { type: 2, gasPrice: feeData.gasPrice });
      await taskParticipate.wait();
      getTaskDataParticipate = await taskContract.getTaskData();
      assert.equal(getTaskDataParticipate.participants[1], signers[3].address);
      assert.equal(getTaskDataParticipate.messages[1].id, 2);
      assert.equal(getTaskDataParticipate.messages[1].text, messageTextParticipate);
      assert.isAbove(getTaskDataParticipate.messages[1].timestamp, 1666113343, "timestamp is more than 0");
      assert.equal(getTaskDataParticipate.messages[1].sender, signers[3].address);
      assert.equal(getTaskDataParticipate.messages[1].taskState, taskStateNew);
      assert.equal(getTaskDataParticipate.messages[1].replyTo, messageReplyTo);
    });

    it("taskContract taskStateChange - agreed (select Performer)", async () => {

      let feeData = await ethers.provider.getFeeData();

      const taskStateAgreed = "agreed";
      const messageTextAgreed = "selected you for the first task";
      taskStateChangeAgreed = await taskContract
        .connect(signers[0])
        .taskStateChange(
          signers[0].address,
          getTaskDataParticipate.participants[0],
          taskStateAgreed,
          messageTextAgreed,
          messageReplyTo,
          0,
          { type: 2, gasPrice: feeData.gasPrice }
        );
      await taskStateChangeAgreed.wait();
      getTaskDataAgreed = await taskContract.getTaskData();
      assert.equal(getTaskDataAgreed.taskState, taskStateAgreed);
      assert.equal(getTaskDataAgreed.participant, signers[1].address);
      assert.equal(getTaskDataAgreed.messages[2].id, 3);
      assert.equal(getTaskDataAgreed.messages[2].text, messageTextAgreed);
      assert.isAbove(getTaskDataAgreed.messages[2].timestamp, 1666113343, "timestamp is more than 0");
      assert.equal(getTaskDataAgreed.messages[2].sender, signers[0].address);
      assert.equal(getTaskDataAgreed.messages[2].taskState, taskStateAgreed);
      assert.equal(getTaskDataAgreed.messages[2].replyTo, messageReplyTo);
    });

    it("taskContract taskStateChange - progress", async () => {

      let feeData = await ethers.provider.getFeeData();

      const taskStateProgress = "progress";
      const messageTextProgress = "starting job!";
      taskStateChangeProgress = await taskContract
        .connect(signers[1])
        .taskStateChange(
          signers[1].address,
          "0x0000000000000000000000000000000000000000",
          taskStateProgress,
          messageTextProgress,
          messageReplyTo,
          0,
          { type: 2, gasPrice: feeData.gasPrice }
        );
      await taskStateChangeProgress.wait();
      getTaskDataProgress = await taskContract.getTaskData();
      assert.equal(getTaskDataProgress.taskState, taskStateProgress);
      assert.equal(getTaskDataProgress.messages[3].id, 4);
      assert.equal(getTaskDataProgress.messages[3].text, messageTextProgress);
      assert.isAbove(getTaskDataProgress.messages[3].timestamp, 1666113343, "timestamp is more than 0");
      assert.equal(getTaskDataProgress.messages[3].sender, signers[1].address);
      assert.equal(getTaskDataProgress.messages[3].taskState, taskStateProgress);
      assert.equal(getTaskDataProgress.messages[3].replyTo, messageReplyTo);
    });

    it("taskContract taskStateChange - review", async () => {
      let feeData = await ethers.provider.getFeeData();

      const taskStateReview = "review";
      const messageTextReview = "please kindly review!";
      taskStateChangeReview = await taskContract
        .connect(signers[1])
        .taskStateChange(
          signers[1].address,
          "0x0000000000000000000000000000000000000000",
          taskStateReview,
          messageTextReview,
          messageReplyTo,
          0,
          { type: 2, gasPrice: feeData.gasPrice }
        );
      await taskStateChangeReview.wait();
      getTaskDataReview = await taskContract.getTaskData();
      assert.equal(getTaskDataReview.taskState, taskStateReview);
      assert.equal(getTaskDataReview.messages[4].id, 5);
      assert.equal(getTaskDataReview.messages[4].text, messageTextReview);
      assert.isAbove(getTaskDataReview.messages[4].timestamp, 1666113343, "timestamp is more than 0");
      assert.equal(getTaskDataReview.messages[4].sender, signers[1].address);
      assert.equal(getTaskDataReview.messages[4].taskState, taskStateReview);
      assert.equal(getTaskDataReview.messages[4].replyTo, messageReplyTo);
    });

    if (favour === "no_audit") {
      it("taskContract taskStateChange - completed", async () => {
        let feeData = await ethers.provider.getFeeData();

        const taskStateCompleted = "completed";
        const messageTextCompleted = "work is accepted, signing review";
        const messageReplyTo = 0;

        // taskContract = await ethers.getContractAt("TaskContract", getTaskContracts[getTaskContracts.length - 1]);
        getTaskDataCompleted = await taskContract.getTaskData();

        const taskStateChangeCompleted = await taskContract
          .connect(signers[0])
          .taskStateChange(
            signers[0].address,
            getTaskDataParticipate.participants[0],
            taskStateCompleted,
            messageTextCompleted,
            messageReplyTo,
            5,
            { type: 2, gasPrice: feeData.gasPrice }
          );
        await taskStateChangeCompleted.wait();
        getTaskDataCompleted = await taskContract.getTaskData();
        assert.equal(getTaskDataCompleted.taskState, taskStateCompleted);
        assert.equal(getTaskDataCompleted.participant, signers[1].address);
        assert.equal(getTaskDataCompleted.messages[5].id, 6);
        assert.equal(getTaskDataCompleted.messages[5].text, messageTextCompleted);
        assert.isAbove(getTaskDataCompleted.messages[5].timestamp, 1666113343, "timestamp is more than 0");
        assert.equal(getTaskDataCompleted.messages[5].sender, signers[0].address);
        assert.equal(getTaskDataCompleted.messages[5].taskState, taskStateCompleted);
        assert.equal(getTaskDataCompleted.messages[5].replyTo, messageReplyTo);
      });
    }
    if (favour !== "no_audit") {
      const taskStateAudit = "audit";

      it("tokenDataFacet taskStateChange - audit", async () => {
        let feeData = await ethers.provider.getFeeData();

        const taskAuditStateRequested = "requested";
        let messageTextAudit;
        if (favour == "customer") {
          messageTextAudit = "work is not done :(";
          taskStateChangeAudit = await taskContract
            .connect(signers[0])
            .taskStateChange(
              signers[0].address,
              "0x0000000000000000000000000000000000000000",
              taskStateAudit,
              messageTextAudit,
              messageReplyTo,
              0,
              { type: 2, gasPrice: feeData.gasPrice }
            );
          await taskStateChangeAudit.wait();
        }

        if (favour == "performer") {
          let feeData = await ethers.provider.getFeeData();

          messageTextAudit = "work is indeed done, acceptance is too long";
          taskStateChangeAudit = await taskContract
            .connect(signers[1])
            .taskStateChange(
              signers[1].address,
              "0x0000000000000000000000000000000000000000",
              taskStateAudit,
              messageTextAudit,
              messageReplyTo,
              0,
              { type: 2, gasPrice: feeData.gasPrice }
            );
          await taskStateChangeAudit.wait();
        }

        getTaskDataAudit = await taskContract.getTaskData();
        // console.log(getTaskDataAudit)
        assert.equal(getTaskDataAudit.taskState, taskStateAudit);
        assert.equal(getTaskDataAudit.auditState, taskAuditStateRequested);
        if (favour === "customer") {
          assert.equal(getTaskDataAudit.auditInitiator, signers[0].address);
        } else if (favour === "performer") {
          assert.equal(getTaskDataAudit.auditInitiator, signers[1].address);
        }
        assert.equal(getTaskDataAudit.messages[5].id, 6);
        assert.equal(getTaskDataAudit.messages[5].text, messageTextAudit);
        assert.isAbove(getTaskDataAudit.messages[5].timestamp, 1666113343, "timestamp is more than 0");
        if (favour === "customer") {
          assert.equal(getTaskDataAudit.messages[5].sender, signers[0].address);
        } else if (favour === "performer") {
          assert.equal(getTaskDataAudit.messages[5].sender, signers[1].address);
        }
        assert.equal(getTaskDataAudit.messages[5].taskState, taskStateAudit);
        assert.equal(getTaskDataAudit.messages[5].replyTo, messageReplyTo);
      });

      it("taskContract taskAuditParticipate", async () => {
        let feeData = await ethers.provider.getFeeData();

        const messageTextAuditParticipate = "I am honorable auditor";
        taskAuditParticipate = await taskContract
          .connect(signers[2])
          .taskAuditParticipate(signers[2].address, messageTextAuditParticipate, messageReplyTo, { type: 2, gasPrice: feeData.gasPrice });
        await taskAuditParticipate.wait();
        getTaskDataAuditParticipate = await taskContract.getTaskData();
        assert.equal(getTaskDataAuditParticipate.auditors[0], signers[2].address);
        assert.equal(getTaskDataAuditParticipate.messages[6].id, 7);
        assert.equal(getTaskDataAuditParticipate.messages[6].text, messageTextAuditParticipate);
        assert.isAbove(getTaskDataAuditParticipate.messages[6].timestamp, 1666113343, "timestamp is more than 0");
        assert.equal(getTaskDataAuditParticipate.messages[6].sender, signers[2].address);
        assert.equal(getTaskDataAuditParticipate.messages[6].taskState, taskStateAudit);
        assert.equal(getTaskDataAuditParticipate.messages[6].replyTo, messageReplyTo);
      });

      it("tokenDataFacet taskStateChange - performing audit (this auditor not applied) ", async () => {
        let feeData = await ethers.provider.getFeeData();

        const taskStateAudit = "audit";
        const messageTextSelectAuditor = "selected a proper auditor";
        const taskAuditStatePerforming = "performing";
        await expect(
          taskContract
          .connect(signers[0])
          .taskStateChange(
            signers[0].address,
            "0x0000000000000000000000000000000000000000",
            taskStateAudit,
            messageTextSelectAuditor,
            messageReplyTo,
            0,
            { type: 2, gasPrice: feeData.gasPrice }
          )
        ).to.be.revertedWith("auditor has not applied");
        // await taskStateChangeSelectAuditor.wait();
  

      });



      it("tokenDataFacet taskStateChange - performing audit (selected an auditor) ", async () => {
        let feeData = await ethers.provider.getFeeData();

        const messageTextSelectAuditor = "selected a proper auditor";
        const taskAuditStatePerforming = "performing";
        taskStateChangeSelectAuditor = await taskContract
          .connect(signers[0])
          .taskStateChange(
            signers[0].address,
            getTaskDataAuditParticipate.auditors[0],
            taskStateAudit,
            messageTextSelectAuditor,
            messageReplyTo,
            0,
            { type: 2, gasPrice: feeData.gasPrice }
          );
        await taskStateChangeSelectAuditor.wait();
        getTaskDataSelectAuditor = await taskContract.getTaskData();
        assert.equal(getTaskDataSelectAuditor.auditState, taskAuditStatePerforming);
        assert.equal(getTaskDataSelectAuditor.auditor, signers[2].address);
        assert.equal(getTaskDataSelectAuditor.messages[7].id, 8);
        assert.equal(getTaskDataSelectAuditor.messages[7].text, messageTextSelectAuditor);
        assert.isAbove(getTaskDataSelectAuditor.messages[7].timestamp, 1666113343, "timestamp is more than 0");
        assert.equal(getTaskDataSelectAuditor.messages[7].sender, signers[0].address);
        assert.equal(getTaskDataSelectAuditor.messages[7].taskState, taskStateAudit);
        assert.equal(getTaskDataSelectAuditor.messages[7].replyTo, messageReplyTo);
      });

      it("taskContract taskAuditDecision", async () => {
        let feeData = await ethers.provider.getFeeData();

        const messageTextAuditDecision = `${favour} is right`;
        const taskAuditStateFinished = "finished";
        let taskStateAuditDecision;
        let rating;
        if (favour == "customer") {
          taskStateAuditDecision = "canceled";
          rating = 1;
        } else if (favour == "performer") {
          taskStateAuditDecision = "completed";
          rating = 5;
        }
        taskAuditDecision = await taskContract
          .connect(signers[2])
          .taskAuditDecision(signers[2].address, favour, messageTextAuditDecision, 0, rating, { type: 2, gasPrice: feeData.gasPrice });
        await taskAuditDecision.wait();
        getTaskDataDecision = await taskContract.getTaskData();
        assert.equal(getTaskDataDecision.taskState, taskStateAuditDecision);
        assert.equal(getTaskDataDecision.auditState, taskAuditStateFinished);
        assert.equal(getTaskDataDecision.rating.eq(ethers.BigNumber.from(rating)), true);
        assert.equal(getTaskDataDecision.messages[8].id, 9);
        assert.equal(getTaskDataDecision.messages[8].text, messageTextAuditDecision);
        assert.isAbove(getTaskDataDecision.messages[8].timestamp, 1666113343, "timestamp is more than 0");
        assert.equal(getTaskDataDecision.messages[8].sender, signers[2].address);
        assert.equal(getTaskDataDecision.messages[8].taskState, taskStateAuditDecision);
        assert.equal(getTaskDataDecision.messages[8].replyTo, messageReplyTo);

        assert.equal(getTaskDataDecision.messages.length, 9);
      });
    }

    let getAccountsList;
    it("tokenDataFacet getAccountsList", async () => {
      getAccountsList = await accountFacet.connect(signers[0]).getAccountsList();
      assert.equal(getAccountsList.length, 4);
    });

    it("tokenDataFacet getAccountsData customer", async () => {
      const getAccountsData = await accountFacet.connect(signers[0]).getAccountsData(getAccountsList);

      const accountData = {
        accountOwner: signers[0].address,
        nickname: "",
        about: "",
        ownerTasks: getTaskContracts,
        participantTasks: [],
        auditParticipantTasks: [],
        customerRatings: [],
        performerRatings: [],
      };
      //  for([key, accountData] of Object.entries(getAccountsData)){
      expect(getAccountsData[0].accountOwner).to.equal(accountData.accountOwner);
      expect(getAccountsData[0].nickname).to.equal(accountData.nickname);
      expect(getAccountsData[0].about).to.equal(accountData.about);
      expect(getAccountsData[0].ownerTasks).to.have.deep.members(accountData.ownerTasks);
      expect(getAccountsData[0].participantTasks).to.have.deep.members(accountData.participantTasks);
      expect(getAccountsData[0].auditParticipantTasks).to.have.deep.members(accountData.auditParticipantTasks);
      expect(getAccountsData[0].customerRatings).to.have.deep.members(accountData.customerRatings);
      expect(getAccountsData[0].performerRatings).to.have.deep.members(accountData.performerRatings);
    });

    it("tokenDataFacet getAccountsData participant", async () => {
      const getAccountsData = await accountFacet.connect(signers[0]).getAccountsData(getAccountsList);

      const accountData = {
        accountOwner: signers[1].address,
        nickname: "",
        about: "",
        ownerTasks: [],
        participantTasks: getTaskContracts,
        auditParticipantTasks: [],
        customerRatings: [],
        performerRatings: [],
      };
      expect(getAccountsData[1].accountOwner).to.equal(accountData.accountOwner);
      expect(getAccountsData[1].nickname).to.equal(accountData.nickname);
      expect(getAccountsData[1].about).to.equal(accountData.about);
      expect(getAccountsData[1].ownerTasks).to.have.deep.members(accountData.ownerTasks);
      expect(getAccountsData[1].participantTasks).to.have.deep.members(accountData.participantTasks);
      expect(getAccountsData[1].auditParticipantTasks).to.have.deep.members(accountData.auditParticipantTasks);
      expect(getAccountsData[1].customerRatings).to.have.deep.members(accountData.customerRatings);
      expect(getAccountsData[1].performerRatings).to.have.deep.members(accountData.performerRatings);
    });

    it("tokenDataFacet getAccountsData participant 2", async () => {
      const getAccountsData = await accountFacet.connect(signers[0]).getAccountsData(getAccountsList);

      const accountData = {
        accountOwner: signers[3].address,
        nickname: "",
        about: "",
        ownerTasks: [],
        participantTasks: getTaskContracts,
        auditParticipantTasks: [],
        customerRatings: [],
        performerRatings: [],
      };
      expect(getAccountsData[2].accountOwner).to.equal(accountData.accountOwner);
      expect(getAccountsData[2].nickname).to.equal(accountData.nickname);
      expect(getAccountsData[2].about).to.equal(accountData.about);
      expect(getAccountsData[2].ownerTasks).to.have.deep.members(accountData.ownerTasks);
      expect(getAccountsData[2].participantTasks).to.have.deep.members(accountData.participantTasks);
      expect(getAccountsData[2].auditParticipantTasks).to.have.deep.members(accountData.auditParticipantTasks);
      expect(getAccountsData[2].customerRatings).to.have.deep.members(accountData.customerRatings);
      expect(getAccountsData[2].performerRatings).to.have.deep.members(accountData.performerRatings);
    });

    it("tokenDataFacet getAccountsData auditor", async () => {
      const getAccountsData = await accountFacet.connect(signers[0]).getAccountsData(getAccountsList);

      const accountData = {
        accountOwner: signers[2].address,
        nickname: "",
        about: "",
        ownerTasks: [],
        participantTasks: [],
        auditParticipantTasks: getTaskContracts.slice(0, 2),
        customerRatings: [],
        performerRatings: [],
      };
      expect(getAccountsData[3].accountOwner).to.equal(accountData.accountOwner);
      expect(getAccountsData[3].nickname).to.equal(accountData.nickname);
      expect(getAccountsData[3].about).to.equal(accountData.about);
      expect(getAccountsData[3].ownerTasks).to.have.deep.members(accountData.ownerTasks);
      expect(getAccountsData[3].participantTasks).to.have.deep.members(accountData.participantTasks);
      expect(getAccountsData[3].auditParticipantTasks).to.have.deep.members(accountData.auditParticipantTasks);
      expect(getAccountsData[3].customerRatings).to.have.deep.members(accountData.customerRatings);
      expect(getAccountsData[3].performerRatings).to.have.deep.members(accountData.performerRatings);
    });
    // assert.equal([signers[0],signers[1]], getAccountsList)

    // const getAccountsData = await accountFacet.connect(signers[0]).getAccountsData(getAccountsList)
  }

  it("taskContract taskStateChange - canceled", async () => {
    let feeData = await ethers.provider.getFeeData();

    createTaskContract = await taskCreateFacet.createTaskContract(signers[0].address, taskData, { type: 2, gasPrice: feeData.gasPrice });

    await createTaskContract.wait();

    const getTaskContracts = await taskDataFacet.getTaskContracts();

    const taskStateCanceled = "canceled";
    const messageTextCanceled = "canceling task";
    const messageReplyTo = 0;

    taskContract = await ethers.getContractAt("TaskContract", getTaskContracts[getTaskContracts.length - 1]);

    const taskStateChangeCanceled = await taskContract
      .connect(signers[0])
      .taskStateChange(
        signers[0].address,
        getTaskDataParticipate.participants[0],
        taskStateCanceled,
        messageTextCanceled,
        messageReplyTo,
        0
      );

    await taskStateChangeCanceled.wait();
    getTaskDataAgreed = await taskContract.getTaskData();
    assert.equal(getTaskDataAgreed.taskState, taskStateCanceled);
    assert.equal(getTaskDataAgreed.participant, "0x0000000000000000000000000000000000000000");
    assert.equal(getTaskDataAgreed.messages[0].id, 1);
    assert.equal(getTaskDataAgreed.messages[0].text, messageTextCanceled);
    assert.isAbove(getTaskDataAgreed.messages[0].timestamp, 1666113343, "timestamp is more than 0");
    assert.equal(getTaskDataAgreed.messages[0].sender, signers[0].address);
    assert.equal(getTaskDataAgreed.messages[0].taskState, taskStateCanceled);
    assert.equal(getTaskDataAgreed.messages[0].replyTo, messageReplyTo);
  });


  it("tokenDataFacet addAccountToBlacklist", async () => {

    let feeData = await ethers.provider.getFeeData();

    const getRawAccountsList = await accountFacet
    .connect(signers[0])
    .getRawAccountsList();

    const addAccountToBlacklist = await accountFacet
      .connect(signers[2])
      .addAccountToBlacklist(signers[2].address, { type: 2, gasPrice: feeData.gasPrice });
    await addAccountToBlacklist.wait();

    const getAccountsAfterBlacklist = await accountFacet.connect(signers[0]).getAccountsList();
    assert.deepEqual(getAccountsAfterBlacklist, [signers[0].address, signers[1].address, signers[3].address]);
  });

  it("tokenDataFacet removeAccountFromBlacklist", async () => {

    let feeData = await ethers.provider.getFeeData();

    const removeAccountFromBlacklist = await accountFacet
      .connect(signers[2])
      .removeAccountFromBlacklist(signers[2].address, { type: 2, gasPrice: feeData.gasPrice });
    await removeAccountFromBlacklist.wait();

    const getAccountsAfterBlacklistRemoval = await accountFacet
      .connect(signers[0])
      .getAccountsList();

    const getRawAccountsList = await accountFacet
      .connect(signers[0])
      .getRawAccountsList();

    assert.deepEqual(getAccountsAfterBlacklistRemoval, getRawAccountsList);
  });

  // it('tasks test (in customer favour) ', async () => {
  //   await testAuditDecision('customer')
  //   console.log('fasdffffffffffffffffffffffffffffffffffffffff')

  // })

  // it('should test createTaskContract, getTaskContracts, taskParticipate, getTaskData, taskStateChange(all except canceled), taskAuditParticipate, taskAuditDecision(in performer favour) ', async () => {
  //   await testAuditDecision('performer')
  // })

  // it('should test NFTFacet', async () => {
  //   // const mint = await tokenFacet.mint();
  //   const balance = await tokenFacet.balanceOf(signers[2].address, 1);
  //   console.log(balance)
  // })
});
