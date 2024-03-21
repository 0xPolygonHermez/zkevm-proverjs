const version = require("../package").version;
const fs = require("fs");
const path = require("path");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const { batchPublics, batchPublicsEip4844, blobInnerPublics, blobOuterPublics } = require("./templates/publics");
const ejs = require("ejs");
const argv = require("yargs")
    .version(version)
    .usage("node main_gencircom.js -v <verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<compressor/recursive1/recursive2/recursivef>")
    .array("v").alias("v", "verkey")
    .array("s").alias("s", "starkinfo")
    .alias("b", "batch")
    .alias("e", "eip4844")
    .array("r").alias("r", "recursivefile")
    .string("template")
    .string("verifiername")
    .string("verifiername2")
    .string("arity")
    .argv;


async function run() {
    const template = argv.template;
    if(!template) throw new Error("A template name must be provided!");
    if(!["blob_outer", "compressor", "recursive1", "recursive2", "recursivef", "final"].includes(template)) throw new Error("Invalid template name provided!");

    const recursiveFiles = argv.recursivefile;
    const recursiveFile = recursiveFiles[0];
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

        const verifyBlobOuterCircomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "verify_blob_outer.circom.ejs"), "utf8");
        const optionsVerifyBlobOuterCircom = {
            batchPublics: batchPublicsEip4844,
            blobInnerPublics,
            blobOuterPublics,
            isTest:false,
        };

        const verifyBlobOuterFile = recursiveFiles[1];
        if(typeof (verifyBlobOuterFile) !== "string") throw new Error("A verify blob outer file must be provided!");

        const verifyBlobOuterCircomFile = ejs.render(verifyBlobOuterCircomTemplate, optionsVerifyBlobOuterCircom);
        await fs.promises.writeFile(verifyBlobOuterFile, verifyBlobOuterCircomFile, "utf8");
    }

    if(template === "final") {
        const getSha256InputsTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "get_sha256_inputs.circom.ejs"), "utf8");
        const optionsGetSha256InputsCircom = {
            batchPublics: isEip4844 ? batchPublicsEip4844 : batchPublics,
            blobOuterPublics,
            isEip4844,
            isTest:false,
        };

        const getSha256InputsFile = recursiveFiles[1];
        if(typeof (getSha256InputsFile) !== "string") throw new Error("A get sha256 inputs file must be provided!");

        const getSha256InputsCircomFile = ejs.render(getSha256InputsTemplate, optionsGetSha256InputsCircom);
        await fs.promises.writeFile(getSha256InputsFile, getSha256InputsCircomFile, "utf8");
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
