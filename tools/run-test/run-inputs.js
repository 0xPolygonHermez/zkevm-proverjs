const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const helpers = require("./helpers");
const { performance } = require("perf_hooks");
const smMain = require("../../src/sm/sm_main/sm_main");
const { newCommitPolsArray, compile  } = require("pilcom");
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const fileCachePil = path.join(__dirname, "../../cache-main-pil.json");

const argv = require("yargs")
    .usage("node run-inputs.js -i <input.json> -f <inputsFolderPath> -r <rom.json> -o <information output> - e")
    .help('h')
    .alias("i", "input")
    .alias("f", "folder")
    .alias("r", "rom")
    .alias("o", "output")
    .alias("e", "exit")
    .argv;

// example: node run-inputs.js -f ../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests/stMemoryTest -r ../../../zkevm-rom/build/rom.json

async function main(){
    console.time("Init time");
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    let countErrors = 0;
    let countOK = 0;

    if (typeof argv.input === "undefined" && typeof argv.folder === "undefined"){
        console.error(`option "input" or "folder" not set`);
        process.exit(1);
    }

    const inputs = [];
    if (argv.input){
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
    const rom = JSON.parse(fs.readFileSync(path.join(__dirname, romFile), "utf8"));

    let pil;
    if (fs.existsSync(fileCachePil)) {
        pil = JSON.parse(await fs.promises.readFile(fileCachePil, "utf8"));
    } else {
        const pilConfig = {
            defines: { N: 4096 },
            namespaces: ['Main', 'Global']
        };

        pil = await compile(F, "../../pil/main.pil", null, pilConfig);
        await fs.promises.writeFile(fileCachePil, JSON.stringify(pil, null, 1) + "\n", "utf8");
    }

    const cmPols = newCommitPolsArray(pil);

    let first = "";
    let second = "";
    const initTime = Date.now();
    console.timeEnd("Init time");
    for(let i = 0; i < inputs.length; i++) {
        const fileName = inputs[i];
        const input = JSON.parse(await fs.promises.readFile(fileName, "utf8"));

        let info = "";

        info += "Input: " + fileName + "\n";
        info += "Start executor JS...\n";
        const startTime = performance.now();
        try {
            const config = {
                debug: true,
                debugInfo: {
                    inputName: path.basename(fileName)
                },
                stepsN: 8388608,
                tracer: true
            }
            await smMain.execute(cmPols.Main, input, rom, config);
            const stopTime = performance.now();
            info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime)/1000} s\n`)}`;
            first += info;
            countOK += 1;
        } catch(err) {
            countErrors += 1;
            info += `${chalk.red('Error')}\n`
            info += `${chalk.yellow(`${err}\n`)}`;
            second += info;
            if(argv.exit)
                break;
        }
        console.log(info);
    }

    console.log(`Tests finished in ${((Date.now() - initTime)/1000/60).toFixed(2)} minutes`)
    const lastInformation = first + second;
    console.log(lastInformation);

    let fileOutput = "output.txt";
    if(argv.output)
        fileOutput = argv.output.trim();
    await fs.writeFileSync(path.join(__dirname, fileOutput), lastInformation);

    if (argv.info) {
        const fileInfo = argv.info.trim();
        let infoOK = '';
        infoOK += `inputs: ${inputs.length}\n`;
        infoOK += `ok: ${countOK}\n`;
        infoOK += `errors: ${countErrors}\n`;
        await fs.writeFileSync(path.join(__dirname, fileInfo), infoOK);
    }
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});