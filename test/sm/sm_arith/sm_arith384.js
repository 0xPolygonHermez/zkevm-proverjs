const {assert,expect} = require("chai");
const fs = require("fs");
const pilTools = require(__dirname + '/../../../tools/arith/pilTools.js');

const F1Field = require("ffjavascript").F1Field;
const outPilFile = __dirname + '/../../../build/arith384.pil';
const outPilHelperFile = __dirname + '/../../../build/arith384.js';
const pilTemplateFile = __dirname + "/arith384.ejs.pil";
let pilHelper;

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil, F } = require("pilcom");

const input = [
    {
        a: 10n,
        b: 20n,
        c: 0n,
        d: 0n,
        e: 200n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn-1n,
        b: 1n,
        c: 0n,
        d: 0n,
        e: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn-1n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn-1n,
        b: 1n,
        c: 1n,
        d: 1n,
        e: 0n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 16n,
        c: 0n,
        d: 16n,
        e: 0n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 2n,
        c: 10n,
        d: 2n,
        e: 10n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        c: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn-1n,
        d: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        e: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn-1n
    },
    {
        a: 3n,
        b: 2n,
        c: 1n,
        d: 0n,
        e: 7n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        c: 0n,
        d: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        e: 0n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 0n,
        c: 0n,
        d: 0n,
        e: 0n
    },
    {
        a: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        b: 1n,
        c: 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn,
        d: 2n,
        e: 0n
    },
    {
        a: 0x043e1af3a114d443e599a6ebe8669556ef0f138eb0088857845c2d451103293e4c6b9cce62966bf426c29ab4309281dbn,
        b: 0x0a305f5539d351077b709194644ce85a1f2ceec42bcfb0258cb7a25dc818e03310197d057ab3891db238769e0d65f636n,
        c: 0x09fb66d0fd96a5f718dc560f9efaa98156d8cb6dc39b9704ad7480f6320038ad5e2d2c08da0fa302aa101f54fabf0ac7n,
        d: 0x01a98ec1e2089aea313e6a8db0a018e7f24e91316f96cd4666d17302709501762642ab56a4ea2afeb2239473fd932058n,
        e: 0x042209281ee763d6dd2d0ee547bf89fa4817b8bc868e908c7f72c0f3d97a5f1fe9f2ad235a9633455df66748686cd631n
    }
];

const CONST_F = {
    // 0, 1, 2, 3, ..., 65534, 65535, 0, 1, 2, ...
    BYTE2: (i) => BigInt(i & 0xFFFF),

    // CLK[0] = 1, (0 x 47), 1, 0 ...
    // CLK[1] = 0, 1, (0 x 46), 1, 0, ...
    //    :
    // CLK[47] = (0 x 47), 1, (0 x 47), 1, ...
    CLK: (index, i) => (( i >= 65520 || ((i % 48) == index)) ? 1n: 0n)
}

const buildConstants = async function (pols) {
    const N = pols.CLK[0].length;
    Object.entries(CONST_F).forEach(([name, func]) => {
        if (typeof pols[name] === 'undefined') return;

        if (func.length == 1) {
            for (i = 0; i < N; ++i) pols[name][i] = BigInt(func(i));
        }
        else {
            for (let index = 0; index < 48; ++index) {
                for (i = 0; i < N; ++i) pols[name][index][i] = BigInt(func(index,i));
            }
        }
    });
}


execute = async function (pols, input) {
    const N = pols.a[0].length;
    for(let i = 0; i < N; ++i) {
        for (let j = 0; j < 24; ++j) {
            pols.a[j][i] = 0n;
            pols.b[j][i] = 0n;
            pols.c[j][i] = 0n;
            pols.d[j][i] = 0n;
            pols.e[j][i] = 0n;
        }
        pols.carry[i] = 0n;
    }

    const Fr = new F1Field(0xffffffff00000001n);
    const chunks = 24;
    const steps = chunks * 2;

    // Split the input in little-endian bytes
    prepareInput256bits(input, N, chunks);

    for (let i = 0; i < input.length; i++) {
        let offset = i * steps;
        for (let step = 0; step < steps; ++step) {
            for (let j = 0; j < chunks; j++) {
                pols.a[j][offset + step] = BigInt(input[i]["_a"][j])
                pols.b[j][offset + step] = BigInt(input[i]["_b"][j])
                pols.c[j][offset + step] = BigInt(input[i]["_c"][j])
                pols.d[j][offset + step] = BigInt(input[i]["_d"][j])
                pols.e[j][offset + step] = BigInt(input[i]["_e"][j])
            }
        }
        let carry = 0n;
        for (let step = 0; step < steps; ++step) {
            const value = pilHelper.calculate(pols, step, offset);
            pols.carry[offset + step] = Fr.e(carry);
            carry = (value + carry) / (2n ** 16n);
        }
    }
}

describe("test plookup operations", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    let constPols, cmPols;
    let pil;
    before(async function () {
        const pilTemplate = fs.readFileSync(pilTemplateFile, {encoding:'utf8', flag:'r'});
        const pilCode = pilTools.generatePilFromTemplate(pilTemplate);
        fs.writeFileSync(outPilFile, pilCode);
        pil = await compile(Fr, outPilFile, null, {defines: { N: 2 ** 21 }});
        pilTools.generatePilHelpers(pilTemplateFile, outPilHelperFile);
        pilHelper = require(outPilHelperFile);

        constPols = newConstantPolsArray(pil);
        await buildConstants(constPols.Arith384);
    });

    it("It should verify the binary operations pil", async () => {
        cmPols = newCommitPolsArray(pil);
        await execute(cmPols.Arith384, input);

        const res = await verifyPil(Fr, pil, cmPols, constPols);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });
});

function prepareInput256bits(input, N, chunks = 16) {
    for (let i = 0; i < input.length; i++) {
        for (let key of Object.keys(input[i])) {
            input[i][`_${key}`] = to16bitsRegisters(input[i][key], chunks);
        }
    }
}

function to16bitsRegisters(value, chunks = 16) {
    if (typeof value !== 'bigint') {
        value = BigInt(value);
    }
    let parts = [];
    for (let index = 0; index < chunks; ++index) {
        const part = value & 0xFFFFn;
        parts.push(part);
        value = value >> 16n;
    }
    return parts;
}