const version = require("../package").version;
const fs = require("fs");
const { genFinalSetup } = require("../recursive/genFinal");
const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const argv = require("yargs")
    .version(version)
    .usage("node main_genFinalSetup.js -v <basic_verification_keys.json> -s starkinfo.json")
    .alias("v", "verkey")
    .alias("s", "starkinfo")
    .string("builddir")
    .string("verifierName")
    .argv;

async function run() {

    const buildDir = argv.builddir ? argv.builddir.trim() : "tmp";
    
    const starkInfoFile = typeof (argv.starkinfo) === "string" ? argv.starkinfo.trim() : "mycircuit.starkinfo.json";
    const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "mycircuit.verkey.json";
    
    const starkInfo = JSON.parse(await fs.promises.readFile(starkInfoFile, "utf8"));
    const verkey = JSONbig.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    const constRoot = verkey.constRoot;

    let verifierName = argv.verifierName;

    if(!verifierName) verifierName = "recursivef";

    await genFinalSetup(constRoot, verifierName, starkInfo, buildDir);
    
    console.log("file Generated Correctly");

}
run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
