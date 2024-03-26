const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Binary Counter", async function () {
    this.timeout(10000000000);

    it("Verify Binary SLT Fix Test", async () => {
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

            INCLUDE "test/collection/fix/main_slt_fix.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                      : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, true,
                {
                    defines: {N: 2 ** 16},
                    namespaces: ['Global', 'Main', 'Rom', 'Binary'],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {},
                {
                    compileFromString: true
                });
    });
});