const F1Field = require("ffjavascript").F1Field;

const GL_CHUNKS = [0x00001, 0x3C000, 0x3FFFF, 0x003FF];

module.exports.buildConstants = async function (pols) {
    const N = pols.T_CHUNK_VALUE.length;

    let row = -1;
    const ltInSizes = [1, 2, 2, 2];
    const carryInSizes = [2, 2, 2, 2];
    const levelSizes = [1, 1, 1, 256];
    const chunkSizes = [2**18, 2**18, 2**18, 2**10];
    const factors = [1n, 2n**18n, 2n**36n, 2n**54n];
    let level = 0;
    let ltIn = 0;
    let carryIn = 0;

    while (row < N) {
        for (let clock = 0; clock < 4 && row < N; ++clock) {
            const upToLtIn = ltInSizes[clock] - 1;
            const upToCarryIn = carryInSizes[clock] - 1;
            const upToLevel = levelSizes[clock] - 1;
            const upToChunk = chunkSizes[clock] - 1;
            const glChunk = GL_CHUNKS[clock];

            const carryLtIn = BigInt(carryIn + 2 * ltIn);
            const clkeySel = BigInt(clock + (clock === 3 ? 4 << keyIndex : 0));
            const _level = BigInt(level);

            // Fill all chunk values
            for (let chunk = 0; chunk < upToChunk; ++chunk) {
                ++row;
                if (row === N) break;
                const result = 2 * chunk + carryIn;
                const carryOut = (clock < 4 && result > upToChunk) ? 1: 0;
                const chunkResult = result % (upToChunk + 1);
                const ltOut = chunkResult > glChunk ? 0 : (chunkResult == glChunk ? ltIn : 1);
                pols.T_CLKEYSEL[row] = clkeySel;
                pols.T_CHUNK_VALUE[row] = BigInt(chunk);
                pols.T_CARRYLT_IN[row] = carryLtIn;
                pols.T_CARRYLT_OUT[row] = BigInt(carryOut + 2 * ltOut);
                pols.T_LEVEL[row] = _level;
                pols.FACTOR[row] = factors[clock];
            }

            while (level <= upToLevel) {
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
                ++level;
            }
        }
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

        let carry = bit;
        let lt = 0n;
        for (let clock = 0; clock < 4; ++clock) {
            const row = i * 4 + clock;
            const chunkValue = value && 0x3FFFFn;
            const chunkValueCarry = chunkValue * 2n + carry;
            const glChunk = GL_CHUNKS[clock];

            value = value << 18n;

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
            lt = chunkValueCarry < glChunk ? 1n : (chunkValueCarry == glChunk ? lt : 0n);

            pols.keySel0[row] = (clock === 3 && zlevel === 0) ? 1n : 0n;
            pols.keySel1[row] = (clock === 3 && zlevel === 1) ? 1n : 0n;
            pols.keySel2[row] = (clock === 3 && zlevel === 2) ? 1n : 0n;
            pols.keySel3[row] = (clock === 3 && zlevel === 3) ? 1n : 0n;
            pols.result[row] = clock === 2 ? 1n : 0n;
        }
    }
}
