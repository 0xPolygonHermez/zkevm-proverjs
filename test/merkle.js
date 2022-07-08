const Merkle = require("../src/merkle.js");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
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
        const arr = [];
        for (let i=0; i<417; i++) {
            arr.push(F.e(i));
        }

        const tree = M.merkelize(arr);

        assert(M.nElements(tree) === 417);


    });
    it("It should test short merkle proofs", async () => {
        const M = new Merkle(16, poseidon, poseidon.F);
        const N= 17;
        const idx = 16;
        const arr = [];
        for (let i=0; i<N; i++) {
            arr.push(F.e(i+1000));
        }

        const tree = M.merkelize(arr);

        assert(M.nElements(tree) === N);

        const mp = M.genMerkleProof(tree, idx);

        assert(M.verifyMerkleProof(M.root(tree), mp, idx, F.e(idx+1000)));
    });
    it("It should test long merkle proofs", async () => {
        const M = new Merkle(8, poseidon, poseidon.F);
        const N= 832;
        const idx = 774;
        const arr = [];
        for (let i=0; i<N; i++) {
            arr.push(F.e(i+1000));
        }

        const tree = M.merkelize(arr);

        assert(M.nElements(tree) === N);

        const mp = M.genMerkleProof(tree, idx);

        assert(M.verifyMerkleProof(M.root(tree), mp, idx, F.e(idx+1000)));
    });
    /*
    it("It should test all combinatrions of MT", async () => {
        for (let arity=2; arity<=16; arity ++) {
            const M = new Merkle(arity, poseidon, poseidon.F);
            for (let N= 1; N<300; N++) {
                console.log(`arity: ${arity}, N: ${N}`);
                const arr = [];
                for (let i=0; i<N; i++) {
                    arr.push(F.e(i+1000));
                }
                const tree = M.merkelize(arr);
                for (let idx = 0; idx<N; idx++) {
                    const mp = M.genMerkleProof(tree, idx);

                    assert(M.verifyMerkleProof(M.root(tree), mp, idx, F.e(idx+1000)));            
                }
            }
        }  
    });
    */
});
