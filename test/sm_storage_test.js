const fs = require('fs');

const SMT = require("@polygon-hermez/zkevm-commonjs").SMT;
const MemDB = require("@polygon-hermez/zkevm-commonjs").MemDB;
const smtUtils = require("@polygon-hermez/zkevm-commonjs").smtUtils;
const buildPoseidon = require("@polygon-hermez/zkevm-commonjs").getPoseidon;
const scalar2key = require("@polygon-hermez/zkevm-commonjs/test/helpers/test-utils.js").scalar2key;
const Scalar = require("ffjavascript").Scalar;
const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("zkpil");
const StorageRom = require("../src/sm/sm_storage_rom.js").StorageRom;
const sm_storage = require("../src/sm/sm_storage.js");
const sm_poseidong = require("../src/sm/sm_poseidong.js");

const { isLogging, logger, fea42String, fea42String10, scalar2fea4, fea4IsEq }  = require("../src/sm/sm_storage_utils.js");

const LOG_SMT_RESULT = false;

describe("Test storage operations", async function () {
    let poseidon;
    let fr;
    let pil;
    let constPols, constPolsArray, constPolsDef;
    let cmPols, cmPolsArray, cmPolsDef;
    let db;
    let smt;
    const required = {Storage: []};

    this.timeout(10000000);

    before(async () => { 
        poseidon = await buildPoseidon();
        fr = poseidon.F;

        pil = await compile(fr, "pil/storage.pil");        
    })

    function initContext () {
        [constPols, constPolsArray, constPolsDef] = createConstantPols(pil);
        [cmPols, cmPolsArray, cmPolsDef] = createCommitedPols(pil);
        
        db = new MemDB(fr);
        smt = new SMT(db, poseidon, fr);    
    }

    async function smtSet (oldRoot, key, value) {
        const r = await smt.set(oldRoot, key, value);
        required.Storage.push({bIsSet: true, 
            setResult: {
                oldRoot: [...r.oldRoot],
                newRoot: [...r.newRoot],
                key: [...r.key],
                siblings: [...r.siblings],
                insKey: r.insKey ? [...r.insKey] : new Array(4).fill(Scalar.zero),
                insValue: r.insValue,
                isOld0: r.isOld0,
                oldValue: r.oldValue,
                newValue: r.newValue,
                mode: r.mode
            }}); 
        if (LOG_SMT_RESULT) console.log(r);  
        return r;
    }

    async function smtGet (root, key) {
        const r = await smt.get(root, key);
        required.Storage.push({bIsSet: false, 
            getResult: {
                root: [...r.root],
                key: [...r.key],
                siblings: [...r.siblings],
                insKey: r.insKey ? [...r.insKey] : new Array(4).fill(Scalar.zero),
                insValue: r.insValue,
                isOld0: r.isOld0,
                value: r.value
            }});   
        if (LOG_SMT_RESULT) console.log(r);  
        return r;
    }

    async function executeAndVerify () {
        await sm_storage.buildConstants(constPols.Storage, constPolsDef.Storage);
        const req = await sm_storage.execute(cmPols.Storage, cmPolsDef.Storage, required.Storage);
        
        await sm_poseidong.buildConstants(constPols.PoseidonG, constPolsDef.PoseidonG);
        await sm_poseidong.execute(cmPols.PoseidonG, cmPolsDef.PoseidonG, req.PoseidonG);

        // Verify
        const res = await verifyPil(fr, pil, cmPolsArray, constPolsArray);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    }

    function unitTest () {
        console.log ("StorageSM_UnitTest starting...");
        it('Storage Unit test', async () => {

            initContext();
        
            let sr, gr;
            let root;
            let value = Scalar.e(10);
            let key = [Scalar.one, Scalar.zero, Scalar.zero, Scalar.zero];

            // Get zero
            gr = await smtGet(smt.empty, key);
            console.log("0: StorageSMTest Get zero value=" + gr.value.toString(16));
        
            // Set insertNotFound
            sr = await smtSet(smt.empty, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("1: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Get non zero
            gr = await smtGet(root, key);
            console.log("2: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // Set deleteLast
            value=Scalar.e(0);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="deleteLast");
            console.log("3: StorageSMTest Set deleteLast root=" + fea42String(fr, root) + " mode=" +sr.mode);

            // Set insertNotFound
            value=Scalar.e(10);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            console.log("4: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Set update
            value=Scalar.e(20);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="update");
            console.log("5: StorageSMTest Set update root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Get non zero
            gr = await smtGet(root, key);
            console.log("6: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // Set insertFound
            key[0] = Scalar.e(3);
            value = Scalar.e(20);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertFound");
            console.log("7: StorageSMTest Set insertFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Get non zero
            gr = await smtGet(root, key);
            console.log("8: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // Set deleteFound
            value = Scalar.e(0);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="deleteFound");
            console.log("9: StorageSMTest Set deleteFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Get zero
            gr = await smtGet(root, key);
            console.log("10: StorageSMTest Get zero value=" + gr.value.toString(16));

            // Set zeroToZzero
            value = Scalar.zero;
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="zeroToZero");
            console.log("11: StorageSMTest Set zeroToZero root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Set insertFound
            value = Scalar.e(40);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertFound");
            console.log("12: StorageSMTest Set insertFound root=" + fea42String(fr, root) + " mode=" + sr.mode);
            
            // Get non zero
            gr = await smtGet(root, key);
            console.log("13: StorageSMTest Get nonZero value=" + gr.value.toString(16));

            // Set insertNotFound
            key[0] = Scalar.zero;
            key[1] = Scalar.one;
            value = Scalar.e(30);
            sr = await smtSet(root, key, value);
            root = [...sr.newRoot];
            assert(sr.mode=="insertNotFound");
            console.log("14: StorageSMTest Set insertNotFound root=" + fea42String(fr, root) + " mode=" + sr.mode);

            // Set deleteNotFound
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

    unitTest();
    zeroToZeroTest();
    zeroToZero2Test();
    emptyTest();
    useCaseTest();
});
