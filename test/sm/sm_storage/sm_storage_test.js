const fs = require('fs');

const { SMT, Database, smtUtils, getPoseidon} = require("@0xpolygonhermez/zkevm-commonjs");
const scalar2key = require("@0xpolygonhermez/zkevm-commonjs/test/helpers/test-utils.js").scalar2key;
const Scalar = require("ffjavascript").Scalar;
const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const sm_global = require("../../../src/sm/sm_global");
const StorageRom = require("../../../src/sm/sm_storage/sm_storage_rom.js").StorageRom;
const sm_storage = require("../../../src/sm/sm_storage/sm_storage.js");
const sm_poseidong = require("../../../src/sm/sm_poseidong.js");
const sm_climbKey = require("../../../src/sm/sm_climb_key.js");

const { isLogging, logger, fea42String, fea42String10, scalar2fea4, fea4IsEq }  = require("../../../src/sm/sm_storage/sm_storage_utils.js");

const LOG_SMT_RESULT = false;

describe("Test storage operations", async function () {
    let poseidon;
    let fr;
    let pil;
    let constPols, constPolsArray, constPolsDef;
    let cmPols, cmPolsArray, cmPolsDef;
    let db;
    let smt;
    let plookUpIndex;
    const required = {Storage: []};

    this.timeout(10000000);

    before(async () => {
        poseidon = await getPoseidon();
        fr = poseidon.F;

        pil = await compile(fr, __dirname + "/storage_main.pil");

        db = new Database(fr);
        // await db.connect("postgresql://statedb:statedb@127.0.0.1:5432/testdb");
        smt = new SMT(db, poseidon, fr);
    })

    function initContext () {
        constPols = newConstantPolsArray(pil);
        cmPols = newCommitPolsArray(pil);
        plookUpIndex = 0;
        for (let index = 0; index < cmPols.Main.sRD.length; ++index) {
            cmPols.Main.sRD[index] = 0n;
            cmPols.Main.SR0[index] = 0n;
            cmPols.Main.SR1[index] = 0n;
            cmPols.Main.SR2[index] = 0n;
            cmPols.Main.SR3[index] = 0n;
            cmPols.Main.SR4[index] = 0n;
            cmPols.Main.SR5[index] = 0n;
            cmPols.Main.SR6[index] = 0n;
            cmPols.Main.SR7[index] = 0n;
            cmPols.Main.sKey[0][index] = 0n;
            cmPols.Main.sKey[1][index] = 0n;
            cmPols.Main.sKey[2][index] = 0n;
            cmPols.Main.sKey[3][index] = 0n;
            cmPols.Main.op0[index] = 0n;
            cmPols.Main.op1[index] = 0n;
            cmPols.Main.op2[index] = 0n;
            cmPols.Main.op3[index] = 0n;
            cmPols.Main.op4[index] = 0n;
            cmPols.Main.op5[index] = 0n;
            cmPols.Main.op6[index] = 0n;
            cmPols.Main.op7[index] = 0n;
            cmPols.Main.incCounter[index] = 0n;
            cmPols.Main.sWR[index] = 0n;
            cmPols.Main.D0[index] = 0n;
            cmPols.Main.D1[index] = 0n;
            cmPols.Main.D2[index] = 0n;
            cmPols.Main.D3[index] = 0n;
            cmPols.Main.D4[index] = 0n;
            cmPols.Main.D5[index] = 0n;
            cmPols.Main.D6[index] = 0n;
            cmPols.Main.D7[index] = 0n;
        }
    }

    async function smtSet (oldRoot, key, value) {
        const r = await smt.set(oldRoot, key, value);
        console.log('SMT-SET', r);
        const index = plookUpIndex++;
        cmPols.Main.sRD[index] = fr.zero;
        cmPols.Main.sWR[index] = fr.e(1n);
        cmPols.Main.SR0[index] = fr.e(oldRoot[0] & 0xFFFFFFFFn);
        cmPols.Main.SR1[index] = fr.e(oldRoot[0] >> 32n);
        cmPols.Main.SR2[index] = fr.e(oldRoot[1] & 0xFFFFFFFFn);
        cmPols.Main.SR3[index] = fr.e(oldRoot[1] >> 32n);
        cmPols.Main.SR4[index] = fr.e(oldRoot[2] & 0xFFFFFFFFn);
        cmPols.Main.SR5[index] = fr.e(oldRoot[2] >> 32n);
        cmPols.Main.SR6[index] = fr.e(oldRoot[3] & 0xFFFFFFFFn);
        cmPols.Main.SR7[index] = fr.e(oldRoot[3] >> 32n);
        cmPols.Main.D0[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D1[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D2[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D3[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D4[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D5[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D6[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.D7[index] = value & 0xFFFFFFFFn;
        value = value >> 32n;
        cmPols.Main.sKey[0][index] = key[0];
        cmPols.Main.sKey[1][index] = key[1];
        cmPols.Main.sKey[2][index] = key[2];
        cmPols.Main.sKey[3][index] = key[3];
        cmPols.Main.op0[index] = fr.e(r.newRoot[0] & 0xFFFFFFFFn);
        cmPols.Main.op1[index] = fr.e(r.newRoot[0] >> 32n);
        cmPols.Main.op2[index] = fr.e(r.newRoot[1] & 0xFFFFFFFFn);
        cmPols.Main.op3[index] = fr.e(r.newRoot[1] >> 32n);
        cmPols.Main.op4[index] = fr.e(r.newRoot[2] & 0xFFFFFFFFn);
        cmPols.Main.op5[index] = fr.e(r.newRoot[2] >> 32n);
        cmPols.Main.op6[index] = fr.e(r.newRoot[3] & 0xFFFFFFFFn);
        cmPols.Main.op7[index] = fr.e(r.newRoot[3] >> 32n);
        cmPols.Main.incCounter[index] = BigInt(r.proofHashCounter);
/*        console.log(index+' '+[
                     fr.e(cmPols.Main.SR0[index] + cmPols.Main.SR1[index] * 2n**32n),
                     fr.e(cmPols.Main.SR2[index] + cmPols.Main.SR3[index] * 2n**32n),
                     fr.e(cmPols.Main.SR4[index] + cmPols.Main.SR5[index] * 2n**32n),
                     fr.e(cmPols.Main.SR6[index] + cmPols.Main.SR7[index] * 2n**32n),
                     cmPols.Main.sKey[0][index], cmPols.Main.sKey[1][index], cmPols.Main.sKey[2][index], cmPols.Main.sKey[3][index],
                     cmPols.Main.D0[index], cmPols.Main.D1[index], cmPols.Main.D2[index], cmPols.Main.D3[index],
                     cmPols.Main.D4[index], cmPols.Main.D5[index], cmPols.Main.D6[index], cmPols.Main.D7[index],
                     fr.e(cmPols.Main.op0[index] + cmPols.Main.op1[index] * 2n**32n),
                     fr.e(cmPols.Main.op2[index] + cmPols.Main.op3[index] * 2n**32n),
                     fr.e(cmPols.Main.op4[index] + cmPols.Main.op5[index] * 2n**32n),
                     fr.e(cmPols.Main.op6[index] + cmPols.Main.op7[index] * 2n**32n),
                     cmPols.Main.incCounter].join(','));*/
        required.Storage.push({bIsSet: true,
            setResult: {
                oldRoot: [...r.oldRoot],
                newRoot: [...r.newRoot],
                key: [...r.key],
                siblings: [...r.siblings],
                siblingsLeftChild: [...r.siblingsLeftChild],
                siblingsRightChild: [...r.siblingsRightChild],
                insKey: r.insKey ? [...r.insKey] : new Array(4).fill(Scalar.zero),
                insValue: r.insValue,
                isOld0: r.isOld0,
                oldValue: r.oldValue,
                newValue: r.newValue,
                mode: r.mode,
                incCounter: r.proofHashCounter
            }, Main: {w:index, sourceRef:''}});
        if (LOG_SMT_RESULT) console.log(r);
        return r;
    }

    async function smtGet (root, key) {
        const r = await smt.get(root, key);
        console.log('SMT-GET', r);
        const index = plookUpIndex++;
        cmPols.Main.sRD[index] = fr.e(1n);
        cmPols.Main.sWR[index] = fr.zero;
        cmPols.Main.SR0[index] = fr.e(r.root[0] & 0xFFFFFFFFn);
        cmPols.Main.SR1[index] = fr.e(r.root[0] >> 32n);
        cmPols.Main.SR2[index] = fr.e(r.root[1] & 0xFFFFFFFFn);
        cmPols.Main.SR3[index] = fr.e(r.root[1] >> 32n);
        cmPols.Main.SR4[index] = fr.e(r.root[2] & 0xFFFFFFFFn);
        cmPols.Main.SR5[index] = fr.e(r.root[2] >> 32n);
        cmPols.Main.SR6[index] = fr.e(r.root[3] & 0xFFFFFFFFn);
        cmPols.Main.SR7[index] = fr.e(r.root[3] >> 32n);
        cmPols.Main.D0[index] = fr.zero;
        cmPols.Main.D1[index] = fr.zero;
        cmPols.Main.D2[index] = fr.zero;
        cmPols.Main.D3[index] = fr.zero;
        cmPols.Main.D4[index] = fr.zero;
        cmPols.Main.D5[index] = fr.zero;
        cmPols.Main.D6[index] = fr.zero;
        cmPols.Main.D7[index] = fr.zero;
        cmPols.Main.sKey[0][index] = key[0];
        cmPols.Main.sKey[1][index] = key[1];
        cmPols.Main.sKey[2][index] = key[2];
        cmPols.Main.sKey[3][index] = key[3];
        let rvalue = r.value;
        cmPols.Main.op0[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op1[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op2[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op3[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op4[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op5[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op6[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.op7[index] = rvalue & 0xFFFFFFFFn;
        rvalue = rvalue >> 32n;
        cmPols.Main.incCounter[index] = BigInt(r.proofHashCounter);
        required.Storage.push({bIsSet: false,
            getResult: {
                root: [...r.root],
                key: [...r.key],
                siblings: [...r.siblings],
                insKey: r.insKey ? [...r.insKey] : new Array(4).fill(Scalar.zero),
                insValue: r.insValue,
                isOld0: r.isOld0,
                value: r.value,
                incCounter: r.proofHashCounter
            }, Main: {w:index, sourceRef:''}});
        if (LOG_SMT_RESULT) console.log(r);
        return r;
    }

    async function executeAndVerify () {
        await sm_global.buildConstants(constPols.Global);
        await sm_storage.buildConstants(constPols.Storage);
        await sm_climbKey.buildConstants(constPols.ClimbKey);
        const req = await sm_storage.execute(cmPols.Storage, required.Storage);

        await sm_poseidong.buildConstants(constPols.PoseidonG);
        await sm_poseidong.execute(cmPols.PoseidonG, req.PoseidonG);
        await sm_climbKey.execute(cmPols.ClimbKey, req.ClimbKey);
        const N = cmPols.$$array[0].length;
        console.log('N='+N);

        if (constPols !== false) {
            for (let i=0; i<constPols.$$array.length; i++) {
                for (let j=0; j<N; j++) {
                    const type = typeof constPols.$$array[i][j];
                    if (type !== 'bigint') {
                        if (type === 'undefined') {
                            throw new Error(`Polinomial not fited ${constPols.$$defArray[i].name} at ${j}` );
                        } else {
                            throw new Error(`Polinomial not valid type (${type}) on ${constPols.$$defArray[i].name} at ${j}` );
                        }
                    }
                }
            }
        }

        for (let i=0; i<cmPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                const type = typeof cmPols.$$array[i][j];
                if (type !== 'bigint') {
                    if (type === 'undefined') {
                        throw new Error(`Polinomial not fited ${cmPols.$$defArray[i].name} at ${j}`);
                    } else {
                        throw new Error(`Polinomial not valid type (${type}) on ${cmPols.$$defArray[i].name} at ${j}` );
                    }
                }
            }
        }
        /*
        const cols = ['oldRoot0', 'oldRoot1', 'oldRoot2', 'oldRoot3', 'rkey0', 'rkey1', 'rkey2', 'rkey3',
                      'valueLow0', 'valueLow1', 'valueLow2', 'valueLow3', 'valueHigh0', 'valueHigh1',
                      'valueHigh2', 'valueHigh3', 'incCounter' ];

        for (let i=0; i<N; i++) {
            if (cmPols.Storage.latchGet[i]) {
                console.log(`> LATCH_GET[${i}] `+cols.map(col => fr.toString(cmPols.Storage[col][i])));
            }
        }*/

        // Verify
        const res = await verifyPil(fr, pil, cmPols, constPols);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    }

    function bugTest () {
        console.log ("StorageSM_BugTest starting...");

        it('Set & Clear', async () => {
            initContext();

            const r1 = await smtSet (smt.empty, scalar2key(0x01, fr), Scalar.e(2));
            // console.log({r1});
            const r2 = await smtSet (r1.newRoot, scalar2key(0x03, fr), Scalar.e(4));
            // console.log({r2});
            const r3 = await smtSet (r2.newRoot, scalar2key(0x07, fr), Scalar.e(4));
            // console.log({r3});

            const rGet = await smtGet (r3.newRoot, scalar2key(0x02, fr));
            console.log({rGet});
            assert(Scalar.eq(rGet.value, Scalar.e(0)));

            const rGet2 = await smtGet (r3.newRoot, scalar2key(0xFFFF, fr));
            console.log({rGet2});
            assert(Scalar.eq(rGet2.value, Scalar.e(0)));

            /* const rGet = await smtGet (r3.newRoot, scalar2key(0x02, fr));
            console.log(rGet.value);
            assert(Scalar.eq(rGet.value, Scalar.e(0)));*/
/*
            const r2 = await smtSet (r1.newRoot, scalar2key(1, fr), Scalar.e(0));
            assert(smtUtils.nodeIsZero(r2.newRoot, fr));*/
            await executeAndVerify();
        });
    }

    function unitTest () {
        console.log ("StorageSM_UnitTest starting...");
        it('Storage Unit test', async () => {

            initContext();

            let sr, gr;
            let root;
            let value = Scalar.e(10);
            let key = [Scalar.one, Scalar.zero, Scalar.zero, Scalar.zero];

            // 0 Get zero
            gr = await smtGet(smt.empty, key);
            console.log("0: StorageSMTest Get zero value=" + gr.value.toString(16));

            // 1 Set insertNotFound
            sr = await smtSet(smt.empty, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("1: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 2 Get non zero
            gr = await smtGet(root, key);
            console.log("2: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // 3 Set deleteLast
            value=Scalar.e(0);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="deleteNotFound");
            // assert(sr.mode=="deleteLast");
            console.log("3: StorageSMTest Set deleteLast root=" + fea42String(fr, root) + " mode=" +sr.mode);

            // 4 Set insertNotFound
            value=Scalar.e(10);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            console.log("4: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 5 Set update
            value=Scalar.e(20);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="update");
            console.log("5: StorageSMTest Set update root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 6 Get non zero
            gr = await smtGet(root, key);
            console.log("6: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // 7 Set insertFound
            key[0] = Scalar.e(3);
            value = Scalar.e(20);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertFound");
            console.log("7: StorageSMTest Set insertFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 8 Get non zero
            gr = await smtGet(root, key);
            console.log("8: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // 9 Set deleteFound
            value = Scalar.e(0);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="deleteFound");
            console.log("9: StorageSMTest Set deleteFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 10 Get zero
            gr = await smtGet(root, key);
            console.log("10: StorageSMTest Get zero value=" + gr.value.toString(16));

            // 11 Set zeroToZzero
            value = Scalar.zero;
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="zeroToZero");
            console.log("11: StorageSMTest Set zeroToZero root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 12 Set insertFound
            value = Scalar.e(40);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertFound");
            console.log("12: StorageSMTest Set insertFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 13 Get non zero
            gr = await smtGet(root, key);
            console.log("13: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // 14 Set insertNotFound
            key[0] = Scalar.zero;
            key[1] = Scalar.one;
            value = Scalar.e(30);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("14: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // 15 Set deleteNotFound
            value = Scalar.zero;
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="deleteNotFound");
            console.log("15: StorageSMTest Set deleteNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            await executeAndVerify();
        });
        console.log("StorageSM_UnitTest done");
    }

    function zeroToZeroTest () {
        console.log("StorageSM_ZeroToZeroTest starting...");
        it('zeroTozeroTest', async () => {
            initContext();

            let sr, gr;
            let root;
            let value = Scalar.e(10);
            let key = [Scalar.one, Scalar.zero, Scalar.zero, Scalar.zero];

            // Set insertNotFound
            sr = await smtSet(smt.empty, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("0: StorageSM_ZeroToZeroTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" << sr.mode);

            // Set zeroToZzero
            key[0] = Scalar.zero;
            key[1] = Scalar.one;
            value = Scalar.zero;
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="zeroToZero");
            console.log("1: StorageSM_ZeroToZeroTest Set zeroToZero root=" + fea42String(fr, root) + " mode=" + sr.mode);

            await executeAndVerify();
        });
        console.log("StorageSM_ZeroToZeroTest done");
    }

    function zeroToZero2Test ()
    {
        console.log("StorageSM_ZeroToZero2Test starting...");
        it('zeroTozero2Test', async () => {
            initContext();

            let sr, gr;
            let root;
            let value = Scalar.e(10);
            let key = [Scalar.e(0x23), Scalar.zero, Scalar.zero, Scalar.zero];

            // Set insertNotFound
            sr = await smtSet(smt.empty, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("0: StorageSM_ZeroToZeroTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" << sr.mode);

            // Set insertFound
            key[0] = Scalar.e(0x1);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertFound");
            console.log("1: StorageSM_ZeroToZero2Test Set insertFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Set zeroToZzero
            key[0] = Scalar.e(0x73);
            value = Scalar.e(0);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="zeroToZero");
            console.log("2: StorageSM_ZeroToZero2Test Set zeroToZero root=" + fea42String(fr, root) + " mode=" + sr.mode);

            await executeAndVerify();

        });
        console.log("StorageSM_ZeroToZero2Test done");
    }

    function emptyTest () {
        console.log ("StorageSM_EmptyTest starting...");
        it('emptyTest', async () => {
            initContext();

            await executeAndVerify();
        });
        console.log("StorageSM_EmptyTest done");
    }



    function useCaseTest () {
        console.log ("StorageSM_UseCasteTest starting...");

        it('It should add and remove an element', async () => {
            initContext();

            const r1 = await smtSet (smt.empty, scalar2key(1, fr), Scalar.e(2));

            const rGet = await smtGet (r1.newRoot, scalar2key(1, fr));
            assert(Scalar.eq(rGet.value, Scalar.e(2)));

            const r2 = await smtSet (r1.newRoot, scalar2key(1, fr), Scalar.e(0));
            assert(smtUtils.nodeIsZero(r2.newRoot, fr));

            await executeAndVerify();
        });

        it('It should update an element 1', async () => {
            initContext();

            const r1 = await smtSet(smt.empty, scalar2key(1, fr), Scalar.e(2));
            const r2 = await smtSet(r1.newRoot, scalar2key(1, fr), Scalar.e(3));
            const r3 = await smtSet(r2.newRoot, scalar2key(1, fr), Scalar.e(2));

            assert(smtUtils.nodeIsEq(r1.newRoot, r3.newRoot, fr));

            await executeAndVerify();
        });

        it('It should add a shared element 2', async () => {
            initContext();

            const r1 = await smtSet(smt.empty, scalar2key(8, fr), Scalar.e(2));
            const r2 = await smtSet(r1.newRoot, scalar2key(9, fr), Scalar.e(3));
            const r3 = await smtSet(r2.newRoot, scalar2key(8, fr), Scalar.e(0));
            const r4 = await smtSet(r3.newRoot, scalar2key(9, fr), Scalar.e(0));

            assert(smtUtils.nodeIsZero(r4.newRoot, fr));

            await executeAndVerify();
        });

        it('It should add a shared element 3', async () => {
            initContext();

            const r1 = await smtSet(smt.empty, scalar2key(7, fr), Scalar.e(2));
            const r2 = await smtSet(r1.newRoot, scalar2key(15, fr), Scalar.e(3));
            const r3 = await smtSet(r2.newRoot, scalar2key(7, fr), Scalar.e(0));
            const r4 = await smtSet(r3.newRoot, scalar2key(15, fr), Scalar.e(0));

            assert(smtUtils.nodeIsZero(r4.newRoot, fr));

            await executeAndVerify();
        });

        it('It should add a shared element', async () => {
            initContext();

            const r1 = await smtSet(smt.empty, scalar2key(7, fr), Scalar.e(107));
            const r2 = await smtSet(r1.newRoot, scalar2key(15, fr), Scalar.e(115));
            const r3 = await smtSet(r2.newRoot, scalar2key(3, fr), Scalar.e(103));
            const r4 = await smtSet(r3.newRoot, scalar2key(7, fr), Scalar.e(0));
            const r5 = await smtSet(r4.newRoot, scalar2key(15, fr), Scalar.e(0));
            const r6 = await smtSet(r5.newRoot, scalar2key(3, fr), Scalar.e(0));

            assert(smtUtils.nodeIsZero(r6.newRoot, fr));

            await executeAndVerify();
        });

        it('Add-Remove 128 elements', async () => {
            initContext();

            const N = 128;

            let r = {
                newRoot: smt.empty,
            };

            for (let i = 0; i < N; i++) {
                r = await smtSet(r.newRoot, scalar2key(i, fr), Scalar.e(i + 1000));
            }

            for (let i = 0; i < N; i++) {
                r = await smtSet(r.newRoot, scalar2key(i, fr), Scalar.e(0));
            }

            assert(smtUtils.nodeIsZero(r.newRoot, fr));

            await executeAndVerify();
        });

        it('Should read random', async () => {
            initContext();

            let r = {
                newRoot: smt.empty,
            };

            for (let i = 0; i < 128; i++)
            {
                value = i + 1000;
                r = await smtSet(r.newRoot, scalar2key(i, fr), Scalar.e(value));
                assert(!smtUtils.nodeIsZero(r.newRoot, fr));
            }

            let r2;
            for (let i = 0; i < 128; i++)
            {
                r2 = await smtGet(r.newRoot, scalar2key(i, fr));
                assert(Scalar.eq(r2.value, Scalar.e(i+1000)));
            }

            await executeAndVerify();
        });

        it('It should add elements with similar keys', async () => {
            initContext();

            const expectedRoot = [
                442750481621001142n,
                12174547650106208885n,
                10730437371575329832n,
                4693848817100050981n,
            ];

            const r0 = await smtSet(smt.empty, scalar2key(0, fr), Scalar.e(2)); // 0x00
            const r1 = await smtSet(r0.newRoot, scalar2key(4369, fr), Scalar.e(2)); // 0x1111
            const r2 = await smtSet(r1.newRoot, scalar2key(69905, fr), Scalar.e(3)); // 0x11111

            assert(smtUtils.nodeIsEq(expectedRoot, r2.newRoot, fr));

            executeAndVerify();
        });

        it('It should update leaf with more than one level depth', async () => {
            initContext();

            const expectedRoot = [
                13590506365193044307n,
                13215874698458506886n,
                4743455437729219665n,
                1933616419393621600n,
            ];

            const r0 = await smtSet(
                smt.empty,
                scalar2key(Scalar.e('56714103185361745016746792718676985000067748055642999311525839752090945477479'), fr),
                Scalar.e('8163644824788514136399898658176031121905718480550577527648513153802600646339'),
            );

            const r1 = await smtSet(
                r0.newRoot,
                scalar2key(Scalar.e('980275562601266368747428591417466442501663392777380336768719359283138048405'), fr),
                Scalar.e('115792089237316195423570985008687907853269984665640564039457584007913129639934'),
            );

            const r2 = await smtSet(
                r1.newRoot,
                scalar2key(Scalar.e('53001048207672216258532366725645107222481888169041567493527872624420899640125'), fr),
                Scalar.e('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
            );

            const r3 = await smtSet(
                r2.newRoot,
                scalar2key(Scalar.e('60338373645545410525187552446039797737650319331856456703054942630761553352879'), fr),
                Scalar.e('7943875943875408'),
            );

            const r4 = await smtSet(
                r3.newRoot,
                scalar2key(Scalar.e('56714103185361745016746792718676985000067748055642999311525839752090945477479'), fr),
                Scalar.e('35179347944617143021579132182092200136526168785636368258055676929581544372820'),
            );
            assert(smtUtils.nodeIsEq(expectedRoot, r4.newRoot, fr));

            executeAndVerify();
        });

        it('It should Zero to Zero with isOldZero=0', async () => {
            initContext();

            const r0 = await smtSet(smt.empty, scalar2key(0x1, fr), Scalar.e(2)); // 0x00
            const r1 = await smtSet(r0.newRoot, scalar2key(0x2, fr), Scalar.e(3)); // 0x00
            const r2 = await smtSet(r1.newRoot, scalar2key(0x10000, fr), Scalar.e(0)); // 0x1111

            assert(!r2.isOldZero);

            executeAndVerify();
        });
    }

    // bugTest();
    unitTest();
/*    zeroToZeroTest();
    zeroToZero2Test();
    emptyTest();
    useCaseTest();*/
});
