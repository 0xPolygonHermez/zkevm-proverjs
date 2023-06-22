const random = require('random-bigint')

const P_BN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

let values = [];
for (let i = 0; i < 15; i++) {
    values.push({
        A: random(64) % P_BN254,
        B: random(64) % P_BN254,
        C: random(64) % P_BN254,
    })
}
console.log(values)