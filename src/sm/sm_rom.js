

const {Scalar, F1Field}  = require("ffjavascript");

const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

module.exports.buildConstants = async function buildConstants(pols, rom) {

    const F = new F1Field("0xFFFFFFFF00000001");

    const N = pols.offset.length;

    const twoTo31 = Scalar.e(0x80000000);
    const maxInt = 2147483647;
    const minInt = -2147483648;
    const maxUInt = 0xFFFFFFFF;
    const minUInt = 0;

    if (rom.program.length>N) throw new Error("Rom is too big for this N");

    for (let i=0; i<rom.program.length; i++) {

        if (rom.program[i].CONST) {
            if (rom.program[i].CONSTL) throw new Error("Program mixed with long and short constants");
            pols.CONST0[i] = rom.program[i].CONST ? F.e(rom.program[i].CONST) : F.zero;
            pols.CONST1[i] = F.zero;
            pols.CONST2[i] = F.zero;
            pols.CONST3[i] = F.zero;
            pols.CONST4[i] = F.zero;
            pols.CONST5[i] = F.zero;
            pols.CONST6[i] = F.zero;
            pols.CONST7[i] = F.zero;
        } else if (rom.program[i].CONSTL) {
            [
                pols.CONST0[i],
                pols.CONST1[i],
                pols.CONST2[i],
                pols.CONST3[i],
                pols.CONST4[i],
                pols.CONST5[i],
                pols.CONST6[i],
                pols.CONST7[i],
            ] = scalar2fea(F, BigInt(rom.program[i].CONSTL));
        } else {
            pols.CONST0[i] = F.zero;
            pols.CONST1[i] = F.zero;
            pols.CONST2[i] = F.zero;
            pols.CONST3[i] = F.zero;
            pols.CONST4[i] = F.zero;
            pols.CONST5[i] = F.zero;
            pols.CONST6[i] = F.zero;
            pols.CONST7[i] = F.zero;
        }
        pols.offset[i] = rom.program[i].offset ? BigInt(rom.program[i].offset) : 0n;

        /*
            generated with:
            node tools/pil_pol_table/bits_compose.js "inA, inB, inC, inROTL_C, inD, inE, inSR, inCTX, inSP, inPC, inGAS, inMAXMEM, inSTEP, inFREE, inRR, inHASHPOS, setA, setB, setC, setD, setE, setSR, setCTX, setSP, setPC, setGAS, setMAXMEM, setRR, setHASHPOS, JMP, JMPN, JMPC, isStack, isCode, isMem, useCTX, ind, indRR, mOp, mWR, sWR, sRD, arith, arithEq0, arithEq1, arithEq2, arithEq3, hashK, hashKLen, hashKDigest, hashP, hashPLen, hashPDigest, bin, assert, memAlign, memAlignWR, memAlignWR8"  -B -e -p "rom.program[i]."
        */

        pols.operations[i] =
              (rom.program[i].inA ? (2n**0n  * BigInt(rom.program[i].inA)) : 0n)
            + (rom.program[i].inB ? (2n**1n  * BigInt(rom.program[i].inB)) : 0n)
            + (rom.program[i].inC ? (2n**2n  * BigInt(rom.program[i].inC)) : 0n)
            + (rom.program[i].inROTL_C ? (2n**3n  * BigInt(rom.program[i].inROTL_C)) : 0n)
            + (rom.program[i].inD ? (2n**4n  * BigInt(rom.program[i].inD)) : 0n)
            + (rom.program[i].inE ? (2n**5n  * BigInt(rom.program[i].inE)) : 0n)
            + (rom.program[i].inSR ? (2n**6n  * BigInt(rom.program[i].inSR)) : 0n)
            + (rom.program[i].inCTX ? (2n**7n  * BigInt(rom.program[i].inCTX)) : 0n)
            + (rom.program[i].inSP ? (2n**8n  * BigInt(rom.program[i].inSP)) : 0n)
            + (rom.program[i].inPC ? (2n**9n  * BigInt(rom.program[i].inPC)) : 0n)
            + (rom.program[i].inGAS ? (2n**10n * BigInt(rom.program[i].inGAS)) : 0n)
            + (rom.program[i].inMAXMEM ? (2n**11n * BigInt(rom.program[i].inMAXMEM)) : 0n)
            + (rom.program[i].inSTEP ? (2n**12n * BigInt(rom.program[i].inSTEP)) : 0n)
            + (rom.program[i].inFREE ? (2n**13n * BigInt(rom.program[i].inFREE)) : 0n)
            + (rom.program[i].inRR ? (2n**14n * BigInt(rom.program[i].inRR)) : 0n)
            + (rom.program[i].inHASHPOS ? (2n**15n * BigInt(rom.program[i].inHASHPOS)) : 0n)
            + (rom.program[i].setA ? (2n**16n * BigInt(rom.program[i].setA)) : 0n)
            + (rom.program[i].setB ? (2n**17n * BigInt(rom.program[i].setB)) : 0n)
            + (rom.program[i].setC ? (2n**18n * BigInt(rom.program[i].setC)) : 0n)
            + (rom.program[i].setD ? (2n**19n * BigInt(rom.program[i].setD)) : 0n)
            + (rom.program[i].setE ? (2n**20n * BigInt(rom.program[i].setE)) : 0n)
            + (rom.program[i].setSR ? (2n**21n * BigInt(rom.program[i].setSR)) : 0n)
            + (rom.program[i].setCTX ? (2n**22n * BigInt(rom.program[i].setCTX)) : 0n)
            + (rom.program[i].setSP ? (2n**23n * BigInt(rom.program[i].setSP)) : 0n)
            + (rom.program[i].setPC ? (2n**24n * BigInt(rom.program[i].setPC)) : 0n)
            + (rom.program[i].setGAS ? (2n**25n * BigInt(rom.program[i].setGAS)) : 0n)
            + (rom.program[i].setMAXMEM ? (2n**26n * BigInt(rom.program[i].setMAXMEM)) : 0n)
            + (rom.program[i].setRR ? (2n**27n * BigInt(rom.program[i].setRR)) : 0n)
            + (rom.program[i].setHASHPOS ? (2n**28n * BigInt(rom.program[i].setHASHPOS)) : 0n)
            + (rom.program[i].JMP ? (2n**29n * BigInt(rom.program[i].JMP)) : 0n)
            + (rom.program[i].JMPN ? (2n**30n * BigInt(rom.program[i].JMPN)) : 0n)
            + (rom.program[i].JMPC ? (2n**31n * BigInt(rom.program[i].JMPC)) : 0n)
            + (rom.program[i].isStack ? (2n**32n * BigInt(rom.program[i].isStack)) : 0n)
            + (rom.program[i].isCode ? (2n**33n * BigInt(rom.program[i].isCode)) : 0n)
            + (rom.program[i].isMem ? (2n**34n * BigInt(rom.program[i].isMem)) : 0n)
            + (rom.program[i].useCTX ? (2n**35n * BigInt(rom.program[i].useCTX)) : 0n)
            + (rom.program[i].ind ? (2n**36n * BigInt(rom.program[i].ind)) : 0n)
            + (rom.program[i].indRR ? (2n**37n * BigInt(rom.program[i].indRR)) : 0n)
            + (rom.program[i].mOp ? (2n**38n * BigInt(rom.program[i].mOp)) : 0n)
            + (rom.program[i].mWR ? (2n**39n * BigInt(rom.program[i].mWR)) : 0n)
            + (rom.program[i].sWR ? (2n**40n * BigInt(rom.program[i].sWR)) : 0n)
            + (rom.program[i].sRD ? (2n**41n * BigInt(rom.program[i].sRD)) : 0n)
            + (rom.program[i].arith ? (2n**42n * BigInt(rom.program[i].arith)) : 0n)
            + (rom.program[i].arithEq0 ? (2n**43n * BigInt(rom.program[i].arithEq0)) : 0n)
            + (rom.program[i].arithEq1 ? (2n**44n * BigInt(rom.program[i].arithEq1)) : 0n)
            + (rom.program[i].arithEq2 ? (2n**45n * BigInt(rom.program[i].arithEq2)) : 0n)
            + (rom.program[i].arithEq3 ? (2n**46n * BigInt(rom.program[i].arithEq3)) : 0n)
            + (rom.program[i].hashK ? (2n**47n * BigInt(rom.program[i].hashK)) : 0n)
            + (rom.program[i].hashKLen ? (2n**48n * BigInt(rom.program[i].hashKLen)) : 0n)
            + (rom.program[i].hashKDigest ? (2n**49n * BigInt(rom.program[i].hashKDigest)) : 0n)
            + (rom.program[i].hashP ? (2n**50n * BigInt(rom.program[i].hashP)) : 0n)
            + (rom.program[i].hashPLen ? (2n**51n * BigInt(rom.program[i].hashPLen)) : 0n)
            + (rom.program[i].hashPDigest ? (2n**52n * BigInt(rom.program[i].hashPDigest)) : 0n)
            + (rom.program[i].bin ? (2n**53n * BigInt(rom.program[i].bin)) : 0n)
            + (rom.program[i].assert ? (2n**54n * BigInt(rom.program[i].assert)) : 0n)
            + (rom.program[i].memAlign ? (2n**55n * BigInt(rom.program[i].memAlign)) : 0n)
            + (rom.program[i].memAlignWR ? (2n**56n * BigInt(rom.program[i].memAlignWR)) : 0n)
            + (rom.program[i].memAlignWR8 ? (2n**57n * BigInt(rom.program[i].memAlignWR8)) : 0n);

        pols.incStack[i] = rom.program[i].incStack ? BigInt(rom.program[i].incStack) : 0n;
        pols.incCode[i] = rom.program[i].incCode ? BigInt(rom.program[i].incCode) : 0n;

        pols.binOpcode[i] = rom.program[i].binOpcode ? BigInt(rom.program[i].binOpcode) : 0n;
        pols.line[i] = BigInt(i);

    }

    for (let i= rom.program.length; i<N; i++) {
        pols.CONST0[i] = F.zero;
        pols.CONST1[i] = F.zero;
        pols.CONST2[i] = F.zero;
        pols.CONST3[i] = F.zero;
        pols.CONST4[i] = F.zero;
        pols.CONST5[i] = F.zero;
        pols.CONST6[i] = F.zero;
        pols.CONST7[i] = F.zero;
        pols.offset[i] = F.zero;

        pols.operations[i] = F.zero;

        pols.incStack[i] = F.zero;
        pols.incCode[i] = F.zero;

        pols.binOpcode[i] = F.zero;

        pols.line[i] = BigInt(i);
    }

}