const F1Field = require("ffjavascript").F1Field;

const GL_CHUNKS = [0x00001, 0x3C000, 0x3FFFF, 0x003FF];

module.exports.buildConstants = async function (pols) {
    const N = pols.T_CHUNK_VALUE.length;

    let row = -1;
    const ltInSizes = [1, 2, 2, 2];
    const carryInSizes = [2, 2, 2, 2];
    const levelSizes = [1, 1, 1, 256];
    const chunkSizes = [2**18, 2**18, 2**18, 2**10];
    const factors = [2n**18n, 2n**36n, 2n**54n, 1n];
    let level = 0;
    let ltIn = 0;
    let carryIn = 0;

    console.log('N:'+N);
    let times = 0;
    while (row < N) {
        let clock = 0;
        while (clock < 4 && row < N) {
            console.log(`FIXED row:${row} clock:${clock}`);
            const upToLtIn = ltInSizes[clock] - 1;
            const upToCarryIn = carryInSizes[clock] - 1;
            const upToLevel = levelSizes[clock] - 1;
            const upToChunk = chunkSizes[clock] - 1;
            const glChunk = GL_CHUNKS[clock];

            const carryLtIn = BigInt(carryIn + 2 * ltIn);
            const clkeySel = BigInt(clock + (clock === 3 ? 4 << (level % 4) : 0));
            const _level = BigInt(level);

            // Fill all chunk values
            console.log(`FIXED row:${row} clock:${clock} level:${level} carryIn:${carryIn} ltIn:${ltIn} 0-${upToChunk-1}`);
            for (let chunk = 0; chunk < upToChunk; ++chunk) {
                const result = 2 * chunk + carryIn;
                const carryOut = (clock < 4 && result > upToChunk) ? 1: 0;
                const chunkResult = result % (upToChunk + 1);
                const ltOut = chunkResult > glChunk ? 0 : (chunkResult == glChunk ? ltIn : 1);
                if (clock ===3 && (ltOut !== 1 || carryOut == 1)) {
                    console.log(`FIXED clock:${clock} level:${level} carryIn:${carryIn} ltIn:${ltIn} 0-${chunk-1}`);
                    break;
                }
                ++row;
                if (row === N) break;
                pols.T_CLKEYSEL[row] = clkeySel;
                pols.T_CHUNK_VALUE[row] = BigInt(chunk);
                pols.T_CARRYLT_IN[row] = carryLtIn;
                pols.T_CARRYLT_OUT[row] = clock == 3 ? 0n : BigInt(carryOut + 2 * ltOut);
                pols.T_LEVEL[row] = _level;
                pols.FACTOR[row] = factors[row % 4];

                // { T_CLKEYSEL, T_LEVEL, T_CHUNK_VALUE, T_CARRYLT_IN, T_CARRYLT_OUT }
                if (times === 0) console.log('PL 1:'+[pols.T_CLKEYSEL[row], pols.T_LEVEL[row], pols.T_CHUNK_VALUE[row], pols.T_CARRYLT_IN[row], pols.T_CARRYLT_OUT[row]].join(','));
            }
            if (carryIn < upToCarryIn) {
                ++carryIn;
                continue;
            }
            carryIn = 0;
            if (ltIn < upToLtIn) {
                ++ltIn;
                continue;
            }
            ltIn = 0;
            if (level < upToLevel) {
                ++level;
                continue;
            }
            level = 0;
            ++clock;
        }
        ++times;
    }
}

module.exports.execute = async function (pols, input) {
    // Get N from definitions
    const N = pols.key0.length;

    const Fr = new F1Field(0xffffffff00000001n);

    // Initialization
    for (let i = 0; i < N; i++) {
        pols.key0[i] = 0n;
        pols.key1[i] = 0n;
        pols.key2[i] = 0n;
        pols.key3[i] = 0n;
        pols.level[i] = 0n;
        pols.keyIn[i] = 0n;
        pols.keyInChunk[i] = 0n;
        pols.bit[i] = 0n;
        pols.carryLt[i] = 0n;
        pols.keySel0[i] = 0n;
        pols.keySel1[i] = 0n;
        pols.keySel2[i] = 0n;
        pols.keySel3[i] = 0n;
        pols.result[i] = 0n;
    }

    // INPUT FORMAT {key: [4], level, bit}

    const factors = [1n, 2n ** 18n, 2n ** 36n, 2n ** 54n];
    for (let i = 0; i < input.length; i++) {
        const key = input[i].key.map(x => BigInt(x));
        const level = BigInt(input[i].level);
        const zlevel = Number(input[i].level) % 4;
        const bit = BigInt(input[i].bit);
        let value = key[zlevel];

        console.log(`INPUT #${i}: level:${level} bit:${bit} key:${key.join(',')} value:${value}/0x${value.toString(16)}`);
        let carry = bit;
        let lt = 0n;
        for (let clock = 0; clock < 4; ++clock) {
            const row = i * 4 + clock;
            const chunkValue = value & 0x3FFFFn;
            const glChunk = GL_CHUNKS[clock];
            let chunkValueCarry = chunkValue * 2n + carry;

            value = value >> 18n;

            if (clock == 3) {
                key[zlevel] = key[zlevel] * 2n + bit;
            }
            pols.key0[row] = key[0];
            pols.key1[row] = key[1];
            pols.key2[row] = key[2];
            pols.key3[row] = key[3];
            pols.level[row] = level;
            pols.keyInChunk[row] = chunkValue;
            pols.keyIn[row] = (clock === 0 ? 0n : pols.keyIn[row - 1]) + pols.keyInChunk[row] * factors[clock];

            pols.bit[row] = bit;
            pols.carryLt[row] = carry + 2n * lt;
            carry = chunkValueCarry > 0x3FFFFn ? 1n : 0n;

            // only compare 18 bits
            chunkValueCarry = chunkValueCarry & 0x3FFFFn;
            lt = chunkValueCarry < glChunk ? 1n : (chunkValueCarry == glChunk ? lt : 0n);

            pols.keySel0[row] = (clock === 3 && zlevel === 0) ? 1n : 0n;
            pols.keySel1[row] = (clock === 3 && zlevel === 1) ? 1n : 0n;
            pols.keySel2[row] = (clock === 3 && zlevel === 2) ? 1n : 0n;
            pols.keySel3[row] = (clock === 3 && zlevel === 3) ? 1n : 0n;
            pols.result[row] = clock === 2 ? 1n : 0n;
            console.log(`TRACE w=${row} key:${pols.key0[row]},${pols.key1[row]},${pols.key2[row]},${pols.key3[row]} level:${pols.level[row]} value:0x${value.toString(16)} keyInChunk:0x${pols.keyInChunk[row].toString(16)} keyIn:0x${pols.keyIn[row].toString(16)}`+
                         ` bit:${pols.bit[row]} carryLt:${pols.carryLt[row]} keySel:${pols.keySel0[row]},${pols.keySel1[row]},${pols.keySel2[row]},${pols.keySel3[row]} result:${pols.result[row]}`);
        }
    }
}
