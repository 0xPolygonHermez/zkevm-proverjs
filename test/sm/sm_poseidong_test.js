const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smPoseidonG = require("../../src/sm/sm_poseidong.js");


describe("test poseidon goldilocks state machine", async function () {
    this.timeout(10000000);

    it("It should check standard l", async () => {
        const F = new F1Field("0xFFFFFFFF00000001");

        const pil = await compile(F, "pil/poseidong.pil", null, { defines: { N: 2 ** 21}});
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);

        const n1 = F.e(-1);
        const input = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0, 0x3c18a9786cb0b359n, 0xc4055e3364a246c3n, 0x7953db0ab48808f4n, 0xc71603f33a1144can],
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0xd64e1e3efc5b8e9en, 0x53666633020aaa47n, 0xd40285597c6a8825n, 0x613a4f81e81231d2n],
            [n1, n1, n1, n1, n1, n1, n1, n1, n1, n1, n1, n1, 0xbe0085cfc57a8357n, 0xd95af71847d05c09n, 0xcf55a13d33c1c953n, 0x95803a74f4530e82n]
        ];

        await smPoseidonG.buildConstants(constPols.PoseidonG);
        await smPoseidonG.execute(cmPols.PoseidonG, input);

        // Verify
        const res = await verifyPil(F, pil, cmPols, constPols);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });

});
