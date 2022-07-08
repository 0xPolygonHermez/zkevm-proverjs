const fs = require("fs");
const version = require("../package").version;

const buildPoseidon = require("circomlibjs").buildPoseidon;

const starkStruct = require("./starkstruct");
const starkGenBM = require("./stark_gen_bm.js");
const packMem = require("./batchmachine_packmem.js");


const argv = require("yargs")
    .version(version)
    .usage("main_starkgen -p <pil.json> -o <starkgen_bmscript.json>")
    .alias("o", "output")
    .alias("p", "pil")
    .argv;

async function run() {    
    let commitFile;

    let N;
    if (typeof(argv.N) !== "string") {
        N = 2**16;
    } else {
        N = Number(argv.N);
    }

    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : "main.pil.json";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "starkgen_bmscript.json";

    const pil = JSON.parse(await fs.promises.readFile(pilFile, "utf8"));

    const starkGenScript = starkGenBM(F, pil, {
        N: N,
        starkStruct: starkStruct
    });

    starkGenScript.output = starkGenScript.output;

    packMem(starkGenScript);

    await fs.promises.writeFile(outputFile, JSON.stringify(starkGenScript, null, 1), "utf8");

    console.log("StarkGen script generated correctly");
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});


