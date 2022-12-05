pragma circom 2.1.0;

/*
aggregatorAddr -> 160   -> 160
oldStateRoot -> 256     -> 416
oldAccInputHash -> 256  -> 672
oldBathcNum -> 64       -> 736
chainId -> 64           -> 800
newStateRoot -> 256     -> 1056
newAccInputHash -> 256  -> 1312
newLocalExitRoot -> 256 -> 1568
newBatchNum -> 64       -> 1632

Total: 1632
*/

include "sha256/sha256.circom";
include "bitify.circom";
include "recursivef.verifier.circom";

template Main() {
    signal output publicsHash;

    signal input aggregatorAddr;

    signal input publics[43];
    signal input root1;
    signal input root2;
    signal input root3;
    signal input root4;

    signal input evals[57][3];

    signal input s0_vals1[64][12];
    signal input s0_vals3[64][15];
    signal input s0_vals4[64][12];
    signal input s0_valsC[64][23];

    signal input s0_siblings1[64][6][16];
    signal input s0_siblings3[64][6][16];
    signal input s0_siblings4[64][6][16];
    signal input s0_siblingsC[64][6][16];

    signal input s1_root;
    signal input s2_root;
    signal input s3_root;
    signal input s4_root;
    signal input s5_root;

    signal input s1_vals[64][48];
    signal input s1_siblings[64][5][16];
    signal input s2_vals[64][48];
    signal input s2_siblings[64][4][16];
    signal input s3_vals[64][48];
    signal input s3_siblings[64][3][16];
    signal input s4_vals[64][48];
    signal input s4_siblings[64][2][16];
    signal input s5_vals[64][48];
    signal input s5_siblings[64][1][16];

    signal input finalPol[16][3];


    component sv = StarkVerifier();
    sv.publics <== publics;
    sv.root1 <== root1;
    sv.root2 <== root2;
    sv.root3 <== root3;
    sv.root4 <== root4;

    sv.evals <== evals;

    sv.s0_vals1 <== s0_vals1;
    sv.s0_vals3 <== s0_vals3;
    sv.s0_vals4 <== s0_vals4;
    sv.s0_valsC <== s0_valsC;

    sv.s0_siblings1 <== s0_siblings1;
    sv.s0_siblings3 <== s0_siblings3;
    sv.s0_siblings4 <== s0_siblings4;
    sv.s0_siblingsC <== s0_siblingsC;

    sv.s1_root <== s1_root;
    sv.s2_root <== s2_root;
    sv.s3_root <== s3_root;
    sv.s4_root <== s4_root;
    sv.s5_root <== s5_root;

    sv.s1_vals <== s1_vals;
    sv.s1_siblings <== s1_siblings;
    sv.s2_vals <== s2_vals;
    sv.s2_siblings <== s2_siblings;
    sv.s3_vals <== s3_vals;
    sv.s3_siblings <== s3_siblings;
    sv.s4_vals <== s4_vals;
    sv.s4_siblings <== s4_siblings;
    sv.s5_vals <== s5_vals;
    sv.s5_siblings <== s5_siblings;

    sv.finalPol <== finalPol;

    component publicsHasher = Sha256(1632);

    component n2bAggregatorAddr = Num2Bits(160);
    n2bAggregatorAddr.in <== aggregatorAddr;
    for (var i=0; i<160; i++) {
        publicsHasher.in[0 + 160 - 1 -i] <== n2bAggregatorAddr.out[i];
    }

    component n2bOldStateRoot[8];
    for (var i=0; i<8; i++) {
        n2bOldStateRoot[i] = Num2Bits(32);
        n2bOldStateRoot[i].in <== publics[0 + i];
        for (var j=0; j<32; j++) {
            publicsHasher.in[160 + 32*(8-i) - 1 -j] <== n2bOldStateRoot[i].out[j];
        }
    }

    component n2bOldAccInputHash[8];
    for (var i=0; i<8; i++) {
        n2bOldAccInputHash[i] = Num2Bits(32);
        n2bOldAccInputHash[i].in <== publics[8 + i];
        for (var j=0; j<32; j++) {
            publicsHasher.in[416 + 32*(8-i) - 1 -j] <== n2bOldAccInputHash[i].out[j];
        }
    }

    // Do 63 bits to avoid aliasing
    component n2bOldBatchNum = Num2Bits(63);
    n2bOldBatchNum.in <== publics[16];
    for (var i=0; i<63; i++) {
        publicsHasher.in[672 + 64 - 1 -i] <== n2bOldBatchNum.out[i];
    }
    publicsHasher.in[672] <== 0;

    component n2bChainId = Num2Bits(63);
    n2bChainId.in <== publics[17];
    for (var i=0; i<63; i++) {
        publicsHasher.in[736 + 64 - 1 -i] <== n2bChainId.out[i];
    }
    publicsHasher.in[736] <== 0;

    component n2bNewStateRoot[8];
    for (var i=0; i<8; i++) {
        n2bNewStateRoot[i] = Num2Bits(32);
        n2bNewStateRoot[i].in <== publics[18+i];
        for (var j=0; j<32; j++) {
            publicsHasher.in[800 + 32*(8-i) - 1 -j] <== n2bNewStateRoot[i].out[j];
        }
    }

    component n2bNewAccInputHash[8];
    for (var i=0; i<8; i++) {
        n2bNewAccInputHash[i] = Num2Bits(32);
        n2bNewAccInputHash[i].in <== publics[26+i];
        for (var j=0; j<32; j++) {
            publicsHasher.in[1056 + 32*(8-i) - 1 -j] <== n2bNewAccInputHash[i].out[j];
        }
    }

    component n2bNewLocalExitRoot[8];
    for (var i=0; i<8; i++) {
        n2bNewLocalExitRoot[i] = Num2Bits(32);
        n2bNewLocalExitRoot[i].in <== publics[34+i];
        for (var j=0; j<32; j++) {
            publicsHasher.in[1312 + 32*(8-i) - 1 -j] <== n2bNewLocalExitRoot[i].out[j];
        }
    }

    component n2bNewBatchNum = Num2Bits(63);
    n2bNewBatchNum.in <== publics[42];
    for (var i=0; i<63; i++) {
        publicsHasher.in[1568 + 64 - 1 -i] <== n2bNewBatchNum.out[i];
    }
    publicsHasher.in[1568] <== 0;

    component b2nPublicsHash = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        b2nPublicsHash.in[i] <== publicsHasher.out[255-i];
    }

    publicsHash <== b2nPublicsHash.out;
}

component main = Main();
