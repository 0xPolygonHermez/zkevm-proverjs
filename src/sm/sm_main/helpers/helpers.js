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
     * Saves the initial counters for the modexp instance.
     * @param ctx - Context.
     * @sets ctx.modExpCounters.
     */
    eval_recordModExpCounters(ctx) {
        ctx.modExpCounters = {cntArith: ctx.cntArith, cntBinary: ctx.cntBinary, cntSteps: BigInt(ctx.step)};
    }

    /**
     * Checks whether the expected modExp counters are not undercounting the real ones.
     * @param ctx - Context.
     */
    eval_checkModExpCounters(ctx) {
        const realCounters = {
            cntArith: ctx.cntArith - ctx.modExpCounters.cntArith,
            cntBinary: ctx.cntBinary - ctx.modExpCounters.cntBinary,
            cntSteps: BigInt(ctx.step) - ctx.modExpCounters.cntSteps + 1n,
        };

        const diff = {
            cntArith: BigInt(ctx.emodExpCounters.ariths) - realCounters.cntArith,
            cntBinary: BigInt(ctx.emodExpCounters.binaries) - realCounters.cntBinary,
            cntSteps: BigInt(ctx.emodExpCounters.steps) - realCounters.cntSteps,
        };

        for (const key in diff) {
            if (diff[key] < 0n) {
                throw new Error(`Caution: Counter ${key} is undercounted ${-diff[key]}`);
            }
        }
    }

    /**
     * Computes the expected modExp counters for the given inputs.
     * @param ctx - Context.
     * @param tag - Tag.
     * @sets ctx.ctx.emodExpCounters.
     */
    eval_expectedModExpCounters(ctx, tag) {
        const addrB = Number(this.evalCommand(ctx, tag.params[0]));
        const lenB = Number(this.evalCommand(ctx, tag.params[1]));
        const addrE = Number(this.evalCommand(ctx, tag.params[2]));
        const lenE = Number(this.evalCommand(ctx, tag.params[3]));
        const addrM = Number(this.evalCommand(ctx, tag.params[4]));
        const lenM = Number(this.evalCommand(ctx, tag.params[5]));

        let B = 0n;
        let E = 0n;
        let M = 0n;
        for (let i = 0; i < lenB; ++i) {
            B += fea2scalar(ctx.Fr, ctx.mem[addrB + i]) * (1n << (256n * BigInt(i)));
        }
        for (let i = 0; i < lenE; ++i) {
            E += fea2scalar(ctx.Fr, ctx.mem[addrE + i]) * (1n << (256n * BigInt(i)));
        }
        for (let i = 0; i < lenM; ++i) {
            M += fea2scalar(ctx.Fr, ctx.mem[addrM + i]) * (1n << (256n * BigInt(i)));
        }

        const [Q_B_M, R_B_M] = [B / M, B % M];
        const Bsq = B * B;
        const NZ_Bsq = 2*lenB - computeLenThisBase(Bsq);
        const [Q_Bsq_M, R_Bsq_M] = [Bsq / M, Bsq % M];
        const BM = B * M;

        const E2 = Math.floor(lenE / 2) || 1;

        let nTimesOdd = 0;
        while (E > 0n) {
            nTimesOdd += Number(E & 1n);
            E >>= 1n;
        }
        const nTimesEven = lenE * 256 - nTimesOdd;

        let counters = {ariths: 0, binaries: 0, steps: 0};
        const a = setupAndFirstDivCounters();
        const b = halfLoopCounters();
        const c = fullLoopCounters();

        for (const key in counters) {
            counters[key] = a[key] + nTimesEven * b[key] + nTimesOdd * c[key];
        }

        // console.log(JSON.stringify(counters, null, 2));

        ctx.emodExpCounters = counters;

        function computeLenThisBase(x) {
            if (x === 0n) return 1;

            let len = 0;
            while (x > 0n) {
                x >>= 256n;
                len++;
            }
            return len;
        }

        function first_diff_chunk(x, y) {
            const xLen = computeLenThisBase(x);
            const yLen = computeLenThisBase(y);

            if (xLen > yLen || xLen < yLen) {
                return xLen;
            }

            let i = xLen - 1;
            while (i >= 0 && ((x >> (256n * BigInt(i))) & 0xffffffffffffffffffffffffffffffffn) === ((y >> (256n * BigInt(i))) & 0xffffffffffffffffffffffffffffffffn)) {
                i--;
            }

            return i+1;
        }

        function setupAndFirstDivCounters() {
            return {
                steps:
                    218 +
                    39 * lenB +
                    45 * lenM +
                    computeLenThisBase(Q_B_M) * (30 + 33 * lenM) +
                    17 * computeLenThisBase(R_B_M) -
                    14 * first_diff_chunk(B, M) -
                    7 * first_diff_chunk(M, R_B_M),
                binaries:
                    12 +
                    6 * lenB +
                    3 * lenM +
                    computeLenThisBase(Q_B_M) * (1 + 4 * lenM) +
                    computeLenThisBase(R_B_M) -
                    4 * first_diff_chunk(B, M) -
                    2 * first_diff_chunk(M, R_B_M),
                ariths: 1 + computeLenThisBase(Q_B_M) * lenM,
            };
        }

        function halfLoopCounters() {
            return {
                steps:
                    399 +
                    100 * lenB +
                    61 * ((lenB * (lenB + 1)) / 2) +
                    48 * lenM +
                    19 * lenE +
                    44 * E2 +
                    computeLenThisBase(Q_Bsq_M) * (30 + 33 * lenM) +
                    14 * computeLenThisBase(R_Bsq_M) -
                    14 * first_diff_chunk(Bsq, M) -
                    7 * first_diff_chunk(M, R_Bsq_M) -
                    5 * NZ_Bsq,
                binaries:
                    23 +
                    14 * lenB +
                    9 * ((lenB * (lenB + 1)) / 2) +
                    3 * lenM +
                    2 * lenE +
                    3 * E2 +
                    computeLenThisBase(Q_Bsq_M) * (1 + 4 * lenM) +
                    computeLenThisBase(R_Bsq_M) -
                    4 * first_diff_chunk(Bsq, M) -
                    2 * first_diff_chunk(M, R_Bsq_M) -
                    NZ_Bsq,
                ariths:
                    2 +
                    lenB +
                    (lenB * (lenB + 1)) / 2 +
                    E2 +
                    computeLenThisBase(Q_Bsq_M) * lenM,
            };
        }

        function fullLoopCounters() {
            return {
                steps:
                    674 +
                    180 * lenB +
                    61 * ((lenB * (lenB + 1)) / 2) +
                    149 * lenM +
                    19 * lenE +
                    44 * E2 +
                    66 * lenB * lenM +
                    computeLenThisBase(Q_Bsq_M) * (30 + 33 * lenM) +
                    14 * computeLenThisBase(R_Bsq_M) -
                    14 * first_diff_chunk(BM, M) -
                    14 * first_diff_chunk(Bsq, M) -
                    7 * first_diff_chunk(M, [0n]) -
                    7 * first_diff_chunk(M, R_Bsq_M) -
                    5 * NZ_Bsq,
                binaries:
                    36 +
                    21 * lenB +
                    9 * ((lenB * (lenB + 1)) / 2) +
                    12 * lenM +
                    2 * lenE +
                    3 * E2 +
                    8 * lenB * lenM +
                    computeLenThisBase(Q_Bsq_M) * (1 + 4 * lenM) +
                    computeLenThisBase(R_Bsq_M) -
                    4 * first_diff_chunk(BM, M) -
                    4 * first_diff_chunk(Bsq, M) -
                    2 * first_diff_chunk(M, [0n]) -
                    2 * first_diff_chunk(M, R_Bsq_M) -
                    NZ_Bsq,
                ariths:
                    4 +
                    lenB +
                    (lenB * (lenB + 1)) / 2 +
                    E2 +
                    2 * lenB * lenM +
                    computeLenThisBase(Q_Bsq_M) * lenM,
            };
        }
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