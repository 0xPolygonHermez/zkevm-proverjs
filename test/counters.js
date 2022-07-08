const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;
const fs = require("fs");
const path = require("path");
const zkasm = require("@polygon-hermez/zkasm");

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("zkpil");


const smArith = require("../src/sm/sm_arith.js");
const smBinary = require("../src/sm/sm_binary.js");
const smByte4 = require("../src/sm/sm_byte4.js");
const smGlobal = require("../src/sm/sm_global.js");
const smKeccakF = require("../src/sm/sm_keccakf.js");
const smMain = require("../src/sm/sm_main.js");
const smMemAlign = require("../src/sm/sm_mem_align.js");
const smMem = require("../src/sm/sm_mem.js");
const smNine2One = require("../src/sm/sm_nine2one.js");
const smNormGate9 = require("../src/sm/sm_norm_gate9.js");
const smPaddingKK = require("../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../src/sm/sm_padding_kkbit.js");
const smPaddingPG = require("../src/sm/sm_padding_pg.js");
const smPoseidonG = require("../src/sm/sm_poseidong.js");
const smRom = require("../src/sm/sm_rom.js");
const smStorage = require("../src/sm/sm_storage.js");

describe("test main sm", async function () {
    this.timeout(10000000);

    it("It should create the pols main", async () => {
        const Fr = new F1Field("0xFFFFFFFF00000001");
        const brief = true;
        const pil = await compile(Fr, "pil/main.pil", null, brief ? {defines: {N: 2**16}}:{});

        const [constPols, constPolsArray, constPolsDef] =  createConstantPols(pil);
        const [cmPols, cmPolsArray, cmPolsDef] =  createCommitedPols(pil);

        const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "testvectors", "input_executor.json"), "utf8"));
        const rom = await zkasm.compile(path.join(__dirname, "zkasm", "counters.zkasm"));

        console.log("Const Global...");
        await smGlobal.buildConstants(constPols.Global, constPolsDef.Global);
        console.log("Const Main...");
        await smMain.buildConstants(constPols.Main, constPolsDef.Main);

        if (!brief) {
            console.log("Const Rom...");
            await smRom.buildConstants(constPols.Rom, constPolsDef.Rom, rom);
            console.log("Const Byte4...");
            await smByte4.buildConstants(constPols.Byte4, constPolsDef.Byte4);
            console.log("Const PaddingKK...");
            await smPaddingKK.buildConstants(constPols.PaddingKK, constPolsDef.PaddingKK);
            console.log("Const PaddingKKBits...");
            await smPaddingKKBit.buildConstants(constPols.PaddingKKBit, constPolsDef.PaddingKKBit);
            console.log("Const Nine2One...");
            await smNine2One.buildConstants(constPols.Nine2One, constPolsDef.Nine2One);
            console.log("Const KeccakF...");
            await smKeccakF.buildConstants(constPols.KeccakF, constPolsDef.KeccakF);
            console.log("Const Mem...");
            await smMem.buildConstants(constPols.Mem, constPolsDef.Mem);
            console.log("Const PaddingPG...");
            await smPaddingPG.buildConstants(constPols.PaddingPG, constPolsDef.PaddingPG);
            console.log("Const PoseidonG...");
            await smPoseidonG.buildConstants(constPols.PoseidonG, constPolsDef.PoseidonG);
        }

        console.log("Const Storage...");
        await smStorage.buildConstants(constPols.Storage, constPolsDef.Storage);

        if (!brief) {
            console.log("Const MemAlign...");
            await smMemAlign.buildConstants(constPols.MemAlign, constPolsDef.MemAlign);
            console.log("Const NormGate9...");
            await smNormGate9.buildConstants(constPols.NormGate9, constPolsDef.NormGate9);
            console.log("Const Arith...");
            await smArith.buildConstants(constPols.Arith, constPolsDef.Arith);
            console.log("Const Binary...");
            await smBinary.buildConstants(constPols.Binary, constPolsDef.Binary);
        }

        const requiredMain = await smMain.execute(cmPols.Main, cmPolsDef.Main, input, rom);
        // console.log(requiredMain.Storage);

        if (!brief) {
            console.log("Exec Byte4...");
            await smByte4.execute(cmPols.Byte4, cmPolsDef.Byte4, requiredMain.Byte4);
            console.log("Exec PaddingKK...");
            const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, cmPolsDef.PaddingKK, requiredMain.PaddingKK);
            console.log("Exec PaddingKKbit...");
            const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, cmPolsDef.PaddingKKBit, requiredKK.paddingKKBits);
            console.log("Exec Nine2One...");
            const requiredNine2One = await smNine2One.execute(cmPols.Nine2One, cmPolsDef.Nine2One, requiredKKbit.Nine2One);
            console.log("Exec KeccakF...");
            const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, cmPolsDef.KeccakF, requiredNine2One.KeccakF);
            console.log("Exec NormGate9...");
            await smNormGate9.execute(cmPols.NormGate9, cmPolsDef.NormGate9, requiredKeccakF.NormGate9);
            console.log("Exec MemAlign...");
            await smMemAlign.execute(cmPols.MemAlign, cmPolsDef.MemAlign, requiredMain.MemAlign);
            console.log("Exec Mem...");
            await smMem.execute(cmPols.Mem, cmPolsDef.Mem, requiredMain.Mem);
        }
        console.log("Exec Storage...");
        const requiredStorage = await smStorage.execute(cmPols.Storage, cmPolsDef.Storage, requiredMain.Storage);

        let pos = 0;
        let toI = 2**21;
        for (let i = 0; i < toI; ++i) {
            if (cmPols.Main.sWR[i]) {
                console.log(`======== MAIN WR POS:${pos} ========`);
                console.log([pos++, i, cmPols.Main.sWR[i],
                cmPols.Main.SR0[i] + 2n**32n*cmPols.Main.SR1[i], cmPols.Main.SR2[i] + 2n**32n*cmPols.Main.SR3[i], cmPols.Main.SR4[i] + 2n**32n*cmPols.Main.SR5[i], cmPols.Main.SR6[i] + 2n**32n*cmPols.Main.SR7[i],
                cmPols.Main.sKey[0][i], cmPols.Main.sKey[1][i], cmPols.Main.sKey[2][i], cmPols.Main.sKey[3][i],
                cmPols.Main.D0[i], cmPols.Main.D1[i], cmPols.Main.D2[i], cmPols.Main.D3[i],
                cmPols.Main.D4[i], cmPols.Main.D5[i], cmPols.Main.D6[i], cmPols.Main.D7[i],
                cmPols.Main.FREE0[i] + 2n**32n*cmPols.Main.FREE1[i], cmPols.Main.FREE2[i] + 2n**32n*cmPols.Main.FREE3[i], cmPols.Main.FREE4[i] + 2n**32n*cmPols.Main.FREE5[i], cmPols.Main.FREE6[i] + 2n**32n*cmPols.Main.FREE7[i],
                cmPols.Main.incCounter[i]]);
            } else if (cmPols.Main.sRD[i]) {
                console.log(`======== MAIN RD POS:${pos} ========`);
                console.log([pos++, i, cmPols.Main.sRD[i],
                cmPols.Main.SR0[i] + 2n**32n*cmPols.Main.SR1[i], cmPols.Main.SR2[i] + 2n**32n*cmPols.Main.SR3[i], cmPols.Main.SR4[i] + 2n**32n*cmPols.Main.SR5[i], cmPols.Main.SR6[i] + 2n**32n*cmPols.Main.SR7[i],
                cmPols.Main.sKey[0][i], cmPols.Main.sKey[1][i], cmPols.Main.sKey[2][i], cmPols.Main.sKey[3][i],
                cmPols.Main.FREE0[i], cmPols.Main.FREE1[i], cmPols.Main.FREE2[i], cmPols.Main.FREE3[i],
                cmPols.Main.FREE4[i], cmPols.Main.FREE5[i], cmPols.Main.FREE6[i], cmPols.Main.FREE7[i],
                cmPols.Main.incCounter[i]]);
            }
        };

        pos = 0;
        toI = 2**21;
        for (let i = 0; i < toI; ++i) {
            if (cmPols.Storage.iLatchSet[i]) {
                console.log(`======== STORAGE WR POS:${pos} ========`);
                console.log([pos++, i, cmPols.Storage.iLatchSet[i],
                    cmPols.Storage.oldRoot0[i], cmPols.Storage.oldRoot1[i], cmPols.Storage.oldRoot2[i], cmPols.Storage.oldRoot3[i],
                    cmPols.Storage.rkey0[i], cmPols.Storage.rkey1[i], cmPols.Storage.rkey2[i], cmPols.Storage.rkey3[i],
                    cmPols.Storage.valueLow0[i], cmPols.Storage.valueLow1[i], cmPols.Storage.valueLow2[i], cmPols.Storage.valueLow3[i],
                    cmPols.Storage.valueHigh0[i], cmPols.Storage.valueHigh1[i], cmPols.Storage.valueHigh2[i], cmPols.Storage.valueHigh3[i],
                    cmPols.Storage.newRoot0[i], cmPols.Storage.newRoot1[i], cmPols.Storage.newRoot2[i], cmPols.Storage.newRoot3[i],
                    cmPols.Storage.incCounter[i] + 2n]);
            } else if (cmPols.Storage.iLatchGet[i]) {
                console.log(`======== STORAGE RD POS:${pos} ========`);
                console.log([pos++, i, cmPols.Storage.iLatchGet[i],
                    cmPols.Storage.oldRoot0[i], cmPols.Storage.oldRoot1[i], cmPols.Storage.oldRoot2[i], cmPols.Storage.oldRoot3[i],
                    cmPols.Storage.rkey0[i], cmPols.Storage.rkey1[i], cmPols.Storage.rkey2[i], cmPols.Storage.rkey3[i],
                    cmPols.Storage.valueLow0[i], cmPols.Storage.valueLow1[i], cmPols.Storage.valueLow2[i], cmPols.Storage.valueLow3[i],
                    cmPols.Storage.valueHigh0[i], cmPols.Storage.valueHigh1[i], cmPols.Storage.valueHigh2[i], cmPols.Storage.valueHigh3[i],
                    cmPols.Storage.incCounter[i] + 2n]);
            }
        };

        if (!brief) {
            console.log("Exec PaddingPG...");
            const requiredPaddingPG = await smPaddingPG.execute(cmPols.PaddingPG, cmPolsDef.PaddingPG, requiredMain.PaddingPG);
            console.log("Exec PoseidonG...");
            const allPoseidonG = [ ...requiredMain.PoseidonG, ...requiredPaddingPG.PoseidonG, ...requiredStorage.PoseidonG ];
            await smPoseidonG.execute(cmPols.PoseidonG, cmPolsDef.PoseidonG, allPoseidonG);

            console.log("Exec Arith...");
            await smArith.execute(cmPols.Arith, cmPolsDef.Arith, requiredMain.Arith);
            console.log("Exec Binary...");
            await smBinary.execute(cmPols.Binary, cmPolsDef.Binary, requiredMain.Binary);
        }
        const res = brief ? [] : await verifyPil(Fr, pil, cmPolsArray , constPolsArray);

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
