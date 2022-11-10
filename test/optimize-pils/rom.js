const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Optimize Pils (ROM)", async function () {
    this.timeout(10000000);

    it("Basic Zkasm Test", async () => {
        await verifyZkasm("optimize-pils/rom.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
