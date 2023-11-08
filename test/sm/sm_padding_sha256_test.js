const chai = require('chai');
const { createHash } = require('node:crypto');

const { assert } = chai;
const { F1Field } = require('ffjavascript');

const {
    newConstantPolsArray, newCommitPolsArray, compile, verifyPil,
} = require('pilcom');

const smPaddingSha256 = require('../../src/sm/sm_padding_sha256');
const smPaddingSha256Bit = require('../../src/sm/sm_padding_sha256bit/sm_padding_sha256bit');
const smBits2FieldSha256 = require('../../src/sm/sm_bits2field_sha256');
const smSha256F = require('../../src/sm/sm_sha256f/sm_sha256f');
const smGlobal = require('../../src/sm/sm_global');
const { sha256 } = require('../../src/sm/sm_padding_sha256bit/sha256');

// input = [];

const input = [
    {
        data: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        reads: [32],
    },
    {
        data:
            '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40'
            + '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40'
            + '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'
            + '2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40',
        reads: [1, 2, 3, 4, 5, 6, 7, 5, 31],
    },
];

describe('test padding sha256', async function () {
    this.timeout(10000000);

    it('should sha256 the abc', async () => {
        const hash0 = sha256('abc', 'hex');
        const hash0expected = createHash('sha256').update('abc').digest('hex');
        assert.equal(hash0, hash0expected);
    });

    it('should sha256 the empty', async () => {
        const hash0 = sha256('', 'hex');
        const hash0expected = createHash('sha256').update(Uint8Array.from([])).digest('hex');
        assert.equal(hash0, hash0expected);
    });

    it('should sha256 the long string', async () => {
        let s = '';
        while (s.length <= 1025) {
            const hash0 = sha256(s, 'hex');
            const hash0expected = createHash('sha256').update(s).digest('hex');
            assert.equal(hash0, hash0expected);
            s += 'a';
        }
    });

    it('It should create the pols sha256 padding', async () => {
        const Fr = new F1Field('0xFFFFFFFF00000001');
        const pil = await compile(Fr, 'pil/padding_sha256.pil', null, { defines: { N: 2 ** 20 } });
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
        await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);
        await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);
        await smSha256F.buildConstants(constPols.Sha256F);
        await smGlobal.buildConstants(constPols.Global);
/*
        for (let i = 0; i < constPols.$$array.length; i++) {
            const arr = constPols.$$array[i];
            for (let j = 0; j < arr.length; j++) {
                assert(typeof (arr[j]) === 'bigint', `const pol: ${i} w: ${j} desc: ${JSON.stringify(constPols.$$defArray[i], null, 1)}`);
            }
        }
*/
        const requiredSha256 = await smPaddingSha256.execute(cmPols.PaddingSha256, input);
        const requiredSha256bit = await smPaddingSha256Bit.execute(cmPols.PaddingSha256Bit, requiredSha256.paddingSha256Bit);
        const requiredBits2FieldSha256 = await smBits2FieldSha256.execute(cmPols.Bits2FieldSha256, requiredSha256bit.Bits2FieldSha256);
        await smSha256F.execute(cmPols.Sha256F, requiredBits2FieldSha256.Sha256F);

        for (let i = 0; i < cmPols.$$array.length; i++) {
            const arr = cmPols.$$array[i];
            for (let j = 0; j < arr.length; j++) {
                assert(typeof (arr[j]) === 'bigint', `pol: ${i} w: ${j} desc: ${JSON.stringify(cmPols.$$defArray[i], null, 1)}`);
            }
        }

        const res = await verifyPil(Fr, pil, cmPols, constPols);

        if (res.length !== 0) {
            // eslint-disable-next-line no-console
            console.log('Pil does not pass');
            for (let i = 0; i < res.length; i++) {
                // eslint-disable-next-line no-console
                console.log(res[i]);
            }
            assert(0);
        }
    });
});
