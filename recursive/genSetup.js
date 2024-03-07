
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const fs = require('fs');
const path = require("path");
const ejs = require("ejs");
const { compile } = require('pilcom');
const { pil2circom, starkInfo } = require('pil-stark');
const F3g = require('pil-stark/src/helpers/f3g.js');
const {buildConstTree} = require('pil-stark/src/stark/stark_buildConstTree.js');
const {buildCHelpers} = require('pil-stark/src/stark/chelpers/stark_chelpers.js');
const {compressorSetup} = require('pil-stark/src/compressor/compressor_setup');

module.exports.genSetup = async function genSetup(template, starkStruct, fileName, vks, verifierNames, starkInfoVerifiers, options) {
    const F = new F3g();

    if(template === "batch_blob") {
        if(verifierNames.length !== 2) throw new Error("Invalid number of verifier names provided!");
        if(starkInfoVerifiers.length !== 2) throw new Error("Invalid number of stark infos provided!");
    } else {
        if(verifierNames.length !== 1) throw new Error("Invalid number of verifier names provided!");
        if(starkInfoVerifiers.length !== 1) throw new Error("Invalid number of stark infos provided!");
    }

    const skipConstTree = options.skipConstTree || false;

    const compressorCols = options.compressorCols || 12;
    const genCircomTemplate = options.genCircomTemplate || false;
    
    const isBatchRecursion = options.isBatchRecursion || false;
    
    const isEip4844 = options.isEip4844 || false;

    const buildDir = options.buildDir || "tmp";

    let enableInput = isBatchRecursion && ["batch_blob", "recursive2", "recursivef"].includes(template) ? true : false;
    let verkeyInput = ["batch_blob", "recursive2", "recursivef"].includes(template) ? true : false;
    
    let verifierFilename = `${buildDir}/${verifierNames[0]}.verifier.circom`;

    let skipMain = verifierNames[0] === "zkevm" ? false : true;

    //Generate circom
    const constRoot = vks[0] || undefined;
    const verifierCircomTemplate = await pil2circom(constRoot, starkInfoVerifiers[0], { skipMain, verkeyInput, enableInput });
    await fs.promises.writeFile(verifierFilename, verifierCircomTemplate, "utf8");

    if(template === "batch_blob") {
        let verifier2Filename = `${buildDir}/${verifierNames[1]}.verifier.circom`;

        const constRoot2 = vks[2] || undefined;
        const verifierCircom2Template = await pil2circom(constRoot2, starkInfoVerifiers[1], { skipMain });
        await fs.promises.writeFile(verifier2Filename, verifierCircom2Template, "utf8");
    }

    const recursiveFilename = genCircomTemplate ? `${buildDir}/${fileName}.circom` : verifierFilename;

    const nStages = 3; // This will be obtained from the starkInfo when moving to Vadcops

    // Generate recursive circom
    if(genCircomTemplate) {
        const circomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", `${template}.circom.ejs`), "utf8");

        const circomVerifier = ejs.render(circomTemplate, {nStages, starkInfoVerifiers, vks, isBatchRecursion, verifierNames, isEip4844});
        await fs.promises.writeFile(recursiveFilename, circomVerifier, "utf8");
    } 
  
    // Compile circom
    const compileRecursiveCommand = `circom --O1 --r1cs --sym --prime goldilocks --inspect --wasm --c --verbose -l node_modules/pil-stark/circuits.gl -l src/circuits ${recursiveFilename} -o ${buildDir}`;
    const execCompile = await exec(compileRecursiveCommand);
    console.log(execCompile.stdout);

    // Generate setup
    const recursiveR1csFile = genCircomTemplate ? `${buildDir}/${fileName}.r1cs` : `${buildDir}/${verifierNames[0]}.verifier.r1cs`;
    const {exec: execBuff, pilStr, constPols} = await compressorSetup(F, recursiveR1csFile, compressorCols);

    await constPols.saveToFile(`${buildDir}/${fileName}.const`);

    const fd =await fs.promises.open(`${buildDir}/${fileName}.exec`, "w+");
    await fd.write(execBuff);
    await fd.close();

    await fs.promises.writeFile(`${buildDir}/${fileName}.pil`, pilStr, "utf8");

    // Build stark info
    const pilRecursive = await compile(F, `${buildDir}/${fileName}.pil`);
    const starkInfoRecursive = starkInfo(pilRecursive, starkStruct);

    await fs.promises.writeFile(`${buildDir}/${fileName}.starkinfo.json`, JSON.stringify(starkInfoRecursive, null, 1), "utf8");

    await fs.promises.writeFile(`${buildDir}/${fileName}.starkstruct.json`, JSON.stringify(starkStruct, null, 1), "utf8");

    // Build chelpers 
    
    const fileNameModified = fileName.split("_").map(f => f.charAt(0).toUpperCase() + f.slice(1)).join("");
    const className = fileNameModified;
    const binFile = `${buildDir}/${fileName}.chelpers.bin`;
    const cHelpersFile = `${buildDir}/${fileName}.chelpers`;
    await buildCHelpers(starkInfoRecursive, cHelpersFile, binFile, className);
   
    if(skipConstTree) return { starkInfo: starkInfoRecursive };

    // Build const tree
    const {constTree, MH, verKey} = await buildConstTree(starkStruct, pilRecursive, constPols);

    await fs.promises.writeFile(`${buildDir}/${fileName}.verkey.json`, JSONbig.stringify(verKey, null, 1), "utf8");

    await MH.writeToFile(constTree, `${buildDir}/${fileName}.consttree`);

    return { constRoot: verKey, starkInfo: starkInfoRecursive}

}