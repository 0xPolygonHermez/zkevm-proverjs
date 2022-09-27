const SMT = require("@0xpolygonhermez/zkevm-commonjs").SMT;
const Database = require("@0xpolygonhermez/zkevm-commonjs").Database;
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;
const chai = require("chai");
const assert = chai.assert;

describe("smt", async function () {
    let poseidon;
    let F;
    this.timeout(10000000);

    before(async () => {
        poseidon = await buildPoseidon();
        F = poseidon.F;
    })

    it("It should add and remove an element", async () => {
        const db = new Database(F);
        const smt = new SMT(db, 4, poseidon, poseidon.F);

        const r1 = await smt.set(F.zero, F.e(1), Scalar.e(2));

        const r2 = await smt.set(r1.newRoot, F.e(1), Scalar.e(0));

        assert(F.isZero(r2.newRoot));

    });

    it("It should update an element", async () => {
        const db = new Database(F);
        const smt = new SMT(db, 4, poseidon, poseidon.F);

        const r1 = await smt.set(F.zero, F.e(1), Scalar.e(2));

        const r2 = await smt.set(r1.newRoot, F.e(1), Scalar.e(3));

        const r3 = await smt.set(r2.newRoot, F.e(1), Scalar.e(2));

        assert(F.eq(r1.newRoot, r3.newRoot));
    });

    it("Add 128 elements", async () => {
        const N = 128;
        const db = new Database(F);
        const smt = new SMT(db, 4, poseidon, poseidon.F);

        let r = {
            newRoot: F.zero
        };

        let rr;

        for (let i=0; i<N; i++) {
            r = await smt.set(r.newRoot, F.e(i), Scalar.e(i+1000));
        }

        const r2 = await smt.set(r.newRoot, F.e(N), Scalar.e(0));

        assert(F.eq(r.newRoot, r.newRoot));

        for (let i=0; i<N; i++) {
            r = await smt.set(r.newRoot, F.e(i), Scalar.e(0));
        }

        assert(F.isZero(r.newRoot));
    });

    it("Should read random", async () => {
        const N = 64;
        const db = new Database(F);
        const smt = new SMT(db, 4, poseidon, poseidon.F);

        const vals = {};

        let r = {
            newRoot: F.zero
        };

        let rr;

        for (let i=0; i<N; i++) {
            const key = Math.floor(Math.random()*64);
            const val = Math.floor(Math.random()*2);
            vals[key] = val;
            r = await smt.set(r.newRoot, F.e(key), Scalar.e(val));
        }

        for (let i=0; i<64; i++) {
            rr = await smt.get(r.newRoot, F.e(i));
            const v = vals[i] ? vals[i] : 0;
            assert(Scalar.eq(rr.value, Scalar.e(v)));
        }

    });

    it("It should add elements with similar keys", async () => {
        const db = new Database(F);
        const smt = new SMT(db, 4, poseidon, poseidon.F);

        const expectedRoot = F.e("1599843265442829753605252683384602873429861264461222121698908135665379759788");

        const r0 = await smt.set(F.zero, F.e(0), Scalar.e(2)); // 0x00
        const r1 = await smt.set(F.zero, F.e(4369), Scalar.e(2)); // 0x1111
        const r2 = await smt.set(r1.newRoot, F.e(69905), Scalar.e(3)); // 0x11111

        assert(F.eq(expectedRoot, r2.newRoot));
    });
});
