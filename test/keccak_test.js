const keccak = require("../src/sm/sm_padding_kkbit/keccak").keccak;
const { ethers } = require("ethers");
const assert = require('assert');

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

describe("keccak", async function () {

    it("It should test keccak of null", async () => {
        const expectedRes = ethers.utils.keccak256("0x");
        const res = "0x" + toHexString(keccak([]));
        assert(res == expectedRes);
    });
});
