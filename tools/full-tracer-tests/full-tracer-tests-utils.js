/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const {
    SMT, Database, blockUtils, smtUtils,
} = require('@0xpolygonhermez/zkevm-commonjs');
const buildPoseidon = require('@0xpolygonhermez/zkevm-commonjs').getPoseidon;

const { h4toString } = smtUtils;
const { initBlockHeader, fillReceiptTree, setBlockGasUsed } = blockUtils;

async function checkBlockInfoRootsFromTrace(testName) {
    const ftTrace = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/sm/sm_main/logs-full-trace/${testName}__full_trace.json`), 'utf8'));
    const poseidon = await buildPoseidon();
    const { F } = poseidon;
    // Generate block info tree from trace for each block
    for (let i = 0; i < ftTrace.block_responses.length; i++) {
        let blockInfoRoot = [F.zero, F.zero, F.zero, F.zero];
        const block = ftTrace.block_responses[i];
        let logIndex = 0;
        const db = new Database(F);
        const smt = new SMT(db, poseidon, F);
        // Init block
        blockInfoRoot = await initBlockHeader(
            smt,
            blockInfoRoot,
            block.parent_hash,
            block.coinbase,
            block.block_number,
            block.gas_limit,
            block.timestamp,
            block.ger,
            block.block_hash_l1,
        );
        // Fill tx receipt
        for (let j = 0; j < block.responses.length; j++) {
            const response = block.responses[j];
            const status = response.error === '' ? 1 : 0;
            const logs = [];
            for (let k = 0; k < response.logs.length; k++) {
                logs.push([[], response.logs[k].topics, response.logs[k].data.reduce((previousValue, currentValue) => previousValue + currentValue.toString('hex'), '')]);
            }
            blockInfoRoot = await fillReceiptTree(
                smt,
                blockInfoRoot,
                j,
                logs,
                logIndex,
                status,
                response.tx_hash_l2,
                response.cumulative_gas_used,
                response.effective_percentage,
            );
            logIndex += response.logs.length;
        }
        // Consolidate block
        blockInfoRoot = await setBlockGasUsed(smt, blockInfoRoot, block.gas_used);
        // Compare block info root
        if (h4toString(blockInfoRoot) !== block.block_info_root) {
            throw new Error(`Block info root mismatch at block ${i}`);
        }
    }
}

module.exports = {
    checkBlockInfoRootsFromTrace,
};
