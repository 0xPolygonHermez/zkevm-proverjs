const fs = require("fs");
const version = require("../package").version;
const { log2 } = require("./utils");

const { importMerkleGroupMultipol, importPolynomials } = require("./binfiles.js");

const Merkle = require("./merkle.js");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");

const buildPoseidon = require("circomlibjs").buildPoseidon;

const starkStruct = require("./starkstruct");
const starkGen = require("./stark_gen.js");
const proof2zkin = require("./proof2zkin.js").proof2zkin;

const { stringifyFElements } = require("ffjavascript").utils;

const argv = require("yargs")
    .version(version)
    .usage("main_starkgen <commit.bin> -p <pil.json> -c <constant.bin> -t <constanttree.bin> -o <proof.json>")
    .alias("o", "output")
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


    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : "main.pil.json";
    const constantFile = typeof(argv.constant) === "string" ?  argv.constant.trim() : "constant.bin";
    const constantTreeFile = typeof(argv.constanttree) === "string" ?  argv.constanttree.trim() : "constanttree.bin";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "stark.json";

    const pil = JSON.parse(await fs.promises.readFile(pilFile, "utf8"));

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


    const MGP = new MerkleGroupMultipol(M, 2**16, 2, pols.length);

    const constTree = await importMerkleGroupMultipol(constantTreeFile, MGPC);

    const sResult = await starkGen(pols, polsConst, constTree, pil, {
        N: N,
        starkStruct: starkStruct
    });

    const sResultJ = stringifyFElements(F, sResult);

    const starkProof = proof2zkin(sResultJ.proof);
    const publics = sResultJ.publics;
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


function getPolsDef(pil) {
    polsDef = [];
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "cmP") {
                polsDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType
                }
            }
        }
    }
    for (let i=0; i<pil.nCommitments; i++) {
        if (!polsDef[i]) {
            throw new Error("Invalid pils commitment sequence");
        }
    }

    return polsDef;
}

function getPolsDefConst(pil) {
    polsDef = [];
    for (refName in pil.references) {
        if (pil.references.hasOwnProperty(refName)) {
            ref = pil.references[refName];
            if (ref.type == "constP") {
                polsDef[ref.id] = {
                    name: refName,
                    elementType: ref.elementType
                }
            }
        }
    }
    for (let i=0; i<pil.nConstants; i++) {
        if (!polsDef[i]) {
            throw new Error("Invalid pils constant sequence");
        }
    }

    return polsDef;
}