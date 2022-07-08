const fs = require("fs");
const version = require("../package").version;
const { log2 } = require("./utils");

const { importMerkleGroupMultipol, importPolynomials } = require("./binfiles.js");

const Merkle = require("./merkle.js");
const MerkleGroupMultipol = require("./merkle_group_multipol.js");

const buildPoseidon = require("circomlibjs").buildPoseidon;

const starkStruct = require("./starkstruct");
const starkVerify = require("./stark_verify.js");
const zkin2proof = require("./proof2zkin.js").zkin2proof;

const { unstringifyFElements } = require("ffjavascript").utils;

const argv = require("yargs")
    .version(version)
    .usage("node main_starkverifier.js <proof.json> -p <pil.json> -v <verification_key.json>")
    .alias("p", "pil")
    .alias("v", "verkey")
    .argv;

async function run() {    
    let proofFile;
    if (argv._.length == 0) {
        console.log("You need to specify a commit file file file");
        process.exit(1);
    } else if (argv._.length == 1) {
        proofFile = argv._[0];
    } else  {
        console.log("Only one commit file at a time is permited");
        process.exit(1);
    }

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : "main.pil.json";
    const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "verification_key.json";

    const pil = JSON.parse(await fs.promises.readFile(pilFile, "utf8"));
    const verKeyJ = JSON.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    const verKey = unstringifyFElements(F, verKeyJ);
    const proofJ = JSON.parse(await fs.promises.readFile(proofFile, "utf8"));
    const proof = unstringifyFElements(F, zkin2proof(proofJ));

    const publics = {};
    for (let i=0; i<pil.publics.length; i++) {
        publics[pil.publics[i].name] = F.e(proofJ[pil.publics[i].name ]);
    }

    const res = await starkVerify(proof, publics, pil, verKey);

    if (res == true) {
        console.log("OK!");
    } else {
        console.log("INVALID!");
    }

}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

