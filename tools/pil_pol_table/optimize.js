const fs = require("fs")
const { compile } = require("pilcom");
const starkInfoGen = require("pil-stark/src/starkinfo.js");
const { F1Field } = require("ffjavascript");
const { title } = require("process");
const F = new F1Field("0xFFFFFFFF00000001");

const argv = require("yargs")
    .usage("node pil_pol_table.js")
    .help('h')
    .argv;


class PilOptimize {

constructor () {
    this.table = [];
    this.codeWidth = 132;
    this.total = {cm1_2ns: 0, cm2_2ns: 0, cm3_2ns: 0, q_2ns: 0, reference: 'TOTAL'.padStart(this.codeWidth)};
}

async pilInfo(pilBase, pilCode) {
    const pil = pilCode === false ?
        await compile(F, pilBase, null):
        await compile(F, pilBase + pilCode, null,{ compileFromString: true });
    const pilDeg = Object.values(pil.references)[0].polDeg;
    const pilBits = Math.log2(pilDeg);

    const starkStruct = {
        nBits: pilBits,
        nBitsExt: pilBits+1,
        nQueries: 2,
        verificationHashType: 'GL',
        steps: [ {nBits: pilBits+1}, {nBits: pilBits-4} ]
    }
    const info = starkInfoGen(pil, starkStruct);
    const map = info.mapSectionsN;
    return {cm1_2ns: map.cm1_2ns, cm2_2ns: map.cm2_2ns, cm3_2ns: map.cm3_2ns, q_2ns: map.q_2ns, code: pilBase + pilCode,
//        reference: pilcode.trim().split("\n").pop().trim()};
        reference: pilCode};
}

async optimize(title, codeBase, codeBefore, codeAfter)
{
    const before = await this.pilInfo(codeBase, codeBefore);
    const after = await this.pilInfo(codeBase, codeAfter);
    this.table.push({title: title + ' (before)', ...before});
    this.table.push({title: title + ' (after)', ...after});
    this.table.push({title: title + ' (diff)', ...{
        cm1_2ns: after.cm1_2ns - before.cm1_2ns,
        cm2_2ns: after.cm2_2ns - before.cm2_2ns,
        cm3_2ns: after.cm3_2ns - before.cm3_2ns,
        q_2ns:   after.q_2ns - before.q_2ns,
        reference: (title + ' diff').padStart(this.codeWidth)
    }});
    this.total.cm1_2ns += (after.cm1_2ns - before.cm1_2ns);
    this.total.cm2_2ns += (after.cm2_2ns - before.cm2_2ns);
    this.total.cm3_2ns += (after.cm3_2ns - before.cm3_2ns);
    this.total.q_2ns += (after.q_2ns - before.q_2ns);
}

async optimizeByte4(before, after)
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit JMPN;
        pol commit isNeg;
        pol commit op0;
        pol commit Byte4_out;
    `;
    const codeBefore = `
        JMPN {isNeg*2**32 + op0} in Byte4_out;`

    const codeAfter = `
        pol commit Byte4_resultReady;
        JMPN*(isNeg*2**32 + op0) is Byte4_resultReady * Byte4_out;
    `;

    await this.optimize('Byte4', codeBase, codeBefore, codeAfter);
}

async optimizeHashPDigest()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant Binary_RESET;
        pol commit sWR;
        pol commit hashPDigest;
        pol commit op0;
        pol commit op1;
        pol commit op2;
        pol commit op3;
        pol commit op4;
        pol commit op5;
        pol commit op6;
        pol commit op7;
        pol commit Binary_a0;
        pol commit Binary_a1;
        pol commit Binary_a2;
        pol commit Binary_a3;
        pol commit Binary_a4;
        pol commit Binary_a5;
        pol commit Binary_a6;
        pol commit Binary_a7;
    `;
    const codeBefore = `
        sWR + hashPDigest {
            op0, op1, op2, op3, op4, op5, op6, op7
        } in
        Binary_RESET {
            Binary_a0, Binary_a1, Binary_a2, Binary_a3, Binary_a4, Binary_a5, Binary_a6, Binary_a7
        };
    `;
    const codeAfter = `
        pol commit Binary_latchValidRange;
        sWR + hashPDigest {
            op0, op1, op2, op3, op4, op5, op6, op7
        } is
        Binary_latchValidRange' {
            Binary_a0, Binary_a1, Binary_a2, Binary_a3, Binary_a4, Binary_a5, Binary_a6, Binary_a7
        };
    `;
    await this.optimize('HashPDigest', codeBase, codeBefore, codeAfter);
}

async optimizeHashP()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant Binary_RESET;
        pol commit hashP;
        pol commit addr;
        pol commit HASHPOS;
        pol commit D0;
        pol commit op0;
        pol commit op1;
        pol commit op2;
        pol commit op3;
        pol commit op4;
        pol commit op5;
        pol commit op6;
        pol commit op7;
        pol commit PaddingPG_crLatch;
        pol commit PaddingPG_addr;
        pol commit PaddingPG_len;
        pol commit PaddingPG_rem;
        pol commit PaddingPG_crLen;
        pol commit PaddingPG_crV0C;
        pol commit PaddingPG_crV1C;
        pol commit PaddingPG_crV2C;
        pol commit PaddingPG_crV3C;
        pol commit PaddingPG_crV4C;
        pol commit PaddingPG_crV5C;
        pol commit PaddingPG_crV6C;
        pol commit PaddingPG_crV7C;
    `;
    const codeBefore = `
        hashP {
            addr,
            HASHPOS,
            D0,
            op0, op1, op2, op3,
            op4, op5, op6, op7
        } in
        PaddingPG_crLatch {
            PaddingPG_addr,
            PaddingPG_len - PaddingPG_rem - PaddingPG_crLen + 1,
            PaddingPG_crLen,
            PaddingPG_crV0C, PaddingPG_crV1C, PaddingPG_crV2C, PaddingPG_crV3C,
            PaddingPG_crV4C, PaddingPG_crV5C, PaddingPG_crV6C, PaddingPG_crV7C
        };
    `;
    const codeAfter = `
        hashP {
            addr,
            HASHPOS,
            D0,
            op0, op1, op2, op3,
            op4, op5, op6, op7
        } is
        PaddingPG_crLatch {
            PaddingPG_addr,
            PaddingPG_len - PaddingPG_rem - PaddingPG_crLen + 1,
            PaddingPG_crLen,
            PaddingPG_crV0C, PaddingPG_crV1C, PaddingPG_crV2C, PaddingPG_crV3C,
            PaddingPG_crV4C, PaddingPG_crV5C, PaddingPG_crV6C, PaddingPG_crV7C
        };
    `;
    await this.optimize('HashP', codeBase, codeBefore, codeAfter);
}

generateRegistersPols(regs, prefix = 'pol commit ', suffix = ";\n") {
    return regs.map(x => { res = ""; for(let i=0; i<8;++i) res += prefix+x+i+suffix; return res;} ).join("\n");
}
async optimizeArith()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit arith;
        pol commit Arith_resultReady;
        ${this.generateRegistersPols(['A','B','C','D','E','op'])}
        pol commit arithEq0;
        pol commit arithEq1;
        pol commit arithEq2;
        pol commit arithEq3;
        pol commit Arith_selEq[4];
        pol commit Arith_x1[16];
        pol commit Arith_y1[16];
        pol commit Arith_x2[16];
        pol commit Arith_y2[16];
        pol commit Arith_x3[16];
        pol commit Arith_y3[16];
    `;
    const codeTemplate = `
        arith {  arithEq0, arithEq1, arithEq2, arithEq3,
            A0, A1, A2, A3, A4, A5, A6, A7,
            B0, B1, B2, B3, B4, B5, B6, B7,

            arithEq0*C0 + arithEq1*C0 + arithEq2*A0,
            arithEq0*C1 + arithEq1*C1 + arithEq2*A1,
            arithEq0*C2 + arithEq1*C2 + arithEq2*A2,
            arithEq0*C3 + arithEq1*C3 + arithEq2*A3,
            arithEq0*C4 + arithEq1*C4 + arithEq2*A4,
            arithEq0*C5 + arithEq1*C5 + arithEq2*A5,
            arithEq0*C6 + arithEq1*C6 + arithEq2*A6,
            arithEq0*C7 + arithEq1*C7 + arithEq2*A7,

            arithEq0*D0 + arithEq1*D0 + arithEq2*B0,
            arithEq0*D1 + arithEq1*D1 + arithEq2*B1,
            arithEq0*D2 + arithEq1*D2 + arithEq2*B2,
            arithEq0*D3 + arithEq1*D3 + arithEq2*B3,
            arithEq0*D4 + arithEq1*D4 + arithEq2*B4,
            arithEq0*D5 + arithEq1*D5 + arithEq2*B5,
            arithEq0*D6 + arithEq1*D6 + arithEq2*B6,
            arithEq0*D7 + arithEq1*D7 + arithEq2*B7,

            arithEq3 * E0, arithEq3 * E1, arithEq3 * E2, arithEq3 * E3, arithEq3 * E4, arithEq3 * E5, arithEq3 * E6, arithEq3 * E7,
            op0, op1, op2, op3, op4, op5, op6, op7 } #### {
            Arith_selEq[0], Arith_selEq[1], Arith_selEq[2], Arith_selEq[3],

            Arith_x1[0] + Arith_x1[1]*2**16,
            Arith_x1[2] + Arith_x1[3]*2**16,
            Arith_x1[4] + Arith_x1[5]*2**16,
            Arith_x1[6] + Arith_x1[7]*2**16,
            Arith_x1[8] + Arith_x1[9]*2**16,
            Arith_x1[10] + Arith_x1[11]*2**16,
            Arith_x1[12] + Arith_x1[13]*2**16,
            Arith_x1[14] + Arith_x1[15]*2**16,

            Arith_y1[0] + Arith_y1[1]*2**16,
            Arith_y1[2] + Arith_y1[3]*2**16,
            Arith_y1[4] + Arith_y1[5]*2**16,
            Arith_y1[6] + Arith_y1[7]*2**16,
            Arith_y1[8] + Arith_y1[9]*2**16,
            Arith_y1[10] + Arith_y1[11]*2**16,
            Arith_y1[12] + Arith_y1[13]*2**16,
            Arith_y1[14] + Arith_y1[15]*2**16,

            Arith_x2[0] + Arith_x2[1]*2**16,
            Arith_x2[2] + Arith_x2[3]*2**16,
            Arith_x2[4] + Arith_x2[5]*2**16,
            Arith_x2[6] + Arith_x2[7]*2**16,
            Arith_x2[8] + Arith_x2[9]*2**16,
            Arith_x2[10] + Arith_x2[11]*2**16,
            Arith_x2[12] + Arith_x2[13]*2**16,
            Arith_x2[14] + Arith_x2[15]*2**16,

            Arith_y2[0] + Arith_y2[1]*2**16,
            Arith_y2[2] + Arith_y2[3]*2**16,
            Arith_y2[4] + Arith_y2[5]*2**16,
            Arith_y2[6] + Arith_y2[7]*2**16,
            Arith_y2[8] + Arith_y2[9]*2**16,
            Arith_y2[10] + Arith_y2[11]*2**16,
            Arith_y2[12] + Arith_y2[13]*2**16,
            Arith_y2[14] + Arith_y2[15]*2**16,

            Arith_x3[0] + Arith_x3[1]*2**16,
            Arith_x3[2] + Arith_x3[3]*2**16,
            Arith_x3[4] + Arith_x3[5]*2**16,
            Arith_x3[6] + Arith_x3[7]*2**16,
            Arith_x3[8] + Arith_x3[9]*2**16,
            Arith_x3[10] + Arith_x3[11]*2**16,
            Arith_x3[12] + Arith_x3[13]*2**16,
            Arith_x3[14] + Arith_x3[15]*2**16,

            Arith_y3[0] + Arith_y3[1]*2**16,
            Arith_y3[2] + Arith_y3[3]*2**16,
            Arith_y3[4] + Arith_y3[5]*2**16,
            Arith_y3[6] + Arith_y3[7]*2**16,
            Arith_y3[8] + Arith_y3[9]*2**16,
            Arith_y3[10] + Arith_y3[11]*2**16,
            Arith_y3[12] + Arith_y3[13]*2**16,
            Arith_y3[14] + Arith_y3[15]*2**16
        };
    `;

    const codeBefore = codeTemplate.split('####').join("in");
    const codeAfter = codeTemplate.split('####').join("is Arith_resultReady");
    await this.optimize('Arith', codeBase, codeBefore, codeAfter);
}

async optimizeBinary()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit bin;
        pol commit binOpcode;
        ${this.generateRegistersPols(['A','B','op'])}
        ${this.generateRegistersPols(['Binary_a','Binary_b','Binary_c'])}
        pol commit carry;
        pol commit Binary_lOpcode;
        pol commit Binary_lCout;
        pol constant Binary_RESET;
    `;
    const codeTemplate = `
        bin {
            binOpcode,
            A0, A1, A2, A3, A4, A5, A6, A7,
            B0, B1, B2, B3, B4, B5, B6, B7,
            op0, op1, op2, op3, op4, op5, op6, op7,
            carry
        } #### {
            Binary_lOpcode,
            Binary_a0, Binary_a1, Binary_a2, Binary_a3, Binary_a4, Binary_a5, Binary_a6, Binary_a7,
            Binary_b0, Binary_b1, Binary_b2, Binary_b3, Binary_b4, Binary_b5, Binary_b6, Binary_b7,
            Binary_c0, Binary_c1, Binary_c2, Binary_c3, Binary_c4, Binary_c5, Binary_c6, Binary_c7,
            Binary_lCout
        };
    `;

    const codeBefore = codeTemplate.split('####').join("in Binary_RESET");
    const codeAfter = "        pol commit Binary_latchBinOp;\n" + codeTemplate.split('####').join("is Binary_latchBinOp'");
    await this.optimize('Binary', codeBase, codeBefore, codeAfter);
}


async optimizeHashKLen()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit hashKLen;
        pol commit addr;
        pol commit op0;
        pol commit PaddingKK_lastHashLatch;
        pol commit PaddingKK_addr;
        pol commit PaddingKK_len;
    `;
    const codeTemplate = `
        hashKLen {
            addr,
            op0
        } #### {
            PaddingKK_addr,
            PaddingKK_len
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PaddingKK_lastHashLatch");
    const codeAfter = codeTemplate.split('####').join("is PaddingKK_lastHashLatch");
    await this.optimize('HashKLen', codeBase, codeBefore, codeAfter);
}

async optimizeHashK()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant Binary_RESET;
        pol commit hashP;
        pol commit addr;
        pol commit HASHPOS;
        pol commit D0;
        ${this.generateRegistersPols(['op'])}
        pol commit PaddingKK_crLatch;
        pol commit PaddingKK_crValid;
        pol commit PaddingKK_addr;
        pol commit PaddingKK_len;
        pol commit PaddingKK_rem;
        pol commit PaddingKK_crLen;
        pol commit PaddingKK_crV0C;
        pol commit PaddingKK_crV1C;
        pol commit PaddingKK_crV2C;
        pol commit PaddingKK_crV3C;
        pol commit PaddingKK_crV4C;
        pol commit PaddingKK_crV5C;
        pol commit PaddingKK_crV6C;
        pol commit PaddingKK_crV7C;
    `;
    const codeTemplate = `
        hashP {
            addr,
            HASHPOS,
            D0,
            op0, op1, op2, op3,
            op4, op5, op6, op7
        } #### {
            PaddingKK_addr,
            PaddingKK_len - PaddingKK_rem - PaddingKK_crLen + 1,
            PaddingKK_crLen,
            PaddingKK_crV0C, PaddingKK_crV1C, PaddingKK_crV2C, PaddingKK_crV3C,
            PaddingKK_crV4C, PaddingKK_crV5C, PaddingKK_crV6C, PaddingKK_crV7C
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PaddingKK_crLatch * PaddingKK_crValid");
    const codeAfter = codeTemplate.split('####').join("is PaddingKK_crLatch * PaddingKK_crValid");
    await this.optimize('HashK', codeBase, codeBefore, codeAfter);
}
async run(){
    await this.optimizeByte4();
    await this.optimizeHashPDigest();
    await this.optimizeHashP();
    await this.optimizeArith();
    await this.optimizeBinary();
    await this.optimizeHashK();
    await this.optimizeHashKLen();

    const titleWidth = Math.max(...this.table.map((x) => x.title.length));
    const referenceWidth = Math.max(...this.table.map((x) => x.reference.length));
    console.log(['code'.padEnd(this.codeWidth),
        'cm1_2ns'.padStart(7), 'cm2_2ns'.padStart(7),
        'cm3_2ns'.padStart(7), 'q_2ns'.padStart(7),
        'total'.padStart(7)].join('|'));
    this.table.push(this.total);
    this.table.push({title: 'ORIGINAL main.pil', ... await this.pilInfo('../../pil/main.pil', false)});
    for (const row of this.table) {
        console.log(''.padStart(this.codeWidth + 40, '-'));
        let lines = row.reference.split("\n");
        if (lines.length == 0) continue;
        while (lines.length > 0 && lines[0].trim().length == 0) {
            lines = lines.slice(1);
        }
        let spaces = lines[0].length - lines[0].trimLeft().length;
        lines = lines.map(x => x.trimRight().substr(spaces));
        console.log([lines[0].padEnd(this.codeWidth),
            row.cm1_2ns.toString().padStart(7), row.cm2_2ns.toString().padStart(7),
            row.cm3_2ns.toString().padStart(7), row.q_2ns.toString().padStart(7),
            (row.cm1_2ns+row.cm2_2ns+row.cm3_2ns+row.q_2ns).toString().padStart(7)].join('|'));
        if (lines.length > 1) {
            console.log(lines.slice(1).join("\n"));
        }
    }
    // console.log(table);
}
}

let program = new PilOptimize();
program.run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});