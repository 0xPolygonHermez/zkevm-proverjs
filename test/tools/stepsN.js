const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Arith Counter", async function () {
    this.timeout(10000000);

    it("Verify Arith Zkasm fail Test", async () => {
        await expect(
            verifyZkasm("../zkasm/tools/stepsN.zkasm", false,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},
                  {
                    stepsN: 2**16,
                    debug: true
                  })).to.be.rejectedWith(Error);
    });

    it("Verify Arith Zkasm Test", async () => {
        await verifyZkasm("../zkasm/tools/stepsN.zkasm", false,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},
                  {
                    stepsN: 2**17,
                    debug: true
                  });
    });
});
