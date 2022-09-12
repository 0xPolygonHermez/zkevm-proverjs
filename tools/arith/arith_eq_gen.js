const fs = require('fs');
const ejs = require('ejs');
const pilTools = require(__dirname + '/pilTools');
const yargs = require("yargs")
    .usage('arith_eq_jsgen [<equation>|<filename.ejs.pil>] -o <outputfile> -c <constant>=<value> -l [cpp|js]')
    .option('o', { alias: 'output', requiresArg: true })
    .option('c', { alias: 'const', default: [], requiresArg: true, array: true })
    .option('l', { alias: 'lang', default: 'js', choices:['cpp', 'js']})
    .option('n', { alias: 'name'});
const argv = yargs.argv;



async function run() {

    let input = argv._[0] || false;

    if (input === false) {
        console.log('ERROR input not specified');
        yargs.showHelp();
        process.exit(-1);
    }

    const output = argv.output || ('sm_arith_##.'+argv.lang);

    let constants = {};

    argv.const.forEach((constStmt) => {
        const [name, value] = constStmt.split('=');
        if (typeof value === 'undefined') {
            console.log(`ERROR value of constant ${name} not specified`);
            process.exit(1);
        }
        constants[name] = BigInt(value);
    });
    pilTools.generatePilHelpers(input, output);
}


run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
