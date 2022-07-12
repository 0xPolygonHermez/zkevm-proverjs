

module.exports = async function (pols, polsDef) {

    const N = Number(polsDef.STEP.polDeg);

    for ( let i=0; i<N; i++) {
        pols.STEP[i] = BigInt(i);
    }
}









