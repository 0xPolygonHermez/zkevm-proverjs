const { fea2scalar } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { Scalar } = require("ffjavascript");

module.exports = {
    safeFea2scalar,
    safeFea384ToScalar,
    fea384ToScalar,
    scalarToFea384
}

function safeFea2scalar(Fr, arr) {
    for (let index = 0; index < 8; ++index) {
        const value = Fr.toObject(arr[index]);
        if (value > 0xFFFFFFFFn) {
            throw new Error(`Invalid value 0x${value.toString(16)} (mode:256 bits) to convert to scalar on index ${index}`);
        }
    }
    return fea2scalar(Fr, arr);
}

function safeFea384ToScalar(Fr, arr) {
    for (let index = 0; index < 8; ++index) {
        const value = Fr.toObject(arr[index]);
        if (value > 0xFFFFFFFFFFFFn) {
            throw new Error(`Invalid value 0x${value.toString(16)} (mode:384 bits) to convert to scalar on index ${index}`);
        }
    }
    return fea384ToScalar(Fr, arr);
}

/**
* Field element 48 bits array to Scalar
* result = arr[0] + arr[1]*(2^48) + arr[2]*(2^96) + arr[3]*(2^144) + arr[4]*(2^192) + arr[5]*(2^240) + arr[6]*(2^288) + arr[7]*(2^336)
* @param {Field} F - field element
* @param {Array[Field]} arr - array of fields elements
* @returns {Scalar}
*/
function fea384ToScalar(Fr, arr) {
    let res = Fr.toObject(arr[0]);
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[1]), 48));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[2]), 96));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[3]), 144));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[4]), 192));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[5]), 240));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[6]), 288));
    res = Scalar.add(res, Scalar.shl(Fr.toObject(arr[7]), 336));

    return res;
}

/**
 * Converts a Scalar into an array of 8 elements encoded as Fields elements where each one represents 48 bits
 * result = [Scalar[0:47], scalar[48:95], scalar[96:143], scalar[144:191], scalar[192:239], scalar[240:287], scalar[288:335], scalar[336:383]]
 * @param {Field} Fr - field
 * @param {Scalar} scalar - value to convert
 * @returns {Array[Field]} array of fields
 */
function scalarToFea384(Fr, scalar) {
    scalar = Scalar.e(scalar);
    const r0 = Scalar.band(scalar, Scalar.e('0xFFFFFFFFFFFF'));
    const r1 = Scalar.band(Scalar.shr(scalar, 48), Scalar.e('0xFFFFFFFFFFFF'));
    const r2 = Scalar.band(Scalar.shr(scalar, 96), Scalar.e('0xFFFFFFFFFFFF'));
    const r3 = Scalar.band(Scalar.shr(scalar, 144), Scalar.e('0xFFFFFFFFFFFF'));
    const r4 = Scalar.band(Scalar.shr(scalar, 192), Scalar.e('0xFFFFFFFFFFFF'));
    const r5 = Scalar.band(Scalar.shr(scalar, 240), Scalar.e('0xFFFFFFFFFFFF'));
    const r6 = Scalar.band(Scalar.shr(scalar, 288), Scalar.e('0xFFFFFFFFFFFF'));
    const r7 = Scalar.band(Scalar.shr(scalar, 336), Scalar.e('0xFFFFFFFFFFFF'));

    return [Fr.e(r0), Fr.e(r1), Fr.e(r2), Fr.e(r3), Fr.e(r4), Fr.e(r5), Fr.e(r6), Fr.e(r7)];
}
