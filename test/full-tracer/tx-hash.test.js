const chai = require("chai");
const expect = chai.expect;
const { Scalar } = require("ffjavascript");
const { ethers } = require("ethers");
const txs = require("./tx-hash.json")

describe("tx hash tests", async function () {
    this.timeout(10000000);

    it("Should test al tx hash", async () => {

        for (let test of txs) {
            const txu = {
                value: toHexStringRlp(test.value),
                nonce: toHexStringRlp(test.nonce),
                gasLimit: toHexStringRlp(test.gasLimit),
                gasPrice: toHexStringRlp(test.gasPrice),
                data: toHexStringRlpData(test.data),
                chainId: test.chainId,
                to: toHexStringRlp(test.to)
            }

            const s = {
                r: toHexStringRlp(test.r),
                s: toHexStringRlp(test.s),
                v: toHexStringRlp(test.v)
            }

            const fields = [txu.nonce, txu.gasPrice, txu.gasLimit, txu.to, txu.value, txu.data, s.v, s.r, s.s];
            const rlp = ethers.utils.RLP.encode(fields);
            const kecc = ethers.utils.keccak256(rlp);
            expect(kecc).to.equal(test.hash)
        }

    })

})


function toHexStringRlp(num) {
    if (num === "0x") num = "0x0"
    let numHex = Scalar.toString(Scalar.e(num), 16);
    numHex = (numHex.length % 2 === 1) ? (`0x0${numHex}`) : (`0x${numHex}`);
    if (numHex === "0x00") numHex = "0x"
    return numHex;
}

function toHexStringRlpData(num) {
    if (num === "0x") return num
    let numHex = Scalar.toString(Scalar.e(num), 16);
    numHex = (numHex.length % 2 === 1) ? (`0x0${numHex}`) : (`0x${numHex}`);
    return numHex;
}

