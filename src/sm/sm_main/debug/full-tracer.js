/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-console */
/* eslint-disable camelcase */
const fs = require('fs');
const path = require('path');
const { fea2scalar, fea2String } = require('@0xpolygonhermez/zkevm-commonjs').smtUtils;
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const { ethers } = require('ethers');
const { Scalar } = require('ffjavascript');
const {
    enableMemoryDefault, enableReturnDataDefault, disableStorageDefault, disableStackDefault,
} = require('./full-tracer-config-default.json');
const codes = require('./opcodes');
const Verbose = require('./verbose-tracer');
const {
    getTransactionHash, findOffsetLabel, getVarFromCtx,
    getRegFromCtx, getFromMemory, getConstantFromCtx, bnToPaddedHex,
} = require('./full-tracer-utils');

const opIncContext = ['CALL', 'STATICCALL', 'DELEGATECALL', 'CALLCODE', 'CREATE', 'CREATE2'];
const opCall = ['CALL', 'STATICCALL', 'DELEGATECALL', 'CALLCODE'];
const opCreate = ['CREATE', 'CREATE2'];
const zeroCostOp = ['STOP', 'REVERT', 'RETURN'];
const responseErrors = [
    'OOCS', 'OOCK', 'OOCB', 'OOCM', 'OOCA', 'OOCPA', 'OOCPO', 'OOCSH',
    'intrinsic_invalid_signature', 'intrinsic_invalid_chain_id', 'intrinsic_invalid_nonce',
    'intrinsic_invalid_gas_limit', 'intrinsic_invalid_gas_overflow', 'intrinsic_invalid_balance',
    'intrinsic_invalid_batch_gas_limit', 'intrinsic_invalid_sender_code', 'invalid_L1_info_tree_index',
    'invalid_change_l2_block_min_timestamp', 'invalidRLP', 'invalidDecodeChangeL2Block', 'invalidNotFirstTxChangeL2Block',
];

const invalidBatchErrors = ['OOCS', 'OOCK', 'OOCB', 'OOCM', 'OOCA', 'OOCPA', 'OOCPO', 'OOCSH',
    'invalid_L1_info_tree_index', 'invalid_change_l2_block_min_timestamp',
    'invalidRLP', 'invalidDecodeChangeL2Block', 'invalidNotFirstTxChangeL2Block',
];

const changeBlockErrors = ['invalid_L1_info_tree_index', 'invalid_change_l2_block_min_timestamp'];

/**
 * Tracer service to output the logs of a batch of transactions. A complete log is created with all the transactions embedded
 * for each batch and also a log is created for each transaction separatedly. The events are triggered from the zkrom and handled
 * from the zkprover
 */
class FullTracer {
    /**
     * Constructor, instantation of global vars
     * @param {String} logFileName Name of the output file
     * @param {Object} smt state tree
     * @param {Object} options full-tracer options
     * @param {Bool} options.verbose verbose options
     * @param {Bool} options.skipFirstChangeL2Block Skips verification that first transaction must be a ChangeL2BlockTx
     * @param {Object} options.tracerOptions Set tracer flags: disableStorage, disableStack, enableMemory & enableReturnData
     * @param {Object} reservedCounters ReservedCounters object obtained from executor
     */
    constructor(logFileName, smt, options, reservedCounters = {}) {
        // Opcode step traces of all processed tx
        this.full_trace = [];
        // Track opcodes called
        this.hasGaspriceOpcode = false;
        this.hasBalanceOpcode = false;
        // Logs path
        this.folderLogs = path.join(__dirname, '../logs-full-trace');
        this.pathLogFile = `${this.folderLogs}/${logFileName.split('.')[0]}__full_trace`;
        // Final output json to log
        this.finalTrace = {};

        this.depth = 1;
        this.prevCTX = 0;
        this.initGas = 0;
        // transaction index in the block
        this.txIndex = 0;
        this.deltaStorage = {};
        this.txTime = 0;
        this.txGAS = {};
        this.accBatchGas = 0;
        this.logs = [];
        this.callData = [];
        this.currentBlock = {};
        this.isForced = 0;
        // handle return from create/create2
        this.returnFromCreate = null;

        // options
        this.options = options;
        this.setTracerOptions();

        this.verbose = new Verbose(options.verbose, smt, logFileName);
        this.reservedCounters = reservedCounters;
    }

    /**
     * Set tracer options
     */
    setTracerOptions() {
        this.options.tracerOptions = typeof this.options.tracerOptions === 'undefined' ? {} : this.options.tracerOptions;
        this.enableMemory = typeof this.options.tracerOptions.enableMemory === 'undefined' ? enableMemoryDefault : this.options.tracerOptions.enableMemory;
        this.enableReturnData = typeof this.options.tracerOptions.enableReturnData === 'undefined' ? enableReturnDataDefault : this.options.tracerOptions.enableReturnData;
        this.disableStorage = typeof this.options.tracerOptions.disableStorage === 'undefined' ? disableStorageDefault : this.options.tracerOptions.disableStorage;
        this.disableStack = typeof this.options.tracerOptions.disableStack === 'undefined' ? disableStackDefault : this.options.tracerOptions.disableStack;
    }

    /**
     * Handle zkrom emitted events by name
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the event
     */
    handleEvent(ctx, tag) {
        try {
            const func = this[tag.params[0].varName];

            if (func && typeof func === 'function') {
                this[tag.params[0].varName](ctx, tag);
            } else if (tag.funcName === 'storeLog') {
                this.onStoreLog(ctx, tag);
            } else if (tag.params[0].funcName === 'onOpcode') {
                this.onOpcode(ctx, tag.params[0].params[0]);
            } else if (tag.params[0].funcName === 'onTouchedAddress' || tag.params[0].funcName === 'onTouchedSlot') {
                this.onTouched(ctx, tag.params[0].params);
            } else if (tag.params[0].funcName === 'onUpdateStorage') {
                this.onUpdateStorage(ctx, tag.params[0].params);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * Handle async zkrom emitted events by name
     * Only used in verbose mode
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the event
     */
    async handleAsyncEvent(ctx, tag) {
        try {
            if (tag.params[0].varName === 'onFinishBatch') {
                await this.printStates();
            }
        } catch (e) {
            console.log(e);
        }
    }

    async printStates() {
        await this.verbose.printPrePostState();
    }

    /// ///////
    // EVENT HANDLERS
    /// ///////

    /**
     * Handles triggered error events at the zk-rom
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the error type
     */
    onError(ctx, tag) {
        const errorName = tag.params[1].varName;
        this.verbose.printError(errorName);

        // set flag `invalid_batch` if error invalidates the full batch
        // continue function to set the error when it has been triggered
        if (invalidBatchErrors.includes(errorName)) {
            this.finalTrace.invalid_batch = true;
            this.finalTrace.error_rom = errorName;
            // finish set errors if there is no block processed
            if (Object.keys(this.currentBlock).length === 0) {
                return;
            }
        }

        // set error at block level if error is triggered by the block transaction
        if (changeBlockErrors.includes(errorName)) {
            this.currentBlock.error = errorName;

            return;
        }

        // set error at block level if error is an invalid batch and there is no transaction processed in that block
        if (invalidBatchErrors.includes(errorName) && this.currentBlock.responses.length === 0) {
            this.currentBlock.error = errorName;

            return;
        }

        // Intrinsic error should be set at tx level (not opcode)
        // Error triggered with no previous opcode set at tx level
        if ((responseErrors.includes(errorName) || this.full_trace.length === 0)) {
            this.currentBlock.responses[this.txIndex].error = errorName;

            return;
        }

        this.full_trace[this.full_trace.length - 1].error = errorName;

        // Revert logs
        for (const [key] of Object.entries(this.logs)) {
            if (Number(key) >= ctx.CTX) {
                delete this.logs[key];
            }
        }
    }

    /**
     * Handles triggered log events at the zk-rom
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the log values
     */
    onStoreLog(ctx, tag) {
        const indexLog = getRegFromCtx(ctx, tag.params[0].regName);
        const isTopic = Scalar.e(tag.params[1].num);
        const data = getRegFromCtx(ctx, tag.params[2].regName);

        if (!this.logs[ctx.CTX]) {
            this.logs[ctx.CTX] = {};
        }
        if (!this.logs[ctx.CTX][indexLog]) {
            this.logs[ctx.CTX][indexLog] = {
                data: [],
                topics: [],
            };
        }

        if (isTopic) {
            this.logs[ctx.CTX][indexLog].topics.push(data.toString(16).padStart(64, '0'));
        } else {
            // Data length is stored in C
            const regC = getRegFromCtx(ctx, 'C');
            const size = regC > 32 ? 32 : Number(regC);
            this.logs[ctx.CTX][indexLog].data.push(data.toString(16).padStart(size * 2, '0'));
        }
        // Add log info
        this.logs[ctx.CTX][indexLog].address = bnToPaddedHex(getVarFromCtx(ctx, false, 'storageAddr'), 40);
        this.logs[ctx.CTX][indexLog].block_number = Number(getVarFromCtx(ctx, true, 'blockNum'));
        this.logs[ctx.CTX][indexLog].tx_hash = this.currentBlock.responses[this.txIndex].tx_hash;
        this.logs[ctx.CTX][indexLog].tx_hash_l2 = this.currentBlock.responses[this.txIndex].tx_hash_l2;
        this.logs[ctx.CTX][indexLog].tx_index = this.txIndex;
        this.logs[ctx.CTX][indexLog].index = Number(indexLog);
    }

    /**
     * Triggered when a change L2 block transaction is detected
     * @param {Object} ctx Current context object
     */
    onStartBlock(ctx) {
        // when the event is triggered, the block number is not updated yet, so we must add 1
        // if this.options.skipFirstChangeL2Block is not active
        let blockNumber;
        if (this.options.skipFirstChangeL2Block === true) {
            blockNumber = Number(getVarFromCtx(ctx, true, 'blockNum'));
        } else {
            blockNumber = 1 + Number(getVarFromCtx(ctx, true, 'blockNum'));
        }

        this.currentBlock = {
            block_number: blockNumber,
            coinbase: ethers.utils.hexlify(getVarFromCtx(ctx, true, 'sequencerAddr')),
            gas_limit: `0x${Scalar.e(getConstantFromCtx(ctx, 'BLOCK_GAS_LIMIT')).toString(16)}`,
            responses: [],
            error: '',
            ctx: Number(ctx.CTX),
        };

        // add current block to the final trace
        this.finalTrace.block_responses.push(this.currentBlock);

        this.verbose.printBlock(`${'start'.padEnd(10)} ${this.currentBlock.block_number}`);
    }

    /**
     * Triggered when a block is finished (at beginning of next block or after finishing processing last tx of the batch)
     * @param {Object} ctx Current context object
     */
    onFinishBlock(ctx) {
        // recover changeL2Block context to get data from there
        const ctxBlock = this.currentBlock.ctx;

        // get data ctx
        this.currentBlock.ger = bnToPaddedHex(getVarFromCtx(ctx, false, 'gerL1InfoTree', ctxBlock), 64);
        this.currentBlock.block_hash_l1 = bnToPaddedHex(getVarFromCtx(ctx, false, 'blockHashL1InfoTree', ctxBlock), 64);

        // get global data
        this.currentBlock.parent_hash = bnToPaddedHex(getVarFromCtx(ctx, true, 'previousBlockHash'), 64);
        this.currentBlock.timestamp = Number(getVarFromCtx(ctx, true, 'timestamp'));
        this.currentBlock.gas_used = Number(getVarFromCtx(ctx, true, 'cumulativeGasUsed'));
        this.currentBlock.block_info_root = bnToPaddedHex(getVarFromCtx(ctx, true, 'blockInfoSR'), 64);
        this.currentBlock.block_hash = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);
        this.currentBlock.logs = [];

        // Append logs correctly formatted to block and transactions response logs
        // Put all logs in an array
        this.logs = this.logs.filter((n) => n);
        let auxLogs = [];
        for (let i = 0; i < this.logs.length; i++) {
            auxLogs = auxLogs.concat(Object.values(this.logs[i]));
        }
        // Sort auxLogs by index
        auxLogs.sort((a, b) => a.index - b.index);
        // Update index to be sequential
        for (let i = 0; i < auxLogs.length; i++) {
            const singleLog = auxLogs[i];
            // set logIndex
            // singleLog.index = i;
            singleLog.block_hash = this.currentBlock.block_hash;
            // store block log
            this.currentBlock.logs.push(singleLog);
            // store transaction log
            this.currentBlock.responses[singleLog.tx_index].logs.push(singleLog);
        }
        // Set block hash to all txs of block
        this.currentBlock.responses.forEach((tx) => {
            tx.block_hash = this.currentBlock.block_hash;
            tx.block_number = this.currentBlock.block_number;
        });

        // Reset logs
        this.logs = [];

        this.verbose.printBlock(`${'finish'.padEnd(10)} ${this.currentBlock.block_number}`);
    }

    /**
     * Triggered at the very beginning of transaction process
     * @param {Object} ctx Current context object
     */
    onProcessTx(ctx) {
        // set tx Index
        this.txIndex = Number(getVarFromCtx(ctx, true, 'txIndex'));

        // Fill context object
        const context = {};
        context.type = Number(getVarFromCtx(ctx, false, 'isCreateContract')) ? 'CREATE' : 'CALL';
        context.to = (context.type === 'CREATE') ? '0x' : bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        const calldataCTX = getVarFromCtx(ctx, false, 'calldataCTX');
        const calldataOffset = getVarFromCtx(ctx, false, 'calldataOffset');
        context.data = getFromMemory(calldataOffset, getVarFromCtx(ctx, false, 'txCalldataLen').toString(), ctx, calldataCTX);
        context.gas = String(getVarFromCtx(ctx, false, 'txGasLimit'));
        context.value = getVarFromCtx(ctx, false, 'txValue').toString();
        context.batch = '';
        context.output = '';
        context.gas_used = '';
        context.execution_time = '';
        context.old_state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);
        context.gas_price = String(getVarFromCtx(ctx, false, 'txGasPriceRLP'));
        context.chain_id = Number(getVarFromCtx(ctx, false, 'txChainId'));
        context.tx_index = this.txIndex;
        this.callData[ctx.CTX] = { type: 'CALL' };
        this.prevCTX = ctx.CTX;
        // Fill response object
        const response = {};
        const r = ethers.utils.hexlify(getVarFromCtx(ctx, false, 'txR'));
        const s = ethers.utils.hexlify(getVarFromCtx(ctx, false, 'txS'));
        const v = Number(getVarFromCtx(ctx, false, 'txV'));
        // Apply EIP-155 to v value
        const chainId = Number(getVarFromCtx(ctx, false, 'txChainId'));
        let vn = ethers.utils.hexlify(v - 27 + chainId * 2 + 35);
        const nonce = Number(getVarFromCtx(ctx, false, 'txNonce'));
        // If legacy tx, user original v
        if (!chainId) vn = ethers.utils.hexlify(v);
        const { tx_hash, rlp_tx } = getTransactionHash(
            context.to,
            Number(context.value),
            nonce,
            Number(context.gas),
            Number(context.gas_price),
            context.data,
            r,
            s,
            vn,
        );
        response.tx_hash = tx_hash;
        response.tx_hash_l2 = bnToPaddedHex(getVarFromCtx(ctx, false, 'l2TxHash'), 64);
        response.rlp_tx = rlp_tx;
        response.type = 0;
        response.return_value = '';
        response.gas_left = context.gas;
        response.gas_used = '0';
        response.gas_refunded = '0';
        response.error = '';
        response.create_address = '';
        response.state_root = context.old_state_root;
        response.full_trace = {};
        response.full_trace.context = context;
        response.full_trace.steps = [];
        response.effective_percentage = Number(getVarFromCtx(ctx, false, 'effectivePercentageRLP'));
        response.logs = [];
        response.txCounters = {
            cnt_arith: Number(ctx.cntArith),
            cnt_binary: Number(ctx.cntBinary),
            cnt_mem_align: Number(ctx.cntMemAlign),
            cnt_keccak_f: Number(ctx.cntKeccakF),
            cnt_padding_pg: Number(ctx.cntPaddingPG),
            cnt_poseidon_g: Number(ctx.cntPoseidonG),
            cnt_steps: Number(ctx.step),
            cnt_sha256_hashes: Number(ctx.cntSha256F),
        };

        // create block object if flag skipFirstChangeL2Block is active and this.currentBlock has no properties
        if (this.options.skipFirstChangeL2Block === true && Object.keys(this.currentBlock).length === 0) {
            this.onStartBlock(ctx);
        }

        // Create current tx object
        this.currentBlock.responses.push(response);
        this.txTime = Date.now();

        // Reset values
        this.depth = 1;
        this.deltaStorage = {};
        this.txGAS[this.depth] = context.gas;

        this.verbose.printTx(`${'start'.padEnd(10)} ${this.txIndex}`);
    }

    /**
     * Triggered when storage is updated in opcode processing
     * @param {Object} ctx Current context object
     * @param {Object} params event parameters. storage Key - value.
     */
    onUpdateStorage(ctx, params) {
        if (this.disableStorage) return;

        // The storage key is stored in C
        const key = ethers.utils.hexZeroPad(ethers.utils.hexlify(getRegFromCtx(ctx, params[0].regName)), 32).slice(2);
        // The storage value is stored in D
        const value = ethers.utils.hexZeroPad(ethers.utils.hexlify(getRegFromCtx(ctx, params[1].regName)), 32).slice(2);
        // Delta storage is computed for the affected contract address
        const storageAddress = ethers.utils.hexZeroPad(ethers.utils.hexlify(getVarFromCtx(ctx, false, 'storageAddr'), 64));
        // add key/value to deltaStorage, if undefined, create object
        if (typeof this.deltaStorage[storageAddress] === 'undefined') {
            this.deltaStorage[storageAddress] = {};
        }
        this.deltaStorage[storageAddress][key] = value;

        // add deltaStorage to current full_trace opcode info
        if (this.full_trace.length > 0) {
            const singleFullTrace = this.full_trace[this.full_trace.length - 1];
            singleFullTrace.storage = JSON.parse(JSON.stringify(this.deltaStorage[storageAddress]));
        }
    }

    /**
     * Triggered after processing a transaction
     * @param {Object} ctx Current context object
     */
    onFinishTx(ctx) {
        // if the 'onFinishTx' is triggered with no previous transactions, do nothing
        // this can happen when the first transaction of the batch is a changeL2BlockTx, a new block is started with no transactions or if the oock is before triggering `onStartBlock` event. In this last situation, the object this.currentBlock.responses has not been initialized
        if (typeof this.currentBlock.responses === 'undefined' || this.currentBlock.responses.length === 0) {
            return;
        }

        const response = this.currentBlock.responses[this.txIndex];

        response.full_trace.context.from = bnToPaddedHex(getVarFromCtx(ctx, true, 'txSrcOriginAddr'), 40);
        response.effective_gas_price = ethers.utils.hexlify(getVarFromCtx(ctx, true, 'txGasPrice'));
        response.cumulative_gas_used = Number(getVarFromCtx(ctx, true, 'cumulativeGasUsed'));
        // Update spent counters
        response.txCounters = {
            cnt_arith: Number(ctx.cntArith) - response.txCounters.cnt_arith,
            cnt_binary: Number(ctx.cntBinary) - response.txCounters.cnt_binary,
            cnt_mem_align: Number(ctx.cntMemAlign) - response.txCounters.cnt_mem_align,
            cnt_keccak_f: Number(ctx.cntKeccakF) - response.txCounters.cnt_keccak_f,
            cnt_padding_pg: Number(ctx.cntPaddingPG) - response.txCounters.cnt_padding_pg,
            cnt_poseidon_g: Number(ctx.cntPoseidonG) - response.txCounters.cnt_poseidon_g,
            cnt_steps: Number(ctx.step) - response.txCounters.cnt_steps,
            cnt_sha256_hashes: Number(ctx.cntSha256F) - response.txCounters.cnt_sha256_hashes,
        };

        // Set consumed tx gas
        if (Number(ctx.GAS) > Number(response.gas_left)) {
            response.gas_used = String(Number(response.gas_left));
        } else {
            response.gas_used = String(Number(response.gas_left) - Number(ctx.GAS));
        }

        response.full_trace.context.gas_used = response.gas_used;
        this.accBatchGas += Number(response.gas_used);

        response.return_value = getFromMemory(getVarFromCtx(ctx, false, 'retDataOffset').toString(), getVarFromCtx(ctx, false, 'retDataLength').toString(), ctx).slice(2);
        response.full_trace.context.output = response.return_value;

        // Set create address in case of deploy
        if (response.full_trace.context.to === '0x') {
            response.create_address = bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        }

        // Set new State Root
        response.state_root = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));

        // Set gas left
        response.gas_left = String(Number(response.gas_left) - Number(response.gas_used));

        // set refunded gas
        response.gas_refunded = Number(getVarFromCtx(ctx, false, 'gasRefund'));

        // Set tx status
        response.status = Number(getVarFromCtx(ctx, false, 'txStatus'));

        // if there is any processed opcode
        if (this.full_trace.length) {
            const lastOpcodeCall = this.full_trace[this.full_trace.length - 1];
            // Set counters of last opcode to zero
            Object.keys(lastOpcodeCall.counters).forEach((key) => {
                lastOpcodeCall.counters[key] = 0;
            });

            // get before last opcode
            const beforeLastOpcode = this.full_trace[this.full_trace.length - 2];
            //  Set gas price of last opcode if no error and is not a deploy and is not STOP (RETURN + REVERT)
            if (beforeLastOpcode && lastOpcodeCall.opcode !== 'STOP' && lastOpcodeCall.error === '' && response.full_trace.context.to !== '0x') {
                lastOpcodeCall.gas_cost = String(Number(lastOpcodeCall.gas) - Number(ctx.GAS));
            }

            response.full_trace.steps = this.full_trace;
            if (response.error === '') {
                response.error = lastOpcodeCall.error;
            }

            // set flags has_gasprice_opcode and has_balance_opcode
            response.has_gasprice_opcode = this.hasGaspriceOpcode;
            response.has_balance_opcode = this.hasBalanceOpcode;
        }

        // Check tx status
        if ((response.error === '' && response.status === 0) || (response.error !== '' && response.status === 1)) {
            throw new Error(`Invalid tx status error is "${response.error}" and status is "${response.status}"`);
        }
        // verbose
        this.verbose.printTx(`${'finish'.padEnd(10)} ${this.txIndex}`);

        // Clean aux array for next iteration
        this.full_trace = [];
        this.callData = [];

        this.hasGaspriceOpcode = false;
        this.hasBalanceOpcode = false;
    }

    /**
     * Triggered at the very beginning of a batch process
     * @param {Object} ctx Current context object
     */
    onStartBatch(ctx) {
        if (Object.keys(this.finalTrace).length > 0) {
            return;
        }
        this.isForced = Number(getVarFromCtx(ctx, true, 'isForced'));
        this.finalTrace.block_responses = [];
        this.finalTrace.error = '';
        this.finalTrace.error_rom = '';
        this.finalTrace.read_write_addresses = {};
        this.finalTrace.invalid_batch = false;

        this.verbose.printBatch('start');
        this.verbose.saveInitStateRoot(fea2String(ctx.Fr, ctx.SR));
    }

    /**
     * Triggered after processing a batch
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the log values
     */
    onFinishBatch(ctx) {
        this.finalTrace.gas_used = String(this.accBatchGas);
        this.finalTrace.cnt_arithmetics = Number(ctx.cntArith);
        this.finalTrace.cnt_binaries = Number(ctx.cntBinary);
        this.finalTrace.cnt_mem_aligns = Number(ctx.cntMemAlign);
        this.finalTrace.cnt_keccak_hashes = Number(ctx.cntKeccakF);
        this.finalTrace.cnt_poseidon_paddings = Number(ctx.cntPaddingPG);
        this.finalTrace.cnt_poseidon_hashes = Number(ctx.cntPoseidonG);
        this.finalTrace.cnt_steps = Number(ctx.step);
        this.finalTrace.cnt_sha256_hashes = Number(ctx.cntSha256F);

        // If some counter exceed, notify
        if (Number(ctx.cntArith) > Number(getConstantFromCtx(ctx, 'MAX_CNT_ARITH'))) {
            console.log('WARNING: max arith counters exceed');
        }
        if (Number(ctx.cntBinary) > Number(getConstantFromCtx(ctx, 'MAX_CNT_BINARY'))) {
            console.log('WARNING: max binary counters exceed');
        }
        if (Number(ctx.cntMemAlign) > Number(getConstantFromCtx(ctx, 'MAX_CNT_MEM_ALIGN'))) {
            console.log('WARNING: max mem align counters exceed');
        }
        if (Number(ctx.cntKeccakF) > Number(getConstantFromCtx(ctx, 'MAX_CNT_KECCAK_F'))) {
            console.log('WARNING: max keccak counters exceed');
        }
        if (Number(ctx.cntPaddingPG) > Number(getConstantFromCtx(ctx, 'MAX_CNT_PADDING_PG'))) {
            console.log('WARNING: max padding counters exceed');
        }
        if (Number(ctx.cntPoseidonG) > Number(getConstantFromCtx(ctx, 'MAX_CNT_POSEIDON_G'))) {
            console.log('WARNING: max poseidon counters exceed');
        }
        if (Number(ctx.step) > Number(getConstantFromCtx(ctx, 'MAX_CNT_STEPS'))) {
            console.log('WARNING: max steps counters exceed');
        }
        if (Number(ctx.cntSha256F) > Number(getConstantFromCtx(ctx, 'MAX_CNT_SHA256_F'))) {
            console.log('WARNING: max sha256 counters exceed');
        }

        this.finalTrace.new_state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);
        this.finalTrace.new_acc_input_hash = bnToPaddedHex(getVarFromCtx(ctx, true, 'newAccInputHash'), 64);
        this.finalTrace.new_local_exit_root = bnToPaddedHex(getVarFromCtx(ctx, true, 'newLocalExitRoot'), 64);
        this.finalTrace.new_batch_num = ethers.utils.hexlify(getVarFromCtx(ctx, true, 'newNumBatch'));

        this.verbose.printBatch('finish');
        this.verbose.saveFinalStateRoot(this.finalTrace.new_state_root);

        // Set reservedCounters
        this.finalTrace.reserveCounters = {
            cnt_reserve_steps: Number(this.reservedCounters.outOfCountersStep.reserved),
            cnt_reserve_keccak_hashes: Number(this.reservedCounters.outOfCountersKeccak.reserved),
            cnt_reserve_poseidon_hashes: Number(this.reservedCounters.outOfCountersPoseidon.reserved),
            cnt_reserve_poseidon_paddings: Number(this.reservedCounters.outOfCountersPadding.reserved),
            cnt_reserve_mem_aligns: Number(this.reservedCounters.outOfCountersMemalign.reserved),
            cnt_reserve_arithmetics: Number(this.reservedCounters.outOfCountersArith.reserved),
            cnt_reserve_binaries: Number(this.reservedCounters.outOfCountersBinary.reserved),
        };

        // Create output files and dirs
        this.exportTrace();
    }

    /**
     * Triggered just before processing an opcode
     * @param {Object} ctx Current context object
     * @param {Object} params to identify opcode values
     */
    onOpcode(ctx, params) {
        // Update depth if a variation in CTX is detected
        if (this.prevCTX > ctx.CTX) {
            this.depth -= 1;
        } else if (this.prevCTX < ctx.CTX) {
            this.depth += 1;
        }
        this.prevCTX = ctx.CTX;
        const singleInfo = {};

        // Get opcode info
        let codeId;

        if (params.op === 'number') {
            codeId = Scalar.e(params.num);
        } else {
            codeId = ctx[params.regName];
        }
        if (typeof codes[codeId] === 'undefined') {
            codeId = 0xfe;
        }
        const opcode = codes[codeId][0];

        // In case there is a log0 with 0 data length (and 0 topics), we must add it manually to logs array because it
        // wont be added detected by onStoreLog event
        if (opcode === 'LOG0') {
            const indexLog = getVarFromCtx(ctx, true, 'currentLogIndex');
            if (!this.logs[ctx.CTX]) {
                this.logs[ctx.CTX] = {};
            }
            if (!this.logs[ctx.CTX][indexLog]) {
                this.logs[ctx.CTX][indexLog] = {
                    data: [],
                    topics: [],
                };
            }
            this.logs[ctx.CTX][indexLog].data = [];
            // Add log info
            this.logs[ctx.CTX][indexLog].address = bnToPaddedHex(getVarFromCtx(ctx, false, 'storageAddr'), 40);
            this.logs[ctx.CTX][indexLog].block_number = Number(getVarFromCtx(ctx, true, 'blockNum'));
            this.logs[ctx.CTX][indexLog].tx_hash = this.currentBlock.responses[this.txIndex].tx_hash;
            this.logs[ctx.CTX][indexLog].tx_hash_l2 = this.currentBlock.responses[this.txIndex].tx_hash_l2;
            this.logs[ctx.CTX][indexLog].tx_index = this.txIndex;
            this.logs[ctx.CTX][indexLog].index = Number(indexLog);
        }
        // set flag 'has_gasprice_opcode' if opcode is GASPRICE
        if (this.hasGaspriceOpcode === false && opcode === 'GASPRICE') {
            this.hasGaspriceOpcode = true;
        }

        // set flag 'has_balance_opcode' if opcode is BALANCE
        if (this.hasBalanceOpcode === false && opcode === 'BALANCE') {
            this.hasBalanceOpcode = true;
        }

        // store memory
        const offsetCtx = Number(ctx.CTX) * 0x40000;
        let addrMem = 0;
        addrMem += offsetCtx;
        addrMem += 0x20000;

        const finalMemory = [];
        const lengthMemOffset = findOffsetLabel(ctx.rom.program, 'memLength');
        const lenMemValue = ctx.mem[offsetCtx + lengthMemOffset];
        const lenMemValueFinal = typeof lenMemValue === 'undefined' ? 0 : Math.ceil(Number(fea2scalar(ctx.Fr, lenMemValue)) / 32);

        if (this.enableMemory) {
            for (let i = 0; i < lenMemValueFinal; i++) {
                const memValue = ctx.mem[addrMem + i];
                if (typeof memValue === 'undefined') {
                    finalMemory.push('0'.padStart(64, '0'));
                    continue;
                }
                const memScalar = fea2scalar(ctx.Fr, memValue);
                let hexString = memScalar.toString(16);
                hexString = hexString.length % 2 ? `0${hexString}` : hexString;
                finalMemory.push(hexString.padStart(64, '0'));
            }
        }
        // store stack
        let addr = 0;
        addr += offsetCtx;
        addr += 0x10000;

        const finalStack = [];

        if (!this.disableStack) {
            for (let i = 0; i < ctx.SP; i++) {
                const stack = ctx.mem[addr + i];
                if (typeof stack === 'undefined') {
                    continue;
                }
                const stackScalar = fea2scalar(ctx.Fr, stack);
                const hexString = stackScalar.toString(16);
                // hexString = hexString.length % 2 ? `0${hexString}` : hexString;
                finalStack.push(`0x${hexString}`);
            }
        }
        // add info opcodes
        singleInfo.depth = this.depth;
        singleInfo.pc = Number(ctx.PC);
        singleInfo.gas = ctx.GAS.toString();
        singleInfo.gas_cost = codes[codeId][1];

        // compute: gas spent & zk-counters in previous opcode
        if (this.full_trace.length) {
            // get last opcode processed
            const prevTraceCall = this.full_trace[this.full_trace.length - 1];

            // update gas spent: (gas before - gas after)
            const gasCost = Number(prevTraceCall.gas) - Number(ctx.GAS);

            // If is a zero cost opcode, set gasCost to 0
            if (zeroCostOp.includes(prevTraceCall.opcode)) {
                prevTraceCall.gas_cost = String(0);
            } else if (opCreate.includes(prevTraceCall.opcode)) {
                // In case of error at create, we can't get the gas cost from next opcodes, so we have to use rom variables
                if (prevTraceCall.error !== '') {
                    const gasCall = getVarFromCtx(ctx, true, 'gasCall');
                    prevTraceCall.gas_cost = String(gasCost - Number(gasCall) + Number(ctx.GAS));
                } else {
                    // If is a create opcode, set gas cost as currentGas - gasCall
                    const ctxTmp = {
                        rom: ctx.rom,
                        mem: ctx.mem,
                        CTX: Number(getVarFromCtx(ctx, false, 'originCTX')),
                        Fr: ctx.Fr,
                    };
                    const gasCTX = Number(getVarFromCtx(ctxTmp, false, 'gasCTX'));
                    prevTraceCall.gas_cost = String(gasCost - Number(gasCTX));
                }
            } else if (opCall.includes(prevTraceCall.opcode) && prevTraceCall.depth !== singleInfo.depth) {
                // Only check if different depth because we are removing STOP from trace in case the call is empty (CALL-STOP)
                // Get gas CTX from origin ctx
                const ctxTmp = {
                    rom: ctx.rom,
                    mem: ctx.mem,
                    CTX: Number(getVarFromCtx(ctx, false, 'originCTX')),
                    Fr: ctx.Fr,
                };
                const gasCTX = Number(getVarFromCtx(ctxTmp, false, 'gasCTX'));
                prevTraceCall.gas_cost = String(Number(prevTraceCall.gas) - Number(gasCTX));
            } else if (prevTraceCall.depth !== singleInfo.depth) {
                // Means opcode failed with error (ex: oog, invalidStaticTx...)
                if (prevTraceCall.error !== '') {
                    prevTraceCall.gas_cost = prevTraceCall.gas;
                }
            } else {
                prevTraceCall.gas_cost = String(gasCost);
            }
            // update counters spent
            prevTraceCall.counters = {
                cnt_arith: Number(ctx.cntArith) - prevTraceCall.counters.cnt_arith,
                cnt_binary: Number(ctx.cntBinary) - prevTraceCall.counters.cnt_binary,
                cnt_mem_align: Number(ctx.cntMemAlign) - prevTraceCall.counters.cnt_mem_align,
                cnt_keccak_f: Number(ctx.cntKeccakF) - prevTraceCall.counters.cnt_keccak_f,
                cnt_padding_pg: Number(ctx.cntPaddingPG) - prevTraceCall.counters.cnt_padding_pg,
                cnt_poseidon_g: Number(ctx.cntPoseidonG) - prevTraceCall.counters.cnt_poseidon_g,
                cnt_steps: Number(ctx.step) - prevTraceCall.counters.cnt_steps,
                cnt_sha256_hashes: Number(ctx.cntSha256F) - prevTraceCall.counters.cnt_sha256_hashes,
            };

            // If gas cost is negative means gas has been added from a deeper context, it should be recalculated
            if (prevTraceCall.gas_cost < 0) {
                const beforePrevTrace = this.full_trace[this.full_trace.length - 2];
                prevTraceCall.gas_cost = String(Number(beforePrevTrace.gas) - Number(prevTraceCall.gas));
            }
            // Set gas refund for sstore opcode
            if (Number(getVarFromCtx(ctx, false, 'gasRefund')) > 0) {
                singleInfo.gas_refund = getVarFromCtx(ctx, false, 'gasRefund').toString();
                if (prevTraceCall.opcode === 'SSTORE') {
                    prevTraceCall.gas_refund = getVarFromCtx(ctx, false, 'gasRefund').toString();
                }
            }
        }

        singleInfo.opcode = opcode;
        singleInfo.op = ethers.utils.hexlify(codeId);
        singleInfo.error = '';
        singleInfo.state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);

        // Get prev step
        const prevStep = this.full_trace[this.full_trace.length - 1];

        // Add contract info
        singleInfo.contract = {};
        singleInfo.contract.address = bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        singleInfo.contract.caller = bnToPaddedHex(getVarFromCtx(ctx, false, 'txSrcAddr'), 40);
        singleInfo.contract.value = getVarFromCtx(ctx, false, 'txValue').toString();

        // Only set contract data param if it has changed (new context created or context terminated) to not overflow the trace
        if (prevStep && (opIncContext.includes(prevStep.opcode) || zeroCostOp.includes(prevStep.opcode))) {
            const calldataCTX = getVarFromCtx(ctx, false, 'calldataCTX');
            const calldataOffset = getVarFromCtx(ctx, false, 'calldataOffset');
            singleInfo.contract.data = getFromMemory(calldataOffset, getVarFromCtx(ctx, false, 'txCalldataLen').toString(), ctx, calldataCTX);
        }
        singleInfo.contract.gas = this.txGAS[this.depth];
        singleInfo.contract.type = 'CALL';

        // Round up to next multiple of 32
        singleInfo.memory_size = String(Math.ceil(Number(getVarFromCtx(ctx, false, 'memLength')) / 32) * 32);
        singleInfo.counters = {
            cnt_arith: Number(ctx.cntArith),
            cnt_binary: Number(ctx.cntBinary),
            cnt_mem_align: Number(ctx.cntMemAlign),
            cnt_keccak_f: Number(ctx.cntKeccakF),
            cnt_padding_pg: Number(ctx.cntPaddingPG),
            cnt_poseidon_g: Number(ctx.cntPoseidonG),
            cnt_steps: Number(ctx.step),
            cnt_sha256_hashes: Number(ctx.cntSha256F),
        };

        singleInfo.stack = finalStack;
        singleInfo.memory = finalMemory;

        // Handle return data
        if (this.enableReturnData) {
            // write return data from create/create2 until CTX changes
            if (this.returnFromCreate !== null) {
                if (typeof this.returnFromCreate.returnValue === 'undefined') {
                    this.returnFromCreate.returnValue = getFromMemory(getVarFromCtx(ctx, false, 'retDataOffset', this.returnFromCreate.createCTX).toString(), getVarFromCtx(ctx, false, 'retDataLength', this.returnFromCreate.createCTX).toString(), ctx, this.returnFromCreate.createCTX);
                }

                const currentCTX = Number(getVarFromCtx(ctx, true, 'currentCTX'));
                if (this.returnFromCreate.originCTX === currentCTX) {
                    singleInfo.return_data = this.returnFromCreate.returnValue;
                } else {
                    this.returnFromCreate = null;
                }
            }

            // Check if return is called from CREATE/CREATE2
            const isCreate = Number(getVarFromCtx(ctx, false, 'isCreate'));

            if (isCreate) {
                if (singleInfo.opcode === 'RETURN') {
                    this.returnFromCreate = {
                        originCTX: Number(getVarFromCtx(ctx, false, 'originCTX')),
                        createCTX: Number(ctx.CTX),
                    };
                }
            } else {
                const retDataCTX = getVarFromCtx(ctx, false, 'retDataCTX');

                if (Scalar.neq(retDataCTX, 0)) {
                    singleInfo.return_data = getFromMemory(getVarFromCtx(ctx, false, 'retDataOffset', retDataCTX).toString(), getVarFromCtx(ctx, false, 'retDataLength', retDataCTX).toString(), ctx, retDataCTX);
                }
            }
        }

        // Clone object
        const singleCallTrace = JSON.parse(JSON.stringify(singleInfo));

        // save output traces
        this.full_trace.push(singleCallTrace);

        if (prevStep && opIncContext.includes(prevStep.opcode) && prevStep.depth !== singleInfo.depth) {
            // Create new call data entry
            this.callData[ctx.CTX] = { type: prevStep.opcode };
            // Set 'gasCall' when depth has changed
            this.txGAS[this.depth] = getVarFromCtx(ctx, true, 'gasCall').toString();
            singleInfo.contract.gas = this.txGAS[this.depth]; // execute_trace does not have contracts property
            singleCallTrace.contract.gas = this.txGAS[this.depth]; // execute_trace does not have contracts property
            // take gas when a new context is created
        }

        // Set contract params depending on current call type
        singleCallTrace.contract.type = this.callData[ctx.CTX].type;
        if (singleCallTrace.contract.type === 'DELEGATECALL') {
            singleCallTrace.contract.caller = bnToPaddedHex(getVarFromCtx(ctx, false, 'storageAddr'), 40);
        }
        // If is an ether transfer, don't add stop opcode to trace
        if (singleInfo.opcode === 'STOP'
            && (typeof prevStep === 'undefined' || (opCreate.includes(prevStep.opcode) && Number(prevStep.gas_cost) <= 32000))
            && Number(getVarFromCtx(ctx, false, 'bytecodeLength')) === 0) {
            this.full_trace.pop();
        }

        this.verbose.printOpcode(opcode);
    }

    /**
     * Triggered when any address or storage is accessed
     * Only used in verbose mode
     * @param {Field} _fieldElement - field Element
     * @param {Array[Field]} _address - address accessed
     * @param {Array[Field]} _slot - slot accessed
     * @param {Array[Field]} _keyType - Parameter accessed in the state-tree
     */
    onAccessed(_fieldElement, _address, _slot, _keyType) {
        const address = fea2scalar(_fieldElement, _address);
        const addressHex = `0x${Scalar.toString(address, 16).padStart(40, '0')}`;
        let slotStorageHex;

        const keyType = fea2scalar(_fieldElement, _keyType);

        // not take into account keys tha tdo not belong to the touched tree or state tree
        if (Scalar.gt(keyType, Constants.SMT_KEY_TOUCHED_SLOTS)) {
            return;
        }

        if (Scalar.eq(keyType, Constants.SMT_KEY_TOUCHED_SLOTS) || Scalar.eq(keyType, Constants.SMT_KEY_SC_STORAGE)) {
            const slotStorage = fea2scalar(_fieldElement, _slot);
            slotStorageHex = `0x${Scalar.toString(slotStorage, 16).padStart(64, '0')}`;
        }

        this.verbose.addAccessedAddress(addressHex, slotStorageHex);
    }

    /**
     * Add an address when it is either read/write in the state-tree
     * @param {Field} _fieldElement - field Element
     * @param {Array[Field]} _address - address accessed
     * @param {Array[Field]} _keyType - Parameter accessed in the state-tree
     * @param {Scalar} _value - value read/write
     */
    addReadWriteAddress(_fieldElement, _address, _keyType, _value) {
        const address = fea2scalar(_fieldElement, _address);
        const addressHex = `0x${Scalar.toString(address, 16).padStart(40, '0')}`;

        const keyType = fea2scalar(_fieldElement, _keyType);

        // create object if it does not exist
        if (Scalar.eq(keyType, Constants.SMT_KEY_BALANCE) || Scalar.eq(keyType, Constants.SMT_KEY_NONCE)) {
            if (typeof this.finalTrace.read_write_addresses[addressHex] === 'undefined') {
                this.finalTrace.read_write_addresses[addressHex] = {
                    balance: '',
                    nonce: '',
                };
            }
        }

        if (Scalar.eq(keyType, Constants.SMT_KEY_BALANCE)) {
            this.finalTrace.read_write_addresses[addressHex].balance = Scalar.e(_value).toString();
        }

        if (Scalar.eq(keyType, Constants.SMT_KEY_NONCE)) {
            this.finalTrace.read_write_addresses[addressHex].nonce = Number(Scalar.e(_value)).toString();
        }
    }

    /**
     * Export the current trace to a file
     */
    exportTrace() {
        if (!fs.existsSync(this.folderLogs)) {
            fs.mkdirSync(this.folderLogs);
        }
        for (let i = 0; i < this.finalTrace.block_responses.length; i++) {
            for (let j = 0; j < this.finalTrace.block_responses[i].responses.length; j++) {
                // print tx trace
                fs.writeFileSync(`${this.pathLogFile}_${i + 1}_${j}.json`, JSON.stringify(this.finalTrace.block_responses[i].responses[j], null, 2));
            }
        }
        // Print batch trace
        fs.writeFileSync(`${this.pathLogFile}.json`, JSON.stringify(this.finalTrace, null, 2));
    }

    /**
     * Prints outcome of the execution
     * @param {Object} returnData required outputs
     */
    printReturn(returnData) {
        this.verbose.printSaveReturn(returnData);
    }
}

module.exports = FullTracer;
