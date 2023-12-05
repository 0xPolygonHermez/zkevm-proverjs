const { assert } = require('console');
const fs = require('fs');
const path = require('path');
const { log2 } = require('@0xpolygonhermez/zkevm-commonjs').utils;
const { F1Field } = require('ffjavascript');
const { getKs, getRoots } = require('pilcom');

const SlotSize = 31487;
const chunkBits = 7n;

const GATE_XOR = 0n;
const GATE_CH = 1n;
const GATE_MAJ = 2n;
const GATE_ADD = 3n;

function ch(a, b, c) {
    return ((a & b) ^ (~a & c));
}

function maj(a, b, c) {
    return ((a & b) ^ (a & c) ^ (b & c));
}

function carry(a, b, c) {
    return (~a & 0xFFFFFFFFn & b & c) | (a & b) | (a & c);
}

module.exports.buildConstants = async function (pols) {
    function connect(p1, i1, p2, i2, offset) {
        offset = offset || 0;
        if (i1 > 1) i1 += offset;
        if (i2 > 1) i2 += offset;
        [pols.Conn[p1][i1], pols.Conn[p2][i2]] = [pols.Conn[p2][i2], pols.Conn[p1][i1]];
    }

    const N = pols.Conn[0].length;

    const F = new F1Field('0xFFFFFFFF00000001');

    const nSlots = Math.floor((N - 1) / SlotSize);

    const gates = JSON.parse(await fs.promises.readFile(path.join(__dirname, 'sha256_gates.json'), 'utf8'));

    const pow = log2(N);
    assert(1 << pow === N);

    const ks = getKs(F, 3);
    const roots = getRoots(F);
    const wi = roots[pow];

    let w = F.one;
    for (let i = 0; i < N; i++) {
        pols.Conn[0][i] = w;
        pols.Conn[1][i] = F.mul(w, ks[0]);
        pols.Conn[2][i] = F.mul(w, ks[1]);
        pols.Conn[3][i] = F.mul(w, ks[2]);
        w = F.mul(w, wi);
    }

    pols.GATE_TYPE[0] = GATE_XOR;
    pols.CARRY_ENABLED[0] = 0n;

    let p = 1;

    for (let i = 0; i < nSlots; i++) {
        const offset = i * SlotSize;

        const wires = {};
        wires[0] = [0, 0];
        wires[1] = [1, 0];
        connect(0, 0, 2, 0);
        connect(1, 0, 3, 0);
        for (let j = 1; j < gates.length; j++) {
            for (let k = 0; k < 4; k++) {
                const wire = gates[j].connections[k];
                if (wires[wire]) {
                    connect(wires[wire][0], wires[wire][1], k, j, offset);
                    wires[wire] = [k, j];
                } else {
                    wires[wire] = [k, j];
                }
            }
            if (gates[j].type === 'xor') {
                pols.GATE_TYPE[p] = GATE_XOR;
                pols.CARRY_ENABLED[p] = 0n;
            } else if (gates[j].type === 'ch') {
                pols.GATE_TYPE[p] = GATE_CH;
                pols.CARRY_ENABLED[p] = 0n;
            } else if (gates[j].type === 'maj') {
                pols.GATE_TYPE[p] = GATE_MAJ;
                pols.CARRY_ENABLED[p] = 0n;
            } else if (gates[j].type === 'add') {
                pols.GATE_TYPE[p] = GATE_ADD;
                pols.CARRY_ENABLED[p] = 1n;
            } else {
                throw new Error(`Gate not defined: ${gates[j].type}`);
            }
            p += 1;
        }
    }

    while (p < N) {
        pols.GATE_TYPE[p] = GATE_XOR;
        pols.CARRY_ENABLED[p] = 0n;
        p += 1;
    }

    p = 0;
    for (let a = 0n; a < 2n ** chunkBits; a++) {
        for (let b = 0n; b < 2n ** chunkBits; b++) {
            for (let c = 0n; c < 2n ** chunkBits; c++) {
                pols.kGateType[p] = GATE_XOR;
                pols.kA[p] = a;
                pols.kB[p] = b;
                pols.kC[p] = c;
                pols.kOut[p] = a ^ b ^ c;
                pols.kCarryOut[p] = 0n;
                p += 1;
                pols.kGateType[p] = GATE_CH;
                pols.kA[p] = a;
                pols.kB[p] = b;
                pols.kC[p] = c;
                pols.kOut[p] = ch(a, b, c);
                pols.kCarryOut[p] = 0n;
                p += 1;
                pols.kGateType[p] = GATE_MAJ;
                pols.kA[p] = a;
                pols.kB[p] = b;
                pols.kC[p] = c;
                pols.kOut[p] = maj(a, b, c);
                pols.kCarryOut[p] = 0n;
                p += 1;
                pols.kGateType[p] = GATE_ADD;
                pols.kA[p] = a;
                pols.kB[p] = b;
                pols.kC[p] = c;
                pols.kOut[p] = a ^ b ^ c;
                pols.kCarryOut[p] = carry(a, b, c);
                p += 1;
            }
        }
    }

    while (p < N) {
        pols.kGateType[p] = GATE_XOR;
        pols.kA[p] = 0n;
        pols.kB[p] = 0n;
        pols.kC[p] = 0n;
        pols.kOut[p] = 0n;
        pols.kCarryOut[p] = 0n;

        p += 1;
    }
};

module.exports.execute = async function (pols, input) {
    const N = pols.input[0].length;

    const { program } = JSON.parse(await fs.promises.readFile(path.join(__dirname, 'sha256_script.json'), 'utf8'));

    const nSlots = Math.floor((N - 1) / SlotSize);

    pols.input[0][0] = 0n;
    pols.input[1][0] = (1n << chunkBits) - 1n;
    pols.input[2][0] = 0n;
    pols.output[0] = (1n << chunkBits) - 1n;

    function getVal(block, g) {
        if (g.type === 'wired') {
            const gateNum = (g.gate > 0) ? g.gate + (SlotSize * block) : g.gate;
            if (g.pin === 'in1') {
                return pols.input[0][gateNum];
            }
            if (g.pin === 'in2') {
                return pols.input[1][gateNum];
            }
            if (g.pin === 'in3') {
                return pols.input[2][gateNum];
            }
            if (g.pin === 'out') {
                return pols.output[gateNum];
            }
            throw new Error(`Invalid pin: ${g.pin}`);
        }
        if (g.type === 'input') {
            return input[block][1][g.bit];
        }
        if (g.type === 'inputState') {
            return input[block][0][g.bit];
        }
        throw new Error(`Invalid reference type: ${g.type}`);
    }

    for (let i = 0; i < nSlots; i++) {
        const offset = i * SlotSize;
        for (let j = 0; j < program.length; j++) {
            if (program[j].in1) pols.input[0][program[j].ref + offset] = getVal(i, program[j].in1);
            if (program[j].in2) pols.input[1][program[j].ref + offset] = getVal(i, program[j].in2);
            if (program[j].in3) pols.input[2][program[j].ref + offset] = getVal(i, program[j].in3);
            const a = pols.input[0][program[j].ref + offset];
            const b = pols.input[1][program[j].ref + offset];
            const c = pols.input[2][program[j].ref + offset];
            if (program[j].op === 'xor') {
                pols.output[program[j].ref + offset] = a ^ b ^ c;
            } else if (program[j].op === 'ch') {
                pols.output[program[j].ref + offset] = ch(a, b, c);
            } else if (program[j].op === 'maj') {
                pols.output[program[j].ref + offset] = maj(a, b, c);
            } else if (program[j].op === 'add') {
                pols.output[program[j].ref + offset] = a ^ b ^ c;
                pols.input[2][program[j].ref + offset + 1] = carry(a, b, c);
            } else {
                throw new Error(`Gate not defined: ${program[j].op}`);
            }
        }
    }
    for (let p = nSlots * SlotSize + 1; p < N; p++) {
        pols.input[0][p] = 0n;
        pols.input[1][p] = 0n;
        pols.input[2][p] = 0n;
        pols.output[p] = 0n;
    }
};
