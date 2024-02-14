const JSONbig = require('json-bigint')({ useNativeBigInt: true, alwaysParseAsBig: true });
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const version = require("../package").version;

const argv = require("yargs")
    .version(version)
    .usage("node main_genrecursive.js -v <verification_key.json> -s <starkinfo.json> -o <recursive.circom> --template=<recursive1/recursive2/final>")
    .alias("v", "verkey")
    .alias("s", "starkinfo")
    .alias("o", "output")
    .string("template")
    .argv;

async function run() {
    const templateName = argv.template;
    if(!["recursive1", "recursive2", "final"].includes(templateName)) throw new Error("Invalid template");

    const starkInfoFile = typeof(argv.starkinfo) === "string" ?  argv.starkinfo.trim() : "starkinfo.json";
    const outputFile = typeof(argv.output) === "string" ?  argv.output.trim() : "mycircuit.verifier.circom";

    const starkInfo = JSONbig.parse(await fs.promises.readFile(starkInfoFile, "utf8"));
   
    const template = await fs.promises.readFile(path.join(__dirname, "..", "recursive", `${templateName}.circom.ejs`), "utf8");

    const obj = { starkInfo };

    if(templateName === "recursive2") {
        const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "mycircuit.verkey.json";
        const verKey = JSONbig.parse(await fs.promises.readFile(verKeyFile, "utf8"));
        const constRoot = verKey.constRoot;
        obj.constRoot = constRoot;
    }

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