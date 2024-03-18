
const fs = require("fs");
const path = require("path");
const tty = require('tty');
const version = require("../package").version;

const { newConstantPolsArray, compile, newCommitPolsArray } = require("pilcom");

const smArith = require("./sm/sm_arith/sm_arith.js");
const smBinary = require("./sm/sm_binary.js");
const smGlobal = require("./sm/sm_global.js");
const smKeccakF = require("./sm/sm_keccakf/sm_keccakf.js");
const smMain = require("./sm/sm_main/sm_main.js");
const smMemAlign = require("./sm/sm_mem_align/sm_mem_align.js");
const smMem = require("./sm/sm_mem.js");
const smBits2Field = require("./sm/sm_bits2field.js");
const smPaddingKK = require("./sm/sm_padding_kk.js");
const smPaddingKKBit = require("./sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require("./sm/sm_padding_pg.js");
const smPoseidonG = require("./sm/sm_poseidong.js");
const smRom = require("./sm/sm_rom.js");
const smStorage = require("./sm/sm_storage/sm_storage.js");
const smSha256F = require("./sm/sm_sha256f/sm_sha256f.js");
const smBits2FieldSha256 = require("./sm/sm_bits2field_sha256.js");
const smPaddingSha256 = require("./sm/sm_padding_sha256.js");
const smPaddingSha256Bit = require("./sm/sm_padding_sha256bit/sm_padding_sha256bit.js");
const smClimbKey = require("./sm/sm_climb_key.js");
const { F1Field } = require("ffjavascript");

const argv = require("yargs")
    .version(version)
    .usage("main_buildconstants -r <rom.json> -o <constant.bin|json> [-p <main.pil>] [-P <pilconfig.json>] [-v]")
    .alias("r", "rom")
    .alias("o", "output")
    .alias("t", "text")
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("v", "verbose")
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
    const outputTextDir = argv.text ? (typeof argv.text == 'string' ? argv.text.trim() : ''):false;

    let pilFile = __dirname + "/../pil/main.pil";
    if (argv.pil) {
        if (typeof(argv.pil) !== "string") {
            throw new Error("Pil file needs to be specified with pil option")
        }
        pilFile = argv.pil.trim();
    }
    console.log('compile PIL '+pilFile);

    const pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : {};

    if (argv.verbose) {
        pilConfig.verbose = true;
        if (typeof pilConfig.color === 'undefined') {
            pilConfig.color = tty.isatty(process.stdout.fd);
        }
    }

    Fr = new F1Field("0xFFFFFFFF00000001");

    const rom = JSON.parse(await fs.promises.readFile(romFile, "utf8"));
    const pil = await compile(Fr, pilFile, null, pilConfig);

    const constPols = newConstantPolsArray(pil);

    // BREAK HERE TO DETECT N

    const N = constPols.Global.L1.length;
    console.log(`N = ${N}`);

    if (constPols.Arith) {
        console.log("Arith...");
        await smArith.buildConstants(constPols.Arith);
    }
    if (constPols.Binary) {
        console.log("Binary...");
        await smBinary.buildConstants(constPols.Binary);
    }

    if (constPols.Global) {
        console.log("Global...");
        await smGlobal.buildConstants(constPols.Global);
    }

    if (constPols.KeccakF) {
        console.log("KeccakF...");
        await smKeccakF.buildConstants(constPols.KeccakF);
    }
    if (constPols.Main) {
        console.log("Main...");
        await smMain.buildConstants(constPols.Main);
    }
    if (constPols.MemAlign) {
        console.log("MemAlign...");
        await smMemAlign.buildConstants(constPols.MemAlign);
    }
    if (constPols.Mem) {
        console.log("Mem...");
        await smMem.buildConstants(constPols.Mem);
    }
    if (constPols.Bits2Field) {
        console.log("Bits2Field...");
        await smBits2Field.buildConstants(constPols.Bits2Field);
    }
    if (constPols.PaddingKK) {
        console.log("PaddingKK...");
        await smPaddingKK.buildConstants(constPols.PaddingKK);
    }
    if (constPols.PaddingKKBit) {
        console.log("PaddingKKBit...");
        await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
    }
    if (constPols.PaddingPG) {
        console.log("PaddingPG...");
        await smPaddingPG.buildConstants(constPols.PaddingPG);
    }
    if (constPols.PoseidonG) {
        console.log("PoseidonG...");
        await smPoseidonG.buildConstants(constPols.PoseidonG);
    }
    if (constPols.Rom) {
        console.log("Rom...");
        await smRom.buildConstants(constPols.Rom, rom);
    }
    if (constPols.Storage) {
        console.log("Storage...");
        await smStorage.buildConstants(constPols.Storage);
    }
    if (constPols.PaddingSha256) {
        console.log("PaddingSha256...");
        await smPaddingSha256.buildConstants(constPols.PaddingSha256);
    }
    if (constPols.PaddingSha256Bit) {
        console.log("PaddingSha256Bit...");
        await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);
    }
    if (constPols.Bits2FieldSha256) {
        console.log("Bits2FieldSha256...");
        await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);
    }
    if (constPols.Sha256F) {
        console.log("Sha256F...");
        await smSha256F.buildConstants(constPols.Sha256F);
    }

    if (constPols.ClimbKey) {
        console.log("ClimbKey...");
        await smClimbKey.buildConstants(constPols.ClimbKey);
    }

    if (typeof outputTextDir === 'string') {
        let index = 0;
        const pathSep = (outputTextDir.length > 0 & !outputTextDir.endsWith('/')) ? '/':'';
        const blockSize = 16*1024;
        for (cpol of constPols.$$defArray) {
            const name = cpol.name + (typeof cpol.idx == 'undefined' ? '':('#'+cpol.idx));
            const polfile = outputTextDir + pathSep + name + '.txt';
            console.log(`saving constant ${name} on ${polfile}.... `);
            let output = await fs.promises.open(polfile, 'w');
            let from = 0;
            while (from < constPols.$$array[index].length) {
                res = await output.write(constPols.$$array[index].slice(from, from+blockSize).join("\n")+"\n");
                from += blockSize;
            }
            await output.close();
            ++index;
        }
    }

    for (let i=0; i<constPols.$$array.length; i++) {
        for (let j=0; j<N; j++) {
            if (typeof constPols.$$array[i][j] === "undefined") {
                throw new Error(`Polynomial not fited ${constPols.$$defArray[i].name} at ${j}` )
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
