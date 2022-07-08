const chai = require("chai");
const path = require("path");
const buildBabyjub = require("circomlibjs").buildBabyjub;

const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;

describe("Baby Jub test", function () {
    let babyJub;
    let F;
    let circuit;

    this.timeout(100000);

    before( async() => {

        babyJub = await buildBabyjub();
        F = babyJub.F;

        circuit = await wasm_tester(path.join(__dirname, "circuits", "exp_tester.circom"));
    });

    it("Test Exp", async () => {
        const N=8;
        const a = F.e(223423445234);
        const b = 189;

        const input={
            in: F.toObject(a),
            exp: num2bitArr(b, 8)
        };


        const output = {
            out: F.toObject(F.exp(a, b))
        };

        
        const w = await circuit.calculateWitness(input, true);

        await circuit.assertOut(w, output);
    });

    function num2bitArr(idx, n) {
        res = [];
        for (let i=0; i<n; i++) {
            res[i] = (1 << i) & idx ? 1 : 0;
        }
        return res;
    }
});