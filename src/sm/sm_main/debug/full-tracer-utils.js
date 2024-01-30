/* eslint-disable default-param-last */
const { ethers } = require('ethers');
const { Scalar } = require('ffjavascript');
const { toHexStringRlp, addressToHexStringRlp } = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;
const { scalar2fea, fea2scalar } = require('@0xpolygonhermez/zkevm-commonjs').smtUtils;

/**
 * Compute transaction hash from a transaction RLP encoding and hashing with keccak
 * @param {String} to - hex string
 * @param {Number} value - int number
 * @param {Number} nonce - int number
 * @param {Number} gasLimit - int number
 * @param {Number} gasPrice - int number
 * @param {String} data - hex string of the data
 * @param {String} r - hex string of r signature
 * @param {String} s - hex string of s signature
 * @param {String} v - hex string of v signature with EIP-155 applied (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md)
 * @returns {String} - Hex string with the transaction hash
 */
function getTransactionHash(to, value, nonce, gasLimit, gasPrice, data, r, s, v) {
    const txu = {
        value: toHexStringRlp(value),
        nonce: toHexStringRlp(nonce),
        gasLimit: toHexStringRlp(gasLimit),
        gasPrice: toHexStringRlp(gasPrice),
        data: toHexStringRlp(data),
        to: addressToHexStringRlp(to),
    };

    const sig = {
        r: toHexStringRlp(r),
        s: toHexStringRlp(s),
        v: toHexStringRlp(v),
    };

    const fields = [txu.nonce, txu.gasPrice, txu.gasLimit, txu.to, txu.value, txu.data, sig.v, sig.r, sig.s];
    const rlp = ethers.utils.RLP.encode(fields);
    const kecc = ethers.utils.keccak256(rlp);

    return {
        tx_hash: kecc,
        rlp_tx: rlp,
    };
}

/**
 * Returns the value of a rom label
 * @param {Object} program of the rom
 * @param {String} label name of the label
 * @returns {String} label value or null if not found
 */
function findOffsetLabel(program, label) {
    for (let i = 0; i < program.length; i++) {
        if (program[i].offsetLabel === label) {
            return program[i].offset;
        }
    }

    return null;
}

/**
 * Get a global or context variable
 * @param {Object} ctx current context object
 * @param {Boolean} global true if label is global, false if is ctx label
 * @param {String} varLabel name of the label
 * @param {Number} customCTX get memory from a custom context
 * @returns {Scalar} value of the label
 */
function getVarFromCtx(ctx, global, varLabel, customCTX) {
    const CTX = typeof customCTX === 'undefined' ? ctx.CTX : customCTX;
    const offsetCtx = global ? 0 : Number(CTX) * 0x40000;
    const offsetRelative = findOffsetLabel(ctx.rom.program, varLabel);
    const addressMem = offsetCtx + offsetRelative;
    const value = ctx.mem[addressMem];
    const finalValue = typeof value === 'undefined' ? 0 : value;
    if (!finalValue) return 0n;

    return fea2scalar(ctx.Fr, finalValue);
}

/**
 * Set a global variable
 * @param {Object} ctx current context object
 * @param {String} varLabel name of the label
 * @param {Array[BigInt]} valueToSet value in the form of [op0, .., op7]
 */
function setGlobalVar(ctx, varLabel, valueToSet) {
    const addressMem = findOffsetLabel(ctx.rom.program, varLabel);
    ctx.mem[addressMem] = valueToSet;
}

/**
 * Get the value of a reg (A, B, C, D, E...)
 * @param {Object} ctx current context object
 * @param {String} reg label string of the reg to retrieve
 * @returns {Scalar} value of the reg
 */
function getRegFromCtx(ctx, reg) {
    return fea2scalar(ctx.Fr, ctx[reg]);
}

/**
 * Get range from memory
 * @param {Number} offset to start read from calldata
 * @param {Number} length size of the bytes to read from offset
 * @param {Object} ctx current context object
 * @param {Number} customCTX get memory from a custom context
 * @returns {Array} string array with 32 bytes hex values
 */
function getFromMemory(offset, length, ctx, customCTX) {
    const CTX = typeof customCTX === 'undefined' ? ctx.CTX : customCTX;
    const offsetCtx = Number(CTX) * 0x40000;
    let addrMem = 0;
    addrMem += offsetCtx;
    addrMem += 0x20000;

    let finalMemory = '0x';

    const init = addrMem + (Number(offset) / 32);
    const end = addrMem + ((Number(offset) + Number(length)) / 32);
    const initCeil = Math.ceil(init);
    const endFloor = Math.floor(end);

    if (init !== initCeil) {
        let memValueStart = ctx.mem[Math.floor(init)];
        if (typeof memValueStart === 'undefined') { memValueStart = scalar2fea(ctx.Fr, 0); }
        const memScalarStart = fea2scalar(ctx.Fr, memValueStart);
        let hexStringStart = memScalarStart.toString(16);
        hexStringStart = hexStringStart.padStart(64, '0');
        const bytesToRetrieve = (init - Math.floor(init)) * 32;
        hexStringStart = hexStringStart.slice(bytesToRetrieve * 2);
        finalMemory = finalMemory.concat(hexStringStart);
    }

    for (let i = initCeil; i < endFloor; i++) {
        let memValue = ctx.mem[i];
        if (typeof memValue === 'undefined') { memValue = scalar2fea(ctx.Fr, 0); }
        const memScalar = fea2scalar(ctx.Fr, memValue);
        let hexString = memScalar.toString(16);
        hexString = hexString.padStart(64, '0');
        finalMemory = finalMemory.concat(hexString);
    }

    if (end !== endFloor) {
        let memValueEnd = ctx.mem[endFloor];
        if (typeof memValueEnd === 'undefined') { memValueEnd = scalar2fea(ctx.Fr, 0); }
        const memScalarEnd = fea2scalar(ctx.Fr, memValueEnd);
        let hexStringEnd = memScalarEnd.toString(16);
        hexStringEnd = hexStringEnd.padStart(64, '0');
        const bytesToKeep = (end - endFloor) * 32;
        hexStringEnd = hexStringEnd.slice(0, bytesToKeep * 2);
        finalMemory = finalMemory.concat(hexStringEnd);
    }

    return finalMemory.substring(0, length * 2 + 2);
}

/**
 * Get constant from rom compilation
 * @param {Object} ctx current context object
 * @param {String} constantName name of the constant
 * @returns {String} value of the constant
 */
function getConstantFromCtx(ctx, constantName) {
    return ctx.rom.constants[constantName].value;
}

/**
 * Get a padded hex string from its numeric value
 * @param {BigInt} bn numeric value
 * @param {Number} paddingLength left padding size with zeros
 * @returns {String} hex value of the bn left padded with zeros
 */
function bnToPaddedHex(bn, paddingLength) {
    return `0x${ethers.utils.hexlify(bn).slice(2).padStart(paddingLength, '0')}`;
}

function convertBigIntsToNumbers(obj) {
    if (typeof (obj) === 'bigint') {
        if (Scalar.gt(obj, Number.MAX_SAFE_INTEGER)) {
            throw new Error(`Cannot convert ${obj} to number. Greater than MAX_SAFE_INTEGER`);
        }

        return Number(obj);
    } if (Array.isArray(obj)) {
        return obj.map(convertBigIntsToNumbers);
    } if (typeof obj === 'object') {
        const res = {};
        const keys = Object.keys(obj);
        keys.forEach((k) => {
            res[k] = convertBigIntsToNumbers(obj[k]);
        });

        return res;
    }

    return obj;
}

module.exports = {
    getTransactionHash,
    findOffsetLabel,
    getVarFromCtx,
    getRegFromCtx,
    getFromMemory,
    getConstantFromCtx,
    bnToPaddedHex,
    convertBigIntsToNumbers,
    setGlobalVar,
};
