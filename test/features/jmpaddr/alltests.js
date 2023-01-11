const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test JmpAddr Instruction", async function () {
    this.timeout(10000000000);

    it("Test JmpAddr Pack test", async () => {
        await verifyZkasm(__dirname + "/alltests.zkasm", true,
                { defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main', 'Rom', 'Binary', 'PaddingPG', 'PoseidonG' ,'PaddingKK' ,'KeccakF', 'PaddingKKBit', 'Bits2Field'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true
                },{
                    romFilename: "tmp/rom.json",
                    constFilename: "tmp/constFile.bin",
                    commitFilename: "tmp/commitFile.bin",
                    pilJsonFilename: "tmp/main.pil.json",
                    externalPilVerification: true
                });
    });
});