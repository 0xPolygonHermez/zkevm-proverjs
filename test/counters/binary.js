const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Binary Counter", async function () {
    this.timeout(10000000000);

    it("Verify Binary Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/binary.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'Binary'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});