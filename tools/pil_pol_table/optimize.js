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
    this.total = {cm1_2ns: 0, cm2_2ns: 0, cm3_2ns: 0, q_2ns: 0, first: true, last: false, reference: 'TOTAL'.padStart(this.codeWidth)};
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
    this.table.push({title: title + ' (before)', first: true, last: false, ...before});
    this.table.push({title: title + ' (after)', first: false, last: false,  ...after});
    this.table.push({title: title + ' (diff)', first: false, last: true,  ...{
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

async optimizeStorageHashPDigest()
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
    await this.optimize('StorageHashPDigest', codeBase, codeBefore, codeAfter);
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
    return regs.map(x => {
        res = ""; let from = 0; let to = 8; let name = x;
        if (x.indexOf(':') >= 0) { [name, from, to] = x.split(':'); ++to;}; for(let i=from; i<to;++i) res += prefix+name+i+suffix; return res;} ).join("\n");
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

async optimizeHashPLen()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit hashPLen;
        pol commit addr;
        pol commit op0;
        pol commit PaddingPG_lastHash;
        pol commit PaddingPG_addr;
        pol commit PaddingPG_len;
    `;
    const codeTemplate = `
        hashPLen {
            addr,
            op0
        } #### {
            PaddingPG_addr,
            PaddingPG_len
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PaddingPG_lastHash");
    const codeAfter = codeTemplate.split('####').join("is PaddingPG_lastHash");
    await this.optimize('HashPLen', codeBase, codeBefore, codeAfter);
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


async optimizeHashKDigest()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit hashKDigest;
        pol commit addr;
        ${this.generateRegistersPols(['op', 'PaddingKK_hash'])}
        pol commit incCounter;
        pol commit PaddingKK_lastHashLatch;
        pol commit PaddingKK_addr;
        pol commit PaddingKK_incCounter;
    `;
    const codeTemplate = `
        hashKDigest {
            addr,
            op0, op1, op2, op3,
            op4, op5, op6, op7,
            incCounter
        } #### {
            PaddingKK_addr,
            PaddingKK_hash0, PaddingKK_hash1, PaddingKK_hash2, PaddingKK_hash3,
            PaddingKK_hash4, PaddingKK_hash5, PaddingKK_hash6, PaddingKK_hash7,
            PaddingKK_incCounter
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PaddingKK_lastHashLatch");
    const codeAfter = codeTemplate.split('####').join("is PaddingKK_lastHashLatch");
    await this.optimize('hashKDigest', codeBase, codeBefore, codeAfter);
}

async optimizeHashPDigest()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit hashPDigest;
        pol commit addr;
        ${this.generateRegistersPols(['op', 'PaddingPG_curHash:0:3'])}
        pol commit incCounter;
        pol commit PaddingPG_lastHash;
        pol commit PaddingPG_addr;
        pol commit PaddingPG_incCounter;
    `;
    const codeTemplate = `
        hashPDigest {
            addr,
            op0 + 2**32 * op1,
            op2 + 2**32 * op3,
            op4 + 2**32 * op5,
            op6 + 2**32 * op7,
            incCounter
        } #### {
            PaddingPG_addr,
            PaddingPG_curHash0,
            PaddingPG_curHash1,
            PaddingPG_curHash2,
            PaddingPG_curHash3,
            PaddingPG_incCounter
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PaddingPG_lastHash");
    const codeAfter = codeTemplate.split('####').join("is PaddingPG_lastHash");
    await this.optimize('hashPDigest', codeBase, codeBefore, codeAfter);
}

async optimizeStorageKeyFirstPoseidon()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant PoseidonG_LATCH;
        pol commit sRD;
        pol commit sWR;
        pol commit sKeyI[4];
        ${this.generateRegistersPols(['C', 'PoseidonG_in', 'PoseidonG_hash:0:3', 'PoseidonG_cap:1:3'])}
        pol commit PoseidonG_hashType;
    `;
    const codeTemplate = `
        (sRD + sWR) {
            C0, C1, C2, C3,
            C4, C5, C6, C7,
            0, 0, 0, 0,
            sKeyI[0], sKeyI[1], sKeyI[2], sKeyI[3]
        } #### {
            PoseidonG_in0, PoseidonG_in1, PoseidonG_in2, PoseidonG_in3,
            PoseidonG_in4, PoseidonG_in5, PoseidonG_in6, PoseidonG_in7,
            PoseidonG_hashType, PoseidonG_cap1, PoseidonG_cap2, PoseidonG_cap3,
            PoseidonG_hash0, PoseidonG_hash1, PoseidonG_hash2, PoseidonG_hash3
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PoseidonG_LATCH");
    const codeAfter = "        pol commit PoseidonG1_ready;\n" + codeTemplate.split('####').join("is PoseidonG1_ready");
    await this.optimize('StorageKeyFirstPoseidon', codeBase, codeBefore, codeAfter);
}

async optimizeStorageKeySecondPoseidon()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant PoseidonG_LATCH;
        pol commit sRD;
        pol commit sWR;
        pol commit sKey[4];
        pol commit sKeyI[4];
        ${this.generateRegistersPols(['A:0:5', 'PoseidonG_in', 'PoseidonG_hash:0:3', 'PoseidonG_cap:1:3'])}
        pol commit PoseidonG_hashType;
        pol commit B0;
        pol commit B1;
    `;
    const codeTemplate = `
        (sRD + sWR) {
            A0, A1, A2, A3,
            A4, A5, B0, B1,
            sKeyI[0], sKeyI[1], sKeyI[2], sKeyI[3],
            sKey[0], sKey[1], sKey[2], sKey[3]
        } #### {
            PoseidonG_in0, PoseidonG_in1, PoseidonG_in2, PoseidonG_in3,
            PoseidonG_in4, PoseidonG_in5, PoseidonG_in6, PoseidonG_in7,
            PoseidonG_hashType, PoseidonG_cap1, PoseidonG_cap2, PoseidonG_cap3,
            PoseidonG_hash0, PoseidonG_hash1, PoseidonG_hash2, PoseidonG_hash3
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PoseidonG_LATCH");
    const codeAfter = "        pol commit PoseidonG2_ready;\n" + codeTemplate.split('####').join("is PoseidonG2_ready");
    await this.optimize('StorageKeySecondPoseidon', codeBase, codeBefore, codeAfter);
}

async optimizeStorageRead()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant Storage_iLatchGet;
        pol commit sRD;
        pol commit sKey[4];
        ${this.generateRegistersPols(['SR', 'op', 'Storage_oldRoot:0:3', 'Storage_rkey:0:3', 'Storage_valueLow:0:3',
            'Storage_valueHigh:0:3'])}
        pol commit incCounter;
        pol commit Storage_incCounter;
    `;
    const codeTemplate = `
        sRD {
            SR0 + 2**32*SR1, SR2 + 2**32*SR3, SR4 + 2**32*SR5, SR6 + 2**32*SR7,
            sKey[0], sKey[1], sKey[2], sKey[3],
            op0, op1, op2, op3,
            op4, op5, op6, op7,
            incCounter
        } #### {
            Storage_oldRoot0, Storage_oldRoot1, Storage_oldRoot2, Storage_oldRoot3,
            Storage_rkey0, Storage_rkey1, Storage_rkey2, Storage_rkey3,
            Storage_valueLow0, Storage_valueLow1, Storage_valueLow2, Storage_valueLow3,
            Storage_valueHigh0, Storage_valueHigh1, Storage_valueHigh2, Storage_valueHigh3,
            Storage_incCounter + 2
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in Storage_iLatchGet");
    const codeAfter = codeTemplate.split('####').join("is Storage_iLatchGet");
    await this.optimize('StorageRead', codeBase, codeBefore, codeAfter);
}

async optimizeStorageWrite()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant Storage_iLatchSet;
        pol commit sWR;
        pol commit sKey[4];
        ${this.generateRegistersPols(['SR', 'D', 'op', 'Storage_oldRoot:0:3', 'Storage_rkey:0:3', 'Storage_valueLow:0:3',
            'Storage_valueHigh:0:3', 'Storage_newRoot:0:3'])}
        pol commit incCounter;
        pol commit Storage_incCounter;
    `;
    const codeTemplate = `
        sWR {
            SR0 + 2**32*SR1, SR2 + 2**32*SR3, SR4 + 2**32*SR5, SR6 + 2**32*SR7,
            sKey[0], sKey[1], sKey[2], sKey[3],
            D0, D1, D2, D3,
            D4, D5, D6, D7,
            op0 + 2**32*op1, op2 + 2**32*op3, op4 + 2**32*op5, op6 + 2**32*op7,
            incCounter
        } #### {
            Storage_oldRoot0, Storage_oldRoot1, Storage_oldRoot2, Storage_oldRoot3,
            Storage_rkey0, Storage_rkey1, Storage_rkey2, Storage_rkey3,
            Storage_valueLow0, Storage_valueLow1, Storage_valueLow2, Storage_valueLow3,
            Storage_valueHigh0, Storage_valueHigh1, Storage_valueHigh2, Storage_valueHigh3,
            Storage_newRoot0, Storage_newRoot1, Storage_newRoot2, Storage_newRoot3,
            Storage_incCounter + 2
        };
    `;

    const codeBefore = codeTemplate.split('####').join("in Storage_iLatchSet");
    const codeAfter = codeTemplate.split('####').join("is Storage_iLatchSet");
    await this.optimize('StorageWrite', codeBase, codeBefore, codeAfter);
}

async optimizeMemAlign()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit memAlign;
        pol commit memAlignWR;
        pol commit memAlignWR8;
        pol commit sKey[4];
        pol commit C0;
        ${this.generateRegistersPols(['A', 'B', 'op', 'D', 'E'])}
        pol constant MemAlign_RESET;
        pol commit MemAlign_wr256;
        pol commit MemAlign_wr8;
        pol commit MemAlign_m0[8];
        pol commit MemAlign_m1[8];
        pol commit MemAlign_w0[8];
        pol commit MemAlign_w1[8];
        pol commit MemAlign_v[8];
        pol commit MemAlign_offset;
        pol commit Storage_incCounter;
    `;
    const codeTemplate = `
        memAlign {
            memAlignWR,
            memAlignWR8,
            A0, A1, A2, A3,
            A4, A5, A6, A7,
            (1 - memAlignWR8) * B0, (1 - memAlignWR8) * B1, (1 - memAlignWR8) * B2, (1 - memAlignWR8) * B3,
            (1 - memAlignWR8) * B4, (1 - memAlignWR8) * B5, (1 - memAlignWR8) * B6, (1 - memAlignWR8) * B7,
            op0, op1, op2, op3,
            op4, op5, op6, op7,
            C0,
            (memAlignWR + memAlignWR8) * D0, (memAlignWR + memAlignWR8)*D1, (memAlignWR + memAlignWR8)*D2, (memAlignWR + memAlignWR8)*D3,
            (memAlignWR + memAlignWR8) * D4, (memAlignWR + memAlignWR8)*D5, (memAlignWR + memAlignWR8)*D6, (memAlignWR + memAlignWR8)*D7,
            memAlignWR * E0, memAlignWR*E1, memAlignWR*E2, memAlignWR*E3,
            memAlignWR * E4, memAlignWR*E5, memAlignWR*E6, memAlignWR*E7
        } #### {
            MemAlign_wr256,
            MemAlign_wr8,
            MemAlign_m0[0], MemAlign_m0[1], MemAlign_m0[2], MemAlign_m0[3],
            MemAlign_m0[4], MemAlign_m0[5], MemAlign_m0[6], MemAlign_m0[7],
            MemAlign_m1[0], MemAlign_m1[1], MemAlign_m1[2], MemAlign_m1[3],
            MemAlign_m1[4], MemAlign_m1[5], MemAlign_m1[6], MemAlign_m1[7],
            MemAlign_v[0], MemAlign_v[1], MemAlign_v[2], MemAlign_v[3],
            MemAlign_v[4], MemAlign_v[5], MemAlign_v[6], MemAlign_v[7],
            MemAlign_offset,
            MemAlign_w0[0], MemAlign_w0[1], MemAlign_w0[2], MemAlign_w0[3],
            MemAlign_w0[4], MemAlign_w0[5], MemAlign_w0[6], MemAlign_w0[7],
            MemAlign_w1[0], MemAlign_w1[1], MemAlign_w1[2], MemAlign_w1[3],
            MemAlign_w1[4], MemAlign_w1[5], MemAlign_w1[6], MemAlign_w1[7]
        };
        `;

    const codeBefore = codeTemplate.split('####').join("in MemAlign_RESET");
    const codeAfter = "        pol commit MemAlign_ready;" + codeTemplate.split('####').join("is MemAlign_ready");
    await this.optimize('MemAlign', codeBase, codeBefore, codeAfter);
}

async optimizeStoragePoseidon()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant PoseidonG_LATCH;
        pol commit iHash;
        pol commit iHashType;
        ${this.generateRegistersPols(['hashLeft:0:3', 'hashRight:0:3', 'op:0:3','PoseidonG_in','PoseidonG_hash:0:3', 'PoseidonG_cap:1:3'])}
        pol commit PoseidonG_hashType;
    `;
    const codeTemplate = `
        iHash {
            hashLeft0, hashLeft1, hashLeft2, hashLeft3,
            hashRight0, hashRight1, hashRight2, hashRight3,
            iHashType, 0, 0, 0,
            op0, op1, op2, op3
        } #### {
            PoseidonG_in0, PoseidonG_in1, PoseidonG_in2, PoseidonG_in3,
            PoseidonG_in4, PoseidonG_in5, PoseidonG_in6, PoseidonG_in7,
            PoseidonG_hashType, PoseidonG_cap1, PoseidonG_cap2, PoseidonG_cap3,
            PoseidonG_hash0, PoseidonG_hash1, PoseidonG_hash2, PoseidonG_hash3
        };
    `;
    const codeBefore = codeTemplate.split('####').join("in PoseidonG_LATCH");
    const codeAfter = "        pol commit PoseidonG3_ready;\n" + codeTemplate.split('####').join("is PoseidonG3_ready");
    await this.optimize('StoragePoseidon', codeBase, codeBefore, codeAfter);
}

async optimizeFirstPaddingKKBit()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol constant PoseidonG_LATCH;
        pol commit iHash;
        pol commit iHashType;
        pol commit freeIn;
        pol constant r8Id;
        pol commit connected;
        pol constant r8valid;
        pol commit rem;
        pol commit remInv;
        pol constant lastBlock;
        pol remIsZero = 1 - rem*remInv;
        pol commit spare;
        pol lastHash = lastBlock*(spare + remIsZero);
        pol aFreeIn = (1 - (remIsZero + spare))*freeIn + remIsZero + lastHash*0x80;
        pol commit PaddingKKBit_r8;
        pol constant PaddingKKBit_r8Id;
        pol commit PaddingKKBit_connected;
    `;
    const codeTemplate = `
        r8valid {aFreeIn, r8Id, connected} #### { PaddingKKBit_r8, PaddingKKBit_r8Id, PaddingKKBit_connected };
    `;
    const codeBefore = codeTemplate.split('####').join("in");
    const codeAfter = "        pol commit PaddingKKBit_ready;\n" + codeTemplate.split('####').join("is PaddingKKBit_ready");
    await this.optimize('FirstPaddingKKBit', codeBase, codeBefore, codeAfter);
}


async optimizeSecondPaddingKKBit()
{
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit rem;
        pol commit remInv;
        pol constant lastBlock;
        pol remIsZero = 1 - rem*remInv;
        pol commit spare;
        pol constant lastBlockLatch;
        pol lastHashLatch = lastBlockLatch * (spare + remIsZero);
        pol constant sOutId; // <==
        pol constant PaddingKKBit_sOutId; // <==
        ${this.generateRegistersPols(['hash', 'PaddingKKBit_sOut'])}
    `;
    const codeTemplate = `
        lastHashLatch {
            hash0, hash1, hash2, hash3,
            hash4, hash5, hash6, hash7,
            sOutId
        } #### {
            PaddingKKBit_sOut0, PaddingKKBit_sOut1, PaddingKKBit_sOut2, PaddingKKBit_sOut3,
            PaddingKKBit_sOut4, PaddingKKBit_sOut5, PaddingKKBit_sOut6, PaddingKKBit_sOut7,
            PaddingKKBit_sOutId
        };`;
    const codeBefore = codeTemplate.split('####').join("in");
    const codeAfter = "        pol commit PaddingKKBit_ready2;\n" + codeTemplate.split('####').join("is PaddingKKBit_ready2");
    await this.optimize('SecondPaddingKKBit', codeBase, codeBefore, codeAfter);
}

async run(){

    await this.optimizeStorageHashPDigest();

    await this.optimizeHashP();
    await this.optimizeHashPLen();
    await this.optimizeHashPDigest();
    await this.optimizeArith();
    await this.optimizeBinary();
    await this.optimizeHashK();
    await this.optimizeHashKLen();
    await this.optimizeHashKDigest();
    await this.optimizeStorageKeyFirstPoseidon();
    await this.optimizeStorageKeySecondPoseidon();
    await this.optimizeStorageRead();
    await this.optimizeStorageWrite();
    await this.optimizeMemAlign();
    await this.optimizeStoragePoseidon();
    await this.optimizeFirstPaddingKKBit();
    await this.optimizeSecondPaddingKKBit();

    const titleWidth = Math.max(...this.table.map((x) => x.title.length));
    const referenceWidth = Math.max(...this.table.map((x) => x.reference.length));
    console.log(['code'.padEnd(this.codeWidth),
        'cm1_2ns'.padStart(7), 'cm2_2ns'.padStart(7),
        'cm3_2ns'.padStart(7), 'q_2ns'.padStart(7),
        'total'.padStart(7)].join('|'));
    this.table.push(this.total);
    this.table.push({title: 'ORIGINAL main.pil', ... await this.pilInfo('../../../data/pil/main.pil', false)});
    for (const row of this.table) {
        console.log(''.padStart(this.codeWidth + 40, row.first ? '=': '-'));
        let lines = row.reference === false ? ['// original main.pil'] : row.reference.split("\n");
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