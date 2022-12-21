const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("./verify_zkasm");

describe("Test After Commands", async function () {
    this.timeout(10000000000);

    it("After Commands Zkasm Test", async () => {
        await verifyZkasm("after_cmds.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});