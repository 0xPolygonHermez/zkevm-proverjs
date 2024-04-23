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



class ArithConstants {
    constructor(pols) {
        this.N = pols.GL_SIGNED_22BITS.length;

        this.buildCycle(pols.PRIME_SECP256K1_CHUNKS, PRIME_SECP256K1_CHUNKS);
        this.buildCycle(pols.PRIME_BN254_CHUNKS, PRIME_BN254_CHUNKS);
        this.buildCycle(pols.PRIME_BLS12381_CHUNKS, PRIME_BLS12381_CHUNKS);
        this.buildByte2A(pols.BYTE_2A_BIT14_SEL, pols.BYTE_2A_BIT14, 256, 2**14);
        this.buildRange(pols.GL_SIGNED_22BITS, -(2n**22n), (2n**22n)-1n);
        this.buildRange(pols.BITS7_BYTE2, 0n, 127n, 2**16);
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

module.exports.buildConstants = async function (pols) { new ArithConstants(pols); };
module.exports.execute;

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
    }

    async execute(pols, inputs, continueOnError = false) {
        // Get N from definitions
        const N = pols.x1[0].length;

        // Split the input in little-endian words
        // prepareInput256bits(input, N);
        inputFeaToChunks(input, N);
        let eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate,
                            arithEq5.calculate, arithEq6.calculate, arithEq7.calculate, arithEq8.calculate, arithEq9.calculate,
                            arithEq10.calculate, arithEq11.calculate, arithEq12.calculate, arithEq13.calculate, arithEq14.calculate,
                            arithEq15.calculate, arithEq16.calculate, arithEq17.calculate, arithEq18.calculate, arithEq19.calculate];

        this.initPols(N, pols)

        for (let i = 0; i < inputs.length; i++) {
            const arithEquation = inputs[i].arithEquation;
            this.location = `input #${i} ${ARITH_OPERATIONS[arithEquation] ?? '@'+arithEquation}`;
            const offset = i * ARITH_CYCLE;
            const [x1,y1,x2,y2,x3,y3] = this.prepareInputPols(inputs[i], pols, offset);

            // In the following, recall that we can only work with unsiged integers of 256 bits.
            // Therefore, as the quotient needs to be represented in our VM, we need to know
            // the worst negative case and add an offset so that the resulting name is never negative.
            // Then, this offset is also added in the PIL constraint to ensure the equality.
            // Note1: Since we can choose whether the quotient is positive or negative, we choose it so
            //        that the added offset is the lowest.
            // Note2: x1,x2,y1,y2 can be assumed to be alias free, as this is the pre condition in the Arith SM.
            //        I.e, x1,x2,y1,y2 ∈ [0, 2^256-1].

            const eqInfo = getEquationInfo(arithEquation);
            const selectors = eqInfo.selectors;
            const [s,q0,q1,q2] = this.calculateSQPols(arithEquation, x1, y1, x2, y2, pols, offset);

            let xAreDifferent = false;
            let valueLtPrime;
            // y2_clock;
            // x3y3_clock;
            this.setSelectorPols(pols, offset, selectors);
            const checkAliasOrModule = this.isCheckAliasOrModuleEquation(arithEquation);
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                const index = offset + step;
                const nextIndex = (index + 1) % N;
                const chunkStep = step % INPUT_CHUNKS;
                if (chunkStep === 0) {
                    valueLtPrime = false;
                }
                pols.y2_clock[index] = _y2[15 - chunkStep];
                pols.y3_clock[index] = _y3[15 - chunkStep];

                // ARITH_ECADD_DIFFERENT is select need to check that points are diferent
                if (arithEquation === ARITH_ECADD_DIFFERENT && step < INPUT_CHUNKS) {
                    if (xAreDifferent === false) {
                        const delta = Fr.sub(pols.x2[step][index], pols.x1[step][index]);
                        pols.xDeltaChunkInverse[index] = Fr.isZero(delta) ? 0n : Fr.inv(delta);
                        xAreDifferent = Fr.isZero(delta) ? false : true;
                    }
                    pols.xAreDifferent[nextIndex] = xAreDifferent ? 1n : 0n;
                }

                // If either selEq1,selEq2,selEq3,selEq4,selEq5,selEq6 is selected, we need to ensure that x3, y3 is alias free.
                // Recall that selEq1,selEq2 work over the base field of the Secp256k1 curve, selEq3,selEq4,selEq5 works over the
                // base field of the BN254 curve and selEq6 works modulo y2.
                if (checkAliasOrModule) {
                    const chunkValue = step < INPUT_CHUNKS ? pols.x3[15 - chunkStep][offset] : pols.y3[15 - chunkStep][offset];
                    let chunkPrime = this.getPrimeChunk(arithEquation, step, pols.y2[15 - chunkStep]);

                    const chunkLtPrime = valueLtPrime ? 0n : Fr.lt(chunkValue, chunkPrime);
                    valueLtPrime = valueLtPrime || chunkLtPrime;
                    pols.chunkLtPrime[index] = chunkLtPrime ? 1n : 0n;
                    pols.valueLtPrime[nextIndex] = valueLtPrime ? 1n : 0n;
                }

                pols.x3_clock[index] = 0xFFFFn + pols.y3[15 - chunkStep][offset] - pols.y2[15 - chunkStep][offset] + pols.chunkLtPrime[index];
            }
            let carry = [0n, 0n, 0n];
            let eq = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

            const eqIndexes = eqInfo.eqIndexes;

            for (let step = 0; step < ARITH_CYCLE; ++step) {
                eqIndexes.forEach((eqIndex, index) => {
                    // carryIndex is carry
                    const carryIndex = index;
                    eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                    pols.carry[carryIndex][offset + step] = Fr.e(carry[carryIndex]);
                    if ((eq[eqIndex] + carry[carryIndex]) % (2n ** 16n) !== 0n && !continueOnError) {
                        throw new Error(`Equation ${eqIndex}:${eq[eqIndex]} and carry ${carryIndex}:${carry[carryIndex]} do not sum 0 mod 2¹⁶.`);
                    }
                    carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
                });
            }
    
            // hs_bit_delta, ls_bits_delta;
            // prime_chunk;
            pols.resultEq[offset + 31] = 1n;
        }
    }

    getPrimeChunk(arithEquation, step, moduleChunk) {
        switch (arithEquation) {
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
        throw new Error(`Invalid arithEquation ${arithEquation} to call getPrimeChunk`)
    }

    calculateSQPols(arithEquation, x1, y1, x2, y2, pols, offset) {
        let s, q0, q1, q2;
        s = q0 = q1 = q2 = 0n;
        let chunkBits = 16n;
        switch (arithEquation) {
            case ARITH_ECADD_DIFFERENT:
                [s, q0] = this.calculateAddPointSQ(x1, y1, x2, y2);
                [q1,q2] = this.calculateAddPointQs(s, x1, y1, x2, y2);
                break;
            case ARITH_ECADD_SAME:
                [s, q0] = this.calculateDblPointSQ(x1, y1);
                [q1,q2] = this.calculateAddPointQs(s, x1, y1, x2, y2);
                break;
            case ARITH_BN254_MULFP2:
                [q1,q2] = this.calculateMulFp2Qs(this.pBN254, x1, y1, x2, y2);
                break;
            case ARITH_BN254_ADDFP2:
                [q1,q2] = this.calculateAddFp2Qs(this.pBN254, x1, y1, x2, y2);
                break;
            case ARITH_BN254_SUBFP2:
                [q1,q2] = this.calculateSubFp2Qs(this.pBN254, x1, y1, x2, y2);
                break;
            case ARITH_MOD:
                [q0, q1] = this.calculateModularQs(256n, x1, y1, x2, y2, y3);
                break;
            case ARITH_384_MOD:
                [q0, q1] = this.calculateModularQs(384n, x1, y1, x2, y2, y3);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_MULFP2:
                [q1,q2] = this.calculateMulFp2Qs(this.pBLS12381, x1, y1, x2, y2);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_ADDFP2:
                [q1,q2] = this.calculateAddFp2Qs(this.pBLS12381, x1, y1, x2, y2);
                chunkBits = 24n;
                break;
            case ARITH_BLS12381_SUBFP2:
                [q1,q2] = this.calculateSubFp2Qs(this.pBLS12381, x1, y1, x2, y2);
                chunkBits = 24n;
                break;
        }
        this.valueToPols(s, chunkBits, pols.s, offset);
        this.valueToPols(q0, chunkBits, pols.q0, offset);
        this.valueToPols(q1, chunkBits, pols.q1, offset);
        this.valueToPols(q2, chunkBits, pols.q2, offset);
        // hsc_sq0q1,  lsc_sq0q1;
        // hsc_q1q2qh, lsc_q1q2qh;

        return [s, q0, q1, q2];
    }
    errorHandler(condition, message, continueOnError, counter) {
        if (condition) {
            if (continueOnError) {
                console.warn(message);
            } else {
                throw new Error(message);
            }
            counter++;
        }

        return counter;
    }
    getChunkBits(arithEquation) {
        switch (input.arithEquation) {
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
                throw new Error(`Invalid arithmetic operation ${arithEquation}`);
        }
    }
    prepareInputPols(input, pols, offset) {
        const [bits1, bits2] = this.getChunkBits(input.arithEquation);
        this.forcedS = input.s ?? false;

        // hs_bit_x1y1, hsc_x1y1, lsc_x1y1;
        this.inputToPols(pols.x1, offset, input.x1, bits1);
        this.inputToPols(pols.y1, offset, input.y1, bits1);

            // hsc_x2y2, lsc_x2y2;
        this.inputToPols(pols.x2, offset, input.x2, bits2);
        this.inputToPols(pols.y2, offset, input.y2, bits2);

            // hsc_x3y3, lsc_x3y3;   
        this.inputToPols(pols.x3, offset, input.x3, bits2);
        this.inputToPols(pols.y3, offset, input.y3, bits2);

        return [this.feaToScalar(input.x1, bits1), this.feaToScalar(input.y1, bits1),
                this.feaToScalar(input.x2, bits2), this.feaToScalar(input.y2, bits2),
                this.feaToScalar(input.x3, bits2), this.feaToScalar(input.y3, bits2)];
    }
    calculateQ(module, eqvalue, offset, title, sign = 1n) {
        this.assert(module !== 0n, 'module is zero');
        const _q = eqvalue/module;
        this.assert((eqvalue - module*_q) === 0n, `with the calculated q the residual is not zero (${title})`);
        const q = offset + sign * _q;
        this.assert(q >= 0n, `the q with offset is negative (${title}). Actual value: ${q}, previous value: ${sign * _q}`);
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
            s = Fec.div(Fec.mul(3n, Fec.mul(x1, x1)), Fec.add(y1, y1));
        }
        // Worst values are {-3*(2^256-1)**2,2*(2^256-1)**2} with |-3*(2^256-1)**2| > 2*(2^256-1)**2
        const q0 = this.calculateQ(this.pFec, s * 2n * y1 - 3n * x1 * x1, 2n ** 258n, 'q0 same point', -1n);
        return [s, q0];
    }
    assert(cond, msg) {
        if (cond) return;

        ++this.errorCount; 

        const _msg = this.location + ':' + msg;
        if (this.continueOnError) {
            console.warn(_msg);
        }
        throw new Error(_msg);
    }
    calculateAddPointQs(s, x1, y1, x2, y2, x3, y3) {
        // Worst values are {-3*(2^256-1),(2^256-1)**2}  with (2^256-1)**2 > |-3*(2^256-1)|
        const q1 = this.calculateQ(this.pFec, s * s - x1 - x2 - x3, 2n ** 2n, 'q1');
        
        // Worst values are {-(2^256+1)*(2^256-1),(2^256-1)**2}  with |-(2^256+1)*(2^256-1)| > (2^256-1)**2
        const q2 = this.calculateQ(this.pFec, s * x1 - s * x3 - y1 - y3, 2n ** 257n, 'q2', -1n);
        return [q1,q2];
    }

    calculateMulFp2Qs(module, x1, y1, x2, y2, x3, y3) {
        // Worst values are {-2^256*(2^256-1),(2^256-1)**2} with |-2^256*(2^256-1)| > (2^256-1)**2
        const q1 = this.calculateQ(module, x1 * x2 - y1 * y2 - x3, 2n ** 259n, 'q1' -1n);

        // Worst values are {-(2^256-1),2*(2^256-1)**2} with 2*(2^256-1)**2 > |-(2^256-1)|
        const q2 = this.calculateQ(module, y1 * x2 + x1 * y2 - y3, 2n ** 3n, 'q2');
        return [q1,q2]
    }
    calculateAddFp2Qs(module, x1, y1, x2, y2, x3, y3) {
        // Worst values are {-(2^256-1),2*(2^256-1)} with 2*(2^256-1) > |-(2^256-1)|
        const q1 = this.calculateQ(module, x1 + x2 - x3, 2n ** 3n, 'q1');

        // Worst values are {-(2^256-1),2*(2^256-1)} with 2*(2^256-1) > |-(2^256-1)|
        const q2 = this.calculateQ(module, y1 + y2 - y3, 2n ** 3n, 'q2');
        return [q1,q2];
    }
    calculateSubFp2Qs(module, x1, y1, x2, y2, x3, y3) {
       // Worst values are {-2*(2^256-1),(2^256-1)} with |-2*(2^256-1)| > (2^256-1)
        const q1 = this.calculateQ(module, x1 - x2 - x3, 2n ** 3n, 'q1', -1n);

        // Worst values are {-2*(2^256-1),(2^256-1)} with |-2*(2^256-1)| > (2^256-1)
        const q2 = this.calculateQ(module, y1 - y2 - y3, 2n ** 3n, 'q2', -1n);
        return [q1,q2];
    }
    calculateModularQs(bits, x1, y1, x2, y2, y3) {
        const _q = this.calculateQ(y2, x1 * y1 + x2 - y3, 0n, 'q');
        return [_q & ((1n << bits) - 1n), _q >> bits];
    }
    setSelectorPols(pols, offset, selectors) {
        for (let isel = 0; isel < pols.selEq.length; ++isel) {
            const selector = BigInt(selectors.selEq[isel]);
            for (let step = 0; step < ARITH_CYCLE; ++step) {
                pols.selEq[isel][offset + step] = selector;
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
        for (let index = chunks.length - 1; index >=0; --index) {
            value = value << bits + chunks[index];
        }
        return value;
    }
    valueToPols(value, chunkBits, pols, offset, chunks = 16) {
        chunkBits = BigInt(chunkBits);
        const mask = (1n << chunkBits) - 1n;
        for (let index = 0; index < chunks; ++index) {
            pols[offset + index] = (index < (chunk - 1) ? (value & mask) : value);
            value = value >> chunkBits;
        }
    }
    initPols(N, pols) {
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
                if (j < pols.carry.length) pols.carry[j][i] = 0n;
                if (j < pols.selEq.length) pols.selEq[j][i] = 0n;
            }
            pols.y2clock[i] = 0n;
            pols.x3clock[i] = 0xFFFFn;
            pols.y3clock[i] = 0n;

            pols.resultEq[i] = 0n;
            pols.xDeltaChunkInverse[i] = 0n;
            pols.xAreDifferent[i] = 0n;

            // by default valueLtPrime must be one
            pols.valueLtPrime[i] = 0n;
            pols.chunkLtPrime[i] = 0n;
        }
    }
}

/*
    
function prepareInput256bits(input, N) {
    for (let i = 0; i < input.length; i++) {
        for (var key of Object.keys(input[i])) {
            input[i][`_${key}`] = to16bitsRegisters(input[i][key]);
        }
    }
}

function to16bitsRegisters(value) {
    if (typeof value !== 'bigint') {
        value = BigInt(value);
    }

    let parts = [];
    for (let part = 0; part < 16; ++part) {
        parts.push(part < 15 ? (value & 0xFFFFn) : value);
        value = value >> 16n;
    }
    return parts;
}


*/
