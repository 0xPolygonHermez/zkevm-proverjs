const Helper = require('./helper.js')

module.exports = class Operations extends Helper {
    eval_cond(ctx, tag) {
        if (tag.params.length != 1) throw new Error(`Invalid number of parameters (1 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
        const result = Number(this.evalCommand(ctx,tag.params[0]));
        if (result) {
            return [ctx.Fr.e(-1), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
        }
        return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_exp(ctx, tag) {
        if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`)
        const a = this.evalCommand(ctx, tag.params[0]);
        const b = this.evalCommand(ctx, tag.params[1])
        return this.scalar2fea(ctx.Fr, Scalar.exp(a, b));;
    }

    eval_bitwise(ctx, tag) {
        const func = tag.funcName.split('_')[1];
        const a = this.evalCommand(ctx, tag.params[0]);
        let b;

        switch (func) {
            case 'and':
                this.checkParams(ctx, tag, 2);
                b = this.evalCommand(ctx, tag.params[1]);
                return Scalar.band(a, b);
            case 'or':
                this.checkParams(ctx, tag, 2);
                b = this.evalCommand(ctx, tag.params[1]);
                return Scalar.bor(a, b);
            case 'xor':
                this.checkParams(ctx, tag, 2);
                b = this.evalCommand(ctx, tag.params[1]);
                return Scalar.bxor(a, b);
            case 'not':
                this.checkParams(ctx, tag, 1);
                return Scalar.bxor(a, Mask256);
            default:
                throw new Error(`Invalid bitwise operation ${func} (${tag.funcName}) ${ctx.sourceRef}`)
        }
    }

    eval_comp(ctx, tag){
        this.checkParams(ctx, tag, 2);

        const func = tag.funcName.split('_')[1];
        const a = this.evalCommand(ctx,tag.params[0]);
        const b = this.evalCommand(ctx,tag.params[1]);

        switch (func){
            case 'lt':
                return Scalar.lt(a, b) ? 1 : 0;
            case 'gt':
                return Scalar.gt(a, b) ? 1 : 0;
            case 'eq':
                return Scalar.eq(a, b) ? 1 : 0;
            default:
                throw new Error(`Invalid bitwise operation ${func} (${tag.funcName}) ${ctx.sourceRef}`)
        }
    }

    eval_loadScalar(ctx, tag){
        this.checkParams(ctx, tag, 1);
        return this.evalCommand(ctx,tag.params[0]);
    }

}