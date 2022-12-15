const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test EcRecover Instruction", async function () {
    this.timeout(10000000000);

    it("Test JmpAddr Instruction (basic test)", async () => {
        const zkasmFile = __dirname + "/../../../node_modules/@0xpolygonhermez/zkevm-rom/test/ecrecover.zkasm";
        console.log(zkasmFile);
        await verifyZkasm(zkasmFile, true,
                { defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});