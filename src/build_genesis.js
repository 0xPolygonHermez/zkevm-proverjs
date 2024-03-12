const { SMT, Database } = require("@0xpolygonhermez/zkevm-commonjs");
const { stringToH4 } = require("@0xpolygonhermez/zkevm-commonjs/src/smt-utils");
const { keyEthAddrBalance, h4toString } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { getPoseidon } = require("@0xpolygonhermez/zkevm-commonjs");
const fs = require("fs").promises;
const { version } = require("../package.json");
const { Scalar } = require("ffjavascript");

const ARITY = 4;

const argv = require("yargs")
    .version(version)
    .usage("build_genesis <genesis.json> -o <db.json>")
    .alias("o", "output")
    .argv;

async function run() {
    let inputFile;
    if (argv._.length !== 1) {
        console.log(argv._.length === 0 ? "You need to specify an input file" : "Only one input file at a time is permitted");
        process.exit(1);
    } else {
        inputFile = argv._[0];
    }

    const outputFile = typeof argv.output === "string" ? argv.output.trim() : "proof.json";
    const input = JSON.parse(await fs.readFile(inputFile, "utf8"));

    const addrs = Object.keys(input);
    const poseidon = await getPoseidon();
    const F = poseidon.F;

    const db = new Database(F);
    const smt = new SMT(db, poseidon, F);
    let r = { newRoot: [F.zero, F.zero, F.zero, F.zero] };
    const keys = {};

    for (const addr of addrs) {
        const keyBalance = await keyEthAddrBalance(addr);
        const val = Scalar.e("1000000000000000000000");
        keys[h4toString(keyBalance)] = Scalar.toString(val);
        r = await smt.set(r.newRoot, keyBalance, val);
    }

    console.log(h4toString(r.newRoot));

    db.startCapture();

    for (const key of Object.keys(keys)) {
        await smt.get(r.newRoot, stringToH4(key));
    }

    await fs.writeFile(outputFile, JSON.stringify({
        keys,
        db: db.endCapture(),
    }, null, 1) + "\n", "utf8");
}

run().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
});
