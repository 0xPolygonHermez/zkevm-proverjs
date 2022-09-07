const fs = require('fs');
const ejs = require('ejs');
const { prependListener } = require('process');
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

    if (input.includes('.ejs.pil')) {
        const equations = extractPilEquations(input);
        if (equations === false) {
            console.log(`ERROR processing pil template ${input}`)
            process.exit(-1);
        }
        equations.forEach((item) => {
            let code = generateCode(item.equation, item.constants, item.name);
            const codeFilename = output.replace('##', item.name);
            console.log(`generating file ${codeFilename} ...`);
            fs.writeFileSync(codeFilename, code);
        });
    }

    let constants = {};

    argv.const.forEach((constStmt) => {
        const [name, value] = constStmt.split('=');
        if (typeof value === 'undefined') {
            console.log(`ERROR value of constant ${name} not specified`);
            process.exit(1);
        }
        constants[name] = BigInt(value);
    });
}


function extractPilEquations(pil)
{
    const pilprogram = fs.readFileSync(pil, {encoding:'utf8', flag:'r'});

    let equations = [];
    const equationNameRegExp = /(?<name>\w*[a-zA-Z0-9])_##/;
    ejs.render(pilprogram, {
        equation: (prefix, equation, constants) => {
            let data = {prefix: prefix, equation: equation, constants: constants};
            const m = equationNameRegExp.exec(prefix);
            if (m && m.groups && m.groups.name) {
                data.name = m.groups.name;
            }
            equations.push(data);
        },
        latch: () => {},
        clksel: () => {},
        binary: () => {}
    });

    return equations;
}

function generateCode(equation, constants, name) {

    let info = 'code generated with arith_eq_gen.js\nequation: '+equation+'\n';
    Object.keys(constants).forEach((key) => {
        info += '\n'+key+'=0x'+constants[key].toString(16);
    });

    switch (argv.lang) {
        case 'js':
            return generateJavaScript(equation, constants, info);
            break;

        case 'cpp':
            return generateCpp(equation, constants, info, name);
            break;
    }
    return false;
}

function generateJavaScript(equation, constants, info) {
    let config = {
        prefix: 'p.',
        suffix: '[_o]',
        endEq: ');\n',
        constPrefix: '0x',
        constSuffix: 'n',
        constBase: 16,
        constPad: 8,
        pad: 12
    };
    let startEq = 'case ##: return (';

    code = '/*\n* '+info.split('\n').join('\n* ')+'\n*/\n\n';
    code += 'module.exports.calculate = function (p, step, _o)\n{\n\tswitch(step) {\n\t';
    code += pilTools.equation(startEq, equation, constants, config);
    code += '\t}\n\treturn 0n;\n}\n';
    return code;
}

function generateCpp(equation, constants, info, name) {
    let config = {
        prefix: 'p.',
        suffix: '[_o]',
        endEq: ');\n',
        constPrefix: '0x',
        constBase: 16,
        constPad: 8,
        pad: 12
    };
    let startEq = 'case ##: \n\t\treturn (';
    code = '/* '+info.split('\n').join('\n* ')+'\n*/\n\n';
    code += '#include <stdint.h>\n\n';
    // code += 'typedef struct { uint64_t *x1[16]; uint64_t *y1[16]; uint64_t *x2[16]; uint64_t *y2[16]; uint64_t *x3[16]; uint64_t *y3[16]; uint64_t *s[16]; uint64_t *q0[16]; uint64_t *q1[16]; uint64_t *q2[16]; } ArithPols;\n';
    name = name || 'arithEqStep';

    code += `uint64_t ${name} (ArithPols &p, uint64_t step, uint64_t _o)\n{\n\tswitch(step) {\n\t`;
    code += pilTools.equation(startEq, equation, constants, config);
    code += '\t}\n\treturn 0;\n}\n';
    return code;
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
