const chai = require("chai");
const expect = chai.expect;
const { newCommitPolsArray, compile } = require("pilcom");
const folderPaths = ["../../../zkevm-testvectors/inputs-executor", "../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests"];
const rom = require("../../../zkevm-rom/build/rom.json")
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const fs = require("fs");
const path = require("path");
const fileCachePil = path.join(__dirname, "../../cache-main-pil.json");
const { performance } = require("perf_hooks");
const smMain = require("../../src/sm/sm_main/sm_main");
const chalk = require("chalk");

describe("Run executor inputs from config file", () => {
    let cmPols;
    const inputs = [];

    before(async () => {
        const poseidon = await buildPoseidon();
        const F = poseidon.F;
        for (const folder of folderPaths) {
            let inputsPath = path.join(__dirname, folder);
            fs.readdirSync(inputsPath).forEach(file => {
                const filePath = path.join(inputsPath, file);
                if (file.endsWith(".json")) {
                    inputs.push(filePath);
                } else {
                    if (fs.statSync(filePath).isDirectory()) {
                        fs.readdirSync(filePath).forEach(subFile => {
                            const subFilePath = path.join(filePath, subFile);
                            if (subFile.endsWith(".json"))
                                inputs.push(subFilePath);
                        });
                    }
                }
            });
        }
       
        const pilConfig = {
            defines: { N: 2 ** 21 },
            namespaces: ['Main', 'Global']
        };

        const pil = await compile(F, "pil/main.pil", null, pilConfig);
        fs.writeFileSync(fileCachePil, JSON.stringify(pil, null, 1) + "\n", "utf8");

        cmPols = newCommitPolsArray(pil);

    });

    it('Should run all the inputs', async () => {
        const initTime = Date.now();
        try {
            for (const inputPath of inputs) {
                const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
                let info = "";
                info += "Input: " + inputPath + "\n";
                const startTime = performance.now();
                try {
                    const config = {
                        debug: true,
                        debugInfo: {
                            inputName: path.basename(inputPath)
                        }
                    }
                    await smMain.execute(cmPols.Main, input, rom, config);
                    const stopTime = performance.now();
                    info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime) / 1000} s\n`)}`;
                } catch (err) {
                    info += `${chalk.red('Error')}\n`
                    info += `${chalk.yellow(`${err}\n`)}`;
                    console.log(info);
                    throw err;
                }
                console.log(info);
            }
            expect(true).to.be.true
        } catch (e) {
            console.log(e);
            throw e;
        }
        console.log(`Tests finished in ${((Date.now() - initTime) / 1000 / 60).toFixed(2)} minutes`)

    });
})
