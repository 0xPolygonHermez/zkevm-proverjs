// (echo "module.exports = ["; dd if=/dev/urandom bs=32 count=600 | hexdump | colrm 1 8 | xargs | sed "s/ //g;" | sed "s/\(.\{64\}\)/\t0x\1n,\n/g"; echo "];")  > test/features/shl_shr/random_data.js

const data = require(__dirname + '/random_data.js');

const MASK_256 = 2n ** 256n - 1n;
let base = 0;
console.log("VAR GLOBAL _tmpRR")
console.log("testSHLbytes:\n\n\tRR\t:MSTORE(_tmpRR)\n\n")
for (let i = 0; i < 33; ++i) {
    console.log(`\t${i} => D\n\t:CALL(SaveRegs)\n\t0x${data[i+base].toString(16).padStart(64, '0')}n => A  :CALL(SHLbytes)\n\t:CALL(CheckRegs)\n\t0x${((data[i+base] << BigInt(8*i)) & MASK_256).toString(16).padStart(64, '0')}n :ASSERT\n\n`);
}
console.log("\t$ => RR\t:MLOAD(_tmpRR)\n\t:RETURN\n\ntestSHRbytes:\n\n\tRR\t:MSTORE(_tmpRR)\n\n\t0\t\t:MSTORE(totalSteps)\n");
base = base + 33;
for (let i = 0; i < 33; ++i) {
    console.log(`\t${i} => D\n\t:CALL(SaveRegs)\n\t0x${data[i+base].toString(16).padStart(64, '0')}n => A  :CALL(SHRbytes)\n\t:CALL(CheckRegs)\n\t0x${(data[i+base] >> BigInt(8*i)).toString(16).padStart(64, '0')}n :ASSERT\n\n`);
}
base = base + 33;
console.log("\t$ => RR\t:MLOAD(_tmpRR)\n\t:RETURN\n\ntestSHLbits:\n\n\tRR\t:MSTORE(_tmpRR)\n\n\t0\t\t:MSTORE(totalSteps)\n");
for (let i = 0; i < 257; ++i) {
    console.log(`\t${i} => D\n\t:CALL(SaveRegs)\n\t0x${data[i+base].toString(16).padStart(64, '0')}n => A  :CALL(SHLbits)\n\t:CALL(CheckRegs)\n\t0x${((data[i+base] << BigInt(i)) & MASK_256).toString(16).padStart(64, '0')}n :ASSERT\n\n`);
}

base = base + 257;
console.log("\t$ => RR\t:MLOAD(_tmpRR)\n\t:RETURN\n\ntestSHRbits:\n\n\tRR\t:MSTORE(_tmpRR)\n\n\t0\t\t:MSTORE(totalSteps)\n");
for (let i = 0; i < 257; ++i) {
    console.log(`\t${i} => D\n\t:CALL(SaveRegs)\n\t0x${data[i+base].toString(16).padStart(64, '0')}n => A  :CALL(SHRbits)\n\t:CALL(CheckRegs)\n\t0x${(data[i+base] >> BigInt(i)).toString(16).padStart(64, '0')}n :ASSERT\n\n`);
}
console.log("\t$ => RR\t:MLOAD(_tmpRR)\n\t:RETURN");
