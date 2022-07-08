
const GroupMerkle = require("../src/merkle_group");
const FRI = require("../src/fri.js");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
const chai = require("chai");
const assert = chai.assert;
const Transcript = require("../src/transcript.js");
const {polMulAxi} = require("../src/polutils");
const { stringifyFElements, unstringifyFElements} = require("ffjavascript").utils;

describe("FRI", async function () {
    let poseidon;
    let F;
    this.timeout(10000000);

    before(async () => { 
        poseidon = await buildPoseidon();
        F = poseidon.F;
    })

    it("Tiny proof: It should create a proof and verify it", async () => {

        const Nbits = 1;
        const N = 1 << Nbits;
        const fri = new FRI(F, poseidon, 16, {
            nBits: Nbits, 
            nBitsExt: Nbits+1, 
            steps: [
                {nBits: 1, nQueries: 1}, 
                {nBits: 0, nQueries: 1}
            ]
        });

        const pol_c = new Array(N*2);
        for (let i=0; i<N; i++) pol_c[i] = F.e(i+1);
        for (let i=N; i<2*N; i++) pol_c[i] = F.zero;
        polMulAxi(F, pol_c, F.one, F.shift);
        const pol_e = await F.fft(pol_c);

        const proof = await prove1Pol(fri, pol_e);

        const proofJ = stringifyFElements(F, proof);

        // console.log(JSON.stringify(proofJ));

        const proof2 = unstringifyFElements(F, proofJ);

        res = await verify1Pol(fri, proof2);

        assert(res);
    });

    it("Small proof: It should create a proof and verify it", async () => {

        const Nbits = 2;
        const N = 1 << Nbits;
        const fri = new FRI(F, poseidon, 16, {
            nBits: Nbits, 
            nBitsExt: Nbits+1, 
            steps: [
                {nBits: 2, nQueries: 1}, 
                {nBits: 1, nQueries: 1}
            ]
        });

        const pol_c = new Array(N*2);
        for (let i=0; i<N; i++) pol_c[i] = F.e(i+1);
        for (let i=N; i<2*N; i++) pol_c[i] = F.zero;
        polMulAxi(F, pol_c, F.one, F.shift);
        const pol_e = await F.fft(pol_c);

        const proof = await prove1Pol(fri, pol_e);

        res = await verify1Pol(fri, proof);

        assert(res);
    });
/*
    it("Medium proof: It should create a proof and verify it", async () => {

        const Nbits = 16;
        const N = 1 << Nbits;
        const fri = new FRI(F, poseidon, 16, Nbits+1, Nbits, [{nBits: 10, nQueries: 128}, {nBits: 7, nQueries: 128}] );

        const pol_c = new Array(N*2);
        for (let i=0; i<N; i++) pol_c[i] = F.e(i+1);
        for (let i=N; i<2*N; i++) pol_c[i] = F.zero;
        polMulAxi(F, pol_c, F.one, F.shift);
        const pol_e = await F.fft(pol_c);

        // console.log("Start Proving "+ Date());
        const proof = await prove1Pol(fri, pol_e);
        // console.log("Start Vrifying " + Date());


        res = await verify1Pol(fri, proof);

        assert(res);
    });
*/
    async function prove1Pol(fri, pol_e) {

        groupSize = 1<< (fri.inNBits - fri.steps[0].nBits);

        const GMT = new GroupMerkle(fri.M, (1 << fri.inNBits)/groupSize, groupSize);
        const tree = GMT.merkelize(pol_e);

        const queryPol = (idx) => {
            return GMT.getGroupProof(tree, idx);
        }

        const transcript = new Transcript(poseidon, F);
        transcript.put(GMT.root(tree));

        return [GMT.root(tree), await fri.prove(transcript, pol_e, queryPol)];
    }

    async function verify1Pol(fri, proof) {

        groupSize = 1<< (fri.inNBits - fri.steps[0].nBits);
        const GMT = new GroupMerkle(fri.M, (1 << fri.inNBits)/groupSize, groupSize);

        const root = proof[0];
        const transcript = new Transcript(poseidon, F);
        transcript.put(root);

        const checkQuery = (query, idx) => {
            const res = GMT.verifyGroupProof(root, query[1], idx, query[0]);
            if (!res) return false;
            return query[0];
        }

        return await fri.verify(transcript, proof[1], checkQuery);
    }

});