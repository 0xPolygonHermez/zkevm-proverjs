const chai = require("chai");
const assert = chai.assert;

const { createCommitedPols } = require("../src/createpols");

const { createCommitedPols, createConstantPols} = require("../creeatepols.js").createConstantPols;
const {buildConstants, execute} = require("../src/proghash.js");

const verifyPil = require("../src/pil_verifier.js");
const { assert } = require("chai");

const programs = [
    "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"+
    "2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40"
]

describe("test program hash state machine", async function () {

    it("It should create the pols of two programs and verify the pil", async () => {
        const pil = JSON.parse(await fs.promises.readFile("../zkvmpil/build/", "utf8"));       
        const [constPols, constPolsArray, constPolsDef] =  createConstantPols(pil);
        const [cmPols, cmPolsArray, cmPolsDef] =  createCommitedPols(pil);
        buildConstants(constPols);
        for (let i=0; i<programs.length; i++) {
            programs[i] = hex2bin(programs[i]);
        }
        execute(cmPols, programs);
        const [res, resStr] = verifyPil(pil, constPols, cmPols);
        if (!res) {
            assert(false, resStr)
        }

    });


});

