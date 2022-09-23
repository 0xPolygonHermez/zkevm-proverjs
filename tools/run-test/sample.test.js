const chai = require("chai");
const expect = chai.expect;
const rom = require("../../../../zkevm-rom/build/rom.json")
const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const smMain = require("../../../src/sm/sm_main/sm_main");
const chalk = require("chalk");
const fileCachePil = path.join(__dirname, "../../../cache-main-pil.json");
const { newCommitPolsArray } = require("pilcom");
const checkerDir = path.join(__dirname, "checker.txt")

it('Should run one input', async () => {
    if (fs.existsSync(checkerDir)){
        process.exit(1)
    }
    const initTime = Date.now();
    try {
        const pil = JSON.parse(fs.readFileSync(fileCachePil))
        const cmPols = newCommitPolsArray(pil);
        const inputPath = "%%INPUT_PATH%%";
        const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
        let info = "";
        const startTime = performance.now();
        try {
            const config = {
                debug: true,
                debugInfo: {
                    inputName: path.basename(inputPath)
                }
            }
            console.log("Running test: ", inputPath);
            await smMain.execute(cmPols.Main, input, rom, config);
            const stopTime = performance.now();
            info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime) / 1000} s\n`)}`;
        } catch (err) {
            fs.writeFileSync(checkerDir, `Failed test ${inputPath}`);
            info += `${chalk.red('Error')}\n`
            info += `${chalk.yellow(`${err}\n`)}`;
            console.log(info);
            throw err;
        }
        console.log(info);
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`Current memory heap: ${Math.round(used * 100) / 100} MB out of ${process.memoryUsage().heapTotal}`);
        expect(true).to.be.true
    } catch (e) {
        console.log(e);
        throw e;
    }
    console.log(`Test finished in ${((Date.now() - initTime) / 1000 / 60).toFixed(2)} minutes`)

});