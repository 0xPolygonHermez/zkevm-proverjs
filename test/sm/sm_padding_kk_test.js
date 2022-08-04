const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smPaddingKK = require("../../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smNine2one = require("../../src/sm/sm_nine2one.js");
const smKeccakF = require("../../src/sm/sm_keccakf/sm_keccakf.js");
const smNormGate9 = require("../../src/sm/sm_norm_gate9.js");
const smGlobal = require("../../src/sm/sm_global.js");

// input = [];

const input = [
    {
        data: "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
        reads: [ 32 ]
    },
    {
        data:
            "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"+
            "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
            "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"+
            "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
            "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"+
            "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40",
        reads: [ 1,2,3,4,5,6,7,5,31 ]
    }
];

/*
const input = [
    {
        data: "",
        reads: [  ]
    }
];
*/
describe("test padding keccak", async function () {
    this.timeout(10000000);

    it("It should create the pols keccak padding", async () => {
        const Fr = new F1Field("0xFFFFFFFF00000001");
        const pil = await compile(Fr, "pil/padding_kk.pil", null, {defines:{N: 2 ** 21}});
        const constPols =  newConstantPolsArray(pil);
        const cmPols =  newCommitPolsArray(pil);
        await smPaddingKK.buildConstants(constPols.PaddingKK);
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
        await smNine2one.buildConstants(constPols.Nine2One);
        await smKeccakF.buildConstants(constPols.KeccakF);
        await smNormGate9.buildConstants(constPols.NormGate9);
        await smGlobal.buildConstants(constPols.Global);

        const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, input);
        const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit);
        const requiredNine2One = await smNine2one.execute(cmPols.Nine2One, requiredKKbit.Nine2One);
        const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, requiredNine2One.KeccakF);
        await smNormGate9.execute(cmPols.NormGate9, requiredKeccakF.NormGate9);

        const res = await verifyPil(Fr, pil, cmPols, constPols);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });


});
