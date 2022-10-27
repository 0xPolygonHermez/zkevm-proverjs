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

template Main() {
    signal output publicsHash;

    signal input aggregatorAddr;
    signal input oldStateRoot[4];
    signal input oldAccInputHash[4];
    signal input oldBathcNum;
    signal input chainId;
    signal input newStateRoot[4];
    signal input newAccInputHash[4];
    signal input newLocalExitRoot[4];
    signal input newBathcNum;

    component publicsHasher = Sha256(1632);

    component n2bAggregatorAddr = Num2Bits(160);
    n2bAggregatorAddr.in <== aggregatorAddr;
    for (var i=0; i<160; i++) {
        publicsHasher.in[0 + 160 - 1 -i] <== n2bAggregatorAddr.out[i];
    }

    component n2bOldStateRoot[4];
    for (var i=0; i<4; i++) {
        n2bOldStateRoot[i] = Num2Bits(64);
        n2bOldStateRoot[i].in <== oldStateRoot[i];
        for (var j=0; j<64; j++) {
            publicsHasher.in[160 + 64*(i+1) - 1 -j] <== n2bOldStateRoot[i].out[j];
        }
    }

    component n2bOldAccInputHash[4];
    for (var i=0; i<4; i++) {
        n2bOldAccInputHash[i] = Num2Bits(64);
        n2bOldAccInputHash[i].in <== oldAccInputHash[i];
        for (var j=0; j<64; j++) {
            publicsHasher.in[416 + 64*(i+1) - 1 -j] <== n2bOldAccInputHash[i].out[j];
        }
    }

    component n2bOldBatchNum = Num2Bits(64);
    n2bOldBatchNum.in <== oldBathcNum;
    for (var i=0; i<64; i++) {
        publicsHasher.in[672 + 64 - 1 -i] <== n2bOldBatchNum.out[i];
    }

    component n2bChainId = Num2Bits(64);
    n2bChainId.in <== chainId;
    for (var i=0; i<64; i++) {
        publicsHasher.in[736 + 64 - 1 -i] <== n2bChainId.out[i];
    }

    component n2bNewStateRoot[4];
    for (var i=0; i<4; i++) {
        n2bNewStateRoot[i] = Num2Bits(64);
        n2bNewStateRoot[i].in <== newStateRoot[i];
        for (var j=0; j<64; j++) {
            publicsHasher.in[800 + 64*(i+1) - 1 -j] <== n2bNewStateRoot[i].out[j];
        }
    }

    component n2bNewAccInputHash[4];
    for (var i=0; i<4; i++) {
        n2bNewAccInputHash[i] = Num2Bits(64);
        n2bNewAccInputHash[i].in <== newAccInputHash[i];
        for (var j=0; j<64; j++) {
            publicsHasher.in[1056 + 64*(i+1) - 1 -j] <== n2bNewAccInputHash[i].out[j];
        }
    }

    component n2bNewLocalExitRoot[4];
    for (var i=0; i<4; i++) {
        n2bNewLocalExitRoot[i] = Num2Bits(64);
        n2bNewLocalExitRoot[i].in <== newLocalExitRoot[i];
        for (var j=0; j<64; j++) {
            publicsHasher.in[1312 + 64*(i+1) - 1 -j] <== n2bNewLocalExitRoot[i].out[j];
        }
    }

    component n2bNewBatchNum = Num2Bits(64);
    n2bNewBatchNum.in <== newBathcNum;
    for (var i=0; i<64; i++) {
        publicsHasher.in[1568 + 64 - 1 -i] <== n2bNewBatchNum.out[i];
    }

    component b2nPublicsHash = Bits2Num(256);
    for (var i = 0; i < 256; i++) {
        b2nPublicsHash.in[i] <== publicsHasher.out[255-i];
    }

    publicsHash <== b2nPublicsHash.out;
}

component main = Main();
