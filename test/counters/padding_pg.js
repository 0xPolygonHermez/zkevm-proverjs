const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test PaddingPg Counter", async function () {
    this.timeout(10000000000);

    it("Verify PaddingPG Zkasm Test", async () => {
        await verifyZkasm("../zkasm/counters/padding_pg.zkasm", {continueOnError: true},
                { defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingPG'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true}/*,
                {
                    commitFilename: 'build/commit.bin',
                    constFilename: 'build/const.bin',
                    pilJsonFilename: 'build/main.pil.json'
                }*/);
    });
});