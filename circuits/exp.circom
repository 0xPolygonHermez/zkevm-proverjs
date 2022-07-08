pragma circom 2.0.2;

template Exp(n) {
    signal input in;
    signal input exp[n];
    signal output out;

    signal im[n];
    signal r[n];
    signal aux[n];

    r[0] <== in;
    aux[0] <== in;
    im[0] <== exp[0]*(in -1)+1;


    for (var i=1; i<n; i++) {
        r[i] <== r[i-1]*r[i-1];

        aux[i] <== r[i] * im[i-1];
        im[i] <== exp[i]*(aux[i] -im[i-1] )+im[i-1];
    }

    out <== im[n-1];
}