const fs = require("fs");
const path = require("path");
const version = require("../package").version;

const exportPols = require("pilcom").exportPolynomials;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const createCommitedPols = require("pilcom").createCommitedPols;
const { compile } = require("pilcom");


const smArith = require("./sm/sm_arith.js");
const smBinary = require("./sm/sm_binary.js");
const smByte4 = require("./sm/sm_byte4.js");
const smKeccakF = require("./sm/sm_keccakf.js");
const smMain = require("./sm/sm_main.js");
const smMemAlign = require("./sm/sm_mem_align.js");
const smMem = require("./sm/sm_mem.js");
const smNine2One = require("./sm/sm_nine2one.js");
const smNormGate9 = require("./sm/sm_norm_gate9.js");
const smPaddingKK = require("./sm/sm_padding_kk.js");
const smPaddingKKBit = require("./sm/sm_padding_kkbit.js");
const smPaddingPG = require("./sm/sm_padding_pg.js");
const smPoseidonG = require("./sm/sm_poseidong.js");
const smStorage = require("./sm/sm_storage.js");


const fileCachePil = path.join(__dirname, "../cache-main-pil.json");

const argv = require("yargs")
    .version(version)
    .usage("main_executor <input.json> -r <rom.json> -o <proof.json> -t <test.json> -l <logs.json> -s -d -n <number>")
    .alias("o", "output")
    .alias("r", "rom")
    .alias("t", "test")
    .alias("l", "logs")
    .alias("s", "skip")
    .alias("d", "debug")
    .alias("n", "N")
    .argv;

async function run() {

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    let inputFile;
    if (argv._.length == 0) {
        console.log("You need to specify an input file file");
        process.exit(1);
    } else if (argv._.length == 1) {
        inputFile = argv._[0];
    } else  {
        console.log("Only one input file at a time is permited");
        process.exit(1);
    }

    const romFile = typeof(argv.rom) === "string" ?  argv.rom.trim() : "rom.json";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : undefined;
    const testFile = typeof(argv.test) === "string" ?  argv.test.trim() : false;
    const logsFile = typeof(argv.logs) === "string" ?  argv.output.trim() : undefined;

    const input = JSON.parse(await fs.promises.readFile(inputFile, "utf8"));
    const rom = JSON.parse(await fs.promises.readFile(romFile, "utf8"));

    let pil;
    if (argv.skip === true) {
        if (fs.existsSync(fileCachePil)) {
            pil = JSON.parse(await fs.promises.readFile(fileCachePil, "utf8"));
        } else {
            throw new Error("Cache pil file does not exist");
        }
    } else {
        pil = await compile(F, "pil/main.pil");
        await fs.promises.writeFile(fileCachePil, JSON.stringify(pil, null, 1) + "\n", "utf8");
    }

    const test = testFile ? JSON.parse(await fs.promises.readFile(testFile, "utf8")) : false;
    const [cmPols, cmPolsArray, cmPolsDef, cmPolsDefArray] = createCommitedPols(pil);
    const config = {
        test: test,
        debug: (argv.debug === true),
        debugInfo: {
            inputName: path.basename(inputFile, ".json")
        }
    }
    if (argv.n) {
        config.debugInfo["N"] = Number(argv.n);
    }
    const requiredMain = await smMain.execute(cmPols.Main, cmPolsDef.Main, input, rom, config);
    if (typeof outputFile !== "undefined") {
        console.log("Storage...");
        const requiredStorage = await smStorage.execute(cmPols.Storage, cmPolsDef.Storage, requiredMain.Storage);
        console.log("Byte4...");
        await smByte4.execute(cmPols.Byte4, cmPolsDef.Byte4, requiredMain.Byte4);
        console.log("Arith...");
        await smArith.execute(cmPols.Arith, cmPolsDef.Arith, requiredMain.Arith);
        console.log("Binary...");
        await smBinary.execute(cmPols.Binary, cmPolsDef.Binary, requiredMain.Binary);
        console.log("MemAlign...");
        await smMemAlign.execute(cmPols.MemAlign, cmPolsDef.MemAlign, requiredMain.MemAlign);
        console.log("Mem...");
        await smMem.execute(cmPols.Mem, cmPolsDef.Mem, requiredMain.Mem);

        console.log("PaddingKK...");
        const requiredKK = await smPaddingKK.execute(cmPols.PaddingKK, cmPolsDef.PaddingKK, requiredMain.PaddingKK);
        console.log("PaddingKKbit...");
        const requiredKKbit = await smPaddingKKBit.execute(cmPols.PaddingKKBit, cmPolsDef.PaddingKKBit, requiredKK.paddingKKBits);
        console.log("Nine2One...");
        const requiredNine2One = await smNine2One.execute(cmPols.Nine2One, cmPolsDef.Nine2One, requiredKKbit.Nine2One);
        console.log("KeccakF...");
        const requiredKeccakF = await smKeccakF.execute(cmPols.KeccakF, cmPolsDef.KeccakF, requiredNine2One.KeccakF);
        console.log("NormGate9...");
        await smNormGate9.execute(cmPols.NormGate9, cmPolsDef.NormGate9, requiredKeccakF.NormGate9);

        console.log("PaddingPG...");
        const requiredPaddingPG = await smPaddingPG.execute(cmPols.PaddingPG, cmPolsDef.PaddingPG, requiredMain.PaddingPG);


        console.log("PoseidonG...");
        const allPoseidonG = [ ...requiredMain.PoseidonG, ...requiredPaddingPG.PoseidonG, ...requiredStorage.PoseidonG ];
        await smPoseidonG.execute(cmPols.PoseidonG, cmPolsDef.PoseidonG, allPoseidonG);

        console.log("Exporting Polynomials...");
        await exportPols(F, outputFile, cmPolsArray, cmPolsDefArray);
    }

    if (logsFile) {
        console.log("Writing logs...");
        fs.writeFileSync(logsFile, JSON.stringify(requiredMain.Logs, null, 2));
    }

    console.log("Executor finished correctly");
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});