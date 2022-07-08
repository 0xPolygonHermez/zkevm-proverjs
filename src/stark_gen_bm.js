
const assert = require("chai").assert;
const Merkle = require("./merkle");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");
const TranscriptBM = require("./transcript_bm.js");
const { log2 } = require("./utils");
const ExpressionOps = require("./expressionops");
const defaultStarkStruct = require("./starkstruct");
const FRIBM = require("./fri_bm.js");
const {getPolsDef, getPolsDefConst} = require("./pilutils.js");
const BatchMachineBuilder = require("./batchmachine_builder.js").BatchMachineBuilder;

module.exports = function starkGenBM(F,  pil, config) {

    const bmb = new BatchMachineBuilder();
    bmb.log("Start...");
    const polsDef = getPolsDef(pil);
    const polsDefConst = getPolsDefConst(pil);


    const N = config.N || 2**23;
    const extendBits = config.extendBits || 1;
    const Nbits = log2(N);
    assert(1 << Nbits == N, "N must be a power of 2"); 
    const starkStruct = config.starkStruct || defaultStarkStruct;

    const E = new ExpressionOps();

    const groupSize = 1 << (Nbits+extendBits - starkStruct.steps[0].nBits);
    const nGroups = 1 << starkStruct.steps[0].nBits;

    const fri = new FRIBM(F, bmb, starkStruct );

    const pols = {
        cm: [],
        exps:[],
        q: [],
        const: [],
        publics: []
    };

    // Build ZHInv

    for (let i=0; i<pil.nCommitments; i++) pols.cm[i] = {};
    for (let i=0; i<pil.expressions.length; i++) pols.exps[i] = {};
    for (let i=0; i<pil.nQ; i++) pols.q[i] = {};
    for (let i=0; i<pil.nConstants; i++) pols.const[i] = {};

// 1.- Prepare constant polyomials and commited polynomials. 

    for (let i=0; i<polsDefConst.length; i++) {
        pols.const[i].v_n = bmb.newPolynomialReference("field", N)
    }

    const constTree = bmb.newTreeGroupMultipol(nGroups, groupSize, pil.nConstants);

    for (let i=0; i<polsDef.length; i++) {
        pols.cm[i].v_n = bmb.newPolynomialReference("field", N)
    }


    const nConsts = polsDefConst.length + 1;
    const nInputs = polsDef.length;

    for (let i=0; i<polsDefConst.length; i++) {
        pols.const[i].v_2ns = bmb.treeGroupMultipol_extractPol(constTree, i);
    }

    for (let i=0; i<pil.expressions.length; i++) {
        replaceConstants(pil.expressions[i]);
    }

    for (let i=0; i<pil.publics.length; i++) {
        if (pil.publics[i].polType == "cmP") {
            pols.publics[i] = bmb.pol_getEvaluation(pols.cm[pil.publics[i].polId].v_n, pil.publics[i].idx);
        } else if (pil.polType == "exp") {
            calculateExpression(pil.publics[i].polId, "v_n");
            pols.publics[i] = bmb.pol_getEvaluation(pols.exps[pil.publics[i].polId].v_n, pil.publics[i].idx);
        } else {
            throw new Error(`Invalid public type: ${polType.type}`);
        }
    }

    const transcript = new TranscriptBM(bmb);

// This will calculate all the Q polynomials and extend commits
    prepareCommitsAndQs();

    const tree1 = bmb.treeGroupMultipol_merkelize(nGroups, groupSize, [ 
        ...pols.cm.map( p => p.v_2ns ), 
        ...pols.q.map( p => p.v_2ns ), 
    ]);

    const root1 = bmb.treeGroupMultipol_root(tree1);

    let nCmSent = pols.cm.length;
    let nQSent = pols.q.length;

    transcript.put(root1);


// 2.- Caluculate plookups h1 and h2
    const u = transcript.getField();
    const defVal = transcript.getField();


    puCtx = [];
    for (let i=0; i<pil.plookupIdentities.length; i++) {
        let uu;
        const ctx = {};
        const pi = pil.plookupIdentities[i];

        let tExp = null;
        uu = bmb.field_one();
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
            uu = bmb.field_mul(uu, u);
        }
        if (pi.selT !== null) {
            tExp = E.addc(tExp, bmb.field_neg(defVal));
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
        uu = bmb.field_one();
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
            uu = bmb.field_mul(uu, u);
        }
        if (pi.selF !== null) {
            fExp = E.add(fExp, E.neg(E.exp(ctx.tExpId)));
            fExp = E.mul(
                fExp, 
                {
                    op: "exp",
                    id: pi.selF,
                    next: false
                }
            );
            fExp = E.add(fExp, E.exp(ctx.tExpId));
            fExp.idQ = pil.nQ;
            pols.q[fExp.idQ] = {};
            pil.nQ++;
        }

        ctx.fExpId = pil.expressions.length;
        pols.exps[ctx.fExpId] = {};
        pil.expressions.push(fExp);

        bmb.log("calculate t: "+ i);
        ctx.t = calculateExpression(ctx.tExpId, "v_n");
        bmb.log("calculate f: "+ i);
        ctx.f = calculateExpression(ctx.fExpId, "v_n");
        [ ctx.h1, ctx.h2] = bmb.calculateH1H2(ctx.f,ctx.t);
        
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
    prepareCommitsAndQs();



    const tree2 = bmb.treeGroupMultipol_merkelize(nGroups, groupSize, [ 
        ...pols.cm.slice(nCmSent).map( p => p.v_2ns ), 
        ...pols.q.slice(nQSent).map( p => p.v_2ns ), 
    ]);

    const root2 = bmb.treeGroupMultipol_root(tree2);

    nCmSent = pols.cm.length;
    nQSent = pols.q.length;
    
    transcript.put(root2);


// 3.- Compute Z polynomials
    const gamma = transcript.getField();
    const beta = transcript.getField();

    const onePbeta = bmb.field_add(beta, bmb.field_one());
    const gammaOnePbeta = bmb.field_mul(onePbeta, gamma);

    for (let i=0; i<pil.plookupIdentities.length; i++) {
        const ctx = puCtx[i];
        addPlockupIdentities(ctx);

        ctx.z = plookupCalculateZ(ctx);

        pols.cm[ctx.zId] = {
            v_n: ctx.z
        };
    }


    // This will calculate all the Q polynomials and extend commits
    prepareCommitsAndQs();



    const tree3 = bmb.treeGroupMultipol_merkelize(nGroups, groupSize, [ 
        ...pols.cm.slice(nCmSent).map( p => p.v_2ns ), 
        ...pols.q.slice(nQSent).map( p => p.v_2ns ), 
    ]);

    const root3 = bmb.treeGroupMultipol_root(tree3);

    nCmSent = pols.cm.length;
    nQSent = pols.q.length;
    
    transcript.put(root3);


// 4. Compute starkPolynomial (FRI)

    const v = transcript.getField();

    let eStark1 = null;
    let eStark2 = null;

    let vv = bmb.field_one();

    for (let i=0; i<pols.cm.length; i++) {
        if (eStark1) {
            eStark1 = E.add(eStark1, E.mulc(E.cm(i), vv));
        } else {
            eStark1 = E.mulc(E.cm(i), vv)
        }
        vv = bmb.field_mul(vv, v);
    }

    for (let i=0; i<pols.q.length; i++) {
        if (eStark1) {
            eStark1 = E.add(eStark1, E.mulc(E.q(i), vv));
        } else {
            eStark1 = E.mulc(E.q(i), vv)
        }
        vv = bmb.field_mul(vv, v);
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
        vv = bmb.field_mul(vv, v);
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


    const eStarkId = pil.expressions.length;
    pil.expressions.push(eStark);
    pols.exps[eStarkId] = {};


    const starkPol = calculateExpression(eStarkId, "v_2ns");


    const queryPol = (idx) => {
        const idx2 = bmb.idx_addMod(idx, (1<<extendBits), nGroups);
        return [
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree1, idx)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree2, idx)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree3, idx)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(constTree, idx)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree1, idx2)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree2, idx2)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(tree3, idx2)),
            bmb.reference( bmb.treeGroupMultipol_getGroupProof(constTree, idx2))
        ];
    }

    const friProof = fri.prove(transcript, starkPol, queryPol);

    const publics = {};
    for (let i=0; i<pil.publics.length; i++) {
        publics[pil.publics[i].name] = bmb.reference(pols.publics[i]);
    }

    return {
        nInputs: nInputs,
        nConsts: nConsts,
        refs: bmb.refs,
        program: bmb.instructions,
        output: {
            proof: [
                bmb.reference(root1),
                bmb.reference(root2),
                bmb.reference(root3),
                friProof
            ],
            publics: publics
        }
    };
    
    function prepareCommitsAndQs() {
        for (let i=0; i<pil.nCommitments; i++) {
            if (typeof(pols.cm[i].v_2ns) == "undefined") {
                pols.cm[i].v_2ns = bmb.pol_extend(pols.cm[i].v_n, extendBits);
            }
        }

        for (let i=0; i<pil.expressions.length; i++) {
            if (typeof pil.expressions[i].idQ != "undefined") {
                calculateExpression(i, "v_2ns");
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

        const c1 = E.mul(l1,  E.addc(z,  bmb.field_negOne()));
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
                    gammaOnePbeta
                )
            ),
            onePbeta
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
                gammaOnePbeta
            ),
            E.addc(
                E.add(
                    h2,
                    E.mulc(
                        h1p,
                        beta
                    )
                ),
                gammaOnePbeta
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

    function plookupCalculateZ(ctx) {

        calculateExpression(ctx.numId, "v_n");
        calculateExpression(ctx.denId, "v_n");

        const denI = bmb.pol_batchInverse(pols.exps[ctx.denId].v_n);
        const numDen = bmb.pol_mul(pols.exps[ctx.numId].v_n, denI);

        return bmb.pol_grandProduct(numDen);
    }

    /*
    This function computes the quotien polynomial of a degree 2n expression

    deg(p(x)) < 2n
    deg(r(x)) < n
    deg(q(x)) < n

    p(x) = q(x)*Zh(x) + r(x)

    */

    function eval(exp, subPol) {
        const vals = [];
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                vals[i] = eval(exp.values[i], subPol);
            }
        }
        if (exp.op == "add") {
            return bmb.pol_add(vals[0], vals[1]);
        } else if (exp.op == "sub") {
            return bmb.pol_sub(vals[0], vals[1]);
        } else if (exp.op == "mul") {
            return bmb.pol_mul(vals[0], vals[1]);
        } else if (exp.op == "addc") {
            return bmb.pol_addc(vals[0], exp.const);
        } else if (exp.op == "mulc") {
            return bmb.pol_mulc(vals[0], exp.const);
        } else if (exp.op == "neg") {
            return bmb.pol_neg(vals[0]);
        } else if (exp.op == "cm") {
            let r = pols.cm[exp.id][subPol];
            if (exp.next) r = bmb.pol_rotate(r, subPol == "v_2ns" ? (1<<extendBits) : 1);
            return r;
        } else if (exp.op == "const") {
            let r = pols.const[exp.id][subPol];
            if (exp.next) r = bmb.pol_rotate(r, subPol == "v_2ns" ? (1<<extendBits) : 1);
            return r;
        } else if (exp.op == "exp") {
            let r = pols.exps[exp.id][subPol];
            if (exp.next) r = bmb.pol_rotate(r, subPol == "v_2ns" ? (1<<extendBits) : 1);
            return r;
        } else if (exp.op == "q") {
            let r = pols.q[exp.id][subPol];
            if (exp.next) r = bmb.pol_rotate(r, subPol == "v_2ns" ? (1<<extendBits) : 1);
            return r;
        } else if (exp.op == "public") {
            return pols.publics[exp.id];
        } else {
            throw new Error(`Invalid op: ${exp.op}`);
        }
    }

    function calculateExpression(expId, subPol) {
        console.log("calculateExpression: "+ expId);

        if (pols.exps[expId][subPol]) return pols.exps[expId][subPol];

        if (subPol == "v_2ns") {
            if (typeof pil.expressions[expId].idQ !== "undefined") {
                calculateExpression(expId, "v_n");
            }
        } else if (subPol == "v_n")  {

        } else {
            throw new Error("Ivalid subpol v_2ns or v_n");
        }

        calculateDependencies(pil.expressions[expId], subPol);

        const p = eval(pil.expressions[expId], subPol);

        if (subPol == "v_2ns") {
            if (typeof pil.expressions[expId].idQ !== "undefined") {
                const r = bmb.pol_extend(pols.exps[expId].v_n, extendBits);
                const q = bmb.pol_mul(bmb.pol_sub(p, r), pols.const[1].v_2ns);
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

    function calculateDependencies(exp, subPol) {
        if (exp.op == "exp") {
            calculateExpression(exp.id, subPol);
        }
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                calculateDependencies(exp.values[i], subPol);
            }
        }
    }


    function replaceConstants(exp) {
        if ((exp.op == "mulc") || (exp.op == "addc")) {
            exp.const = bmb.field(exp.const);
        }
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                replaceConstants(exp.values[i]);
            }
        }
    }
}

