const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Optimize Pils (arith)", async function () {
    this.timeout(10000000);

    it("Verify Arith Zkasm Test", async () => {
        await verifyZkasm("optimize-pils/arith.zkasm", true,
                { defines: {N: 2 ** 23},
                  namespaces: ['Global', 'Main', 'Arith'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
