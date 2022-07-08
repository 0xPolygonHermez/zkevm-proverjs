
module.exports = function packMem(script) {

    const constDests = [];

    iterate_output(script.output, function(refId) {
        if (typeof constDests[refId] === "undefined") constDests[refId] = {};
        constDests[refId].destroy=script.program.length;
    });

    for (let i=script.program.length-1; i>=0; i--) {
        iterate_op(script.program[i], function(refId) {
            if (typeof constDests[refId] === "undefined") constDests[refId] = {};
            if (typeof constDests[refId].destroy === "undefined") {
                constDests[refId].destroy=i;
            }
            constDests[refId].create = i;
        });
    }

    for (let i=0; i<script.nInputs + script.nConsts; i++) {
        constDests[i].create = -(script.nInputs + script.nConsts)+ i;
    }

    for (let i=0; i<script.nConsts; i++) {
        constDests[i].destroy = script.program.length;
    }

    let constsDestsOps = [];
    for (let i=0; i<constDests.length; i++) {
        if (typeof(constDests[i]) === "undefined") throw new Error(`Reference ${i} not used`);
        if (typeof(constDests[i].create) === "undefined") throw new Error(`Reference ${i} not created`);
        if (typeof(constDests[i].destroy) === "undefined") throw new Error(`Reference ${i} not destroyes`);
        constsDestsOps.push({
            op: "create",
            ref: i,
            step: constDests[i].create
        });
        constsDestsOps.push({
            op: "destroy",
            ref: i,
            step: constDests[i].destroy
        });
    }

    constsDestsOps = constsDestsOps.sort( function(a, b) {
        return a.step - b.step;
    })

    const freeRefs = {};
    let nRefs = 0;


    for (let i=0; i<constsDestsOps.length; i++) {
        const ref = script.refs[constsDestsOps[i].ref];
        const typeS = getTypeString(ref);

        if (constsDestsOps[i].op === "create") {
            if ((freeRefs[typeS]) && (freeRefs[typeS].length>0)) {
                ref.newId = freeRefs[typeS].pop();
            } else {
                ref.newId = nRefs++;
            }   
        } else if (constsDestsOps[i].op === "destroy") {
            if (typeof ref.newId === "undefined") throw new Error(`Destructor before constructor`);
            if (typeof(freeRefs[typeS]) === "undefined") freeRefs[typeS] = [];
            freeRefs[typeS].push(ref.newId);
        } else {
            throw new Error("Invalid op");
        }
    }

    let newRefs = [];

    for (let i=0; i<script.refs.length; i++) {
        if (typeof newRefs[script.refs[i].newId] === "undefined") {
            newRefs[script.refs[i].newId] = Object.assign({}, script.refs[i]);
            newRefs[script.refs[i].newId].id = newRefs[script.refs[i].newId].newId;
            delete newRefs[script.refs[i].newId].newId;
        }
    }

    newRefs = newRefs.sort(function (a, b) {
        return a.id - b.id;
    })

    for (let i=0; i<script.program.length; i++) {
        iterate_op(script.program[i], function(refId) {
            return script.refs[refId].newId;
        });
    }

    iterate_output(script.output, function(refId) {
        return script.refs[refId].newId;
    });

    script.refs = newRefs;
}


function iterate_output(o, f) {
    if (Array.isArray(o)) {
        const res = [];
        for (let i=0; i<o.length; i++) {
            res[i] = iterate_output(o[i], f);
        }
    } else if (typeof o === "object") {
        if (o.$Ref) {
            const newId = f(o.id);
            if (typeof newId !== "undefined") o.id = newId;
        } else {
            const res = {};
            const keys = Object.keys(o);
            keys.forEach( (k) => {
                res[k] = iterate_output(o[k], f);
            });
            return res;
        }
    }
}

function iterate_op(o, f) {

    switch (o.op) {
        case "field_set":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                break;
            }
        case "field_add":
        case "field_sub":
        case "field_mul":
        case "pol_add":
        case "pol_sub":
        case "pol_mul":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newVal0 = f(o.values[0]);
                if (typeof newVal0 !== "undefined") o.values[0] = newVal0;
                const newVal1 = f(o.values[1]);
                if (typeof newVal1 !== "undefined") o.values[1] = newVal1;
                break;
            }
        case "field_neg":
        case "pol_neg":
        case "pol_grandProduct":
        case "pol_batchInverse":
        case "pol_rotate":
        case "pol_extend":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newVal0 = f(o.values[0]);
                if (typeof newVal0 !== "undefined") o.values[0] = newVal0;
                break;
            }

        case "pol_addc":
        case "pol_mulc":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newVal0 = f(o.values[0]);
                if (typeof newVal0 !== "undefined") o.values[0] = newVal0;
                const newConstant = f(o.constant);
                if (typeof newConstant !== "undefined") o.constant = newConstant;
                break;
            }

        case "pol_getEvaluation":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newP = f(o.p);
                if (typeof newP !== "undefined") o.p = newP;
                break;
            }

        case "treeGroupMultipol_extractPol":
        case "treeGroupMultipol_root":
        case "treeGroup_root":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newTree = f(o.tree);
                if (typeof newTree !== "undefined") o.tree = newTree;
                break;
            }

        case "treeGroupMultipol_merkelize":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                for (let j=0; j<o.pols.length; j++) {
                    const newPol = f(o.pols[j]);
                    if (typeof newPol !== "undefined") o.pols[j] = newPol;
                }
                break;
            }

        case "treeGroupMultipol_getGroupProof":
        case "treeGroup_getElementProof":
        case "treeGroup_getGroupProof":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newTree = f(o.tree);
                if (typeof newTree !== "undefined") o.tree = newTree;
                const newIdx = f(o.idx);
                if (typeof newIdx !== "undefined") o.idx = newIdx;
                break;
            }

        case "treeGroup_merkelize":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newPol = f(o.pol);
                if (typeof newPol !== "undefined") o.pol = newPol;
                break;
            }

        case "idxArrayFromFields":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                for (let j=0; j<o.fields.length; j++) {
                    const newField = f(o.fields[j]);
                    if (typeof newField !== "undefined") o.fields[j] = newField;
                }
                break;
            }

        case "idxArray_get":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newPos = f(o.pos);
                if (typeof newPos !== "undefined") o.pos = newPos;
                const newPnewIdxArray = f(o.idxArray);
                if (typeof newPnewIdxArray !== "undefined") o.idxArray = newPnewIdxArray;
                break;
            }

        case "idx_addMod":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newIdx = f(o.idx);
                if (typeof newIdx !== "undefined") o.idx = newIdx;
                break;
            }

        case "calculateH1H2":
            {
                const newResultH1 = f(o.resultH1);
                if (typeof newResultH1 !== "undefined") o.resultH1 = newResultH1;
                const newResultH2 = f(o.resultH2);
                if (typeof newResultH2 !== "undefined") o.resultH2 = newResultH2;
                const newF = f(o.f);
                if (typeof newF !== "undefined") o.f = newF;
                const newT = f(o.t);
                if (typeof newT !== "undefined") o.t = newT;
                break
            }

        case "friReduce":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                const newPol = f(o.pol);
                if (typeof newPol !== "undefined") o.pol = newPol;
                const newSpecialX = f(o.specialX);
                if (typeof newSpecialX !== "undefined") o.specialX = newSpecialX;
                break;
            }

        case "hash":
            {
                const newResult = f(o.result);
                if (typeof newResult !== "undefined") o.result = newResult;
                for (let j=0; j<o.values.length; j++) {
                    const newVal = f(o.values[j]);
                    if (typeof newVal !== "undefined") o.values[j] = newVal;
                }
                break;
            }
        case "log":
            break;
        default: 
            throw new Error(`Not implemented: ${l.op}`)
    }
}

function getTypeString(ref) {
    if (ref.type == "int") {
        return "int";
    } else if (ref.type == "field") {
        return  "field";
    } else if (ref.type == "idxArray") {
        return  "idxArray";
    } else if (ref.type == "pol") {
        return  `pol_${ref.N}`;
    } else if (ref.type == "treeGroup") {
        return  `treeGroup_${ref.nGroups}_${ref.groupSize}`;
    } else if (ref.type == "treeGroup_groupProof") {
        return  `treeGroup_groupProof_${ref.nGroups}_${ref.groupSize}`;
    } else if (ref.type == "treeGroup_elementProof") {
        return  `treeGroup_elementProof_${ref.nGroups}_${ref.groupSize}`;
    } else if (ref.type == "treeGroupMultipol") {
        return  `treeGroupMultipol_${ref.nGroups}_${ref.groupSize}_${ref.nPols}`;
    } else if (ref.type == "treeGroupMultipol_groupProof") {
        return  `treeGroupMultipol_groupProof_${ref.nGroups}_${ref.groupSize}_${ref.nPols}`;
    } else {
        throw new Error(`Cannot stringify ${ref.type}`);
    }
}
