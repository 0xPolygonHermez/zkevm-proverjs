const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("./verify_zkasm");

describe("Optimize Pils", async function () {
    this.timeout(10000000);

    it("Verify Binary Zkasm Test", async () => {
        await verifyZkasm("optimize-pils/binary.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Binary', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true}/*,
                {
                    constFilename: "constFile.bin",
                    commitFilename: "commitFile.bin",
                    pilJsonFilename: "main.pil.jsonS",
                    externalPilVerification: true
                }*/);
    });
});
