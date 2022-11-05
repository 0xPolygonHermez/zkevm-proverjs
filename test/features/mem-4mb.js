const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Binary Counter", async function () {
    this.timeout(10000000000);

    it("Verify Mem 4MiB Test", async () => {
        await verifyZkasm(__dirname + "/mem-4mb.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'Mem'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});