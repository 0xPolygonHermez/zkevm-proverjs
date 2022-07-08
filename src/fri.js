const { assert } = require("chai");
const Merkle = require("./merkle");
const GroupMerkle = require("./merkle_group");
const {polMulAxi, evalPol} = require("./polutils");
const {log2} = require("./utils");
const Scalar = require("ffjavascript").Scalar;

class FRI {

    constructor(F, hash, arity, starkStruct) {
        this.F = F;
        this.M = new Merkle(arity, hash, F);
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

    async prove(transcript, pol, queryPol) {
        const proof = [];
        const F = this.F;

        let polBits = log2(pol.length);
        assert(1<<polBits == pol.length, "Invalid poluynomial size");    // Check the input polynomial is a power of 2
        assert(polBits == this.inNBits, "Invalid polynomial size");

        let shiftInv = F.shiftInv;
        let shift = F.shift;

        for (let si = 0; si<this.steps.length; si++) {
            const reductionBits = polBits - this.steps[si].nBits;

            const pol2N = 1 << (polBits - reductionBits);
            const nX = pol.length / pol2N;

            const pol2_e = new Array(pol2N);

            let special_x = transcript.getField();

            // TODO, this can be calculated the same way than the verifier
/*
            const pol2_e_test = new Array(pol2N);
            const pol_c = await F.ifft(pol);
            polMulAxi(F, pol_c, F.one, shiftInv);    // Multiplies coefs by 1, shiftInv, shiftInv^2, shiftInv^3, ......

            let yS = [F.exp(shift, Scalar.e(     (1<<reductionBits)  ) )];
            for (let k=1; k<pol2N; k++) yS[k] = F.mul(yS[k-1], F.w[ this.steps[si].nBits ]);

            let fx = pol_c[pol.length -1];
            for (let j=nX-2; j>= 0; j--) {
                fx = F.add(F.mul(fx, special_x), pol_c[pol.length - nX + j]);
            }
            for (let k=0; k<pol2N; k++) pol2_e_test[k] = fx;

            for (let g = pol.length/nX - 2; g>=0; g--) {
                let fx = pol_c[g*nX +nX -1];
                for (let j=nX-2; j>= 0; j--) {
                    fx = F.add(F.mul(fx, special_x), pol_c[g*nX + j]);
                }
                for (let k=0; k<pol2N; k++) {
                    pol2_e_test[k] = F.add(F.mul(pol2_e_test[k], yS[k]), fx);
                }
            }
*/

            ////// End Test Code

            let sinv = shiftInv;
            const wi = F.inv(F.w[polBits]);
            for (let g = 0; g<pol.length/nX; g++) {
                const ppar = new Array(nX);
                for (let i=0; i<nX; i++) {
                    ppar[i] = pol[(i*pol2N)+g];
                }
                const ppar_c = await F.ifft(ppar);
/*
                const sinv = F.inv(F.mul( shift, F.exp(  F.w[polBits], g)));
*/
                polMulAxi(F, ppar_c, F.one, sinv);    // Multiplies coefs by 1, shiftInv, shiftInv^2, shiftInv^3, ......

                pol2_e[g] = evalPol(F, ppar_c, special_x);
                sinv = F.mul(sinv, wi);
            }


            ////// End of production code

            const proofItem = {};

            let groupSize;
            if (si < this.steps.length -1) {
                groupSize = 1<< (this.steps[si].nBits - this.steps[si+1].nBits);
            } else {
                groupSize=1;
            }

            const GMT = new GroupMerkle(this.M, pol2_e.length / groupSize,groupSize);

            const tree = GMT.merkelize(pol2_e);

            proofItem.root2 = GMT.root(tree);
            transcript.put(GMT.root(tree));
            const ys = transcript.getPermutations(this.steps[si].nQueries, this.steps[si].nBits);
            proofItem.polQueries = [];
            proofItem.pol2Queries = [];
            for (let i=0; i<ys.length; i++) {
                proofItem.pol2Queries.push(GMT.getElementProof(tree, ys[i]));
                proofItem.polQueries.push(queryPol(ys[i]));
            }

            queryPol = (idx) => {
                return GMT.getGroupProof(tree, idx);
            }

            proof.push(proofItem);
            for (let j=0; j<reductionBits; j++) {
                shiftInv = F.mul(shiftInv, shiftInv);
                shift = F.mul(shift, shift);
            }

            pol = pol2_e;
            polBits = polBits-reductionBits;
        }

        proof.push(pol);

        return proof;
    }

    async verify(transcript, proof, checkQuery) {

        const F = this.F;

        assert(proof.length == this.steps.length+1, "Invalid proof size");

        let polBits = this.inNBits;

        let shift = F.shift;

        for (let si=0; si<this.steps.length; si++) {
            const proofItem=proof[si];
            const reductionBits = polBits - this.steps[si].nBits;

            let special_x = transcript.getField();

            transcript.put(proofItem.root2);
            const ys = transcript.getPermutations(this.steps[si].nQueries, this.steps[si].nBits);

            let groupSize;
            if (si < this.steps.length -1) {
                groupSize = 1<< (this.steps[si].nBits - this.steps[si+1].nBits);
            } else {
                groupSize=1;
            }

            const GMT = new GroupMerkle(this.M,(1 << this.steps[si].nBits)/groupSize  ,groupSize);

            if ( si == this.steps.length-1) {
                assert( proof[si+1].length == 1 << this.steps[this.steps.length-1].nBits, "Invalid size in lastPol");
                const calcRoot = GMT.root(GMT.merkelize(proof[si+1]));
                if (!F.eq(calcRoot, proofItem.root2)) return false;
            }


            const nQueries = this.steps[si].nQueries;
            for (let i=0; i<nQueries; i++) {
                const pgroup_e = checkQuery(proofItem.polQueries[i], ys[i]);
                if (!pgroup_e) return false;

                const res = GMT.verifyElementProof(proofItem.root2, proofItem.pol2Queries[i][1], ys[i], proofItem.pol2Queries[i][0]);

                if (res !== true) return false;

                const pgroup_c = await F.ifft(pgroup_e);
                const sinv = F.inv(F.mul( shift, F.exp(  F.w[polBits], Scalar.e(ys[i]))));
                polMulAxi(F, pgroup_c, F.one, sinv);    // Multiplies coefs by 1, shiftInv, shiftInv^2, shiftInv^3, ......


                const ev = evalPol(F, pgroup_c, special_x);

                if (!F.eq(proofItem.pol2Queries[i][0], ev)) return false;
            }

            checkQuery = (query, idx) => {
                const res = GMT.verifyGroupProof(proofItem.root2, query[1], idx, query[0]);
                if (!res) return false;
                return query[0];
            }

            polBits = this.steps[si].nBits;
            for (let j=0; j<reductionBits; j++) shift = F.mul(shift, shift);

        }

        const lastPol_e = proof[proof.length-1];

        let maxDeg;
        if (( polBits - (this.inNBits - this.maxDegNBits)) <0) {
            maxDeg =0;
        } else {
            maxDeg = 1 <<  ( polBits - (this.inNBits - this.maxDegNBits));
        }

        const lastPol_c = await F.ifft(lastPol_e);
        // We don't need to divide by shift as we just need to check for zeros

        for (let i=maxDeg+1; i< lastPol_c.length; i++) {
            if (!F.isZero(lastPol_c[i])) return false;
        }

        return true;

    }
}

module.exports = FRI;


