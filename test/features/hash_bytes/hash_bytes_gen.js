const fs = require("fs");
const { compile } = require("@0xpolygonhermez/zkasmcom");
const { F1Field } = require("ffjavascript");
const { hashContractBytecode } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { byteArray2HexString } = require("@0xpolygonhermez/zkevm-commonjs").utils;
const { createHash } = require('node:crypto');
const { ethers } = require("ethers");



const argv = require("yargs")
    .usage("node hash_bytes_gen.js")
    .argv;

async function main(){
    let Fr = new F1Field("0xFFFFFFFF00000001");

    const inputHexData =
         "8a62294487fec407121ae93d94d15e350269b32982799997bf185e9fb40a3825"
        +"030e04b45d766566ccab7b78e9e5fb99e64e1138cb7b212a9d1b6b0229e42480"
        +"812d843750e27a78298f2cc72cbc7e034d60b299ae9ae61f681bd8e136245022"
        +"2d415a5942795c64cfc1498366c1f8fff26a668cd486dc5737141abb33dbbe66"
        +"73314fa19a2b47e4a3f4b79a4fcc4656d8532877758e3108613b2069ef6bae1c"
        +"489aca2ced04d45ac483f5b90b53455aba1562ed670f7e0c2c71bd78c8a53c32"
        +"c60f4de4e0a5c2535ba5a51b21e41eb29b1204770a4cfd0f7c68a0b769231d5b"
        +"fb59f4629a99e87cb70c96d00b44f018895c316732247eec318c2927fc2bdeb8"
        +"b47a231f26ca7cfd52675e3128f839daf459d95c2db858979bdd4eb9bcfd2d59"
        +"357b5330fac558e9772c728c7a809d00c30f46290dc75044ff4285dae3f54c78"
        +"e336e5fffe477e96fa4f2e68b533b45c89b00993f79dcd5ab6ea146c557a1ce8"
        +"726aa02a262c788e974f8f972b415c20005bfb5aed729e31ad8fb0c0f97f92ca"
        +"27d74ff9289f8c114fd91105ca2a727ecf4966bf59d5ce481baa0303257c425c"
        +"822bd26839e89b4a78b9e7b3147e75c3999bf51d53af79c9926e843b6b33f6be"
        +"c5b2c0ca06b18102c9b7511c2115e9297d34866bafc3972a12ea8523af1371b2"
        +"b4e1a8ecb4ffb1fddaad306249548bef9e44b782cdb34e37834619b66380040e"
        +"1743a2149f7b82874e80e74fdddd933cf0dcc9c93b637331bc2bd3f905e976d2"
        +"7bfccf6513a6cbd439d7d0aa32b9211148351485ce4a952086b20f255fd2445e"
        +"6da1c31daecced7895d8204637ab13a617e622acbbdaa3839e3f543fed0957f4"
        +"0bfb9766cb3046594c03c7ec55134cee3a4c74d82c81d000edd18e3248d1d3bb03";


    let inputHexDataPos = 0;
    let lines = [
        'start:',
        '\tSTEP => A',
        '0 :ASSERT',
        ''
    ];
    for (const hashType of ['P', 'K', 'S']) {
        let addr = 0;
        let lastE = 0;
        let lastRR = 0;
        for (const addrType of ['n', 'E', 'E+n', 'RR', 'RR+n']) {
            for (const useD of [false, true]) {
                let data = [];
                let totalBytes = 0;
                lines.push(`\t0 => HASHPOS`);
                let addrId = '';
                switch (addrType) {
                    case 'n':
                        addrId = addr.toString();
                        break;

                    case 'E':
                        addrId = 'E';
                        lastE = addr;
                        lines.push(`\t${lastE} => E`);
                        break;

                    case 'E+n':
                        addrId = `E+${addr-lastE}`;
                        break;

                    case 'RR':
                        addrId = 'RR';
                        lastRR = addr;
                        lines.push(`\t${lastRR} => RR`);
                        break;

                    case 'RR+n':
                        addrId = `RR+${addr-lastRR}`;
                        break;
                }
                for (let bytes = 1; bytes <= 32; ++bytes) {
                    let hexString = '';
                    for (let index = 0; index < bytes; ++index) {
                        const hexData = inputHexData.slice(inputHexDataPos, inputHexDataPos+2);
                        hexString += hexData;
                        data[totalBytes + index] = Number('0x' + hexData);
                        inputHexDataPos = (inputHexDataPos + 2) % inputHexData.length;
                    }
                    if (useD) {
                        lines.push(`\t${bytes} => D`);
                        lines.push(`\t${'0x'+hexString.padStart(64,'0')}n :HASH${hashType}(${addrId})`);
                    } else {
                        lines.push(`\t${'0x'+hexString.padStart(64,'0')}n :HASH${hashType}${bytes}(${addrId})`);
                    }
                    lines.push(`\tHASHPOS => A`);
                    totalBytes += bytes;
                    lines.push(`\t${totalBytes.toString(10).padEnd(67)} :ASSERT`);
                    lines.push('');
                }
                lines.push(`\t${'HASHPOS'.padEnd(67)} :HASH${hashType}LEN(${addrId})`);
                let digest = '';
                switch (hashType) {
                    case 'P':
                        digest = (await hashContractBytecode(byteArray2HexString(data))).slice(2);
                        break;
                    case 'K':
                        digest = ethers.utils.keccak256(ethers.utils.hexlify(data)).slice(2);
                        break;
                    case 'S':
                        digest = createHash('sha256').update(Uint8Array.from(data)).digest('hex');
                        break;
                }
                lines.push(`\t0x${digest.padStart(64, '0')}n :HASH${hashType}DIGEST(${addrId})`);
                addr += 1;
            }
        }
    }

    lines.push('end:');
    lines.push('\t0 => A,B,C,D,E,SP, PC, GAS, SR');
    lines.push('finalWait:');
    lines.push('\t${beforeLast()}  :JMPN(finalWait)');
    lines.push('\t                 :JMP(start)');

    lines.map(x => console.log(x));
}

main().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});