pragma circom 2.0.2;

include "utils.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template Merkle_CalculateRootFromProof(n) {
    var arity = 16;
    var nLevels = 0;
    var nn = n;
    while (nn>1) {
        nLevels ++;
        nn = (nn - 1)\arity + 1;
    }
 
    var keyBits = log2(n);

    signal input value;
    signal input siblings[nLevels][arity];
    signal input key[keyBits];
    signal output root;

    signal s[16];
    signal a, b, c, d, ab, ac, ad, bc, bd, cd, abc, abd, acd, bcd, abcd;

    component mNext;
    component hash;

    if (nLevels == 0) {
        root <== value;
    } else {
        if (keyBits>=1) {
            d <== key[0]; 
        } else {
            d <== 0;
        }
        if (keyBits>=2) {
            c <== key[1]; 
        } else {
            c <== 0;
        }
        if (keyBits>=3) {
            b <== key[2]; 
        } else {
            b <== 0;
        }
        if (keyBits>=4) {
            a <== key[3]; 
        } else {
            a <== 0;
        }
        
        ab <== a*b;
        ac <== a*c;
        ad <== a*d;
        bc <== b*c;
        bd <== b*d;
        cd <== c*d;

        abc <== ab*c;
        abd <== ab*d;
        acd <== ac*d;
        bcd <== bc*d;

        abcd <== ab*cd;

        s[0] <== 1-d-c + cd-b + bd + bc-bcd-a + ad + ac-acd + ab-abd-abc + abcd;
        s[1] <== d-cd-bd + bcd-ad + acd + abd-abcd;
        s[2] <== c-cd-bc + bcd-ac + acd + abc-abcd;
        s[3] <== cd-bcd-acd + abcd;
        s[4] <== b-bd-bc + bcd-ab + abd + abc-abcd;
        s[5] <== bd-bcd-abd + abcd;
        s[6] <== bc-bcd-abc + abcd;
        s[7] <== bcd-abcd;
        s[8] <== a-ad-ac + acd-ab + abd + abc-abcd;
        s[9] <== ad-acd-abd + abcd;
        s[10] <== ac-acd-abc + abcd;
        s[11] <== acd-abcd;
        s[12] <== ab-abd-abc + abcd;
        s[13] <== abd-abcd;
        s[14] <== abc-abcd;
        s[15] <== abcd;

        hash = Poseidon(arity);

        for (var i=0; i<arity; i++) {
            hash.inputs[i] <== s[i] * (value - siblings[0][i] ) + siblings[0][i];
        }

        var nNext = (n - 1)\arity + 1;

        mNext = Merkle_CalculateRootFromProof(nNext);
        mNext.value <== hash.out;

        for (var i=0; i<nLevels-1; i++) {
            for (var k=0; k<arity; k++) {
                mNext.siblings[i][k] <== siblings[i+1][k];
            }
        }

        var keyBitsNext = log2(nNext);

        for (var i=0; i<keyBitsNext; i++) {
            mNext.key[i] <== key[i+4];
        }

        root <== mNext.root;
    }

}


template Merkle_Merkelize(n) {
    var arity = 16;
    signal input values[n];
    signal output root;

    var nNext = (n - 1)\arity + 1;

    component hashes[nNext];
    component mNext;

    if (n==1) {
        root <== values[0];
    } else {

        mNext = Merkle_Merkelize(nNext);

        for (var i=0; i<nNext; i++) {
            hashes[i] = Poseidon(arity);
            for (var j=0; j<arity; j++) {
                if ((i*arity + j) < n) {
                    hashes[i].inputs[j] <== values[ i*arity + j];
                } else {
                    hashes[i].inputs[j] <== 0;
                }
            }
            mNext.values[i] <== hashes[i].out;
        }

        root <== mNext.root;
    }
}
