const fs = require("fs");
const path = require("path");
const codes = require("../src/opcodes");
const { scalar2fea, fea2scalar } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { ethers } = require("ethers");
const opIncContext = ['CALL', 'STATICCALL', 'DELEGATECALL', 'CALLCODE', 'CREATE', 'CREATE2'];
const opDecContext = ['SELFDESTRUCT', 'STOP', 'RETURN'];
const { Scalar } = require("ffjavascript");
const generate_call_trace = true;
const generate_execute_trace = true;

// Tracer service to output the logs of a batch of transactions. A complete log is created with all the transactions embedded
// for each batch and also a log is created for each transaction separatedly. The events are triggered from the zkrom and handled
// from the zkprover
class FullTracer {

    constructor(logFileName) {
        // Opcode step traces of the all the processed tx
        this.info = [];
        // Stack of the transaction
        this.fullStack = [];
        // Opcode step traces of the current processed tx
        this.call_trace = [];
        this.execution_trace = [];
        // Logs path
        this.folderLogs = path.join(__dirname, "../logs-full-trace");
        this.pathLogFile = path.join(this.folderLogs, `${logFileName}__full_trace`);
        this.labels = {};
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
    }

    // Handle zkrom emitted events by name
    async handleEvent(ctx, tag) {
        try {
            const func = this[tag.params[0].varName];
            if (func && typeof func === "function") {
                this[tag.params[0].varName](ctx, tag);
            } else if (tag.funcName === 'storeLog') {
                this.onStoreLog(ctx, tag);
            } else if (tag.params[0].funcName === 'onOpcode') {
                this.onOpcode(ctx, tag.params[0].params[0]);
            }

        } catch (e) {
            console.log(e);
        }
    }

    //////////
    // EVENT HANDLERS
    //////////

    onError(ctx, tag) {
        const errorName = tag.params[1].varName
        this.info[this.info.length - 1].error = errorName;
        // Dont decrease depth if the error is from processing a RETURN opcode
        const lastOpcode = this.info[this.info.length - 1]        
        if (!opDecContext.includes(lastOpcode.opcode)) {
            this.depth--
        }
        // Revert logs
        this.logs[ctx.CTX] = null
    }

    onStoreLog(ctx, tag) {
        const indexLog = this.getRegFromCtx(ctx, tag.params[0].regName);
        const isTopic = Scalar.e(tag.params[1].num);
        const data = this.getRegFromCtx(ctx, tag.params[2].regName);

        if (!this.logs[ctx.CTX]) {
            this.logs[ctx.CTX] = {}
        }
        if (!this.logs[ctx.CTX][indexLog]) {
            this.logs[ctx.CTX][indexLog] = {
                data: [],
                topics: []
            }
        }

        if (isTopic) {
            this.logs[ctx.CTX][indexLog].topics.push(data.toString(16).padStart(32, "0"));
        } else {
            this.logs[ctx.CTX][indexLog].data.push(data.toString(16).padStart(32, "0"));
        }
        //Add log info
        this.logs[ctx.CTX][indexLog].address = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txDestAddr"));
        this.logs[ctx.CTX][indexLog].batch_number = this.finalTrace.numBatch;
        this.logs[ctx.CTX][indexLog].tx_hash = this.finalTrace.responses[this.txCount].tx_hash;
        this.logs[ctx.CTX][indexLog].tx_index = this.txCount;
        this.logs[ctx.CTX][indexLog].batch_hash = this.finalTrace.globalHash;
        this.logs[ctx.CTX][indexLog].index = Number(indexLog);
    }

    // Triggered at the very beginning of transaction process
    onProcessTx(ctx, tag) {

        //Fill context object
        const context = {};
        context.from = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txSrcAddr"));
        context.to = this.getFormatedTo(ctx);
        context.type = (context.to === "0x0") ? "CREATE" : "CALL";
        context.data = this.getCalldataFromStack(ctx, 0, this.getVarFromCtx(ctx, false, "txCalldataLen").toString());
        context.gas = this.getVarFromCtx(ctx, false, "txGasLimit").toString();
        context.value = this.getVarFromCtx(ctx, false, "txValue").toString();
        context.batch = this.finalTrace.globalHash;
        context.output = ""
        context.gas_used = "";
        context.execution_time = ""
        context.old_state_root = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));
        context.nonce = Number(this.getVarFromCtx(ctx, false, "txNonce"));
        context.gasPrice = this.getVarFromCtx(ctx, false, "txGasPrice").toString();
        context.chainId = Number(this.getVarFromCtx(ctx, false, "txChainId"));

        //Fill response object
        const response = {};
        response.tx_hash = this.getTransactionHash(context.to, context.value, context.nonce, context.gas, context.gasPrice, context.data, context.chainId, ctx);
        response.type = 0;
        response.return_value = "";
        response.gas_left = context.gas;
        response.gas_used = "0";
        response.gas_refunded = "0";
        response.error = "";
        response.create_address = "";
        response.state_root = context.old_state_root;
        response.logs = [];
        response.unprocessed_transaction = false;
        response.call_trace = {}
        response.call_trace.context = context;
        response.call_trace.steps = []
        response.execution_trace = []

        // Create current tx object
        this.finalTrace.responses.push(response);
        this.txTime = Date.now();
        //Reset values
        this.depth = 0;
        this.deltaStorage = { 0: {} };
        this.txGAS[this.depth] = context.gas;
    }

    // Triggered when storage is updated in opcode processing
    onUpdateStorage(ctx) {
        // The storage key is stored in C
        const key = ethers.utils.hexZeroPad(ethers.utils.hexlify(this.getRegFromCtx(ctx, "C")), 32).slice(2);
        // The storage value is stored in D
        const value = ethers.utils.hexZeroPad(ethers.utils.hexlify(this.getRegFromCtx(ctx, "D")), 32).slice(2);
        this.deltaStorage[this.depth][key] = value;
    }

    // Triggered after processing a transaction
    onFinishTx(ctx) {
        const response = this.finalTrace.responses[this.txCount];

        //Set consumed tx gas
        response.gas_used = String(Number(response.gas_left) - Number(ctx.GAS));
        response.call_trace.context.gas_used = response.gas_used;
        this.accBatchGas += Number(response.gas_used);

        // Set return data, in case of deploy, get return buffer from stack
        if (response.call_trace.context.to === '0x0') {
            response.return_value = this.getCalldataFromStack(ctx, this.getVarFromCtx(ctx, false, "retDataOffset").toString(), this.getVarFromCtx(ctx, false, "retDataLength").toString());
        } else {
            response.return_value = this.getFromMemory(this.getVarFromCtx(ctx, false, "retDataOffset").toString(), this.getVarFromCtx(ctx, false, "retDataLength").toString(), ctx);
        }
        response.call_trace.context.return_value = response.return_value;

        //Set create address in case of deploy
        if (response.call_trace.context.to === '0x0') {
            response.create_address = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txDestAddr"));
        }
        //Set gas left
        response.gas_left = String(Number(response.gas_left) - Number(response.gas_used))
        //Set new State Root
        //response.newStateRoot = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));
        //If processed opcodes
        if (this.info.length) {
            const lastOpcode = this.info[this.info.length - 1];
            const beforeLastOpcode = this.info[this.info.length - 2];
            //  Set gas price of last opcode
            if (beforeLastOpcode) {
                lastOpcode.gas_cost = String(Number(beforeLastOpcode.remaining_gas) - Number(lastOpcode.remaining_gas));
            }
            //Add last opcode
            this.call_trace.push(lastOpcode);
            this.execution_trace.push(lastOpcode);
            if (this.call_trace.length < this.info.length) {
                this.call_trace.shift();
                this.execution_trace.shift();
            }
            this.finalTrace.responses[this.finalTrace.responses.length - 1].execution_trace = this.execution_trace;
            this.finalTrace.responses[this.finalTrace.responses.length - 1].call_trace.steps = this.call_trace;
            this.finalTrace.responses[this.finalTrace.responses.length - 1].error = lastOpcode.error;

            // Remove not requested data
            if (!generate_execute_trace) {
                delete this.finalTrace.responses[this.finalTrace.responses.length - 1].execution_trace
            }
            if (!generate_call_trace) {
                delete this.finalTrace.responses[this.finalTrace.responses.length - 1].call_trace
            }
        }

        // Clean aux array for next iteration
        this.call_trace = [];
        this.execution_trace = [];
        if (!fs.existsSync(this.folderLogs)) {
            fs.mkdirSync(this.folderLogs);
        }

        // Append logs correctly formatted
        // Remove null values
        this.logs = this.logs.filter(n => n)
        // Append to response logs
        for (const l of this.logs) {
            this.finalTrace.responses[this.txCount].logs = this.finalTrace.responses[this.txCount].logs.concat(Object.values(l));
        }

        fs.writeFileSync(`${this.pathLogFile}_${this.txCount}.json`, JSON.stringify(this.finalTrace.responses[this.txCount], null, 2));
        // Increase transaction count
        this.txCount++;
    }

    // Trigered at the very beginning of a batch process
    onStartBatch(ctx, tag) {
        if (Object.keys(this.finalTrace).length > 0) {
            return;
        }
        this.finalTrace.batchHash = ethers.utils.hexlify(this.getRegFromCtx(ctx, tag.params[1].regName));
        this.finalTrace.old_state_root = ethers.utils.hexlify(this.getVarFromCtx(ctx, true, "oldStateRoot"));
        this.finalTrace.globalHash = ethers.utils.hexlify(this.getVarFromCtx(ctx, true, "globalHash"));
        this.finalTrace.numBatch = Number(this.getVarFromCtx(ctx, true, "numBatch"));
        this.finalTrace.timestamp = Number(this.getVarFromCtx(ctx, true, "timestamp"));
        this.finalTrace.sequencerAddr = ethers.utils.hexlify(this.getVarFromCtx(ctx, true, "sequencerAddr"));
        this.finalTrace.responses = [];
    }

    // Triggered after processing a batch
    onFinishBatch(ctx, tag) {
        this.finalTrace.cumulative_gas_used = String(this.accBatchGas);
        // TODO: fix nsr
        this.finalTrace.new_state_root = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));
        this.finalTrace.new_local_exit_root = ethers.utils.hexlify(this.getVarFromCtx(ctx, true, "newLocalExitRoot"));
        // Create ouput files and dirs
        this.exportTrace();
    }

    // Triggered just before processing an opcode
    onOpcode(ctx, params) {
        const singleInfo = {};

        //Get opcode info
        let codeId;

        if (params.op === "number") {
            codeId = Scalar.e(params.num)
        } else {
            codeId = ctx[params.regName]
        }
        const opcode = codes[codeId].slice(2);
        // store memory
        const offsetCtx = Number(ctx.CTX) * 0x40000;
        let addrMem = 0;
        addrMem += offsetCtx;
        addrMem += 0x30000;

        const finalMemory = [];
        const lengthMemOffset = this._findOffsetLabel(ctx.rom.program, "memLength");
        const lenMemValue = ctx.mem[offsetCtx + lengthMemOffset];
        const lenMemValueFinal = typeof lenMemValue === "undefined" ? 0 : Number(fea2scalar(ctx.Fr, lenMemValue));


        for (let i = 0; i < lenMemValueFinal; i++) {
            const memValue = ctx.mem[addrMem + i];
            if (typeof memValue === "undefined")
                continue;
            let memScalar = fea2scalar(ctx.Fr, memValue);
            let hexString = memScalar.toString(16);
            hexString = hexString.length % 2 ? `0${hexString}` : hexString;
            finalMemory.push(hexString.padStart(64, "0"));
        }

        // store stack
        let addr = 0;
        addr += offsetCtx;
        addr += 0x20000;

        const finalStack = [];

        for (let i = 0; i < ctx.SP; i++) {
            const stack = ctx.mem[addr + i];
            if (typeof stack === "undefined")
                continue;
            let stackScalar = fea2scalar(ctx.Fr, stack);
            let hexString = stackScalar.toString(16);
            hexString = hexString.length % 2 ? `0${hexString}` : hexString;
            finalStack.push(`0x${hexString}`);
        }

        // add info opcodes
        singleInfo.depth = this.depth;
        singleInfo.pc = Number(ctx.PC);
        singleInfo.remaining_gas = ctx.GAS.toString();
        if (this.info.length) {
            const prevTrace = this.info[this.info.length - 1];
            // The gas cost of the opcode is gas before - gas after processing the opcode
            const gasCost = Number(prevTrace.remaining_gas) - Number(ctx.GAS);
            prevTrace.gas_cost = String(gasCost);
            // If negative gasCost means gas has been added from a deeper context, we should recalculate
            if (prevTrace.gas_cost < 0) {
                const beforePrevTrace = this.info[this.info.length - 2];
                prevTrace.gas_cost = String(Number(beforePrevTrace.remaining_gas) - Number(prevTrace.remaining_gas));
            }
        }

        singleInfo.opcode = opcode;
        singleInfo.gas_refund = this.getVarFromCtx(ctx, false, "gasRefund").toString();
        singleInfo.op = ethers.utils.hexlify(codeId);
        singleInfo.error = "";
        singleInfo.state_root = ethers.utils.hexlify(fea2scalar(ctx.Fr, ctx.SR));

        //Add contract info
        singleInfo.contract = {};
        singleInfo.contract.address = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txDestAddr"));
        singleInfo.contract.caller = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txSrcAddr"));
        singleInfo.contract.value = this.getVarFromCtx(ctx, false, "txValue").toString();
        singleInfo.contract.data = this.getCalldataFromStack(ctx);
        singleInfo.contract.gas = this.txGAS[this.depth];
        singleInfo.storage = JSON.parse(JSON.stringify(this.deltaStorage[this.depth]));
        // Round up to next multiple of 32
        singleInfo.memory_size = String(Math.ceil(Number(this.getVarFromCtx(ctx, false, "memLength")) / 32) * 32);

        this.info.push(singleInfo);
        this.fullStack.push(finalStack);

        // build trace
        const index = this.fullStack.length;

        if (index > 1) {
            const singleCallTrace = this.info[index - 2];
            singleCallTrace.stack = finalStack;
            singleCallTrace.memory = finalMemory;
            // Clone object
            const singleExecuteTrace = JSON.parse(JSON.stringify(this.info[index - 2]));
            delete singleCallTrace.storage
            delete singleCallTrace.memory_size
            delete singleExecuteTrace.contract
            delete singleExecuteTrace.state_root
            this.call_trace.push(singleCallTrace);
            this.execution_trace.push(singleExecuteTrace);
        }
        //Return data
        singleInfo.return_data = [];

        //Check previous step
        const prevStep = this.info[this.info.length - 2];
        if (prevStep && opIncContext.includes(prevStep.opcode)) {
            //Set gasCall when depth has changed
            this.txGAS[this.depth] = this.getVarFromCtx(ctx, true, "gasCall").toString();
            if (generate_call_trace) {
                singleInfo.contract.gas = this.txGAS[this.depth];
            }
        }

        //Check opcodes that alter depth
        if (opDecContext.includes(singleInfo.opcode)) {
            this.depth--;
        }
        if (opIncContext.includes(singleInfo.opcode)) {
            this.depth++;
            this.deltaStorage[this.depth] = {};
        }


    }

    //////////
    // UTILS
    //////////
    //Get range from memory
    getFromMemory(offset, length, ctx) {
        const offsetCtx = Number(ctx.CTX) * 0x40000;
        let addrMem = 0;
        addrMem += offsetCtx;
        addrMem += 0x30000;

        const finalMemory = [];
        const init = addrMem + Number(offset) / 32
        const end = init + Number(length) / 32
        for (let i = init; i < end; i++) {
            let memValue = ctx.mem[i];
            if (typeof memValue === "undefined")
                memValue = scalar2fea(ctx.Fr, 0);;
            let memScalar = fea2scalar(ctx.Fr, memValue);
            let hexString = memScalar.toString(16);
            hexString = hexString.length % 2 ? `0${hexString}` : hexString;
            finalMemory.push(hexString.padStart(64, "0"));
        }
        return finalMemory
    }
    // Get a global or context variable
    getVarFromCtx(ctx, global, varLabel) {
        const offsetCtx = global ? 0 : Number(ctx.CTX) * 0x40000;
        const offsetRelative = this._findOffsetLabel(ctx.rom.program, varLabel);
        const addressMem = offsetCtx + offsetRelative;
        const value = ctx.mem[addressMem];
        const finalValue = typeof value === "undefined" ? 0 : value;
        if (!finalValue) return 0n;
        return fea2scalar(ctx.Fr, finalValue);
    }
    //Get the stored calldata in the stack
    getCalldataFromStack(ctx, offset = 0, length) {
        const addr = 0x20000 + 1024 + Number(ctx.CTX) * 0x40000;
        let value = "0x";
        for (let i = addr + Number(offset); i < 0x30000 + Number(ctx.CTX) * 0x40000; i++) {
            const memVal = ctx.mem[i];
            if (!memVal) break;
            value += ethers.utils.hexlify(fea2scalar(ctx.Fr, memVal)).slice(2);
        }
        if (length) {
            value = value.slice(0, 2 + length * 2);
        }
        return value.length > 2 ? value : "0x0";
    }
    // Get the value of a reg (A, B, C, D, E...)
    getRegFromCtx(ctx, reg) {
        return fea2scalar(ctx.Fr, ctx[reg]);
    }
    //Export the current trace to a file
    exportTrace() {
        if (!fs.existsSync(this.folderLogs)) {
            fs.mkdirSync(this.folderLogs);
        }
        fs.writeFileSync(`${this.pathLogFile}.json`, JSON.stringify(this.finalTrace, null, 2));
    }

    _findOffsetLabel(program, label) {
        if (typeof this.labels[label] !== "undefined") {
            return this.labels[label];
        }

        for (let i = 0; i < program.length; i++) {
            if (program[i].offsetLabel === label) {
                this.labels[label] = program[i].offset;
                return program[i].offset;
            }
        }

        return null;
    }
    // Returns a transaction hash from transaction params
    getTransactionHash(to, value, nonce, gasLimit, gasPrice, data, chainId, ctx) {
        const txu = {
            value: this.toHexStringRlp(ethers.utils.hexlify(ethers.BigNumber.from(value))),
            nonce: this.toHexStringRlp(ethers.utils.hexlify(nonce)),
            gasLimit: this.toHexStringRlp(ethers.utils.hexlify(ethers.BigNumber.from(gasLimit))),
            gasPrice: this.toHexStringRlp(ethers.utils.hexlify(ethers.BigNumber.from(gasPrice))),
            data: this.toHexStringRlp(data),
            chainId: chainId,
            to: this.toHexStringRlp(to)
        }
        const v = Number(this.getVarFromCtx(ctx, false, "txV"));
        const s = {
            r: this.toHexStringRlp(ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txR"))),
            s: this.toHexStringRlp(ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txS"))),
            v: this.toHexStringRlp(ethers.utils.hexlify(v - 27 + txu.chainId * 2 + 35))
        }

        const fields = [txu.nonce, txu.gasPrice, txu.gasLimit, txu.to, txu.value, txu.data, s.v, s.r, s.s];
        const rlp = ethers.utils.RLP.encode(fields);
        const kecc = ethers.utils.keccak256(rlp);
        return kecc
    }

    toHexStringRlp(num) {
        if (num === "0x") num = "0x0"
        let numHex = Scalar.toString(Scalar.e(num), 16);
        numHex = (numHex.length % 2 === 1) ? (`0x0${numHex}`) : (`0x${numHex}`);
        if (numHex === "0x00") numHex = "0x"
        return numHex;
    }

    // Returns a correclt formated to value, for case it gets 0x00 from the rom
    getFormatedTo(ctx) {
        const to = ethers.utils.hexlify(this.getVarFromCtx(ctx, false, "txDestAddr"));
        return to.length < 5 ? '0x0' : to
    }
}

module.exports = FullTracer;