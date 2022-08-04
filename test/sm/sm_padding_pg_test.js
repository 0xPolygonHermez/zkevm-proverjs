const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smPaddingPG = require("../../src/sm/sm_padding_pg.js");
const smPoseidonG = require("../../src/sm/sm_poseidong.js");
const smGlobal = require("../../src/sm/sm_global.js");

const input = [
    {
        data: "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
        reads: [ 32 ]
    },
    {
        data:
            "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"+
            "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40",
        reads: [ 1,2,3,4,5,6,7,5,31 ]
    }
];

describe("test padding poseidon goldilocks", async function () {
    this.timeout(10000000);

    it("It should create the pols of two programs and verify the pil", async () => {
        const Fr = new F1Field("0xFFFFFFFF00000001");
        const pil = await compile(Fr, "pil/padding_pg.pil", null, {defines:{N: 2 ** 21}});
        const constPols =  newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);
        await smPaddingPG.buildConstants(constPols.PaddingPG);
        await smPoseidonG.buildConstants(constPols.PoseidonG);
        await smGlobal.buildConstants(constPols.Global);

        const requiredPaddingPG = await smPaddingPG.execute(cmPols.PaddingPG, input);
        await smPoseidonG.execute(cmPols.PoseidonG, requiredPaddingPG.PoseidonG);

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
