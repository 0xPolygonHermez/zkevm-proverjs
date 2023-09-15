const {fea2scalar} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

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
    const N = pols.a[0].length;

    const Fr = new F1Field(0xffffffff00000001n);

    // Split the input in little-endian words
    // prepareInput256bits(input, N);
    inputFeaTo16bits(input, N, ['a', 'b', 'c', 'd', 'op']);
    let eqCalculates = [];

    // Initialization
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < 4; j++) {
            pols.a[j][i] = 0n;
            pols.b[j][i] = 0n;
            pols.c[j][i] = 0n;
            pols.d[j][i] = 0n;
            pols.op[j][i] = 0n;
        }
        pols.carry[i] = 0n;
        pols.result[i] = 0n;
    }
    for (let i = 0; i < input.length; i++) {
        let offset = i * 8;
        for (let step = 0; step < 8; ++step) {
            for (let j = 0; j < 4; j++) {
                pols.a[j][offset + step] = BigInt(input[i]["_a"][j])
                pols.b[j][offset + step] = BigInt(input[i]["_b"][j])
                pols.c[j][offset + step] = BigInt(input[i]["_c"][j])
                pols.d[j][offset + step] = BigInt(input[i]["_d"][j])
                pols.op[j][offset + step] = BigInt(input[i]["_op"][j])
            }
        }
        let carry = 0n;
        let eq = 0n;

        for (let step = 0; step < 8; ++step) {
            eq = arithEq0.calculate(pols, step, offset);
            pols.carry[offset + step] = Fr.e(carry);
            carry = (eq + carry) / (2n ** 16n);
        }
        pols.result[offset + 7] = 1n;
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
