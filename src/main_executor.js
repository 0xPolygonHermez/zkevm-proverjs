const fs = require("fs");
const path = require("path");
const tty = require('tty');
const version = require("../package").version;

const exportPols = require("pilcom").exportPolynomials;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const { newCommitPolsArray, compile  } = require("pilcom");


const smArith = require("./sm/sm_arith/sm_arith.js");
const smBinary = require("./sm/sm_binary.js");
const smKeccakF = require("./sm/sm_keccakf/sm_keccakf.js");
const smMain = require("./sm/sm_main/sm_main.js");
const smMemAlign = require("./sm/sm_mem_align.js");
const smMem = require("./sm/sm_mem.js");
const smBits2Field = require("./sm/sm_bits2field.js");
const smPaddingKK = require("./sm/sm_padding_kk.js");
const smPaddingKKBit = require("./sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smPaddingPG = require("./sm/sm_padding_pg.js");
const smPoseidonG = require("./sm/sm_poseidong.js");
const smStorage = require("./sm/sm_storage/sm_storage.js");


const argv = require("yargs")
    .version(version)
    .usage("main_executor <input.json> -r <rom.json> -o <proof.json> -l <logs.json> -s -d [-p <main.pil>] [-P <pilconfig.json>] -u -e -v -T -c")
    .alias("o", "output")
    .alias("r", "rom")
    .alias("l", "logs")
    .alias("s", "skip")
    .alias("S", "stats")
    .alias("d", "debug")
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("u", "unsigned")
    .alias("e", "execute")
    .alias("v", "verbose")
    .alias("T", "tracer")
    .alias("c", "counters")
    .alias("C", "config")
    .options('t', { alias: 'set', type: 'array' })
    .options('D', { alias: 'define', type: 'array' })
    .alias("N", "stepsN")
    .alias("V", "verboseExecutor")
    .argv;

async function run() {

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    let config = typeof(argv.config) === "string" ? JSON.parse(fs.readFileSync(argv.config.trim())) : {};

    if (argv._.length == 0) {
        console.log("You need to specify an input file file");
        process.exit(1);
    } else if (argv._.length == 1) {
        config.inputFile = argv._[0];
    } else  {
        console.log("Only one input file at a time is permitted");
        process.exit(1);
    }

    // parse commandline config sets

    for (set of (argv.set ?? [])) {
        const index = set.indexOf('=');
        const name = index < 0 ? set : set.substr(0, index);
        let value = index < 0 ? true : set.substr(index+1);
        if (!isNaN(value)) {
            const numValue = parseInt(value);
            const bigValue = BigInt(value);
            if ( bigValue === BigInt(numValue)) value = numValue;
            else value = BigInt(value);
        }
        config[name] = value;
    }

    const configFiles = {
        rom: 'rom.json',
        output: undefined,
        logs: false,
        stats: 'program.stats',
        pil: path.join(__dirname, "/../pil/main.pil"),
        pilConfig: false
    };

    for (let name in configFiles) {
        const argname = name.toLowerCase();
        const confname = name + 'File';
        config[confname] = (typeof argv[argname] === 'string' ? argv[argname].trim() : (config[confname] ?? configFiles[name]));
    }

    console.log(argv.define);
    if (argv.define) {
        config.defines = config.defines ?? {};
        for (define of argv.define) {
            const index = define.indexOf('=');
            const name = index < 0 ? define : define.substr(0, index);
            let value = index < 0 ? true : define.substr(index+1);

            config.defines[name] = value;
        }
    }

    config.stats = ((argv.stats === true || typeof argv.stats === 'string') ? true : (config.stats ?? false));
    config.stepsN = (typeof argv.stepsN !== 'undefined' ? argv.stepsN : (config.stepsN ?? undefined));
    config.cachePilFile = config.cachePilFile ?? path.join(__dirname, "../cache-main-pil.json");

    for (let value of ['debug', 'unsigned', 'execute', 'tracer', 'counters', 'skip', 'verbose']) {
        config[value] = (argv[value] === true ? true : (config[value] ?? false));
    }

    const input = JSON.parse(await fs.promises.readFile(config.inputFile, "utf8"));
    const rom = JSON.parse(await fs.promises.readFile(config.romFile, "utf8"));

    let pil;
    if (config.skip === true) {
        if (fs.existsSync(config.cachePilFile )) {
            pil = JSON.parse(await fs.promises.readFile(config.cachePilFile , "utf8"));
        } else {
            throw new Error("Cache pil file does not exist");
        }
    } else {
        console.log('compile PIL '+config.pilFile);

        const pilConfig = config.pilConfigFile ? JSON.parse(fs.readFileSync(config.pilConfigFile)) : {};

        if (config.verbose) {
            pilConfig.verbose = true;
            if (typeof pilConfig.color === 'undefined') {
                pilConfig.color = tty.isatty(process.stdout.fd);
            }
        }
        if (config.defines) {
            pilConfig.defines = pilConfig.defines ?? {};
            for (let define in config.defines) {
                pilConfig.defines[define] = config.defines[define];
            }
        }

        pil = await compile(F, config.pilFile, null, pilConfig);
        await fs.promises.writeFile(config.cachePilFile, JSON.stringify(pil, null, 1) + "\n", "utf8");
    }

    const cmPols = newCommitPolsArray(pil);

    config.pathVerboseFile = (typeof argv.verboseExecutor === 'string' ? argv.verboseExecutor.trim() : config.pathVerboseFile);
    config.verboseOptions = config.verboseOptions ?? {};

    if (typeof config.pathVerboseFile !== 'undefined'){
        if (!fs.existsSync(config.pathVerboseFile)) {
            throw new Error("Cache pil file does not exist");
        } else {
            config.verboseOptions = JSON.parse(fs.readFileSync(config.pathVerboseFile));
        }
    }

    config.debugInfo = { inputName: path.basename(config.inputFile, ".json") };

    let metadata = {};
    const N = cmPols.Main.PC.length;

    console.log(`N = ${N}`);
    console.log("Main ...");
    const requiredMain = await smMain.execute(cmPols.Main, input, rom, config, metadata);
    if (typeof config.outputFile !== "undefined") {
        if (cmPols.Storage) {
            console.log("Storage...");
        }
        const requiredStorage = cmPols.Storage ? await smStorage.execute(cmPols.Storage, requiredMain.Storage) : false;

        if (cmPols.Arith) {
            console.log("Arith...");
            await smArith.execute(cmPols.Arith, requiredMain.Arith || []);
        }
        if (cmPols.Binary) {
            console.log("Binary...");
            await smBinary.execute(cmPols.Binary, requiredMain.Binary || []);
        }
        if (cmPols.MemAlign) {
            console.log("MemAlign...");
            await smMemAlign.execute(cmPols.MemAlign, requiredMain.MemAlign || []);
        }
        if (cmPols.Mem) {
            console.log("Mem...");
            await smMem.execute(cmPols.Mem, requiredMain.Mem || []);
        }
        if (cmPols.PaddingKK) console.log("PaddingKK...");
        const requiredKK = cmPols.PaddingKK ? await smPaddingKK.execute(cmPols.PaddingKK, requiredMain.PaddingKK || []) : false;

        if (cmPols.PaddingKKBit) console.log("PaddingKKbit...");
        const requiredKKBit = cmPols.PaddingKKBit ? await smPaddingKKBit.execute(cmPols.PaddingKKBit, requiredKK.paddingKKBit || []): false;

        if (cmPols.Bits2Field) console.log("Bits2Field...");
        const requiredBits2Field = cmPols.Bits2Field ? await smBits2Field.execute(cmPols.Bits2Field, requiredKKBit.Bits2Field || []) : false;

        if (cmPols.KeccakF) {
            console.log("KeccakF...");
            await smKeccakF.execute(cmPols.KeccakF, requiredBits2Field.KeccakF || []);
        }

        if (cmPols.PaddingPG) console.log("PaddingPG...");
        const requiredPaddingPG = cmPols.PaddingPG ? await smPaddingPG.execute(cmPols.PaddingPG, requiredMain.PaddingPG || []) : false;

        if (cmPols.PoseidonG) {
            console.log("PoseidonG...");
            const allPoseidonG = [ ...(requiredMain.PoseidonG || []), ...(requiredPaddingPG.PoseidonG || []), ...(requiredStorage.PoseidonG || []) ];
            await smPoseidonG.execute(cmPols.PoseidonG, allPoseidonG);
        }

        for (let i=0; i<cmPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof cmPols.$$array[i][j] === "undefined") {
                    throw new Error(`Polinomial not fited ${cmPols.$$defArray[i].name} at ${j}` )
                }
            }
        }

        console.log("Exporting Polynomials...");
        await cmPols.saveToFile(config.outputFile);
    }
    if (config.stats) {
        console.log(`generating lines info .... ${config.statsFile}`);
        let output = await fs.promises.open(config.statsFile, 'w');
        let w = 0;
        const sep = '|';
        const content = ['w', 'zkPC', 'times', 'sourceFile', 'sourceLine', 'code'].join(sep) + "\n";
        let res = await output.write(content);

        for (const zkPC of metadata.stats.trace) {
            const line = rom.program[zkPC];
            const content = [w, zkPC, metadata.stats.lineTimes[zkPC] || 0,line.fileName, line.line, line.lineStr.trim()].join('|') + "\n";
            res = await output.write(content);
            ++w;
        }
        await output.close();
    }

    if (config.logsFile) {
        console.log("Writing logs...");
        fs.writeFileSync(config.logsFile, JSON.stringify(requiredMain.Logs, null, 2));
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
