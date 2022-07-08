pragma circom 2.0.2;

include "../node_modules/circomlib/circuits/bitify.circom";

template Fields2Idxs(n, nBits) {
    var totalBits = n*nBits;
    var NFields = ((totalBits - 1) \ 253)+1;

    signal input in[NFields];
    signal output out[n][nBits];

    component n2b[NFields];

    for (var i=0; i<NFields; i++) {
        n2b[i] = Num2Bits_strict();
        n2b[i].in <== in[i];
    }

    var b=0;
    var f=0;
    for (var i=0; i<n; i++) {
        for (var j=0; j<nBits; j++) {
            out[i][j] <== n2b[f].out[b];
            b++;
            if (b==253) {
                b=0;
                f++;
            }
        }
    }

}