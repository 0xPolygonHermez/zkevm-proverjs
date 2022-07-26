const chai = require("chai");
const expect = chai.expect;
const { Scalar } = require("ffjavascript");
const { ethers } = require("ethers");
const txs = require("./tx-hash.json")
const { getTransactionHash } = require("../../src/sm/sm_main/debug/full-tracer-utils")
describe("tx hash tests", async function () {
    this.timeout(10000000);

    it("Should test al tx hash", async () => {

        for (let test of txs) {
            const txHash = getTransactionHash(test.to, Number(test.value), Number(test.nonce), test.gasLimit, test.gasPrice, test.data, test.r, test.s, test.v)
            expect(txHash).to.equal(test.hash)
        }

    })

})