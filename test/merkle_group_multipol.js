const Merkle = require("../src/merkle.js");
const MerkleGroupMultiPol = require("../src/merkle_group_multipol.js")
const buildPoseidon = require("circomlibjs").buildPoseidon;
const chai = require("chai");
const assert = chai.assert;

describe("merkle", async function () {
    let poseidon;
    let F;
    this.timeout(10000000);

    before(async () => { 
        poseidon = await buildPoseidon();
        F = poseidon.F;
    })

    it("It should merkelize and return the right number of elements", async () => {
        const M = new Merkle(16, poseidon, poseidon.F);
        const N = 256;
        const nGroups = 16;
        const idx = 3;
        const groupSize = N/nGroups;
        const nPols = 2;
        const MGP = new MerkleGroupMultiPol(M, nGroups, groupSize, 2);

        const pols = [];
        for (let i=0; i<nPols; i++) pols[i] = [];
        for (let i=0; i<N; i++) {
            for (let j=0; j<nPols; j++) {
                pols[j].push(F.e(i + j*1000));
            }
        }

        const tree = MGP.merkelize(pols);

        const [groupElements, mp] = MGP.getGroupProof(tree, idx);
        const root = MGP.root(tree);

        assert(MGP.verifyGroupProof(root, mp, idx, groupElements));

        const ep = MGP.getElementsProof(tree, idx);

        assert(MGP.verifyElementProof(root, ep[1], idx, ep[0]));
    });
});