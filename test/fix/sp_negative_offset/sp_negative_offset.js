const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test Fix Negative Offset SP", async function () {
    this.timeout(10000000000);

    it("Test Fix Negative Offset SP", async () => {
        await verifyZkasm(__dirname + "/sp_negative_offset.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});