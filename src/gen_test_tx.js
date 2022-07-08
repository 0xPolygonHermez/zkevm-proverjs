const ethers=require("ethers");


const mnemonic1 = "machine cabin present exact cabbage shiver depend maple cinnamon shallow squeeze dress"
const wallet1 = ethers.Wallet.fromMnemonic(mnemonic1);

const mnemonic2 = "music estate art solve praise marriage crisp measure album mix math click"
const wallet2 = ethers.Wallet.fromMnemonic(mnemonic2);


async function run() {
    console.log(wallet1.address);
    console.log(wallet2.address);

    const tx = {
        nonce: 0,
        gasLimit: 100000,
        gasPrice: ethers.utils.parseEther("0.000000001"),
        to: wallet2.address,
        chainId: 400,
        value: ethers.utils.parseEther("0.1")
    }

    const rawTx = await wallet1.signTransaction(tx);
    console.log("rawTx: "+ rawTx);

    const rtx = ethers.utils.RLP.decode(rawTx);
    const chainId = (Number(rtx[6]) - 35) >> 1;
    const sign = !(Number(rtx[6])  & 1);
    const e =[rtx[0], rtx[1], rtx[2], rtx[3], rtx[4], rtx[5], ethers.utils.hexlify(chainId), "0x", "0x"]
    // console.log(e);
    const signData = ethers.utils.RLP.encode( e );
    // console.log(rtx);
    // console.log(chainId);
    // console.log(sign);
    // console.log(signData);
    const digest = ethers.utils.keccak256(signData);
    const raddr =  ethers.utils.recoverAddress(digest, {
        r: rtx[7],
        s: rtx[8],
        v: sign + 27
    });
    // console.log(raddr);
}

run().then( () => {
    process.exit();
}, (err) => {
    console.log(err.stack);
    console.log(err.message);
    process.exit(1);
});

