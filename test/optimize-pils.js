const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
chai.use(require('chai-as-promised'));

const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("./verify_zkasm");

describe("Optimize Pils", async function () {
    this.timeout(10000000);

/*    it("Verify Byte4 Zkasm Test", async () => {
        await verifyZkasm("optimize-pils/byte4.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Byte4'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });*/
    it("Verify Binary Zkasm Test", async () => {
        await verifyZkasm("optimize-pils/binary.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Binary'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
