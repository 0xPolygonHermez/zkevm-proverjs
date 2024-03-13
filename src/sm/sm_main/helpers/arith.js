const Helper = require('./helper.js')

module.exports = class Arith extends Helper {
    eval_inverseFpEc(ctx, tag) {
        const a = ctx.Fec.e(this.evalCommand(ctx, tag.params[0]));
        if (ctx.Fec.isZero(a)) {
            throw new Error(`inverseFpEc: Division by zero ${ctx.sourceRef}`);
        }
        return ctx.Fec.inv(a);
    }

    eval_inverseFnEc(ctx, tag) {
        const a = ctx.Fnec.e(this.evalCommand(ctx, tag.params[0]));
        if (ctx.Fnec.isZero(a)) {
            throw new Error(`inverseFpEc: Division by zero ${ctx.sourceRef}`);
        }
        return ctx.Fnec.inv(a);
    }

    eval_sqrtFpEcParity(ctx, tag) {
        const a = this.evalCommand(ctx, tag.params[0]);
        const parity = this.evalCommand(ctx, tag.params[1]);
        const r = ctx.Fec.sqrt(a);
        if (r === null) {
            return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
        }
        if ((r & 0x01n) === parity)  {
            return r;
        }
        return ctx.Fec.neg(r);
    }

    eval_xAddPointEc(ctx, tag) {
        return this.eval_AddPointEc(ctx, tag, false)[0];
    }

    eval_yAddPointEc(ctx, tag) {
        return this.eval_AddPointEc(ctx, tag, false)[1];
    }

    eval_xDblPointEc(ctx, tag) {
        return this.eval_AddPointEc(ctx, tag, true)[0];
    }

    eval_yDblPointEc(ctx, tag) {
        return this.eval_AddPointEc(ctx, tag, true)[1];
    }

    eval_AddPointEc(ctx, tag, dbl)
    {
        const x1 = ctx.Fec.e(this.evalCommand(ctx, tag.params[0]));
        const y1 = ctx.Fec.e(this.evalCommand(ctx, tag.params[1]));
        const x2 = ctx.Fec.e(this.evalCommand(ctx, tag.params[dbl ? 0 : 2]));
        const y2 = ctx.Fec.e(this.evalCommand(ctx, tag.params[dbl ? 1 : 3]));

        let s;
        if (dbl) {
            // Division by zero must be managed by ROM before call ARITH
            const divisor = ctx.Fec.add(y1, y1)
            if (ctx.Fec.isZero(divisor)) {
                throw new Error(`Invalid AddPointEc (divisionByZero) ${ctx.sourceRef}`);
            }
            s = ctx.Fec.div(ctx.Fec.mul(3n, ctx.Fec.mul(x1, x1)), divisor);
        }
        else {
            const deltaX = ctx.Fec.sub(x2, x1)
            if (ctx.Fec.isZero(deltaX)) {
                throw new Error(`Invalid AddPointEc (divisionByZero) ${ctx.sourceRef}`);
            }
            s = ctx.Fec.div(ctx.Fec.sub(y2, y1), deltaX );
        }

        const x3 = ctx.Fec.sub(ctx.Fec.mul(s, s), ctx.Fec.add(x1, x2));
        const y3 = ctx.Fec.sub(ctx.Fec.mul(s, ctx.Fec.sub(x1,x3)), y1);

        return [x3, y3];
    }

    eval_ARITH_BN254_MULFP2_X(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[0]));
        const y1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[1]));
        const x2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[2]));
        const y2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[3]));

        return ctx.FpBN254.sub(ctx.FpBN254.mul(x1,x2), ctx.FpBN254.mul(y1, y2));
    }

    eval_ARITH_BN254_MULFP2_Y(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[0]));
        const y1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[1]));
        const x2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[2]));
        const y2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[3]));

        return ctx.FpBN254.add(ctx.FpBN254.mul(x1,y2), ctx.FpBN254.mul(x2, y1));
    }

    eval_ARITH_BN254_ADDFP2(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[0]));
        const x2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[1]));

        return ctx.FpBN254.add(x1,x2);
    }

    eval_ARITH_BN254_SUBFP2(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[0]));
        const x2 = ctx.FpBN254.e(this.evalCommand(ctx, tag.params[1]));

        return ctx.FpBN254.sub(x1,x2);
    }
}