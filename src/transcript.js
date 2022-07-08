const Scalar = require("ffjavascript").Scalar;

class Transcript {
    constructor(hash, F) {
        this.hash = hash;
        this.F = F;
        this.used = false;
        this.state = F.zero;
        this.isZero = true;
    }

    getField() {
        if (this.used) {
            this.state = this.hash([this.state]);
            this.isZero = false;
        }
        this.used=true;
        return this.state;
    }

    put(a) {
        if (this.isZero) {
            this.state = a;
        } else {
            this.state = this.hash([this.state, a]);
            this.isZero = false;
        }
        this.used = false;
    }

    getPermutations(n, nBits) {
        const res = [];
        const F = this.F;
        const totalBits = n*nBits;
        const NFields = Math.floor((totalBits - 1)/253)+1;
        const fields = [];
        for (let i=0; i<NFields; i++) {
            fields[i] = Scalar.bits(Scalar.e(F.toObject(this.getField())));
        }
        let curField =0;
        let curBit =0;
        for (let i=0; i<n; i++) {
            let a = 0;
            for (let j=0; j<nBits; j++) {
                if (fields[curField][curBit]) a = a + (1<<j);
                curBit ++;
                if (curBit == 253) {
                    curBit = 0;
                    curField ++;
                }
            }
            res.push(a);
        }
        return res;
    }

}

module.exports = Transcript;