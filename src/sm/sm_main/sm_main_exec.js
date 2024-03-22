const path = require("path");
const { ethers } = require("ethers");
const { Scalar, F1Field } = require("ffjavascript");
const { createHash } = require('node:crypto');

const {
    scalar2fea,
    fea2scalar,
    fe2n,
    scalar2h4,
    stringToH4,
    nodeIsEq,
    hashContractBytecode,
    fea2String
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const SMT = require("@0xpolygonhermez/zkevm-commonjs").SMT;
const Database = require("@0xpolygonhermez/zkevm-commonjs").Database;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const { byteArray2HexString, hexString2byteArray } = require("@0xpolygonhermez/zkevm-commonjs").utils;
const {
    encodedStringToArray,
    decodeCustomRawTxProverMethod,
    decodeChangeL2BlockTx,
} = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;

const ConstantsCommon = require('@0xpolygonhermez/zkevm-commonjs').Constants;

const FullTracer = require("./debug/full-tracer");
const fullTracerUtils = require("./debug/full-tracer-utils");
const Prints = require("./debug/prints");
const StatsTracer = require("./debug/stats-tracer");
const Constants = require('./const-sm-main-exec');
const Helpers = require("../../helpers.js");

const twoTo255 = Scalar.shl(Scalar.one, 255);
const twoTo256 = Scalar.shl(Scalar.one, 256);

const Mask256 = Scalar.sub(Scalar.shl(Scalar.e(1), 256), 1);
const byteMaskOn256 = Scalar.bor(Scalar.shl(Mask256, 256), Scalar.shr(Mask256, 8n));

const WarningCheck = 1;
const ErrorCheck = 2;

let fullTracer;
let debug;
let statsTracer;
let sourceRef;
let nameRomErrors;

module.exports = async function execute(pols, input, rom, config = {}, metadata = {}) {
    const required = {
        Arith: [],
        Binary: [],
        PaddingKK: [],
        PaddingPG: [],
        PaddingSha256: [],
        PoseidonG: [],
        Mem: [],
        MemAlign: [],
        Storage: []
    };

    const counterControls = {
        outOfCountersStep:      {limitConstant: 'MAX_CNT_STEPS',             counter: 'cntStep'     },
        outOfCountersArith:     {limitConstant: 'MAX_CNT_ARITH',             counter: 'cntArith'    },
        outOfCountersBinary:    {limitConstant: 'MAX_CNT_BINARY',            counter: 'cntBinary'   },
        outOfCountersKeccak:    {limitConstant: 'MAX_CNT_KECCAK_F',          counter: 'cntKeccakF'  },
        outOfCountersSha256:    {limitConstant: 'MAX_CNT_SHA256_F',          counter: 'cntSha256F'  },
        outOfCountersMemalign:  {limitConstant: 'MAX_CNT_MEM_ALIGN',         counter: 'cntMemAlign' },
        outOfCountersPoseidon:  {limitConstant: 'MAX_CNT_POSEIDON_G',        counter: 'cntPoseidonG'},
        outOfCountersPadding:   {limitConstant: 'MAX_CNT_PADDING_PG_LIMIT',  counter: 'cntPaddingPG'},
    }
    initCounterControls(counterControls, rom);
    nameRomErrors = [];

    debug = config && config.debug;
    const flagTracer = config && config.tracer;
    const verboseOptions = typeof config.verboseOptions === 'undefined' ? {} : config.verboseOptions;
    const N = pols.zkPC.length;
    const stepsN = (debug && config.stepsN) ? config.stepsN : N;
    const skipAddrRelControl = (config && config.skipAddrRelControl) || false;
    const blob = config.blob ? true : false;

    // const defaultHelpers = ['arith', 'batch', 'debug', 'helper', 'mem_align', 'operations', 'save_restore', 'binary', 'command', 'counter_controls'];
    const defaultHelpers = [...(blob ? ['main_blob', 'ft-blob']:['main_batch', 'rom_batch']), 'debug', 'helpers', 'mem_align', 'save_restore', 'command', 'counter_controls'];
    const customHelpers = (config && config.helpers) ? (Array.isArray(config.helpers) ? config.helpers : [config.helpers]) : [];
    const helpers = [...defaultHelpers, ...customHelpers ];

    const defaultHelperPaths = [__dirname  + '/helpers'];
    const customHelperPaths = (config && config.helperPaths) ? (Array.isArray(config.helperPaths) ? config.helperPaths : [config.helperPaths]) : [];
    const helperPaths =  [...defaultHelperPaths, ...customHelperPaths ];
    
    const POSEIDONG_PERMUTATION1_ID = 1;
    const POSEIDONG_PERMUTATION2_ID = 2;

    if (config && config.unsigned){
        if (typeof input.from === 'undefined'){
            throw new Error('Unsigned flag requires a `from` in the input');
        }
    }

    const skipAsserts = config.unsigned || config.execute;
    const skipCounters = config.counters;

    const poseidon = await buildPoseidon();
    const Fr = poseidon.F;
    const Fec = new F1Field(0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn);
    const Fnec = new F1Field(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n);

    let pBN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
    const FpBN254 = new F1Field(pBN254);

    const FrFirst32Negative = 0xFFFFFFFF00000001n - 0xFFFFFFFFn;
    const FrLast32Positive = 0xFFFFFFFFn;

    // load database
    const db = new Database(Fr, input.db);
    await db.connect(config.databaseURL, config.dbNodesTable, config.dbProgramTable);

    // load programs into DB
    let batchHashData;
    let blobL2HashData;
    if (!blob) {
        for (const [key, value] of Object.entries(input.contractsBytecode)){
            // filter smt smart contract hashes
            if (key.length === 66) // "0x" + 32 bytes
                await db.setProgram(stringToH4(key), hexString2byteArray(value));
        }   

        // Load batchL2Data into DB
        batchHashData = await hashContractBytecode(input.batchL2Data);
        await db.setProgram(stringToH4(batchHashData), hexString2byteArray(input.batchL2Data));
    }

    if(blob) {
        // Load poseidonBlobData into DB
        const z = await hashContractBytecode(input.blobData);
        await db.setProgram(stringToH4(z), hexString2byteArray(input.blobData));
    
        // Load keccak256BlobData into DB
        blobL2HashData = await ethers.utils.keccak256(input.blobData);
        await db.setProgram(stringToH4(blobL2HashData), hexString2byteArray(input.blobData));
    
    }
    // load smt
    const smt = new SMT(db, poseidon, Fr);

    let op7, op6, op5, op4, op3, op2, op1, op0;
    const Fr8zero = [Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero];
    const ctx = {
        mem: [],
        hashK: [],
        hashP: [],
        hashS: [],
        pols: pols,
        input: input,
        vars:[],
        Fr: Fr,
        Fec: Fec,
        Fnec: Fnec,
        FpBN254,
        sto: input.keys,
        rom: rom,
        outLogs: {},
        N,
        stepsN,
        final: false,
        helpers: new Helpers(helpers, {paths: helperPaths}),
        saved:{},
        batchHashData,
        blobL2HashData,
        config,
    }
    
    if (config.stats) {
        metadata.stats = {
            trace:[],
            lineTimes:[]
        };
    }

    ctx.helpers.setup({
        evalCommand, checkParams,
        safeFea2scalar,
        fullTracer, nameRomErrors,
        sr8to4, sr4to8, ctx
    });

    ctx.helpers.Main.initState(Fr, pols, ctx);

    if (debug && flagTracer) {
        fullTracer = new FullTracer(
            config.debugInfo.inputName,
            smt,
            {
                verbose: typeof verboseOptions.fullTracer === 'undefined' ? {} : verboseOptions.fullTracer,
                skipFirstChangeL2Block: input.skipFirstChangeL2Block,
                tracerOptions: config.tracerOptions,
            },
            // ctx.helpers.CounterControls.getData(),
            counterControls,
        );
    }

    if (config.stats) {
        statsTracer = new StatsTracer(config.debugInfo.inputName);
    }

    const iPrint = new Prints(ctx, smt, verboseOptions.externalLogs);
    let fastDebugExit = false;

    let pendingCmds = false;
    let previousRCX = 0n;
    let previousRCXInv = 0n;
    let auxNewStateRoot;

    if (verboseOptions.batchL2Data) {
        await printBatchL2Data(ctx.input.batchL2Data, verboseOptions.getNameSelector);
    }

    const checkJmpZero = config.checkJmpZero ? (config.checkJmpZero === "warning" ? WarningCheck:ErrorCheck) : false;
    const checkHashNoDigest = config.checkHashNoDigest ? (config.checkHashNoDigest === "warning" ? WarningCheck:ErrorCheck) : false;

    // if (verboseOptions.batchL2Data) {
    //     await ctx.helpers.Debug.printBatchL2Data(ctx.input.batchL2Data, verboseOptions.getNameSelector);
    // }
    const sha256Enabled = typeof pols.cntSha256F !== 'undefined';
    try {

    for (let step = 0; step < stepsN; step++) {
        const i = step % N;
        ctx.ln = Fr.toObject(pols.zkPC[i]);
        ctx.step = step;
        ctx.A = [pols.A0[i], pols.A1[i], pols.A2[i], pols.A3[i], pols.A4[i], pols.A5[i], pols.A6[i], pols.A7[i]];
        ctx.B = [pols.B0[i], pols.B1[i], pols.B2[i], pols.B3[i], pols.B4[i], pols.B5[i], pols.B6[i], pols.B7[i]];
        ctx.C = [pols.C0[i], pols.C1[i], pols.C2[i], pols.C3[i], pols.C4[i], pols.C5[i], pols.C6[i], pols.C7[i]];
        ctx.D = [pols.D0[i], pols.D1[i], pols.D2[i], pols.D3[i], pols.D4[i], pols.D5[i], pols.D6[i], pols.D7[i]];
        ctx.E = [pols.E0[i], pols.E1[i], pols.E2[i], pols.E3[i], pols.E4[i], pols.E5[i], pols.E6[i], pols.E7[i]];
        ctx.SR = [ pols.SR0[i], pols.SR1[i], pols.SR2[i], pols.SR3[i], pols.SR4[i], pols.SR5[i], pols.SR6[i], pols.SR7[i]];
        ctx.CTX = pols.CTX[i];
        ctx.SP = pols.SP[i];
        ctx.PC = pols.PC[i];
        ctx.RR = pols.RR[i];
        ctx.HASHPOS = pols.HASHPOS[i];
        ctx.RID = pols.RID[i];
        ctx.GAS = pols.GAS[i];
        ctx.zkPC = pols.zkPC[i];
        ctx.cntArith = pols.cntArith[i];
        ctx.cntBinary = pols.cntBinary[i];
        ctx.cntKeccakF = pols.cntKeccakF[i];
        if (sha256Enabled) {
            ctx.cntSha256F = pols.cntSha256F[i];
        }
        ctx.cntMemAlign = pols.cntMemAlign[i];
        ctx.cntPoseidonG = pols.cntPoseidonG[i];
        ctx.cntPaddingPG = pols.cntPaddingPG[i];
        if (!ctx.final) ctx.cntStep = step;
        ctx.RCX = pols.RCX[i];

        // evaluate commands "after" before start new line, but when new values of registers are ready.
        if (pendingCmds) {
            evalCommands(ctx, pendingCmds);
            if (fullTracer){
                await eventsAsyncTracer(ctx, pendingCmds);
            }
            pendingCmds = false;
        }

        const l = rom.program[ ctx.zkPC ];
        if (config.stats) {
            statsTracer.addZkPC(ctx.zkPC);
            metadata.stats.trace.push(ctx.zkPC);
            metadata.stats.lineTimes[ctx.zkPC] = (metadata.stats.lineTimes[ctx.zkPC] || 0) + 1;
        }

        ctx.fileName = l.fileName;
        ctx.line = l.line;
        sourceRef = `[w:${step} zkPC:${ctx.ln} ${ctx.fileName}:${ctx.line}]`;
        ctx.sourceRef = sourceRef;


        if (verboseOptions.zkPC) {
            console.log(sourceRef);
        }

        // Store SR before set it to 0 at finalizeExecution
        if(Number(ctx.zkPC) === rom.labels.finalizeExecution) {
            ctx.final = true;
            auxNewStateRoot = fea2String(Fr, ctx.SR);
        }
        // breaks the loop in debug mode in order to test and debug faster
        // assert outputs
        if (debug && Number(ctx.zkPC) === rom.labels.finalizeExecution) {
            fastDebugExit = true;
            if (typeof verboseOptions.step === 'number') {
                console.log("Total steps used: ", ctx.step);
            }
            break;
        }

        let incHashPos = 0;
        let incCounter = 0;

        if (typeof verboseOptions.step === 'number') {
            if (step % verboseOptions.step == 0){
                console.log(`Step: ${step}`);
            }
        }

        if (l.cmdBefore) {
            for (let j=0; j< l.cmdBefore.length; j++) {
                evalCommand(ctx, l.cmdBefore[j]);
            }
        }

        // print external logs
        if (verboseOptions.enableExternalLogs && verboseOptions.externalLogs) {
            iPrint.processExternalLogs();
        }

//////////
// LOAD INPUTS
//////////

        [op0, op1, op2, op3, op4, op5, op6, op7] = [Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero];

        if (l.inA) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inA), ctx.A[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inA), ctx.A[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inA), ctx.A[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inA), ctx.A[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inA), ctx.A[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inA), ctx.A[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inA), ctx.A[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inA), ctx.A[7]))
                ];
            pols.inA[i] = Fr.e(l.inA);
        } else {
            pols.inA[i] = Fr.zero;
        }

        if (l.inB) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inB), ctx.B[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inB), ctx.B[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inB), ctx.B[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inB), ctx.B[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inB), ctx.B[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inB), ctx.B[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inB), ctx.B[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inB), ctx.B[7]))
                ];
            pols.inB[i] = Fr.e(l.inB);
        } else {
            pols.inB[i] = Fr.zero;
        }

        if (l.inC) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inC), ctx.C[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inC), ctx.C[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inC), ctx.C[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inC), ctx.C[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inC), ctx.C[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inC), ctx.C[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inC), ctx.C[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inC), ctx.C[7]))
                ];
            pols.inC[i] = Fr.e(l.inC);
        } else {
            pols.inC[i] = Fr.zero;
        }

        if (l.inD) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inD), ctx.D[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inD), ctx.D[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inD), ctx.D[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inD), ctx.D[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inD), ctx.D[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inD), ctx.D[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inD), ctx.D[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inD), ctx.D[7]))
                ];
            pols.inD[i] = Fr.e(l.inD);
        } else {
            pols.inD[i] = Fr.zero;
        }

        if (l.inE) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inE), ctx.E[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inE), ctx.E[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inE), ctx.E[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inE), ctx.E[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inE), ctx.E[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inE), ctx.E[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inE), ctx.E[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inE), ctx.E[7]))
                ];
            pols.inE[i] = Fr.e(l.inE);
        } else {
            pols.inE[i] = Fr.zero;
        }

        if (l.inSR) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inSR), ctx.SR[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inSR), ctx.SR[1])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inSR), ctx.SR[2])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inSR), ctx.SR[3])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inSR), ctx.SR[4])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inSR), ctx.SR[5])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inSR), ctx.SR[6])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inSR), ctx.SR[7]))
                ];
            pols.inSR[i] = Fr.e(l.inSR);
        } else {
            pols.inSR[i] = Fr.zero;
        }

        if (l.inCTX) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCTX), Fr.e(ctx.CTX)));
            pols.inCTX[i] = Fr.e(l.inCTX);
        } else {
            pols.inCTX[i] = Fr.zero;
        }

        if (l.inSP) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inSP), Fr.e(ctx.SP)));
            pols.inSP[i] = Fr.e(l.inSP);
        } else {
            pols.inSP[i] = Fr.zero;
        }

        if (l.inPC) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inPC), Fr.e(ctx.PC)));
            pols.inPC[i] = Fr.e(l.inPC);
        } else {
            pols.inPC[i] = Fr.zero;
        }

        if (l.inGAS) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inGAS), Fr.e(ctx.GAS)));
            pols.inGAS[i] = Fr.e(l.inGAS);
        } else {
            pols.inGAS[i] = Fr.zero;
        }

        if (l.inSTEP) {
            if (skipCounters) {
                op0 = Fr.zero;
                pols.inSTEP[i] = Fr.e(l.inSTEP);
            } else {
                op0 = Fr.add(op0, Fr.mul( Fr.e(l.inSTEP), Fr.e(step)));
                pols.inSTEP[i] = Fr.e(l.inSTEP);
            }
        } else {
            pols.inSTEP[i] = Fr.zero;
        }

        if (l.inRR) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inRR), Fr.e(ctx.RR)));
            pols.inRR[i] = Fr.e(l.inRR);
        } else {
            pols.inRR[i] = Fr.zero;
        }

        if (l.inHASHPOS) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inHASHPOS), Fr.e(ctx.HASHPOS)));
            pols.inHASHPOS[i] = Fr.e(l.inHASHPOS);
        } else {
            pols.inHASHPOS[i] = Fr.zero;
        }

        // COUNTERS
        if (l.inCntArith) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntArith), Fr.e(ctx.cntArith)));
            pols.inCntArith[i] = Fr.e(l.inCntArith);
        } else {
            pols.inCntArith[i] = Fr.zero;
        }

        if (l.inCntBinary) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntBinary), Fr.e(ctx.cntBinary)));
            pols.inCntBinary[i] = Fr.e(l.inCntBinary);
        } else {
            pols.inCntBinary[i] = Fr.zero;
        }

        if (l.inCntMemAlign) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntMemAlign), Fr.e(ctx.cntMemAlign)));
            pols.inCntMemAlign[i] = Fr.e(l.inCntMemAlign);
        } else {
            pols.inCntMemAlign[i] = Fr.zero;
        }

        if (l.inCntKeccakF) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntKeccakF), Fr.e(ctx.cntKeccakF)));
            pols.inCntKeccakF[i] = Fr.e(l.inCntKeccakF);
        } else {
            pols.inCntKeccakF[i] = Fr.zero;
        }

        if (sha256Enabled) {
            if (l.inCntSha256F) {
                op0 = Fr.add(op0, Fr.mul(Fr.e(l.inCntSha256F), Fr.e(ctx.cntSha256F)));
                pols.inCntSha256F[i] = Fr.e(l.inCntSha256F);
            } else {
                pols.inCntSha256F[i] = Fr.zero;
            }
        }

        if (l.inCntPoseidonG) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntPoseidonG), Fr.e(ctx.cntPoseidonG)));
            pols.inCntPoseidonG[i] = Fr.e(l.inCntPoseidonG);
        } else {
            pols.inCntPoseidonG[i] = Fr.zero;
        }

        if (l.inCntPaddingPG) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inCntPaddingPG), Fr.e(ctx.cntPaddingPG)));
            pols.inCntPaddingPG[i] = Fr.e(l.inCntPaddingPG);
        } else {
            pols.inCntPaddingPG[i] = Fr.zero;
        }

        if (l.inROTL_C) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[7])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[0])),
                 Fr.add(op2 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[1])),
                 Fr.add(op3 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[2])),
                 Fr.add(op4 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[3])),
                 Fr.add(op5 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[4])),
                 Fr.add(op6 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[5])),
                 Fr.add(op7 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[6]))
                ];
            pols.inROTL_C[i] = Fr.e(l.inROTL_C);
        } else {
            pols.inROTL_C[i] = Fr.zero;
        }

        if (l.inRCX) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inRCX), Fr.e(ctx.RCX)));
            pols.inRCX[i] = Fr.e(l.inRCX);
        } else {
            pols.inRCX[i] = Fr.zero;
        }

        if (l.inRID) {
            op0 = Fr.add(op0, Fr.mul( Fr.e(l.inRID), Fr.e(ctx.RID)));
            pols.inRID[i] = Fr.e(l.inRID);
        } else {
            pols.inRID[i] = Fr.zero;
        }


        if ((!isNaN(l.CONSTL))&&(l.CONSTL)) {
            [
                pols.CONST0[i],
                pols.CONST1[i],
                pols.CONST2[i],
                pols.CONST3[i],
                pols.CONST4[i],
                pols.CONST5[i],
                pols.CONST6[i],
                pols.CONST7[i]
            ] = scalar2fea(Fr, l.CONSTL);
            [op0, op1, op2, op3, op4, op5, op6, op7] = [
                Fr.add(op0 , pols.CONST0[i]),
                Fr.add(op1 , pols.CONST1[i]),
                Fr.add(op2 , pols.CONST2[i]),
                Fr.add(op3 , pols.CONST3[i]),
                Fr.add(op4 , pols.CONST4[i]),
                Fr.add(op5 , pols.CONST5[i]),
                Fr.add(op6 , pols.CONST6[i]),
                Fr.add(op7 , pols.CONST7[i])
            ];
        } else if ((!isNaN(l.CONST))&&(l.CONST)) {
            pols.CONST0[i] = Fr.e(l.CONST);
            op0 = Fr.add(op0, pols.CONST0[i] );
            pols.CONST1[i] = Fr.zero;
            pols.CONST2[i] = Fr.zero;
            pols.CONST3[i] = Fr.zero;
            pols.CONST4[i] = Fr.zero;
            pols.CONST5[i] = Fr.zero;
            pols.CONST6[i] = Fr.zero;
            pols.CONST7[i] = Fr.zero;
        } else {
            pols.CONST0[i] = Fr.zero;
            pols.CONST1[i] = Fr.zero;
            pols.CONST2[i] = Fr.zero;
            pols.CONST3[i] = Fr.zero;
            pols.CONST4[i] = Fr.zero;
            pols.CONST5[i] = Fr.zero;
            pols.CONST6[i] = Fr.zero;
            pols.CONST7[i] = Fr.zero;
        }

////////////
// PREPARE AUXILIARY VARS
////////////

        let addrRel = 0;
        let addr = 0;
        if (l.mOp || l.JMP || l.JMPN || l.JMPC || l.JMPZ || l.call) {
            if (l.ind) {
                addrRel = fe2n(Fr, Fr.mul(Fr.e(l.ind), ctx.E[0]), ctx);
            }
            if (l.indRR) {
                addrRel += fe2n(Fr, Fr.mul(Fr.e(l.indRR), ctx.RR), ctx);
            }
            addr = 0;
            if (l.offset) addr += l.offset;
            if (l.isStack == 1) addr += Number(ctx.SP);
            if (!skipAddrRelControl) {
                const memAddr = addr + (l.memUseAddrRel ? addrRel : 0);
                if (memAddr >= 0x20000 || (!l.isMem && memAddr >= 0x10000)) throw new Error(`Address too big ${sourceRef}`);
                if (memAddr <0 ) throw new Error(`Address can not be negative ${sourceRef}`);
            }
        }
        if (l.useCTX==1) {
            addr += Number(ctx.CTX)*0x40000;
            pols.useCTX[i] = 1n;
        } else {
            pols.useCTX[i] = 0n;
        }
        if (l.isStack==1) {
            addr += 0x10000;
            pols.isStack[i] = 1n;
        } else {
            pols.isStack[i] = 0n;
        }
        if (l.isMem==1) {
            addr += 0x20000;
            pols.isMem[i] = 1n;
        } else {
            pols.isMem[i] = 0n;
        }
        if (l.incStack) {
            pols.incStack[i] = BigInt(l.incStack);
        } else {
            pols.incStack[i] = 0n;
        }
        if (l.ind) {
            pols.ind[i] = 1n;
        } else {
            pols.ind[i] = 0n;
        }
        if (l.indRR) {
            pols.indRR[i] = 1n;
        } else {
            pols.indRR[i] = 0n;
        }
        if (l.offset) {
            pols.offset[i] = BigInt(l.offset);
        } else {
            pols.offset[i] = 0n;
        }

        const anyHash = l.hashP || l.hashK || l.hashS || l.hashPDigest || l.hashKDigest || l.hashSDigest || l.hashPLen || l.hashKLen || l.hashSLen; 
        const memAddr = addr + (l.memUseAddrRel ? addrRel : 0);
        const hashAddr = anyHash ? (l.hashOffset ?? 0) + fe2n(Fr, ctx.E[0]) : 0;
        

//////
// CALCULATE AND LOAD FREE INPUT
//////
        let dataToRestore = {};

        if (l.restore) {
            const rid = ctx.RID;
            pols.restore[i] = 1n;
            
            // check if exists saved data with current RID value
            if (!ctx.saved[rid]) {
                throw new Error(`Not found saved data with RID ${rid} on ${sourceRef}`);
            }                
            dataToRestore = ctx.saved[rid];

            // verify that saving wasn't restored previously
            if (dataToRestore.restored) {
                throw new Error(`On ${sourceRef} try to restore RID ${rid} previously restored on row ${dataToRestore.restored.row} at ${dataToRestore.restored.sourceRef}`);
            }

            ctx.saved[rid].restored = { sourceRef, row: i };
        } else {
            pols.restore[i] = 0n;
        }

        if (l.inFREE || l.inFREE0) {

            if (!l.freeInTag) {
                throw new Error(`Instruction with freeIn without freeInTag ${sourceRef}`);
            }

            let fi;
            if (l.freeInTag.op=="") {
                let nHits = 0;

                if (l.restore) {
                    fi = dataToRestore.op;
                    nHits++;
                }

                if (l.mOp == 1 && l.mWR == 0) {
                    const memAddr = addr + (l.memUseAddrRel ? addrRel : 0);
                    // TODO: detect here out of page
                    if (typeof ctx.mem[memAddr] != "undefined") {
                        fi = ctx.mem[memAddr];
                    } else {
                        fi = [Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero, Fr.zero];
                    }
                    nHits++;
                }
                if (l.sRD == 1) {
                    const address = fea2scalar(ctx.Fr, ctx.A);
                    const addressHex = ethers.utils.getAddress(`0x${Scalar.toString(address, 16).padStart(40, '0')}`);
                    const keyType = fea2scalar(ctx.Fr, ctx.B);
                    const keyStorage = "0x"+ fea2scalar(ctx.Fr, ctx.C).toString(16).padStart(64,'0');

                    let res = {};
                    if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].balance && keyType === Scalar.e(ConstantsCommon.SMT_KEY_BALANCE)){
                        res.value = input.stateOverride[addressHex].balance.startsWith("0x") ?
                        Scalar.e(input.stateOverride[addressHex].balance, 16) : Scalar.e(input.stateOverride[addressHex].balance);
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].nonce && keyType === Scalar.e(ConstantsCommon.SMT_KEY_NONCE)){
                        res.value = input.stateOverride[addressHex].nonce.startsWith("0x") ?
                        Scalar.e(input.stateOverride[addressHex].nonce.startsWith("0x"), 16) : Scalar.e(input.stateOverride[addressHex].nonce.startsWith("0x"));
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].code && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_CODE)){
                        res.value = Scalar.e(await hashContractBytecode(input.stateOverride[addressHex].code),16);
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].code && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_LENGTH)){
                        res.value = Scalar.e(input.stateOverride[addressHex].code.replace('0x','').length/2);
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].state && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_STORAGE)){
                        if (input.stateOverride[addressHex].state[keyStorage]){
                            res.value = Scalar.e(input.stateOverride[addressHex].state[keyStorage], 16);
                        } else {
                            res.value = Scalar.e(0);
                        }
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].stateDiff && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_STORAGE)
                    && input.stateOverride[addressHex].stateDiff[keyStorage]){
                        res.value = Scalar.e(input.stateOverride[addressHex].stateDiff[keyStorage], 16);
                    } else {
                        const Kin0 = [
                            ctx.C[0],
                            ctx.C[1],
                            ctx.C[2],
                            ctx.C[3],
                            ctx.C[4],
                            ctx.C[5],
                            ctx.C[6],
                            ctx.C[7],
                        ];

                        const Kin1 = [
                            ctx.A[0],
                            ctx.A[1],
                            ctx.A[2],
                            ctx.A[3],
                            ctx.A[4],
                            ctx.A[5],
                            ctx.B[0],
                            ctx.B[1]
                        ];

                        const keyI = poseidon(Kin0);
                        const key = poseidon(Kin1, keyI);

                        // commented since readings are done directly in the smt
                        // const keyS = Fr.toString(key, 16).padStart(64, "0");
                        // if (typeof ctx.sto[keyS] === "undefined" ) throw new Error(`Storage not initialized: ${ctx.ln}`);

                        // fi = scalar2fea(Fr, Scalar.e("0x" + ctx.sto[ keyS ]));
                        res = await smt.get(sr8to4(ctx.Fr, ctx.SR), key);
                    }

                    incCounter = res.proofHashCounter + 2;
                    // save readWriteAddress
                    if (fullTracer){
                        fullTracer.addReadWriteAddress(ctx.Fr, ctx.A, ctx.B, res.value);
                    }

                    fi = scalar2fea(Fr, Scalar.e(res.value));
                    nHits++;
                }
                if (l.sWR == 1) {
                    const address = fea2scalar(ctx.Fr, ctx.A);
                    const addressHex = ethers.utils.getAddress(`0x${Scalar.toString(address, 16).padStart(40, '0')}`);
                    const keyStorage = "0x"+ fea2scalar(ctx.Fr, ctx.C).toString(16).padStart(64,'0');
                    const keyType = fea2scalar(ctx.Fr, ctx.B)
                    if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].balance && keyType === Scalar.e(ConstantsCommon.SMT_KEY_BALANCE)){
                        input.stateOverride[addressHex].balance = safeFea2scalar(Fr, ctx.D).toString();
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].nonce && keyType === Scalar.e(ConstantsCommon.SMT_KEY_NONCE)){
                        input.stateOverride[addressHex].nonce = safeFea2scalar(Fr, ctx.D).toString();
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].code && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_CODE)){
                        input.stateOverride[addressHex].code = input.contractsBytecode["0x" + safeFea2scalar(Fr, ctx.D).toString(16)];
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].state && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_STORAGE)){
                        input.stateOverride[addressHex].state[keyStorage] = safeFea2scalar(Fr, ctx.D).toString();
                    } else if (input.stateOverride && input.stateOverride[addressHex] && input.stateOverride[addressHex].stateDiff && keyType === Scalar.e(ConstantsCommon.SMT_KEY_SC_STORAGE)
                    && input.stateOverride[addressHex].stateDiff[keyStorage]){
                        input.stateOverride[addressHex].stateDiff[keyStorage] = safeFea2scalar(Fr, ctx.D).toString();
                    }

                    ctx.lastSWrite = {};

                    const Kin0 = [
                        ctx.C[0],
                        ctx.C[1],
                        ctx.C[2],
                        ctx.C[3],
                        ctx.C[4],
                        ctx.C[5],
                        ctx.C[6],
                        ctx.C[7],
                    ];

                    const Kin1 = [
                        ctx.A[0],
                        ctx.A[1],
                        ctx.A[2],
                        ctx.A[3],
                        ctx.A[4],
                        ctx.A[5],
                        ctx.B[0],
                        ctx.B[1]
                    ];

                    const keyI = poseidon(Kin0);
                    const key = poseidon(Kin1, keyI);

                    ctx.lastSWrite.Kin0 = Kin0;
                    ctx.lastSWrite.Kin1 = Kin1;
                    ctx.lastSWrite.keyI = keyI;
                    ctx.lastSWrite.key = key;

                    // commented since readings are also done directly in the s
                    // ctx.lastSWrite.keyS = ctx.lastSWrite.key.toString(16);
                    // if (typeof ctx.sto[ctx.lastSWrite.keyS ] === "undefined" ) throw new Error(`Storage not initialized: ${ctx.ln}`);

                    const res = await smt.set(sr8to4(ctx.Fr, ctx.SR), ctx.lastSWrite.key, safeFea2scalar(Fr, ctx.D));
                    incCounter = res.proofHashCounter + 2;

                    // save readWriteAddress
                    if (fullTracer){
                        fullTracer.addReadWriteAddress(ctx.Fr, ctx.A, ctx.B, safeFea2scalar(Fr, ctx.D));

                        // handle verbose full-tracer events
                        if (fullTracer.options.verbose.enable)
                            fullTracer.onAccessed(ctx.Fr, ctx.A, ctx.C, ctx.B);
                    }

                    ctx.lastSWrite.newRoot = res.newRoot;
                    ctx.lastSWrite.res = res;
                    ctx.lastSWrite.step = step;

                    fi = sr4to8(ctx.Fr, ctx.lastSWrite.newRoot);
                    nHits++;
                }

                if (l.hashK) {
                    if (typeof ctx.hashK[hashAddr] === "undefined") ctx.hashK[hashAddr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
                    const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
                    const pos = fe2n(Fr, ctx.HASHPOS, ctx);
                    if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashK(${hashAddr}) ${sourceRef}`);
                    if (pos+size > ctx.hashK[hashAddr].data.length) throw new Error(`Accessing hashK(${hashAddr}) out of bounds (${pos+size} > ${ctx.hashK[hashAddr].data.length}) ${sourceRef}`);
                    let s = Scalar.zero;
                    for (let k=0; k<size; k++) {
                        if (typeof ctx.hashK[hashAddr].data[pos + k] === "undefined") throw new Error(`Accessing hashK(${hashAddr}) not defined place ${pos+k} ${sourceRef}`);
                        s = Scalar.add(Scalar.mul(s, 256), Scalar.e(ctx.hashK[hashAddr].data[pos + k]));
                    }
                    fi = scalar2fea(Fr, s);
                    nHits++;
                }
                if (l.hashKDigest == 1) {
                    if (typeof ctx.hashK[hashAddr] === "undefined") {
                        throw new Error(`digest(${hashAddr}) not defined ${sourceRef}`);
                    }
                    if (typeof ctx.hashK[hashAddr].digest === "undefined") {
                        throw new Error(`digest(${hashAddr}) not calculated. Call hashKlen to finish digest ${sourceRef}`);
                    }
                    fi = scalar2fea(Fr, ctx.hashK[hashAddr].digest);
                    nHits++;
                }
                if (sha256Enabled) {
                    if (l.hashS) {
                        if (typeof ctx.hashS[hashAddr] === "undefined") ctx.hashS[hashAddr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
                        const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
                        const pos = fe2n(Fr, ctx.HASHPOS, ctx);
                        if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashS(${hashAddr}) ${sourceRef}`);
                        if (pos+size > ctx.hashS[hashAddr].data.length) throw new Error(`Accessing hashS(${hashAddr}) out of bounds (${pos+size} > ${ctx.hashS[hashAddr].data.length}) ${sourceRef}`);
                        let s = Scalar.zero;
                        for (let k=0; k<size; k++) {
                            if (typeof ctx.hashS[hashAddr].data[pos + k] === "undefined") throw new Error(`Accessing hashS(${hashAddr}) not defined place ${pos+k} ${sourceRef}`);
                            s = Scalar.add(Scalar.mul(s, 256), Scalar.e(ctx.hashS[hashAddr].data[pos + k]));
                        }
                        fi = scalar2fea(Fr, s);
                        nHits++;
                    }
                    if (l.hashSDigest == 1) {
                        if (typeof ctx.hashS[hashAddr] === "undefined") {
                            throw new Error(`digest sha256(${hashAddr}) not defined ${sourceRef}`);
                        }
                        if (typeof ctx.hashS[hashAddr].digest === "undefined") {
                            throw new Error(`digest sha256(${hashAddr}) not calculated. Call hashSlen to finish digest ${sourceRef}`);
                        }
                        fi = scalar2fea(Fr, ctx.hashS[hashAddr].digest);
                        nHits++;
                    }
                }
                if (l.hashP) {
                    if (typeof ctx.hashP[hashAddr] === "undefined") ctx.hashP[hashAddr] = { data: [], reads: {}, digestCalled: false, lenCalled: false, sourceRef };
                    const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
                    const pos = fe2n(Fr, ctx.HASHPOS, ctx);

                    if ((size<0) || (size>32)) throw new Error(`Invalid size for hash ${sourceRef}`);
                    if (pos+size > ctx.hashP[hashAddr].data.length) throw new Error(`Accessing hashP(${hashAddr}) out of bounds ${sourceRef}`);
                    let s = Scalar.zero;
                    for (let k=0; k<size; k++) {
                        if (typeof ctx.hashP[hashAddr].data[pos + k] === "undefined") throw new Error(`Accessing hashP(${hashAddr}) not defined place ${pos+k} ${sourceRef}`);
                        s = Scalar.add(Scalar.mul(s, 256), Scalar.e(ctx.hashP[hashAddr].data[pos + k]));
                    }
                    fi = scalar2fea(Fr, s);
                    nHits++;
                }
                if (l.hashPDigest == 1) {
                    if (typeof ctx.hashP[hashAddr] === "undefined") {
                        throw new Error(`digest(${hashAddr}) not defined ${sourceRef}`);
                    }
                    if (typeof ctx.hashP[hashAddr].digest === "undefined") {
                        throw new Error(`digest(${hashAddr}) not calculated. Call hashPlen to finish digest ${sourceRef}`);
                    }
                    fi = scalar2fea(Fr, ctx.hashP[hashAddr].digest);
                    nHits++;
                }
                if (l.bin) {
                    if (l.binOpcode == 0) { // ADD
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.band(Scalar.add(a, b), Mask256);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 1) { // SUB
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.band(Scalar.add(Scalar.sub(a, b), twoTo256), Mask256);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 2) { // LT
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.lt(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 3) { // SLT
                        let a = safeFea2scalar(Fr, ctx.A);
                        if (Scalar.geq(a, twoTo255)) a = Scalar.sub(a, twoTo256);
                        let b = safeFea2scalar(Fr, ctx.B);
                        if (Scalar.geq(b, twoTo255)) b = Scalar.sub(b, twoTo256);
                        const c = Scalar.lt(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 4) { // EQ
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.eq(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 5) { // AND
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.band(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 6) { // OR
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.bor(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 7) { // XOR
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.bxor(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 8) { // LT4
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = lt4(a, b);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else {
                        throw new Error(`Invalid Binary operation ${l.binOpCode} ${sourceRef}`);
                    }
                }

                if (l.memAlignRD) {
                    const m0 = safeFea2scalar(Fr, ctx.A);
                    const m1 = safeFea2scalar(Fr, ctx.B);
                    const P2_256 = 2n ** 256n;
                    const MASK_256 = P2_256 - 1n;
                    const offset = safeFea2scalar(Fr, ctx.C);
                    if (offset < 0 || offset > 32) {
                        throw new Error(`MemAlign out of range (${offset})  ${sourceRef}`);
                    }
                    const leftV = Scalar.band(Scalar.shl(m0, offset * 8n), MASK_256);
                    const rightV = Scalar.band(Scalar.shr(m1, 256n - (offset * 8n)), MASK_256 >> (256n - (offset * 8n)));
                    const _V = Scalar.bor(leftV, rightV);
                    fi = scalar2fea(Fr, _V);
                    nHits ++;
                }

                if (nHits==0) {
                    throw new Error(`Empty freeIn without a valid instruction ${sourceRef}`);
                }
                if (nHits>1) {
                    throw new Error(`Only one instruction that requires freeIn is allowed ${sourceRef}`);
                }
            } else {
                fi = evalCommand(ctx, l.freeInTag);
                if (!Array.isArray(fi)) fi = scalar2fea(Fr, fi);
            }
            [pols.FREE0[i], pols.FREE1[i], pols.FREE2[i], pols.FREE3[i], pols.FREE4[i], pols.FREE5[i], pols.FREE6[i], pols.FREE7[i]] = fi;
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [Fr.add( Fr.mul(Fr.add(Fr.e(l.inFREE), Fr.e(l.inFREE0)), fi[0]), op0 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[1]), op1 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[2]), op2 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[3]), op3 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[4]), op4 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[5]), op5 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[6]), op6 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[7]), op7 )
                ];
            pols.inFREE[i] = Fr.e(l.inFREE);
            pols.inFREE0[i] = Fr.e(l.inFREE0);
        } else {
            [pols.FREE0[i], pols.FREE1[i], pols.FREE2[i], pols.FREE3[i], 
             pols.FREE4[i], pols.FREE5[i], pols.FREE6[i], pols.FREE7[i]] = l.restore ? dataToRestore.op : Fr8zero;
            pols.inFREE[i] = Fr.zero;
            pols.inFREE0[i] = Fr.zero;
        }

        if (Fr.isZero(op0)) {
            pols.op0Inv[i] = 0n;
        } else {
            pols.op0Inv[i] = Fr.inv(op0);
        }

//////////
// PROCESS INSTRUCTIONS
//////////

        if (l.assert) {
            if ((Number(ctx.zkPC) === rom.labels.assertNewStateRoot) && skipAsserts){
                console.log("Skip assert newStateRoot");
            } else if ((Number(ctx.zkPC) === rom.labels.assertNewLocalExitRoot) && skipAsserts){
                console.log("Skip assert newLocalExitRoot");
            } else if (
                    (!Fr.eq(ctx.A[0], op0)) ||
                    (!Fr.eq(ctx.A[1], op1)) ||
                    (!Fr.eq(ctx.A[2], op2)) ||
                    (!Fr.eq(ctx.A[3], op3)) ||
                    (!Fr.eq(ctx.A[4], op4)) ||
                    (!Fr.eq(ctx.A[5], op5)) ||
                    (!Fr.eq(ctx.A[6], op6)) ||
                    (!Fr.eq(ctx.A[7], op7))
            ) {
                throw new Error(`Assert does not match ${sourceRef} (op:${fea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7])} A:${fea2scalar(Fr, ctx.A)})`);
            }
            pols.assert[i] = 1n;
        } else {
            pols.assert[i] = 0n;
        }

        pols.assumeFree[i] = l.assumeFree ? 1n : 0n;

        if (l.mOp) {
            pols.mOp[i] = 1n;
            pols.memUseAddrRel[i] = l.memUseAddrRel ? 1n: 0n;

            if (l.mWR) {
                pols.mWR[i] = 1n;
                ctx.mem[memAddr] = [op0, op1, op2, op3, op4, op5, op6, op7];
                required.Mem.push({
                    bIsWrite: true,
                    address: memAddr,
                    pc: step,
                    fe0:op0, fe1:op1, fe2:op2, fe3:op3, fe4:op4, fe5:op5, fe6:op6, fe7:op7,
                });
            } else {
                const value = l.assumeFree ? [ctx.FREE0, ctx.FREE1, ctx.FREE2, ctx.FREE3, ctx.FREE4, ctx.FREE5, ctx.FREE6, ctx.FREE7]:
                                             [op0, op1, op2, op3, op4, op5, op6, op7];
                pols.mWR[i] = 0n;
                required.Mem.push({
                    bIsWrite: false,
                    address: memAddr,
                    pc: step,
                    fe0:value[0], fe1:value[1], fe2:value[2], fe3:value[3], fe4:value[4], fe5:value[5], fe6:value[6], fe7:value[7]
                });
                if (ctx.mem[memAddr]) {
                    if ((!Fr.eq(ctx.mem[memAddr][0],  value[0])) ||
                        (!Fr.eq(ctx.mem[memAddr][1],  value[1])) ||
                        (!Fr.eq(ctx.mem[memAddr][2],  value[2])) ||
                        (!Fr.eq(ctx.mem[memAddr][3],  value[3])) ||
                        (!Fr.eq(ctx.mem[memAddr][4],  value[4])) ||
                        (!Fr.eq(ctx.mem[memAddr][5],  value[5])) ||
                        (!Fr.eq(ctx.mem[memAddr][6],  value[6])) ||
                        (!Fr.eq(ctx.mem[memAddr][7],  value[7])))
                    {
                        const memdata = ctx.mem[memAddr].slice().reverse().join(',');
                        const hmemdata = ctx.mem[memAddr].slice().reverse().map((x)=>x.toString(16).padStart(8,'0')).join('');
                        const data = value.reverse();
                        const opdata = data.join(',');
                        const hopdata = data.map((x)=>x.toString(16).padStart(8,'0')).join('');
                        throw new Error(`Memory Read does not match MEM[${memAddr}]=[${memdata}] OP=[${opdata}] ${sourceRef}\n${hmemdata}\n${hopdata}`);
                    }
                } else {
                    if ((!Fr.isZero(value[0])) ||
                        (!Fr.isZero(value[1])) ||
                        (!Fr.isZero(value[2])) ||
                        (!Fr.isZero(value[3])) ||
                        (!Fr.isZero(value[4])) ||
                        (!Fr.isZero(value[5])) ||
                        (!Fr.isZero(value[6])) ||
                        (!Fr.isZero(value[7])))
                    {
                        const memdata = ctx.mem[memAddr].slice().reverse().join(',');
                        const opdata = value.reverse().join(',');
                        throw new Error(`Memory Read does not match with non-initialized MEM[${memAddr}]=[${memdata}] OP=[${opdata}] ${sourceRef}`);
                    }
                }

            }

        } else {
            pols.mOp[i] = 0n;
            pols.mWR[i] = 0n;
            pols.memUseAddrRel[i] = 0n;
        }

        // overwrite 'op' when hiting 'checkFirstTxType' label
        if ((Number(ctx.zkPC) === rom.labels.checkFirstTxType) && input.skipFirstChangeL2Block === true) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                    Fr.e(1),
                ];
        }

        // overwrite 'op' when hiting 'writeBlockInfoRoot' label
        if ((Number(ctx.zkPC) === rom.labels.writeBlockInfoRoot) && input.skipWriteBlockInfoRoot === true) {
            [op0, op1, op2, op3, op4, op5, op6, op7] =
                [
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                    Fr.e(0),
                ];
        }

        if (l.sRD || l.sWR) {
            if (!Fr.isZero(ctx.A[7]) || !Fr.isZero(ctx.A[6]) || !Fr.isZero(ctx.A[5])) {
                const values = '0x' + ([ctx.A[7], ctx.A[6], ctx.A[5]].map(x => x.toString(16)).join(',0x'));
                throw new Error(`Storage invalid key (address) [A7..A5] = [${values}] on ${sourceRef}`);
            }

            if (!Fr.isZero(ctx.B[7]) || !Fr.isZero(ctx.B[6]) || !Fr.isZero(ctx.B[5]) ||
                !Fr.isZero(ctx.B[4]) || !Fr.isZero(ctx.B[3]) || !Fr.isZero(ctx.B[2])) {
                const values = '0x' + [ctx.B[7], ctx.B[6], ctx.B[5], ctx.B[4], ctx.B[3], ctx.B[2] ].map(x => x.toString(16)).join(',0x');
                throw new Error(`Storage invalid key (type) [B7..B2] = [${values}] on ${sourceRef}`);
            }
        }

        if (l.sRD) {
            pols.sRD[i] = 1n;

            const Kin0 = [
                ctx.C[0],
                ctx.C[1],
                ctx.C[2],
                ctx.C[3],
                ctx.C[4],
                ctx.C[5],
                ctx.C[6],
                ctx.C[7],
            ];

            const Kin1 = [
                ctx.A[0],
                ctx.A[1],
                ctx.A[2],
                ctx.A[3],
                ctx.A[4],
                ctx.A[5],
                ctx.B[0],
                ctx.B[1]
            ];

            const keyI = poseidon(Kin0);
            required.PoseidonG.push([...Kin0, 0n, 0n, 0n, 0n, ...keyI, POSEIDONG_PERMUTATION1_ID]);

            const key = poseidon(Kin1, keyI);
            required.PoseidonG.push([...Kin1, ...keyI,  ...key, POSEIDONG_PERMUTATION2_ID]);

            const res = await smt.get(sr8to4(ctx.Fr, ctx.SR), key);
            incCounter = res.proofHashCounter + 2;

            required.Storage.push({
                bIsSet: false,
                getResult: {
                    root: [...res.root],
                    key: [...res.key],
                    siblings: [...res.siblings],
                    insKey: res.insKey ? [...res.insKey] : new Array(4).fill(Scalar.zero),
                    insValue: res.insValue,
                    isOld0: res.isOld0,
                    value: res.value,
                    incCounter: res.proofHashCounter
                },
                main: {
                    w: i,
                    sourceRef
                }});

            if (!Scalar.eq(res.value,safeFea2scalar(Fr,[op0, op1, op2, op3, op4, op5, op6, op7]))) {
                throw new Error(`Storage read does not match ${sourceRef}`);
            }

            for (let k=0; k<4; k++) {
                pols.sKeyI[k][i] =  keyI[k];
                pols.sKey[k][i] = key[k];
            }

        } else {
            pols.sRD[i] = 0n;
        }

        if (l.sWR) {
            pols.sWR[i] = 1n;

            if ((!ctx.lastSWrite)||(ctx.lastSWrite.step != step)) {
                ctx.lastSWrite = {};

                const Kin0 = [
                    ctx.C[0],
                    ctx.C[1],
                    ctx.C[2],
                    ctx.C[3],
                    ctx.C[4],
                    ctx.C[5],
                    ctx.C[6],
                    ctx.C[7],
                ];

                const Kin1 = [
                    ctx.A[0],
                    ctx.A[1],
                    ctx.A[2],
                    ctx.A[3],
                    ctx.A[4],
                    ctx.A[5],
                    ctx.B[0],
                    ctx.B[1]
                ];

                ctx.lastSWrite.Kin0 = Kin0;
                ctx.lastSWrite.Kin1 = Kin1;
                ctx.lastSWrite.keyI = poseidon(Kin0);
                ctx.lastSWrite.key = poseidon(Kin1, ctx.lastSWrite.keyI);

                // commented since readings are also done directly in the smt
                // ctx.lastSWrite.keyS = Fr.toString(ctx.lastSWrite.key, 16).padStart(64, "0");
                // if (typeof ctx.sto[ctx.lastSWrite.keyS ] === "undefined" ) throw new Error(`Storage not initialized: ${ctx.ln}`);

                const res = await smt.set(sr8to4(ctx.Fr, ctx.SR), ctx.lastSWrite.key, safeFea2scalar(Fr, ctx.D));
                incCounter = res.proofHashCounter + 2;

                ctx.lastSWrite.res = res;
                ctx.lastSWrite.newRoot = res.newRoot;
                ctx.lastSWrite.step = step;
            }

            required.PoseidonG.push([...ctx.lastSWrite.Kin0, 0n, 0n, 0n, 0n, ...ctx.lastSWrite.keyI, POSEIDONG_PERMUTATION1_ID]);
            required.PoseidonG.push([...ctx.lastSWrite.Kin1, ...ctx.lastSWrite.keyI,  ...ctx.lastSWrite.key, POSEIDONG_PERMUTATION2_ID]);

            required.Storage.push({
                bIsSet: true,
                setResult: {
                    oldRoot: [...ctx.lastSWrite.res.oldRoot],
                    newRoot: [...ctx.lastSWrite.res.newRoot],
                    key: [...ctx.lastSWrite.res.key],
                    siblings: [...ctx.lastSWrite.res.siblings],
                    insKey: ctx.lastSWrite.res.insKey ? [...ctx.lastSWrite.res.insKey] : new Array(4).fill(Scalar.zero),
                    insValue: ctx.lastSWrite.res.insValue,
                    isOld0: ctx.lastSWrite.res.isOld0,
                    oldValue: ctx.lastSWrite.res.oldValue,
                    newValue: ctx.lastSWrite.res.newValue,
                    mode: ctx.lastSWrite.res.mode,
                    incCounter: ctx.lastSWrite.res.proofHashCounter,
                    siblingLeftChild: [...ctx.lastSWrite.res.siblingLeftChild],
                    siblingRightChild: [...ctx.lastSWrite.res.siblingRightChild]
                },
                main: {
                    w: i,
                    sourceRef
                }});

            if (!nodeIsEq(ctx.lastSWrite.newRoot, sr8to4(ctx.Fr, [op0, op1, op2, op3, op4, op5, op6, op7 ]), ctx.Fr)) {
                throw new Error(`Storage write does not match ${sourceRef}`);
            }

            // commented since readings are also done directly in the smt
            // ctx.sto[ ctx.lastSWrite.keyS ] = fea2scalar(Fr, ctx.D).toString(16).padStart(64, "0");
            for (let k=0; k<4; k++) {
                pols.sKeyI[k][i] =  ctx.lastSWrite.keyI[k];
                pols.sKey[k][i] = ctx.lastSWrite.key[k];
            }
        } else {
            pols.sWR[i] = 0n;
        }

        if ((!l.sRD) && (!l.sWR)) {
            for (let k=0; k<4; k++) {
                pols.sKeyI[k][i] =  Fr.zero;
                pols.sKey[k][i] = Fr.zero;
            }
        }

        pols.hashBytesInD[i] = l.hashBytesInD ? 1n : 0n;
        pols.hashBytes[i] = l.hashBytes ? BigInt(l.hashBytes) : 0n;
        pols.hashOffset[i] = l.hashOffset ? BigInt(l.hashOffset) : 0n;

        if (l.hashK) {
            if (typeof ctx.hashK[hashAddr] === "undefined") ctx.hashK[hashAddr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
            pols.hashK[i] = l.hashK ? 1n : 0n;
            const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
            const pos = fe2n(Fr, ctx.HASHPOS, ctx);
            if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashK ${sourceRef}`);
            const a = l.assumeFree ? safeFea2scalar(Fr, [ctx.FREE0, ctx.FREE1, ctx.FREE2, ctx.FREE3, ctx.FREE4, ctx.FREE5, ctx.FREE6, ctx.FREE7]):
                                     safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            const maskByte = Scalar.e("0xFF");
            for (let k=0; k<size; k++) {
                const bm = Scalar.toNumber(Scalar.band( Scalar.shr( a, (size-k -1)*8 ) , maskByte));
                const bh = ctx.hashK[hashAddr].data[pos + k];
                if (typeof bh === "undefined") {
                    ctx.hashK[hashAddr].data[pos + k] = bm;
                } else if (bm != bh) {
                    throw new Error(`HashK(${hashAddr}) do not match, pos ${pos+k} is ${bm} and should be ${bh} ${sourceRef}`)
                }
            }
            const paddingA = Scalar.shr(a, size * 8);
            if (!Scalar.isZero(paddingA)) {
                throw new Error(`HashK(${hashAddr}) incoherent size (${size}) and data (0x${a.toString(16)}) padding (0x${paddingA.toString(16)}) (w=${step}) ${sourceRef}`);
            }

            if ((typeof ctx.hashK[hashAddr].reads[pos] !== "undefined") &&
                (ctx.hashK[hashAddr].reads[pos] != size))
            {
                throw new Error(`HashK(${hashAddr}) diferent read sizes (${ctx.hashK[hashAddr].reads[pos]} != ${size}) in the same position ${pos} ${sourceRef}`)
            }
            ctx.hashK[hashAddr].reads[pos] = size;
            ctx.hashK[hashAddr].sourceRef = sourceRef;
            incHashPos = size;
        } else {
            pols.hashK[i] = 0n;
        }

        if (l.hashKLen) {
            pols.hashKLen[i] = 1n;
            const lm = fe2n(Fr, op0, ctx);
            // If it's undefined compute hash of 0 bytes
            if(typeof ctx.hashK[hashAddr] === "undefined") {
                // len must be 0
                if (lm != 0) throw new Error(`HashKLen(${hashAddr}) length does not match is ${lm} and should be 0 ${sourceRef}`);
                ctx.hashK[hashAddr] = { data: [], reads: {} , digestCalled: false};
                ctx.hashK[hashAddr].digest = ethers.utils.keccak256("0x");
            }
            ctx.hashK[hashAddr].sourceRef = sourceRef;

            if (ctx.hashK[hashAddr].lenCalled) {
                throw new Error(`Call HASHKLEN @${hashAddr} more than once: ${ctx.ln} at ${ctx.fileName}:${ctx.line}`);
            }
            ctx.hashK[hashAddr].lenCalled = true;
            const lh = ctx.hashK[hashAddr].data.length;
            if (lm != lh) throw new Error(`HashKLen(${hashAddr}) length does not match is ${lm} and should be ${lh} ${sourceRef}`);
            if (typeof ctx.hashK[hashAddr].digest === "undefined") {
                ctx.hashK[hashAddr].digest = ethers.utils.keccak256(ethers.utils.hexlify(ctx.hashK[hashAddr].data));
            }
        } else {
            pols.hashKLen[i] = 0n;
        }

        if (l.hashKDigest) {
            pols.hashKDigest[i] = 1n;
            const dg = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            if (typeof ctx.hashK[hashAddr] === "undefined") {
                const k = scalar2h4(dg);
                const data = await smt.db.getProgram(k);

                ctx.hashK[hashAddr] = {
                    data: data,
                    digest: dg,
                    lenCalled: false,
                    sourceRef,
                    reads: {}
                }
            }
            if (!Scalar.eq(Scalar.e(dg), Scalar.e(ctx.hashK[hashAddr].digest))) {
                throw new Error(`HashKDigest(${hashAddr}) doesn't match ${sourceRef}`);
            }
            if (ctx.hashK[hashAddr].digestCalled) {
                throw new Error(`Call HASHKDIGEST(${hashAddr}) more than once: ${sourceRef}`);
            }
            ctx.hashK[hashAddr].digestCalled = true;
            incCounter = Math.ceil((ctx.hashK[hashAddr].data.length + 1) / 136)
        } else {
            pols.hashKDigest[i] = 0n;
        }

        if (sha256Enabled) {
            if (l.hashS) {
                if (typeof ctx.hashS[hashAddr] === "undefined") ctx.hashS[hashAddr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
                pols.hashS[i] = l.hashS ? 1n : 0n;
                const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
                const pos = fe2n(Fr, ctx.HASHPOS, ctx);
                if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashS ${sourceRef}`);
                const a = l.assumeFree ? safeFea2scalar(Fr, [ctx.FREE0, ctx.FREE1, ctx.FREE2, ctx.FREE3, ctx.FREE4, ctx.FREE5, ctx.FREE6, ctx.FREE7]):
                                        safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const maskByte = Scalar.e("0xFF");
                for (let k=0; k<size; k++) {
                    const bm = Scalar.toNumber(Scalar.band( Scalar.shr( a, (size-k -1)*8 ) , maskByte));
                    const bh = ctx.hashS[hashAddr].data[pos + k];
                    if (typeof bh === "undefined") {
                        ctx.hashS[hashAddr].data[pos + k] = bm;
                    } else if (bm != bh) {
                        throw new Error(`HashS(${hashAddr}) do not match, pos ${pos+k} is ${bm} and should be ${bh} ${sourceRef}`)
                    }
                }
                const paddingA = Scalar.shr(a, size * 8);
                if (!Scalar.isZero(paddingA)) {
                    throw new Error(`HashS(${hashAddr}) incoherent size (${size}) and data (0x${a.toString(16)}) padding (0x${paddingA.toString(16)}) (w=${step}) ${sourceRef}`);
                }

                if ((typeof ctx.hashS[hashAddr].reads[pos] !== "undefined") &&
                    (ctx.hashS[hashAddr].reads[pos] != size))
                {
                    throw new Error(`HashS(${hashAddr}) diferent read sizes (${ctx.hashS[hashAddr].reads[pos]} != ${size}) in the same position ${pos} ${sourceRef}`)
                }
                ctx.hashS[hashAddr].reads[pos] = size;
                ctx.hashS[hashAddr].sourceRef = sourceRef;
                incHashPos = size;
            } else {
                pols.hashS[i] = 0n;
            }

            if (l.hashSLen) {
                pols.hashSLen[i] = 1n;
                const lm = fe2n(Fr, op0, ctx);
                // If it's undefined compute hash of 0 bytes
                if(typeof ctx.hashS[hashAddr] === "undefined") {
                    // len must be 0
                    if (lm != 0) throw new Error(`HashSLen(${hashAddr}) length does not match is ${lm} and should be 0 ${sourceRef}`);
                    ctx.hashS[hashAddr] = { data: [], reads: {} , digestCalled: false};
                    ctx.hashS[hashAddr].digest = `0x${createHash('sha256').update(Uint8Array.from([])).digest('hex')}`;
                }
                ctx.hashS[hashAddr].sourceRef = sourceRef;

                if (ctx.hashS[hashAddr].lenCalled) {
                    throw new Error(`Call HASHSLEN @${hashAddr} more than once: ${ctx.ln} at ${ctx.fileName}:${ctx.line}`);
                }
                ctx.hashS[hashAddr].lenCalled = true;
                const lh = ctx.hashS[hashAddr].data.length;
                if (lm != lh) throw new Error(`HashSLen(${hashAddr}) length does not match is ${lm} and should be ${lh} ${sourceRef}`);
                if (typeof ctx.hashS[hashAddr].digest === "undefined") {
                    ctx.hashS[hashAddr].digest = `0x${createHash('sha256').update(Uint8Array.from(ctx.hashS[hashAddr].data)).digest('hex')}`;
                }
            } else {
                pols.hashSLen[i] = 0n;
            }

            if (l.hashSDigest) {
                pols.hashSDigest[i] = 1n;
                const dg = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                if (typeof ctx.hashS[hashAddr].digest === "undefined") {
                    throw new Error(`HASHSDIGEST(${hashAddr}) cannot load sha256 from DB ${sourceRef}`);
                }
                if (!Scalar.eq(Scalar.e(dg), Scalar.e(ctx.hashS[hashAddr].digest))) {
                    throw new Error(`HashSDigest(${hashAddr}) doesn't match ${sourceRef}`);
                }
                if (ctx.hashS[hashAddr].digestCalled) {
                    throw new Error(`Call HASHSDIGEST(${hashAddr}) more than once: ${sourceRef}`);
                }
                ctx.hashS[hashAddr].digestCalled = true;
                incCounter = Math.ceil((ctx.hashS[hashAddr].data.length + 1 + 8) / 64)
            } else {
                pols.hashSDigest[i] = 0n;
            }
        }
        if (l.hashP) {
            if (typeof ctx.hashP[hashAddr] === "undefined") ctx.hashP[hashAddr] = { data: [], reads: {}, digestCalled: false, lenCalled: false, sourceRef };
            pols.hashP[i] = l.hashP ? 1n : 0n;
            const size = l.hashBytesInD ? fe2n(Fr, ctx.D[0], ctx): l.hashBytes;
            const pos = fe2n(Fr, ctx.HASHPOS, ctx);
            if ((size<0) || (size>32)) throw new Error(`HashP(${hashAddr}) invalid size ${size} ${sourceRef}`);
            const a = l.assumeFree ? safeFea2scalar(Fr, [ctx.FREE0, ctx.FREE1, ctx.FREE2, ctx.FREE3, ctx.FREE4, ctx.FREE5, ctx.FREE6, ctx.FREE7]):
                                     safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            const maskByte = Scalar.e("0xFF");
            for (let k=0; k<size; k++) {
                const bm = Scalar.toNumber(Scalar.band( Scalar.shr( a, (size-k -1)*8 ) , maskByte));
                const bh = ctx.hashP[hashAddr].data[pos + k];
                if (typeof bh === "undefined") {
                    ctx.hashP[hashAddr].data[pos + k] = bm;
                } else if (bm != bh) {
                    throw new Error(`HashP(${hashAddr}) do not match pos ${pos+k} is ${bm} and should be ${bh} ${sourceRef}`)
                }
            }
            const paddingA = Scalar.shr(a, size * 8);
            if (!Scalar.isZero(paddingA)) {
                throw new Error(`HashP(${hashAddr}) incoherent size (${size}) and data (0x${a.toString(16)}) padding (0x${paddingA.toString(16)}) (w=${step}) ${sourceRef}`);
            }

            if ((typeof ctx.hashP[hashAddr].reads[pos] !== "undefined") &&
                (ctx.hashP[hashAddr].reads[pos] != size))
            {
                throw new Error(`HashP(${hashAddr}) diferent read sizes in the same position ${pos} (${ctx.hashP[hashAddr].reads[pos]} != ${size}) ${sourceRef}`);
            }
            ctx.hashP[hashAddr].reads[pos] = size;
            ctx.hashP[hashAddr].sourceRef = sourceRef;
            incHashPos = size;
        } else {
            pols.hashP[i] = 0n;
        }

        if (l.hashPLen) {
            pols.hashPLen[i] = 1n;
            if (typeof ctx.hashP[hashAddr] === "undefined") {
                ctx.hashP[hashAddr] = { data: [], reads: {} , digestCalled: false};
            }
            const lh = ctx.hashP[hashAddr].data.length;
            const lm = fe2n(Fr, op0, ctx);
            if (lm != lh) throw new Error(`HashPLen(${hashAddr}) length does not match is ${lm} and should be ${lh} ${sourceRef}`);
            if (typeof ctx.hashP[hashAddr].digest === "undefined") {
                ctx.hashP[hashAddr].digest = await hashContractBytecode(byteArray2HexString(ctx.hashP[hashAddr].data));
                ctx.hashP[hashAddr].digestCalled = false;
                await db.setProgram(stringToH4(ctx.hashP[hashAddr].digest), ctx.hashP[hashAddr].data);
            }
            ctx.hashP[hashAddr].sourceRef = sourceRef;
            if (ctx.hashP[hashAddr].lenCalled) {
                throw new Error(`Call HASHPLEN @${hashAddr} more than once: ${ctx.ln} at ${ctx.fileName}:${ctx.line}`);
            }
            ctx.hashP[hashAddr].lenCalled = true;
        } else {
            pols.hashPLen[i] = 0n;
        }

        if (l.hashPDigest) {
            pols.hashPDigest[i] = 1n;
            const dg = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            if (typeof ctx.hashP[hashAddr] === "undefined") {
                const k = scalar2h4(dg);
                const data = await smt.db.getProgram(k);

                ctx.hashP[hashAddr] = {
                    data: data,
                    digest: dg,
                    lenCalled: false,
                    sourceRef,
                    reads: {}
                }
            }
            if (ctx.hashP[hashAddr].digestCalled) {
                throw new Error(`Call HASHPDIGEST @${hashAddr} more than once: ${ctx.ln} at ${ctx.fileName}:${ctx.line}`);
            }
            ctx.hashP[hashAddr].digestCalled = true;
            incCounter = Math.ceil((ctx.hashP[hashAddr].data.length + 1) / 56);
            if (!Scalar.eq(Scalar.e(dg), Scalar.e(ctx.hashP[hashAddr].digest))) {
                throw new Error(`HashPDigest(${hashAddr}) doesn't match ${sourceRef}`);
            }
        } else {
            pols.hashPDigest[i] = 0n;
        }

        if (l.hashPDigest || l.sWR) {
            const op = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            required.Binary.push({a: op, b: 0xFFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001n, c: 1n, opcode: 8, type: 2});
        }

        if (l.arith) {
            pols.arith[i] = 1n;
            pols.arithSame12[i] = (l.arithEquation == 3) ? 1n : 0n;
            pols.arithUseE[i] = (l.arithEquation == 1 || l.arithEquation == 7) ? 0n : 1n;

            if (l.arithEquation == 1) {
                const A = safeFea2scalar(Fr, ctx.A);
                const B = safeFea2scalar(Fr, ctx.B);
                const C = safeFea2scalar(Fr, ctx.C);
                const D = safeFea2scalar(Fr, ctx.D);
                const op = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                // A(x1) * B(y1) + C(x2) = D (y2) * 2 ** 256 + op (y3)

                if (!Scalar.eq(Scalar.add(Scalar.mul(A, B), C),Scalar.add(Scalar.shl(D, 256), op))) {
                    console.log('A: '+A.toString()+' (0x'+A.toString(16)+')');
                    console.log('B: '+B.toString()+' (0x'+B.toString(16)+')');
                    console.log('C: '+C.toString()+' (0x'+C.toString(16)+')');
                    console.log('D: '+D.toString()+' (0x'+D.toString(16)+')');
                    console.log('op: '+op.toString()+' (0x'+op.toString(16)+')');
                    let left = Scalar.add(Scalar.mul(A, B), C);
                    let right = Scalar.add(Scalar.shl(D, 256), op);
                    console.log(left.toString() + ' (0x'+left.toString(16)+') != '+ right.toString()
                                                + ' (0x' + right.toString(16)+')');
                    throw new Error(`Arithmetic(Eq0) does not match ${sourceRef}`);
                }
                pols.arithEquation[i] = 1n;
                required.Arith.push({ x1: ctx.A, y1: ctx.B,
                                      x2: ctx.C, y2: ctx.D,
                                      x3: Fr8zero, y3: [op0, op1, op2, op3, op4, op5, op6, op7],
                                      selEq0: 1, selEq1: 0, selEq2: 0, selEq3: 0, selEq4: 0, selEq5: 0, selEq6: 0});
            }
            else if (l.arithEquation == 4) {
                const x1 = safeFea2scalar(Fr, ctx.A);
                const y1 = safeFea2scalar(Fr, ctx.B);
                const x2 = safeFea2scalar(Fr, ctx.C);
                const y2 = safeFea2scalar(Fr, ctx.D);

                // fields output must be less than 32 bits
                const x3 = safeFea2scalar(Fr, ctx.E);
                const y3 = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                // y1 * x2 + x1 * y2 = y3
                // x1 * x2 - y1 * y2 = x3

                const _x3 = FpBN254.sub(FpBN254.mul(FpBN254.e(x1), FpBN254.e(x2)), FpBN254.mul(FpBN254.e(y1), FpBN254.e(y2)));
                const _y3 = FpBN254.add(FpBN254.mul(FpBN254.e(y1), FpBN254.e(x2)), FpBN254.mul(FpBN254.e(x1), FpBN254.e(y2)));

                const x3eq = Scalar.eq(x3, _x3);
                const y3eq = Scalar.eq(y3, _y3);

                if (!x3eq || !y3eq) {
                    console.log(`(${x1.toString()} + ${y1.toString()}i) * (${x2.toString()} + ${y2.toString()}i)`);

                    console.log(x3.toString()+(x3eq ? ' == ' : ' != ')+_x3.toString());
                    console.log(y3.toString()+(y3eq ? 'i == ' : 'i != ')+_y3.toString()+'i');

                    throw new Error(`Arithmetic FP2 multiplication point does not match: ${sourceRef}`);
                }

                pols.arithEquation[i] = 4n;
                required.Arith.push({x1:ctx.A, y1:ctx.B,
                                     x2:ctx.C, y2:ctx.D,
                                     x3:ctx.E, y3:[op0, op1, op2, op3, op4, op5, op6, op7],
                                     selEq0: 0, selEq1: 0, selEq2: 0, selEq3: 1, selEq4: 0, selEq5: 0, selEq6: 0});
            }
            else if (l.arithEquation == 5) {
                const x1 = safeFea2scalar(Fr, ctx.A);
                const y1 = safeFea2scalar(Fr, ctx.B);
                const x2 = safeFea2scalar(Fr, ctx.C);
                const y2 = safeFea2scalar(Fr, ctx.D);

                const x3 = safeFea2scalar(Fr, ctx.E);
                const y3 = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                // x1 + x2 = x3
                // y1 + y2 = y3

                const _x3 = FpBN254.add(FpBN254.e(x1), FpBN254.e(x2));
                const _y3 = FpBN254.add(FpBN254.e(y1), FpBN254.e(y2));

                const x3eq = FpBN254.eq(x3, _x3);
                const y3eq = FpBN254.eq(y3, _y3);

                if (!x3eq || !y3eq) {
                    console.log(`(${x1.toString()} + ${y1.toString()}i) + (${x2.toString()} + ${y2.toString()}i)`);

                    console.log(x3.toString()+(x3eq ? ' == ' : ' != ')+_x3.toString());
                    console.log(y3.toString()+(y3eq ? 'i == ' : 'i != ')+_y3.toString()+'i');

                    throw new Error(`Arithmetic FP2 addition does not match: ${sourceRef}`);
                }

                pols.arithEquation[i] = 5n;
                required.Arith.push({x1:ctx.A, y1:ctx.B,
                                     x2:ctx.C, y2:ctx.D,
                                     x3:ctx.E, y3:[op0, op1, op2, op3, op4, op5, op6, op7],
                                     selEq0: 0, selEq1: 0, selEq2: 0, selEq3: 0, selEq4: 1, selEq5: 0, selEq6: 0});
            }
            else if (l.arithEquation == 6) {
                const x1 = safeFea2scalar(Fr, ctx.A);
                const y1 = safeFea2scalar(Fr, ctx.B);
                const x2 = safeFea2scalar(Fr, ctx.C);
                const y2 = safeFea2scalar(Fr, ctx.D);

                const x3 = safeFea2scalar(Fr, ctx.E);
                const y3 = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                // x1 - x2 = x3
                // y1 - y2 = y3

                const _x3 = FpBN254.sub(FpBN254.e(x1), FpBN254.e(x2));
                const _y3 = FpBN254.sub(FpBN254.e(y1), FpBN254.e(y2));

                const x3eq = FpBN254.eq(x3, _x3);
                const y3eq = FpBN254.eq(y3, _y3);

                if (!x3eq || !y3eq) {
                    console.log(`(${x1.toString()} + ${y1.toString()}i) - (${x2.toString()} + ${y2.toString()}i)`);

                    console.log(x3.toString()+(x3eq ? ' == ' : ' != ')+_x3.toString());
                    console.log(y3.toString()+(y3eq ? 'i == ' : 'i != ')+_y3.toString()+'i');

                    throw new Error(`Arithmetic FP2 subtraction does not match: ${sourceRef}`);
                }

                pols.arithEquation[i] = 6n;
                required.Arith.push({x1:ctx.A, y1:ctx.B,
                                     x2:ctx.C, y2:ctx.D,
                                     x3:ctx.E, y3:[op0, op1, op2, op3, op4, op5, op6, op7],
                                     selEq0: 0, selEq1: 0, selEq2: 0, selEq3: 0, selEq4: 0, selEq5: 1, selEq6: 0});
            }
            else if (l.arithEquation == 7) {
                const A = safeFea2scalar(Fr, ctx.A);
                const B = safeFea2scalar(Fr, ctx.B);
                const C = safeFea2scalar(Fr, ctx.C);
                const D = safeFea2scalar(Fr, ctx.D);
                const op = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                if (Scalar.isZero(D)) {
                    throw new Error(`Modular arithmetic is undefined when D is zero ${sourceRef}`);
                }

                // A(x1) * B(y1) + C(x2) = op(y3) (mod D(y2))

                if (!Scalar.eq(Scalar.mod(Scalar.add(Scalar.mul(A, B), C), D),op)) {
                    console.log('A: '+A.toString()+' (0x'+A.toString(16)+')');
                    console.log('B: '+B.toString()+' (0x'+B.toString(16)+')');
                    console.log('C: '+C.toString()+' (0x'+C.toString(16)+')');
                    console.log('D: '+D.toString()+' (0x'+D.toString(16)+')');
                    console.log('op: '+op.toString()+' (0x'+op.toString(16)+')');
                    let LHS = Scalar.mod(Scalar.add(Scalar.mul(A, B), C),D);
                    let RHS = op;
                    console.log(LHS.toString() + ' (0x'+LHS.toString(16)+') != '+ RHS.toString()
                                               + ' (0x' + RHS.toString(16)+')');
                    throw new Error(`Modular arithmetic does not match ${sourceRef}`);
                }

                pols.arithEquation[i] = 7n;
                required.Arith.push({ x1: ctx.A, y1: ctx.B,
                                      x2: ctx.C, y2: ctx.D,
                                      x3: Fr8zero, y3: [op0, op1, op2, op3, op4, op5, op6, op7],
                                      selEq0: 0, selEq1: 0, selEq2: 0, selEq3: 0, selEq4: 0, selEq5: 0, selEq6: 1});
            }
            else {
                const x1 = safeFea2scalar(Fr, ctx.A);
                const y1 = safeFea2scalar(Fr, ctx.B);
                const x2 = safeFea2scalar(Fr, ctx.C);
                const y2 = safeFea2scalar(Fr, ctx.D);
                const x3 = safeFea2scalar(Fr, ctx.E);
                const y3 = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                let dbl = false;
                if (l.arithEquation == 2) {
                    dbl = false;
                } else if (l.arithEquation == 3) {
                    dbl = true;
                } else {
                    throw new Error(`Invalid arithmetic op arithEquation:${l.arithEquation} ${sourceRef}`);
                }

                let s;
                if (dbl) {
                    // Division by zero must be managed by ROM before call ARITH
                    const divisor = Fec.add(Fec.e(y1), Fec.e(y1));
                    if (Fec.isZero(divisor)) {
                        throw new Error(`Invalid arithmetic op, DivisionByZero arithEquation:${l.arithEquation} ${sourceRef}`);
                    }
                    s = Fec.div(Fec.mul(3n, Fec.mul(Fec.e(x1), Fec.e(x1))), divisor);
                }
                else {
                    // Division by zero must be managed by ROM before call ARITH
                    const deltaX = Fec.sub(Fec.e(x2), Fec.e(x1))
                    if (Fec.isZero(deltaX)) {
                        throw new Error(`Invalid arithmetic op, DivisionByZero arithEquation:${l.arithEquation} ${sourceRef}`);
                    }
                    s = Fec.div(Fec.sub(Fec.e(y2), Fec.e(y1)), deltaX);
                }

                const _x3 = Fec.sub(Fec.mul(s, s), Fec.add(Fec.e(x1), dbl ? Fec.e(x1) : Fec.e(x2)));
                const _y3 = Fec.sub(Fec.mul(s, Fec.sub(Fec.e(x1),x3)), Fec.e(y1));
                const x3eq = Scalar.eq(x3, _x3);
                const y3eq = Scalar.eq(y3, _y3);

                if (!x3eq || !y3eq) {
                    console.log('x1,y1: ('+x1.toString()+', '+y1.toString()+')');
                    if (!dbl) {
                        console.log('x2,y2: ('+x2.toString()+', '+y2.toString()+')');
                    }

                    console.log('x3: '+x3.toString()+(x3eq ? ' == ' : ' != ')+_x3.toString());
                    console.log('y3: '+y3.toString()+(y3eq ? ' == ' : ' != ')+_y3.toString());

                    throw new Error('Arithmetic curve '+(dbl?'dbl':'add')+` point does not match: ${sourceRef}`);
                }

                pols.arithEquation[i] = dbl ? 3n : 2n;
                required.Arith.push({x1: ctx.A, y1: ctx.B,
                                     x2: dbl ? ctx.A:ctx.C, y2: dbl? ctx.B:ctx.D,
                                     x3: ctx.E, y3: [op0, op1, op2, op3, op4, op5, op6, op7],
                                     selEq0: 0, selEq1: dbl ? 0 : 1, selEq2: dbl ? 1 : 0, selEq3: 0, selEq4: 0, selEq5: 0, selEq6: 0});
            }
        } else {
            pols.arith[i] = 0n;
            pols.arithEquation[i] = 0n;
            pols.arithSame12[i] = 0n;
            pols.arithUseE[i] = 0n;
        }

        if (l.bin) {
            // const carry = ctx.helpers.Binary.verify(l.binOpcode, safeFea2scalar(Fr, ctx.A),  safeFea2scalar(Fr, ctx.B), 
            //                                         safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]), required.Binary);
            // pols.binOpcode[i] = BigInt(l.binOpcode);
            // pols.carry[i] = carry;
            if (l.binOpcode == 0) { // ADD
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.band(Scalar.add(a, b), Mask256);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`ADD does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 0n;
                pols.carry[i] = (((a + b) >> 256n) > 0n) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 0, type: 1});
            } else if (l.binOpcode == 1) { // SUB
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.band(Scalar.add(Scalar.sub(a, b), twoTo256), Mask256);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`SUB does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 1n;
                pols.carry[i] = ((a - b) < 0n) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 1, type: 1});
            } else if (l.binOpcode == 2) { // LT
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.lt(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`LT does not match (${expectedC?1n:0n} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 2n;
                pols.carry[i] = (a < b) ? 1n: 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 2, type: 1});
            } else if (l.binOpcode == 3) { // SLT
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);

                const signedA = Scalar.geq(a, twoTo255) ? Scalar.sub(a, twoTo256): a;
                const signedB = Scalar.geq(b, twoTo255) ? Scalar.sub(b, twoTo256): b;
                const expectedC = Scalar.lt(signedA, signedB);

                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`SLT does not match (${expectedC?1n:0n} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 3n;
                pols.carry[i] = (signedA < signedB) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 3, type: 1});
            } else if (l.binOpcode == 4) { // EQ
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.eq(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`EQ does not match (${expectedC?1n:0n} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 4n;
                pols.carry[i] = (a ==  b) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 4, type: 1});
            } else if (l.binOpcode == 5) { // AND
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.band(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`AND does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 5n;
                pols.carry[i] = Scalar.eq(c, Fr.zero) ? 0n:1n;
                required.Binary.push({a: a, b: b, c: c, opcode: 5, type: 1});
            } else if (l.binOpcode == 6) { // OR
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.bor(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`OR does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 6n;
                pols.carry[i] = 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 6, type: 1});
            } else if (l.binOpcode == 7) { // XOR
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = Scalar.bxor(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`XOR does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 7n;
                pols.carry[i] = 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 7, type: 1});
            } else if (l.binOpcode == 8) { // LT4
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
                const expectedC = lt4(a,b);
                if (!Scalar.eq(c, expectedC)) {
                    const _a = a.toString(16).padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_');
                    const _b = b.toString(16).padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_');
                    throw new Error(`LT4 does not match ${expectedC} vs ${c} (A: ${_a}, B:${_b}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 8n;
                pols.carry[i] = c;
                required.Binary.push({a: a, b: b, c: c, opcode: 8, type: 1});
            } else {
                throw new Error(`Invalid bin opcode (${l.binOpcode}) ${sourceRef}`);
            }
            pols.bin[i] = 1n;
        } else {
            pols.bin[i] = 0n;
            pols.binOpcode[i] = 0n;
            pols.carry[i] = 0n;
        }

        if (l.memAlignRD || l.memAlignWR || l.memAlignWR8) {
            const m0 = safeFea2scalar(Fr, ctx.A);
            const v = safeFea2scalar(Fr, [op0, op1, op2, op3, op4, op5, op6, op7]);
            const P2_256 = 2n ** 256n;
            const MASK_256 = P2_256 - 1n;
            const offset = safeFea2scalar(Fr, ctx.C);

            if (offset < 0 || offset >= 32) {
                throw new Error(`MemAlign out of range (${offset}) ${sourceRef}`);
            }

            if (!l.memAlignRD && l.memAlignWR && !l.memAlignWR8) {
                const m1 = safeFea2scalar(Fr, ctx.B);
                const w0 = safeFea2scalar(Fr, ctx.D);
                const w1 = safeFea2scalar(Fr, ctx.E);
                const _W0 = Scalar.bor(Scalar.band(m0, P2_256 - (2n ** (256n - (8n * offset)))), Scalar.shr(v, 8n * offset));
                const _W1 = Scalar.bor(Scalar.band(m1, MASK_256 >> (offset * 8n)),
                                       Scalar.band(Scalar.shl(v, (256n - (offset * 8n))), MASK_256));
                if (!Scalar.eq(w0, _W0) || !Scalar.eq(w1, _W1) ) {
                    throw new Error(`MemAlign w0,w1 invalid (0x${w0.toString(16)},0x${w1.toString(16)}) vs (0x${_W0.toString(16)},0x${_W1.toString(16)})`+
                                    `[m0:${m0.toString(16)}, m1:${m1.toString(16)}, v:${v.toString(16)}, offset:${offset}] ${sourceRef}`);
                }
                pols.memAlignRD[i] = 0n;
                pols.memAlignWR[i] = 1n;
                pols.memAlignWR8[i] = 0n;
                required.MemAlign.push({m0: m0, m1: m1, v: v, w0: w0, w1: w1, offset: offset, wr256: 1n, wr8: 0n});
            }
            else if (!l.memAlignRD && !l.memAlignWR && l.memAlignWR8) {
                const w0 = safeFea2scalar(Fr, ctx.D);
                const _W0 = Scalar.bor(Scalar.band(m0, Scalar.shr(byteMaskOn256, 8n * offset)), Scalar.shl(Scalar.band(v, 0xFF), 8n * (31n - offset)));
                if (!Scalar.eq(w0, _W0)) {
                    throw new Error(`MemAlign w0 invalid (0x${w0.toString(16)}) vs (0x${_W0.toString(16)})`+
                                    `[m0:${m0.toString(16)}, v:${v.toString(16)}, offset:${offset}] ${sourceRef}`);
                }
                pols.memAlignRD[i] = 0n;
                pols.memAlignWR[i] = 0n;
                pols.memAlignWR8[i] = 1n;
                required.MemAlign.push({m0: m0, m1: 0n, v: v, w0: w0, w1: 0n, offset: offset, wr256: 0n, wr8: 1n});
            } else if (l.memAlignRD && !l.memAlignWR && !l.memAlignWR8) {
                const m1 = safeFea2scalar(Fr, ctx.B);
                const leftV = Scalar.band(Scalar.shl(m0, offset * 8n), MASK_256);
                const rightV = Scalar.band(Scalar.shr(m1, 256n - (offset * 8n)), MASK_256 >> (256n - (offset * 8n)));
                const _V = Scalar.bor(leftV, rightV);
                if (!Scalar.eq(v, _V)) {
                    throw new Error(`MemAlign v invalid ${v.toString(16)} vs ${_V.toString(16)}:`+
                                    `[m0:${m0.toString(16)}, m1:${m1.toString(16)}, offset:${offset}] ${sourceRef}`);
                }
                pols.memAlignRD[i] = 1n;
                pols.memAlignWR[i] = 0n;
                pols.memAlignWR8[i] = 0n;
                required.MemAlign.push({m0: m0, m1: m1, v: v, w0: Fr.zero, w1: Fr.zero, offset: offset, wr256: 0n, wr8: 0n});
            } else {
                throw new Error(`Invalid operation (rd: ${l.memAlignRD} wr: ${l.memAlignWR}, wr8: ${l.memAlignWR8}) ${sourceRef}`);
            }
        } else {
            pols.memAlignRD[i] = 0n;
            pols.memAlignWR[i] = 0n;
            pols.memAlignWR8[i] = 0n;
        }

        if (l.repeat) {
            pols.repeat[i] = 1n;
        } else {
            pols.repeat[i] = 0n;
        }

        if (l.save) {
            const nrid = step;
            if (ctx.saved[nrid]) {
                throw new Error(`Save using a RID ${nrid} already used on ${sourceRef}. This RID is previously used on row ${ctx.saved[nrid].row} at ${ctx.saved[nrid].sourceRef} [nrid: ${nrid} rid:${pols.RID[i]}])`);
            }
            const data = {
                op: [op0, op1, op2, op3, op4,  op5, op6, op7],
                B: ctx.B,
                C: ctx.C,
                D: ctx.D,
                E: ctx.E,
                RCX: ctx.RCX,
                RR: ctx.RR,
                RID: ctx.RID,
                sourceRef,
                row: i 
            }
            ctx.saved[nrid] = data;
            pols.save[i] = 1n;            
        } else {
            pols.save[i] = 0n;
        }


    //////////
    // SET NEXT REGISTERS
    //////////
        const nexti = (i+1) % N;

            [pols.op0[i],
             pols.op1[i],
             pols.op2[i],
             pols.op3[i],
             pols.op4[i],
             pols.op5[i],
             pols.op6[i],
             pols.op7[i]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];

        if (l.setA == 1) {
            pols.setA[i]=1n;
            [pols.A0[nexti],
            pols.A1[nexti],
            pols.A2[nexti],
            pols.A3[nexti],
            pols.A4[nexti],
            pols.A5[nexti],
            pols.A6[nexti],
            pols.A7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setA[i]=0n;
            [pols.A0[nexti],
            pols.A1[nexti],
            pols.A2[nexti],
            pols.A3[nexti],
            pols.A4[nexti],
            pols.A5[nexti],
            pols.A6[nexti],
            pols.A7[nexti]
            ] = [
            pols.A0[i],
            pols.A1[i],
            pols.A2[i],
            pols.A3[i],
            pols.A4[i],
            pols.A5[i],
            pols.A6[i],
            pols.A7[i]
            ];

            // Set A register with input.from to process unsigned transactions
            if ((Number(ctx.zkPC) === rom.labels.checkAndSaveFrom) && config.unsigned){
                const feaFrom = scalar2fea(Fr, input.from);
                [pols.A0[nexti],
                pols.A1[nexti],
                pols.A2[nexti],
                pols.A3[nexti],
                pols.A4[nexti],
                pols.A5[nexti],
                pols.A6[nexti],
                pols.A7[nexti]
                ] = [feaFrom[0], feaFrom[1], feaFrom[2], feaFrom[3], feaFrom[4], feaFrom[5], feaFrom[6], feaFrom[7]];
            }
        }

        if (l.setB == 1) {
            pols.setB[i]=1n;
            [pols.B0[nexti],
            pols.B1[nexti],
            pols.B2[nexti],
            pols.B3[nexti],
            pols.B4[nexti],
            pols.B5[nexti],
            pols.B6[nexti],
            pols.B7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setB[i]=0n;
            if (l.restore) {
                [pols.B0[nexti], pols.B1[nexti], pols.B2[nexti], pols.B3[nexti], 
                 pols.B4[nexti], pols.B5[nexti], pols.B6[nexti], pols.B7[nexti]] = dataToRestore.B
            } else {
                [pols.B0[nexti],
                pols.B1[nexti],
                pols.B2[nexti],
                pols.B3[nexti],
                pols.B4[nexti],
                pols.B5[nexti],
                pols.B6[nexti],
                pols.B7[nexti]
                ] = [
                pols.B0[i],
                pols.B1[i],
                pols.B2[i],
                pols.B3[i],
                pols.B4[i],
                pols.B5[i],
                pols.B6[i],
                pols.B7[i]
                ];
            }
        }

        if (l.setC == 1) {
            pols.setC[i]=1n;
            [pols.C0[nexti],
            pols.C1[nexti],
            pols.C2[nexti],
            pols.C3[nexti],
            pols.C4[nexti],
            pols.C5[nexti],
            pols.C6[nexti],
            pols.C7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setC[i]=0n;
            if (l.restore) {
                [pols.C0[nexti], pols.C1[nexti], pols.C2[nexti], pols.C3[nexti], 
                 pols.C4[nexti], pols.C5[nexti], pols.C6[nexti], pols.C7[nexti]] = dataToRestore.C;
            } else {
                [pols.C0[nexti],
                pols.C1[nexti],
                pols.C2[nexti],
                pols.C3[nexti],
                pols.C4[nexti],
                pols.C5[nexti],
                pols.C6[nexti],
                pols.C7[nexti]
                ] = [
                pols.C0[i],
                pols.C1[i],
                pols.C2[i],
                pols.C3[i],
                pols.C4[i],
                pols.C5[i],
                pols.C6[i],
                pols.C7[i]
                ];

                // Set C register with input.l1InfoRoot to process unsigned transactions
                if ((Number(ctx.zkPC) === rom.labels.verifyMerkleProofEnd) && input.l1InfoTree.skipVerifyL1InfoRoot === true) {
                    const feaL1InfoRoot = scalar2fea(Fr, input.l1InfoRoot);
                    [pols.C0[nexti],
                        pols.C1[nexti],
                        pols.C2[nexti],
                        pols.C3[nexti],
                        pols.C4[nexti],
                        pols.C5[nexti],
                        pols.C6[nexti],
                        pols.C7[nexti],
                    ] = [
                        feaL1InfoRoot[0],
                        feaL1InfoRoot[1],
                        feaL1InfoRoot[2],
                        feaL1InfoRoot[3],
                        feaL1InfoRoot[4],
                        feaL1InfoRoot[5],
                        feaL1InfoRoot[6],
                        feaL1InfoRoot[7],
                    ];
                }
            }
        }
    
        if (l.setD == 1) {
            pols.setD[i]=1n;
            [pols.D0[nexti],
            pols.D1[nexti],
            pols.D2[nexti],
            pols.D3[nexti],
            pols.D4[nexti],
            pols.D5[nexti],
            pols.D6[nexti],
            pols.D7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setD[i]=0n;
            if (l.restore) {
                [pols.D0[nexti], pols.D1[nexti], pols.D2[nexti], pols.D3[nexti], 
                 pols.D4[nexti], pols.D5[nexti], pols.D6[nexti], pols.D7[nexti]] = dataToRestore.D;
            } else {
                [pols.D0[nexti],
                pols.D1[nexti],
                pols.D2[nexti],
                pols.D3[nexti],
                pols.D4[nexti],
                pols.D5[nexti],
                pols.D6[nexti],
                pols.D7[nexti]
                ] = [
                pols.D0[i],
                pols.D1[i],
                pols.D2[i],
                pols.D3[i],
                pols.D4[i],
                pols.D5[i],
                pols.D6[i],
                pols.D7[i]
                ];
            }
        }

        if (l.setE == 1) {
            pols.setE[i]=1n;
            [pols.E0[nexti],
            pols.E1[nexti],
            pols.E2[nexti],
            pols.E3[nexti],
            pols.E4[nexti],
            pols.E5[nexti],
            pols.E6[nexti],
            pols.E7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setE[i]=0n;
            if (l.restore) {
                [pols.E0[nexti], pols.E1[nexti], pols.E2[nexti], pols.E3[nexti], 
                 pols.E4[nexti], pols.E5[nexti], pols.E6[nexti], pols.E7[nexti]] = dataToRestore.E;
            } else {
                [pols.E0[nexti],
                pols.E1[nexti],
                pols.E2[nexti],
                pols.E3[nexti],
                pols.E4[nexti],
                pols.E5[nexti],
                pols.E6[nexti],
                pols.E7[nexti]
                ] = [
                pols.E0[i],
                pols.E1[i],
                pols.E2[i],
                pols.E3[i],
                pols.E4[i],
                pols.E5[i],
                pols.E6[i],
                pols.E7[i]
                ];
            }
        }

        if (l.setSR == 1) {
            pols.setSR[i]=1n;
            [pols.SR0[nexti],
             pols.SR1[nexti],
             pols.SR2[nexti],
             pols.SR3[nexti],
             pols.SR4[nexti],
             pols.SR5[nexti],
             pols.SR6[nexti],
             pols.SR7[nexti]
            ] = [op0, op1, op2, op3, op4, op5, op6, op7];
        } else {
            pols.setSR[i]=0n;
            [pols.SR0[nexti],
            pols.SR1[nexti],
            pols.SR2[nexti],
            pols.SR3[nexti],
            pols.SR4[nexti],
            pols.SR5[nexti],
            pols.SR6[nexti],
            pols.SR7[nexti]
            ] = [
            pols.SR0[i],
            pols.SR1[i],
            pols.SR2[i],
            pols.SR3[i],
            pols.SR4[i],
            pols.SR5[i],
            pols.SR6[i],
            pols.SR7[i]
            ];
        }

        if (l.setCTX == 1) {
            pols.setCTX[i]=1n;
            pols.CTX[nexti] = op0;
        } else {
            pols.setCTX[i]=0n;
            pols.CTX[nexti] = pols.CTX[i];
        }

        if (l.setSP == 1) {
            pols.setSP[i]=1n;
            pols.SP[nexti] = op0;
        } else {
            pols.setSP[i]=0n;
            pols.SP[nexti] = pols.SP[i] + BigInt((l.incStack || 0));
        }

        if (l.setPC == 1) {
            pols.setPC[i]=1n;
            pols.PC[nexti] = op0;
        } else {
            pols.setPC[i]=0n;
            pols.PC[nexti] = pols.PC[i];
        }

        if (l.setRR == 1) {
            pols.setRR[i]=1n;
            pols.RR[nexti] = op0;
        } else {
            pols.setRR[i]=0n;
            if (l.restore) {
                pols.RR[nexti] = dataToRestore.RR;
            } else {
                pols.RR[nexti] = l.call ? (ctx.zkPC + 1n) : pols.RR[i];
            }
        }

        if (!skipCounters && (l.arith)) {
            pols.cntArith[nexti] = pols.cntArith[i] + 1n;
        } else {
            pols.cntArith[nexti] = pols.cntArith[i];
        }

        if (!skipCounters && (l.bin == 1 || l.hashPDigest || l.sWR)) {
            pols.cntBinary[nexti] = pols.cntBinary[i] + 1n;
        } else {
            pols.cntBinary[nexti] = pols.cntBinary[i];
        }

        if (!skipCounters && (l.memAlignRD || l.memAlignWR || l.memAlignWR8)) {
            pols.cntMemAlign[nexti] = pols.cntMemAlign[i] + 1n;
        } else {
            pols.cntMemAlign[nexti] = pols.cntMemAlign[i];
        }

        if (l.setRCX == 1) {
            pols.setRCX[i] = 1n;
            pols.RCX[nexti] = op0;
        } else {
            pols.setRCX[i] = 0n;
            if (!Fr.isZero(pols.RCX[i]) && l.repeat == 1) {
                pols.RCX[nexti] = Fr.add(pols.RCX[i], Fr.negone);
            } else if (l.restore) {
                pols.RCX[nexti] = dataToRestore.RCX;
            } else {
                pols.RCX[nexti] = pols.RCX[i];
            }
        }

        if (Fr.isZero(pols.RCX[nexti])) {
            pols.RCXInv[nexti] = 0n;
        } else {
            if (!Fr.eq(previousRCX,pols.RCX[nexti])) {
                previousRCX = pols.RCX[nexti];
                previousRCXInv = Fr.inv(Fr.e(previousRCX));
            }
            pols.RCXInv[nexti] = previousRCXInv;
        }

        pols.JMP[i] = 0n;
        pols.JMPN[i] = 0n;
        pols.JMPC[i] = 0n;
        pols.JMPZ[i] = 0n;
        pols.return[i] = 0n;
        pols.call[i] = l.call ? 1n : 0n;

        pols.jmpAddr[i] = l.jmpAddr ? BigInt(l.jmpAddr) : 0n;
        pols.jmpUseAddrRel[i] = l.jmpUseAddrRel ? 1n: 0n;

        const finalJmpAddr = l.jmpAddr + (l.jmpUseAddrRel ? addrRel : 0);
        const nextNoJmpZkPC = pols.zkPC[i] + ((l.repeat && !Fr.isZero(ctx.RCX)) ? 0n:1n);

        pols.elseAddr[i] = l.elseAddr ? BigInt(l.elseAddr) : 0n;
        pols.elseUseAddrRel[i] = l.elseUseAddrRel ? 1n: 0n;

        let elseAddr = (l.elseAddr ? BigInt(l.elseAddr) : 0n) +  (l.elseUseAddrRel ? BigInt(addrRel) : 0n);
        // modify JMP 'elseAddr' to continue execution in case of an unsigned transaction
        if (config.unsigned && l.elseAddrLabel === 'invalidIntrinsicTxSenderCode') {
            elseAddr = BigInt(finalJmpAddr);
        }

        if (l.free0IsByte) {
            if (ctx.FREE0 < 0n || ctx.FREE0 > 255n) {
                throw new Error(`FREE0 must be a byte, but has value ${ctx.FREE0} at ${sourceRef}`);
            }
            let value = ctx.FREE0;
            for (let index = 0; index < 8; ++index) {
                pols.hJmpnCondValueBit[index][i] = value & 0x01n;
                value = value >> 1n;
            }
            pols.hJmpnCondValueBit[8][i] = 0n;
            pols.isNeg[i] = 0n;
            pols.lJmpnCondValue[i] = 0n;
            pols.free0IsByte[i] = 1n;
        } else {
            pols.free0IsByte[i] = 0n;
        }

        if (l.JMPN) {
            if (l.free0IsByte) {
                throw new Error(`JMPN and F_BYTE must not be used in same row ${sourceRef}`);
            }
            const o = Fr.toObject(op0);
            // Calculate reserved counters
            // ctx.helpers.CounterControls.checkLabel(l.jmpAddrLabel, o);
            const counterControl = counterControls[l.jmpAddrLabel] ?? false;
            if (counterControl !== false && counterControl.limit !== false) {
                const reserv = counterControl.limit - (o < FrFirst32Negative ? o : o - (FrFirst32Negative + 0xFFFFFFFFn));
                if (typeof counterControl.reserved === 'undefined' || counterControl.reserved < reserv) {
                    counterControl.reserved = reserv;
                    counterControl.sourceRef = sourceRef;
                }
            }

            let jmpnCondValue = o;
            if (o > 0 && o >= FrFirst32Negative) {
                pols.isNeg[i]=1n;
                jmpnCondValue = Fr.toObject(Fr.e(jmpnCondValue + 2n**32n));
                pols.zkPC[nexti] = BigInt(finalJmpAddr);
            } else if (o >= 0 && o <= FrLast32Positive) {
                pols.isNeg[i]=0n;
                pols.zkPC[nexti] = elseAddr;
            } else {
                throw new Error(`On JMPN value ${o} not a valid 32bit value ${sourceRef}`);
            }
            pols.lJmpnCondValue[i] = jmpnCondValue & 0x7FFFFFn;
            jmpnCondValue = jmpnCondValue >> 23n;
            for (let index = 0; index < 9; ++index) {
                pols.hJmpnCondValueBit[index][i] = jmpnCondValue & 0x01n;
                jmpnCondValue = jmpnCondValue >> 1n;
            }
            pols.JMPN[i] = 1n;
        } else {
            if (!l.free0IsByte) {
                for (let index = 0; index < 9; ++index) {
                    pols.hJmpnCondValueBit[index][i] = 0n;
                }
                pols.isNeg[i] = 0n;
                pols.lJmpnCondValue[i] = 0n;
            }
            if (l.JMPC) {
                if (pols.carry[i]) {
                    pols.zkPC[nexti] = BigInt(finalJmpAddr);
                } else {
                    pols.zkPC[nexti] = elseAddr;
                }
                pols.JMPC[i] = 1n;
            } else if (l.JMPZ) {
                if (Fr.isZero(op0)) {
                    pols.zkPC[nexti] = BigInt(finalJmpAddr);
                } else {
                    pols.zkPC[nexti] = elseAddr;
                }
                pols.JMPZ[i] = 1n;
                const o = Fr.toObject(op0);
                if (o > 0 && o >= FrFirst32Negative) {
                    // console.log(`WARNING: JMPZ with negative value ${sourceRef}`);
                }
            } else if (l.JMP) {
                pols.zkPC[nexti] = BigInt(finalJmpAddr);
                pols.JMP[i] = 1n;
            } else if (l.return) {
                pols.zkPC[nexti] = pols.RR[nexti];
                pols.return[i] = 1n;
            } else {
                pols.zkPC[nexti] = nextNoJmpZkPC;
            }
        }

        if (l.setGAS == 1) {
            pols.setGAS[i]=1n;
            pols.GAS[nexti] = op0;
        } else {
            pols.setGAS[i]=0n;
            pols.GAS[nexti] = pols.GAS[i];
        }

        if (l.setHASHPOS == 1) {
            pols.setHASHPOS[i]=1n;
            pols.HASHPOS[nexti] = Fr.add(op0, Fr.e(incHashPos));
        } else {
            pols.setHASHPOS[i]=0n;
            pols.HASHPOS[nexti] = pols.HASHPOS[i] + BigInt( incHashPos);
        }

        if (l.setRID == 1) {
            pols.setRID[i]=1n;
            pols.RID[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setRID[i] = 0n;
            if (l.restore) {
                pols.RID[nexti] = dataToRestore.RID;
            } else if (l.save) {
                pols.RID[nexti] = BigInt(step);
            } else {
                pols.RID[nexti] = pols.RID[i];
            }
        }

        if (l.sRD || l.sWR || l.hashKDigest || l.hashPDigest || l.hashSDigest) {
            pols.incCounter[i] = Fr.e(incCounter);
        } else {
            pols.incCounter[i] = Fr.zero;
        }
        // Setting current value of counters to next step

        if (l.hashKDigest) {
            if (skipCounters) {
                pols.cntKeccakF[nexti] = pols.cntKeccakF[i];
            } else {
                pols.cntKeccakF[nexti] = pols.cntKeccakF[i] + BigInt(incCounter);
            }
        } else {
            pols.cntKeccakF[nexti] = pols.cntKeccakF[i];
        }

        if (sha256Enabled) {
            if (l.hashSDigest) {
                if (skipCounters) {
                    pols.cntSha256F[nexti] = pols.cntSha256F[i];
                } else {
                    pols.cntSha256F[nexti] = pols.cntSha256F[i] + BigInt(incCounter);
                }
            } else {
                pols.cntSha256F[nexti] = pols.cntSha256F[i];
            }
        }
        if (l.hashPDigest) {
            if (skipCounters) {
                pols.cntPaddingPG[nexti] = pols.cntPaddingPG[i];
            } else {
                pols.cntPaddingPG[nexti] = pols.cntPaddingPG[i] + BigInt(incCounter);
            }
        } else {
            pols.cntPaddingPG[nexti] = pols.cntPaddingPG[i];
        }

        if (l.sRD || l.sWR || l.hashPDigest) {
            if (skipCounters) {
                pols.cntPoseidonG[nexti] = pols.cntPoseidonG[i];
            } else {
                pols.cntPoseidonG[nexti] = pols.cntPoseidonG[i] + BigInt(incCounter);
            }
        } else {
            pols.cntPoseidonG[nexti] = pols.cntPoseidonG[i];
        }

        if (pols.zkPC[nexti] == (pols.zkPC[i] + 1n)) {
            pendingCmds = l.cmdAfter;
        }
        if (checkJmpZero && pols.zkPC[nexti] === 0n && nexti !== 0) {
            if (checkJmpZero === ErrorCheck) {
                throw new Error(`ERROR: Not final JMP to 0 (N=${N}) ${sourceRef}`);
            }
            console.log(`WARNING: Not final JMP to 0 (N=${N}) ${sourceRef}`);
        }
    }
    } catch (error) {
        if (!error.message.includes(sourceRef)) {
            error.message += ' '+sourceRef;
        }
        throw error;
    }

    if (config.stats) {
        statsTracer.saveStatsFile();
    }

    if (fastDebugExit && config.assertOutputs){
        ctx.helpers.Main.assertOutputs(ctx);
    }

    if (!(fastDebugExit || typeof config.stepsN === 'undefined')) {
        ctx.helpers.Main.checkFinalState(Fr, pols, ctx);
    }

    for (let i=0; i<ctx.hashK.length; i++) {
        if (typeof ctx.hashK[i] === 'undefined') {
            const nextAddr = Object.keys(ctx.hashK)[i];
            throw new Error(`Reading hashK(${i}) not defined, next defined was ${nextAddr} on ${ctx.hashK[nextAddr].sourceRef||''}`);
        }
        const h = {
            data: ctx.hashK[i].data,
            reads: [],
            digestCalled: ctx.hashK[i].digestCalled,
            lenCalled: ctx.hashK[i].lenCalled
        }
        let p= 0;
        while (p<ctx.hashK[i].data.length) {
            if (ctx.hashK[i].reads[p]) {
                h.reads.push(ctx.hashK[i].reads[p]);
                p += ctx.hashK[i].reads[p];
            } else {
                h.reads.push(1);
                p += 1;
            }
        }
        if (p!= ctx.hashK[i].data.length) {
            throw new Error(`Reading hashK(${i}) out of limits (${p} != ${ctx.hashK[i].data.length})`);
        }
        if (checkHashNoDigest && !ctx.hashK[i].digestCalled) {
            const msg = `Reading hashK(${i}) not call to hashKDigest, last access on ${ctx.hashK[i].sourceRef||''}`;
            if (checkHashNoDigest === ErrorCheck) {
                throw new Error('ERROR:'+msg);
            }
            console.log('WARNING:'+msg)
        }
        required.PaddingKK.push(h);
    }

    if (sha256Enabled) {
        for (let i=0; i<ctx.hashS.length; i++) {
            if (typeof ctx.hashS[i] === 'undefined') {
                const nextAddr = Object.keys(ctx.hashS)[i];
                throw new Error(`Reading hashS(${i}) not defined, next defined was ${nextAddr} on ${ctx.hashS[nextAddr].sourceRef||''}`);
            }
            const h = {
                data: ctx.hashS[i].data,
                reads: [],
                digestCalled: ctx.hashS[i].digestCalled,
                lenCalled: ctx.hashS[i].lenCalled
            }
            let p= 0;
            while (p<ctx.hashS[i].data.length) {
                if (ctx.hashS[i].reads[p]) {
                    h.reads.push(ctx.hashS[i].reads[p]);
                    p += ctx.hashS[i].reads[p];
                } else {
                    h.reads.push(1);
                    p += 1;
                }
            }
            if (p!= ctx.hashS[i].data.length) {
                throw new Error(`Reading hashS(${i}) out of limits (${p} != ${ctx.hashS[i].data.length})`);
            }
            if (checkHashNoDigest && !ctx.hashS[i].digestCalled) {
                const msg = `Reading hashS(${i}) not call to hashSDigest, last access on ${ctx.hashS[i].sourceRef||''}`;
                if (checkHashNoDigest === ErrorCheck) {
                    throw new Error('ERROR:'+msg);
                }
                console.log('WARNING:'+msg)
            }

            required.PaddingSha256.push(h);
        }
    }

    for (let i=0; i<ctx.hashP.length; i++) {
        if (typeof ctx.hashP[i] === 'undefined') {
            const nextAddr = Object.keys(ctx.hashP)[i];
            throw new Error(`Reading hashP(${i}) not defined, next defined was ${nextAddr} on ${ctx.hashP[nextAddr].sourceRef||''}`);
        }
        const h = {
            data: ctx.hashP[i].data,
            digestCalled: ctx.hashP[i].digestCalled,
            lenCalled: ctx.hashP[i].lenCalled,
            reads: []
        }
        let p= 0;
        while (p<ctx.hashP[i].data.length) {
            if (ctx.hashP[i].reads[p]) {
                h.reads.push(ctx.hashP[i].reads[p]);
                p += ctx.hashP[i].reads[p];
            } else {
                h.reads.push(1);
                p += 1;
            }
        }
        if (p!= ctx.hashP[i].data.length) {
            throw new Error(`Reading hashP(${i}) out of limits (${p} != ${ctx.hashP[i].data.length})`);
        }
        if (checkHashNoDigest && !ctx.hashP[i].digestCalled) {
            const msg = `Reading hashP(${i}) not call to hashPDigest, last access on ${ctx.hashP[i].sourceRef||''}`;
            if (checkHashNoDigest === ErrorCheck) {
                throw new Error('ERROR:'+msg);
            }
            console.log('WARNING:'+msg)
        }
        required.PaddingPG.push(h);
    }

    required.logs = ctx.outLogs;
    required.errors = nameRomErrors;
    required.counters = {
        cntArith: ctx.cntArith,
        cntBinary: ctx.cntBinary,
        cntKeccakF: ctx.cntKeccakF,
        cntSha256F: ctx.cntSha256F,
        cntMemAlign: ctx.cntMemAlign,
        cntPoseidonG: ctx.cntPoseidonG,
        cntPaddingPG: ctx.cntPaddingPG,
        cntSteps: ctx.step,
    }

    // ctx.helpers.CounterControls.updateWithCounters();
    // required.reservedCounters = ctx.helpers.CounterControls.getData();

    required.reservedCounters = counterControls;
    required.output = {
        newStateRoot: auxNewStateRoot,
        newAccInputHash: fea2String(Fr, ctx.D),
        newLocalExitRoot: fea2String(Fr, ctx.E),
        newNumBatch: ctx.PC,
    }

    if (fullTracer) {
        if (fullTracer.options.verbose.enable) {
            fullTracer.printReturn({
                outputs: required.output,
                counters: required.counters,
                logs: required.logs,
                errors: required.errors
            });
        }
    }

    return required;
}

function initCounterControls(counterControls, rom) {
    Object.values(counterControls).forEach(cc => {
        cc.limit = rom.constants[cc.limitConstant] ? BigInt(rom.constants[cc.limitConstant].value) : false;
        cc.reserved = false;
        cc.sourceRef = false});
}



async function eventsAsyncTracer(ctx, cmds) {
    for (let j = 0; j < cmds.length; j++) {
        const tag = cmds[j];
        if (tag.funcName == 'eventLog') {
            await fullTracer.handleAsyncEvent(ctx, cmds[j]);
        }
    }
}

async function printBatchL2Data(batchL2Data, getNameSelector) {
    console.log('/////////////////////////////');
    console.log('/////// BATCH L2 DATA ///////');
    console.log('/////////////////////////////\n');

    const txs = encodedStringToArray(batchL2Data);
    console.log('Number of transactions: ', txs.length);
    console.log('--------------------------');
    for (let i = 0; i < txs.length; i++) {
        const rawTx = txs[i];

        if (rawTx.startsWith(`0x${ConstantsCommon.TX_CHANGE_L2_BLOCK.toString(16).padStart(2, '0')}`)) {
            console.log(`Tx ${i} --> new Block L2`);
            const txDecoded = await decodeChangeL2BlockTx(rawTx);
            console.log(txDecoded);
        } else {
            const infoTx = decodeCustomRawTxProverMethod(rawTx);

            const digest = ethers.utils.keccak256(infoTx.rlpSignData);
            const from = ethers.utils.recoverAddress(digest, {
                r: infoTx.txDecoded.r,
                s: infoTx.txDecoded.s,
                v: infoTx.txDecoded.v,
            });

            infoTx.txDecoded.from = from;

            if (getNameSelector) {
                infoTx.txDecoded.selectorLink = `${getNameSelector}${infoTx.txDecoded.data.slice(0, 10)}`;
            }
            console.log(`Tx ${i} --> new Tx`);
            console.log(infoTx.txDecoded);
        }
        console.log('--------------------------');
    }

    console.log('/////////////////////////////');
    console.log('/////////////////////////////\n');
}

function evalCommands(ctx, cmds) {
    for (let j=0; j< cmds.length; j++) {
        evalCommand(ctx, cmds[j]);
    }
}

function evalCommand(ctx, tag) {
    if (tag.op == "number") {
        return eval_number(ctx, tag);
    } else if (tag.op == "declareVar") {
        return eval_declareVar(ctx, tag);
    } else if (tag.op == "setVar") {
        return eval_setVar(ctx, tag);
    } else if (tag.op == "getVar") {
        return eval_getVar(ctx, tag);
    } else if (tag.op == "getReg") {
        return eval_getReg(ctx, tag);
    } else if (tag.op == "functionCall") {
        return eval_functionCall(ctx, tag);
    } else if (tag.op == "add") {
        return eval_add(ctx, tag);
    } else if (tag.op == "sub") {
        return eval_sub(ctx, tag);
    } else if (tag.op == "neg") {
        return eval_neg(ctx, tag);
    } else if (tag.op == "mul") {
        return eval_mul(ctx, tag);
    } else if (tag.op == "div") {
        return eval_div(ctx, tag);
    } else if (tag.op == "mod") {
        return eval_mod(ctx, tag);
    } else if (tag.op == "or" || tag.op == "and" || tag.op == "gt" || tag.op == "ge" || tag.op == "lt" || tag.op == "le" ||
               tag.op == "eq" || tag.op == "ne" || tag.op == "not" ) {
        return eval_logical_operation(ctx, tag);
    } else if (tag.op == "bitand" || tag.op == "bitor" || tag.op == "bitxor" || tag.op == "bitnot"|| tag.op == "shl" || tag.op == "shr") {
        return eval_bit_operation(ctx, tag);
    } else if (tag.op == "if") {
        return eval_if(ctx, tag);
    } else if (tag.op == "getMemValue") {
        return eval_getMemValue(ctx, tag);
    } else {
        throw new Error(`Invalid operation ${tag.op} ${ctx.sourceRef}`);
    }
}

function eval_number(ctx, tag) {
    return Scalar.e(tag.num);
}


function eval_setVar(ctx, tag) {

    const varName = eval_left(ctx, tag.values[0]);

    if (typeof ctx.vars[varName] == "undefined") throw new Error(`Variable ${varName} not defined ${ctx.sourceRef}`);

    ctx.vars[varName] = evalCommand(ctx, tag.values[1]);
    return ctx.vars[varName];
}

function eval_left(ctx, tag) {
    if (tag.op == "declareVar") {
        eval_declareVar(ctx, tag);
        return tag.varName;
    } else if (tag.op == "getVar") {
        return tag.varName;
    } else {
        throw new Error(`Invalid left expression (${tag.op}) ${ctx.sourceRef}`);
    }
}

function eval_declareVar(ctx, tag) {
    // local variables, redeclared must start with _
    if (tag.varName[0] !== '_' && typeof ctx.vars[tag.varName] != "undefined") {
        throw new Error(`Variable ${tag.varName} already declared ${ctx.sourceRef}`);
    }
    ctx.vars[tag.varName] = Scalar.e(0);
    return ctx.vars[tag.varName];
}

function eval_getVar(ctx, tag) {
    if (typeof ctx.vars[tag.varName] == "undefined") throw new Error(`Variable ${tag.varName} not defined ${ctx.sourceRef}`);
    return ctx.vars[tag.varName];
}

function eval_getReg(ctx, tag) {
    if (tag.regName == "A") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.A) : safeFea2scalar(ctx.Fr, ctx.A);
    } else if (tag.regName == "B") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.B) : safeFea2scalar(ctx.Fr, ctx.B);
    } else if (tag.regName == "C") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.C) : safeFea2scalar(ctx.Fr, ctx.C);
    } else if (tag.regName == "D") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.D) : safeFea2scalar(ctx.Fr, ctx.D);
    } else if (tag.regName == "E") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.E) : safeFea2scalar(ctx.Fr, ctx.E);
    } else if (tag.regName == "SR") {
        return ctx.fullFe ? fea2scalar(ctx.Fr, ctx.SR) : safeFea2scalar(ctx.Fr, ctx.SR);
    } else if (tag.regName == "CTX") {
        return Scalar.e(ctx.CTX);
    } else if (tag.regName == "SP") {
        return Scalar.e(ctx.SP);
    } else if (tag.regName == "PC") {
        return Scalar.e(ctx.PC);
    } else if (tag.regName == "GAS") {
        return Scalar.e(ctx.GAS);
    } else if (tag.regName == "zkPC") {
        return Scalar.e(ctx.zkPC);
    } else if (tag.regName == "RR") {
        return Scalar.e(ctx.RR);
    } else if (tag.regName == "CNT_ARITH") {
        return Scalar.e(ctx.cntArith);
    } else if (tag.regName == "CNT_BINARY") {
        return Scalar.e(ctx.cntBinary);
    } else if (tag.regName == "CNT_KECCAK_F") {
        return Scalar.e(ctx.cntKeccakF);
    } else if (tag.regName == 'CNT_SHA256_F') {
        return Scalar.e(ctx.cntSha256F);
    } else if (tag.regName == "CNT_MEM_ALIGN") {
        return Scalar.e(ctx.cntMemAlign);
    } else if (tag.regName == "CNT_PADDING_PG") {
        return Scalar.e(ctx.cntPaddingPG);
    } else if (tag.regName == "CNT_POSEIDON_G") {
        return Scalar.e(ctx.cntPoseidonG);
    } else if (tag.regName == "STEP") {
        return Scalar.e(ctx.step);
    } else if (tag.regName == "HASHPOS") {
        return Scalar.e(ctx.HASHPOS);
    } else if (tag.regName == "RCX") {
        return Scalar.e(ctx.RCX);
    } else if (tag.regName == "RID") {
        return Scalar.e(ctx.RID);
    } else {
        throw new Error(`Invalid register ${tag.regName} ${ctx.sourceRef}`);
    }
}

function eval_add(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    const b = evalCommand(ctx, tag.values[1]);
    return Scalar.add(a,b);
}

function eval_sub(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    const b = evalCommand(ctx, tag.values[1]);
    return Scalar.sub(a,b);
}

function eval_neg(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    return Scalar.neg(a);
}

function eval_mul(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    const b = evalCommand(ctx, tag.values[1]);
    return Scalar.mul(a,b);
}

function eval_div(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    const b = evalCommand(ctx, tag.values[1]);
    return Scalar.div(a,b);
}

function eval_mod(ctx, tag) {
    const a = evalCommand(ctx, tag.values[0]);
    const b = evalCommand(ctx, tag.values[1]);
    return Scalar.mod(a,b);
}

function eval_bit_operation(ctx, tag)
{
    const a = evalCommand(ctx, tag.values[0]);
    if (tag.op == "bitnot") {
        return ~a;
    }
    const b = evalCommand(ctx, tag.values[1]);
    switch(tag.op) {
        case 'bitor':    return Scalar.bor(a,b);
        case 'bitand':   return Scalar.band(a,b);
        case 'bitxor':   return Scalar.bxor(a,b);
        case 'shl':      return Scalar.shl(a,b);
        case 'shr':      return Scalar.shr(a,b);
    }
    throw new Error(`bit operation ${tag.op} not defined ${ctx.sourceRef}`);
}

function eval_if(ctx, tag)
{
    const a = evalCommand(ctx, tag.values[0]);
    return evalCommand(ctx, tag.values[ a ? 1:2]);
}

function eval_logical_operation(ctx, tag)
{
    const a = evalCommand(ctx, tag.values[0]);
    if (tag.op === "not") {
        return (a)  ? 0 : 1;
    }
    const b = evalCommand(ctx, tag.values[1]);
    switch(tag.op) {
        case 'or':      return (a || b) ? 1 : 0;
        case 'and':     return (a && b) ? 1 : 0;
        case 'eq':      return (a == b) ? 1 : 0;
        case 'ne':      return (a != b) ? 1 : 0;
        case 'gt':      return (a > b)  ? 1 : 0;
        case 'ge':      return (a >= b) ? 1 : 0;
        case 'lt':      return (a < b)  ? 1 : 0;
        case 'le':      return (a <= b)  ? 1 : 0;
    }
    throw new Error(`logical operation ${tag.op} not defined ${ctx.sourceRef}`);
}

function eval_getMemValue(ctx, tag) {
    let addr = tag.offset;

    if (tag.useCTX === 1) {
        addr += Number(ctx.CTX) * 0x40000;
    }

    if (ctx.fullFe) {
        return fea2scalar(ctx.Fr, ctx.mem[addr]);
    }

    return safeFea2scalar(ctx.Fr, ctx.mem[addr]);
}

function eval_functionCall(ctx, tag) {
    const res = ctx.helpers.callDefault('eval_'+ tag.funcName, [ctx, tag], null);
    if (res !== null) {
        return res;
    }

    if (tag.funcName == 'getSequencerAddr') {
        return eval_getSequencerAddr(ctx, tag);
    } if (tag.funcName == 'getForcedBlockHashL1') {
        return eval_getForcedBlockHashL1(ctx, tag);
    } if (tag.funcName == 'getL1InfoGER') {
        return eval_getL1InfoGER(ctx, tag);
    } if (tag.funcName == 'getL1InfoBlockHash') {
        return eval_getL1InfoBlockHash(ctx, tag);
    } if (tag.funcName == 'getL1InfoTimestamp') {
        return eval_getL1InfoTimestamp(ctx, tag);
    } else if (tag.funcName == "getTxs") {
        return eval_getTxs(ctx, tag);
    } else if (tag.funcName == "getTxsLen") {
        return eval_getTxsLen(ctx, tag);
    } else if (tag.funcName == "getSmtProof") {
        return eval_getSmtProof(ctx, tag);
    } else if (tag.funcName == "eventLog") {
        return eval_eventLog(ctx, tag);
    } else if (tag.funcName == "cond") {
        return eval_cond(ctx, tag);
    } else if (tag.funcName == "inverseFpEc") {
        return eval_inverseFpEc(ctx, tag);
    } else if (tag.funcName == "inverseFnEc") {
        return eval_inverseFnEc(ctx, tag);
    } else if (tag.funcName == "sqrtFpEcParity") {
        return eval_sqrtFpEcParity(ctx, tag);
    } else if (tag.funcName == "dumpRegs") {
        return eval_dumpRegs(ctx, tag);
    } else if (tag.funcName == "dump") {
        return eval_dump(ctx, tag);
    } else if (tag.funcName == "dumphex") {
        return eval_dumphex(ctx, tag);
    } else if (tag.funcName == "xAddPointEc") {
        return eval_xAddPointEc(ctx, tag);
    } else if (tag.funcName == "yAddPointEc") {
        return eval_yAddPointEc(ctx, tag);
    } else if (tag.funcName == "xDblPointEc") {
        return eval_xDblPointEc(ctx, tag);
    } else if (tag.funcName == "yDblPointEc") {
        return eval_yDblPointEc(ctx, tag);
    } else if (tag.funcName == "beforeLast") {
        return eval_beforeLast(ctx, tag)
    } else if (tag.funcName.includes("bitwise")) {
        return eval_bitwise(ctx, tag);
    } else if (tag.funcName.includes("comp") && tag.funcName.split('_')[0] === "comp") {
        return eval_comp(ctx, tag);
    } else if (tag.funcName == "loadScalar") {
        return eval_loadScalar(ctx, tag);
    } else if (tag.funcName == "log") {
        return eval_log(ctx, tag);
    } else if (tag.funcName == "exp") {
        return eval_exp(ctx, tag)
    } else if (tag.funcName == "storeLog") {
        return eval_storeLog(ctx, tag)
    } else if (tag.funcName.includes("precompiled") && tag.funcName.split('_')[0] === "precompiled") {
        return eval_precompiled(ctx, tag);
    } else if (tag.funcName == "break") {
        return eval_breakPoint(ctx, tag);
    } else if (tag.funcName == "memAlignWR_W0") {
        return eval_memAlignWR_W0(ctx, tag);
    } else if (tag.funcName == "memAlignWR_W1") {
        return eval_memAlignWR_W1(ctx, tag);
    } else if (tag.funcName == "memAlignWR8_W0") {
        return eval_memAlignWR8_W0(ctx, tag);
    } else if (tag.funcName == "ARITH_BN254_MULFP2_X") {
        return eval_ARITH_BN254_MULFP2_X(ctx, tag);
    } else if (tag.funcName == "ARITH_BN254_MULFP2_Y") {
        return eval_ARITH_BN254_MULFP2_Y(ctx, tag);
    } else if (tag.funcName == "ARITH_BN254_ADDFP2") {
        return eval_ARITH_BN254_ADDFP2(ctx, tag);
    } else if (tag.funcName == "ARITH_BN254_SUBFP2") {
        return eval_ARITH_BN254_SUBFP2(ctx, tag);
    }
    throw new Error(`function ${tag.funcName} not defined ${ctx.sourceRef}`);
}

function eval_getSequencerAddr(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`)
    return scalar2fea(ctx.Fr, Scalar.e(ctx.input.sequencerAddr));
}

function eval_getTxs(ctx, tag) {
    if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    const txs = ctx.input.batchL2Data;
    const offset = Number(evalCommand(ctx,tag.params[0]));
    const len = Number(evalCommand(ctx,tag.params[1]));
    let d = "0x" + txs.slice(2+offset*2, 2+offset*2 + len*2);
    if (d.length == 2) d = d+'0';
    return scalar2fea(ctx.Fr, Scalar.e(d));
}

function eval_getTxsLen(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    return [ctx.Fr.e((ctx.input.batchL2Data.length-2) / 2), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_getSmtProof(ctx, tag) {
    if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

    const index = Number(evalCommand(ctx, tag.params[0]));
    const level = Number(evalCommand(ctx, tag.params[1]));

    const leafValue = ctx.input.l1InfoTree[index].smtProof[level];

    return scalar2fea(ctx.Fr, Scalar.e(leafValue));
}

function eval_getL1InfoGER(ctx, tag) {
    if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

    const indexL1InfoTree = evalCommand(ctx, tag.params[0]);
    const gerL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].globalExitRoot;

    return scalar2fea(ctx.Fr, Scalar.e(gerL1InfoTree));
}

function eval_getL1InfoBlockHash(ctx, tag) {
    if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

    const indexL1InfoTree = evalCommand(ctx, tag.params[0]);
    const blockHashL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].blockHash;

    return scalar2fea(ctx.Fr, Scalar.e(blockHashL1InfoTree));
}

function eval_getL1InfoTimestamp(ctx, tag) {
    if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

    const indexL1InfoTree = evalCommand(ctx, tag.params[0]);
    const timestampL1InfoTree = ctx.input.l1InfoTree[indexL1InfoTree].timestamp;

    return scalar2fea(ctx.Fr, Scalar.e(timestampL1InfoTree));
}

function eval_getForcedBlockHashL1(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);

    return scalar2fea(ctx.Fr, Scalar.e(ctx.input.forcedData.blockHashL1));
}

function eval_eventLog(ctx, tag) {
    if (tag.params.length < 1) throw new Error(`Invalid number of parameters (1 > ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    if (fullTracer && !ctx.config.blob) {
        // handle full-tracer events
        fullTracer.handleEvent(ctx, tag);
    } else if (fullTracer && ctx.config.blob) {
        ctx.helpers.FtBlob.handleEvent(ctx,tag)
    }
    if (debug && tag.params[0].varName == 'onError') {
        nameRomErrors.push(tag.params[1].varName);
        console.log(`Error triggered zkrom: ${tag.params[1].varName}\nsource: ${ctx.sourceRef}`);
    }
}

function eval_cond(ctx, tag) {
    if (tag.params.length != 1) throw new Error(`Invalid number of parameters (1 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    const result = Number(evalCommand(ctx,tag.params[0]));
    if (result) {
        return [ctx.Fr.e(-1), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }
    return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_exp(ctx, tag) {
    if (tag.params.length != 2) throw new Error(`Invalid number of parameters (2 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`)
    const a = evalCommand(ctx, tag.params[0]);
    const b = evalCommand(ctx, tag.params[1])
    return scalar2fea(ctx.Fr, Scalar.exp(a, b));;
}

function eval_bitwise(ctx, tag) {
    const func = tag.funcName.split('_')[1];
    const a = evalCommand(ctx, tag.params[0]);
    let b;

    switch (func) {
        case 'and':
            checkParams(ctx, tag, 2);
            b = evalCommand(ctx, tag.params[1]);
            return Scalar.band(a, b);
        case 'or':
            checkParams(ctx, tag, 2);
            b = evalCommand(ctx, tag.params[1]);
            return Scalar.bor(a, b);
        case 'xor':
            checkParams(ctx, tag, 2);
            b = evalCommand(ctx, tag.params[1]);
            return Scalar.bxor(a, b);
        case 'not':
            checkParams(ctx, tag, 1);
            return Scalar.bxor(a, Mask256);
        default:
            throw new Error(`Invalid bitwise operation ${func} (${tag.funcName}) ${ctx.sourceRef}`)
    }
}

function eval_beforeLast(ctx) {
    if (ctx.step >= ctx.stepsN-2) {
        return [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
    } else {
        return [ctx.Fr.negone, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
    }
}

function eval_comp(ctx, tag){
    checkParams(ctx, tag, 2);

    const func = tag.funcName.split('_')[1];
    const a = evalCommand(ctx,tag.params[0]);
    const b = evalCommand(ctx,tag.params[1]);

    switch (func){
        case 'lt':
            return Scalar.lt(a, b) ? 1 : 0;
        case 'gt':
            return Scalar.gt(a, b) ? 1 : 0;
        case 'eq':
            return Scalar.eq(a, b) ? 1 : 0;
        default:
            throw new Error(`Invalid bitwise operation ${func} (${tag.funcName}) ${ctx.sourceRef}`)
    }
}

function eval_loadScalar(ctx, tag){
    checkParams(ctx, tag, 1);
    return evalCommand(ctx,tag.params[0]);
}

function eval_storeLog(ctx, tag){
    checkParams(ctx, tag, 3);

    const indexLog = evalCommand(ctx, tag.params[0]);
    const isTopic = evalCommand(ctx, tag.params[1]);
    const data = evalCommand(ctx, tag.params[2]);

    if (typeof ctx.outLogs[indexLog] === "undefined"){
        ctx.outLogs[indexLog] = {
            data: [],
            topics: []
        }
    }

    if (isTopic) {
        ctx.outLogs[indexLog].topics.push(data.toString(16));
    } else {
        ctx.outLogs[indexLog].data.push(data.toString(16));
    }
    if (fullTracer)
        fullTracer.handleEvent(ctx, tag);
}

function eval_log(ctx, tag) {
    const frLog = ctx[tag.params[0].regName];
    const label = typeof tag.params[1] === "undefined" ? "notset" : tag.params[1].varName;
    if(typeof(frLog) == "number") {
        console.log(frLog)
    } else {
        let scalarLog;
        let hexLog;
        if (tag.params[0].regName !== "HASHPOS" && tag.params[0].regName !== "GAS"){
            scalarLog = safeFea2scalar(ctx.Fr, frLog);
            hexLog = `0x${scalarLog.toString(16)}`;
        } else {
            scalarLog = Scalar.e(frLog);
            hexLog = `0x${scalarLog.toString(16)}`;
        }

        console.log(`Log regname ${tag.params[0].regName} ${ctx.sourceRef}`);
        if (label !== "notset")
            console.log("       Label: ", label);
        console.log("       Scalar: ", scalarLog);
        console.log("       Hex:    ", hexLog);
        console.log("--------------------------");
    }
    return scalar2fea(ctx.Fr, Scalar.e(0));
}

function eval_breakPoint(ctx, tag) {
    console.log(`Breakpoint: ${ctx.sourceRef}`);
    return scalar2fea(ctx.Fr, Scalar.e(0));
}

// Helpers MemAlign

function eval_memAlignWR_W0(ctx, tag) {
    // parameters: M0, value, offset
    const m0 = evalCommand(ctx, tag.params[0]);
    const value = evalCommand(ctx, tag.params[1]);
    const offset = evalCommand(ctx, tag.params[2]);

    return scalar2fea(ctx.Fr, Scalar.bor(  Scalar.band(m0, Scalar.shl(Mask256, (32n - offset) * 8n)),
                        Scalar.band(Mask256, Scalar.shr(value, offset * 8n))));
}

function eval_memAlignWR_W1(ctx, tag) {
    // parameters: M1, value, offset
    const m1 = evalCommand(ctx, tag.params[0]);
    const value = evalCommand(ctx, tag.params[1]);
    const offset = evalCommand(ctx, tag.params[2]);

    return scalar2fea(ctx.Fr, Scalar.bor(  Scalar.band(m1, Scalar.shr(Mask256, offset * 8n)),
                        Scalar.band(Mask256, Scalar.shl(value, (32n - offset) * 8n))));
}

function eval_memAlignWR8_W0(ctx, tag) {
    // parameters: M0, value, offset
    const m0 = evalCommand(ctx, tag.params[0]);
    const value = evalCommand(ctx, tag.params[1]);
    const offset = evalCommand(ctx, tag.params[2]);
    const bits = (31n - offset) * 8n;

    return scalar2fea(ctx.Fr, Scalar.bor(  Scalar.band(m0, Scalar.sub(Mask256, Scalar.shl(0xFFn, bits))),
                        Scalar.shl(Scalar.band(0xFFn, value), bits)));
}

function checkParams(ctx, tag, expectedParams){
    if (tag.params.length != expectedParams) throw new Error(`Invalid number of parameters (${expectedParams} != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
}

function eval_dumpRegs(ctx, tag) {

    console.log(`dumpRegs ${ctx.fileName}:${ctx.line}`);

    if (ctx.fullFe) {
        console.log(['A', fea2scalar(ctx.Fr, ctx.A)]);
        console.log(['B', fea2scalar(ctx.Fr, ctx.B)]);
        console.log(['C', fea2scalar(ctx.Fr, ctx.C)]);
        console.log(['D', fea2scalar(ctx.Fr, ctx.D)]);
        console.log(['E', fea2scalar(ctx.Fr, ctx.E)]);
    } else {
        console.log(['A', safeFea2scalar(ctx.Fr, ctx.A)]);
        console.log(['B', safeFea2scalar(ctx.Fr, ctx.B)]);
        console.log(['C', safeFea2scalar(ctx.Fr, ctx.C)]);
        console.log(['D', safeFea2scalar(ctx.Fr, ctx.D)]);
        console.log(['E', safeFea2scalar(ctx.Fr, ctx.E)]);
    }

    return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_dump(ctx, tag) {
    console.log("\x1b[38;2;175;175;255mDUMP on " + ctx.fileName + ":" + ctx.line+"\x1b[0m");

    tag.params.forEach((value) => {
        let name = value.varName || value.paramName || value.regName || value.offsetLabel;
        if (typeof name == 'undefined' && value.path) {
            name = value.path.join('.');
        }
        console.log("\x1b[35m"+ name +"\x1b[0;35m: "+evalCommand(ctx, value)+"\x1b[0m");
    });

    return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_dumphex(ctx, tag) {
    console.log("\x1b[38;2;175;175;255mDUMP on " + ctx.fileName + ":" + ctx.line+"\x1b[0m");

    tag.params.forEach((value) => {
        let name = value.varName || value.paramName || value.regName;
        if (typeof name == 'undefined' && value.path) {
            name = value.path.join('.');
        }
        console.log("\x1b[35m"+ name +"\x1b[0;35m: 0x"+evalCommand(ctx, value).toString(16)+"\x1b[0m");
    });

    return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_inverseFpEc(ctx, tag) {
    const a = ctx.Fec.e(evalCommand(ctx, tag.params[0]));
    if (ctx.Fec.isZero(a)) {
        throw new Error(`inverseFpEc: Division by zero ${ctx.sourceRef}`);
    }
    return ctx.Fec.inv(a);
}

function eval_inverseFnEc(ctx, tag) {
    const a = ctx.Fnec.e(evalCommand(ctx, tag.params[0]));
    if (ctx.Fnec.isZero(a)) {
        throw new Error(`inverseFpEc: Division by zero ${ctx.sourceRef}`);
    }
    return ctx.Fnec.inv(a);
}

function eval_sqrtFpEcParity(ctx, tag) {
    const a = evalCommand(ctx, tag.params[0]);
    const parity = evalCommand(ctx, tag.params[1]);
    const r = ctx.Fec.sqrt(a);
    if (r === null) {
        return 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
    }
    if ((r & 0x01n) === parity)  {
        return r;
    }
    return ctx.Fec.neg(r);
}

function eval_xAddPointEc(ctx, tag) {
    return eval_AddPointEc(ctx, tag, false)[0];
}

function eval_yAddPointEc(ctx, tag) {
    return eval_AddPointEc(ctx, tag, false)[1];
}

function eval_xDblPointEc(ctx, tag) {
    return eval_AddPointEc(ctx, tag, true)[0];
}

function eval_yDblPointEc(ctx, tag) {
    return eval_AddPointEc(ctx, tag, true)[1];
}

function eval_AddPointEc(ctx, tag, dbl)
{
    const x1 = ctx.Fec.e(evalCommand(ctx, tag.params[0]));
    const y1 = ctx.Fec.e(evalCommand(ctx, tag.params[1]));
    const x2 = ctx.Fec.e(evalCommand(ctx, tag.params[dbl ? 0 : 2]));
    const y2 = ctx.Fec.e(evalCommand(ctx, tag.params[dbl ? 1 : 3]));

    let s;
    if (dbl) {
        // Division by zero must be managed by ROM before call ARITH
        const divisor = ctx.Fec.add(y1, y1)
        if (ctx.Fec.isZero(divisor)) {
            throw new Error(`Invalid AddPointEc (divisionByZero) ${ctx.sourceRef}`);
        }
        s = ctx.Fec.div(ctx.Fec.mul(3n, ctx.Fec.mul(x1, x1)), divisor);
    }
    else {
        const deltaX = ctx.Fec.sub(x2, x1)
        if (ctx.Fec.isZero(deltaX)) {
            throw new Error(`Invalid AddPointEc (divisionByZero) ${ctx.sourceRef}`);
        }
        s = ctx.Fec.div(ctx.Fec.sub(y2, y1), deltaX );
    }

    const x3 = ctx.Fec.sub(ctx.Fec.mul(s, s), ctx.Fec.add(x1, x2));
    const y3 = ctx.Fec.sub(ctx.Fec.mul(s, ctx.Fec.sub(x1,x3)), y1);

    return [x3, y3];
}

function eval_ARITH_BN254_MULFP2_X(ctx, tag)
{
    // const ctxFullFe = {...ctx, fullFe: true};
    const x1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[0]));
    const y1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[1]));
    const x2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[2]));
    const y2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[3]));

    return ctx.FpBN254.sub(ctx.FpBN254.mul(x1,x2), ctx.FpBN254.mul(y1, y2));
}

function eval_ARITH_BN254_MULFP2_Y(ctx, tag)
{
    // const ctxFullFe = {...ctx, fullFe: true};
    const x1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[0]));
    const y1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[1]));
    const x2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[2]));
    const y2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[3]));

    return ctx.FpBN254.add(ctx.FpBN254.mul(x1,y2), ctx.FpBN254.mul(x2, y1));
}

function eval_ARITH_BN254_ADDFP2(ctx, tag)
{
    // const ctxFullFe = {...ctx, fullFe: true};
    const x1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[0]));
    const x2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[1]));

    return ctx.FpBN254.add(x1,x2);
}

function eval_ARITH_BN254_SUBFP2(ctx, tag)
{
    // const ctxFullFe = {...ctx, fullFe: true};
    const x1 = ctx.FpBN254.e(evalCommand(ctx, tag.params[0]));
    const x2 = ctx.FpBN254.e(evalCommand(ctx, tag.params[1]));

    return ctx.FpBN254.sub(x1,x2);
}

function printRegs(Fr, ctx) {
    printReg8(Fr, "A", ctx.A);
    printReg8(Fr, "B", ctx.B);
    printReg8(Fr, "C", ctx.C);
    printReg8(Fr, "D", ctx.D);
    printReg8(Fr, "E", ctx.E);
    printReg4(Fr,  "SR", ctx.SR);
    printReg1("CTX", ctx.CTX);
    printReg1("SP", ctx.SP);
    printReg1("PC", ctx.PC);
    printReg1("GAS", ctx.GAS);
    printReg1("zkPC", ctx.zkPC);
    printReg1("RR", ctx.RR);
    printReg1("STEP", ctx.step, false, true);
    console.log(ctx.fileName + ":" + ctx.line);
}

function printReg8(Fr, name, V) {
    printReg(Fr, name+"7", V[7], true);
    printReg(Fr, name+"6", V[6], true);
    printReg(Fr, name+"5", V[5], true);
    printReg(Fr, name+"4", V[4], true);
    printReg(Fr, name+"3", V[3], true);
    printReg(Fr, name+"2", V[2], true);
    printReg(Fr, name+"1", V[1], true);
    printReg(Fr, name+"0", V[0]);
    console.log("");
}


function printReg4(Fr, name, V) {
    printReg(Fr, name+"3", V[3], true);
    printReg(Fr, name+"2", V[2], true);
    printReg(Fr, name+"1", V[1], true);
    printReg(Fr, name+"0", V[0]);
    console.log("");
}

function printReg(Fr, name, V, h, short) {
    const maxInt = Scalar.e("0x7FFFFFFF");
    const minInt = Scalar.sub(Fr.p, Scalar.e("0x80000000"));

    let S;
    S = name.padEnd(6) +": ";

    let S2;
    if (!h) {
        const o = Fr.toObject(V);
        if (Scalar.gt(o, maxInt)) {
            const on = Scalar.sub(Fr.p, o);
            if (Scalar.gt(o, minInt)) {
                S2 = "-" + Scalar.toString(on);
            } else {
                S2 = "LONG";
            }
        } else {
            S2 = Scalar.toString(o);
        }
    } else {
        S2 = "";
    }

    S += S2.padStart(8, " ");

    if (!short) {
        const o = Fr.toObject(V);
        S+= "   " + o.toString(16).padStart(32, "0");
    }

    console.log(S);


}


function printReg1(name, V, h, short) {
    let S;
    S = name.padEnd(6) +": ";

    let S2 = V.toString();

    S += S2.padStart(16, " ");

    console.log(S);
}

function sr8to4(F, SR) {
    const r=[];
    r[0] = F.add(SR[0], F.mul(SR[1], F.e("0x100000000")));
    r[1] = F.add(SR[2], F.mul(SR[3], F.e("0x100000000")));
    r[2] = F.add(SR[4], F.mul(SR[5], F.e("0x100000000")));
    r[3] = F.add(SR[6], F.mul(SR[7], F.e("0x100000000")));
    return r;
}

function sr4to8(F, r) {
    const sr=[];
    sr[0] = r[0] & 0xFFFFFFFFn;
    sr[1] = r[0] >> 32n;
    sr[2] = r[1] & 0xFFFFFFFFn;
    sr[3] = r[1] >> 32n;
    sr[4] = r[2] & 0xFFFFFFFFn;
    sr[5] = r[2] >> 32n;
    sr[6] = r[3] & 0xFFFFFFFFn;
    sr[7] = r[3] >> 32n;
    return sr;
}

function safeFea2scalar(Fr, arr) {
    for (let index = 0; index < 8; ++index) {
        const value = Fr.toObject(arr[index]);
        if (value > 0xFFFFFFFFn) {
            throw new Error(`Invalid value 0x${value.toString(16)} to convert to scalar on index ${index}: ${sourceRef}`);
        }
    }
    return fea2scalar(Fr, arr);
}

/**
* Computes the comparison of 256-bit values a,b by dividing them in 4 chunks of 64 bits
* and comparing the chunks one-to-one.
* lt4 = (a[0] < b[0]) && (a[1] < b[1]) && (a[2] < b[2]) && (a[3] < b[3]).
* @param a - Scalar
* @param b - Scalar
* @returns 1 if ALL chunks of a are less than those of b, 0 otherwise.
*/
function lt4(a, b) {
    const MASK64 = 0xFFFFFFFFFFFFFFFFn;
    for (let index = 0; index < 4; ++index) {
        if (Scalar.lt(Scalar.band(Scalar.shr(a, 64 * index), MASK64), Scalar.band(Scalar.shr(b, 64 * index), MASK64)) == false) {
            return 0n;
        }
    }
    return 1n;
}