const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Keccak Counter", async function () {
    this.timeout(10000000000);

    it("Verify Keccak Zkasm Test", async () => {
        await verifyZkasm(__dirname + "/one_big_keccak.zkasm", true,
                { defines: {N: 2 ** 23},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingKK' ,'KeccakF', 'PaddingKKBit', 'Nine2One'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},
		{ commitFilename: 'build/test/commit.bin',
		  constFilename: 'build/test/const.bin',
		  pilJsonFilename: 'build/test/mail.pil.json',
		  externalPilVerification: true});
    });
});
