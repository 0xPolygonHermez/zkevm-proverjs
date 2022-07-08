module.exports.createCommitedPols = function createCommitedPols(pil) {
    pols = {};
    polsArray = [];
    polsDef = {};
    polsArrayDef = [];
    for (let i=0; i<pil.nCommitments; i++) polsArray.push([]);
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "cmP") {
                [nameSpace, namePol] = refName.split(".");
                if (!pols[nameSpace]) pols[nameSpace] = {};
                pols[nameSpace][namePol] = polsArray[ref.id];
                polsArrayDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType,
                    polDeg: ref.polDeg
                }
                if (!polsDef[nameSpace]) polsDef[nameSpace] = {};
                polsDef[nameSpace][namePol] = polsArrayDef[ref.id];
            }
        }
    }
    for (let i=0; i<pil.nCommitments; i++) {
        if (!polsArrayDef[i]) {
            throw new Error("Invalid pils sequence");
        }
    }

    return [pols, polsArray, polsDef, polsArrayDef];
};


module.exports.createConstantPols = function createConstantPols(pil) {
    pols = {};
    polsArray = [];
    polsDef = {};
    polsArrayDef = [];
    for (let i=0; i<pil.nConstants; i++) polsArray.push([]);
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "constP") {
                [nameSpace, namePol] = refName.split(".");
                if (!pols[nameSpace]) pols[nameSpace] = {};
                pols[nameSpace][namePol] = polsArray[ref.id];
                polsArrayDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType,
                    polDeg: ref.polDeg
                }
                if (!polsDef[nameSpace]) polsDef[nameSpace] = {};
                polsDef[nameSpace][namePol] = polsArrayDef[ref.id];
            }
        }
    }
    for (let i=0; i<pil.nConstants; i++) {
        if (!polsArrayDef[i]) {
            throw new Error("Invalid pils sequence");
        }
    }

    return [pols, polsArray, polsDef, polsArrayDef];
};
