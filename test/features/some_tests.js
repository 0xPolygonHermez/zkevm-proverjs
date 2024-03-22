const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Some individual tests", async function () {
    this.timeout(10000000000);

    it("Test JmpAddr Instruction", async () => {
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

            INCLUDE "test/collection/basics/jmpx.zkasm"

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
                    namespaces: ['Global', 'Main', 'Rom'],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {},
                {
                    compileFromString: true
                });
    });

    it("Test HashXn Instruction", async () => {
        const zkAsmCode = `
            VAR GLOBAL lastHashKId
            VAR GLOBAL lastHashPId
            VAR GLOBAL lastHashSId

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

                -1          :MSTORE(lastHashKId)
                -1          :MSTORE(lastHashPId)
                -1          :MSTORE(lastHashSId)

            INCLUDE "test/collection/operations/hash/keccak.zkasm"
            INCLUDE "test/collection/operations/hash/poseidon.zkasm"
            INCLUDE "test/collection/operations/hash/sha256.zkasm"

            end:
                0 => A,B,C,D,E,CTX, SP, PC, GAS, SR

            finalWait:
                    \${beforeLast()}  : JMPN(finalWait)
                                      : JMP(start)
            opINVALID:
        `;

        await verifyZkasm(zkAsmCode, true,
                {
                    defines: {N: 2 ** 18},
                    namespaces: ['Global', 'Main', 'Rom',
                                 'PaddingKK' ,'KeccakF', 'PaddingKKBit', 'Bits2Field',
                                 'PoseidonG', 'PaddingPG', 'Binary', 'Storage',
                                 'PaddingSha256' ,'Sha256F', 'PaddingSha256Bit', 'Bits2FieldSha256'],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {},
                {
                    compileFromString: true
                });
    });

    it("Test Call/Return Instruction", async () => {
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

            INCLUDE "test/collection/basics/callreturn.zkasm"

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
                    namespaces: ['Global', 'Main', 'Rom'],
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