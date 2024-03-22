const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test SHA256 Counter", async function () {
    this.timeout(10000000000);

    it("Verify SHA256 Zkasm Test", async () => {
        const zkAsmCode = `
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

                -1          :MSTORE(lastHashSId)

            INCLUDE "test/collection/counters/utils.zkasm"
            INCLUDE "test/collection/counters/sha256.zkasm"

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
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingSha256' ,'Sha256F', 'PaddingSha256Bit', 'Bits2FieldSha256'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true
                },
                {},
                // TODO: Pass a proper main config
                // {
                //   commitFilename: '/mnt/data/zkronos73/build/test/commit.bin',
                //   constFilename: '/mnt/data/zkronos73/build/test/const.bin',
                //   pilJsonFilename: '/mnt/data/zkronos73/build/test/mail.pil.json',
                //   externalPilVerification: true
                // }
                {
                    compileFromString: true
                });
    });
});
