const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Poseidon Counter", async function () {
    this.timeout(10000000000);

    it("Verify Poseidon Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/poseidon.zkasm", {continueOnError: true},
                { defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main', 'Rom', 'PoseidonG', 'Binary', 'Storage'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});