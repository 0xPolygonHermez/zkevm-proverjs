module.exports.getPolsDef = function getPolsDef(pil) {
    polsDef = [];
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "cmP") {
                polsDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType
                }
            }
        }
    }
    for (let i=0; i<pil.nCommitments; i++) {
        if (!polsDef[i]) {
            throw new Error("Invalid pils commitment sequence");
        }
    }

    return polsDef;
}

module.exports.getPolsDefConst = function getPolsDefConst(pil) {
    polsDef = [];
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "constP") {
                polsDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType
                }
            }
        }
    }
    for (let i=0; i<pil.nConstants; i++) {
        if (!polsDef[i]) {
            throw new Error("Invalid pils constant sequence");
        }
    }

    return polsDef;
}

