const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test Repeat Instruction", async function () {
    this.timeout(10000000000);

    it("Test Repeat Instruction (basic test)", async () => {
        await verifyZkasm(__dirname + "/repeat.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});