const { fea2scalar } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

module.exports = class myHelper {
    base = 1n << 256n;

    setup(props) {
        for (const name in props) {
            this[name] = props[name];
        }
    }

    ///////////// MODEXP

    /**
     * Compares two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns i+1 if a > b, -i-1 if a < b, 0 if a == b, where i is the position of the first different chunk.
     */
    eval_signedComparison(ctx, tag) {
        const addr1 = Number(this.evalCommand(ctx, tag.params[0]));
        const addr2 = Number(this.evalCommand(ctx, tag.params[1]));
        const len = tag.params[2] ? Number(this.evalCommand(ctx, tag.params[2])) : 1;

        for (let i = len - 1; i >= 0; i--) {
            const input1i = fea2scalar(ctx.Fr, ctx.mem[addr1 + i]);
            const input2i = fea2scalar(ctx.Fr, ctx.mem[addr2 + i]);

            if (input1i !== input2i) {
                return [ctx.Fr.e(input1i < input2i ? -i-1 : i+1), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
            }
        }
        return 0;
    }

    /**
     * Compares two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns i+1 if a > b, -i-1 if a < b, 0 if a == b, where i is the position of the first different chunk.
     */
    eval_signedComparisonWithConst(ctx, tag) {
        const addr = Number(this.evalCommand(ctx, tag.params[0]));
        const input = fea2scalar(ctx.Fr, ctx.mem[addr]);
        const constant = BigInt(this.evalCommand(ctx, tag.params[1]));
        if (input !== constant) {
            return [ctx.Fr.e(input < constant ? -1 : 1), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
        } else {
            return 0;
        }
    }

    /**
     * Gets the first different chunk between two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns i, where i is the position of the first different chunk.
     */
    eval_getFirstDiffChunkRem(ctx, tag) {
        const addr = Number(this.evalCommand(ctx, tag.params[0]));
        const len = Number(this.evalCommand(ctx, tag.params[1]));
        const rem = ctx.remainder;

        for (let i = len - 1; i >= 0; i--) {
            const inputi = fea2scalar(ctx.Fr, ctx.mem[addr + i]);

            if (inputi[i] !== rem[i]) {
                return i;
            }
        }

        throw new Error("The input and the remainder are equal");
    }

    /**
     * Compares two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns 1 if a > b, -1 if a < b, 0 if a == b.
     */
    compare(a, b) {
        const alen = a.length;
        const blen = b.length;
        if (alen !== blen) {
            return alen >= blen ? 1 : -1;
        }
        for (let i = alen - 1; i >= 0; i--) {
            if (a[i] !== b[i]) {
                return a[i] > b[i] ? 1 : -1;
            }
        }
        return 0;
    }

    /**
     * Removes leading zeros from a.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @returns a with leading zeros removed. It sets a.length = 0 if a = [0n]
     */
    trim(a) {
        let i = a.length;
        while (a[--i] === 0n);
        a.length = i + 1;
    }

    /**
     * Computes the subtraction of two unsigned integers a,b represented as arrays of BigInts. Assumes a >= b.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns a - b.
     */
    _MP_sub(a, b) {
        const alen = a.length;
        const blen = b.length;
        let result = new Array(alen);
        let diff = 0n;
        let carry = 0n;
        let i = 0;
        for (i = 0; i < blen; i++) {
            diff = a[i] - b[i] - carry;
            carry = diff < 0n ? 1n : 0n;
            result[i] = diff + carry * this.base;
        }
        for (i = blen; i < alen; i++) {
            diff = a[i] - carry;
            if (diff < 0n) {
                diff += this.base;
            } else {
                result[i++] = diff;
                break;
            }
            result[i] = diff;
        }
        for (; i < alen; i++) {
            result[i] = a[i];
        }
        this.trim(result);
        return result;
    }

    /**
     * Computes the subtraction of two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns a - b.
     */
    MP_sub(a, b) {
        let result;
        if (this.compare(a, b) >= 0) {
            result = this._MP_sub(a, b);
        } else {
            result = this._MP_sub(b, a);
            result[result.length - 1] = -result[result.length - 1];
        }
        if (result.length === 0) {
            result.push(0n);
        }
        return result;
    }

    /**
     * Computes the multiplication of an unsigned integer represented as an array of BigInts and an unsigned integer represented as a BigInt.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as a BigInt.
     * @returns a * b.
     */
    MP_short_mul(a, b) {
        const alen = a.length;
        const len = alen;
        const result = new Array(len).fill(0n);
        let product;
        let carry = 0n;
        let i;
        for (i = 0; i < alen; i++) {
            product = a[i] * b + carry;
            carry = product / this.base;
            result[i] = product - carry * this.base;
        }
        while (carry > 0n) {
            result[i++] = carry % this.base;
            carry /= this.base;
        }
        this.trim(result);
        return result;
    }

    /**
     * Computes the normalisation of two unsigned integers a,b as explained here https://www.codeproject.com/Articles/1276311/Multiple-Precision-Arithmetic-Division-Algorithm.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns Normalised a and b to achieve better performance for MPdiv.
     */
    normalize(a, b) {
        let bm = b[b.length - 1];
        let shift = 1n; // shift cannot be larger than log2(base) - 1
        while (bm < this.base / 2n) {
            b = this.MP_short_mul(b, 2n); // left-shift b by 2
            bm = b[b.length - 1];
            shift *= 2n;
        }

        a = this.MP_short_mul(a, shift); // left-shift a by 2^shift
        return [a, b, shift];
    }

    /**
     * Computes the next digit of the quotient.
     * @param an - Unsigned integer represented as an array of BigInts. This is the current dividend.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns The next digit of the quotient.
     */
    findQn(an, b) {
        const b_l = b.length;
        const bm = b[b_l - 1];
        if (this.compare(an, b) === -1) {
            return 0n;
        }

        const n = an.length;
        let aguess = [];
        if (an[n-1] < bm) {
            aguess = [an[n-2], an[n-1]];
        } else {
            aguess = [an[n-1]];
        }

        if (an[n-1] < bm) {
            return this._MPdiv_short(aguess, bm)[0][0]; // this is always a single digit
        } else if (an[n-1] === bm) {
            if (b_l < n) {
                return this.base - 1n;
            } else {
                return 1n;
            }
        } else {
            return 1n;
        }
    }

    /**
     * Computes the division of two unsigned integers represented as arrays of BigInts.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as an array of BigInts.
     * @returns [quotient, remainder] of a / b.
     */
    _MPdiv(a, b) {
        let shift;
        [a, b, shift] = this.normalize(a, b);
        let a_l = a.length;
        let quotient = [];
        let remainder = [];
        let an = [];
        while (this.compare(an, b) === -1) {
            an.unshift(a[--a_l]);
        }

        let test;
        let qn;
        while (a_l >= 0) {
            qn = this.findQn(an,b);
            test = this.MP_short_mul(b, qn);
            while (this.compare(test, an) === 1) {
                // maximum 2 iterations
                qn--;
                test = this.MP_sub(test, b);
            }

            quotient.unshift(qn);
            remainder = this.MP_sub(an, test);
            an = remainder;
            if (a_l === 0) break;
            an.unshift(a[--a_l]);
        }
        remainder = this._MPdiv_short(remainder, shift)[0];
        this.trim(quotient);
        this.trim(remainder);
        return [quotient, remainder];
    }

    /**
     * Computes the division of an unsigned integer represented as an array of BigInts and an unsigned integer represented as a BigInt.
     * @param a - Unsigned integer represented as an array of BigInts.
     * @param b - Unsigned integer represented as a BigInt.
     * @returns [quotient, remainder] of a / b.
     */
    _MPdiv_short(a, b) {
        let a_l = a.length;
        let quotient = [];
        let remainder = 0n;

        let dividendi;
        let qi;
        for (let i = a_l - 1; i >= 0; i--) {
            dividendi = remainder * this.base + a[i];
            qi = dividendi / b;
            remainder = dividendi - qi * b;
            quotient[i] = qi;
        }
        this.trim(quotient);
        return [quotient, remainder];
    }

    /**
     * Computes the division of two unsigned integers represented as arrays of BigInts.
     * @param ctx - Context.
     * @param tag - Tag.
     * @sets ctx.quotient and ctx.remainder.
     */
    eval_MPdiv(ctx, tag) {
        const addr1 = Number(this.evalCommand(ctx, tag.params[0]));
        const len1 = Number(this.evalCommand(ctx, tag.params[1]));
        const addr2 = Number(this.evalCommand(ctx, tag.params[2]));
        const len2 = Number(this.evalCommand(ctx, tag.params[3]));

        let input1 = [];
        let input2 = [];
        for (let i = 0; i < len1; ++i) {
            input1.push(fea2scalar(ctx.Fr, ctx.mem[addr1 + i]));
        }
        for (let i = 0; i < len2; ++i) {
            input2.push(fea2scalar(ctx.Fr, ctx.mem[addr2 + i]));
        }

        const [quo, rem] = this._MPdiv(input1, input2);

        ctx.quotient = quo;
        ctx.remainder = rem;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Quotient chunk at the given position.
     */
    eval_receiveQuotientChunk(ctx, tag) {
        const pos = Number(this.evalCommand(ctx, tag.params[0]));
        const quoi = ctx.quotient[pos];
        return quoi;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Remainder chunk at the given position.
     */
    eval_receiveRemainderChunk(ctx, tag) {
        const pos = Number(this.evalCommand(ctx, tag.params[0]));
        const remi = ctx.remainder[pos];
        return remi;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Length of the quotient.
     */
    eval_receiveLenQuotient(ctx) {
        return ctx.quotient.length;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Length of the remainder.
     */
    eval_receiveLenRemainder(ctx) {
        return ctx.remainder.length;
    }

    /**
     * Computes the division of an unsigned integer represented as an array of BigInts and an unsigned integer represented as a BigInt.
     * @param ctx - Context.
     * @param tag - Tag.
     * @sets ctx.quotient_short and ctx.remainder_short.
     */
    eval_MPdiv_short(ctx, tag) {
        const addr1 = Number(this.evalCommand(ctx, tag.params[0]));
        const len1 = Number(this.evalCommand(ctx, tag.params[1]));
        const input2 = this.evalCommand(ctx, tag.params[2]);

        let input1 = [];
        for (let i = 0; i < len1; ++i) {
            input1.push(fea2scalar(ctx.Fr, ctx.mem[addr1 + i]));
        }

        const [quo, rem] = this._MPdiv_short(input1, input2);

        ctx.quotient_short = quo;
        ctx.remainder_short = rem;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Short quotient chunk at the given position.
     */
    eval_receiveQuotientChunk_short(ctx, tag) {
        const pos = Number(this.evalCommand(ctx, tag.params[0]));
        const quoi = ctx.quotient_short[pos];
        return quoi;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Short remainder chunk at the given position.
     */
    eval_receiveRemainderChunk_short(ctx) {
        const remi = ctx.remainder_short;
        return remi;
    }

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Length of the short quotient.
     */
    eval_receiveLenQuotient_short(ctx) {
        return ctx.quotient_short.length;
    }

    ///////////// ecAdd, ecMul

    /**
     *
     * @param ctx - Context.
     * @param tag - Tag.
     * @returns Length of the binary representation of the input scalar. If there are multiple input scalars, it returns the maximum length.
     */
    eval_receiveLen(ctx, tag) {
        let len = 0;
        for (let i = 0; i < tag.params.length; ++i) {
            let ki = this.evalCommand(ctx, tag.params[i]);
            if (ki === 0n) continue;
            let leni = 0;
            while (ki !== 1n) {
                ki >>= 1n;
                leni++;
            }
            len = leni > len ? leni : len;
        }

        return len;
    }

    ///////////// PAIRINGS

    /**
     * Computes the inverse of the given Fp element.
     * @param ctx - Context.
     * @param tag - Tag.
    */
    eval_fpBN254inv(ctx, tag) {
        const ctxFullFe = { ...ctx, fullFe: true };
        const a = this.evalCommand(ctxFullFe, tag.params[0]);

        return ctx.FpBN254.inv(a);
    }

    /**
     * Computes the "real" part of the inverse of the given Fp2 element.
     * @param ctx - Context.
     * @param tag - Tag.
    */
    eval_fp2InvBN254_x(ctx, tag) {
        const ctxFullFe = { ...ctx, fullFe: true };
        const a = this.evalCommand(ctxFullFe, tag.params[0]);
        const b = this.evalCommand(ctxFullFe, tag.params[1]);
        const den = ctx.FpBN254.add(ctx.FpBN254.mul(a, a), ctx.FpBN254.mul(b, b));

        return ctx.FpBN254.div(a, den);
    }

    /**
     * Computes the "imaginary" part of the inverse of the given Fp2 element.
     * @param ctx - Context.
     * @param tag - Tag.
    */
    eval_fp2InvBN254_y(ctx, tag) {
        const ctxFullFe = { ...ctx, fullFe: true };
        const a = this.evalCommand(ctxFullFe, tag.params[0]);
        const b = this.evalCommand(ctxFullFe, tag.params[1]);
        const den = ctx.FpBN254.add(ctx.FpBN254.mul(a, a), ctx.FpBN254.mul(b, b));

        return ctx.FpBN254.div(ctx.FpBN254.neg(b), den);
    }
};
