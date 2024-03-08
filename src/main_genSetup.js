const version = require("../package").version;
const fs = require("fs");
const { genSetup } = require("../recursive/genSetup");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const argv = require("yargs")
    .version(version)
    .usage("node main_gensetup.js -v <verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<compressor/recursive1/recursive2/recursivef>")
    .array("v")
    .alias("v", "verkey")
    .alias("t", "starkstruct")
    .array("s")
    .alias("s", "starkinfo")
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
    if(!["blob_outer", "compressor", "recursive1", "recursive2", "recursivef"].includes(template)) throw new Error("Invalid template name provided!");

    let fileName = argv.filename;
    if(!fileName) fileName = template;

    const starkInfoVerifiers = [];

    const starkInfos = argv.starkinfo;
    if(typeof (starkInfos[0]) !== "string") throw new Error("A stark info file must be provided!");
    starkInfoVerifiers.push(JSON.parse(await fs.promises.readFile(starkInfos[0].trim(), "utf8")));

    if(template === "blob_outer") {
        if(typeof (starkInfos[1]) !== "string") throw new Error("A second stark info file must be provided!");
        starkInfoVerifiers.push(JSON.parse(await fs.promises.readFile(starkInfos[1].trim(), "utf8")));
    }

    if(!argv.starkstruct || typeof(argv.starkstruct) !== "string") throw new Error("A stark struct file must be provided!");
    const starkStructFile = argv.starkstruct.trim();
    const starkStruct = JSON.parse(await fs.promises.readFile(starkStructFile, "utf8"));

    let cols = argv.cols ? Number(argv.cols) : 12;

    let isBatchRecursion = argv.batch ? true : false;

    let isEip4844 = argv.eip4844 ? true : false;

    const skipConstTree = argv.skipconsttree === "true" ? true : false;

    let vks = [];

    if(!argv.verkey) throw new Error("A verification key file must be provided!");

    let verkeyArray = argv.verkey;

    if(typeof(verkeyArray[0]) !== "string") throw new Error("A second verification key file must be provided!");
    const verkey = JSONbig.parse(await fs.promises.readFile(verkeyArray[0].trim(), "utf8"));
    vks.push(verkey.constRoot);
    
    if(template === "recursivef" || template === "blob_outer") {
        if(typeof(verkeyArray[1]) !== "string") throw new Error("A second verification key file must be provided!");
        const verkey2 = JSONbig.parse(await fs.promises.readFile(verkeyArray[1].trim(), "utf8"));
        vks.push(verkey2.constRoot);
    }

    if(template === "blob_outer") {
        if(typeof(verkeyArray[2]) !== "string") throw new Error("A third verification key file must be provided!");
        const verkey3 = JSONbig.parse(await fs.promises.readFile(verkeyArray[2].trim(), "utf8"));
        vks.push(verkey3.constRoot);
    }
    
    let verifierNames = [];

    let verifierName = argv.verifiername;
    if(!verifierName) throw new Error("A verifier name must be provided!")
    verifierNames.push(verifierName);

    if(template === "blob_outer") {
        let verifierName2 = argv.verifiername2;
        if(!verifierName2) throw new Error("A verifier name for blob inner must be provided!")
        verifierNames.push(verifierName2);
    }

    let genCircomTemplate = ["blob_outer", "recursive1", "recursive2", "recursivef"].includes(template) ? true : false;

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
