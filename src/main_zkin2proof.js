

const fs = require("fs");
const version = require("../package").version;
const zkin2proof = require("./proof2zkin.js").zkin2proof;


const { unstringifyFElements } = require("ffjavascript").utils;

const argv = require("yargs")
    .version(version)
    .usage("node main_zkin2proof.js <proof.json> -o <stark.json>")
    .alias("o", "output")
    .argv;

async function run() {    
    let inFile;
    if (argv._.length == 0) {
        console.log("You need to specify a input file");
        process.exit(1);
    } else if (argv._.length == 1) {
        inFile = argv._[0];
    } else  {
        console.log("Only one commit file");
        process.exit(1);
    }


    const stark = JSON.parse(await fs.promises.readFile(inFile, "utf8"));
    const outFile = typeof(argv.output) === "string" ?  argv.output.trim() : "stark.json";

    const res = zkin2proof(stark);

    await fs.promises.writeFile(outFile, JSON.stringify(res, null, 1), "utf8");

    console.log("Conversion generated correctly");


}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

