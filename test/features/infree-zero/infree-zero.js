const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test InFree-zero", async function () {
    this.timeout(10000000000);

    it("Verify InFree-zero", async () => {
        await verifyZkasm(__dirname + "/infree-zero.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},
		{ commitFilename: 'build/test/commit.bin',
		  constFilename: 'build/test/const.bin',
		  pilJsonFilename: 'build/test/mail.pil.json',
		  externalPilVerification: true});
    });
});
