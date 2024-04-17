

const {Scalar, F1Field}  = require("ffjavascript");

const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { scalarToFea384 } = require('../lib/fea.js');

module.exports.buildConstants = async function buildConstants(pols, rom) {

    const F = new F1Field("0xFFFFFFFF00000001");

    const N = pols.offset.length;

    const blob = typeof pols.inCntSha256F === 'undefined';

    const twoTo31 = Scalar.e(0x80000000);
    const maxInt = 2147483647;
    const minInt = -2147483648;
    const maxUInt = 0xFFFFFFFF;
    const minUInt = 0;

    if (rom.program.length>N) throw new Error("Rom is too big for this N");

    for (let i=0; i<N; i++) {
        const pIndex = i < rom.program.length ? i:(rom.program.length-1);
        const romLine = rom.program[pIndex];
        if (romLine.CONST) {
            if (romLine.CONSTL) throw new Error("Program mixed with long and short constants");
            pols.CONST0[i] = romLine.CONST ? F.e(romLine.CONST) : F.zero;
            pols.CONST1[i] = F.zero;
            pols.CONST2[i] = F.zero;
            pols.CONST3[i] = F.zero;
            pols.CONST4[i] = F.zero;
            pols.CONST5[i] = F.zero;
            pols.CONST6[i] = F.zero;
            pols.CONST7[i] = F.zero;
        } else if (romLine.CONSTL) {
            [
                pols.CONST0[i],
                pols.CONST1[i],
                pols.CONST2[i],
                pols.CONST3[i],
                pols.CONST4[i],
                pols.CONST5[i],
                pols.CONST6[i],
                pols.CONST7[i],
            ] = romLine.mode384 ? scalarToFea384(F, BigInt(romLine.CONSTL)) : scalar2fea(F, BigInt(romLine.CONSTL));
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
        pols.offset[i] = romLine.offset ? BigInt(romLine.offset) : 0n;

        pols.inA[i] = romLine.inA ? F.e(romLine.inA) : F.zero;
        pols.inB[i] = romLine.inB ? F.e(romLine.inB) : F.zero;
        pols.inC[i] = romLine.inC ? F.e(romLine.inC) : F.zero;
        pols.inD[i] = romLine.inD ? F.e(romLine.inD) : F.zero;
        pols.inE[i] = romLine.inE ? F.e(romLine.inE) : F.zero;
        pols.inSR[i] = romLine.inSR ? F.e(romLine.inSR) : F.zero;
        pols.inCTX[i] = romLine.inCTX ? F.e(romLine.inCTX) : F.zero;
        pols.inSP[i] = romLine.inSP ? F.e(romLine.inSP) : F.zero;
        pols.inPC[i] = romLine.inPC ? F.e(romLine.inPC) : F.zero;
        pols.inSTEP[i] = romLine.inSTEP ? F.e(romLine.inSTEP) : F.zero;
        pols.inFREE[i] = romLine.inFREE ? F.e(romLine.inFREE) : F.zero;
        pols.inFREE0[i] = romLine.inFREE0 ? F.e(romLine.inFREE0) : F.zero;
        pols.inGAS[i] = romLine.inGAS ? F.e(romLine.inGAS) : F.zero;
        pols.inRR[i] = romLine.inRR ? F.e(romLine.inRR) : F.zero;
        pols.inHASHPOS[i] = romLine.inHASHPOS ? F.e(romLine.inHASHPOS) : F.zero;
        pols.inROTL_C[i] = romLine.inROTL_C ? F.e(romLine.inROTL_C) : F.zero;
        pols.inRCX[i] = romLine.inRCX ? F.e(romLine.inRCX) : F.zero;
        pols.inRID[i] = romLine.inRID ? F.e(romLine.inRID) : F.zero;

        pols.inCntArith[i] = romLine.inCntArith ? F.e(romLine.inCntArith) : F.zero;
        pols.inCntBinary[i] = romLine.inCntBinary ? F.e(romLine.inCntBinary) : F.zero;
        pols.inCntKeccakF[i] = romLine.inCntKeccakF ? F.e(romLine.inCntKeccakF) : F.zero;
        pols.inCntMemAlign[i] = romLine.inCntMemAlign ? F.e(romLine.inCntMemAlign) : F.zero;
        pols.inCntPaddingPG[i] = romLine.inCntPaddingPG ? F.e(romLine.inCntPaddingPG) : F.zero;
        pols.inCntPoseidonG[i] = romLine.inCntPoseidonG ? F.e(romLine.inCntPoseidonG) : F.zero;
        if (!blob) {
            pols.inCntSha256F[i] = romLine.inCntSha256F ? F.e(romLine.inCntSha256F) : F.zero;
        }

        /*
            code generated with:
            node tools/pil_pol_table/bits_compose.js "arith,arithSame12,arithUseCD,arithUseE,assert,bin,hashK,hashKDigest,hashKLen,hashP,hashPDigest,hashPLen,isMem,isStack,JMP,JMPC,JMPN,memAlignRD,memAlignWR,mOp,mWR,repeat,setA,setB,setC,setCTX,setD,setE,setGAS,setHASHPOS,setPC,setRCX,setRR,setSP,setSR,sRD,sWR,useCTX,JMPZ,call,return,save,restore,setRID,hashBytesInD,assumeFree,memUseAddrRel,jmpUseAddrRel,elseUseAddrRel,free0IsByte,hashS,hashSDigest,hashSLen" -B -e -p "romLine."
        */

        pols.operations[i] =
              (romLine.arith ? (2n**0n  * BigInt(romLine.arith)) : 0n)
            + (romLine.arithSame12 ? (2n**1n  * BigInt(romLine.arithSame12)) : 0n)
            + (romLine.arithUseCD ? (2n**2n  * BigInt(romLine.arithUseCD)) : 0n)
            + (romLine.arithUseE ? (2n**3n  * BigInt(romLine.arithUseE)) : 0n)
            + (romLine.assert ? (2n**4n  * BigInt(romLine.assert)) : 0n)
            + (romLine.bin ? (2n**5n  * BigInt(romLine.bin)) : 0n)
            + (romLine.hashK ? (2n**6n  * BigInt(romLine.hashK)) : 0n)
            + (romLine.hashKDigest ? (2n**7n  * BigInt(romLine.hashKDigest)) : 0n)
            + (romLine.hashKLen ? (2n**8n  * BigInt(romLine.hashKLen)) : 0n)
            + (romLine.hashP ? (2n**9n  * BigInt(romLine.hashP)) : 0n)
            + (romLine.hashPDigest ? (2n**10n * BigInt(romLine.hashPDigest)) : 0n)
            + (romLine.hashPLen ? (2n**11n * BigInt(romLine.hashPLen)) : 0n)
            + (romLine.isMem ? (2n**12n * BigInt(romLine.isMem)) : 0n)
            + (romLine.isStack ? (2n**13n * BigInt(romLine.isStack)) : 0n)
            + (romLine.JMP ? (2n**14n * BigInt(romLine.JMP)) : 0n)
            + (romLine.JMPC ? (2n**15n * BigInt(romLine.JMPC)) : 0n)
            + (romLine.JMPN ? (2n**16n * BigInt(romLine.JMPN)) : 0n)
            + (romLine.memAlignRD ? (2n**17n * BigInt(romLine.memAlignRD)) : 0n)
            + (romLine.memAlignWR ? (2n**18n * BigInt(romLine.memAlignWR)) : 0n)
            + (romLine.mOp ? (2n**19n * BigInt(romLine.mOp)) : 0n)
            + (romLine.mWR ? (2n**20n * BigInt(romLine.mWR)) : 0n)
            + (romLine.repeat ? (2n**21n * BigInt(romLine.repeat)) : 0n)
            + (romLine.setA ? (2n**22n * BigInt(romLine.setA)) : 0n)
            + (romLine.setB ? (2n**23n * BigInt(romLine.setB)) : 0n)
            + (romLine.setC ? (2n**24n * BigInt(romLine.setC)) : 0n)
            + (romLine.setCTX ? (2n**25n * BigInt(romLine.setCTX)) : 0n)
            + (romLine.setD ? (2n**26n * BigInt(romLine.setD)) : 0n)
            + (romLine.setE ? (2n**27n * BigInt(romLine.setE)) : 0n)
            + (romLine.setGAS ? (2n**28n * BigInt(romLine.setGAS)) : 0n)
            + (romLine.setHASHPOS ? (2n**29n * BigInt(romLine.setHASHPOS)) : 0n)
            + (romLine.setPC ? (2n**30n * BigInt(romLine.setPC)) : 0n)
            + (romLine.setRCX ? (2n**31n * BigInt(romLine.setRCX)) : 0n)
            + (romLine.setRR ? (2n**32n * BigInt(romLine.setRR)) : 0n)
            + (romLine.setSP ? (2n**33n * BigInt(romLine.setSP)) : 0n)
            + (romLine.setSR ? (2n**34n * BigInt(romLine.setSR)) : 0n)
            + (romLine.sRD ? (2n**35n * BigInt(romLine.sRD)) : 0n)
            + (romLine.sWR ? (2n**36n * BigInt(romLine.sWR)) : 0n)
            + (romLine.useCTX ? (2n**37n * BigInt(romLine.useCTX)) : 0n)
            + (romLine.JMPZ ? (2n**38n * BigInt(romLine.JMPZ)) : 0n)
            + (romLine.call ? (2n**39n * BigInt(romLine.call)) : 0n)
            + (romLine.return ? (2n**40n * BigInt(romLine.return)) : 0n)
            + (romLine.save ? (2n**41n * BigInt(romLine.save)) : 0n)
            + (romLine.restore ? (2n**42n * BigInt(romLine.restore)) : 0n)
            + (romLine.setRID ? (2n**43n * BigInt(romLine.setRID)) : 0n)
            + (romLine.hashBytesInD ? (2n**44n * BigInt(romLine.hashBytesInD)) : 0n)
            + (romLine.assumeFree ? (2n**45n * BigInt(romLine.assumeFree)) : 0n)
            + (romLine.memUseAddrRel ? (2n**46n * BigInt(romLine.memUseAddrRel)) : 0n)
            + (romLine.jmpUseAddrRel ? (2n**47n * BigInt(romLine.jmpUseAddrRel)) : 0n)
            + (romLine.elseUseAddrRel ? (2n**48n * BigInt(romLine.elseUseAddrRel)) : 0n)
            + (romLine.free0IsByte ? (2n**49n * BigInt(romLine.free0IsByte)) : 0n)
            + (romLine.hashS ? (2n**50n * BigInt(romLine.hashS)) : 0n)
            + (romLine.hashSDigest ? (2n**51n * BigInt(romLine.hashSDigest)) : 0n)
            + (romLine.hashSLen ? (2n**52n * BigInt(romLine.hashSLen)) : 0n);

        pols.ind[i] = romLine.ind ? BigInt(romLine.ind) : 0n;
        pols.indRR[i] = romLine.indRR ? BigInt(romLine.indRR) : 0n;
        pols.incStack[i] = romLine.incStack ? BigInt(romLine.incStack) : 0n;
        pols.hashBytes[i] = romLine.hashBytes ? BigInt(romLine.hashBytes) : 0n;
        pols.hashOffset[i] = romLine.hashOffset ? BigInt(romLine.hashOffset) : 0n;
        pols.binOpcode[i] = romLine.binOpcode ? BigInt(romLine.binOpcode) : 0n;
        pols.jmpAddr[i] = romLine.jmpAddr ? BigInt(romLine.jmpAddr) : 0n;
        pols.elseAddr[i] = romLine.elseAddr ? BigInt(romLine.elseAddr) : 0n;
        pols.arithEquation[i] = romLine.arithEquation ? BigInt(romLine.arithEquation) : 0n;
        pols.condConst[i] = romLine.condConst ? BigInt(romLine.condConst) : 0n;
        pols.line[i] = BigInt(pIndex);
    }
}