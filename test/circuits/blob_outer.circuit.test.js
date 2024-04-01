const path = require("path");
const tmp = require('temporary');
const fs = require("fs");
const ejs = require("ejs");
const { batchPublicsEip4844, blobInnerPublics, blobOuterPublics } = require("../../src/templates/helpers/publics");
const { assert } = require("chai");
const { preparePublics, generateRandomHex, generateRandomValue } = require("./helpers");

const wasm_tester = require("circom_tester").wasm;

function generatePublicsBlobOuterProof(isInvalid_ = false, chainId_) {
    const oldBatchStateRoot = generateRandomHex(63);
    const oldBatchAccInputHash = generateRandomHex(256);
    const previousL1InfoTreeRoot = generateRandomHex(256);
    const previousL1InfoTreeIndex = generateRandomValue(32);
    const chainId = generateRandomValue(10, chainId_);
    const forkId = generateRandomValue(10);
    const newBatchStateRoot = generateRandomHex(63, oldBatchStateRoot);
    const newBatchAccInputHash = generateRandomHex(256, oldBatchAccInputHash);
    const currentL1InfoTreeRoot = generateRandomHex(256, previousL1InfoTreeRoot);
    const currentL1InfoTreeIndex = generateRandomValue(32, previousL1InfoTreeIndex);
    const newLocalExitRoot = generateRandomHex(256);       
    const newLastTimestamp = generateRandomValue(32);

    const publicsBatch = { oldStateRoot: oldBatchStateRoot, oldBatchAccInputHash, previousL1InfoTreeRoot, previousL1InfoTreeIndex, chainId, forkId, newStateRoot: newBatchStateRoot, newBatchAccInputHash, currentL1InfoTreeRoot, currentL1InfoTreeIndex, newLocalExitRoot, newLastTimestamp };

    const oldBlobStateRoot = generateRandomHex(63);
    const oldBlobAccInputHash = generateRandomHex(256);
    const oldBlobNum = generateRandomValue(10);
    const oldStateRoot = oldBatchStateRoot;
    const forkIdBlobInner = forkId;
    const newBlobStateRoot = generateRandomHex(63);
    const newBlobAccInputHash = generateRandomHex(256);
    const newBlobNum = oldBlobNum + 1;
    const finalAccBatchHashData = newBatchAccInputHash;
    const localExitRootFromBlob = generateRandomHex(256);
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


describe("Verify Blob Outer Circuit Test", function () {
    let circuit;

    let chainId_ = generateRandomValue(10);
    this.timeout(10000000);

    before( async() => {
        const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "verify_blob_outer.circom.ejs"), "utf8");
        const options = { batchPublics: batchPublicsEip4844, blobInnerPublics, blobOuterPublics, isTest: true}
        const content = ejs.render(template, options);
        const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
        await fs.promises.writeFile(circuitFile, content);
        circuit = await wasm_tester(circuitFile, {O:1, prime: "goldilocks", include: "node_modules/pil-stark/circuits.gl"});
    });

    it("Check that correct blob outer publics are generated in the happy path", async () => {
        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublicsBlobOuterProof();

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 1, publicsBlobOuter: blobOuterPublicsCircom });

    });

    it("Check that if isInvalid = true in blob inner, blob outer inputs are selected from blob inner", async () => {
        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublicsBlobOuterProof(true, chainId_);
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
        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublicsBlobOuterProof(true, chainId_);
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
        const { publicsBatch, publicsBlobInner } = generatePublicsBlobOuterProof(false, chainId_);
        publicsBlobInner.finalAccBatchHashData = generateRandomHex(256, publicsBatch.newBatchAccInputHash);

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        try {
            await circuit.calculateWitness(input, true);
            assert(false);
        } catch(err) {
            assert(err.message.includes("Error in template VerifyBlobOuter_5 line: 88"));
        }
    });

    it("Check that if blob is valid and newLastTimestampPos (batch) > timestampLimitPos (blobInner), blob outer inputs are selected from blob inner", async () => {
        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublicsBlobOuterProof(true, chainId_);
        publicsBatch.newLastTimestamp = publicsBlobInner.timestampLimit + 500;

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);
        const blobOuterPublicsCircom = preparePublics(publicsBlobOuter, blobOuterPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        const witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);


        await circuit.assertOut(witness, { isValidBlob: 1, publicsBlobOuter: blobOuterPublicsCircom });
    });

    it("Check that if blob is valid and currentL1InfoTreeIndex (batch) != lastL1InfoTreeIndex (blobInner), blob outer inputs are selected from blob inner", async () => {
        const { publicsBatch, publicsBlobInner, publicsBlobOuter } = generatePublicsBlobOuterProof(true, chainId_);
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

        const { publicsBatch, publicsBlobInner } = generatePublicsBlobOuterProof(false, chainId_);
        publicsBlobInner.lastL1InfoTreeRoot = generateRandomHex(256, publicsBatch.currentL1InfoTreeRoot);

        const batchPublicsCircom = preparePublics(publicsBatch, batchPublicsEip4844);
        const blobInnerPublicsCircom = preparePublics(publicsBlobInner, blobInnerPublics);

        const input = { publicsBatch: batchPublicsCircom, publicsBlobInner: blobInnerPublicsCircom, chainId: chainId_ };
        try {
            await circuit.calculateWitness(input, true);
            assert(false);
        } catch(err) {
            assert(err.message.includes("Error in template VerifyBlobOuter_5 line: 97"));
        }
    });
});
