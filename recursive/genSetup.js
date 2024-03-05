
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const fs = require('fs');
const path = require("path");
const ejs = require("ejs");
const { compile } = require('pilcom');
const { starkInfo, pil2circom } = require('pil-stark');
const F3g = require('pil-stark/src/helpers/f3g.js');
const {buildConstTree} = require('pil-stark/src/stark/stark_buildConstTree.js');
const {buildCHelpers} = require('pil-stark/src/stark/chelpers/stark_chelpers.js');
const {compressorSetup} = require('pil-stark/src/compressor/compressor_setup');

module.exports.genSetup = async function genSetup(template, verifierName, vks, fileName, starkInfoJson, starkStruct, buildDir, options) {

    const F = new F3g();

    const skipConstTree = options.skipConstTree || false;

    const compressorCols = options.compressorCols || 12;
    const genCircomTemplate = options.genCircomTemplate || false;
    
    const isBatchRecursion = options.isBatchRecursion || false;
    
    let enableInput = isBatchRecursion && ["recursive2", "recursivef"].includes(template) ? true : false;
    let verkeyInput = ["recursive2", "recursivef"].includes(template) ? true : false;
    
    let verifierFilename = `${buildDir}/${verifierName}.verifier.circom`;

    let skipMain = verifierName === "zkevm" ? false : true;

    //Generate circom
    const constRoot = vks[0] || undefined;
    const verifierCircomTemplate = await pil2circom(constRoot, starkInfoJson, { skipMain, verkeyInput, enableInput });
    await fs.promises.writeFile(verifierFilename, verifierCircomTemplate, "utf8");

    const recursiveFilename = genCircomTemplate ? `${buildDir}/${fileName}.circom` : verifierFilename;

    const nStages = 3; // This will be obtained from the starkInfo when moving to Vadcops

    // Generate recursive circom
    if(genCircomTemplate) {
        const circomTemplate = await fs.promises.readFile(path.join(__dirname, "templates", `${template}.circom.ejs`), "utf8");
        const circomVerifier = ejs.render(circomTemplate, {nStages, starkInfo: starkInfoJson, constRoot: vks[0], constRoot2: vks[1], isBatchRecursion, verifierName});
        await fs.promises.writeFile(recursiveFilename, circomVerifier, "utf8");
    }
   
    // Compile circom
    const compileRecursiveCommand = `circom --O1 --r1cs --sym --prime goldilocks --inspect --wasm --c --verbose -l node_modules/pil-stark/circuits.gl -l src/circuits ${recursiveFilename} -o ${buildDir}`;
    const execCompile = await exec(compileRecursiveCommand);
    console.log(execCompile.stdout);

    // Generate setup
    const recursiveR1csFile = genCircomTemplate ? `${buildDir}/${fileName}.r1cs` : `${buildDir}/${verifierName}.verifier.r1cs`;
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
    // TODO: Modify this if we decide to integrate new parser
    const cHelpersFile = `${buildDir}/${fileName}.chelpers/${fileName}.chelpers.cpp`;
    const className = fileName.charAt(0).toUpperCase() + fileName.slice(1) + "Steps";
    await buildCHelpers(starkInfoRecursive, cHelpersFile, {multiple: true, optcodes: false, className})

    if(skipConstTree) return { starkInfo: starkInfoRecursive };

    // Build const tree
    const {constTree, MH, verKey} = await buildConstTree(starkStruct, pilRecursive, constPols);

    await fs.promises.writeFile(`${buildDir}/${fileName}.verkey.json`, JSONbig.stringify(verKey, null, 1), "utf8");

    await MH.writeToFile(constTree, `${buildDir}/${fileName}.consttree`);

    return { constRoot: verKey, starkInfo: starkInfoRecursive}

}