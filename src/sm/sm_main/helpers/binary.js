const Helper = require('./helper.js')

const P2_255 = 1n << 255n;
const P2_256 = 1n << 256n;
const MASK_256_BITS = P2_256 - 1n;
const MASK64 = 0xFFFFFFFFFFFFFFFFn;

const ADD = 0;
const SUB = 1;
const LT  = 2;
const SLT = 3;
const EQ  = 4;
const AND = 5;
const OR  = 6;
const XOR = 7;
const LT4 = 8;

module.exports = class Binary extends Helper {
    operationToString(operation) {
        switch (operation) {
            case ADD: return 'ADD';
            case SUB: return 'SUB';
            case LT:  return 'LT';
            case SLT: return 'SLT';
            case EQ:  return 'EQ';
            case AND: return 'AND';
            case OR:  return 'OR';
            case XOR: return 'XOR';
            case LT4: return 'LT4';
        }
        return false;
    }
    calculate(operation, a, b) {
        const res = this.#calculate(Number(operation), a, b);
        return res[0];
    }
    verify(operation, a, b, c, required) {
        operation = Number(operation);
        const res = this.#calculate(operation, a, b, c);
        const expectedC = res[0];
        const carry = res[1] ?? expectedC;
        if (!this.Scalar.eq(c, expectedC)) {
            if (operation === LT4) {
                const _a = a.toString(16).padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_');
                const _b = b.toString(16).padStart(64,'0').toUpperCase().match(/.{1,16}/g).join('_');
                throw new Error(`LT4 does not match ${expectedC} vs ${c} (A: ${_a}, B:${_b}) ${this.ctx.sourceRef}`);
            } else {
                throw new Error(`${this.operationToString(operation)} does not match (${expectedC} != ${c}) ${this.ctx.sourceRef}`);
            }
        }        
        required.push({a: a, b: b, c: c, opcode: operation, type: 1});
        return carry;
    }
    #calculate(operation, a, b) {
        let carry = 0n;
        let c = 0n;
        switch (operation) {
            case ADD:
                return [this.Scalar.band(this.Scalar.add(a, b), MASK_256_BITS), 
                        (((a + b) >> 256n) > 0n) ? 1n : 0n];
        
            case SUB:
                return  [this.Scalar.band(this.Scalar.add(this.Scalar.sub(a, b), P2_256), MASK_256_BITS),
                         ((a - b) < 0n) ? 1n : 0n];
            case LT:
                return [this.Scalar.lt(a, b) ? 1n : 0n];

            case SLT: {                
                const signedA = this.Scalar.geq(a, P2_255) ? this.Scalar.sub(a, P2_256): a;
                const signedB = this.Scalar.geq(b, P2_255) ? this.Scalar.sub(b, P2_256): b;
                return [this.Scalar.lt(signedA, signedB) ? 1n : 0n];
            }

            case EQ:
                return [this.Scalar.eq(a, b) ? 1n : 0n];

            case AND: {
                const c = this.Scalar.band(a, b);
                return [c, this.Scalar.eq(c, 0n) ? 0n:1n];
            }

            case OR: 
                return [this.Scalar.bor(a, b), 0n];
 
            case XOR:
                return [this.Scalar.bxor(a, b), 0n];

            case LT4:
                return [this.lt4(a,b) ? 1n : 0n];

            default:
                throw new Error(`Invalid binary operation #${operation} at ${this.ctx.sourceRef}`);        
        }
    }
    /**
    * Computes the comparison of 256-bit values a,b by dividing them in 4 chunks of 64 bits
    * and comparing the chunks one-to-one.
    * lt4 = (a[0] < b[0]) && (a[1] < b[1]) && (a[2] < b[2]) && (a[3] < b[3]).
    * @param a - Scalar
    * @param b - Scalar
    * @returns 1 if ALL chunks of a are less than those of b, 0 otherwise.
    */
    lt4(a, b) {
        for (let index = 0; index < 4; ++index) {
            if (this.Scalar.lt(this.Scalar.band(this.Scalar.shr(a, 64 * index), MASK64), this.Scalar.band(this.Scalar.shr(b, 64 * index), MASK64)) == false) {
                return 0n;
            }
        }
        return 1n;
    }
}