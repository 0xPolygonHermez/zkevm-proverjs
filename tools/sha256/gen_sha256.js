// NOTE: This is BIG ENDIAN

const fs = require('fs');
const path = require('path');

const BitsPerSlot = 1;
const ChunksPerSlot = 1; // Original value: 1 // TODO: With 9 it does not fit in the circuit, find a solution!!!
const Sha256fPerSlot = BitsPerSlot * ChunksPerSlot;
const BitsInParallel = 1; // Original value: 1

const StateInputSizeBits = 256;
const HashInputSizeBits = 512;
const InputSizeBits = StateInputSizeBits + HashInputSizeBits;
const StateOutputSizeBits = 256;
const TotalSizeBits = InputSizeBits + StateOutputSizeBits;

const StateInFirstRef = Sha256fPerSlot + 1; // Original value: Sha256fPerSlot
const StateInRefDistance = Sha256fPerSlot;
const StateOutFirstRef = StateInFirstRef + InputSizeBits * StateInRefDistance / BitsInParallel;
const StateOutRefDistance = Sha256fPerSlot;

function generateK(ctx) {
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    const res = [];
    for (let i = 0; i < K.length; i++) {
        const v32 = [];
        for (let j = 0; j < 32; j++) {
            if ((K[i] >>> (31 - j)) & 1) {
                v32.push(ctx.one);
            } else {
                v32.push(ctx.zero);
            }
        }
        res.push(v32);
    }

    return res;
}

function newWire(ctx) {
    ctx.wiresUsed += 1;

    return ctx.wiresUsed - 1;
}

function isNextAvailable(ctx) {
    // In first 1024 cycles of BitsPerField, last position inside cycle
    // is reserved for bit inputs.
    // X X X X X X Y | X X X X X X Y | ... (This is repeated 1024 times, the Y'th positions are reserved for inputs)
    // The first 256 Y's are reserved for state inputs, the next 256 Y's are reserved for state outputs
    // and the last 512 Y's are reserved for hash inputs.
    // This ranges from [7, 7·2, ..., 7·1023, 7·1024] = [7, 14, ..., 7161, 7168]
    let next_gate = ctx.gatesUsed;
    if ((next_gate >= StateInFirstRef) && 
        (next_gate <= StateInFirstRef + (InputSizeBits - BitsInParallel) * StateInRefDistance / BitsInParallel + (BitsInParallel - 1)) &&
        ((next_gate - StateInFirstRef) % StateInRefDistance < BitsInParallel)) {
        return false;
    } else if
       ((next_gate >= StateOutFirstRef) && 
        (next_gate <= StateOutFirstRef + (StateOutputSizeBits - BitsInParallel) * StateOutRefDistance / BitsInParallel + (BitsInParallel - 1)) &&
        ((next_gate - StateOutFirstRef) % StateOutRefDistance < BitsInParallel)) {
        return false;
    } else {
        return true;
    }
}

function getNextAvailableGate(ctx) {
    while (!isNextAvailable(ctx)) {
        ctx.gates[ctx.gatesUsed] = {
            type: null,
            connections: [null, null, null, null],
        };
        ctx.gatesUsed += 1;
    }
    const res = ctx.gatesUsed;
    ctx.gates[ctx.gatesUsed] = {
        type: null,
        connections: [null, null, null, null],
    };
    ctx.gatesUsed += 1;

    return res;
}

function add32(ctx, a, b) {
    const out = [];
    let lprev;
    {
        const l = getNextAvailableGate(ctx);
        ctx.program.push({
            in1: a[31],
            in2: b[31],
            in3: ctx.zero,
            op: 'add',
            ref: l,
        });
        ctx.gates[l].type = 'add';
        ctx.gates[l].connections[0] = a[31].wire;
        ctx.gates[l].connections[1] = b[31].wire;
        ctx.gates[l].connections[2] = ctx.zero.wire;
        ctx.gates[l].connections[3] = newWire(ctx);
        out[31] = {
            type: 'wired',
            gate: l,
            pin: 'out',
            wire: ctx.gates[l].connections[3],
        };
        lprev = l;
    }
    for (let i = 30; i >= 0; i--) {
        const l = getNextAvailableGate(ctx);
        if (l === lprev + 1) {
            // If the next gate is not an "input" gate, we feed the carry wire
            // from the "outside"
            ctx.program.push({
                in1: a[i],
                in2: b[i],
                op: (i === 0) ? 'xor' : 'add',
                ref: l,
            });
            ctx.gates[l].type = (i === 0) ? 'xor' : 'add';
            ctx.gates[l].connections[0] = a[i].wire;
            ctx.gates[l].connections[1] = b[i].wire;
            ctx.gates[l].connections[2] = newWire(ctx);
            ctx.gates[l].connections[3] = newWire(ctx);
            out[i] = {
                type: 'wired',
                gate: l,
                pin: 'out',
                wire: ctx.gates[l].connections[3],
            };
        } else {
            // lprev + 1 is ether a state input, a state output or a hash input
            // If it is a state input, we feed the carry wire using the free wire
            // in the "input" gate
            const carryWire = newWire(ctx);
            ctx.gates[lprev + 1].connections[2] = carryWire;
            ctx.program.push({
                in1: a[i],
                in2: b[i],
                in3: {
                    type: 'wired',
                    gate: lprev + 1,
                    pin: 'in3',
                    wire: carryWire,
                },
                op: (i === 0) ? 'xor' : 'add',
                ref: l,
            });
            ctx.gates[l].type = (i === 0) ? 'xor' : 'add';
            ctx.gates[l].connections[0] = a[i].wire;
            ctx.gates[l].connections[1] = b[i].wire;
            ctx.gates[l].connections[2] = carryWire;
            ctx.gates[l].connections[3] = newWire(ctx);
            out[i] = {
                type: 'wired',
                gate: l,
                pin: 'out',
                wire: ctx.gates[l].connections[3],
            };
        }
        lprev = l;
    }

    return out;
}

function gate1(ctx, gate, a, b, c) {
    const l = getNextAvailableGate(ctx);
    ctx.program.push({
        in1: a,
        in2: b,
        in3: c,
        op: gate,
        ref: l,
    });
    ctx.gates[l].type = gate;
    ctx.gates[l].connections[0] = a.wire;
    ctx.gates[l].connections[1] = b.wire;
    ctx.gates[l].connections[2] = c.wire;
    ctx.gates[l].connections[3] = newWire(ctx);
    const out = {
        type: 'wired',
        gate: l,
        pin: 'out',
        wire: ctx.gates[l].connections[3],
    };

    return out;
}

function gate32(ctx, gate, op1, op2, op3) {
    const res = [];
    for (let i = 0; i < 32; i++) {
        res.push(gate1(ctx, gate, op1[i], op2[i], op3[i]));
    }

    return res;
}

function xor32(ctx, op1, op2, op3) {
    return gate32(ctx, 'xor', op1, op2, op3);
}

function ch(ctx, op1, op2, op3) {
    return gate32(ctx, 'ch', op1, op2, op3);
}

function maj(ctx, op1, op2, op3) {
    return gate32(ctx, 'maj', op1, op2, op3);
}

function rotr(ctx, a, n) {
    const out = [];
    for (let i = 0; i < 32; i++) {
        out[(i + n) % 32] = a[i];
    }

    return out;
}

function shr(ctx, a, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
        out[i] = ctx.zero;
    }
    for (let i = n; i < 32; i++) {
        out[i] = a[i - n];
    }

    return out;
}

function sigmaLow0(ctx, s32) {
    const op1 = rotr(ctx, s32, 7);
    const op2 = rotr(ctx, s32, 18);
    const op3 = shr(ctx, s32, 3);

    return xor32(ctx, op1, op2, op3);
}

function sigmaLow1(ctx, s32) {
    const op1 = rotr(ctx, s32, 17);
    const op2 = rotr(ctx, s32, 19);
    const op3 = shr(ctx, s32, 10);

    return xor32(ctx, op1, op2, op3);
}

function sigmaBig0(ctx, s32) {
    const op1 = rotr(ctx, s32, 2);
    const op2 = rotr(ctx, s32, 13);
    const op3 = rotr(ctx, s32, 22);

    return xor32(ctx, op1, op2, op3);
}

function sigmaBig1(ctx, s32) {
    const op1 = rotr(ctx, s32, 6);
    const op2 = rotr(ctx, s32, 11);
    const op3 = rotr(ctx, s32, 25);

    return xor32(ctx, op1, op2, op3);
}

function generateCircuit() {
    const ctx = {};

    ctx.zero = {
        type: 'wired',
        gate: 0,
        pin: 'in1',
        wire: 0,
    };

    ctx.one = {
        type: 'wired',
        gate: 0,
        pin: 'in2',
        wire: 1,
    };
    ctx.gatesUsed = 1;
    ctx.wiresUsed = 2;
    ctx.program = [];
    ctx.gates = [
        {
            type: 'xor',
            connections: [ctx.zero.wire, ctx.one.wire, ctx.zero.wire, ctx.one.wire], // XOR(0,1,0) = 1
        },
    ];

    const stIn = [];
    for (let i = 0; i < 8; i++) {
        stIn[i] = [];
        for (let j = 0; j < 32; j++) {
            stIn[i].push({
                type: 'inputState',
                bit: i * 32 + j,
                wire: newWire(ctx),
            });
        }
    }

    let [a, b, c, d, e, f, g, h] = stIn;

    const w = [];
    for (let i = 0; i < 16; i++) {
        w[i] = [];
        for (let j = 0; j < 32; j++) {
            w[i].push({
                type: 'input',
                bit: i * 32 + j,
                wire: newWire(ctx),
            });
        }
    }

    const K = generateK(ctx);

    for (let t = 16; t < 64; t++) {
        w[t] = sigmaLow1(ctx, w[t - 2]);
        w[t] = add32(ctx, w[t], w[t - 7]);
        w[t] = add32(ctx, w[t], sigmaLow0(ctx, w[t - 15]));
        w[t] = add32(ctx, w[t], w[t - 16]);
    }

    for (let t = 0; t < 64; t++) {
        let t1 = h;
        t1 = add32(ctx, t1, sigmaBig1(ctx, e));
        t1 = add32(ctx, t1, ch(ctx, e, f, g));
        t1 = add32(ctx, t1, K[t]);
        t1 = add32(ctx, t1, w[t]);

        let t2 = sigmaBig0(ctx, a);
        t2 = add32(ctx, t2, maj(ctx, a, b, c));

        h = g;
        g = f;
        f = e;
        e = add32(ctx, d, t1);
        d = c;
        c = b;
        b = a;
        a = add32(ctx, t1, t2);
    }

    const stOut = [];
    stOut[0] = add32(ctx, stIn[0], a);
    stOut[1] = add32(ctx, stIn[1], b);
    stOut[2] = add32(ctx, stIn[2], c);
    stOut[3] = add32(ctx, stIn[3], d);
    stOut[4] = add32(ctx, stIn[4], e);
    stOut[5] = add32(ctx, stIn[5], f);
    stOut[6] = add32(ctx, stIn[6], g);
    stOut[7] = add32(ctx, stIn[7], h);

    // Locate the state input (256), the state output (256) and the hash input (512)
    for (let i = 0; i < TotalSizeBits / BitsInParallel; i++) {
        for (let j = 0; j < BitsInParallel; j++) {
            const idx = i * BitsInParallel + j;
            const word = Math.floor(idx / 32);
            const bit = idx % 32;
            let s;
            // In the original code, the state ouput was before the hash input
            // if (idx < StateInputSizeBits) {
            //     s = stIn[word][bit];
            // } else if (idx < StateInputSizeBits + StateOutputSizeBits) {
            //     s = stOut[word - 8][bit];
            // } else {
            //     s = w[word - 16][bit];
            // }
            if (idx < StateInputSizeBits) {
                s = stIn[word][bit];
            } else if (idx < StateInputSizeBits + HashInputSizeBits) {
                s = w[word - 8][bit];
            } else {
                s = stOut[word - 24][bit];
            }
            const p = StateInFirstRef + i * StateInRefDistance + j;
            ctx.gates[p].connections[0] = s.wire;
            ctx.gates[p].connections[1] = ctx.zero.wire;
            ctx.gates[p].connections[3] = newWire(ctx);
            ctx.gates[p].type = 'xor';
            const inst = {
                in1: s,
                in2: ctx.zero,
                op: 'xor',
                ref: p,
            };
            if (ctx.gates[p].connections[2] === null) {
                inst.in3 = ctx.zero;
                ctx.gates[p].connections[2] = ctx.zero.wire;
            }
            ctx.program.push(inst);
        }
    }

    return [ctx.gates, ctx.program];
}

const circuitFile = path.join(__dirname, '..', '..', 'src', 'sm', 'sm_sha256f', 'sha256_gates.json');
const programFile = path.join(__dirname, '..', '..', 'src', 'sm', 'sm_sha256f', 'sha256_script.json');

const [gates, program] = generateCircuit();

const sums = gates.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;

    return acc;
}, {});

fs.writeFileSync(circuitFile, JSON.stringify(gates, null, 1), 'utf8');
fs.writeFileSync(programFile, JSON.stringify({ program, sums, total: gates.length - 1 }, null, 1), 'utf8');

console.log(`${circuitFile.split('/').pop()} and ${programFile.split('/').pop()} generated`);
