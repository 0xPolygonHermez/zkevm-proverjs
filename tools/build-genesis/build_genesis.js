/* eslint-disable guard-for-in */
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const {
    Database, ZkEVMDB, processorUtils, smtUtils, getPoseidon, Constants,
} = require('@0xpolygonhermez/zkevm-commonjs');

// paths files
const pathInput = path.join(__dirname, './input_gen.json');
const pathOutput = path.join(__dirname, './input_executor.json');

async function main() {
    // build poseidon
    const poseidon = await getPoseidon();
    const { F } = poseidon;

    // read generate input
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const generateData = require(pathInput);

    // mapping wallets
    const walletMap = {};

    for (let i = 0; i < generateData.genesis.length; i++) {
        const {
            address, pvtKey,
        } = generateData.genesis[i];

        const newWallet = new ethers.Wallet(pvtKey);
        walletMap[address] = newWallet;
    }

    // buils tx changeL2BLock
    const rawChangeL2BlockTx = `0x${processorUtils.serializeChangeL2Block(generateData.tx[0])}`;

    // build tx
    const tx = {
        to: generateData.tx[1].to,
        nonce: generateData.tx[1].nonce,
        value: ethers.utils.parseUnits(generateData.tx[1].value, 'wei'),
        gasLimit: generateData.tx[1].gasLimit,
        gasPrice: ethers.utils.parseUnits(generateData.tx[1].gasPrice, 'wei'),
        chainId: generateData.tx[1].chainId,
        data: generateData.tx[1].data || '0x',
    };

    const rawTxEthers = await walletMap[generateData.tx[1].from].signTransaction(tx);
    const customRawTx = processorUtils.rawTxToCustomRawTx(rawTxEthers);

    // create a zkEVMDB and build a batch
    const db = new Database(F);

    const zkEVMDB = await ZkEVMDB.newZkEVM(
        db,
        poseidon,
        [F.zero, F.zero, F.zero, F.zero], // empty smt
        smtUtils.stringToH4(generateData.oldAccInputHash),
        generateData.genesis,
        null,
        null,
        generateData.chainID,
        generateData.forkID,
    );

    // start batch
    const batch = await zkEVMDB.buildBatch(
        generateData.timestampLimit,
        generateData.sequencerAddr,
        smtUtils.stringToH4(generateData.l1InfoRoot),
        generateData.isForced,
        Constants.DEFAULT_MAX_TX,
        {
            skipVerifyL1InfoRoot: false,
        },
        {},
    );

    // add changeL2BlockTx to the batch
    batch.addRawTx(rawChangeL2BlockTx);

    // add tx to batch
    batch.addRawTx(customRawTx);

    // build batch
    await batch.executeTxs();
    // consolidate state
    await zkEVMDB.consolidate(batch);

    // get stark input
    const starkInput = await batch.getStarkInput();

    // print new states
    const updatedAccounts = batch.getUpdatedAccountsBatch();

    const newLeafs = {};

    // eslint-disable-next-line no-restricted-syntax
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

    fs.writeFileSync(pathOutput, JSON.stringify(starkInput, null, 2));
    fs.writeFileSync(pathInput, JSON.stringify(generateData, null, 2));
}

main();
