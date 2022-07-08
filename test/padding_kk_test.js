const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("zkpil");
const smPaddingKK = require("../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../src/sm/sm_padding_kkbit.js");
const smNine2one = require("../src/sm/sm_nine2one.js");
const smKeccakF = require("../src/sm/sm_keccakf.js");
const smNormGate9 = require("../src/sm/sm_norm_gate9.js");
const smGlobal = require("../src/sm/sm_global.js");

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
        const pil = await compile(Fr, "pil/padding_kk.pil");
        const [constPols, constPolsArray, constPolsDef] =  createConstantPols(pil);
        const [cmPols, cmPolsArray, cmPolsDef] =  createCommitedPols(pil);
        await smPaddingKK.buildConstants(constPols.PaddingKK, constPolsDef.PaddingKK);
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit, constPolsDef.PaddingKKBit);
        await smNine2one.buildConstants(constPols.Nine2One, constPolsDef.Nine2One);
        await smKeccakF.buildConstants(constPols.KeccakF, constPolsDef.KeccakF);
        await smNormGate9.buildConstants(constPols.NormGate9, constPolsDef.NormGate9);
        await smGlobal.buildConstants(constPols.Global, constPolsDef.Global);

        const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, cmPolsDef.PaddingKK, input);
        const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, cmPolsDef.PaddingKKBit, requiredKK.paddingKKBits);
        const requiredNine2One = await smNine2one.execute(cmPols.Nine2One, cmPolsDef.Nine2One, requiredKKbit.Nine2One);
        const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, cmPolsDef.KeccakF, requiredNine2One.KeccakF);
        await smNormGate9.execute(cmPols.NormGate9, cmPolsDef.NormGate9, requiredKeccakF.NormGate9);

        const res = await verifyPil(Fr, pil, cmPolsArray , constPolsArray);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });


});
