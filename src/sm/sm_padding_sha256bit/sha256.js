const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const HIn = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

function rotr(a, n) {
    return ((a << (32 - n)) | (a >>> n)) >>> 0;
}

function sigmaLow0(a) {
    return (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;
}

function sigmaLow1(a) {
    return (rotr(a, 17) ^ rotr(a, 19) ^ (a >>> 10)) >>> 0;
}

function sigmaHigh0(a) {
    return (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
}

function sigmaHigh1(a) {
    return (rotr(a, 6) ^ rotr(a, 11) ^ rotr(a, 25)) >>> 0;
}

function add(a, b, c, d, e) {
    c = c || 0;
    d = d || 0;
    e = e || 0;

    return ((a + b + c + d + e) & 0xFFFFFFFF) >>> 0;
}

function ch(a, b, c) {
    return ((a & b) ^ (~a & c)) >>> 0;
}

function maj(a, b, c) {
    return ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
}

function sha256F(inR, stIn) {
    const w = [];
    let a = stIn[0];
    let b = stIn[1];
    let c = stIn[2];
    let d = stIn[3];
    let e = stIn[4];
    let f = stIn[5];
    let g = stIn[6];
    let h = stIn[7];
    for (let t = 0; t < 16; t++) {
        w.push(
            ((inR[t * 4] << 24)
            | (inR[t * 4 + 1] << 16)
            | (inR[t * 4 + 2] << 8)
            | (inR[t * 4 + 3])) >>> 0,
        );
    }
    for (let t = 16; t < 64; t++) {
        w.push(add(sigmaLow1(w[t - 2]), w[t - 7], sigmaLow0(w[t - 15]), w[t - 16]));
    }
    for (let t = 0; t < 64; t++) {
        const t1 = add(h, sigmaHigh1(e), ch(e, f, g), K[t], w[t]);
        const t2 = add(sigmaHigh0(a), maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = add(d, t1);
        d = c;
        c = b;
        b = a;
        a = add(t1, t2);
    }

    return [
        add(a, stIn[0]),
        add(b, stIn[1]),
        add(c, stIn[2]),
        add(d, stIn[3]),
        add(e, stIn[4]),
        add(f, stIn[5]),
        add(g, stIn[6]),
        add(h, stIn[7]),
    ];
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
}

function sha256(a, typ) {
    if (typeof a === 'string') {
        a = new TextEncoder().encode(a);
    }
    a = Array.from(a);
    const len = a.length * 8;
    a.push(0x80);
    while (a.length % 64 !== 56) a.push(0);
    a.push(0);
    a.push(0);
    a.push(0);
    a.push(0);
    a.push((len >>> 24) & 0xFF);
    a.push((len >>> 16) & 0xFF);
    a.push((len >>> 8) & 0xFF);
    a.push(len & 0xFF);

    let st = HIn;
    for (let i = 0; i < a.length; i += 64) {
        st = sha256F(a.slice(i, i + 64), st);
    }

    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
        out[i * 4] = (st[i] >>> 24) & 0xFF;
        out[i * 4 + 1] = (st[i] >>> 16) & 0xFF;
        out[i * 4 + 2] = (st[i] >>> 8) & 0xFF;
        out[i * 4 + 3] = st[i] & 0xFF;
    }
    if (typ === 'hex') {
        return buf2hex(out);
    }

    return out;
}

module.exports.sha256F = sha256F;
module.exports.sha256 = sha256;
