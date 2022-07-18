const { F1Field } = require("ffjavascript");

const F = require("ffjavascript").F1Field;

module.exports.buildConstants = async function (pols) {

    const F = new F1Field("0xFFFFFFFF00000001");

    const N = pols.BYTE.length || pols.BYTE2.length || pols.L1.length;
    if (pols.BYTE) buidBYTE(pols.BYTE, F, N);
    if (pols.BYTE2) buidBYTE2(pols.BYTE2, F, N);
    if (pols.L1)  buildL1(pols.L1, F, N);

};

function buidBYTE2(pol, F, N) {
    const m = 1<<16;
    if (N<m) throw new Error("GLOBAL.BYTE does not fit");
    for (let i=0; i<m; i++) {
        pol[i] = BigInt(i);
    }

    for (let i=m; i<N; i++) {
        pol[i] = 0n;
    }
}

function buidBYTE(pol, F, N) {
    if (N<256) throw new Error("GLOBAL.BYTE does not fit");

    for (let i=0; i<256; i++) {
        pol[i] = BigInt(i);
    }

    for (let i=256; i<N; i++) {
        pol[i] = 0n;
    }
}


function buildZhInv(pol, F, N) {
    for ( let i=0; i<N; i++) pol[i] =  F.zero;
}

function buildZh(pol, F, N) {
    for ( let i=0; i<N; i++) pol[i] =  F.zero;
}

function buildL1(pol, F, N) {
    pol[0] = 1n;
    for ( let i=1; i<N; i++) pol[i] = 0n;
}
