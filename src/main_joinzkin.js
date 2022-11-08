const fs = require("fs");
const path = require("path");
const { polMulAxi } = require("pil-stark/src/polutils");
const version = require("../package").version;

const argv = require("yargs")
    .version(version)
    .usage("node  -v <verification_key.json> --zkin1 <in1.zkin.json> --zkin2 <in2.zkin.json>  --zkinout <out.zkin.json>")
    .argv;

async function run() {

    const zkin11File = typeof(argv.zkin2) === "string" ?  argv.zkin2.trim() : "zkin2.json";
    const zkin2File = typeof(argv.zkin2) === "string" ?  argv.zkin2.trim() : "zkin2.json";
    const zkinOutFile = typeof(argv.zkinOut) === "string" ?  argv.zkinOut : "zkinOut.json";
    const verKeyFile = typeof(argv.verkey) === "string" ?  argv.verkey.trim() : "recursive2.verkey.json";


    const zkin1 = JSON.parse(await fs.promises.readFile(zkin11File, "utf8"));
    const zkin2 = JSON.parse(await fs.promises.readFile(zkin2File, "utf8"));
    const verKey = JSONbig.parse(await fs.promises.readFile(verKeyFile, "utf8"));
    const constRoot = verKey.constRoot;


    const zkinOut = {};

    for (let i=0; i<8; i++) zkinOut.publics[0+i] = zkin1.publics[0+i];  // oldStateRoot

    for (let i=0; i<8; i++) zkinOut.publics[8+i] = zkin1.publics[8+i];  // oldAccInputHash0

    zkinOut.publics[16] = zkin1.publics[16];  // oldBatchNum

    zkinOut.publics[17] = zkin1.publics[17];  // chainId


    if (zkin1.publics[17] != (zkin2.publics[17])) throw new Error("chainID doesn't match");
    // midStateRoot
    for (let i=0; i<8; i++) {
        if (zkin1.publics[18 + i] != (zkin2.publics[0 + i])) throw new Error("midStateRoot doesnt't match");
    }
    // midAccInputHash0
    for (let i=0; i<8; i++) {
        if (zkin1.publics[26 + i] != (zkin2.publics[8 + i])) throw new Error("midAccInputHash0 doesnt't match");
    }
    if (zkin1.publics[42] != (zkin2.publics[16])) throw new Error("batchNum doesn't match");

    for (let i=0; i<8; i++) zkinOut.publics[18+i] = zkin2.publics[18+i];  // newStateRoot
    for (let i=0; i<8; i++) zkinOut.publics[26+i] = zkin2.publics[26+i];  // newAccInputHash0
    for (let i=0; i<8; i++) zkinOut.publics[34+i] = zkin2.publics[34+i];  // newLocalExitRoot

    zkinOut.a_publics = zkin1.publics;
    zkinOut.a_root1 = zkin1.root1;
    zkinOut.a_root2 = zkin1.root2;
    zkinOut.a_root3 = zkin1.root3;
    zkinOut.a_root4 = zkin1.root4;
    zkinOut.a_s0_vals1 = zkin1.s0_vals1;
    zkinOut.a_s0_vals3 = zkin1.s0_vals3;
    zkinOut.a_s0_vals4 = zkin1.s0_vals4;
    zkinOut.a_s0_valsC = zkin1.s0_valsC;
    zkinOut.a_s0_siblings1 = zkin1.s0_siblings1;
    zkinOut.a_s0_siblings3 = zkin1.s0_siblings3;
    zkinOut.a_s0_siblings4 = zkin1.s0_siblings4;
    zkinOut.a_s0_siblingsC = zkin1.s0_siblingsC;
    zkinOut.a_s1_root = zkin1.s1_root;
    zkinOut.a_s2_root = zkin1.s2_root;
    zkinOut.a_s3_root = zkin1.s3_root;
    zkinOut.a_s4_root = zkin1.s4_root;
    zkinOut.a_s1_siblings = zkin1.s1_siblings;
    zkinOut.a_s2_siblings = zkin1.s2_siblings;
    zkinOut.a_s3_siblings = zkin1.s3_siblings;
    zkinOut.a_finalPol = zkin1.finalPol;


    zkinOut.b_publics = zkin2.publics;
    zkinOut.b_root1 = zkin2.root1;
    zkinOut.b_root2 = zkin2.root2;
    zkinOut.b_root3 = zkin2.root3;
    zkinOut.b_root4 = zkin2.root4;
    zkinOut.b_s0_vals1 = zkin2.s0_vals1;
    zkinOut.b_s0_vals3 = zkin2.s0_vals3;
    zkinOut.b_s0_vals4 = zkin2.s0_vals4;
    zkinOut.b_s0_valsC = zkin2.s0_valsC;
    zkinOut.b_s0_siblings1 = zkin2.s0_siblings1;
    zkinOut.b_s0_siblings3 = zkin2.s0_siblings3;
    zkinOut.b_s0_siblings4 = zkin2.s0_siblings4;
    zkinOut.b_s0_siblingsC = zkin2.s0_siblingsC;
    zkinOut.b_s1_root = zkin2.s1_root;
    zkinOut.b_s2_root = zkin2.s2_root;
    zkinOut.b_s3_root = zkin2.s3_root;
    zkinOut.b_s4_root = zkin2.s4_root;
    zkinOut.b_s1_siblings = zkin2.s1_siblings;
    zkinOut.b_s2_siblings = zkin2.s2_siblings;
    zkinOut.b_s3_siblings = zkin2.s3_siblings;
    zkinOut.b_finalPol = zkin2.finalPol;

    zkinOut.rootC = constRoot;

    await fs.promises.writeFile(zkinOutFile, JSON.stringify(zkinOut, null, 1), "utf8");

    console.log("file Generated Correctly");

}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
