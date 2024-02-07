const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;

const F1Field = require("ffjavascript").F1Field;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smGlobal = require("../../src/sm/sm_global.js");
const smBinary = require("../../src/sm/sm_binary.js");

const input = [
    /////////
    // ADD
    /////////

    // w=0
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        carry: 0,
        opcode: "0",
        type: 1,
    },

    // w=1
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        carry: 1,
        opcode: "0",
        type: 1,
    },
    // w=2
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "649b4c45bb034df66329b0c327023b1eec4d927d75c3ef2525820401441a42f4",
        carry: 1,
        opcode: "0",
        type: 1,
    },
    /////////
    // SUB
    /////////
    // w=3
    {
        a: "2",
        b: "1",
        c: "1",
        carry: 0,
        opcode: "1",
        type: 1,
    },
    // w=4
    {
        a: "0",
        b: "1",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        carry: 1,
        opcode: "1",
        type: 1,
    },
    // w=5
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "1",
        type: 1,
    },
    // w=6
    {
        a: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1472822536335d5863c3d5cbeec73d922dc0edb31f7d1f567aeec32471c0d876",
        carry: 0,
        opcode: "1",
        type: 1,
    },
    // w=7
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "eb8d7ddac9cca2a79c3c2a341138c26dd23f124ce082e0a985113cdb8e3f278a",
        carry: 1,
        opcode: "1",
        type: 1,
    },

    /////////
    // LT
    /////////
    // w=8
    {
        a: "0",
        b: "1",
        c: "1",
        carry: 1,
        opcode: "2",
        type: 1,
    },
    // w=9
    {
        a: "1",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    // w=10
    {
        a: "0",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    // w=11
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    // w=12
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    // w=13
    {
        a: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        carry: 1,
        opcode: "2",
        type: 1,
    },
    // w=14
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "a01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    // w=15
    {
        a: "FFFF",
        b: "00FF",
        c: "0",
        carry: 0,
        opcode: "2",
        type: 1,
    },
    /////////
    // SLT
    /////////
    // w=16
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },

    // w=17
    {
        a: "0",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=18
    {
        a: "1",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=19
    {
        a: "0",
        b: "1",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    // w=20
    {
        a: "FF00FF",
        b: "00FF00",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=21
    {
        a: "00FF00",
        b: "FF00FF",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    // w=22
    {
        a: "FFEEDDCCBBAA",
        b: "FFEEDDCCBBAA",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=23
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    // w=24
    {
        a: "0",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=25
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=26
    {
        a: "800FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=27
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    // w=28
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "8000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=29
    {
        a: "80FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    // w=30
    {
        a: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },

    // w=31
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FF00FFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "0",
        carry: 0,
        opcode: "3",
        type: 1,
    },
    // w=32
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000",
        c: "1",
        carry: 1,
        opcode: "3",
        type: 1,
    },
    /////////
    // EQ
    /////////
    // w=33
    {
        a: "3e9",
        b: "3e9",
        c: "1",
        carry: 1,
        opcode: "4",
        type: 1,
    },
    // w=34
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "0",
        c: "0",
        carry: 0,
        opcode: "4",
        type: 1,
    },
    // w=35
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        c: "1",
        carry: 1,
        opcode: "4",
        type: 1,
    },
    // w=36
    {
        a: "3f",
        b: "3f",
        c: "1",
        carry: 1,
        opcode: "4",
        type: 1,
    },
    // w=37
    {
        a: "FF00",
        b: "FF00",
        c: "1",
        carry: 1,
        opcode: "4",
        type: 1,
    },
    // w=38
    {
        a: "FF00",
        b: "00FF",
        c: "0",
        carry: 0,
        opcode: "4",
        type: 1,
    },
    // w=39
    {
        a: "FF00",
        b: "FFF00",
        c: "00",
        carry: 0,
        opcode: "4",
        type: 1,
    },

    /////////
    // AND
    /////////
    // w=40
    {
        a: "0F01",
        b: "0F01",
        c: "0F01",
        carry: 1,
        opcode: "5",
        type: 1,
    },
    // w=41
    {
        a: "0E0E",
        b: "0101",
        c: "0000",
        carry: 0,
        opcode: "5",
        type: 1,
    },
    // w=42
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        carry: 1,
        opcode: "5",
        type: 1,
    },
    // w=43
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        carry: 1,
        opcode: "5",
        type: 1,
    },
    /////////
    // OR
    /////////
    // w=44
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "b496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        carry: 0,
        opcode: "6",
        type: 1,
    },

    /////////
    // XOR
    /////////
    // w=45
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "7",
        type: 1,
    },
    // w=46
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        carry: 0,
        opcode: "7",
        type: 1,
    },
    // w=47
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "49282253afcade99cc42e3c16f9c29ed241127d6183e0da8571c3fcb3c1388a",
        carry: 0,
        opcode: "7",
        type: 1,
    },
    /////////
    // LT4
    /////////
    // w=48 (+0)
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=49 (+1)
    {
        a: "FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=50 (+2)
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "000000000000000000000000000000000000000000000000FFFFFFFF00000001",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=51 (+3)
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=52 (+4)
    {
        a: "FFEFFFFFFFFFFFFF000000000000000000000000000000000000000000000000",
        b: "FFFEFFFFFFFFFFFF000000000000000000000000000000000000000000000000",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=53 (+5)
    {
        a: "FFEFFFFFFFFFFFFF00000000000000000000000000000000FFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFF00000000000000000000000000000000FFFEFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=54 (+6)
    {
        a: "FFEFFFFFFFFFFFFF0000000000000000FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFF0000000000000000FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=55 (+7)
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF0000000000000000FFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF0000000000000000FFFEFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=56 (+8)
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF0000000000000000",
        b: "FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF0000000000000000",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=57 (+9)
    {
        a: "0000000000000000FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "0000000000000000FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF",
        c: "0",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=58 (+10)
    {
        a: "FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 2,
    }
]

const error_input = [
    // w=0 Binary.w=[0..15]
    {
        a: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE",
        carry: 0n,
        opcode: "0", // ADD
        type: 1,
    },
    // w=1 Binary.w=[16..31]
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 0n,
        opcode: "1", // SUB
        type: 1,
    },
    // w=2 Binary.w=[32..47]
    {
        a: "0",
        b: "1",
        c: "0",
        carry: 1n,
        opcode: "2", // LT
        type: 1,
    },
    // w=3 Binary.w=[48..63]
    {
        a: "1",
        b: "0",
        c: "1",
        carry: 0n,
        opcode: "2", // LT
        type: 1,
    },
    // w=4 Binary.w=[64..79]
    {
        a: "8000000000000000000000000000000000000000000000000000000000000000",
        b: "0000000000000000000000000000000000000000000000000000000000000000",
        c: "0",
        carry: 0n,
        opcode: "3", // SLT
        type: 1,
    },
    // w=5 Binary.w=[80..95]
    {
        a: "0000000000000000000000000000000000000000000000000000000000000000",
        b: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1",
        carry: 0n,
        opcode: "3", // SLT
        type: 1,
    },
    // w=6 Binary.w=[96..111]
    {
        a: "FF00",
        b: "FF00",
        c: "0",
        carry: 1n,
        opcode: "4", // EQ
        type: 1,
    },
    // w=7 Binary.w=[112..127]
    {
        a: "FF00",
        b: "00FF",
        c: "1",
        carry: 0n,
        opcode: "4", // EQ
        type: 1,
    },
    // w=8 Binary.w=[128..143]
    {
        a: "FF00",
        b: "FFF00",
        c: "100",
        carry: 0n,
        opcode: "4", // EQ
        type: 1,
    },
    // w=9 Binary.w=[144,159]
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        c: "0E0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        carry: 1n,
        opcode: "5", // AND
        type: 1,
    },
    // w=10 Binary.w=[160..175]
    {
        a: "b01465104267f84effb2ed7b9c1d7ec65f4652652b2367e75549a06e692cb53f",
        b: "b486e735789b55a76376c3478ae4bc588d0740184aa0873dd0386392daed8db5",
        c: "a496e7357afffdeffff6ef7f9efdfededf47527d6ba3e7ffd579e3fefbedbdbf",
        carry: 0n,
        opcode: "6", // OR
        type: 1,
    },
    // w=11 Binary.w=[176..191]
    {
        a: "0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F",
        b: "F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0",
        c: "EFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        carry: 0n,
        opcode: "7",  // XOR
        type: 1,
    },
    // w=12 Binary.w=[192..207]
    {
        a: "00FF",
        b: "FF00",
        c: "1000000000000000000000000000000000000000000000000000000000000001",
        carry: 1n,
        opcode: "2",  // LT
        type: 1,
    },
    // w=13 Binary.w=[208..223]
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "0",
        carry: 1,
        opcode: "8", // LT4
        type: 1,
    },
    // w=14 Binary.w=[224..239]
    {
        a: "FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "1000000000000000000000000000000000000000000000000000000000000001",
        carry: 1,
        opcode: "8", // LT4
        type: 1,
    },
    // w=15 Binary.w=[240..255]
    {
        a: "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        b: "000000000000000000000000000000000000000000000000FFFFFFFF00000001",
        c: "1",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=16 Binary.w=[256..271]
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "0",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=17 Binary.w=[272..287]
    {
        a: "FFEFFFFFFFFFFFFF000000000000000000000000000000000000000000000000",
        b: "FFFEFFFFFFFFFFFF000000000000000000000000000000000000000000000000",
        c: "0000000000000000000000000000000000000000000000000000000000000001",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=18 Binary.w=[288..303]
    {
        a: "FFEFFFFFFFFFFFFF00000000000000000000000000000000FFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFF00000000000000000000000000000000FFFEFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=19 Binary.w=[304..320]
    {
        a: "FFEFFFFFFFFFFFFF0000000000000000FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFF0000000000000000FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF",
        c: "1",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=20
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF0000000000000000FFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF0000000000000000FFFEFFFFFFFFFFFF",
        c: "1",
        carry: 0,
        opcode: "8",
        type: 1,
    },
    // w=21
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF0000000000000000",
        b: "FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF0000000000000000",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=22
    {
        a: "0000000000000000FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "0000000000000000FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF",
        c: "1",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=23
    {
        a: "FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000",
        b: "FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001FFFFFFFF00000001",
        c: "1000000000000000000000000000000000000000000000000000000000000001",
        carry: 1,
        opcode: "8",
        type: 2,
    },
    // w=24 Binary.w=[256..271]
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF",
        b: "FFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        c: "1000000000000000000000000000000000000000000000000000000000000000",
        carry: 1,
        opcode: "8",
        type: 1,
    },
    // w=25
    {
        a: "FFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFF0000000000000000",
        b: "FFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFEFFFFFFFFFFFF0000000000000000",
        c: "1000000000000000000000000000000000000000000000000000000000000000",
        carry: 1,
        opcode: "8",
        type: 1,
    },
]


describe("test plookup operations", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    let pil;

    const N = 2**22;
    let constPols, cmPols;
    async function preparePilFromString() {
        // pil = await compile(Fr, "pil/binary.pil", null, {defines: { N }});
        pil = await compile(Fr, ['include "pil/binary.pil";',
            'namespace Main(2**22);',
            'pol commit A[8],B[8],C[8],binOpcode,carry,bin,range;',
            'bin {',
            '   binOpcode,',
            '   A[0], A[1], A[2], A[3], A[4], A[5], A[6], A[7],',
            '   B[0], B[1], B[2], B[3], B[4], B[5], B[6], B[7],',
            '   C[0], C[1], C[2], C[3], C[4], C[5], C[6], C[7],',
            '   carry',
            '} is',
            'Binary.resultBinOp {',
            '   Binary.lOpcode,',
            '   Binary.a[0], Binary.a[1], Binary.a[2], Binary.a[3], Binary.a[4], Binary.a[5], Binary.a[6], Binary.a[7],',
            '   Binary.b[0], Binary.b[1], Binary.b[2], Binary.b[3], Binary.b[4], Binary.b[5], Binary.b[6], Binary.b[7],',
            '   Binary.c[0], Binary.c[1], Binary.c[2], Binary.c[3], Binary.c[4], Binary.c[5], Binary.c[6], Binary.c[7],',
            '   Binary.lCout',
            '};',
            'range {',
            '   A[0], A[1], A[2], A[3], A[4], A[5], A[6], A[7],',
            '   %GL_L, %GL_H, %GL_L, %GL_H, %GL_L, %GL_H, %GL_L, %GL_H,',
            '   8,1',
            '} is',
            'Binary.resultValidRange {',
            '   Binary.a[0], Binary.a[1], Binary.a[2], Binary.a[3], Binary.a[4], Binary.a[5], Binary.a[6], Binary.a[7],',
            '   Binary.b[0], Binary.b[1], Binary.b[2], Binary.b[3], Binary.b[4], Binary.b[5], Binary.b[6], Binary.b[7],',
            '   Binary.lOpcode, Binary.lCout',
            '};'].join("\n"), null, {compileFromString: true, defines: { N }});
        await buildConstants();
    }
    async function preparePil() {
        pil = await compile(Fr, "pil/binary.pil", null, {defines: { N }});
        await buildConstants();
    }
    async function buildConstants() {
        constPols = newConstantPolsArray(pil);
        await smGlobal.buildConstants(constPols.Global);
        await smBinary.buildConstants(constPols.Binary);

        for (let i=0; i<constPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof constPols.$$array[i][j] !== "bigint") {
                    throw new Error(`Polynomial not fited ${constPols.$$defArray[i].name} at ${j}` )
                }
            }
        }
    }

    function smMainExecute (cmPols, input) {
        // fill main inputs
        const MASK32 = (2n ** 32n - 1n);
        for (let index = 0; index < input.length; ++index) {
            for (let k = 0; k < 8; ++k) {
                const bits = BigInt(32 * k);
                cmPols.Main.A[k][index] = (BigInt('0x'+input[index].a) >> bits) & MASK32;
                cmPols.Main.B[k][index] = (BigInt('0x'+input[index].b) >> bits) & MASK32;
                cmPols.Main.C[k][index] = (BigInt('0x'+input[index].c) >> bits) & MASK32;
            }
            cmPols.Main.bin[index] = input[index].type == 1 ? 1n : 0n;
            cmPols.Main.range[index] = input[index].type == 2 ? 1n : 0n;
            cmPols.Main.carry[index] = BigInt(input[index].carry ?? 0n)
            cmPols.Main.binOpcode[index] = BigInt(input[index].opcode)
        }

        const N = cmPols.Main.bin.length;
        for (let index = input.length; index < N; ++index) {
            for (let k = 0; k < 8; ++k) {
                cmPols.Main.A[k][index] = 0n;
                cmPols.Main.B[k][index] = 0n;
                cmPols.Main.C[k][index] = 0n;
            }
            cmPols.Main.bin[index] = 0n;
            cmPols.Main.range[index] = 0n;
            cmPols.Main.carry[index] = 0n;
            cmPols.Main.binOpcode[index] = 0n;
        }
    }

    it("It should verify the binary operations pil", async () => {
        // generateZkasmLt4Test(input.filter(x => x.opcode == 8));
        await preparePilFromString();
        cmPols = newCommitPolsArray(pil);

        await smBinary.execute(cmPols.Binary, input);
        smMainExecute(cmPols, input);

        for (let i=0; i<cmPols.$$array.length; i++) {
            for (let j=0; j<N; j++) {
                if (typeof cmPols.$$array[i][j] !== 'bigint') {
                    throw new Error(`Polynomial not fited ${cmPols.$$defArray[i].name} at ${j}` )
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

    function includes(res, value) {
        const index = res.indexOf(value);
        assert(index !== -1, "not found "+value);
        res.splice(index, 1);
    }

    function generateZkasmLt4Test(inputs) {

        for (const _input of inputs) {
            console.log(['    0x'+_input.a.padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_')+'n => A',
                         '    0x'+_input.b.padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_')+'n => B',
                         `    ${_input.carry} :LT4,${_input.carry?'JMPNC':'JMPC'}(OpBinLt4__CarryTestFail)`,
                         `    $ => A :LT4,${_input.carry?'JMPNC':'JMPC'}(OpBinLt4__CarryTestFail)`,
                         `    ${_input.carry} :ASSERT`, ''].join("\n"));
        }
    }

    it("It should fail tests", async () => {
        await preparePilFromString();

        cmPols = newCommitPolsArray(pil);

        await smBinary.execute(cmPols.Binary, error_input);
        smMainExecute(cmPols, error_input);

        let res = await verifyPil(Fr, pil, cmPols, constPols, { continueOnError: true })
        res = res.map(x => x.split('/').slice(-1)[0]);
        for (let i = 0; i < res.length; i++) {
            console.log(res[i]);
        }
        expect(res.length).to.not.eq(0);

        const plookupLine1 = pil.plookupIdentities[0].line;
        const prefix1 = 'binary.pil:'+plookupLine1+':  plookup not found ';
        const plookupLine2 = pil.plookupIdentities[1].line;
        const prefix2 = 'binary.pil:'+plookupLine2+':  plookup not found ';
        const suffix = '';

        // P_LAST, P_OPCODE, Global.BYTE_2A, Global.BYTE, P_CIN, P_C, P_FLAGS
        includes(res, prefix1 + 'w=16 values: 1:0,1,255,255,0,1,0' + suffix);
        includes(res, prefix2 + 'w=15 values: 1:1,0,15,15,1,15,0' + suffix);
        includes(res, prefix2 + 'w=47 values: 1:1,2,0,0,1,0,3' + suffix);
        includes(res, prefix2 + 'w=63 values: 1:1,2,0,0,0,1,2' + suffix);
        includes(res, prefix2 + 'w=79 values: 1:1,3,128,0,0,0,3' + suffix);
        includes(res, prefix2 + 'w=95 values: 1:1,3,0,255,1,1,2' + suffix);
        includes(res, prefix2 + 'w=111 values: 1:1,4,0,0,0,0,3' + suffix);
        includes(res, prefix2 + 'w=127 values: 1:1,4,0,0,1,1,2' + suffix);
        includes(res, prefix2 + 'w=128 values: 1:0,4,255,255,0,1,0' + suffix);
        includes(res, prefix2 + 'w=159 values: 1:1,5,15,15,1,14,1' + suffix);
        includes(res, prefix2 + 'w=175 values: 1:1,6,176,180,0,164,0' + suffix);
        includes(res, prefix2 + 'w=191 values: 1:1,7,15,240,0,239,0' + suffix);

        // P_C 0 vs 1 ==> 1,8,255,0,0,0,10 OK ==> (P_CIN=0 && !(A < B) ==> P_C = 0)
        includes(res, prefix2 + 'w=255 values: 1:1,8,255,0,0,1,10' + suffix);

        // P_C 0 vs 1 ==> 1:1,8,0,0,0,0,10 OK ==> (P_CIN=0 && !(A < B) ==> P_C = 0)
        includes(res, prefix2 + 'w=367 values: 1:1,8,0,0,0,1,10' + suffix);

        const pPrefix1 = '(string):4:  permutation not found ';
        const pPrefix2 = '(string):4:  permutation failed. Remaining ';

        //  lOpcode, a[0..7], b[0..7], c[0..7], lCout

        // c[0]
        includes(res, pPrefix1 + 'w=2 values: 1:2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1');
        includes(res, pPrefix2 +   '1 values: 1:2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1');

        // c[0]
        includes(res, pPrefix1 + 'w=3 values: 1:2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +   '1 values: 1:2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0');

        // c[0]
        includes(res, pPrefix1 + 'w=4 values: 1:3,0,0,0,0,0,0,0,2147483648,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +   '1 values: 1:3,0,0,0,0,0,0,0,2147483648,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1');

        // c[0]
        includes(res, pPrefix1 + 'w=5 values: 1:3,0,0,0,0,0,0,0,0,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +   '1 values: 1:3,0,0,0,0,0,0,0,0,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,0,0,0,0,0,0,0,0,0');

        // c[0]
        includes(res, pPrefix1 + 'w=6 values: 1:4,65280,0,0,0,0,0,0,0,65280,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1');
        includes(res, pPrefix2 +   '1 values: 1:4,65280,0,0,0,0,0,0,0,65280,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1');

        // c[0]
        includes(res, pPrefix1 + 'w=7 values: 1:4,65280,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +   '1 values: 1:4,65280,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0');

        // c[0] 0xFF00 EQ 0xFFF00 = 0x100
        includes(res, pPrefix1 + 'w=8 values: 1:4,65280,0,0,0,0,0,0,0,1048320,0,0,0,0,0,0,0,256,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +   '1 values: 1:4,65280,0,0,0,0,0,0,0,1048320,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0');

        // c[7] 0 vs 0x10000000 (268435456)
        includes(res, pPrefix1 + 'w=12 values: 1:2,255,0,0,0,0,0,0,0,65280,0,0,0,0,0,0,0,1,0,0,0,0,0,0,268435456,1');
        includes(res, pPrefix2 +    '1 values: 1:2,255,0,0,0,0,0,0,0,65280,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1');

        // LT4 c[0] 0 vs 1
        includes(res, pPrefix1 + 'w=13 values: 1:8,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,1,4294967295,1,4294967295,1,4294967295,1,4294967295,0,0,0,0,0,0,0,0,1');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,1,4294967295,1,4294967295,1,4294967295,1,4294967295,0,0,0,0,0,0,0,0,0');

        // LT4 c[7] 0 vs 0x10000000 (268435456)
        includes(res, pPrefix1 + 'w=14 values: 1:8,0,4294967295,0,4294967295,0,4294967295,0,4294967295,1,4294967295,1,4294967295,1,4294967295,1,4294967295,1,0,0,0,0,0,0,268435456,1');
        includes(res, pPrefix2 +    '1 values: 1:8,0,4294967295,0,4294967295,0,4294967295,0,4294967295,1,4294967295,1,4294967295,1,4294967295,1,4294967295,1,0,0,0,0,0,0,0,1');

        // LT4 carry 1 vs 0
        includes(res, pPrefix1 + 'w=15 values: 1:8,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,1,4294967295,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,1,4294967295,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0');

        // LT4 carry 1 vs 0
        includes(res, pPrefix1 + 'w=17 values: 1:8,0,0,0,0,0,0,4294967295,4293918719,0,0,0,0,0,0,4294967295,4294901759,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +    '1 values: 1:8,0,0,0,0,0,0,4294967295,4293918719,0,0,0,0,0,0,4294967295,4294901759,0,0,0,0,0,0,0,0,0');

        // LT4 C[0] 1 vs 0 , carry 1 vs 0
        includes(res, pPrefix1 + 'w=18 values: 1:8,4294967295,4293918719,0,0,0,0,4294967295,4293918719,4294967295,4294901759,0,0,0,0,4294967295,4294901759,1,0,0,0,0,0,0,0,1');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4293918719,0,0,0,0,4294967295,4293918719,4294967295,4294901759,0,0,0,0,4294967295,4294901759,0,0,0,0,0,0,0,0,0');

        // LT4 carry 1 vs 0
        includes(res, pPrefix1 + 'w=19 values: 1:8,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4293918719,4294967295,4294901759,4294967295,4294901759,0,0,4294967295,4294901759,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4293918719,4294967295,4294901759,4294967295,4294901759,0,0,4294967295,4294901759,0,0,0,0,0,0,0,0,0');

        // LT4 carry 1 vs 0
        includes(res, pPrefix1 + 'w=20 values: 1:8,4294967295,4293918719,0,0,4294967295,4293918719,4294967295,4293918719,4294967295,4294901759,0,0,4294967295,4294901759,4294967295,4294901759,1,0,0,0,0,0,0,0,0');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4293918719,0,0,4294967295,4293918719,4294967295,4293918719,4294967295,4294901759,0,0,4294967295,4294901759,4294967295,4294901759,0,0,0,0,0,0,0,0,0');

        // LT4 C[0] 0 vs 1/0 , C[7] 0 vs 0/0x10000000, carry 0 vs 1/1 (NOTE: 268435456 = 0x10000000)
        includes(res, pPrefix1 + 'w=21 values: 1:8,0,0,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4294901759,4294967295,4294901759,4294967295,4294901759,1,0,0,0,0,0,0,0,1');
        includes(res, pPrefix1 + 'w=25 values: 1:8,0,0,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4294901759,4294967295,4294901759,4294967295,4294901759,0,0,0,0,0,0,0,268435456,1');
        includes(res, pPrefix2 +    '2 values: 1:8,0,0,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4294901759,4294967295,4294901759,4294967295,4294901759,0,0,0,0,0,0,0,0,0');

        // LT4 C[0] 1 vs 0 , carry 1 vs 0
        includes(res, pPrefix1 + 'w=22 values: 1:8,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4294901759,4294967295,4294901759,4294967295,4294901759,0,0,1,0,0,0,0,0,0,0,1');
        includes(res, pPrefix2 +    '1 values: 1:8,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,0,0,4294967295,4294901759,4294967295,4294901759,4294967295,4294901759,0,0,0,0,0,0,0,0,0,0,0');

        // LT4 C[0] 1 vs 0/0, C[7] 0 vs 0/0x10000000 (NOTE: 268435456 = 0x10000000)
        includes(res, pPrefix1 + 'w=16 values: 1:8,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294901759,0,0,0,0,0,0,0,0,1');
        includes(res, pPrefix1 + 'w=24 values: 1:8,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294901759,0,0,0,0,0,0,0,268435456,1');
        includes(res, pPrefix2 +    '2 values: 1:8,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4293918719,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294967295,4294901759,1,0,0,0,0,0,0,0,1');


/*
binary.pil:150:  plookup not found w=255 values: 1:1,8,255,0,0,1,10
binary.pil:150:  plookup not found w=367 values: 1:1,8,0,0,0,1,10

*/
        for (let i = 0; i < res.length; i++) {
            if (i === 0) {
                console.log('######################## NON EXPECTED ERRORS ######################');
            }
            console.log(res[i]);
        }
        expect(res.length).to.eq(0);

    })

});
