const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const helpers = require("./helpers");
const { performance } = require("perf_hooks");
const smMain = require("../../src/sm/sm_main");
const { compile } = require("@0xpolygonhermez/pilcom");
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const createCommitedPols = require("@0xpolygonhermez/pilcom").createCommitedPols;
const fileCachePil = path.join(__dirname, "../../cache-main-pil.json");

const argv = require("yargs")
    .usage("node run-inputs.js -i <input.json> -f <inputsFolderPath> -r <rom.json> -p <pil.json> -o <information output>")
    .help('h')
    .alias("i", "input")
    .alias("f", "folder")
    .alias("r", "rom")
    .alias("p", "pil")
    .alias("o", "output")
    .alias("e", "exit")
    .argv;

// example: node run-inputs.js -f ../../../test-vectors/inputs-executor/calldata -r ../../../zkrom/build/rom.json

async function main(){

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    if (typeof argv.input === "undefined" && typeof argv.folder === "undefined"){
        console.error(`option "input" or "folder" not set`);
        process.exit(1);
    }

    const inputs = [];
    if(argv.input){
        const input = path.join(__dirname, argv.input.trim());
        if(fs.existsSync(input)) {
            inputs.push(input);
        } else {
            console.log("File not exist");
            process.exit(1);
        }
    } else {
        let inputsPath = path.join(__dirname, argv.folder.trim());
        if (!inputsPath.endsWith("/")) inputsPath = inputsPath + "/"
        if(fs.existsSync(inputsPath)) {
            fs.readdirSync(inputsPath).forEach(file => {
                if(file.endsWith(".json"))
                    inputs.push(inputsPath+file);
                else {
                    var stats = fs.statSync(inputsPath+file);
                    if(stats.isDirectory()) {
                        fs.readdirSync(inputsPath+file).forEach(subFile => {
                            if(subFile.endsWith(".json"))
                                inputs.push(inputsPath+file+"/"+subFile);
                        });
                    }
                }
            });
        } else {
            console.log("Folder not exist");
            process.exit(1);
        }
    }

    let romFile;
    helpers.checkParam(argv.rom, "Rom file");
    romFile = argv.rom.trim();

    let first = "";
    let second = "";
    const initTime = Date.now();
    for(let i = 0; i < inputs.length; i++) {
        const fileName = inputs[i];
        let info = "";

        const input = JSON.parse(await fs.promises.readFile(fileName, "utf8"));
        const rom = JSON.parse(await fs.promises.readFile(romFile, "utf8"));

        let pil;
        if (fs.existsSync(fileCachePil)) {
            pil = JSON.parse(await fs.promises.readFile(fileCachePil, "utf8"));
        } else {
            pil = await compile(F, "../../pil/main.pil");
            await fs.promises.writeFile(fileCachePil, JSON.stringify(pil, null, 1) + "\n", "utf8");
        }

        info += "Input: " + fileName + "\n";
        info += "Start executor JS...\n";
        const startTime = performance.now();
        try {
            const [cmPols, cmPolsArray, cmPolsDef, cmPolsDefArray] =  createCommitedPols(pil);
            const config = {
                    debug: true,
                    debugInfo: {
                        inputName: path.basename(fileName)
                    }
                }
            if(fileName.includes("stack-errors") || fileName.includes("erc20") || fileName.includes("call_16") || fileName.includes("call_24")){
                config.debugInfo["N"] = 18;
            } else {
                if (fileName.includes("e2e")) {
                    config.debugInfo["N"] = 20;
                }
            }
            await smMain.execute(cmPols.Main, cmPolsDef.Main, input, rom, config);
            const stopTime = performance.now();
            info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime)/1000} s\n`)}`;
            first += info;
        } catch(err) {
            info += `${chalk.red('Error')}\n`
            info += `${chalk.yellow(`${err}\n`)}`;
            second += info;
            if(argv.exit)
                break;
        }
        console.log(info)
    }
    console.log(`Tests finished in ${((Date.now() - initTime)/1000/60).toFixed(2)} minutes`)
    const lastInformation = first + second;
    console.log(lastInformation);
    let fileOutput = "output.txt"
    if(argv.output)
        fileOutput = argv.output.trim();
    await fs.writeFileSync(path.join(__dirname, fileOutput), lastInformation);
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});