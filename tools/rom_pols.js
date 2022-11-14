const { SupportedAlgorithm } = require("ethers/lib/utils");
const fs = require("fs");
const args = require("yargs")
    .usage("node $0 <rom.json>")
/*    .option('width',        { alias: 'w', describe: 'column with'})
    .option('lsize',        { alias: 'l', describe: 'line length (number of columns)'})
    .option('prefix',       { alias: 'p', describe: 'prefix before each pol, e.g. rom.program[i].'})
    .option('bigint',       { alias: 'b', describe: 'use javascript bigint: convert pols to bigint and add suffix n in numbers'})
    .option('emptycheck',   { alias: 'e', describe: 'check if pol is defined, if not value was 0'})
    .option('binary',       { alias: 'b', describe: 'generate binary constraints, (1-pol)*pol = 0'})*/
    .help('h');

const argv = args.argv;

async function main(){

    if (!argv._[0]) {
        args.showHelp();
        return;
    }
    const romJson = JSON.parse(await fs.promises.readFile(argv._[0], "utf8"));

    let pols = {};
    for (const line of romJson.program) {
        for (const key in line) {
            if (key == 'line' || key == 'fileName' || key == 'lineStr' || key == 'freeInTag' || key == 'cmdAfter' || key == 'cmdBefore') continue;
            const value = line[key];
            if (typeof pols[key] === 'undefined') {
                pols[key] = { binary: (value === 0 || value === 1), max: value, min: value};
            } else {
                pols[key].binary = pols[key].binary && (value === 0 || value === 1);
                pols[key].min = value < pols[key].min ? value : pols[key].min;
                pols[key].max = value > pols[key].max ? value : pols[key].max;
            }
        }
    }
    console.log(pols);
    console.log(Object.keys(pols).sort().join("\n"));
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});