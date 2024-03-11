const Helper = require('./helper.js');

module.exports = class Batch extends Helper {
    eval_getSequencerAddr(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`)
        return this.scalar2fea(ctx.Fr, Scalar.e(ctx.input.sequencerAddr));
    }

    eval_getTxs(ctx, tag) {
        if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        const txs = ctx.input.batchL2Data;
        const offset = Number(this.evalCommand(ctx,tag.params[0]));
        const len = Number(this.evalCommand(ctx,tag.params[1]));
        let d = "0x" + txs.slice(2+offset*2, 2+offset*2 + len*2);
        if (d.length == 2) d = d+'0';
        return this.scalar2fea(ctx.Fr, Scalar.e(d));
    }

    eval_getTxsLen(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        return [ctx.Fr.e((ctx.input.batchL2Data.length-2) / 2), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getSmtProof(ctx, tag) {
        if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        const index = Number(this.evalCommand(ctx, tag.params[0]));
        const level = Number(this.evalCommand(ctx, tag.params[1]));

        const leafValue = (ctx.input.l1InfoTree.skipVerifyL1InfoRoot === true)
            ? Constants.MOCK_VALUE_SMT_PROOF
            : ctx.input.l1InfoTree[index].smtProof[level];

        return this.scalar2fea(ctx.Fr, Scalar.e(leafValue));
    }

    eval_getL1InfoRoot(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return this.scalar2fea(ctx.Fr, Scalar.e(ctx.input.l1InfoRoot));
    }

    eval_getL1InfoGER(ctx, tag) {
        if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        const indexL1InfoTree = this.evalCommand(ctx, tag.params[0]);
        const gerL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].globalExitRoot;

        return this.scalar2fea(ctx.Fr, Scalar.e(gerL1InfoTree));
    }

    eval_getL1InfoBlockHash(ctx, tag) {
        if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        const indexL1InfoTree = this.evalCommand(ctx, tag.params[0]);
        const blockHashL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].blockHash;

        return this.scalar2fea(ctx.Fr, Scalar.e(blockHashL1InfoTree));
    }

    eval_getL1InfoTimestamp(ctx, tag) {
        if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        const indexL1InfoTree = this.evalCommand(ctx, tag.params[0]);
        const timestampL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].timestamp;

        return this.scalar2fea(ctx.Fr, Scalar.e(timestampL1InfoTree));
    }

    eval_getTimestampLimit(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return [ctx.Fr.e(ctx.input.timestampLimit), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getForcedBlockHashL1(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return this.scalar2fea(ctx.Fr, Scalar.e(ctx.input.forcedBlockHashL1));
    }

    eval_eventLog(ctx, tag) {
        if (tag.params.length < 1) throw new Error(`Invalid number of parameters (1 > ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        if (this.fullTracer){
            // handle full-tracer events
            this.fullTracer.handleEvent(ctx, tag);
        }
        if (this.debug && tag.params[0].varName == 'onError') {
            this.nameRomErrors.push(tag.params[1].varName);
            console.log(`Error triggered zkrom: ${tag.params[1].varName}\nsource: ${ctx.sourceRef}`);
        }
    }

}