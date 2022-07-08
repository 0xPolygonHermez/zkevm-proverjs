const buildPoseidon = require("circomlibjs").buildPoseidon;
const Transcript = require("./transcript");
const FRI = require("../src/fri.js");
const {genCalculator, calculate} = require("./pil2starkPolCalculator.js");
const defaultStarkStruct = require("./starkstruct");
const Merkle = require("./merkle");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");

module.exports = async function starkVerify(proof, publics, pil, verKey) {
    const nBits = verKey.nBits || 23;
    const N = 1 << nBits;
    const extendBits = verKey.extendBits || 1;
    const starkStruct = verKey.starkStruct || defaultStarkStruct;

    const groupSize = 1 << (nBits+extendBits - starkStruct.steps[0].nBits);
    const nGroups = 1 << starkStruct.steps[0].nBits;

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const calculator = genCalculator(F, pil);

    const M = new Merkle(16, poseidon, poseidon.F);
    const MGPC = new MerkleGroupMultipol(M, nGroups, groupSize, pil.nConstants);
    const MGP1 = new MerkleGroupMultipol(M, nGroups, groupSize, calculator.nTree1);
    const MGP2 = new MerkleGroupMultipol(M, nGroups, groupSize, calculator.nTree2);
    const MGP3 = new MerkleGroupMultipol(M, nGroups, groupSize, calculator.nTree3);


    const transcript = new Transcript(poseidon, poseidon.F);

    const challanges = {};
    transcript.put(proof[0]);
    challanges.u = transcript.getField();
    challanges.defVal = transcript.getField();
    transcript.put(proof[1]);
    challanges.gamma = transcript.getField();
    challanges.beta = transcript.getField();
    transcript.put(proof[2]);
    challanges.v = transcript.getField();

    const fri = new FRI(F, poseidon, 16, starkStruct );


    const checkQuery = (query, idx) => {
        console.log("Query:"+  idx)
        let res;
        res = MGP1.verifyGroupProof(proof[0], query[0][1], idx, query[0][0]);
        if (!res) return false;
        res = MGP2.verifyGroupProof(proof[1], query[1][1], idx, query[1][0]);
        if (!res) return false;
        res = MGP3.verifyGroupProof(proof[2], query[2][1], idx, query[2][0]);
        if (!res) return false;
        res = MGPC.verifyGroupProof(verKey.constRoot, query[3][1], idx, query[3][0]);
        if (!res) return false;

        res = MGP1.verifyGroupProof(proof[0], query[4][1], idx + (1<<extendBits), query[4][0]);
        if (!res) return false;
        res = MGP2.verifyGroupProof(proof[1], query[5][1], idx + (1<<extendBits), query[5][0]);
        if (!res) return false;
        res = MGP3.verifyGroupProof(proof[2], query[6][1], idx + (1<<extendBits), query[6][0]);
        if (!res) return false;
        res = MGPC.verifyGroupProof(verKey.constRoot, query[7][1], idx + (1<<extendBits), query[7][0]);
        if (!res) return false;

        const vals = new Array(groupSize);

        for (let i=0; i<groupSize; i++) {
            const tree1 = query[0][0][i];
            const tree2 = query[1][0][i];
            const tree3 = query[2][0][i];
            const consts = query[3][0][i];
            const tree1p = query[4][0][i];
            const tree2p = query[5][0][i];
            const tree3p = query[6][0][i];
            const constsp = query[7][0][i];
            vals[i] = calculate(F, calculator, tree1, tree2, tree3, consts, tree1p, tree2p, tree3p, constsp, challanges, publics);
        }

        return vals;
    }

    return fri.verify(transcript, proof[3], checkQuery);

}
