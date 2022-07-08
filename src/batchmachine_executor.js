
const Merkle = require("./merkle");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");
const MerkleGroup = require("./merkle_group");
const { extendPol, calculateH1H2, polMulAxi, evalPol } = require("./polutils");
const { stringifyFElements } = require("ffjavascript").utils;
const buildPoseidon = require("circomlibjs").buildPoseidon;
const Scalar = require("ffjavascript").Scalar;

module.exports = async function batchMachineExecutor(mem, script) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    const M = new Merkle(16, poseidon, poseidon.F);

    for (let i=0; i<script.program.length; i++) {
        const l = script.program[i];
        console.log(i+" "+l.op);
        switch (l.op) {

            case "field_set":
                mem[l.result] = F.e(l.value);
                break;

            case "field_add":
                mem[l.result] = F.add(mem[l.values[0]], mem[l.values[1]]);
                break;

            case "field_sub":
                mem[l.result] = F.sub(mem[l.values[0]], mem[l.values[1]]);
                break;

            case "field_neg":
                mem[l.result] = F.neg(mem[l.values[0]]);
                break;

            case "field_mul":
                mem[l.result] = F.mul(mem[l.values[0]], mem[l.values[1]]);
                break;

            case "pol_add":
                {
                    const p = new Array(l.N);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.add(mem[l.values[0]][j], mem[l.values[1]][j])
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_sub":
                {
                    const p = new Array(l.N);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.sub(mem[l.values[0]][j], mem[l.values[1]][j])
                    }
                    mem[l.result] = p;
                    break;
                }
    
            case "pol_neg":
                {
                    const p = new Array(l.N);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.neg(mem[l.values[0]][j])
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_mul":
                {
                    const p = new Array(l.N);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.mul(mem[l.values[0]][j], mem[l.values[1]][j])
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_addc":
                {
                    const p = new Array(l.N);
                    const c = F.e(mem[l.constant]);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.add(mem[l.values[0]][j], c)
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_mulc":
                {
                    const p = new Array(l.N);
                    const c = F.e(mem[l.constant]);
                    for (let j=0; j<l.N; j++) {
                        p[j] = F.mul(mem[l.values[0]][j], c)
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_grandProduct":
                {
                    const p = new Array(l.N);
                    p[0] = F.one;
                    for (let j=1; j<l.N; j++) {
                        p[j] = F.mul(mem[l.values[0]][j-1], p[j-1])
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_batchInverse":
                mem[l.result] = await F.batchInverse(mem[l.values[0]]);
                break;

            case "pol_rotate":
                {
                    const p = new Array(l.N);
                    for (let j=0; j<l.N; j++) {
                        p[j] = mem[l.values[0]][(j + l.shift)%l.N];
                    }
                    mem[l.result] = p;
                    break;
                }

            case "pol_extend":
                mem[l.result] = await extendPol(F, mem[l.values[0]], l.extendBits);
                break;

            case "pol_getEvaluation":
                mem[l.result] = mem[l.p][l.idx];
                break;
    
            case "treeGroupMultipol_extractPol":
                {
                    const MGP = new MerkleGroupMultipol(M, l.nGroups, l.groupSize, l.nPols);
                    const N = l.nGroups*l.groupSize;
                    const p = new Array(N);
                    for (let j=0; j<N; j++) {
                        p[j] = MGP.getElement(mem[l.tree], l.polIdx, j); 
                    }
                    mem[l.result] = p;
                    break;
                }

            case "treeGroupMultipol_merkelize":
                {
                    const MGP = new MerkleGroupMultipol(M, l.nGroups, l.groupSize, l.pols.length);
                    const pols = [];
                    for (let j=0; j<l.pols.length; j++) {
                        pols.push(mem[l.pols[j]]);
                    }
                    mem[l.result] = MGP.merkelize(pols);
                    break;
                }

            case "treeGroupMultipol_root":
                {
                    const MGP = new MerkleGroupMultipol(M, l.nGroups, l.groupSize, l.nPols);
                    mem[l.result] = MGP.root(mem[l.tree]);
                    break;
                }

            case "treeGroupMultipol_getGroupProof":
                {
                    const MGP = new MerkleGroupMultipol(M, l.nGroups, l.groupSize, l.nPols);
                    mem[l.result] = MGP.getGroupProof(mem[l.tree], mem[l.idx]);
                    break;
                }


            case "treeGroup_merkelize":
                {
                    const MG = new MerkleGroup(M, l.nGroups, l.groupSize);
                    mem[l.result] = MG.merkelize(mem[l.pol]);
                    break;
                }

            case "treeGroup_root":
                {
                    const MG = new MerkleGroup(M, l.nGroups, l.groupSize);
                    mem[l.result] = MG.root(mem[l.tree]);
                    break;
                }

            case "treeGroup_getElementProof":
                {
                    const MG = new MerkleGroup(M, l.nGroups, l.groupSize);
                    mem[l.result] = MG.getElementProof(mem[l.tree], mem[l.idx]);
                    break;
                }
    
            case "treeGroup_getGroupProof":
                {
                    const MG = new MerkleGroup(M, l.nGroups, l.groupSize);
                    mem[l.result] = MG.getGroupProof(mem[l.tree], mem[l.idx]);
                    break;
                }

            case "idxArrayFromFields":
                {
                    const fields = [];
                    for (let j=0; j<l.fields.length; j++) {
                        fields.push(  Scalar.bits(Scalar.e(F.toObject(mem[l.fields[j]]))));
                    }
        
                    const res = [];
                    let curField =0;
                    let curBit =0;
                    for (let i=0; i<l.n; i++) {
                        let a = 0;
                        for (let j=0; j<l.nBits; j++) {
                            if (fields[curField][curBit]) a = a + (1<<j);
                            curBit ++;
                            if (curBit == 253) {
                                curBit = 0;
                                curField ++;
                            }
                        }
                        res.push(a);
                    }
                    mem[l.result] = res;
                    break;
                }
            case "idxArray_get":
                mem[l.result] = mem[l.idxArray][l.pos];
                break; 

            case "idx_addMod":
                mem[l.result] = (mem[l.idx] + l.add) % l.mod;
                break;

            case "calculateH1H2":
                {
                    const [h1, h2] = calculateH1H2(F, mem[l.f], mem[l.t]);
                    mem[l.resultH1] = h1;
                    mem[l.resultH2] = h2;
                    break;
                }

            case "friReduce":
                {
                    let acc = F.e(l.shiftInv);
                    let w = F.e(l.w);
                    let nX = 1 << l.reduceBits;
                    let pol2N = l.N/nX;
                    const pol2_e = new Array(pol2N);
                    for (let g = 0; g<pol2N; g++) {
                        const ppar = new Array(nX);
                        for (let i=0; i<nX; i++) {
                            ppar[i] = mem[l.pol][(i*pol2N)+g];
                        }
                        const ppar_c = await F.ifft(ppar);

                        polMulAxi(F, ppar_c, F.one, acc);    // Multiplies coefs by 1, shiftInv, shiftInv^2, shiftInv^3, ......
        
                        pol2_e[g] = evalPol(F, ppar_c, mem[l.specialX]);
                        acc = F.mul(acc, w);
                    }
                    mem[l.result] = pol2_e;
                    break;
                }
            case "hash":
                {
                    const vals = new Array(l.values.length);
                    for (let j=0; j<l.values.length; j++) {
                        vals[j] = mem[l.values[j]];
                    }
                    mem[l.result] = poseidon(vals);
                    break;
                }
            case "log":
                console.log(l.msg);
                if (typeof(l.refId)!= "undefined") {
                    const o = refToObject(F, mem, l.ref);
                    console.log(JSON.stringify(o, null, 1));
                }
                break;
            default: 
                throw new Error(`Not implemented: ${l.op}`)
        }
    }

    return dereference(F, mem, script.output);
}

function dereference(F, mem, o) {
    if (Array.isArray(o)) {
        const res = [];
        for (let i=0; i<o.length; i++) {
            res[i] = dereference(F, mem, o[i]);
        }
        return res;
    } else if (typeof o === "object") {
        if (o.$Ref) {
            return refToObject(F, mem, o);
        } else {
            const res = {};
            const keys = Object.keys(o);
            keys.forEach( (k) => {
                res[k] = dereference(F, mem, o[k]);
            });
            return res;
        }
    } else {
        return o;
    }
}

function refToObject(F, mem, ref) {
    if (ref.type == "int") {
        return mem[ref.id];
    } else if (ref.type == "field") {
        return  F.toString(mem[ref.id]);
    } else if (ref.type == "pol") {
        return  stringifyFElements(F, mem[ref.id]);
    } else if (ref.type == "treeGroup_groupProof") {
        return  stringifyFElements(F, mem[ref.id]);
    } else if (ref.type == "treeGroup_elementProof") {
        return  stringifyFElements(F, mem[ref.id]);
    } else if (ref.type == "treeGroupMultipol_groupProof") {
        return  stringifyFElements(F, mem[ref.id]);
    } else {
        throw new Error('Cannot stringify ${ref.type}');
    }
}
