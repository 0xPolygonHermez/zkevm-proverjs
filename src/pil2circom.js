const defaultStarkStruct = require("./starkstruct");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const {genCalculator} = require("./pil2starkPolCalculator.js");
const ejs = require("ejs");

module.exports = async function pil2circom(template, pil, verKey) {

    const nBits = verKey.nBits || 23;
    const N = 1 << nBits;
    const extendBits = verKey.extendBits || 1;
    const starkStruct = verKey.starkStruct || defaultStarkStruct;

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const obj = {
        F: F,
        calculator: genCalculator(F, pil),
        starkStruct: starkStruct,
        constRoot: F.toString(verKey.constRoot),
        pil: pil
    };

    return ejs.render(template ,  obj);

}
