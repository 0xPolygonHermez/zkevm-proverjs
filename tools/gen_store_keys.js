const fs = require("fs")
const { Scalar } = require('ffjavascript');
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;

const argv = require("yargs")
    .usage("node gen_store_keys.js [-c <count>] [-o <output>]")
    .help('h')
    .alias("o", "output")
    .alias("c", "count")
    .argv;

async function main(){
    const output = typeof(argv.output) === "string" ?  argv.output.trim() : "-";
    const count = typeof(argv.count) === "number" ?  argv.count : 100;

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // set A, B = 0
    const A012345B01 = [F.zero, F.zero, F.zero, F.zero, F.zero, F.zero, F.zero, F.zero];
    let hashes = [];
    for (let i = 0; i < count; ++i) {
        const C = [i, F.zero, F.zero, F.zero, F.zero, F.zero, F.zero, F.zero];

        const keyI = poseidon(A012345B01); // Kin0
        const key = poseidon(C, keyI); // Kin1
        hashes.push(splitKey(key).join('') + ' #'+i);
    }
    hashes.sort();
    let maxDepth = 0;
    for (let i = 1; i < count; ++i) {
        const depth = [...hashes[i]].findIndex((bit, index) => bit !== hashes[i-1][index]);
        maxDepth = depth > maxDepth ? depth : maxDepth;
    }
    const content = hashes.join("\n") + "\n";
    if (output == '-') {
        console.log(content);
    } else {
        fs.writeFileSync(output, content , "utf8");
    }
    console.log('max depth:' + maxDepth);


    function splitKey(k) {
        const res = [];
        const auxk = [F.toObject(k[0]), F.toObject(k[1]), F.toObject(k[2]), F.toObject(k[3])];
        for (let i = 0; i < 64; i++) {
            for (let j = 0; j < 4; j++) {
                res.push(Scalar.toNumber(Scalar.band(auxk[j], Scalar.e(1))));
                auxk[j] = Scalar.shr(auxk[j], 1);
            }
        }

        return res;
    }
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});