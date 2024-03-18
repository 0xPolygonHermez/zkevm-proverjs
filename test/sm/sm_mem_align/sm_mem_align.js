const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;

const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smGlobal = require("../../../src/sm/sm_global.js");
const smMemAlign = require("../../../src/sm/sm_mem_align/sm_mem_align.js");
const input = require('./sm_mem_align_test_data.js');

const LEFT_ALIGN = 4096n
const LITTLE_ENDIAN = 8192n;


describe("test lookup operations", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    let pil;

    const N = 2**19;
    let constPols, cmPols;
    async function preparePilFromString() {
        pil = await compile(Fr, [`constant %N=${N};`,
            'include "pil/mem_align.pil";',
            'namespace Main(%N);',
            'pol commit A[8],B[8],C0,OP[8],D[8],E[8],memAlignRD, memAlignWR;',
            'memAlignRD + memAlignWR {',
            '    memAlignWR,',
            '    A[0], A[1], A[2], A[3],',
            '    A[4], A[5], A[6], A[7],',
            '    B[0], B[1], B[2], B[3],',
            '    B[4], B[5], B[6], B[7],',
            '    OP[0], OP[1], OP[2], OP[3],',
            '    OP[4], OP[5], OP[6], OP[7],',
            '    C0,',
            '    memAlignWR * D[0], memAlignWR * D[1], memAlignWR * D[2], memAlignWR * D[3],',
            '    memAlignWR * D[4], memAlignWR * D[5], memAlignWR * D[6], memAlignWR * D[7],',
            '    memAlignWR * E[0], memAlignWR * E[1], memAlignWR * E[2], memAlignWR * E[3],',
            '    memAlignWR * E[4], memAlignWR * E[5], memAlignWR * E[6], memAlignWR * E[7]',
            '} is',
            'MemAlign.result {',
            '    MemAlign.wr,',
            '    MemAlign.m0[0], MemAlign.m0[1], MemAlign.m0[2], MemAlign.m0[3],',
            '    MemAlign.m0[4], MemAlign.m0[5], MemAlign.m0[6], MemAlign.m0[7],',
            '    MemAlign.m1[0], MemAlign.m1[1], MemAlign.m1[2], MemAlign.m1[3],',
            '    MemAlign.m1[4], MemAlign.m1[5], MemAlign.m1[6], MemAlign.m1[7],',
            '    MemAlign.v[0], MemAlign.v[1], MemAlign.v[2], MemAlign.v[3],',
            '    MemAlign.v[4], MemAlign.v[5], MemAlign.v[6], MemAlign.v[7],',
            '    MemAlign.mode, ',
            '    MemAlign.wr * MemAlign.w0[0], MemAlign.wr * MemAlign.w0[1], MemAlign.wr * MemAlign.w0[2], MemAlign.wr * MemAlign.w0[3],',
            '    MemAlign.wr * MemAlign.w0[4], MemAlign.wr * MemAlign.w0[5], MemAlign.wr * MemAlign.w0[6], MemAlign.wr * MemAlign.w0[7],',
            '    MemAlign.wr * MemAlign.w1[0], MemAlign.wr * MemAlign.w1[1], MemAlign.wr * MemAlign.w1[2], MemAlign.wr * MemAlign.w1[3],',
            '    MemAlign.wr * MemAlign.w1[4], MemAlign.wr * MemAlign.w1[5], MemAlign.wr * MemAlign.w1[6], MemAlign.wr * MemAlign.w1[7]',
            '};'].join("\n"), null, {compileFromString: true, defines: { N }});
        await buildConstants();
    }
    async function buildConstants() {
        constPols = newConstantPolsArray(pil);
        await smGlobal.buildConstants(constPols.Global);
        await smMemAlign.buildConstants(constPols.MemAlign);

        for (let i=0; i<constPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof constPols.$$array[i][j] !== "bigint") {
                    console.log([constPols.$$array[i][j],constPols.$$array[i][j+1],
                                 constPols.$$array[i][j+2],constPols.$$array[i][j+3]]);
                    throw new Error(`Polynomial not fited ${constPols.$$defArray[i].name} at ${j}` )
                }
            }
        }
    }

    function smMainExecute (cmPols, input) {
        // fill main inputs
        const MASK32 = (2n ** 32n - 1n);
        let required = [];
        for (let index = 0; index < input.length; ++index) {
            const _input = input[index];
            for (let k = 0; k < 8; ++k) {
                const bits = BigInt(32 * k);
                cmPols.Main.A[k][index] = (_input.A >> bits) & MASK32;
                cmPols.Main.B[k][index] = (_input.B >> bits) & MASK32;
                cmPols.Main.D[k][index] = (_input.D >> bits) & MASK32;
                cmPols.Main.E[k][index] = (_input.E >> bits) & MASK32;
                cmPols.Main.OP[k][index] = (_input.OP >> bits) & MASK32;
            }
            cmPols.Main.C0[index] = _input.C0;
            cmPols.Main.memAlignRD[index] = _input.memAlignRD;
            cmPols.Main.memAlignWR[index] = _input.memAlignWR;
            required.push({m0: _input.A, m1: _input.B, mode: _input.C0, w0: _input.D, w1: _input.E, 
                            v: _input.OP, wr: _input.memAlignWR});
        }

        const N = cmPols.Main.memAlignRD.length;
        for (let index = input.length; index < N; ++index) {
            for (let k = 0; k < 8; ++k) {
                cmPols.Main.A[k][index] = 0n;
                cmPols.Main.B[k][index] = 0n;
                cmPols.Main.D[k][index] = 0n;
                cmPols.Main.E[k][index] = 0n;
                cmPols.Main.OP[k][index] = 0n;
            }
            cmPols.Main.C0[index] = 0n;
            cmPols.Main.memAlignRD[index] = 0n;
            cmPols.Main.memAlignWR[index] = 0n;
        }
        return required;
    }

    it("It should verify the mem_align operations pil", async () => {
        // generateZkasmLt4Test(input.filter(x => x.opcode == 8));
        await preparePilFromString();
        cmPols = newCommitPolsArray(pil);

        const required = smMainExecute(cmPols, input);
        await smMemAlign.execute(cmPols.MemAlign, required);

        for (let i=0; i<cmPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof cmPols.$$array[i][j] !== 'bigint') {
                    console.log([cmPols.$$array[i][j-1], cmPols.$$array[i][j], cmPols.$$array[i][j+1]]);
                    throw new Error(`Polynomial not fited ${cmPols.$$defArray[i].name} at ${j}` )
                }
            }
        }
        // Verify
        const res = await verifyPil(Fr, pil, cmPols, constPols ,{continueOnError: true});

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });

    function includes(res, value) {
        const index = res.indexOf(value);
        assert(index !== -1, "not found "+value);
        res.splice(index, 1);
    }
});
