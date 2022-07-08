
// This function is very useful for building fri.
// It is a tree of trees (group).
// You can ask/proof for an individual element or for a full grouo

const { assert } = require("chai");
const Merkle = require("./merkle");
const buffer2array = require("ffjavascript").utils.buffer2array;

class GroupMerkle {

    constructor(M, nGroups, groupSize) {
        this.groupSize = groupSize;
        this.nGroups = nGroups;
        this.M = M;
    }

    merkelize(vals) {
        assert(this.nGroups*this.groupSize == vals.length, "GroupMerkle: size of vals must be a multiple of group Size" );

        const res = {
            mainTree: null,
            groupTrees: new Array(this.nGroups),
        };

        const groupRoots  = new Array(this.nGroups);
        for (let i=0; i<this.nGroups; i++) {
            const group = new Array(this.groupSize);
            for (let j=0; j<this.groupSize; j++) {
                group[j] = vals[j*this.nGroups + i];
            }
            res.groupTrees[i] = this.M.merkelize(group);
            groupRoots[i] = this.M.root(res.groupTrees[i]);
        }

        res.mainTree = this.M.merkelize(groupRoots);

        return res;
    }

    getElementProof(tree, idx) {   // --> [val, MP]
        const n8 = this.M.n8;
        const group = idx % this.nGroups;
        const groupIdx = Math.floor(idx / this.nGroups); 

        const v = tree.groupTrees[group].slice(groupIdx*n8, groupIdx*n8+n8);
        const mpL = this.M.genMerkleProof(tree.groupTrees[group], groupIdx);
        const mpH = this.M.genMerkleProof(tree.mainTree, group);

        return [v, [mpL, mpH]];
    }

    getGroupProof(tree, idx) {   //  --> [[groupElement0, groupElement1, ......], MP]
        const n8 = this.M.n8;
        const v = [];
        for (let i=0; i<this.groupSize; i++) {
            v.push( tree.groupTrees[idx].slice(i*n8, (i+1)*n8));
        }
        const mp = this.M.genMerkleProof(tree.mainTree, idx);

        return [v, mp];
    }

    calculateRootFromElementProof(mp, idx, val) {
        const group = idx % this.nGroups;
        const groupIdx = Math.floor(idx / this.nGroups); 
        const rootG = this.M.calculateRootFromProof(mp[0], groupIdx, val);
        const root = this.M.calculateRootFromProof(mp[1], group, rootG);
        return root;
    }

    verifyElementProof(root, mp, idx, val) {
        const cRoot = this.calculateRootFromElementProof(mp, idx, val);
        return this.M.F.eq(cRoot, root);
    }

    calculateRootFromGroupProof(mp, grouIdx, groupElements) {
        const tree = this.M.merkelize(groupElements);
        const rootG = this.M.root(tree);
        const root = this.M.calculateRootFromProof(mp, grouIdx, rootG);
        return root;
    }

    verifyGroupProof(root, mp, idx, groupElements) {
        const cRoot = this.calculateRootFromGroupProof(mp, idx, groupElements);
        return this.M.F.eq(cRoot, root);
    }

    root(tree) {
        return this.M.root(tree.mainTree);
    }

}

module.exports = GroupMerkle;