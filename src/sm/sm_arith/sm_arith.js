// all arith sources and tools on https://github.com/hermeznetwork/sm_arith.git

const arithEq0 = require('./sm_arith_eq0');

const F1Field = require("ffjavascript").F1Field;

module.exports.buildConstants = async function (pols) {
    const N = pols.SEL_BYTE2_BIT19.length;

    buildByte2Bits16(pols, N);
    buildRange(pols, N, 'GL_SIGNED_22BITS', -(2n**22n), (2n**22n)-1n);
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
    const Fr = new F1Field(0xffffffff00000001n);

    // Split the input in little-endian bytes
    prepareInput256bits(input, N);
    let eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate];

    // Initialization
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < 4; j++) {
            pols.x1[j][i] = 0n;
            pols.y1[j][i] = 0n;
            pols.x2[j][i] = 0n;
            pols.y2[j][i] = 0n;
            pols.x3[j][i] = 0n;
            if (j < pols.carry.length) pols.carry[j][i] = 0n;
            if (j < pols.selEq.length) pols.selEq[j][i] = 0n;
        }
    }
    for (let i = 0; i < input.length; i++) {
        let offset = i * 8;
        for (let step = 0; step < 8; ++step) {
            for (let j = 0; j < 4; j++) {
                pols.x1[j][offset + step] = BigInt(input[i]["_x1"][j])
                pols.y1[j][offset + step] = BigInt(input[i]["_y1"][j])
                pols.x2[j][offset + step] = BigInt(input[i]["_x2"][j])
                pols.y2[j][offset + step] = BigInt(input[i]["_y2"][j])
                pols.x3[j][offset + step] = BigInt(input[i]["_x3"][j])
                pols.y3[j][offset + step] = BigInt(input[i]["_y3"][j])
            }
            pols.selEq[0][offset + step] = BigInt(input[i].selEq0);
        }
        let carry = [0n, 0n, 0n];
        const eqIndexToCarryIndex = [0, 0, 0, 1, 2];
        let eq = [0n, 0n , 0n, 0n, 0n]

        let eqIndexes = [];
        if (pols.selEq[0][offset]) eqIndexes.push(0);


        for (let step = 0; step < 8; ++step) {
            eqIndexes.forEach((eqIndex) => {
                let carryIndex = eqIndexToCarryIndex[eqIndex];
                eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                pols.carry[carryIndex][offset + step] = Fr.e(carry[carryIndex]);
                carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
            });
        }
        pols.resultEq0[offset + 31] = pols.selEq[0][offset] ? 1n : 0n;
    }
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
