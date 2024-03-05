const version = require("../package").version;
const fs = require("fs");
const { genSetup } = require("../recursive/genSetup");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const argv = require("yargs")
    .version(version)
    .usage("node main_gensetup.js -v <basic_verification_keys.json> -k <agg_verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<compressor/recursive1/recursive2/recursivef>")
    .alias("v", "verkey")
    .alias("k", "verkey2")
    .alias("y", "verkey3")
    .alias("t", "starkstruct")
    .alias("s", "starkinfo")
    .alias("i", "starkinfo2")
    .alias("b", "batch")
    .alias("e", "eip4844")
    .string("cols")
    .string("template")
    .string("filename")
    .string("verifiername")
    .string("verifiername2")
    .string("skipconsttree")
    .string("builddir")
    .argv;

async function run() {
    const buildDir = argv.builddir ? argv.builddir.trim() : "tmp";

    const template = argv.template;
    if(!template) throw new Error("A template name must be provided!");
    if(!["batch_blob", "compressor", "recursive1", "recursive2", "recursivef"].includes(template)) throw new Error("Invalid template name provided!");

    let fileName = argv.filename;
    if(!fileName) fileName = template;

    const starkInfoVerifiers = [];

    if(!argv.starkinfo || typeof (argv.starkinfo) !== "string") throw new Error("A stark info file must be provided!");
    const starkInfoFile = argv.starkinfo.trim();
    const starkInfoVerifier = JSON.parse(await fs.promises.readFile(starkInfoFile, "utf8"));
    starkInfoVerifiers.push(starkInfoVerifier);

    if(template === "batch_blob") {
        if(!argv.starkinfo2 || typeof (argv.starkinfo2) !== "string") throw new Error("A second stark info file must be provided!");
        const starkInfo2File = argv.starkinfo2.trim();
        const starkInfo2Verifier = JSON.parse(await fs.promises.readFile(starkInfo2File, "utf8"));
        starkInfoVerifiers.push(starkInfo2Verifier);
    }

    if(!argv.starkstruct || typeof(argv.starkstruct) !== "string") throw new Error("A stark struct file must be provided!");
    const starkStructFile = argv.starkstruct.trim();
    const starkStruct = JSON.parse(await fs.promises.readFile(starkStructFile, "utf8"));

    let cols = argv.cols ? Number(argv.cols) : 12;

    let isBatchRecursion = argv.batch ? true : false;

    let isEip4844 = argv.eip4844 ? true : false;

    const skipConstTree = argv.skipconsttree === "true" ? true : false;

    let vks = [];

    if(!argv.verkey || typeof(argv.verkey) !== "string") throw new Error("A second verification key file must be provided!");
    const verKeyFile = argv.verkey.trim();
    const verkey = JSONbig.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    vks.push(verkey.constRoot);
    
    if(template === "recursivef" || template === "batch_blob") {
        if(!argv.verkey2 || typeof (argv.verkey2) !== "string") throw new Error("A second verification key file must be provided!");
        const verKey2File = argv.verkey2.trim();
        const verkey2 = JSONbig.parse(await fs.promises.readFile(verKey2File, "utf8"));
        vks.push(verkey2.constRoot);
    }

    if(template === "batch_blob") {
        if(!argv.verkey3 || typeof (argv.verkey3) !== "string") throw new Error("A third verification key file must be provided!");
        const verKey3File = argv.verkey3.trim();
        const verkey3 = JSONbig.parse(await fs.promises.readFile(verKey3File, "utf8"));
        vks.push(verkey3.constRoot);
    }
    
    let verifierNames = [];

    let verifierName = argv.verifiername;
    if(!verifierName) throw new Error("A verifier name must be provided!")
    verifierNames.push(verifierName);

    if(template === "batch_blob") {
        let verifierName2 = argv.verifiername2;
        if(!verifierName2) throw new Error("A verifier name for blob inner must be provided!")
        verifierNames.push(verifierName2);
    }

    let genCircomTemplate = ["batch_blob", "recursive1", "recursive2", "recursivef"].includes(template) ? true : false;

    const options = {compressorCols: cols, genCircomTemplate, skipConstTree, isBatchRecursion, isEip4844, buildDir};

    await genSetup(template, starkStruct, fileName, vks, verifierNames, starkInfoVerifiers, options);
    
    console.log("file Generated Correctly");

}
run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
