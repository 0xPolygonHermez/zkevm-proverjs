// function to map a value to array, if value == fromValue return first position of array mappings, if not return elseValue
const {assert} = require('chai');
const {LEFT_ALIGN_MASK, LITTLE_ENDIAN_MASK, MODE_TO_LEN, MODE_TO_OFFSET, MODE_TO_FORMAT, OFFSET_MAX, LEN_MAX,LEN_FACTOR,
       RIGHT_BE, LEFT_BE, RIGHT_LE, LEFT_LE} = require('./sm_mem_align_constants.js');

mapRange = (value, fromValue, mappings, elseValue = 0) =>
          (value >= fromValue && value <= (fromValue + mappings.length - 1)) ? mappings[value - fromValue] : elseValue;

const CONST_F = {
    C2P16_0_63: (i) => (BigInt(i)/(2n**16n))%64n,
    C274560_0_3: (i) => (BigInt(i)/274560n)%4n,
    ID: (i) => (BigInt(i)/32n)+1n,
    FACTOR: (index, i) => mapRange((i+1) % 32, 28 - 4 * index, [0x1000000, 0x10000, 0x100, 1], 0)
}

function generateBaseOffsetLen(offset, len) {
    let bytes = [];
    let selM0 = [];
    let selM1 = [];
    let selV = [];
    for (let clock = 0; clock < 32; ++clock) {
        const value = (64 - offset + clock);
        const byte = value % 32;
        const isM0 = value >= 64 ? 1:0;
        bytes.push(byte);
        selM0.push(byte < len ? isM0 : 0);
        selM1.push(byte < len ? 1 - isM0 : 0);
        selV.push(byte < len ? 1 : 0);
    }
    return {bytes, selM0, selM1, selV, offset, len};
}

function generate(pols, irow, offset = 0, len = 0) {
    let _len = len == 0 ? 32:len;
    _len = offset + _len > 64 ? _len = 64 - offset : _len;
    let res = generateBaseOffsetLen(offset, _len);
    let _tmp = [];
    for (let clock = 0; clock < 32; ++clock) {
        const mode = BigInt(4 * offset  + (LEN_FACTOR*4) * len + 2 * res.selM1[clock] + res.selM0[clock]);
        pols.MODE_SELM1_SELM0[irow] = mode;
        pols.MODE_SELM1_SELM0[irow + 32] = mode + BigInt(LEFT_ALIGN_MASK) * 4n
        pols.MODE_SELM1_SELM0[irow + 64] = mode + BigInt(LITTLE_ENDIAN_MASK) * 4n;
        pols.MODE_SELM1_SELM0[irow + 96] = mode + BigInt(LEFT_ALIGN_MASK + LITTLE_ENDIAN_MASK) * 4n;

        pols.T_BYTE_POS[irow] = BigInt((res.bytes[clock] + (32 - _len)) % 32);
        pols.T_BYTE_POS[irow + 32] = BigInt(res.bytes[clock]);
        pols.T_BYTE_POS[irow + 64] = BigInt(31 - res.bytes[clock]);
        pols.T_BYTE_POS[irow + 96] = BigInt((31 + _len - res.bytes[clock]) % 32);
        // if (mode === 1024n || mode === 1025n) {
        //     console.log(`## ${clock} ${pols.MODE_SELM1_SELM0[irow]} ${pols.T_BYTE_POS[irow]} len:${len} ${res.bytes[clock]} offset:${offset}`);
        // }
        for (const index of [0,32,64,96]) {
            const _bytePos = Number(pols.T_BYTE_POS[irow + index]);
            if (_bytePos > 31 || _bytePos < 0) {
                console.log(offset, _len);
                throw new Error(`Invalid T_BYTE_POS[${irow} + ${index}] = ${_bytePos}`);
            }
            if (typeof _tmp[_bytePos + index] !== 'undefined') {
                console.log(_tmp, offset, _len, index);
                throw new Error(`Invalid T_BYTE_POS[${irow} + ${index}] = ${_bytePos} duplicated value on clock ${_tmp[_bytePos + index]}`);
            }
            _tmp[_bytePos + index] = clock;
        }
        ++irow;
    }
    
}

function build_MODE_SELM1_SELM0_T_BYTE_POS(pols, N) {
    let index = 0;
    for (let len = 0; len <= LEN_MAX; ++len) {
        for (let offset = 0; offset <= OFFSET_MAX; ++offset) {
            generate(pols, index, offset, len);
            index += 128;
        }
    }
    const count = index;
    while (index < N) {
        pols.MODE_SELM1_SELM0[index] = pols.MODE_SELM1_SELM0[index - count];
        pols.T_BYTE_POS[index] = pols.T_BYTE_POS[index - count];
        ++index;
    }
}

module.exports.buildConstants = async function (pols) {
    const N = pols.ID.length;
    Object.entries(CONST_F).forEach(([name, func]) => {
        if (typeof pols[name] === 'undefined') return;

        if (func.length == 1) {
            for (let i = 0; i < N; ++i) {
                pols[name][i] = BigInt(func(i));
            }
        }
        else {
            const indexCount = name.startsWith('SEL') ? 2 : 8;
            for (let index = 0; index < indexCount; ++index) {
                for (let i = 0; i < N; ++i) {
                    pols[name][index][i] = BigInt(func(index,i));
                }
            }
        }
    });
    build_MODE_SELM1_SELM0_T_BYTE_POS(pols, N);
}

module.exports.execute = async function (pols, input) {
    // Get N from definitions
    const N = pols.wr.length;

    // Initialization
    const factors = [ 2n**24n, 2n**16n, 2n**8n, 1n];
    for (let i = 0; i < input.length; i++) {
        let m0v = BigInt(input[i].m0);
        let m1v = BigInt(input[i].m1);
        const v = BigInt(input[i].v);
        const mode = Number(input[i].mode);
        const _mode = BigInt(mode);
        const _len = MODE_TO_LEN(mode);
        let len = _len === 0 ? 32:_len;
        const offset = MODE_TO_OFFSET(mode);
        const format = MODE_TO_FORMAT(mode);
        const _wr = BigInt(input[i].wr);
        const wr = _wr === 1n;
        const polIndex = i * 32;
        if ((len + offset) >= 64) {
            len = 64 - offset;
        } 
        assert(len >= 0 && len <= 32, `len:${len} offset:${offset} _len:${_len}`);

        // setting index when result was ready
        const polResultIndex = (i * 32 + 31)%N;
        pols.result[polResultIndex] = 1n;

        for (let j = 0; j < 32; ++j) {
            const pos = (64 - offset + j);
            let bytePos = pos % 32;
            const selV = (bytePos < len) || wr;
            const isM0 = pos >= 64;
            const selM0 = (bytePos < len && isM0) ? 1n : 0n;
            const selM1 = (bytePos < len && !isM0) ? 1n : 0n;

            // if format is LEFT_BE bytePos no change.
            switch (format) {
                case RIGHT_BE:  bytePos = (bytePos + 32 - len) % 32; break;
                case RIGHT_LE:  bytePos = 31 - bytePos; break;
                case LEFT_LE:   bytePos = (31 + len - bytePos) % 32; break;                
            }
            assert(bytePos >= 0 && bytePos < 32, `format: ${format} bytePos:${bytePos} len:${len} offset:${offset} _len:${_len}`);
    
            const inM0 = getByte(m0v, 31-j);
            const inM1 = getByte(m1v, 31-j);
            const inV_M = selV ? getByte(v, 31-bytePos) : 0n;
            const inV_V = getByte(v, 31-j);

            const prevIndex = polIndex + j - 1;
            const curIndex = polIndex + j;
        
            pols.result[curIndex] = j == 31 ? 1n : 0n;
            pols.wr[curIndex] = _wr;
            pols.mode[curIndex] = _mode;
            pols.inM[0][curIndex] = inM0;
            pols.inM[1][curIndex] = inM1;
            pols.bytePos[curIndex] = BigInt(bytePos);

            // divide inV in two part to do range check without extra lookup.
            pols.inV[0][curIndex] = inV_M & 0x3Fn;
            pols.inV[1][curIndex] = inV_M >> 6n;

            pols.inV_V[curIndex] = inV_V;

            pols.selM0[curIndex] = selM0;
            pols.selM1[curIndex] = selM1;
            pols.selV[curIndex] = selV ? 1n:0n;

            const mIndex = 7 - (j >> 2);            
            const factor = factors[j % 4];

            if (j === 0) {
                for (let index = 0; index < 8; ++index) {
                    pols.m0[index][curIndex] = 0n;
                    pols.m1[index][curIndex] = 0n;
                    pols.w0[index][curIndex] = 0n;
                    pols.w1[index][curIndex] = 0n;
                    pols.v[index][curIndex] = 0n;
                }
            } else {
                for (let index = 0; index < 8; ++index) {
                    pols.m0[index][curIndex] = pols.m0[index][prevIndex];
                    pols.m1[index][curIndex] = pols.m1[index][prevIndex];
                    pols.w0[index][curIndex] = pols.w0[index][prevIndex];
                    pols.w1[index][curIndex] = pols.w1[index][prevIndex];
                    pols.v[index][curIndex]  = pols.v[index][prevIndex];
                }
            }

            pols.m0[mIndex][curIndex] = pols.m0[mIndex][curIndex] + inM0 * factor;
            pols.m1[mIndex][curIndex] = pols.m1[mIndex][curIndex] + inM1 * factor;
            pols.v[mIndex][curIndex]  = pols.v[mIndex][curIndex] + inV_V * factor;

            const inW0 = selM0 ? inV_M : inM0;
            const inW1 = selM1 ? inV_M : inM1;

            pols.w0[mIndex][curIndex] = pols.w0[mIndex][curIndex] + inW0 * factor;
            pols.w1[mIndex][curIndex] = pols.w1[mIndex][curIndex] + inW1 * factor;
        }
    }
    let i = input.length * 32;
    while (i < N) {
        for (let clock = 0; clock < 32; ++clock) {
            for (let j = 0; j < 8; j++) {
                pols.m0[j][i] = 0n;
                pols.m1[j][i] = 0n;
                pols.w0[j][i] = 0n;
                pols.w1[j][i] = 0n;
                pols.v[j][i] = 0n;
            }
            pols.inV[0][i] = 0n;
            pols.inV[1][i] = 0n;
            pols.inV_V[i] = 0n;
            pols.inM[0][i] = 0n;
            pols.inM[1][i] = 0n;
            pols.result[i] = 0n;
            pols.wr[i] = 0n;
            pols.mode[i] = 0n;
            pols.selM0[i] = 1n;
            pols.selM1[i] = 0n;
            pols.selV[i] = 1n;
            pols.result[i] = 0n;
            pols.bytePos[i] = BigInt(clock);
            ++i;
        }
    }
}

function getByte (value, index) {
    return (value >> (8n * BigInt(index))) & 0xFFn;
}