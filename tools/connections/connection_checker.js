const fs = require("fs");
const path = require("path");
const { log2 } = require("@0xpolygonhermez/zkevm-commonjs").utils;
const { F1Field } = require("ffjavascript");
const { getKs, getRoots, newConstantPolsArray, compile } = require("pilcom");

const smGlobal = require("../../src/sm/sm_global.js");

const smBits2Field = require("../../src/sm/sm_bits2field.js");
const smKeccakF = require("../../src/sm/sm_keccakf/sm_keccakf.js");
const smPaddingKK = require("../../src/sm/sm_padding_kk.js");
const smPaddingKKBit = require("../../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");

const smBits2FieldSha256 = require("../../src/sm/sm_bits2field_sha256.js");
const smSha256F = require("../../src/sm/sm_sha256f/sm_sha256f.js");
const smPaddingSha256 = require("../../src/sm/sm_padding_sha256.js");
const smPaddingSha256Bit = require("../../src/sm/sm_padding_sha256bit/sm_padding_sha256bit.js");

const F = new F1Field("0xFFFFFFFF00000001");
const pilFile = path.join(__dirname,"/connections.pil");

const argv = require("yargs")
    .usage("node connection_checker.js -G -N <trace size>")
    .option('G', {
        alias: 'generate_trace',
        description: 'Generate a trace',
        type: 'boolean',
    })
    .option('N', {
        alias: 'trace_size',
        description: 'Specify the trace size',
        type: 'string',
        default: `2**24`,
    })
    .option('o', {
        alias: 'output_path',
        description: 'Specify the output path',
        type: 'string',
    })
    .implies('G', 'o')
    .help('h')
    .alias('h','help')
    .argv;

function check_connections(type, final_trace, slot_size = 1, connections = null) {
    const N = final_trace[0].length;

    const ks = getKs(F, final_trace.length - 1);

    const roots = getRoots(F);
    const pow = log2(N);
    const wi = roots[pow];

    // Process the connections
    let map = {};
    let id = 1;

    if (type == "paddingsha256") {
        const bitsPerElement = 7;
        const nBlocks = bitsPerElement * Math.floor((N - 1) / slot_size);

        let p = 0;
        for (let i = 0; i < nBlocks; i++) {
            let lasti = i - 1;
            if (lasti === -1) lasti = nBlocks - 1;
            for (let j = 0; j < 256; j++) {
                mark(final_trace[0], p, final_trace[2], bits2fieldbit(lasti, 'sOut', j));
                mark(final_trace[1], p, final_trace[2], bits2fieldbit(i, 'sIn', j));
                p += 1;
            }

            for (let k = 0; k < 512; k++) {
                mark(final_trace[0], p, final_trace[2], bits2fieldbit(i, 'in', k));
                if (k < 256) {
                    mark(final_trace[1], p, final_trace[2], bits2fieldbit(i, 'sOut', k));
                }
                p += 1;
            }
        }

        function bits2fieldbit(block, typ, bit) {
            let o = 1;
            o += Math.floor(block / bitsPerElement) * slot_size;
            if (typ === 'sIn') {
                o += 0;
            } else if (typ === 'sOut') {
                o += 256 * bitsPerElement;
            } else if (typ === 'in') {
                o += 512 * bitsPerElement;
            } else {
                throw new Error('Invalid type');
            }
    
            o += bit * bitsPerElement;
            o += block % bitsPerElement;
    
            return o;
        }
    } else if (type === "sha256") {
        const slots = Math.floor((N-1)/slot_size);

        for (let i = 0; i < slots; i++) {
            const offset = i * slot_size;
    
            const wires = {};
            wires[0] = [0, 0];
            wires[1] = [1, 0];
            mark(0, 0, 2, 0);
            mark(1, 0, 3, 0);
            for (let j = 1; j < connections.length; j++) {
                for (let k = 0; k < 4; k++) {
                    const wire = connections[j].connections[k];
                    if (wires[wire]) {
                        // next times that found a wire, connect the "end"
                        // saved previously with this "end"
                        mark(wires[wire][0], wires[wire][1], k, j, offset);
                        wires[wire] = [k, j];
                    } else {
                        // first time that found a wire saves the "end"
                        // of this wire.
                        wires[wire] = [k, j];
                    }
                }
            }
        }
    } else if (type === "paddingkk") {
        const nBlocks = 44 * Math.floor((N-1) / slot_size);

        let p = 0;
        for (let i = 0; i < nBlocks; i++) {
            let lasti = i - 1;
            if (lasti == -1) lasti = nBlocks-1;
            for (let j = 0; j < 136; j++) {
                for (let k = 0; k < 8; k++) {
                    mark(final_trace[0], p, final_trace[2], bits2fieldbit(lasti, true, j*8+k) );
                    mark(final_trace[1], p, final_trace[2], bits2fieldbit(i, false, j*8+k) );
                    p += 1;
                }
                p += 1;
            }

            for (let k = 0; k < 512; k++) {
                mark(final_trace[0], p, final_trace[2], bits2fieldbit(lasti, true, 1088 +k) );
                mark(final_trace[1], p, final_trace[2], bits2fieldbit(i, false, 1088 +k) );
                p += 1;
            }

            for (let k = 0; k < 256; k++) {
                mark(final_trace[0], p, final_trace[2], bits2fieldbit(i, true, k) );
                p += 1;
            }

            p += 1;
        }

        function bits2fieldbit(block, out, bit) {
            let o = 1;
            o += Math.floor(block / 44 ) * slot_size;
            if (out) o += 1600*44;
            o += bit*44;
            o += block % 44;
            return o;
        }

    } else if (type === "keccakf") {
        const slots = Math.floor((N-1)/slot_size);

        for (let i = 0; i < slots; i++) {
            const offset = i * slot_size;
    
            for (let j = 0; j < connections.length; j++) {
                const conn = connections[j];
                let r1 = j;
                if (j > 0) r1 += offset;
                if (conn.A) {
                    for (let k = 0; k < conn.A.length; k++) {
                        const conn1 = conn.A[k];
                        let r2 = conn1[1];
                        if (r2 > 0) r2 += offset;
                        if (conn1[0] == "A") {
                            mark(0, r1, 0, r2);
                        } else if (conn1[0] == "B") {
                            mark(0, r1, 1, r2);
                        } else if (conn1[0] == "C") {
                            mark(0, r1, 2, r2);
                        } else {
                            throw new Error("Invalid pin");
                        }
                    }
                }
                if (conn.B) {
                    for (let k = 0; k < conn.B.length; k++) {
                        const conn1 = conn.B[k];
                        let r2 = conn1[1];
                        if (r2 > 0) r2 += offset;
                        if (conn1[0] == "A") {
                            mark(1, r1, 0, r2);
                        } else if (conn1[0] == "B") {
                            mark(1, r1, 1, r2);
                        } else if (conn1[0] == "C") {
                            mark(1, r1, 2, r2);
                        } else {
                            throw new Error("Invalid pin");
                        }
                    }
                }
                if (conn.C) {
                    for (let k = 0; k < conn.C.length; k++) {
                        const conn1 = conn.C[k];
                        let r2 = conn1[1];
                        if (r2 > 0) r2 += offset;
                        if (conn1[0] == "A") {
                            mark(2, r1, 0, r2);
                        } else if (conn1[0] == "B") {
                            mark(2, r1, 1, r2);
                        } else if (conn1[0] == "C") {
                            mark(2, r1, 2, r2);
                        } else {
                            throw new Error("Invalid pin");
                        }
                    }
                }
            }
        }
    } else {
        throw new Error("Connection type unkwnown")
    }

    // For each connected cell, follow the path and check that all elements in the cluster are reachable
    for (let p of Object.keys(map)) {
        for (let r of Object.keys(map[p])) {
            const value = final_trace[p][r];

            let w = F.pow(wi,r);

            const isDisconnected = p == 0 ? value === w : value === F.mul(w,ks[p-1]);
            if (isDisconnected) {
                throw new Error(`Cell (${p},${r}) was included in the connection but is disconnected: Found value ${value}`);
            }
        }

        // const cluster = map[i];
        // // Mark the cells of cluster where you can reach
        // const visited = new Array(cluster.length).fill(0n);
        // let cell = cluster[0];
        // visited[0] = cell;
        // for (let j = 0; j < cluster.length - 1; j++) {
        //     const repr = final_trace[cell.p][cell.r];
        //     cell = getCell(repr);
        //     for (let k = 0; k < visited.length; k++) {
        //         if (visited[k].p == cell.p && visited[k].r == cell.r) {
        //             throw new Error("Connection is not correct, cell already visited");
        //         }
        //     }
        // }
    }

    function mark(p1, r1, p2, r2) {
        // Check if some cell of the connection is yet marked
        if (map[p1]) {
            if (map[p1][r1] === undefined) {
                map[p1][r1] = [id];
            } else {
                map[p1][r1].push(id);
            }
        } else {
            map[p1] = {};
            map[p1][r1] = [id];
        }

        if (map[p2]) {
            if (map[p2][r2] === undefined) {
                map[p2][r2] = [id];
            } else {
                map[p2][r2].push(id);
            }
        } else {
            map[p2] = {};
            map[p2][r2] = [id];
        }

        id++;
    }
}

async function main() {
    let N = 2**24;
    if (typeof argv.trace_size !== 'undefined') {
        N = argv.trace_size;
        if (typeof N === 'string' && N.startsWith('2**')) {
            N = 2 ** Number(N.substring(3).trim());
        }
    }

    const outputPath = typeof(argv.output_path) === "string" ?  argv.output_path.trim() : "";
    const pathFile = outputPath ? outputPath : path.join(__dirname, `/../../tmp/`);
    const constFile = path.join(pathFile, `connection${log2(N)}.const`);

    if (argv.generate_trace == true) {
        await generateTrace(N, constFile);
    }

    const pil = await compile(F, pilFile, null, {defines: { N }});

    const constPols = newConstantPolsArray(pil);
    await constPols.loadFromFile(constFile);

    // KeccakF connections
    const keccakS1 = constPols.KeccakF.ConnA;
    const keccakS2 = constPols.KeccakF.ConnB;
    const keccakS3 = constPols.KeccakF.ConnC;
    const keccakconns = JSON.parse(await fs.promises.readFile(path.join(__dirname, "/../../src/sm/sm_keccakf/keccak_connections.json"), "utf8"));
    const slot_size_keccak = 155286;
    check_connections("keccakf", [keccakS1,keccakS2,keccakS3], slot_size_keccak, keccakconns);

    // PaddingKKBit connections
    const paddingKeccakS1 = constPols.PaddingKKBit.ConnSOutBit;
    const paddingKeccakS2 = constPols.PaddingKKBit.ConnSInBit;
    const paddingKeccakS3 = constPols.PaddingKKBit.ConnBits2FieldBit;
    check_connections("paddingkk", [paddingKeccakS1,paddingKeccakS2,paddingKeccakS3], slot_size_keccak);

    // Sha256F connections
    // The connection file in this case is correct by definition. To process the connections, it scans the
    // trace rowise, it "marks" the cells that are connected as follows: the first time an ending of the
    // wire is marked with some id, and then, when the same id is found, the cell is marked, connecting both.
    const sha256S1 = constPols.Sha256F.Conn[0];
    const sha256S2 = constPols.Sha256F.Conn[1];
    const sha256S3 = constPols.Sha256F.Conn[2];
    const sha256S4 = constPols.Sha256F.Conn[3];
    const sha256conns = JSON.parse(await fs.promises.readFile(path.join(__dirname, "/../../src/sm/sm_sha256f/sha256_gates.json"), "utf8"));
    const slot_size_sha256 = 31488;
    check_connections("sha256", [sha256S1,sha256S2,sha256S3,sha256S4], slot_size_sha256, sha256conns);

    // PaddingSha256Bit connections
    const paddingSha256S1 = constPols.PaddingSha256Bit.ConnS1;
    const paddingSha256S2 = constPols.PaddingSha256Bit.ConnS2;
    const paddingSha256S3 = constPols.PaddingSha256Bit.ConnBits2FieldBit;
    check_connections("paddingsha256", [paddingSha256S1,paddingSha256S2,paddingSha256S3], slot_size_sha256);
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});

async function generateTrace(N, outputPath) {
    const bits = log2(N);

    console.log(`Generating constants with N = 2**${bits}`);

    const pil = await compile(F, pilFile, null, {defines: { N }});

    const constPols = newConstantPolsArray(pil);

    // Build constants of the ones that contain connections
    console.log("Global...");
    await smGlobal.buildConstants(constPols.Global);

    console.log("Bits2Field...");
    await smBits2Field.buildConstants(constPols.Bits2Field);

    console.log("KeccakF...");
    await smKeccakF.buildConstants(constPols.KeccakF);

    console.log("PaddingKK...");
    await smPaddingKK.buildConstants(constPols.PaddingKK);

    console.log("PaddingKKBit...");
    await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);

    console.log("Bits2FieldSha256...");
    await smBits2FieldSha256.buildConstants(constPols.Bits2FieldSha256);

    console.log("Sha256F...");
    await smSha256F.buildConstants(constPols.Sha256F);

    console.log("PaddingSha256...");
    await smPaddingSha256.buildConstants(constPols.PaddingSha256);

    console.log("PaddingSha256Bit...");
    await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);

    await constPols.saveToFile(outputPath);

    console.log(`Constants generated succefully and saved at file connection${bits}.const`);
}