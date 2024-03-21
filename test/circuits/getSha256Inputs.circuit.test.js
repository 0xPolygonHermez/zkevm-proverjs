const path = require("path");
const tmp = require('temporary');
const fs = require("fs");
const ejs = require("ejs");
const { batchPublics, blobOuterPublics } = require("../../src/templates/publics");
const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs/src/smt-utils");
const { FrSNARK } = require("@0xpolygonhermez/zkevm-commonjs/src/constants");
const { F1Field, Scalar } = require("ffjavascript");
const { assert } = require("chai");
const { solidityPackedSha256 } = require("ethers");
const { padZeros } = require("@0xpolygonhermez/zkevm-commonjs/src/utils");


const wasm_tester = require("circom_tester").wasm;

function preparePublics(publics, publicsIndexes) {
    const Fr = new F1Field(0xffffffff00000001n);

    const publicsCircom = new Array(publicsIndexes.nPublics);

    const publicsNames = Object.keys(publicsIndexes);
    for(let i = 0; i < publicsNames.length; i++) {
        const name = publicsNames[i];
        if(name === "nPublics") continue;
        
        const nameIndex = publicsIndexes[name];
        const nextNameIndex = publicsIndexes[publicsNames[i + 1]];
        const length = nextNameIndex - nameIndex;
        const value = publics[name.slice(0, -3)];
        if(length === 1) {
            publicsCircom[nameIndex] = Fr.e(value);
        } else if(length === 8) {
            const circomInputs = scalar2fea(Fr, Scalar.e(value));
            for(let j = 0; j < circomInputs.length; j++) {
                publicsCircom[nameIndex + j] = circomInputs[j];
            }
        } else throw new Error("Unsupported length: ", + length);

    }

    return publicsCircom;
}

function generatePublicsBatch(aggregatorAddress) {

    const oldStateRoot = generateRandomHex();
    const oldBatchAccInputHash = generateRandomHex();
    const oldBatchNum = Math.floor(Math.random() * Math.pow(2,8));
    const chainId = Math.floor(Math.random() * 10);
    const forkId = Math.floor(Math.random() * 10);
    const newStateRoot = generateRandomHex();
    const newBatchAccInputHash = generateRandomHex();
    const newLocalExitRoot = generateRandomHex();       
    const newBatchNum = Math.floor(Math.random() * Math.pow(2,8));

    const publicsBatch = { oldStateRoot, oldBatchAccInputHash, oldBatchNum, chainId, forkId, newStateRoot, newBatchAccInputHash, newLocalExitRoot, newBatchNum };

    const publicsBatchCircom = preparePublics(publicsBatch, batchPublics);
    const publicsBatchSolidity = [oldStateRoot, oldBatchAccInputHash, oldBatchNum, chainId, forkId, newStateRoot, newBatchAccInputHash, newLocalExitRoot, newBatchNum, aggregatorAddress];
    const publicsBatchHashTypesSolidity = ["uint256", "uint256", "uint64", "uint64", "uint64", "uint256", "uint256", "uint256", "uint64", "address"];
    
    return { publicsBatchCircom, publicsBatchSolidity, publicsBatchHashTypesSolidity };
}

function generatePublicsBlobOuter(aggregatorAddress) {

    const oldStateRoot = generateRandomHex();
    const oldBlobStateRoot = generateRandomHex();
    const oldBlobAccInputHash = generateRandomHex();
    const oldBlobNum = Math.floor(Math.random() * 10);
    const chainId = Math.floor(Math.random() * 10);
    const forkId = Math.floor(Math.random() * 10);
    const newStateRoot = generateRandomHex();
    const newBlobStateRoot = generateRandomHex();
    const newBlobAccInputHash = generateRandomHex();
    const newBlobNum = oldBlobNum + 1;
    const newLocalExitRoot = generateRandomHex();

    const publicsBlobOuter = { oldStateRoot, oldBlobStateRoot, oldBlobAccInputHash, oldBlobNum, chainId, forkId, newStateRoot, newBlobStateRoot, newBlobAccInputHash, newBlobNum, newLocalExitRoot };

    const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
    const publicsBlobOuterSolidity = [oldStateRoot, oldBlobStateRoot, oldBlobAccInputHash, oldBlobNum, chainId, forkId, newStateRoot, newBlobStateRoot, newBlobAccInputHash, newBlobNum, newLocalExitRoot, aggregatorAddress];
    const publicsBlobOuterHashTypesSolidity =  ["uint256", "uint256", "uint256", "uint64", "uint64", "uint64", "uint256", "uint256", "uint256", "uint64", "uint256", "address"];
    
    return { publicsBlobOuterCircom, publicsBlobOuterSolidity, publicsBlobOuterHashTypesSolidity };
}

function generateRandomHex() {
    return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}


describe("Get Sha256 Inputs Circuit Test", function () {
    let circuitEip4844;

    let circuit;

    let aggregatorAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    this.timeout(10000000);

    before( async() => {
        const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "get_sha256_inputs.circom.ejs"), "utf8");
        
        const optionsEip4844 = { batchPublics, blobOuterPublics, isEip4844: true, isTest: true}
        const content4844 = ejs.render(template, optionsEip4844);
        const circuitEip4844File = path.join(new tmp.Dir().path, "circuitEip4844.circom");
        await fs.promises.writeFile(circuitEip4844File, content4844);
        circuitEip4844 = await wasm_tester(circuitEip4844File, {O:1, include: "node_modules/circomlib/circuits"});
    
        const optionsEip = { batchPublics, blobOuterPublics, isEip4844: false, isTest: true}
        const content = ejs.render(template, optionsEip);
        const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
        await fs.promises.writeFile(circuitFile, content);
        circuit = await wasm_tester(circuitFile, {O:1, include: "node_modules/circomlib/circuits"});
    });

    it("Test that solidity hash matches circom hash if isEip4844 is false", async () => {
        const { publicsBatchCircom, publicsBatchSolidity, publicsBatchHashTypesSolidity } = generatePublicsBatch(aggregatorAddress);

        const sha256Solidity = Scalar.mod(Scalar.fromString(solidityPackedSha256(publicsBatchHashTypesSolidity, publicsBatchSolidity), 16), FrSNARK);

        const witness = await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBatchCircom}, true);
        
        const sha256Circom = witness[1];

        assert(sha256Solidity == sha256Circom);
    
    });

    it("Test that solidity hash matches circom hash if isEip4844 is true", async () => {
        const { publicsBlobOuterCircom, publicsBlobOuterSolidity, publicsBlobOuterHashTypesSolidity } = generatePublicsBlobOuter(aggregatorAddress);

        const sha256Solidity = Scalar.mod(Scalar.fromString(solidityPackedSha256(publicsBlobOuterHashTypesSolidity, publicsBlobOuterSolidity), 16), FrSNARK);

        const witness = await circuitEip4844.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);

        const sha256Circom = witness[1];

        assert(sha256Solidity == sha256Circom);


    });
});
