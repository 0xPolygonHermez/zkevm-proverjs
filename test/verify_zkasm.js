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
const smPaddingPG = require("../src/sm/sm_padding_pg.js");
const smPoseidonG = require("../src/sm/sm_poseidong.js");
const smRom = require("../src/sm/sm_rom.js");
const smStorage = require("../src/sm/sm_storage/sm_storage.js");
const smClimbKey = require("../src/sm/sm_climb_key.js");
const { config } = require("yargs");

module.exports.verifyZkasm = async function (zkasmFile, pilVerification = true, pilConfig = {}, mainConfig = {}) {

    const Fr = new F1Field("0xFFFFFFFF00000001");
    const brief = false;

    /*
        pilConfig example:
        { defines: {N: 2 ** 18},
          namespaces: ['Main','Global'] }
    */

    const verifyPilFlag = pilVerification ? true: false;
    let verifyPilConfig = pilVerification instanceof Object ? pilVerification:{};
    const pilFile = verifyPilConfig.pilFile || "pil/main.pil"

    const pil = await compile(Fr, pilFile, null,  pilConfig);
    if (pilConfig.defines && pilConfig.defines.N) {
        console.log('force use N = 2 ** '+Math.log2(pilConfig.defines.N));
    }

    const constPols =  (mainConfig && mainConfig.constants === false) ? false : newConstantPolsArray(pil);
    const cmPols =  newCommitPolsArray(pil);
    const polDeg = cmPols.$$defArray[0].polDeg;
    const N = polDeg;
    console.log('Pil N = 2 ** '+Math.log2(polDeg));

    const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "inputs", "empty_input.json"), "utf8"));
    const zkasmFinalFilename = zkasmFile.startsWith('/') ? zkasmFile : path.join(__dirname, "zkasm", zkasmFile);
    console.log(zkasmFinalFilename);
    const rom = await zkasm.compile(zkasmFinalFilename);

    if (mainConfig && mainConfig.romFilename) {
        await fs.promises.writeFile(mainConfig.romFilename, JSON.stringify(rom, null, 1) + "\n");
    }

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
    if (constPols.Bits2Field) {
        console.log("Const Bits2Field...");
        await smBits2Field.buildConstants(constPols.Bits2Field);
    }
    if (constPols.KeccakF) {
        console.log("Const KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);
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

    if (constPols.ClimbKey) {
        console.log("Const ClimbKey...");
        await smClimbKey.buildConstants(constPols.ClimbKey);
    }

    if (constPols !== false) {
        for (let i=0; i<constPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                const type = typeof constPols.$$array[i][j];
                if (type !== 'bigint') {
                    if (type === 'undefined') {
                        throw new Error(`Polinomial not fited ${constPols.$$defArray[i].name} at ${j}` );
                    } else {
                        throw new Error(`Polinomial not valid type (${type}) on ${constPols.$$defArray[i].name} at ${j}` );
                    }
                }
            }
        }
    }

    console.log("Exec Main...");
    const requiredMain = await smMain.execute(cmPols.Main, input, rom, mainConfig);
    console.log(requiredMain.counters);

    if (!mainConfig || !mainConfig.fastDebugExit) {
        if (cmPols.PaddingKK) console.log("Exec PaddingKK...");
        const requiredKK = cmPols.PaddingKK ? await smPaddingKK.execute(cmPols.PaddingKK, requiredMain.PaddingKK) : false;

        if (cmPols.PaddingKKBit) console.log("Exec PaddingKKbit...");
        const requiredKKbit = cmPols.PaddingKKBit ? await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit) : false;

        if (cmPols.Bits2Field) console.log("Exec Bits2Field...");
        const requiredBits2Field = cmPols.Bits2Field ? await smBits2Field.execute(cmPols.Bits2Field, requiredKKbit.Bits2Field) : false;

        if (cmPols.KeccakF) console.log("Exec KeccakF...");
        const requiredKeccakF = cmPols.KeccakF ? await smKeccakF.execute(cmPols.KeccakF, requiredBits2Field.KeccakF) : false;

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
        console.log('POSEIDONS='+allPoseidonG.length);
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

        if (cmPols.ClimbKey) {
            console.log("Exec ClimbKey...");
            await smClimbKey.execute(cmPols.ClimbKey, requiredStorage.ClimbKey || []);
        } else if (verifyPilFlag && requiredStorage.ClimbKey && requiredStorage.ClimbKey.length) {
            console.log(`WARNING: Namespace ClimbKey isn't included, but there are ${requiredStorage.ClimbKey.length} ClimbKey operations`);
        }

        if (!mainConfig.debug) {
            for (let i=0; i<cmPols.$$array.length; i++) {
                for (let j=0; j<N; j++) {
                    const type = typeof cmPols.$$array[i][j];
                    if (type !== 'bigint') {
                        if (type === 'undefined') {
                            throw new Error(`Polinomial not fited ${cmPols.$$defArray[i].name} at ${j}`);
                        } else {
                            throw new Error(`Polinomial not valid type (${type}) on ${cmPols.$$defArray[i].name} at ${j}` );
                        }
                    }
                }
            }
        }

        if (mainConfig && mainConfig.constFilename) {
            await constPols.saveToFile(mainConfig.constFilename);
        }

        if (mainConfig && mainConfig.commitFilename) {
            await cmPols.saveToFile(mainConfig.commitFilename);
        }

        if (mainConfig && mainConfig.pilJsonFilename) {
            fs.writeFileSync(mainConfig.pilJsonFilename, JSON.stringify(pil));
        }
    }

    if (mainConfig && mainConfig.externalPilVerification) {
        console.log(`call external pilverify with: ${mainConfig.commitFilename} -c ${mainConfig.constFilename} -p ${mainConfig.pilJsonFilename}`);
    } else if (constPols !== false) {
        if (verifyPilConfig.publics) {
            if (!(verifyPilConfig.publics instanceof Object)) {
                const publicsFilename = (typeof verifyPilConfig.public === 'string') ? verifyPilConfig.public : path.join(__dirname, "..", "tools", "build-genesis", "public.json");
                verifyPilConfig.publics = JSON.parse(await fs.promises.readFile(publicsFilename, "utf8"));
            }
        }
        const res = verifyPilFlag ? await verifyPil(Fr, pil, cmPols , constPols, verifyPilConfig) : [];

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    }
}


