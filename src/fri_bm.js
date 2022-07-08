const { assert } = require("chai");
const Merkle = require("./merkle");
const GroupMerkle = require("./merkle_group");
const {polMulAxi, evalPol} = require("./polutils");
const {log2} = require("./utils");
const Scalar = require("ffjavascript").Scalar;

class FRI {

    constructor(F, bmb, starkStruct) {
        this.F = F;
        this.bmb = bmb;
        this.inNBits = starkStruct.nBitsExt;
        this.maxDegNBits = starkStruct.nBits;;
        if (starkStruct) {
            this.steps = starkStruct.steps;
        } else {
            this.steps = [
                {
                    nBits: 25,
                    nQueries: 128
                },
                {
                    nBits: 16,
                    nQueries: 128
                },
                {
                    nBits: 7,
                    nQueries: 128
                }
            ];
        }
    }

    prove(transcript, pol, queryPol) {
        const F = this.F;
        const bmb = this.bmb;
        const proof = [];

        let polBits = this.inNBits;

        let shiftInv = F.shiftInv;
        let shift = F.shift;

        for (let si = 0; si<this.steps.length; si++) {
            const reductionBits = polBits - this.steps[si].nBits;

            const pol2N = 1 << (polBits - reductionBits);
            const nX = 1 << reductionBits;

            let special_x = transcript.getField();

            const pol2_e = bmb.friReduce(pol, special_x, reductionBits, F.toString(shiftInv), F.toString(F.inv(F.w[polBits]))); 

            ////// End of production code

            const proofItem = {};

            let groupSize;
            if (si < this.steps.length -1) {
                groupSize = 1<< (this.steps[si].nBits - this.steps[si+1].nBits);
            } else {
                groupSize=1;
            }

            const tree = bmb.treeGroup_merkelize(pol2N/groupSize, groupSize, pol2_e);
        
            const root = bmb.treeGroup_root(tree);

            proofItem.root2 = bmb.reference(root);
            transcript.put(root);
            const ys = transcript.getPermutations(this.steps[si].nQueries, this.steps[si].nBits);
            proofItem.polQueries = [];
            proofItem.pol2Queries = [];
            for (let i=0; i<this.steps[si].nQueries; i++) {
                proofItem.pol2Queries.push(bmb.reference( bmb.treeGroup_getElementProof(tree, bmb.idxArray_get(ys, i))));
                proofItem.polQueries.push(queryPol( bmb.idxArray_get(ys, i) ));
            }

            queryPol = (idx) => {
                return bmb.reference( bmb.treeGroup_getGroupProof(tree, idx));
            }

            proof.push(proofItem);
            for (let j=0; j<reductionBits; j++) {
                shiftInv = F.mul(shiftInv, shiftInv);
                shift = F.mul(shift, shift);
            }

            pol = pol2_e;
            polBits = polBits-reductionBits;
        }

        proof.push(bmb.reference(pol));

        return proof;
    }

}

module.exports = FRI;


