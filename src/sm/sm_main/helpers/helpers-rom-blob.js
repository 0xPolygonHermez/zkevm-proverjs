const {
    scalar2fea
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

module.exports = class myHelperBlob {
    base = 1n << 256n;

    setup(props) {
        for (const name in props) {
            this[name] = props[name];
        }
    }

    eval_getTimestampLimit(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    
        return [ctx.Fr.e(ctx.input.timestampLimit), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getZkGasLimit(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    
        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.zkGasLimit));
    }

    eval_getType(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    
        return [ctx.Fr.e(ctx.input.type), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getZ(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.z));
    }

    eval_getY(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.y));
        //return [ctx.Fr.e(ctx.input.y), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_getBlobL2HashData(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        console.log(ctx.input.blobL2HashData)
        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.blobL2HashData));
    }

    eval_getForcedHashData(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        return scalar2fea(ctx.Fr, Scalar.e(ctx.input.forcedHashData));
    }

    eval_getBlobLen(ctx, tag) {
        if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        
        return [ctx.Fr.e((ctx.input.blobData.length-2) / 2), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

};