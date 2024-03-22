const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test PaddingPg Counter", async function () {
    this.timeout(10000000000);

    it("Verify PaddingPG Zkasm Test", async () => {
        const zkAsmCode = `
            VAR GLOBAL lastHashPId

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

                -1          :MSTORE(lastHashPId)

            INCLUDE "test/collection/counters/utils.zkasm"
            INCLUDE "test/collection/counters/padding_pg.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                      : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, {continueOnError: true},
                {
                    defines: {N: 2 ** 23},
                    namespaces: ['Global', 'Binary', 'Main', 'Rom', 'PaddingPG', 'PoseidonG'],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {
                    externalPilVerification: true,
                    commitFilename: 'build/commit.bin',
                    constFilename: 'build/const.bin',
                    pilJsonFilename: 'build/main.pil.json'
                },
                {
                    compileFromString: true
                });
    });
});