pragma circom 2.0.2;

include "merkle.circom";

template MerkleGroup_GroupVerifier(nGroups, groupSize) {

    var arity = 16;
    var nLevels = 0;
    var nn = nGroups;
    while (nn>1) {
        nLevels ++;
        nn = (nn - 1)\arity + 1;
    }
 
    var keyBits = log2(nGroups);

    signal input values[groupSize];
    signal input siblings[nLevels][arity];
    signal input key[keyBits];
    signal output root;

    component merkelizeGroup = Merkle_Merkelize(groupSize);

    for (var i=0; i<groupSize; i++) {
        merkelizeGroup.values[i] <== values[i];
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


template MerkleGroup_ElementVerifier(nGroups, groupSize) {

    var arity = 16;
    var nLevelsH = 0;
    var nnH = nGroups;
    while (nnH>1) {
        nLevelsH ++;
        nnH = (nnH - 1)\arity + 1;
    }
    var nLevelsL = 0;
    var nnL = groupSize;
    while (nnL>1) {
        nLevelsL ++;
        nnL = (nnL - 1)\arity + 1;
    }
 
    var keyBitsH = log2(nGroups);
    var keyBitsL = log2(groupSize);

    signal input value;
    signal input siblingsL[nLevelsL][arity];
    signal input siblingsH[nLevelsH][arity];
    signal input key[keyBitsH + keyBitsL];
    signal output root;

    component merkleProofL = Merkle_CalculateRootFromProof(groupSize);

    merkleProofL.value <== value;

    for (var i=0; i<nLevelsL; i++) {
        for (var k=0; k<arity; k++) {
            merkleProofL.siblings[i][k] <== siblingsL[i][k];
        }
    }

    for (var i=0; i<keyBitsL; i++) {
        merkleProofL.key[i] <== key[i + keyBitsH];
    }

    component merkleProofH = Merkle_CalculateRootFromProof(nGroups);

    merkleProofH.value <== merkleProofL.root;

    for (var i=0; i<nLevelsH; i++) {
        for (var k=0; k<arity; k++) {
            merkleProofH.siblings[i][k] <== siblingsH[i][k];
        }
    }

    for (var i=0; i<keyBitsH; i++) {
        merkleProofH.key[i] <== key[i];
    }

    root <== merkleProofH.root;
}