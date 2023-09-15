const fs = require("fs")
const { compile } = require("pilcom");
const starkInfoGen = require("../../node_modules/pil-stark/src/stark/stark_info.js");
const { F1Field } = require("ffjavascript");
const { title } = require("process");
const F = new F1Field("0xFFFFFFFF00000001");

const argv = require("yargs")
    .usage("node pil_pol_table.js")
    .help('h')
    .argv;


async function pilInfo(pilcode) {
    const pil = await compile(F, pilcode, null,{ compileFromString: true });
    const pilDeg = Object.values(pil.references)[0].polDeg;
    const pilBits = Math.log2(pilDeg);

    const starkStruct = {
        nBits: pilBits,
        nBitsExt: pilBits+1,
        nQueries: 2,
        verificationHashType: 'GL',
        steps: [ {nBits: pilBits+1}, {nBits: pilBits-4} ]
    }
    const info = starkInfoGen(pil, starkStruct);
    const map = info.mapSectionsN;
    return {cm1_2ns: map.cm1_2ns, cm2_2ns: map.cm2_2ns, cm3_2ns: map.cm3_2ns, q_2ns: map.q_2ns, code: pilcode,
        reference: pilcode.trim().split("\n").pop().trim()};
}

async function main(){
    let table = [];

    table.push({title: '1 const + 2 commit + 2 constraints', ...await pilInfo(
        `namespace Global(2**16);
        pol constant L1;
        pol commit l1;
        pol commit l2;
        l1' = 2 * l1 + L1;
        l2' = 2 * l2 + l1 + L1;
    `)});
    table.push({title: '1 const + 3 commit + 3 constraints', ...await pilInfo(
        `namespace Global(2**16);
        pol constant L1;
        pol commit l1;
        pol commit l2;
        pol commit l3;
        l1' = l1 + L1;
        l2' = 2 * l2 + l1 + L1;
        l3' = 4 * l3 + 2 * l2 + l1 + L1;
    `)});
    const codeBase = `namespace Global(2**16);
        pol constant L1;
        pol commit l1;
        pol commit l2;
        pol commit l3;
        l1' = l1 + L1;
        l2' = 2 * l2 + l1 + L1;
        l3' = l3 * l2 + l1 + L1;
    `;
    table.push({title: 'BASE = 1 const + 3 commit + 3 constraints', ...await pilInfo(codeBase)});
    table.push({title: '1 const + 3 commit + 1 inter + 3 constraints', ...await pilInfo(
        `namespace Global(2**16);
        pol constant L1;
        pol commit l1;
        pol commit l2;
        pol commit l3;
        l1' = l1 + L1;
        l2' = 2 * l2 + l1 + L1;
        pol l3l2 = l3 * l2;
        l3' = l3l2 * l1 + L1;
    `)});
    table.push({title: 'BASE + 1 plookup (1 column)', ...await pilInfo(
        codeBase +`
        l1 in L1;
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns)', ...await pilInfo(
        codeBase +`
        {l1, l2} in {L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (3 columns)', ...await pilInfo(
        codeBase +`
        {l1, l2, l3} in {L1, L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (1 column + leftsel)', ...await pilInfo(
        codeBase +`
        l1 {l1} in {L1};
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns + leftsel)', ...await pilInfo(
        codeBase +`
        l1 {l1, l2} in {L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns + leftsel *)', ...await pilInfo(
        codeBase +`
        l3 * L1 {l1, l2} in {L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns + leftsel * + column *)', ...await pilInfo(
        codeBase +`
        l3 * L1 {l1 * l2, l2} in {L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (1 column + rightsel)', ...await pilInfo(
        codeBase +`
        {l1} in l3 {L1};
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns + rightsel)', ...await pilInfo(
        codeBase +`
        {l1, l2} in l3 {L1, L1};
    `)});
    table.push({title: 'BASE + 1 plookup (1 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1} in l2 {L1};
    `)});
    table.push({title: 'BASE + 1 plookup (2 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1, l2} in l2 {L1, L1};
    `)});
    table.push({title: 'BASE + 2 plookup (2 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1, l2} in l2 {L1, L1};
        l1 {l2, l3} in l3 {L1, L1};
    `)});

    table.push({title: 'BASE + 1 permutation check (1 column)', ...await pilInfo(
        codeBase +`
        l1 is L1;
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns)', ...await pilInfo(
        codeBase +`
        {l1, l2} is {L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (3 columns)', ...await pilInfo(
        codeBase +`
        {l1, l2, l3} is {L1, L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns + leftsel)', ...await pilInfo(
        codeBase +`
        l1 {l1, l2} is {L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns + leftsel *)', ...await pilInfo(
        codeBase +`
        l3 * L1 {l1, l2} is {L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns + leftsel * + column *)', ...await pilInfo(
        codeBase +`
        l3 * L1 {l1 * l2, l2} is {L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns + rightsel)', ...await pilInfo(
        codeBase +`
        {l1, l2} is l3 {L1, L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (1 columns + leftprod + rightprod)', ...await pilInfo(
        codeBase +`
        pol l4=l3*l1;
        l4*l1 is l2*L1;
    `)});
    table.push({title: 'BASE + 1 permutation check (1 columns + leftsel + rightprod)', ...await pilInfo(
        codeBase +`
        l3 {l1} is l2*L1;
    `)});
    table.push({title: 'BASE + 1 permutation check (1 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1} is l2 {L1};
    `)});
    table.push({title: 'BASE + 1 permutation check (2 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1, l2} is l2 {L1, L1};
    `)});
    table.push({title: 'BASE + 2 permutation check (2 columns + leftsel + rightsel)', ...await pilInfo(
        codeBase +`
        l3 {l1, l2} is l2 {L1, L1};
        l1 {l2, l3} is l3 {L1, L1};
    `)});

    const titleWidth = Math.max(...table.map((x) => x.title.length));
    const referenceWidth = Math.max(...table.map((x) => x.reference.length));
    console.log(['title'.padEnd(titleWidth), 'reference line'.padEnd(referenceWidth),
        'cm1_2ns'.padStart(7), 'cm2_2ns'.padStart(7),
        'cm3_2ns'.padStart(7), 'q_2ns'.padStart(7),
        'total'.padStart(7)].join('|'));
    for (const row of table) {
        console.log([row.title.padEnd(titleWidth), row.reference.padEnd(referenceWidth),
            row.cm1_2ns.toString().padStart(7), row.cm2_2ns.toString().padStart(7),
            row.cm3_2ns.toString().padStart(7), row.q_2ns.toString().padStart(7),
            (row.cm1_2ns+row.cm2_2ns+row.cm3_2ns+row.q_2ns).toString().padStart(7)].join('|'));
    }
    // console.log(table);
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
