/* eslint-disable import/order */
/* eslint-disable prefer-destructuring */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-undef */
/* eslint-disable max-len */
/* eslint-disable no-continue */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { upAll, down, buildAll } = require('docker-compose');
const ethers = require('ethers');
const path = require('path');
const fs = require('fs');
const { newCommitPolsArray, compile } = require('pilcom');
const buildPoseidon = require('@0xpolygonhermez/zkevm-commonjs').getPoseidon;
const _ = require('lodash');
const chalk = require('chalk');
const zkasm = require('@0xpolygonhermez/zkasmcom');
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const smMain = require('../../src/sm/sm_main/sm_main');
const { createHash } = require('crypto');

const CHAIN_ID = 1000;
const providerURL = 'http://127.0.0.1:8545';
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const config = require('./config.json');

const opCall = ['CALL', 'STATICCALL', 'DELEGATECALL', 'CALLCODE'];
const opCreate = ['CREATE', 'CREATE2'];
const ethereumTestsPath = '../../../zkevm-testvectors/tools-inputs/tools-eth/tests/BlockchainTests/GeneralStateTests/';
const stTestsPath = '../../../zkevm-testvectors/tools-inputs/data/';
const invalidTests = ['custom-tx.json', 'access-list.json', 'effective-gas-price.json', 'op-basefee.json', 'CREATE2_HighNonceDelegatecall.json', 'op-selfdestruct.json', 'txs-calldata.json', 'over-calldata.json', 'change-l2-block.json', 'ooc.json', 'test-length-data.json', 'pre-modexp.json', 'pre-modexp.json', 'empty-batch.json', 'uniswapv2.json', 'pre-revert.json'];
const invalidOpcodes = ['BASEFEE', 'SELFDESTRUCT', 'TIMESTAMP', 'COINBASE', 'BLOCKHASH', 'NUMBER', 'DIFFICULTY', 'GASLIMIT', 'EXTCODEHASH', 'SENDALL', 'PUSH0'];
const invalidErrors = ['return data out of bounds', 'gas uint64 overflow', 'contract creation code storage out of gas', 'write protection', 'bn256: malformed point', 'stack underflow (0 <=>'];
const noExec = require('../../../zkevm-testvectors/tools-inputs/tools-eth/no-exec.json');
const { checkBlockInfoRootsFromTrace } = require('./full-tracer-tests-utils');

let forceRegen = false;
const { argv } = require('yargs')
    .usage('node full-tracer-tests.js -n -f -r')
    .alias('n', 'noStop') // Stop execution if one tests fails (default true)
    .alias('f', 'forceRegen') // Retry failed test after regenerate
    .alias('r', 'regen'); // Force test regeneration
// CONFIG FLAGS
const noStopOnFailure = argv.noStop;
const forceRegenArg = argv.forceRegen;
const regen = argv.regen;
const errorsMap = {
    OOG: 'out of gas',
    invalidStaticTx: 'write protection',
    revert: 'execution reverted',
    invalidOpcode: 'invalid opcode: INVALID',
    overflow: 'stack limit reached 1024 (1023)',
    underflow: 'stack underflow (0 <=> 1)',
    invalidJump: 'invalid jump destination',
};

async function main() {
    try {
        console.log('Starting traces comparator');
        const failedTests = [];
        const noExecTests = noExec['breaks-computation'].concat(noExec['not-supported']);
        // Write tracer outputs to files
        if (!fs.existsSync(path.join(__dirname, 'geth-traces'))) {
            fs.mkdirSync(path.join(__dirname, 'geth-traces'));
        }
        if (!fs.existsSync(path.join(__dirname, 'ft-traces'))) {
            fs.mkdirSync(path.join(__dirname, 'ft-traces'));
        }
        // Compile rom file
        const zkasmFile = path.join(__dirname, '../../node_modules/@0xpolygonhermez/zkevm-rom/main/main.zkasm');
        const rom = await zkasm.compile(zkasmFile, null, {});
        for (const configTest of config) {
            const {
                testName, testToDebug, traceMethod, isEthereumTest, folderName, disable,
            } = configTest;

            if (disable) {
                continue;
            }

            const testPath = isEthereumTest ? path.join(__dirname, `${ethereumTestsPath}/${testName}.json`) : path.join(__dirname, `${stTestsPath}/calldata/${testName}.json`);

            const tests = createTestsArray(isEthereumTest, testName, testPath, testToDebug, folderName);
            // Read files
            const files = fs.readdirSync(path.join(__dirname, 'geth-traces'));
            // Sort files by id
            files.sort((a, b) => Number(a.split('_')[3]) - Number(b.split('_')[3]));
            for (let j = 0; j < tests.length; j++) {
                const test = tests[j];
                console.log(chalk.green(`Checking test number ${j}/${tests.length}: ${test.testName}-${test.id}   ----  ${traceMethod}`));
                // Skip tests from no exec file
                if (noExecTests.filter((t) => t.name === `${test.folderName}/${test.testName}_${test.testToDebug}`
                    || t.name === `${test.folderName}/${test.testName}`).length > 0) {
                    continue;
                }
                // Find test from folder if not regen
                let gethTraces = [];
                const hash = createHash('sha256').update(`${test.testName}_${test.id}_${traceMethod}`).digest('hex').slice(0, 8);
                files.forEach((file) => {
                    const identifier = file.split('_')[file.split('_').length - 1].replace('.json', '');
                    if (identifier === hash) {
                        gethTraces.push(JSON.parse(fs.readFileSync(path.join(__dirname, 'geth-traces', file), 'utf8')));
                    }
                });
                // Get num of non changeL2Block txs
                const ethTxs = isEthereumTest ? test.blocks[0].transactions.length : test.txs.filter((tx) => typeof tx.type === 'undefined').length;
                if (regen || (forceRegen && forceRegenArg) || (!isEthereumTest && gethTraces.length !== ethTxs) || (isEthereumTest && gethTraces.length !== test.blocks.length)) {
                    // Configure genesis for test
                    const isGethSupported = await configureGenesis(test, isEthereumTest);
                    if (!isGethSupported) {
                        continue;
                    }

                    // Init geth node
                    await startGeth();

                    // Run txs
                    const txsHashes = isEthereumTest ? await runTxsFromEthTest(test) : await runTxs(test);

                    // Get geth traces from debug call
                    gethTraces = await getGethTrace(txsHashes, test.testName, traceMethod, test.id);
                }

                // Get trace from full tracer
                if (!fs.existsSync(test.inputTestPath)) {
                    console.log(`Test not found ${test.testName}`);
                    continue;
                }
                const ftTraces = await getFtTrace(test, gethTraces.length, rom, isEthereumTest);
                if (ftTraces.length === 0) {
                    continue;
                }
                // Check block info root
                await checkBlockInfoRootsFromTrace(test.testName);

                // Compare traces
                for (let i = 0; i < ftTraces.length; i++) {
                    const changes = await compareTracesByMethod(gethTraces[i], ftTraces[i], traceMethod, i, testName);
                    if (!_.isEmpty(changes) && !includesInvalidOpcode(ftTraces[i].full_trace.steps) && !includesInvalidError(changes, ftTraces[i].full_trace)) {
                        const message = `Diff found at test ${test.testName}-${test.id}-${i}: ${JSON.stringify(changes)}`;
                        console.log(chalk.red(message));
                        failedTests.push(message);
                        if (!forceRegen && forceRegenArg) {
                            forceRegen = true;
                            j--;
                            break;
                        }
                        if (!noStopOnFailure) {
                            process.exit(1);
                        }
                    } else {
                        forceRegen = false;
                        console.log(chalk.green(`No differences for test ${test.testName}-${test.id}-${i} -- ${traceMethod}`));
                    }
                }
            }
        }
        if (failedTests.length) {
            console.log(chalk.red('Failed tests found:'));
            console.log(chalk.red(JSON.stringify(failedTests)));
            process.exit(1);
        }
        console.log('Finished');
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

function includesInvalidError(changes, callTrace) {
    for (const error of invalidErrors) {
        if (JSON.stringify(changes).includes(error)) {
            console.log(`Invalid error found: ${error}`);

            return true;
        }
    }

    if (JSON.stringify(callTrace).includes('invalidCodeStartsEF')) {
        console.log('Invalid error found: invalidCodeStartsEF');

        return true;
    }

    return false;
}

function includesInvalidOpcode(steps) {
    if (!steps) {
        return false;
    }
    for (const step of steps) {
        if (invalidOpcodes.includes(step.opcode)) {
            console.log(`Invalid opcode found: ${step.opcode}`);

            return true;
        }
    }

    return false;
}
function createTestsArray(isEthereumTest, testName, testPath, testToDebug, folderName) {
    if (!folderName) {
        if (invalidTests.includes(`${testName}.json`)) {
            return [];
        }
        let test = isEthereumTest ? [JSON.parse(fs.readFileSync(testPath))][0] : [JSON.parse(fs.readFileSync(testPath))[testToDebug]];
        if (isEthereumTest) {
            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin'));
            test = [test[keysTests[testToDebug]]];
        }
        let inputTestPath;
        let tn;
        let fn;
        if (isEthereumTest) {
            const ethPath = testName.split('/');
            if (ethPath.length === 3) {
                inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${ethPath[0]}/${ethPath[2]}_${testToDebug}.json`);
                tn = ethPath[2];
                fn = `${ethPath[0]}/${ethPath[1]}`;
            } else {
                inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${testName}_${testToDebug}.json`);
                tn = ethPath[1];
                fn = ethPath[0];
            }
        } else {
            inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/calldata/${testName}_${testToDebug}.json`);
            tn = testName;
            fn = testName;
        }

        Object.assign(test[0], {
            testName: tn, inputTestPath, testToDebug, id: testToDebug, folderName: fn,
        });

        return test;
    }
    // Create tests array from folderPath
    let tests = [];
    let files;
    if (isEthereumTest) {
        files = fs.readdirSync(path.join(__dirname, `${ethereumTestsPath}/${folderName}`));
    } else {
        files = fs.readdirSync(path.join(__dirname, `${stTestsPath}/${folderName}`));
    }
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (invalidTests.includes(file)) {
            continue;
        }
        if (isEthereumTest) {
            const test = JSON.parse(fs.readFileSync(path.join(__dirname, `${ethereumTestsPath}/${folderName}/${file}`)));
            let j = 0;
            for (const [key, value] of Object.entries(test)) {
                if (!key.includes('Berlin')) {
                    continue;
                }
                if (value.network !== 'Berlin') {
                    continue;
                }
                const ethPath = folderName.split('/');
                let inputTestPath;
                if (ethPath.length === 2) {
                    inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${ethPath[0]}/${file.split('.')[0]}_${j}.json`);
                } else {
                    inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${folderName}/${file.split('.')[0]}_${j}.json`);
                }
                // Check input exists
                if (!fs.existsSync(inputTestPath)) {
                    inputTestPath = inputTestPath.replace('_0', '');
                    if (j !== 0 && !fs.existsSync(inputTestPath)) {
                    // Check file exists without num
                        console.log(`Input not found: ${inputTestPath}`);
                        continue;
                    }
                }
                Object.assign(value, {
                    testName: file.split('.')[0], folderName, inputTestPath, testToDebug: j, id: j,
                });
                tests.push(value);
                j++;
            }
        } else {
            const t = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors/tools-inputs/data/${folderName}/${file}`)));
            if (Array.isArray(t)) {
                t.map((v) => {
                    const inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/${folderName}/${file.split('.')[0]}_${v.id}.json`);
                    Object.assign(v, { testName: file.split('.')[0], folderName, inputTestPath });

                    return v;
                });
                tests = tests.concat(t);
            } else {
                const inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/calldata/${folderName}/${file.split('.')[0]}_${t.id}.json`);
                Object.assign(t, { testName: file.split('.')[0], folderName, inputTestPath });
                tests = tests.concat([t]);
            }
        }
    }

    return tests;
}
async function compareTracesByMethod(geth, fullTracer, method, key, testName) {
    switch (method) {
    case 'defaultTracer':
        return compareDefaultTracer(geth, fullTracer, key, testName);
    case 'callTracer':
        return compareCallTracer(geth, fullTracer, key, testName);
    default:
        return compareDefaultTracer(geth, fullTracer, key, testName);
    }
}

/**
 * Compare a geth trace with a full tracer trace
 * @param {Object} geth trace
 * @param {Object} fullTracer trace
 * @returns Array with the differences found
 */
async function compareCallTracer(geth, fullTracer, i) {
    const { context } = fullTracer.full_trace;
    // Generate geth trace from fullTracer trace
    const newFT = {
        from: context.from,
        gas: `0x${Number(context.gas).toString(16)}`,
        gasUsed: `0x${Number(context.gas_used).toString(16)}`,
        to: context.to,
        input: context.data,
        output: `0x${context.output}`,
        calls: [],
        value: `0x${Number(context.value).toString(16)}`,
        type: context.type,
    };
    if (fullTracer.error !== '') {
        newFT.error = errorsMap[fullTracer.error];
    }
    // if is a deploy, replace 0x to by create address
    if (context.type === 'CREATE') {
        newFT.to = fullTracer.create_address;
    }
    // Fill calls array
    const callData = [];
    let ctx = 0;
    let currentStep = 0;
    for (const step of fullTracer.full_trace.steps) {
        // Previous step analysis
        if (currentStep > 0) {
            const previousStep = fullTracer.full_trace.steps[currentStep - 1];
            // Increase depth
            if (previousStep.depth < step.depth) {
                ctx++;
                callData[ctx] = {
                    from: step.contract.caller,
                    gas: `0x${Number(step.gas).toString(16)}`,
                    gasUsed: '0x0',
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(step.contract.address)), 20),
                    input: step.contract.data,
                    value: `0x${Number(step.contract.value).toString(16)}`,
                    type: previousStep.opcode,
                    calls: [],
                    gasCallCost: `0x${(Number(previousStep.gas_cost) - Number(step.gas)).toString(16)}`,
                    gasAtCall: `0x${(Number(previousStep.gas)).toString(16)}`,
                };
                let { calls } = newFT;
                // Fill call in the right depth
                if (previousStep.depth > 1) {
                    for (let j = 1; j < previousStep.depth; j++) {
                        calls = calls[calls.length - 1].calls;
                    }
                }
                calls.push(callData[ctx]);
            } else if (previousStep.depth > step.depth) {
                // Decrease depth
                callData[ctx].output = step.return_data;
                if (previousStep.error !== '') {
                    callData[ctx].error = errorsMap[previousStep.error];
                    if (previousStep.error !== 'revert') {
                        callData[ctx].gasUsed = callData[ctx].gas;
                    } else {
                        callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasAtCall) - Number(step.gas) - Number(callData[ctx].gasCallCost)).toString(16)}`;
                        if (previousStep.opcode === 'STOP' && previousStep.pc === 0) {
                            callData[ctx].gasUsed = '0x0';
                        } else if (opCreate.includes(previousStep.contract.type)) {
                            callData[ctx].gasUsed = `0x${(Number(previousStep.contract.gas - Number(step.gas))).toString(16)}`;
                        }
                    }
                } else {
                    callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasAtCall) - Number(step.gas) - Number(callData[ctx].gasCallCost)).toString(16)}`;
                    if (previousStep.opcode === 'STOP' && previousStep.pc === 0) {
                        callData[ctx].gasUsed = '0x0';
                    } else if (opCreate.includes(previousStep.contract.type)) {
                        callData[ctx].gasUsed = `0x${(Number(previousStep.contract.gas - Number(step.gas))).toString(16)}`;
                    }
                }
                ctx--;
                // Detect precompiled call
            } else if (opCall.includes(previousStep.opcode) && previousStep.depth === step.depth && previousStep.error === '') {
                const to = BigInt(previousStep.stack[previousStep.stack.length - 2]);
                // Check precompiled destination
                if (to > 0 && to < 10) {
                    callData[ctx + 1] = {
                        from: step.contract.address,
                        gas: `0x${Number(step.gas).toString(16)}`,
                        gasUsed: `0x${(Number(previousStep.gas_cost)).toString(16)}`,
                        to: ethers.utils.hexZeroPad(ethers.utils.hexlify(to), 20),
                        input: getFromMemory(previousStep.memory, previousStep.stack, previousStep.opcode),
                        output: step.return_data,
                        type: previousStep.opcode,
                        value: '0x0',
                        calls: [],
                    };
                    // Compute call gas cost
                    const callGasCost = computeCallGasCost(previousStep.memory, previousStep.stack, previousStep.opcode) + 100;
                    callData[ctx + 1].gasUsed = `0x${(Number(callData[ctx + 1].gasUsed) - callGasCost).toString(16)}`;
                    // Compute gas sent to call
                    let gasSent = Number(previousStep.gas) - callGasCost;
                    gasSent -= Math.floor(gasSent / 64);
                    // If precompiled call failed, gas sent is obtained from call stack
                    const gasCall = Number(previousStep.stack[previousStep.stack.length - 1]);
                    if (callData[ctx + 1].gasUsed === `0x${gasCall.toString(16)}`) {
                        gasSent = gasCall;
                    }
                    callData[ctx + 1].gas = `0x${gasSent.toString(16)}`;
                    // Remove value from staticcall
                    if (previousStep.opcode === 'STATICCALL' || previousStep.opcode === 'DELEGATECALL') {
                        delete callData[ctx + 1].value;
                    }
                    let { calls } = newFT;
                    // Fill call in the right depth
                    if (previousStep.depth > 1) {
                        for (let j = 1; j < previousStep.depth; j++) {
                            calls = calls[calls.length - 1].calls;
                        }
                    }
                    calls.push(callData[ctx + 1]);
                }
                // else {
                //     callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasUsed) + Number(previousStep.gas_cost)).toString(16)}`;
                // }
                // Detect failed create2
            } else if (opCreate.includes(previousStep.opcode) && previousStep.depth === step.depth) {
                callData[ctx + 1] = {
                    from: previousStep.contract.address,
                    gas: `0x${Number(step.gas).toString(16)}`,
                    gasUsed: '0x0',
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(step.stack[step.stack.length - 1])), 20),
                    input: getFromMemory(previousStep.memory, previousStep.stack, previousStep.opcode),
                    output: step.return_data,
                    type: previousStep.opcode,
                    value: previousStep.stack[previousStep.stack.length - 1],
                    calls: [],
                };

                // Compute gas sent to call
                let gasSent = Number(previousStep.gas) - 32000;
                gasSent -= Math.floor(gasSent / 64);
                callData[ctx + 1].gas = `0x${gasSent.toString(16)}`;

                let { calls } = newFT;
                // Fill call in the right depth
                if (previousStep.depth > 1) {
                    for (let j = 1; j < previousStep.depth; j++) {
                        calls = calls[calls.length - 1].calls;
                    }
                }
                calls.push(callData[ctx + 1]);
                // Detect failed op call
            } else if (opCall.includes(previousStep.opcode) && previousStep.depth === step.depth) {
                callData[ctx + 1] = {
                    from: previousStep.contract.address,
                    gas: previousStep.stack[previousStep.stack.length - 1],
                    gasUsed: previousStep.stack[previousStep.stack.length - 1],
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(previousStep.stack[previousStep.stack.length - 2])), 20),
                    input: getFromMemory(previousStep.memory, previousStep.stack, previousStep.opcode),
                    output: step.return_data,
                    type: previousStep.opcode,
                    error: errorsMap[previousStep.error],
                    value: previousStep.stack[previousStep.stack.length - 3],
                    calls: [],
                };
                if (['STATICCALL'].includes(previousStep.opcode)) {
                    delete callData[ctx + 1].value;
                }
                // Compute gas sent to call
                if (Number(previousStep.contract.value) > 0 && previousStep.opcode !== 'DELEGATECALL') {
                    const stipend = 2300 + Number(previousStep.stack[previousStep.stack.length - 1]);
                    callData[ctx + 1].gas = `0x${stipend.toString(16)}`;
                    callData[ctx + 1].gasUsed = callData[ctx + 1].gas;
                }

                let { calls } = newFT;
                // Fill call in the right depth
                if (previousStep.depth > 1) {
                    for (let j = 1; j < previousStep.depth; j++) {
                        calls = calls[calls.length - 1].calls;
                    }
                }
                calls.push(callData[ctx + 1]);
            } else if (opCreate.includes(step.opcode) && currentStep === fullTracer.full_trace.steps.length - 1) {
                callData[ctx + 1] = {
                    from: previousStep.contract.address,
                    gas: `0x${Number(step.gas).toString(16)}`,
                    gasUsed: '0x0',
                    to: 'not_available',
                    input: getFromMemory(previousStep.memory, previousStep.stack, previousStep.opcode),
                    output: step.return_data,
                    type: step.opcode,
                    value: step.stack[step.stack.length - 1],
                    calls: [],
                };

                // Compute gas sent to call
                let gasSent = Number(step.gas) - 32000;
                gasSent -= Math.floor(gasSent / 64);
                callData[ctx + 1].gas = `0x${gasSent.toString(16)}`;

                let { calls } = newFT;
                // Fill call in the right depth
                if (previousStep.depth > 1) {
                    for (let j = 1; j < previousStep.depth; j++) {
                        calls = calls[calls.length - 1].calls;
                    }
                }
                calls.push(callData[ctx + 1]);
            }
        }
        currentStep++;
    }
    // Set revert reason
    if (newFT.error === 'execution reverted') {
        const step = fullTracer.full_trace.steps[currentStep - 1];
        const reason = getFromMemory(step.memory, step.stack, step.opcode);
        try {
            const decodedReason = ethers.utils.defaultAbiCoder.decode(['string'], `0x${reason.slice(10)}`)[0];
            newFT.revertReason = decodedReason;
        } catch (e) {
            console.log("Can't decode revert reason");
        }
    }
    fs.writeFileSync(path.join(__dirname, `ft-traces/${i}.json`), JSON.stringify(newFT, null, 2));

    return compareTraces(geth, newFT);
}

function computeCallGasCost(mem, stack, opcode) {
    let argsOffset;
    let argsSize;
    let retOffset;
    let retSize;
    const memSize = mem.join('').length / 2;
    switch (opcode) {
    case 'STATICCALL':
    case 'DELEGATECALL':
        argsOffset = Number(stack[stack.length - 3]);
        argsSize = Number(stack[stack.length - 4]);
        retOffset = Number(stack[stack.length - 5]);
        retSize = Number(stack[stack.length - 6]);
        break;
    default:
        argsOffset = Number(stack[stack.length - 4]);
        argsSize = Number(stack[stack.length - 5]);
        retOffset = Number(stack[stack.length - 6]);
        retSize = Number(stack[stack.length - 7]);
        break;
    }
    // Compute call memory expansion cost
    const lastMemSizeWord = Math.ceil((memSize + 31) / 32);
    const lastMemCost = Math.floor((lastMemSizeWord ** 2) / 512) + (3 * lastMemSizeWord);

    const memSizeWord = Math.ceil((argsOffset + argsSize + 31) / 32);
    const newMemCost = Math.floor((memSizeWord ** 2) / 512) + (3 * memSizeWord);
    const callMemCost = newMemCost - lastMemCost;

    // Compute return memory expansion cost
    const retMemSizeWord = Math.ceil((retOffset + retSize + 31) / 32);
    const retNewMemCost = Math.floor((retMemSizeWord ** 2) / 512) + (3 * retMemSizeWord);
    const retMemCost = retNewMemCost - newMemCost;

    return retMemCost + callMemCost < 0 ? 0 : retMemCost + callMemCost;
}

function getFromMemory(mem, stack, opcode) {
    let offset;
    let size;
    if (opcode === 'STATICCALL') {
        offset = Number(stack[stack.length - 3]);
        size = Number(stack[stack.length - 4]);
    } else if (opcode === 'REVERT') {
        offset = Number(stack[stack.length - 1]);
        size = Number(stack[stack.length - 2]);
    } else if (opcode === 'CREATE2' || opcode === 'CREATE') {
        offset = Number(stack[stack.length - 2]);
        size = Number(stack[stack.length - 3]);
    } else {
        offset = Number(stack[stack.length - 4]);
        size = Number(stack[stack.length - 5]);
    }
    let value = '0x';
    mem = mem.join('');
    value += mem.slice(offset * 2, (offset + size) * 2);
    value = value.padEnd(size * 2 + 2, '0');

    return value;
}
/**
 * Compare a geth trace with a full tracer trace
 * @param {Object} geth trace
 * @param {Object} fullTracer trace
 * @returns Array with the differences found
 */
async function compareDefaultTracer(geth, fullTracer, i) {
    // Generate geth trace from fullTracer trace
    const newFT = {
        gas: Number(fullTracer.gas_used),
        failed: !_.isEmpty(fullTracer.error),
        returnValue: fullTracer.return_value,
        structLogs: [],
    };
    // Format return value to match geth. If return is all zeros, set to '00'
    // if (newFT.returnValue.match(/^0+$/)) {
    //     newFT.returnValue = '00';
    // }
    let currentStep = 0;
    // Fill steps array
    for (const step of fullTracer.full_trace.steps) {
        const newStep = {
            pc: step.pc,
            op: step.opcode,
            gas: Number(step.gas),
            gasCost: Number(step.gas_cost),
            memory: step.memory,
            stack: step.stack,
            depth: step.depth,
            returnData: step.return_data,
        };
        if (Number(step.memory_size) > 0) {
            newStep.memSize = Number(step.memory_size);
        }
        if (Number(step.gas_refund) > 0) {
            newStep.refund = Number(step.gas_refund);
        }
        if (step.storage) {
            newStep.storage = step.storage;
        }
        if (!_.isEmpty(step.error)) {
            newStep.error = errorsMap[step.error];
        }
        if (newStep.op === 'SHA3') {
            newStep.op = 'KECCAK256';
        }
        newFT.structLogs.push(newStep);
        if (currentStep > 0) {
            const prevStep = newFT.structLogs[currentStep - 1];
            if (newStep.op === 'STOP' && opCall.includes(prevStep.op)) {
                newFT.structLogs.pop();
            }
        }

        currentStep++;
    }
    fs.writeFileSync(path.join(__dirname, `ft-traces/${i}.json`), JSON.stringify(newFT, null, 2));

    return compareTraces(geth, newFT);
}

function compareTraces(geth, fullTracer) {
    function changes(newObj, origObj) {
        let arrayIndexCounter = 0;

        return _.transform(newObj, (result, value, key) => {
            if (!_.isEqual(value, origObj[key])) {
                const resultKey = _.isArray(origObj) ? arrayIndexCounter++ : key;
                const res = (_.isObject(value) && _.isObject(origObj[key])) ? changes(value, origObj[key]) : value;
                let isKnownDifference = false;
                // Don't compare gasCost discrepancies when is an errored opcode as it is a known difference
                if ((resultKey === 'gasCost' && origObj.error !== '') || origObj[key] === 'not_available') {
                    isKnownDifference = true;
                    console.log(`Known difference found: ${resultKey} = ${res}/${origObj[key]}`);
                }
                if (!(_.isObject(res) && Object.keys(res).length === 0) && !isKnownDifference) {
                    result[resultKey] = res;
                }
            }
        });
    }

    return changes(geth, fullTracer);
}

/**
 * Get tx hashes from executing the transaction at proverjs an retrieving trace from ft folder
 * @param {Object} test test input to get traces from
 * @param {Number} txsCount Number of transactions executed
 * @param {Object} rom Build rom
 * @param {Boolean} isEthereumTest Flag to know if is an ethereum test
 * @returns Array of tx hashes
 */

async function getFtTrace(test, txsCount, rom, isEthereumTest) {
    const input = JSON.parse(fs.readFileSync(test
        .inputTestPath, 'utf8'));
    const poseidon = await buildPoseidon();
    const { F } = poseidon;

    const fileCachePil = path.join(__dirname, '../../cache-main-pil.json');
    let pil;
    if (fs.existsSync(fileCachePil)) {
        pil = JSON.parse(await fs.promises.readFile(fileCachePil, 'utf8'));
    } else {
        const pilConfig = {
            defines: { N: 4096 },
            namespaces: ['Main', 'Global'],
            disableUnusedError: true,
        };
        const pilPath = path.join(__dirname, '../../pil/main.pil');
        pil = await compile(F, pilPath, null, pilConfig);
        fs.writeFileSync(fileCachePil, `${JSON.stringify(pil, null, 1)}\n`, 'utf8');
    }
    const cmPols = newCommitPolsArray(pil);
    const execConfig = {
        debug: true,
        debugInfo: {
            inputName: path.basename(test.testName),
        },
        stepsN: 8388608,
        tracer: true,
        counters: true,
        stats: true,
        assertOutputs: true,
        tracerOptions: {
            enableMemory: true,
            disableStack: false,
            disableStorage: false,
            enableReturnData: true,
        },
    };
    await smMain.execute(cmPols.Main, input, rom, execConfig);

    const ftTraces = [];
    for (let i = 0; i < txsCount; i++) {
        const blockNum = isEthereumTest ? [1, i] : getBlockNumFromTxCount(test, i);
        const dir = path.join(__dirname, `../../src/sm/sm_main/logs-full-trace/${test.testName}__full_trace_TX_${blockNum[0]}_${blockNum[1]}.json`);
        if (fs.existsSync(dir)) {
            const ftTrace = JSON.parse(fs.readFileSync(dir, 'utf8'));
            ftTraces.push(ftTrace);
        } else {
            console.log(`Full trace not found: ${dir}`);
        }
    }

    return ftTraces;
}

/**
 * Returns block and tx index from tx count
 * @param {Object} input Test vector input
 * @param {Number} txCount tx count
 * @returns Array with block(0) and tx index(1)
 */
function getBlockNumFromTxCount(input, txCount) {
    let counter = -1;
    let block = 0;
    let txInBlock = -1;
    for (const tx of input.txs) {
        if (tx.type === Constants.TX_CHANGE_L2_BLOCK) {
            block++;
            txInBlock = -1;
            continue;
        } else {
            counter++;
            txInBlock++;
        }
        if (counter === txCount) {
            break;
        }
    }

    return [block, txInBlock];
}
/**
 * Retrieves all the geth traces of the given tx hashes
 * @param {Array} txHashes to debug
 * @param {String} testName Name of the test
 * @returns Array with all the debug geth traces
 */
async function getGethTrace(txHashes, testName, traceMethod, testId) {
    const gethTraces = [];
    let traceConfig = {
        enableMemory: true,
        disableStack: false,
        disableStorage: false,
        enableReturnData: true,
    };
    switch (traceMethod) {
    case 'callTracer':
        traceConfig = { tracer: 'callTracer' };
        break;
    default:
        break;
    }
    for (const [testKey, txHash] of Object.entries(txHashes)) {
        const response = await provider.send('debug_traceTransaction', [
            txHash,
            traceConfig,
        ]);
        gethTraces.push(response);
        const testNameIdentifier = createHash('sha256').update(`${testName}_${testId}_${traceMethod}`).digest('hex');
        fs.writeFileSync(path.join(__dirname, `geth-traces/${testName}_${testId}_${traceMethod}_${testKey}_${testNameIdentifier.slice(0, 8)}.json`), JSON.stringify(response, null, 2));
    }

    return gethTraces;
}

/**
 * Execute transaction of the test to geth instance
 * @param {Object} test
 * @returns All the tx hashes of the executed transactions
 */
async function runTxs(test) {
    const txsHashes = [];
    for (let i = 0; i < test.txs.length; i++) {
        const txTest = test.txs[i];
        // Skip changeL2Block txs
        if (txTest.type === Constants.TX_CHANGE_L2_BLOCK) {
            continue;
        }
        const isSigned = !!(txTest.r && txTest.v && txTest.s);
        let sentTx;
        if (isSigned) {
            const stx = {
                to: txTest.to,
                nonce: Number(txTest.nonce),
                value: ethers.utils.parseEther(txTest.value),
                gasLimit: ethers.BigNumber.from(txTest.gasLimit).toHexString(),
                gasPrice: ethers.BigNumber.from(txTest.gasPrice).toHexString(),
                data: formatNotOddData(txTest.data),
            };
            const signature = {
                v: Number(txTest.v),
                r: txTest.r,
                s: txTest.s,
            };
            const serializedTransaction = ethers.utils.serializeTransaction(stx, signature);
            try {
                sentTx = await (await provider.sendTransaction(serializedTransaction)).wait();
            } catch (e) {
                sentTx = e;
            }
        } else {
            const pvtKey = getPvtKeyFromTest(test, txTest.from);
            const wallet = (new ethers.Wallet(pvtKey)).connect(provider);
            const tx = {
                to: txTest.to,
                nonce: Number(txTest.nonce),
                value: ethers.utils.parseUnits(String(txTest.value), 'wei'),
                data: formatNotOddData(txTest.data),
                gasLimit: Number(txTest.gasLimit),
                gasPrice: Number(txTest.gasPrice),
                chainId: Number(txTest.chainId),
            };
            if (typeof txTest.chainId === 'undefined') {
                tx.chainId = CHAIN_ID;
            }
            // Check deploy
            if (tx.to === '0x') {
                delete tx.to;
            }
            try {
                sentTx = await (await wallet.sendTransaction(tx)).wait();
            } catch (e) {
                sentTx = e;
            }
        }
        console.log(`New tx hash: ${sentTx.transactionHash}`);
        txsHashes.push(sentTx.transactionHash);
    }

    return txsHashes;
}

/**
 * Execute transaction of the ethereum test suite to geth instance
 * @param {Object} test
 * @returns All the tx hashes of the executed transactions
 */
async function runTxsFromEthTest(test) {
    // In case test index not specified, only tx 0 is tested
    const txsHashes = [];
    const txTest = test.blocks[0].transactions[0];
    const jsonFile = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors/tools-inputs/tools-eth/tests/GeneralStateTests/${test.folderName}/${test.testName}.json`)))[test.testName];
    const pvtKey = jsonFile.transaction.secretKey;
    const wallet = (new ethers.Wallet(pvtKey)).connect(provider);
    // Limit gas limit to rom max gas limit per tx
    const gasLimit = Math.min(Number(txTest.gasLimit), Constants.TX_GAS_LIMIT);
    const tx = {
        to: txTest.to,
        nonce: Number(txTest.nonce),
        value: ethers.utils.parseUnits(String(Number(txTest.value)), 'wei'),
        data: txTest.data,
        gasLimit,
        gasPrice: Number(txTest.gasPrice),
        chainId: CHAIN_ID,
    };
    // Check deploy
    if (tx.to === '0x' || tx.to === '') {
        delete tx.to;
    }
    let sentTx;
    try {
        sentTx = await (await wallet.sendTransaction(tx)).wait();
    } catch (e) {
        console.log(e.message);
        sentTx = e;
    }
    console.log(`New tx hash: ${sentTx.transactionHash}`);
    txsHashes.push(sentTx.transactionHash);

    return txsHashes;
}
/**
 * Tool to get the private key of a given address from the genesis's test
 * @param {Object} test
 * @param {String} address in hex string
 * @returns The privet key of the address contained in the genesis
 */
function getPvtKeyFromTest(test, address) {
    const account = test.genesis.find((o) => o.address === address);

    return account.pvtKey;
}

/**
 * Configure genesis to match with the provided test
 * @param {Object} test containing the genesis of the geth instance to configure
 */
async function configureGenesis(test, isEthereumTest) {
    let isGethSupported = true;
    const genesis = {
        config: {
            chainId: CHAIN_ID,
            homesteadBlock: 0,
            eip150Block: 0,
            eip155Block: 0,
            eip158Block: 0,
            byzantiumBlock: 0,
            constantinopleBlock: 0,
            petersburgBlock: 0,
            istanbulBlock: 0,
            berlinBlock: 0,
            clique: {
                period: 5,
                epoch: 30000,
            },
        },
        difficulty: '1',
        gasLimit: '300000000',
        extradata: '0x000000000000000000000000000000000000000000000000000000000000000067d13ABa5613169Ea7C692712d14A69e068558F80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        alloc: {
            '67d13ABa5613169Ea7C692712d14A69e068558F8': { balance: '100000000000000000000' },
        },
    };

    if (isEthereumTest) {
        for (const account of Object.keys(test.pre)) {
            const nonce = Number(test.pre[account].nonce);
            if (nonce > 2 ** 32) {
                isGethSupported = false;
                break;
            }
            genesis.alloc[account.slice(2)] = {
                nonce: String(nonce),
                balance: String(BigInt(test.pre[account].balance)),
                code: test.pre[account].code,
                storage: test.pre[account].storage,
            };
        }
    } else {
        for (const account of test.genesis) {
            const nonce = Number(account.nonce);
            if (nonce > 2 ** 32) {
                isGethSupported = false;
                break;
            }
            genesis.alloc[account.address.slice(2)] = {
                nonce: String(nonce),
                balance: String(account.balance),
                code: account.bytecode,
                storage: account.storage,
            };
        }
    }
    fs.writeFileSync(path.join(__dirname, 'genesis.json'), JSON.stringify(genesis, null, 2));

    return isGethSupported;
}

/**
 * Init geth docker
 */
async function startGeth() {
    // Stop runing dockers
    await down({ cwd: path.join(__dirname), log: false });
    // Build new docker
    await buildAll({ cwd: path.join(__dirname), log: false });
    // start docker compose
    await upAll({ cwd: path.join(__dirname), log: false });
    await sleep(6000);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function formatNotOddData(data) {
    if (data && data.length % 2 !== 0) {
        return `0x0${data.slice(2)}`;
    }

    return data;
}

main();
