/* eslint-disable max-len */
const { Scalar } = require('ffjavascript');
const {
    scalar2fea,
} = require('@0xpolygonhermez/zkevm-commonjs').smtUtils;
const Helper = require('./helper');

module.exports = class Rom extends Helper {
    eval_getL1HistoricRoot(ctx, tag) {
        if (tag.params.length !== 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        const indexL1InfoTree = this.evalCommand(ctx, tag.params[0]);
        const historicRootL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].historicRoot;

        return scalar2fea(ctx.Fr, Scalar.e(historicRootL1InfoTree));
    }

    eval_getForcedTimestamp(ctx, tag) {
        if (tag.params.length !== 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return [ctx.Fr.e(ctx.input.forcedData.minTimestamp), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getBatchHashData(ctx, tag) {
        if (tag.params.length !== 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return scalar2fea(ctx.Fr, Scalar.e(ctx.batchHashData));
    }

    eval_getType(ctx, tag) {
        if (tag.params.length !== 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.type));
    }

    eval_getForcedGER(ctx, tag) {
        if (tag.params.length !== 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.forcedData.GER));
    }
};
