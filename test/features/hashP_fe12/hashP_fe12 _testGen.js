const { fea2scalar, scalar2h4 } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;

const P_BN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
let values = [
    {
        A: 5577465515873305007n,
        B: 14007324077747804655n,
        C: 11970558779030694813n,
    },
    {
        A: 9837762843954570281n,
        B: 4153395419289976189n,
        C: 7779927151441415970n,
    },
    {
        A: 2744552759689415440n,
        B: 1337115138656405949n,
        C: 9187886871313117867n,
    },
    {
        A: 15461645084952528155n,
        B: 8733528093617444695n,
        C: 12153636127833478329n,
    },
    {
        A: 18106304998413187253n,
        B: 3814119453779003833n,
        C: 7339314176073733804n,
    },
    {
        A: 11840329191390687957n,
        B: 5205111179656091231n,
        C: 14426583239537851457n,
    },
    {
        A: 6106663260254473747n,
        B: 893586449247495418n,
        C: 15838802675128639739n,
    },
    {
        A: 862955712319033806n,
        B: 10409816459664194289n,
        C: 13245445728610689005n,
    },
    {
        A: 3129488072024166733n,
        B: 16481161233140243206n,
        C: 12237861380570794932n,
    },
    {
        A: 7093350386417671937n,
        B: 3693076140740075997n,
        C: 14221223565205935490n,
    },
    {
        A: 7011679908955398952n,
        B: 14624857833368269379n,
        C: 17017662845033661800n,
    },
    {
        A: 2682376436681433391n,
        B: 7552152972545485847n,
        C: 8492109890443883661n,
    },
    {
        A: 17457509138791638753n,
        B: 12783751435321420105n,
        C: 6612491131377892329n,
    },
    {
        A: 12909716422603032835n,
        B: 14906939617995489268n,
        C: 10135779021704049846n,
    },
    {
        A: 7811326627859943558n,
        B: 15812289594881097455n,
        C: 15347073866011479122n,
    },
];

async function test_generator() {

    const poseidon = await buildPoseidon();
    const Fr = poseidon.F;

    const INS = 'HASHP_FE12';
    for (const value of values) {
        const [A,B,C] = [scalar2h4(value.A), scalar2h4(value.B), scalar2h4(value.C)];
        const op = safeFea2scalar(Fr, sr4to8(Fr, poseidon([...A, ...B], C)));
        const regs = {...value};
        for (const reg in regs) {
            console.log(`\t\t${regs[reg]}n => ${reg}`);
        }
    console.log(`\t\t${op}n :${INS}\n`);
    }
}

test_generator();


function sr4to8(F, r) {
    const sr=[];
    sr[0] = r[0] & 0xFFFFFFFFn;
    sr[1] = r[0] >> 32n;
    sr[2] = r[1] & 0xFFFFFFFFn;
    sr[3] = r[1] >> 32n;
    sr[4] = r[2] & 0xFFFFFFFFn;
    sr[5] = r[2] >> 32n;
    sr[6] = r[3] & 0xFFFFFFFFn;
    sr[7] = r[3] >> 32n;
    return sr;
}

function safeFea2scalar(Fr, arr) {
    for (let index = 0; index < 8; ++index) {
        const value = Fr.toObject(arr[index]);
        if (value > 0xFFFFFFFFn) {
            throw new Error(`Invalid value 0x${value.toString(16)} to convert to scalar on index ${index}: ${sourceRef}`);
        }
    }
    return fea2scalar(Fr, arr);
}