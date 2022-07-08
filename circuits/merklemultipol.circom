pragma circom 2.0.2;

include "merkle.circom";

template MerkleMultipol_GroupVerifier(nGroups, groupSize, nPols) {

    var arity = 16;
    var nLevels = 0;
    var nn = nGroups;
    while (nn>1) {
        nLevels ++;
        nn = (nn - 1)\arity + 1;
    }
 
    var keyBits = log2(nGroups);

    signal input values[groupSize][nPols];
    signal input siblings[nLevels][arity];
    signal input key[keyBits];
    signal output root;

    component merkelizePol[groupSize];
    component merkelizeGroup = Merkle_Merkelize(groupSize);

    for (var i=0; i<groupSize; i++) {
        merkelizePol[i] = Merkle_Merkelize(nPols);
        for (var k=0; k<nPols; k++) {
            merkelizePol[i].values[k] <== values[i][k];
        }
        merkelizeGroup.values[i] <== merkelizePol[i].root;
    }

    component merkleProof = Merkle_CalculateRootFromProof(nGroups);

    merkleProof.value <== merkelizeGroup.root;

    for (var i=0; i<nLevels; i++) {
        for (var k=0; k<arity; k++) {
            merkleProof.siblings[i][k] <== siblings[i][k];
        }
    }

    for (var i=0; i<keyBits; i++) {
        merkleProof.key[i] <== key[i];
    }

    root <== merkleProof.root;
}