const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test Storage Counters", async function () {
    this.timeout(10000000);

    this.beforeEach(async function () {

    });

    it("Verify Storage Zkasm Test", async () => {
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
            INCLUDE "test/collection/counters/storage.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                    : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, true,
            {
                defines: {N: 2 ** 22},
                namespaces: ['Global', 'Main', 'Storage', 'ClimbKey'],
                verbose: true,
                color: true,
                disableUnusedError: true
            },
            {},
            {
                compileFromString: true
            });
    });

    it("Verify Storage Zkasm Test (some delete edge cases)", async () => {
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
            INCLUDE "test/collection/counters/storage_keys.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                    : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, true,
            {
                defines: {N: 2 ** 22},
                namespaces: ['Global', 'Main', 'Storage', 'ClimbKey'],
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