/* global artifacts, contract, it, assert */
/* eslint-disable prefer-reflect */

const path = require("node:path");
const fs = require("fs");

const { expectThrow } = require('./helpers/expectThrow');
// const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");


// const ERC1155Mintable = artifacts.require('ERC1155Mintable.sol');
// const ERC1155MockReceiver = artifacts.require('ERC1155MockReceiver.sol');
const BigNumber = require('bignumber.js');

const { deployDiamond } = require('../scripts/deploy.js')

let user1;
let user2;
let user3;
let user4;
let mainContract;
let receiverContract;
let tx;

let zeroAddress = '0x0000000000000000000000000000000000000000';

let hammerId;
let swordId;
let maceId;

let idSet = [];
let quantities = [ethers.BigNumber.from(1), ethers.BigNumber.from(1), ethers.BigNumber.from(1)];

let gasUsedRecords = [];
let gasUsedTotal = 0;

function recordGasUsed(_tx, _label) {
    gasUsedTotal += _tx.gasUsed;
    gasUsedRecords.push(String(_label + ' \| GasUsed: ' + _tx.gasUsed).padStart(60));
}

function printGasUsed() {
    console.log('------------------------------------------------------------');
    for (let i = 0; i < gasUsedRecords.length; ++i) {
        console.log(gasUsedRecords[i]);
    }
    console.log(String("Total: " + gasUsedTotal).padStart(60));
    console.log('------------------------------------------------------------');
}

function verifyURI(tx, uri, id) {
    for (let event of tx.events) {
        if (event.event === 'URI') {
            assert(event.args.id.eq(id));
            assert(event.args.value === uri);
            return;
        }
    }
    assert(false, 'Did not find URI event');
}

function verifyTransferEvent(tx, id, from, to, quantity, operator) {
    let eventCount = 0;
    for (let event of tx.events) {
        if (event.event === 'TransferSingle') {
            assert(event.args.operator === operator, "Operator mis-match");
            assert(event.args.from === from, "from mis-match");
            assert(event.args.to === to, "to mis-match");
            assert(event.args.id.eq(id), "id mis-match");
            assert(event.args.value.toNumber() === quantity.toNumber(), "quantity mis-match");
            eventCount += 1;
        }
    }
    if (eventCount === 0)
        assert(false, 'Missing Transfer Event');
    else
        assert(eventCount === 1, 'Unexpected number of Transfer events');
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

async function testSafeTransferFrom(operator, from, to, id, quantity, data, gasMessage='testSafeTransferFrom') {
    let feeData = await ethers.provider.getFeeData();

    let preBalanceFrom = await mainContract.balanceOf(from, id);
    let preBalanceTo   = await mainContract.balanceOf(to, id);

    tx = await mainContract.connect(operator).safeTransferFrom(from, to, id, quantity, data, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
    receipt = await tx.wait()
    recordGasUsed(receipt, gasMessage);
    verifyTransferEvent(receipt, id, from, to, quantity, operator.address);

    let postBalanceFrom = await mainContract.balanceOf(from, id);
    let postBalanceTo   = await mainContract.balanceOf(to, id);

    if (from !== to){
        assert.strictEqual(preBalanceFrom.sub(quantity).toNumber(), postBalanceFrom.toNumber());
        assert.strictEqual(preBalanceTo.add(quantity).toNumber(), postBalanceTo.toNumber());
    } else {
        // When from === to, just make sure there is no change in balance.
        assert.strictEqual(preBalanceFrom.toNumber(), postBalanceFrom.toNumber());
    }
}

function verifyTransferEvents(tx, ids, from, to, quantities, operator) {

    // Make sure we have a transfer event representing the whole transfer.
    // ToDo: Should really match the deltas, not the exact ids/events
    let totalIdCount = 0;
    for (let event of tx.events) {
        // Match transfer _from->_to
        if (event.event === 'TransferBatch' &&
            event.args.operator === operator &&
            event.args.from === from &&
            event.args.to === to) {
            // Match payload.
            for (let j = 0; j < ids.length; ++j) {
                let id = event.args.ids[j];
                let value = event.args[4][j];
                if (id.eq(ids[j]) && value.eq(quantities[j])) {
                     ++totalIdCount;
                }
            }
         }
     }

    assert(totalIdCount === ids.length, 'Unexpected number of Transfer events found ' + totalIdCount + ' expected ' + ids.length);
}

async function testSafeBatchTransferFrom(operator, from, to, ids, quantities, data, gasMessage='testSafeBatchTransferFrom') {
    let feeData = await ethers.provider.getFeeData();

    let preBalanceFrom = [];
    let preBalanceTo   = [];

    for (let id of ids)
    {
        preBalanceFrom.push(await mainContract.balanceOf(from, id));
        preBalanceTo.push(await mainContract.balanceOf(to, id));
    }

    tx = await mainContract.connect(operator).safeBatchTransferFrom(from, to, ids, quantities, data, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
    receipt = await tx.wait()
    recordGasUsed(receipt, gasMessage);
    verifyTransferEvents(receipt, ids, from, to, quantities, operator.address);

    // Make sure balances match the expected values
    let postBalanceFrom = [];
    let postBalanceTo   = [];

    for (let id of ids)
    {
        postBalanceFrom.push(await mainContract.balanceOf(from, id));
        postBalanceTo.push(await mainContract.balanceOf(to, id));
    }

    for (let i = 0; i < ids.length; ++i) {
        if (from !== to){
            assert.strictEqual(preBalanceFrom[i].sub(quantities[i]).toNumber(), postBalanceFrom[i].toNumber());
            assert.strictEqual(preBalanceTo[i].add(quantities[i]).toNumber(), postBalanceTo[i].toNumber());
        } else {
            assert.strictEqual(preBalanceFrom[i].toNumber(), postBalanceFrom[i].toNumber());
        }
    }
}

describe('ERC1155Mintable - tests all core 1155 functionality.', (accounts) => {

    let diamondAddress
    let diamondLoupeFacet
    let tokenFacet
    let tokenDataFacet
    let tx
    let receipt
    let result
    let addresses = []
  
    before(async function () {
        if(hre.network.config.chainId == 31337 && false){
            ({diamondAddress, facetCount} = await deployDiamond());
        }
        else{
            try{
                console.log(__dirname);
                const existingAddresses = fs.readFileSync(path.join(__dirname, `../abi/addresses.json`));
                contractAddresses = JSON.parse(existingAddresses);
                diamondAddress = contractAddresses.contracts[hre.network.config.chainId]["Diamond"];
              }
              catch{
                console.log(`existing ../abi/addresses.json not found, please deploy first`);
              }
              console.log(`testing pre-deployed diamond ${diamondAddress}`);

        }

      const ERC1155MockReceiverContract = await ethers.getContractFactory('ERC1155MockReceiver')
      const erc1155MockReceiver = await ERC1155MockReceiverContract.deploy()
      await erc1155MockReceiver.deployed()
      console.log('ERC1155MockReceiver deployed:', erc1155MockReceiver.address)

      const ERC1155MockNonReceiverContract = await ethers.getContractFactory('ERC1155MockNonReceiver')
      const erc1155MockNonReceiver = await ERC1155MockNonReceiverContract.deploy()
      await erc1155MockNonReceiver.deployed()
      console.log('ERC1155MockNonReceiver deployed:', erc1155MockNonReceiver.address)
      

      diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
      tokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
      tokenDataFacet = await ethers.getContractAt('TokenDataFacet', diamondAddress)
      ERC1155MockReceiver = await ethers.getContractAt('ERC1155MockReceiver', erc1155MockReceiver.address)
      ERC1155MockNonReceiver = await ethers.getContractAt('ERC1155MockNonReceiver', erc1155MockNonReceiver.address)
      signers = await ethers.getSigners();
    })


    before(async () => {
        user1 = signers[0].address;
        user2 = signers[1].address;
        user3 = signers[2].address;
        user4 = signers[3].address;
        mainContract = await tokenFacet;
        receiverContract = await ERC1155MockReceiver;
    });

    after(async() => {
        printGasUsed();
    });

    it('Create initial items', async () => {
        let feeData = await ethers.provider.getFeeData();

        // Make sure the Transfer event respects the create or mint spec.
        // Also fetch the created id.
        function verifyCreateTransfer(tx, value, creator) {
            for (let event of tx.events) {
                if (event.event === 'TransferSingle') {
                    assert(event.args.operator === creator);
                    // This signifies minting.
                    assert(event.args.from === zeroAddress);
                    if (value > 0) {
                        // Initial balance assigned to creator.
                        // Note that this is implementation specific,
                        // You could assign the initial balance to any address..
                        assert(event.args.to === creator, 'Creator mismatch');
                        assert(event.args.value.toNumber() === value, 'Value mismatch');
                    } else {
                        // It is ok to create a new id w/o a balance.
                        // Then _to should be 0x0
                        assert(event.args.to === zeroAddress);
                        assert(event.args.value.eq(0));
                    }
                    return event.args.id;
                }
            }
            assert(false, 'Did not find initial Transfer event');
        }

        let hammerQuantity = 5;
        let hammerUri = 'https://metadata.enjincoin.io/hammer.json';
        tx = await mainContract.connect(signers[0]).create(hammerUri, 'hammer', false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait()
        hammerId = verifyCreateTransfer(receipt, 0, signers[0].address);
        idSet.push(hammerId);

        // This is implementation-specific,
        // but we choose to add an URI on creation.
        // Make sure the URI event is emited correctly.
        verifyURI(receipt, hammerUri, hammerId);

        const mintHammerTokens = await tokenFacet.connect(signers[0]).mintFungibleByName('hammer', [signers[0].address], [ethers.BigNumber.from(hammerQuantity)], { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas })
        const mintHammerTokensReceipt = await mintHammerTokens.wait()

        let swordQuantity = 200;
        let swordUri = 'https://metadata.enjincoin.io/sword.json';
        tx = await mainContract.connect(signers[0]).create(swordUri, 'sword', false);
        receipt = await tx.wait()
        swordId = verifyCreateTransfer(receipt, 0, user1);
        idSet.push(swordId);
        verifyURI(receipt, swordUri, swordId);

        const mintSwordTokens = await tokenFacet.connect(signers[0]).mintFungibleByName('sword', [signers[0].address], [ethers.BigNumber.from(swordQuantity)], { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas })
        const mintSwordTokensReceipt = await mintSwordTokens.wait()

        let maceQuantity = 1000000;
        let maceUri = 'https://metadata.enjincoin.io/mace.json';
        tx = await mainContract.connect(signers[0]).create(maceUri, 'mace', false);
        receipt = await tx.wait()
        maceId = verifyCreateTransfer(receipt, 0, user1);
        idSet.push(maceId);
        verifyURI(receipt, maceUri, maceId);

        const mintMaceTokens = await tokenFacet.connect(signers[0]).mintFungibleByName('mace', [signers[0].address], [ethers.BigNumber.from(maceQuantity)], { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas })
        const mintMaceTokensReceipt = await mintMaceTokens.wait()
    });

    it('safeTransferFrom throws with no balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[1]).safeTransferFrom(signers[1].address, signers[0].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom throws with invalid id', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[1]).safeTransferFrom(signers[1].address, signers[0].address, ethers.BigNumber.from(32), ethers.BigNumber.from(1), fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom throws with no approval', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[1]).safeTransferFrom(signers[0].address, signers[1].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom throws when exceeding balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeTransferFrom(signers[0].address, signers[1].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(6), fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom throws when sending to non-receiver contract', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeTransferFrom(signers[0].address, ERC1155MockNonReceiver.address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom throws if invalid response from receiver contract', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await receiverContract.connect(signers[0]).setShouldReject(true);
        receipt = await tx.wait();
        await expectThrow(mainContract.connect(signers[0]).safeTransferFrom(signers[0].address, receiverContract.address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii('Bob'), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeTransferFrom from self with enough balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await testSafeTransferFrom(signers[0], signers[0].address, signers[1].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''));
        await testSafeTransferFrom(signers[1], signers[1].address, signers[0].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''));
  });

    it('safeTransferFrom to self with enough balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await testSafeTransferFrom(signers[0], signers[0].address, signers[0].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''));
    });

    it('safeTransferFrom zero value', async () => {
        let feeData = await ethers.provider.getFeeData();
        await testSafeTransferFrom(signers[2], signers[2].address, signers[0].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(0), fromAscii(''));
    });

    it('safeTransferFrom from approved operator', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await mainContract.connect(signers[0]).setApprovalForAll(signers[2].address, true, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        await testSafeTransferFrom(signers[2], signers[0].address, signers[1].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''));
        tx = await mainContract.connect(signers[0]).setApprovalForAll(signers[2].address, false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();

        // Restore state
        tx = await mainContract.connect(signers[1]).setApprovalForAll(signers[2].address, true, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        await testSafeTransferFrom(signers[2], signers[1].address, signers[0].address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii(''));
        tx = await mainContract.connect(signers[1]).setApprovalForAll(signers[2].address, false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
    });

    it('safeTransferFrom to receiver contract', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await receiverContract.connect(signers[0]).setShouldReject(false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        await testSafeTransferFrom(signers[0], signers[0].address, receiverContract.address, ethers.BigNumber.from(hammerId), ethers.BigNumber.from(1), fromAscii('SomethingMeaningfull'), 'testSafeTransferFrom receiver');

        // ToDo restore state
    });

    it('safeBatchTransferFrom throws with insuficient balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeBatchTransferFrom(signers[1].address, signers[0].address, idSet, quantities, fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom throws with invalid id', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeBatchTransferFrom(signers[0].address, signers[1].address, [32, swordId, maceId], quantities, fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom throws with no approval', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[1]).safeBatchTransferFrom(signers[0].address, signers[2].address, idSet, quantities, fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom throws when exceeding balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeBatchTransferFrom(signers[0].address, signers[1].address, idSet, [ethers.BigNumber.from(6),ethers.BigNumber.from(1),ethers.BigNumber.from(1)], fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom throws when sending to a non-receiver contract', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[0]).safeBatchTransferFrom(signers[0].address, mainContract.address, idSet, quantities, fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom throws with invalid receiver contract reply', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await receiverContract.connect(signers[0]).setShouldReject(true);
        receipt = await tx.wait();
        await expectThrow(mainContract.connect(signers[0]).safeBatchTransferFrom(signers[0].address, receiverContract.address, idSet, quantities, fromAscii(''), { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('safeBatchTransferFrom ok with valid receiver contract reply', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await receiverContract.connect(signers[0]).setShouldReject(false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        await testSafeBatchTransferFrom(signers[0], signers[0].address, receiverContract.address, idSet, quantities, fromAscii(''), 'testSafeBatchTransferFrom receiver');
    });

    it('safeBatchTransferFrom from self with enough balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        await testSafeBatchTransferFrom(signers[0], signers[0].address, signers[1].address, idSet, quantities, fromAscii(''));
        await testSafeBatchTransferFrom(signers[1], signers[1].address, signers[0].address, idSet, quantities, fromAscii(''));
    });

    it('safeBatchTransferFrom by operator with enough balance', async () => {
        let feeData = await ethers.provider.getFeeData();
        tx = await mainContract.connect(signers[0]).setApprovalForAll(signers[2].address, true, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        tx = await mainContract.connect(signers[1]).setApprovalForAll(signers[2].address, true, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        await testSafeBatchTransferFrom(signers[2], signers[0].address, signers[1].address, idSet, quantities, fromAscii(''));
        await testSafeBatchTransferFrom(signers[2], signers[1].address, signers[0].address, idSet, quantities, fromAscii(''));
        tx = await mainContract.connect(signers[0]).setApprovalForAll(signers[2].address, false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
        tx = await mainContract.connect(signers[1]).setApprovalForAll(signers[2].address, false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait();
    });

    it('safeBatchTransferFrom to self with enough balance', async () => {
        await testSafeBatchTransferFrom(signers[0], signers[0].address, signers[0].address, idSet, quantities, fromAscii(''));
    });

    it('safeBatchTransferFrom zero quantity with zero balance', async () => {
        await testSafeBatchTransferFrom(signers[2], signers[2].address, signers[0].address, idSet, [0,0,0], fromAscii(''));
    });

    // ToDo test event setApprovalForAll
    it('safeBatchTransferFrom by operator with enough balance', async () => {
        let feeData = await ethers.provider.getFeeData();

        function verifySetApproval(tx, operator, owner, approved) {
            for (let event of tx.events) {
                if (event.event === 'ApprovalForAll') {
                    assert(event.args.operator === operator);
                    assert(event.args.account === owner);
                    assert(event.args.approved === approved);
                    return;
                }
            }
            assert(false, 'Did not find ApprovalForAll event');
        }

        tx = await mainContract.connect(signers[0]).setApprovalForAll(user3, true, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait()
        verifySetApproval(receipt, user3, user1, true);

        tx = await mainContract.connect(signers[0]).setApprovalForAll(user3, false, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait()
        verifySetApproval(receipt, user3, user1, false);
    });

    it('balanceOfBatch - fails on array length mismatch', async () => {
        let accounts = [ user1 ];
        let ids      = [ hammerId, swordId ];

        await expectThrow(mainContract.balanceOfBatch(accounts, ids));
    });

    it('balanceOfBatch - matches individual balances', async () => {
        let accounts = [ user1, user1, user1, user2, user2, user2, user3, user3, user3, user4 ];
        let ids      = [ hammerId, swordId, maceId, hammerId, swordId, maceId, hammerId, swordId, maceId, hammerId ];

        let balances = await mainContract.balanceOfBatch(accounts, ids);

        for (let i = 0; i < ids.length; i++) {
            let balance = await mainContract.balanceOf(accounts[i], ids[i]);
            assert(balance.toNumber() === balances[i].toNumber());
        }
    });

    it('ERC1165 - returns false on non-supported insterface', async () => {
        let someRandomInterface = '0xd9b67a25';
        assert(await diamondLoupeFacet.supportsInterface(someRandomInterface) === false);
    });

    it('ERC1165 - supportsInterface: ERC165', async () => {
        let erc165interface = '0x01ffc9a7';
        assert(await diamondLoupeFacet.supportsInterface(erc165interface) === true);
    });

    it('ERC1165 - supportsInterface: ERC1155', async () => {
        let erc1155interface = '0xd9b67a26';
        console.log(await diamondLoupeFacet.supportsInterface(erc1155interface));
        assert(await diamondLoupeFacet.supportsInterface(erc1155interface) === true);
    });

    it('ERC1165 - supportsInterface: URI', async () => {
        let uriInterface = '0x0e89341c';
        assert(await diamondLoupeFacet.supportsInterface(uriInterface) === true);
    });

    it('setURI only callable by minter (implementation specific)', async () => {
        let feeData = await ethers.provider.getFeeData();
        let newHammerUri = 'https://metadata.enjincoin.io/new_hammer.json';
        await expectThrow(mainContract.connect(signers[1]).setURI(newHammerUri, hammerId, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('setURI emits the right event', async () => {
        let feeData = await ethers.provider.getFeeData();
        let newHammerUri = 'https://metadata.enjincoin.io/new_hammer.json';
        tx = await mainContract.connect(signers[0]).setURI(newHammerUri, hammerId, { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas });
        receipt = await tx.wait()
        verifyURI(receipt, newHammerUri, hammerId);
    });

    it('mint (implementation specific) - callable only from initial minter ()', async () => {
        let feeData = await ethers.provider.getFeeData();
        await expectThrow(mainContract.connect(signers[1]).mintFungible(hammerId, [user3], [1], { type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }));
    });

    it('mint (implementation specific) - fails on receiver contract invalid response - not tested', async () => {
    });

    it('mint (implementation specific) - emits a valid Transfer* event - not tested', async () => {
    });
});
