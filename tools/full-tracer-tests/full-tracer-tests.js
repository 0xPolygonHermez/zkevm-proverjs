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
const smMain = require('../../src/sm/sm_main/sm_main');

const CHAIN_ID = 1000;
const providerURL = 'http://127.0.0.1:8545';
const provider = new ethers.providers.JsonRpcProvider(providerURL);
const config = require('./config.json');

const ethereumTestsPath = '../../../zkevm-testvectors/tools/ethereum-tests/tests/BlockchainTests/GeneralStateTests/';
const stTestsPath = '../../../zkevm-testvectors/state-transition';
const stopOnFailure = true;
const invalidTests = ['custom-tx.json'];
const invalidOpcodes = ['BASEFEE', 'SELFDESTRUCT', 'TIMESTAMP', 'COINBASE', 'BLOCKHASH', 'NUMBER', 'DIFFICULTY', 'GASLIMIT'];
const noExec = require('../../../zkevm-testvectors/tools/ethereum-tests/no-exec.json');

async function main() {
    try {
        console.log('Starting traces comparator');
        const failedTests = [];
        const noExecTests = noExec['breaks-computation'].concat(noExec['not-supported']);
        for (const configTest of config) {
            const {
                testName, testToDebug, traceMethod, isEthereumTest, folderName, disable,
            } = configTest;

            if (disable) {
                continue;
            }

            const testPath = isEthereumTest ? path.join(__dirname, `${ethereumTestsPath}/${testName}.json`) : path.join(__dirname, `${stTestsPath}/calldata/${testName}.json`);

            const tests = createTestsArray(isEthereumTest, testName, testPath, testToDebug, folderName);
            for (let j = 0; j < tests.length; j++) {
                const test = tests[j];
                // Skip tests from no exec file
                if (noExecTests.filter((t) => t.name === `${test.folderName}/${test.testName}_${test.testToDebug}`
                || t.name === `${test.folderName}/${test.testName}`).length > 0) {
                    continue;
                }
                // Configure genesis for test
                await configureGenesis(test, isEthereumTest);

                // Init geth node

                await startGeth();

                // Run txs
                const txsHashes = isEthereumTest ? await runTxsFromEthTest(test) : await runTxs(test);

                // Get geth traces from debug call
                const gethTraces = await getGethTrace(txsHashes, test.testName);

                // Get trace from full tracer
                const ftTraces = await getFtTrace(test.inputTestPath, test.testName, gethTraces.length);

                // Compare traces
                for (let i = 0; i < ftTraces.length; i++) {
                    const changes = await compareTracesByMethod(gethTraces[i], ftTraces[i], traceMethod, i);
                    if (!_.isEmpty(changes) && !includesInvalidOpcode(gethTraces[i].structLogs)) {
                        const message = `Diff found at test ${test.testName}-${test.id}-${i}: ${JSON.stringify(changes)}`;
                        console.log(chalk.red(message));
                        failedTests.push(message);
                        if (stopOnFailure) {
                            process.exit(1);
                        }
                    } else {
                        console.log(chalk.green(`No differences for test ${test.testName}-${test.id}-${i}`));
                    }
                }
                // Stop docker compose
                await stopGeth();
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

function includesInvalidOpcode(changes) {
    const str = JSON.stringify(changes);
    for (const op of invalidOpcodes) {
        if (str.includes(op)) {
            return true;
        }
    }

    return false;
}
function createTestsArray(isEthereumTest, testName, testPath, testToDebug, folderName) {
    if (!folderName) {
        let test = isEthereumTest ? [JSON.parse(fs.readFileSync(testPath))][0] : [JSON.parse(fs.readFileSync(testPath))[testToDebug]];
        if (isEthereumTest) {
            const keysTests = Object.keys(test).filter((op) => op.includes('_Berlin'));
            test = [test[keysTests[testToDebug]]];
        }
        const inputTestPath = isEthereumTest ? path.join(__dirname, `../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests/${testName}_${testToDebug}.json`) : path.join(__dirname, `../../../zkevm-testvectors/inputs-executor/calldata/${testName}_${testToDebug}.json`);
        const tn = isEthereumTest ? testName.split('/')[1] : testName;
        const fn = isEthereumTest ? testName.split('/')[0] : testName;
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
                const inputTestPath = path.join(__dirname, `../../../zkevm-testvectors/tools/ethereum-tests/GeneralStateTests/${folderName}/${file.split('.')[0]}_${j}.json`);
                Object.assign(value, {
                    testName: file.split('.')[0], folderName, inputTestPath, testToDebug: j, id: j,
                });
                tests.push(value);
                j++;
            }
        } else {
            const t = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors/state-transition/${folderName}/${file}`)));
            t.map((v) => {
                const inputTestPath = path.join(__dirname, `../../../zkevm-testvectors/inputs-executor/${folderName}/${file.split('.')[0]}_${v.id}.json`);
                Object.assign(v, { testName: file.split('.')[0], folderName, inputTestPath });

                return v;
            });

            tests = tests.concat(t);
        }
    }

    return tests;
}
async function compareTracesByMethod(geth, fullTracer, method, key) {
    switch (method) {
    case 'defaultTrace':
        return compareDefaultTrace(geth, fullTracer, key);
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
async function compareDefaultTrace(geth, fullTracer, i) {
    // Generate geth trace from fullTracer trace
    const newFT = {
        gas: Number(fullTracer.gas_used),
        failed: !_.isEmpty(fullTracer.error),
        returnValue: fullTracer.return_value,
        structLogs: [],
    };
    // Format return value to match geth. If return is all zeros, set to '00'
    if (newFT.returnValue.match(/^0+$/)) {
        newFT.returnValue = '00';
    }
    // Fill steps array
    for (const step of fullTracer.execution_trace) {
        const newStep = {
            pc: step.pc,
            op: step.opcode,
            gas: Number(step.gas),
            gasCost: Number(step.gas_cost),
            memory: step.memory,
            // memSize?
            stack: step.stack,
            depth: step.depth,
            // returndata?
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
                if (!(_.isObject(res) && Object.keys(res).length === 0)) {
                    result[resultKey] = res;
                }
            }
        });
    }

    return changes(geth, fullTracer);
}

/**
 * Get full tracer trace executing the transaction at prverjs an retrieving trace from ft folder
 * @param {String} inputPath path of the input
 * @param {String} testName Name of the test
 * @param {Number} txsCount Number of transactions executed
 * @returns Array of full traces outputs
 */
async function getFtTrace(inputPath, testName, txsCount) {
    const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const poseidon = await buildPoseidon();
    const { F } = poseidon;
    const rom = JSON.parse(fs.readFileSync(path.join(__dirname, 'rom.json'), 'utf8'));
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
            inputName: path.basename(testName),
        },
        stepsN: 8388608,
        tracer: true,
        counters: true,
        stats: true,
        assertOutputs: true,
    };
    await smMain.execute(cmPols.Main, input, rom, execConfig);

    const ftTraces = [];
    for (let i = 0; i < txsCount; i++) {
        const ftTrace = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/sm/sm_main/logs-full-trace/${testName}__full_trace_${i}.json`), 'utf8'));
        ftTraces.push(ftTrace);
    }

    return ftTraces;
}

/**
 * Retrieves all the geth traces of the given tx hashes
 * @param {Array} txHashes to debug
 * @param {String} testName Name of the test
 * @returns Array with all the debug geth traces
 */
async function getGethTrace(txHashes, testName) {
    const gethTraces = [];
    for (const [testKey, txHash] of Object.entries(txHashes)) {
        const response = await provider.send('debug_traceTransaction', [
            txHash,
            {
                enableMemory: true,
                disableStack: false,
                disableStorage: false,
                enableReturnData: true,
            },
        ]);
        gethTraces.push(response);
        // Write tracer output to file
        if (!fs.existsSync(path.join(__dirname, 'geth-traces'))) {
            fs.mkdirSync(path.join(__dirname, 'geth-traces'));
        }
        fs.writeFileSync(path.join(__dirname, `geth-traces/${testName.split('.')[0]}_${testKey}.json`), JSON.stringify(response, null, 2));
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
        const isSigned = !!(txTest.r && txTest.v && txTest.s);
        let sentTx;
        if (isSigned) {
            const stx = {
                to: txTest.to,
                nonce: Number(txTest.nonce),
                value: ethers.utils.parseEther(txTest.value),
                gasLimit: ethers.BigNumber.from(txTest.gasLimit).toHexString(),
                gasPrice: ethers.BigNumber.from(txTest.gasPrice).toHexString(),
                data: txTest.data,
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
            const pvtKey = getPvtKeyfromTest(test, txTest.from);
            const wallet = (new ethers.Wallet(pvtKey)).connect(provider);
            const tx = {
                to: txTest.to,
                nonce: Number(txTest.nonce),
                value: ethers.utils.parseUnits(String(txTest.value), 'wei'),
                data: txTest.data,
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
    const jsonFile = JSON.parse(fs.readFileSync(path.join(__dirname, `../../../zkevm-testvectors/tools/ethereum-tests/tests/GeneralStateTests/${test.folderName}/${test.testName}.json`)))[test.testName];
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
function getPvtKeyfromTest(test, address) {
    const account = test.genesis.find((o) => o.address === address);

    return account.pvtKey;
}

/**
 * Configure genesis to match with the provided test
 * @param {Object} test containing the genesis of the geth instance to configure
 */
async function configureGenesis(test, isEthereumTest) {
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
            genesis.alloc[account.slice(2)] = {
                nonce: String(Number(test.pre[account].nonce)),
                balance: String(Number(test.pre[account].balance)),
                code: test.pre[account].code,
                storage: test.pre[account].storage,
            };
        }
    } else {
        for (const account of test.genesis) {
            genesis.alloc[account.address.slice(2)] = {
                nonce: String(account.nonce),
                balance: String(account.balance),
                code: account.bytecode,
                storage: account.storage,
            };
        }
    }
    fs.writeFileSync(path.join(__dirname, 'genesis.json'), JSON.stringify(genesis, null, 2));
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

/**
 * Stop geth dockers
 */
async function stopGeth() {
    await down({ cwd: path.join(__dirname), log: false });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
main();
