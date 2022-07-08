

class Merkle {

    constructor(arity, hash, F) {
        this.hash = hash;
        this.F = F;
        this.arity = arity;
        this.n8 = 32;
    }

    merkelize(vals) {
        const n8 = this.n8;
        const arity = this.arity;
        let n=vals.length;
        const res = new Uint8Array(this._size(n)*n8);
        let cur = 0;
        for (let i=0; i<vals.length; i++) {
            res.set(this.F.e(vals[i]), i*n8);
            cur += n8;
        }

        let o=0;
        const buff = new Uint8Array(arity*n8);
        while (n>1) {
            for (let i=0; i<n; i+=arity) {
                let nc = Math.min(arity, n-i);
                buff.set( res.slice(o + i*n8 , o+(i+nc)*n8));
                for (let k= nc; k<arity; k++) buff.set(this.F.zero, k*n8);
                res.set(this.hash(buff), cur);
                cur +=n8;
            }
            const newN = (cur - (o + n*n8)) / n8;
            o = o + n*n8;
            n = newN;
        }
        return res;
    }

    getElement(tree, idx) {
        return tree.slice(idx*this.n8, idx*this.n8 + this.n8);
    }


    genMerkleProof(tree, idx, offset) {
        const n8=this.n8;
        offset = offset || 0;
        const arity = this.arity;
        const n = this._nElements(tree.byteLength/n8-offset, arity);
        if (n<=1) return [];
        const nextIdx = Math.floor(idx / arity);
        let nc = Math.min(arity, n-nextIdx*arity);
/*
        const a = new Uint8Array(n8*arity);
        a.set(tree.slice( (offset + nextIdx*arity)*n8, (offset + nextIdx*arity + nc)*n8));
        for (let k= nc; k<arity; k++) a.set(this.F.zero, k*n8);
*/
        const a = new Array(arity);
        for (let k= 0; k<nc; k++) a[k] = tree.slice( (offset + nextIdx*arity + k)*n8,  (offset + nextIdx*arity + k +1)*n8);
        for (let k= nc; k<arity; k++) a[k] = this.F.zero;

        return [a, ...this.genMerkleProof(tree, nextIdx, offset+n)];
    }

    calculateRootFromProof(mp, idx, value, offset) {
        const n8 = this.n8;
        value = this.F.e(value);
        offset = offset || 0;
        const arity = this.arity;
        if ((mp.length - offset) == 0) {
            return value;
        }

        const curIdx = idx % arity;
        const nextIdx = Math.floor(idx / arity);

        const a = mp[offset].slice();

        /*
        if (a.byteLength != arity*n8) return false;
        a.set(value, curIdx*n8);
        */

        if (a.length != arity) return false;
        a[curIdx] = value;
        const nextValue = this.hash(a);

        return this.calculateRootFromProof(mp, nextIdx, nextValue, offset+1);
    }

    verifyMerkleProof(root, mp, idx, value, offset) {
        const rootC = this.calculateRootFromProof(mp, idx, value, offset);
        return this.F.eq(root, rootC);
    }

    _nElements(n) {
        const arity = this.arity;

        if (n == 0) return 0;

        let l = 0;
        let treeSize = [1];
        while (n>treeSize[l]) {
            l ++;
            treeSize[l] = treeSize[l-1]+(arity**l);
        }

        if (l==0) return 0;

        let acc = 0;
        let rem = n;
        while ((l>0)&&(rem>0)) {
            rem --;
            acc += Math.floor(rem / treeSize[l-1]) * arity**(l-1);
            rem = rem % treeSize[l-1];
            l--;
        }

        if (rem) throw new Error("Invalid MT size");
        
        return acc;
    }

    _size(nElements) {
        let s = nElements;
        let n = nElements;
        while (n>1) {
            let nextN = Math.floor((n-1)/this.arity)+1;
            s += nextN;
            n = nextN;
        }
        return s;
    }

    nElements(tree) {
        return this._nElements(tree.byteLength/this.n8, this.arity);
    }

    root(tree) {
        return tree.slice(tree.byteLength-this.n8, tree.byteLength);
    }
}

module.exports = Merkle;
