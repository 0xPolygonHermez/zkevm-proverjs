const ejs = require('ejs');
const fs = require('fs');
const pilTools = require(__dirname+'/pilTools');
const yargs = require("yargs")
    .usage('parse <filename.ejs.pil> -o <outputfile>')
    .option('o', { alias: 'output', requiresArg: true });
const argv = yargs.argv;

async function run() {

    let input = argv._[0] || false;

    if (input === false) {
        console.log('ERROR input not specified');
        yargs.showHelp();
        process.exit(-1);
    }

    const output = argv.output || (input.substr(0, input.length - 8) + '.pil');
    const pilprogram = fs.readFileSync(input, {encoding:'utf8', flag:'r'});

    console.log(`generating PIL ${output} ...`);
    fs.writeFileSync(output, ejs.render(pilprogram, {
        equation: pilTools.equation,
        latch: pilTools.latch,
        clksel: pilTools.clksel,
        binary: pilTools.binary
      }), {encoding:'utf8'});
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});