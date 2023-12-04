const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const fs = require("fs");
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smClimbKey = require("../../src/sm/sm_climb_key.js");
const smGlobal = require("../../src/sm/sm_global.js");
const { C } = require("@0xpolygonhermez/zkevm-commonjs/src/poseidon_constants_opt.js");


describe("test climb key state machine", async function () {
    this.timeout(10000000);

    let F;

    before(async () => {
        F = new F1Field("0xFFFFFFFF00000001");
    });

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

    async function generatePols(F, input) {
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

        executeMain(cmPols.Main, input);

        await smClimbKey.execute(cmPols.ClimbKey, input);
        return [pil, cmPols, constPols];
    }

    // it("It should check standard l", async () => {
    //     const GL = 0xFFFFFFFF00000001n;
    //     const PGL = GL - 1n;
    //     const SGL = GL >> 1n;

    //     // input: {key: currentRkey, level: pols.level[i], bit}
    //     let input = [
    //         {key: [0n,0n,0n,0n], out: [0n,0n,0n,0n], level: 3n, bit: 0n},
    //         {key: [0n,0n,0n,0n], out: [1n,0n,0n,0n], level: 4n, bit: 1n},
    //         {key: [0n,0n,0n,0n], out: [0n,1n,0n,0n], level: 5n, bit: 1n},
    //         {key: [0n,0n,0n,0n], out: [0n,0n,1n,0n], level: 6n, bit: 1n},
    //         {key: [0n,0n,0n,0n], out: [0n,0n,0n,1n], level: 7n, bit: 1n},
    //         {key: [SGL, PGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 0n, bit: 0n},
    //         {key: [PGL, SGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 1n, bit: 0n},
    //         {key: [PGL, PGL, SGL, PGL], out: [PGL, PGL, PGL, PGL], level: 2n, bit: 0n},
    //         {key: [PGL, PGL, PGL, SGL], out: [PGL, PGL, PGL, PGL], level: 3n, bit: 0n}];

    //     const values = [0x3FFFFn, 0x1FFFFn, 0xFFFFC0000n, 0x7FFFC0000n, 0x3FF000000000n, 0x1FF000000000n];
    //     const fills = [0n, PGL];
    //     for (let level = 0; level < 256; ++level) {
    //         for (let bit = 0; bit < 2; ++bit) {
    //             for (const value of values) {
    //                 for (const fill of fills) {
    //                     let key = new Array(4);
    //                     key.fill(fill);
    //                     key[level % 4] = value;
    //                     input.push({key, level: BigInt(level), bit: BigInt(bit)});
    //                 }
    //             }
    //         }
    //     }
    //     const [pil, cmPols, constPols] = await generatePols(F, input);
    //     // Verify
    //     const res = await verifyPil(F, pil, cmPols, constPols);

    //     if (res.length != 0) {
    //         console.log("Pil does not pass");
    //         for (let i = 0; i < res.length; i++) {
    //             console.log(res[i]);
    //         }
    //         assert(0);
    //     }
    // });

    it("It should pass??", async () => {
        const pilCode = `
        include "pil/global.pil";
        include "pil/climb_key.pil";`;

        const pil = await compile(F, pilCode, null, { compileFromString: true, defines: {N: 2 ** 8}});
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);

        await smGlobal.buildConstants(constPols.Global);
        await smClimbKey.buildConstants(constPols.ClimbKey);

        const GL = 0xFFFFFFFF00000001n;
        const PGL = GL - 1n;
        const SGL = GL >> 1n;

        let input = [
            {key: [0n,0n,0n,0n], out: [1n,0n,0n,0n], level: 0n, bit: 1n},
            {key: [0n,0n,0n,0n], out: [1n,0n,0n,0n], level: 4n, bit: 1n}];

        await smClimbKey.execute(cmPols.ClimbKey, input);

        let table = constPols.ClimbKey.T_CLKEYSEL.map((_, index) => {
            let row = {};
            Object.keys(constPols.ClimbKey).forEach(key => {
                row[key] = constPols.ClimbKey[key][index];
            });
            return row;
        });
        console.table(table);
        EXIT

        let res = await verifyPil(F, pil, cmPols, constPols, { continueOnError: true })

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    })

    // it("It should fail tests", async () => {
    //     const pilCode = `
    //     include "pil/global.pil";
    //     include "pil/climb_key.pil";`;

    //     const pil = await compile(F, pilCode, null, { compileFromString: true, defines: {N: 2 ** 22}});
    //     const constPols = newConstantPolsArray(pil);
    //     const cmPols = newCommitPolsArray(pil);

    //     await smGlobal.buildConstants(constPols.Global);
    //     await smClimbKey.buildConstants(constPols.ClimbKey);

    //     // input: {key: currentRkey, level: pols.level[i], bit}

    //     const GL = 0xFFFFFFFF00000001n;
    //     const PGL = GL - 1n;
    //     const SGL = GL >> 1n;

    //     let input = [
    //         {key: [0n,0n,0n,0n], out: [0n,0n,0n,0n], level: 256n, bit: 0n},
    //         {key: [0x8000000000000000n,0n,0n,0n], out: [1n,0n,0n,0n], level: 4n, bit: 1n},
    //         {key: [SGL, PGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 0n, bit: 1n},
    //         {key: [PGL, SGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 1n, bit: 1n},
    //         {key: [PGL, PGL, SGL, PGL], out: [PGL, PGL, PGL, PGL], level: 2n, bit: 1n},
    //         {key: [PGL, PGL, PGL, SGL], out: [PGL, PGL, PGL, PGL], level: 3n, bit: 1n}];

    //     await smClimbKey.execute(cmPols.ClimbKey, input);

    //     let res = await verifyPil(F, pil, cmPols, constPols, { continueOnError: true })
    //     for (let i = 0; i < res.length; i++) {
    //         console.log(res[i]);
    //     }
    //     expect(res.length).to.not.eq(0);
    //     const baseLen = res[0].indexOf('climb_key.pil');
    //     res = res.map(x => x.substring(baseLen));
    //     const plookupLine = pil.plookupIdentities[0].line;
    //     const prefix = 'climb_key.pil:'+plookupLine+':  plookup not found ';

    //     expect(res[0]).to.equal(prefix + 'w=3 values: 1:7,256,0,2,0');
    //     expect(res[1]).to.equal(prefix + 'w=7 values: 1:7,4,512,2,0');
    //     expect(res[2]).to.equal(prefix + 'w=11 values: 1:7,0,511,1,0');
    //     expect(res[3]).to.equal(prefix + 'w=15 values: 1:11,1,511,1,0');
    //     expect(res[4]).to.equal(prefix + 'w=19 values: 1:19,2,511,1,0');
    //     expect(res[5]).to.equal(prefix + 'w=23 values: 1:35,3,511,1,0');
    // })


    function mapConstraints(pilFile, constraints) {
        const pilLines = fs.readFileSync('pil/climb_key.pil', {encoding:'utf8', flag:'r'}).split("\n");
        const compactPilLines = pilLines.map(x => x.replace(/ /g, ''));
        let constraintLines = [];
        for (const constraint of constraints) {
            const _constraint = constraint.replace(/ /g, '');
            let line = compactPilLines.indexOf(_constraint);
            if (line < 0) {
                throw new Error(`ERROR: constraint ${constraint} not found on pil ${pil}`)
            }
            constraintLines.push(line + 1);
        }
        return constraintLines;
    }

    // it("It should fail tests (MAP)", async () => {
    //     const pilCode = `
    //     include "pil/global.pil";
    //     include "pil/climb_key.pil";`;

    //     const pil = await compile(F, pilCode, null, { compileFromString: true, defines: {N: 2 ** 22}});
    //     const lines = mapConstraints('pil/climb_key.pil', ["keyIn' = (1 - CLK3) * keyIn + FACTOR * keyInChunk';"]);

    //     const constPols = newConstantPolsArray(pil);
    //     const cmPols = newCommitPolsArray(pil);

    //     await smGlobal.buildConstants(constPols.Global);
    //     await smClimbKey.buildConstants(constPols.ClimbKey);

    //     // input: {key: currentRkey, level: pols.level[i], bit}

    //     const GL = 0xFFFFFFFF00000001n;
    //     const PGL = GL - 1n;
    //     const SGL = GL >> 1n;

    //     let input = [
    //         {key: [0x8000000000000000n,0n,0n,0n], out: [1n,0n,0n,0n], level: 4n, bit: 1n},
    //         {key: [SGL, PGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 0n, bit: 1n},
    //         {key: [PGL, SGL, PGL, PGL], out: [PGL, PGL, PGL, PGL], level: 1n, bit: 1n},
    //         {key: [PGL, PGL, SGL, PGL], out: [PGL, PGL, PGL, PGL], level: 2n, bit: 1n},
    //         {key: [PGL, PGL, PGL, SGL], out: [PGL, PGL, PGL, PGL], level: 3n, bit: 1n}];

    //     await smClimbKey.execute(cmPols.ClimbKey, input);
    //     cmPols.ClimbKey.keyInChunk[3] = 0n;

    //     let res = await verifyPil(F, pil, cmPols, constPols, { continueOnError: true })
    //     for (let i = 0; i < res.length; i++) {
    //         console.log(res[i]);
    //     }
    //     expect(res.length).to.not.eq(0);
    //     const baseLen = res[0].indexOf('climb_key.pil');
    //     res = res.map(x => x.substring(baseLen).trim());
    //     const plookupLine = pil.plookupIdentities[0].line;
    //     const prefix = 'climb_key.pil:'+plookupLine+':  plookup not found ';

    //     // MAP: expect(res[1]).to.equal(prefix + 'w=7 values: 1:7,4,512,2,0');
    //     expect(res[0]).to.equal(prefix + 'w=7 values: 1:7,0,511,1,0');
    //     expect(res[1]).to.equal(prefix + 'w=11 values: 1:11,1,511,1,0');
    //     expect(res[2]).to.equal(prefix + 'w=15 values: 1:19,2,511,1,0');
    //     expect(res[3]).to.equal(prefix + 'w=19 values: 1:35,3,511,1,0');
    //     let val = 0x8000000000000000n - 0xFFFFFFFF00000001n;
    //     expect(res[4]).to.equal(`climb_key.pil:${lines[0]}: identity does not match w=2 val=${val}`);
    // })

});
