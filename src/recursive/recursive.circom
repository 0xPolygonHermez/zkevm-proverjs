

template Main() {

    var rootCSingle[4] = [
        1111,
        2222,
        3333,
        4444
    ];
    signal input publics[43];
    signsl input rootC[4];

    signal input a_publics[43];

    signal input a_root1[4];
    signal input a_root2[4];
    signal input a_root3[4];
    signal input a_root4[4];
    signal input a_evals[79][3];

    signal input a_s0_vals1[64][12];
    signal input a_s0_vals3[64][3];
    signal input a_s0_vals4[64][79];
    signal input a_s0_valsC[64][20];
    signal input a_s0_siblings1[64][26][4];
    signal input a_s0_siblings3[64][26][4];
    signal input a_s0_siblings4[64][26][4];
    signal input a_s0_siblingsC[64][26][4];

    signal input a_s1_root[4];
    signal input a_s2_root[4];
    signal input a_s3_root[4];
    signal input a_s4_root[4];

    signal input a_s1_vals[64][96];
    signal input a_s1_siblings[64][21][4];
    signal input a_s2_vals[64][96];
    signal input a_s2_siblings[64][16][4];
    signal input a_s3_vals[64][96];
    signal input a_s3_siblings[64][11][4];
    signal input a_s4_vals[64][96];
    signal input a_s4_siblings[64][6][4];

    signal input a_finalPol[64][3];



    signal input b_publics[43];

    signal input b_root1[4];
    signal input b_root2[4];
    signal input b_root3[4];
    signal input b_root4[4];
    signal input b_evals[79][3];

    signal input b_s0_vals1[64][12];
    signal input b_s0_vals3[64][3];
    signal input b_s0_vals4[64][79];
    signal input b_s0_valsC[64][20];
    signal input b_s0_siblings1[64][26][4];
    signal input b_s0_siblings3[64][26][4];
    signal input b_s0_siblings4[64][26][4];
    signal input b_s0_siblingsC[64][26][4];

    signal input b_s1_root[4];
    signal input b_s2_root[4];
    signal input b_s3_root[4];
    signal input b_s4_root[4];

    signal input b_s1_vals[64][96];
    signal input b_s1_siblings[64][21][4];
    signal input b_s2_vals[64][96];
    signal input b_s2_siblings[64][16][4];
    signal input b_s3_vals[64][96];
    signal input b_s3_siblings[64][11][4];
    signal input b_s4_vals[64][96];
    signal input b_s4_siblings[64][6][4];

    signal input b_finalPol[64][3];

    StarkVerifier vA, vB;

    vA.publics <== a_publics;
    vA.root1 <== a_root1;
    vA.root2 <== a_root2;
    vA.root3 <== a_root3;
    vA.root4 <== a_root4;
    vA.evals <== a_evals;
    vA.s0_vals1 <== a_s0_vals1;
    vA.s0_vals3 <== a_s0_vals3;
    vA.s0_vals4 <== a_s0_vals4;
    vA.s0_valsC <== a_s0_valsC;
    vA.s0_siblings1 <== a_s0_siblings1;
    vA.s0_siblings3 <== a_s0_siblings3;
    vA.s0_siblings4 <== a_s0_siblings4;
    vA.s0_siblingsC <== a_s0_siblingsC;
    vA.s1_root <== a_s1_root;
    vA.s2_root <== a_s2_root;
    vA.s3_root <== a_s3_root;
    vA.s4_root <== a_s4_root;
    vA.s1_vals <== a_s1_vals;
    vA.s1_siblings <== a_s1_siblings;
    vA.s2_vals <== a_s2_vals;
    vA.s2_siblings <== a_s2_siblings;
    vA.s3_vals <== a_s3_vals;
    vA.s3_siblings <== a_s3_siblings;
    vA.s4_vals <== a_s4_vals;
    vA.s4_siblings <== a_s4_siblings;
    vA.finalPol <== a_finalPol;

    component isOneBatchA = IsZero();
    isOneBatchA.in  <== a_publics[42] - a_publics[16] - 1;
    component a_muxRootC = MultiMux1();
    a_muxRootC.c[0] <== rootCSingle;
    a_muxRootC.c[1] <== rootC;
    vA.rootC <== a_muxRootC.out;


    vB.publics <== b_publics;
    vB.root1 <== b_root1;
    vB.root2 <== b_root2;
    vB.root3 <== b_root3;
    vB.root4 <== b_root4;
    vB.evals <== b_evals;
    vB.s0_vals1 <== b_s0_vals1;
    vB.s0_vals3 <== b_s0_vals3;
    vB.s0_vals4 <== b_s0_vals4;
    vB.s0_valsC <== b_s0_valsC;
    vB.s0_siblings1 <== b_s0_siblings1;
    vB.s0_siblings3 <== b_s0_siblings3;
    vB.s0_siblings4 <== b_s0_siblings4;
    vB.s0_siblingsC <== b_s0_siblingsC;
    vB.s1_root <== b_s1_root;
    vB.s2_root <== b_s2_root;
    vB.s3_root <== b_s3_root;
    vB.s4_root <== b_s4_root;
    vB.s1_vals <== b_s1_vals;
    vB.s1_siblings <== b_s1_siblings;
    vB.s2_vals <== b_s2_vals;
    vB.s2_siblings <== b_s2_siblings;
    vB.s3_vals <== b_s3_vals;
    vB.s3_siblings <== b_s3_siblings;
    vB.s4_vals <== b_s4_vals;
    vB.s4_siblings <== b_s4_siblings;
    vB.finalPol <== b_finalPol;


    component isOneBatchB = IsZero();
    isOneBatchB.in <== b_publics[42] - b_publics[16] - 1;
    component b_muxRootC = MultiMux1();
    b_muxRootC.c[0] <== rootCSingle;
    b_muxRootC.c[1] <== rootC;
    vB.rootC <== b_muxRootC.out;

    // oldStateRoot
    for (var i=0; i<8; i++) {
        a_publics[i] === publics[i];
    }

    // oldAccInputHash
    for (var i=8; i<16; i++) {
        a_publics[i] === publics[i];
    }

    // oldBatchNum
    a_publics[16] === publics[16];

    // chainId
    a_publics[17] === publics[17];

    // midStateRoot
    for (var i=0; i<8; i++) {
        b_publics[i] === a_publics[18+i];
    }

    // midAccInputHash
    for (var i=8; i<16; i++) {
        b_publics[i] === a_publics[18+i];
    }

    // midBatchNum
    b_publics[16] === a_publics[18+24];

    // chainId
    a_publics[17] === publics[17];


    // newStateRoot
    for (var i=0; i<8; i++) {
        publics[18+i] === b_publics[18+i];
    }

    // newAccInputHash
    for (var i=8; i<16; i++) {
        publics[18+i] === b_publics[18+i];
    }

    // localExitRoot
    for (var i=16; i<24; i++) {
        publics[18+i] === b_publics[18+i];
    }

    // newBatchNum
    publics[18+24] === b_publics[18+24];
}

component main {public [publics, rootC]}= Main();