const { SMT, MemDB }  = require("@polygon-hermez/zkevm-commonjs");
const { stringToH4 } = require("@polygon-hermez/zkevm-commonjs/src/smt-utils");
const { keyEthAddrBalance, h4toString } = require("@polygon-hermez/zkevm-commonjs").smtUtils;
const buildPoseidon = require("@polygon-hermez/zkevm-commonjs").getPoseidon;
const fs = require("fs");
const version = require("../package").version;

const Scalar = require("ffjavascript").Scalar;


const ARITY = 4;

const argv = require("yargs")
    .version(version)
    .usage("build_genesis <genesis.json> -o <db.json>")
    .alias("o", "output")
    .argv;

async function run() {

    let inputFile;
    if (argv._.length == 0) {
        console.log("You need to specify an input file file");
        process.exit(1);
    } else if (argv._.length == 1) {
        inputFile = argv._[0];
    } else  {
        console.log("Only one input file at a time is permited");
        process.exit(1);
    }

    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "proof.json";

    const input = JSON.parse(await fs.promises.readFile(inputFile, "utf8"));

    const addrs = Object.keys(input);

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const db = new MemDB(F);
    const smt = new SMT(db, poseidon, F);

    let r = {
        newRoot: [F.zero, F.zero, F.zero, F.zero]
    };

    const keys = {};


    for (let i=0; i<addrs.length; i++) {

        const keyBalance = await keyEthAddrBalance(addrs[i]);
        const val = Scalar.e("1000000000000000000000");
        keys[ h4toString(keyBalance) ] = Scalar.toString(val);

        r = await smt.set(r.newRoot, keyBalance, val);
    }

    console.log(h4toString(r.newRoot));

    db.startCapture();

    for (let k of Object.keys(keys)) {
        await smt.get(r.newRoot, stringToH4(k));
    };

    await fs.promises.writeFile(outputFile, JSON.stringify({
        keys: keys,
        db: db.endCapture(),
    }, null, 1) + "\n", "utf8");
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});