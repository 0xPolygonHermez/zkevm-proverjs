const version = require("../package").version;
const fs = require("fs");
const { genSetup } = require("../recursive/genSetup");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const argv = require("yargs")
    .version(version)
    .usage("node main_gensetup.js -v <basic_verification_keys.json> -k <agg_verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<c12a/recursive1/recursive2/recursivef>")
    .alias("v", "verkey")
    .alias("k", "verkey2")
    .alias("t", "starkstruct")
    .alias("s", "starkinfo")
    .alias("b", "batch")
    .string("cols")
    .string("template")
    .string("filename")
    .string("verifiername")
    .string("skipconsttree")
    .string("builddir")
    .argv;

async function run() {
    const buildDir = argv.builddir ? argv.builddir.trim() : "tmp";

    const template = argv.template;
    if(!template) throw new Error("A template name must be provided!");
    if(!["c12a", "recursive1", "recursive2", "recursivef"].includes(template)) throw new Error("Invalid template name provided!");

    let fileName = argv.filename;
    if(!fileName) fileName = template;

    const starkInfoFile = typeof (argv.starkinfo) === "string" ? argv.starkinfo.trim() : "mycircuit.starkinfo.json";
    const starkStructFile = typeof(argv.starkstruct) === "string" ?  argv.starkstruct.trim() : "mycircuit.stark_struct.json";
    
    let cols = argv.cols ? Number(argv.cols) : 12;

    let isBatchRecursion = argv.batch ? true : false;

    const starkInfo = JSON.parse(await fs.promises.readFile(starkInfoFile, "utf8"));
    const starkStruct = JSON.parse(await fs.promises.readFile(starkStructFile, "utf8"));
    
    const skipConstTree = argv.skipconsttree === "true" ? true : false;

    let vks = [];

    const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "mycircuit.verkey.json";
    const verkey = JSONbig.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    const constRoot = verkey.constRoot;

    vks.push(constRoot);
    
    if(template === "recursivef") {
        const verKey2File = typeof (argv.verkey2) === "string" ? argv.verkey2.trim() : "mycircuit2.verification_keys.json";
    
        const verkey2 = JSONbig.parse(await fs.promises.readFile(verKey2File, "utf8"));
        vks.push(verkey2.constRoot);
    }
    
    let verifierName = argv.verifiername;
    if(!verifierName) throw new Error("A verifier name must be provided!")

    let genCircomTemplate = ["recursive1", "recursive2", "recursivef"].includes(template) ? true : false;

    await genSetup(template, verifierName, vks, fileName, starkInfo, starkStruct, buildDir, {compressorCols: cols, genCircomTemplate, skipConstTree, isBatchRecursion});
    
    console.log("file Generated Correctly");

}
run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
