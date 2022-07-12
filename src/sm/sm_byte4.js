module.exports.buildConstants = async function (pols, polsDef) {
    const N = Number(polsDef.SET.polDeg);

    for ( let i=0; i<N; i++) pols.SET[i] = (i % 2 == 0) ? 1n : 0n;
}


module.exports.execute = async function (pols, polsDef, input) {

    const N = Number(polsDef.freeIN.polDeg);

    let p=0;
    let last = 0;
    Object.keys(input).forEach( (n) => {
        const num = Number(n);
        pols.freeIN[p] = BigInt(num >>> 16);
        pols.out[p] = BigInt(last);
        p++;
        pols.freeIN[p] = BigInt(num & 0xFFFF);
        pols.out[p] = BigInt(num >>> 16);
        p++;
        last = num;
    });
    pols.freeIN[p] = 0n;
    pols.out[p] = BigInt(last);
    p++;
    pols.freeIN[p] = 0n;
    pols.out[p] = 0n;
    p++;

    if (p >= N) {
        throw new Error("Too many byte4");
    }

    while (p<N) {
        pols.freeIN[p] = 0n;
        pols.out[p] = 0n;
        p++;
    }
}