const fs = require("fs")
const { compile } = require("pilcom");
const starkInfoGen = require("pil-stark/src/stark/stark_info.js");
const { F1Field } = require("ffjavascript");
const { title } = require("process");
const F = new F1Field("0xFFFFFFFF00000001");

const argv = require("yargs")
    .usage("node pil_info.js <file.pil>")
    .help('h')
    .argv;


async function pilInfo(filename) {
    const pil = await compile(F, filename, null);
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
    return {pol_ids: pil.polIdentities.length, cm1_2ns: map.cm1_2ns, cm2_2ns: map.cm2_2ns, cm3_2ns: map.cm3_2ns, q_2ns: map.q_2ns};
}

async function main(){
    let res = await pilInfo(argv._[0]);
    let cmp = false;
    res.total = res.cm1_2ns + res.cm2_2ns + res.cm3_2ns + res.q_2ns;
    if (argv._[1]) {
        cmp = await pilInfo(argv._[1]);
        cmp.total = cmp.cm1_2ns + cmp.cm2_2ns + cmp.cm3_2ns + cmp.q_2ns;
    }

    console.log(`A   pol_ids:${res.pol_ids}  [cm1_2ns:${res.cm1_2ns} cm2_2ns:${res.cm2_2ns} cm3_2ns:${res.cm3_2ns} q_2ns:${res.q_2ns} tot:${res.total}]`);
    if (cmp) {
        console.log(`B   pol_ids:${cmp.pol_ids}  [cm1_2ns:${cmp.cm1_2ns} cm2_2ns:${cmp.cm2_2ns} cm3_2ns:${cmp.cm3_2ns} q_2ns:${cmp.q_2ns} tot:${cmp.total}]`);
        console.log(`A-B pol_ids:${res.pol_ids-cmp.pol_ids}  [cm1_2ns:${res.cm1_2ns - cmp.cm1_2ns} cm2_2ns:${res.cm2_2ns - cmp.cm2_2ns} cm3_2ns:${res.cm3_2ns-cmp.cm3_2ns} q_2ns:${res.q_2ns-cmp.q_2ns} tot:${res.total-cmp.total}]`);
    }
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});