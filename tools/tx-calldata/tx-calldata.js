const ethers = require("ethers")
const utils = require("./utils")
const fs = require("fs")

const argv = require("yargs")
    .usage("node tx-calldata.js -n <nonce> -p <gasPrice> -l <gasLimit> -t <to> -a <value> -d <data> -v <v> -r <r> -s <s> -x <transaction.json>")
    .help('h')
    .alias("n", "nonce")
    .alias("p", "gasPrice")
    .alias("l", "gasLimit")
    .alias("t", "to")
    .alias("a", "value")
    .alias("d", "data")
    .alias("v", "signv")
    .alias("r", "signr")
    .alias("s", "signs")
    .alias("x", "transaction")
    .argv;

// example: node run-inputs.js -f ../test/state-transition/inputs-executor/ -r ../../zkrom/build/rom.json -p ../../zkvmpil/build/zkevm.pil.json

async function main(){
    let nonce, gasPrice, gasLimit, to, value, data, v, r, s;
    if (typeof argv.transaction != "undefined" || fs.existsSync(__dirname, "./tx.json")){
        const file = typeof argv.transaction === "undefined" ? "./tx.json" : "./"+argv.transaction;
        var mydata = require(file);
        nonce = mydata.nonce;
        gasPrice = mydata.gasPrice;
        gasLimit = mydata.gasLimit;
        to = mydata.to;
        value = mydata.value;
        data = mydata.data;
        v = mydata.v;
        r = mydata.r;
        s = mydata.s;
    }
    nonce = (typeof argv.nonce === "undefined") ? nonce : argv.nonce;
    gasPrice = (typeof argv.gasPrice === "undefined") ? gasPrice : argv.gasPrice;
    gasLimit = (typeof argv.gasLimit === "undefined") ? gasLimit : argv.gasLimit;
    to = (typeof argv.to === "undefined") ? to : argv.to;
    value = (typeof argv.value === "undefined") ? value : argv.value;
    data = (typeof argv.data === "undefined") ? data : argv.data;
    v = (typeof argv.v === "undefined") ? v : argv.v;
    r = (typeof argv.r === "undefined") ? r : argv.r;
    s = (typeof argv.s === "undefined") ? s : argv.s;

    utils.checkParam(nonce,"nonce");
    utils.checkParam(gasPrice,"gasPrice");
    utils.checkParam(gasLimit,"gasLimit");
    utils.checkParam(to,"to");
    utils.checkParam(value,"value");
    utils.checkParam(data,"data");
    utils.checkParam(v,"v");
    utils.checkParam(r,"r");
    utils.checkParam(s,"s");

    const chainId = (Number(v) - 35) >> 1;
    const messageToHash = [utils.getParamRLP(nonce), utils.getParamRLP(gasPrice), utils.getParamRLP(gasLimit), utils.getParamRLP(to), utils.getParamRLP(value), utils.getParamRLP(data), utils.getParamRLP(chainId), "0x", "0x"]
    const signData = ethers.utils.RLP.encode(messageToHash).slice(2);
    r = r.slice(2).padStart(32*2, 0);
    s = s.slice(2).padStart(32*2, 0);
    const sign = !(Number(v) & 1);
    v = (sign + 27).toString(16).padStart(1*2, '0');
    const calldata = `0x${signData.concat(r).concat(s).concat(v)}`;
    console.log("calldata----------------------------")
    console.log(calldata)
    const signDataDecode = ethers.utils.RLP.decode("0x"+signData);
    console.log("tx----------------------------------")
    console.log("nonce: ", signDataDecode[0])
    console.log("gasPrice: ", signDataDecode[1])
    console.log("gasLimit: ", signDataDecode[2])
    console.log("to: ", signDataDecode[3])
    console.log("value: ", signDataDecode[4])
    console.log("data: ", signDataDecode[5])
    console.log("chainId: ", signDataDecode[6])
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});