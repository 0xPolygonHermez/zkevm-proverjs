const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const {
    MemDB, ZkEVMDB, processorUtils, smtUtils, getPoseidon, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

// paths files
const pathTestVector = path.join(__dirname, './testvector-gen-recursive.json');
const pathInput = path.join(__dirname, './input_gen_recursive.json');
const pathOutput = path.join(__dirname, './aggregate-batches.json');

async function main() {
    // build poseidon
    const poseidon = await getPoseidon();
    const { F } = poseidon;

    // read generate input
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const testVectorData = require(pathTestVector)[0];
    const generateData = require(pathInput);

    // get from test-vector, input_gen_recursive
    generateData.genesis = testVectorData.genesis;

    const tx0 = {
        "type": 11,
        "deltaTimestamp": "1",
        "l1Info": {
          "globalExitRoot": "0x16994edfddddb9480667b64174fc00d3b6da7290d37b8db3a16571b4ddf0789f",
          "blockHash": "0x24a5871d68723340d9eadc674aa8ad75f3e33b61d5a9db7db92af856a19270bb",
          "timestamp": "42"
        },
        "indexL1InfoTree": 0
    }

    const txsTestVector = testVectorData.txs;
    const batches = [];

    for(let i = 1 ; i < txsTestVector.length; i++) {
        const numTxsPerBatch = txsTestVector.length / 4;

        let numBatch;
        if (i < numTxsPerBatch) { 
            numBatch = 0;
        } else if ( i <  numTxsPerBatch * 2) { 
            numBatch = 1;
        } else if (i < numTxsPerBatch * 3) {
            numBatch = 2;
        } else {
            numBatch = 3;
        }

        if(!batches[numBatch]) {
            batches[numBatch] = generateData.batches[numBatch];
            batches[numBatch].txs = [
                tx0
            ]
        }
        batches[numBatch].txs.push(txsTestVector[i]);
    }

    generateData.batches = batches;

    // mapping wallets
    const walletMap = {};

    for (let i = 0; i < generateData.genesis.length; i++) {
        const {
            address, pvtKey, bytecode
        } = generateData.genesis[i];

        if(!bytecode) {
            const newWallet = new ethers.Wallet(pvtKey);
            walletMap[address] = newWallet;
        }   
    }

    // create a zkEVMDB and build a batch
    const db = new MemDB(F);
    const zkEVMDB = await ZkEVMDB.newZkEVM(
        db,
        poseidon,
        [F.zero, F.zero, F.zero, F.zero], // empty smt
        typeof generateData.oldAccInputHash === 'undefined' ? [F.zero, F.zero, F.zero, F.zero] : smtUtils.stringToH4(generateData.oldAccInputHash),
        generateData.genesis,
        null,
        null,
        generateData.chainID,
        generateData.forkID,
    );

    // Build batches
    let updatedAccounts = {};

    for (let i = 0; i < generateData.batches.length; i++) {
        const genBatchData = generateData.batches[i];

        // start batch
        const batch = await zkEVMDB.buildBatch(
            genBatchData.timestampLimit,
            genBatchData.sequencerAddr,
            smtUtils.stringToH4(genBatchData.l1InfoRoot),
            generateData.forcedBlockHashL1,
            Constants.DEFAULT_MAX_TX,
            {
                skipVerifyL1InfoRoot: false,
            },
            {},
        );

        for (let j = 0; j < genBatchData.txs.length; j++) {
            const genTx = genBatchData.txs[j];

            if (genTx.type === Constants.TX_CHANGE_L2_BLOCK) {
                const rawChangeL2BlockTx = `0x${processorUtils.serializeChangeL2Block(genTx)}`;
                batch.addRawTx(rawChangeL2BlockTx);
            } else {
                // build tx
                const tx = {
                    to: genTx.to,
                    nonce: Number(genTx.nonce),
                    value: ethers.utils.parseUnits(genTx.value, 'wei'),
                    gasLimit: genTx.gasLimit,
                    gasPrice: ethers.utils.parseUnits(genTx.gasPrice, 'wei'),
                    chainId: genTx.chainId,
                    data: genTx.data || '0x',
                };
 
                const rawTxEthers = await walletMap[genTx.from].signTransaction(tx);
                const customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);

                // add tx to batch
                batch.addRawTx(customRawTx);
            }
        }

        // build batch
        await batch.executeTxs();
        updatedAccounts = { ...updatedAccounts, ...batch.getUpdatedAccountsBatch() };
        // consolidate state
        await zkEVMDB.consolidate(batch);
        // get stark input for each batch
        const starkInput = await batch.getStarkInput();
        // write input executor for each batch
        fs.writeFileSync(path.join(__dirname, `./input_executor_${i}.json`), JSON.stringify(starkInput, null, 2));
    }

    // print new states
    const newLeafs = {};
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const item in updatedAccounts) {
        const address = item;
        const account = updatedAccounts[address];
        newLeafs[address] = {};

        newLeafs[address].balance = account.balance.toString();
        newLeafs[address].nonce = account.nonce.toString();

        const storage = await zkEVMDB.dumpStorage(address);
        const hashBytecode = await zkEVMDB.getHashBytecode(address);
        newLeafs[address].storage = storage;
        newLeafs[address].hashBytecode = hashBytecode;
    }
    generateData.expectedLeafs = newLeafs;

    // write new leafs
    fs.writeFileSync(pathInput, JSON.stringify(generateData, null, 2));

    // write aggregate batches
    const initialNumBatch = 1;
    const finalNumBatch = zkEVMDB.lastBatch;
    const { aggregatorAddress } = generateData;

    const outVerifyRecursive = await zkEVMDB.verifyMultipleBatches(initialNumBatch, finalNumBatch, aggregatorAddress);
    fs.writeFileSync(pathOutput, JSON.stringify(outVerifyRecursive, null, 2));
}

main();
