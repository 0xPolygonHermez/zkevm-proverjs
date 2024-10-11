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

const F1Field = require("ffjavascript").F1Field;

const ARITH = 1;
const ARITH_ECADD_DIFFERENT = 2;
const ARITH_ECADD_SAME = 3;
const ARITH_BN254_MULFP2 = 4;
const ARITH_BN254_ADDFP2 = 5;
const ARITH_BN254_SUBFP2 = 6;
const ARITH_SECP256R1_ECADD_DIFFERENT = 7;
const ARITH_SECP256R1_ECADD_SAME = 8;

const PRIME_SECP256K1_CHUNKS = [ 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn,
                                 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFEn, 0xFFFFn, 0xFC2Fn ];

const PRIME_BN254_CHUNKS = [ 0x3064n, 0x4E72n, 0xE131n, 0xA029n, 0xB850n, 0x45B6n, 0x8181n, 0x585Dn,
                             0x9781n, 0x6A91n, 0x6871n, 0xCA8Dn, 0x3C20n, 0x8C16n, 0xD87Cn, 0xFD47n ];

const PRIME_SECP256R1_CHUNKS = [ 0xFFFFn, 0xFFFFn, 0x0000n, 0x0001n, 0x0000n, 0x0000n, 0x0000n, 0x0000n,
                                 0x0000n, 0x0000n, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn ];

const PRIME_SECP256K1_INDEX = 0;
const PRIME_BN254_INDEX = 1;
const PRIME_SECP256R1_INDEX = 2;

const PRIME_CHUNKS = [PRIME_SECP256K1_CHUNKS, PRIME_BN254_CHUNKS, PRIME_SECP256R1_CHUNKS];
const PRIME_NAMES = ['SECP256K1', 'BN254', 'SECP256R1'];

const EQ_INDEX_TO_CARRY_INDEX = [0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 2, 0, 0, 1, 2];

// Field Elliptic Curve secp256k1
const pSecp256k1 = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const Fsecp256k1 = new F1Field(pSecp256k1);

// Field Elliptic Curve secp256r1
const aSecp256r1 = 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffcn;
const pSecp256r1 = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
const Fsecp256r1 = new F1Field(pSecp256r1);

// Field Complex Multiplication
const pBN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const FpBN254 = new F1Field(pBN254);


module.exports.buildConstants = async function(pols) {
    const N = pols.SEL_BYTE2_BIT21.length;

    buildByte2Bits16(pols, N);
    buildRange(pols, N, 'GL_SIGNED_22BITS', -(2n**22n), (2n**22n)-1n);
    buildRangeChunks(pols.RANGE_SEL, N);
}

function fillRange(pol, irow, rangeSel, from, to, label = '') {
    if (from > to) {
        return irow;
    }
    const fromRowH = irow.toString(16).padStart(8,'0').toUpperCase();
    for (let j = from; j <= to; ++j) {
        if (irow & 0xFFFF != j) {
            throw new Error(`Inconsistent value ${j} with byte2 ${irow & 0xFFFF} on row ${irow} at ${label}`);
        }
        pol[irow++] = rangeSel;
    }
    const fromH = from.toString(16).padStart(4,'0').toUpperCase();
    const toH = to.toString(16).padStart(4,'0').toUpperCase();
    const toRowH = (irow-1).toString(16).padStart(8,'0').toUpperCase();
    console.log(`RANGE ${rangeSel.toString().padStart(3)} [0x${fromH},0x${toH}] [${from.toString().padStart(5)},${to.toString().padStart(5)}] #0x${fromRowH}:0x${toRowH} ${label}`);
    return irow;
}
function buildRangeChunks(pol, N) {
    let rangeSel = 0n;
    const limit = 2n**16n - 1n;
    let irow = 0;

    // 0 - 15 rangeSel used for "stantard" ranges [0,0xFFFF]
    for (let ichunk = 0; ichunk < 16; ++ichunk) {
        irow = fillRange(pol, irow, rangeSel++, 0, limit, 'FULL');
    }

    for (let iprime = 0; iprime < PRIME_CHUNKS.length; ++iprime) {
        const prime = PRIME_CHUNKS[iprime];
        const name = PRIME_NAMES[iprime];
        // two loops by prime, first with value and after that one with value - 1,
        // to be used when flag "chunkLtPrime" is set.
        for (let i = 0; i < 2; i++) {
            for (let ichunk = 0; ichunk < 16; ++ichunk) {
                let chunkValue = prime[ichunk] - BigInt(i);
                // values inside the range use identifier rangeSel
                const label = `${name}[${ichunk}] = 0x${prime[ichunk].toString(16).toUpperCase().padStart(4, '0')}`
                irow = fillRange(pol, irow, rangeSel++, 0n, chunkValue, `${label} (allowed values${i?' for LT':''})`);
                // values outside the range use identifier 0, that it's for the full range
                irow = fillRange(pol, irow, 0n, chunkValue + 1n, limit, '');
            }
        }
    }
    while (irow < N) {
        pol[irow] = 0n;
        ++irow;
    }
}

function buildByte2Bits16(pols, N) {
    let p = 0;
    // when SEL_BYTE2_BIT21 is zero, only values from 0 to (2**16)-1 are included
    for (let i = 0; i < 2**16; ++i) {
        pols.SEL_BYTE2_BIT21[p] = 0n;
        pols.BYTE2_BIT21[p] = BigInt(i);
        ++p;
    }

    // when SEL_BYTE2_BIT21 is one, only values from 0 to (2**21)-1 are included
    for (let i = 0; i < 2**21; ++i) {
        pols.SEL_BYTE2_BIT21[p] = 1n;
        pols.BYTE2_BIT21[p] = BigInt(i);
        ++p;
    }
    // fill to end with zero and zero, a valid combination
    for (let i = p; i < N; ++i) {
        pols.SEL_BYTE2_BIT21[i] = 0n;
        pols.BYTE2_BIT21[i] = 0n;
    }
}

function buildRange(pols, N, name, fromValue, toValue, steps = 1) {
    let value = fromValue;
    let csteps = steps;
    for (let i = 0; i < N; i++) {
        pols[name][i] = value;
        csteps -= 1;
        if (csteps <= 0) {
            csteps = steps;
            if (value === toValue) value = fromValue;
            else value += 1n;
        }
    }
}

function getArithInfo(arithEq) {
    switch (arithEq) {
        case ARITH:
            return {
                selEq: [1n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
                eqIndexes: [0],
                primeIndex: false,
                checkAliasFree: false,
                checkDifferent: false,
                prime: false,
                fp: false,
                name: 'ARITH',
                curve: ''
            }

        case ARITH_ECADD_DIFFERENT:
            return {
                selEq: [0n, 1n, 0n, 0n, 0n, 0n, 0n, 0n],
                eqIndexes: [1,3,4],   // s.diff, x3, y3
                primeIndex: PRIME_SECP256K1_INDEX,
                checkAliasFree: true,
                checkDifferent: true,
                prime: pSecp256k1,
                fp: Fsecp256k1,
                name: 'ARITH_ECADD_DIFFERENT',
                curve: 'SECP256K1',
            }

        case ARITH_ECADD_SAME:
            return {
                selEq: [0n, 0n, 1n, 0n, 0n, 0n, 0n, 0n],
                eqIndexes: [2,3,4],   // s.diff, x3, y3
                primeIndex: PRIME_SECP256K1_INDEX,
                checkAliasFree: true,
                checkDifferent: false,
                prime: pSecp256k1,
                fp: Fsecp256k1,
                name: 'ARITH_ECADD_SAME',
                curve: 'SECP256K1',
            }

        case ARITH_BN254_MULFP2:
            return {
                selEq: [0n, 0n, 0n, 1n, 0n, 0n, 0n, 0n],
                eqIndexes: [5, 6],   // x3, y3
                primeIndex: PRIME_BN254_INDEX,
                checkAliasFree: true,
                checkDifferent: false,
                prime: pBN254,
                fp: FpBN254,
                name: 'ARITH_BN254_MULFP2',
                curve: 'BN254',
            }

        case ARITH_BN254_ADDFP2:
            return {
                selEq: [0n, 0n, 0n, 0n, 1n, 0n, 0n, 0n],
                eqIndexes: [7, 8],   // x3, y3
                primeIndex: PRIME_BN254_INDEX,
                checkAliasFree: true,
                checkDifferent: false,
                prime: pBN254,
                fp: FpBN254,
                name: 'ARITH_BN254_ADDFP2',
                curve: 'BN254',
            }

        case ARITH_BN254_SUBFP2:
            return {
                selEq: [0n, 0n, 0n, 0n, 0n, 1n, 0n, 0n],
                eqIndexes: [9, 10],   // x3, y3
                primeIndex: PRIME_BN254_INDEX,
                checkAliasFree: true,
                checkDifferent: false,
                prime: pBN254,
                fp: FpBN254,
                name: 'ARITH_BN254_SUBFP2',
                curve: 'BN254',
            }

        case ARITH_SECP256R1_ECADD_DIFFERENT:
            return {
                selEq: [0n, 0n, 0n, 0n, 0n, 0n, 1n, 0n],
                eqIndexes: [11,13,14],   // s.diff, x3, y3
                primeIndex: PRIME_SECP256R1_INDEX,
                checkAliasFree: true,
                checkDifferent: true,
                prime: pSecp256r1,
                fp: Fsecp256r1,
                name: 'ARITH_SECP256R1_ECADD_DIFFERENT',
                curve: 'SECP256R1',
            }

        case ARITH_SECP256R1_ECADD_SAME:
            return {
                selEq: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 1n],
                eqIndexes: [12,13,14],   // s.diff, x3, y3
                primeIndex: PRIME_SECP256R1_INDEX,
                checkAliasFree: true,
                checkDifferent: false,
                prime: pSecp256r1,
                a: aSecp256r1,
                fp: Fsecp256r1,
                name: 'ARITH_SECP256R1_ECADD_SAME',
                curve: 'SECP256R1',
            }
            break;

        default:
            throw new Error(`Unknown arithEq value ${arithEq}`);
    }
    return selEq;
}
module.exports.execute = async function(pols, input, continueOnError = false) {
    // Get N from definitions
    const N = pols.x1[0].length;


    const Fr = new F1Field(0xffffffff00000001n);

    // Split the input in little-endian words
    // prepareInput256bits(input, N);
    inputFeaTo16bits(input, N, ['x1', 'y1', 'x2', 'y2', 'x3', 'y3']);
    let eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate,
                        arithEq5.calculate, arithEq6.calculate, arithEq7.calculate, arithEq8.calculate, arithEq9.calculate,
                        arithEq10.calculate, arithEq11.calculate, arithEq12.calculate, arithEq13.calculate, arithEq14.calculate];

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
        pols.resultEq[i] = 0n;
        pols.xDeltaChunkInverse[i] = 0n;
        pols.xAreDifferent[i] = 0n;

        // by default valueLtPrime must be one
        pols.valueLtPrime[i] = 0n;
        pols.chunkLtPrime[i] = 0n;
    }

    let s, q0, q1, q2;
    let nDivErrors = 0;
    let nNegErrors = 0;
    for (let i = 0; i < input.length; i++) {
        let x1 = fea2scalar(Fr, input[i]["x1"]);
        let y1 = fea2scalar(Fr, input[i]["y1"]);
        let x2 = fea2scalar(Fr, input[i]["x2"]);
        let y2 = fea2scalar(Fr, input[i]["y2"]);
        let x3 = fea2scalar(Fr, input[i]["x3"]);
        let y3 = fea2scalar(Fr, input[i]["y3"]);

        const arithInfo = getArithInfo(input[i].arithEq);
        const Fec = arithInfo.fp;
        const pFec = arithInfo.prime;


        // In the following, recall that we can only work with unsiged integers of 256 bits.
        // Therefore, as the quotient needs to be represented in our VM, we need to know
        // the worst negative case and add an offset so that the resulting name is never negative.
        // Then, this offset is also added in the PIL constraint to ensure the equality.
        // Note1: Since we can choose whether the quotient is positive or negative, we choose it so
        //        that the added offset is the lowest.
        // Note2: x1,x2,y1,y2 can be assumed to be alias free, as this is the pre condition in the Arith SM.
        //        I.e, x1,x2,y1,y2 ∈ [0, 2^256-1].

        let calculateS = false;

        if (input[i].arithEq == ARITH_ECADD_DIFFERENT || input[i].arithEq == ARITH_SECP256R1_ECADD_DIFFERENT) {
            calculateS = true;
            let pq0;
            if (Fec.eq(x2, x1) && !continueOnError) {
                throw new Error(`For input ${i}, x1 and x2 are equals, but ${arithInfo.name} is called`);
            } else {
                if (typeof input[i]["s"] !== 'undefined') {
                    s = input[i]["s"];
                } else {
                    s = Fec.div(Fec.sub(y2, y1), Fec.sub(x2, x1));
                }
                pq0 = s * x2 - s * x1 - y2 + y1; // Worst values are {-2^256*(2^256-1),2^256*(2^256-1)}
            }
            q0 = pq0/pFec;
            nDivErrors = errorHandler(
                (pq0 - pFec * q0) != 0n,
                `For input ${i}, with the calculated q0 the residual is not zero (diff point)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q0 += 2n ** 257n;
            nNegErrors = errorHandler(
                q0 < 0n,
                `For input ${i}, the q0 with offset is negative (diff point). Actual value: ${q0}, previous value: ${q0 - 2n ** 257n}`,
                continueOnError,
                nNegErrors
            );
        }
        else if (input[i].arithEq == ARITH_ECADD_SAME) {
            calculateS = true;
            if (typeof input[i]["s"] !== 'undefined') {
                s = input[i]["s"];
            } else {
                s = Fec.div(Fec.mul(3n, Fec.mul(x1, x1)), Fec.add(y1, y1));
            }
            let pq0 = s * 2n * y1 - 3n * x1 * x1; // Worst values are {-3*(2^256-1)**2,2*(2^256-1)**2}
                                                  // with |-3*(2^256-1)**2| > 2*(2^256-1)**2
            q0 = -(pq0/pFec);
            nDivErrors = errorHandler(
                (pq0 + pFec*q0) != 0n,
                `For input ${i}, with the calculated q0 the residual is not zero (same point)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q0 += 2n ** 258n;
            nNegErrors = errorHandler(
                q0 < 0n,
                `For input ${i}, the q0 with offset is negative (same point). Actual value: ${q0}, previous value: ${q0 - 2n ** 258n}`,
                continueOnError,
                nNegErrors
            );
        }
        else if (input[i].arithEq == ARITH_SECP256R1_ECADD_SAME) {
            calculateS = true;
            const a = arithInfo.a;
            if (typeof input[i]["s"] !== 'undefined') {
                s = input[i]["s"];
            } else {
                s = Fec.div(Fec.add(Fec.mul(3n, Fec.mul(x1, x1)), a), Fec.add(y1, y1));
            }
            let pq0 = s * 2n * y1 - 3n * x1 * x1 - a; // Worst values are {-3*(2^256-1)**2 - a,2*(2^256-1)**2 - a}
                                                      // with |-3*(2^256-1)**2| > 2*(2^256-1)**2
            q0 = -(pq0/pFec);
            nDivErrors = errorHandler(
                (pq0 + pFec*q0) != 0n,
                `For input ${i}, with the calculated q0 the residual is not zero (same point)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q0 += 2n ** 258n;
            nNegErrors = errorHandler(
                q0 < 0n,
                `For input ${i}, the q0 with offset is negative (same point). Actual value: ${q0}, previous value: ${q0 - 2n ** 258n}`,
                continueOnError,
                nNegErrors
            );
        }
        else {
            s = 0n;
            q0 = 0n;
        }

        if (calculateS)  {
            let pq1 = s * s - x1 - x2 - x3; // Worst values are {-3*(2^256-1),(2^256-1)**2}
                                            // with (2^256-1)**2 > |-3*(2^256-1)|
            q1 = pq1/pFec;
            nDivErrors = errorHandler(
                (pq1 - pFec*q1) != 0n,
                `For input ${i}, with the calculated q1 the residual is not zero (point addition)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q1 += 2n ** 2n;
            nNegErrors = errorHandler(
                q1 < 0n,
                `For input ${i}, the q1 with offset is negative (point addition). Actual value: ${q1}, previous value: ${q1 - 2n ** 2n}`,
                continueOnError,
                nNegErrors
            );

            if (typeof input[i]["s"] !== 'undefined') {
                s = input[i]["s"];
            }
            let pq2 = s * x1 - s * x3 - y1 - y3; // Worst values are {-(2^256+1)*(2^256-1),(2^256-1)**2}
                                                 // with |-(2^256+1)*(2^256-1)| > (2^256-1)**2
            q2 = -(pq2/pFec);
            nDivErrors = errorHandler(
                (pq2 + pFec*q2) != 0n,
                `For input ${i}, with the calculated q2 the residual is not zero (point addition)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q2 += 2n ** 257n;
            nNegErrors = errorHandler(
                q2 < 0n,
                `For input ${i}, the q2 with offset is negative (point addition). Actual value: ${q2}, previous value: ${q2 - 2n ** 257n}`,
                continueOnError,
                nNegErrors
            );
        }
        else if (input[i].arithEq === ARITH_BN254_MULFP2) {
            let pq1 = x1 * x2 - y1 * y2 - x3; // Worst values are {-2^256*(2^256-1),(2^256-1)**2}
                                              // with |-2^256*(2^256-1)| > (2^256-1)**2
            q1 = -(pq1/pBN254);
            nDivErrors = errorHandler(
                (pq1 + pBN254*q1) != 0n,
                `For input ${i}, with the calculated q1 the residual is not zero (complex mul)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q1 += 2n ** 259n;
            nNegErrors = errorHandler(
                q1 < 0n,
                `For input ${i}, the q1 with offset is negative (complex mul). Actual value: ${q1}, previous value: ${q1 - 2n ** 259n}`,
                continueOnError,
                nNegErrors
            );

            let pq2 = y1 * x2 + x1 * y2 - y3; // Worst values are {-(2^256-1),2*(2^256-1)**2}
                                              // with 2*(2^256-1)**2 > |-(2^256-1)|
            q2 = pq2/pBN254;
            nDivErrors = errorHandler(
                (pq2 - pBN254*q2) != 0n,
                `For input ${i}, with the calculated q2 the residual is not zero (complex mul)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q2 += 2n ** 3n;
            nNegErrors = errorHandler(
                q2 < 0n,
                `For input ${i}, the q2 with offset is negative (complex mul). Actual value: ${q2}, previous value: ${q2 - 2n ** 3n}`,
                continueOnError,
                nNegErrors
            );
        }
        else if (input[i].arithEq === ARITH_BN254_ADDFP2) {
            let pq1 = x1 + x2 - x3; // Worst values are {-(2^256-1),2*(2^256-1)}
                                    // with 2*(2^256-1) > |-(2^256-1)|
            q1 = pq1/pBN254;
            nDivErrors = errorHandler(
                (pq1 - pBN254*q1) != 0n,
                `For input ${i}, with the calculated q1 the residual is not zero (complex add)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q1 += 2n ** 3n;
            nNegErrors = errorHandler(
                q1 < 0n,
                `For input ${i}, the q1 with offset is negative (complex add). Actual value: ${q1}, previous value: ${q2 - 2n ** 3n}`,
                continueOnError,
                nNegErrors
            );

            let pq2 = y1 + y2 - y3; // Worst values are {-(2^256-1),2*(2^256-1)}
                                    // with 2*(2^256-1) > |-(2^256-1)|
            q2 = pq2/pBN254;
            nDivErrors = errorHandler(
                (pq2 - pBN254*q2) != 0n,
                `For input ${i}, with the calculated q2 the residual is not zero (complex add)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q2 += 2n ** 3n;
            nNegErrors = errorHandler(
                q2 < 0n,
                `For input ${i}, the q2 with offset is negative (complex add). Actual value: ${q2}, previous value: ${q2 - 2n ** 3n}`,
                continueOnError,
                nNegErrors
            );
        }
        else if (input[i].arithEq == ARITH_BN254_SUBFP2) {
            let pq1 = x1 - x2 - x3; // Worst values are {-2*(2^256-1),(2^256-1)}
                                    // with |-2*(2^256-1)| > (2^256-1)
            q1 = -(pq1/pBN254);
            nDivErrors = errorHandler(
                (pq1 + pBN254*q1) != 0n,
                `For input ${i}, with the calculated q1 the residual is not zero (complex sub)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q1 += 2n ** 3n;
            nNegErrors = errorHandler(
                q1 < 0n,
                `For input ${i}, the q1 with offset is negative (complex sub). Actual value: ${q1}, previous value: ${q1 - 2n ** 3n}`,
                continueOnError,
                nNegErrors
            );

            let pq2 = y1 - y2 - y3; // Worst values are {-2*(2^256-1),(2^256-1)}
                                    // with |-2*(2^256-1)| > (2^256-1)
            q2 = -(pq2/pBN254);
            nDivErrors = errorHandler(
                (pq2 + pBN254*q2) != 0n,
                `For input ${i}, with the calculated q2 the residual is not zero (complex sub)`,
                continueOnError,
                nDivErrors
            );
            // offset
            q2 += 2n ** 3n;
            nNegErrors = errorHandler(
                q2 < 0n,
                `For input ${i}, the q2 with offset is negative (complex sub). Actual value: ${q2}, previous value: ${q2 - 2n ** 3n}`,
                continueOnError,
                nNegErrors
            );
        }
        else {
            q1 = 0n;
            q2 = 0n;
        }
        input[i]['_s'] = to16bitsRegisters(s);
        input[i]['_q0'] = to16bitsRegisters(q0);
        input[i]['_q1'] = to16bitsRegisters(q1);
        input[i]['_q2'] = to16bitsRegisters(q2);
    }

    if (nNegErrors > 0) {
        throw new Error(`There are ${nNegErrors} negative quotient errors`);
    } else if (nDivErrors > 0) {
        throw new Error(`There are ${nDivErrors} divisions errors`);
    }

    for (let i = 0; i < input.length; i++) {
        let offset = i * 32;
        let xAreDifferent = false;
        let valueLtPrime;
        const arithInfo = getArithInfo(input[i].arithEq);
        for (let step = 0; step < 32; ++step) {
            const index = offset + step;
            const nextIndex = (index + 1) % N;
            const step16 = step % 16;
            if (step16 === 0) {
                valueLtPrime = false;
            }
            for (let j = 0; j < 16; j++) {
                pols.x1[j][index] = BigInt(input[i]["_x1"][j])
                pols.y1[j][index] = BigInt(input[i]["_y1"][j])
                pols.x2[j][index] = BigInt(input[i]["_x2"][j])
                pols.y2[j][index] = BigInt(input[i]["_y2"][j])
                pols.x3[j][index] = BigInt(input[i]["_x3"][j])
                pols.y3[j][index] = BigInt(input[i]["_y3"][j])
                pols.s[j][index]  = BigInt(input[i]["_s"][j])
                pols.q0[j][index] = BigInt(input[i]["_q0"][j])
                pols.q1[j][index] = BigInt(input[i]["_q1"][j])
                pols.q2[j][index] = BigInt(input[i]["_q2"][j])
                if (j < arithInfo.selEq.length) {
                    pols.selEq[j][index] = BigInt(arithInfo.selEq[j]);
                }
            }

            // selEq1 (addition different points) is select need to check that points are diferent
            if (arithInfo.checkDifferent && step < 16) {
                if (xAreDifferent === false) {
                    const delta = Fr.sub(pols.x2[step][index], pols.x1[step][index]);
                    pols.xDeltaChunkInverse[index] = Fr.isZero(delta) ? 0n : Fr.inv(delta);
                    xAreDifferent = Fr.isZero(delta) ? false : true;
                }
                pols.xAreDifferent[nextIndex] = xAreDifferent ? 1n : 0n;
            }

            // If either checkAliasFree is selected, we need to ensure that x3, y3 is alias free
            if (arithInfo.checkAliasFree) {
                const chunkValue = step < 16 ? pols.x3[15 - step16][offset] : pols.y3[15 - step16][offset];
                const chunkPrime = PRIME_CHUNKS[arithInfo.primeIndex][step16];
                const chunkLtPrime = valueLtPrime ? 0n : Fr.lt(chunkValue, chunkPrime);
                valueLtPrime = valueLtPrime || chunkLtPrime;
                pols.chunkLtPrime[index] = chunkLtPrime ? 1n : 0n;
                pols.valueLtPrime[nextIndex] = valueLtPrime ? 1n : 0n;
            }
        }
        let carry = [0n, 0n, 0n];
        let eq = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];

        for (let step = 0; step < 32; ++step) {
            arithInfo.eqIndexes.forEach((eqIndex) => {
                let carryIndex = EQ_INDEX_TO_CARRY_INDEX[eqIndex];
                eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                pols.carry[carryIndex][offset + step] = Fr.e(carry[carryIndex]);
                if ((eq[eqIndex] + carry[carryIndex]) % (2n ** 16n) !== 0n && !continueOnError) {
                    throw new Error(`Equation ${eqIndex}:${eq[eqIndex]} and carry ${carryIndex}:${carry[carryIndex]} do not sum 0 mod 2¹⁶ (step ${step}).`);
                }
                carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
            });
        }
        pols.resultEq[offset + 31] = 1n;
    }
}

function errorHandler(condition, message, continueOnError, counter) {
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

function inputFeaTo16bits(input, N, names) {
    for (let i = 0; i < input.length; i++) {
        for (const name of names) {
            input[i]['_'+name] = splitFeaTo16bits(input[i][name]);
        }
    }
}

function splitFeaTo16bits(chunks) {
    let res = [];
    for(const chunk of chunks) {
        res.push(chunk % 2n**16n);
        res.push((chunk / 2n**16n) >> 0n);
    }
    return res;
}
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
