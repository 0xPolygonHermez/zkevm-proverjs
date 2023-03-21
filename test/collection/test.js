const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Large Zkasm Test", async function () {
    this.timeout(10000000);

    it("Verify Large Zkasm Test", async () => {
        await verifyZkasm(__dirname + "/main.zkasm", true,
                { // defines: {N: 2 ** 18},
                  // namespaces: ['Global', 'Main',],
                  verbose: true,
                  color: true,
                  disableUnusedError: true},
                  {
//                    constants: false,
//                    fastDebugExit: true,
                    romFilename: "tmp/rom.json",
                    constFilename: "tmp/constFile.bin",
                    commitFilename: "tmp/commitFile.bin",
                    pilJsonFilename: "tmp/main.pil.json",
                    externalPilVerification: true
                  });
    });
});