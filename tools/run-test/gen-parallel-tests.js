
const chai = require("chai");
const expect = chai.expect;
const { compile } = require("pilcom");
const folderPaths = ["../../../zkevm-testvectors/inputs-executor", "../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests"];
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const fs = require("fs");
const path = require("path");
const fileCachePil = path.join(__dirname, "../../cache-main-pil.json");
const inputs = [];
const testsFolder = path.join(__dirname, "parallel-tests");
const sampleDir = path.join(__dirname, "sample.test.js");

async function main() {

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
        defines: { N: 4096 },
        namespaces: ['Main', 'Global']
    };

    const pil = await compile(F, "pil/main.pil", null, pilConfig);
    fs.writeFileSync(fileCachePil, JSON.stringify(pil, null, 1) + "\n", "utf8");
    genTestsFiles();

}

async function genTestsFiles() {

    if (!fs.existsSync(testsFolder)){
        fs.mkdirSync(testsFolder);
    }
    for (const inputPath of inputs) {
        const name = inputPath.split("/").slice(-1)[0].replace('json','test.js');
        const sample = fs.readFileSync(sampleDir, "utf-8");
        const test = sample.replace("\"%%INPUT_PATH%%\"", `"${inputPath}"`);
        fs.writeFileSync(`${testsFolder}/${name}`, test);
    }
    expect(true).to.be.true
}

main();