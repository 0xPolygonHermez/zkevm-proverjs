
const F1Field = require("ffjavascript").F1Field;

class ArithEquationTest {
    constructor() {
        // Field Elliptic Curve (384 bits)
        this.pFec = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
        this.Fec = new F1Field(this.pFec);

        // Field Complex Multiplication BN254 (256 bits)
        this.pBN254 = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
        this.FpBN254 = new F1Field(this.pBN254);

        // Field Complex Multiplication BLS12-381 (384 bits)
        this.pBLS12381 = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
        this.FpBLS12381 = new F1Field(this.pBLS12381);
    
        this.pFr = 0xffffffff00000001n;
        this.Fr = new F1Field(this.pFr);
    }
    chunksToScalar(value, chunkBits = 32n) {
        return value.slice().reverse().reduce((a,v) => (a << chunkBits) + v, 0n);
    }
    inputToScalar(input, chunkBits = 32n) {
        let res = {};
        for (const key in input) {
            if (Array.isArray(input[key]) && input[key].length === 8) {
                res[key] = this.chunksToScalar(input[key], chunkBits);
                continue;
            }
            res[key] = input[key];
        }
        return res;
    }
    test(input) {
        switch (Number(input.arithEquation)) {
            case 5: return this.ARITH_BN254_ADDFP2(input);
            case 8: return this.ARITH_384_MOD(input);
            default:
                throw new Error(`Invalid arithEquation ${input.arithEquation}`);
        }
    }
    ARITH_BN254_ADDFP2(_input) {
        const input = this.inputToScalar(_input);
        const x3 = this.FpBN254.add(this.FpBN254.e(input.x1),this.FpBN254.e(input.x2));
        const y3 = this.FpBN254.add(this.FpBN254.e(input.y1),this.FpBN254.e(input.y2));
        return this.FpBN254.eq(x3, input.x3) && this.FpBN254.eq(y3, input.y3);
    }
    ARITH_384_MOD(_input) {
        // A(x1) * B(y1) + C(x2) - op(y3) - q1 * D(y2) * 2**256 - q0 * D(y2)         - selEq[7]
        const input = this.inputToScalar(_input, 48n);
        console.log(input);
        const y3 = (input.x1 * input.y1 + input.x2) % input.y2;
        console.log({y3, inputy2: input.y2, inputy3: input.y3});
        return y3 == input.y3;
    }
}



const aet = new ArithEquationTest();
const res = aet.test(
{
  x1: [
    724681611n,
    2286270804n,
    2280049358n,
    2602199164n,
    1534497828n,
    258893094n,
    2015597307n,
    111243284n
  ],
  y1: [
    951775604n,
    3069625247n,
    806608021n,
    2328532781n,
    865296505n,
    1976019406n,
    874763620n,
    560529179n
  ],
  x2: [
    3078773710n,
    1074925516n,
    35768941n,
    2615503465n,
    345992421n,
    3593851979n,
    132980382n,
    59927426n
  ],
  y2: [
    3960695689n,
    3869521389n,
    1609939630n,
    2532533992n,
    2310382688n,
    2497997007n,
    2292833578n,
    50488958n
  ],
  x3: [
    0n, 0n, 0n, 0n,
    0n, 0n, 0n, 0n
  ],
  y3: [
    1167055025n,
    1622616683n,
    2730432058n,
    4026759593n,
    3921770525n,
    534875020n,
    577350137n,
    14985753n
  ],
  arithEquation: 8n
}
);
console.log(res);