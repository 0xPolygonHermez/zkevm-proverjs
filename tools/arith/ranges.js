const path = require('path');
const arithEqPath = path.join(__dirname, '/../../src/sm/sm_arith/');
const arithEq0 = require(arithEqPath + 'sm_arith_eq0.js');
const arithEq1 = require(arithEqPath + 'sm_arith_eq1.js');
const arithEq2 = require(arithEqPath + 'sm_arith_eq2.js');
const arithEq3 = require(arithEqPath + 'sm_arith_eq3.js');
const arithEq4 = require(arithEqPath + 'sm_arith_eq4.js');
const F1Field = require("ffjavascript").F1Field;

const max256bits = (2n ** 256n)-1n;

const limits = {
    x1: [0n, max256bits],
    y1: [0n, max256bits],
    x2: [0n, max256bits],
    y2: [0n, max256bits],
    x3: [0n, max256bits],
    y3: [0n, max256bits],
    s: [0n, max256bits],
    q: [0n,  (2n ** 259n)-1n],
    carry: [0n, (2n ** 19n)-1n]
}
const qs = ['q0', 'q0', 'q0', 'q1', 'q2'];
const eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate];


function log2 (value)
{
    let bits = 1;
    let limit = 2n;
    let absvalue = value < 0n ? -value:value;
    while (absvalue >= limit ) {
        ++bits;
        limit=limit * 2n;
    }
    return bits;
}
/*
 M = 2**256-1
 MC = max-carry

 M2+M = (0xFFFF..FF000...000) 128 bits


 eq1: s * x2 - s * x1 - y2 + y1
    max = M*M-0-0+M+MC = M2+M+MC

    (M2+M)/P = Q = 0x100000000000000000000000000000000000000000000000000000001000003d0 => 257 bits (without sign, without carry)
            MC < P => Q <= 0x100000000000000000000000000000000000000000000000000000001000003d1 => 257 bits
            SIGN_OFFSET = (2**258) => 2*258

 eq2 = s * 2n * y1 - 3n * x1 * x1;
    max = M*M*2 = M2*2+MC
    min = M*M*3 = M2*3+MC

    (M*M*3)/P = Q = 0x30000000000000000000000000000000000000000000000000000000300000b6d => 258 bits (without sign, without carry)
        MC < P => Q <= 0x30000000000000000000000000000000000000000000000000000000300000b6e => 258 bits
        SIGN_OFFSET = (2**258) => 2*259

 eq3 = s * s - x1 - x2 - x3;
    max = M*M-0-0-0 = M*M+MC (as eq1)
    min = 0*0-M-M-M = 3*M + MC (very small)

 eq4 = s * x1 - s * x3 - y1 - y3;
    max = M*M-0-0-0 = M*M+MC (as eq1)
    min = 0*0-M*M-M-M = M*M+2M+MC (as positive eq2)

CONCLUSION

            q2 = -(pq2/pFr);

            if ((pq2 + pFr*q2) != 0n) {
                console.log('PROBLEM q2!!!');
                // EXIT_HERE;
            }
            q2 += 2n ** 259n;
*/



function calculateLimits(limits)
{
    const keys = Object.keys(limits);
    let maxValues = [], minValues = [];
    let maxValue = 0n;
    let minValue = 2n ** 2048n;
    let maxTotalValue = 0n;
    let minTotalValue = 2n ** 2048n;

    for (let eqIndex = 0; eqIndex < 4; ++eqIndex) {
        maxValues.push([]);
        minValues.push([]);
        for (let step = 0; step < 32; ++step) {
            maxValues[eqIndex].push(0n);
            minValues[eqIndex].push(2n ** 2048n);
        }
    }

    const maskLimit = 2 ** keys.length;
    for (let mask = 0; mask < maskLimit; ++mask) {
        for (let eqIndex = 0; eqIndex < 4; ++eqIndex) {
            let pols = [];
            let _mask = mask;
            let carry = 0n;
            let values = [];
            for (let i = 0; i < keys.length; ++i) {
                key = keys[i];
                value = limits[key][_mask & 0x01 ? 1:0];
                if (key !== 'q' && key !== 'carry') {
                    values[key] = value;
                }
                if (key == 'q') key = qs[eqIndex];
                pols[key] = [];
                if (key == 'carry') {
                    carry = value;
                }
                else {
                    for (let part = 0; part < 16; ++part) {
                        pols[key].push([value & (part < 15 ? 0xFFFFn:0xFFFFFFFFn)]);
                        value = value >> 16n;
                    }
                }
                _mask = _mask >> 1;
            }
            let result = 0n;
            switch (eqIndex) {
                case 1: result = values.s * values.x2 - values.s * values.x1 - values.y2 + values.y1; break;
                case 2: result = 2n * values.s * values.y1 - 3n * values.x1 * values.x1; break;
                case 3: result = values.s * values.s - values.x1 - values.x2 - values.x3; break;
                case 4: result = values.s * values.x1 - values.s * values.x3 - values.y1 - values.y3; break;
                default: result = 0n;
            }
            if (result > maxTotalValue) maxTotalValue = result;
            if (result < minTotalValue) minTotalValue = result;
            for (let step = 0; step < 32; ++step) {
                let result = eqCalculates[eqIndex](pols, step, 0) + carry - (2n ** 22n);
                if (result > maxValues[eqIndex][step]) maxValues[eqIndex][step] = result;
                if (result < minValues[eqIndex][step]) minValues[eqIndex][step] = result;
                if (result > maxValue) maxValue = result;
                if (result < minValue) minValue = result;
            }
        }
    }
    const p = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
    const minQ = (minTotalValue / p) +  (minTotalValue % p ? 1n:0n);
    const maxQ = (maxTotalValue / p) +  (maxTotalValue % p ? 1n:0n);
    console.log(minValues);
    console.log(maxValues);
    let bits = log2(minValue);
    console.log(['minValue:', minValue, 'bits:', bits, 'bits-carry', bits-16]);
    bits = log2(maxValue);
    console.log(['maxValue:', maxValue, 'bits:', bits, 'bits-carry', bits-16]);
    bits = log2(minTotalValue);
    console.log(['minTotalValue:', minTotalValue, 'bits:', bits]);
    bits = log2(maxTotalValue);
    console.log(['maxTotalValue:', maxTotalValue, 'bits:', bits]);
    bits = log2(minQ);
    console.log(['minQ:', minQ, 'bits:', bits]);
    bits = log2(maxQ);
    console.log(['maxQ:', maxQ, 'bits:', bits]);
    const qOffset = 0x40000000000000000000000000000000000000000000000000000000000000000n;
    bits = log2(qOffset);
    console.log(['qOffset:', qOffset, 'bits:', bits]);
    bits = log2(minQ+qOffset);
    console.log(['minQ+qOffset:', minQ+qOffset, 'bits:', bits]);
    bits = log2(maxQ+qOffset);
    console.log(['maxQ+qOffset:', maxQ+qOffset, 'bits:', bits, 'q15-bits:', bits-(256-16)]);
    return 0;
}

module.exports.execute = async function (pols, polsDef, input) {
    // Get N from definitions
    // const N = Number(polsDef.freeInA.polDeg);
    const N = 2 ** 16;

    let pFr = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
    const Fr = new F1Field(pFr);

    // Split the input in little-endian bytes
    prepareInput256bits(input, N);
    let eqCalculates = [arithEq0.calculate, arithEq1.calculate, arithEq2.calculate, arithEq3.calculate, arithEq4.calculate];

    // Initialization
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < 16; j++) {
            pols.x1[j].push(0n);
            pols.y1[j].push(0n);
            pols.x2[j].push(0n);
            pols.y2[j].push(0n);
            pols.x3[j].push(0n);
            pols.y3[j].push(0n);
            pols.q0[j].push(0n);
            pols.q1[j].push(0n);
            pols.q2[j].push(0n);
            pols.s[j].push(0n);
            if (j < pols.carry.length) pols.carry[j].push(0n);
            if (j < pols.sel_eq.length) pols.sel_eq[j].push(0n);
        }
    }
    let s, q0, q1, q2;
    for (let i = 0; i < input.length; i++) {
        // TODO: if not have x1, need to componse it

        let x1 = BigInt(input[i]["x1"]);
        let y1 = BigInt(input[i]["y1"]);
        let x2 = BigInt(input[i]["x2"]);
        let y2 = BigInt(input[i]["y2"]);
        let x3 = BigInt(input[i]["x3"]);
        let y3 = BigInt(input[i]["y3"]);

        if (input[i].sel_eq1) {
            s = Fr.div(Fr.sub(y2, y1), Fr.sub(x2, x1));
            let pq0 = s * x2 - s * x1 - y2 + y1;
            q0 = -(pq0/pFr);
            if ((pq0 + pFr*q0) != 0n) {
                console.log('PROBLEM q0 2!!!');
                // EXIT_HERE;
            }
            q0 += 2n ** 259n;
        }
        else if (input[i].sel_eq2) {
            s = Fr.div(Fr.mul(3n, Fr.mul(x1, x1)), Fr.add(y1, y1));
            let pq0 = s * 2n * y1 - 3n * x1 * x1;
            q0 = -(pq0/pFr);
            if ((pq0 + pFr*q0) != 0n) {
                console.log('PROBLEM q0 2!!!');
                // EXIT_HERE;
            }
            q0 += 2n ** 259n;
        }
        else {
            s = 0n;
            q0 = 0n;
        }

        if (input[i].sel_eq3) {
            let pq1 = s * s - x1 - x2 - x3;
            q1 = pq1/pFr;
            if ((pq1 - pFr*q1) != 0n) {
                console.log('PROBLEM q1!!!');
                // EXIT_HERE;
            }
            let pq2 = s * x1 - s * x3 - y1 - y3;
            q2 = -(pq2/pFr);
            if ((pq2 + pFr*q2) != 0n) {
                console.log('PROBLEM q2!!!');
                // EXIT_HERE;
            }
            q2 += 2n ** 259n;
            console.log([x1,y1,x2,y2,s,q0.toString(16),q1.toString(16),q2.toString(16), pq2]);
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

    for (let i = 0; i < input.length; i++) {
        let offset = i * 32;
        for (let step = 0; step < 32; ++step) {
            for (let j = 0; j < 16; j++) {
                pols.x1[j][offset + step] = BigInt(input[i]["_x1"][j])
                pols.y1[j][offset + step] = BigInt(input[i]["_y1"][j])
                pols.x2[j][offset + step] = BigInt(input[i]["_x2"][j])
                pols.y2[j][offset + step] = BigInt(input[i]["_y2"][j])
                pols.x3[j][offset + step] = BigInt(input[i]["_x3"][j])
                pols.y3[j][offset + step] = BigInt(input[i]["_y3"][j])
                pols.s[j][offset + step] = BigInt(input[i]["_s"][j])
                pols.q0[j][offset + step] = BigInt(input[i]["_q0"][j])
                pols.q1[j][offset + step] = BigInt(input[i]["_q1"][j])
                pols.q2[j][offset + step] = BigInt(input[i]["_q2"][j])
            }
            pols.sel_eq[0][offset + step] = BigInt(input[i].sel_eq0);
            pols.sel_eq[1][offset + step] = BigInt(input[i].sel_eq1);
            pols.sel_eq[2][offset + step] = BigInt(input[i].sel_eq2);
            pols.sel_eq[3][offset + step] = BigInt(input[i].sel_eq3);
        }
        let carry = [0n, 0n, 0n];
        const eqIndexToCarryIndex = [0, 0, 0, 1, 2];
        let eq = [0n, 0n , 0n, 0n, 0n]

        let eqIndexes = [];
        if (pols.sel_eq[0][offset]) eqIndexes.push(0);
        if (pols.sel_eq[1][offset]) eqIndexes.push(1);
        if (pols.sel_eq[2][offset]) eqIndexes.push(2);
        if (pols.sel_eq[3][offset]) eqIndexes = eqIndexes.concat([3, 4]);

        for (let step = 0; step < 32; ++step) {
            eqIndexes.forEach((eqIndex) => {
                let carryIndex = eqIndexToCarryIndex[eqIndex];
                eq[eqIndex] = eqCalculates[eqIndex](pols, step, offset);
                pols.carry[carryIndex][offset + step] = carry[carryIndex];
                carry[carryIndex] = (eq[eqIndex] + carry[carryIndex]) / (2n ** 16n);
            });
        }
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

calculateLimits(limits);
