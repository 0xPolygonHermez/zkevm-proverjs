
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require("path");
const ejs = require("ejs");
const { pil2circom } = require('pil-stark');

module.exports.genFinalSetup = async function genFinalSetup(fileName, constRoot, verifierName, starkInfoVerifier, options) {

    const isEip4844 = options.isEip4844 || false;

    const buildDir = options.buildDir || "tmp";
    
    //Generate circom
    let verifierFilename = `${buildDir}/${verifierName}.verifier.circom`;
    const verifierCircomTemplate = await pil2circom(constRoot, starkInfoVerifier, { skipMain: true});
    await fs.promises.writeFile(verifierFilename, verifierCircomTemplate, "utf8");

    // Generate final circom
    const finalTemplate = await fs.promises.readFile(path.join(__dirname, "templates", `final.circom.ejs`), "utf8");

    const nStages = 3; // This will be obtained from the starkInfo when moving to Vadcops

    const finalVerifier = ejs.render(finalTemplate, {nStages, starkInfo: starkInfoVerifier, isEip4844, verifierName});
    const recursiveFilename = `${buildDir}/${fileName}.circom`;
    await fs.promises.writeFile(recursiveFilename, finalVerifier, "utf8");


    // Compile circom
    const compileRecursiveCommand = `circom --O1 --r1cs --sym --inspect --c --wasm --verbose -l src/circuits -l node_modules/pil-stark/circuits.bn128 -l node_modules/circomlib/circuits ${buildDir}/final.circom -o ${buildDir}`;
    const execCompile = await exec(compileRecursiveCommand);
    console.log(execCompile.stdout);

}