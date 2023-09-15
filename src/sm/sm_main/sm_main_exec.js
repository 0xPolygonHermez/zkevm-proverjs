const path = require("path");
const { ethers } = require("ethers");
const { Scalar, F1Field } = require("ffjavascript");

const {
//    scalar2fea,
//    fea2scalar,
//    fe2n,
//    scalar2h4,
    stringToH4,
    nodeIsEq,
    hashContractBytecode,
//    fea2String
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const SMT = require("@0xpolygonhermez/zkevm-commonjs").SMT;
const Database = require("@0xpolygonhermez/zkevm-commonjs").Database;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;
const { byteArray2HexString, hexString2byteArray } = require("@0xpolygonhermez/zkevm-commonjs").utils;
const { encodedStringToArray, decodeCustomRawTxProverMethod} = require("@0xpolygonhermez/zkevm-commonjs").processorUtils;

const FullTracer = require("./debug/full-tracer");
const Prints = require("./debug/prints");
const StatsTracer = require("./debug/stats-tracer");
const { lstat } = require("fs");

const P2_63 = Scalar.shl(Scalar.one, 63);
const MASK_64 = Scalar.sub(Scalar.shl(Scalar.e(1), 256), 1);
const BYTE_MASK_ON_64 = Scalar.bor(Scalar.shl(MASK_64, 64), Scalar.shr(MASK_64, 8n));
const P2_64 = Scalar.shl(Scalar.one, 64);


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
        Mem: [],
        MemAlign: []
    };
    nameRomErrors = [];

    debug = config && config.debug;
    const flagTracer = config && config.tracer;
    const verboseOptions = typeof config.verboseOptions === 'undefined' ? {} : config.verboseOptions;
    const N = pols.zkPC.length;
    const stepsN = (debug && config.stepsN) ? config.stepsN : N;
    const skipAddrRelControl = (config && config.skipAddrRelControl) || false;
    let helpers = (config && config.helpers) ? config.helpers : false;

    if (config && config.unsigned){
        if (typeof input.from === 'undefined'){
            throw new Error('Unsigned flag requires a `from` in the input');
        }
    }

    const skipAsserts = config.unsigned || config.execute;
    const skipCounters = config.counters;

    const poseidon = await buildPoseidon();
    const Fr = poseidon.F;

    const FrFirst32Negative = 0xFFFFFFFF00000001n - 0xFFFFFFFFn;
    const FrLast32Positive = 0xFFFFFFFFn;

    // load database
    const db = new Database(Fr, input.db);
    await db.connect(config.databaseURL, config.dbNodesTable, config.dbProgramTable);

    // load programs into DB
    for (const [key, value] of Object.entries(input.contractsBytecode)){
        // filter smt smart contract hashes
        if (key.length === 66) // "0x" + 32 bytes
            await db.setProgram(stringToH4(key), hexString2byteArray(value));
    }

    // load smt
    const smt = new SMT(db, poseidon, Fr);

    let op1, op0;
    const FrZeros = [Fr.zero, Fr.zero];
    const ctx = {
        mem: [],
        hashK: [],
        pols: pols,
        input: input,
        vars:[],
        Fr: Fr,
        sto: input.keys,
        rom: rom,
        outLogs: {},
        N,
        stepsN,
        helpers
    }

    if (config.stats) {
        metadata.stats = {
            trace:[],
            lineTimes:[]
        };
    }

    initState(Fr, pols, ctx);

    if (debug && flagTracer) {
        fullTracer = new FullTracer(
            config.debugInfo.inputName,
            smt,
            {
                verbose: typeof verboseOptions.fullTracer === 'undefined' ? {} : verboseOptions.fullTracer
            }
        );
    }

    if (config.stats) {
        statsTracer = new StatsTracer(config.debugInfo.inputName);
    }

    const iPrint = new Prints(ctx, smt);
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


    if (helpers) {
        console.log('USING custom helpers ....');
        if (!Array.isArray(helpers)) {
            helpers = [helpers];
        }
        for (const helper of helpers) {
            if (typeof helper.setup !== 'function') {
                throw new Error('Helpers must be an instance with at least setup method');
            }
            helper.setup({
                evalCommand,
                safeFea2scalar,
                scalar2fea,
                Scalar,
                fullTracer,
                nameRomErrors,
                checkParams
            });
            for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(helper))) {
                if (!method.startsWith('eval_')) continue;
                console.log(`  found helper ${method.substring(5)} => ${method}`);
            }
        }
        ctx.helpers = helpers;
    }

    try {
    for (let step = 0; step < stepsN; step++) {
        const i = step % N;
        ctx.ln = Fr.toObject(pols.zkPC[i]);
        ctx.step = step;
        ctx.A = [pols.A0[i], pols.A1[i]];
        ctx.B = [pols.B0[i], pols.B1[i]];
        ctx.C = [pols.C0[i], pols.C1[i]];
        ctx.D = [pols.D0[i], pols.D1[i]];
        ctx.E = [pols.E0[i], pols.E1[i]];
        ctx.CTX = pols.CTX[i];
        ctx.SP = pols.SP[i];
        ctx.PC = pols.PC[i];
        ctx.RR = pols.RR[i];
        ctx.HASHPOS = pols.HASHPOS[i];
        ctx.GAS = pols.GAS[i];
        ctx.zkPC = pols.zkPC[i];
        ctx.cntArith = pols.cntArith[i];
        ctx.cntBinary = pols.cntBinary[i];
        ctx.cntKeccakF = pols.cntKeccakF[i];
        ctx.cntMemAlign = pols.cntMemAlign[i];
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

//////////
// LOAD INPUTS
//////////

        [op0, op1] = FrZeros;

        if (l.inA) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inA), ctx.A[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inA), ctx.A[1]))];
            pols.inA[i] = Fr.e(l.inA);
        } else {
            pols.inA[i] = Fr.zero;
        }

        if (l.inB) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inB), ctx.B[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inB), ctx.B[1]))];
            pols.inB[i] = Fr.e(l.inB);
        } else {
            pols.inB[i] = Fr.zero;
        }

        if (l.inC) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inC), ctx.C[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inC), ctx.C[1]))];
            pols.inC[i] = Fr.e(l.inC);
        } else {
            pols.inC[i] = Fr.zero;
        }

        if (l.inD) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inD), ctx.D[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inD), ctx.D[1]))];
            pols.inD[i] = Fr.e(l.inD);
        } else {
            pols.inD[i] = Fr.zero;
        }

        if (l.inE) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inE), ctx.E[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inE), ctx.E[1]))];
            pols.inE[i] = Fr.e(l.inE);
        } else {
            pols.inE[i] = Fr.zero;
        }

        if (l.inSR) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inSR), ctx.SR[0])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inSR), ctx.SR[1]))];
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

        if (l.inROTL_C) {
            [op0, op1] =
                [Fr.add(op0 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[1])),
                 Fr.add(op1 , Fr.mul( Fr.e(l.inROTL_C), ctx.C[0]))];
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


        if ((!isNaN(l.CONSTL))&&(l.CONSTL)) {
            [
                pols.CONST0[i],
                pols.CONST1[i]
            ] = scalar2fea(Fr, l.CONSTL);
            [op0, op1] = [Fr.add(op0 , pols.CONST0[i]),
                          Fr.add(op1 , pols.CONST1[i])];
        } else if ((!isNaN(l.CONST))&&(l.CONST)) {
            pols.CONST0[i] = Fr.e(l.CONST);
            op0 = Fr.add(op0, pols.CONST0[i] );
            pols.CONST1[i] = Fr.zero;
        } else {
            pols.CONST0[i] = Fr.zero;
            pols.CONST1[i] = Fr.zero;
        }

////////////
// PREPARE AUXILIARY VARS
////////////

        let addrRel = 0;
        let addr = 0;
        if (l.mOp || l.JMP || l.JMPN || l.JMPC || l.JMPZ || l.call ||
            l.hashK || l.hashK1 || l.hashKLen || l.hashKDigest) {
            if (l.ind) {
                addrRel = fe2n(Fr, ctx.E[0], ctx);
            }
            if (l.indRR) {
                addrRel += fe2n(Fr, ctx.RR, ctx);
            }
            if (l.offset) addrRel += l.offset;
            if (l.isStack == 1) addrRel += Number(ctx.SP);
            if (!skipAddrRelControl) {
                if (addrRel >= 0x20000 || (!l.isMem && addrRel >= 0x10000)) throw new Error(`Address too big ${sourceRef}`);
                if (addrRel <0 ) throw new Error(`Address can not be negative ${sourceRef}`);
            }
            addr = addrRel;
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

//////
// CALCULATE AND LOAD FREE INPUT
//////

        if (l.inFREE) {

            if (!l.freeInTag) {
                throw new Error(`Instruction with freeIn without freeInTag ${sourceRef}`);
            }

            let fi;
            if (l.freeInTag.op=="") {
                let nHits = 0;
                if (l.mOp == 1 && l.mWR == 0) {
                    if (typeof ctx.mem[addr] != "undefined") {
                        fi = ctx.mem[addr];
                    } else {
                        fi = FrZeros;
                    }
                    nHits++;
                }

                if (l.hashK || l.hashK1) {
                    if (typeof ctx.hashK[addr] === "undefined") ctx.hashK[addr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
                    const size = l.hashK1 ? 1 : fe2n(Fr, ctx.D[0], ctx);
                    const pos = fe2n(Fr, ctx.HASHPOS, ctx);
                    if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashK(${addr}) ${sourceRef}`);
                    if (pos+size > ctx.hashK[addr].data.length) throw new Error(`Accessing hashK(${addr}) out of bounds (${pos+size} > ${ctx.hashK[addr].data.length}) ${sourceRef}`);
                    let s = Scalar.zero;
                    for (let k=0; k<size; k++) {
                        if (typeof ctx.hashK[addr].data[pos + k] === "undefined") throw new Error(`Accessing hashK(${addr}) not defined place ${pos+k} ${sourceRef}`);
                        s = Scalar.add(Scalar.mul(s, 256), Scalar.e(ctx.hashK[addr].data[pos + k]));
                    }
                    fi = scalar2fea(Fr, s);
                    nHits++;
                }
                if (l.hashKDigest == 1) {
                    if (typeof ctx.hashK[addr] === "undefined") {
                        throw new Error(`digest(${addr}) not defined ${sourceRef}`);
                    }
                    if (typeof ctx.hashK[addr].digest === "undefined") {
                        throw new Error(`digest(${addr}) not calculated. Call hashKlen to finish digest ${sourceRef}`);
                    }
                    fi = scalar2fea(Fr, ctx.hashK[addr].digest);
                    nHits++;
                }
                if (l.bin) {
                    if (l.binOpcode == 0) { // ADD
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.band(Scalar.add(a, b), MASK_64);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 1) { // SUB
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.band(Scalar.add(Scalar.sub(a, b), twoTo256), MASK_64);
                        fi = scalar2fea(Fr, c);
                        nHits ++;
                    } else if (l.binOpcode == 2) { // LT
                        const a = safeFea2scalar(Fr, ctx.A);
                        const b = safeFea2scalar(Fr, ctx.B);
                        const c = Scalar.lt(a, b);
                        fi = scalar2fea(Fr, c);scalar2fea
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
                    } else {
                        throw new Error(`Invalid Binary operation ${l.binOpCode} ${sourceRef}`);
                    }
                }

                if (l.memAlignRD) {
                    const m0 = safeFea2scalar(Fr, ctx.A);
                    const m1 = safeFea2scalar(Fr, ctx.B);
                    const P2_64 = 2n ** 64n;
                    const MASK_64 = P2_64 - 1n;
                    const offset = safeFea2scalar(Fr, ctx.C);
                    if (offset < 0 || offset >= 8) {
                        throw new Error(`MemAlign out of range (${offset})  ${sourceRef}`);
                    }
                    const leftV = Scalar.band(Scalar.shl(m0, offset * 8n), MASK_64);
                    const rightV = Scalar.band(Scalar.shr(m1, 64n - (offset * 8n)), MASK_64 >> (64n - (offset * 8n)));
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
            [pols.FREE0[i], pols.FREE1[i]] = fi;
            [op0, op1] =
                [Fr.add( Fr.mul(Fr.e(l.inFREE), fi[0]), op0 ),
                 Fr.add( Fr.mul(Fr.e(l.inFREE), fi[1]), op1 )];
            pols.inFREE[i] = Fr.e(l.inFREE);
        } else {
            [pols.FREE0[i], pols.FREE1[i]] = FrZeros;
            pols.inFREE[i] = Fr.zero;
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
            } else if ((!Fr.eq(ctx.A[0], op0)) || (!Fr.eq(ctx.A[1], op1))) {
                throw new Error(`Assert does not match ${sourceRef} (op:${fea2scalar(Fr, [op0, op1])} A:${fea2scalar(Fr, ctx.A)})`);
            }
            pols.assert[i] = 1n;
        } else {
            pols.assert[i] = 0n;
        }


        if (l.mOp) {
            pols.mOp[i] = 1n;

            if (l.mWR) {
                pols.mWR[i] = 1n;
                ctx.mem[addr] = [op0, op1];
                required.Mem.push({bIsWrite: true, address: addr, pc: step, fe0:op0, fe1:op1});
            } else {
                pols.mWR[i] = 0n;
                required.Mem.push({bIsWrite: false,  address: addr, pc: step, fe0:op0, fe1:op1});
                if (ctx.mem[addr]) {
                    if ((!Fr.eq(ctx.mem[addr][0],  op0)) ||
                        (!Fr.eq(ctx.mem[addr][1],  op1)))
                    {
                        const memdata = ctx.mem[addr].slice().reverse().join(',');
                        const hmemdata = ctx.mem[addr].slice().reverse().map((x)=>x.toString(16).padStart(8,'0')).join('');
                        const opdata = [op1,op0].join(',');
                        const hopdata = [op1,op0].map((x)=>x.toString(16).padStart(8,'0')).join('');
                        throw new Error(`Memory Read does not match MEM[${addr}]=[${memdata}] OP=[${opdata}] ${sourceRef}\n${hmemdata}\n${hopdata}`);
                    }
                } else {
                    if ((!Fr.isZero(op0)) ||
                        (!Fr.isZero(op1)))
                    {
                        const memdata = ctx.mem[addr].slice().reverse().join(',');
                        const opdata = [op1,op0].join(',');
                        throw new Error(`Memory Read does not match with non-initialized MEM[${addr}]=[${memdata}] OP=[${opdata}] ${sourceRef}`);
                    }
                }

            }

        } else {
            pols.mOp[i] = 0n;
            pols.mWR[i] = 0n;
        }

        if (l.hashK || l.hashK1) {
            if (typeof ctx.hashK[addr] === "undefined") ctx.hashK[addr] = { data: [], reads: {} , digestCalled: false, lenCalled: false, sourceRef };
            pols.hashK[i] = l.hashK ? 1n : 0n;
            pols.hashK1[i] = l.hashK1 ? 1n : 0n;
            const size = l.hashK1 ? 1 : fe2n(Fr, ctx.D[0], ctx);
            const pos = fe2n(Fr, ctx.HASHPOS, ctx);
            if ((size<0) || (size>32)) throw new Error(`Invalid size ${size} for hashK ${sourceRef}`);
            const a = safeFea2scalar(Fr, [op0, op1]);
            const maskByte = Scalar.e("0xFF");
            for (let k=0; k<size; k++) {
                const bm = Scalar.toNumber(Scalar.band( Scalar.shr( a, (size-k -1)*8 ) , maskByte));
                const bh = ctx.hashK[addr].data[pos + k];
                if (typeof bh === "undefined") {
                    ctx.hashK[addr].data[pos + k] = bm;
                } else if (bm != bh) {
                    throw new Error(`HashK(${addr}) do not match, pos ${pos+k} is ${bm} and should be ${bh} ${sourceRef}`)
                }
            }
            const paddingA = Scalar.shr(a, size * 8);
            if (!Scalar.isZero(paddingA)) {
                throw new Error(`HashK(${addr}) incoherent size (${size}) and data (0x${a.toString(16)}) padding (0x${paddingA.toString(16)}) (w=${step}) ${sourceRef}`);
            }

            if ((typeof ctx.hashK[addr].reads[pos] !== "undefined") &&
                (ctx.hashK[addr].reads[pos] != size))
            {
                throw new Error(`HashK(${addr}) diferent read sizes (${ctx.hashK[addr].reads[pos]} != ${size}) in the same position ${pos} ${sourceRef}`)
            }
            ctx.hashK[addr].reads[pos] = size;
            ctx.hashK[addr].sourceRef = sourceRef;
            incHashPos = size;
        } else {
            pols.hashK[i] = 0n;
            pols.hashK1[i] = 0n;
        }

        if (l.hashKLen) {
            pols.hashKLen[i] = 1n;
            const lm = fe2n(Fr, op0, ctx);
            // If it's undefined compute hash of 0 bytes
            if(typeof ctx.hashK[addr] === "undefined") {
                // len must be 0
                if (lm != 0) throw new Error(`HashKLen(${addr}) length does not match is ${lm} and should be 0 ${sourceRef}`);
                ctx.hashK[addr] = { data: [], reads: {} , digestCalled: false};
                ctx.hashK[addr].digest = ethers.utils.keccak256("0x");
            }
            ctx.hashK[addr].sourceRef = sourceRef;

            if (ctx.hashK[addr].lenCalled) {
                throw new Error(`Call HASHKLEN @${addr} more than once: ${ctx.ln} at ${ctx.fileName}:${ctx.line}`);
            }
            ctx.hashK[addr].lenCalled = true;
            const lh = ctx.hashK[addr].data.length;
            if (lm != lh) throw new Error(`HashKLen(${addr}) length does not match is ${lm} and should be ${lh} ${sourceRef}`);
            if (typeof ctx.hashK[addr].digest === "undefined") {
                ctx.hashK[addr].digest = ethers.utils.keccak256(ethers.utils.hexlify(ctx.hashK[addr].data));
            }
        } else {
            pols.hashKLen[i] = 0n;
        }

        if (l.hashKDigest) {
            pols.hashKDigest[i] = 1n;
            const dg = safeFea2scalar(Fr, [op0, op1]);
            if (typeof ctx.hashK[addr].digest === "undefined") {
                throw new Error(`HASHKDIGEST(${addr}) cannot load keccak from DB ${sourceRef}`);
            }
            if (!Scalar.eq(Scalar.e(dg), Scalar.e(ctx.hashK[addr].digest))) {
                throw new Error(`HashKDigest(${addr}) doesn't match ${sourceRef}`);
            }
            if (ctx.hashK[addr].digestCalled) {
                throw new Error(`Call HASHKDIGEST(${addr}) more than once: ${sourceRef}`);
            }
            ctx.hashK[addr].digestCalled = true;
            incCounter = Math.ceil((ctx.hashK[addr].data.length + 1) / 136)
        } else {
            pols.hashKDigest[i] = 0n;
        }

        if (l.arith) {
            const A = safeFea2scalar(Fr, ctx.A);
            const B = safeFea2scalar(Fr, ctx.B);
            const C = safeFea2scalar(Fr, ctx.C);
            const D = safeFea2scalar(Fr, ctx.D);
            const op = safeFea2scalar(Fr, [op0, op1]);
            if (! Scalar.eq(Scalar.add(Scalar.mul(A, B), C),  Scalar.add(Scalar.shl(D, 64), op))   ) {
                console.log('A: '+A.toString()+' (0x'+A.toString(16)+')');
                console.log('B: '+B.toString()+' (0x'+B.toString(16)+')');
                console.log('C: '+C.toString()+' (0x'+C.toString(16)+')');
                console.log('D: '+D.toString()+' (0x'+D.toString(16)+')');
                console.log('op: '+op.toString()+' (0x'+op.toString(16)+')');
                let left = Scalar.add(Scalar.mul(A, B), C);
                let right = Scalar.add(Scalar.shl(D, 64), op);
                console.log(left.toString() + ' (0x'+left.toString(16)+') != '+ right.toString()
                                            + ' (0x' + right.toString(16)+')');
                throw new Error(`Arithmetic does not match ${sourceRef}`);
            }
            pols.arith[i] = 1n;
            required.Arith.push({ x1: ctx.A, y1: ctx.B,
                                  x2: ctx.C, y2: ctx.D,
                                  x3: FrZeros, y3: [op0, op1]});
        } else {
            pols.arith[i] = 0n;
        }

        if (l.bin) {
            if (l.binOpcode == 0) { // ADD
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1]);
                const expectedC = Scalar.band(Scalar.add(a, b), MASK_64);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`ADD does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 0n;
                pols.carry[i] = (((a + b) >> 64n) > 0n) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 0, type: 1});
            } else if (l.binOpcode == 1) { // SUB
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1]);
                const expectedC = Scalar.band(Scalar.add(Scalar.sub(a, b), twoTo256), MASK_64);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`SUB does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 1n;
                pols.carry[i] = ((a - b) < 0n) ? 1n : 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 1, type: 1});
            } else if (l.binOpcode == 2) { // LT
                const a = safeFea2scalar(Fr, ctx.A);
                const b = safeFea2scalar(Fr, ctx.B);
                const c = safeFea2scalar(Fr, [op0, op1]);
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
                const c = safeFea2scalar(Fr, [op0, op1]);

                const signedA = Scalar.geq(a, P2_63) ? Scalar.sub(a, P2_64): a;
                const signedB = Scalar.geq(b, P2_63) ? Scalar.sub(b, P2_64): b;
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
                const c = safeFea2scalar(Fr, [op0, op1]);
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
                const c = safeFea2scalar(Fr, [op0, op1]);
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
                const c = safeFea2scalar(Fr, [op0, op1]);
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
                const c = safeFea2scalar(Fr, [op0, op1]);
                const expectedC = Scalar.bxor(a, b);
                if (!Scalar.eq(c, expectedC)) {
                    throw new Error(`XOR does not match (${expectedC} != ${c}) ${sourceRef}`);
                }
                pols.binOpcode[i] = 7n;
                pols.carry[i] = 0n;
                required.Binary.push({a: a, b: b, c: c, opcode: 7, type: 1});
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
            const v = safeFea2scalar(Fr, [op0, op1]);
            const offset = safeFea2scalar(Fr, ctx.C);

            if (offset < 0 || offset >= 7) {
                throw new Error(`MemAlign out of range (${offset}) ${sourceRef}`);
            }

            if (!l.memAlignRD && l.memAlignWR && !l.memAlignWR8) {
                const m1 = safeFea2scalar(Fr, ctx.B);
                const w0 = safeFea2scalar(Fr, ctx.D);
                const w1 = safeFea2scalar(Fr, ctx.E);
                const _W0 = Scalar.bor(Scalar.band(m0, P2_64 - (2n ** (64n - (8n * offset)))), Scalar.shr(v, 8n * offset));
                const _W1 = Scalar.bor(Scalar.band(m1, MASK_64 >> (offset * 8n)),
                                       Scalar.band(Scalar.shl(v, (64n - (offset * 8n))), MASK_64));
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
                const _W0 = Scalar.bor(Scalar.band(m0, Scalar.shr(BYTE_MASK_ON_64, 8n * offset)), Scalar.shl(Scalar.band(v, 0xFF), 8n * (7n - offset)));
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
                const leftV = Scalar.band(Scalar.shl(m0, offset * 8n), MASK_64);
                const rightV = Scalar.band(Scalar.shr(m1, 64n - (offset * 8n)), MASK_64 >> (64n - (offset * 8n)));
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

    //////////
    // SET NEXT REGISTERS
    //////////

        const nexti = (i+1) % N;

        if (l.setA == 1) {
            pols.setA[i]=1n;
            [pols.A0[nexti], pols.A1[nexti]] = [op0, op1];
        } else {
            pols.setA[i]=0n;
            [pols.A0[nexti],pols.A1[nexti]] = [pols.A0[i], pols.A1[i]];

            // Set A register with input.from to process unsigned transactions
            if ((Number(ctx.zkPC) === rom.labels.checkAndSaveFrom) && config.unsigned){
                [pols.A0[nexti], pols.A1[nexti]] = scalar2fea(Fr, input.from);
            }
        }

        if (l.setB == 1) {
            pols.setB[i]=1n;
            [pols.B0[nexti], pols.B1[nexti]] = [op0, op1];
        } else {
            pols.setB[i]=0n;
            [pols.B0[nexti], pols.B1[nexti]] = [pols.B0[i], pols.B1[i]];
        }

        if (l.setC == 1) {
            pols.setC[i]=1n;
            [pols.C0[nexti], pols.C1[nexti]] = [op0, op1];
        } else {
            pols.setC[i]=0n;
            [pols.C0[nexti], pols.C1[nexti]] = [pols.C0[i], pols.C1[i]];
        }

        if (l.setD == 1) {
            pols.setD[i]=1n;
            [pols.D0[nexti], pols.D1[nexti]] = [op0, op1];
        } else {
            pols.setD[i]=0n;
            [pols.D0[nexti], pols.D1[nexti]] = [pols.D0[i], pols.D1[i]];
        }

        if (l.setE == 1) {
            pols.setE[i]=1n;
            [pols.E0[nexti], pols.E1[nexti]] = [op0, op1];
        } else {
            pols.setE[i]=0n;
            [pols.E0[nexti], pols.E1[nexti]] = [pols.E0[i], pols.E1[i]];
        }

        if (l.setCTX == 1) {
            pols.setCTX[i]=1n;
            pols.CTX[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setCTX[i]=0n;
            pols.CTX[nexti] = pols.CTX[i];
        }

        if (l.setSP == 1) {
            pols.setSP[i]=1n;
            pols.SP[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setSP[i]=0n;
            pols.SP[nexti] = pols.SP[i] + BigInt((l.incStack || 0));
        }

        if (l.setPC == 1) {
            pols.setPC[i]=1n;
            pols.PC[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setPC[i]=0n;
            pols.PC[nexti] = pols.PC[i];
        }

        if (l.setRR == 1) {
            pols.setRR[i]=1n;
            pols.RR[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setRR[i]=0n;
            pols.RR[nexti] = l.call ? (ctx.zkPC + 1n) : pols.RR[i];
        }

        if (!skipCounters && l.arith) {
            pols.cntArith[nexti] = pols.cntArith[i] + 1n;
        } else {
            pols.cntArith[nexti] = pols.cntArith[i];
        }

        if (!skipCounters && l.bin == 1) {
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
            pols.RCX[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setRCX[i] = 0n;
            if (!Fr.isZero(pols.RCX[i]) && l.repeat == 1) {
                pols.RCX[nexti] = Fr.add(pols.RCX[i], Fr.negone);
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
        pols.call[i] = 0n;

        pols.jmpAddr[i] = l.jmpAddr ? BigInt(l.jmpAddr) : 0n;
        pols.useJmpAddr[i] = l.useJmpAddr ? 1n: 0n;

        const finalJmpAddr = l.useJmpAddr ? l.jmpAddr : addr;
        const nextNoJmpZkPC = pols.zkPC[i] + ((l.repeat && !Fr.isZero(ctx.RCX)) ? 0n:1n);

        const elseAddr = l.useElseAddr ? BigInt(l.elseAddr) : nextNoJmpZkPC;
        pols.elseAddr[i] = l.elseAddr ? BigInt(l.elseAddr) : 0n;
        pols.useElseAddr[i] = l.useElseAddr ? 1n: 0n;

        if (l.JMPN) {
            const o = Fr.toObject(op0);
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
            pols.isNeg[i] = 0n;
            pols.lJmpnCondValue[i] = 0n;
            for (let index = 0; index < 9; ++index) {
                pols.hJmpnCondValueBit[index][i] = 0n;
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
                    console.log(`WARNING: JMPZ with negative value ${sourceRef}`);
                }
            } else if (l.JMP) {
                pols.zkPC[nexti] = BigInt(finalJmpAddr);
                pols.JMP[i] = 1n;
            } else if (l.call) {
                pols.zkPC[nexti] = BigInt(finalJmpAddr);
                pols.call[i] = 1n;
            } else if (l.return) {
                pols.zkPC[nexti] = ctx.RR;
                pols.return[i] = 1n;
            } else {
                pols.zkPC[nexti] = nextNoJmpZkPC;
            }
        }

        if (l.setGAS == 1) {
            pols.setGAS[i]=1n;
            pols.GAS[nexti] = BigInt(fe2n(Fr, op0, ctx));
        } else {
            pols.setGAS[i]=0n;
            pols.GAS[nexti] = pols.GAS[i];
        }

        if (l.setHASHPOS == 1) {
            pols.setHASHPOS[i]=1n;
            pols.HASHPOS[nexti] = BigInt(fe2n(Fr, op0, ctx) + incHashPos);
        } else {
            pols.setHASHPOS[i]=0n;
            pols.HASHPOS[nexti] = pols.HASHPOS[i] + BigInt( incHashPos);
        }

        if (l.sRD || l.sWR || l.hashKDigest || l.hashPDigest) {
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
        assertOutputs(ctx);
    }

    if (!(fastDebugExit || typeof config.stepsN === 'undefined')) {
        checkFinalState(Fr, pols, ctx);
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
        cntMemAlign: ctx.cntMemAlign,
        cntSteps: ctx.step,
    }
    required.output = {
        newStateRoot: auxNewStateRoot,
        newAccInputHash: fea2String(Fr, ctx.D),
        newLocalExitRoot: fea2String(Fr, ctx.E),
        newNumBatch: ctx.PC,
    }

    return required;
}

/**
 * This function creates an array of polynomials and a mapping that maps the reference name in pil to the polynomial
 * @param {Field} Fr - Field element
 * @param {Object} pols - polynomials
 * @param {Object} ctx - context
 */
function checkFinalState(Fr, pols, ctx) {

    if ((!Fr.isZero(pols.A0[0])) ||
        (!Fr.isZero(pols.A1[0])) ||
        (!Fr.isZero(pols.D0[0])) ||
        (!Fr.isZero(pols.D1[0])) ||
        (!Fr.isZero(pols.D2[0])) ||
        (!Fr.isZero(pols.E0[0])) ||
        (!Fr.isZero(pols.E1[0])) ||
        (pols.PC[0]) ||
        (pols.HASHPOS[0]) ||
        (pols.RR[0]) ||
        (pols.RCX[0])
    ) {
        if(fullTracer) fullTracer.exportTrace();

        if(ctx.step >= (ctx.stepsN - 1)) console.log("Not enough steps to finalize execution (${ctx.step},${ctx.stepsN-1})\n");
        throw new Error("Program terminated with registers A, D, E, SR, PC, HASHPOS, RR, RCX, zkPC not set to zero");
    }

    const feaOldStateRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldStateRoot));
    if (
        (!Fr.eq(pols.B0[0], feaOldStateRoot[0])) ||
        (!Fr.eq(pols.B1[0], feaOldStateRoot[1])) ||
        (!Fr.eq(pols.B2[0], feaOldStateRoot[2])) ||
        (!Fr.eq(pols.B3[0], feaOldStateRoot[3])) ||
        (!Fr.eq(pols.B4[0], feaOldStateRoot[4])) ||
        (!Fr.eq(pols.B5[0], feaOldStateRoot[5])) ||
        (!Fr.eq(pols.B6[0], feaOldStateRoot[6])) ||
        (!Fr.eq(pols.B7[0], feaOldStateRoot[7]))
    ) {
        if(fullTracer) fullTracer.exportTrace();
        throw new Error("Register B not terminetd equal as its initial value");
    }

    const feaOldAccInputHash = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldAccInputHash));
    if (
        (!Fr.eq(pols.C0[0], feaOldAccInputHash[0])) ||
        (!Fr.eq(pols.C1[0], feaOldAccInputHash[1])) ||
        (!Fr.eq(pols.C2[0], feaOldAccInputHash[2])) ||
        (!Fr.eq(pols.C3[0], feaOldAccInputHash[3])) ||
        (!Fr.eq(pols.C4[0], feaOldAccInputHash[4])) ||
        (!Fr.eq(pols.C5[0], feaOldAccInputHash[5])) ||
        (!Fr.eq(pols.C6[0], feaOldAccInputHash[6])) ||
        (!Fr.eq(pols.C7[0], feaOldAccInputHash[7]))
    ) {
        if(fullTracer) fullTracer.exportTrace();
        throw new Error("Register C not termined equal as its initial value");
    }

    if (!Fr.eq(pols.SP[0], ctx.Fr.e(ctx.input.oldNumBatch))){
        if(fullTracer) fullTracer.exportTrace();
        throw new Error("Register SP not termined equal as its initial value");
    }

    if (!Fr.eq(pols.GAS[0], ctx.Fr.e(ctx.input.chainID))){
        if(fullTracer) fullTracer.exportTrace();
        throw new Error("Register GAS not termined equal as its initial value");
    }

    if (!Fr.eq(pols.CTX[0], ctx.Fr.e(ctx.input.forkID))){
        if(fullTracer) fullTracer.exportTrace();
        throw new Error(`Register CTX not termined equal as its initial value CTX[0]:${pols.CTX[0]} forkID:${ctx.input.forkID}`);
    }
}

/**
 * get output registers and assert them against outputs provided
 * @param {Object} ctx - context
 */
function assertOutputs(ctx){
    const feaNewStateRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newStateRoot));

    if (
        (!ctx.Fr.eq(ctx.SR[0], feaNewStateRoot[0])) ||
        (!ctx.Fr.eq(ctx.SR[1], feaNewStateRoot[1])) ||
        (!ctx.Fr.eq(ctx.SR[2], feaNewStateRoot[2])) ||
        (!ctx.Fr.eq(ctx.SR[3], feaNewStateRoot[3])) ||
        (!ctx.Fr.eq(ctx.SR[4], feaNewStateRoot[4])) ||
        (!ctx.Fr.eq(ctx.SR[5], feaNewStateRoot[5])) ||
        (!ctx.Fr.eq(ctx.SR[6], feaNewStateRoot[6])) ||
        (!ctx.Fr.eq(ctx.SR[7], feaNewStateRoot[7]))
    ) {
        let errorMsg = "Assert Error: newStateRoot does not match\n";
        errorMsg += `   State root computed: ${fea2String(ctx.Fr, ctx.SR)}\n`;
        errorMsg += `   State root expected: ${ctx.input.newStateRoot}\n`;
        errorMsg += `Errors: ${nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    const feaNewAccInputHash = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newAccInputHash));

    if (
        (!ctx.Fr.eq(ctx.D[0], feaNewAccInputHash[0])) ||
        (!ctx.Fr.eq(ctx.D[1], feaNewAccInputHash[1])) ||
        (!ctx.Fr.eq(ctx.D[2], feaNewAccInputHash[2])) ||
        (!ctx.Fr.eq(ctx.D[3], feaNewAccInputHash[3])) ||
        (!ctx.Fr.eq(ctx.D[4], feaNewAccInputHash[4])) ||
        (!ctx.Fr.eq(ctx.D[5], feaNewAccInputHash[5])) ||
        (!ctx.Fr.eq(ctx.D[6], feaNewAccInputHash[6])) ||
        (!ctx.Fr.eq(ctx.D[7], feaNewAccInputHash[7]))
    ) {
        let errorMsg = "Assert Error: AccInputHash does not match\n";
        errorMsg += `   AccInputHash computed: ${fea2String(ctx.Fr, ctx.D)}\n`;
        errorMsg += `   AccInputHash expected: ${ctx.input.newAccInputHash}\n`;
        errorMsg += `Errors: ${nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    const feaNewLocalExitRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newLocalExitRoot));

    if (
        (!ctx.Fr.eq(ctx.E[0], feaNewLocalExitRoot[0])) ||
        (!ctx.Fr.eq(ctx.E[1], feaNewLocalExitRoot[1])) ||
        (!ctx.Fr.eq(ctx.E[2], feaNewLocalExitRoot[2])) ||
        (!ctx.Fr.eq(ctx.E[3], feaNewLocalExitRoot[3])) ||
        (!ctx.Fr.eq(ctx.E[4], feaNewLocalExitRoot[4])) ||
        (!ctx.Fr.eq(ctx.E[5], feaNewLocalExitRoot[5])) ||
        (!ctx.Fr.eq(ctx.E[6], feaNewLocalExitRoot[6])) ||
        (!ctx.Fr.eq(ctx.E[7], feaNewLocalExitRoot[7]))
    ) {
        let errorMsg = "Assert Error: NewLocalExitRoot does not match\n";
        errorMsg += `   NewLocalExitRoot computed: ${fea2String(ctx.Fr, ctx.E)}\n`;
        errorMsg += `   NewLocalExitRoot expected: ${ctx.input.newLocalExitRoot}\n`;
        errorMsg += `Errors: ${nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    if (!ctx.Fr.eq(ctx.PC, ctx.Fr.e(ctx.input.newNumBatch))){
        let errorMsg = "Assert Error: NewNumBatch does not match\n";
        errorMsg += `   NewNumBatch computed: ${Number(ctx.PC)}\n`;
        errorMsg += `   NewNumBatch expected: ${ctx.input.newNumBatch}\n`;
        errorMsg += `Errors: ${nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    console.log("Assert outputs run succesfully");
}


/**
 * Set input parameters to initial registers
 * @param {Field} Fr - field element
 * @param {Object} pols - polynomials
 * @param {Object} ctx - context
 */
function initState(Fr, pols, ctx) {
    // Set oldStateRoot to register B
    [
        pols.B0[0],
        pols.B1[0],
        pols.B2[0],
        pols.B3[0],
        pols.B4[0],
        pols.B5[0],
        pols.B6[0],
        pols.B7[0]
    ] = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldStateRoot));

    // Set oldAccInputHash to register C
    [
        pols.C0[0],
        pols.C1[0],
        pols.C2[0],
        pols.C3[0],
        pols.C4[0],
        pols.C5[0],
        pols.C6[0],
        pols.C7[0]
    ] = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldAccInputHash));

    // Set oldNumBatch to SP register
    pols.SP[0] = ctx.Fr.e(ctx.input.oldNumBatch)

    // Set chainID to GAS register
    pols.GAS[0] = ctx.Fr.e(ctx.input.chainID)

    // Set forkID to CTX register
    pols.CTX[0] = ctx.Fr.e(ctx.input.forkID)

    pols.A0[0] = Fr.zero;
    pols.A1[0] = Fr.zero;
    pols.A2[0] = Fr.zero;
    pols.A3[0] = Fr.zero;
    pols.A4[0] = Fr.zero;
    pols.A5[0] = Fr.zero;
    pols.A6[0] = Fr.zero;
    pols.A7[0] = Fr.zero;
    pols.D0[0] = Fr.zero;
    pols.D1[0] = Fr.zero;
    pols.D2[0] = Fr.zero;
    pols.D3[0] = Fr.zero;
    pols.D4[0] = Fr.zero;
    pols.D5[0] = Fr.zero;
    pols.D6[0] = Fr.zero;
    pols.D7[0] = Fr.zero;
    pols.E0[0] = Fr.zero;
    pols.E1[0] = Fr.zero;
    pols.E2[0] = Fr.zero;
    pols.E3[0] = Fr.zero;
    pols.E4[0] = Fr.zero;
    pols.E5[0] = Fr.zero;
    pols.E6[0] = Fr.zero;
    pols.E7[0] = Fr.zero;
    pols.SR0[0] = Fr.zero;
    pols.SR1[0] = Fr.zero;
    pols.SR2[0] = Fr.zero;
    pols.SR3[0] = Fr.zero;
    pols.SR4[0] = Fr.zero;
    pols.SR5[0] = Fr.zero;
    pols.SR6[0] = Fr.zero;
    pols.SR7[0] = Fr.zero;
    pols.PC[0] = 0n;
    pols.HASHPOS[0] = 0n;
    pols.RR[0] = 0n;
    pols.zkPC[0] = 0n;
    pols.cntArith[0] = 0n;
    pols.cntBinary[0] = 0n;
    pols.cntKeccakF[0] = 0n;
    pols.cntMemAlign[0] = 0n;
    pols.cntPaddingPG[0] = 0n;
    pols.cntPoseidonG[0] = 0n;
    pols.RCX[0] = 0n;
    pols.RCXInv[0] = 0n;
    pols.op0Inv[0] = 0n;
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
    console.log("/////////////////////////////");
    console.log("/////// BATCH L2 DATA ///////");
    console.log("/////////////////////////////\n");

    const txs = encodedStringToArray(batchL2Data);
    console.log("Number of transactions: ", txs.length);

    for (let i = 0; i < txs.length; i++){
        console.log("\nTxNumber: ", i);
        const rawTx = txs[i];
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

        console.log(infoTx.txDecoded);
    }

    console.log("/////////////////////////////");
    console.log("/////////////////////////////\n");
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
        case 'le':      return (a > b)  ? 1 : 0;
    }
    throw new Error(`logical operation ${tag.op} not defined ${ctx.sourceRef}`);
}

function eval_getMemValue(ctx, tag) {
    // to be compatible with
    if (ctx.fullFe) {
        return fea2scalar(ctx.Fr, ctx.mem[tag.offset])
    }
    return safeFea2scalar(ctx.Fr, ctx.mem[tag.offset]);
}

function eval_functionCall(ctx, tag) {
    if (ctx.helpers) {
        const method = 'eval_'+ tag.funcName;
        for (const helper of ctx.helpers) {
            if (typeof helper[method] !== 'function') continue;
            const res = helper[method](ctx, tag);
            if (res !== null) {
                return res;
            }
        }
    }

    if (tag.funcName == "getSequencerAddr") {
        return eval_getSequencerAddr(ctx, tag);
    } else if (tag.funcName == "getTimestampLimit") {
        return eval_getTimestampLimit(ctx, tag);
    } else if (tag.funcName == "getIsForced") {
        return eval_getIsForced(ctx, tag);
    } else if (tag.funcName == "getHistoricGERRoot") {
        return eval_getHistoricGERRoot(ctx, tag);
    } else if (tag.funcName == "getNewGERRoot") {
        return eval_getNewGERRoot(ctx, tag);
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
    } else if (tag.funcName == "dumpRegs") {
        return eval_dumpRegs(ctx, tag);
    } else if (tag.funcName == "dump") {
        return eval_dump(ctx, tag);
    } else if (tag.funcName == "dumphex") {
        return eval_dumphex(ctx, tag);
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
    const smtProof = ctx.input.smtProofs[Number(evalCommand(ctx, tag.params[0]))][Number(evalCommand(ctx, tag.params[1]))];
    return scalar2fea(ctx.Fr, Scalar.e(smtProof));
}

function eval_getHistoricGERRoot(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    return scalar2fea(ctx.Fr, Scalar.e(ctx.input.historicGERRoot));
}

function eval_getNewGERRoot(ctx, tag) {
    if (tag.params.length != 1) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    const currentTx = Number(evalCommand(ctx, tag.params[0]));
    // If is forced return historicGERRoot, else tx's GER
    const newGER = ctx.input.isForced ? ctx.input.
    historicGERRoot :ctx.input.GERS[currentTx]
    return scalar2fea(ctx.Fr, Scalar.e(newGER));
}

function eval_getTimestampLimit(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    return [ctx.Fr.e(ctx.input.timestampLimit), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_getIsForced(ctx, tag) {
    if (tag.params.length != 0) throw new Error(`Invalid number of parameters (0 != ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    return [ctx.Fr.e(ctx.input.isForced), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
}

function eval_eventLog(ctx, tag) {
    if (tag.params.length < 1) throw new Error(`Invalid number of parameters (1 > ${tag.params.length}) function ${tag.funcName} ${ctx.sourceRef}`);
    if (fullTracer){
        // handle full-tracer events
        fullTracer.handleEvent(ctx, tag);
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
        return [ctx.Fr.e(-1), ctx.Fr.zero];
    }
    return [ctx.Fr.zero, ctx.Fr.zero];
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
            return Scalar.bxor(a, MASK_64);
        default:
            throw new Error(`Invalid bitwise operation ${func} (${tag.funcName}) ${ctx.sourceRef}`)
    }
}

function eval_beforeLast(ctx) {
    if (ctx.step >= ctx.stepsN-2) {
        return [0n, 0n];
    } else {
        return [ctx.Fr.negone, 0n];
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

    return scalar2fea(ctx.Fr, Scalar.bor(Scalar.band(m0, Scalar.shl(MASK_64, (8n - offset) * 8n)),
                        Scalar.band(MASK_64, Scalar.shr(value, offset * 8n))));
}

function eval_memAlignWR_W1(ctx, tag) {
    // parameters: M1, value, offset
    const m1 = evalCommand(ctx, tag.params[0]);
    const value = evalCommand(ctx, tag.params[1]);
    const offset = evalCommand(ctx, tag.params[2]);

    return scalar2fea(ctx.Fr, Scalar.bor(Scalar.band(m1, Scalar.shr(MASK_64, offset * 8n)),
                        Scalar.band(MASK_64, Scalar.shl(value, (8n - offset) * 8n))));
}

function eval_memAlignWR8_W0(ctx, tag) {
    // parameters: M0, value, offset
    const m0 = evalCommand(ctx, tag.params[0]);
    const value = evalCommand(ctx, tag.params[1]);
    const offset = evalCommand(ctx, tag.params[2]);
    const bits = (7n - offset) * 8n;

    return scalar2fea(ctx.Fr, Scalar.bor(  Scalar.band(m0, Scalar.sub(MASK_64, Scalar.shl(0xFFn, bits))),
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

    return [ctx.Fr.zero, ctx.Fr.zero];
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

    return [ctx.Fr.zero, ctx.Fr.zero];
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

    return [ctx.Fr.zero, ctx.Fr.zero];
}


function printRegs(Fr, ctx) {
    printReg2(Fr, "A", ctx.A);
    printReg2(Fr, "B", ctx.B);
    printReg2(Fr, "C", ctx.C);
    printReg2(Fr, "D", ctx.D);
    printReg2(Fr, "E", ctx.E);
    printReg1("CTX", ctx.CTX);
    printReg1("SP", ctx.SP);
    printReg1("PC", ctx.PC);
    printReg1("GAS", ctx.GAS);
    printReg1("zkPC", ctx.zkPC);
    printReg1("RR", ctx.RR);
    printReg1("STEP", ctx.step, false, true);
    console.log(ctx.fileName + ":" + ctx.line);
}

function printReg2(Fr, name, V) {

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

function safeFea2scalar(Fr, arr) {
    for (let index = 0; index < 2; ++index) {
        const value = Fr.toObject(arr[index]);
        if (value > 0xFFFFFFFFn) {
            throw new Error(`Invalid value 0x${value.toString(16)} to convert to scalar on index ${index}: ${sourceRef}`);
        }
    }
    return fea2scalar(Fr, arr);
}


/**
 * Converts a Scalar into an array of 2 elements encoded as Fields elements where each one represents 32 bits
 * result = [Scalar[0:31], scalar[32:63]
 * @param {Field} Fr - field
 * @param {Scalar} scalar - value to convert
 * @returns {Array[Field]} array of fields
 */
function scalar2fea(Fr, scalar) {
    scalar = Scalar.e(scalar);
    const r0 = Scalar.band(scalar, Scalar.e('0xFFFFFFFF'));
    const r1 = Scalar.band(Scalar.shr(scalar, 32), Scalar.e('0xFFFFFFFF'));

    return [Fr.e(r0), Fr.e(r1)];
}

/**
 * Field element array to Scalar
 * result = arr[0] + arr[1]*(2^32)
 * @param {Field} F - field element
 * @param {Array[Field]} arr - array of fields elements
 * @returns {Scalar}
 */
function fea2scalar(Fr, arr) {
    let res = Fr.toObject(arr[0]);
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[1]), 32));

    return res;
}