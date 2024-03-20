const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Poseidon Counter", async function () {
    this.timeout(10000000000);

    it("Verify Poseidon Zkasm Test", async () => {
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
            INCLUDE "test/collection/counters/poseidon.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                      : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, {continueOnError: true},
                {
                    defines: {N: 2 ** 18},
                    namespaces: ['Global', 'Main', 'Rom', 'PoseidonG', 'Binary', 'Storage'],
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