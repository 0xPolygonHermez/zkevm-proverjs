const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const { performance } = require('perf_hooks');
const smMain = require('../../src/sm/sm_main/sm_main');
const { newCommitPolsArray, compile } = require('pilcom');
const buildPoseidon = require('@0xpolygonhermez/zkevm-commonjs').getPoseidon;

const fileCachePil = path.join(__dirname, '../../cache-main-pil.json');
const { Scalar } = require('ffjavascript');

const { argv } = require('yargs')
    .usage('node run-inputs.js -i <input.json> -f <inputsFolderPath> -r <rom.json> -o <information output> -e -S')
    .help('h')
    .alias('i', 'input')
    .alias('f', 'folder')
    .alias('r', 'rom')
    .alias('o', 'output')
    .alias('e', 'exit')
    .alias('p', 'pil')
    .alias('S', 'stats')
    .alias('c', 'counters')
    .alias('n', 'stepsN')
    .alias('t', 'tracer');

const helpers = require('./helpers');

// example: node run-inputs-blob.js -r ../../../zkevm-blob-rom/build/blob-rom.json -f ../../../zkevm-testvectors/inputs-executor-blob/

async function main() {
    console.time('Init time');
    const poseidon = await buildPoseidon();
    const { F } = poseidon;
    let countErrors = 0;
    let countOK = 0;
    let inputsPath;
    const testsOOC = [];
    let dirOOC;

    if (typeof argv.input === 'undefined' && typeof argv.folder === 'undefined') {
        console.error('option "input" or "folder" not set');
        process.exit(1);
    }

    const inputs = [];
    /*
     * get inputs array
     * if argv.input --> 1 input
     */
    if (argv.input) {
        const input = path.join(__dirname, argv.input.trim());
        if (fs.existsSync(input)) {
            inputs.push(input);
        } else {
            console.log('File not exist');
            process.exit(1);
        }
    } else {
        // if argv.folder --> inputs array
        inputsPath = path.join(__dirname, argv.folder.trim());
        if (!inputsPath.endsWith('/')) inputsPath += '/';
        if (fs.existsSync(inputsPath)) {
            fs.readdirSync(inputsPath).forEach((file) => {
                if (file.endsWith('.json')) { inputs.push(inputsPath + file); } else {
                    const stats = fs.statSync(inputsPath + file);
                    if (stats.isDirectory()) {
                        fs.readdirSync(inputsPath + file).forEach((subFile) => {
                            if (subFile.endsWith('.json')) { inputs.push(`${inputsPath + file}/${subFile}`); }
                        });
                    }
                }
            });
        } else {
            console.log('Folder not exist');
            process.exit(1);
        }
    }

    // if argv.n --> steps number
    let stepsNexec;
    if (argv.n) {
        stepsNexec = argv.n;
    }

    // get rom file
    let romFile;
    helpers.checkParam(argv.rom, 'Rom file');
    romFile = argv.rom.trim();
    const rom = JSON.parse(fs.readFileSync(path.join(__dirname, romFile), 'utf8'));

    /*
     * compile pil file
     * if no exist pil file or no argv.pil --> get pil cache file
     */
    let pil;
    if (fs.existsSync(fileCachePil) && !argv.pil) {
        pil = JSON.parse(await fs.promises.readFile(fileCachePil, 'utf8'));
    } else {
        const pilConfig = {
            defines: { N: 4096 },
            namespaces: ['Main', 'Global'],
            disableUnusedError: true,
        };
        const pilPath = path.join(__dirname, '../../pil/main.pil');
        pil = await compile(F, pilPath, null, pilConfig);
        await fs.promises.writeFile(fileCachePil, `${JSON.stringify(pil, null, 1)}\n`, 'utf8');
    }

    const cmPols = newCommitPolsArray(pil);

    let first = '';
    let second = '';
    const initTime = Date.now();
    console.timeEnd('Init time');
    for (let i = 0; i < inputs.length; i++) {
        let fileName = inputs[i];
        // get input file
        const input = JSON.parse(await fs.promises.readFile(fileName, 'utf8'));

        let info = '';

        info += `Input: ${fileName}\n`;
        info += 'Start executor JS...\n';
        // save start time
        const startTime = performance.now();

        try {
            // config object --> execute proverjs
            const config = {
                debug: true,
                debugInfo: {
                    inputName: path.basename(fileName),
                },
                stepsN: stepsNexec || 8388608,
                tracer: (argv.tracer === true),
                counters: (argv.counters === true),
                stats: (argv.stats === true),
                assertOutputs: true,
                blob: true,
                helpers: path.join(__dirname, '../../../zkevm-blob-rom/js/helper.js'),
            };
            await smMain.execute(cmPols.Main, input, rom, config);
            const stopTime = performance.now();
            info += `${chalk.green(`Finish executor JS ==> ${(stopTime - startTime) / 1000} s\n`)}`;
            first += info;
            countOK += 1;
        } catch (err) {
            console.log(err);
            countErrors += 1;
            info += `${chalk.red('Error')}\n`;
            info += `${chalk.yellow(`${err}\n`)}`;
            second += info;
            // if error OOC move test to OOC directory
            if (err.toString().includes('OOC')) {
                testsOOC.push({ fileName: `/GeneralStateTests/${fileName.split('/GeneralStateTests/')[1]}`, error: err.toString(), stepsN: stepsNexec ? Scalar.mul(Scalar.e(stepsNexec), 2) : 8388608 });
                const newPathFileName = fileName.replace(fileName.split('/')[fileName.split('/').length - 2], 'tests-OOC');
                dirOOC = newPathFileName.replace(newPathFileName.split('/')[newPathFileName.split('/').length - 1], '');
                if (!fs.existsSync(dirOOC)) {
                    fs.mkdirSync(dirOOC);
                }
                fs.rename(fileName, newPathFileName, () => {});
                fileName = newPathFileName;
            }
            // if argv.exit --> stop execution
            if (argv.exit) { break; }
        }
        console.log(info);
    }

}

main().then(() => {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
