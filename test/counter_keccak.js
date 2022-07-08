const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const verifyZkasm = require("./counter_common.js").verifyZkasm;

describe("test main sm", async function () {
    this.timeout(10000000000);

    it("It should create the pols main", async () => {
        await verifyZkasm("counters/keccak.zkasm", true, ['storage', 'mem', 'mem_align', 'binary', 'arith', 'padding_pg']);
    });
});