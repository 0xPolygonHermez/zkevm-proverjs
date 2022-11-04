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
const smNine2One = require("../src/sm/sm_nine2one.js");
const smNormGate9 = require("../src/sm/sm_norm_gate9.js");
const smPaddingKK = require("../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require("../src/sm/sm_padding_pg.js");
const smPoseidonG = require("../src/sm/sm_poseidong.js");
const smRom = require("../src/sm/sm_rom.js");
const smStorage = require("../src/sm/sm_storage/sm_storage.js");
const { index } = require("../src/sm/sm_main/test_tools.js");
const { config } = require("yargs");

module.exports.verifyZkasm = async function (zkasmFile, verifyPilFlag = true, pilConfig = {}, mainConfig = {}) {

    const Fr = new F1Field("0xFFFFFFFF00000001");
    const brief = false;

    /*
        pilConfig example:
        { defines: {N: 2 ** 18},
          namespaces: ['Main','Global'] }
    */

    const pil = await compile(Fr, "pil/main.pil", null,  pilConfig);
    if (pilConfig.defines && pilConfig.defines.N) {
        console.log('force use N = 2 ** '+Math.log2(pilConfig.defines.N));
    }

    const constPols =  newConstantPolsArray(pil);
    const cmPols =  newCommitPolsArray(pil);
    const polDeg = cmPols.$$defArray[0].polDeg;
    console.log('Pil N = 2 ** '+Math.log2(polDeg));

    const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "tools", "build-genesis", "input_executor.json"), "utf8"));
    const rom = await zkasm.compile(path.join(__dirname, "zkasm", zkasmFile));

    if (constPols.Global) {
        console.log("Const Global...");
        await smGlobal.buildConstants(constPols.Global);
    }
    if (constPols.Main) {
        console.log("Const Main...");
        await smMain.buildConstants(constPols.Main);
    }
    if (constPols.Rom) {
        console.log("Const Rom...");
        await smRom.buildConstants(constPols.Rom, rom);
    }
    if (constPols.PaddingKK) {
        console.log("Const PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
    }
    if (constPols.PaddingKKBit) {
        console.log("Const PaddingKKBit...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
    }
    if (constPols.Nine2One) {
        console.log("Const Nine2One...");
        await smNine2One.buildConstants(constPols.Nine2One);
    }
    if (constPols.KeccakF) {
        console.log("Const KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);
    }
    if (constPols.NormGate9) {
        console.log("Const NormGate9...");
        await smNormGate9.buildConstants(constPols.NormGate9);
    }
    if (constPols.Mem) {
        console.log("Const Mem...");
        await smMem.buildConstants(constPols.Mem);
    }
    if (constPols.PaddingPG) {
        console.log("Const PaddingPG...");
        await smPaddingPG.buildConstants(constPols.PaddingPG);
    }
    if (constPols.PoseidonG) {
        console.log("Const PoseidonG...");
        await smPoseidonG.buildConstants(constPols.PoseidonG);
    }
    if (constPols.Storage) {
        console.log("Const Storage...");
        await smStorage.buildConstants(constPols.Storage);
    }
    if (constPols.MemAlign) {
        console.log("Const MemAlign...");
        await smMemAlign.buildConstants(constPols.MemAlign);
    }
    if (constPols.Arith) {
        console.log("Const Arith...");
        await smArith.buildConstants(constPols.Arith);
    }
    if (constPols.Binary) {
        console.log("Const Binary...");
        await smBinary.buildConstants(constPols.Binary);
    }

    const requiredMain = await smMain.execute(cmPols.Main, input, rom, mainConfig);

    if (cmPols.PaddingKK) console.log("Exec PaddingKK...");
    const requiredKK = cmPols.PaddingKK ? await smPaddingKK.execute(cmPols.PaddingKK, requiredMain.PaddingKK) : false;

    if (cmPols.PaddingKKBit) console.log("Exec PaddingKKbit...");
    const requiredKKbit = cmPols.PaddingKKBit ? await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit) : false;

    if (cmPols.Nine2One) console.log("Exec Nine2One...");
    const requiredNine2One = cmPols.Nine2One ? await smNine2One.execute(cmPols.Nine2One, requiredKKbit.Nine2One) : false;

    if (cmPols.KeccakF) console.log("Exec KeccakF...");
    const requiredKeccakF = cmPols.KeccakF ? await smKeccakF.execute(cmPols.KeccakF, requiredNine2One.KeccakF) : false;

    if (cmPols.NormGate9) {
        console.log("Exec NormGate9...");
        await smNormGate9.execute(cmPols.NormGate9, requiredKeccakF.NormGate9);
    } else if (verifyPilFlag && requiredMain.PaddingKK.length) {
        console.log(`WARNING: Namespace PaddingKK isn't included, but there are ${requiredMain.PaddingKK.length} PaddingKK operations`);
    }
    if (cmPols.MemAlign) {
        console.log("Exec MemAlign...");
        await smMemAlign.execute(cmPols.MemAlign, requiredMain.MemAlign || []);
    } else if (verifyPilFlag && requiredMain.MemAlign && requiredMain.MemAlign.length) {
        console.log(`WARNING: Namespace MemAlign isn't included, but there are ${requiredMain.MemAlign.length} MemAlign operations`);
    }

    if (cmPols.Mem) {
        console.log("Exec Mem...");
        await smMem.execute(cmPols.Mem, requiredMain.Mem || []);
    } else if (verifyPilFlag && requiredMain.Mem && requiredMain.Mem.length) {
        console.log(`WARNING: Namespace Mem isn't included, but there are ${requiredMain.Mem.length} Mem operations`);
    }

    if (cmPols.Storage) console.log("Exec Storage...");
    const requiredStorage = cmPols.Storage ? await smStorage.execute(cmPols.Storage, requiredMain.Storage || []) : false;


    if (!cmPols.Storage && verifyPilFlag && requiredMain.Storage && requiredMain.Storage.length) {
        console.log(`WARNING: Namespace Storage isn't included, but there are ${requiredMain.Storage.length} Storage operations`);
    }


    if (cmPols.PaddingPG) console.log("Exec PaddingPG...");
    const requiredPaddingPG = cmPols.PaddingPG ? await smPaddingPG.execute(cmPols.PaddingPG,  requiredMain.PaddingPG || []) : false;

    const allPoseidonG = [ ...(requiredMain.PoseidonG || []), ...(requiredPaddingPG.PoseidonG || []), ...(requiredStorage.PoseidonG || []) ];
    if (cmPols.PoseidonG) {
        console.log("Exec PoseidonG...");
        await smPoseidonG.execute(cmPols.PoseidonG, allPoseidonG);
    } else if (verifyPilFlag && allPoseidonG.length) {
        console.log(`WARNING: Namespace PoseidonG isn't included, but there are ${allPoseidonG.length} PoseidonG operations `+
                        `(main: ${requiredMain.PoseidonG}, paddingPG: ${requiredPaddingPG.PoseidonG}, storage: ${requiredStorage.PoseidonG})`);
    }

    if (cmPols.Arith) {
        console.log("Exec Arith...");
        await smArith.execute(cmPols.Arith, requiredMain.Arith || []);
    } else if (verifyPilFlag && requiredMain.Arith && requiredMain.Arith.length) {
        console.log(`WARNING: Namespace Arith isn't included, but there are ${requiredMain.Arith.length} Arith operations`);
    }

    if (cmPols.Binary) {
        console.log("Exec Binary...");
        await smBinary.execute(cmPols.Binary, requiredMain.Binary || []);
    } else if (verifyPilFlag && requiredMain.Binary && requiredMain.Binary.length) {
        console.log(`WARNING: Namespace Binary isn't included, but there are ${requiredMain.Binary.length} Binary operations`);
    }

    const res = verifyPilFlag ? await verifyPil(Fr, pil, cmPols , constPols) : [];

    if (res.length != 0) {
        console.log("Pil does not pass");
        for (let i=0; i<res.length; i++) {
            console.log(res[i]);
        }
        assert(0);
    }
}


