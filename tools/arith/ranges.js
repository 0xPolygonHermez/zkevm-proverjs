const path = require('path');
const pilTools = require(__dirname + '/pilTools');
const arithEqPath = path.join(__dirname, '/../../src/sm/sm_arith/');
const F1Field = require("ffjavascript").F1Field;

const max256bits = (2n ** 256n)-1n;

const limits = {
    x1: [0n, max256bits],
    y1: [0n, max256bits],
    x2: [0n, max256bits],
    y2: [0n, max256bits],
    x3: [0n, max256bits],
    y3: [0n, max256bits],
    s: [0n, max256bits],
    q0: [0n,  (2n ** 261n)-1n],
    q1: [0n,  (2n ** 261n)-1n],
    q2: [0n,  (2n ** 261n)-1n],
    carry: [-(2n ** 22n)+1n, (2n ** 22n)-1n]
}
const qs = ['q0', 'q1', 'q2'];

function log2 (value)
{
    let bits = 1;
    let limit = 2n;
    let absvalue = value < 0n ? -value:value;
    while (absvalue >= limit ) {
        ++bits;
        limit=limit * 2n;
    }
    return bits;
}

function index2aindex (index, lengths) {
    let res = lengths.map(x => 0);
    let ires = 0;
    while (index != 0) {
        if (ires >= lengths.length) {
            return false;
        }
        res[ires] = index % lengths[ires];
        index = Math.floor(index / lengths[ires]);
        ++ires;
    }
    return res;
}

function valueToChunks(value, chunks = 16, chunkSize = 2n**16n) {
    let res = new Array(chunks).fill(0n);
    let ires = 0;
    chunkSize = BigInt(chunkSize);
    while (value > 0) {
        if (ires >= chunks.length) {
            throw new Error(`invalid value ${value} on ${ires}th chunk`);
        }
        res[ires] = value % chunkSize;
        value = value / chunkSize;
        ++ires;
    }
    return res;
}

function evaluateProdSums(prods, sums, values) {
    let res = 0n;

    for (const prod of prods) {
        const term1 = prod[0];
        const term2 = prod[1];
        const negative = (prod[2] ?? '') === '-';
        const value1 = values[term1];
        const value2 = values[term2];
        // console.log([term1, term2, value1, value2, values]);
        if (negative) res = res - (value1 * value2);
        else res = res + (value1 * value2);
    }
    for (const sum of sums) {
        const negative = sum.at(0) === '-';
        const _sum = negative ? sum.slice(1):sum;
        const value1 = '0123456789'.includes(_sum.at(0)) ? BigInt(_sum):values[_sum];
        if (negative) res = res - value1;
        else res = res + value1;
    }
    return res;
}

function calculateLimits(limits, qs)
{
    const equations = pilTools.extractPilEquations(__dirname+'/arith.ejs.pil');
    const cbits = limits['carry'].map(x => log2(x));

    let tdata = [[],[],[],[],[]];
    for (let eqIndex = 0; eqIndex < equations.length; ++eqIndex) {
        let eqInfo = equations[eqIndex];

        // load equation JS lib
        const calculate = require(arithEqPath + `sm_arith_${eqInfo.name}.js`).calculate;

        const [prods, sums] = pilTools.decomposeStrEquation(eqInfo.equation);
        eqInfo.prods = prods;
        eqInfo.sums = sums;

        // extract terms, remove signs, numbers, constants and repeated terms
        eqInfo.terms = [...(prods.reduce((values, value) => [...values,...value], [])),...sums]
                .map(x => x.startsWith('-') ? x.slice(1):x)
                .filter((x,index,_x) => x !== '' && typeof eqInfo.constants[x] === 'undefined' && +x !== +x &&  _x.indexOf(x) === index);

        let lengths = eqInfo.terms.map(x => limits[x].length);
        let stats = [];
        let terms = eqInfo.terms.slice();

        // obtain information about q term
        let qterm = terms.find(x => qs.includes(x)) ?? false;
        let qsign = false;
        if (qterm !== false) {
            for (const prod of prods) {
                if (prod.includes(qterm)) {
                    qsign = (prod.slice(-1)[0].slice(0,1) === '-') ? '-':'+';
                    break;
                }
            }
            if (qsign === false) {
                if (sums.includes(qterm)) {
                    qsign = '+';
                } else if (sums.includes('-'+qterm)) {
                    qsign = '-';
                }
            }
            eqInfo.q = qsign+qterm;
            eqInfo.qterm = qterm;
            eqInfo.qsign = qsign;
        }
        for (let step = 0; step < 6; ++step) {
            // step 0 - natural limits
            // step 1 - map carry limits
            // step 2 - calculate q last chunk
            // step 3 - calculate q last chunk (assume inputs values alias free)
            // step 4 - calculate offset
            // step 5 - calculate q last chunk with calculated offset
            
            let sts = step < 2 ?  { carry: {min: false, max: false}, eq: {min: false, max: false}, step } :
                                  { eqtot: {min: false, max: false, _min: false, _max: false}, q: {min: false, max: false, bits: false} };
            if (step > 1 && qterm == false) break;
            stats.push(sts);

            let index = 0;
            let res;
            if (step < 2) {
                while ((res = index2aindex(index, lengths)) !== false) {      
                    // load on pols chunk values specified in res (array of limits index)          
                    let pols = terms.reduce((_pols, term, index) =>  { _pols[term] = valueToChunks(limits[term][res[index]]).map(x => [x]); return _pols;}, {});
                    let carry = 0n;
                    for (let clk = 0; clk < 32; ++clk) {               
                        let eqv = calculate(pols, clk, 0);
                        if (step === 1) {
                            // assume worse case of carry
                            carry = eqv > 0n ? limits.carry[1] : limits.carry[0];
                        }
                        eqv += carry;
                        carry = eqv / 2n**16n;
                        if (sts.eq.min === false || sts.eq.min > eqv) sts.eq.min = eqv;
                        if (sts.eq.max === false || sts.eq.max < eqv) sts.eq.max = eqv;
                        if (sts.carry.min === false || sts.carry.min > carry) sts.carry.min = carry;
                        if (sts.carry.max === false || sts.carry.max < carry) sts.carry.max = carry;
                    }
                    ++index;
                } 
            } else {
                let plimit = step !== 3 || typeof eqInfo.constants.p === 'undefined' ? false : (eqInfo.constants.p - 1n);
                while ((res = index2aindex(index, lengths)) !== false) {                
                    // load on pols values specified in res (array of limits index)          
                    let values = terms.reduce((_values, term, index) =>  { 
                            const limit = limits[term][res[index]]; 
                            _values[term] = (plimit === false || plimit > limit)? limit:plimit; 
                            return _values;
                        }, {});

                    // setting qterm to zero.
                    values[qterm] = 0n;

                    // adding constants as variables
                    let valuesAndConstants = {...values, ...eqInfo.constants};
                    if (step === 4) {
                        valuesAndConstants.p = 0n;
                        valuesAndConstants.offset = 0n;
                    }
                    if (step === 5) {
                        valuesAndConstants.offset = eqInfo.offset < 0n ? -eqInfo.offset : eqInfo.offset;
                    }
                    const eqtot = evaluateProdSums(step === 5 ? eqInfo._prods : eqInfo.prods, eqInfo.sums, valuesAndConstants);

                    if (sts.eqtot.min === false || sts.eqtot.min > eqtot) { sts.eqtot.min = eqtot; sts.eqtot._min = res; sts.eqtot.minbits = log2(sts.eqtot.min); }
                    if (sts.eqtot.max === false || sts.eqtot.max < eqtot) { sts.eqtot.max = eqtot; sts.eqtot._max = res; sts.eqtot.maxbits = log2(sts.eqtot.max); }
                    ++index;
                }
                if (step === 4) {
                    sts.q.max = sts.eqtot.max / eqInfo.constants.p;                
                    sts.q.min = sts.eqtot.min / eqInfo.constants.p;
                    sts.q.maxSign = sts.q.max < 0n ? '-':'+';
                    sts.q.minSign = sts.q.min < 0n ? '-':'+';
                    const maxabs = sts.q.max < 0n ? -sts.q.max:sts.q.max;
                    const minabs = sts.q.min < 0n ? -sts.q.min:sts.q.min;
                    if (sts.q.maxSign === sts.q.minSign) {
                        sts.offset = 0n;
                        sts.offsetLabel = '0';
                        sts.offsetSign = sts.q.maxSign;
                    } else if (maxabs > minabs) {
                        sts.offset = -sts.q.max;
                        sts.offsetSign = sts.offset < 0n ? '-':'+';
                    } else {
                        sts.offset = -sts.q.min;
                        sts.offsetSign = sts.offset < 0n ? '-':'+';
                    }
                    eqInfo.offset = sts.offset;
                    let _prods = [];
                    if (sts.offset < 0n) {
                        _prods = [['p', 'offset', '-'], ['p', qterm]];
                    }
                    else {
                        _prods = [['p', 'offset'], ['p', qterm, '-']];
                    }
                    eqInfo._prods = [...eqInfo.prods.filter(x => x.includes('offset') === false && x.includes(qterm) === false),..._prods];
                } else {
                    sts.q.max = sts.eqtot.max / eqInfo.constants.p;                
                    sts.q.min = sts.eqtot.min / eqInfo.constants.p;
                    sts.q.bits = Math.max(log2(sts.q.max), log2(sts.q.min));
                    sts.q15bits = Math.max(sts.q.bits-240, 16);
                }
            }
        }
        tdata[0].push([eqInfo.name, eqInfo.equation, eqInfo.q, 
                       eqInfo.constants.offset ? '0x' + eqInfo.constants.offset.toString(16):'',
                       eqInfo.constants.offset ? log2(eqInfo.constants.offset):'',
                       eqInfo.constants.p ? '0x' + eqInfo.constants.p.toString(16):'',
                       eqInfo.constants.p ? log2(eqInfo.constants.p):'']);

        tdata[1].push([eqInfo.name,
                       stats[0].eq.min, log2, stats[0].eq.max, log2, 
                       stats[0].carry.min, log2, stats[0].carry.max, log2,
                       stats[1].eq.min, log2, stats[1].eq.max, log2]);

        
        if (stats[2]) {
            tdata[2].push([eqInfo.name,
                           log2(stats[2].eqtot.min), log2(stats[2].eqtot.max),
                           log2(stats[2].q.min), log2(stats[2].q.max), stats[2].q15bits,
                           log2(stats[3].eqtot.min), log2(stats[3].eqtot.max),
                           log2(stats[3].q.min), log2(stats[3].q.max), stats[3].q15bits]);
        }
        if (stats[4]) {
            tdata[3].push([eqInfo.name,
                           stats[4].q.minSign+stats[4].q.maxSign, 
                           stats[4].offsetSign+'0x'+(stats[4].offset < 0n ? -stats[4].offset:stats[4].offset).toString(16), 
                           log2(stats[4].offset),
                           log2(stats[5].eqtot.min), log2(stats[5].eqtot.max),
                           log2(stats[5].q.min), log2(stats[5].q.max), stats[5].q15bits]);
        }
                                 
    }
    const titles = ['id', 'equation', 'q', 'eq.min','b','eq.max','b','carry.min','b','carry.max','b',`eq.min+c${cbits[0]}`,'b',`eq.max+c${cbits[1]}`,'b',
                    'tmin.b','tmax.b','qmin.b','qmax.b','q15.b', 'tpmin.b','tpmax.b','qpmin.b','qpmax.b','qp15.b',];
    console.log("\n\x1b[36m======================== General Information =========================\x1b[0m\n");
    drawTable(tdata[0], ['id', 'equation', 'q', 'offset', '#b', 'prime', '#b'], '┃││┃┆┃┆┃');
    console.log("\n\x1b[36m================== Equation Chunk and Carry limits ===================\x1b[0m\n");
    drawTable(tdata[1], ['id', 'eq.min','#b','eq.max','#b','carry.min','#b','carry.max','#b',`eq.min+c${cbits[0]}`,'b',`eq.max+c${cbits[1]}`,'b'], '┃┃┆│┆┃┆│┆┃┆│┆┃');
    console.log("\n\x1b[36m=============== Q analysis with full limits and prime ================\x1b[0m\n");
    drawTable(tdata[2], ['id', 'tmin.b','tmax.b','qmin.b','qmax.b','q15.b', 'tpmin.b','tpmax.b','qpmin.b','qpmax.b','qp15.b'], '┃┃┆│┆┆┃┆│┆┆┃');
    console.log("\n\x1b[36m========================= Offset calculation =========================\x1b[0m\n");
    drawTable(tdata[3], ['id', 'mm','offset','b', 'tmin.b*','tmax.b*','qmin.b*','qmax.b*','q15.b*'], '┃┃│┆┃│┃││┃');
}


function drawTable(rows, titles, separators) {
    let cols = titles.length;
    let widths = new Array(cols).fill(0);
    let pcol = false;
    let mins = new Array(cols).fill(false);
    let maxs = new Array(cols).fill(false);
    let _rows = rows.map(row => row.map(col => pcol = (typeof col === 'function') ? col(pcol):col));
    _rows.forEach(row => row.forEach((value, index) => {
            if (typeof value === 'number' || typeof value === 'bigint') {
                if (mins[index] === false || mins[index] > value) mins[index] = value;
                if (maxs[index] === false || maxs[index] < value) maxs[index] = value;
            }
            const len = (''+(value ?? '')).length;
            if (Math.abs(widths[index]) < len) {
                widths[index] = (typeof(value) === 'string' && value.startsWith('0x') && value.startsWith('-0x') && value.startsWith('+0x'))  ? len : -len;
            }
        }));
    titles.forEach((value, index) => {if (Math.abs(widths[index]) < value.length) widths[index] = widths[index] < 0 ? -value.length : value.length;});
    const rseps = titles.map((x,index) => ''.padStart(Math.abs(widths[index]),'─'));
    for (const row of [titles, rseps,..._rows]) {
        let line = '';
        for (let index = 0; index < cols; ++index) {
            let col = ''+(row[index] ?? '');
            const width = widths[index];
            col = (width > 0) ? col.padEnd(width) : col.padStart(Math.abs(width));
            if (mins[index] !== false) {
                if (maxs[index] === row[index]) col = '\x1B[32m'+col+'\x1B[0m';
                else if (mins[index] === row[index]) col = '\x1B[34m'+col+'\x1B[0m';
            }
            line += (separators[index]??'|')+''+col;
        }
        line += (separators[cols]??'|');
        console.log(line);
    }
}

calculateLimits(limits, qs);