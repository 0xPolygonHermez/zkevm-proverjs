const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");

const {verifyZkasm} = require("../verify_zkasm");

describe("Test SHA256 Counter", async function () {
    this.timeout(10000000000);

    it("Verify SHA256 Zkasm Test", async () => {
        await verifyZkasm("../collection/counters/sha256.zkasm", true,
                {
                  defines: {N: 2 ** 18},
                  namespaces: ['Global', 'Main', 'Rom', 'PaddingSha256' ,'Sha256F', 'PaddingSha256Bit', 'Bits2FieldSha256'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true
                },
                // TODO: Pass a proper main config
                // {
                //   commitFilename: '/mnt/data/zkronos73/build/test/commit.bin',
                //   constFilename: '/mnt/data/zkronos73/build/test/const.bin',
                //   pilJsonFilename: '/mnt/data/zkronos73/build/test/mail.pil.json',
                //   externalPilVerification: true
                // }
                );
    });
});
