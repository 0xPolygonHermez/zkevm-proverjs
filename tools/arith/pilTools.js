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

function clksel(values, clkname)
{
    clkname = clkname || 'CLK';

    let clkindex = 0;
    let sep = '';
    let s = '';
    expandTerms(values).forEach((value) => {
        if (clkindex && !(clkindex % 8)) {
            s += '\n\t  ';
        }
        s += sep + `${value}*${clkname}[${clkindex}]`;
        ++clkindex;
        sep = ' + ';
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
    name = name.trim();

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
            chunkValue = ((BigInt(constValue) >> BigInt(chunkSize * index)) & ((1n << BigInt(chunkSize)) - 1n));
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
    let tab = config.tab || '\t';
    let ln = config.ln || '\n';
    let lntab = ln+tab;
    let endEq = config.endEq || (';');
    let def;
    const chunkSize = config.chunkSize || 16;
    const chunkSize2 = chunkSize * 2;
    for(i=0; i < chunkSize2; ++i) {
        def = (i ? lntab:'')+nameToIndex(name,i,config, 'def');
        // let upTo = Math.min(i, 15);
        let upTo = i;
        let oneProducts = [];
        let moreThanProduct = false;
        let defbody = '';

        // for (j=Math.max(0, i-15); j<= upTo; ++j) {
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
                    _prods += operation + valueToString(op1.value, config) + ' * ' + valueToString(op2.value, config);
                }
            });
            if (_prods.length) {
                if (moreThanProduct) defbody += ' +';
                defbody += lntab+tab+'(' + _prods + ')';
                moreThanProduct = true;
            }
        }
        let _sums = '';
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
                    _sums += ` ${sum.substr(0,1)} `+ valueToString(op.value, config);
                }
                empty = false;
            });
        }
        if (_sums.length) {
            defbody += lntab+tab+_sums;
        }
        if (defbody.length) {
            s += def + defbody + endEq;
        }
    }
    return s;
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
            value = [tokens[i+1].id, tokens[i+3].id];
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
        for (index = fromIndex; index <= toIndex; ++index ) {
            let name = nameToIndex(value.substring(0, m.index), index);
            result.push(name + value.substring(m.index + m[0].length));
        }
        return result;
    }
    return [value];
}

module.exports = {
    equation: equation,
    latch: latch,
    clksel: clksel,
    binary: binary
  };