
const fs = require("fs");
const path = require("path");
const version = require("../package").version;
const { newConstantPolsArray, compile } = require("pilcom");

const smArith = require("./sm/sm_arith/sm_arith.js");
const smBinary = require("./sm/sm_binary.js");
const smByte4 = require("./sm/sm_byte4.js");
const smGlobal = require("./sm/sm_global.js");
const smKeccakF = require("./sm/sm_keccakf/sm_keccakf.js");
const smMain = require("./sm/sm_main/sm_main.js");
const smMemAlign = require("./sm/sm_mem_align.js");
const smMem = require("./sm/sm_mem.js");
const smNine2One = require("./sm/sm_nine2one.js");
const smNormGate9 = require("./sm/sm_norm_gate9.js");
const smPaddingKK = require("./sm/sm_padding_kk.js");
const smPaddingKKBit = require("./sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require("./sm/sm_padding_pg.js");
const smPoseidonG = require("./sm/sm_poseidong.js");
const smRom = require("./sm/sm_rom.js");
const smStorage = require("./sm/sm_storage/sm_storage.js");

const { F1Field } = require("ffjavascript");

const argv = require("yargs")
    .version(version)
    .usage("zkprover -r <rom.json> -o <constant.bin|json>")
    .alias("r", "rom")
    .alias("o", "output")
    .alias("p", "pil")
    .argv;

async function run() {

    if (typeof(argv.rom) !== "string") {
        throw new Error("A rom file needs to be specified")
    }
    const romFile = argv.rom.trim();

    if (typeof(argv.output) !== "string") {
        throw new Error("A output file needs to be specified")
    }
    const outputFile = argv.output.trim();
    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : path.join(__dirname, "..", "pil", "main.pil");


    Fr = new F1Field("0xFFFFFFFF00000001");

    const rom = JSON.parse(await fs.promises.readFile(romFile, "utf8"));
    const pil = await compile(Fr, pilFile);



    const constPols = newConstantPolsArray(pil);

    // BREAK HERE TO DETECT N

    const N = constPols.Main.STEP.length;

    let modules = [];
    Object.keys(pil.references).forEach((ref) => { parts = ref.split('.'); modules[parts[0]] = (modules[parts[0]] ?? 0) + 1; })

    if (modules.Arith) {
        console.log("Arith...");
        await smArith.buildConstants(constPols.Arith);
    }
    if (modules.Binary) {
        console.log("Binary...");
        await smBinary.buildConstants(constPols.Binary);
    }
    if (modules.Byte4) {
        console.log("Byte4...");
        await smByte4.buildConstants(constPols.Byte4);
    }
    if (modules.Global) {
        console.log("Global...");
        await smGlobal.buildConstants(constPols.Global);
    }
    if (modules.KeccackF) {
        console.log("KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);
    }
    if (modules.Main) {
        console.log("Main...");
        await smMain.buildConstants(constPols.Main);
    }

    if (modules.MemAlign) {
        console.log("MemAlign...");
        await smMemAlign.buildConstants(constPols.MemAlign);
    }

    if (modules.Mem) {
        console.log("Mem...");
        await smMem.buildConstants(constPols.Mem);
    }

    if (modules.Nine2One) {
        console.log("Nine2One...");
        await smNine2One.buildConstants(constPols.Nine2One);
    }

    if (modules.NormGate9) {
        console.log("NormGate9...");
        await smNormGate9.buildConstants(constPols.NormGate9);
    }

    if (modules.PaddingKK) {
        console.log("PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
    }

    if (modules.PaddingKKBits) {
        console.log("PaddingKKBits...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
    }

    if (modules.PaddingPG) {
        console.log("PaddingPG...");
        await smPaddingPG.buildConstants(constPols.PaddingPG);
    }

    if (modules.PoseidongG) {
        console.log("PoseidonG...");
        await smPoseidonG.buildConstants(constPols.PoseidonG);
    }

    if (modules.Rom) {
        console.log("Rom...");
        await smRom.buildConstants(constPols.Rom, rom);
    }

    if (modules.Storage) {
        console.log("Storage...");
        await smStorage.buildConstants(constPols.Storage);
    }

    for (let i=0; i<constPols.$$array.length; i++) {
        for (let j=0; j<N; j++) {
            if (typeof constPols.$$array[i][j] === "undefined") {
                throw new Error(`Polinomial not fited ${constPols.$$defArray[i].name} at ${j}` )
            }
        }
    }

    await constPols.saveToFile(outputFile);

    console.log("Constants generated succefully!");
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

function buildZhInv_2ns(pol, F, N) {
    let sn = F.shift;
    const nBits = log2(N);
    for (let i=0; i<nBits-1; i++) {
        sn = F.square(sn);
    }
    e = F.inv(F.sub(sn, F.one));
    o = F.inv(F.sub(F.neg(sn), F.one));
    for ( let i=0; i<N; i++) pol[i] =  i % 2 ? o : e;
}

function buildZh_2ns(pol, F, N) {
    let sn = F.shift;
    const nBits = log2(N);
    for (let i=0; i<nBits-1; i++) {
        sn = F.square(sn);
    }
    e = F.sub(sn, F.one);
    o = F.sub(F.neg(sn), F.one);
    for ( let i=0; i<N; i++) pol[i] =  i % 2 ? o : e;
}
