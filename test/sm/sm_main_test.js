const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;
const fs = require("fs");
const path = require("path");

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");

const smPath = '../../src/sm/';
const smArith = require(smPath + "sm_arith/sm_arith.js");
const smBinary = require(smPath + "sm_binary.js");
const smGlobal = require(smPath + "sm_global.js");
const smKeccakF = require(smPath + "sm_keccakf/sm_keccakf.js");
const smMain = require(smPath + "sm_main/sm_main.js");
const smMemAlign = require(smPath + "sm_mem_align.js");
const smMem = require(smPath + "sm_mem.js");
const smBits2Field = require(smPath + "sm_bits2field.js");
const smPaddingKK = require(smPath + "sm_padding_kk.js");
const smPaddingKKBit = require(smPath + "sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require(smPath + "sm_padding_pg.js");
const smPoseidonG = require(smPath + "sm_poseidong.js");
const smRom = require(smPath + "sm_rom.js");
const smStorage = require(smPath + "sm_storage/sm_storage.js");
const smPaddingSha256 = require(smPath + "sm_padding_sha256.js");
const smPaddingSha256Bit = require(smPath + "sm_padding_sha256bit/sm_padding_sha256bit.js");
const smBits2FieldSha256 = require(smPath + "sm_bits2field_sha256.js");
const smSha256F = require(smPath + "sm_sha256f/sm_sha256f.js");

describe("test main sm", async function () {
    this.timeout(10000000);

    it("It should create the pols main", async () => {
        const Fr = new F1Field("0xFFFFFFFF00000001");
        const pil = await compile(Fr, "pil/main.pil");
        const constPols = newConstantPolsArray(pil);
        const cmPols = newCommitPolsArray(pil);

        const input = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "..", "tools", "build-genesis", "input_executor.json"), "utf8"));
        const rom = JSON.parse(await fs.promises.readFile(path.join(__dirname, "..", "..", "build", "rom.json"), "utf8"));

        console.log("Const Global...");
        await smGlobal.buildConstants(constPols.Global);
        console.log("Const Main...");
        await smMain.buildConstants(constPols.Main);
        console.log("Const Rom...");
        await smRom.buildConstants(constPols.Rom, rom);

        console.log("Const PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
        console.log("Const PaddingKKBit...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
        console.log("Const Bits2Field...");
        await smBits2Field.buildConstants(constPols.Bits2Field);
        console.log("Const KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);

        console.log("Const PaddingSha256...");
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
        console.log("Const PaddingSha256Bit...");
        await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);
        console.log("Const Bits2FieldSha256...");
        await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);
        console.log("Const Sha256F...");
        await smSha256F.buildConstants(constPols.Sha256F);

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
        await smBinary.buildConstants(constPols.Binary);

        for (let i=0; i<constPols.length; i++) {
            for (let j=0; j<constPols.Global.L1.length; j++) {
                if (typeof constPols[i][j] !== "bigint") {
                    console.log(`Const Not a big int: + ${constPols.$$defArray[i].name} w=${j}` );
                    break;
                }
            }
        }

        const requiredMain = await smMain.execute(cmPols.Main, input, rom);

        console.log("Exec PaddingKK...");
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
        await smBinary.execute(cmPols.Binary, requiredMain.Binary);

        for (let i=0; i<cmPols.length; i++) {
            for (let j=0; j<constPols.Global.L1.length; j++) {
                if (typeof cmPols[i][j] !== "bigint") {
                    console.log(`Cm Not a big int: + ${cmPols.$$defArray[i].name} w=${j}` );
                    break;
                }
            }
        }

        const res = await verifyPil(Fr, pil, cmPols , constPols);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i=0; i<res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });


});
