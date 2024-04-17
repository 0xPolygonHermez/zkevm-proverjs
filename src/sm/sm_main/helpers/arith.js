const { fea2scalar } = require('@0xpolygonhermez/zkevm-commonjs/src/smt-utils.js');
const Helper = require('./helper.js')
const {
    scalar2fea,
    fea2String,
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

const MASK_256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
const MASK_128 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
const P2_256 = 2n ** 256n;

const ARITH_OPERATIONS = ['ARITH', 'ARITH_ECADD_DIFFERENT', 'ARITH_ECADD_SAME', 'ARITH_BN254_MULFP2', 'ARITH_BN254_ADDFP2', 'ARITH_BN254_SUBFP2', 
                          'ARITH_MOD', 'ARITH_384_MOD', 'ARITH_BLS12381_MULFP2', 'ARITH_BLS12381_ADDFP2', 'ARITH_BLS12381_SUBFP2', 'ARITH_256TO384'];
const ARITH_BASE = 1;
const ARITH_ECADD_DIFFERENT = 2;
const ARITH_ECADD_SAME = 3;
const ARITH_BN254_MULFP2 = 4;
const ARITH_BN254_ADDFP2 = 5;
const ARITH_BN254_SUBFP2 = 6;
const ARITH_MOD = 7;
const ARITH_384_MOD = 8;
const ARITH_BLS12381_MULFP2 = 9;
const ARITH_BLS12381_ADDFP2 = 10;
const ARITH_BLS12381_SUBFP2 = 11;
const ARITH_256TO384 = 12;

module.exports = class Arith extends Helper {
    setup(props) {
        super.setup(props);
        this.frZeros = scalar2fea(this.ctx.Fr, 0n);
    }
    isFreeInEquation(arithEquation) {
        return arithEquation == ARITH_MOD || arithEquation == ARITH_384_MOD || arithEquation == ARITH_256TO384;
    }
    calculate(arithEquation, a, b, c = 0n, d = 0n) {
        const Fr = this.ctx.Fr;
        const operation = ARITH_OPERATIONS[arithEquation - 1] ?? `ARITH_EQUATION_${arithEquation}`;

        let _a,_b,_c, _d;
        switch (arithEquation) {
            case ARITH_MOD:
                _c = this.safeFea2scalar(Fr, c);
                _d = this.safeFea2scalar(Fr, d);
            case ARITH_256TO384:
                _a = this.safeFea2scalar(Fr, a);
                _b = this.safeFea2scalar(Fr, b);
                break;
            case ARITH_384_MOD:
                _a = this.safeFea384ToScalar(Fr, a);
                _b = this.safeFea384ToScalar(Fr, b);
                _c = this.safeFea384ToScalar(Fr, c);
                _d = this.safeFea384ToScalar(Fr, d);
                break;
            default:
                throw new Error(`Invalid arithmetic ${operation} is undefined for freeTag at ${this.ctx.sourceRef}`);
        }
        if (arithEquation == ARITH_256TO384) {
            if (_b > MASK_128) {
                throw new Error(`B is too big, ${_b} >= 2**16 on ARITH_256TO384 operation at ${this.ctx.sourceRef}`);
            }
            return this.scalarToFea384(Fr, _a + P2_256 * _b);
        }
        if (_d === 0n) {
            throw new Error(`Modular arithmetic is undefined when D is zero ${this.ctx.sourceRef}`);
        }
        const op = ((_a * _b) + _c) % _d;
        if (arithEquation === ARITH_MOD) {
            return scalar2fea(Fr, op);
        }
        return this.scalarToFea384(Fr, op);
    }
    verify(arithEquation, a, b, op, c = 0n, d = 0n, e = 0n, required = []) {
        const Fr = this.ctx.Fr;
        const Fec = this.ctx.Fec;

        const operation = ARITH_OPERATIONS[arithEquation - 1] ?? `ARITH_EQUATION_${arithEquation}`;

        let same12 = 0n;
        let useE = 1n;
        let useCD = 1n;

        // pols.arithSame12[i] = (arithEquation == 3) ? 1n : 0n;
        // pols.arithUseE[i] = (arithEquation == 1 || arithEquation == 7 || arithEquation == 8 || l.artih) ? 0n : 1n;
        // pols.arithUseCD[i] = (arithEquation == 1 || arithEquation == 7) ? 0n : 1n;
    
        let chunkToScalar, fp;
        if (arithEquation >= ARITH_384_MOD) {
            chunkToScalar = this.safeFea384ToScalar;
            fp = this.ctx.FpBLS12381;
        } else {
            chunkToScalar = this.safeFea2scalar;
            fp = this.ctx.FpBN254;
        }
        if (arithEquation == ARITH_BASE || arithEquation == ARITH_MOD || arithEquation == ARITH_384_MOD) {
            useE = 0n;
            const _a = chunkToScalar(Fr, a);
            const _b = chunkToScalar(Fr, b);
            const _c = chunkToScalar(Fr, c);
            const _d = chunkToScalar(Fr, d);
            const _op = chunkToScalar(Fr, op);

            let left, right;
            if (arithEquation == ARITH_BASE) {
                left = Scalar.add(Scalar.mul(_a, _b), _c);
                right = Scalar.add(Scalar.shl(_d, 256), _op);
            } else {
                if (Scalar.isZero(_d)) {
                    throw new Error(`Modular arithmetic is undefined when D is zero ${this.ctx.sourceRef}`);
                }
                left = Scalar.mod(Scalar.add(Scalar.mul(_a, _b), _c), _d);
                right = _op;
            }

            if (!Scalar.eq(left, right)) {
                console.log('A: '+_a.toString()+' (0x'+_a.toString(16)+')');
                console.log('B: '+_b.toString()+' (0x'+_b.toString(16)+')');
                console.log('C: '+_c.toString()+' (0x'+_c.toString(16)+')');
                console.log('D: '+_d.toString()+' (0x'+_d.toString(16)+')');
                console.log('op: '+_op.toString()+' (0x'+_op.toString(16)+')');

                console.log(left.toString() + ' (0x'+left.toString(16)+') != '+ right.toString()
                                            + ' (0x' + right.toString(16)+')');
                throw new Error(`Arithmetic ${operation} does not match ${this.ctx.sourceRef}`);
            }
            required.push({ x1: a, y1: b, x2: c, y2: d, x3: [...this.frZeros], y3: op, arithEquation});
        }
        else if ((arithEquation >= ARITH_ECADD_DIFFERENT && arithEquation <= ARITH_BN254_SUBFP2) ||
                 (arithEquation >= ARITH_BLS12381_MULFP2 && arithEquation <= ARITH_BLS12381_SUBFP2)) {   
            const dbl = (arithEquation == ARITH_ECADD_SAME);
            const x1 = chunkToScalar(Fr, a);
            const y1 = chunkToScalar(Fr, b);
            const x2 = dbl ? x1 : chunkToScalar(Fr, c);
            const y2 = dbl ? y1 : chunkToScalar(Fr, d);
            const x3 = chunkToScalar(Fr, e);
            const y3 = chunkToScalar(Fr, op);

            let s;
            if (arithEquation == ARITH_ECADD_DIFFERENT || arithEquation == ARITH_ECADD_SAME) {
                if (dbl) {
                    // Division by zero must be managed by ROM before call ARITH
                    const divisor = Fec.add(Fec.e(y1), Fec.e(y1));
                    same12 = 1n;
                    useCD = 0n;
                    if (Fec.isZero(divisor)) {
                        throw new Error(`Invalid arithmetic op, DivisionByZero arithEquation:${arithEquation} ${this.ctx.sourceRef}`);
                    }
                    s = Fec.div(Fec.mul(3n, Fec.mul(Fec.e(x1), Fec.e(x1))), divisor);
                }
                else {
                    // Division by zero must be managed by ROM before call ARITH
                    const deltaX = Fec.sub(Fec.e(x2), Fec.e(x1))
                    if (Fec.isZero(deltaX)) {
                        throw new Error(`Invalid arithmetic op, DivisionByZero arithEquation:${arithEquation} ${this.ctx.sourceRef}`);
                    }
                    s = Fec.div(Fec.sub(Fec.e(y2), Fec.e(y1)), deltaX);
                }
            }
            let _x3,_y3;
            switch (arithEquation) {
                case ARITH_ECADD_DIFFERENT:
                    _x3 = Fec.sub(Fec.mul(s, s), Fec.add(Fec.e(x1), Fec.e(x2)));
                    _y3 = Fec.sub(Fec.mul(s, Fec.sub(Fec.e(x1),x3)), Fec.e(y1));
                    break;

                case ARITH_ECADD_SAME:
                    _x3 = Fec.sub(Fec.mul(s, s), Fec.add(Fec.e(x1), Fec.e(x1)));
                    _y3 = Fec.sub(Fec.mul(s, Fec.sub(Fec.e(x1),x3)), Fec.e(y1));
                    break;

                case ARITH_BN254_MULFP2:
                case ARITH_BLS12381_MULFP2:
                    _x3 = fp.sub(fp.mul(fp.e(x1), fp.e(x2)), fp.mul(fp.e(y1), fp.e(y2)));
                    _y3 = fp.add(fp.mul(fp.e(y1), fp.e(x2)), fp.mul(fp.e(x1), fp.e(y2)));
                    break;

                case ARITH_BN254_ADDFP2:
                case ARITH_BLS12381_ADDFP2:
                    _x3 = fp.add(fp.e(x1), fp.e(x2));
                    _y3 = fp.add(fp.e(y1), fp.e(y2));
                    break;

                case ARITH_BN254_SUBFP2:
                case ARITH_BLS12381_SUBFP2:
                    _x3 = fp.sub(fp.e(x1), fp.e(x2));      
                    _y3 = fp.sub(fp.e(y1), fp.e(y2));
                    break;
            }
            const x3eq = Scalar.eq(x3, _x3);
            const y3eq = Scalar.eq(y3, _y3);

            if (!x3eq || !y3eq) {
                console.log('x1,y1: ('+x1.toString()+', '+y1.toString()+')');
                if (!dbl) {
                    console.log('x2,y2: ('+x2.toString()+', '+y2.toString()+')');
                }

                console.log('x3: '+x3.toString()+(x3eq ? ' == ' : ' != ')+_x3.toString());
                console.log('y3: '+y3.toString()+(y3eq ? ' == ' : ' != ')+_y3.toString());

                throw new Error(`Arithmetic ${operation} point does not match: ${this.ctx.sourceRef}`);
            }

            required.push({x1: a, y1: b,x2: dbl ? a:c, y2: dbl ? b:d, x3: e, y3: op, arithEquation});
        } 
        else if (l.arith == ARITH_256TO384) {
            const _a = this.safeFea2scalar(Fr, a);
            const _b = this.safeFea2scalar(Fr, b);
            const _op = this.safeFea384ToScalar(Fr, op);
            if (_b > MASK_128) {
                throw new Error(`B is too big, ${_b} >= 2**16 on ARITH_256TO384 operation at ${this.ctx.sourceRef}`);
            }
            const _expected = _a + P2_256 * _b;
            if (_op !== expected) {
                console.log('A: '+_a.toString()+' (0x'+_a.toString(16)+')');
                console.log('B: '+_b.toString()+' (0x'+_b.toString(16)+')');
                console.log('op: '+_op.toString()+' (0x'+_op.toString(16)+')');

                throw new Error(`Arithmetic ${operation} point does not match: ${this.ctx.sourceRef}`);
            }
            useCD = 0n;
            useE = 0n;
            required.push({x1: a, y1: b,x2: dbl ? a:c, y2: dbl ? b:d, x3: e, y3: op, arithEquation});
        }
        else {
            throw new Error(`Invalid arithmetic ${operation} arithEquation:${arithEquation} at ${this.ctx.sourceRef}`);
        }
        return {flags: {same12, useE, useCD}};
    }
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

    // BLS12-381

    eval_ARITH_BLS12381_MULFP2_X(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[0]));
        const y1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[1]));
        const x2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[2]));
        const y2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[3]));

        return this.scalarToFea384(this.Fr, ctx.FpBLS12381.sub(ctx.FpBLS12381.mul(x1,x2), ctx.FpBLS12381.mul(y1, y2)));
    }

    eval_ARITH_BLS12381_MULFP2_Y(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[0]));
        const y1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[1]));
        const x2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[2]));
        const y2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[3]));

        return this.scalarToFea384(this.Fr, ctx.FpBLS12381.add(ctx.FpBLS12381.mul(x1,y2), ctx.FpBLS12381.mul(x2, y1)));
    }

    eval_ARITH_BLS12381_ADDFP2(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[0]));
        const x2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[1]));

        return this.scalarToFea384(this.Fr, ctx.FpBLS12381.add(x1,x2));
    }

    eval_ARITH_BLS12381_SUBFP2(ctx, tag)
    {
        // const ctxFullFe = {...ctx, fullFe: true};
        const x1 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[0]));
        const x2 = ctx.FpBLS12381.e(this.evalCommand(ctx, tag.params[1]));

        return this.scalarToFea384(this.Fr, ctx.FpBLS12381.sub(x1,x2));
    }

    eval_FROM_384_TO_256_H(ctx, tag)
    {
        const value = this.evalCommand({...ctx, mode384: true}, tag.params[0]);
        return this.scalar2fea(ctx.Fr, (value >> 256n) & MASK_128);
    }

    eval_FROM_384_TO_256_L(ctx, tag)
    {
        const value = this.evalCommand({...ctx, mode384: true}, tag.params[0]);
        return this.scalar2fea(ctx.Fr, MASK_256);
    }
}