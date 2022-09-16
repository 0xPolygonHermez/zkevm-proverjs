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
            const { tx_hash } = getTransactionHash(test.to, test.value, test.nonce, test.gasLimit, test.gasPrice, test.data, test.r, test.s, test.v)
            expect(tx_hash).to.equal(test.hash)
        }

    })

})