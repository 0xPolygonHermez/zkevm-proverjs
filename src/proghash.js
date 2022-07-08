
const createConstantPols = require("creeatepols").createConstantPols;
Scalar = require("ffjavascript").Scalar;
const buildPoseidon = require("circomlibjs").buildPoseidon;

module.exports.buildConstants = function (pols, N) {

    const poseidon = await buildPoseidon();

    const F = poseidon.F;

    const stepsPerRound = 15*31;
    const Nrounds = Math.floor(N/32);

    for (let i=0; i<Nrounds*stepsPerRound; i++) {
        pols.sLastBlock[i] = (i%stepsPerRound==stepsPerRound-1);
        const el = Math.floor(i/31)+1; 
        const shn = (31-(i%31))*8;
        const sh = F.e(Scalar.shl(Scalar.e(1),  shn))
        pols.factor1 = (el==1) ? sh : F.zero;
        pols.factor2 = (el==2) ? sh : F.zero;
        pols.factor3 = (el==3) ? sh : F.zero;
        pols.factor4 = (el==4) ? sh : F.zero;
        pols.factor5 = (el==5) ? sh : F.zero;
        pols.factor6 = (el==6) ? sh : F.zero;
        pols.factor7 = (el==7) ? sh : F.zero;
        pols.factor8 = (el==8) ? sh : F.zero;
        pols.factor9 = (el==9) ? sh : F.zero;
        pols.factor10 = (el==10) ? sh : F.zero;
        pols.factor11 = (el==11) ? sh : F.zero;
        pols.factor12 = (el==12) ? sh : F.zero;
        pols.factor13 = (el==13) ? sh : F.zero;
        pols.factor14 = (el==14) ? sh : F.zero;
        pols.factor15 = (el==15) ? sh : F.zero;

        if (i%stepsPerRound == 0) {
            pols.factorLen = F.e(Scalar.shl(Scalar.e(1),  24))
        } else if (i%stepsPerRound == 1) {
            pols.factorLen = F.e(Scalar.shl(Scalar.e(1),  16))
        } else if (i%stepsPerRound == 2) {
            pols.factorLen = F.e(Scalar.shl(Scalar.e(1),  8))
        } else if (i%stepsPerRound == 3) {
            pols.factorLen = F.one;
        }
    }

    for (let i=Nrounds*stepsPerRound; i++) {
        pols.sLastBlock[i] = (i==N-1);
        pols.factor1 = F.zero;
        pols.factor2 = F.zero;
        pols.factor3 = F.zero;
        pols.factor4 = F.zero;
        pols.factor5 = F.zero;
        pols.factor6 = F.zero;
        pols.factor7 = F.zero;
        pols.factor8 = F.zero;
        pols.factor9 = F.zero;
        pols.factor10 = F.zero;
        pols.factor11 = F.zero;
        pols.factor12 = F.zero;
        pols.factor13 = F.zero;
        pols.factor14 = F.zero;
        pols.factor15 = F.zero;
        pols.factorLen = F.zero;
    }
}

module.exports.execute = function (pols, programs, N) {

    const poseidon = await buildPoseidon();

    const F = poseidon.F;

    const stepsPerRound = 15*31;
    const Nrounds = Math.floor(N/32);

    let curProgram=0;
    let pos=0;
    let startTotalHashIdx;
    let startPartialHashIdx;
    let curPartialHash;

    for (let i=0; i<N; i++) {


        if (i>0) pols.partialHash[i] = curPartialHash;
        if (i>0) pols.isFinished[i] = pols.isFinished[i-1];
        if (i>0) pols.hashPrevPartial[i] = pols.hashPrevPartial[i-1];
        if (i>0) pols.firstBlock[i] = pols.firstBlock[i-1];

        if (i%stepsPerRound == 0) {
            startPartialHashIdx = i;
            pols.h1[i] = F.zero;
            pols.h2[i] = F.zero;
            pols.h3[i] = F.zero;
            pols.h4[i] = F.zero;
            pols.h5[i] = F.zero;
            pols.h6[i] = F.zero;
            pols.h7[i] = F.zero;
            pols.h8[i] = F.zero;
            pols.h9[i] = F.zero;
            pols.h10[i] = F.zero;
            pols.h11[i] = F.zero;
            pols.h12[i] = F.zero;
            pols.h13[i] = F.zero;
            pols.h14[i] = F.zero;
            pols.h15[i] = F.zero;
            pols.firstBlock[i] = false;
            if (i>0) pols.hashPrevPartial[i] = pols.partialHash[i-1];
        } else {
            pols.h1[i] = pols.h1[i-1];
            pols.h2[i] = pols.h2[i-1];
            pols.h3[i] = pols.h3[i-1];
            pols.h4[i] = pols.h4[i-1];
            pols.h5[i] = pols.h5[i-1];
            pols.h6[i] = pols.h6[i-1];
            pols.h7[i] = pols.h7[i-1];
            pols.h8[i] = pols.h8[i-1];
            pols.h9[i] = pols.h9[i-1];
            pols.h10[i] = pols.h10[i-1];
            pols.h11[i] = pols.h11[i-1];
            pols.h12[i] = pols.h12[i-1];
            pols.h13[i] = pols.h13[i-1];
            pols.h14[i] = pols.h14[i-1];
            pols.h15[i] = pols.h15[i-1];
        }

        if (pos = 0) {
            startTotalHashIdx = i;
            pols.totalAddr[i] = -4;
            pols.isFinished[i] = false;
            pols.firstBlock[i] = true;
            pols.hashPrevPartial[i] = F.zero;
            pols.len[i] = 0;
        } else {
            pols.totalAddr[i] = pols.totalAddr[i-1] + 1;
            pols.isFinished[i] = pols.isFinished[i - 1];
            pols.len[i] = pols.len[i];
        }


        pols.freeIn[i] = getByte(programs, curProgram, pos);
        pos ++;

        pols.h1[i] = F.add(pols.h1[i], F.mul(constPols.factor1[i], F.e(pols.freeIn[i])));
        pols.h2[i] = F.add(pols.h2[i], F.mul(constPols.factor2[i], F.e(pols.freeIn[i])));
        pols.h3[i] = F.add(pols.h3[i], F.mul(constPols.factor3[i], F.e(pols.freeIn[i])));
        pols.h4[i] = F.add(pols.h4[i], F.mul(constPols.factor4[i], F.e(pols.freeIn[i])));
        pols.h5[i] = F.add(pols.h5[i], F.mul(constPols.factor5[i], F.e(pols.freeIn[i])));
        pols.h6[i] = F.add(pols.h6[i], F.mul(constPols.factor6[i], F.e(pols.freeIn[i])));
        pols.h7[i] = F.add(pols.h7[i], F.mul(constPols.factor7[i], F.e(pols.freeIn[i])));
        pols.h8[i] = F.add(pols.h8[i], F.mul(constPols.factor8[i], F.e(pols.freeIn[i])));
        pols.h9[i] = F.add(pols.h9[i], F.mul(constPols.factor9[i], F.e(pols.freeIn[i])));
        pols.h10[i] = F.add(pols.h10[i], F.mul(constPols.factor10[i], F.e(pols.freeIn[i])));
        pols.h11[i] = F.add(pols.h11[i], F.mul(constPols.factor11[i], F.e(pols.freeIn[i])));
        pols.h12[i] = F.add(pols.h12[i], F.mul(constPols.factor12[i], F.e(pols.freeIn[i])));
        pols.h13[i] = F.add(pols.h13[i], F.mul(constPols.factor13[i], F.e(pols.freeIn[i])));
        pols.h14[i] = F.add(pols.h14[i], F.mul(constPols.factor14[i], F.e(pols.freeIn[i])));
        pols.h15[i] = F.add(pols.h15[i], F.mul(constPols.factor15[i], F.e(pols.freeIn[i])));

        if (pols.firstBlock[i]) {
            pols.len[i] = F.add(pols.len[i], F.mul(constPols.factorlen[i], F.e(pols.freeIn[i])));
        }

        if (pols.totalAddr[i] = pols.len[i] - 1) {
            pols.isFinished[i] = true;
            pols.lastData_isZeroInv[i] = 0;
        } else {
            pols.lastData_isZeroInv[i] = F.inv( F.e(pols.totalAddr[i] = pols.len[i] - 1) );
        }


        if ( constPols.sLastBlock ) {
            curPartialHash = poseidon([
                pols.partialHash[i],
                pols.h1[i],
                pols.h2[i],
                pols.h3[i],
                pols.h4[i],
                pols.h5[i],
                pols.h6[i],
                pols.h7[i],
                pols.h8[i],
                pols.h9[i],
                pols.h10[i],
                pols.h11[i],
                pols.h12[i],
                pols.h13[i],
                pols.h14[i],
                pols.h15[i]
            ]);
            for (let j= startPartialHashIdx; j<=i; j++ ) {
                pols.hashTotal[j] = curPartialHash;
            }
            if (pols.isFinished[i]) {
                isNewProgram = true;
                curProgram ++;
                pos = 0;
                for (let j= startTotalHashIdx; j<=i; j++ ) {
                    pols.hashTotal[j] = curPartialHash;
                }
            }
        }

    }


}