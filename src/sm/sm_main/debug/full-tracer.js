/* eslint-disable no-continue */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-console */
/* eslint-disable camelcase */
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { Scalar } = require('ffjavascript');
const { fea2scalar, fea2String } = require('@0xpolygonhermez/zkevm-commonjs').smtUtils;
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');

const {
    getTransactionHash, findOffsetLabel, getVarFromCtx, getCalldataFromStack,
    getRegFromCtx, getFromMemory, getConstantFromCtx, bnToPaddedHex,
} = require('./full-tracer-utils');
const { responseErrors } = require('./constants-full-tracer');
const codes = require('./opcodes');
const Verbose = require('./verbose-tracer');

const configTraces = require('./full-tracer-config.json');

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
     */
    constructor(logFileName, smt, options) {
        // Opcode step traces of all processed tx
        this.call_trace = [];
        this.execution_trace = [];
        // Logs path
        this.folderLogs = path.join(__dirname, '../logs-full-trace');
        this.pathLogFile = `${this.folderLogs}/${logFileName.split('.')[0]}__full_trace`;
        // Final output json to log
        this.finalTrace = {};

        this.depth = 0;
        this.initGas = 0;
        this.txCount = 0;
        this.deltaStorage = { 0: {} };
        this.txTime = 0;
        this.txGAS = {};
        this.accBatchGas = 0;
        this.logs = [];

        // options
        this.options = options;
        this.verbose = new Verbose(options.verbose, smt, logFileName);
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

        /*
         * Intrinsic error should be set at tx level (not opcode)
         * Error triggered with no previous opcode set at tx level
         */
        if (responseErrors.includes(errorName) || this.execution_trace.length === 0) {
            if (this.finalTrace.responses[this.txCount]) {
                this.finalTrace.responses[this.txCount].error = errorName;
            } else {
                this.finalTrace.responses[this.txCount] = { error: errorName };
            }

            return;
        }

        this.execution_trace[this.execution_trace.length - 1].error = errorName;

        // Revert logs
        this.logs[ctx.CTX] = null;
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
            this.logs[ctx.CTX][indexLog].topics.push(data.toString(16).padStart(32, '0'));
        } else {
            this.logs[ctx.CTX][indexLog].data.push(data.toString(16).padStart(32, '0'));
        }
        // Add log info
        this.logs[ctx.CTX][indexLog].address = bnToPaddedHex(getVarFromCtx(ctx, false, 'storageAddr'), 40);
        this.logs[ctx.CTX][indexLog].batch_number = ethers.utils.hexlify(getVarFromCtx(ctx, true, 'newNumBatch'));
        this.logs[ctx.CTX][indexLog].tx_hash = this.finalTrace.responses[this.txCount].tx_hash;
        this.logs[ctx.CTX][indexLog].tx_index = this.txCount;
        this.logs[ctx.CTX][indexLog].index = Number(indexLog);
    }

    /**
     * Triggered at the very beginning of transaction process
     * @param {Object} ctx Current context object
     */
    onProcessTx(ctx) {
        // Fill context object
        const context = {};
        context.type = Number(getVarFromCtx(ctx, false, 'isCreateContract')) ? 'CREATE' : 'CALL';
        context.to = (context.type === 'CREATE') ? '0x' : bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        context.data = getCalldataFromStack(ctx, 0, getVarFromCtx(ctx, false, 'txCalldataLen').toString());
        context.gas = ethers.utils.hexlify(getVarFromCtx(ctx, false, 'txGasLimit'));
        context.value = getVarFromCtx(ctx, false, 'txValue').toString();
        context.batch = '';
        context.output = '';
        context.gas_used = '';
        context.execution_time = '';
        context.old_state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);
        context.gas_price = ethers.utils.hexlify(getVarFromCtx(ctx, false, 'txGasPriceRLP'));
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
            context.gas,
            context.gas_price,
            context.data,
            r,
            s,
            vn,
        );
        response.tx_hash = tx_hash;
        response.rlp_tx = rlp_tx;
        response.type = 0;
        response.return_value = '';
        response.gas_left = context.gas;
        response.gas_used = '0';
        response.gas_refunded = '0';
        response.error = '';
        response.create_address = '';
        response.state_root = context.old_state_root;
        response.logs = [];
        response.call_trace = {};
        response.call_trace.context = context;
        response.call_trace.steps = [];
        response.execution_trace = [];

        response.txCounters = {
            cnt_arith: Number(ctx.cntArith),
            cnt_binary: Number(ctx.cntBinary),
            cnt_mem_align: Number(ctx.cntMemAlign),
            cnt_keccak_f: Number(ctx.cntKeccakF),
            cnt_padding_pg: Number(ctx.cntPaddingPG),
            cnt_poseidon_g: Number(ctx.cntPoseidonG),
            cont_steps: Number(ctx.step),
        };
        // Create current tx object
        this.finalTrace.responses.push(response);
        this.txTime = Date.now();

        // Reset values
        this.depth = 0;
        this.deltaStorage = { 0: {} };
        this.txGAS[this.depth] = {
            forwarded: Scalar.fromString(context.gas, 16).toString(),
            remaining: '0',
        };

        this.verbose.printTx(`start ${this.txCount}`);
    }

    /**
     * Triggered when storage is updated in opcode processing
     * @param {Object} ctx Current context object
     * @param {Object} params event parameters. storage Key - value
     */
    onUpdateStorage(ctx, params) {
        if (configTraces.disable_storage === true || configTraces.tx_hash_to_generate_execute_trace === false) {
            return;
        }

        // The storage key is stored in C
        const key = ethers.utils.hexZeroPad(ethers.utils.hexlify(getRegFromCtx(ctx, params[0].regName)), 32).slice(2);
        // The storage value is stored in D
        const value = ethers.utils.hexZeroPad(ethers.utils.hexlify(getRegFromCtx(ctx, params[1].regName)), 32).slice(2);

        // add key/value to deltaStorage
        this.deltaStorage[this.depth][key] = value;

        // add deltaStorage to current execution_trace opcode info
        if (this.execution_trace.length > 0) {
            const singleExecuteTrace = this.execution_trace[this.execution_trace.length - 1];
            singleExecuteTrace.storage = JSON.parse(JSON.stringify(this.deltaStorage[this.depth]));
        }
    }

    /**
     * Triggered after processing a transaction
     * @param {Object} ctx Current context object
     */
    onFinishTx(ctx) {
        const response = this.finalTrace.responses[this.txCount];

        response.call_trace.context.from = bnToPaddedHex(getVarFromCtx(ctx, true, 'txSrcOriginAddr'), 40);

        // Update spent counters
        response.txCounters = {
            cnt_arith: Number(ctx.cntArith) - response.txCounters.cnt_arith,
            cnt_binary: Number(ctx.cntBinary) - response.txCounters.cnt_binary,
            cnt_mem_align: Number(ctx.cntMemAlign) - response.txCounters.cnt_mem_align,
            cnt_keccak_f: Number(ctx.cntKeccakF) - response.txCounters.cnt_keccak_f,
            cnt_padding_pg: Number(ctx.cntPaddingPG) - response.txCounters.cnt_padding_pg,
            cnt_poseidon_g: Number(ctx.cntPoseidonG) - response.txCounters.cnt_poseidon_g,
            cont_steps: Number(ctx.step) - response.txCounters.cont_steps,
        };

        // Set consumed tx gas
        if (Number(ctx.GAS) > Number(response.gas_left)) {
            response.gas_used = String(Number(response.gas_left));
        } else {
            response.gas_used = String(Number(response.gas_left) - Number(ctx.GAS));
        }

        response.call_trace.context.gas_used = response.gas_used;
        this.accBatchGas += Number(response.gas_used);

        // Set return data, in case of deploy, get return buffer from stack
        if (response.call_trace.context.to === '0x') {
            response.return_value = getCalldataFromStack(ctx, getVarFromCtx(ctx, false, 'retDataOffset').toString(), getVarFromCtx(ctx, false, 'retDataLength').toString());
        } else {
            response.return_value = getFromMemory(getVarFromCtx(ctx, false, 'retDataOffset').toString(), getVarFromCtx(ctx, false, 'retDataLength').toString(), ctx);
        }
        response.call_trace.context.output = response.return_value;

        // Set create address in case of deploy
        if (response.call_trace.context.to === '0x') {
            response.create_address = bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        }

        // Set new State Root
        response.state_root = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));

        // Set gas left
        response.gas_left = String(Number(response.gas_left) - Number(response.gas_used));

        // if there is any processed opcode in execution trace
        if (configTraces.tx_hash_to_generate_execute_trace) {
            if (this.execution_trace.length) {
                const lastOpcodeExecution = this.execution_trace[this.execution_trace.length - 1];

                // set refunded gas
                response.gas_refunded = lastOpcodeExecution.gas_refund;

                //  Set gas price of last opcode
                if (lastOpcodeExecution) {
                    lastOpcodeExecution.gas_cost = String(Number(lastOpcodeExecution.gas) - Number(response.gas_left));
                }

                response.execution_trace = this.execution_trace;

                if (response.error === '') {
                    response.error = lastOpcodeExecution.error;
                }
            }
        }

        if (configTraces.tx_hash_to_generate_call_trace) {
            if (this.call_trace.length) {
                const lastOpcodeCall = this.call_trace[this.call_trace.length - 1];

                // set refunded gas
                response.gas_refunded = lastOpcodeCall.gas_refund;

                // Set counters of last opcode to zero
                Object.keys(lastOpcodeCall.counters).forEach((key) => {
                    lastOpcodeCall.counters[key] = 0;
                });

                //  Set gas price of last opcode
                if (lastOpcodeCall) {
                    lastOpcodeCall.gas_cost = String(Number(lastOpcodeCall.gas) - Number(response.gas_left));
                }

                response.call_trace.steps = this.call_trace;
                if (response.error === '') {
                    response.error = lastOpcodeCall.error;
                }
            }
        }

        // Append logs correctly formatted to response logs
        this.logs = this.logs.filter((n) => n); // Remove null values
        // eslint-disable-next-line no-restricted-syntax
        for (const l of this.logs) {
            this.finalTrace.responses[this.txCount].logs = this.finalTrace.responses[this.txCount].logs.concat(Object.values(l));
        }

        // create directory if it does not exist
        if (!fs.existsSync(this.folderLogs)) {
            fs.mkdirSync(this.folderLogs);
        }
        // write single tx trace
        fs.writeFileSync(`${this.pathLogFile}_${this.txCount}.json`, JSON.stringify(this.finalTrace.responses[this.txCount], null, 2));

        // Increase transaction count
        this.txCount += 1;

        // Clean aux array for next iteration
        this.call_trace = [];
        this.execution_trace = [];
        this.logs = [];

        // verbose
        this.verbose.printTx(`finish ${this.txCount}`);
    }

    /**
     * Trigered at the very beginning of a batch process
     * @param {Object} ctx Current context object
     */
    onStartBatch(ctx) {
        if (Object.keys(this.finalTrace).length > 0) {
            return;
        }
        this.finalTrace.responses = [];
        this.finalTrace.error = '';
        this.finalTrace.read_write_addresses = {};
        this.verbose.printBatch('start');
        this.verbose.saveInitStateRoot(fea2String(ctx.Fr, ctx.SR));
    }

    /**
     * Triggered after processing a batch
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the log values
     */
    onFinishBatch(ctx) {
        this.finalTrace.cumulative_gas_used = String(this.accBatchGas);
        this.finalTrace.cnt_arithmetics = Number(ctx.cntArith);
        this.finalTrace.cnt_binaries = Number(ctx.cntBinary);
        this.finalTrace.cnt_mem_aligns = Number(ctx.cntMemAlign);
        this.finalTrace.cnt_keccak_hashes = Number(ctx.cntKeccakF);
        this.finalTrace.cnt_poseidon_paddings = Number(ctx.cntPaddingPG);
        this.finalTrace.cnt_poseidon_hashes = Number(ctx.cntPoseidonG);
        this.finalTrace.cnt_steps = Number(ctx.step);
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
            console.log('WARNING: max keccack counters exceed');
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

        this.finalTrace.new_state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);
        this.finalTrace.new_acc_input_hash = bnToPaddedHex(getVarFromCtx(ctx, true, 'newAccInputHash'), 64);
        this.finalTrace.responses.forEach((r) => {
            r.call_trace.context.batch = this.finalTrace.new_acc_input_hash;
            r.logs.forEach((l) => l.batch_hash = this.finalTrace.new_acc_input_hash);
        });
        this.finalTrace.new_local_exit_root = bnToPaddedHex(getVarFromCtx(ctx, true, 'newLocalExitRoot'), 64);
        this.finalTrace.new_batch_num = ethers.utils.hexlify(getVarFromCtx(ctx, true, 'newNumBatch'));

        this.verbose.printBatch('finish');
        this.verbose.saveFinalStateRoot(this.finalTrace.new_state_root);

        // Create ouput files and dirs
        this.exportTrace();
    }

    /**
     * Triggered just before processing an opcode
     * @param {Object} ctx Current context object
     * @param {Object} params to identify opcode values
     */
    onOpcode(ctx, params) {
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
        const opcode = codes[codeId].slice(2);

        // Check depth changes and update depth
        const newDepth = Number(getVarFromCtx(ctx, true, 'depth'));
        const decreaseDepth = (newDepth < this.depth);
        const increaseDepth = (newDepth > this.depth);
        if (decreaseDepth || increaseDepth) {
            this.depth = newDepth;
        }

        // get previous opcode processed
        const numOpcodes = this.call_trace.length;

        const prevTraceCall = numOpcodes ? this.call_trace[numOpcodes - 1] : undefined;
        const prevTraceExecution = numOpcodes ? this.execution_trace[numOpcodes - 1] : undefined;

        // If it is an ether transfer, do not add stop opcode to trace
        if (singleInfo.opcode === 'STOP'
            && (typeof prevTraceCall === 'undefined' || increaseDepth)
            && Number(getVarFromCtx(ctx, false, 'bytecodeLength')) === 0) {
            return;
        }

        // store memory
        const offsetCtx = Number(ctx.CTX) * 0x40000;

        if (configTraces.enable_memory === true) {
            let addrMem = 0;
            addrMem += offsetCtx;
            addrMem += 0x20000;

            const finalMemory = [];
            const lengthMemOffset = findOffsetLabel(ctx.rom.program, 'memLength');
            const lenMemValue = ctx.mem[offsetCtx + lengthMemOffset];
            const lenMemValueFinal = typeof lenMemValue === 'undefined' ? 0 : Math.ceil(Number(fea2scalar(ctx.Fr, lenMemValue)) / 32);

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

            singleInfo.memory = finalMemory;
        }

        // store stack
        if (configTraces.disable_stack === false) {
            const finalStack = [];

            let addr = 0;
            addr += offsetCtx;
            addr += 0x10000;

            // read stack
            for (let i = 0; i < ctx.SP; i++) {
                const stack = ctx.mem[addr + i];
                if (typeof stack === 'undefined') {
                    continue;
                }
                const stackScalar = fea2scalar(ctx.Fr, stack);
                let hexString = stackScalar.toString(16);
                hexString = hexString.length % 2 ? `0${hexString}` : hexString;
                finalStack.push(`0x${hexString}`);
            }

            // save stack to opcode trace
            singleInfo.stack = finalStack;
        }

        // add info opcodes
        singleInfo.depth = this.depth + 1;
        singleInfo.pc = Number(ctx.PC);
        singleInfo.gas = ctx.GAS.toString();

        singleInfo.opcode = opcode;
        singleInfo.gas_refund = getVarFromCtx(ctx, false, 'gasRefund').toString();
        singleInfo.op = ethers.utils.hexlify(codeId);
        singleInfo.error = '';
        singleInfo.state_root = bnToPaddedHex(fea2scalar(ctx.Fr, ctx.SR), 64);

        // Set gas forwarded to a new context and save gas left in previous context
        if (increaseDepth) {
            // get gas forwarded to current ctx
            const gasForwarded = Scalar.e(ctx.GAS).toString();

            // get gas remaining in origin context
            const originCTX = Number(getVarFromCtx(ctx, false, 'originCTX'));
            const ctxTmp = {
                rom: ctx.rom,
                mem: ctx.mem,
                CTX: originCTX,
                Fr: ctx.Fr,
            };
            const gasRemaining = Number(getVarFromCtx(ctxTmp, false, 'gasCTX')).toString();

            this.txGAS[this.depth] = {
                forwarded: gasForwarded,
                remaining: gasRemaining,
            };
        }

        // Add contract info
        singleInfo.contract = {};
        singleInfo.contract.address = bnToPaddedHex(getVarFromCtx(ctx, false, 'txDestAddr'), 40);
        singleInfo.contract.caller = bnToPaddedHex(getVarFromCtx(ctx, false, 'txSrcAddr'), 40);
        singleInfo.contract.value = getVarFromCtx(ctx, false, 'txValue').toString();
        singleInfo.contract.data = getCalldataFromStack(ctx);
        singleInfo.contract.gas = this.txGAS[this.depth].forwarded;

        // update previous opcode: gas spent & zk-counters
        if (numOpcodes) {
            // update gas spent: (gas before - gas after)
            const gasCost = Number(prevTraceCall.gas) - Number(ctx.GAS);
            prevTraceCall.gas_cost = String(gasCost);
            prevTraceExecution.gas_cost = String(gasCost);

            // update counters spent
            prevTraceCall.counters = {
                cnt_arith: Number(ctx.cntArith) - prevTraceCall.counters.cnt_arith,
                cnt_binary: Number(ctx.cntBinary) - prevTraceCall.counters.cnt_binary,
                cnt_mem_align: Number(ctx.cntMemAlign) - prevTraceCall.counters.cnt_mem_align,
                cnt_keccak_f: Number(ctx.cntKeccakF) - prevTraceCall.counters.cnt_keccak_f,
                cnt_padding_pg: Number(ctx.cntPaddingPG) - prevTraceCall.counters.cnt_padding_pg,
                cnt_poseidon_g: Number(ctx.cntPoseidonG) - prevTraceCall.counters.cnt_poseidon_g,
                cont_steps: Number(ctx.step) - prevTraceCall.counters.cont_steps,
            };

            // If gas cost is negative means gas has been added from a deeper context, it should be recalculated
            // going to previous depth
            if (decreaseDepth) {
                // get gas cost consumed by current ctx except last opcode: gasForwarded - gasSecondLast
                const gasConsumedExceptLastOpcode = Number(this.txGAS[this.depth + 1].forwarded) - Number(prevTraceCall.gas);
                // get gas remaining at the end of the previous context
                const gasEndPreviousCtx = Number(singleInfo.gas) - Number(this.txGAS[this.depth + 1].remaining);
                // get gas spend by previous ctx
                const gasSpendPreviousCtx = Number(this.txGAS[this.depth + 1].forwarded) - gasEndPreviousCtx;
                // compute gas spend by the last opcode
                const gasLastOpcode = gasSpendPreviousCtx - gasConsumedExceptLastOpcode;
                // set opcode gas cost to traces
                prevTraceCall.gas_cost = gasLastOpcode.toString();
                prevTraceExecution.gas_cost = gasLastOpcode.toString();
            }
        }

        // Round up to next multiple of 32
        singleInfo.memory_size = String(Math.ceil(Number(getVarFromCtx(ctx, false, 'memLength')) / 32) * 32);
        singleInfo.counters = {
            cnt_arith: Number(ctx.cntArith),
            cnt_binary: Number(ctx.cntBinary),
            cnt_mem_align: Number(ctx.cntMemAlign),
            cnt_keccak_f: Number(ctx.cntKeccakF),
            cnt_padding_pg: Number(ctx.cntPaddingPG),
            cnt_poseidon_g: Number(ctx.cntPoseidonG),
            cont_steps: Number(ctx.step),
        };

        if (increaseDepth) {
            this.deltaStorage[this.depth + 1] = {};
        }

        // Return data
        if (configTraces.enable_return_data === true) {
            // TODO: add data of return previous call
            singleInfo.return_data = [];
        }

        // save call trace
        if (configTraces.tx_hash_to_generate_call_trace) {
            const singleCallTrace = JSON.parse(JSON.stringify(singleInfo));

            // delete unnecesary keys in `call_trace`
            delete singleCallTrace.memory_size;

            // save call traces
            this.call_trace.push(singleCallTrace);
        }

        // execution trace
        if (configTraces.tx_hash_to_generate_execute_trace) {
            const singleExecuteTrace = JSON.parse(JSON.stringify(singleInfo));

            // delete unnecesary keys in `execution_trace`
            delete singleExecuteTrace.memory_size;
            delete singleExecuteTrace.contract;
            delete singleExecuteTrace.state_root;
            delete singleExecuteTrace.counters;

            // save execution traces
            this.execution_trace.push(singleExecuteTrace);
        }

        // verbose options
        this.verbose.printOpcode(opcode);
    }

    /**
     * Triggered when any address or storage is accesed
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
        fs.writeFileSync(`${this.pathLogFile}.json`, JSON.stringify(this.finalTrace, null, 2));
    }
}

module.exports = FullTracer;
