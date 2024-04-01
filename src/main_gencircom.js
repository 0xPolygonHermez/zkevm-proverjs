const version = require("../package").version;
const fs = require("fs");
const path = require("path");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const { batchPublics, batchPublicsEip4844, blobInnerPublics, blobOuterPublics } = require("./templates/helpers/publics");
const ejs = require("ejs");
const argv = require("yargs")
    .version(version)
    .usage("node main_gencircom.js -v <verification_keys.json> -s starkinfo.json -t starkstruct.json --cols=<12/18> --template=<compressor/recursive1/recursive2/recursivef>")
    .array("v").alias("v", "verkey")
    .array("s").alias("s", "starkinfo")
    .alias("b", "builddir")
    .alias("r", "recursivefile")
    .string("template")
    .string("verifiername")
    .string("verifiername2")
    .string("arity")
    .argv;


async function run() {
    const templateName = argv.template;
    if(!templateName) throw new Error("A template name must be provided!");
    if(!["blob_outer", "compressor", "recursive1", "recursive2", "recursive2_batch", "recursive2_blob", "recursivef", "final", "final_blob"].includes(templateName)) throw new Error("Invalid template name provided!");

    let template;
    if(templateName.includes("final")) {
        template = "final";
    } else if(templateName.includes("recursive2")) {
        template = "recursive2";
    } else {
        template = templateName;
    }

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

    const options = {
        setEnableInput: argv.setenable || false,
        setAggregatedKey: argv.aggkey || false,
        isAggregatedInput: argv.isagg || false,
    }
    let vks = [];

    if(!argv.verkey) throw new Error("A verification key file must be provided!");

    let verkeyArray = argv.verkey;

    if(typeof(verkeyArray[0]) !== "string") throw new Error("A second verification key file must be provided!");
    const verkey = JSONbig.parse(await fs.promises.readFile(verkeyArray[0].trim(), "utf8"));
    vks.push(verkey.constRoot);
    
    let verifierNames = [];

    let verifierName = argv.verifiername;
    if(!verifierName) throw new Error("A verifier name must be provided!")
    verifierNames.push(verifierName);

    const optionsCircom = {
        nStages: 3,
        starkInfoVerifiers,
        vks,
        options,
        verifierNames,
    };

    if(template === "recursive2") {
        const buildDir = argv.builddir;
        if(typeof (buildDir) !== "string") throw new Error("A build directory must be provided!");

        let verifyRecursive2CircomTemplate;
        let verifyRecursive2InputsCircom = { isTest: false };
        
        if(templateName === "recursive2") {
            verifyRecursive2CircomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "recursive2", "recursive2_checks_batch.circom.ejs"), "utf8");
            verifyRecursive2InputsCircom.publics = batchPublics;
            optionsCircom.publics = batchPublics;
        } else if(templateName === "recursive2_batch") {
            verifyRecursive2CircomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "recursive2", "recursive2_checks_batch_eip4844.circom.ejs"), "utf8");
            verifyRecursive2InputsCircom.publics = batchPublicsEip4844;
            optionsCircom.publics = batchPublicsEip4844;
        } else if(templateName === "recursive2_blob") {
            verifyRecursive2CircomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "recursive2", "recursive2_checks_blob.circom.ejs"), "utf8");
            verifyRecursive2InputsCircom.publics = blobOuterPublics;
            optionsCircom.publics = blobOuterPublics;
        } else throw new Error("Invalid templateName" + templateName);

        const verifyRecursive2File = `${buildDir}/verify_recursive2.circom`;
        if(typeof (verifyRecursive2File) !== "string") throw new Error("A verify recursive2 file must be provided!");

        const verifyRecursive2CircomFile = ejs.render(verifyRecursive2CircomTemplate, verifyRecursive2InputsCircom);
        await fs.promises.writeFile(verifyRecursive2File, verifyRecursive2CircomFile, "utf8");

    } 
    
    if(template === "blob_outer") {
        const buildDir = argv.builddir;
        if(typeof (buildDir) !== "string") throw new Error("A build directory must be provided!");

        if(typeof(verkeyArray[1]) !== "string") throw new Error("A second verification key file must be provided!");
        const verkey2 = JSONbig.parse(await fs.promises.readFile(verkeyArray[1].trim(), "utf8"));
        vks.push(verkey2.constRoot);

        if(typeof(verkeyArray[2]) !== "string") throw new Error("A third verification key file must be provided!");
        const verkey3 = JSONbig.parse(await fs.promises.readFile(verkeyArray[2].trim(), "utf8"));
        vks.push(verkey3.constRoot);

        let verifierName2 = argv.verifiername2;
        if(!verifierName2) throw new Error("A verifier name for blob inner must be provided!")
        verifierNames.push(verifierName2);

        if(verifierNames.length < 2) throw new Error("Invalid number of verifier names provided!");
        if(starkInfoVerifiers.length < 2) throw new Error("Invalid number of stark infos provided!");

        const verifyBlobOuterCircomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "verify_blob_outer.circom.ejs"), "utf8");
        const optionsVerifyBlobOuterCircom = {
            batchPublics: batchPublicsEip4844,
            blobInnerPublics,
            blobOuterPublics,
            isTest: false,
        };

        optionsCircom.batchPublics = batchPublicsEip4844;
        optionsCircom.blobInnerPublics = blobInnerPublics;
        optionsCircom.blobOuterPublics = blobOuterPublics;

        const verifyBlobOuterFile = `${buildDir}/verify_blob_outer.circom`;
        if(typeof (verifyBlobOuterFile) !== "string") throw new Error("A verify blob outer file must be provided!");

        const verifyBlobOuterCircomFile = ejs.render(verifyBlobOuterCircomTemplate, optionsVerifyBlobOuterCircom);
        await fs.promises.writeFile(verifyBlobOuterFile, verifyBlobOuterCircomFile, "utf8");
    }

    if(template === "recursivef") {
        if(typeof(verkeyArray[1]) !== "string") throw new Error("A second verification key file must be provided!");
        const verkey2 = JSONbig.parse(await fs.promises.readFile(verkeyArray[1].trim(), "utf8"));
        vks.push(verkey2.constRoot);
    }

    if(template === "final") {
        const buildDir = argv.builddir;
        if(typeof (buildDir) !== "string") throw new Error("A build directory must be provided!");

        let getSha256InputsTemplate;
        let optionsGetSha256InputsCircom = { isTest: false };
        
        if(templateName === "final_blob") {
            getSha256InputsTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "final", "get_sha256_inputs_blob.circom.ejs"), "utf8");
            optionsGetSha256InputsCircom.publics = blobOuterPublics;
        } else {
            getSha256InputsTemplate = await fs.promises.readFile(path.join(__dirname, "templates", "helpers", "final", "get_sha256_inputs_batch.circom.ejs"), "utf8");
            optionsGetSha256InputsCircom.publics = blobOuterPublics;
        }
       
        const getSha256InputsFile = `${buildDir}/get_sha256_inputs.circom`;
        if(typeof (getSha256InputsFile) !== "string") throw new Error("A get sha256 inputs file must be provided!");

        const getSha256InputsCircomFile = ejs.render(getSha256InputsTemplate, optionsGetSha256InputsCircom);
        await fs.promises.writeFile(getSha256InputsFile, getSha256InputsCircomFile, "utf8");

        options.arity = starkInfoVerifiers[0].merkleTreeArity;
    }


    const circomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", `${template}.circom.ejs`), "utf8");

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
