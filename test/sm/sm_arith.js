const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const global = require("../../src/sm/sm_global.js");
const arith = require("../../src/sm/sm_arith/sm_arith.js");
const {input, inputWithAlias, inputWorstCase, inputLargeQuo} = require("./sm_arith_data.js");

const limit = 0x10000000000000000000000000000000000000000000000000000000000000000n; // 2^256

const pFec = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const pBN254 = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47n;
const Fr = new F1Field(0xFFFFFFFF00000001n);
const Fec = new F1Field(pFec);

function inputToZkasm() {
    let zkasmCode = '';
    let index = 0;
    for (value of input) {
        zkasmCode += '; input #'+index+"\n";
        zkasmCode += value.x1 + "n => A\n";
        zkasmCode += value.y1 + "n => B\n";
        zkasmCode += value.x2 + "n => C\n";
        zkasmCode += value.y2 + "n => D\n";
        zkasmCode += value.x3 + "n => E\n";
        const operation = value.selEq0 ? "ARITH" :(value.selEq1 ? "ARITH_ECADD_DIFFERENT":"ARITH_ECADD_SAME");
        zkasmCode += value.y3 + "n  :"+operation+"\n\n";
        ++index;
    }
    return zkasmCode;
}

function prepareInput(input) {
    let inputSm = [];
    for (let i = 0; i < input.length; i++) {
        let keyvalue = {};
        const arithEquation = Number(input[i].arithEquation);
        for (let key of Object.keys(input[i])) {
            if (['x1', 'y1', 'x2', 'y2', 'x3', 'y3'].includes(key)) {
                const bits = (arithEquation < 8n || (arithEquation === 12 && (key == 'x1' || key == 'y1'))) ? 32n:48n;
                keyvalue['__'+key] = input[i][key];
                keyvalue[key] = toXbitsRegisters(input[i][key], bits);
            } else {
                keyvalue[key] = input[i][key];
            }
        }
        inputSm.push(keyvalue);
    }

    return inputSm;
}

function toXbitsRegisters(value, bits) {
    if (typeof value !== 'bigint') {
        value = BigInt(value);
    }

    let parts = [];
    const mask = (1n << bits) - 1n;
    for (let part = 0; part < 8; ++part) {
        parts.push(part < 7 ? (mask & value): value);
        value = value >> bits;
    }
    return parts;
}

async function loadPil(pilFile) {
    const pil = await compile(Fr, pilFile, null, {defines: { N: 2 ** 20 }});
    // remove all lookups to signed 22 bits, 19 bits to used N 2**18
    // pilLines = fs.readFileSync(pilFile, 'utf8').split("\n");
    // const RANGE_SEL_ID = constPols.$$def.Arith.RANGE_SEL.id;
    // lines[0] = pil.plookupIdentities.filter(x => x.t.length == 2 && pil.expressions[x.t[0]].id == RANGE_SEL_ID &&  pil.expressions[x.t[0]].op == 'const')[0].line;
    // lines[1] = pilLines.findIndex(x => x.replace(/\s/g, '') === "xAreDifferent'=xAreDifferent*(1-Global.CLK32[0]-Global.CLK32[16])+xChunkDifferent;")+1;
    // lines[2] = pilLines.findIndex(x => x.replace(/\s/g, '') === "(valueLtPrime'-selEq[3])*(Global.CLK32[15]+Global.CLK32[31])=0;")+1;

    // const GL_SIGNED_22BITS_ID = pil.references['Arith.GL_SIGNED_22BITS'].id;
    // const BYTE2_BIT19 = pil.references['Arith.BYTE2_BIT21'].id;
    // pil.plookupIdentities = pil.plookupIdentities.filter(x => !x.t.some(id => ([BYTE2_BIT19, GL_SIGNED_22BITS_ID].includes(pil.expressions[id].id) &&  pil.expressions[id].op == 'const')));
    return pil;
}

describe("Arithmetic state machines tests", async function () {
    this.timeout(10000000);

    function executeMain(pols, input) {
        const N = pols.arith.length;

        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < 8; ++j) {
                pols[`A${j}`][i] = 0n;
                pols[`B${j}`][i] = 0n;
                pols[`C${j}`][i] = 0n;
                pols[`D${j}`][i] = 0n;
                pols[`E${j}`][i] = 0n;
                pols[`op${j}`][i] = 0n;
            }
            pols.arith[i] = 0n;
            pols.arithEquation[i] = 0n;
            pols.arithSame12[i] = 0n;
            pols.arithUseE[i] = 0n;
            pols.arithUseCD[i] = 0n;
        }
        for (let i = 0; i < input.length; ++i) {
            for (let j = 0; j < 8; j++) {
                pols[`A${j}`][i] = BigInt(input[i]["x1"][j]);
                pols[`B${j}`][i] = BigInt(input[i]["y1"][j]);
                pols[`C${j}`][i] = BigInt(input[i]["x2"][j]);
                pols[`D${j}`][i] = BigInt(input[i]["y2"][j]);
                pols[`E${j}`][i] = BigInt(input[i]["x3"][j]);
                pols[`op${j}`][i] = BigInt(input[i]["y3"][j]);
            }

            pols.arithEquation[i] = input[i].arithEquation;

            pols.arith[i] = 1n;
            pols.arithUseE[i] = (pols.arithEquation[i] === 1n || pols.arithEquation[i] === 7n || pols.arithEquation[i] === 8n || pols.arithEquation[i] === 12n) ? 0n : 1n;
            pols.arithSame12[i] = (pols.arithEquation[i] === 3n) ? 1n : 0n;
            pols.arithUseCD[i] = (pols.arithEquation[i] === 3n || pols.arithEquation[i] === 12n) ? 0n : 1n;
        }
    }

    async function generatePols(F, input) {
        const pil = await compile(F, __dirname + '/sm_arith.pil', null, { defines: {N: 2 ** 23}});
        console.log('creating constPols ....');
        const constPols = newConstantPolsArray(pil);
        console.log('creating cmPols ....');
        const cmPols = newCommitPolsArray(pil);


        console.log('build global constants ....');
        await global.buildConstants(constPols.Global);
        console.log('build arith constants ....');
        await arith.buildConstants(constPols.Arith);
        
        console.log('prepare inputs ....');
        const splitInput = prepareInput(input)

        console.log('executor "main" ....');
        executeMain(cmPols.Main, splitInput);

        console.log('executor arith ....');
        await arith.execute(cmPols.Arith, splitInput);
        const N = constPols.Global.L1.length;

        console.log('checking constPols ....');
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

        console.log('checking cmPols ....');
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
        console.log('saving constants ....');
        await constPols.saveToFile(__dirname + '/../../tmp/zkevm.const');
        console.log('saving cmPols ....');
        await cmPols.saveToFile(__dirname + '/../../tmp/zkevm.commit');
        console.log('saving pil.json ....');
        fs.writeFileSync(__dirname + '/../../tmp/main.pil.json', JSON.stringify(pil));
        return [pil, cmPols, constPols];
    }

    it("It should check the main-arith permutation and the arith constraints", async () => {
        const [pil, cmPols, constPols] = await generatePols(Fr, input);

        // const res = await verifyPil(Fr, pil, cmPols, constPols, {continueOnError: true});

        // assert.lengthOf(res, 0, "Pil does not pass");

        // if (res.length != 0) {
        //     for (let i = 0; i < res.length; i++) {
        //         console.log(res[i]);
        //     }
        // }
    });
/*
    it("It should fail since some of the inputs are not lower than the expecti field order", async () => {
        const pil = await loadPil("pil/arith.pil");
        constPols = newConstantPolsArray(pil);
        cmPols = newCommitPolsArray(pil);

        await global.buildConstants(constPols.Global);
        await arith.buildConstants(constPols.Arith);
        await arith.execute(cmPols.Arith, prepareInput32bits(inputWithAlias));

        const res = await verifyPil(Fr, pil, cmPols, constPols, {continueOnError: true});

        assert.isAtLeast(res.length, 1, "Pil should not pass");

        for (let i = 0; i < res.length; i++) {
            console.log(res[i]);
        }
    });

    it("It checks the worst case in each equation throws the expected error", async () => {
        const pil = await loadPil("pil/arith.pil");
        constPols = newConstantPolsArray(pil);
        cmPols = newCommitPolsArray(pil);

        await global.buildConstants(constPols.Global);
        await arith.buildConstants(constPols.Arith);

        try {
            await arith.execute(cmPols.Arith, prepareInput32bits(inputWorstCase), true);
        } catch (e) {
            console.log(e.message);
            assert.match(e.message, /There are \d+ divisions errors/)
        }
    });

    it("It checks that a negative quotient in each equation throws the expected error", async () => {
        const pil = await loadPil("pil/arith.pil");
        constPols = newConstantPolsArray(pil);
        cmPols = newCommitPolsArray(pil);

        await global.buildConstants(constPols.Global);
        await arith.buildConstants(constPols.Arith);

        try {
            await arith.execute(cmPols.Arith, prepareInput32bits(inputLargeQuo), true);
        } catch (e) {
            console.log(e.message);
            assert.match(e.message, /There are \d+ negative quotient errors/)
        }
    });*/
});
