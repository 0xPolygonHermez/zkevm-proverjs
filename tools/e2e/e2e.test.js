/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */

const fs = require('fs');
const path = require('path');
const { Scalar } = require('ffjavascript');
const { argv } = require('yargs');
const ethers = require('ethers');
const { expect } = require('chai');
const lodash = require('lodash');

const {
    MemDB, ZkEVMDB, getPoseidon, processorUtils, smtUtils, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

const pathInputs = path.join(__dirname, './inputs');

describe('e2e', function () {
    this.timeout(300000);
    const pathTests = path.join(__dirname, 'e2e.json');
    let update;
    let geninput;
    let poseidon;
    let F;
    let testVectors;

    before(async () => {
        poseidon = await getPoseidon();
        F = poseidon.F;
        testVectors = JSON.parse(fs.readFileSync(pathTests));

        update = argv.update === true;
        geninput = argv.geninput === true;

        // Create the inputs folder
        if (geninput && !fs.existsSync(pathInputs)) {
            fs.mkdirSync(pathInputs);
        }
    });

    it('Check test vectors', async () => {
        for (let i = 0; i < testVectors.length; i++) {
            const {
                description,
                genesis,
                oldStateRoot,
                blobOuters,
                sequencerAddress,
                aggregatorAddress,
                forkID,
                chainID,
                expectedFinal,
            } = testVectors[i];

            const db = new MemDB(F);
            // create a zkEVMDB to compile the sc
            const zkEVMDB = await ZkEVMDB.newZkEVM(
                db,
                poseidon,
                [F.zero, F.zero, F.zero, F.zero],
                genesis,
                null,
                null,
                chainID,
                forkID,
            );

            // Check the state root
            if (!update) {
                expect(smtUtils.h4toString(zkEVMDB.stateRoot)).to.be.equal(oldStateRoot);
            } else {
                testVectors[i].oldStateRoot = smtUtils.h4toString(zkEVMDB.stateRoot);
            }

            // iterate over each blobOuter
            for (let n = 0; n < blobOuters.length; n++) {
                const blobOuterData = blobOuters[n];
                const {
                    zkGasLimit,
                    blobType,
                    batches,
                    forcedHashData,
                    previousL1InfoTreeRoot,
                    previousL1InfoTreeIndex,
                    oldBatchAccInputHash,
                    expected,
                } = blobOuterData;

                let initL1InfoTreeRoot = previousL1InfoTreeRoot;
                let initL1InfoTreeIndex = previousL1InfoTreeIndex;
                let initBatchAccInputHash = oldBatchAccInputHash;
                const initBatchNum = zkEVMDB.lastBatch + 1;
                let lastBatchInput = {};

                const txProcessed = [];
                const extraData = { l1Info: {} };

                for (let k = 0; k < batches.length; k++) {
                    const {
                        txs,
                        newStateRoot,
                        expectedNewLeafs,
                        batchL2Data,
                        inputHash,
                        batchHashData,
                        newLocalExitRoot,
                        skipFirstChangeL2Block,
                        skipWriteBlockInfoRoot,
                        currentL1InfoTreeRoot,
                        currentL1InfoTreeIndex,
                    } = batches[k];

                    const rawTxs = [];
                    for (let j = 0; j < txs.length; j++) {
                        const txData = txs[j];

                        if (txData.type === Constants.TX_CHANGE_L2_BLOCK) {
                            const rawChangeL2BlockTx = processorUtils.serializeChangeL2Block(txData);

                            // Append l1Info to l1Info object
                            extraData.l1Info[txData.indexL1InfoTree] = txData.l1Info;

                            const customRawTx = `0x${rawChangeL2BlockTx}`;
                            rawTxs.push(customRawTx);
                            txProcessed.push(txData);

                            if (!update) {
                                expect(customRawTx).to.equal(txData.customRawTx);
                            } else {
                                txData.customRawTx = customRawTx;
                            }

                            // eslint-disable-next-line no-continue
                            continue;
                        }

                        const tx = {
                            to: txData.to,
                            nonce: txData.nonce,
                            value: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.value, 'wei')),
                            gasLimit: txData.gasLimit,
                            gasPrice: processorUtils.toHexStringRlp(ethers.utils.parseUnits(txData.gasPrice, 'wei')),
                            chainId: txData.chainId,
                            data: txData.data || '0x',
                        };

                        let customRawTx;
                        const address = genesis.find((o) => o.address === txData.from);
                        const wallet = new ethers.Wallet(address.pvtKey);
                        if (tx.chainId === 0) {
                            const signData = ethers.utils.RLP.encode([
                                processorUtils.toHexStringRlp(Scalar.e(tx.nonce)),
                                processorUtils.toHexStringRlp(tx.gasPrice),
                                processorUtils.toHexStringRlp(tx.gasLimit),
                                processorUtils.addressToHexStringRlp(tx.to),
                                processorUtils.toHexStringRlp(tx.value),
                                processorUtils.toHexStringRlp(tx.data),
                                processorUtils.toHexStringRlp(tx.chainId),
                                '0x',
                                '0x',
                            ]);
                            const digest = ethers.utils.keccak256(signData);
                            const signingKey = new ethers.utils.SigningKey(address.pvtKey);
                            const signature = signingKey.signDigest(digest);
                            const r = signature.r.slice(2).padStart(64, '0'); // 32 bytes
                            const s = signature.s.slice(2).padStart(64, '0'); // 32 bytes
                            const v = (signature.v).toString(16).padStart(2, '0'); // 1 bytes
                            customRawTx = signData.concat(r).concat(s).concat(v);
                        } else {
                            const rawTxEthers = await wallet.signTransaction(tx);
                            if (!update) {
                                expect(rawTxEthers).to.equal(txData.rawTx);
                            } else {
                                txData.rawTx = rawTxEthers;
                            }
                            customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);
                        }

                        if (!update) {
                            expect(customRawTx).to.equal(txData.customRawTx);
                        } else {
                            txData.customRawTx = customRawTx;
                        }

                        if (txData.encodeInvalidData) {
                            customRawTx = customRawTx.slice(0, -6);
                        }
                        rawTxs.push(customRawTx);
                        txProcessed.push(txData);
                    }

                    const batch = await zkEVMDB.buildBatch(
                        sequencerAddress,
                        forcedHashData,
                        initBatchAccInputHash,
                        initL1InfoTreeRoot,
                        initL1InfoTreeIndex,
                        Constants.DEFAULT_MAX_TX,
                        {
                            skipFirstChangeL2Block,
                            skipWriteBlockInfoRoot,
                        },
                        {},
                    );

                    for (let j = 0; j < rawTxs.length; j++) {
                        batch.addRawTx(rawTxs[j]);
                    }

                    // execute the transactions added to the batch
                    await batch.executeTxs();
                    // consolidate state
                    await zkEVMDB.consolidate(batch);

                    const newRoot = batch.currentStateRoot;
                    if (!update) {
                        expect(smtUtils.h4toString(newRoot)).to.be.equal(newStateRoot);
                    } else {
                        testVectors[i].blobOuters[n].batches[k].newStateRoot = smtUtils.h4toString(newRoot);
                    }

                    // Check balances and nonces
                    const updatedAccounts = batch.getUpdatedAccountsBatch();
                    const newLeafs = {};
                    for (const item in updatedAccounts) {
                        const address = item;
                        const account = updatedAccounts[address];
                        newLeafs[address] = {};

                        const newLeaf = await zkEVMDB.getCurrentAccountState(address);
                        expect(newLeaf.balance.toString()).to.equal(account.balance.toString());
                        expect(newLeaf.nonce.toString()).to.equal(account.nonce.toString());

                        const smtNewLeaf = await zkEVMDB.getCurrentAccountState(address);
                        expect(smtNewLeaf.balance.toString()).to.equal(account.balance.toString());
                        expect(smtNewLeaf.nonce.toString()).to.equal(account.nonce.toString());

                        newLeafs[address].balance = account.balance.toString();
                        newLeafs[address].nonce = account.nonce.toString();

                        if (account.isContract() || address.toLowerCase() === Constants.ADDRESS_SYSTEM.toLowerCase()
                        || address.toLowerCase() === Constants.ADDRESS_GLOBAL_EXIT_ROOT_MANAGER_L2.toLowerCase()) {
                            const storage = await zkEVMDB.dumpStorage(address);
                            newLeafs[address].storage = storage;
                        }
                    }

                    if (!update) {
                        for (const [address, leaf] of Object.entries(expectedNewLeafs)) {
                            expect(lodash.isEqual(leaf, newLeafs[address])).to.be.equal(true);
                        }
                    } else {
                        testVectors[i].blobOuters[n].batches[k].expectedNewLeafs = newLeafs;
                    }

                    // Check the circuit input
                    const circuitInput = await batch.getStarkInput();

                    // Check the encode transaction match with the vector test
                    if (!update) {
                        expect(batchL2Data).to.be.equal(batch.getBatchL2Data());
                        // Check the batchHashData and the input hash
                        expect(batchHashData).to.be.equal(circuitInput.batchHashData);
                        expect(inputHash).to.be.equal(circuitInput.inputHash);
                        expect(newLocalExitRoot).to.be.equal(circuitInput.newLocalExitRoot);
                        expect(currentL1InfoTreeRoot).to.be.equal(batch.currentL1InfoTreeRoot);
                        expect(currentL1InfoTreeIndex).to.be.equal(batch.currentL1InfoTreeIndex);
                    } else {
                        testVectors[i].blobOuters[n].batches[k].batchL2Data = batch.getBatchL2Data();
                        testVectors[i].blobOuters[n].batches[k].batchHashData = circuitInput.batchHashData;
                        testVectors[i].blobOuters[n].batches[k].inputHash = circuitInput.inputHash;
                        testVectors[i].blobOuters[n].batches[k].newLocalExitRoot = circuitInput.newLocalExitRoot;
                        testVectors[i].blobOuters[n].batches[k].currentL1InfoTreeRoot = batch.currentL1InfoTreeRoot;
                        testVectors[i].blobOuters[n].batches[k].currentL1InfoTreeIndex = batch.currentL1InfoTreeIndex;
                    }

                    // update vars for the next batch
                    lastBatchInput = circuitInput;
                    initL1InfoTreeRoot = circuitInput.currentL1InfoTreeRoot;
                    initL1InfoTreeIndex = circuitInput.currentL1InfoTreeIndex;
                    initBatchAccInputHash = circuitInput.newBatchAccInputHash;

                    if (update && geninput) {
                        const dstFile = path.join(pathInputs, `input-${i}-batch-${n}-${k}.json`);
                        const folfer = path.dirname(dstFile);

                        if (!fs.existsSync(folfer)) {
                            fs.mkdirSync(folfer);
                        }

                        await fs.writeFileSync(dstFile, JSON.stringify(circuitInput, null, 2));
                    }
                }

                // aggregate batches
                const aggrBatchesData = await zkEVMDB.aggregateBatches(initBatchNum, zkEVMDB.lastBatch);

                // build blobOuter
                const { inputBlobInner, inputBlobOuter } = await zkEVMDB.buildBlobInner(
                    initBatchNum,
                    zkEVMDB.lastBatch,
                    lastBatchInput.currentL1InfoTreeRoot,
                    lastBatchInput.currentL1InfoTreeIndex,
                    lastBatchInput.newLastTimestamp,
                    zkGasLimit,
                    blobType,
                    lastBatchInput.forcedHashData,
                );

                // check expected result for batch aggregation
                const {
                    batchAggregation,
                    blobInner,
                    blobOuter,
                } = expected;

                // batch aggregation
                if (!update) {
                    expect(aggrBatchesData.aggBatchData.newStateRoot).to.be.equal(batchAggregation.newStateRoot);
                    expect(aggrBatchesData.aggBatchData.newBatchAccInputHash).to.be.equal(batchAggregation.newBatchAccInputHash);
                    expect(aggrBatchesData.aggBatchData.newLastTimestamp).to.be.equal(batchAggregation.newLastTimestamp);
                    expect(aggrBatchesData.aggBatchData.currentL1InfoTreeRoot).to.be.equal(batchAggregation.currentL1InfoTreeRoot);
                    expect(aggrBatchesData.aggBatchData.currentL1InfoTreeIndex).to.be.equal(batchAggregation.currentL1InfoTreeIndex);
                } else {
                    testVectors[i].blobOuters[n].expected.batchAggregation = {
                        newStateRoot: aggrBatchesData.aggBatchData.newStateRoot,
                        newBatchAccInputHash: aggrBatchesData.aggBatchData.newBatchAccInputHash,
                        newLastTimestamp: aggrBatchesData.aggBatchData.newLastTimestamp,
                        currentL1InfoTreeRoot: aggrBatchesData.aggBatchData.currentL1InfoTreeRoot,
                        currentL1InfoTreeIndex: aggrBatchesData.aggBatchData.currentL1InfoTreeIndex,
                    };
                }

                // blob inner
                if (!update) {
                    expect(inputBlobInner.newBlobStateRoot).to.be.equal(blobInner.newBlobStateRoot);
                    expect(inputBlobInner.newBlobAccInputHash).to.be.equal(blobInner.newBlobAccInputHash);
                    expect(inputBlobInner.newNumBlob).to.be.equal(blobInner.newNumBlob);
                    expect(inputBlobInner.finalAccBatchHashData).to.be.equal(blobInner.finalAccBatchHashData);
                    expect(inputBlobInner.localExitRootFromBlob).to.be.equal(blobInner.localExitRootFromBlob);
                    expect(inputBlobInner.isInvalid).to.be.equal(blobInner.isInvalid);
                } else {
                    testVectors[i].blobOuters[n].expected.blobInner = {
                        newBlobStateRoot: inputBlobInner.newBlobStateRoot,
                        newBlobAccInputHash: inputBlobInner.newBlobAccInputHash,
                        newNumBlob: inputBlobInner.newNumBlob,
                        finalAccBatchHashData: inputBlobInner.finalAccBatchHashData,
                        localExitRootFromBlob: inputBlobInner.localExitRootFromBlob,
                        isInvalid: inputBlobInner.isInvalid,
                    };
                }

                // blob outer
                if (!update) {
                    expect(inputBlobOuter.newStateRoot).to.be.equal(blobOuter.newStateRoot);
                    expect(inputBlobOuter.newBlobStateRoot).to.be.equal(blobOuter.newBlobStateRoot);
                    expect(inputBlobOuter.newBlobAccInputHash).to.be.equal(blobOuter.newBlobAccInputHash);
                    expect(inputBlobOuter.newNumBlob).to.be.equal(blobOuter.newNumBlob);
                    expect(inputBlobOuter.newLocalExitRoot).to.be.equal(blobOuter.newLocalExitRoot);
                } else {
                    testVectors[i].blobOuters[n].expected.blobOuter = {
                        newStateRoot: inputBlobOuter.newStateRoot,
                        newBlobStateRoot: inputBlobOuter.newBlobStateRoot,
                        newBlobAccInputHash: inputBlobOuter.newBlobAccInputHash,
                        newNumBlob: inputBlobOuter.newNumBlob,
                        newLocalExitRoot: inputBlobOuter.newLocalExitRoot,
                    };
                }

                if (update && geninput) {
                    const dstFileAggBatches = path.join(pathInputs, `input-${i}-aggbatches-${n}.json`);
                    const dstFileInner = path.join(pathInputs, `input-${i}-blob-inner-${n}.json`);
                    const dstFileOuter = path.join(pathInputs, `input-${i}-blob-outer-${n}.json`);
                    const folderAggBatches = path.dirname(dstFileAggBatches);
                    const folderInner = path.dirname(dstFileInner);
                    const folderOuter = path.dirname(dstFileOuter);

                    if (!fs.existsSync(folderAggBatches)) {
                        fs.mkdirSync(folderAggBatches);
                    }

                    if (!fs.existsSync(folderInner)) {
                        fs.mkdirSync(folderInner);
                    }

                    if (!fs.existsSync(folderOuter)) {
                        fs.mkdirSync(folderOuter);
                    }

                    await fs.writeFileSync(dstFileAggBatches, JSON.stringify(aggrBatchesData, null, 2));
                    await fs.writeFileSync(dstFileInner, JSON.stringify(inputBlobInner, null, 2));
                    await fs.writeFileSync(dstFileOuter, JSON.stringify(inputBlobOuter, null, 2));
                }
            }

            // aggregate blob outers
            const aggBlobOuters = await zkEVMDB.aggregateBlobOuters(1, zkEVMDB.lastBlob, aggregatorAddress);

            // check expected result for blob outers aggregation
            if (!update) {
                expect(aggBlobOuters.aggData.newStateRoot).to.be.equal(expectedFinal.newStateRoot);
                expect(aggBlobOuters.aggData.newBlobStateRoot).to.be.equal(expectedFinal.newBlobStateRoot);
                expect(aggBlobOuters.aggData.newBlobAccInputHash).to.be.equal(expectedFinal.newBlobAccInputHash);
                expect(aggBlobOuters.aggData.newNumBlob).to.be.equal(expectedFinal.newNumBlob);
                expect(aggBlobOuters.aggData.newLocalExitRoot).to.be.equal(expectedFinal.newLocalExitRoot);
                expect(aggBlobOuters.aggData.aggregatorAddress).to.be.equal(expectedFinal.aggregatorAddress);
                expect(aggBlobOuters.aggData.inputSnark).to.be.equal(expectedFinal.inputSnark);
            } else {
                testVectors[i].expectedFinal = {
                    newStateRoot: aggBlobOuters.aggData.newStateRoot,
                    newBlobStateRoot: aggBlobOuters.aggData.newBlobStateRoot,
                    newBlobAccInputHash: aggBlobOuters.aggData.newBlobAccInputHash,
                    newNumBlob: aggBlobOuters.aggData.newNumBlob,
                    newLocalExitRoot: aggBlobOuters.aggData.newLocalExitRoot,
                    aggregatorAddress: aggBlobOuters.aggData.aggregatorAddress,
                    inputSnark: aggBlobOuters.aggData.inputSnark,
                };
            }

            if (update && geninput) {
                const dstFileFinal = path.join(pathInputs, `input-${i}-final.json`);
                const folderFinal = path.dirname(dstFileFinal);

                if (!fs.existsSync(folderFinal)) {
                    fs.mkdirSync(folderFinal);
                }

                await fs.writeFileSync(dstFileFinal, JSON.stringify(aggBlobOuters, null, 2));
            }

            console.log(`       Completed test ${i + 1}/${testVectors.length}: ${description}`);
        }
        if (update) {
            await fs.writeFileSync(pathTests, JSON.stringify(testVectors, null, 2));
        }
    });
});
