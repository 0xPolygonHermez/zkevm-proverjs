const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Arith Counter", async function () {
    this.timeout(10000000);

    it("Verify Arith Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/arith.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'Byte4', 'Arith'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
