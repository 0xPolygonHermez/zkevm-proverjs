const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Storage Counters", async function () {
    this.timeout(10000000);

    it("Verify Storage Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/storage.zkasm", true,
            { defines: {N: 2 ** 22},
              namespaces: ['Global', 'Main', 'Storage', 'ClimbKey'],
              verbose: true,
              color: true,
              disableUnusedError: true});
    });
/*
    it("Verify Storage Zkasm Test (some delete edge cases)", async () => {
        await verifyZkasm("../zkasm/counters/storage2.zkasm", true,
            { defines: {N: 2 ** 18},
              namespaces: ['Global', 'Main', 'Rom', 'Storage', 'PoseidonG'],
              verbose: true,
              color: true,
              disableUnusedError: true});
    });
*/
});