const ejs = require('ejs');
const fs = require('fs');

function expandTerms(values)
{
    let result = [];
    if (!Array.isArray(values)) {
        values = [values];
    }
    values.forEach((value) =>  {
        result = result.concat(expandArrayRange(value));
    });
    return result;
}

function join(values, glue)
{
    return expandTerms(values).join(glue);
}

function clksel(values, clkname, sep = ' + ')
{
    clkname = clkname || 'CLK';

    let clkindex = 0;
    let _sep = '';
    let s = '';
    expandTerms(values).forEach((value) => {
        if (clkindex && !(clkindex % 8)) {
            s += '\n\t  ';
        }
        s += _sep + `${value}*${clkname}[${clkindex}]`;
        ++clkindex;
        _sep = sep;
    });
    return s;
}

function nameToIndex(name, index, config = {}, cls = '')
{
    let prefix = config[cls == '' ? 'prefix' : (cls + 'Prefix')] || '';
    let suffix = config[cls == '' ? 'suffix' : (cls + 'Suffix')] || '';

    if (name.includes('##')) {
        name = name.replace('##', i);
    }
    else if (name.endsWith('_')) {
        name += index;
    }
    else {
        name += '[' + index + ']';
    }
    // name = name.trim();

    let res;
    if (prefix && '+-*'.indexOf(name[0]) === 0) {
        res = name.substr(0, 1) + prefix + name.substr(1) + suffix;
    }
    else {
        res = prefix + name + suffix;
    }
    return res;
}

function resolveArrayIndex(value, index, constValues, config = {})
{
    const chunkSize = config.chunkSize || 16;
    if (typeof(constValues) !== 'undefined') {
        const constValue = constValues[value];
        if (typeof(constValue) !== 'undefined') {
            chunkValue = ((BigInt(constValue) >> BigInt(16 * index)) & ((1n << 16n) - 1n));
            return {value: chunkValue, constant: true};
        }
    }
    if (index >  (chunkSize - 1)) {
        return {value: 0n, constant: true};
    }
    return {value: nameToIndex(value, index, config), constant: false};
}

function valueToString(value, config = {})
{
    if (typeof value === 'bigint') {
        let constPrefix = config.constPrefix || '';
        let constSuffix = config.constSuffix || '';
        let constPad = config.constPad || 0;
        value = constPrefix + value.toString(config.constBase || 10) + constSuffix;
        return value.padEnd(constPad);
    }
    if (config.pad) {
        value = value.padEnd(config.pad);
    }
    return value;
}
function equationPols(name, products, sums, constValues, config = {})
{
    /*
                                A3     A2     A1     A0
                                B3     B2     B1     B0
                            ----------------------------
                             B0*A3  B0*A2  B0*A1  B0*A0
                      B1*A3  B1*A2  B1*A1  B1*A0
               B2*A3  B2*A2  B2*A1  B2*A0
        B3*A3  B3*A2  B3*A1  B3*A0
      -------------------------------------------------
           R6     R5     R4     R3     R2     R1     R0
    */

    let s = '';
    let tab = config.tab ?? '\t';
    let ln = config.ln ?? '\n';
    let lntab = config.lntab ?? ln+tab;
    let endEq = config.endEq ?? (';' + ln);
    let def;
    const chunkSize = config.chunkSize || 16;
    const chunkSize2 = chunkSize * 2;

    // Check if shifted products
    let shiftedProducts = [];
    products.some((prod,indo) => {
        if (prod.length >= 3 && prod[2] !== "-") {
            products.splice(indo,1);
            prod.some((x, ind) => {
                if (Object.keys(constValues).includes(x)) {
                    if (isPowOfChunk(constValues[x])) {
                        const multiple = whichPowOfChunk(constValues[x]);
                        if (i >= multiple) {
                            prod.splice(ind,1);
                            shiftedProducts.push({prod, multiple});
                            return;
                        }
                    } else {
                        throw new Error("Not implemented");
                    }
                }
            });
            return;
        }
    });

    for(i=0; i < chunkSize2; ++i) {
        def = (i ? lntab:'')+nameToIndex(name,i,config, 'def');
        // let upTo = Math.min(i, 15);
        let upTo = i;
        let oneProducts = [];
        let moreThanProduct = false;
        let defbody = '';

        // for (j=Math.max(0, i-15); j<= upTo; ++j) {
        let count = 0;
        for (j=0; j<= upTo; ++j) {
            let _prods = '';
            products.forEach((prod, index) => {
                let operation = '';
                if (prod[2]) operation = ` ${prod[2]} `;
                else if (index) operation += ' + ';
                // s += `${prod[0]}[${j}] * ${prod[1]}[${i-j}]`
                let op1 = resolveArrayIndex(prod[0], j, constValues, config);
                let op2 = resolveArrayIndex(prod[1], i-j, constValues, config);
                if ((op1.constant && op1.value === 0n) || (op2.constant && op2.value === 0n)) {
                    // nothing to do
                }
                else if (op1.constant && op2.constant) {
                    // _prods += operation + valueToString(op1.value * op2.value, config);
                    oneProducts.push(operation + valueToString(op1.value * op2.value, config));
                }
                else if (op1.constant && op1.value === 1n) {
                    oneProducts.push(operation + valueToString(op2.value, config));
                    // s += operation + op2.value;
                }
                else if ((op2.constant && op2.value === 1n)) {
                    oneProducts.push(operation + valueToString(op1.value, config));
                    // s += operation + op1.value;
                }
                else {
                    ++count;
                    _prods += operation + valueToString(op1.value, config) + ' * ' + valueToString(op2.value, config);
                }
            });
            if (_prods.length) {
                if (moreThanProduct) defbody += ' +';
                defbody += lntab+tab+'(' + _prods + ')';
                moreThanProduct = true;
            }
        }

        // Process the shifted products
        if (shiftedProducts.length) {
            shiftedProducts.forEach((shifted,index) => {
                if (i >= shifted.multiple) {
                    let upTo = i - shifted.multiple;

                    let count = 0;
                    for (j=0; j<= upTo; ++j) {
                        let _prods = '';
                        let operation = '';
                        if (shifted.prod[2]) operation = ` ${shifted.prod[2]} `;
                        else if (index) operation += ' + ';
                        // s += `${shifted.prod[0]}[${j}] * ${shifted.prod[1]}[${i-j}]`
                        let op1 = resolveArrayIndex(shifted.prod[0], j, constValues, config);
                        let op2 = resolveArrayIndex(shifted.prod[1], upTo-j, constValues, config);
                        if ((op1.constant && op1.value === 0n) || (op2.constant && op2.value === 0n)) {
                            // nothing to do
                        }
                        else if (op1.constant && op2.constant) {
                            // _prods += operation + valueToString(op1.value * op2.value, config);
                            oneProducts.push(operation + valueToString(op1.value * op2.value, config));
                        }
                        else if (op1.constant && op1.value === 1n) {
                            oneProducts.push(operation + valueToString(op2.value, config));
                            // s += operation + op2.value;
                        }
                        else if ((op2.constant && op2.value === 1n)) {
                            oneProducts.push(operation + valueToString(op1.value, config));
                            // s += operation + op1.value;
                        }
                        else {
                            ++count;
                            _prods += operation + valueToString(op1.value, config) + ' * ' + valueToString(op2.value, config);
                        }
                        if (_prods.length) {
                            if (moreThanProduct) defbody += ' +';
                            defbody += lntab+tab+'(' + _prods + ')';
                            moreThanProduct = true;
                        }
                    }
                }
            });
        }

        let _sums = '';
        count += oneProducts.length;
        oneProducts.forEach((sum) => {
            _sums += ` ${sum.substr(0,1)} `+ sum;
            empty = false;
        });

        if (i < chunkSize) {
            sums.forEach((sum) => {
                if (!sum.startsWith('+') && !sum.startsWith('-')) {
                    sum = '+'+sum;
                }
                // s += ` ${sum.substr(0,1)} ${sum.substr(1)}[${i}]`;
                let op = resolveArrayIndex(sum.substr(1), i, constValues, config);
                if (!op.constant || op.value !== 0n) {
                    ++count;
                    _sums += ` ${sum.substr(0,1)} `+ valueToString(op.value, config);
                }
                empty = false;
            });
        }
        if (_sums.length) {
            defbody += lntab+tab+_sums;
        }
        // remove + when is first operation (+ something == something)
        defbody = defbody.replace(/^\s*\+/,x => x.slice(0,-1));
        if (count === 1) defbody = ' '+defbody.trim();
        s += def + (defbody.length ? defbody : (lntab + tab + valueToString(0n, config))) + endEq;
    }
    return s;

    function isPowOfChunk(value) {
        return value % 2n**BigInt(chunkSize) === 0n;
    }
    function whichPowOfChunk(value) {
        const base = 2n**BigInt(chunkSize);

        let result = 0;
        while (value % base === 0n) {
            value /= base;
            ++result;
        }
        return result;
    }
}

function latch (values, clkname)
{
    clkname = clkname || 'ck0';
    let res = '';
    let indent = '';
    expandTerms(values).forEach((value) => {
        res += `${indent}${value}' * (1-${clkname}) = ${value} * (1-${clkname});\n`;
        indent = '\t';
    });
    return res;
}

//     sel_eq0*(1-sel_eq0) = 0;
function binary (values)
{
    let res = '';
    let indent = '';
    expandTerms(values).forEach((value) => {
        res += `${indent}${value} * (1-${value}) = 0;\n`;
        indent = '\t';
    });
    return res;
}


function decomposeStrEquation(equation)
{
    const regex = /\s*((?<id>[a-zA-Z_][a-zA-Z_0-9]*)|(?<op>[\*\-\+]))\s*/gm;

    let previousLastIndex = 0;
    let previousLastOpIndex = 0;
    let lastIdToken = false;
    let tokens = [];
    while ((m = regex.exec(equation)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (previousLastIndex !== m.index) {
            console.log('ERROR: found strange token on '+previousLastIndex+': "'+equation.substring(previousLastIndex, m.index)+'"');
            return false;
        }

        if (m.groups.id) {
            if (lastIdToken) {
                console.log('ERROR: found more than one identifier on '+previousLastOpIndex+': "'+equation.substring(previousLastOpIndex, regex.lastIndex).trim()+'"');
                return false;
            }
            if (!tokens.length) {
                tokens.push({op: '+'});
            }
            tokens.push({id: m.groups.id});
        }
        if (m.groups.op) {
            if (!lastIdToken) {
                console.log('ERROR: found more than one operator on '+previousLastOpIndex+': "'+equation.substring(previousLastOpIndex, regex.lastIndex).trim()+'"');
                return false;
            }
            previousLastOpIndex = m.index;
            tokens.push({op: m.groups.op});
        }
        lastIdToken = m.groups.id ? m.groups.id : false;

        previousLastIndex = regex.lastIndex;
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
    }
    if (previousLastIndex !== equation.length) {
        console.log('ERROR: found strange token at end: "'+equation.substring(previousLastIndex)+'"');
        return false;
    }
    let prods = [];
    let sums = [];
    for(let i = 0; i<(tokens.length-1); ++i) {
        if (tokens[i+2] && tokens[i+2].op === '*') {
            if (tokens[i+4] && tokens[i+4].op === '*') {
                value = [tokens[i+1].id, tokens[i+3].id, tokens[i+5].id];
            } else {
                value = [tokens[i+1].id, tokens[i+3].id];
            }
            if (tokens[i].op === '-') value.push(tokens[i].op);
            prods.push(value);
            i += 3;
        }
        else {
            value = tokens[i+1].id;
            if (tokens[i].op === '-') value = '-' + value;
            sums.push(value);
            i += 1;
        }
    }
    return [prods, sums];
}

function equation(name, value, constValues, config = {})
{
    let eq = decomposeStrEquation(value);
    if (eq === false) {
        console.log('ERROR decoding equation '+value);
        return;
    }

    return equationPols(name, eq[0], eq[1], constValues, config);
}

function expandArrayRange (value) {
    const regex = /\[([0-9]+)\.\.([0-9]+)\]/gm;

    let m = regex.exec(value);

    if (m !== null) {
        let result = [];
        let fromIndex = parseInt(m[1]);
        let toIndex = parseInt(m[2]);
        if (fromIndex != toIndex) {
            let index = fromIndex;
            const delta = fromIndex < toIndex ? 1:-1;
            while (true) {
                let name = nameToIndex(value.substring(0, m.index), index);
                result.push(name + value.substring(m.index + m[0].length));
                if (index === toIndex) break;
                index += delta;
            }
        }
        return result;
    }
    return [value];
}

function generatePilFromTemplate(pilTemplate) {
    return ejs.render(pilTemplate, {
        equation: equation,
        latch: latch,
        clksel: clksel,
        binary: binary,
        join: join,
        expandTerms: expandTerms
      });
}


function generatePilHelpers(input, output, lang)
{
    if (input.includes('.ejs.pil')) {
        if (!lang) {
            lang = (output.endsWith('.cpp') || output.endsWith('.c')||output.endsWith('.cc')||output.endsWith('.hpp')||output.endsWith('.h')) ? 'cpp':'js';
        }
        const equations = extractPilEquations(input);
        if (equations === false) {
            console.log(`ERROR processing pil template ${input}`)
            process.exit(-1);
        }
        equations.forEach((item) => {
            let code = generateCode(item.equation, item.constants, item.name, item.config, lang);
            const codeFilename = output.replace('##', item.name);
            console.log(`generating file ${codeFilename} ...`);
            fs.writeFileSync(codeFilename, code);
        });
    }
}


function extractPilEquations(pil)
{
    const pilprogram = fs.readFileSync(pil, {encoding:'utf8', flag:'r'});

    let equations = [];
    const equationNameRegExp = /(?<name>\w*[a-zA-Z0-9])_##/;
    ejs.render(pilprogram, {
        equation: (prefix, equation, constants, config) => {
            let data = {prefix, equation, constants, config};
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

function generateCode(equation, constants, name, config, lang) {

    let info = 'code generated with arith_eq_gen.js\nequation: '+equation+'\n';
    Object.keys(constants).forEach((key) => {
        info += '\n'+key+'=0x'+constants[key].toString(16);
    });

    switch (lang) {
        case 'js':
            return generateJavaScript(equation, constants, info, config);
            break;

        case 'cpp':
            return generateCpp(equation, constants, info, config, name);
            break;
    }
    return false;
}

function generateJavaScript(eq, constants, info, config) {
    let jsConfig = {...config,
        prefix: 'p.',
        suffix: '[_o]',
        endEq: ');\n',
        constPrefix: '0x',
        constSuffix: 'n',
        constBase: 16,
        constPad: 8,
        lntab: '\n\t\t',
        pad: 12
    };
    let startEq = 'case ##: return (';

    code = '/*\n* '+info.split('\n').join('\n* ')+'\n*/\n\n';
    code += 'module.exports.calculate = function (p, step, _o)\n{\n\tswitch(step) {\n\t\t';
    code += equation(startEq, eq, constants, jsConfig);
    code += '\t}\n\treturn 0n;\n}\n';
    return code;
}

function generateCpp(eq, constants, info, config, name) {
    let cppConfig = {...config,
        prefix: '(int64_t)fr.toU64(p.',
        suffix: '[_o])',
        endEq: ');\n',
        constPrefix: '0x',
        constBase: 16,
        constPad: 8,
        pad: 12
    };
    let startEq = '\tcase ##: \n\t\treturn (';
    code = '/* '+info.split('\n').join('\n* ')+'\n*/\n\n';
    code += '#include <stdint.h>\n';
    code += '#include "definitions.hpp"\n';
    code += '#include "sm/pols_generated/commit_pols.hpp"\n';
    code += '#include "goldilocks_base_field.hpp"\n\n';
    code += 'USING_PROVER_FORK_NAMESPACE;\n\n'

    // code += 'typedef struct { uint64_t *x1[16]; uint64_t *y1[16]; uint64_t *x2[16]; uint64_t *y2[16]; uint64_t *x3[16]; uint64_t *y3[16]; uint64_t *s[16]; uint64_t *q0[16]; uint64_t *q1[16]; uint64_t *q2[16]; } ArithPols;\n';
    name = name || 'arithEqStep';

    code += `int64_t ${name} (Goldilocks &fr, ArithCommitPols &p, uint64_t step, uint64_t _o)\n{\n\tswitch(step) {\n\t`;
    code += equation(startEq, eq, constants, cppConfig);
    code += '\t}\n\treturn 0;\n}\n';
    return code;
}

module.exports = {
    equation: equation,
    latch: latch,
    clksel: clksel,
    binary: binary,
    join: join,
    expandTerms: expandTerms,
    generatePilFromTemplate: generatePilFromTemplate,
    generatePilHelpers: generatePilHelpers,
    decomposeStrEquation,
    extractPilEquations
};