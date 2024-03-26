const path = require("path");
const tmp = require('temporary');
const fs = require("fs");
const ejs = require("ejs");
const { batchPublicsEip4844, blobInnerPublics, blobOuterPublics } = require("../../src/templates/helpers/publics");
const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs/src/smt-utils");
const { F1Field, Scalar } = require("ffjavascript");
const { assert } = require("chai");

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

function generatePublics(isInvalid_ = false, chainId_) {
    const oldBatchStateRoot = generateRandomHex();
    const oldBatchAccInputHash = generateRandomHex();
    const previousL1InfoTreeRoot = generateRandomHex();
    const previousL1InfoTreeIndex = Math.floor(Math.random() * Math.pow(2,8));
    const chainId = Math.floor(Math.random() * 10);
    const forkId = Math.floor(Math.random() * 10);
    const newBatchStateRoot = generateRandomHex();
    const newBatchAccInputHash = generateRandomHex();
    const currentL1InfoTreeRoot = generateRandomHex();
    const currentL1InfoTreeIndex = Math.floor(Math.random() * Math.pow(2,8));
    const newLocalExitRoot = generateRandomHex();       
    const newLastTimestamp = Math.floor(Math.random() * Math.pow(2,60));

    const publicsBatch = { oldStateRoot: oldBatchStateRoot, oldBatchAccInputHash, previousL1InfoTreeRoot, previousL1InfoTreeIndex, chainId, forkId, newStateRoot: newBatchStateRoot, newBatchAccInputHash, currentL1InfoTreeRoot, currentL1InfoTreeIndex, newLocalExitRoot, newLastTimestamp };

    const oldBlobStateRoot = generateRandomHex();
    const oldBlobAccInputHash = generateRandomHex();
    const oldBlobNum = Math.floor(Math.random() * 10);
    const oldStateRoot = oldBatchStateRoot;
    const forkIdBlobInner = forkId;
    const newBlobStateRoot = generateRandomHex();
    const newBlobAccInputHash = generateRandomHex();
    const newBlobNum = oldBlobNum + 1;
    const finalAccBatchHashData = newBatchAccInputHash;
    const localExitRootFromBlob = generateRandomHex();
    const isInvalid = 0;
    const lastL1InfoTreeRoot = currentL1InfoTreeRoot;
    const lastL1InfoTreeIndex = currentL1InfoTreeIndex;
    const timestampLimit = newLastTimestamp + 100;
    
    const publicsBlobInner = { oldBlobStateRoot, oldBlobAccInputHash, oldBlobNum, oldStateRoot, newBlobStateRoot, forkId: forkIdBlobInner, newBlobAccInputHash, newBlobNum, finalAccBatchHashData, localExitRootFromBlob, isInvalid, timestampLimit, lastL1InfoTreeRoot, lastL1InfoTreeIndex };

    const publicsBlobOuter = { 
        oldStateRoot: isInvalid_ ? oldStateRoot : oldBatchStateRoot, 
        oldBlobStateRoot, 
        oldBlobAccInputHash, 
        oldBlobNum, 
        chainId: isInvalid_ ? chainId_ : chainId, 
        forkId, 
        newStateRoot: isInvalid_ ? oldStateRoot : newBatchStateRoot,
        newBlobStateRoot, 
        newBlobAccInputHash, 
        newBlobNum, 
        newLocalExitRoot: isInvalid_ ? localExitRootFromBlob : newLocalExitRoot,
    };

    return { publicsBatch, publicsBlobInner, publicsBlobOuter };
}

function generateRandomHex() {
    return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

describe("Verify Blob Outer Circuit Test", function () {
    let circuit;

    this.timeout(10000000);

    before( async() => {
        const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "verify_blob_outer.circom.ejs"), "utf8");
        const options = { batchPublics: batchPublicsEip4844, blobInnerPublics, blobOuterPublics, isTest: true}
        const content = ejs.render(template, options);
        const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
        await fs.promises.writeFile(circuitFile, content);
        circuit = await wasm_tester(circuitFile, {O:1, prime: "goldilocks", include: "node_modules/pil-stark/circuits.gl"});
    });

    it("Check that correct blob outer publics are generated in the happy path", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublics();

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 1, publicsBlobOuter: blobOuterPublicsCircom });

    });

    it("Check that if isInvalid = true in blob inner, blob outer inputs are selected from blob inner", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublics(true, chainId_);
        publicsBlobInner.isInvalid = 1;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 0, publicsBlobOuter: blobOuterPublicsCircom });
    });

    it("Check that if finalAccBatchHashData = 0, blob outer inputs are selected from blob inner", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublics(true, chainId_);
        publicsBlobInner.finalAccBatchHashData = 0;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);

        await circuit.assertOut(witness, { isValidBlob: 0, publicsBlobOuter: blobOuterPublicsCircom });

    });

    it("Check that if blob is valid and newBatchAccInputHash (batch) is not equal to finalAccBatchHashData (blobInner), verification fails", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner } = generatePublics(false, chainId_);
        publicsBlobInner.finalAccBatchHashData = Math.random() * publicsBatch.newBatchAccInputHash;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        try {
            await circuit.calculateWitness(input, true);
        } catch(err) {
            assert(err.message.includes("Error in template VerifyBlobOuter_5 line: 88"));
        }
    });

    it("Check that if blob is valid and newLastTimestampPos (batch) timestampLimitPos (blobInner), blob outer inputs are selected from blob inner", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublics(true, chainId_);
        publicsBlobInner.timestampLimit = Math.random() * publicsBatch.newLastTimestamp;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 1, publicsBlobOuter: blobOuterPublicsCircom });
    });

    it("Check that if blob is valid and currentL1InfoTreeIndex (batch) != lastL1InfoTreeIndex (blobInner), blob outer inputs are selected from blob inner", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublics(true, chainId_);
        publicsBlobInner.lastL1InfoTreeIndex = publicsBatch.currentL1InfoTreeIndex + 1;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 1, publicsBlobOuter: blobOuterPublicsCircom });
    });

    it("Check that if blob is valid and currentL1InfoTreeIndex (batch) == lastL1InfoTreeIndex (blobInner) and currentL1InfoTreeRoot (batch) != lastL1InfoTreeRoot (blobInner), verification fails", async () => {
        const chainId_ = Math.floor(Math.random() * 10);

        const { publicsBatch, publicsBlobInner } = generatePublics(false, chainId_);
        publicsBlobInner.lastL1InfoTreeRoot = Math.random() * publicsBatch.currentL1InfoTreeRoot;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        try {
            await circuit.calculateWitness(input, true);
        } catch(err) {
            assert(err.message.includes("Error in template VerifyBlobOuter_5 line: 97"));
        }
    });
});
