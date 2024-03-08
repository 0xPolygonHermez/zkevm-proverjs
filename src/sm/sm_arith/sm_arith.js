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

const F1Field = require("ffjavascript").F1Field;

module.exports.buildConstants = async function(pols) {
    const N = pols.SEL_BYTE2_BIT21.length;

    buildByte2Bits16(pols, N);
    buildRange(pols, N, 'GL_SIGNED_22BITS', -(2n**22n), (2n**22n)-1n);
    buildRangeSelector(pols.RANGE_SEL, N, 2 ** 16, [0xFFFF,0xFFFE,0xFFFD,0xFC2F,0xFC2E,
                        0x3064,0x3063,0x4E72,0x4E71,0xE131,0xE130,0xA029,0xA028,0xB850,
                        0xB84F,0x45B6,0x45B5,0x8181,0x8180,0x585D,0x585C,0x9781,0x9780,
                        0x6A91,0x6A90,0x6871,0x6870,0xCA8D,0xCA8C,0x3C20,0x3C1F,0x8C16,
                        0x8C15,0xD87C,0xD87B,0xFD47,0xFD46]);
}

function buildRangeSelector(pol, N, cycle, maxValues, paddingValue = 0n) {
    let i = 0;
    let valueIndex = 0;
    while (i < N) {
        const from = i;
        while ((i - from) <= maxValues[valueIndex] && i < N) {
            pol[i] = BigInt(valueIndex);
            ++i;
        }
        while ((i - from) < cycle && i < N) {
            pol[i] = paddingValue;
            ++i;
        }
        valueIndex = valueIndex < maxValues.length ? valueIndex + 1: 0;
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

function buildBitsRange(pols, N, name, bits) {
    let moduleBase = (2 ** bits);
    for (let i = 0; i < N; i++) {
        pols[name][i] = BigInt(i % moduleBase);
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

module.exports.execute = async function(pols, input, continueOnError = false) {
    // Get N from definitions
    const N = pols.x1[0].length;

    // Field Elliptic Curve
    let pFec = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
    const Fec = new F1Field(pFec);

    // Field Complex Multiplication
    let pBN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
    const FpBN254 = new F1Field(pBN254);

    const Fr = new F1Field(0xffffffff00000001n);

    // Split the input in little-endian words
    // prepareInput256bits(input, N);
    inputFeaTo16bits(input, N, ['x1', 'y1', 'x2', 'y2', 'x3', 'y3']);
    let eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate,
                        arithEq5.calculate, arithEq6.calculate, arithEq7.calculate, arithEq8.calculate, arithEq9.calculate,
                        arithEq10.calculate, arithEq11.calculate];

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

        // In the following, recall that we can only work with unsiged integers of 256 bits.
        // Therefore, as the quotient needs to be represented in our VM, we need to know
        // the worst negative case and add an offset so that the resulting name is never negative.
        // Then, this offset is also added in the PIL constraint to ensure the equality.
        // Note1: Since we can choose whether the quotient is positive or negative, we choose it so
        //        that the added offset is the lowest.
        // Note2: x1,x2,y1,y2 can be assumed to be alias free, as this is the pre condition in the Arith SM.
        //        I.e, x1,x2,y1,y2 ∈ [0, 2^256-1].
        if (input[i].selEq1) {
            let eq;
            if (Fec.eq(x2, x1) && !continueOnError) {
                throw new Error(`For input ${i}, x1 and x2 are equals, but ADD_EC_DIFFERENT is called`);
            } else {
                if (typeof input[i]["s"] !== 'undefined') {
                    s = input[i]["s"];
                } else {
                    s = Fec.div(Fec.sub(y2, y1), Fec.sub(x2, x1));
                }
                eq = s * x2 - s * x1 - y2 + y1; // Worst values are {-2^256*(2^256-1),2^256*(2^256-1)}
            }
            q0 = eq/pFec;
            nDivErrors = errorHandler(
                (eq - pFec * q0) != 0n,
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
        else if (input[i].selEq2) {
            if (typeof input[i]["s"] !== 'undefined') {
                s = input[i]["s"];
            } else {
                s = Fec.div(Fec.mul(3n, Fec.mul(x1, x1)), Fec.add(y1, y1));
            }
            let eq = s * 2n * y1 - 3n * x1 * x1; // Worst values are {-3*(2^256-1)**2,2*(2^256-1)**2}
                                                  // with |-3*(2^256-1)**2| > 2*(2^256-1)**2
            q0 = -(eq/pFec);
            nDivErrors = errorHandler(
                (eq + pFec*q0) != 0n,
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

        if (input[i].selEq1 || input[i].selEq2) {
            let eqa = s * s - x1 - x2 - x3; // Worst values are {-3*(2^256-1),(2^256-1)**2}
                                            // with (2^256-1)**2 > |-3*(2^256-1)|
            q1 = eqa/pFec;
            nDivErrors = errorHandler(
                (eqa - pFec*q1) != 0n,
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
            let eqb = s * x1 - s * x3 - y1 - y3; // Worst values are {-(2^256+1)*(2^256-1),(2^256-1)**2}
                                                 // with |-(2^256+1)*(2^256-1)| > (2^256-1)**2
            q2 = -(eqb/pFec);
            nDivErrors = errorHandler(
                (eqb + pFec*q2) != 0n,
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
        else if (input[i].selEq3) {
            let eqa = x1 * x2 - y1 * y2 - x3; // Worst values are {-2^256*(2^256-1),(2^256-1)**2}
                                              // with |-2^256*(2^256-1)| > (2^256-1)**2
            q1 = -(eqa/pBN254);
            nDivErrors = errorHandler(
                (eqa + pBN254*q1) != 0n,
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

            let eqb = y1 * x2 + x1 * y2 - y3; // Worst values are {-(2^256-1),2*(2^256-1)**2}
                                              // with 2*(2^256-1)**2 > |-(2^256-1)|
            q2 = eqb/pBN254;
            nDivErrors = errorHandler(
                (eqb - pBN254*q2) != 0n,
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
        else if (input[i].selEq4) {
            let eqa = x1 + x2 - x3; // Worst values are {-(2^256-1),2*(2^256-1)}
                                    // with 2*(2^256-1) > |-(2^256-1)|
            q1 = eqa/pBN254;
            nDivErrors = errorHandler(
                (eqa - pBN254*q1) != 0n,
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

            let eqb = y1 + y2 - y3; // Worst values are {-(2^256-1),2*(2^256-1)}
                                    // with 2*(2^256-1) > |-(2^256-1)|
            q2 = eqb/pBN254;
            nDivErrors = errorHandler(
                (eqb - pBN254*q2) != 0n,
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
        else if (input[i].selEq5) {
            let eqa = x1 - x2 - x3; // Worst values are {-2*(2^256-1),(2^256-1)}
                                    // with |-2*(2^256-1)| > (2^256-1)
            q1 = -(eqa/pBN254);
            nDivErrors = errorHandler(
                (eqa + pBN254*q1) != 0n,
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

            let eqb = y1 - y2 - y3; // Worst values are {-2*(2^256-1),(2^256-1)}
                                    // with |-2*(2^256-1)| > (2^256-1)
            q2 = -(eqb/pBN254);
            nDivErrors = errorHandler(
                (eqb + pBN254*q2) != 0n,
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
        } else {
            q1 = 0n;
            q2 = 0n;
        }

        if (input[i].selEq6) {
            let eq = x1 * y1 + x2 - y3;
            if (y2 === 0n) {
                throw new Error(`For input ${i}, y2 is zero on modular arithmetic`);
            }
            let quotient = eq / y2;
            q1 = quotient >> 256n;
            q0 = quotient & (2n ** 256n - 1n);

            nDivErrors = errorHandler(
                eq - y2 * 2n ** 256n * q1 - y2 * q0 !== 0n,
                `For input ${i}, with the calculated q0 the residual is not zero (modular arith)`,
                continueOnError,
                nDivErrors
            );
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

    const chunksPrimeSecp256k1 = [ 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn,
                            0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFEn, 0xFFFFn, 0xFC2Fn ];
    const chunksPrimeBN254     = [ 0x3064n, 0x4E72n, 0xE131n, 0xA029n, 0xB850n, 0x45B6n, 0x8181n, 0x585Dn,
                            0x9781n, 0x6A91n, 0x6871n, 0xCA8Dn, 0x3C20n, 0x8C16n, 0xD87Cn, 0xFD47n ];
    for (let i = 0; i < input.length; i++) {
        let offset = i * 32;
        let xAreDifferent = false;
        let valueLtPrime;
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
            }
            pols.y2clock[index] = BigInt(input[i]["_y2"][15 - step16])
            pols.y3clock[index] = BigInt(input[i]["_y3"][15 - step16])
            pols.selEq[0][index] = BigInt(input[i].selEq0);
            pols.selEq[1][index] = BigInt(input[i].selEq1);
            pols.selEq[2][index] = BigInt(input[i].selEq2);
            pols.selEq[3][index] = BigInt(input[i].selEq3);
            pols.selEq[4][index] = BigInt(input[i].selEq4);
            pols.selEq[5][index] = BigInt(input[i].selEq5);
            pols.selEq[6][index] = BigInt(input[i].selEq6);

            // selEq1 (addition different points) is select need to check that points are diferent
            if (pols.selEq[1][index] && step < 16) {
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
            if (pols.selEq[1][index] || pols.selEq[2][index] || pols.selEq[3][index] || pols.selEq[4][index] || pols.selEq[5][index] || pols.selEq[6][index]) {
                const chunkValue = step < 16 ? pols.x3[15 - step16][offset] : pols.y3[15 - step16][offset];
                let chunkPrime;
                if (pols.selEq[1][index] || pols.selEq[2][index]) {
                    chunkPrime = chunksPrimeSecp256k1[step16];
                } else if (pols.selEq[3][index] || pols.selEq[4][index] || pols.selEq[5][index]) {
                    chunkPrime = chunksPrimeBN254[step16];
                } else if (pols.selEq[6][index]) {
                    chunkPrime = pols.y2[15 - step16][offset]
                }
                const chunkLtPrime = valueLtPrime ? 0n : Fr.lt(chunkValue, chunkPrime);
                valueLtPrime = valueLtPrime || chunkLtPrime;
                pols.chunkLtPrime[index] = chunkLtPrime ? 1n : 0n;
                pols.valueLtPrime[nextIndex] = valueLtPrime ? 1n : 0n;
            }

            pols.x3clock[index] = 0xFFFFn + pols.y3[15 - step16][offset] - pols.y2[15 - step16][offset] + pols.chunkLtPrime[index];

            pols.selEq[0][offset + step] = BigInt(input[i].selEq0);
            pols.selEq[1][offset + step] = BigInt(input[i].selEq1);
            pols.selEq[2][offset + step] = BigInt(input[i].selEq2);
            pols.selEq[3][offset + step] = BigInt(input[i].selEq3);
            pols.selEq[4][offset + step] = BigInt(input[i].selEq4);
            pols.selEq[5][offset + step] = BigInt(input[i].selEq5);
            pols.selEq[6][offset + step] = BigInt(input[i].selEq6);
        }
        let carry = [0n, 0n, 0n];
        const eqIndexToCarryIndex = [0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 2, 0];
        let eq = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

        let eqIndexes = [];
        if (pols.selEq[0][offset]) eqIndexes.push(0);
        if (pols.selEq[1][offset]) eqIndexes.push(1);
        if (pols.selEq[2][offset]) eqIndexes.push(2);
        if (pols.selEq[1][offset] || pols.selEq[2][offset]) eqIndexes = eqIndexes.concat([3, 4]);
        if (pols.selEq[3][offset]) eqIndexes = eqIndexes.concat([5, 6]);
        if (pols.selEq[4][offset]) eqIndexes = eqIndexes.concat([7, 8]);
        if (pols.selEq[5][offset]) eqIndexes = eqIndexes.concat([9, 10]);
        if (pols.selEq[6][offset]) eqIndexes.push(11);

        for (let step = 0; step < 32; ++step) {
            eqIndexes.forEach((eqIndex) => {
                let carryIndex = eqIndexToCarryIndex[eqIndex];
                eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                pols.carry[carryIndex][offset + step] = Fr.e(carry[carryIndex]);
                if ((eq[eqIndex] + carry[carryIndex]) % (2n ** 16n) !== 0n && !continueOnError) {
                    throw new Error(`Equation ${eqIndex}:${eq[eqIndex]} and carry ${carryIndex}:${carry[carryIndex]} do not sum 0 mod 2¹⁶.`);
                }
                carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
            });
        }
        pols.resultEq[offset + 31] =
            pols.selEq[0][offset] || pols.selEq[1][offset] || pols.selEq[2][offset] ||
            pols.selEq[3][offset] || pols.selEq[4][offset] || pols.selEq[5][offset] || pols.selEq[6][offset]
                ? 1n
                : 0n;
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
