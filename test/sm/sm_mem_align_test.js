const {verifyZkasm} = require("../verify_zkasm");

describe("Test MemAlign SM", async function () {
    this.timeout(10000000);

    it("Verify MemAlign Zkasm Test", async () => {
        await verifyZkasm("../zkasm/mem_align.zkasm", true,
                { defines: {N: 2 ** 21},
                  namespaces: ['Global', 'Main', 'Rom', 'Byte4', 'MemAlign'],
                  verbose: true,
                  color: true,
                  disableUnusedError: true});
    });
});
