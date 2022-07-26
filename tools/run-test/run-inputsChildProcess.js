const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const helpers = require("./helpers");
const { performance } = require("perf_hooks");
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const { execFile } = require("child_process");

const argv = require("yargs")
    .usage("node run-inputs.js -i <input.json> -f <inputsFolderPath> -r <rom.json> -o <information output> -n numberChildProcess")
    .help('h')
    .alias("i", "input")
    .alias("f", "folder")
    .alias("r", "rom")
    .alias("o", "output")
    .alias("n", "childProcess")
    .argv;

// example: node run-inputsChildProcess.js -f ../../../test-vectors/inputs-executor/calldata -r ../../../zkrom/build/rom.json -n 10

async function main(){

    const numberChilds = argv.n || 10;
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

    let successInfo = "";
    let errorInfo = "";

    let finishChilds = 0;
    console.log("Total inputs to run:", inputs.length);
    const initTime = performance.now();

    for(let i = 0; i < inputs.length; i++) {
        const fileName = inputs[i];
        let info = "";

        info += "Input: " + fileName + "\n";
        info += "Start executor JS...\n";
        const startTime = performance.now();

        while(i - finishChilds > numberChilds) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            console.log(finishChilds, i);
        }

        // node src/main_executor.js ../test-vectors/inputs-executor/calldata/op-call-revert_0.json -r ../zkrom/build/rom.json --debug --skip
        const params = ['../../src/main_executor.js', fileName, "-r", romFile, "--debug", "--skip"]

        const child = execFile('node', params, (error, stdout, stderr) => {
            const stopTime = performance.now();
            info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime)/1000} s\n`)}`;
            finishChilds++;
            if (error) {
                info += `${chalk.red('Error')}\n`
                info += `${chalk.yellow(`${error}\n`)}`;
                console.log(info);
                errorInfo += info;
            } else {
                info += stdout
                successInfo += info;
            }
        });
    }

    while(inputs.length > finishChilds) {
        console.log("wait to finish")
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(finishChilds, inputs.length)
    }

    const lastInformation = successInfo + errorInfo;
    console.log(errorInfo);
    console.log(`Tests finished in ${((performance.now() - initTime)/1000/60).toFixed(2)} minutes`)
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