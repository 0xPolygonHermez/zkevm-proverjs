const path = require("path");
const tmp = require('temporary');
const fs = require("fs");
const ejs = require("ejs");
const { batchPublicsEip4844, blobOuterPublics, batchPublics } = require("../../src/templates/helpers/publics");
const { assert } = require("chai");
const { preparePublics, generateRandomHex, generateRandomValue } = require("./helpers");

const wasm_tester = require("circom_tester").wasm;

describe("Verify Recursive 2", function () {
    this.timeout(10000000);

    describe("Forks previous to feijoa batch recursion", async () => {

        let circuit;

        function generatePublics() {
            const chainId = generateRandomValue(10);
            const forkId = generateRandomValue(10);

            const oldBatchStateRootA = generateRandomHex(63);
            const oldBatchAccInputHashA = generateRandomHex(256);
            const oldBatchNumA = generateRandomValue(10);
            const newBatchStateRootA = generateRandomHex(63);
            const newBatchAccInputHashA = generateRandomHex(256);
            const newBatchNumA = oldBatchNumA + 1;
            const newLocalExitRootA = generateRandomHex(256);

            const publicsBatchA = { 
                oldStateRoot: oldBatchStateRootA,
                oldBatchAccInputHash: oldBatchAccInputHashA,
                oldBatchNum: oldBatchNumA,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootA,
                newBatchAccInputHash: newBatchAccInputHashA,
                newLocalExitRoot: newLocalExitRootA,
                newBatchNum: newBatchNumA
            };

            const oldBatchStateRootB = newBatchStateRootA;
            const oldBatchAccInputHashB = newBatchAccInputHashA;
            const oldBatchNumB = newBatchNumA;
            const newBatchStateRootB = generateRandomHex(63);
            const newBatchAccInputHashB = generateRandomHex(256);
            const newBatchNumB = oldBatchNumB + 10;
            const newLocalExitRootB = generateRandomHex(256);

            const publicsBatchB = {
                oldStateRoot: oldBatchStateRootB,
                oldBatchAccInputHash: oldBatchAccInputHashB,
                oldBatchNum: oldBatchNumB,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootB,
                newBatchAccInputHash: newBatchAccInputHashB,
                newLocalExitRoot: newLocalExitRootB,
                newBatchNum: newBatchNumB
            };

            
            const publicsAggregated = {
                oldStateRoot: oldBatchStateRootA,
                oldBatchAccInputHash: oldBatchAccInputHashA,
                oldBatchNum: oldBatchNumA,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootB,
                newBatchAccInputHash: newBatchAccInputHashB,
                newLocalExitRoot: newLocalExitRootB,
                newBatchNum: newBatchNumB
            }

            return { publicsBatchA, publicsBatchB, publicsAggregated };
        }

        beforeEach( async() => {
            const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "recursive2", "recursive2_checks_batch.circom.ejs"), "utf8");
            const options = { publics: batchPublics, isTest: true}
            const content = ejs.render(template, options);
            const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
            await fs.promises.writeFile(circuitFile, content);
            circuit = await wasm_tester(circuitFile, {O:1, prime: "goldilocks", include: "node_modules/pil-stark/circuits.gl"});
        });
    
        it("Check that correct recursive2 publics are generated in the happy path", async () => {
            const { publicsBatchA, publicsBatchB, publicsAggregated } = generatePublics();
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            const publicsAggregatedCircom = preparePublics(publicsAggregated, batchPublics);

            const witness = await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
            
            await circuit.assertOut(witness, { publics: publicsAggregatedCircom, a_isOneBatch: 1, b_isOneBatch: 0 });
        });
    
        it("Fails if old state root doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.oldStateRoot = generateRandomHex(63, publicsBatchA.newStateRoot);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 28"));
            }
        });
    
        it("Fails if new batch acc input hash root doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.oldBatchAccInputHash = generateRandomHex(256, publicsBatchA.newBatchAccInputHash);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 32"));
            }
        });
    
        it("Fails if chain Id doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.chainId = generateRandomValue(10, publicsBatchA.chainId);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 39"));
            }
        });
    
        it("Fails if fork Id doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.forkId = generateRandomValue(10, publicsBatchA.forkId);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 42"));
            }
        });
    
        it("Fails if batch number doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.oldBatchNum = publicsBatchA.newBatchNum + 500;
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublics);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublics);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 45"));
            }
        });

    });

    describe("Forks from feijoa batch recursion", async () => {
        let circuit;

        function generatePublics() {
            const chainId = generateRandomValue(10);
            const forkId = generateRandomValue(10);

            const oldBatchStateRootA = generateRandomHex(63);
            const oldBatchAccInputHashA = generateRandomHex(256);
            const previousL1InfoTreeRootA = generateRandomHex(256);
            const previousL1InfoTreeIndexA = generateRandomValue(10);
            const newBatchStateRootA = generateRandomHex(63);
            const newBatchAccInputHashA = generateRandomHex(256);
            const currentL1InfoTreeRootA = generateRandomHex(256);
            const currentL1InfoTreeIndexA = previousL1InfoTreeIndexA + 1;
            const newLastTimestampA = generateRandomValue(32);
            const newLocalExitRootA = generateRandomHex(256);

            const publicsBatchA = { 
                oldStateRoot: oldBatchStateRootA,
                oldBatchAccInputHash: oldBatchAccInputHashA,
                previousL1InfoTreeRoot: previousL1InfoTreeRootA,
                previousL1InfoTreeIndex: previousL1InfoTreeIndexA,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootA,
                newBatchAccInputHash: newBatchAccInputHashA,
                currentL1InfoTreeRoot: currentL1InfoTreeRootA,
                currentL1InfoTreeIndex: currentL1InfoTreeIndexA,
                newLocalExitRoot: newLocalExitRootA,
                newLastTimestamp: newLastTimestampA
            };

            const oldBatchStateRootB = newBatchStateRootA;
            const oldBatchAccInputHashB = newBatchAccInputHashA;
            const previousL1InfoTreeRootB = currentL1InfoTreeRootA;
            const previousL1InfoTreeIndexB = currentL1InfoTreeIndexA;
            const newBatchStateRootB = generateRandomHex(63);
            const newBatchAccInputHashB = generateRandomHex(256);
            const currentL1InfoTreeRootB = generateRandomHex(256);
            const currentL1InfoTreeIndexB = previousL1InfoTreeIndexB + 10;
            const newLastTimestampB = generateRandomValue(32);
            const newLocalExitRootB = generateRandomHex(256);

        
            const publicsBatchB = {
                oldStateRoot: oldBatchStateRootB,
                oldBatchAccInputHash: oldBatchAccInputHashB,
                previousL1InfoTreeRoot: previousL1InfoTreeRootB,
                previousL1InfoTreeIndex: previousL1InfoTreeIndexB,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootB,
                newBatchAccInputHash: newBatchAccInputHashB,
                currentL1InfoTreeRoot: currentL1InfoTreeRootB,
                currentL1InfoTreeIndex: currentL1InfoTreeIndexB,
                newLocalExitRoot: newLocalExitRootB,
                newLastTimestamp: newLastTimestampB
            };

            const publicsAggregated = {
                oldStateRoot: oldBatchStateRootA,
                oldBatchAccInputHash: oldBatchAccInputHashA,
                previousL1InfoTreeRoot: previousL1InfoTreeRootA,
                previousL1InfoTreeIndex: previousL1InfoTreeIndexA,
                chainId,
                forkId,
                newStateRoot: newBatchStateRootB,
                newBatchAccInputHash: newBatchAccInputHashB,
                currentL1InfoTreeRoot: currentL1InfoTreeRootB,
                currentL1InfoTreeIndex: currentL1InfoTreeIndexB,
                newLocalExitRoot: newLocalExitRootB,
                newLastTimestamp: newLastTimestampB
            }

            return { publicsBatchA, publicsBatchB, publicsAggregated };
        }

        beforeEach( async() => {
            const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "recursive2", "recursive2_checks_batch_eip4844.circom.ejs"), "utf8");
            const options = { publics: batchPublicsEip4844, isTest: true}
            const content = ejs.render(template, options);
            const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
            await fs.promises.writeFile(circuitFile, content);
            circuit = await wasm_tester(circuitFile, {O:1, prime: "goldilocks", include: "node_modules/pil-stark/circuits.gl"});
        });
    
        it("Check that correct recursive2 publics are generated in the happy path", async () => {
            const { publicsBatchA, publicsBatchB, publicsAggregated } = generatePublics();
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            const publicsAggregatedCircom = preparePublics(publicsAggregated, batchPublicsEip4844);

            const witness = await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
            
            await circuit.assertOut(witness, { publics: publicsAggregatedCircom, a_isOneBatch: 0, b_isOneBatch: 1 });
        });
    
        it("Fails if old state root doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchA.newStateRoot = generateRandomHex(63, publicsBatchB.oldStateRoot);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 33"));
            }
        });
    
        it("Fails if new batch acc input hash root doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchA.newBatchAccInputHash = generateRandomHex(256, publicsBatchB.oldBatchAccInputHash);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 37"));
            }
        });
    
        it("Fails if chain Id doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.chainId = generateRandomValue(10, publicsBatchA.chainId);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 48"));
            }
        });
    
        it("Fails if fork Id doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.forkId = generateRandomValue(10, publicsBatchA.forkId);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 51"));
            }
        });

        it("Fails if L1 Info Tree Root doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.previousL1InfoTreeRoot = generateRandomHex(256, publicsBatchA.currentL1InfoTreeRoot);
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 41"));
            }
        });

        it("Fails if L1 Info Tree Index doesn't match", async () => {
            const { publicsBatchA, publicsBatchB } = generatePublics();
            publicsBatchB.previousL1InfoTreeIndex = publicsBatchA.currentL1InfoTreeIndex - 354;
            const publicsBatchACircom = preparePublics(publicsBatchA, batchPublicsEip4844);
            const publicsBatchBCircom = preparePublics(publicsBatchB, batchPublicsEip4844);
            
            try {
                await circuit.calculateWitness({ a_publics: publicsBatchACircom, b_publics: publicsBatchBCircom, a_isAggregatedCircuit: 1, b_isAggregatedCircuit: 0}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 54"));
            }
        });
    });

    describe("Forks from feijoa blob recursion", async () => {
        let circuit;

        function generatePublics() {
            const chainId = generateRandomValue(10);
            const forkId = generateRandomValue(10);

            const oldStateRootA = generateRandomHex(63);
            const oldBlobStateRootA = generateRandomHex(63);
            const oldBlobAccInputHashA = generateRandomHex(256);
            const oldBlobNumA = generateRandomValue(10);
            const newStateRootA = generateRandomHex(63);
            const newBlobStateRootA = generateRandomHex(63);
            const newBlobAccInputHashA = generateRandomHex(256);
            const newBlobNumA = oldBlobNumA + 1;
            const newLocalExitRootA = generateRandomHex(256);

            const publicsBlobA = {
                oldStateRoot: oldStateRootA,
                oldBlobStateRoot: oldBlobStateRootA,
                oldBlobAccInputHash: oldBlobAccInputHashA,
                oldBlobNum: oldBlobNumA,
                chainId,
                forkId,
                newStateRoot: newStateRootA,
                newBlobStateRoot: newBlobStateRootA,
                newBlobAccInputHash: newBlobAccInputHashA,
                newBlobNum: newBlobNumA,
                newLocalExitRoot: newLocalExitRootA
            }

            const oldStateRootB = newStateRootA;
            const oldBlobStateRootB = newBlobStateRootA;
            const oldBlobAccInputHashB = newBlobAccInputHashA;
            const oldBlobNumB = newBlobNumA;
            const newStateRootB = generateRandomHex(63);
            const newBlobStateRootB = generateRandomHex(63);
            const newBlobAccInputHashB = generateRandomHex(256);
            const newBlobNumB = oldBlobNumB + 10;
            const newLocalExitRootB = generateRandomHex(256);

            const publicsBlobB = { 
                oldStateRoot: oldStateRootB,
                oldBlobStateRoot: oldBlobStateRootB,
                oldBlobAccInputHash: oldBlobAccInputHashB,
                oldBlobNum: oldBlobNumB,
                chainId,
                forkId,
                newStateRoot: newStateRootB,
                newBlobStateRoot: newBlobStateRootB,
                newBlobAccInputHash: newBlobAccInputHashB,
                newBlobNum: newBlobNumB,
                newLocalExitRoot: newLocalExitRootB
            };

            const publicsAggregated = {
                oldStateRoot: oldStateRootA,
                oldBlobStateRoot: oldBlobStateRootA,
                oldBlobAccInputHash: oldBlobAccInputHashA,
                oldBlobNum: oldBlobNumA,
                chainId,
                forkId,
                newStateRoot: newStateRootB,
                newBlobStateRoot: newBlobStateRootB,
                newBlobAccInputHash: newBlobAccInputHashB,
                newBlobNum: newBlobNumB,
                newLocalExitRoot: newLocalExitRootB
            }

            return { publicsBlobA, publicsBlobB, publicsAggregated };
        }

        beforeEach( async() => {
            const template = await fs.promises.readFile(path.join(__dirname, "../../src/templates", "helpers", "recursive2", "recursive2_checks_blob.circom.ejs"), "utf8");
            const options = { publics: blobOuterPublics, isTest: true}
            const content = ejs.render(template, options);
            const circuitFile = path.join(new tmp.Dir().path, "circuit.circom");
            await fs.promises.writeFile(circuitFile, content);
            circuit = await wasm_tester(circuitFile, {O:1, prime: "goldilocks", include: "node_modules/pil-stark/circuits.gl"});
        });
    
        it("Check that correct recursive2 publics are generated in the happy path", async () => {
            const { publicsBlobA, publicsBlobB, publicsAggregated } = generatePublics();
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);
            const publicsAggregatedCircom = preparePublics(publicsAggregated, blobOuterPublics);

            const witness = await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
            
            await circuit.assertOut(witness, { publics: publicsAggregatedCircom, a_isOneBatch: 1, b_isOneBatch: 0 });
        });
    
        it("Fails if old state root doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobA.newStateRoot = generateRandomHex(63, publicsBlobB.oldStateRoot);
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 29"));
            }
        });

        it("Fails if old blob state root doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobA.newBlobStateRoot = generateRandomHex(63, publicsBlobB.oldBlobStateRoot);
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 33"));
            }
        });
    
        it("Fails if new blob acc input hash root doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobA.newBlobAccInputHash = generateRandomHex(256, publicsBlobB.oldBlobAccInputHash);
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 37"));
            }
        });
    
        it("Fails if chain Id doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobA.chainId = generateRandomValue(10, publicsBlobB.chainId);
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 44"));
            }
        });
    
        it("Fails if fork Id doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobA.forkId = generateRandomValue(10, publicsBlobB.forkId);
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 47"));
            }
        });
    
        it("Fails if blob number doesn't match", async () => {
            const { publicsBlobA, publicsBlobB } = generatePublics();
            publicsBlobB.oldBlobNum = publicsBlobA.newBlobNum - 500;
            const publicsBlobACircom = preparePublics(publicsBlobA, blobOuterPublics);
            const publicsBlobBCircom = preparePublics(publicsBlobB, blobOuterPublics);

            try {
                await circuit.calculateWitness({ a_publics: publicsBlobACircom, b_publics: publicsBlobBCircom}, true);
                assert(false);
            } catch(err) {
                if(err.message.includes("Unspecified AssertiorError")) throw err;
                assert(err.message.includes("Error in template VerifyRecursive2_1 line: 50"));
            }
        });

    });
});
