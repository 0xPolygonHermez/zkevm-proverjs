const {verifyZkasm} = require("../verify_zkasm");

describe("Test MemAlign SM", async function () {
    this.timeout(10000000);

    it("Verify MemAlign Zkasm Test", async () => {
        await verifyZkasm("mem_align.zkasm", {continueOnError: true},
                { defines: {N: 2 ** 20},
                  namespaces: ['Global', 'Main', 'Rom', 'Byte4', 'MemAlign'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
