const buildPoseidon = require("@polygon-hermez/zkevm-commonjs").getPoseidon;

module.exports = async function verifyPil(pil, cmPols, constPols) {

    const res = [];

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const refCm = {};
    const refConst = {};
    const refIm = {};
    for (let k of Object.keys(pil.references)) {
        const r  = pil.references[k];
        r.name = k;
        if (r.type == "cmP") {
            refCm[r.id] =r;
        } else if (r.type == "constP") {
            refConst[r.id] = r;
        } else if (r.type == "imP") {
            refIm[r.id] = r;
        } else {
            throw new Error("Reference type not handled: " + r.type);
        }
    }

    const pols = {
        cm: [],
        exps:[],
        const: [],
        publics: []
    };

    const N = cmPols[0].length;

    for (let i=0; i<pil.nCommitments; i++) pols.cm[i] = {};
    for (let i=0; i<pil.expressions.length; i++) pols.exps[i] = {};
    for (let i=0; i<pil.nConstants; i++) pols.const[i] = {};

// 1.- Prepare commited polynomials. 
    for (let i=0; i<cmPols.length; i++) {
        console.log(`Preparing polynomial ${refCm[i].name}`);
        if (cmPols[i].length!= N) {
            throw new Error(`Polynomial ${refCm[i].name} does not have the right size: ${cmPols[i].length} and should be ${N}`);
        }
        pols.cm[i].v_n = [];
        for (let j=0; j<N; j++) {
            if (typeof cmPols[i][j] === "undefined" ) {
                throw new Error(`Commited Polynomial ${refCm[i].name} has no value a to pos ${j}`);
            }
            pols.cm[i].v_n[j] = F.e(cmPols[i][j]);
        }
    }

    for (let i=0; i<constPols.length; i++) {
        console.log(`Preparing constant polynomial ${refConst[i].name}`);
        if (constPols[i].length!= N) {
            throw new Error(`Constant Polynomial ${refConst[i].name} does not have the right size: ${constPols[i].length} and should be ${N}`);
        }
        pols.const[i].v_n = [];
        for (let j=0; j<N; j++) {
            if (typeof constPols[i][j] === "undefined" ) {
                throw new Error(`Constant Polynomial ${refConst[i].name} has no value a to pos ${j}`);
            }
            pols.const[i].v_n[j] = F.e(constPols[i][j]);
        }
    }

    for (let i=0; i<pil.publics.length; i++) {
        if (pil.publics[i].polType == "cmP") {
            pols.publics[i] = pols.cm[pil.publics[i].polId].v_n[pil.publics[i].idx];
        } else if (pil.polType == "exp") {
            calculateExpression(pil.publics[i].polId);
            pols.publics[i] = pols.exps[pil.publics[i].polId].v_n[pil.publics[i].idx];
        } else {
            throw new Error(`Invalid public type: ${polType.type}`);
        }
    }

    for (let i=0; i<pil.plookupIdentities.length; i++) {
        const pi = pil.plookupIdentities[i];

        for (let j=0; j<pi.t.length; j++) {
            await calculateExpression(pi.t[j]);
        }
        if (pi.selT !== null) {
            await calculateExpression(pi.selT);
        }
        for (let j=0; j<pi.f.length; j++) {
            await calculateExpression(pi.f[j]);
        }
        if (pi.selF !== null) {
            await calculateExpression(pi.selF);
        }

        let t = {};
        for (let j=0; j<N; j++) {
            if ((pi.selT==null) || (!F.isZero(pols.exps[pi.selT].v_n[j]))) {
                const vals = []
                for (let k=0; k<pi.t.length; k++) {
                    vals.push(F.toString(pols.exps[pi.t[k]].v_n[j]));
                }
                t[vals.join(",")] = true;
            }
        }

        for (let j=0; j<N; j++) {
            if ((pi.selF==null) || (!F.isZero(pols.exps[pi.selF].v_n[j]))) {
                const vals = []
                for (let k=0; k<pi.f.length; k++) {
                    vals.push(F.toString(pols.exps[pi.f[k]].v_n[j]));
                }
                const v = vals.join(",");
                if (!t[v]) {
                    res.push(`${pil.plookupIdentities[i].fileName}:${pil.plookupIdentities[i].line}:  plookup not found w=${j} values: ${v}`);
                    j=N;  // Do not continue checking
                }
            }
        }
    }

    for (let i=0; i<pil.polIdentities.length; i++) {
        await calculateExpression(pil.polIdentities[i].e);

        for (let j=0; j<N; j++) {
            const v = pols.exps[pil.polIdentities[i].e].v_n[j]
            if (!F.isZero(v)) {
                res.push(`${pil.polIdentities[i].fileName}:${pil.polIdentities[i].line}: identity does not match w=${j} val=${F.toString(v)} `);
                j=N;
            }
        }
    }

    return res;



    function eval(exp) {
        let a = [];
        let b = [];
        let c;
        let r = [];
        if (exp.op == "add") {
            a = eval(exp.values[0]);
            b = eval(exp.values[1]);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.add(a[i], b[i]);
        } else if (exp.op == "sub") {
            a = eval(exp.values[0]);
            b = eval(exp.values[1]);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.sub(a[i], b[i]);
        } else if (exp.op == "mul") {
            a = eval(exp.values[0]);
            b = eval(exp.values[1]);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.mul(a[i], b[i]);
        } else if (exp.op == "addc") {
            a = eval(exp.values[0]);
            c = F.e(exp.const);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.add(a[i], c);
        } else if (exp.op == "mulc") {
            a = eval(exp.values[0]);
            c = F.e(exp.const);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.mul(a[i], c);
        } else if (exp.op == "neg") {
            a = eval(exp.values[0]);
            r = new Array(a.length);
            for (let i=0; i<a.length; i++) r[i] = F.neg(a[i]);
        } else if (exp.op == "cm") {
            r = pols.cm[exp.id].v_n;
            if (exp.next) r = getPrime(r);
        } else if (exp.op == "const") {
            r = pols.const[exp.id].v_n;
            if (exp.next) r = getPrime(r);
        } else if (exp.op == "exp") {
            r = pols.exps[exp.id].v_n;
            if (exp.next) r = getPrime(r);
        } else if (exp.op == "number") {
            N = pols.const[0].v_n.length;
            v = F.e(exp.value);
            r = new Array(N);
            for (let i=0; i<N; i++) r[i] = v;
        } else if (exp.op == "public") {
            r = new Array(N);
            for (let i=0; i<N; i++) r[i] = pols.publics[exp.id];
        } else {
            throw new Error(`Invalid op: ${exp.op}`);
        }

        return r;
    }


    function getPrime(p) {
        const r = p.slice(1);
        r[p.length-1] = p[0];
        return r;
    }


    async function calculateExpression(expId) {
        console.log("calculateExpression: "+ expId);
    
        if ((pols.exps[expId])&&(pols.exps[expId].v_n)) return pols.exps[expId].v_n;
    
        await calculateDependencies(pil.expressions[expId]);
    
        const p = eval(pil.expressions[expId]);
    
        pols.exps[expId].v_n = p;
        return pols.exps[expId].v_n;
    }
    
    async function calculateDependencies(exp) {
        if (exp.op == "exp") {
            await calculateExpression(exp.id);
        }
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                await calculateDependencies(exp.values[i]);
            }
        }
    }
}




