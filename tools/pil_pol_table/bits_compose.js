const args = require("yargs")
    .usage("node $0 <pols> [-w <width>] [-l <lineSize>] [-p <prefix>] [-B] [-b] [-e]")
    .option('width',        { alias: 'w', describe: 'column with'})
    .option('lsize',        { alias: 'l', describe: 'line length (number of columns)'})
    .option('prefix',       { alias: 'p', describe: 'prefix before each pol, e.g. rom.program[i].'})
    .option('bigint',       { alias: 'B', describe: 'use javascript bigint: convert pols to bigint and add suffix n in numbers'})
    .option('emptycheck',   { alias: 'e', describe: 'check if pol is defined, if not value was 0'})
    .option('binary',       { alias: 'b', describe: 'generate binary constraints, (1-pol)*pol = 0'})
    .help('h');

const argv = args.argv;

async function main(){

    if (!argv._[0]) {
        args.showHelp();
        return;
    }
    const pols = argv._[0].split(',').map(x => x.trim());

    const maxLength = Math.max(...(pols.map(x => x.length)));
    let defaultWidth = maxLength + 11;
    let defaultLSize = 8;
    const prefix = typeof(argv.prefix) === "string" ?  argv.prefix : "";
    const bigint = argv.bigint ? true : false;
    const binary = argv.binary ? true : false;
    const emptyCheck = argv.emptycheck ? true : false;
    defaultWidth += prefix.length;
    if (bigint) defaultWidth += 8;
    if (emptyCheck) defaultWidth += 11 + (bigint ? 1:0) + prefix.length + 15;

    while (defaultLSize > 1 && (defaultLSize * defaultWidth) > 132) {
        defaultLSize /= 2;
    }
    const width = typeof(argv.width) === "number" ?  argv.width : defaultWidth;
    const lsize = typeof(argv.lsize) === "number" ?  argv.lsize : defaultLSize;

    let content = "";
    let bit = 0;
    const numberSuffix = bigint ? 'n':'';
    const numberWidth = bigint ? 7:5;
    let polref, expr, polcontent;
    for (let index = 0; index < pols.length; ++index) {
        const pol = pols[index];
        if (bit && (bit % lsize) == 0) content = content.trimEnd() + "\n";
        content += (bit > 0 ? "+ ": "  ");
        polref = prefix+pol;
        if (bigint) expr = `BigInt(${polref})`;
        else expr = polref;
        polcontent = `2${numberSuffix}**${bit}${numberSuffix}`.padEnd(numberWidth) +' * '+expr;
        if (emptyCheck) {
            polcontent = `(${polref} ? (${polcontent}) : 0${numberSuffix})`;
        }
        content += polcontent.padEnd(index + 1 < pols.length ? width:0);
        ++bit;
    }
    content += ";\n\n";
    if (binary) {
        for (const pol of pols) {
            content += `(1 - ${pol}) * ${pol} = 0;\n`
        }
    }
    console.log(content);
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});