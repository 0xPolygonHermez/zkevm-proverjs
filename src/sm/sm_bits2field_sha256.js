const SlotSize = 31487; // TODO Fix
const bitsPerField = 7;

module.exports.buildConstants = async function (pols) {
    const N = pols.FieldLatch.length;

    const nSlots = Math.floor((N - 1) / SlotSize);

    let p = 0;
    pols.Factor[p] = 0n;
    pols.FieldLatch[p] = 0n;
    p += 1;
    for (let i = 0; i < nSlots; i++) {
        let pSlot = 0;
        for (let j = 0; j < 1024; j++) {
            for (let k = 0; k < bitsPerField; k++) {
                pols.Factor[p] = 1n << BigInt(k);
                pols.FieldLatch[p] = (k === bitsPerField - 1) ? 1n : 0n;
                p += 1;
                pSlot += 1;
            }
        }
        while (pSlot < SlotSize) {
            pols.Factor[p] = 0n;
            pols.FieldLatch[p] = 0n;
            p += 1;
            pSlot += 1;
        }
    }
    while (p < N) {
        pols.Factor[p] = 0n;
        pols.FieldLatch[p] = 0n;
        p += 1;
    }
};

module.exports.execute = async function (pols, input) {
    function bitFromState(st, i) {
        const w = Math.floor(i / 32);
        const sh = 31 - (i % 32);

        return BigInt((st[w] >>> sh) & 1);
    }

    function getBit(block, typ, pos) {
        if (block >= input.length) return 0n;
        if (typ === 'stateIn') {
            return bitFromState(input[block][1], pos);
        }
        if (typ === 'stateOut') {
            return bitFromState(input[block][2], pos);
        }
        if (typ === 'in') {
            const byte = Math.floor(pos / 8);
            const sh = 7 - (pos % 8);

            return (((input[block][0][byte] >> sh) & 1) === 1) ? 1n : 0n;
        }
        throw new Error('Invalid type');
    }
    const required = {
        Sha256F: [],
    };

    const N = pols.bit.length;

    const nSlots = Math.floor((N - 1) / SlotSize);

    let p = 0;

    pols.bit[p] = 0n;
    pols.packField[p] = 0n;
    p += 1;

    let accField = 0n;

    for (let i = 0; i < nSlots; i++) {
        const sha256FSlot = [];
        const stIn = [];
        const stOut = [];
        const rIn = [];
        for (let j = 0; j < 1024; j++) {
            for (let k = 0; k < bitsPerField; k++) {
                if (j < 256) {
                    pols.bit[p] = getBit(i * bitsPerField + k, 'stateIn', j);
                } else if (j < 512) {
                    pols.bit[p] = getBit(i * bitsPerField + k, 'stateOut', j - 256);
                } else {
                    pols.bit[p] = getBit(i * bitsPerField + k, 'in', j - 512);
                }
                accField = k === 0 ? pols.bit[p]
                    : accField + (pols.bit[p] << BigInt(k));
                pols.packField[p] = accField;
                p += 1;
            }
            if (j < 256) {
                stIn.push(accField);
            } else if (j < 512) {
                stOut.push(accField);
            } else {
                rIn.push(accField);
            }
        }
        for (let j = 1024 * bitsPerField; j < SlotSize; j++) {
            pols.bit[p] = 0n;
            pols.packField[p] = 0n;
            p += 1;
        }

        required.Sha256F.push([stIn, rIn]);
    }

    while (p < N) {
        pols.bit[p] = 0n;
        pols.packField[p] = 0n;
        p += 1;
    }

    return required;
};
