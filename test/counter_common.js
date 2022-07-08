const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;
const fs = require("fs");
const path = require("path");
const zkasm = require("@polygon-hermez/zkasm");

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("pilcom");


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
const { index } = require("../src/test_tools.js");

const pilModuleInfo = {
    mem_align: {
        selF: ['memAlign', 'memAlignWr'],
        minDegree: 2**21,
        dependencies: []
    },
    arith: {
        selF: ['arith'],
        minDegree: 2**21,
        dependencies: []
    },
    binary: {
        selF: ['bin'],
        minDegree: 2**21,
        dependencies: ['poseidong', 'padding_pg']
    },
    poseidong: {
        selF: ['sRD', 'sWR'],
        minDegree: 2**21,
        dependencies: ['padding_pg', 'storage']
    },
    padding_pg: {
        selF: ['hashP', 'hashPLen', 'hashPDigest'],
        minDegree: 2**21,
        dependencies: ['storage']
    },
    storage: {
        selF: ['sRD', 'sWR', 'hashPDigest'],
        minDegree: 2**21,
        dependencies: ['poseidong', 'padding_pg']
    },
    padding_kk: {
        selF: ['hashK', 'hashKLen', 'hashKDigest'],
        minDegree: 2**21,
        dependencies: []
    },
    mem: {
        selF: ['mOp'],
        minDegree: 2**16,
        dependencies: []
    }
}

function completeExclusionData (exclude)
{
    let res = {excludeModules: [], excludeSelF: [], modules: [], minDegree: 0};
    let index = 0;
    while (index < exclude.length) {
        const module = exclude[index];
        ++index;

        const info = pilModuleInfo[module] ?? false;
        if (info === false) {
            throw new Error(`module ${module} not found, valid modules are: ${Object.keys(pilModuleInfo).join(', ')}`)
        }
        res.modules.push(module);
        res.excludeModules.push(module+'.pil');
        info.dependencies.forEach((dependency) => {
            if (!exclude.includes(dependency)) {
                console.log(`NOTICE: ${dependency} was excluded by ${module} dependency`);
                exclude.push(dependency);
            }
        });
        info.selF.forEach((sel) => {
            if (!res.excludeSelF.includes(sel)) {
                console.log(`NOTICE: selF ${sel} was excluded by ${module}`);
                res.excludeSelF.push(sel);
            }
        });
    }

    // calculate minDegree from rest of enabled modules

    for (const module in pilModuleInfo) {
        if (res.modules.includes(module)) continue;
        if (res.minDegree < pilModuleInfo[module].minDegree) {
            res.minDegree = pilModuleInfo[module].minDegree;
        }
    }
    return res;
}

module.exports.verifyZkasm = async function (zkasmFile, verifyPilFlag = true, exclude = []) {

    const Fr = new F1Field("0xFFFFFFFF00000001");
    const brief = false;

    const exclusions = completeExclusionData(exclude);

    const pilConfig = {
        defines: {N: Math.max(verifyPilFlag ? exclusions.minDegree : 0, 2 ** 16)},
        excludeSelF: exclusions.excludeSelF,
        excludeModules: exclusions.excludeModules
    };

    const pil = await compile(Fr, "pil/main.pil", null,  pilConfig);
    console.log('using N = 2 ** '+Math.log2(pilConfig.defines.N));

    const [constPols, constPolsArray, constPolsDef] =  createConstantPols(pil);
    const [cmPols, cmPolsArray, cmPolsDef] =  createCommitedPols(pil);

    const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "testvectors", "input_executor.json"), "utf8"));
    const rom = await zkasm.compile(path.join(__dirname, "zkasm", zkasmFile));

    console.log("Const Global...");
    await smGlobal.buildConstants(constPols.Global, constPolsDef.Global);
    console.log("Const Main...");
    await smMain.buildConstants(constPols.Main, constPolsDef.Main);

    console.log("Const Rom...");
    await smRom.buildConstants(constPols.Rom, constPolsDef.Rom, rom);
    console.log("Const Byte4...");
    await smByte4.buildConstants(constPols.Byte4, constPolsDef.Byte4);

    const includeArith = verifyPilFlag && !exclusions.modules.includes('arith');
    const includeBinary = verifyPilFlag && !exclusions.modules.includes('binary');
    const includeMem = verifyPilFlag && !exclusions.modules.includes('mem');
    const includeMemAlign = verifyPilFlag && !exclusions.modules.includes('mem_align');
    const includePaddingKK = verifyPilFlag && !exclusions.modules.includes('padding_kk');
    const includePaddingPG = verifyPilFlag && !exclusions.modules.includes('padding_pg');
    const includePoseidonG = verifyPilFlag && !exclusions.modules.includes('poseidong');
    const includeStorage = verifyPilFlag && !exclusions.modules.includes('storage');

    if (includePaddingKK) {
        console.log("Const PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK, constPolsDef.PaddingKK);
        console.log("Const PaddingKKBits...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit, constPolsDef.PaddingKKBit);
        console.log("Const Nine2One...");
        await smNine2One.buildConstants(constPols.Nine2One, constPolsDef.Nine2One);
        console.log("Const KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF, constPolsDef.KeccakF);
        console.log("Const NormGate9...");
        await smNormGate9.buildConstants(constPols.NormGate9, constPolsDef.NormGate9);
    }

    if (includeMem) {
        console.log("Const Mem...");
        await smMem.buildConstants(constPols.Mem, constPolsDef.Mem);
    }

    if (includePaddingPG) {
        console.log("Const PaddingPG...");
        await smPaddingPG.buildConstants(constPols.PaddingPG, constPolsDef.PaddingPG);
    }

    if (includePoseidonG) {
        console.log("Const PoseidonG...");
        await smPoseidonG.buildConstants(constPols.PoseidonG, constPolsDef.PoseidonG);
    }

    if (includeStorage) {
        console.log("Const Storage...");
        await smStorage.buildConstants(constPols.Storage, constPolsDef.Storage);
    }

    if (includeMemAlign) {
        console.log("Const MemAlign...");
        await smMemAlign.buildConstants(constPols.MemAlign, constPolsDef.MemAlign);
    }

    if (includeArith) {
        console.log("Const Arith...");
        await smArith.buildConstants(constPols.Arith, constPolsDef.Arith);
    }

    if (includeBinary) {
        console.log("Const Binary...");
        await smBinary.buildConstants(constPols.Binary, constPolsDef.Binary);
    }

    const requiredMain = await smMain.execute(cmPols.Main, cmPolsDef.Main, input, rom);

    console.log("Exec Byte4...");
    await smByte4.execute(cmPols.Byte4, cmPolsDef.Byte4, requiredMain.Byte4);

    if (includePaddingKK) {
        console.log("Exec PaddingKK...");
        const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, cmPolsDef.PaddingKK, requiredMain.PaddingKK);
/*
        let cp = constPols.PaddingKK; let p = cmPols.PaddingKK;
        const P = 0xFFFFFFFF00000001n;
        for (let i=0; i<5000; ++i)
            if ((cp.lastBlockLatch[i] * (p.spare[i] + (1n - p.rem[i] * p.remInv[i]))) %P) console.log([i, cp.lastBlockLatch[i], p.spare[i], p.rem[i], p.remInv[i], p.incCounter[i]]);

        EXIT_HERE;*/
        console.log("Exec PaddingKKbit...");
        const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, cmPolsDef.PaddingKKBit, requiredKK.paddingKKBits);
        console.log("Exec Nine2One...");
        const requiredNine2One = await smNine2One.execute(cmPols.Nine2One, cmPolsDef.Nine2One, requiredKKbit.Nine2One);
        console.log("Exec KeccakF...");
        const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, cmPolsDef.KeccakF, requiredNine2One.KeccakF);
        console.log("Exec NormGate9...");
        await smNormGate9.execute(cmPols.NormGate9, cmPolsDef.NormGate9, requiredKeccakF.NormGate9);
    } else if (verifyPilFlag && requiredMain.PaddingKK.length) {
        throw new Error(`PaddingKK was excluded, but zkasm has ${requiredMain.PaddingKK.length} PaddingKK operations`);
    }

    if (includeMemAlign) {
        console.log("Exec MemAlign...");
        await smMemAlign.execute(cmPols.MemAlign, cmPolsDef.MemAlign, requiredMain.MemAlign);
    } else if (verifyPilFlag && requiredMain.MemAlign.length) {
        throw new Error(`MemAlign was excluded, but zkasm has ${requiredMain.PaddingKK.length} MemAlign operations`);
    }

    if (includeMem) {
        console.log("Exec Mem...");
        await smMem.execute(cmPols.Mem, cmPolsDef.Mem, requiredMain.Mem);
    } else if (verifyPilFlag && requiredMain.Mem.length) {
        throw new Error(`Mem was excluded, but zkasm has ${requiredMain.Mem.length} Mem operations`);
    }

    if (includeStorage) console.log("Exec Storage...");
    const requiredStorage = includeStorage ? await smStorage.execute(cmPols.Storage, cmPolsDef.Storage, requiredMain.Storage) : {PoseidonG: []};


    if (!includeStorage && verifyPilFlag && requiredMain.Storage.length) {
        throw new Error(`Storage was excluded, but zkasm has ${requiredMain.Storage.length} Storage operations`);
    }


    if (includePaddingPG) console.log("Exec PaddingPG...");
    const requiredPaddingPG = includePaddingPG ? await smPaddingPG.execute(cmPols.PaddingPG, cmPolsDef.PaddingPG, requiredMain.PaddingPG) : {PoseidonG:[]};

    const allPoseidonG = [ ...requiredMain.PoseidonG, ...requiredPaddingPG.PoseidonG, ...requiredStorage.PoseidonG ];
    if (includePoseidonG) {
        console.log("Exec PoseidonG...");
        await smPoseidonG.execute(cmPols.PoseidonG, cmPolsDef.PoseidonG, allPoseidonG);
    } else if (verifyPilFlag && allPoseidonG.length) {
        throw new Error(`PoseidonG was excluded, but zkasm has ${allPoseidonG.length} PoseidonG operations `+
                        `(main: ${requiredMain.PoseidonG}, paddingPG: ${requiredPaddingPG.PoseidonG}, storage: ${requiredStorage.PoseidonG})`);
    }

    if (includeArith) {
        console.log("Exec Arith...");
        await smArith.execute(cmPols.Arith, cmPolsDef.Arith, requiredMain.Arith);
    } else if (verifyPilFlag && requiredMain.Arith.length) {
        throw new Error(`Arith was excluded, but zkasm has ${requiredMain.Arith.length} Arith operations`);
    }

    if (includeBinary) {
        console.log("Exec Binary...");
        await smBinary.execute(cmPols.Binary, cmPolsDef.Binary, requiredMain.Binary);
    } else if (verifyPilFlag && requiredMain.Binary.length) {
        throw new Error(`Binary was excluded, but zkasm has ${requiredMain.Binary.length} Binary operations`);
    }

    const res = verifyPilFlag ? await verifyPil(Fr, pil, cmPolsArray , constPolsArray) : [];

    if (res.length != 0) {
        console.log("Pil does not pass");
        for (let i=0; i<res.length; i++) {
            console.log(res[i]);
        }
        assert(0);
    }
}


