const chai = require('chai');

const { assert } = chai;
const { F1Field } = require('ffjavascript');

const {
    newConstantPolsArray, newCommitPolsArray, compile, verifyPil,
} = require('pilcom');

const smPaddingSha256 = require('../../src/sm/sm_padding_sha256');
const smPaddingPG = require('../../src/sm/sm_padding_pg');
const smPaddingKK = require('../../src/sm/sm_padding_kk');
const smGlobal = require('../../src/sm/sm_global');

// input = [];

const input = [];

describe('test paddings (poseidon, keccak, sha256) empty', async function () {
    this.timeout(10000000);
    it('no hash test', async () => {
        const Fr = new F1Field('0xFFFFFFFF00000001');
        const pil = await compile(Fr, 'pil/main.pil', null, {
                defines: { N: 2 ** 18 },
                namespaces: ['Global','PaddingPG','PaddingKK','PaddingSha256']
        });
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);
        await smPaddingPG.buildConstants(constPols.PaddingPG);
        await smPaddingKK.buildConstants(constPols.PaddingKK);
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
        await smGlobal.buildConstants(constPols.Global);

        await smPaddingPG.execute(cmPols.PaddingPG, []);
        await smPaddingKK.execute(cmPols.PaddingKK, []);
        await smPaddingSha256.execute(cmPols.PaddingSha256, []);

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
