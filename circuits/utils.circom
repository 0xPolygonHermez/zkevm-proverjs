pragma circom 2.0.2;

function log2(a) {
    if (a==0) {
        return 0;
    }
    var n = 1;
    var r = 0;
    while (n<a) {
        r++;
        n *= 2;
    }
    return r;
}