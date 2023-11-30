const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;

const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smBinary = require("../../src/sm/sm_binary.js");

const input = [
    /////////
    // ADD
    /////////
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "649b4c45bb034df66329b0c327023b1eec4d927d75c3ef2525820401441a42f4",
        opcode: "0",
        type: 1,
    },
    /////////
    // SUB
    /////////
    {
        a: "2",
        b: "1",
        c: "1",
        opcode: "1",
        type: 1,
    },
    {
        a: "0",
        b: "1",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "1",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "1",
        type: 1,
    },
    {
        a: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1472822536335d5863c3d5cbeec73d922dc0edb31f7d1f567aeec32471c0d876",
        opcode: "1",
        type: 1,
    },
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "eb8d7ddac9cca2a79c3c2a341138c26dd23f124ce082e0a985113cdb8e3f278a",
        opcode: "1",
        type: 1,
    },

    /////////
    // LT
    /////////
    {
        a: "0",
        b: "1",
        c: "1",
        opcode: "2",
        type: 1,
    },
    {
        a: "1",
        b: "0",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "0",
        b: "0",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        opcode: "2",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "FFFF",
        b: "00FF",
        c: "0",
        opcode: "2",
        type: 1,
    },
    /////////
    // SLT
    /////////
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "1",
        opcode: "3",
        type: 1,
    },

    {
        a: "0",
        b: "0",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "1",
        b: "0",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "0",
        b: "1",
        c: "1",
        opcode: "3",
        type: 1,
    },
    {
        a: "FF00FF",
        b: "00FF00",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "00FF00",
        b: "FF00FF",
        c: "1",
        opcode: "3",
        type: 1,
    },
    {
        a: "FFEEDDCCBBAA",
        b: "FFEEDDCCBBAA",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0",
        c: "1",
        opcode: "3",
        type: 1,
    },
    {
        a: "0",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "800FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
        type: 1,
    },

    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "8000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "80FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
        type: 1,
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
        type: 1,
    },

    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "1",
        opcode: "3",
        type: 1,
    },
    /////////
    // EQ
    /////////
    {
        a: "3e9",
        b: "3e9",
        c: "1",
        opcode: "4",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        opcode: "4",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        opcode: "4",
        type: 1,
    },
    {
        a: "3f",
        b: "3f",
        c: "1",
        opcode: "4",
        type: 1,
    },
    {
        a: "FF00",
        b: "FF00",
        c: "1",
        opcode: "4",
        type: 1,
    },
    {
        a: "FF00",
        b: "00FF",
        c: "0",
        opcode: "4",
        type: 1,
    },
    {
        a: "FF00",
        b: "FFF00",
        c: "00",
        opcode: "4",
        type: 1,
    },

    /////////
    // AND
    /////////
    {
        a: "0F01",
        b: "0F01",
        c: "0F01",
        opcode: "5",
        type: 1,
    }, {
        a: "0E0E",
        b: "0101",
        c: "0000",
        opcode: "5",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "5",
        type: 1,
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        opcode: "5",
        type: 1,
    },
    /////////
    // OR
    /////////
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "b496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        opcode: "6",
        type: 1,
    },

    /////////
    // XOR
    /////////
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "7",
        type: 1,
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "7",
        type: 1,
    }, {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "49282253afcade99cc42e3c16f9c29ed241127d6183e0da8571c3fcb3c1388a",
        opcode: "7",
        type: 1,
    }
]

const error_input = [
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
        type: 1,
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "1",
        type: 1,
    },
    {
        a: "0",
        b: "1",
        c: "0",
        opcode: "2",
        type: 1,
    },
    {
        a: "1",
        b: "0",
        c: "1",
        opcode: "2",
        type: 1,
    },
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "0",
        opcode: "3",
        type: 1,
    },
    {
        a: "0000000000000000000000000000000000000000000000000000000000000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
        type: 1,
    },
    {
        a: "FF00",
        b: "FF00",
        c: "0",
        opcode: "4",
        type: 1,
    },
    {
        a: "FF00",
        b: "00FF",
        c: "1",
        opcode: "4",
        type: 1,
    },
    {
        a: "FF00",
        b: "FFF00",
        c: "100",
        opcode: "4",
        type: 1,
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0E0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        opcode: "5",
        type: 1,
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "a496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        opcode: "6",
        type: 1,
    },
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "EFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "7",
        type: 1,
    },
    {
        a: "00FF",
        b: "FF00",
        c: "1000000000000000000000000000000000000000000000000000000000000001",
        opcode: "2",
        type: 1,
    }
]

describe("test plookup operations", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    let pil;

    const N = 2**21;
    let constPols, cmPols;
    before(async function () {
        pil = await compile(Fr, "pil/binary.pil", null, {defines: { N }});

        constPols = newConstantPolsArray(pil);
        await smBinary.buildConstants(constPols.Binary);

        for (let i=0; i<constPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof constPols.$$array[i][j] !== "bigint") {
                    throw new Error(`Polinomial not fited ${constPols.$$defArray[i].name} at ${j}` )
                }
            }
        }
    });

    it("It should verify the binary operations pil", async () => {
        cmPols = newCommitPolsArray(pil);

        await smBinary.execute(cmPols.Binary, input);

        for (let i=0; i<cmPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof cmPols.$$array[i][j] !== 'bigint') {
                    throw new Error(`Polinomial not fited ${cmPols.$$defArray[i].name} at ${j}` )
                }
            }
        }
        // Verify
        const res = await verifyPil(Fr, pil, cmPols, constPols ,{continueOnError: true});

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });

    it("It should fail tests", async () => {
        cmPols = newCommitPolsArray(pil);

        await smBinary.execute(cmPols.Binary, error_input);

        let res = await verifyPil(Fr, pil, cmPols, constPols, { continueOnError: true })
        for (let i = 0; i < res.length; i++) {
            console.log(res[i]);
        }
        expect(res.length).to.not.eq(0);

        const plookupLine = pil.plookupIdentities[0].line;
        const prefix = 'binary.pil:'+plookupLine+':  plookup not found ';
        const suffix = ' (continue)';

        expect(res[0]).to.equal(prefix + 'w=31 values: 1,0,15,15,1,0,15,0' + suffix);
        expect(res[1]).to.equal(prefix + 'w=32 values: 0,1,255,255,0,0,1,0' + suffix);
        expect(res[2]).to.equal(prefix + 'w=95 values: 1,2,0,0,1,1,0,1' + suffix);
        expect(res[3]).to.equal(prefix + 'w=127 values: 1,2,0,0,0,1,1,0' + suffix);
        expect(res[4]).to.equal(prefix + 'w=159 values: 1,3,128,0,0,1,0,1' + suffix);
        expect(res[5]).to.equal(prefix + 'w=191 values: 1,3,0,255,1,1,1,0' + suffix);
        expect(res[6]).to.equal(prefix + 'w=223 values: 1,4,0,0,1,1,0,1' + suffix);
        expect(res[7]).to.equal(prefix + 'w=255 values: 1,4,0,0,0,1,1,0' + suffix);
        expect(res[8]).to.equal(prefix + 'w=257 values: 0,4,255,255,1,0,1,1' + suffix);
        expect(res[9]).to.equal(prefix + 'w=319 values: 1,5,15,15,0,0,14,0' + suffix);
        expect(res[10]).to.equal(prefix + 'w=351 values: 1,6,176,180,0,0,164,0' + suffix);
        expect(res[11]).to.equal(prefix + 'w=383 values: 1,7,15,240,0,0,239,0' + suffix);
        expect(res[12]).to.equal(prefix + 'w=384 values: 0,2,255,0,0,0,16,0' + suffix);
    })

});
