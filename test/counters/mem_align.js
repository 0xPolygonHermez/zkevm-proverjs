const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("test main sm", async function () {
    this.timeout(10000000000);

    it("It should create the pols main", async () => {
        await verifyZkasm("../zkasm/counters/mem_align.zkasm", true, { defines: {N: 2 ** 21}, namespaces: ['Global', 'Main', 'MemAlign', 'Byte4'], disableUnusedError: true});
    });
});