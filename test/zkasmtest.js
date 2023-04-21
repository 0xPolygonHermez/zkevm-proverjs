const chai = require("chai");
const assert = chai.assert;
const fs = require("fs");
const path = require("path");
const { compile } = require("pilcom");
const { F1Field } = require("ffjavascript");
const { verifyZkasm } = require("./verify_zkasm");
const { cwd } = require("process");

const argv = require("yargs")
    .usage("node zkasmtest filename [-p <pil>] [-P <pilconfig>]")
    .help('h')
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .argv;

async function main(){
    let Fr = new F1Field("0xFFFFFFFF00000001");
    let zkasmFile = false;

    if (argv._.length == 0) {
        console.log("You need to specify an zkasm source file");
        process.exit(1);
    } else if (argv._.length == 1) {
        zkasmFile = argv._[0];
    } else  {
        console.log("Only one source file at a time is permitted");
        process.exit(1);
    }

    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : (__dirname + "/../pil/main.pil");
    const pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : {};

    console.log(pilFile);

    const pil = await compile(Fr, pilFile, null, pilConfig);
    const pilDeg = Object.values(pil.references)[0].polDeg;
    console.log(pilFile);

    const fullPathZkasmFile = zkasmFile.startsWith('/') ? zkasmFile : path.join(cwd(), zkasmFile);
    console.log(`verifying ${fullPathZkasmFile} .....`);
    console.log(pilFile);

    await verifyZkasm(fullPathZkasmFile, {pilFile},
    { defines: {N: 2 ** 19},
      namespaces: ['Global', 'Main','Arith'],
      verbose: true,
      color: true,
      disableUnusedError: true},
      {
        constants: false,
//                    fastDebugExit: true,
/*        romFilename: "tmp/rom.json",
        constFilename: "tmp/constFile.bin",
        commitFilename: "tmp/commitFile.bin",
        pilJsonFilename: "tmp/main.pil.json",
        externalPilVerification: true*/
      });
    console.log('Done!');

}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
