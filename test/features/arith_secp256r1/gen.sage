from pathlib import Path

source_path = Path(__file__).resolve()
source_dir = source_path.parent

p = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff
K = GF(p)
a = K(0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc)
b = K(0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b)
E = EllipticCurve(K, (a, b))
G = E(0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296, 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5)
E.set_order(0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551 * 0x1)

diagnostic_dir = "../../diagnostic/operations/arith"
f_diff = open(Path.joinpath(source_dir, diagnostic_dir, "secp256r1_ecadd_different_ops.zkasm"), "w")
f_same = open(Path.joinpath(source_dir, diagnostic_dir, "secp256r1_ecadd_same_ops.zkasm"), "w")

def output_operation(f, p1, p2, operation_type):
    pr = p1 + p2
    f.write("\t" + format(int(p1[0]),"#066x") + " => A\n")
    f.write("\t" + format(int(p1[1]),"#066x") + " => B\n")
    f.write("\t" + format(int(p2[0]),"#066x") + " => C\n")
    f.write("\t" + format(int(p2[1]),"#066x") + " => D\n")
    f.write("\t" + format(int(pr[0]),"#066x") + " => E\n")
    f.write("\t" + format(int(pr[1]),"#066x") + " : ARITH_SECP256R1_ECADD_" + operation_type + "\n")
    f.write("\n\t\t\t:CALL(REDUNDANT_ARITH_SECP256R1_ECADD_" + operation_type + "_CHECK)\n\n\n")

special_points = (
    # special points (x:p-3)
    (0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc, 0x19719bebf6aea13f25c96dfd7c71f5225d4c8fc09eb5a0ab9f39e9178e55c121),
    # special points (y:p-1)
    (0x8d0177ebab9c6e9e10db6dd095dbac0d6375e8a97b70f611875d877f0069d2c7,0xffffffff00000001000000000000000000000000fffffffffffffffffffffffe),
    (0x6916fac45e568b6b9e2e2ecd611b282e5fcc40a3067d601057f879ce5a8a73cc,0xffffffff00000001000000000000000000000000fffffffffffffffffffffffe),
    (0x9e78d4ef60d05f750f6636209092bc43cbdd6b47e11a9de20a9feb2a50bb96c,0xffffffff00000001000000000000000000000000fffffffffffffffffffffffe))

for i in range(4):
    p1 = E(special_points[i])
    p2 = E.random_point()
    pr = p1 - p2
    output_operation(f_diff, pr, p2, "DIFFERENT")

p1 = E.random_point()
p2 = G
output_operation(f_diff, pr, p2, "DIFFERENT")


p1 = E.random_point()
p2 = G
pr = p1 - p2
output_operation(f_diff, pr, p2, "DIFFERENT")


p1 = G
p2 = E.random_point()
pr = p1 - p2
output_operation(f_diff, pr, p2, "DIFFERENT")

for i in range(250):
    p1 = E.random_point()
    p2 = E.random_point()
    output_operation(f_diff, p1, p2, "DIFFERENT")
    output_operation(f_same, p1, p1, "SAME")

f_diff.close()
f_same.close()

