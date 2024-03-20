const path = require("path");
const {verifyZkasm} = require("../verify_zkasm");

describe("Collection tests", async function () {
    this.timeout(10000000);

    it("Verifies the PIL associated with the collection zkasm", async () => {
        const helperFile = "test/collection/helpers/helper.js";
        const fullPathHelper = path.resolve(helperFile);
        console.log(`Using helper ${helperFile} on ${fullPathHelper}`);
        const helper = require(fullPathHelper);

        await verifyZkasm(__dirname + "/main.zkasm", true,
                {
                    // defines: {N: 2 ** 18},
                    // namespaces: ['Global', 'Main',],
                    verbose: true,
                    color: true,
                    disableUnusedError: true
                },
                {
                    // constants: false,
                    // fastDebugExit: true,
                    helpers: [new helper()],
                    romFilename: "tmp/rom.json",
                    constFilename: "tmp/constFile.bin",
                    commitFilename: "tmp/commitFile.bin",
                    pilJsonFilename: "tmp/main.pil.json",
                    externalPilVerification: true
                });
    });
});