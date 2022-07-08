const chai = require("chai");
const path = require("path");
const buildBabyjub = require("circomlibjs").buildBabyjub;

const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;

describe("Baby Jub test", function () {
    let babyJub;
    let F;
    let circuitFFT;
    let circuitIFFT;
    let circuitFFTcoset;
    let circuitIFFTcoset;

    this.timeout(100000);

    before( async() => {

        babyJub = await buildBabyjub();
        F = babyJub.F;

        circuitFFT = await wasm_tester(path.join(__dirname, "circuits", "fft_tester.circom"));
        circuitIFFT = await wasm_tester(path.join(__dirname, "circuits", "ifft_tester.circom"));
        circuitFFTcoset = await wasm_tester(path.join(__dirname, "circuits", "fftcoset_tester.circom"));
        circuitIFFTcoset = await wasm_tester(path.join(__dirname, "circuits", "ifftcoset_tester.circom"));
    });

    it("Should check fft", async () => {
        const N=8;

        const inp = [];
        const input={
            in: []
        };

        for (let i=0; i<N; i++) {
            inp[i] = F.e(i);
            input.in[i] = F.toObject(inp[i]);
        }

        const out = await F.fft(inp);
        const output = {
            out: []
        };

        for (let i=0; i<N; i++) {
            output.out[i] = F.toObject(out[i]);
        }
        
        const w = await circuitFFT.calculateWitness(input, true);

        await circuitFFT.assertOut(w, output);
    });


    it("Should check ifft", async () => {
        const N=8;

        const inp = [];

        for (let i=0; i<N; i++) {
            inp[i] = F.e(i);
        }

        const inp_e = await F.fft(inp);

        const input={
            in: []
        };

        for (let i=0; i<N; i++) {
            input.in[i] = F.toObject(inp_e[i]);
        }

        const output = {
            out: []
        };

        for (let i=0; i<N; i++) {
            output.out[i] = F.toObject(inp[i]);
        }
        
        const w = await circuitIFFT.calculateWitness(input, true);

        await circuitIFFT.assertOut(w, output);
    });


    it("Should check fft coset", async () => {
        const N=8;

        const inp = [];

        const input={
            in: []
        };

        let s = F.one;
        for (let i=0; i<N; i++) {
            input.in[i] = F.toObject(F.e(i));
            inp[i] = F.mul(F.e(i), s);
            s = F.mul(s, F.e(25));
        }

        const inp_e = await F.fft(inp);

        const output = {
            out: []
        };

        for (let i=0; i<N; i++) {
            output.out[i] = F.toObject(inp_e[i]);
        }
        
        const w = await circuitFFTcoset.calculateWitness(input, true);

        await circuitFFTcoset.assertOut(w, output);
    });


    it("Should check ifft coset", async () => {
        const N=8;

        const inp = [];

        let s = F.one;
        for (let i=0; i<N; i++) {
            inp[i] = F.mul(F.e(i), s);
            s = F.mul(s, F.e(25));
        }

        const inp_e = await F.fft(inp);

        const input={
            in: []
        };

        for (let i=0; i<N; i++) {
            input.in[i] = F.toObject(inp_e[i]);
        }

        const output = {
            out: []
        };

        for (let i=0; i<N; i++) {
            output.out[i] = F.toObject(F.e(i));
        }
        
        const w = await circuitIFFTcoset.calculateWitness(input, true);

        await circuitIFFTcoset.assertOut(w, output);
    });
});