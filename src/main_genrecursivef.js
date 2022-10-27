const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const version = require("../package").version;

const argv = require("yargs")
    .version(version)
    .usage("node main_genrecursive.js --verkey1 <verification1_key.json> --verkey2 <verification2_key.json> -o <recursive.circom> ")
    .alias("v1", "verkey1")
    .alias("v2", "verkey2")
    .alias("o", "output")
    .argv;

async function run() {

    const verKey1File = typeof(argv.verkey1) === "string" ?  argv.verkey1.trim() : "recursive1.verkey.json";
    const verKey2File = typeof(argv.verkey2) === "string" ?  argv.verkey2.trim() : "recursive2.verkey.json";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "recursivef.circom";

    const verKey1 = JSONbig.parse(await fs.promises.readFile(verKey1File, "utf8"));
    const verKey2 = JSONbig.parse(await fs.promises.readFile(verKey2File, "utf8"));
    const constRoot1 = verKey1.constRoot;
    const constRoot2 = verKey2.constRoot;

    const template = await fs.promises.readFile(path.join(__dirname, "..", "recursive", "recursivef.circom.ejs"), "utf8");

    const obj = {
        constRoot1: constRoot1,
        constRoot2: constRoot2,
    };

    console.log(obj)

    const verifier = ejs.render(template ,  obj);

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
