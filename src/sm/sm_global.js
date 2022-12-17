const { F1Field } = require("ffjavascript");

const F = require("ffjavascript").F1Field;

module.exports.buildConstants = async function (pols) {

    const F = new F1Field("0xFFFFFFFF00000001");

    const N = pols.BYTE.length;
    buidBYTE(pols.BYTE, F, N);
    buidBYTE2(pols.BYTE2, F, N);
    buildL1(pols.L1, F, N);
    buildLLAST(pols.LLAST, F, N);
};

function buidBYTE2(pol, F, N) {
    const m = 1<<16;
    if (N<m) throw new Error("GLOBAL.BYTE2 does not fit");
    for (let i=0; i<N; i++) {
        pol[i] = BigInt(i & 0xFFFF);
    }
}

function buidBYTE(pol, F, N) {
    if (N<256) throw new Error("GLOBAL.BYTE does not fit");

    for (let i=0; i<N; i++) {
        pol[i] = BigInt(i & 0xFF);
    }
}

function buidBYTE_2A(pol, F, N) {
    const m = 1<<16;
    if (N<m) throw new Error("GLOBAL.BYTE_2A does not fit");

    for (let i=0; i<N; i++) {
        pol[i] = BigInt((i >> 8) & 0xFF);
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

function buildLLAST(pol, F, N) {
    for ( let i=0; i<N-1; i++) pol[i] = 0n;
    pol[N-1] = 1n;
}
