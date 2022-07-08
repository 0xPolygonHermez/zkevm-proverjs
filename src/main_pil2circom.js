const fs = require("fs");
const version = require("../package").version;

const pil2circom = require("./pil2circom.js")
const { unstringifyFElements } = require("ffjavascript").utils;
const buildPoseidon = require("circomlibjs").buildPoseidon;

const argv = require("yargs")
    .version(version)
    .usage("node main_pil2circom.js .o <verifier.circom> -p <pil.json> -v <verification_key.json>")
    .alias("p", "pil")
    .alias("v", "verkey")
    .alias("o", "output")
    .argv;

async function run() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : "main.pil.json";
    const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "verification_key.json";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "verifier.circom";

    const pil = JSON.parse(await fs.promises.readFile(pilFile, "utf8"));
    const verKeyJ = JSON.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    const verKey = unstringifyFElements(F, verKeyJ);
    const template = await fs.promises.readFile("./circuits/starkval.circom.ejs", "utf8");

    const verifier = await pil2circom(template, pil, verKey);

    await fs.promises.writeFile(outputFile, verifier, "utf8");

    console.log("file Generated Correctly");

}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

