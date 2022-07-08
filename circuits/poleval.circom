pragma circom 2.0.2;

template PolEval(n) {
    signal input coefs[n];
    signal input x;
    signal output y;

    signal im[n];

    im[n-1] <== coefs[n-1];

    for (var i= n-2; i>=0; i--) {
        im[i] <== im[i+1]*x + coefs[i];
    }

    y <== im[0];
}