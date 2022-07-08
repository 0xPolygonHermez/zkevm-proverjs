const ExpressionOps = require("./expressionops");

module.exports.genCalculator = function genCalculator(F, pil) {

    const E = new ExpressionOps();

    const pols = {
        cm: [],
        q: [],
        exps: [],
        expsp: []
    }
    let nIm = 0;

    // 1 Phase
    let nTree1 = 0;
    let nTree2 = 0;
    let nTree3 = 0;
    for (let i=0; i<pil.nCommitments; i++) {
        pols.cm[i] = { type: "tree1", id: nTree1++}
    }

    for (let i=0; i<pil.nQ; i++) {
        pols.q[i] = { type: "tree1", id: nTree1++}
    }

    let nCmSent = pil.nCommitments;
    let nQSent = pil.nQ;

    // 2. Commit hs
    puCtx = [];
    for (let i=0; i<pil.plookupIdentities.length; i++) {
        const ctx = {};
        const pi = pil.plookupIdentities[i];
        if (pi.f.length != pi.t.length) throw new Error ("Different sizes plokup");
        let fExp = null;
        let tExp = null;
        const uu = {state: "initial"};
        for (let j=0; j<pi.f.length; j++) {
            incState(uu, "u")
            fExp = catExp(fExp, E.exp( pi.f[j]), uu, "u");
            tExp = catExp(tExp, E.exp( pi.t[j]), uu, "u");
        }
        if (pi.selT !== null) {
            tExp = E.sub(tExp, E.challange("defVal"));
            tExp = E.mul(tExp, E.exp(pi.selT));
            tExp = E.add(tExp, E.challange("defVal"));
            tExp.idQ = pil.nQ;
            pil.nQ++;
        }
        tExp.deg = 1;
        ctx.tExpId = addExp(tExp);

        if (pi.selF !== null) {
            fExp = E.sub(fExp, E.exp(ctx.tExpId));
            fExp = E.mul(fExp, E.exp(pi.selF));
            fExp = E.add(fExp, E.exp(ctx.tExpId));
            fExp.idQ = pil.nQ;
            pil.nQ++;
        }
        fExp.deg = 1;
        ctx.fExpId = addExp(fExp);

        ctx.h1Id = pil.nCommitments ++;
        ctx.h2Id = pil.nCommitments ++;

        puCtx.push(ctx);
    }

    for (let i=nCmSent; i<pil.nCommitments; i++) {
        pols.cm[i] = { type: "tree2", id: nTree2++}
    }

    for (let i=nQSent; i<pil.nQ; i++) {
        pols.q[i] = { type: "tree2", id: nTree2++}
    }

    nCmSent = pil.nCommitments;
    nQSent = pil.nQ;

    // 3. Commit zs

    const onePbeta = E.exp(addExp(E.addc(E.challange("beta"), F.toString(F.one))));
    const gammaOnePbeta = E.exp(addExp(E.mul(E.challange("gamma"), onePbeta)));

    for (let i=0; i<pil.plookupIdentities.length; i++) {
        const ctx = puCtx[i];

        ctx.zId = pil.nCommitments ++;


        const h1 = E.cm(ctx.h1Id);
        const h2 = E.cm(ctx.h2Id);
        const h1p = E.cm(ctx.h1Id, true);
        const f = E.exp(ctx.fExpId);
        const t = E.exp(ctx.tExpId);
        const tp = E.exp(ctx.tExpId, true);
        const z = E.cm(ctx.zId);
        const zp = E.cm(ctx.zId, true);
        const l1 = E.const(pil.references["GLOBAL.L1"].id);

        const c1 = E.mul(l1,  E.addc(z, F.toString(F.neg(F.one))));
        c1.deg=2;
        ctx.c1Id = addExp(c1);
        pil.polIdentities.push(ctx.c1Id);

        const numExp = E.mul(
            E.mul(
                E.add(f, E.challange("gamma")),
                E.add(
                    E.add(
                        t,
                        E.mul(
                            tp,
                            E.challange("beta")
                        )
                    ),
                    gammaOnePbeta
                )
            ),
            onePbeta
        );

        numExp.idQ = pil.nQ;
        pil.nQ++;
    
        ctx.numId = addExp(numExp);

        const denExp = E.mul(
            E.add(
                E.add(
                    h1,
                    E.mul(
                        h2,
                        E.challange("beta")
                    )
                ),
                gammaOnePbeta
            ),
            E.add(
                E.add(
                    h2,
                    E.mul(
                        h1p,
                        E.challange("beta")
                    )
                ),
                gammaOnePbeta
            )
        );
        denExp.idQ = pil.nQ;
        pil.nQ++;
    
        ctx.denId = addExp(denExp);

        const num = E.exp(ctx.numId);
        const den = E.exp(ctx.denId);
    
        const c2 = E.sub(  E.mul(zp, den), E.mul(z, num)  );
        c2.deg=2;
        ctx.c2Id = addExp(c2);
        pil.polIdentities.push(ctx.c2Id);

    }


    for (let i=nCmSent; i<pil.nCommitments; i++) {
        pols.cm[i] = { type: "tree3", id: nTree3++}
    }

    for (let i=nQSent; i<pil.nQ; i++) {
        pols.q[i] = { type: "tree3", id: nTree3++}
    }

    nCmSent = pil.nCommitments;
    nQSent = pil.nQ;

    let eStark1 = null;
    let eStark2 = null;

    let vv = {state: "initial"};

    for (let i=0; i<pols.cm.length; i++) {
        incState(vv, "v")
        eStark1 = catExp(eStark1, E.cm(i), vv, "v");
    }

    for (let i=0; i<pols.q.length; i++) {
        incState(vv, "v")
        eStark1 = catExp(eStark1, E.q(i), vv, "v");
    }

    for (let i=0; i<pil.polIdentities.length; i++) {
        incState(vv, "v")
        if (pil.expressions[ pil.polIdentities[i]].deg == 2) {
            eStark2 = catExp(eStark2, E.exp(pil.polIdentities[i]), vv, "v");
        } else {
            eStark1 = catExp(eStark1, E.exp(pil.polIdentities[i]), vv, "v");
        }
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


    const eStarkId = addExp(eStark);

    const  instructions = [];
    calculateExpression(instructions, eStarkId);

    return {
        instructions: instructions,
        nIm: nIm,
        nConst: pil.nConstants,
        nTree1: nTree1,
        nTree2: nTree2,
        nTree3: nTree3,
        output: pols.exps[eStarkId]
    }


    function addExp(e) {
        const id = pil.expressions.length;
        pil.expressions.push(e);
        return id;
    }

    function incState(st, ch) {
        if (st.state == "initial") {
            st.state = "zero";
        } else if (st.state == "zero") {
            st.state = "many";
            st.lastExp = E.challange(ch);
        } else if (st.state == "many") {
            st.lastExp = E.exp(addExp(E.mul(st.lastExp, E.challange(ch))))
        } else {
            throw new Error("Invalid state");
        }
    }

    function catExp(exp1, exp2, st, ch) {
        if (st.state == "initial") {
            throw new Error("catExp with initial");
        } else if (st.state == "zero") {
            if (exp1) {
                return E.add(exp1, exp2);
            } else {
                return exp2;
            }
        } else if (st.state == "many") {
            if (exp1) {
                return E.add(exp1, E.mul(st.lastExp, exp2));
            } else {
                return E.mul(st.lastExp, exp2);
            }
        } else {
            throw new Error("Invalid state");
        }
    }

    function eval(instructions, exp, next) {
        if (exp.op == "add") {
            return op("add", 2);
        } else if (exp.op == "sub") {
            return op("sub", 2);
        } else if (exp.op == "neg") {
            return op("neg", 1);
        } else if (exp.op == "mul") {
            return op("mul", 2);
        } else if (exp.op == "addc") {
            return op("addc", 1, exp.const);
        } else if (exp.op == "mulc") {
            return op("mulc", 1, exp.const);
        } else if (exp.op == "cm") {
            const res = Object.assign({}, pols.cm[exp.id]);
            res.next = (!!exp.next) || next;
            return res;
        } else if (exp.op == "q") {
            const res = Object.assign({}, pols.q[exp.id]);
            if ((exp.next)||(exp.next)) throw new Error("q prime not suported");
            return res;
        } else if (exp.op == "const") {
            const res = {type: "const", id: exp.id}
            res.next = (!!exp.next) || next;
            return res;
        } else if (exp.op == "exp") {
            let res;
            if ((exp.next)||(next)) {
                res = Object.assign({}, pols.expsp[exp.id]);
            } else {
                res = Object.assign({}, pols.exps[exp.id]);
            }
            return res;
        } else if (exp.op == "challange") {
            return { type: "challange", name: exp.name};
        } else if (exp.op == "public") {
            return { type: "public", name: pil.publics[exp.id].name};
        }

        function op(opName, n, cst) {
            const res = {
                type: "im",
                id: nIm++
            }
            const inst = {
                op: opName,
                res: res,
                values: []
            };
            for (let i=0; i<n; i++) {
                inst.values.push(eval(instructions, exp.values[i], next));
            }
            if (typeof(cst) !== "undefined") {
                inst.const = cst;
            }
            instructions.push(inst);
            return res;
        }
    }


    function calculateExpression(instructions, idExp, next) {
        next = !!next;
        if (next) {
            if (pols.expsp[idExp]) return pols.expsp[idExp];
        } else {
            if (pols.exps[idExp]) return pols.exps[idExp];
        }
        const exp = pil.expressions[idExp];
        calculateDependencies(instructions, exp, next);

        const p = eval(instructions, exp, next);

        if (typeof exp.idQ !== "undefined") {
            const qz = {
                type: "im",
                id: nIm++
            }
            instructions.push({
                op: "mul",
                res: qz,
                values: [
                    pols.q[exp.idQ],
                    {type: "const", id: 0}
                ]
            });
            const p2 = {
                type: "im",
                id: nIm++
            }
            instructions.push({
                op: "sub",
                res: p2,
                values: [
                    p,
                    qz
                ]
            });
            if (next) {
                pols.expsp[idExp] = p2;
            } else {
                pols.exps[idExp] = p2;                
            }
        } else {
            if (next) {
                pols.expsp[idExp] = p;
            } else {
                pols.exps[idExp] = p;
            }
        }
    }

    function calculateDependencies(instructions, exp, next) {
        if (exp.op == "exp") {
            calculateExpression(instructions, exp.id, exp.next || next );
        }
        if (exp.values) {
            for (let i=0; i<exp.values.length; i++) {
                calculateDependencies(instructions, exp.values[i], next);
            }
        }
    }

}

module.exports.calculate = function calculate(F, calculator, tree1, tree2, tree3, consts, tree1p, tree2p, tree3p, constsp, challanges, publics) {

    const im = new Array(calculator.nIm);

    for (let i=0; i<calculator.instructions.length; i++) {
        inst = calculator.instructions[i];
        if (inst.op == "add") {
            const a = getV(inst.values[0]);
            const b = getV(inst.values[1]);
            const r = F.add(a,b);
            debug(i, "add",r, a, b);
            setV(inst.res, r);
        } else if (inst.op == "sub") {
            const a = getV(inst.values[0]);
            const b = getV(inst.values[1]);
            const r = F.sub(a,b);
            debug(i, "sub",r, a, b);
            setV(inst.res, r);
        } else if (inst.op == "mul") {
            const a = getV(inst.values[0]);
            const b = getV(inst.values[1]);
            const r = F.mul(a,b);
            debug(i, "mul",r, a, b);
            setV(inst.res, r);
        } else if (inst.op == "neg") {
            const a = getV(inst.values[0]);
            const r = F.neg(a);
            debug(i, "neg",r, a);
            setV(inst.res, r);
        } else if (inst.op == "addc") {
            const a = getV(inst.values[0]);
            const c = F.e(inst.const);
            const r = F.add(a,c);
            debug(i, "addc",r, a, null, c);
            setV(inst.res, r);
        } else if (inst.op == "mulc") {
            const a = getV(inst.values[0]);
            const c = F.e(inst.const);
            const r = F.mul(a,c);
            debug(i, "mulc",r, a, null, c);
            setV(inst.res, r);
        } else {
            throw new Error(`Invalid operation: ${inst.op}`);
        }

        function debug(line, op, r, a, b, c) {
            return;
            S = line + ": " + op + ": ";
            S += "\tr=" + str(r);
            S += "\ta=" + str(a);
            if (b) S += "\tb=" + str(b);
            if (c) S += "\tc=" + str(c);
            console.log(S);
        
            function str(v) {
                let s = F.toString(v);
                if (s.length>10) s = s.slice(0,4) + ".." + s.slice(-4);
                return s;
            }
        }
    
    }

    return getV(calculator.output);

    function getV(ref) {
        if (typeof ref == "undefined") {
            console.log("xx");
        }
        if (ref.type == "tree1") {
            if (ref.next) {
                return tree1p[ref.id];
            } else {
                return tree1[ref.id];
            }
        } else if (ref.type == "tree2") {
            if (ref.next) {
                return tree2p[ref.id];
            } else {
                return tree2[ref.id];
            }
        } else if (ref.type == "tree3") {
            if (ref.next) {
                return tree3p[ref.id];
            } else {
                return tree3[ref.id];
            }
        } else if (ref.type == "const") {
            if (ref.next) {
                return constsp[ref.id];
            } else {
                return consts[ref.id];
            }
        } else if (ref.type == "im") {
            if (typeof (im[ref.id]) == "undefined") {
                throw new Error("Accessing an unassigned value")
            }
            return im[ref.id];
        } else if (ref.type == "challange") {
            if (typeof (challanges[ref.name]) == "undefined") {
                throw new Error(`challange not defined: ${ref.name}`)
            }
            return challanges[ref.name];
        } else if (ref.type == "public") {
            if (typeof (publics[ref.name]) == "undefined") {
                throw new Error(`public not defined: ${ref.name}`)
            }
            return publics[ref.name];
        } else {
            throw new Error(`invalid ref type: ${ref.type}`);
        }
    }

    function setV(ref, val) {
        if (ref.type == "im") {
            if (typeof (im[ref.id]) != "undefined") {
                throw new Error("seting an already defined val")
            }
            im[ref.id] = val;
        } else {
            throw new Error(`Seting an invalid ref type: ${ref.type}`);
        }
    }
}

