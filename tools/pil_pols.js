const fs = require("fs")
const { compile } = require("pilcom");
const { F1Field } = require("ffjavascript");

const argv = require("yargs")
    .usage("node pil_pols.js -p <pil> -P <pilconfig>")
    .help('h')
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .argv;

async function main(){
    let Fr = new F1Field("0xFFFFFFFF00000001");
    const pilFile = typeof(argv.pil) === "string" ?  argv.pil.trim() : "pil/main.pil";
    const pilConfig = typeof(argv.pilconfig) === "string" ? JSON.parse(fs.readFileSync(argv.pilconfig.trim())) : {};

    const pil = await compile(Fr, pilFile, null, pilConfig);
    const pilDeg = Object.values(pil.references)[0].polDeg;

    let pols = {};
    for(let key in pil.references) {
        if (pil.references[key].type != 'cmP') continue;
        console.log(key);
    }
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});