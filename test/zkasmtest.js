const fs = require("fs");
const path = require("path");
const { verifyZkasm } = require("./verify_zkasm");
const { cwd } = require("process");

const argv = require("yargs")
    .usage("node zkasmtest [FLAGS] [OPTIONS] input")
    .options({
        "a": {
            alias: "all",
            describe: "Use all namespaces",
        },
        "n": {
            alias: "ns",
            describe: "Namespaces to use [default: ['Global', 'Main']]",
        },
        "b": {
            alias: "blob",
            describe: "Use the blob executor",
        },
        "N": {
            alias: "stepsN",
            describe: "Steps to execute [default: As defined by PIL]",
        },
        "R": {
            alias: "rows",
            describe: "Number of rows for the PIL file [default: 2**17]",
        },
        "p": {
            alias: "pil",
            describe: "Path to the PIL file [default: pil/main.pil]",
        },
        "P": {
            alias: "pilconfig",
            describe: "PIL config file",
        },
        "e": {
            alias: "externalpil",
            describe: "Use external PIL verification",
        },
        "o": {
            alias: "outputpath",
            describe: "Output path for the generated files",
        },
        "C": {
            alias: "constants",
            describe: "Generate constant pols",
        },
        "c": {
            alias: "config",
            describe: "Main executor config file",
        },
        "d": {
            alias: "debug",
            describe: "Debug mode",
        },
        "v": {
            alias: "verbose",
            describe: "Be verbose",
        },
        "s": {
            alias: "stats",
            describe: "Generate stats",
        },
        "E": {
            alias: "reserved",
            describe: "Controls reserved counters",
        },
        "H": {
            alias: "helper",
            describe: "Path to the helper file",
        },
        "w": {
            alias: "workpath",
            describe: "Path to the working directory",
        },
    })
    .group(["a","b","d","C","e","s","E","v","h","version"], "FLAGS:")
    .group(["c","N","p","P","n","R","w","o","H"], "OPTIONS:")
    .help('h')
    .alias('h', 'help')
    .epilogue("ARGS:\n  <input>   Path to a complete zkasm file or multiple zkasm files where the first file refers to the header file and the last file refers to the footer file")
    .example([
        ['node test/zkasmtest.js test/diagnostic/main.zkasm'],
        ['node test/zkasmtest.js -dEs -N "2**23" -R "2**23" test/diagnostic/header.zkasm test/diagnostic/constants.zkasm test/diagnostic/counters.zkasm test/diagnostic/footer.zkasm']
      ])
    .argv;

async function main(){
    const workpath = typeof(argv.workpath) === "string" ?  argv.workpath.trim() : "";

    let zkasmFile = "";
    switch (argv._.length) {
        case 0:
            console.log("You need to specify at least one zkasm source file");
            process.exit(1);
        case 1:
            zkasmFile = path.join(workpath, argv._[0]);
            break;
        case 2:
            console.log("You need to specify the header file, at least one zkasm source file and the footer file");
            process.exit(1);
        default:
            const files = argv._;
            const findIncludes = /INCLUDE\s+"([^"]+)"/g
            for (let i = 0; i < files.length; i++) {
                const filei = path.join(workpath, files[i]);
                console.log(`Reading ${filei}...`);

                let contenti = fs.readFileSync(filei, "utf8");
                contenti = contenti.replace(findIncludes, (match) => {
                    let newInclude = path.resolve(path.dirname(filei),match.match(/"([^"]+)"/)[1]);
                    return `INCLUDE "${newInclude}"`;
                });

                zkasmFile += contenti + "\n\n";
            }
    }

    const oneZkasmFile = (argv._.length == 1);

    let ns = argv.ns ? argv.ns : ['Global', 'Main'];

    // rows
    const rowsDefined = typeof(argv.rows) !== 'undefined';
    let rows = rowsDefined ?  argv.rows : 2**17;
    if (typeof rows === 'string' && rows.startsWith('2**')) {
        rows = 2 ** Number(rows.substring(3).trim());
    }
    if ((2 ** Math.trunc(Math.log2(rows))) != rows) {
        console.log("N must be a power of 2. You could use -N 2**<bits>");
        process.exit(1);
    }

    const verbose = argv.verbose ? true : false;
    const constants = argv.constants ? true : false;
    const debug = argv.debug ? true : false;
    const stats = argv.stats ? true : false;
    const all = argv.all ? true : false;
    const blob = argv.blob ? true : false;

    const targetSuffix = blob ? '_blob':'';

    let outputPath = typeof(argv.outputpath) === "string" ?  argv.outputpath.trim() : "";
    const externalPilVerification = argv.externalpil ? true : (outputPath !== "");

    ns = Array.isArray(ns) ? ns : [ns];

    let namespaces = [];
    for (const name of ns) {
        namespaces = namespaces.concat(name.trim().split(','));
    }
    if (namespaces.indexOf('Main') < 0) {
        namespaces = ['Main',...namespaces];
    }
    if (namespaces.indexOf('Global') < 0) {
        namespaces = ['Global',...namespaces];
    }

    let defaultPilConfig = {
        defines: {N: rows},
        verbose,
        color: true,
        disableUnusedError: true
    }

    if (!all) {
        defaultPilConfig.namespaces = namespaces;
    }

    let defaultMainConfig = {
        constants,
        debug,
        blob,
        debugInfo: {},
        continueOnError: true,
        externalPilVerification,
        stats
    }

    if (stats) {
        defaultMainConfig.debugInfo.inputName = oneZkasmFile ? path.basename(zkasmFile) : 'main.zkasm';
    }

    if (typeof argv.stepsN !== 'undefined') {
        let steps = argv.stepsN;
        if (typeof steps === 'string' && steps.startsWith('2**')) {
            steps = 2 ** Number(steps.substring(3).trim());
        }
        defaultMainConfig.stepsN = steps;
        defaultMainConfig.debug = true;
        defaultPilConfig.defines.N = 2 ** 16;
        console.log(`Setting steps upto ${steps} vs rows upto ${rows} (debug: active)`);
    }

    const defaultPilFile = __dirname + `/../pil/main${targetSuffix}.pil`;
    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : defaultPilFile;
    let pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : defaultPilConfig;
    let mainConfig = typeof(argv.config) === "string" ? JSON.parse(fs.readFileSync(argv.config.trim())) : defaultMainConfig;
    if (argv.reserved === true) {
        mainConfig = {...mainConfig, reserved: true}
    }

    if (externalPilVerification && !outputPath) {
        outputPath = '.';
    }
    if (outputPath) {
        const zkasmName = oneZkasmFile ? path.basename(zkasmFile) : 'main.zkasm';

        const zkasm = zkasmName.split('.')[0];

        mainConfig = {
            romFilename: path.join(outputPath, zkasm + '.' + 'rom.json'),
            constFilename: path.join(outputPath, zkasm + '.' + 'constFile.bin'),
            commitFilename: path.join(outputPath, zkasm + '.' + 'commitFile.bin'),
            pilJsonFilename: path.join(outputPath, zkasm + '.' + 'pil.json'),
            ...mainConfig};
    }

    let fullPathZkasmFile = false;
    let zkasmPath = false;
    if (oneZkasmFile) {
        fullPathZkasmFile = zkasmFile.startsWith('/') ? zkasmFile : path.join(cwd(), zkasmFile);
        zkasmPath = path.dirname(fullPathZkasmFile);

        console.log(`Verifying ${fullPathZkasmFile}...`);
    }

    let helpers = argv.helper ?? [];
    if (!Array.isArray(helpers)) {
        helpers = [helpers];
    }
    if (helpers.length) {
        mainConfig.helpers = [];
        for (const helper of helpers) {
            let helperFile = false;
            if (oneZkasmFile) {
                helperFile = fs.existsSync(helper) ? helper : zkasmPath + '/' + helper;
            } else {
                helperFile = helper;
            }
            if (!fs.existsSync(helperFile)) {
                throw new Error(`Not found helper on ${helper} or ${helperFile}`);
            }
            const fullPathHelper = path.resolve(helperFile);
            console.log(`Using helper ${helperFile} on ${fullPathHelper}`);
            const clhelper = require(fullPathHelper);
            mainConfig.helpers.push(new clhelper());
        }
    }

    if (mainConfig && mainConfig.debug && mainConfig.constants) {
        console.log("Debug and constants options are incompatible");
        process.exit(1);
    }

    if (oneZkasmFile) {
        await verifyZkasm(fullPathZkasmFile, {pilFile}, pilConfig, mainConfig);
    } else {
        const zkasmConfig = {
            compileFromString: true
        }

        await verifyZkasm(zkasmFile, {pilFile}, pilConfig, mainConfig, zkasmConfig);
    }
    console.log('Done!');
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
