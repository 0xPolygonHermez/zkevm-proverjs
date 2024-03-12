const Helper = require('./helper.js');

const Mask256 = 2n**256n - 1n;
module.exports = class MemAlign extends Helper {

    eval_memAlignWR_W0(ctx, tag) {
        // parameters: M0, value, offset
        const m0 = this.evalCommand(ctx, tag.params[0]);
        const value = this.evalCommand(ctx, tag.params[1]);
        const offset = this.evalCommand(ctx, tag.params[2]);

        return this.scalar2fea(ctx.Fr, this.Scalar.bor(this.Scalar.band(m0, this.Scalar.shl(Mask256, (32n - offset) * 8n)),
                            this.Scalar.band(Mask256, this.Scalar.shr(value, offset * 8n))));
    }

    eval_memAlignWR_W1(ctx, tag) {
        // parameters: M1, value, offset
        const m1 = this.evalCommand(ctx, tag.params[0]);
        const value = this.evalCommand(ctx, tag.params[1]);
        const offset = this.evalCommand(ctx, tag.params[2]);

        return this.scalar2fea(ctx.Fr, this.Scalar.bor(  this.Scalar.band(m1, this.Scalar.shr(Mask256, offset * 8n)),
                            this.Scalar.band(Mask256, this.Scalar.shl(value, (32n - offset) * 8n))));
    }

    eval_memAlignWR8_W0(ctx, tag) {
        // parameters: M0, value, offset
        const m0 = this.evalCommand(ctx, tag.params[0]);
        const value = this.evalCommand(ctx, tag.params[1]);
        const offset = this.evalCommand(ctx, tag.params[2]);
        const bits = (31n - offset) * 8n;

        return this.scalar2fea(ctx.Fr, this.Scalar.bor(  this.Scalar.band(m0, this.Scalar.sub(Mask256, this.Scalar.shl(0xFFn, bits))),
                            this.Scalar.shl(this.Scalar.band(0xFFn, value), bits)));
    }
}