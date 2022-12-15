const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../../verify_zkasm");

describe("Test JmpAddr Instruction", async function () {
    this.timeout(10000000000);

    it("Test JmpAddr Instruction (basic test)", async () => {
        await verifyZkasm(__dirname + "/jmpaddr.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
    it("Test HashX1 Instruction (basic test)", async () => {
        await verifyZkasm(__dirname + "/hash1.zkasm", true,
                { defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingPG', 'PoseidonG' ,'PaddingKK' ,'KeccakF', 'PaddingKKBit', 'Nine2One'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
    it("Test Call/Return Instruction (bassic test)", async () => {
        await verifyZkasm(__dirname + "/callreturn.zkasm", true,
                { defines: {N: 2 ** 16},
                  namespaces: ['Global', 'Main', 'Rom'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});