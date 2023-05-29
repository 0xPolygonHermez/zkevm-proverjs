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

const F1Field = require("ffjavascript").F1Field;

module.exports.buildConstants = async function (pols) {
    const N = pols.SEL_BYTE2_BIT19.length;

    buildByte2Bits16(pols, N);
    buildRange(pols, N, 'GL_SIGNED_22BITS', -(2n**22n), (2n**22n)-1n);
    buildRangeSelector(pols.RANGE_SEL, N, 2 ** 16, [0xFFFF,0xFFFE,0xFFFD,0xFC2F,0xFC2E]);
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
    // when SEL_BYTE2_BIT19 is zero, only values from 0 to (2**16)-1 are included
    for (let i = 0; i < 2**16; ++i) {
        pols.SEL_BYTE2_BIT19[p] = 0n;
        pols.BYTE2_BIT19[p] = BigInt(i);
        ++p;
    }

    // when SEL_BYTE2_BIT19 is one, only values from 0 to (2**19)-1 are included
    for (let i = 0; i < 2**19; ++i) {
        pols.SEL_BYTE2_BIT19[p] = 1n;
        pols.BYTE2_BIT19[p] = BigInt(i);
        ++p;
    }
    // fill to end with zero and zero, a valid combination
    for (let i = p; i < N; ++i) {
        pols.SEL_BYTE2_BIT19[i] = 0n;
        pols.BYTE2_BIT19[i] = 0n;
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

module.exports.execute = async function (pols, input) {
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
                        arithEq10.calculate];

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
        pols.resultEq0[i] = 0n;
        pols.resultEq1[i] = 0n;
        pols.resultEq2[i] = 0n;
        pols.xDeltaChunkInverse[i] = 0n;
        pols.xAreDifferent[i] = 0n;

        // by default valueLtPrime must be one
        pols.valueLtPrime[i] = 0n;
        pols.chunkLtPrime[i] = 0n;
        pols.resultEq3[i] = 0n;
        pols.resultEq4[i] = 0n;
        pols.resultEq5[i] = 0n;
    }
    let s, q0, q1, q2;
    for (let i = 0; i < input.length; i++) {
        console.log(i);
        console.log(input[i]["x1"]);
        let x1 = fea2scalar(Fr, input[i]["x1"]);
        let y1 = fea2scalar(Fr, input[i]["y1"]);
        let x2 = fea2scalar(Fr, input[i]["x2"]);
        let y2 = fea2scalar(Fr, input[i]["y2"]);
        let x3 = fea2scalar(Fr, input[i]["x3"]);
        let y3 = fea2scalar(Fr, input[i]["y3"]);

        if (input[i].selEq1) {
            let pq0;
            if (Fec.eq(x2, x1)) {
                throw new Error(`For input ${i}, x1 and x2 are equals, but ADD_EC_DIFFERENT is called`);
            } else {
                s = Fec.div(Fec.sub(y2, y1), Fec.sub(x2, x1));
                pq0 = s * x2 - s * x1 - y2 + y1;
            }
            q0 = -(pq0/pFec);
            if ((pq0 + pFec*q0) != 0n) {
                throw new Error(`For input ${i}, with the calculated q0 the residual is not zero (diff point)`);
            }
            q0 += 2n ** 258n;
        }
        else if (input[i].selEq2) {
            s = Fec.div(Fec.mul(3n, Fec.mul(x1, x1)), Fec.add(y1, y1));
            let pq0 = s * 2n * y1 - 3n * x1 * x1;
            q0 = -(pq0/pFec);
            if ((pq0 + pFec*q0) != 0n) {
                throw new Error(`For input ${i}, with the calculated q0 the residual is not zero (same point)`);
            }
            q0 += 2n ** 258n;
        }
        else {
            s = 0n;
            q0 = 0n;
        }

        if (input[i].selEq3) {
            let pq1 = s * s - x1 - x2 - x3;
            q1 = -(pq1/pFec);
            if ((pq1 + pFec*q1) != 0n) {
                throw new Error(`For input ${i}, with the calculated q1 the residual is not zero`);
            }
            q1 += 2n ** 258n;

            let pq2 = s * x1 - s * x3 - y1 - y3;
            q2 = -(pq2/pFec);
            if ((pq2 + pFec*q2) != 0n) {
                throw new Error(`For input ${i}, with the calculated q2 the residual is not zero`);
            }
            q2 += 2n ** 258n;
        }
        else if (input[i].selEq4) {
            // EQ5:  x1 * x2 - y1 * y2 - x3  + (q1 * p)
            let pq1 = x1 * x2 - y1 * y2 - x3;
            q1 = -(pq1/pBN254);
            if ((pq1 + pBN254*q1) != 0n) {
                throw new Error(`For input ${i}, with the calculated q1 the residual is not zero`);
            }
            // offset
            q1 += 2n ** 258n;

            // EQ6:  y1 * x2 + x1 * y2 - y3 + (q2 * p)
            let pq2 = y1 * x2 + x1 * y2 - y3;
            q2 = -(pq2/pBN254);
            if ((pq2 + pBN254*q2) != 0n) {
                throw new Error(`For input ${i}, with the calculated q2 the residual is not zero`);
            }
            // offset
            q2 += 2n ** 258n;
        }
        else if (input[i].selEq5) {
            // EQ7:  x1 + x2 - x3  + (q1 * p)
            let pq1 = x1 + x2 - x3;
            q1 = -(pq1/pBN254);
            if ((pq1 + pBN254*q1) != 0n) {
                throw new Error(`For input ${i}, with the calculated q1 the residual is not zero`);
            }
            // offset
            q1 += 2n ** 258n;

            // EQ8:  y1 + y2 - y3 + (q2 * p)
            let pq2 = y1 + y2 - y3;
            q2 = -(pq2/pBN254);
            if ((pq2 + pBN254*q2) != 0n) {
                throw new Error(`For input ${i}, with the calculated q2 the residual is not zero`);
            }
            // offset
            q2 += 2n ** 258n;
        }
        else if (input[i].selEq6) {
            // EQ9:  x1 - x2 - x3  + (q1 * p)
            let pq1 = x1 - x2 - x3;
            q1 = -(pq1/pBN254);
            if ((pq1 + pBN254*q1) != 0n) {
                throw new Error(`For input ${i}, with the calculated q1 the residual is not zero`);
            }
            // offset
            q1 += 2n ** 258n;

            // EQ10:  y1 - y2 - y3 + (q2 * p)
            let pq2 = y1 - y2 - y3;
            q2 = -(pq2/pBN254);
            if ((pq2 + pBN254*q2) != 0n) {
                throw new Error(`For input ${i}, with the calculated q2 the residual is not zero`);
            }
            // offset
            q2 += 2n ** 258n;
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

    const chunksPrimeHL = [ 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn,
                            0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFFn, 0xFFFEn, 0xFFFFn, 0xFC2Fn ];
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
            pols.selEq[0][index] = BigInt(input[i].selEq0);
            pols.selEq[1][index] = BigInt(input[i].selEq1);
            pols.selEq[2][index] = BigInt(input[i].selEq2);
            pols.selEq[3][index] = BigInt(input[i].selEq3);

            // selEq1 (addition different points) is select need to check that points are diferent
            if (pols.selEq[1][index] && step < 16) {
                if (xAreDifferent === false) {
                    const delta = Fr.sub(pols.x2[step][index], pols.x1[step][index]);
                    pols.xDeltaChunkInverse[index] = Fr.isZero(delta) ? 0n : Fr.inv(delta);
                    xAreDifferent = Fr.isZero(delta) ? false : true;
                }
                pols.xAreDifferent[nextIndex] = xAreDifferent ? 1n : 0n;
            }

            // selEq3 (addition + doubling points) is select need to check that x3, y3 is alias free.
            if (pols.selEq[3][index]) {
                const chunkValue = step > 15 ? pols.y3[15 - step16][offset] : pols.x3[15 - step16][offset];
                const chunkPrime = chunksPrimeHL[step16];
                const chunkLtPrime = valueLtPrime ? 0n : Fr.lt(chunkValue, chunkPrime);
                const _valueLtPrime = valueLtPrime;
                valueLtPrime = valueLtPrime || chunkLtPrime;
                pols.chunkLtPrime[index] = chunkLtPrime ? 1n : 0n;
                pols.valueLtPrime[nextIndex] = valueLtPrime ? 1n : 0n;
            }
            pols.selEq[0][offset + step] = BigInt(input[i].selEq0);
            pols.selEq[1][offset + step] = BigInt(input[i].selEq1);
            pols.selEq[2][offset + step] = BigInt(input[i].selEq2);
            pols.selEq[3][offset + step] = BigInt(input[i].selEq3);
            pols.selEq[4][offset + step] = BigInt(input[i].selEq4);
            pols.selEq[5][offset + step] = BigInt(input[i].selEq5);
            pols.selEq[6][offset + step] = BigInt(input[i].selEq6);
        }
        let carry = [0n, 0n, 0n];
        const eqIndexToCarryIndex = [0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 2];
        let eq = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]

        let eqIndexes = [];
        if (pols.selEq[0][offset]) eqIndexes.push(0);
        if (pols.selEq[1][offset]) eqIndexes.push(1);
        if (pols.selEq[2][offset]) eqIndexes.push(2);
        if (pols.selEq[3][offset]) eqIndexes = eqIndexes.concat([3, 4]);
        if (pols.selEq[4][offset]) eqIndexes = eqIndexes.concat([5, 6]);
        if (pols.selEq[5][offset]) eqIndexes = eqIndexes.concat([7, 8]);
        if (pols.selEq[6][offset]) eqIndexes = eqIndexes.concat([9, 10]);

        for (let step = 0; step < 32; ++step) {
            eqIndexes.forEach((eqIndex) => {
                let carryIndex = eqIndexToCarryIndex[eqIndex];
                eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                pols.carry[carryIndex][offset + step] = Fr.e(carry[carryIndex]);
                carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
            });
        }
        pols.resultEq0[offset + 31] = pols.selEq[0][offset] ? 1n : 0n;
        pols.resultEq1[offset + 31] = (pols.selEq[1][offset] || pols.selEq[3][offset] || pols.selEq[4][offset] || pols.selEq[5][offset]) ? 1n : 0n;
        pols.resultEq2[offset + 31] = pols.selEq[2][offset] ? 1n : 0n;
    }
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
    console.log(res);
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
        parts.push(value & (part < 15 ? 0xFFFFn:0xFFFFFn));
        value = value >> 16n;
    }
    return parts;
}
