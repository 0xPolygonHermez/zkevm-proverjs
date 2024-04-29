const {fea2scalar} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

// all arith sources and tools on https://github.com/hermeznetwork/sm_arith.git

const arithEq0 = require('./sm_arith_eq0');
const arithEq1 = require('./sm_arith_eq1');
const arithEq2 = require('./sm_arith_eq2');
const arithEq3 = require('./sm_arith_eq3');
const arithEq4 = require('./sm_arith_eq4');
const arithEq5 = require('./sm_arith_eq5');
const arithEq6 = require('./sm_arith_eq6');
const arithEq7 = require('./sm_arith_eq7');
const arithEq8 = require('./sm_arith_eq8');
const arithEq9 = require('./sm_arith_eq9');
const arithEq10 = require('./sm_arith_eq10');
const arithEq11 = require('./sm_arith_eq11');
const arithEq12 = require('./sm_arith_eq12');
const arithEq13 = require('./sm_arith_eq13');
const arithEq14 = require('./sm_arith_eq14');
const arithEq15 = require('./sm_arith_eq15');
const arithEq16 = require('./sm_arith_eq16');
const arithEq17 = require('./sm_arith_eq17');
const arithEq18 = require('./sm_arith_eq18');
const arithEq19 = require('./sm_arith_eq19');
const { processorUtils } = require("@0xpolygonhermez/zkevm-commonjs");

const F1Field = require("ffjavascript").F1Field;

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

const ARITH_CYCLE = 32;
const INPUT_CHUNKS = 16;

const PRIME_SECP256K1_CHUNKS = [ 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn,
                                 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFEn, 0xFFFFn, 0xFC2Fn ];

const PRIME_BN254_CHUNKS = [ 0x3064n, 0x4E72n, 0xE131n, 0xA029n, 0xB850n, 0x45B6n, 0x8181n, 0x585Dn,
                             0x9781n, 0x6A91n, 0x6871n, 0xCA8Dn, 0x3C20n, 0x8C16n, 0xD87Cn, 0xFD47n ];

const PRIME_BLS12381_CHUNKS = [ 0x1A0111n, 0xEA397Fn, 0xE69A4Bn, 0x1BA7B6n, 0x434BACn, 0xD76477n, 0x4B84F3n, 0x8512BFn, 
                                0x6730D2n, 0xA0F6B0n, 0xF6241En, 0xABFFFEn, 0xB153FFn, 0xFFB9FEn, 0xFFFFFFn, 0xFFAAABn ];

const P2_256 = 2n**256n;
const P2_259 = 2n**259n;
const P2_384 = 2n**384n;
const P2_388 = 2n**388n;

const CARRY_OFFSET = 2n**28n;

class ArithConstants {
    constructor(pols) {
        this.N = pols.GL_SIGNED_22BITS.length;

        this.buildCycle(pols.PRIME_SECP256K1_CHUNKS, PRIME_SECP256K1_CHUNKS);
        this.buildCycle(pols.PRIME_BN254_CHUNKS, PRIME_BN254_CHUNKS);
        this.buildCycle(pols.PRIME_BLS12381_CHUNKS, PRIME_BLS12381_CHUNKS);
        this.buildByte2A(pols.BYTE_2A_BIT14_SEL, pols.BYTE_2A_BIT14, 256, 2**14);
        this.buildRange(pols.GL_SIGNED_22BITS, -(2n**22n), (2n**22n)-1n);
        this.buildRange(pols.BITS7_C256, 0n, 127n, 2**8);
        this.buildRange(pols.BITS7_C32K, 0n, 127n, 2**15);
    }

    buildCycle(pvalue, values) {
        let i = 0;
        let j = 0;
        for (let i = 0; i < this.N; ++i) {
            if (j >= values.length) j = 0;
            pvalue[i] = values[j];
            ++j;
        }
    }
    buildByte2A(psel, pvalue, cycle, selCycle) {
        let p = 0;

        // when psel is zero, only values from 0 to cycle are included,
        // how is Byte2A need to repeat each value byte times (256)
        for (let i = 0; i < cycle; ++i) {
            for (let j = 0; j < 256; ++j) {
                psel[p] = 0n;
                pvalue[p] = BigInt(i);
                ++p;
            }
        }

        // when psel is one, only values from 0 to selCycle are included,
        // how is Byte2A need to repeat each value byte times (256)
        for (let i = 0; i < selCycle; ++i) {
            for (let j = 0; j < 256; ++j) {
                psel[p] = 1n;
                pvalue[p] = BigInt(i);
                ++p;
            }
        }

        // fill to end with zero and zero, a valid combination
        for (let i = p; i < this.N; ++i) {
            psel[i] = pvalue[i] = 0n;
        }
    }

    buildRange(pols, fromValue, toValue, steps = 1) {
        let value = fromValue;
        let csteps = steps;
        for (let i = 0; i < this.N; i++) {
            pols[i] = value;
            csteps -= 1;
            if (csteps <= 0) {
                csteps = steps;
                if (value === toValue) value = fromValue;
                else value += 1n;
            }
        }
    }
}

module.exports.buildConstants = async function (pols) { 
    new ArithConstants(pols); 
};
module.exports.execute = async function (pols, inputs) { 
    const executor = new ArithExecutor(); 
    executor.execute(pols, inputs);
}

class ArithExecutor {
    constructor() {
        // Field Elliptic Curve (384 bits)
        this.pFec = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
        this.Fec = new F1Field(this.pFec);

        // Field Complex Multiplication BN254 (256 bits)
        this.pBN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
        this.FpBN254 = new F1Field(this.pBN254);

        // Field Complex Multiplication BLS12-381 (384 bits)
        this.pBLS12381 = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
        this.FpBLS12381 = new F1Field(this.pBLS12381);
    
        this.pFr = 0xffffffff00000001n;
        this.Fr = new F1Field(this.pFr);
        this.eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate,
                            arithEq5.calculate, arithEq6.calculate, arithEq7.calculate, arithEq8.calculate, arithEq9.calculate,
                            arithEq10.calculate, arithEq11.calculate, arithEq12.calculate, arithEq13.calculate, arithEq14.calculate,
                            arithEq15.calculate, arithEq16.calculate, arithEq17.calculate, arithEq18.calculate, arithEq19.calculate];
        this.offset = 0;
    }
    setupEquation(inputIndex, input) {
        this.arithEquation = Number(input.arithEquation);
        this.input = input;
        this.location = `input #${inputIndex} ${ARITH_OPERATIONS[this.arithEquation - 1] ?? '@'+arithEquation}`;
        this.offset = inputIndex * ARITH_CYCLE;
        this.setSelectorPols();
        this.moduleCheck = this.arithEquation !== ARITH_BASE && this.arithEquation !== ARITH_256TO384;
    }
    execute(pols, inputs) {
        // Get N from definitions
        const N = pols.x1[0].length;
        this.pols = pols;

        this.initPols(N, pols, inputs.length * ARITH_CYCLE);

        for (let i = 0; i < inputs.length; i++) {
            this.setupEquation(i, inputs[i]);
            const [x1,y1,x2,y2,x3,y3] = this.prepareInputPols(inputs[i]);

            // Therefore, as the quotient needs to be represented in our VM, we need to know
            // the worst negative case and add an offset so that the resulting name is never negative.
            // Then, this offset is also added in the PIL constraint to ensure the equality.
            //
            // Note1: Since we can choose whether the quotient is positive or negative, we choose it so
            //        that the added offset is the lowest.
            //
            // Note2: x1,x2,y1,y2,x3,y3,s are well-composed with chunks of 16 or 24 bits verified with
            //        range check. For this reason we could assume that x1,x2,y1,y2,s ∈ [0, 2^256-1] in
            //        case of 256 bits equation and x1,x2,y1,y2,s ∈ [0, 2^384-1] in case of 384 bit equations.

            const [s,q0,q1,q2] = this.calculateSQPols(x1, y1, x2, y2, x3, y3);            

            let xAreDifferent = false;
            let valueLtPrime;
            // y2_clock;
            // x3y3_clock;
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                const index = this.offset + step;
                const nextIndex = (index + 1) % N;
                const chunkStep = step % INPUT_CHUNKS;
                if (chunkStep === 0) {
                    valueLtPrime = false;
                }
                pols.y2_clock[index] = pols.y2[15 - chunkStep][this.offset];

                // ARITH_ECADD_DIFFERENT is select need to check that points are diferent
                if (this.arithEquation === ARITH_ECADD_DIFFERENT && step < INPUT_CHUNKS) {
                    if (xAreDifferent === false) {
                        const delta = this.Fr.sub(pols.x2[step][index], pols.x1[step][index]);
                        pols.xDeltaChunkInverse[index] = this.Fr.isZero(delta) ? 0n : this.Fr.inv(delta);
                        xAreDifferent = this.Fr.isZero(delta) ? false : true;
                    }
                    pols.xAreDifferent[nextIndex] = xAreDifferent ? 1n : 0n;
                }

                // If either selEq1,selEq2,selEq3,selEq4,selEq5,selEq6 is selected, we need to ensure that x3, y3 is alias free.
                // Recall that selEq1,selEq2 work over the base field of the Secp256k1 curve, selEq3,selEq4,selEq5 works over the
                // base field of the BN254 curve and selEq6 works modulo y2.

                const chunkValue = step < INPUT_CHUNKS ? pols.x3[15 - chunkStep][this.offset] : pols.y3[15 - chunkStep][this.offset];
                pols.x3y3_clock[index] = chunkValue;

                if (this.moduleCheck) {
                    let primeChunk = this.getPrimeChunk(chunkStep, pols.y2[15 - chunkStep][this.offset]);

                    const chunkLtPrime = valueLtPrime ? 0n : BigInt(this.Fr.lt(chunkValue, primeChunk));
                    valueLtPrime = valueLtPrime || chunkLtPrime;
                    pols.primeChunk[index] = primeChunk;
                    pols.chunkLtPrime[index] = chunkLtPrime;
                    pols.valueLtPrime[nextIndex] = valueLtPrime ? 1n : 0n;
                    const delta = this.Fr.e(primeChunk - chunkValue - chunkLtPrime);
                    pols.hs_bit_delta[index] = (delta >> 23n) & 0x01n;
                    pols.ls_bits_delta[index] = delta & 0x7FFFFn;
                } else {
                    pols.primeChunk[index] = chunkValue;
                    pols.chunkLtPrime[index] = 0n;
                    pols.valueLtPrime[nextIndex] = 0n;
                    pols.hs_bit_delta[index] = 0n;
                    pols.ls_bits_delta[index] = 0n;
                }
                pols.resultEq[index] = (step === (ARITH_CYCLE - 1)) ? 1n: 0n;
            }

            // calculateEquation need all pols calculated
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                this.calculateEquationStep(step);
            }
        }
    }

    calculateEquationStep(step) {
        switch (this.arithEquation) {
            case ARITH_BASE:
                this.calculateCarryAndEquationStep(0, 0, step);
                break;

            case ARITH_ECADD_DIFFERENT:
                this.calculateCarryAndEquationStep(1, 0, step);
                this.calculateCarryAndEquationStep(3, 1, step);
                this.calculateCarryAndEquationStep(4, 2, step);
                break;

            case ARITH_ECADD_SAME:
                this.calculateCarryAndEquationStep(2, 0, step);
                this.calculateCarryAndEquationStep(3, 1, step);
                this.calculateCarryAndEquationStep(4, 2, step);
                break;

            case ARITH_BN254_MULFP2:
                this.calculateCarryAndEquationStep(5, 0, step);
                this.calculateCarryAndEquationStep(6, 1, step);
                break;

            case ARITH_BN254_ADDFP2:
                this.calculateCarryAndEquationStep(7, 0, step);
                this.calculateCarryAndEquationStep(8, 1, step);
                break;

            case ARITH_BN254_SUBFP2:
                this.calculateCarryAndEquationStep(9, 0, step);
                this.calculateCarryAndEquationStep(10, 1, step);
                break;

            case ARITH_MOD:
                this.calculateCarryAndEquationStep(11, 0, step);
                break;

            case ARITH_384_MOD:
                this.calculateCarryAndEquationStep(12, 0, step, 24n);
                break;

            case ARITH_BLS12381_MULFP2:
                this.calculateCarryAndEquationStep(13, 0, step, 24n);
                this.calculateCarryAndEquationStep(14, 1, step, 24n);
                break;

            case ARITH_BLS12381_ADDFP2:
                this.calculateCarryAndEquationStep(15, 0, step, 24n);
                this.calculateCarryAndEquationStep(16, 1, step, 24n);
                break;

            case ARITH_BLS12381_SUBFP2:
                this.calculateCarryAndEquationStep(17, 0, step, 24n);
                this.calculateCarryAndEquationStep(18, 1, step, 24n);
                break;

            case ARITH_256TO384:
                this.calculateCarryAndEquationStep(19, 0, step, 24n);
                break;
        }
    }
    calculateCarryAndEquationStep(eqIndex, carryIndex, step, bits = 16n) {
        const eqValue = this.eqCalculates[eqIndex](this.pols, step, this.offset);
        const carry = step > 0 ? this.getCarry(carryIndex, step) : 0n;
        const mask = (1n << bits) - 1n;
        this.assert(((eqValue + carry) & mask) === 0n, `Equation ${eqIndex}[${step}]:${eqValue} and carry[${carryIndex}][${step}]:${carry} do not sum 0 module 2**${bits}`);
        this.setCarry(carryIndex, step + 1, (eqValue + carry) >> bits);
        // TODO: range check ?
    }
    getCarry(carryIndex, step) {
        switch (carryIndex) {
            case 0: return (this.pols.ls_carry0[this.offset + step] + (this.pols.hs_carry0[this.offset + step] << 23n) - CARRY_OFFSET);
            case 1: return (this.pols.ls_carry1[this.offset + step] + (this.pols.hs_carry1[this.offset + step] << 23n) - CARRY_OFFSET);
            case 2: return this.pols.carry2[this.offset + step];
        }
        throw new Error(`Invalid carrIndex ${carryIndex}`);
    }
    setCarry(carryIndex, step, value) {
        switch (carryIndex) {
            case 0: 
                this.pols.ls_carry0[this.offset + step] = (value + CARRY_OFFSET) & 0x7FFFFFn;
                this.pols.hs_carry0[this.offset + step] = (value + CARRY_OFFSET) >> 23n;
                break;

            case 1: 
                this.pols.ls_carry1[this.offset + step] = (value + CARRY_OFFSET) & 0x7FFFFFn;
                this.pols.hs_carry1[this.offset + step] = (value + CARRY_OFFSET) >> 23n;
                break;

            case 2:
                this.pols.carry2[this.offset + step] = value;
                break;
        
            default:
                throw new Error(`Invalid carrIndex ${carryIndex}`);
        }
    }
    getPrimeChunk(step, moduleChunk) {
        switch (this.arithEquation) {
            case ARITH_ECADD_DIFFERENT:
            case ARITH_ECADD_SAME:
                return PRIME_SECP256K1_CHUNKS[step];

            case ARITH_BN254_MULFP2:
            case ARITH_BN254_ADDFP2:
            case ARITH_BN254_SUBFP2:
                return PRIME_BN254_CHUNKS[step];

            case ARITH_MOD:
            case ARITH_384_MOD:
                return moduleChunk;

            case ARITH_BLS12381_MULFP2:
            case ARITH_BLS12381_ADDFP2:
            case ARITH_BLS12381_SUBFP2:
                return PRIME_BLS12381_CHUNKS[step];
        }
        throw new Error(`Invalid arithEquation ${this.arithEquation} to call getPrimeChunk`)
    }

    calculateSQPols(x1, y1, x2, y2, x3, y3) {
        let s, q0, q1, q2;
        s = q0 = q1 = q2 = 0n;
        let chunkBits = 16n;
        switch (this.arithEquation) {
            case ARITH_ECADD_DIFFERENT:
                [s, q0] = this.calculateAddPointSQ(x1, y1, x2, y2);
                [q1,q2] = this.calculateAddPointQs(s, x1, y1, x2, y2, x3, y3);
                break;
            case ARITH_ECADD_SAME:
                [s, q0] = this.calculateDblPointSQ(x1, y1);
                [q1,q2] = this.calculateAddPointQs(s, x1, y1, x2, y2, x3, y3);
                break;
            case ARITH_BN254_MULFP2:
                [q1,q2] = this.calculateMulFp2Qs(this.pBN254, x1, y1, x2, y2, x3, y3, [P2_259, 0n]);
                break;
            case ARITH_BN254_ADDFP2:
                [q1,q2] = this.calculateAddFp2Qs(this.pBN254, x1, y1, x2, y2, x3, y3);
                break;
            case ARITH_BN254_SUBFP2:
                [q1,q2] = this.calculateSubFp2Qs(this.pBN254, x1, y1, x2, y2, x3, y3,[8n,8n]);
                break;
            case ARITH_MOD:
                [q0, q1] = this.calculateModularQs(256n, x1, y1, x2, y2, y3);
                break;
            case ARITH_384_MOD:
                [q0, q1] = this.calculateModularQs(384n, x1, y1, x2, y2, y3);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_MULFP2:
                [q1,q2] = this.calculateMulFp2Qs(this.pBLS12381, x1, y1, x2, y2, x3, y3,[P2_388, 0n]);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_ADDFP2:
                [q1,q2] = this.calculateAddFp2Qs(this.pBLS12381, x1, y1, x2, y2, x3, y3);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_SUBFP2:
                [q1,q2] = this.calculateSubFp2Qs(this.pBLS12381, x1, y1, x2, y2, x3, y3,[16n,16n]);
                chunkBits = 24n;
                break;
        }
        this.valueToPols(s, chunkBits, this.pols.s);
        this.valueToPols(q0, chunkBits, this.pols.q0);
        this.valueToPols(q1, chunkBits, this.pols.q1);
        this.valueToPols(q2, chunkBits, this.pols.q2);

        // how chunk values could has 24 bits (or more in the case of qs high significant chunk) is
        // necessary divide in two chunk to do range check.

        this.splitChunkRangeCheck(this.pols.s,  0, INPUT_CHUNKS, 0, this.pols.hsc_sq0q1, this.pols.lsc_sq0q1);
        this.splitChunkRangeCheck(this.pols.q0, 0, INPUT_CHUNKS - 1, INPUT_CHUNKS, this.pols.hsc_sq0q1, this.pols.lsc_sq0q1);
        this.splitChunkRangeCheck(this.pols.q1, 0, 1, INPUT_CHUNKS * 2 - 1, this.pols.hsc_sq0q1, this.pols.lsc_sq0q1);

        this.splitChunkRangeCheck(this.pols.q1, 1, INPUT_CHUNKS - 2, 0, this.pols.hsc_q1q2qh, this.pols.lsc_q1q2qh);
        this.splitChunkRangeCheck(this.pols.q2, 0, INPUT_CHUNKS, INPUT_CHUNKS - 2, this.pols.hsc_q1q2qh, this.pols.lsc_q1q2qh);
        this.splitChunkRangeCheck(this.pols.q0, INPUT_CHUNKS - 1, 1, INPUT_CHUNKS * 2 - 2, this.pols.hsc_q1q2qh, this.pols.lsc_q1q2qh);
        this.splitChunkRangeCheck(this.pols.q1, INPUT_CHUNKS - 1, 1, INPUT_CHUNKS * 2 - 1, this.pols.hsc_q1q2qh, this.pols.lsc_q1q2qh);

        return [s, q0, q1, q2];
    }

    // method to split chunk of 24 bits o more:
    // pols = hpols * 2**16 + lpols 
    // less 16 significant bits and other with the rest
    splitChunkRangeCheck(pols, from, count, relative_offset, hpols, lpols) {
        for (let index = 0; index < count; ++index) {
            const value = pols[from + index][this.offset];
            // console.log({pols: pols[from + index], from, index, offset: this.offset, value});
            hpols[this.offset + relative_offset + index] = value >> 16n;
            lpols[this.offset + relative_offset + index] = value & 0xFFFFn;
        }
    }
    // method to split chunk of 24 bits o more, in tree chunks:
    // pols = hbitpols * 2**23 + hpols * 2**16 + lpols 
    splitChunkRangeCheck3P(pols, from, count, relative_offset, hbitpols, hpols, lpols) {
        for (let index = 0; index < count; ++index) {
            let value = pols[from+index][this.offset];
            lpols[this.offset + relative_offset + index] = value & 0xFFFFn;
            value = value >> 16n;
            hpols[this.offset + relative_offset + index] = value && 0x7Fn;
            hbitpols[this.offset + relative_offset + index] = (value >> 7n) && 0x01n;
        }
    }
    getChunkBits() {
        switch (this.arithEquation) {
            case ARITH_BASE:
            case ARITH_ECADD_DIFFERENT:
            case ARITH_ECADD_SAME:
            case ARITH_BN254_MULFP2:
            case ARITH_BN254_ADDFP2:
            case ARITH_BN254_SUBFP2:
            case ARITH_MOD:
                return [16n, 16n];

            case ARITH_384_MOD:
            case ARITH_BLS12381_MULFP2:
            case ARITH_BLS12381_ADDFP2:
            case ARITH_BLS12381_SUBFP2:
                return [24n, 24n];

            case ARITH_256TO384:
                return [16n, 24n];

            default:
                throw new Error(`${this.location}: Invalid arithmetic operation ${this.arithEquation}`);
        }
    }
    prepareInputPols(input) {
        const [bits1, bits2] = this.getChunkBits();
        this.forcedS = input.s ?? false;

        this.inputToPols(this.pols.x1, input.x1, bits1);
        this.inputToPols(this.pols.y1, input.y1, bits1);

        this.inputToPols(this.pols.x2, input.x2, bits2);
        this.inputToPols(this.pols.y2, input.y2, bits2);

        this.inputToPols(this.pols.x3, input.x3, bits2);
        this.inputToPols(this.pols.y3, input.y3, bits2);

        // how chunk values could has 24 bits is necessary divide in two chunk to do range check.

        this.splitChunkRangeCheck(this.pols.x1, 0, INPUT_CHUNKS, 0, this.pols.hsc_x1y1, this.pols.lsc_x1y1);
        this.splitChunkRangeCheck(this.pols.y1, 0, INPUT_CHUNKS, INPUT_CHUNKS, this.pols.hsc_x1y1, this.pols.lsc_x1y1);

        this.splitChunkRangeCheck(this.pols.x2, 0, INPUT_CHUNKS, 0, this.pols.hsc_x2y2, this.pols.lsc_x2y2);
        this.splitChunkRangeCheck(this.pols.y2, 0, INPUT_CHUNKS, INPUT_CHUNKS, this.pols.hsc_x2y2, this.pols.lsc_x2y2);      

        this.splitChunkRangeCheck(this.pols.x3, 0, INPUT_CHUNKS, 0, this.pols.hsc_x3y3, this.pols.lsc_x3y3);
        this.splitChunkRangeCheck(this.pols.y3, 0, INPUT_CHUNKS, INPUT_CHUNKS, this.pols.hsc_x3y3, this.pols.lsc_x3y3);

        const [_bits1, _bits2] = [2n*bits1, 2n*bits2];
        return [this.feaToScalar(input.x1, _bits1), this.feaToScalar(input.y1, _bits1),
                this.feaToScalar(input.x2, _bits2), this.feaToScalar(input.y2, _bits2),
                this.feaToScalar(input.x3, _bits2), this.feaToScalar(input.y3, _bits2)];
    }
    calculateQ(module, eqvalue, offset, title, sign = 1n) {
        this.assert(module !== 0n, 'module is zero');
        const _q = eqvalue/module;
        this.assert((eqvalue - module*_q) === 0n, `with the calculated q the residual is not zero (${title})`);
        const q = offset + sign * _q;
        this.assert(q >= 0n, `the q with offset is negative (${title}). Actual value: ${q}, previous value: ${sign * _q}`);
        return q;
    }
    calculateAddPointSQ(x1, y1, x2, y2) {
        this.assert(!this.Fec.eq(x2,x1), `x1 and x2 are equals, but ADD_EC_DIFFERENT is called`);

        let s = this.forcedS;
        if (s === false) {
            s = this.Fec.div(this.Fec.sub(y2, y1), this.Fec.sub(x2, x1));
        }
        const q0 = this.calculateQ(this.pFec, s * x2 - s * x1 - y2 + y1, 2n ** 257n, 'q0 diff point');
        return [s, q0];
    }

    calculateDblPointSQ(x1, y1) {
        let s = this.forcedS;
        if (s === false) {
            s = this.Fec.div(this.Fec.mul(3n, this.Fec.mul(x1, x1)), this.Fec.add(y1, y1));
        }
        const q0 = this.calculateQ(this.pFec, s * 2n * y1 - 3n * x1 * x1, 2n ** 258n, 'q0 same point', -1n);
        return [s, q0];
    }
    assert(cond, msg) {
        if (cond) return;

        ++this.errorCount; 

        const _msg = this.location + ':' + msg;
        console.log(this.input);
        if (this.continueOnError) {
            console.warn(_msg);
        }
        throw new Error(_msg);
    }
    calculateAddPointQs(s, x1, y1, x2, y2, x3, y3) {
        const q1 = this.calculateQ(this.pFec, s * s - x1 - x2 - x3, 2n ** 2n, 'q1');
        const q2 = this.calculateQ(this.pFec, s * x1 - s * x3 - y1 - y3, 2n ** 257n, 'q2', -1n);
        return [q1,q2];
    }

    calculateMulFp2Qs(module, x1, y1, x2, y2, x3, y3, offsets = [0n,0n]) {
        const q1 = this.calculateQ(module, x1 * x2 - y1 * y2 - x3, offsets[0], 'q1', -1n);
        const q2 = this.calculateQ(module, y1 * x2 + x1 * y2 - y3, offsets[1], 'q2');
        return [q1,q2]
    }
    calculateAddFp2Qs(module, x1, y1, x2, y2, x3, y3, offsets = [0n,0n]) {
        const q1 = this.calculateQ(module, x1 + x2 - x3, offsets[0], 'q1');
        const q2 = this.calculateQ(module, y1 + y2 - y3, offsets[1], 'q2');
        return [q1,q2];
    }
    calculateSubFp2Qs(module, x1, y1, x2, y2, x3, y3, offsets = [0n,0n]) {
        const q1 = this.calculateQ(module, x1 - x2 - x3, offsets[0], 'q1', -1n);
        const q2 = this.calculateQ(module, y1 - y2 - y3, offsets[1], 'q2', -1n);
        return [q1,q2];
    }
    calculateModularQs(bits, x1, y1, x2, y2, y3) {
        const _q = this.calculateQ(y2, x1 * y1 + x2 - y3, 0n, 'q');
        return [_q & ((1n << bits) - 1n), _q >> bits];
    }
    setSelectorPols() {
        for (let isel = 0; isel < this.pols.selEq.length; ++isel) {
            const value = (Number(this.arithEquation) - 1) === isel ? 1n: 0n;
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                this.pols.selEq[isel][this.offset + step] = value;
            }
        }
    }
    inputToPols(pols, input, bits) {
        const mask = (1n << bits) - 1n;
        for (let index = 0; index < input.length; ++index) {
            const lchunk = input[index] & mask;
            const hchunk = input[index] >> bits;
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                pols[index * 2][this.offset + step] = lchunk;
                pols[index * 2 + 1][this.offset + step] = hchunk;
            }
        }
    }
    splitFea(chunks, bits) {
        let res = [];
        const mask = (1n << bits) - 1n;
        for(const chunk of chunks) {
            res.push(chunk & mask);
            res.push(chunk >> bits);
        }
        return res;
    }

    feaToScalar(chunks, bits) {
        let value = 0n;
        let count = 0;
        for (let index = chunks.length - 1; index >=0; --index) {
            ++count;
            value = (value << bits) + chunks[index];
        }
        // console.log({chunks, chunksv: chunks.slice().reverse().reduce((t,v) => (t << 16n) + v, 0n), bits, value, count});
        return value;
    }
    valueToPols(value, chunkBits, pols, chunks = 16) {
        chunkBits = BigInt(chunkBits);
        const mask = (1n << chunkBits) - 1n;
        // console.log({value, mask});
        for (let index = 0; index < chunks; ++index) {
            const pvalue = (index < (chunks - 1) ? (value & mask) : value);
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                pols[index][this.offset + step] = pvalue;
            }
            value = value >> chunkBits;
        }
    }
    initPols(N, pols, from = 0) {
        // Initialization
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < 16; j++) {
                pols.x1[j][i] = 0n;
                pols.y1[j][i] = 0n;
                pols.x2[j][i] = 0n;
                pols.y2[j][i] = 0n;
                pols.x3[j][i] = 0n;
                pols.y3[j][i] = 0n;
                pols.q0[j][i] = 0n;
                pols.q1[j][i] = 0n;
                pols.q2[j][i] = 0n;
                pols.s[j][i] = 0n;
                if (j < pols.selEq.length) pols.selEq[j][i] = 0n;
            }
            pols.y2_clock[i] = 0n;
            pols.x3y3_clock[i] = 0n;
            pols.hsc_x1y1[i] = 0n;
            pols.lsc_x1y1[i] = 0n;
            pols.hsc_x2y2[i] = 0n;
            pols.lsc_x2y2[i] = 0n;
            pols.hsc_x3y3[i] = 0n;
            pols.lsc_x3y3[i] = 0n;
            pols.hs_bit_delta[i] = 0n;
            pols.ls_bits_delta[i] = 0n;
            pols.hsc_sq0q1[i] = 0n;
            pols.lsc_sq0q1[i] = 0n;
            pols.hsc_q1q2qh[i] = 0n;
            pols.lsc_q1q2qh[i] = 0n;
            pols.resultEq[i] = 0n;
            pols.xDeltaChunkInverse[i] = 0n;
            pols.xAreDifferent[i] = 0n;

            // by default valueLtPrime must be one
            pols.valueLtPrime[i] = 0n;
            pols.chunkLtPrime[i] = 0n;
            pols.primeChunk[i] = 0n;

            this.setCarry(0, i, 0n);
            this.setCarry(1, i, 0n);
            this.setCarry(2, i, 0n);
        }
    }
}
