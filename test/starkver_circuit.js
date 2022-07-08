const chai = require("chai");
const path = require("path");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const fs = require("fs");
const { stringifyFElements } = require("ffjavascript").utils;

const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;


describe("Stark verification circuit", function () {
    let poseidon;
    let F;
    let circuit;

    this.timeout(10000000);

    before( async() => {
        
        poseidon = await buildPoseidon();
        F = poseidon.F;

        circuit = await wasm_tester(path.join(__dirname, "..", "build", "verifier.circom"), {O: 1});
    });

    it("It should verify the proof", async () => {

        const input = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "testvectors", "proof.json"), "utf8"));

        const output = {}

        const w = await circuit.calculateWitness(input, true);

        await circuit.assertOut(w, output);

    });

})