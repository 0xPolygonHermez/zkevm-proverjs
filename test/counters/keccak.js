const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Keccak Counter", async function () {
    this.timeout(10000000000);

    it("Verify Keccak Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/keccak.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingKK' ,'KeccakF', 'PaddingKKBit', 'Nine2One'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});