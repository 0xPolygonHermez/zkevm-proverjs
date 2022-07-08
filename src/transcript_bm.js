class TranscriptBM {
    constructor(bmb) {
        this.bmb = bmb
        this.used = false;
        this.state = bmb.field_zero();
        this.isZero = true;
    }

    getField() {
        if (this.used) {
            this.state = this.bmb.hash([this.state]);
            this.isZero = false;
        }
        this.used=true;
        return this.state;
    }

    put(a) {
        if (this.isZero) {
            this.state = a;
        } else {
            this.state = this.bmb.hash([this.state, a])
        }
        this.isZero = false;
        this.used = false;
    }

    getPermutations(n, nBits) {
        const totalBits = n*nBits;
        const NFields = Math.floor((totalBits - 1)/253)+1;
        const fields = [];
        for (let i=0; i<NFields; i++) {
            fields[i] = this.getField();
        }
        return this.bmb.idxArrayFromFields(n, nBits, fields);
    }

}

module.exports = TranscriptBM;