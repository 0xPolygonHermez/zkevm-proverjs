const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;

const F1Field = require("ffjavascript").F1Field;

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("@0xpolygonhermez/pilcom");
const smBinary = require("../src/sm/sm_binary.js");

const input = [
    /////////
    // ADD
    /////////
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "649b4c45bb034df66329b0c327023b1eec4d927d75c3ef2525820401441a42f4",
        opcode: "0",
    },
    /////////
    // SUB
    /////////
    {
        a: "2",
        b: "1",
        c: "1",
        opcode: "1",
    },
    {
        a: "0",
        b: "1",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "1",

    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "1",
    },
    {
        a: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1472822536335d5863c3d5cbeec73d922dc0edb31f7d1f567aeec32471c0d876",
        opcode: "1",
    },
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "eb8d7ddac9cca2a79c3c2a341138c26dd23f124ce082e0a985113cdb8e3f278a",
        opcode: "1",
    },

    /////////
    // LT
    /////////
    {
        a: "0",
        b: "1",
        c: "1",
        opcode: "2"
    },
    {
        a: "1",
        b: "0",
        c: "0",
        opcode: "2"
    },
    {
        a: "0",
        b: "0",
        c: "0",
        opcode: "2"
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        opcode: "2",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        opcode: "2",
    },
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        opcode: "2",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        opcode: "2",
    },
    {
        a: "FFFF",
        b: "00FF",
        c: "0",
        opcode: "2",
    },
    /////////
    // SLT
    /////////
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "1",
        opcode: "3",
    },

    {
        a: "0",
        b: "0",
        c: "0",
        opcode: "3",
    },
    {
        a: "1",
        b: "0",
        c: "0",
        opcode: "3",
    },
    {
        a: "0",
        b: "1",
        c: "1",
        opcode: "3",
    },
    {
        a: "FF00FF",
        b: "00FF00",
        c: "0",
        opcode: "3",
    },
    {
        a: "00FF00",
        b: "FF00FF",
        c: "1",
        opcode: "3",
    },
    {
        a: "FFEEDDCCBBAA",
        b: "FFEEDDCCBBAA",
        c: "0",
        opcode: "3",
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0",
        c: "1",
        opcode: "3",
    },
    {
        a: "0",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
    },
    {
        a: "800FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
    },

    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "8000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "3",
    },
    {
        a: "80FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
    },
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
    },

    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "0",
        opcode: "3",
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "1",
        opcode: "3",
    },
    /////////
    // EQ
    /////////
    {
        a: "3e9",
        b: "3e9",
        c: "1",
        opcode: "4",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        opcode: "4",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        opcode: "4",
    },
    {
        a: "3f",
        b: "3f",
        c: "1",
        opcode: "4",
    },
    {
        a: "FF00",
        b: "FF00",
        c: "1",
        opcode: "4",
    },
    {
        a: "FF00",
        b: "00FF",
        c: "0",
        opcode: "4",
    },
    {
        a: "FF00",
        b: "FFF00",
        c: "00",
        opcode: "4",
    },

    /////////
    // AND
    /////////
    {
        a: "0F01",
        b: "0F01",
        c: "0F01",
        opcode: "5",
    }, {
        a: "0E0E",
        b: "0101",
        c: "0000",
        opcode: "5",
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "5",
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        opcode: "5",
    },
    /////////
    // OR
    /////////
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "b496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        opcode: "6",
    },

    /////////
    // XOR
    /////////
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        opcode: "7",
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "7",
    }, {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "49282253afcade99cc42e3c16f9c29ed241127d6183e0da8571c3fcb3c1388a",
        opcode: "7",
    }
]

const error_input = [
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        opcode: "0",
    },
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "1",
    },
    {
        a: "0",
        b: "1",
        c: "0",
        opcode: "2"
    },
    {
        a: "1",
        b: "0",
        c: "1",
        opcode: "2"
    },
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "0",
        opcode: "3",
    },
    {
        a: "0000000000000000000000000000000000000000000000000000000000000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        opcode: "3",
    },
    {
        a: "FF00",
        b: "FF00",
        c: "0",
        opcode: "4",
    },
    {
        a: "FF00",
        b: "00FF",
        c: "1",
        opcode: "4",
    },
    {
        a: "FF00",
        b: "FFF00",
        c: "100",
        opcode: "4",
    }, {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0E0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        opcode: "5",
    },
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "a496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        opcode: "6",
    },
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "EFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        opcode: "7",
    },
    {
        a: "00FF",
        b: "FF00",
        c: "1000000000000000000000000000000000000000000000000000000000000001",
        opcode: "2",
    }
]

describe("test plookup operations", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    let pil;

    let constPols, constPolsArray, constPolsDef, cmPols, cmPolsArray, cmPolsDef;
    before(async function () {
        pil = await compile(Fr, "pil/binary.pil");
        [constPols, constPolsArray, constPolsDef] = createConstantPols(pil);
        await smBinary.buildConstants(constPols.Binary, constPolsDef.Binary);
    });

    it("It should verify the binary operations pil", async () => {
        [cmPols, cmPolsArray, cmPolsDef] = createCommitedPols(pil);

        await smBinary.execute(cmPols.Binary, cmPolsDef.Binary, input);

        // Verify
        const res = await verifyPil(Fr, pil, cmPolsArray, constPolsArray);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });


    it("It should fail tests", async () => {
        [cmPols, cmPolsArray, cmPolsDef] = createCommitedPols(pil);

        await smBinary.execute(cmPols.Binary, cmPolsDef.Binary, error_input);

        let res = await verifyPil(Fr, pil, cmPolsArray, constPolsArray, { continueOnError: true })
        for (let i = 0; i < res.length; i++) {
            console.log(res[i]);
        }
        expect(res.length).to.not.eq(0);

        expect(res[0]).to.equal('pil/binary.pil:78:  plookup not found w=31 values: 1,0,15,15,1,0,15,0');
        expect(res[1]).to.equal('pil/binary.pil:78:  plookup not found w=32 values: 0,1,255,255,0,0,1,0');
        expect(res[2]).to.equal('pil/binary.pil:78:  plookup not found w=95 values: 1,2,0,0,1,1,0,1');
        expect(res[3]).to.equal('pil/binary.pil:78:  plookup not found w=127 values: 1,2,0,0,0,1,1,0');
        expect(res[4]).to.equal('pil/binary.pil:78:  plookup not found w=159 values: 1,3,128,0,0,1,0,1');
        expect(res[5]).to.equal('pil/binary.pil:78:  plookup not found w=191 values: 1,3,0,255,1,1,1,0');
        expect(res[6]).to.equal('pil/binary.pil:78:  plookup not found w=223 values: 1,4,0,0,1,1,0,1');
        expect(res[7]).to.equal('pil/binary.pil:78:  plookup not found w=255 values: 1,4,0,0,0,1,1,0');
        expect(res[8]).to.equal('pil/binary.pil:78:  plookup not found w=257 values: 0,4,255,255,1,0,1,1');
        expect(res[9]).to.equal('pil/binary.pil:78:  plookup not found w=319 values: 1,5,15,15,0,0,14,0');
        expect(res[10]).to.equal('pil/binary.pil:78:  plookup not found w=351 values: 1,6,176,180,0,0,164,0');
        expect(res[11]).to.equal('pil/binary.pil:78:  plookup not found w=383 values: 1,7,15,240,0,0,239,0');
        expect(res[12]).to.equal('pil/binary.pil:78:  plookup not found w=384 values: 0,2,255,0,0,0,16,0');

    })

});
