const chai = require("chai");
const path = require("path");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Merkle = require("../src/merkle.js");
const MerkleGroup = require("../src/merkle_group.js");
const MerkleMultipol = require("../src/merkle_group_multipol.js");
const { stringifyFElements } = require("ffjavascript").utils;
const { log2 } = require("@0xpolygonhermez/zkevm-commonjs");

const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;


describe("Merkle tree test", function () {
    let poseidon;
    let F;
    let circuitCalculateRootFromProof;
    let circuitMerkelize;
    let circuitGroup_GropuVerifier;
    let circuitGroup_ElementVerifier;
    let circuitMultipol_GropuVerifier;

    this.timeout(10000000);

    before( async() => {

        poseidon = await buildPoseidon();
        F = poseidon.F;

        circuitCalculateRootFromProof = await wasm_tester(path.join(__dirname, "circuits", "merkle_calculaterootfromproof_tester.circom"));
        circuitMerkelize = await wasm_tester(path.join(__dirname, "circuits", "merkle_merkelize.circom"));
        circuitGroup_GropuVerifier = await wasm_tester(path.join(__dirname, "circuits", "merklegroup_groupverifier.circom"));
        circuitGroup_ElementVerifier = await wasm_tester(path.join(__dirname, "circuits", "merklegroup_elementverifier.circom"));
        circuitMultipol_GropuVerifier = await wasm_tester(path.join(__dirname, "circuits", "merklemultipol_groupverifier.circom"));
    });

    it("Should check root", async () => {
        const N = 1000;
        const idx = 417;
        const M = new Merkle(16, poseidon, poseidon.F);
        const arr = [];
        for (let i=0; i<N; i++) {
            arr.push(F.e(i));
        }

        const tree = M.merkelize(arr);

        const mp = M.genMerkleProof(tree, idx);

        input = {
            value: F.toString(arr[idx]),
            siblings: stringifyFElements(F, mp),
            key: num2bitArr(idx, log2(N-1)+1)
        }

        const output = {
            root: F.toObject(M.root(tree))
        }

        const w = await circuitCalculateRootFromProof.calculateWitness(input, true);

        await circuitCalculateRootFromProof.assertOut(w, output);

    });

    it("Should check merkelize", async () => {
        const N = 1000;
        const M = new Merkle(16, poseidon, poseidon.F);
        const arr = [];
        for (let i=0; i<N; i++) {
            arr.push(F.e(i));
        }

        const tree = M.merkelize(arr);

        input = {
            values: stringifyFElements(F, arr)
        }

        const output = {
            root: F.toObject(M.root(tree))
        }

        const w = await circuitMerkelize.calculateWitness(input, true);

        await circuitMerkelize.assertOut(w, output);


    });

    it("Should check merkleGroup groupProofVerifier", async () => {
        const nGrouos = 64;
        const groupSize = 32;
        const idx = 37;
        const M = new Merkle(16, poseidon, poseidon.F);
        const MG = new MerkleGroup(M, nGrouos, groupSize);

        const arr = [];
        for (let i=0; i<nGrouos*groupSize; i++) {
            arr.push(F.e(i));
        }

        const tree = MG.merkelize(arr);

        const [v, mp] = MG.getGroupProof(tree, idx);

        input = {
            values: stringifyFElements(F, v),
            siblings: stringifyFElements(F, mp),
            key: num2bitArr(idx, log2(nGrouos-1)+1)
        }

        const output = {
            root: F.toObject(MG.root(tree))
        }

        const w = await circuitGroup_GropuVerifier.calculateWitness(input, true);

        await circuitGroup_GropuVerifier.assertOut(w, output);

    });


    it("Should check merkleGroup groupProofVerifier", async () => {
        const nGrouos = 64;
        const groupSize = 32;
        const idx = 157;
        const M = new Merkle(16, poseidon, poseidon.F);
        const MG = new MerkleGroup(M, nGrouos, groupSize);

        const arr = [];
        for (let i=0; i<nGrouos*groupSize; i++) {
            arr.push(F.e(i));
        }

        const tree = MG.merkelize(arr);

        const [v, mp] = MG.getElementProof(tree, idx);

        const root2 = MG.calculateRootFromElementProof(mp, idx, v);

        assert(F.eq(MG.root(tree), root2));

        input = {
            value: F.toObject(v),
            siblingsL: stringifyFElements(F, mp[0]),
            siblingsH: stringifyFElements(F, mp[1]),
            key: num2bitArr(idx, log2(nGrouos*groupSize-1)+1)
        }

        const output = {
            root: F.toObject(MG.root(tree))
        }

        const w = await circuitGroup_ElementVerifier.calculateWitness(input, true);

        await circuitGroup_ElementVerifier.assertOut(w, output);

    });

    it("Should check merkleMultipol groupProofVerifier", async () => {
        const nGrouos = 32;
        const groupSize = 16;
        const nPols = 17;
        const idx = 23;
        const M = new Merkle(16, poseidon, poseidon.F);
        const MM = new MerkleMultipol(M, nGrouos, groupSize, nPols);

        const arr = [];
        for (let p=0; p<nPols; p++) {
            arr[p] = [];
            for (let i=0; i<nGrouos*groupSize; i++) {
                arr[p].push(F.e(i+p*1000));
            }
        }

        const tree = MM.merkelize(arr);

        const [v, mp] = MM.getGroupProof(tree, idx);

        input = {
            values: stringifyFElements(F, v),
            siblings: stringifyFElements(F, mp),
            key: num2bitArr(idx, log2(nGrouos-1)+1)
        }

        const output = {
            root: F.toObject(MM.root(tree))
        }

        const w = await circuitMultipol_GropuVerifier.calculateWitness(input, true);

        await circuitMultipol_GropuVerifier.assertOut(w, output);

    });

    function num2bitArr(idx, n) {
        res = [];
        for (let i=0; i<n; i++) {
            res[i] = (1 << i) & idx ? 1 : 0;
        }
        return res;
    }
});