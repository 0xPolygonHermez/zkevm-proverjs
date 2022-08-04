const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test MemAlign Counter", async function () {
    this.timeout(10000000000);

    it("Verify MemAlign Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/mem_align.zkasm", true,
                { defines: {N: 2 ** 19},
                  namespaces: ['Global', 'Main', 'Rom', 'Byte4', 'MemAlign'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});