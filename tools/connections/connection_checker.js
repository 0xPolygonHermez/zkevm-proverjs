const { log2 } = require("@0xpolygonhermez/zkevm-commonjs").utils;
const { id } = require("ethers/lib/utils");
const { F1Field } = require("ffjavascript");
const { getKs, getRoots, newConstantPolsArray, compile } = require("pilcom");

// const smKeccakF = require("./sm/sm_keccakf/sm_keccakf.js");
const smKeccakF = require("../../src/sm/sm_keccakf/sm_keccakf.js");
const smPaddingKKBit = require("../../src/sm/sm_padding_kkbit/sm_padding_kkbit.js");
const smSha256F = require("../../src/sm/sm_sha256f/sm_sha256f.js");
const smPaddingSha256Bit = require("../../src/sm/sm_padding_sha256bit/sm_padding_sha256bit.js");

const F = new F1Field("0xFFFFFFFF00000001");

const argv = require("yargs")
    .usage("node connection_checker.js -c <connections>")
    .help('h')
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("c", "const")
    .argv;

function check_connections(final_trace, connections) {
    const SlotSize = 155286;

    const N = final_trace[0].length;
    const nSlots = Math.floor((N-1)/SlotSize);

    const pow = log2(N);

    const ks = getKs(F, final_trace.length - 1);
    const roots = getRoots(F);
    const wi = roots[pow];

    // Process the connections
    let counter = 0;
    let map = [];
    for (let i = 0; i < nSlots; i++) {
        const offset = i * SlotSize;
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
                        mark(pols.ConnA, r1, pols.ConnA, r2);
                    } else if (conn1[0] == "B") {
                        mark(pols.ConnA, r1, pols.ConnB, r2);
                    } else if (conn1[0] == "C") {
                        mark(pols.ConnA, r1, pols.ConnC, r2);
                    } else {
                        throw new Error("Invalid pin");
                    }
                }
            }
            if (conn.B) {
                for (let k = 0; k < l.B.length; k++) {
                    const conn1 = conn.B[k];
                    let r2 = conn1[1];
                    if (r2 > 0) r2 += offset;
                    if (conn1[0] == "A") {
                        mark(pols.ConnB, r1, pols.ConnA, r2);
                    } else if (conn1[0] == "B") {
                        mark(pols.ConnB, r1, pols.ConnB, r2);
                    } else if (conn1[0] == "C") {
                        mark(pols.ConnB, r1, pols.ConnC, r2);
                    } else {
                        throw new Error("Invalid pin");
                    }
                }
            }
            if (conn.C) {
                for (let k = 0; k < l.C.length; k++) {
                    const conn1 = conn.C[k];
                    let r2 = conn1[1];
                    if (r2 > 0) r2 += offset;
                    if (conn1[0] == "A") {
                        mark(pols.ConnC, r1, pols.ConnA, r2);
                    } else if (conn1[0] == "B") {
                        mark(pols.ConnC, r1, pols.ConnB, r2);
                    } else if (conn1[0] == "C") {
                        mark(pols.ConnC, r1, pols.ConnC, r2);
                    } else {
                        throw new Error("Invalid pin");
                    }
                }
            }
        }
    }

    // For each connected clusted, follow the path and check that all elements in the cluster are reachable
    for (let i = 0; i < map.length; i++) {
        const cluster = map[i];

        // Mark the cells of cluster where you can reach
        const visited = new Array(cluster.length).fill(0n);
        let cell = cluster[0];
        visited[0] = cell;
        for (let j = 0; j < cluster.length - 1; j++) {
            const repr = final_trace[cell.p][cell.r];
            cell = getCell(repr);
            for (let k = 0; k < visited.length; k++) {
                if (visited[k].p == cell.p && visited[k].r == cell.r) {
                    throw new Error("Connection is not correct, cell already visited");
                }
            }
        }
    }

    function mark(p1, r1, p2, r2) {
        for (let i = 0; i < map.length; i++) {
            const cluster = map[i];
            // Check if the connection is in the cluster
            let firstInCluster = false;
            let secondInCluster = false;
            for (let j = 0; j < cluster.length; j++) {
                if (p1 == cluster[j].p && r1 == cluster[j].r) {
                    firstInCluster = true;
                }
                if (p2 == cluster[j].p && r2 == cluster[j].r) {
                    secondInCluster = true;
                }
            }
            if (firstInCluster && secondInCluster) {
                // Connection already defined, mapping structure does not change
                return;
            } else if (firstInCluster && !secondInCluster) {
                // Add the second cell to the cluster
                map[i].push({p: p2, r: r2});
                return;
            } else if (!firstInCluster && secondInCluster) {
                // Add the first cell to the cluster
                map[i].push({p: p1, r: r1});
                return;
            }
        }
        // Start a new cluster
        map.push([{p: p1, r: r1}, {p: p2, r: r2}]);
    }
}

async function generateTrace() {
    const pilFile = __dirname + "/connections.pil";
    const pil = await compile(F, pilFile, null, {});

    const constPols = newConstantPolsArray(pil);
    console.log(constPols);
    HEY

    // Build constants of the ones that contain connections
    await smKeccakF.buildConstants(constPols.KeccakF);
    await smPaddingKKBit.buildConstants(constPols.PaddingKKBit);
    await smSha256F.buildConstants(constPols.Sha256F);
    await smPaddingSha256Bit.buildConstants(constPols.PaddingSha256Bit);

    const outputFile = __dirname + "/../tmp/connection.const"
    await constPols.saveToFile(outputFile);

    console.log("Constants generated succefully!");
}

generateTrace();