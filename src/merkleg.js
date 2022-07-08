

class MerkleG {

    constructor(poseidon) {
        this.poseidon = poseidon;
    }

    merkelize(vals) {
        if (vals.length == 0) {
            return [];
        } 
        let n;
        let res;
        if (Array.isArray(vals[0])) {
            n = vals.length*4;
            res = new Array(this._size(n));
            for (let i=0; i<vals.length; i++) {
                assert(vals[i].length == 4);
                for (j=0; j<4; j++) {
                    res[i*4+j] = vals[i][j];
                }
            }
        } else {
            n = vals.length;
            res = new Array(this._size(n));
            for (let i=0; i<vals.length; i++) {
                res[i] = vals[i];
            }
        }


        let cur = 0;

        let o=0;
        const buff = new Uint8Array(arity*n8);
        while (n>4) {
            for (let i=0; i<n; i+=8) {
                const ih = res.slice(o+i, o+i+8);
                while (ih.length<8) ih.push(0n);
                const h = this.poseidon(ih);
                for (let k=0; k<4; k++) res[cur ++] = h[k];
            }
            const newN = (cur - (o + n)) ;
            o = o + n;
            n = newN;
        }
        return res;
    }

    getElement(tree, idx) {
        return tree.slice(idx*4, idx*4+4];
    }


    genMerkleProof(tree, idx, offset) {
        offset = offset || 0;
        const n = this._nElements(tree.length);
        if (n<=4) return [];
        const nextIdx = Math.floor(idx / 2);
        let nc = Math.min(arity, n-nextIdx*arity);

        const si =  (idx^1);
        if (si>=n) {
            a = [0n, 0n, 0n, 0n];
        } else {
            a = tree.slice( offset + (idx^1) ,  (idx^1) +4 );
        }

        return [a, ...this.genMerkleProof(tree, nextIdx, offset+n)];
    }

    calculateRootFromProof(mp, idx, value, offset) {
        offset = offset || 0;
        if ((mp.length - offset) == 0) {
            return value;
        }

        const curIdx = idx & 1;
        const nextIdx = Math.floor(idx / 2);

        let nextValue;
        if (idx) {
            nextValue = this.poseidon([...value, mp[offset]])
        } else {
            nextValue = this.poseidon([ mp[offset], ...value])
        }

        return this.calculateRootFromProof(mp, nextIdx, nextValue, offset+1);
    }

    verifyMerkleProof(root, mp, idx, value, offset) {
        const rootC = this.calculateRootFromProof(mp, idx, value, offset);
        for (k=0; k<4; k++) {
            if (!this.poseidon.F.eq(root[k], rootC[k])) return false;
        }
        return true;
    }

    _nElements(n) {
        if (n == 0) return 0;

        let l = 0;
        let treeSize = [4];
        while (n>treeSize[l]) {
            l ++;
            treeSize[l] = treeSize[l-1]+(4 * 2**l);
        }

        if (l==0) return 0;

        let acc = 0;
        let rem = n;
        while ((l>0)&&(rem>0)) {
            rem --;
            acc += Math.floor(rem / treeSize[l-1]) * (4 * 2**(l-1));
            rem = rem % treeSize[l-1];
            l--;
        }

        if (rem) throw new Error("Invalid MT size");
        
        return acc;
    }

    _size(nElements) {
        let s = nElements;
        let n = nElements;
        while (n>4) {
            let nextN = Math.floor((n-1)/8)+1;
            s += nextN;
            n = nextN;
        }
        return s;
    }

    nElements(tree) {
        return this._nElements(tree.length);
    }

    root(tree) {
        return tree.slice(tree.length-4, tree.length);
    }
}

module.exports = MerkleG;
