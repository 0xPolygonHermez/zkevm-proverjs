const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smClimbKey = require("../../src/sm/sm_climb_key.js");
const smGlobal = require("../../src/sm/sm_global.js");


describe("test climb key state machine", async function () {
    this.timeout(10000000);

    function executeMain(pols, input) {
        const N = pols.inkey[0].length;

        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < 4; ++j) {
                pols.inkey[j][i] = 0n;
                pols.outkey[j][i] = 0n;
            }
            pols.level[i] = 0n;
            pols.bit[i] = 0n;
            pols.sel[i] = 0n;
        }
        for (let i = 0; i < input.length; ++i) {
            const jlevel = Number(input[i].level % 4n);
            pols.level[i] = input[i].level;
            pols.bit[i] = input[i].bit;
            pols.sel[i] = 1n;
            for (let j = 0; j < 4; ++j) {
                pols.inkey[j][i] = input[i].key[j];
                if (typeof input[i].out === 'undefined') {
                    pols.outkey[j][i] = jlevel === j ? input[i].key[j] * 2n + input[i].bit: input[i].key[j];
                } else {
                    pols.outkey[j][i] = input[i].out[j];
                }
            }
        }
    }


    it("It should check standard l", async () => {
        const F = new F1Field("0xFFFFFFFF00000001");
        const pilCode = `
        include "pil/global.pil";
        include "pil/climb_key.pil";

        namespace Main(%N);

        pol commit inkey[4];
        pol commit outkey[4];
        pol commit sel;
        pol commit level;
        pol commit bit;

        sel  { inkey[0], inkey[1], inkey[2], inkey[3], level, bit, outkey[0], outkey[1], outkey[2], outkey[3] }
        is ClimbKey.result {
            ClimbKey.key0, ClimbKey.key1, ClimbKey.key2, ClimbKey.key3,
            ClimbKey.level', ClimbKey.bit,
            ClimbKey.key0', ClimbKey.key1', ClimbKey.key2', ClimbKey.key3'
        };`;

        const pil = await compile(F, pilCode, null, { compileFromString: true, defines: {N: 2 ** 22}});
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);

        await smGlobal.buildConstants(constPols.Global);
        await smClimbKey.buildConstants(constPols.ClimbKey);

        // input: {key: currentRkey, level: pols.level[i], bit}

        const GL = 0xFFFFFFFF00000001n;
        const PGL = GL - 1n;
        const SGL = GL >> 1n;
        const input = [
            {key: [0n,0n,0n,0n], out: [0n,0n,0n,0n], level: 3n, bit: 0n},
            {key: [0n,0n,0n,0n], out: [1n,0n,0n,0n], level: 4n, bit: 1n},
            {key: [0n,0n,0n,0n], out: [0n,1n,0n,0n], level: 5n, bit: 1n},
            {key: [0n,0n,0n,0n], out: [0n,0n,1n,0n], level: 6n, bit: 1n},
            {key: [0n,0n,0n,0n], out: [0n,0n,0n,1n], level: 7n, bit: 1n},
            {key: [SGL, PGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [PGL, SGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 1n, bit: 0n},
            {key: [PGL, PGL, SGL, PGL], out: [PGL, PGL, PGL, PGL], level: 2n, bit: 0n},
            {key: [PGL, PGL, PGL, SGL], out: [PGL, PGL, PGL, PGL], level: 3n, bit: 0n},
            {key: [0x3FFFFn, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0x3FFFFn, PGL, PGL, PGL], level: 0n, bit: 1n},
            {key: [0x1FFFFn, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0x1FFFFn, PGL, PGL, PGL], level: 0n, bit: 1n},
            {key: [0xFFFFC0000n, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0xFFFFC0000n, PGL, PGL, PGL], level: 0n, bit: 1n},
            {key: [0x7FFFC0000n, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0x7FFFC0000n, PGL, PGL, PGL], level: 0n, bit: 1n},
            {key: [0x3FF000000000n, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0x3FF000000000n, PGL, PGL, PGL], level: 0n, bit: 1n},
            {key: [0x1FF000000000n, PGL, PGL, PGL], level: 0n, bit: 0n},
            {key: [0x1FF000000000n, PGL, PGL, PGL], level: 0n, bit: 1n}
        ];
        executeMain(cmPols.Main, input);

        await smClimbKey.execute(cmPols.ClimbKey, input);




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
