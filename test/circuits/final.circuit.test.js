const path = require("path");
const tmp = require('temporary');
const fs = require("fs");
const ejs = require("ejs");
const { batchPublics, blobOuterPublics } = require("../../src/templates/helpers/publics");
const { FrSNARK } = require("@0xpolygonhermez/zkevm-commonjs/src/constants");
const { Scalar } = require("ffjavascript");
const { solidityPackedSha256 } = require("ethers");
const { preparePublics, generateRandomHex, generateRandomValue } = require("./helpers");
const { assert } = require("console");


const wasm_tester = require("circom_tester").wasm;

function generatePublicsBatch(aggregatorAddress) {

    const oldStateRoot = generateRandomHex(63);
    const oldBatchAccInputHash = generateRandomHex(256);
    const oldBatchNum = generateRandomValue(10);
    const chainId = generateRandomValue(10);
    const forkId = generateRandomValue(10);
    const newStateRoot = generateRandomHex(63);
    const newBatchAccInputHash = generateRandomHex(256);
    const newLocalExitRoot = generateRandomHex(256);       
    const newBatchNum = oldBatchNum + 10;

    const publicsBatch = { oldStateRoot, oldBatchAccInputHash, oldBatchNum, chainId, forkId, newStateRoot, newBatchAccInputHash, newLocalExitRoot, newBatchNum };

    const publicsBatchSolidity = [oldStateRoot, oldBatchAccInputHash, oldBatchNum, chainId, forkId, newStateRoot, newBatchAccInputHash, newLocalExitRoot, newBatchNum, aggregatorAddress];
    const publicsBatchHashTypesSolidity = ["uint256", "uint256", "uint64", "uint64", "uint64", "uint256", "uint256", "uint256", "uint64", "address"];
    
    return { publicsBatch, publicsBatchSolidity, publicsBatchHashTypesSolidity };
}

function generatePublicsBlob(aggregatorAddress) {

    const oldStateRoot = generateRandomHex(63);
    const oldBlobStateRoot = generateRandomHex(63);
    const oldBlobAccInputHash = generateRandomHex(256);
    const oldBlobNum = generateRandomValue(10);
    const chainId = generateRandomValue(10);
    const forkId = generateRandomValue(10);
    const newStateRoot = generateRandomHex(63);
    const newBlobStateRoot = generateRandomHex(63);
    const newBlobAccInputHash = generateRandomHex(256);
    const newBlobNum = oldBlobNum + 1;
    const newLocalExitRoot = generateRandomHex(256);

    const publicsBlobOuter = { oldStateRoot, oldBlobStateRoot, oldBlobAccInputHash, oldBlobNum, chainId, forkId, newStateRoot, newBlobStateRoot, newBlobAccInputHash, newBlobNum, newLocalExitRoot };

    const publicsBlobOuterSolidity = [oldStateRoot, oldBlobStateRoot, oldBlobAccInputHash, oldBlobNum, chainId, forkId, newStateRoot, newBlobStateRoot, newBlobAccInputHash, newBlobNum, newLocalExitRoot, aggregatorAddress];
    const publicsBlobOuterHashTypesSolidity =  ["uint256", "uint256", "uint256", "uint64", "uint64", "uint64", "uint256", "uint256", "uint256", "uint64", "uint256", "address"];
    
    return { publicsBlobOuter, publicsBlobOuterSolidity, publicsBlobOuterHashTypesSolidity };
}

describe("Get Sha256 Inputs Circuit Test", function () {
    let aggregatorAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    this.timeout(10000000);

    describe("Forks previous to Feijoa", async() => {
        let circuit;

        beforeEach( async() => {
            const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "final", "get_sha256_inputs_batch.circom.ejs"), "utf8");
    
            const options = { publics: batchPublics, isTest: true}
            const content = ejs.render(template, options);
            const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
            await fs.promises.writeFile(circuitFile, content);
            circuit = await wasm_tester(circuitFile, {O:1, include: ["node_modules/circomlib/circuits", "node_modules/pil-stark/circuits.bn128"]});
        });

        it("Test that solidity hash matches circom hash", async () => {
            const { publicsBatch, publicsBatchSolidity, publicsBatchHashTypesSolidity } = generatePublicsBatch(aggregatorAddress);
            const publicsBatchCircom = preparePublics(publicsBatch, batchPublics);
    
            const sha256Solidity = Scalar.mod(Scalar.fromString(solidityPackedSha256(publicsBatchHashTypesSolidity, publicsBatchSolidity), 16), FrSNARK);
    
            const witness = await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBatchCircom}, true);
            
            await circuit.assertOut(witness, { publicsHash: sha256Solidity });
        });

        it("Fails if old state root is higher than GL", async () => {
            const { publicsBatch } = generatePublicsBatch(aggregatorAddress);
            publicsBatch.oldStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBatchCircom = preparePublics(publicsBatch, batchPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBatchCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });
    
        it("Fails if new state root is higher than GL", async () => {
            const { publicsBatch } = generatePublicsBatch(aggregatorAddress);
            publicsBatch.newStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBatchCircom = preparePublics(publicsBatch, batchPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBatchCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });
    }); 

    describe("Forks after Feijoa", async() => {
        let circuit;

        beforeEach( async() => {
            const templateEip4844 = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "final", "get_sha256_inputs_blob.circom.ejs"), "utf8");
            
            const optionsEip4844 = { publics: blobOuterPublics, isTest: true }
            const content4844 = ejs.render(templateEip4844, optionsEip4844);
            const circuitEip4844File = path.join(new tmp.Dir().path, "circuitEip4844.circom");
            await fs.promises.writeFile(circuitEip4844File, content4844);
            circuit = await wasm_tester(circuitEip4844File, {O:1, include: ["node_modules/circomlib/circuits", "node_modules/pil-stark/circuits.bn128"]});
        });

        it("Test that solidity hash matches circom hash", async () => {
            const { publicsBlobOuter, publicsBlobOuterSolidity, publicsBlobOuterHashTypesSolidity } = generatePublicsBlob(aggregatorAddress);
            const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
    
            const sha256Solidity = Scalar.mod(Scalar.fromString(solidityPackedSha256(publicsBlobOuterHashTypesSolidity, publicsBlobOuterSolidity), 16), FrSNARK);
    
            const witness = await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);
    
            await circuit.assertOut(witness, { publicsHash: sha256Solidity });
        });

        it("Fails if old blob state root is higher than GL", async () => {
            const { publicsBlobOuter } = generatePublicsBlob(aggregatorAddress);
            publicsBlobOuter.oldBlobStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });
    
        it("Fails if new blob state root is higher than GL", async () => {
            const { publicsBlobOuter } = generatePublicsBlob(aggregatorAddress);
            publicsBlobOuter.newBlobStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });

        it("Fails if old state root is higher than GL", async () => {
            const { publicsBlobOuter } = generatePublicsBlob(aggregatorAddress);
            publicsBlobOuter.oldStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });
    
        it("Fails if new state root is higher than GL", async () => {
            const { publicsBlobOuter } = generatePublicsBlob(aggregatorAddress);
            publicsBlobOuter.newStateRoot = 0xFFFFFFFF00000001n + 1n;
    
            const publicsBlobOuterCircom = preparePublics(publicsBlobOuter, blobOuterPublics);
            try {
                await circuit.calculateWitness({aggregatorAddr: aggregatorAddress, publics: publicsBlobOuterCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template LessThanGoldilocks"));
            }
        });
    });
});
