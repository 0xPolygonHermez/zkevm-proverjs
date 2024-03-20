const version = require("../package").version;
const fs = require("fs");
const path = require("path");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const ejs = require("ejs");
const argv = require("yargs")
    .version(version)
    .usage("node main_gencircom.js -v <verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<compressor/recursive1/recursive2/recursivef>")
    .array("v")
    .alias("v", "verkey")
    .array("s")
    .alias("s", "starkinfo")
    .alias("b", "batch")
    .alias("e", "eip4844")
    .alias("r", "recursivefile")
    .string("template")
    .string("verifiername")
    .string("verifiername2")
    .string("arity")
    .argv;

const batchPublicsEip4844 = {
    oldStateRootPos: 0,
    oldBatchAccInputHashPos: 8,
    previousL1InfoTreeRootPos: 16,
    previousL1InfoTreeIndexPos: 24,
    chainIdPos: 25,
    forkIdPos: 26,
    newStateRootPos: 27,
    newBatchAccInputHashPos: 35,
    currentL1InfoTreeRootPos: 43,
    currentL1InfoTreeIndexPos: 51,
    newLocalExitRootPos: 52,
    newLastTimestampPos: 60,
};

const batchPublics = {
    oldStateRootPos: 0,
    oldBatchAccInputHashPos: 8,
    oldBatchNumPos: 16,
    chainIdPos: 17,
    forkIdPos: 18,
    newStateRootPos: 19,
    newBatchAccInputHashPos: 27,
    newLocalExitRootPos: 35,
    newBatchNumPos: 43,
};

const blobInnerPublics = {
    oldBlobStateRootPos: 0,
    oldBlobAccInputHashPos: 8,
    oldBlobNumPos: 16,
    oldStateRootPos: 17,
    forkIdPos: 25,
    newBlobStateRootPos: 26,
    newBlobAccInputHashPos: 34,
    newBlobNumPos: 42,
    finalAccBatchHashDataPos: 43,
    localExitRootFromBlobPos: 51,
    isInvalidPos: 59,
    timestampLimitPos: 60,
    lastL1InfoTreeRootPos: 61,
    lastL1InfoTreeIndexPos: 69,
};

const blobOuterPublics = {
    oldStateRootPos: 0,
    oldBlobStateRootPos: 8,
    oldBlobAccInputHashPos: 16,
    oldBlobNumPos: 24,
    chainIdPos: 25,
    forkIdPos: 26,
    newStateRootPos: 27,
    newBlobStateRootPos: 35,
    newBlobAccInputHashPos: 43,
    newBlobNumPos: 51,
    newLocalExitRootPos: 52,
};


async function run() {
    const template = argv.template;
    if(!template) throw new Error("A template name must be provided!");
    if(!["blob_outer", "compressor", "recursive1", "recursive2", "recursivef", "final"].includes(template)) throw new Error("Invalid template name provided!");

    const recursiveFile = argv.recursivefile;
    if(typeof (recursiveFile) !== "string") throw new Error("A recursive file must be provided!");

    const starkInfoVerifiers = [];

    const starkInfos = argv.starkinfo;
    if(typeof (starkInfos[0]) !== "string") throw new Error("A stark info file must be provided!");
    starkInfoVerifiers.push(JSON.parse(await fs.promises.readFile(starkInfos[0].trim(), "utf8")));

    if(template === "blob_outer") {
        if(typeof (starkInfos[1]) !== "string") throw new Error("A second stark info file must be provided!");
        starkInfoVerifiers.push(JSON.parse(await fs.promises.readFile(starkInfos[1].trim(), "utf8")));
    }

    let isBatchRecursion = argv.batch ? true : false;
    let isEip4844 = argv.eip4844 || template === "blob_outer" ? true : false;

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
    
    if(template === "blob_outer") {
        if(verifierNames.length !== 2) throw new Error("Invalid number of verifier names provided!");
        if(starkInfoVerifiers.length !== 2) throw new Error("Invalid number of stark infos provided!");
    } else {
        if(verifierNames.length !== 1) throw new Error("Invalid number of verifier names provided!");
        if(starkInfoVerifiers.length !== 1) throw new Error("Invalid number of stark infos provided!");
    }

    const arity = argv.arity ? parseInt(argv.arity) : 16;

    const nStages = 3; // This will be obtained from the starkInfo when moving to Vadcops

    const circomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", `${template}.circom.ejs`), "utf8");

    const optionsCircom = {
        nStages,
        starkInfoVerifiers,
        vks,
        isBatchRecursion,
        verifierNames,
        isEip4844,
        arity,
        batchPublics: isEip4844 ? batchPublicsEip4844 : batchPublics,
        blobInnerPublics,
        blobOuterPublics,
    };
    const circomVerifier = ejs.render(circomTemplate, optionsCircom);
    await fs.promises.writeFile(recursiveFile, circomVerifier, "utf8");

    console.log("file Generated Correctly");

}
run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
