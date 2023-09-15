const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;
const fs = require("fs");
const path = require("path");
const zkasm = require("@0xpolygonhermez/zkasmcom");

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");


const smArith = require("../src/sm/sm_arith/sm_arith.js");
const smBinary = require("../src/sm/sm_binary.js");
const smGlobal = require("../src/sm/sm_global.js");
const smKeccakF = require("../src/sm/sm_keccakf/sm_keccakf.js");
const smMain = require("../src/sm/sm_main/sm_main.js");
const smMemAlign = require("../src/sm/sm_mem_align.js");
const smMem = require("../src/sm/sm_mem.js");
const smBits2Field = require("../src/sm/sm_bits2field.js");
const smPaddingKK = require("../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smRom = require("../src/sm/sm_rom.js");

describe("test main sm", async function () {
    this.timeout(10000000);

    it("It should create the pols main", async () => {
        const Fr = new F1Field("0xFFFFFFFF00000001");
        const pil = await compile(Fr, "pil/main.pil");
        const constPols =  newConstantPolsArray(pil);
        const cmPols =  newCommitPolsArray(pil);

        const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "tools", "build-genesis", "input_executor.json"), "utf8"));
//        const rom = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "build", "rom.json"), "utf8"));
//        const rom = await zkasm.compile(path.join(__dirname, "zkasm", "mem_align.zkasm"));
        const rom = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "build", "zkasm_program.json"), "utf8"));

        console.log("Const Global...");
        await smGlobal.buildConstants(constPols.Global);
        console.log("Const Main...");
        await smMain.buildConstants(constPols.Main);
        console.log("Const Rom...");
        await smRom.buildConstants(constPols.Rom, rom);
/*        console.log("Const PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
        console.log("Const PaddingKKBit...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
        console.log("Const Bits2Field...");
        await smBits2Field.buildConstants(constPols.Bits2Field);
        console.log("Const KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);
        console.log("Const Mem...");
        await smMem.buildConstants(constPols.Mem);
        console.log("Const PaddingPG...");
        await smPaddingPG.buildConstants(constPols.PaddingPG);
        console.log("Const PoseidonG...");
        await smPoseidonG.buildConstants(constPols.PoseidonG);
        console.log("Const Storage...");
        await smStorage.buildConstants(constPols.Storage);
        console.log("Const MemAlign...");
        await smMemAlign.buildConstants(constPols.MemAlign);
        console.log("Const Arith...");
        await smArith.buildConstants(constPols.Arith);
        console.log("Const Binary...");
        await smBinary.buildConstants(constPols.Binary);*/

        const requiredMain = await smMain.execute(cmPols.Main, input, rom);
/*        console.log("Exec PaddingKK...");
        const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, requiredMain.PaddingKK);
        console.log("Exec PaddingKKbit...");
        const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit);
        console.log("Exec Bits2Field...");
        const requiredBits2Field = await smBits2Field.execute(cmPols.Bits2Field, requiredKKbit.Bits2Field);
        console.log("Exec KeccakF...");
        const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, requiredBits2Field.KeccakF);
        console.log("Exec MemAlign...");
        await smMemAlign.execute(cmPols.MemAlign, requiredMain.MemAlign);

        console.log("Exec Mem...");
        await smMem.execute(cmPols.Mem, requiredMain.Mem);
        console.log("Exec Storage...");
        const requiredStorage = await smStorage.execute(cmPols.Storage, requiredMain.Storage);
        console.log("Exec PaddingPG...");
        const requiredPaddingPG = await smPaddingPG.execute(cmPols.PaddingPG, requiredMain.PaddingPG);
        console.log("Exec PoseidonG...");
        const allPoseidonG = [ ...requiredMain.PoseidonG, ...requiredPaddingPG.PoseidonG, ...requiredStorage.PoseidonG ];
        await smPoseidonG.execute(cmPols.PoseidonG, allPoseidonG);

        console.log("Exec Arith...");
        await smArith.execute(cmPols.Arith, requiredMain.Arith);
        console.log("Exec Binary...");
        await smBinary.execute(cmPols.Binary, requiredMain.Binary);*/
        const res = await verifyPil(Fr, pil, cmPols, constPols);

/*
        const index = 2;
        const pos = index * 64;  // 64 clocks * nth use of statemachine

        let values;
        with (cmPols.MemAlign) {
            values = {
                wr: wr[pos],
                m0_0: m0[0][pos], m0_1: m0[1][pos], m0_2: m0[2][pos], m0_3: m0[3][pos], m0_4: m0[4][pos], m0_5: m0[5][pos], m0_6: m0[6][pos], m0_7: m0[7][pos],
                m1_0: m1[0][pos], m1_1: m1[1][pos], m1_2: m1[2][pos], m1_3: m1[3][pos], m1_4: m1[4][pos], m1_5: m1[5][pos], m1_6: m1[6][pos], m1_7: m1[7][pos],
                v_0: v[0][pos], v_1: v[1][pos], v_2: v[2][pos], v_3: v[3][pos], v_4: v[4][pos], v_5: v[5][pos], v_6: v[6][pos], v_7: v[7][pos],
                offset: offset[pos],
                w0_0: w0[0][pos], w0_1: w0[1][pos], w0_2: w0[2][pos], w0_3: w0[3][pos], w0_4: w0[4][pos], w0_5: w0[5][pos], w0_6: w0[6][pos], w0_7: w0[7][pos],
                w0_0: w0[0][pos], w0_1: w0[1][pos], w0_2: w0[2][pos], w0_3: w0[3][pos], w0_4: w0[4][pos], w0_5: w0[5][pos], w0_6: w0[6][pos], w0_7: w0[7][pos],
            };
        }
        console.log(values);
*/
        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });


});
