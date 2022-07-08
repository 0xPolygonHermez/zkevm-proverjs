const { log2 } = require("./utils");

class BatchMachineBuilder {

    constructor() {
        this.refs = [];
        this.instructions = [];
    }

    newPolynomialReference(elementType, N) {
        const id = this.refs.length;
        this.refs[id] = {
            type: "pol",
            N: N,
            elementType: elementType,
            id: id,
        };
        return id;
    }

    newTreeGroupMultipol(nGroups, groupSize, nPols) {
        const id = this.refs.length;
        this.refs[id] = {
            type: "treeGroupMultipol",
            nGroups: nGroups,
            groupSize: groupSize,
            nPols: nPols,
            id: id
        };
        return id;
    }

    reference(idRef) {
        return Object.assign( {$Ref: true}, this.refs[idRef]);
    }



    treeGroupMultipol_extractPol(tree, polIdx) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroupMultipol")) throw new Error("treeGroupMultipol_extractPol of not a tree");
        if ((polIdx <0)||(polIdx>=refTree.nPols)) throw new Error("PolId out of range");
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "pol",
            N: refTree.nGroups*refTree.groupSize,
            elementType: "field",
            id: resId
        };
        this.instructions.push({
            op: "treeGroupMultipol_extractPol",
            result: resId,
            tree: tree,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            nPols: refTree.nPols,
            polIdx: polIdx
        });
        return resId;
    }


    treeGroupMultipol_merkelize(nGroups, groupSize, pols) {
        if (!Array.isArray(pols)) throw new Error("pols must be an array");
        for (let i=0; i<pols.length; i++) {
            const polRef = this.refs[pols[i]];
            if ((!polRef)||(polRef.type != "pol")) throw new Error("treeGroupMultipol_merkelize input is not a polynomial");
            if (polRef.N != nGroups*groupSize) throw new Error("treeGroupMultipol_merkelize invalid pol size");
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "treeGroupMultipol",
            nGroups: nGroups,
            groupSize: groupSize,
            nPols: pols.length,
            id: resId
        };
        this.instructions.push({
            op: "treeGroupMultipol_merkelize",
            result: resId,
            nGroups: nGroups,
            groupSize: groupSize,
            nPols: pols.length,
            pols: pols
        });
        return resId;
    }

    treeGroupMultipol_root(tree) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroupMultipol")) throw new Error("treeGroupMultipol_extractPol of not a tree");
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "treeGroupMultipol_root",
            result: resId,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            nPols: refTree.nPols,
            tree: tree,
        });
        return resId;
    }

    treeGroupMultipol_getGroupProof(tree, idx) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroupMultipol")) throw new Error("treeGroupMultipol_getGroupProof of not a tree");
        const refIdx = this.refs[idx];
        if ((!refIdx)||(refIdx.type != "int")) throw new Error("treeGroupMultipol_getGroupProof index is not int");

        const resId = this.refs.length;
        this.refs[resId] = {
            type: "treeGroupMultipol_groupProof",
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            nPols: refTree.nPols,
            id: resId
        };
        this.instructions.push({
            op: "treeGroupMultipol_getGroupProof",
            result: resId,
            tree: tree,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            nPols: refTree.nPols,
            idx: idx
        });
        return resId;
    }

    field_zero() {
        if (typeof(this.fieldZero) !== "undefined") return this.fieldZero;
        this.fieldZero = this.refs.length;
        this.refs[this.fieldZero] = {
            type: "field",
            id: this.fieldZero
        };
        this.instructions.push({
            op: "field_set",
            value: "0",
            result: this.fieldZero,
        });
        return this.fieldZero;
    }

    field_one() {
        if (typeof(this.fieldOne) !== "undefined") return this.fieldOne;
        this.fieldOne = this.refs.length;
        this.refs[this.fieldOne] = {
            type: "field",
            id: this.fieldOne
        };
        this.instructions.push({
            op: "field_set",
            value: "1",
            result: this.fieldOne,
        });
        return this.fieldOne;
    }

    field(val) {
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "field_set",
            result: resId,
            value: val,
        });
        return resId;
    }

    field_negOne() {
        if (typeof(this.fieldNegOne) !== "undefined") return this.fieldNegOne;
        this.fieldNegOne = this.field_neg(this.field_one());
        return this.fieldNegOne;
    }

    field_add(a, b) {
        return this.fieldOp("add", [a, b]);
    }

    field_sub(a, b) {
        return this.fieldOp("sub", [a, b]);
    }

    field_neg(a) {
        return this.fieldOp("neg", [a]);
    }

    field_mul(a, b) {
        return this.fieldOp("mul", [a, b]);
    }


    fieldOp(op, vals) {
        for (let i=0; i<vals.length; i++) {
            const refVal = this.refs[vals[i]];
            if ((!refVal)||(refVal.type != "field")) throw new Error(`op: ${op}, el: ${i}: invalid type`);
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "field_"+op,
            values: vals,
            result: resId,
        });
        return resId;
    }


    pol_add(a, b) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.pol_addc(b, a);
        const refB = this.refs[b];
        if ((refB)&&(refB.type == "field")) return this.pol_addc(a, b);
        return this.polOp("add", [a,b]);
    }

    pol_sub(a, b) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.pol_addc(this.pol_neg(b), a);
        const refB = this.refs[b];
        if ((refB)&&(refB.type == "field")) return this.pol_addc(a, this.field_neg(b));
        return this.polOp("sub", [a,b]);
    }

    pol_neg(a) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.field_neg(b);
        return this.polOp("neg", [a]);
    }

    pol_mul(a, b) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.pol_mulc(b, a);
        const refB = this.refs[b];
        if ((refB)&&(refB.type == "field")) return this.pol_mulc(a, b);
        return this.polOp("mul", [a,b]);
    }

    pol_grandProduct(a) {
        return this.polOp("grandProduct", [a]);
    }

    pol_batchInverse(a) {
        return this.polOp("batchInverse", [a]);
    }

    pol_rotate(a, shift) {
        return this.polOp("rotate", [a], {shift: shift});
    }

    pol_addc(a, c) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.field_add(b, a);
        return this.polOpC("addc", a, c);
    }

    pol_mulc(a, c) {
        const refA = this.refs[a];
        if ((refA)&&(refA.type == "field")) return this.field_mul(b, a);
        return this.polOpC("mulc", a, c);
    }

    pol_getEvaluation(p, idx) {
        const refP = this.refs[p];
        if ((!refP)||(refP.type != "pol")) {
            throw new Error(`pol_getEvaluation, p is not a polynomial`);
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "pol_getEvaluation",
            N: refP.N,
            p: p,
            idx: idx,
            result: resId,
        });
        return resId;

    }

    polOpC(op, a, c) {
        const refA = this.refs[a];
        if ((!refA)||(refA.type != "pol")) {
            throw new Error(`op: ${op}, a invalid type`);
        }
        const refC = this.refs[c];
        if ((!refC)||(refC.type != "field")) {
            throw new Error(`op: ${op}, c invalid type`);
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "pol",
            N: refA.N,
            elementType: "field",
            id: resId
        };
        this.instructions.push({
            op: "pol_"+op,
            N: refA.N,
            values: [a],
            constant: c,
            result: resId,
        });
        return resId;
    }    

    polOp(op, vals, extra) {
        extra = extra || {};
        let N;
        for (let i=0; i<vals.length; i++) {
            const refVal = this.refs[vals[i]];
            if ((!refVal)||(refVal.type != "pol")) {
                throw new Error(`op: ${op}, el: ${i}: invalid type`);
            }
            if (typeof N == "undefined") {
                N = refVal.N
            } else {
                if (refVal.N != N) {
                    throw new Error(`different sizes polynomial op: ${op}`);
                }
            }
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "pol",
            N: N,
            elementType: "field",
            id: resId
        };
        this.instructions.push(Object.assign({
            op: "pol_"+op,
            N: N,
            values: vals,
            result: resId,
        }, extra));
        return resId;
    }    


    pol_extend(src, extendBits) {
        const refSrc = this.refs[src];
        if ((!refSrc)||(refSrc.type != "pol")) throw new Error("extendPol of not a pol");
        const Nbits = log2(refSrc.N);
        if ((1<<Nbits) != refSrc.N) throw new Error("extendPol src must be a power of 2" );
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "pol",
            N: 1 << (Nbits + extendBits),
            elementType: "field",
            id: resId
        };
        this.instructions.push({
            op: "pol_extend",
            result: resId,
            values: [src],
            extendBits: extendBits
        });
        return resId;
    }


    idxArrayFromFields(n, nBits, fields) {
        const totalBits = n*nBits;
        const NFields = Math.floor((totalBits - 1)/253)+1;
        if (!Array.isArray(fields)) throw new Error("pols must be an array");
        if (fields.length != NFields) throw new Error("invalid number of fields");
        for (let i=0; i<fields.length; i++) {
            const fieldRef = this.refs[fields[i]];
            if ((!fieldRef)||(fieldRef.type != "field")) throw new Error("idxArrayFromFields is not a field");
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "idxArray",
            elementType: "u32",
            N: n,
            id: resId
        };
        this.instructions.push({
            op: "idxArrayFromFields",
            result: resId,
            n: n,
            nBits, nBits,
            fields: fields
        });
        return resId;
    }

    idxArray_get(idxArray, pos) {
        const refIdxArray = this.refs[idxArray];
        if ((!refIdxArray)||(refIdxArray.type != "idxArray")) throw new Error(`Invalid idxArray`);
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "int",
            id: resId
        };
        this.instructions.push({
            op: "idxArray_get",
            idxArray: idxArray,
            result: resId,
            pos: pos
        });
        return resId;
    }

    idx_addMod(idx, add, mod) {
        const refIdx = this.refs[idx];
        if ((!refIdx)||(refIdx.type != "int")) {
            throw new Error(`Invalid index`);
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "int",
            id: resId
        };
        this.instructions.push({
            op: "idx_addMod",
            result: resId,
            add: add,
            mod: mod,
            idx: idx
        });
        return resId;

    }

    calculateH1H2(f, t) {
        const fRef = this.refs[f];
        const tRef = this.refs[t];

        if ((!fRef)||(fRef.type != "pol")) throw new Error("f is not a pol");
        if ((!tRef)||(tRef.type != "pol")) throw new Error("t is not a pol");
        const N1 = Math.floor((fRef.N + tRef.N) / 2);
        const N2 = fRef.N + tRef.N - N1;
        const resH1 = this.refs.length;
        this.refs[resH1] = {
            type: "pol",
            N: N1,
            elementType: "field",
            id: resH1
        };
        const resH2 = this.refs.length;
        this.refs[resH2] = {
            type: "pol",
            N: N2,
            elementType: "field",
            id: resH2
        };
        this.instructions.push({
            op: "calculateH1H2",
            f: f,
            t: t,
            resultH1: resH1,
            resultH2: resH2,
        });
        return [resH1, resH2];
    }

    treeGroup_merkelize(nGroups, groupSize, pol) {
        const polRef = this.refs[pol];
        if ((!polRef)||(polRef.type != "pol")) throw new Error("treeGroup_merkelize pol is not a pol");
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "treeGroup",
            nGroups: nGroups,
            groupSize: groupSize,
            id: resId
        };
        this.instructions.push({
            op: "treeGroup_merkelize",
            result: resId,
            nGroups: nGroups,
            groupSize: groupSize,
            pol: pol
        });
        return resId;
    }

    treeGroup_root(tree) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroup")) throw new Error("treeGroup_root of not a tree");
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "treeGroup_root",
            result: resId,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            tree: tree,
        });
        return resId;
    }

    treeGroup_getElementProof(tree, idx) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroup")) throw new Error("treeGroup_getElementProof of not a tree");
        const refIdx = this.refs[idx];
        if ((!refIdx)||(refIdx.type != "int")) throw new Error("treeGroup_getElementProof index is not int");

        const resId = this.refs.length;
        this.refs[resId] = {
            type: "treeGroup_elementProof",
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            id: resId
        };
        this.instructions.push({
            op: "treeGroup_getElementProof",
            result: resId,
            tree: tree,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            idx: idx
        });
        return resId;
    }

    treeGroup_getGroupProof(tree, idx) {
        const refTree = this.refs[tree];
        if ((!refTree)||(refTree.type != "treeGroup")) throw new Error("treeGroup_getGroupProof of not a tree");
        const refIdx = this.refs[idx];
        if ((!refIdx)||(refIdx.type != "int")) throw new Error("treeGroup_getGroupProof index is not int");

        const resId = this.refs.length;
        this.refs[resId] = {
            type: "treeGroup_groupProof",
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            id: resId
        };
        this.instructions.push({
            op: "treeGroup_getGroupProof",
            result: resId,
            tree: tree,
            nGroups: refTree.nGroups,
            groupSize: refTree.groupSize,
            idx: idx
        });
        return resId;
    }


    friReduce(pol, specialX, reduceBits, shiftInv, w) {
        const refPol = this.refs[pol];
        if ((!refPol)||(refPol.type != "pol")) throw new Error("friReduce pol is not a pol");
        const specialXRef = this.refs[specialX];
        if ((!specialXRef)||(specialXRef.type != "field")) throw new Error("friReduce specialX is not a field");
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "pol",
            elementType: "field",
            N: refPol.N >> reduceBits,
            id: resId
        };
        this.instructions.push({
            op: "friReduce",
            result: resId,
            pol: pol,
            specialX: specialX,
            shiftInv: shiftInv,
            N: refPol.N,
            reduceBits: reduceBits,
            w: w
        });
        return resId;
    }

    hash(values) {
        if (!Array.isArray(values)) throw new Error("values must be an array");
        for (let i=0; i<values.length; i++) {
            const valRef = this.refs[values[i]];
            if ((!valRef)||(valRef.type != "field")) throw new Error("hash input is not a field");
        }
        const resId = this.refs.length;
        this.refs[resId] = {
            type: "field",
            id: resId
        };
        this.instructions.push({
            op: "hash",
            result: resId,
            values: values
        });
        return resId;
    }

    log(msg, refId) {
        const inst = {
            op: "log",
            msg: msg
        };
        if (typeof(refId) !== "undefined") {
            inst.ref= this.refs[refId];
        }
        this.instructions.push(inst);
    }

}

module.exports.BatchMachineBuilder = BatchMachineBuilder;