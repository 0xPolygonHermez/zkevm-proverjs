const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test PaddingPg Counter", async function () {
    this.timeout(10000000000);

    it("Verify PaddingPG Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/padding_pg.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingPG', 'PoseidonG', 'Binary'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});