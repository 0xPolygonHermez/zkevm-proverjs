const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs/src/smt-utils");
const { F1Field, Scalar } = require("ffjavascript");

module.exports.preparePublics = function preparePublics(publics, publicsIndexes) {
    const Fr = new F1Field(0xffffffff00000001n);

    const publicsCircom = new Array(publicsIndexes.nPublics);

    const publicsNames = Object.keys(publicsIndexes);
    for(let i = 0; i < publicsNames.length; i++) {
        const name = publicsNames[i];
        if(name === "nPublics") continue;
        
        const nameIndex = publicsIndexes[name];
        const nextNameIndex = publicsIndexes[publicsNames[i + 1]];
        const length = nextNameIndex - nameIndex;
        const value = publics[name.slice(0, -3)];
        if(length === 1) {
            publicsCircom[nameIndex] = Fr.e(value);
        } else if(length === 8) {
            const circomInputs = scalar2fea(Fr, Scalar.e(value));
            for(let j = 0; j < circomInputs.length; j++) {
                publicsCircom[nameIndex + j] = circomInputs[j];
            }
        } else throw new Error("Unsupported length: ", + length);

    }

    return publicsCircom;
}

module.exports.generateRandomHex = function generateRandomHex(maxBits = 32, forbiddenHex = null) {
    let maxValue = Math.pow(2, maxBits);
    let hexValue = '0x' + Math.floor(Math.random() * maxValue).toString(16);
    if(forbiddenHex) {
        while(hexValue === forbiddenHex) {
            hexValue = '0x' + Math.floor(Math.random() * maxValue).toString(16);
        }
    }
    return hexValue;
}

module.exports.generateRandomValue = function generateRandomValue(maxBits, forbiddenValue = null) {
    let maxValue = Math.pow(2, maxBits);
    let value = Math.floor(Math.random() * maxValue);
    if(forbiddenValue) {
        while(value === forbiddenValue) {
            value = Math.floor(Math.random() * maxValue);
        }
    }
    return value;
}