const { log2 } = require('@0xpolygonhermez/zkevm-commonjs').utils;

const { F1Field } = require('ffjavascript');
const { getKs, getRoots } = require('pilcom');

const { sha256F } = require('./sha256');

const SlotSize = 31488;
const bitsPerElement = 7;

const HIn = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

module.exports.buildConstants = async function (pols) {
    function bits2fieldbit(block, typ, bit) {
        let o = 1;
        o += Math.floor(block / bitsPerElement) * SlotSize;
        if (typ === 'sIn') {
            o += 0;
        } else if (typ === 'sOut') {
            o += 256 * bitsPerElement;
        } else if (typ === 'in') {
            o += 512 * bitsPerElement;
        } else {
            throw new Error('Invalid type');
        }

        o += bit * bitsPerElement;
        o += block % bitsPerElement;

        return o;
    }

    const F = new F1Field('0xFFFFFFFF00000001');

    const N = pols.r8Id.length;

    const nBlocks = bitsPerElement * Math.floor((N - 1) / SlotSize);

    const pow = log2(N);
    if (1 << pow !== N) throw new Error('N is not a power of 2');

    const ks = getKs(F, 2);
    const roots = getRoots(F);
    const wi = roots[pow];
    let w = F.one;
    for (let i = 0; i < N; i++) {
        pols.ConnS1[i] = w;
        pols.ConnS2[i] = F.mul(w, ks[0]);
        pols.ConnBits2FieldBit[i] = F.mul(w, ks[1]);
        w = F.mul(w, wi);
    }

    function connect(p1, i1, p2, i2) {
        [p1[i1], p2[i2]] = [p2[i2], p1[i1]];
    }

    let p = 0;
    for (let i = 0; i < nBlocks; i++) {
        let lasti = i - 1;
        if (lasti === -1) lasti = nBlocks - 1;
        for (let j = 0; j < 256; j++) {
            pols.r8Id[p] = F.e(-1);
            pols.sOutId[p] = F.e(-1);
            pols.latchR8[p] = F.zero;
            pols.Fr8[p] = F.zero;
            pols.latchSOut[p] = F.zero;
            pols.FSOut0[p] = F.zero;
            pols.FSOut1[p] = F.zero;
            pols.FSOut2[p] = F.zero;
            pols.FSOut3[p] = F.zero;
            pols.FSOut4[p] = F.zero;
            pols.FSOut5[p] = F.zero;
            pols.FSOut6[p] = F.zero;
            pols.FSOut7[p] = F.zero;
            pols.DoConnect[p] = F.one;

            const word = Math.floor(j / 32);
            const sh = 31 - (j % 32);
            pols.HIn[p] = ((HIn[word] >>> sh) & 1) === 1 ? F.one : F.zero;

            connect(pols.ConnS1, p, pols.ConnBits2FieldBit, bits2fieldbit(lasti, 'sOut', j));
            connect(pols.ConnS2, p, pols.ConnBits2FieldBit, bits2fieldbit(i, 'sIn', j));

            p += 1;
        }

        for (let k = 0; k < 512; k++) {
            pols.sOutId[p] = (k === 511) ? F.e(i) : F.e(-1);
            pols.r8Id[p] = k % 8 === 7 ? F.e(i * 64 + (k - 7) / 8) : F.e(-1);
            pols.latchR8[p] = k % 8 === 7 ? F.one : F.zero;
            pols.Fr8[p] = F.e(1 << (7 - (k % 8)));
            pols.latchSOut[p] = (k === 511) ? F.one : F.zero;
            pols.FSOut0[p] = F.zero;
            pols.FSOut1[p] = F.zero;
            pols.FSOut2[p] = F.zero;
            pols.FSOut3[p] = F.zero;
            pols.FSOut4[p] = F.zero;
            pols.FSOut5[p] = F.zero;
            pols.FSOut6[p] = F.zero;
            pols.FSOut7[p] = F.zero;
            if (k < 32) {
                pols.FSOut0[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 64) {
                pols.FSOut1[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 96) {
                pols.FSOut2[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 128) {
                pols.FSOut3[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 160) {
                pols.FSOut4[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 192) {
                pols.FSOut5[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 224) {
                pols.FSOut6[p] = F.exp(F.two, 31 - (k % 32));
            } else if (k < 256) {
                pols.FSOut7[p] = F.exp(F.two, 31 - (k % 32));
            }
            pols.DoConnect[p] = F.zero;
            pols.HIn[p] = F.zero;

            connect(pols.ConnS1, p, pols.ConnBits2FieldBit, bits2fieldbit(i, 'in', k));

            if (k < 256) {
                connect(pols.ConnS2, p, pols.ConnBits2FieldBit, bits2fieldbit(i, 'sOut', k));
            }
            p += 1;
        }
    }

    while (p < N) {
        pols.sOutId[p] = F.e(-1);
        pols.r8Id[p] = F.e(-1);
        pols.latchR8[p] = F.zero;
        pols.Fr8[p] = F.zero;
        pols.latchSOut[p] = F.zero;
        pols.FSOut0[p] = F.zero;
        pols.FSOut1[p] = F.zero;
        pols.FSOut2[p] = F.zero;
        pols.FSOut3[p] = F.zero;
        pols.FSOut4[p] = F.zero;
        pols.FSOut5[p] = F.zero;
        pols.FSOut6[p] = F.zero;
        pols.FSOut7[p] = F.zero;
        pols.DoConnect[p] = F.zero;
        pols.HIn[p] = F.zero;
        p += 1;
    }
};

function bitFromState(st, i) {
    const w = Math.floor(i / 32);
    const sh = 31 - (i % 32);

    return BigInt((st[w] >>> sh) & 1);
}

module.exports.execute = async function (pols, input) {
    const required = {
        Bits2FieldSha256: [],
    };

    const N = pols.r8.length;

    const nBlocks = bitsPerElement * Math.floor((N - 1) / SlotSize);

    let p = 0;

    pols.sOut = [];
    for (let k = 0; k < 8; k++) {
        pols.sOut[k] = pols[`sOut${k}`];
    }

    let curState;

    const zeroIn = [
        0x80, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ];

    curState = zeroIn;
    const zeroOut = sha256F(zeroIn, HIn);

    for (let i = 0; i < nBlocks; i++) {
        let { connected } = input[i];
        let stIn;
        let stOut;
        let inR;
        if ((i >= input.length) || (input[i].connected === false)) {
            connected = false;
            stIn = HIn;
        } else {
            stIn = curState;
        }
        if (i >= input.length) {
            inR = zeroIn;
            stOut = zeroOut;
        } else {
            inR = input[i].r;
            stOut = sha256F(inR, stIn);
        }

        for (let j = 0; j < 256; j++) {
            pols.connected[p] = connected ? 1n : 0n;
            pols.r8[p] = 0n;
            pols.s1[p] = bitFromState(curState, j);
            pols.s2[p] = connected ? pols.s1[p] : bitFromState(HIn, j);
            for (let r = 0; r < 8; r++) pols.sOut[r][p] = 0n;
            p += 1;
        }

        for (let j = 0; j < 512; j++) {
            const byteIdx = Math.floor(j / 8);
            const bitIdx = 7 - (j % 8);
            const byte = (i < input.length) ? input[i].r[byteIdx] : 0;
            const bit = BigInt((byte >> bitIdx) & 1);

            pols.connected[p] = connected ? 1n : 0n;
            pols.s1[p] = bit;
            if (j<256) {
                pols.s2[p] = bitFromState(stOut, j);
            } else {
                pols.s2[p] = 0n;
            }

            const k = 7 - (j % 8);
            const inc = BigInt(pols.s1[p] << BigInt(k));
            pols.r8[p] = (k === 7) ? inc : pols.r8[p - 1] + inc;

            for (let r = 0; r < 8; r++) {
                if (j === 0) {
                    pols.sOut[r][p] = 0n;
                } else {
                    pols.sOut[r][p] = pols.sOut[r][p - 1];
                }
            }

            const inc2 = pols.s2[p] << BigInt(31 - (j % 32));

            if (j < 32) {
                pols.sOut0[p] += inc2;
            } else if (j < 64) {
                pols.sOut1[p] += inc2;
            } else if (j < 96) {
                pols.sOut2[p] += inc2;
            } else if (j < 128) {
                pols.sOut3[p] += inc2;
            } else if (j < 160) {
                pols.sOut4[p] += inc2;
            } else if (j < 192) {
                pols.sOut5[p] += inc2;
            } else if (j < 224) {
                pols.sOut6[p] += inc2;
            } else if (j < 256) {
                pols.sOut7[p] += inc2;
            }

            p += 1;
        }

        required.Bits2FieldSha256.push([inR, stIn, stOut]);

        curState = stOut;
    }

    let pp = 0;
    // Connect the last state with the first
    for (let j = 0; j < 256; j++) {
        pols.s1[pp] = bitFromState(curState, j);
        pp += 1;
    }

    while (p < N) {
        pols.r8[p] = 0n;
        pols.s1[p] = 0n;
        pols.s2[p] = 0n;
        for (let r = 0; r < 8; r++) pols.sOut[r][p] = 0n;
        pols.connected[p] = 0n;

        p += 1;
    }

    return required;
};
