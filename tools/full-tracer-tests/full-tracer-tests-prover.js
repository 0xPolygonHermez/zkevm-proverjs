/* eslint-disable max-len */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
/* eslint-disable newline-before-return */
/* eslint-disable multiline-comment-style */
/* eslint-disable no-continue */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs');
const { upAll, down, buildAll } = require('docker-compose');
const ethers = require('ethers');
const { newCommitPolsArray, compile } = require('pilcom');
const buildPoseidon = require('@0xpolygonhermez/zkevm-commonjs').getPoseidon;
const _ = require('lodash');
const chalk = require('chalk');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Scalar } = require('ffjavascript');
const zkasm = require('@0xpolygonhermez/zkasmcom');
const { Constants } = require('@0xpolygonhermez/zkevm-commonjs');
const smMain = require('../../src/sm/sm_main/sm_main');

const CHAIN_ID = 1000;
const providerURL = 'http://127.0.0.1:8545';
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const config = require('./config.json');
const opcodes = require('../../src/sm/sm_main/debug/opcodes');

const opCall = ['CALL', 'STATICCALL', 'DELEGATECALL', 'CALLCODE'];
const opCreate = ['CREATE', 'CREATE2'];
const ethereumTestsPath = '../../../zkevm-testvectors-internal/tools-inputs/tools-eth/tests/BlockchainTests/GeneralStateTests/';
const stTestsPath = '../../../zkevm-testvectors-internal/tools-inputs/data/';
const invalidTests = ['custom-tx.json', 'access-list.json', 'effective-gas-price.json', 'op-basefee.json', 'CREATE2_HighNonceDelegatecall.json', 'op-selfdestruct.json', 'txs-calldata.json', 'over-calldata.json', 'change-l2-block.json', 'ooc.json', 'test-length-data.json', 'pre-modexp.json', 'stack-errors.json'];
const invalidOpcodes = ['BASEFEE', 'SELFDESTRUCT', 'TIMESTAMP', 'COINBASE', 'BLOCKHASH', 'NUMBER', 'DIFFICULTY', 'GASLIMIT', 'EXTCODEHASH', 'SENDALL', 'PUSH0'];
const invalidErrors = ['return data out of bounds', 'gas uint64 overflow', 'contract creation code storage out of gas', 'write protection', 'invalidStaticTx', 'bn256: malformed point'];
const noExec = require('../../../zkevm-testvectors-internal/tools-inputs/tools-eth/no-exec.json');

const regen = false;
const saveExecutorResponse = false;
const errorsMap = {
    ROM_ERROR_OUT_OF_GAS: 'out of gas',
    ROM_ERROR_INVALID_STATIC: 'invalidStaticTx',
    ROM_ERROR_EXECUTION_REVERTED: 'execution reverted',
    ROM_ERROR_INVALID_OPCODE: 'invalid opcode: INVALID',
};

const EXECUTOR_PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/executor/v1/executor.proto');
const DB_PROTO_PATH = path.join(__dirname, '../../../zkevm-comms-protocol/proto/hashdb/v1/hashdb.proto');

const executorPackageDefinition = protoLoader.loadSync(
    EXECUTOR_PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const dbPackageDefinition = protoLoader.loadSync(
    DB_PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);

const zkProverProto = grpc.loadPackageDefinition(executorPackageDefinition).executor.v1;
const hashDbProto = grpc.loadPackageDefinition(dbPackageDefinition).hashdb.v1;

const { ExecutorService } = zkProverProto;
const { HashDBService } = hashDbProto;
// my prover -> 52.30.205.190
// executor Fr -> 51.210.116.237
const client = new ExecutorService('51.210.116.237:50075', grpc.credentials.createInsecure(), { 'grpc.max_receive_message_length': 91837108 });
const dbClient = new HashDBService('51.210.116.237:50065', grpc.credentials.createInsecure());
let tn;
let fn;
let tid;
let gethTraces = [];
let waiting = false;
async function main() {
    try {
        console.log('Starting traces comparator');
        const failedTests = [];
        const noExecTests = noExec['breaks-computation'].concat(noExec['not-supported']);
        // Write tracer output to file
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
                testName, testToDebug, isEthereumTest, folderName, disable, traceMethod,
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
                gethTraces = [];
                files.forEach((file) => {
                    const parts = file.split('_');
                    if (test.testName === parts[0] && String(test.id) === parts[1] && traceMethod === parts[2]) {
                        gethTraces.push(JSON.parse(fs.readFileSync(path.join(__dirname, 'geth-traces', file), 'utf8')));
                    }
                });
                // Get num of non changeL2Block txs
                const ethTxs = test.txs.filter((tx) => typeof tx.type === 'undefined').length;
                if (regen || (!isEthereumTest && gethTraces.length !== ethTxs) || (isEthereumTest && gethTraces.length !== test.blocks.length)) {
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
                const ftTxHashes = await getFtTrace(test, gethTraces.length, rom, isEthereumTest);

                const input = JSON.parse(fs.readFileSync(test.inputTestPath, 'utf8'));
                // Populate db with input bytecode
                waiting = true;
                tn = test.testName;
                fn = test.folderName;
                tid = test.id;
                console.log(`Processing ${fn}/${tn}-${tid}`);
                checkBytecode(input, 0, ftTxHashes, traceMethod, test, isEthereumTest);

                while (waiting) {
                    await sleep(2000);
                }
                console.log(`Finished processing ${fn}/${tn}-${tid}`);
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
    }
}

function includesInvalidError(changes, fullTrace) {
    for (const error of invalidErrors) {
        if (JSON.stringify(changes).includes(error)) {
            return true;
        }
    }
    if (JSON.stringify(fullTrace).includes('ROM_ERROR_INVALID_BYTECODE_STARTS_EF')) {
        return true;
    }
    if (JSON.stringify(fullTrace).includes('ROM_ERROR_INVALID_STATIC')) {
        return true;
    }
    return false;
}

function includesInvalidOpcode(steps) {
    if (!steps) {
        return false;
    }
    for (const step of steps) {
        if (invalidOpcodes.includes(opcodes[step.op][0])) {
            console.log(`Invalid opcode found: ${step.op}`);

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
        const inputTestPath = isEthereumTest ? path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${folderName}/${testName}_${testToDebug}.json`) : path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/calldata/${testName}_${testToDebug}.json`);
        const testN = isEthereumTest ? testName.split('/')[1] : testName;
        const folderN = isEthereumTest ? testName.split('/')[0] : testName;
        Object.assign(test[0], {
            testName: testN, inputTestPath, testToDebug, id: testToDebug, folderName: folderN,
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
                const inputTestPath = path.join(__dirname, `../../node_modules/@0xpolygonhermez/zkevm-testvectors/inputs-executor/ethereum-tests/GeneralStateTests/${folderName}/${file.split('.')[0]}_${j}.json`);
                Object.assign(value, {
                    testName: file.split('.')[0], folderName, inputTestPath, testToDebug: j, id: j,
                });
                tests.push(value);
                j++;
            }
        } else {
            const t = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors-internal/tools-inputs/data/${folderName}/${file}`)));
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
function compareTracesByMethod(geth, fullTracer, method, key) {
    switch (method) {
    case 'defaultTracer':
        return compareDefaultTracer(geth, fullTracer, key);
    case 'callTracer':
        return compareCallTracer(geth, fullTracer, key);
    default:
        return compareDefaultTrace(geth, fullTracer, key);
    }
}

/**
 * Compare a geth trace with a full tracer trace
 * @param {Object} geth trace
 * @param {Object} fullTracer trace
 * @returns Array with the differences found
 */
function compareCallTracer(geth, fullTracer, i) {
    const { context } = fullTracer.full_trace;
    // Generate geth trace from fullTracer trace
    const newFT = {
        from: context.from,
        gas: `0x${Number(context.gas).toString(16)}`,
        gasUsed: `0x${Number(context.gas_used).toString(16)}`,
        to: context.to,
        input: `0x${context.data.toString('hex')}`,
        output: `0x${context.output.toString('hex')}`,
        calls: [],
        value: `0x${Number(context.value).toString(16)}`,
        type: context.type,
    };
    if (fullTracer.error !== 'ROM_ERROR_NO_ERROR') {
        newFT.error = errorsMap[fullTracer.error];
    }
    // if is a deploy, replace 0x to by create address
    if (context.type === 'CREATE') {
        newFT.to = `0x${fullTracer.create_address}`;
    }
    // Fill calls array
    const callData = [];
    let ctx = 0;
    let currentStep = 0;
    let memory = '';
    for (const step of fullTracer.full_trace.steps) {
        // memory to zero
        if (step.memory_size === 0) {
            memory = '';
        } else if (step.memory.toString('hex') !== '' || step.memory_size * 2 !== memory.length) {
            // memory updates
            if (step.memory_size * 2 > memory.length) {
                // memory expands
                memory = memory.padEnd(step.memory_size * 2, '0');
            }
            // memory updates
            memory = `${memory.substring(0, step.memory_offset * 2)}${step.memory.toString('hex')}${memory.substring(step.memory_offset * 2 + step.memory.length * 2)}`;
        }
        step.memory_comp = memory;
        // Previous step analysis
        if (currentStep > 0) {
            const previousStep = fullTracer.full_trace.steps[currentStep - 1];
            // Increase depth
            if (previousStep.depth < step.depth) {
                ctx++;
                callData[ctx] = {
                    from: `0x${step.contract.caller}`,
                    gas: `0x${Number(step.gas).toString(16)}`,
                    gasUsed: '0x0',
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(`0x${step.contract.address}`)), 20),
                    input: `0x${step.contract.data.toString('hex')}`,
                    value: `0x${Number(step.contract.value).toString(16)}`,
                    type: opcodes[previousStep.op][0],
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
                callData[ctx].output = `0x${step.return_data.toString('hex')}`;
                if (previousStep.error !== 'ROM_ERROR_NO_ERROR') {
                    callData[ctx].error = errorsMap[previousStep.error];
                    if (previousStep.error !== 'ROM_ERROR_EXECUTION_REVERTED') {
                        callData[ctx].gasUsed = callData[ctx].gas;
                    } else {
                        callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasAtCall) - Number(step.gas) - Number(callData[ctx].gasCallCost)).toString(16)}`;
                        if (opcodes[previousStep.op][0] === 'STOP' && previousStep.pc === 0) {
                            callData[ctx].gasUsed = '0x0';
                        } else if (opCreate.includes(previousStep.contract.type)) {
                            callData[ctx].gasUsed = `0x${(Number(previousStep.contract.gas - Number(step.gas))).toString(16)}`;
                        }
                    }
                } else {
                    callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasAtCall) - Number(step.gas) - Number(callData[ctx].gasCallCost)).toString(16)}`;
                    if (opcodes[previousStep.op][0] === 'STOP' && previousStep.pc === 0) {
                        callData[ctx].gasUsed = '0x0';
                    } else if (opCreate.includes(callData[ctx].type)) {
                        callData[ctx].gasUsed = `0x${(Number(previousStep.contract.gas - Number(step.gas))).toString(16)}`;
                    }
                }
                ctx--;

                // Detect precompiled call
            } else if (opCall.includes(opcodes[previousStep.op][0]) && previousStep.depth === step.depth && previousStep.error === 'ROM_ERROR_NO_ERROR') {
                const to = BigInt(`0x${previousStep.stack[previousStep.stack.length - 2]}`);
                // Check precompiled destination
                if (to > 0 && to < 10) {
                    callData[ctx + 1] = {
                        from: `0x${step.contract.address}`,
                        gas: `0x${Number(step.gas).toString(16)}`,
                        gasUsed: `0x${(Number(previousStep.gas_cost)).toString(16)}`,
                        to: ethers.utils.hexZeroPad(ethers.utils.hexlify(to), 20),
                        input: getFromMemory(previousStep.memory_comp, previousStep.stack, opcodes[previousStep.op][0]),
                        output: `0x${step.return_data.toString('hex')}`,
                        type: opcodes[previousStep.op][0],
                        error: errorsMap[previousStep.error],
                        value: '0x0',
                        calls: [],
                    };
                    // Compute gas sent to call
                    const callGasCost = computeCallGasCost(previousStep.memory_comp, previousStep.stack, opcodes[previousStep.op][0]) + 100;
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
                    if (previousStep.opcode === 'STATICCALL') {
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
                } else {
                    callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasUsed) + Number(previousStep.gas_cost)).toString(16)}`;
                }
                // Detect failed create2
            } else if (opCreate.includes(opcodes[previousStep.op][0]) && previousStep.depth === step.depth) {
                const to = BigInt(`0x${step.stack[step.stack.length - 1]}`);
                callData[ctx + 1] = {
                    from: `0x${previousStep.contract.address}`,
                    gas: `0x${Number(step.gas).toString(16)}`,
                    gasUsed: '0x0',
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(to), 20),
                    input: getFromMemory(previousStep.memory_comp, previousStep.stack, opcodes[previousStep.op][0]),
                    output: step.return_data,
                    type: opcodes[previousStep.op][0],
                    value: `0x${previousStep.stack[previousStep.stack.length - 1]}`,
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
            } else if (opCall.includes(opcodes[previousStep.op][0]) && previousStep.depth === step.depth) {
                callData[ctx + 1] = {
                    from: `0x${previousStep.contract.address}`,
                    gas: `0x${previousStep.stack[previousStep.stack.length - 1].toString(16)}`,
                    gasUsed: `0x${previousStep.stack[previousStep.stack.length - 1].toString(16)}`,
                    to: ethers.utils.hexZeroPad(ethers.utils.hexlify(BigInt(previousStep.stack[previousStep.stack.length - 2])), 20),
                    input: getFromMemory(previousStep.memory_comp, previousStep.stack, opcodes[previousStep.op][0]),
                    output: `0x${step.return_data.toString('hex')}`,
                    type: opcodes[previousStep.op][0],
                    error: errorsMap[previousStep.error],
                    value: `0x${previousStep.stack[previousStep.stack.length - 3]}`,
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
            }
            if (ctx > 0 && !opCall.includes(opcodes[step.op][0])) {
                callData[ctx].gasUsed = `0x${(Number(callData[ctx].gasUsed) + Number(step.gas_cost)).toString(16)}`;
            }
        }
        currentStep++;
    }
    // Set revert reason
    if (newFT.error === 'execution reverted') {
        const step = fullTracer.full_trace.steps[currentStep - 1];
        const reason = getFromMemory(step.memory_comp, step.stack, opcodes[step.op][0]);
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
    const memSize = mem.length / 2;
    switch (opcode) {
    case 'STATICCALL':
    case 'DELEGATECALL':
        argsOffset = Number(`0x${stack[stack.length - 3]}`);
        argsSize = Number(`0x${stack[stack.length - 4]}`);
        retOffset = Number(`0x${stack[stack.length - 5]}`);
        retSize = Number(`0x${stack[stack.length - 6]}`);
        break;
    default:
        argsOffset = Number(`0x${stack[stack.length - 4]}`);
        argsSize = Number(`0x${stack[stack.length - 5]}`);
        retOffset = Number(`0x${stack[stack.length - 6]}`);
        retSize = Number(`0x${stack[stack.length - 7]}`);
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
        offset = Number(`0x${stack[stack.length - 3]}`);
        size = Number(`0x${stack[stack.length - 4]}`);
    } else if (opcode === 'REVERT') {
        offset = Number(`0x${stack[stack.length - 1]}`);
        size = Number(`0x${stack[stack.length - 2]}`);
    } else if (opcode === 'CREATE2' || opcode === 'CREATE') {
        offset = Number(`0x${stack[stack.length - 2]}`);
        size = Number(`0x${stack[stack.length - 3]}`);
    } else {
        offset = Number(`0x${stack[stack.length - 4]}`);
        size = Number(`0x${stack[stack.length - 5]}`);
    }
    let value = '0x';
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
function compareDefaultTracer(geth, fullTracer, i) {
    const { context } = fullTracer.full_trace;
    // Generate geth trace from fullTracer trace
    const newFT = {
        gas: Number(context.gas_used),
        failed: fullTracer.error !== 'ROM_ERROR_NO_ERROR',
        returnValue: typeof fullTracer.return_value === 'undefined' ? '' : fullTracer.return_value.toString('hex'),
        structLogs: [],
    };
    // Format return value to match geth. If return is all zeros, set to '00'
    // if (newFT.returnValue.match(/^0+$/)) {
    //     newFT.returnValue = '00';
    // }
    let currentStep = 0;
    // Fill steps array
    let memory = '';
    for (const step of fullTracer.full_trace.steps) {
        // memory to zero
        if (step.memory_size === 0) {
            memory = '';
        } else if (step.memory.toString('hex') !== '' || step.memory_size * 2 !== memory.length) {
            if (step.memory_size * 2 < memory.length) {
                memory = '';
            }
            // memory expands
            memory = memory.padEnd(step.memory_size * 2, '0');
            // memory updates
            memory = `${memory.substring(0, step.memory_offset * 2)}${step.memory.toString('hex')}${memory.substring(step.memory_offset * 2 + step.memory.length * 2)}`;
        }
        step.memory_comp = memory;
        const newStep = {
            pc: Number(step.pc),
            op: opcodes[step.op][0],
            gas: Number(step.gas),
            gasCost: Number(step.gas_cost),
            memory: step.memory_comp,
            stack: step.stack,
            depth: step.depth,
            returnData: step.return_data.toString('hex'),
        };

        if (newStep.returnData !== '') {
            newStep.returnData = `0x${newStep.returnData}`;
        }
        if (Number(step.memory_size) > 0) {
            newStep.memSize = Number(step.memory_size);
        }
        // Split memory in hunks of 32 bytes
        if (!_.isEmpty(newStep.memory)) {
            newStep.memory = newStep.memory.match(/.{64}/g);
        } else {
            newStep.memory = [];
        }
        // Remove leading zeros from stack
        newStep.stack = newStep.stack.map((x) => {
            let r = `0x${x.replace(/^0+/, '')}`;
            if (r === '0x') r = '0x0';
            return r;
        });
        if (Number(step.gas_refund) > 0) {
            newStep.refund = Number(step.gas_refund);
        }
        if (step.storage) {
            newStep.storage = {};
            for (const [key, value] of Object.entries(step.storage)) {
                newStep.storage[key.padStart(64, '0')] = value.padStart(64, '0');
            }
        }
        if (step.error !== 'ROM_ERROR_NO_ERROR') {
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
        const ftTrace = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/sm/sm_main/logs-full-trace/${test.testName}__full_trace_${blockNum[0]}_${blockNum[1]}.json`), 'utf8'));
        ftTraces.push(ftTrace.tx_hash);
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
 * Compare a geth trace with a full tracer trace
 * @param {Object} geth trace
 * @param {Object} fullTracer trace
 * @returns Array with the differences found
 */
function compareDefaultTrace(geth, fullTracer, i) {
    // Generate geth trace from fullTracer trace
    const newFT = {
        gas: Number(fullTracer.gas_used),
        failed: !_.isEmpty(fullTracer.error) && fullTracer.error !== 'ROM_ERROR_NO_ERROR',
        returnValue: fullTracer.return_value.toString(),
        structLogs: [],
    };
    // Format return value to match geth. If return is all zeros, set to '00'
    if (newFT.returnValue.match(/^0+$/)) {
        newFT.returnValue = '00';
    }
    // Fill steps array
    for (const step of fullTracer.full_trace.steps) {
        const newStep = {
            pc: step.pc,
            op: step.opcode,
            gas: Number(step.gas),
            gasCost: Number(step.gas_cost),
            memory: step.memory,
            // memSize?
            stack: step.stack,
            depth: step.depth,
            returnData: step.return_data,
        };
        if (Number(step.gas_refund) > 0) {
            newStep.refund = Number(step.gas_refund);
        }
        if (step.storage) {
            newStep.storage = step.storage;
        }
        if (!_.isEmpty(step.error)) {
            newStep.error = step.error;
        }
        if (newStep.op === 'SHA3') {
            newStep.op = 'KECCAK256';
        }

        newFT.structLogs.push(newStep);
    }
    fs.writeFileSync(path.join(__dirname, `geth-traces/${i}.json`), JSON.stringify(newFT, null, 2));

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
                if (resultKey === 'gasCost' && origObj.error !== '') {
                    isKnownDifference = true;
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
 * Checks if the contracts bytecode is stored in the prover db, in case not, inserts it
 * @param {Object} input proverjs json input
 * @param {Number} bcPos position of the bytecode in the contracts bytecode map
 */
function checkBytecode(input, bcPos, txsHashes, traceMethod, test, isEthereumTest) {
    if (bcPos >= Object.keys(input.contractsBytecode).length) {
        processBatch(input, txsHashes, 0, traceMethod, test, isEthereumTest);
        return;
    }
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    // Only process bytecodes not address - bcHash
    if (hash.length < 64) {
        checkBytecode(input, bcPos + 1, txsHashes, traceMethod, test, isEthereumTest);
        return;
    }
    const key = scalar2fea4(Scalar.e(hash));
    dbClient.GetProgram({ key }, (error, res) => {
        if (error) {
            console.log(error);
            setBytecode(input, bcPos, txsHashes, traceMethod, test, isEthereumTest);
            throw error;
        }
        if (res.result.code === 'CODE_DB_KEY_NOT_FOUND') {
            setBytecode(input, bcPos, txsHashes, traceMethod, test, isEthereumTest);
        } else {
            checkBytecode(input, bcPos + 1, txsHashes, traceMethod, test, isEthereumTest);
        }
    });
}

/**
 * Insert bytecode of the contrtact in the proverC database
 * @param {Object} input proverjs json input
 * @param {Number} bcPos position of the bytecode in the contracts bytecode map
 */
function setBytecode(input, bcPos, txsHashes, traceMethod, test, isEthereumTest) {
    const hash = Object.keys(input.contractsBytecode)[bcPos];
    const bytecode = input.contractsBytecode[hash].startsWith('0x') ? input.contractsBytecode[hash].slice(2) : input.contractsBytecode[hash];
    const key = scalar2fea4(Scalar.e(hash));
    dbClient.SetProgram({ key, data: Buffer.from(bytecode, 'hex'), persistent: 1 }, (error, res) => {
        if (error) {
            console.log(error);
            throw error;
        }
        checkBytecode(input, bcPos + 1, txsHashes, traceMethod, test, isEthereumTest);
    });
}

/**
 * Sends input to proverC for execution
 * @param {Object} input proverjs json input
 */
function processBatch(input, txsHashes, currentHash, traceMethod, test, isEthereumTest) {
    if (currentHash >= txsHashes.length) {
        waiting = false;
        return;
    }
    if (input.forkID > 6) {
        processBatchV2(input, txsHashes, currentHash, traceMethod, test, isEthereumTest);
        return;
    }
    const cInput = formatInput(input, txsHashes[currentHash]);
    client.ProcessBatch(cInput, (error, res) => {
        try {
            if (error) throw error;
            if (saveExecutorResponse) {
                executorJsonFromBatch(res, res.responses[currentHash].tx_hash.toString('hex'));
            }
            // Compare trace
            const changes = compareTracesByMethod(gethTraces[currentHash], res.responses[currentHash], traceMethod, currentHash);
            if (!_.isEmpty(changes) && !includesInvalidOpcode(res.responses[currentHash].full_trace.steps)
                && !includesInvalidError(changes, res.responses[currentHash].full_trace)) {
                const message = `Diff found at test ${fn}/${tn}-${tid}-${currentHash}: ${JSON.stringify(changes)}`;
                console.log(chalk.red(message));
                process.exit(1);
            } else {
                console.log(chalk.green(`No differences for test ${fn}/${tn}-${tid}-${currentHash}`));
                // check next txHash
                processBatch(input, txsHashes, currentHash + 1, traceMethod, isEthereumTest);
            }
        } catch (e) {
            console.log(e);
        }
    });
}

/**
 * Sends input to proverC for execution
 * @param {Object} input proverjs json input
 */
function processBatchV2(input, txsHashes, currentHash, traceMethod, test, isEthereumTest) {
    if (currentHash >= txsHashes.length) {
        waiting = false;
        return;
    }
    const cInput = formatInputV2(input, txsHashes[currentHash]);
    client.processBatchV2(cInput, (error, res) => {
        try {
            if (error) throw error;
            if (saveExecutorResponse) {
                executorJsonFromBatch(res, res.block_responses[0].responses[currentHash].tx_hash.toString('hex'));
            }
            // Compare trace
            const blockNum = isEthereumTest ? [1, currentHash] : getBlockNumFromTxCount(test, currentHash);
            const changes = compareTracesByMethod(gethTraces[currentHash], res.block_responses[blockNum[0] - 1].responses[blockNum[1]], traceMethod, currentHash);
            if (!_.isEmpty(changes) && !includesInvalidOpcode(res.block_responses[0].responses[currentHash].full_trace.steps)
                && !includesInvalidError(changes, res.block_responses[0].responses[currentHash].full_trace)) {
                const message = `Diff found at test ${fn}/${tn}-${tid}-${currentHash}: ${JSON.stringify(changes)}`;
                console.log(chalk.red(message));
                process.exit(1);
            } else {
                console.log(chalk.green(`No differences for test ${fn}/${tn}-${tid}-${currentHash}`));
                // check next txHash
                processBatchV2(input, txsHashes, currentHash + 1, traceMethod, test, isEthereumTest);
            }
        } catch (e) {
            console.log(e);
            process.exit(1);
        }
    });
}

function executorJsonFromBatch(batch, currentHash) {
    fs.writeFileSync(path.join(__dirname, `executor-responses/${currentHash}.json`), JSON.stringify(batch, null, 2));
}
/**
 * Formats the proverjs input to be proverc compatible
 * @param {Object} jsInput porverjs input
 * @returns {Object} proverc formated input
 */
function formatInput(jsInput, txHash) {
    return {
        old_state_root: Buffer.from(jsInput.oldStateRoot.slice(2), 'hex'),
        old_acc_input_hash: Buffer.from(jsInput.oldAccInputHash.slice(2), 'hex'),
        old_batch_num: jsInput.oldNumBatch,
        chain_id: jsInput.chainID,
        fork_id: 7,
        batch_l2_data: Buffer.from(jsInput.batchL2Data.slice(2), 'hex'),
        global_exit_root: Buffer.from(jsInput.globalExitRoot.slice(2), 'hex'),
        eth_timestamp: Number(jsInput.timestamp),
        coinbase: jsInput.sequencerAddr,
        // update_merkle_tree: 1,
        db: formatDb(jsInput.db),
        contracts_bytecode: jsInput.contractsBytecode,
        trace_config: {
            disable_storage: 0,
            disable_stack: 0,
            enable_memory: 1,
            enable_return_data: 1,
            tx_hash_to_generate_full_trace: Buffer.from(txHash.slice(2), 'hex'),
        },
    };
}

/**
 * Formats the proverjs input to be proverc compatible
 * @param {Object} jsInput porverjs input
 * @returns {Object} proverc formatted input
 */
function formatInputV2(jsInput, txHash) {
    return {
        old_state_root: Buffer.from(jsInput.oldStateRoot.slice(2), 'hex'),
        old_acc_input_hash: Buffer.from(jsInput.oldAccInputHash.slice(2), 'hex'),
        old_batch_num: jsInput.oldNumBatch,
        chain_id: jsInput.chainID,
        fork_id: 7,
        batch_l2_data: Buffer.from(jsInput.batchL2Data.slice(2), 'hex'),
        l1_info_root: Buffer.from(jsInput.l1InfoRoot.slice(2), 'hex'),
        timestamp_limit: Number(jsInput.timestampLimit),
        coinbase: jsInput.sequencerAddr,
        forced_blockhash_l1: Buffer.from(jsInput.forcedBlockHashL1.slice(2), 'hex'),
        skip_verify_l1_info_root: 1,
        // update_merkle_tree: 1,
        db: formatDb(jsInput.db),
        contracts_bytecode: jsInput.contractsBytecode,
        trace_config: {
            disable_storage: 0,
            disable_stack: 0,
            enable_memory: 1,
            enable_return_data: 1,
            tx_hash_to_generate_full_trace: Buffer.from(txHash.slice(2), 'hex'),
        },
    };
}
/**
 * Formats the proverjs db input to be proverc compatible
 * @param {Object} jsDb proverjs db input
 * @returns {Object} proverc db input
 */
function formatDb(jsDb) {
    const cDb = {};
    for (const key of Object.keys(jsDb)) {
        const concat = jsDb[key].join('');
        cDb[key.slice(2)] = concat.padEnd(192, '0');
    }

    return cDb;
}
/**
 * Retrieves all the geth traces of the given tx hashes
 * @param {Array} txHashes to debug
 * @param {String} testName Name of the test
 * @returns Array with all the debug geth traces
 */
async function getGethTrace(txHashes, testName, traceMethod, testId) {
    const tmpGethTraces = [];
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
        tmpGethTraces.push(response);

        fs.writeFileSync(path.join(__dirname, `geth-traces/${testName}_${testId}_${traceMethod}_${testKey}_geth.json`), JSON.stringify(response, null, 2));
    }

    return tmpGethTraces;
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
            if (tx.to === '0x' || tx.to === '') {
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

function formatNotOddData(data) {
    if (data && data.length % 2 !== 0) {
        return `0x0${data.slice(2)}`;
    }

    return data;
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
    const jsonFile = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors-internal/tools-inputs/tools-eth/tests/GeneralStateTests/${test.folderName}/${test.testName}.json`)))[test.testName];
    const pvtKey = jsonFile.transaction.secretKey;
    const wallet = (new ethers.Wallet(pvtKey)).connect(provider);
    const tx = {
        to: txTest.to,
        nonce: Number(txTest.nonce),
        value: ethers.utils.parseUnits(String(Number(txTest.value)), 'wei'),
        data: txTest.data,
        gasLimit: Number(txTest.gasLimit),
        gasPrice: Number(txTest.gasPrice),
        chainId: CHAIN_ID,
    };
    // Check deploy
    if (tx.to === '0x') {
        delete tx.to;
    }
    let sentTx;
    try {
        sentTx = await (await wallet.sendTransaction(tx)).wait();
    } catch (e) {
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
        gasLimit: '100000000',
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
    await sleep(2000);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Converts a Scalar to a 4 field element array but with the values as Strings, for proverC protocol compatibility
 * @param {Scalar} s scalar to transform
 * @returns {Fea} scalar transformed to fea
 */
function scalar2fea4(s) {
    const r = [];

    r.push(Scalar.band(s, Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 64), Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 128), Scalar.e('0xFFFFFFFFFFFFFFFF')));
    r.push(Scalar.band(Scalar.shr(s, 192), Scalar.e('0xFFFFFFFFFFFFFFFF')));

    return {
        fe0: String(r[0]),
        fe1: String(r[1]),
        fe2: String(r[2]),
        fe3: String(r[3]),
    };
}
main();
