const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test MemAlign Counter", async function () {
    this.timeout(10000000000);

    it("Verify MemAlign Zkasm Test", async () => {
        const zkAsmCode = `
            start:
                STEP => A
                0 :ASSERT

                0 => A
                CNT_ARITH       :ASSERT
                CNT_BINARY      :ASSERT
                CNT_KECCAK_F    :ASSERT
                CNT_SHA256_F    :ASSERT
                CNT_MEM_ALIGN   :ASSERT
                CNT_POSEIDON_G  :ASSERT
                CNT_PADDING_PG  :ASSERT

            INCLUDE "test/collection/counters/utils.zkasm"
            INCLUDE "test/collection/counters/mem_align.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                      : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, true,
                {
                    defines: {N: 2 ** 23},
                    namespaces: ['Global', 'Main', 'Rom', 'MemAlign'],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {
                    romFilename: "tmp/rom.json",
                    constFilename: "tmp/constFile.bin",
                    commitFilename: "tmp/commitFile.bin",
                    pilJsonFilename: "tmp/main.pil.json",
                    externalPilVerification: true
                },
                {
                    compileFromString: true
                });
    });
});