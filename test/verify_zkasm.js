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
const smMemAlign = require("../src/sm/sm_mem_align/sm_mem_align.js");
const smMem = require("../src/sm/sm_mem.js");
const smBits2Field = require("../src/sm/sm_bits2field.js");
const smPaddingKK = require("../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require("../src/sm/sm_padding_pg.js");
const smPoseidonG = require("../src/sm/sm_poseidong.js");
const smRom = require("../src/sm/sm_rom.js");
const smStorage = require("../src/sm/sm_storage/sm_storage.js");
const smClimbKey = require("../src/sm/sm_climb_key.js");
const smPaddingSha256 = require("../src/sm/sm_padding_sha256.js");
const smPaddingSha256Bit = require("../src/sm/sm_padding_sha256bit/sm_padding_sha256bit.js");
const smBits2FieldSha256 = require("../src/sm/sm_bits2field_sha256.js");
const smSha256F = require("../src/sm/sm_sha256f/sm_sha256f.js");

module.exports.verifyZkasm = async function (zkasmFile, pilVerification = true, pilConfig = {},  mainConfig = {}, zkasmConfig = {}) {

    const Fr = new F1Field("0xFFFFFFFF00000001");

    /*
        pilConfig example:
        { defines: {N: 2 ** 18},
          namespaces: ['Main','Global'] }
    */

    const blob = mainConfig.blob ?? false;
    const targetPrefix = blob ? 'blob_':'';
    const targetSuffix = blob ? '_blob':'';

    const verifyPilFlag = pilVerification ? true: false;
    let verifyPilConfig = pilVerification instanceof Object ? pilVerification:{};
    const pilFile = verifyPilConfig.pilFile || `pil/main${targetSuffix}.pil`;

    const pil = await compile(Fr, pilFile, null,  pilConfig);
    if (pilConfig.defines && pilConfig.defines.N) {
        console.log('Force use N = 2 ** '+Math.log2(pilConfig.defines.N));
    }

    const constPols =  (mainConfig && mainConfig.constants === false) ? false : newConstantPolsArray(pil);
    const cmPols =  newCommitPolsArray(pil);
    const polDeg = cmPols.$$defArray[0].polDeg;
    const N = polDeg;
    console.log('PIL N = 2 ** '+Math.log2(polDeg));

    const inputContent = await fs.promises.readFile(path.join(__dirname, "inputs", `${targetPrefix}empty_input.json`));
    const input = JSON.parse(inputContent, "utf8");
    const zkasmFinalFilename = (zkasmFile.startsWith('/') || zkasmConfig.compileFromString) ? zkasmFile : path.join(__dirname, "zkasm", zkasmFile);

    const rom = await zkasm.compile(zkasmFinalFilename, null, zkasmConfig);

    if (mainConfig && mainConfig.romFilename) {
        await fs.promises.writeFile(mainConfig.romFilename, JSON.stringify(rom, null, 1) + "\n");
        console.log(`ROM successfully written to file: ${mainConfig.romFilename}`);
    }

    if (constPols.Global) {
        console.log("Building the constant polynomials for the Global SM ...");
        await smGlobal.buildConstants(constPols.Global);
    }
    if (constPols.Main) {
        console.log("Building the constant polynomials for the Main SM ...");
        await smMain.buildConstants(constPols.Main);
    }
    if (constPols.Rom) {
        console.log("Building the constant polynomials for the Rom SM ...");
        await smRom.buildConstants(constPols.Rom, rom);
    }
    if (constPols.PaddingKK) {
        console.log("Building the constant polynomials for the PaddingKK SM ...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
    }
    if (constPols.PaddingKKBit) {
        console.log("Building the constant polynomials for the PaddingKKBit SM ...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
    }
    if (constPols.Bits2Field) {
        console.log("Building the constant polynomials for the Bits2Field SM ...");
        await smBits2Field.buildConstants(constPols.Bits2Field);
    }
    if (constPols.KeccakF) {
        console.log("Building the constant polynomials for the KeccakF SM ...");
        await smKeccakF.buildConstants(constPols.KeccakF);
    }
    if (constPols.PaddingSha256) {
        console.log("Building the constant polynomials for the PaddingSha256 SM ...");
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
    }
    if (constPols.PaddingSha256Bit) {
        console.log("Building the constant polynomials for the PaddingKKBit SM ...");
        await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);
    }
    if (constPols.Bits2FieldSha256) {
        console.log("Building the constant polynomials for the Bits2FieldSha256 SM ...");
        await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);
    }
    if (constPols.Sha256F) {
        console.log("Building the constant polynomials for the Sha256F SM ...");
        await smSha256F.buildConstants(constPols.Sha256F);
    }
    if (constPols.Mem) {
        console.log("Building the constant polynomials for the Mem SM ...");
        await smMem.buildConstants(constPols.Mem);
    }
    if (constPols.PaddingPG) {
        console.log("Building the constant polynomials for the PaddingPG SM ...");
        await smPaddingPG.buildConstants(constPols.PaddingPG);
    }
    if (constPols.PoseidonG) {
        console.log("Building the constant polynomials for the PoseidonG SM ...");
        await smPoseidonG.buildConstants(constPols.PoseidonG);
    }
    if (constPols.Storage) {
        console.log("Building the constant polynomials for the Storage SM ...");
        await smStorage.buildConstants(constPols.Storage);
    }
    if (constPols.MemAlign) {
        console.log("Building the constant polynomials for the MemAlign SM ...");
        await smMemAlign.buildConstants(constPols.MemAlign);
    }
    if (constPols.Arith) {
        console.log("Building the constant polynomials for the Arith SM ...");
        await smArith.buildConstants(constPols.Arith);
    }
    if (constPols.Binary) {
        console.log("Building the constant polynomials for the Binary SM ...");
        await smBinary.buildConstants(constPols.Binary);
    }

    if (constPols.ClimbKey) {
        console.log("Building the constant polynomials for the ClimbKey SM ...");
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

    console.log("Executing the Main SM ...");
    const requiredMain = await smMain.execute(cmPols.Main, input, rom, mainConfig);
    console.log(requiredMain.counters);

    if (!mainConfig || !mainConfig.fastDebugExit) {
        if (cmPols.PaddingKK) console.log("Executing the PaddingKK SM ...");
        const requiredKK = cmPols.PaddingKK ? await smPaddingKK.execute(cmPols.PaddingKK, requiredMain.PaddingKK) : false;

        if (cmPols.PaddingKKBit) console.log("Executing the PaddingKKbit SM ...");
        const requiredKKbit = cmPols.PaddingKKBit ? await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit) : false;

        if (cmPols.Bits2Field) console.log("Executing the Bits2Field SM ...");
        const requiredBits2Field = cmPols.Bits2Field ? await smBits2Field.execute(cmPols.Bits2Field, requiredKKbit.Bits2Field) : false;

        if (cmPols.KeccakF) console.log("Executing the KeccakF SM ...");
        const requiredKeccakF = cmPols.KeccakF ? await smKeccakF.execute(cmPols.KeccakF, requiredBits2Field.KeccakF) : false;

        if (cmPols.MemAlign) {
            console.log("Executing the MemAlign SM ...");
            await smMemAlign.execute(cmPols.MemAlign, requiredMain.MemAlign || []);
        } else if (verifyPilFlag && requiredMain.MemAlign && requiredMain.MemAlign.length) {
            console.log(`WARNING: Namespace MemAlign isn't included, but there are ${requiredMain.MemAlign.length} MemAlign operations`);
        }

        if (cmPols.Mem) {
            console.log("Executing the Mem SM ...");
            await smMem.execute(cmPols.Mem, requiredMain.Mem || []);
        } else if (verifyPilFlag && requiredMain.Mem && requiredMain.Mem.length) {
            console.log(`WARNING: Namespace Mem isn't included, but there are ${requiredMain.Mem.length} Mem operations`);
        }

        if (cmPols.Storage) console.log("Executing the Storage SM ...");
        const requiredStorage = cmPols.Storage ? await smStorage.execute(cmPols.Storage, requiredMain.Storage || []) : false;


        if (!cmPols.Storage && verifyPilFlag && requiredMain.Storage && requiredMain.Storage.length) {
            console.log(`WARNING: Namespace Storage isn't included, but there are ${requiredMain.Storage.length} Storage operations`);
        }


        if (cmPols.PaddingPG) console.log("Executing the PaddingPG SM ...");
        const requiredPaddingPG = cmPols.PaddingPG ? await smPaddingPG.execute(cmPols.PaddingPG,  requiredMain.PaddingPG || []) : false;

        const allPoseidonG = [ ...(requiredMain.PoseidonG || []), ...(requiredPaddingPG.PoseidonG || []), ...(requiredStorage.PoseidonG || []) ];
        console.log('POSEIDONS='+allPoseidonG.length);
        if (cmPols.PoseidonG) {
            console.log("Executing the PoseidonG SM ...");
            await smPoseidonG.execute(cmPols.PoseidonG, allPoseidonG);
        } else if (verifyPilFlag && allPoseidonG.length) {
            console.log(`WARNING: Namespace PoseidonG isn't included, but there are ${allPoseidonG.length} PoseidonG operations `+
                            `(main: ${requiredMain.PoseidonG}, paddingPG: ${requiredPaddingPG.PoseidonG}, storage: ${requiredStorage.PoseidonG})`);
        }

        if (cmPols.PaddingSha256) console.log("Executing the PaddingSha256 SM ...");
        const requiredSha256 = cmPols.PaddingSha256 ? await smPaddingSha256.execute(cmPols.PaddingSha256, requiredMain.PaddingSha256 || []) : false;

        if (cmPols.PaddingSha256Bit) console.log("Executing the PaddingSha256bit SM ...");
        const requiredSha256Bit = cmPols.PaddingSha256Bit ? await smPaddingSha256Bit.execute(cmPols.PaddingSha256Bit, requiredSha256.paddingSha256Bit || []): false;

        if (cmPols.Bits2FieldSha256) console.log("Executing the Bits2FieldSha256 SM ...");
        const requiredBits2FieldSha256 = cmPols.Bits2FieldSha256 ? await smBits2FieldSha256.execute(cmPols.Bits2FieldSha256, requiredSha256Bit.Bits2FieldSha256 || []) : false;

        if (cmPols.Sha256F) {
            console.log("Executing the Sha256F SM ...");
            await smSha256F.execute(cmPols.Sha256F, requiredBits2FieldSha256.Sha256F || []);
        } else if (verifyPilFlag && requiredBits2FieldSha256.Sha256F) {
            console.log(`WARNING: Namespace Sha256F isn't included, but there are ${requiredBits2FieldSha256.Sha256F.length} Sha256F operations`);
        }

        if (cmPols.Arith) {
            console.log("Executing the Arith SM ...");
            await smArith.execute(cmPols.Arith, requiredMain.Arith || []);
        } else if (verifyPilFlag && requiredMain.Arith && requiredMain.Arith.length) {
            console.log(`WARNING: Namespace Arith isn't included, but there are ${requiredMain.Arith.length} Arith operations`);
        }

        if (cmPols.Binary) {
            console.log("Executing the Binary SM ...");
            await smBinary.execute(cmPols.Binary, requiredMain.Binary || []);
        } else if (verifyPilFlag && requiredMain.Binary && requiredMain.Binary.length) {
            console.log(`WARNING: Namespace Binary isn't included, but there are ${requiredMain.Binary.length} Binary operations`);
        }

        if (cmPols.ClimbKey) {
            console.log("Executing the ClimbKey SM ...");
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

        if (mainConfig && mainConfig.constFilename && constPols !== false) {
            await constPols.saveToFile(mainConfig.constFilename);
            console.log(`Constant polynomials successfully written to file: ${mainConfig.constFilename}`);
        }

        if (mainConfig && mainConfig.commitFilename) {
            await cmPols.saveToFile(mainConfig.commitFilename);
            console.log(`Committed polynomials successfully written to file: ${mainConfig.commitFilename}`);
        }

        if (mainConfig && mainConfig.pilJsonFilename) {
            fs.writeFileSync(mainConfig.pilJsonFilename, JSON.stringify(pil));
            console.log(`PIL successfully written to file: ${mainConfig.pilJsonFilename}`);
        }
    }

    if (mainConfig && mainConfig.externalPilVerification) {
        console.log(`Call external pilverify with: ${mainConfig.commitFilename} -c ${mainConfig.constFilename} -p ${mainConfig.pilJsonFilename}`);
    } else if (constPols !== false) {
        if (verifyPilConfig.publics) {
            if (!(verifyPilConfig.publics instanceof Object)) {
                const publicsFilename = (typeof verifyPilConfig.public === 'string') ? verifyPilConfig.public : path.join(__dirname, "..", "tools", "build-genesis", `${targetPrefix}public.json`);
                verifyPilConfig.publics = JSON.parse(await fs.promises.readFile(publicsFilename, "utf8"));
            }
        }
        const res = verifyPilFlag ? await verifyPil(Fr, pil, cmPols , constPols, verifyPilConfig) : [];

        if (res.length != 0) {
            console.log("PIL does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    }
}


