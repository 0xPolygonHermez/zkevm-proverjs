const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test MStoreX", async function () {
    this.timeout(10000000000);

    it("Verify MStoreX", async () => {
        await verifyZkasm(__dirname + "/mstorex.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom', 'Mem', 'MemAlign'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},{constants: false});
    });
});