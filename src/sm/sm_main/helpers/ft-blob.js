/* eslint-disable no-unused-vars */
const path = require('path');
const fs = require('fs');
const { byteArray2HexString } = require('@0xpolygonhermez/zkevm-commonjs').utils;
const { fea2scalar } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

const {
    getTransactionHash, findOffsetLabel, getVarFromCtx,
    getRegFromCtx, getFromMemory, getConstantFromCtx, bnToPaddedHex,
} = require('../debug/full-tracer-utils');
const Helper = require('./helper');

module.exports = class FtBlob extends Helper {
    setup(props) {
        super.setup(props);
        this.init(this.ctx.config);
    }

    /**
     * Initialize blob full-tracer
     * @param {String} logFileName Name of the output file
     */
    init(config) {
        this.logFileName = config.debugInfo.inputName;
        // Logs path
        this.folderLogs = path.join(__dirname, '../logs-ft-blob');
        // this.pathLogFile = `${this.folderLogs}/${this.logFileName.split('.')[0]}__ft`;
        this.pathLogFile = `${this.folderLogs}/pepe__ft`;
        // Final trace
        this.finalTrace = {
            batch_data: []
        };
    }

    /**
     * Handle zkrom emitted events by name
     * @param {Object} ctx Current context object
     * @param {Object} tag to identify the event
     */
    handleEvent(ctx, tag) {
        // handle function called without arguments like `$${eventLog(onStartBlob())}`
        // all function needs to have arguments, '()', even if it is an empty one
        try {
            const func = this[tag.params[0].funcName];
    
            if (func && typeof func === 'function') {
                this[tag.params[0].funcName](ctx, tag.params[0].params);
            } else if (tag.params[0].varName === 'onError') {
                this[tag.params[0].varName](ctx, tag.params);
            } else {
                // eslint-disable-next-line no-console
                console.log(`Event ${tag.params[0].funcName} not found`);
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
        }
    }

    /// ///////
    // EVENT HANDLERS
    /// ///////

    onStartBlob(ctx, params) {
                // object travce initialization
        this.finalTrace = {
            batch_data: [],
            error: '',
        };
    }

    onError(ctx, params) {
        const errorName = params[1].varName;
        this.finalTrace.error = errorName;
    }

    onAddBatch(ctx, params) {
        // get the address of the poseidon hash
        const addressHashP = fea2scalar(ctx.Fr, ctx[params[0].regName]).toString();
        // get hashP data
        const bytesHash = byteArray2HexString(ctx.hashP[addressHashP].data);
        this.finalTrace.batch_data.push(bytesHash);
    }

    onFinishBlob(ctx, params) {
        this.finalTrace.new_blob_state_root = bnToPaddedHex(getVarFromCtx(ctx, true, 'newBlobStateRoot'), 64);
        this.finalTrace.new_blob_acc_input_hash = bnToPaddedHex(getVarFromCtx(ctx, true, 'newBlobAccInputHash'), 64);
        this.finalTrace.new_num_blob = Number(getVarFromCtx(ctx, true, 'newNumBlob'));
        this.finalTrace.final_acc_batch_hash_data = bnToPaddedHex(getVarFromCtx(ctx, true, 'finalAccBatchHashData'), 64);
        this.finalTrace.local_exit_root_from_blob = bnToPaddedHex(getVarFromCtx(ctx, true, 'localExitRootFromBlob'), 64);
        this.finalTrace.is_invalid = Number(getVarFromCtx(ctx, true, 'isInvalid')) !== 0;
        this.exportTrace()
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
};
