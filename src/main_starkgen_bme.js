const fs = require("fs");
const version = require("../package").version;
const { log2 } = require("./utils");

const { importMerkleGroupMultipol, importPolynomials } = require("./binfiles.js");

const Merkle = require("./merkle.js");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");

const buildPoseidon = require("circomlibjs").buildPoseidon;

const starkStruct = require("./starkstruct");
const starkGen = require("./stark_gen.js")

const { stringifyFElements } = require("ffjavascript").utils;
const {getPolsDef, getPolsDefConst} = require("./pilutils.js");
const batchMachineExecutor = require("./batchmachine_executor.js");
const proof2zkin = require("./proof2zkin.js").proof2zkin;

const argv = require("yargs")
    .version(version)
    .usage("main_starkgen <commit.bin> -p <pil.json> -c <constant.bin> -t <constanttree.bin> -o <proof.json>")
    .alias("o", "output")
    .alias("s", "script")
    .alias("p", "pil")
    .alias("c", "constant")
    .alias("t", "constanttree")
    .argv;

async function run() {    
    let commitFile;
    if (argv._.length == 0) {
        console.log("You need to specify a commit file file file");
        process.exit(1);
    } else if (argv._.length == 1) {
        commitFile = argv._[0];
    } else  {
        console.log("Only one commit file at a time is permited");
        process.exit(1);
    }

    let N;
    if (typeof(argv.N) !== "string") {
        N = 2**16;
    } else {
        N = Number(argv.N);
    } 
    const Nbits = log2(N);
    const extendBits = 1;


    const scriptFile = typeof(argv.script) === "string" ?  argv.script.trim() : "starkgen_bmscript.json";
    const pilFie = typeof(argv.pil) === "string" ?  argv.pil.trim() : "starkgen_bmscript.json";
    const constantFile = typeof(argv.constant) === "string" ?  argv.constant.trim() : "constant.bin";
    const constantTreeFile = typeof(argv.constanttree) === "string" ?  argv.constanttree.trim() : "constanttree.bin";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "stark.json";

    const script = JSON.parse(await fs.promises.readFile(scriptFile, "utf8"));
    const pil = JSON.parse(await fs.promises.readFile(pilFie, "utf8"));

    const polsDef = getPolsDef(pil);
    const polsDefConst = getPolsDefConst(pil);

    const pols = await importPolynomials(commitFile, polsDef, 2**16);
    const polsConst = await importPolynomials(constantFile, polsDefConst, 2**16);

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const M = new Merkle(16, poseidon, poseidon.F);

    const groupSize = 1 << (Nbits+extendBits - starkStruct.steps[0].nBits);
    const nGroups = 1 << starkStruct.steps[0].nBits;
    const MGPC = new MerkleGroupMultipol(M, nGroups, groupSize, pil.nConstants);

    const constTree = await importMerkleGroupMultipol(constantTreeFile, MGPC);

    const mem = [];

    for (let i=0; i<polsConst.length; i++) {
        const p = new Array(polsConst[i].length);
        for (let j=0; j<polsConst[i].length; j++) {
            p[j] = F.e(polsConst[i][j]);
        }
        mem[i] = p;
    }

    mem[polsConst.length] = constTree;

    for (let i=0; i<pols.length; i++) {
        const p = new Array(pols[i].length);
        for (let j=0; j<pols[i].length; j++) {
            p[j] = F.e(pols[i][j]);
        }
        mem[polsConst.length + 1 + i] = p;
    }

    const bmResult = await batchMachineExecutor(mem, script);

    const bmResultJ = stringifyFElements(F, bmResult);

    const starkProof = proof2zkin(bmResultJ.proof);
    const publics = bmResultJ.publics;
    const res = Object.assign({}, starkProof, publics);

    await fs.promises.writeFile(outputFile, JSON.stringify(res), "utf8");

    console.log("Stark generated correctly");
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

