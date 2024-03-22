const fs = require("fs");
const path = require("path");
const { verifyZkasm } = require("./verify_zkasm");
const { cwd } = require("process");

const argv = require("yargs")
    .usage("node zkasmtest [headerfile] filename1 [filename2] ... [footerfile] [-p <pil>] [-P <pilconfig>]")
    .help('h')
    .alias("b", "blob")
    .alias("A", "all")
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("c", "config")
    .alias("N", "stepsN")
    .alias("R", "rows")
    .alias("n", "ns")
    .alias("v", "verbose")
    .alias("e", "externalpil")
    .alias("o", "outputpath")
    .alias("C", "constants")
    .alias("d", "debug")
    .alias("s", "stats")
    .alias("H", "helper")
    .alias("E", "reserved")
    .argv;

async function main(){
    let zkasmFile = "";
    switch (argv._.length) {
        case 0:
            console.log("You need to specify at least one zkasm source file");
            process.exit(1);
        case 1:
            zkasmFile = argv._[0];
            break;
        case 2:
            console.log("You need to specify the header file, at least one zkasm source file and the footer file");
            process.exit(1);
        default:
            const files = argv._;
            const findIncludes = /INCLUDE\s+"([^"]+)"/g
            for (let i = 0; i < files.length; i++) {
                let filei = fs.readFileSync(files[i], "utf8");
                filei = filei.replace(findIncludes, (match) => {
                    let newInclude = path.resolve(path.dirname(files[i]),match.match(/"([^"]+)"/)[1]);
                    return `INCLUDE "${newInclude}"`;
                });

                zkasmFile += filei + "\n\n";
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


    let outputPath = typeof(argv.outputpath) === "string" ?  argv.outputpath.trim(): "";
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

    let defaultConfig = {
        constants,
        debug,
        blob,
        debugInfo: {},
        continueOnError: true,
        externalPilVerification,
        stats
    }

    if (stats) {
        defaultConfig.debugInfo.inputName = oneZkasmFile ? path.basename(zkasmFile) : 'main.zkasm';
    }

    if (typeof argv.stepsN !== 'undefined') {
        let steps = argv.stepsN;
        if (typeof steps === 'string' && steps.startsWith('2**')) {
            steps = 2 ** Number(steps.substring(3).trim());
        }
        defaultConfig.stepsN = steps;
        defaultConfig.debug = true;
        defaultPilConfig.defines.N = 2 ** 16;
        console.log(`Setting steps upto ${steps} vs rows upto ${rows} (debug: active)`);
    }

    const defaultPilFile = __dirname + `/../pil/main${targetSuffix}.pil`;
    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : defaultPilFile;
    let pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : defaultPilConfig;
    let config = typeof(argv.config) === "string" ? JSON.parse(fs.readFileSync(argv.config.trim())) : defaultConfig;
    if (argv.reserved === true) {
        config = {...config, reserved: true}
    }

    if (externalPilVerification && !outputPath) {
        outputPath = '.';
    }
    if (outputPath) {
        const zkasmName = oneZkasmFile ? path.basename(zkasmFile) : 'main.zkasm';

        const zkasm = zkasmName.split('.')[0];

        config = {
            romFilename: path.join(outputPath, zkasm + '.' + 'rom.json'),
            constFilename: path.join(outputPath, zkasm + '.' + 'constFile.bin'),
            commitFilename: path.join(outputPath, zkasm + '.' + 'commitFile.bin'),
            pilJsonFilename: path.join(outputPath, zkasm + '.' + 'main.pil.json'),
            ...config};
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
        config.helpers = [];
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
            config.helpers.push(new clhelper());
        }
    }

    if (config && config.debug && config.constants) {
        console.log("Debug and constants options are incompatible");
        process.exit(1);
    }

    if (oneZkasmFile) {
        await verifyZkasm(fullPathZkasmFile, {pilFile}, pilConfig, config);
    } else {
        await verifyZkasm(zkasmFile, {pilFile}, pilConfig, config, {compileFromString: true});
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
