function generateBase(offset, len) {
    let bytes = [];
    let selM0 = [];
    let selM1 = [];
    for (let clock = 0; clock < 32; ++clock) {
        const value = (64 - offset + clock);
        const byte = value % 32;
        const isM0 = value >= 64 ? 1:0;
        bytes.push(byte < len ? byte: -1);
        selM0.push(byte < len ? isM0 : 0);
        selM1.push(byte < len ? 1 - isM0 : 0);
    }
    return {bytes, selM0, selM1, offset, len};
}

function generate(offset = 0, len = 0, left = 0, lendian = 0) {
    let _len = len == 0 ? 32:len;
    _len = offset + _len > 64 ? _len = 64 - offset : _len;
    let res = generateBase(offset, _len);
    if (!left) {
        for (let clock = 0; clock < 32; ++clock) {
            if (res.bytes[clock] < 0) continue;
            res.bytes[clock] = res.bytes[clock] + (32 - _len);
        }
    }
    if (lendian) {
        for (let clock = 0; clock < 32; ++clock) {
            if (res.bytes[clock] < 0) continue;
            res.bytes[clock] = left ? _len - 1 - res.bytes[clock] :  62 - res.bytes[clock] - _len;
        }
    }
    const mode = offset + 64 * len + 128 * left + 256 * lendian;
    return {...res, left, lendian};
}

let count = 0;
for (let offset = 0; offset <= 32; ++offset) {
    console.log(offset);
    for (let len = 0; len <= 32; ++len) {
        for (const left of [0,1]) {
            for (const lendian of [0, 1]) {
                ++count;
                generate(offset, len, left, lendian);
            }
        }
    }    
}
console.log(count, count * 32);


function dump(values) {
    console.log('[' + values.bytes.map(x => x == -1 ? '  ' : x.toString(10).padStart(2)).join('|')+`] O=${values.offset} L=${values.len} ${values.lendian ? 'LE':'BE'} ${values.left ? 'L':'R'}`);
    console.log('[' + values.selM0.map((x,i) => x ? '\x1B[34mM0\x1B[0m':(values.selM1[i] ? '\x1B[35mM1\x1B[0m':'  ')).join('|')+']');
    console.log('');
}


dump(generateBase(0, 32));
dump(generateBase(1, 32));
dump(generateBase(1, 30));
dump(generateBase(16, 4));
dump(generate(16, 4, 0));
dump(generate(16, 4, 1));
dump(generate(16, 4, 0, 0));
dump(generate(16, 4, 0, 1));
dump(generate(16, 4, 1, 0));
dump(generate(16, 4, 1, 1));
dump(generate(16, 6, 0, 0));
dump(generate(16, 6, 0, 1));
dump(generate(16, 6, 1, 0));
dump(generate(16, 6, 1, 1));
dump(generate(31, 1));
dump(generate(32, 1));
dump(generate(33, 1));
dump(generate(62, 1));
dump(generate(63, 1));
dump(generate(63, 2, 1));
dump(generate(63, 2));
