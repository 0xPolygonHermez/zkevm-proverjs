// function to map a value to array, if value == fromValue return first position of array mappings, if not return elseValue

mapRange = (value, fromValue, mappings, elseValue = 0) =>
          (value >= fromValue && value <= (fromValue + mappings.length - 1)) ? mappings[value - fromValue] : elseValue;

const CONST_F = {
    C2P16_0_63: (i) => (BigInt(i)/(2n**16n))%64n,
    C274560_0_3: (i) => (BigInt(i)/274560n)%4n,
    ID: (i) => (BigInt(i)/32n)+1n,
    FACTOR: (index, i) => mapRange((i+1) % 32, 28 - 4 * index, [0x1000000, 0x10000, 0x100, 1], 0),
}

function generateBaseOffsetLen(offset, len) {
    let bytes = [];
    let selM0 = [];
    let selM1 = [];
    for (let clock = 0; clock < 32; ++clock) {
        const value = (64 - offset + clock);
        const byte = value % 32;
        const isM0 = value >= 64 ? 1:0;
        bytes.push(byte < len ? byte: -1);
        selM0.push(byte < len ? isM0 : 0);
        selM1.push(byte < len ? 1 - isM0 : 0);
    }
    return {bytes, selM0, selM1, offset, len};
}

function generate(pols, irow, offset = 0, len = 0) {
    let _len = len == 0 ? 32:len;
    _len = offset + _len > 64 ? _len = 64 - offset : _len;
    let res = generateBaseOffsetLen(offset, _len);
    for (let clock = 0; clock < 32; ++clock) {
        if (res.bytes[clock] < 0) {
            const mode = 4 * offset  + (128*4) * len + 2 * res.selM1[clock] + res.selM0[clock];
            pols.MODE_SELM1_SELM0[irow] = mode;
            pols.MODE_SELM1_SELM0[irow + 32] = mode + (4*4096);
            pols.MODE_SELM1_SELM0[irow + 64] = mode + (8*4096);
            pols.MODE_SELM1_SELM0[irow + 96] = mode + (4*4096) + (8*4096);
            if (res.bytes[clock] === -1) {
                pols.T_BYTE_POS[irow] = -1n;
                pols.T_BYTE_POS[irow + 32] = -1n;
                pols.T_BYTE_POS[irow + 64] = -1n;
                pols.T_BYTE_POS[irow + 96] = -1n;
            } else {
                pols.T_BYTE_POS[irow] = res.bytes[clock] + (32 - _len);
                pols.T_BYTE_POS[irow + 32] = res.bytes[clock];
                pols.T_BYTE_POS[irow + 64] = 62 - res.bytes[clock] - _len;
                pols.T_BYTE_POS[irow + 96] = 2 * _len - 33 - res.bytes[clock];
                for (const index of [0,32,64,96]) {
                    if (pols.T_BYTE_POS[irow + index] > 31 || pols.T_BYTE_POS[irow + index] < 0) {
                        console.log(offset, _len);
                        throw new Error(`Invalid T_BYTE_POS[${irow} + ${index}] = ${pols.T_BYTE_POS[irow + index]}`);
                    }
                }
            }
        }
    }
/*
    if (!left) {
        for (let clock = 0; clock < 32; ++clock) {
            if (res.bytes[clock] < 0) continue;
            res.bytes[clock] = res.bytes[clock] + (32 - _len);
        }
    }
    if (lendian) {
        for (let clock = 0; clock < 32; ++clock) {
            if (res.bytes[clock] < 0) continue;
            res.bytes[clock] = left ? _len - 1 - res.bytes[clock] :  62 - res.bytes[clock] - _len;
        }
    }
    const mode = offset + 64 * len + 128 * left + 256 * lendian;
    return {...res, left, lendian};
}
*/
}
function build_MODE_SELM1_SELM0_T_BYTE_POS(pols, N) {
    let index = 0;
    for (let len = 0; len <= 32; ++len) {
        for (let offset = 0; offset <= 64; ++offset) {
            res = generate(pols, index, offset, len);
            index += 128;
        }
    }
    const count = index;
    while (index < N) {
        pols.MODE_SELM1_SELM0[index] = pols.MODE_SELM1_SELM0[index - count];
        pols.T_BYTE_POS[index] = pols.T_BYTE_POS[index - count];
        ++index;
    }
    console.log('INDEX', index);
}

module.exports.buildConstants = function (pols) {
    const N = pols.OFFSET.length;
    Object.entries(CONST_F).forEach(([name, func]) => {
        if (typeof pols[name] === 'undefined') return;

        if (func.length == 1) {
            for (i = 0; i < N; ++i) pols[name][i] = BigInt(func(i));
        }
        else {
            const indexCount = name.startsWith('SEL') ? 2 : 8;
            for (let index = 0; index < indexCount; ++index) {
                for (i = 0; i < N; ++i) pols[name][index][i] = BigInt(func(index,i));
            }
        }
    });
    build_MODE_SELM1_SELM0_T_BYTE_POS(pols, N);
}


/*
    pol commit inM[2];
    pol commit inV[2];
    pol inV_M = inV[0] + 64 * inV[1];
    pol commit inV_V;
    pol commit wr;
    pol commit mode;

    pol commit m0[8];
    pol commit m1[8];
    pol commit w0[8];
    pol commit w1[8];
    pol commit v[8];

    // when m0 is "active", means aligned with inV an must be read/write from/to M0
    pol commit selM0;

    // when m1 is "active", means aligned with inV an must be read/write from/to M1
    pol commit selM1;

    // it's a free input verified by lookup to define byte-position inside V, of the 
    // current inV_M byte.
    pol commit bytePos;
*/
module.exports.execute = async function (pols, input) {
    // Get N from definitions
    const N = pols.offset.length;

    // Initialization
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < 8; j++) {
            pols.m0[j][i] = 0n;
            pols.m1[j][i] = 0n;
            pols.w0[j][i] = 0n;
            pols.w1[j][i] = 0n;
            pols.v[j][i] = 0n;
        }
        pols.inV[0][i]= 0n;
        pols.inV[1][i]= 0n;
        pols.inV_V[i]= 0n;
        pols.inM[0][i]= 0n;
        pols.inM[1][i]= 0n;
        pols.wr[i]= 0n;
        pols.mode[i]= 0n;
        pols.selM0[i]= 0n;
        pols.selM1[i]= 0n;
        pols.result[i] = 0n;
        pols.bytePos[i] = 0n;
    }

    const factors = [ 1, 2 ** 8, 2 ** 16, 2 ** 24];
    for (let i = 0; i < input.length; i++) {
        let m0v = BigInt(input[i]["m0"]);
        let m1v = BigInt(input[i]["m1"]);
        const _v = BigInt(input[i]["v"]);
        const mode = Number(input[i]["mode"]);
        const wr = Number(input[i]["wr"]);
        const polIndex = i * 32;

        // setting index when result was ready
        const polResultIndex = (i * 32 + 31)%N;
        pols.result[polResultIndex] = 1n;

        let vv = _v;
        for (let j = 0; j < 32; ++j) {
/*
        const value = (64 - offset + clock);
        const byte = value % 32;
        const isM0 = value >= 64 ? 1:0;
        bytes.push(byte < len ? byte: -1);
        selM0.push(byte < len ? isM0 : 0);
        selM1.push(byte < len ? 1 - isM0 : 0);
*/
            const pos = (64 - offset + clock);
            const bytePos = value % 32;
            const _selV = bytePos < len;
            const isM0 = pos >= 64 ? 1:0;
            const _byte  = _selV ?  bytePos : -1;
            const _selM0 = _selV && isM0 ? 1 : 0;
            const _selM1 = _selV && !isM0 ? 1 : 0;

            const _vByte = ((31 + (offset + wr8) - j) % 32);
            const _inM0 = getByte(m0v, 31-j);
            const _inM1 = getByte(m1v, 31-j);
            const _inV = _selV ? getByte(vv, _vByte) : 0;

            const prevIndex = polIndex + j - 1;
            const curIndex = polIndex + j;

            pols.wr[curIndex] = BigInt(wr);
            pols.mode[curIndex] = BigInt(mode);
            pols.inM[0][curIndex] = BigInt(_inM0);
            pols.inM[1][curIndex] = BigInt(_inM1);
            pols.inV[0][curIndex] = BigInt(_inV);
            pols.inV[1][curIndex] = BigInt(_inV);
            pols.inV_V[curIndex] = BigInt(_inV);
            pols.selM0[curIndex] = BigInt(_selM0);
            pols.selM1[curIndex] = BigInt(_selM1);
            pols.factorV[_vByte >> 2][curIndex] = BigInt(factors[(_vByte % 4)]);

            const mIndex = 7 - (j >> 2);

            const _inW0 = ((wr256 * (1 - _selM1)) || (wr8 * _selM1))? _inV : ((wr256 + wr8) * _inM0);
            const _inW1 = (wr256 * _selM1) ? _inV : ((wr256 + wr8) * _inM1);

            const factor = BigInt(factors[3 - (j % 4)]);

            pols.m0[mIndex][curIndex] = (( j === 0 ) ? 0n : pols.m0[mIndex][prevIndex]) + BigInt(_inM0) * factor;
            pols.m1[mIndex][curIndex] = (( j === 0 ) ? 0n : pols.m1[mIndex][prevIndex]) + BigInt(_inM1) * factor;

            pols.w0[mIndex][curIndex] = (( j === 0 ) ? 0n : pols.w0[mIndex][prevIndex]) + BigInt(_inW0) * factor;
            pols.w1[mIndex][curIndex] = (( j === 0 ) ? 0n : pols.w1[mIndex][prevIndex]) + BigInt(_inW1) * factor;
        }
        for (let j = 0; j < 32; ++j) {
            for (let index = 0; index < 8; ++index) {
                pols.v[index][polIndex + 1 + j] = (( j === 0 ) ? 0n : pols.v[index][polIndex + j]) + pols.inV[polIndex + j] * pols.factorV[index][polIndex + j];
            }
        }

        for (let index = 0; index < 8; ++index) {
            for (j = 32 - (index  * 4); j < 32; ++j) {
                pols.m0[index][polIndex + j + 1] = pols.m0[index][polIndex + j];
                pols.m1[index][polIndex + j + 1] = pols.m1[index][polIndex + j];
                pols.w0[index][polIndex + j + 1] = pols.w0[index][polIndex + j];
                pols.w1[index][polIndex + j + 1] = pols.w1[index][polIndex + j];
            }
        }
    }
    console.log(`Filling from w=${input.length * 32}.....`);
    for (let i = (input.length * 32); i < N; i++) {
        for (let index = 0; index < 8; ++index) {
            pols.factorV[index][i] = BigInt(CONST_F.FACTORV(index, i % 32));
        }
    }
}

function getByte (value, index) {
    return Number((value >> (8n * BigInt(index))) & 0xFFn);
}

function transitions(label, values) {
    let previous = values[0];
    console.log(label);
    console.log(`#0 ${values[0]}`);
    for (let index = 1; index < values.length; ++index) {
        if (values[index] !== previous) {
            console.log(`#${index} ${previous} ==> ${values[index]}`);
            previous = values[index];
        }
    }
    console.log(`#${values.length-1} ${previous}`);
    console.log('');
}

const N = 2**23;
const pols = {
        FACTOR: [new Array (N),new Array (N),new Array (N),new Array (N),new Array (N),new Array (N),new Array (N),new Array (N)],
        ID: new Array(N),
        C2P16_0_63: new Array(N),
        C274560_0_3: new Array(N),
        OFFSET: new Array(N),
        MODE_SELM1_SELM0: new Array(N),
        T_BYTE_POS: new Array(N),
    }

// console.log(pols.OFFSET.length);

module.exports.buildConstants(pols);
const _pols = {
        ID: pols.ID.slice(-10),
        C2P16_0_63: pols.C2P16_0_63.slice(-10),
        C274560_0_3: pols.C274560_0_3.slice(-10)
    }
/* console.log(pols);
console.log(_pols);*/
console.log(pols.OFFSET.length);
// transitions("C2P16_0_63", pols.C2P16_0_63);
// transitions("C274560_0_3", pols.C274560_0_3);