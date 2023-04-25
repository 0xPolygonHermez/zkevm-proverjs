const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");
const { compile } = require("pilcom");
const { F1Field } = require("ffjavascript");
const { verifyZkasm } = require("./verify_zkasm");
const { cwd } = require("process");

const argv = require("yargs")
    .usage("node zkasmtest filename [-p <pil>] [-P <pilconfig>]")
    .help('h')
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("c", "config")
    .alias("N", "evaluations")
    .alias("n", "ns")
    .alias("v", "verbose")
    .alias("e", "externalpil")
    .alias("o", "outputpath")
    .alias("C", "constants")
    .alias("d", "debug")
    .alias("H", "helper")
    .argv;

async function main(){
    let Fr = new F1Field("0xFFFFFFFF00000001");
    let zkasmFile = false;

    if (argv._.length == 0) {
        console.log("You need to specify an zkasm source file");
        process.exit(1);
    } else if (argv._.length == 1) {
        zkasmFile = argv._[0];
    } else  {
        console.log("Only one source file at a time is permitted");
        process.exit(1);
    }

    let ns = argv.ns ? argv.ns : ['Global', 'Main'];
    let namespaceDefined = argv.ns ? true : false;

    // evaluations
    const evaluationsDefined = typeof(argv.evaluations) !== 'undefined';
    let evaluations = evaluationsDefined ?  argv.evaluations : 2**17;
    if (typeof evaluations === 'string' && evaluations.startsWith('2**')) {
        evaluations = 2 ** Number(evaluations.substring(3).trim());
    }
    if ((2 ** Math.trunc(Math.log2(evaluations))) != evaluations) {
        console.log("N must be a power of 2. You could use -N 2**<bits>");
        process.exit(1);
    }

    const verbose = argv.verbose ? true : false;
    const constants = argv.constants ? true : false;
    const debug = argv.debug ? true : false;
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
        defines: {N: evaluations},
        namespaces,
        verbose,
        color: true,
        disableUnusedError: true
    }
    let defaultConfig = {
        constants,
        debug,
        externalPilVerification
    }

    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : (__dirname + "/../pil/main.pil");
    let pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : defaultPilConfig;
    let config = typeof(argv.config) === "string" ? JSON.parse(fs.readFileSync(argv.config.trim())) : defaultConfig;

    if (externalPilVerification && !outputPath) {
        outputPath = '.';
    }
    if (outputPath) {
        config = {
            romFilename: outputPath + '/rom.json',
            constFilename: outputPath + '/constFile.bin',
            commitFilename: outputPath + '/commitFile.bin',
            pilJsonFilename: outputPath + '/main.pil.json',
            ...config};
    }

    const fullPathZkasmFile = zkasmFile.startsWith('/') ? zkasmFile : path.join(cwd(), zkasmFile);
    const zkasmPath = path.dirname(fullPathZkasmFile);

    console.log(`verifying ${fullPathZkasmFile} .....`);

    let helpers = argv.helper ?? [];
    if (!Array.isArray(helpers)) {
        helpers = [helpers];
    }
    if (helpers.length) {
        config.helpers = [];
        for (const helper of helpers) {
            const helperFile = fs.existsSync(helper) ? helper : zkasmPath + '/' + helper;
            if (!fs.existsSync(helperFile)) {
                throw new Error(`Not found helper on ${helper} or ${helperFile}`);
            }
            const fullPathHelper = path.resolve(helperFile);
            console.log(`using helper ${helperFile} on ${fullPathHelper}`);
            const clhelper = require(fullPathHelper);
            config.helpers.push(new clhelper());
        }
    }

    if (config && config.debug && config.constants) {
        console.log("debug and constants options are incompatible");
        process.exit(1);
    }

    await verifyZkasm(fullPathZkasmFile, {pilFile}, pilConfig, config);
    console.log('Done!');
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
