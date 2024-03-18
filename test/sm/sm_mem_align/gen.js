const MemAlignConstants = require('../../../src/sm/sm_mem_align/sm_mem_align_constants.js');

const LEFT_ALIGN = BigInt(MemAlignConstants.LEFT_ALIGN_MASK);
const LITTLE_ENDIAN = BigInt(MemAlignConstants.LITTLE_ENDIAN_MASK);
const LEN_FACTOR = BigInt(MemAlignConstants.LEN_FACTOR);

const M = 0x101112131415161718191A1B1C1D1E1F202122232425262728292A2B2C2D2E2F303132333435363738393A3B3C3D3E3F404142434445464748494A4B4C4D4E4Fn;
const V = 0x0E1E2E3E4E5E6E7E8E9EAEBECEDEEEEF0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFFFn;

const MASK512 = (1n << 512n) - 1n;
const MASK256 = (1n << 256n) - 1n;

function propsToHex(props) {
    let res = {};
    for (const key in props) {
        if (typeof props[key] !== 'bigint') continue;
        res[key] = '0x' + props[key].toString(16).padStart(64, '0').toUpperCase();
    }
    return res;
}
function dump(p) {
    const _h = propsToHex(p);
    if (!p.wr) {
        console.log(`\t{\n\t\t// #${p.index} w=[${p.index*32}-${p.index*32+31}]\n\t\t//    ${p.l1}\n\t\tA:  ${_h.a}n,\n\t\t//    ${p.l2}\n\t\tB:  ${_h.b}n,\n\t\tC0: ${p.c0},\n\t\tOP: ${_h.op}n,\n\t\tD:  ${_h.d}n,\n\t\tE:  ${_h.e}n,\n\t\tmemAlignRD: ${p.wr?0:1}n,\n\t\tmemAlignWR: ${p.wr?1:0}n\n\t},`);
        return;
    }
    console.log(`\t{\n\t\t// #${p.index} w=[${p.index*32}-${p.index*32+31}]\n\t\tA:  ${_h.a}n,\n\t\t//    ${p.l1}\n\t\tD:  ${_h.d}n,\n\t\tC0: ${p.c0},\n\t\tOP: ${_h.op}n,\n\t\tB:  ${_h.b}n,\n\t\t//    ${p.l2}\n\t\tE:  ${_h.e}n,\n\t\tmemAlignRD: ${p.wr?0:1}n,\n\t\tmemAlignWR: ${p.wr?1:0}n\n\t},`);
}
function split512to256(value) {
    return [(value >> 256n) & MASK256, value & MASK256];
}

function toLE(value, len) {
    let vle = 0n;
    for (let ibyte = 0n; ibyte < len; ++ibyte) {
        vle = (vle << 8n) + ((value >> (8n * ibyte)) & 0xFFn);
    }
    return vle;
}

function generate(index, offset, len, config) {
    const [a,b] = split512to256(config.M);
    let d,e;
    const _c = `${offset}n + ${len}n * LEN_FACTOR`;
    let _len = len === 0n ? 32n : len;
    _len = ((offset + _len) > 64n) ? (64n - offset) : _len;
    const rule = ('·'+('-'.repeat(9))).repeat(13).slice(0, 128);
    const legend512 = rule.slice(0, (Number(offset) * 2)) + '#'.repeat(Number(len) * 2) + ((offset + len) > 64n ? '' : rule.slice(-2 * Number(64n - offset - len)));
    let v = (config.M >> (8n *(64n - offset - _len))) & ((1n << (_len * 8n)) - 1n);
    const vle = toLE(v, _len);
    const shlV = ((64n - offset - _len) * 8n);
    const shrV = 8n * (32n - _len);
    const W = (MASK512 ^ ((MASK256 >> shrV) << shlV)) & M;

    // read operations
    let data = {a, b, l1: legend512.slice(0, 64), l2: legend512.slice(64), wr: false, d: 0n, e: 0n};
    dump({...data, index: index, op: v, c0: _c});
    dump({...data, index: index + 1, op: vle, c0: _c + ' + LITTLE_ENDIAN'});
    dump({...data, index: index + 2, op: v << (32n - _len) * 8n, c0: _c  + ' + LEFT_ALIGN'});
    dump({...data, index: index + 3, op: vle << (32n - _len) * 8n, c0: _c + ' + LEFT_ALIGN + LITTLE_ENDIAN'});
    
    // write operations
    data = {...data, wr: true, op: config.V};
    const maskV = (1n << (8n * _len)) - 1n;
    [d, e] = split512to256(W | ((config.V & maskV) << shlV));
    dump({...data, index: index + 4, d, e, c0: _c});
    [d, e] = split512to256(W | (toLE(config.V & maskV, _len)  << shlV))
    dump({...data, index: index + 5, d, e, c0: _c + ' + LITTLE_ENDIAN'});
    [d, e] = split512to256(W | ((config.V >> shrV) << shlV))
    dump({...data, index: index + 6, d, e, c0: _c + ' + LEFT_ALIGN'});
    [d, e] = split512to256(W | (toLE(config.V >> shrV, _len) << shlV));
    dump({...data, index: index + 7, d, e, c0: _c + ' + LEFT_ALIGN + LITTLE_ENDIAN'});
    
    return index + 8;
}

let index = 0;
for (let offset = 0n; offset < 65n; ++offset) {
    for (let len = 0n; len < 33n; ++len) {
        index = generate(index, offset, len, {M, V});
    }
}
