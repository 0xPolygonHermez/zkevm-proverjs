
const assert = require("chai").assert;
const Merkle = require("./merkle");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");
const Transcript = require("./transcript");
const { extendPol, buildZhInv, calculateH1H2 } = require("./polutils");
const { log2 } = require("./utils");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const ExpressionOps = require("./expressionops");
const defaultStarkStruct = require("./starkstruct");
const FRI = require("../src/fri.js");

module.exports = async function starkGen(cmPols, constPols, constTree, pil, config) {
    let eStarkId;
    let debugId;
    const N = config.N || 2**23;
    const extendBits = config.extendBits || 1;
    const Nbits = log2(N);
    assert(1 << Nbits == N, "N must be a power of 2"); 
    const starkStruct = config.starkStruct || defaultStarkStruct;

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const E = new ExpressionOps();

    const M = new Merkle(16, poseidon, poseidon.F);

    const groupSize = 1 << (Nbits+extendBits - starkStruct.steps[0].nBits);
    const nGroups = 1 << starkStruct.steps[0].nBits;
    const MGPC = new MerkleGroupMultipol(M, nGroups, groupSize, pil.nConstants);

    const fri = new FRI(F, poseidon, 16, starkStruct );

    const transcript = new Transcript(poseidon, poseidon.F);

    if (cmPols.length != pil.nCommitments) {
        throw new Error(`Number of Commited Polynomials: ${cmPols.length} do not match with the pil definition: ${pil.nCommitments} `)
    };

    const pols = {
        cm: [],
        exps:[],
        q: [],
        const: [],
        publics: []
    };

    // Build ZHInv

    const zhInv = buildZhInv(F, Nbits, extendBits);

    for (let i=0; i<pil.nCommitments; i++) pols.cm[i] = {};
    for (let i=0; i<pil.expressions.length; i++) pols.exps[i] = {};
    for (let i=0; i<pil.nQ; i++) pols.q[i] = {};
    for (let i=0; i<pil.nConstants; i++) pols.const[i] = {};

// 1.- Prepare commited polynomials. 
    for (let i=0; i<cmPols.length; i++) {
        console.log(`Preparing polynomial ${i}`);
        if (cmPols[i].length!= N) {
            throw new Error(`Polynomial ${i} does not have the right size: ${cmPols[i].length} and should be ${N}`);
        }
        pols.cm[i].v_n = [];
        for (let j=0; j<N; j++) pols.cm[i].v_n[j] = F.e(cmPols[i][j]);
    }

    for (let i=0; i<constPols.length; i++) {
        console.log(`Preparing constant polynomial ${i}`);
        if (constPols[i].length!= N) {
            throw new Error(`Constant Polynomial ${i} does not have the right size: ${constPols[i].length} and should be ${N}`);
        }
        pols.const[i].v_2ns = [];
        for (let j=0; j<(N<<extendBits); j++) pols.const[i].v_2ns[j] = MGPC.getElement(constTree, i, j);
        pols.const[i].v_n = [];
        for (let j=0; j<N; j++) pols.const[i].v_n[j] = F.e(constPols[i][j]);
    }

    for (let i=0; i<pil.publics.length; i++) {
        if (pil.publics[i].polType == "cmP") {
            pols.publics[i] = pols.cm[pil.publics[i].polId].v_n[pil.publics[i].idx];
        } else if (pil.polType == "exp") {
            calculateExpression(pil.publics[i].polId, "v_n");
            pols.publics[i] = pols.exps[pil.publics[i].polId].v_n[pil.publics[i].idx];
        } else {
            throw new Error(`Invalid public type: ${polType.type}`);
        }
    }

// This will calculate all the Q polynomials and extend commits
    await prepareCommitsAndQs(F, pil, pols, extendBits);

    console.log("Merkelizing 1....");

    const MGP1 = new MerkleGroupMultipol(M, nGroups, groupSize, pols.cm.length + pols.q.length);
    const tree1 = MGP1.merkelize([ 
        ...pols.cm.map( p => p.v_2ns ), 
        ...pols.q.map( p => p.v_2ns ), 
    ]);

    let nCmSent = pols.cm.length;
    let nQSent = pols.q.length;

    transcript.put(MGP1.root(tree1));


// 2.- Caluculate plookups h1 and h2
    const u = transcript.getField();
    const defVal = transcript.getField();


    puCtx = [];
    for (let i=0; i<pil.plookupIdentities.length; i++) {
        let uu;
        const ctx = {};
        const pi = pil.plookupIdentities[i];

        let tExp = null;
        uu = F.one;
        for (let j=0; j<pi.t.length; j++) {
            const e = {
                op: "exp",
                id: pi.t[j],
                next: false
            };
            if (tExp) {
                tExp = E.add(tExp, E.mulc(e, uu));
            } else {
                tExp = e;
            }
            uu = F.mul(uu, u);
        }
        if (pi.selT !== null) {
            tExp = E.addc(tExp, F.neg(defVal));
            tExp = E.mul(
                tExp, 
                {
                    op: "exp",
                    id: pi.selT,
                    next: false
                }
            );
            tExp = E.addc(tExp, defVal);

            tExp.idQ = pil.nQ;
            pols.q[tExp.idQ] = {};
            pil.nQ++;
        }

        ctx.tExpId = pil.expressions.length;
        pols.exps[ctx.tExpId] = {};
        pil.expressions.push(tExp);




        fExp = null;
        uu = F.one;
        for (let j=0; j<pi.f.length; j++) {
            const e = {
                op: "exp",
                id: pi.f[j],
                next: false
            };
            if (fExp) {
                fExp = E.add(fExp, E.mulc(e, uu));
            } else {
                fExp = e;
            }
            uu = F.mul(uu, u);
        }
        if (pi.selF !== null) {
            fExp = E.sub(
                fExp, 
                {
                    op: "exp",
                    id: ctx.tExpId,
                    next: false
                }
            );
            fExp = E.mul(
                fExp, 
                {
                    op: "exp",
                    id: pi.selF,
                    next: false
                }
            );
            fExp = E.add(
                fExp, 
                {
                    op: "exp",
                    id: ctx.tExpId,
                    next: false
                }
            );
            fExp.idQ = pil.nQ;
            pols.q[fExp.idQ] = {};
            pil.nQ++;
        }

        ctx.fExpId = pil.expressions.length;
        pols.exps[ctx.fExpId] = {};
        pil.expressions.push(fExp);

        ctx.t = await calculateExpression(ctx.tExpId, "v_n");
        ctx.f = await calculateExpression(ctx.fExpId, "v_n");
        [ ctx.h1, ctx.h2] = calculateH1H2(F, ctx.f,ctx.t);
        
        ctx.h1Id = pil.nCommitments;
        pil.nCommitments ++;
        pols.cm[ctx.h1Id] = {
            v_n: ctx.h1
        };

        ctx.h2Id = pil.nCommitments;
        pil.nCommitments ++;
        pols.cm[ctx.h2Id] = {
            v_n: ctx.h2
        };

        puCtx.push(ctx);
    }

    // This will calculate all the Q polynomials and extend commits
    await prepareCommitsAndQs(F, pil, pols, extendBits);



    console.log("Merkelizing 2....");

    const MGP2 = new MerkleGroupMultipol(M, nGroups, groupSize, pols.cm.length + pols.q.length - nCmSent - nQSent);
    const tree2 = MGP2.merkelize([
        ...pols.cm.slice(nCmSent).map( p => p.v_2ns ), 
        ...pols.q.slice(nQSent).map( p => p.v_2ns ), 
    ]);
    nCmSent = pols.cm.length;
    nQSent = pols.q.length;
    
    transcript.put(MGP2.root(tree2));


// 3.- Compute Z polynomials
    const gamma = transcript.getField();
    const beta = transcript.getField();

    console.log("gamma: "+ F.toString(gamma));
    console.log("beta: "+ F.toString(beta));

    for (let i=0; i<pil.plookupIdentities.length; i++) {
        const ctx = puCtx[i];
        addPlockupIdentities(ctx);

        

        ctx.z = await plookupCalculateZ(F, pil, pols, ctx);

        pols.cm[ctx.zId] = {
            v_n: ctx.z
        };
    }


    // This will calculate all the Q polynomials and extend commits
    await prepareCommitsAndQs(F, pil, pols, extendBits);



    console.log("Merkelizing 3....");

    for (let i=nCmSent; i<pols.cm.length; i++) {
        console.log("cm :" + i + "[3].v_n="+F.toString(pols.cm[i].v_n[3]));
        console.log("cm :" + i + "[3].v_2ns="+F.toString(pols.cm[i].v_2ns[3]));
    }
    for (let i=nQSent; i<pols.q.length; i++) {
        console.log("q :" + i + "[3].v_2ns="+F.toString(pols.q[i].v_2ns[3]));
    }

    const MGP3 = new MerkleGroupMultipol(M, nGroups, groupSize, pols.cm.length + pols.q.length - nCmSent - nQSent);
    const tree3 = MGP3.merkelize([
        ...pols.cm.slice(nCmSent).map( p => p.v_2ns ), 
        ...pols.q.slice(nQSent).map( p => p.v_2ns ), 
    ]);
    nCmSent = pols.cm.length;
    nQSent = pols.q.length;

    transcript.put(MGP3.root(tree3));



// 4. Compute starkPolynomial (FRI)

    const v = transcript.getField();

    let eStark1 = null;
    let eStark2 = null;

    let vv = F.one;

    for (let i=0; i<pols.cm.length; i++) {
        if (eStark1) {
            eStark1 = E.add(eStark1, E.mulc(E.cm(i), vv));
        } else {
            eStark1 = E.mulc(E.cm(i), vv)
        }
        vv = F.mul(vv, v);
    }

    for (let i=0; i<pols.q.length; i++) {
        if (eStark1) {
            eStark1 = E.add(eStark1, E.mulc(E.q(i), vv));
        } else {
            eStark1 = E.mulc(E.q(i), vv)
        }
        vv = F.mul(vv, v);
    }

    for (let i=0; i<pil.polIdentities.length; i++) {
        if (pil.expressions[ pil.polIdentities[i]].deg == 2) {
            if (eStark2) {
                eStark2 = E.add(eStark2, E.mulc(E.exp(pil.polIdentities[i]), vv));
            } else {
                eStark2 = E.mulc(E.exp(pil.polIdentities[i]), vv)
            }
        } else {
            if (eStark1) {
                eStark1 = E.add(eStark1, E.mulc(E.exp(pil.polIdentities[i]), vv));
            } else {
                eStark1 = E.mulc(E.exp(pil.polIdentities[i]), vv)
            }
        }
        vv = F.mul(vv, v);
    }

    if (eStark2) {
        eStark2 = E.mul(eStark2, E.const(1))
    }

    if ((eStark1)&&(eStark2)) {
        eStark = E.add(eStark1, eStark2);
    } else if (eStark1) {
        eStark = eStark1;
    } else if (eStark2) {
        eStark = eStark2;
    } else{
        throw new Error( "Stark polynomial cannot be null");
    }


    eStarkId = pil.expressions.length;
    pil.expressions.push(eStark);
    pols.exps[eStarkId] = {};


    const starkPol = await calculateExpression(eStarkId, "v_2ns");

    // TODO This is a checking code. Remove it for production
    for (let i=0; i<pil.polIdentities.length; i++) {
        await calculateExpression(pil.polIdentities[i], "v_n");
        for (let j=0; j<N; j++) {
            if (!F.isZero(pols.exps[pil.polIdentities[i]].v_n[j])) {
                throw new Error(`Identity does not match: ${i} in step: ${j}`);
            }
        }
    }

    const starkPol_c = await F.ifft(starkPol);
    for (let j=N; j<(N << extendBits); j++) {
        if (!F.isZero(starkPol_c[j])) {
            throw new Error("stark polynomial is not of the correct degree");
        }
    }

    /// END OF CHECKING CODE

    console.log("u: ", F.toString(u));
    console.log("defVal: ", F.toString(defVal));
    console.log("beta: ", F.toString(beta));
    console.log("gamma: ", F.toString(gamma));
    console.log("v: ", F.toString(v));

    const queryPol = (idx) => {
        console.log("idx: ", idx);
        console.log(F.toString(starkPol[idx]))
        console.log(F.toString(starkPol[(idx + nGroups) % (N<<extendBits) ]))
        console.log(F.toString(starkPol[(idx + 2*nGroups) % (N<<extendBits) ]))
        return [
            MGP1.getGroupProof(tree1, idx),
            MGP2.getGroupProof(tree2, idx),
            MGP3.getGroupProof(tree3, idx),
            MGPC.getGroupProof(constTree, idx),
            MGP1.getGroupProof(tree1, (idx + (1<<extendBits))%nGroups ),
            MGP2.getGroupProof(tree2, (idx + (1<<extendBits))%nGroups ),
            MGP3.getGroupProof(tree3, (idx + (1<<extendBits))%nGroups ),
            MGPC.getGroupProof(constTree, (idx + (1<<extendBits))%nGroups)
        ];
    }

    const friProof = await fri.prove(transcript, starkPol, queryPol);
    const publics = {};
    for (let i=0; i<pil.publics.length; i++) {
        publics[pil.publics[i].name] = pols.publics[i];
    }

    return {
        proof: [
            MGP1.root(tree1),
            MGP2.root(tree2),
            MGP3.root(tree3),
            friProof
        ],
        publics: publics
    }
    
    async function prepareCommitsAndQs(F, pil, pols, extendBits) {
        for (let i=0; i<pil.nCommitments; i++) {
            if (!pols.cm[i].v_2ns) {
                console.log(`Extending polynomial ${i}`);
                pols.cm[i].v_2ns = await extendPol(F, pols.cm[i].v_n, extendBits);
            }
        }

        for (let i=0; i<pil.expressions.length; i++) {
            if (typeof pil.expressions[i].idQ != "undefined") {
                await calculateExpression(i, "v_2ns");
                console.log(`Calculating q ${i}`);
            }
        }
    }

    function addPlockupIdentities(ctx) {
        ctx.zId = pil.nCommitments;
        pil.nCommitments ++;

        const h1 = {
            op: "cm",
            id: ctx.h1Id,
            next: false
        };
        const h2 = {
            op: "cm",
            id: ctx.h2Id,
            next: false
        };
        const h1p = {
            op: "cm",
            id: ctx.h1Id,
            next: true
        };
        const f = {
            op: "exp",
            id: ctx.fExpId,
            next: false
        };
        const t = {
            op: "exp",
            id: ctx.tExpId,
            next: false
        };
        const tp = {
            op: "exp",
            id: ctx.tExpId,
            next: true
        };
        const z = {
            op: "cm",
            id: ctx.zId,
            next: false
        };
        const zp = {
            op: "cm",
            id: ctx.zId,
            next: true
        };

        const l1 = {
            op: "const",
            id: pil.references["GLOBAL.L1"].id,
            next: false
        }

        const c1 = E.mul(l1,  E.addc(z, F.neg(F.one)));
        c1.deg=2;
        ctx.c1Id = pil.expressions.length;
        pil.expressions.push(c1);
        pil.polIdentities.push(ctx.c1Id);
        pols.exps[ctx.c1Id] = {};

        const numExp = E.mulc(
            E.mul(
                E.addc(f, gamma),
                E.addc(
                    E.add(
                        t,
                        E.mulc(
                            tp,
                            beta
                        )
                    ),
                    F.mul(gamma,F.add(F.one, beta))
                )
            ),
            F.add(F.one, beta)
        );
        numExp.idQ = pil.nQ;
        pols.q[numExp.idQ] = {};
        pil.nQ++;

        ctx.numId = pil.expressions.length;
        pil.expressions.push(numExp);
        pols.exps[ctx.numId] = {};

        const denExp = E.mul(
            E.addc(
                E.add(
                    h1,
                    E.mulc(
                        h2,
                        beta
                    )
                ),
                F.mul(gamma,F.add(F.one, beta))
            ),
            E.addc(
                E.add(
                    h2,
                    E.mulc(
                        h1p,
                        beta
                    )
                ),
                F.mul(gamma,F.add(F.one, beta))
            )
        );
        denExp.idQ = pil.nQ;
        pols.q[denExp.idQ] = {};
        pil.nQ++;

        ctx.denId = pil.expressions.length;
        pil.expressions.push(denExp);
        pols.exps[ctx.denId] = {};

        const num = {
            op: "exp",
            id: ctx.numId,
            next: false
        }
        const den = {
            op: "exp",
            id: ctx.denId,
            next: false
        }

        const c2 = E.sub(  E.mul(zp, den), E.mul(z, num)  );
        c2.deg=2;
        ctx.c2Id = pil.expressions.length;
        pil.expressions.push(c2);
        pols.exps[ctx.c2Id] = {};
        pil.polIdentities.push(ctx.c2Id);

    }



    async function plookupCalculateZ(F, pil, pols, ctx) {

        await calculateExpression(ctx.numId, "v_n");
        await calculateExpression(ctx.denId, "v_n");

        const denI = await F.batchInverse(pols.exps[ctx.denId].v_n);

        const z = new Array(denI.length);
        z[0] = F.one;

        for (let i= 1; i<denI.length; i++ ) {
            z[i] = F.mul(
                z[i-1], 
                F.mul(
                    pols.exps[ctx.numId].v_n[i-1], 
                    denI[i-1]
                )
            )
        }

        return z;
    }

    /*
    This function computes the quotien polynomial of a degree 2n expression

    deg(p(x)) < 2n
    deg(r(x)) < n
    deg(q(x)) < n

    p(x) = q(x)*Zh(x) + r(x)

    */

    function eval(exp, subPol) {
        let a = [];
        let b = [];
        let c;
        let r = [];
        if (exp.op == "add") {
            a = eval(exp.values[0], subPol);
            b = eval(exp.values[1], subPol);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.add(a[i], b[i]);
        } else if (exp.op == "sub") {
            a = eval(exp.values[0], subPol);
            b = eval(exp.values[1], subPol);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.sub(a[i], b[i]);
        } else if (exp.op == "mul") {
            a = eval(exp.values[0], subPol);
            b = eval(exp.values[1], subPol);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.mul(a[i], b[i]);
        } else if (exp.op == "addc") {
            a = eval(exp.values[0], subPol);
            c = F.e(exp.const);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.add(a[i], c);
        } else if (exp.op == "mulc") {
            a = eval(exp.values[0], subPol);
            c = F.e(exp.const);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.mul(a[i], c);
        } else if (exp.op == "neg") {
            a = eval(exp.values[0], subPol);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.neg(a[i]);
        } else if (exp.op == "cm") {
            r = pols.cm[exp.id][subPol];
            if (exp.next) r = getPrime(r, subPol);
        } else if (exp.op == "const") {
            r = pols.const[exp.id][subPol];
            if (exp.next) r = getPrime(r, subPol);
        } else if (exp.op == "exp") {
            r = pols.exps[exp.id][subPol];
            if (exp.next) r = getPrime(r, subPol);
        } else if (exp.op == "q") {
            r = pols.q[exp.id][subPol];
            if (exp.next) r = getPrime(r, subPol);
        } else if (exp.op == "number") {
            N = pols.const[0][subPol].length;
            v = F.e(exp.value);
            r = new Array(N);
            for (let i=0; i<N; i++) r[i] = v;
        } else if (exp.op == "public") {
            r = new Array(N);
            for (let i=0; i<N; i++) r[i] = pols.publics[exp.id];
        } else {
            throw new Error(`Invalid op: ${exp.op}`);
        }
        if (typeof(debugId) !== "undefined") debug(exp.op, r[debugId], a[debugId], b[debugId], c);

        return r;
    }

    function debug(op, r, a, b, c) {
        console.log(`${op} r: ${n2s(r)}, a: ${n2s(a)}, b: ${n2s(b)}, c: ${n2s(c)}`);
        function n2s(n) {
            if (typeof n === "undefined") return "";
            const S = F.toString(n);
            return S.slice(0,4) + ".." + S.slice(-4);
        }
    }

    function getPrime(p, subPol) {
        if (subPol == "v_n") {
            const r = p.slice(1);
            r[p.length-1] = p[0];
            return r;
        } else if (subPol == "v_2ns") {
            const r = p.slice(1<<extendBits);
            for (let i=0; i<(1<<extendBits); i++) {
                r[p.length - (1<<extendBits) + i] = p[i];
            }
            return r;
        } else {
            throw new Error(`Invalid subpol: ${subPol}`);
        }
    }


    async function calculateExpression(expId, subPol) {
        console.log("calculateExpression: "+ expId);

        if (pols.exps[expId][subPol]) return pols.exps[expId][subPol];

        if (subPol == "v_2ns") {
            if (typeof pil.expressions[expId].idQ !== "undefined") {
                await calculateExpression(expId, "v_n");
            }
        } else if (subPol == "v_n")  {

        } else {
            throw new Error("Ivalid subpol v_2ns or v_n");
        }

        await calculateDependencies(pil.expressions[expId], subPol);

        if ((subPol == "v_2ns")&&(typeof(eStarkId)!=="undefined")&&(expId ==eStarkId)) debugId = 31242;
        const p = eval(pil.expressions[expId], subPol);

        if (subPol == "v_2ns") {
            if (typeof pil.expressions[expId].idQ !== "undefined") {
                const r = await extendPol(F, pols.exps[expId].v_n, extendBits);
                const q = new Array(p.length);
                for (let i=0; i<p.length; i++) {
                    q[i] = F.mul(F.sub(p[i], r[i]), zhInv(i))
                }
                pols.exps[expId].v_2ns = r;
                pols.q[pil.expressions[expId].idQ].v_2ns = q;
            } else {
                pols.exps[expId].v_2ns = p;
            }
            return pols.exps[expId].v_2ns;
        } else if (subPol == "v_n")  {
            pols.exps[expId].v_n = p;
            return pols.exps[expId].v_n;
        }
    }

    async function calculateDependencies(exp, subPol) {
        if (exp.op == "exp") {
            await calculateExpression(exp.id, subPol);
        }
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                await calculateDependencies(exp.values[i], subPol);
            }
        }
    }


}

