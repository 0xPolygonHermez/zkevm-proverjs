const chai = require("chai");
const expect = chai.expect;
const { Scalar } = require("ffjavascript");
const { ethers } = require("ethers");

describe("tx hash tests", async function () {
    this.timeout(10000000);

    it("Should test al tx hash", async () => {

        for (let test of txs) {
            console.log(test)
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

const txs = [{
    "nonce": "0x0a",
    "gasPrice": "0x59682f08",
    "gasLimit": "0x5208",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x5af3107a4000",
    "data": "0x",
    "chainId": 5,
    "v": "0x2e",
    "r": "0xa54492cfacf71aef702421b7fbc70636537a7b2fbe5718c5ed970a001bb7756b",
    "s": "0x2e9fb27acc75955b898f0b12ec52aa34bf08f01db654374484b80bf12f0d841e",
    "from": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "hash": "0x033d835f6d526e8ab7d353816143881dfd43d26066ac3e62fa177c4d2e168f15",
    "link": "https://goerli.etherscan.io/tx/0x033d835f6d526e8ab7d353816143881dfd43d26066ac3e62fa177c4d2e168f15"
},
{
    "nonce": "0x13",
    "gasPrice": "0x59682f07",
    "gasLimit": "0x5208",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x",
    "data": "0x",
    "chainId": "0x05",
    "v": "0x2e",
    "r": "0x027270dd61a600c48e13f62ec81bf1bda5638868a4bed58aeb546f93c92840b8",
    "s": "0x5bd8d2f3a2cb4d958164d8cf4331e73b86571234bbe237bd5fe423a0d87f38f6",
    "hash": "0x5c7a55d6bd475e278d39023b596859e4d4fc2028a9d0f0c4164eac7b99dfa216",
    "link": "https://goerli.etherscan.io/tx/0x5c7a55d6bd475e278d39023b596859e4d4fc2028a9d0f0c4164eac7b99dfa216"
},
{
    "nonce": "0x14",
    "gasPrice": "0x59682f07",
    "gasLimit": "0x5208",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x7d0e36a818000",
    "data": "0x",
    "chainId": "0x05",
    "v": "0x2e",
    "r": "0xbfe7bbc16ecfb7653684f53aa728cefac7e1a84910a2eccc0b6984090c7694b1",
    "s": "0x1cc6855b5e9f456981fe94d0c392d5cf17570c7cb71cc27cfd38371c7f28ccb9",
    "hash": "0x47aea133ba8bc12cac6188afdbbfa833d60d019d0703984f16e083774a60cb0d",
    "link": "https://goerli.etherscan.io/tx/0x47aea133ba8bc12cac6188afdbbfa833d60d019d0703984f16e083774a60cb0d"
},
{
    "nonce": "0x15",
    "gasPrice": "0x59682f08",
    "gasLimit": "0x5208",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x96b89fab8f3b40",
    "data": "0x",
    "chainId": "0x05",
    "v": "0x2d",
    "r": "0x9eca68a88a8cea7de6475430efb6bd9c172599101f5f65e4e990ee44b69438eb",
    "s": "0x62a043ed3f8559e8290bff838f4171404cb71f4486239b66cc2e731e695f98a2",
    "hash": "0x3b25a869b5689cdba6a4f8797b1bc8d37809471552756f1a23a3273df59d153a",
    "link": "https://goerli.etherscan.io/tx/0x3b25a869b5689cdba6a4f8797b1bc8d37809471552756f1a23a3273df59d153a"
},
{
    "nonce": "0x17",
    "gasPrice": "0x59682f08",
    "gasLimit": "0x520c",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x96b89fab8f3b40",
    "data": "0x00",
    "chainId": "0x05",
    "v": "0x2d",
    "r": "0xb54ada9b8675641d529d9c8396d1ed22d6f8e88ee46a5d286ab9979823a044fe",
    "s": "0x3a6a24fbae6c7488286fa425a5dc392b36e09f5a1f38ba334868b20552c98d81",
    "hash": "0xca85fac75b3a43e02b201a54f2b8a45c1186c9f36a5405615f7469709962baaa",
    "link": "https://goerli.etherscan.io/tx/0xca85fac75b3a43e02b201a54f2b8a45c1186c9f36a5405615f7469709962baaa"
},
{
    "nonce": "0x18",
    "gasPrice": "0x59682f07",
    "gasLimit": "0x5208",
    "to": "0xD8Af0C5c6dEE7dCe32E59577675C026e1aDe4De5",
    "value": "0x0",
    "data": "0x",
    "chainId": "0x05",
    "v": "0x2d",
    "r": "0x2b2454daaa1c8e180d828ad115869008e2307e7fe47bee19453abf0a5b621bd1",
    "s": "0x74df6b945305f5262446d1beaba712a89e43e8b722aaefaf67514f6705d089dd",
    "hash": "0x9eeeac41d389ef07b958482e517680450972cfb08f67ec5d72325a2c3b5fb027",
    "link": "https://goerli.etherscan.io/tx/0x9eeeac41d389ef07b958482e517680450972cfb08f67ec5d72325a2c3b5fb027"
  }]