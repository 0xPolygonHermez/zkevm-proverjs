pragma circom 2.0.6;
pragma custom_templates;

include "cmul.circom";
include "cinv.circom";
include "poseidon.circom";
include "bitify.circom";
include "fft.circom";
include "merklehash.circom";
include "evalpol.circom";
include "treeselector.circom";


template VerifyEvaluations() {
    signal input challenges[8][3];
    signal input evals[79][3];
    signal input publics[8];
    signal input enable;

    component zMul[24];
    for (var i=0; i< 24 ; i++) {
        zMul[i] = CMul();
        if (i==0) {
            zMul[i].ina[0] <== challenges[7][0];
            zMul[i].ina[1] <== challenges[7][1];
            zMul[i].ina[2] <== challenges[7][2];
            zMul[i].inb[0] <== challenges[7][0];
            zMul[i].inb[1] <== challenges[7][1];
            zMul[i].inb[2] <== challenges[7][2];
        } else {
            zMul[i].ina[0] <== zMul[i-1].out[0];
            zMul[i].ina[1] <== zMul[i-1].out[1];
            zMul[i].ina[2] <== zMul[i-1].out[2];
            zMul[i].inb[0] <== zMul[i-1].out[0];
            zMul[i].inb[1] <== zMul[i-1].out[1];
            zMul[i].inb[2] <== zMul[i-1].out[2];
        }
    }

    signal Z[3];

    Z[0] <== zMul[23].out[0] -1;
    Z[1] <== zMul[23].out[1];
    Z[2] <== zMul[23].out[2];

    signal tmp_0[3];

    tmp_0[0] <== evals[0][0] - publics[0];
    tmp_0[1] <== evals[0][1];
    tmp_0[2] <== evals[0][2];
    signal tmp_1[3];

    component cmul_0 = CMul();
    cmul_0.ina[0] <== evals[1][0];
    cmul_0.ina[1] <== evals[1][1];
    cmul_0.ina[2] <== evals[1][2];
    cmul_0.inb[0] <== tmp_0[0];
    cmul_0.inb[1] <== tmp_0[1];
    cmul_0.inb[2] <== tmp_0[2];
    tmp_1[0] <== cmul_0.out[0];
    tmp_1[1] <== cmul_0.out[1];
    tmp_1[2] <== cmul_0.out[2];
    signal tmp_574[3];

    tmp_574[0] <== tmp_1[0] - 0;
    tmp_574[1] <== tmp_1[1];
    tmp_574[2] <== tmp_1[2];
    signal tmp_2[3];

    tmp_2[0] <== evals[2][0] - publics[1];
    tmp_2[1] <== evals[2][1];
    tmp_2[2] <== evals[2][2];
    signal tmp_3[3];

    component cmul_1 = CMul();
    cmul_1.ina[0] <== evals[1][0];
    cmul_1.ina[1] <== evals[1][1];
    cmul_1.ina[2] <== evals[1][2];
    cmul_1.inb[0] <== tmp_2[0];
    cmul_1.inb[1] <== tmp_2[1];
    cmul_1.inb[2] <== tmp_2[2];
    tmp_3[0] <== cmul_1.out[0];
    tmp_3[1] <== cmul_1.out[1];
    tmp_3[2] <== cmul_1.out[2];
    signal tmp_575[3];

    tmp_575[0] <== tmp_3[0] - 0;
    tmp_575[1] <== tmp_3[1];
    tmp_575[2] <== tmp_3[2];
    signal tmp_4[3];

    tmp_4[0] <== evals[3][0] - publics[2];
    tmp_4[1] <== evals[3][1];
    tmp_4[2] <== evals[3][2];
    signal tmp_5[3];

    component cmul_2 = CMul();
    cmul_2.ina[0] <== evals[1][0];
    cmul_2.ina[1] <== evals[1][1];
    cmul_2.ina[2] <== evals[1][2];
    cmul_2.inb[0] <== tmp_4[0];
    cmul_2.inb[1] <== tmp_4[1];
    cmul_2.inb[2] <== tmp_4[2];
    tmp_5[0] <== cmul_2.out[0];
    tmp_5[1] <== cmul_2.out[1];
    tmp_5[2] <== cmul_2.out[2];
    signal tmp_576[3];

    tmp_576[0] <== tmp_5[0] - 0;
    tmp_576[1] <== tmp_5[1];
    tmp_576[2] <== tmp_5[2];
    signal tmp_6[3];

    tmp_6[0] <== evals[4][0] - publics[3];
    tmp_6[1] <== evals[4][1];
    tmp_6[2] <== evals[4][2];
    signal tmp_7[3];

    component cmul_3 = CMul();
    cmul_3.ina[0] <== evals[1][0];
    cmul_3.ina[1] <== evals[1][1];
    cmul_3.ina[2] <== evals[1][2];
    cmul_3.inb[0] <== tmp_6[0];
    cmul_3.inb[1] <== tmp_6[1];
    cmul_3.inb[2] <== tmp_6[2];
    tmp_7[0] <== cmul_3.out[0];
    tmp_7[1] <== cmul_3.out[1];
    tmp_7[2] <== cmul_3.out[2];
    signal tmp_577[3];

    tmp_577[0] <== tmp_7[0] - 0;
    tmp_577[1] <== tmp_7[1];
    tmp_577[2] <== tmp_7[2];
    signal tmp_8[3];

    tmp_8[0] <== evals[5][0] - publics[4];
    tmp_8[1] <== evals[5][1];
    tmp_8[2] <== evals[5][2];
    signal tmp_9[3];

    component cmul_4 = CMul();
    cmul_4.ina[0] <== evals[1][0];
    cmul_4.ina[1] <== evals[1][1];
    cmul_4.ina[2] <== evals[1][2];
    cmul_4.inb[0] <== tmp_8[0];
    cmul_4.inb[1] <== tmp_8[1];
    cmul_4.inb[2] <== tmp_8[2];
    tmp_9[0] <== cmul_4.out[0];
    tmp_9[1] <== cmul_4.out[1];
    tmp_9[2] <== cmul_4.out[2];
    signal tmp_578[3];

    tmp_578[0] <== tmp_9[0] - 0;
    tmp_578[1] <== tmp_9[1];
    tmp_578[2] <== tmp_9[2];
    signal tmp_10[3];

    tmp_10[0] <== evals[6][0] - publics[5];
    tmp_10[1] <== evals[6][1];
    tmp_10[2] <== evals[6][2];
    signal tmp_11[3];

    component cmul_5 = CMul();
    cmul_5.ina[0] <== evals[1][0];
    cmul_5.ina[1] <== evals[1][1];
    cmul_5.ina[2] <== evals[1][2];
    cmul_5.inb[0] <== tmp_10[0];
    cmul_5.inb[1] <== tmp_10[1];
    cmul_5.inb[2] <== tmp_10[2];
    tmp_11[0] <== cmul_5.out[0];
    tmp_11[1] <== cmul_5.out[1];
    tmp_11[2] <== cmul_5.out[2];
    signal tmp_579[3];

    tmp_579[0] <== tmp_11[0] - 0;
    tmp_579[1] <== tmp_11[1];
    tmp_579[2] <== tmp_11[2];
    signal tmp_12[3];

    tmp_12[0] <== evals[7][0] - publics[6];
    tmp_12[1] <== evals[7][1];
    tmp_12[2] <== evals[7][2];
    signal tmp_13[3];

    component cmul_6 = CMul();
    cmul_6.ina[0] <== evals[1][0];
    cmul_6.ina[1] <== evals[1][1];
    cmul_6.ina[2] <== evals[1][2];
    cmul_6.inb[0] <== tmp_12[0];
    cmul_6.inb[1] <== tmp_12[1];
    cmul_6.inb[2] <== tmp_12[2];
    tmp_13[0] <== cmul_6.out[0];
    tmp_13[1] <== cmul_6.out[1];
    tmp_13[2] <== cmul_6.out[2];
    signal tmp_580[3];

    tmp_580[0] <== tmp_13[0] - 0;
    tmp_580[1] <== tmp_13[1];
    tmp_580[2] <== tmp_13[2];
    signal tmp_14[3];

    tmp_14[0] <== evals[8][0] - publics[7];
    tmp_14[1] <== evals[8][1];
    tmp_14[2] <== evals[8][2];
    signal tmp_15[3];

    component cmul_7 = CMul();
    cmul_7.ina[0] <== evals[1][0];
    cmul_7.ina[1] <== evals[1][1];
    cmul_7.ina[2] <== evals[1][2];
    cmul_7.inb[0] <== tmp_14[0];
    cmul_7.inb[1] <== tmp_14[1];
    cmul_7.inb[2] <== tmp_14[2];
    tmp_15[0] <== cmul_7.out[0];
    tmp_15[1] <== cmul_7.out[1];
    tmp_15[2] <== cmul_7.out[2];
    signal tmp_581[3];

    tmp_581[0] <== tmp_15[0] - 0;
    tmp_581[1] <== tmp_15[1];
    tmp_581[2] <== tmp_15[2];
    signal tmp_16[3];

    component cmul_8 = CMul();
    cmul_8.ina[0] <== evals[0][0];
    cmul_8.ina[1] <== evals[0][1];
    cmul_8.ina[2] <== evals[0][2];
    cmul_8.inb[0] <== evals[2][0];
    cmul_8.inb[1] <== evals[2][1];
    cmul_8.inb[2] <== evals[2][2];
    tmp_16[0] <== cmul_8.out[0];
    tmp_16[1] <== cmul_8.out[1];
    tmp_16[2] <== cmul_8.out[2];
    signal tmp_17[3];

    component cmul_9 = CMul();
    cmul_9.ina[0] <== evals[9][0];
    cmul_9.ina[1] <== evals[9][1];
    cmul_9.ina[2] <== evals[9][2];
    cmul_9.inb[0] <== Z[0];
    cmul_9.inb[1] <== Z[1];
    cmul_9.inb[2] <== Z[2];
    tmp_17[0] <== cmul_9.out[0];
    tmp_17[1] <== cmul_9.out[1];
    tmp_17[2] <== cmul_9.out[2];
    signal tmp_582[3];

    tmp_582[0] <== tmp_16[0] - tmp_17[0];
    tmp_582[1] <== tmp_16[1] - tmp_17[1];
    tmp_582[2] <== tmp_16[2] - tmp_17[2];
    signal tmp_18[3];

    component cmul_10 = CMul();
    cmul_10.ina[0] <== evals[10][0];
    cmul_10.ina[1] <== evals[10][1];
    cmul_10.ina[2] <== evals[10][2];
    cmul_10.inb[0] <== tmp_582[0];
    cmul_10.inb[1] <== tmp_582[1];
    cmul_10.inb[2] <== tmp_582[2];
    tmp_18[0] <== cmul_10.out[0];
    tmp_18[1] <== cmul_10.out[1];
    tmp_18[2] <== cmul_10.out[2];
    signal tmp_19[3];

    component cmul_11 = CMul();
    cmul_11.ina[0] <== evals[11][0];
    cmul_11.ina[1] <== evals[11][1];
    cmul_11.ina[2] <== evals[11][2];
    cmul_11.inb[0] <== evals[0][0];
    cmul_11.inb[1] <== evals[0][1];
    cmul_11.inb[2] <== evals[0][2];
    tmp_19[0] <== cmul_11.out[0];
    tmp_19[1] <== cmul_11.out[1];
    tmp_19[2] <== cmul_11.out[2];
    signal tmp_20[3];

    tmp_20[0] <== tmp_18[0] + tmp_19[0];
    tmp_20[1] <== tmp_18[1] + tmp_19[1];
    tmp_20[2] <== tmp_18[2] + tmp_19[2];
    signal tmp_21[3];

    component cmul_12 = CMul();
    cmul_12.ina[0] <== evals[12][0];
    cmul_12.ina[1] <== evals[12][1];
    cmul_12.ina[2] <== evals[12][2];
    cmul_12.inb[0] <== evals[2][0];
    cmul_12.inb[1] <== evals[2][1];
    cmul_12.inb[2] <== evals[2][2];
    tmp_21[0] <== cmul_12.out[0];
    tmp_21[1] <== cmul_12.out[1];
    tmp_21[2] <== cmul_12.out[2];
    signal tmp_22[3];

    tmp_22[0] <== tmp_20[0] + tmp_21[0];
    tmp_22[1] <== tmp_20[1] + tmp_21[1];
    tmp_22[2] <== tmp_20[2] + tmp_21[2];
    signal tmp_23[3];

    component cmul_13 = CMul();
    cmul_13.ina[0] <== evals[13][0];
    cmul_13.ina[1] <== evals[13][1];
    cmul_13.ina[2] <== evals[13][2];
    cmul_13.inb[0] <== evals[3][0];
    cmul_13.inb[1] <== evals[3][1];
    cmul_13.inb[2] <== evals[3][2];
    tmp_23[0] <== cmul_13.out[0];
    tmp_23[1] <== cmul_13.out[1];
    tmp_23[2] <== cmul_13.out[2];
    signal tmp_24[3];

    tmp_24[0] <== tmp_22[0] + tmp_23[0];
    tmp_24[1] <== tmp_22[1] + tmp_23[1];
    tmp_24[2] <== tmp_22[2] + tmp_23[2];
    signal tmp_25[3];

    tmp_25[0] <== tmp_24[0] + evals[14][0];
    tmp_25[1] <== tmp_24[1] + evals[14][1];
    tmp_25[2] <== tmp_24[2] + evals[14][2];
    signal tmp_583[3];

    tmp_583[0] <== tmp_25[0] - 0;
    tmp_583[1] <== tmp_25[1];
    tmp_583[2] <== tmp_25[2];
    signal tmp_26[3];

    component cmul_14 = CMul();
    cmul_14.ina[0] <== evals[4][0];
    cmul_14.ina[1] <== evals[4][1];
    cmul_14.ina[2] <== evals[4][2];
    cmul_14.inb[0] <== evals[5][0];
    cmul_14.inb[1] <== evals[5][1];
    cmul_14.inb[2] <== evals[5][2];
    tmp_26[0] <== cmul_14.out[0];
    tmp_26[1] <== cmul_14.out[1];
    tmp_26[2] <== cmul_14.out[2];
    signal tmp_27[3];

    component cmul_15 = CMul();
    cmul_15.ina[0] <== evals[15][0];
    cmul_15.ina[1] <== evals[15][1];
    cmul_15.ina[2] <== evals[15][2];
    cmul_15.inb[0] <== Z[0];
    cmul_15.inb[1] <== Z[1];
    cmul_15.inb[2] <== Z[2];
    tmp_27[0] <== cmul_15.out[0];
    tmp_27[1] <== cmul_15.out[1];
    tmp_27[2] <== cmul_15.out[2];
    signal tmp_584[3];

    tmp_584[0] <== tmp_26[0] - tmp_27[0];
    tmp_584[1] <== tmp_26[1] - tmp_27[1];
    tmp_584[2] <== tmp_26[2] - tmp_27[2];
    signal tmp_28[3];

    component cmul_16 = CMul();
    cmul_16.ina[0] <== evals[10][0];
    cmul_16.ina[1] <== evals[10][1];
    cmul_16.ina[2] <== evals[10][2];
    cmul_16.inb[0] <== tmp_584[0];
    cmul_16.inb[1] <== tmp_584[1];
    cmul_16.inb[2] <== tmp_584[2];
    tmp_28[0] <== cmul_16.out[0];
    tmp_28[1] <== cmul_16.out[1];
    tmp_28[2] <== cmul_16.out[2];
    signal tmp_29[3];

    component cmul_17 = CMul();
    cmul_17.ina[0] <== evals[11][0];
    cmul_17.ina[1] <== evals[11][1];
    cmul_17.ina[2] <== evals[11][2];
    cmul_17.inb[0] <== evals[4][0];
    cmul_17.inb[1] <== evals[4][1];
    cmul_17.inb[2] <== evals[4][2];
    tmp_29[0] <== cmul_17.out[0];
    tmp_29[1] <== cmul_17.out[1];
    tmp_29[2] <== cmul_17.out[2];
    signal tmp_30[3];

    tmp_30[0] <== tmp_28[0] + tmp_29[0];
    tmp_30[1] <== tmp_28[1] + tmp_29[1];
    tmp_30[2] <== tmp_28[2] + tmp_29[2];
    signal tmp_31[3];

    component cmul_18 = CMul();
    cmul_18.ina[0] <== evals[12][0];
    cmul_18.ina[1] <== evals[12][1];
    cmul_18.ina[2] <== evals[12][2];
    cmul_18.inb[0] <== evals[5][0];
    cmul_18.inb[1] <== evals[5][1];
    cmul_18.inb[2] <== evals[5][2];
    tmp_31[0] <== cmul_18.out[0];
    tmp_31[1] <== cmul_18.out[1];
    tmp_31[2] <== cmul_18.out[2];
    signal tmp_32[3];

    tmp_32[0] <== tmp_30[0] + tmp_31[0];
    tmp_32[1] <== tmp_30[1] + tmp_31[1];
    tmp_32[2] <== tmp_30[2] + tmp_31[2];
    signal tmp_33[3];

    component cmul_19 = CMul();
    cmul_19.ina[0] <== evals[13][0];
    cmul_19.ina[1] <== evals[13][1];
    cmul_19.ina[2] <== evals[13][2];
    cmul_19.inb[0] <== evals[6][0];
    cmul_19.inb[1] <== evals[6][1];
    cmul_19.inb[2] <== evals[6][2];
    tmp_33[0] <== cmul_19.out[0];
    tmp_33[1] <== cmul_19.out[1];
    tmp_33[2] <== cmul_19.out[2];
    signal tmp_34[3];

    tmp_34[0] <== tmp_32[0] + tmp_33[0];
    tmp_34[1] <== tmp_32[1] + tmp_33[1];
    tmp_34[2] <== tmp_32[2] + tmp_33[2];
    signal tmp_35[3];

    tmp_35[0] <== tmp_34[0] + evals[14][0];
    tmp_35[1] <== tmp_34[1] + evals[14][1];
    tmp_35[2] <== tmp_34[2] + evals[14][2];
    signal tmp_585[3];

    tmp_585[0] <== tmp_35[0] - 0;
    tmp_585[1] <== tmp_35[1];
    tmp_585[2] <== tmp_35[2];
    signal tmp_36[3];

    component cmul_20 = CMul();
    cmul_20.ina[0] <== evals[7][0];
    cmul_20.ina[1] <== evals[7][1];
    cmul_20.ina[2] <== evals[7][2];
    cmul_20.inb[0] <== evals[8][0];
    cmul_20.inb[1] <== evals[8][1];
    cmul_20.inb[2] <== evals[8][2];
    tmp_36[0] <== cmul_20.out[0];
    tmp_36[1] <== cmul_20.out[1];
    tmp_36[2] <== cmul_20.out[2];
    signal tmp_37[3];

    component cmul_21 = CMul();
    cmul_21.ina[0] <== evals[16][0];
    cmul_21.ina[1] <== evals[16][1];
    cmul_21.ina[2] <== evals[16][2];
    cmul_21.inb[0] <== Z[0];
    cmul_21.inb[1] <== Z[1];
    cmul_21.inb[2] <== Z[2];
    tmp_37[0] <== cmul_21.out[0];
    tmp_37[1] <== cmul_21.out[1];
    tmp_37[2] <== cmul_21.out[2];
    signal tmp_586[3];

    tmp_586[0] <== tmp_36[0] - tmp_37[0];
    tmp_586[1] <== tmp_36[1] - tmp_37[1];
    tmp_586[2] <== tmp_36[2] - tmp_37[2];
    signal tmp_38[3];

    component cmul_22 = CMul();
    cmul_22.ina[0] <== evals[10][0];
    cmul_22.ina[1] <== evals[10][1];
    cmul_22.ina[2] <== evals[10][2];
    cmul_22.inb[0] <== tmp_586[0];
    cmul_22.inb[1] <== tmp_586[1];
    cmul_22.inb[2] <== tmp_586[2];
    tmp_38[0] <== cmul_22.out[0];
    tmp_38[1] <== cmul_22.out[1];
    tmp_38[2] <== cmul_22.out[2];
    signal tmp_39[3];

    component cmul_23 = CMul();
    cmul_23.ina[0] <== evals[11][0];
    cmul_23.ina[1] <== evals[11][1];
    cmul_23.ina[2] <== evals[11][2];
    cmul_23.inb[0] <== evals[7][0];
    cmul_23.inb[1] <== evals[7][1];
    cmul_23.inb[2] <== evals[7][2];
    tmp_39[0] <== cmul_23.out[0];
    tmp_39[1] <== cmul_23.out[1];
    tmp_39[2] <== cmul_23.out[2];
    signal tmp_40[3];

    tmp_40[0] <== tmp_38[0] + tmp_39[0];
    tmp_40[1] <== tmp_38[1] + tmp_39[1];
    tmp_40[2] <== tmp_38[2] + tmp_39[2];
    signal tmp_41[3];

    component cmul_24 = CMul();
    cmul_24.ina[0] <== evals[12][0];
    cmul_24.ina[1] <== evals[12][1];
    cmul_24.ina[2] <== evals[12][2];
    cmul_24.inb[0] <== evals[8][0];
    cmul_24.inb[1] <== evals[8][1];
    cmul_24.inb[2] <== evals[8][2];
    tmp_41[0] <== cmul_24.out[0];
    tmp_41[1] <== cmul_24.out[1];
    tmp_41[2] <== cmul_24.out[2];
    signal tmp_42[3];

    tmp_42[0] <== tmp_40[0] + tmp_41[0];
    tmp_42[1] <== tmp_40[1] + tmp_41[1];
    tmp_42[2] <== tmp_40[2] + tmp_41[2];
    signal tmp_43[3];

    component cmul_25 = CMul();
    cmul_25.ina[0] <== evals[13][0];
    cmul_25.ina[1] <== evals[13][1];
    cmul_25.ina[2] <== evals[13][2];
    cmul_25.inb[0] <== evals[17][0];
    cmul_25.inb[1] <== evals[17][1];
    cmul_25.inb[2] <== evals[17][2];
    tmp_43[0] <== cmul_25.out[0];
    tmp_43[1] <== cmul_25.out[1];
    tmp_43[2] <== cmul_25.out[2];
    signal tmp_44[3];

    tmp_44[0] <== tmp_42[0] + tmp_43[0];
    tmp_44[1] <== tmp_42[1] + tmp_43[1];
    tmp_44[2] <== tmp_42[2] + tmp_43[2];
    signal tmp_45[3];

    tmp_45[0] <== tmp_44[0] + evals[14][0];
    tmp_45[1] <== tmp_44[1] + evals[14][1];
    tmp_45[2] <== tmp_44[2] + evals[14][2];
    signal tmp_587[3];

    tmp_587[0] <== tmp_45[0] - 0;
    tmp_587[1] <== tmp_45[1];
    tmp_587[2] <== tmp_45[2];
    signal tmp_46[3];

    component cmul_26 = CMul();
    cmul_26.ina[0] <== evals[18][0];
    cmul_26.ina[1] <== evals[18][1];
    cmul_26.ina[2] <== evals[18][2];
    cmul_26.inb[0] <== evals[19][0];
    cmul_26.inb[1] <== evals[19][1];
    cmul_26.inb[2] <== evals[19][2];
    tmp_46[0] <== cmul_26.out[0];
    tmp_46[1] <== cmul_26.out[1];
    tmp_46[2] <== cmul_26.out[2];
    signal tmp_47[3];

    component cmul_27 = CMul();
    cmul_27.ina[0] <== evals[20][0];
    cmul_27.ina[1] <== evals[20][1];
    cmul_27.ina[2] <== evals[20][2];
    cmul_27.inb[0] <== Z[0];
    cmul_27.inb[1] <== Z[1];
    cmul_27.inb[2] <== Z[2];
    tmp_47[0] <== cmul_27.out[0];
    tmp_47[1] <== cmul_27.out[1];
    tmp_47[2] <== cmul_27.out[2];
    signal tmp_588[3];

    tmp_588[0] <== tmp_46[0] - tmp_47[0];
    tmp_588[1] <== tmp_46[1] - tmp_47[1];
    tmp_588[2] <== tmp_46[2] - tmp_47[2];
    signal tmp_48[3];

    component cmul_28 = CMul();
    cmul_28.ina[0] <== evals[10][0];
    cmul_28.ina[1] <== evals[10][1];
    cmul_28.ina[2] <== evals[10][2];
    cmul_28.inb[0] <== tmp_588[0];
    cmul_28.inb[1] <== tmp_588[1];
    cmul_28.inb[2] <== tmp_588[2];
    tmp_48[0] <== cmul_28.out[0];
    tmp_48[1] <== cmul_28.out[1];
    tmp_48[2] <== cmul_28.out[2];
    signal tmp_49[3];

    component cmul_29 = CMul();
    cmul_29.ina[0] <== evals[11][0];
    cmul_29.ina[1] <== evals[11][1];
    cmul_29.ina[2] <== evals[11][2];
    cmul_29.inb[0] <== evals[18][0];
    cmul_29.inb[1] <== evals[18][1];
    cmul_29.inb[2] <== evals[18][2];
    tmp_49[0] <== cmul_29.out[0];
    tmp_49[1] <== cmul_29.out[1];
    tmp_49[2] <== cmul_29.out[2];
    signal tmp_50[3];

    tmp_50[0] <== tmp_48[0] + tmp_49[0];
    tmp_50[1] <== tmp_48[1] + tmp_49[1];
    tmp_50[2] <== tmp_48[2] + tmp_49[2];
    signal tmp_51[3];

    component cmul_30 = CMul();
    cmul_30.ina[0] <== evals[12][0];
    cmul_30.ina[1] <== evals[12][1];
    cmul_30.ina[2] <== evals[12][2];
    cmul_30.inb[0] <== evals[19][0];
    cmul_30.inb[1] <== evals[19][1];
    cmul_30.inb[2] <== evals[19][2];
    tmp_51[0] <== cmul_30.out[0];
    tmp_51[1] <== cmul_30.out[1];
    tmp_51[2] <== cmul_30.out[2];
    signal tmp_52[3];

    tmp_52[0] <== tmp_50[0] + tmp_51[0];
    tmp_52[1] <== tmp_50[1] + tmp_51[1];
    tmp_52[2] <== tmp_50[2] + tmp_51[2];
    signal tmp_53[3];

    component cmul_31 = CMul();
    cmul_31.ina[0] <== evals[13][0];
    cmul_31.ina[1] <== evals[13][1];
    cmul_31.ina[2] <== evals[13][2];
    cmul_31.inb[0] <== evals[21][0];
    cmul_31.inb[1] <== evals[21][1];
    cmul_31.inb[2] <== evals[21][2];
    tmp_53[0] <== cmul_31.out[0];
    tmp_53[1] <== cmul_31.out[1];
    tmp_53[2] <== cmul_31.out[2];
    signal tmp_54[3];

    tmp_54[0] <== tmp_52[0] + tmp_53[0];
    tmp_54[1] <== tmp_52[1] + tmp_53[1];
    tmp_54[2] <== tmp_52[2] + tmp_53[2];
    signal tmp_55[3];

    tmp_55[0] <== tmp_54[0] + evals[14][0];
    tmp_55[1] <== tmp_54[1] + evals[14][1];
    tmp_55[2] <== tmp_54[2] + evals[14][2];
    signal tmp_589[3];

    tmp_589[0] <== tmp_55[0] - 0;
    tmp_589[1] <== tmp_55[1];
    tmp_589[2] <== tmp_55[2];
    signal tmp_56[3];

    tmp_56[0] <== 25 * evals[0][0];
    tmp_56[1] <== 25 * evals[0][1];
    tmp_56[2] <== 25 * evals[0][2];
    signal tmp_57[3];

    tmp_57[0] <== 15 * evals[2][0];
    tmp_57[1] <== 15 * evals[2][1];
    tmp_57[2] <== 15 * evals[2][2];
    signal tmp_58[3];

    tmp_58[0] <== tmp_56[0] + tmp_57[0];
    tmp_58[1] <== tmp_56[1] + tmp_57[1];
    tmp_58[2] <== tmp_56[2] + tmp_57[2];
    signal tmp_59[3];

    tmp_59[0] <== 41 * evals[3][0];
    tmp_59[1] <== 41 * evals[3][1];
    tmp_59[2] <== 41 * evals[3][2];
    signal tmp_60[3];

    tmp_60[0] <== tmp_58[0] + tmp_59[0];
    tmp_60[1] <== tmp_58[1] + tmp_59[1];
    tmp_60[2] <== tmp_58[2] + tmp_59[2];
    signal tmp_61[3];

    tmp_61[0] <== 16 * evals[4][0];
    tmp_61[1] <== 16 * evals[4][1];
    tmp_61[2] <== 16 * evals[4][2];
    signal tmp_62[3];

    tmp_62[0] <== tmp_60[0] + tmp_61[0];
    tmp_62[1] <== tmp_60[1] + tmp_61[1];
    tmp_62[2] <== tmp_60[2] + tmp_61[2];
    signal tmp_63[3];

    tmp_63[0] <== 2 * evals[5][0];
    tmp_63[1] <== 2 * evals[5][1];
    tmp_63[2] <== 2 * evals[5][2];
    signal tmp_64[3];

    tmp_64[0] <== tmp_62[0] + tmp_63[0];
    tmp_64[1] <== tmp_62[1] + tmp_63[1];
    tmp_64[2] <== tmp_62[2] + tmp_63[2];
    signal tmp_65[3];

    tmp_65[0] <== 28 * evals[6][0];
    tmp_65[1] <== 28 * evals[6][1];
    tmp_65[2] <== 28 * evals[6][2];
    signal tmp_66[3];

    tmp_66[0] <== tmp_64[0] + tmp_65[0];
    tmp_66[1] <== tmp_64[1] + tmp_65[1];
    tmp_66[2] <== tmp_64[2] + tmp_65[2];
    signal tmp_67[3];

    tmp_67[0] <== 13 * evals[7][0];
    tmp_67[1] <== 13 * evals[7][1];
    tmp_67[2] <== 13 * evals[7][2];
    signal tmp_68[3];

    tmp_68[0] <== tmp_66[0] + tmp_67[0];
    tmp_68[1] <== tmp_66[1] + tmp_67[1];
    tmp_68[2] <== tmp_66[2] + tmp_67[2];
    signal tmp_69[3];

    tmp_69[0] <== 13 * evals[8][0];
    tmp_69[1] <== 13 * evals[8][1];
    tmp_69[2] <== 13 * evals[8][2];
    signal tmp_70[3];

    tmp_70[0] <== tmp_68[0] + tmp_69[0];
    tmp_70[1] <== tmp_68[1] + tmp_69[1];
    tmp_70[2] <== tmp_68[2] + tmp_69[2];
    signal tmp_71[3];

    tmp_71[0] <== 39 * evals[17][0];
    tmp_71[1] <== 39 * evals[17][1];
    tmp_71[2] <== 39 * evals[17][2];
    signal tmp_72[3];

    tmp_72[0] <== tmp_70[0] + tmp_71[0];
    tmp_72[1] <== tmp_70[1] + tmp_71[1];
    tmp_72[2] <== tmp_70[2] + tmp_71[2];
    signal tmp_73[3];

    tmp_73[0] <== 18 * evals[18][0];
    tmp_73[1] <== 18 * evals[18][1];
    tmp_73[2] <== 18 * evals[18][2];
    signal tmp_74[3];

    tmp_74[0] <== tmp_72[0] + tmp_73[0];
    tmp_74[1] <== tmp_72[1] + tmp_73[1];
    tmp_74[2] <== tmp_72[2] + tmp_73[2];
    signal tmp_75[3];

    tmp_75[0] <== 34 * evals[19][0];
    tmp_75[1] <== 34 * evals[19][1];
    tmp_75[2] <== 34 * evals[19][2];
    signal tmp_76[3];

    tmp_76[0] <== tmp_74[0] + tmp_75[0];
    tmp_76[1] <== tmp_74[1] + tmp_75[1];
    tmp_76[2] <== tmp_74[2] + tmp_75[2];
    signal tmp_77[3];

    tmp_77[0] <== 20 * evals[21][0];
    tmp_77[1] <== 20 * evals[21][1];
    tmp_77[2] <== 20 * evals[21][2];
    signal tmp_78[3];

    tmp_78[0] <== tmp_76[0] + tmp_77[0];
    tmp_78[1] <== tmp_76[1] + tmp_77[1];
    tmp_78[2] <== tmp_76[2] + tmp_77[2];
    signal tmp_79[3];

    tmp_79[0] <== evals[22][0] - tmp_78[0];
    tmp_79[1] <== evals[22][1] - tmp_78[1];
    tmp_79[2] <== evals[22][2] - tmp_78[2];
    signal tmp_80[3];

    component cmul_32 = CMul();
    cmul_32.ina[0] <== evals[23][0];
    cmul_32.ina[1] <== evals[23][1];
    cmul_32.ina[2] <== evals[23][2];
    cmul_32.inb[0] <== tmp_79[0];
    cmul_32.inb[1] <== tmp_79[1];
    cmul_32.inb[2] <== tmp_79[2];
    tmp_80[0] <== cmul_32.out[0];
    tmp_80[1] <== cmul_32.out[1];
    tmp_80[2] <== cmul_32.out[2];
    signal tmp_590[3];

    tmp_590[0] <== tmp_80[0] - 0;
    tmp_590[1] <== tmp_80[1];
    tmp_590[2] <== tmp_80[2];
    signal tmp_81[3];

    tmp_81[0] <== 20 * evals[0][0];
    tmp_81[1] <== 20 * evals[0][1];
    tmp_81[2] <== 20 * evals[0][2];
    signal tmp_82[3];

    tmp_82[0] <== 17 * evals[2][0];
    tmp_82[1] <== 17 * evals[2][1];
    tmp_82[2] <== 17 * evals[2][2];
    signal tmp_83[3];

    tmp_83[0] <== tmp_81[0] + tmp_82[0];
    tmp_83[1] <== tmp_81[1] + tmp_82[1];
    tmp_83[2] <== tmp_81[2] + tmp_82[2];
    signal tmp_84[3];

    tmp_84[0] <== 15 * evals[3][0];
    tmp_84[1] <== 15 * evals[3][1];
    tmp_84[2] <== 15 * evals[3][2];
    signal tmp_85[3];

    tmp_85[0] <== tmp_83[0] + tmp_84[0];
    tmp_85[1] <== tmp_83[1] + tmp_84[1];
    tmp_85[2] <== tmp_83[2] + tmp_84[2];
    signal tmp_86[3];

    tmp_86[0] <== 41 * evals[4][0];
    tmp_86[1] <== 41 * evals[4][1];
    tmp_86[2] <== 41 * evals[4][2];
    signal tmp_87[3];

    tmp_87[0] <== tmp_85[0] + tmp_86[0];
    tmp_87[1] <== tmp_85[1] + tmp_86[1];
    tmp_87[2] <== tmp_85[2] + tmp_86[2];
    signal tmp_88[3];

    tmp_88[0] <== 16 * evals[5][0];
    tmp_88[1] <== 16 * evals[5][1];
    tmp_88[2] <== 16 * evals[5][2];
    signal tmp_89[3];

    tmp_89[0] <== tmp_87[0] + tmp_88[0];
    tmp_89[1] <== tmp_87[1] + tmp_88[1];
    tmp_89[2] <== tmp_87[2] + tmp_88[2];
    signal tmp_90[3];

    tmp_90[0] <== 2 * evals[6][0];
    tmp_90[1] <== 2 * evals[6][1];
    tmp_90[2] <== 2 * evals[6][2];
    signal tmp_91[3];

    tmp_91[0] <== tmp_89[0] + tmp_90[0];
    tmp_91[1] <== tmp_89[1] + tmp_90[1];
    tmp_91[2] <== tmp_89[2] + tmp_90[2];
    signal tmp_92[3];

    tmp_92[0] <== 28 * evals[7][0];
    tmp_92[1] <== 28 * evals[7][1];
    tmp_92[2] <== 28 * evals[7][2];
    signal tmp_93[3];

    tmp_93[0] <== tmp_91[0] + tmp_92[0];
    tmp_93[1] <== tmp_91[1] + tmp_92[1];
    tmp_93[2] <== tmp_91[2] + tmp_92[2];
    signal tmp_94[3];

    tmp_94[0] <== 13 * evals[8][0];
    tmp_94[1] <== 13 * evals[8][1];
    tmp_94[2] <== 13 * evals[8][2];
    signal tmp_95[3];

    tmp_95[0] <== tmp_93[0] + tmp_94[0];
    tmp_95[1] <== tmp_93[1] + tmp_94[1];
    tmp_95[2] <== tmp_93[2] + tmp_94[2];
    signal tmp_96[3];

    tmp_96[0] <== 13 * evals[17][0];
    tmp_96[1] <== 13 * evals[17][1];
    tmp_96[2] <== 13 * evals[17][2];
    signal tmp_97[3];

    tmp_97[0] <== tmp_95[0] + tmp_96[0];
    tmp_97[1] <== tmp_95[1] + tmp_96[1];
    tmp_97[2] <== tmp_95[2] + tmp_96[2];
    signal tmp_98[3];

    tmp_98[0] <== 39 * evals[18][0];
    tmp_98[1] <== 39 * evals[18][1];
    tmp_98[2] <== 39 * evals[18][2];
    signal tmp_99[3];

    tmp_99[0] <== tmp_97[0] + tmp_98[0];
    tmp_99[1] <== tmp_97[1] + tmp_98[1];
    tmp_99[2] <== tmp_97[2] + tmp_98[2];
    signal tmp_100[3];

    tmp_100[0] <== 18 * evals[19][0];
    tmp_100[1] <== 18 * evals[19][1];
    tmp_100[2] <== 18 * evals[19][2];
    signal tmp_101[3];

    tmp_101[0] <== tmp_99[0] + tmp_100[0];
    tmp_101[1] <== tmp_99[1] + tmp_100[1];
    tmp_101[2] <== tmp_99[2] + tmp_100[2];
    signal tmp_102[3];

    tmp_102[0] <== 34 * evals[21][0];
    tmp_102[1] <== 34 * evals[21][1];
    tmp_102[2] <== 34 * evals[21][2];
    signal tmp_103[3];

    tmp_103[0] <== tmp_101[0] + tmp_102[0];
    tmp_103[1] <== tmp_101[1] + tmp_102[1];
    tmp_103[2] <== tmp_101[2] + tmp_102[2];
    signal tmp_104[3];

    tmp_104[0] <== evals[24][0] - tmp_103[0];
    tmp_104[1] <== evals[24][1] - tmp_103[1];
    tmp_104[2] <== evals[24][2] - tmp_103[2];
    signal tmp_105[3];

    component cmul_33 = CMul();
    cmul_33.ina[0] <== evals[23][0];
    cmul_33.ina[1] <== evals[23][1];
    cmul_33.ina[2] <== evals[23][2];
    cmul_33.inb[0] <== tmp_104[0];
    cmul_33.inb[1] <== tmp_104[1];
    cmul_33.inb[2] <== tmp_104[2];
    tmp_105[0] <== cmul_33.out[0];
    tmp_105[1] <== cmul_33.out[1];
    tmp_105[2] <== cmul_33.out[2];
    signal tmp_591[3];

    tmp_591[0] <== tmp_105[0] - 0;
    tmp_591[1] <== tmp_105[1];
    tmp_591[2] <== tmp_105[2];
    signal tmp_106[3];

    tmp_106[0] <== 34 * evals[0][0];
    tmp_106[1] <== 34 * evals[0][1];
    tmp_106[2] <== 34 * evals[0][2];
    signal tmp_107[3];

    tmp_107[0] <== 20 * evals[2][0];
    tmp_107[1] <== 20 * evals[2][1];
    tmp_107[2] <== 20 * evals[2][2];
    signal tmp_108[3];

    tmp_108[0] <== tmp_106[0] + tmp_107[0];
    tmp_108[1] <== tmp_106[1] + tmp_107[1];
    tmp_108[2] <== tmp_106[2] + tmp_107[2];
    signal tmp_109[3];

    tmp_109[0] <== 17 * evals[3][0];
    tmp_109[1] <== 17 * evals[3][1];
    tmp_109[2] <== 17 * evals[3][2];
    signal tmp_110[3];

    tmp_110[0] <== tmp_108[0] + tmp_109[0];
    tmp_110[1] <== tmp_108[1] + tmp_109[1];
    tmp_110[2] <== tmp_108[2] + tmp_109[2];
    signal tmp_111[3];

    tmp_111[0] <== 15 * evals[4][0];
    tmp_111[1] <== 15 * evals[4][1];
    tmp_111[2] <== 15 * evals[4][2];
    signal tmp_112[3];

    tmp_112[0] <== tmp_110[0] + tmp_111[0];
    tmp_112[1] <== tmp_110[1] + tmp_111[1];
    tmp_112[2] <== tmp_110[2] + tmp_111[2];
    signal tmp_113[3];

    tmp_113[0] <== 41 * evals[5][0];
    tmp_113[1] <== 41 * evals[5][1];
    tmp_113[2] <== 41 * evals[5][2];
    signal tmp_114[3];

    tmp_114[0] <== tmp_112[0] + tmp_113[0];
    tmp_114[1] <== tmp_112[1] + tmp_113[1];
    tmp_114[2] <== tmp_112[2] + tmp_113[2];
    signal tmp_115[3];

    tmp_115[0] <== 16 * evals[6][0];
    tmp_115[1] <== 16 * evals[6][1];
    tmp_115[2] <== 16 * evals[6][2];
    signal tmp_116[3];

    tmp_116[0] <== tmp_114[0] + tmp_115[0];
    tmp_116[1] <== tmp_114[1] + tmp_115[1];
    tmp_116[2] <== tmp_114[2] + tmp_115[2];
    signal tmp_117[3];

    tmp_117[0] <== 2 * evals[7][0];
    tmp_117[1] <== 2 * evals[7][1];
    tmp_117[2] <== 2 * evals[7][2];
    signal tmp_118[3];

    tmp_118[0] <== tmp_116[0] + tmp_117[0];
    tmp_118[1] <== tmp_116[1] + tmp_117[1];
    tmp_118[2] <== tmp_116[2] + tmp_117[2];
    signal tmp_119[3];

    tmp_119[0] <== 28 * evals[8][0];
    tmp_119[1] <== 28 * evals[8][1];
    tmp_119[2] <== 28 * evals[8][2];
    signal tmp_120[3];

    tmp_120[0] <== tmp_118[0] + tmp_119[0];
    tmp_120[1] <== tmp_118[1] + tmp_119[1];
    tmp_120[2] <== tmp_118[2] + tmp_119[2];
    signal tmp_121[3];

    tmp_121[0] <== 13 * evals[17][0];
    tmp_121[1] <== 13 * evals[17][1];
    tmp_121[2] <== 13 * evals[17][2];
    signal tmp_122[3];

    tmp_122[0] <== tmp_120[0] + tmp_121[0];
    tmp_122[1] <== tmp_120[1] + tmp_121[1];
    tmp_122[2] <== tmp_120[2] + tmp_121[2];
    signal tmp_123[3];

    tmp_123[0] <== 13 * evals[18][0];
    tmp_123[1] <== 13 * evals[18][1];
    tmp_123[2] <== 13 * evals[18][2];
    signal tmp_124[3];

    tmp_124[0] <== tmp_122[0] + tmp_123[0];
    tmp_124[1] <== tmp_122[1] + tmp_123[1];
    tmp_124[2] <== tmp_122[2] + tmp_123[2];
    signal tmp_125[3];

    tmp_125[0] <== 39 * evals[19][0];
    tmp_125[1] <== 39 * evals[19][1];
    tmp_125[2] <== 39 * evals[19][2];
    signal tmp_126[3];

    tmp_126[0] <== tmp_124[0] + tmp_125[0];
    tmp_126[1] <== tmp_124[1] + tmp_125[1];
    tmp_126[2] <== tmp_124[2] + tmp_125[2];
    signal tmp_127[3];

    tmp_127[0] <== 18 * evals[21][0];
    tmp_127[1] <== 18 * evals[21][1];
    tmp_127[2] <== 18 * evals[21][2];
    signal tmp_128[3];

    tmp_128[0] <== tmp_126[0] + tmp_127[0];
    tmp_128[1] <== tmp_126[1] + tmp_127[1];
    tmp_128[2] <== tmp_126[2] + tmp_127[2];
    signal tmp_129[3];

    tmp_129[0] <== evals[25][0] - tmp_128[0];
    tmp_129[1] <== evals[25][1] - tmp_128[1];
    tmp_129[2] <== evals[25][2] - tmp_128[2];
    signal tmp_130[3];

    component cmul_34 = CMul();
    cmul_34.ina[0] <== evals[23][0];
    cmul_34.ina[1] <== evals[23][1];
    cmul_34.ina[2] <== evals[23][2];
    cmul_34.inb[0] <== tmp_129[0];
    cmul_34.inb[1] <== tmp_129[1];
    cmul_34.inb[2] <== tmp_129[2];
    tmp_130[0] <== cmul_34.out[0];
    tmp_130[1] <== cmul_34.out[1];
    tmp_130[2] <== cmul_34.out[2];
    signal tmp_592[3];

    tmp_592[0] <== tmp_130[0] - 0;
    tmp_592[1] <== tmp_130[1];
    tmp_592[2] <== tmp_130[2];
    signal tmp_131[3];

    tmp_131[0] <== 18 * evals[0][0];
    tmp_131[1] <== 18 * evals[0][1];
    tmp_131[2] <== 18 * evals[0][2];
    signal tmp_132[3];

    tmp_132[0] <== 34 * evals[2][0];
    tmp_132[1] <== 34 * evals[2][1];
    tmp_132[2] <== 34 * evals[2][2];
    signal tmp_133[3];

    tmp_133[0] <== tmp_131[0] + tmp_132[0];
    tmp_133[1] <== tmp_131[1] + tmp_132[1];
    tmp_133[2] <== tmp_131[2] + tmp_132[2];
    signal tmp_134[3];

    tmp_134[0] <== 20 * evals[3][0];
    tmp_134[1] <== 20 * evals[3][1];
    tmp_134[2] <== 20 * evals[3][2];
    signal tmp_135[3];

    tmp_135[0] <== tmp_133[0] + tmp_134[0];
    tmp_135[1] <== tmp_133[1] + tmp_134[1];
    tmp_135[2] <== tmp_133[2] + tmp_134[2];
    signal tmp_136[3];

    tmp_136[0] <== 17 * evals[4][0];
    tmp_136[1] <== 17 * evals[4][1];
    tmp_136[2] <== 17 * evals[4][2];
    signal tmp_137[3];

    tmp_137[0] <== tmp_135[0] + tmp_136[0];
    tmp_137[1] <== tmp_135[1] + tmp_136[1];
    tmp_137[2] <== tmp_135[2] + tmp_136[2];
    signal tmp_138[3];

    tmp_138[0] <== 15 * evals[5][0];
    tmp_138[1] <== 15 * evals[5][1];
    tmp_138[2] <== 15 * evals[5][2];
    signal tmp_139[3];

    tmp_139[0] <== tmp_137[0] + tmp_138[0];
    tmp_139[1] <== tmp_137[1] + tmp_138[1];
    tmp_139[2] <== tmp_137[2] + tmp_138[2];
    signal tmp_140[3];

    tmp_140[0] <== 41 * evals[6][0];
    tmp_140[1] <== 41 * evals[6][1];
    tmp_140[2] <== 41 * evals[6][2];
    signal tmp_141[3];

    tmp_141[0] <== tmp_139[0] + tmp_140[0];
    tmp_141[1] <== tmp_139[1] + tmp_140[1];
    tmp_141[2] <== tmp_139[2] + tmp_140[2];
    signal tmp_142[3];

    tmp_142[0] <== 16 * evals[7][0];
    tmp_142[1] <== 16 * evals[7][1];
    tmp_142[2] <== 16 * evals[7][2];
    signal tmp_143[3];

    tmp_143[0] <== tmp_141[0] + tmp_142[0];
    tmp_143[1] <== tmp_141[1] + tmp_142[1];
    tmp_143[2] <== tmp_141[2] + tmp_142[2];
    signal tmp_144[3];

    tmp_144[0] <== 2 * evals[8][0];
    tmp_144[1] <== 2 * evals[8][1];
    tmp_144[2] <== 2 * evals[8][2];
    signal tmp_145[3];

    tmp_145[0] <== tmp_143[0] + tmp_144[0];
    tmp_145[1] <== tmp_143[1] + tmp_144[1];
    tmp_145[2] <== tmp_143[2] + tmp_144[2];
    signal tmp_146[3];

    tmp_146[0] <== 28 * evals[17][0];
    tmp_146[1] <== 28 * evals[17][1];
    tmp_146[2] <== 28 * evals[17][2];
    signal tmp_147[3];

    tmp_147[0] <== tmp_145[0] + tmp_146[0];
    tmp_147[1] <== tmp_145[1] + tmp_146[1];
    tmp_147[2] <== tmp_145[2] + tmp_146[2];
    signal tmp_148[3];

    tmp_148[0] <== 13 * evals[18][0];
    tmp_148[1] <== 13 * evals[18][1];
    tmp_148[2] <== 13 * evals[18][2];
    signal tmp_149[3];

    tmp_149[0] <== tmp_147[0] + tmp_148[0];
    tmp_149[1] <== tmp_147[1] + tmp_148[1];
    tmp_149[2] <== tmp_147[2] + tmp_148[2];
    signal tmp_150[3];

    tmp_150[0] <== 13 * evals[19][0];
    tmp_150[1] <== 13 * evals[19][1];
    tmp_150[2] <== 13 * evals[19][2];
    signal tmp_151[3];

    tmp_151[0] <== tmp_149[0] + tmp_150[0];
    tmp_151[1] <== tmp_149[1] + tmp_150[1];
    tmp_151[2] <== tmp_149[2] + tmp_150[2];
    signal tmp_152[3];

    tmp_152[0] <== 39 * evals[21][0];
    tmp_152[1] <== 39 * evals[21][1];
    tmp_152[2] <== 39 * evals[21][2];
    signal tmp_153[3];

    tmp_153[0] <== tmp_151[0] + tmp_152[0];
    tmp_153[1] <== tmp_151[1] + tmp_152[1];
    tmp_153[2] <== tmp_151[2] + tmp_152[2];
    signal tmp_154[3];

    tmp_154[0] <== evals[26][0] - tmp_153[0];
    tmp_154[1] <== evals[26][1] - tmp_153[1];
    tmp_154[2] <== evals[26][2] - tmp_153[2];
    signal tmp_155[3];

    component cmul_35 = CMul();
    cmul_35.ina[0] <== evals[23][0];
    cmul_35.ina[1] <== evals[23][1];
    cmul_35.ina[2] <== evals[23][2];
    cmul_35.inb[0] <== tmp_154[0];
    cmul_35.inb[1] <== tmp_154[1];
    cmul_35.inb[2] <== tmp_154[2];
    tmp_155[0] <== cmul_35.out[0];
    tmp_155[1] <== cmul_35.out[1];
    tmp_155[2] <== cmul_35.out[2];
    signal tmp_593[3];

    tmp_593[0] <== tmp_155[0] - 0;
    tmp_593[1] <== tmp_155[1];
    tmp_593[2] <== tmp_155[2];
    signal tmp_156[3];

    tmp_156[0] <== 39 * evals[0][0];
    tmp_156[1] <== 39 * evals[0][1];
    tmp_156[2] <== 39 * evals[0][2];
    signal tmp_157[3];

    tmp_157[0] <== 18 * evals[2][0];
    tmp_157[1] <== 18 * evals[2][1];
    tmp_157[2] <== 18 * evals[2][2];
    signal tmp_158[3];

    tmp_158[0] <== tmp_156[0] + tmp_157[0];
    tmp_158[1] <== tmp_156[1] + tmp_157[1];
    tmp_158[2] <== tmp_156[2] + tmp_157[2];
    signal tmp_159[3];

    tmp_159[0] <== 34 * evals[3][0];
    tmp_159[1] <== 34 * evals[3][1];
    tmp_159[2] <== 34 * evals[3][2];
    signal tmp_160[3];

    tmp_160[0] <== tmp_158[0] + tmp_159[0];
    tmp_160[1] <== tmp_158[1] + tmp_159[1];
    tmp_160[2] <== tmp_158[2] + tmp_159[2];
    signal tmp_161[3];

    tmp_161[0] <== 20 * evals[4][0];
    tmp_161[1] <== 20 * evals[4][1];
    tmp_161[2] <== 20 * evals[4][2];
    signal tmp_162[3];

    tmp_162[0] <== tmp_160[0] + tmp_161[0];
    tmp_162[1] <== tmp_160[1] + tmp_161[1];
    tmp_162[2] <== tmp_160[2] + tmp_161[2];
    signal tmp_163[3];

    tmp_163[0] <== 17 * evals[5][0];
    tmp_163[1] <== 17 * evals[5][1];
    tmp_163[2] <== 17 * evals[5][2];
    signal tmp_164[3];

    tmp_164[0] <== tmp_162[0] + tmp_163[0];
    tmp_164[1] <== tmp_162[1] + tmp_163[1];
    tmp_164[2] <== tmp_162[2] + tmp_163[2];
    signal tmp_165[3];

    tmp_165[0] <== 15 * evals[6][0];
    tmp_165[1] <== 15 * evals[6][1];
    tmp_165[2] <== 15 * evals[6][2];
    signal tmp_166[3];

    tmp_166[0] <== tmp_164[0] + tmp_165[0];
    tmp_166[1] <== tmp_164[1] + tmp_165[1];
    tmp_166[2] <== tmp_164[2] + tmp_165[2];
    signal tmp_167[3];

    tmp_167[0] <== 41 * evals[7][0];
    tmp_167[1] <== 41 * evals[7][1];
    tmp_167[2] <== 41 * evals[7][2];
    signal tmp_168[3];

    tmp_168[0] <== tmp_166[0] + tmp_167[0];
    tmp_168[1] <== tmp_166[1] + tmp_167[1];
    tmp_168[2] <== tmp_166[2] + tmp_167[2];
    signal tmp_169[3];

    tmp_169[0] <== 16 * evals[8][0];
    tmp_169[1] <== 16 * evals[8][1];
    tmp_169[2] <== 16 * evals[8][2];
    signal tmp_170[3];

    tmp_170[0] <== tmp_168[0] + tmp_169[0];
    tmp_170[1] <== tmp_168[1] + tmp_169[1];
    tmp_170[2] <== tmp_168[2] + tmp_169[2];
    signal tmp_171[3];

    tmp_171[0] <== 2 * evals[17][0];
    tmp_171[1] <== 2 * evals[17][1];
    tmp_171[2] <== 2 * evals[17][2];
    signal tmp_172[3];

    tmp_172[0] <== tmp_170[0] + tmp_171[0];
    tmp_172[1] <== tmp_170[1] + tmp_171[1];
    tmp_172[2] <== tmp_170[2] + tmp_171[2];
    signal tmp_173[3];

    tmp_173[0] <== 28 * evals[18][0];
    tmp_173[1] <== 28 * evals[18][1];
    tmp_173[2] <== 28 * evals[18][2];
    signal tmp_174[3];

    tmp_174[0] <== tmp_172[0] + tmp_173[0];
    tmp_174[1] <== tmp_172[1] + tmp_173[1];
    tmp_174[2] <== tmp_172[2] + tmp_173[2];
    signal tmp_175[3];

    tmp_175[0] <== 13 * evals[19][0];
    tmp_175[1] <== 13 * evals[19][1];
    tmp_175[2] <== 13 * evals[19][2];
    signal tmp_176[3];

    tmp_176[0] <== tmp_174[0] + tmp_175[0];
    tmp_176[1] <== tmp_174[1] + tmp_175[1];
    tmp_176[2] <== tmp_174[2] + tmp_175[2];
    signal tmp_177[3];

    tmp_177[0] <== 13 * evals[21][0];
    tmp_177[1] <== 13 * evals[21][1];
    tmp_177[2] <== 13 * evals[21][2];
    signal tmp_178[3];

    tmp_178[0] <== tmp_176[0] + tmp_177[0];
    tmp_178[1] <== tmp_176[1] + tmp_177[1];
    tmp_178[2] <== tmp_176[2] + tmp_177[2];
    signal tmp_179[3];

    tmp_179[0] <== evals[27][0] - tmp_178[0];
    tmp_179[1] <== evals[27][1] - tmp_178[1];
    tmp_179[2] <== evals[27][2] - tmp_178[2];
    signal tmp_180[3];

    component cmul_36 = CMul();
    cmul_36.ina[0] <== evals[23][0];
    cmul_36.ina[1] <== evals[23][1];
    cmul_36.ina[2] <== evals[23][2];
    cmul_36.inb[0] <== tmp_179[0];
    cmul_36.inb[1] <== tmp_179[1];
    cmul_36.inb[2] <== tmp_179[2];
    tmp_180[0] <== cmul_36.out[0];
    tmp_180[1] <== cmul_36.out[1];
    tmp_180[2] <== cmul_36.out[2];
    signal tmp_594[3];

    tmp_594[0] <== tmp_180[0] - 0;
    tmp_594[1] <== tmp_180[1];
    tmp_594[2] <== tmp_180[2];
    signal tmp_181[3];

    tmp_181[0] <== 13 * evals[0][0];
    tmp_181[1] <== 13 * evals[0][1];
    tmp_181[2] <== 13 * evals[0][2];
    signal tmp_182[3];

    tmp_182[0] <== 39 * evals[2][0];
    tmp_182[1] <== 39 * evals[2][1];
    tmp_182[2] <== 39 * evals[2][2];
    signal tmp_183[3];

    tmp_183[0] <== tmp_181[0] + tmp_182[0];
    tmp_183[1] <== tmp_181[1] + tmp_182[1];
    tmp_183[2] <== tmp_181[2] + tmp_182[2];
    signal tmp_184[3];

    tmp_184[0] <== 18 * evals[3][0];
    tmp_184[1] <== 18 * evals[3][1];
    tmp_184[2] <== 18 * evals[3][2];
    signal tmp_185[3];

    tmp_185[0] <== tmp_183[0] + tmp_184[0];
    tmp_185[1] <== tmp_183[1] + tmp_184[1];
    tmp_185[2] <== tmp_183[2] + tmp_184[2];
    signal tmp_186[3];

    tmp_186[0] <== 34 * evals[4][0];
    tmp_186[1] <== 34 * evals[4][1];
    tmp_186[2] <== 34 * evals[4][2];
    signal tmp_187[3];

    tmp_187[0] <== tmp_185[0] + tmp_186[0];
    tmp_187[1] <== tmp_185[1] + tmp_186[1];
    tmp_187[2] <== tmp_185[2] + tmp_186[2];
    signal tmp_188[3];

    tmp_188[0] <== 20 * evals[5][0];
    tmp_188[1] <== 20 * evals[5][1];
    tmp_188[2] <== 20 * evals[5][2];
    signal tmp_189[3];

    tmp_189[0] <== tmp_187[0] + tmp_188[0];
    tmp_189[1] <== tmp_187[1] + tmp_188[1];
    tmp_189[2] <== tmp_187[2] + tmp_188[2];
    signal tmp_190[3];

    tmp_190[0] <== 17 * evals[6][0];
    tmp_190[1] <== 17 * evals[6][1];
    tmp_190[2] <== 17 * evals[6][2];
    signal tmp_191[3];

    tmp_191[0] <== tmp_189[0] + tmp_190[0];
    tmp_191[1] <== tmp_189[1] + tmp_190[1];
    tmp_191[2] <== tmp_189[2] + tmp_190[2];
    signal tmp_192[3];

    tmp_192[0] <== 15 * evals[7][0];
    tmp_192[1] <== 15 * evals[7][1];
    tmp_192[2] <== 15 * evals[7][2];
    signal tmp_193[3];

    tmp_193[0] <== tmp_191[0] + tmp_192[0];
    tmp_193[1] <== tmp_191[1] + tmp_192[1];
    tmp_193[2] <== tmp_191[2] + tmp_192[2];
    signal tmp_194[3];

    tmp_194[0] <== 41 * evals[8][0];
    tmp_194[1] <== 41 * evals[8][1];
    tmp_194[2] <== 41 * evals[8][2];
    signal tmp_195[3];

    tmp_195[0] <== tmp_193[0] + tmp_194[0];
    tmp_195[1] <== tmp_193[1] + tmp_194[1];
    tmp_195[2] <== tmp_193[2] + tmp_194[2];
    signal tmp_196[3];

    tmp_196[0] <== 16 * evals[17][0];
    tmp_196[1] <== 16 * evals[17][1];
    tmp_196[2] <== 16 * evals[17][2];
    signal tmp_197[3];

    tmp_197[0] <== tmp_195[0] + tmp_196[0];
    tmp_197[1] <== tmp_195[1] + tmp_196[1];
    tmp_197[2] <== tmp_195[2] + tmp_196[2];
    signal tmp_198[3];

    tmp_198[0] <== 2 * evals[18][0];
    tmp_198[1] <== 2 * evals[18][1];
    tmp_198[2] <== 2 * evals[18][2];
    signal tmp_199[3];

    tmp_199[0] <== tmp_197[0] + tmp_198[0];
    tmp_199[1] <== tmp_197[1] + tmp_198[1];
    tmp_199[2] <== tmp_197[2] + tmp_198[2];
    signal tmp_200[3];

    tmp_200[0] <== 28 * evals[19][0];
    tmp_200[1] <== 28 * evals[19][1];
    tmp_200[2] <== 28 * evals[19][2];
    signal tmp_201[3];

    tmp_201[0] <== tmp_199[0] + tmp_200[0];
    tmp_201[1] <== tmp_199[1] + tmp_200[1];
    tmp_201[2] <== tmp_199[2] + tmp_200[2];
    signal tmp_202[3];

    tmp_202[0] <== 13 * evals[21][0];
    tmp_202[1] <== 13 * evals[21][1];
    tmp_202[2] <== 13 * evals[21][2];
    signal tmp_203[3];

    tmp_203[0] <== tmp_201[0] + tmp_202[0];
    tmp_203[1] <== tmp_201[1] + tmp_202[1];
    tmp_203[2] <== tmp_201[2] + tmp_202[2];
    signal tmp_204[3];

    tmp_204[0] <== evals[28][0] - tmp_203[0];
    tmp_204[1] <== evals[28][1] - tmp_203[1];
    tmp_204[2] <== evals[28][2] - tmp_203[2];
    signal tmp_205[3];

    component cmul_37 = CMul();
    cmul_37.ina[0] <== evals[23][0];
    cmul_37.ina[1] <== evals[23][1];
    cmul_37.ina[2] <== evals[23][2];
    cmul_37.inb[0] <== tmp_204[0];
    cmul_37.inb[1] <== tmp_204[1];
    cmul_37.inb[2] <== tmp_204[2];
    tmp_205[0] <== cmul_37.out[0];
    tmp_205[1] <== cmul_37.out[1];
    tmp_205[2] <== cmul_37.out[2];
    signal tmp_595[3];

    tmp_595[0] <== tmp_205[0] - 0;
    tmp_595[1] <== tmp_205[1];
    tmp_595[2] <== tmp_205[2];
    signal tmp_206[3];

    tmp_206[0] <== 13 * evals[0][0];
    tmp_206[1] <== 13 * evals[0][1];
    tmp_206[2] <== 13 * evals[0][2];
    signal tmp_207[3];

    tmp_207[0] <== 13 * evals[2][0];
    tmp_207[1] <== 13 * evals[2][1];
    tmp_207[2] <== 13 * evals[2][2];
    signal tmp_208[3];

    tmp_208[0] <== tmp_206[0] + tmp_207[0];
    tmp_208[1] <== tmp_206[1] + tmp_207[1];
    tmp_208[2] <== tmp_206[2] + tmp_207[2];
    signal tmp_209[3];

    tmp_209[0] <== 39 * evals[3][0];
    tmp_209[1] <== 39 * evals[3][1];
    tmp_209[2] <== 39 * evals[3][2];
    signal tmp_210[3];

    tmp_210[0] <== tmp_208[0] + tmp_209[0];
    tmp_210[1] <== tmp_208[1] + tmp_209[1];
    tmp_210[2] <== tmp_208[2] + tmp_209[2];
    signal tmp_211[3];

    tmp_211[0] <== 18 * evals[4][0];
    tmp_211[1] <== 18 * evals[4][1];
    tmp_211[2] <== 18 * evals[4][2];
    signal tmp_212[3];

    tmp_212[0] <== tmp_210[0] + tmp_211[0];
    tmp_212[1] <== tmp_210[1] + tmp_211[1];
    tmp_212[2] <== tmp_210[2] + tmp_211[2];
    signal tmp_213[3];

    tmp_213[0] <== 34 * evals[5][0];
    tmp_213[1] <== 34 * evals[5][1];
    tmp_213[2] <== 34 * evals[5][2];
    signal tmp_214[3];

    tmp_214[0] <== tmp_212[0] + tmp_213[0];
    tmp_214[1] <== tmp_212[1] + tmp_213[1];
    tmp_214[2] <== tmp_212[2] + tmp_213[2];
    signal tmp_215[3];

    tmp_215[0] <== 20 * evals[6][0];
    tmp_215[1] <== 20 * evals[6][1];
    tmp_215[2] <== 20 * evals[6][2];
    signal tmp_216[3];

    tmp_216[0] <== tmp_214[0] + tmp_215[0];
    tmp_216[1] <== tmp_214[1] + tmp_215[1];
    tmp_216[2] <== tmp_214[2] + tmp_215[2];
    signal tmp_217[3];

    tmp_217[0] <== 17 * evals[7][0];
    tmp_217[1] <== 17 * evals[7][1];
    tmp_217[2] <== 17 * evals[7][2];
    signal tmp_218[3];

    tmp_218[0] <== tmp_216[0] + tmp_217[0];
    tmp_218[1] <== tmp_216[1] + tmp_217[1];
    tmp_218[2] <== tmp_216[2] + tmp_217[2];
    signal tmp_219[3];

    tmp_219[0] <== 15 * evals[8][0];
    tmp_219[1] <== 15 * evals[8][1];
    tmp_219[2] <== 15 * evals[8][2];
    signal tmp_220[3];

    tmp_220[0] <== tmp_218[0] + tmp_219[0];
    tmp_220[1] <== tmp_218[1] + tmp_219[1];
    tmp_220[2] <== tmp_218[2] + tmp_219[2];
    signal tmp_221[3];

    tmp_221[0] <== 41 * evals[17][0];
    tmp_221[1] <== 41 * evals[17][1];
    tmp_221[2] <== 41 * evals[17][2];
    signal tmp_222[3];

    tmp_222[0] <== tmp_220[0] + tmp_221[0];
    tmp_222[1] <== tmp_220[1] + tmp_221[1];
    tmp_222[2] <== tmp_220[2] + tmp_221[2];
    signal tmp_223[3];

    tmp_223[0] <== 16 * evals[18][0];
    tmp_223[1] <== 16 * evals[18][1];
    tmp_223[2] <== 16 * evals[18][2];
    signal tmp_224[3];

    tmp_224[0] <== tmp_222[0] + tmp_223[0];
    tmp_224[1] <== tmp_222[1] + tmp_223[1];
    tmp_224[2] <== tmp_222[2] + tmp_223[2];
    signal tmp_225[3];

    tmp_225[0] <== 2 * evals[19][0];
    tmp_225[1] <== 2 * evals[19][1];
    tmp_225[2] <== 2 * evals[19][2];
    signal tmp_226[3];

    tmp_226[0] <== tmp_224[0] + tmp_225[0];
    tmp_226[1] <== tmp_224[1] + tmp_225[1];
    tmp_226[2] <== tmp_224[2] + tmp_225[2];
    signal tmp_227[3];

    tmp_227[0] <== 28 * evals[21][0];
    tmp_227[1] <== 28 * evals[21][1];
    tmp_227[2] <== 28 * evals[21][2];
    signal tmp_228[3];

    tmp_228[0] <== tmp_226[0] + tmp_227[0];
    tmp_228[1] <== tmp_226[1] + tmp_227[1];
    tmp_228[2] <== tmp_226[2] + tmp_227[2];
    signal tmp_229[3];

    tmp_229[0] <== evals[29][0] - tmp_228[0];
    tmp_229[1] <== evals[29][1] - tmp_228[1];
    tmp_229[2] <== evals[29][2] - tmp_228[2];
    signal tmp_230[3];

    component cmul_38 = CMul();
    cmul_38.ina[0] <== evals[23][0];
    cmul_38.ina[1] <== evals[23][1];
    cmul_38.ina[2] <== evals[23][2];
    cmul_38.inb[0] <== tmp_229[0];
    cmul_38.inb[1] <== tmp_229[1];
    cmul_38.inb[2] <== tmp_229[2];
    tmp_230[0] <== cmul_38.out[0];
    tmp_230[1] <== cmul_38.out[1];
    tmp_230[2] <== cmul_38.out[2];
    signal tmp_596[3];

    tmp_596[0] <== tmp_230[0] - 0;
    tmp_596[1] <== tmp_230[1];
    tmp_596[2] <== tmp_230[2];
    signal tmp_231[3];

    tmp_231[0] <== 28 * evals[0][0];
    tmp_231[1] <== 28 * evals[0][1];
    tmp_231[2] <== 28 * evals[0][2];
    signal tmp_232[3];

    tmp_232[0] <== 13 * evals[2][0];
    tmp_232[1] <== 13 * evals[2][1];
    tmp_232[2] <== 13 * evals[2][2];
    signal tmp_233[3];

    tmp_233[0] <== tmp_231[0] + tmp_232[0];
    tmp_233[1] <== tmp_231[1] + tmp_232[1];
    tmp_233[2] <== tmp_231[2] + tmp_232[2];
    signal tmp_234[3];

    tmp_234[0] <== 13 * evals[3][0];
    tmp_234[1] <== 13 * evals[3][1];
    tmp_234[2] <== 13 * evals[3][2];
    signal tmp_235[3];

    tmp_235[0] <== tmp_233[0] + tmp_234[0];
    tmp_235[1] <== tmp_233[1] + tmp_234[1];
    tmp_235[2] <== tmp_233[2] + tmp_234[2];
    signal tmp_236[3];

    tmp_236[0] <== 39 * evals[4][0];
    tmp_236[1] <== 39 * evals[4][1];
    tmp_236[2] <== 39 * evals[4][2];
    signal tmp_237[3];

    tmp_237[0] <== tmp_235[0] + tmp_236[0];
    tmp_237[1] <== tmp_235[1] + tmp_236[1];
    tmp_237[2] <== tmp_235[2] + tmp_236[2];
    signal tmp_238[3];

    tmp_238[0] <== 18 * evals[5][0];
    tmp_238[1] <== 18 * evals[5][1];
    tmp_238[2] <== 18 * evals[5][2];
    signal tmp_239[3];

    tmp_239[0] <== tmp_237[0] + tmp_238[0];
    tmp_239[1] <== tmp_237[1] + tmp_238[1];
    tmp_239[2] <== tmp_237[2] + tmp_238[2];
    signal tmp_240[3];

    tmp_240[0] <== 34 * evals[6][0];
    tmp_240[1] <== 34 * evals[6][1];
    tmp_240[2] <== 34 * evals[6][2];
    signal tmp_241[3];

    tmp_241[0] <== tmp_239[0] + tmp_240[0];
    tmp_241[1] <== tmp_239[1] + tmp_240[1];
    tmp_241[2] <== tmp_239[2] + tmp_240[2];
    signal tmp_242[3];

    tmp_242[0] <== 20 * evals[7][0];
    tmp_242[1] <== 20 * evals[7][1];
    tmp_242[2] <== 20 * evals[7][2];
    signal tmp_243[3];

    tmp_243[0] <== tmp_241[0] + tmp_242[0];
    tmp_243[1] <== tmp_241[1] + tmp_242[1];
    tmp_243[2] <== tmp_241[2] + tmp_242[2];
    signal tmp_244[3];

    tmp_244[0] <== 17 * evals[8][0];
    tmp_244[1] <== 17 * evals[8][1];
    tmp_244[2] <== 17 * evals[8][2];
    signal tmp_245[3];

    tmp_245[0] <== tmp_243[0] + tmp_244[0];
    tmp_245[1] <== tmp_243[1] + tmp_244[1];
    tmp_245[2] <== tmp_243[2] + tmp_244[2];
    signal tmp_246[3];

    tmp_246[0] <== 15 * evals[17][0];
    tmp_246[1] <== 15 * evals[17][1];
    tmp_246[2] <== 15 * evals[17][2];
    signal tmp_247[3];

    tmp_247[0] <== tmp_245[0] + tmp_246[0];
    tmp_247[1] <== tmp_245[1] + tmp_246[1];
    tmp_247[2] <== tmp_245[2] + tmp_246[2];
    signal tmp_248[3];

    tmp_248[0] <== 41 * evals[18][0];
    tmp_248[1] <== 41 * evals[18][1];
    tmp_248[2] <== 41 * evals[18][2];
    signal tmp_249[3];

    tmp_249[0] <== tmp_247[0] + tmp_248[0];
    tmp_249[1] <== tmp_247[1] + tmp_248[1];
    tmp_249[2] <== tmp_247[2] + tmp_248[2];
    signal tmp_250[3];

    tmp_250[0] <== 16 * evals[19][0];
    tmp_250[1] <== 16 * evals[19][1];
    tmp_250[2] <== 16 * evals[19][2];
    signal tmp_251[3];

    tmp_251[0] <== tmp_249[0] + tmp_250[0];
    tmp_251[1] <== tmp_249[1] + tmp_250[1];
    tmp_251[2] <== tmp_249[2] + tmp_250[2];
    signal tmp_252[3];

    tmp_252[0] <== 2 * evals[21][0];
    tmp_252[1] <== 2 * evals[21][1];
    tmp_252[2] <== 2 * evals[21][2];
    signal tmp_253[3];

    tmp_253[0] <== tmp_251[0] + tmp_252[0];
    tmp_253[1] <== tmp_251[1] + tmp_252[1];
    tmp_253[2] <== tmp_251[2] + tmp_252[2];
    signal tmp_254[3];

    tmp_254[0] <== evals[30][0] - tmp_253[0];
    tmp_254[1] <== evals[30][1] - tmp_253[1];
    tmp_254[2] <== evals[30][2] - tmp_253[2];
    signal tmp_255[3];

    component cmul_39 = CMul();
    cmul_39.ina[0] <== evals[23][0];
    cmul_39.ina[1] <== evals[23][1];
    cmul_39.ina[2] <== evals[23][2];
    cmul_39.inb[0] <== tmp_254[0];
    cmul_39.inb[1] <== tmp_254[1];
    cmul_39.inb[2] <== tmp_254[2];
    tmp_255[0] <== cmul_39.out[0];
    tmp_255[1] <== cmul_39.out[1];
    tmp_255[2] <== cmul_39.out[2];
    signal tmp_597[3];

    tmp_597[0] <== tmp_255[0] - 0;
    tmp_597[1] <== tmp_255[1];
    tmp_597[2] <== tmp_255[2];
    signal tmp_256[3];

    tmp_256[0] <== 2 * evals[0][0];
    tmp_256[1] <== 2 * evals[0][1];
    tmp_256[2] <== 2 * evals[0][2];
    signal tmp_257[3];

    tmp_257[0] <== 28 * evals[2][0];
    tmp_257[1] <== 28 * evals[2][1];
    tmp_257[2] <== 28 * evals[2][2];
    signal tmp_258[3];

    tmp_258[0] <== tmp_256[0] + tmp_257[0];
    tmp_258[1] <== tmp_256[1] + tmp_257[1];
    tmp_258[2] <== tmp_256[2] + tmp_257[2];
    signal tmp_259[3];

    tmp_259[0] <== 13 * evals[3][0];
    tmp_259[1] <== 13 * evals[3][1];
    tmp_259[2] <== 13 * evals[3][2];
    signal tmp_260[3];

    tmp_260[0] <== tmp_258[0] + tmp_259[0];
    tmp_260[1] <== tmp_258[1] + tmp_259[1];
    tmp_260[2] <== tmp_258[2] + tmp_259[2];
    signal tmp_261[3];

    tmp_261[0] <== 13 * evals[4][0];
    tmp_261[1] <== 13 * evals[4][1];
    tmp_261[2] <== 13 * evals[4][2];
    signal tmp_262[3];

    tmp_262[0] <== tmp_260[0] + tmp_261[0];
    tmp_262[1] <== tmp_260[1] + tmp_261[1];
    tmp_262[2] <== tmp_260[2] + tmp_261[2];
    signal tmp_263[3];

    tmp_263[0] <== 39 * evals[5][0];
    tmp_263[1] <== 39 * evals[5][1];
    tmp_263[2] <== 39 * evals[5][2];
    signal tmp_264[3];

    tmp_264[0] <== tmp_262[0] + tmp_263[0];
    tmp_264[1] <== tmp_262[1] + tmp_263[1];
    tmp_264[2] <== tmp_262[2] + tmp_263[2];
    signal tmp_265[3];

    tmp_265[0] <== 18 * evals[6][0];
    tmp_265[1] <== 18 * evals[6][1];
    tmp_265[2] <== 18 * evals[6][2];
    signal tmp_266[3];

    tmp_266[0] <== tmp_264[0] + tmp_265[0];
    tmp_266[1] <== tmp_264[1] + tmp_265[1];
    tmp_266[2] <== tmp_264[2] + tmp_265[2];
    signal tmp_267[3];

    tmp_267[0] <== 34 * evals[7][0];
    tmp_267[1] <== 34 * evals[7][1];
    tmp_267[2] <== 34 * evals[7][2];
    signal tmp_268[3];

    tmp_268[0] <== tmp_266[0] + tmp_267[0];
    tmp_268[1] <== tmp_266[1] + tmp_267[1];
    tmp_268[2] <== tmp_266[2] + tmp_267[2];
    signal tmp_269[3];

    tmp_269[0] <== 20 * evals[8][0];
    tmp_269[1] <== 20 * evals[8][1];
    tmp_269[2] <== 20 * evals[8][2];
    signal tmp_270[3];

    tmp_270[0] <== tmp_268[0] + tmp_269[0];
    tmp_270[1] <== tmp_268[1] + tmp_269[1];
    tmp_270[2] <== tmp_268[2] + tmp_269[2];
    signal tmp_271[3];

    tmp_271[0] <== 17 * evals[17][0];
    tmp_271[1] <== 17 * evals[17][1];
    tmp_271[2] <== 17 * evals[17][2];
    signal tmp_272[3];

    tmp_272[0] <== tmp_270[0] + tmp_271[0];
    tmp_272[1] <== tmp_270[1] + tmp_271[1];
    tmp_272[2] <== tmp_270[2] + tmp_271[2];
    signal tmp_273[3];

    tmp_273[0] <== 15 * evals[18][0];
    tmp_273[1] <== 15 * evals[18][1];
    tmp_273[2] <== 15 * evals[18][2];
    signal tmp_274[3];

    tmp_274[0] <== tmp_272[0] + tmp_273[0];
    tmp_274[1] <== tmp_272[1] + tmp_273[1];
    tmp_274[2] <== tmp_272[2] + tmp_273[2];
    signal tmp_275[3];

    tmp_275[0] <== 41 * evals[19][0];
    tmp_275[1] <== 41 * evals[19][1];
    tmp_275[2] <== 41 * evals[19][2];
    signal tmp_276[3];

    tmp_276[0] <== tmp_274[0] + tmp_275[0];
    tmp_276[1] <== tmp_274[1] + tmp_275[1];
    tmp_276[2] <== tmp_274[2] + tmp_275[2];
    signal tmp_277[3];

    tmp_277[0] <== 16 * evals[21][0];
    tmp_277[1] <== 16 * evals[21][1];
    tmp_277[2] <== 16 * evals[21][2];
    signal tmp_278[3];

    tmp_278[0] <== tmp_276[0] + tmp_277[0];
    tmp_278[1] <== tmp_276[1] + tmp_277[1];
    tmp_278[2] <== tmp_276[2] + tmp_277[2];
    signal tmp_279[3];

    tmp_279[0] <== evals[31][0] - tmp_278[0];
    tmp_279[1] <== evals[31][1] - tmp_278[1];
    tmp_279[2] <== evals[31][2] - tmp_278[2];
    signal tmp_280[3];

    component cmul_40 = CMul();
    cmul_40.ina[0] <== evals[23][0];
    cmul_40.ina[1] <== evals[23][1];
    cmul_40.ina[2] <== evals[23][2];
    cmul_40.inb[0] <== tmp_279[0];
    cmul_40.inb[1] <== tmp_279[1];
    cmul_40.inb[2] <== tmp_279[2];
    tmp_280[0] <== cmul_40.out[0];
    tmp_280[1] <== cmul_40.out[1];
    tmp_280[2] <== cmul_40.out[2];
    signal tmp_598[3];

    tmp_598[0] <== tmp_280[0] - 0;
    tmp_598[1] <== tmp_280[1];
    tmp_598[2] <== tmp_280[2];
    signal tmp_281[3];

    tmp_281[0] <== 16 * evals[0][0];
    tmp_281[1] <== 16 * evals[0][1];
    tmp_281[2] <== 16 * evals[0][2];
    signal tmp_282[3];

    tmp_282[0] <== 2 * evals[2][0];
    tmp_282[1] <== 2 * evals[2][1];
    tmp_282[2] <== 2 * evals[2][2];
    signal tmp_283[3];

    tmp_283[0] <== tmp_281[0] + tmp_282[0];
    tmp_283[1] <== tmp_281[1] + tmp_282[1];
    tmp_283[2] <== tmp_281[2] + tmp_282[2];
    signal tmp_284[3];

    tmp_284[0] <== 28 * evals[3][0];
    tmp_284[1] <== 28 * evals[3][1];
    tmp_284[2] <== 28 * evals[3][2];
    signal tmp_285[3];

    tmp_285[0] <== tmp_283[0] + tmp_284[0];
    tmp_285[1] <== tmp_283[1] + tmp_284[1];
    tmp_285[2] <== tmp_283[2] + tmp_284[2];
    signal tmp_286[3];

    tmp_286[0] <== 13 * evals[4][0];
    tmp_286[1] <== 13 * evals[4][1];
    tmp_286[2] <== 13 * evals[4][2];
    signal tmp_287[3];

    tmp_287[0] <== tmp_285[0] + tmp_286[0];
    tmp_287[1] <== tmp_285[1] + tmp_286[1];
    tmp_287[2] <== tmp_285[2] + tmp_286[2];
    signal tmp_288[3];

    tmp_288[0] <== 13 * evals[5][0];
    tmp_288[1] <== 13 * evals[5][1];
    tmp_288[2] <== 13 * evals[5][2];
    signal tmp_289[3];

    tmp_289[0] <== tmp_287[0] + tmp_288[0];
    tmp_289[1] <== tmp_287[1] + tmp_288[1];
    tmp_289[2] <== tmp_287[2] + tmp_288[2];
    signal tmp_290[3];

    tmp_290[0] <== 39 * evals[6][0];
    tmp_290[1] <== 39 * evals[6][1];
    tmp_290[2] <== 39 * evals[6][2];
    signal tmp_291[3];

    tmp_291[0] <== tmp_289[0] + tmp_290[0];
    tmp_291[1] <== tmp_289[1] + tmp_290[1];
    tmp_291[2] <== tmp_289[2] + tmp_290[2];
    signal tmp_292[3];

    tmp_292[0] <== 18 * evals[7][0];
    tmp_292[1] <== 18 * evals[7][1];
    tmp_292[2] <== 18 * evals[7][2];
    signal tmp_293[3];

    tmp_293[0] <== tmp_291[0] + tmp_292[0];
    tmp_293[1] <== tmp_291[1] + tmp_292[1];
    tmp_293[2] <== tmp_291[2] + tmp_292[2];
    signal tmp_294[3];

    tmp_294[0] <== 34 * evals[8][0];
    tmp_294[1] <== 34 * evals[8][1];
    tmp_294[2] <== 34 * evals[8][2];
    signal tmp_295[3];

    tmp_295[0] <== tmp_293[0] + tmp_294[0];
    tmp_295[1] <== tmp_293[1] + tmp_294[1];
    tmp_295[2] <== tmp_293[2] + tmp_294[2];
    signal tmp_296[3];

    tmp_296[0] <== 20 * evals[17][0];
    tmp_296[1] <== 20 * evals[17][1];
    tmp_296[2] <== 20 * evals[17][2];
    signal tmp_297[3];

    tmp_297[0] <== tmp_295[0] + tmp_296[0];
    tmp_297[1] <== tmp_295[1] + tmp_296[1];
    tmp_297[2] <== tmp_295[2] + tmp_296[2];
    signal tmp_298[3];

    tmp_298[0] <== 17 * evals[18][0];
    tmp_298[1] <== 17 * evals[18][1];
    tmp_298[2] <== 17 * evals[18][2];
    signal tmp_299[3];

    tmp_299[0] <== tmp_297[0] + tmp_298[0];
    tmp_299[1] <== tmp_297[1] + tmp_298[1];
    tmp_299[2] <== tmp_297[2] + tmp_298[2];
    signal tmp_300[3];

    tmp_300[0] <== 15 * evals[19][0];
    tmp_300[1] <== 15 * evals[19][1];
    tmp_300[2] <== 15 * evals[19][2];
    signal tmp_301[3];

    tmp_301[0] <== tmp_299[0] + tmp_300[0];
    tmp_301[1] <== tmp_299[1] + tmp_300[1];
    tmp_301[2] <== tmp_299[2] + tmp_300[2];
    signal tmp_302[3];

    tmp_302[0] <== 41 * evals[21][0];
    tmp_302[1] <== 41 * evals[21][1];
    tmp_302[2] <== 41 * evals[21][2];
    signal tmp_303[3];

    tmp_303[0] <== tmp_301[0] + tmp_302[0];
    tmp_303[1] <== tmp_301[1] + tmp_302[1];
    tmp_303[2] <== tmp_301[2] + tmp_302[2];
    signal tmp_304[3];

    tmp_304[0] <== evals[32][0] - tmp_303[0];
    tmp_304[1] <== evals[32][1] - tmp_303[1];
    tmp_304[2] <== evals[32][2] - tmp_303[2];
    signal tmp_305[3];

    component cmul_41 = CMul();
    cmul_41.ina[0] <== evals[23][0];
    cmul_41.ina[1] <== evals[23][1];
    cmul_41.ina[2] <== evals[23][2];
    cmul_41.inb[0] <== tmp_304[0];
    cmul_41.inb[1] <== tmp_304[1];
    cmul_41.inb[2] <== tmp_304[2];
    tmp_305[0] <== cmul_41.out[0];
    tmp_305[1] <== cmul_41.out[1];
    tmp_305[2] <== cmul_41.out[2];
    signal tmp_599[3];

    tmp_599[0] <== tmp_305[0] - 0;
    tmp_599[1] <== tmp_305[1];
    tmp_599[2] <== tmp_305[2];
    signal tmp_306[3];

    tmp_306[0] <== 41 * evals[0][0];
    tmp_306[1] <== 41 * evals[0][1];
    tmp_306[2] <== 41 * evals[0][2];
    signal tmp_307[3];

    tmp_307[0] <== 16 * evals[2][0];
    tmp_307[1] <== 16 * evals[2][1];
    tmp_307[2] <== 16 * evals[2][2];
    signal tmp_308[3];

    tmp_308[0] <== tmp_306[0] + tmp_307[0];
    tmp_308[1] <== tmp_306[1] + tmp_307[1];
    tmp_308[2] <== tmp_306[2] + tmp_307[2];
    signal tmp_309[3];

    tmp_309[0] <== 2 * evals[3][0];
    tmp_309[1] <== 2 * evals[3][1];
    tmp_309[2] <== 2 * evals[3][2];
    signal tmp_310[3];

    tmp_310[0] <== tmp_308[0] + tmp_309[0];
    tmp_310[1] <== tmp_308[1] + tmp_309[1];
    tmp_310[2] <== tmp_308[2] + tmp_309[2];
    signal tmp_311[3];

    tmp_311[0] <== 28 * evals[4][0];
    tmp_311[1] <== 28 * evals[4][1];
    tmp_311[2] <== 28 * evals[4][2];
    signal tmp_312[3];

    tmp_312[0] <== tmp_310[0] + tmp_311[0];
    tmp_312[1] <== tmp_310[1] + tmp_311[1];
    tmp_312[2] <== tmp_310[2] + tmp_311[2];
    signal tmp_313[3];

    tmp_313[0] <== 13 * evals[5][0];
    tmp_313[1] <== 13 * evals[5][1];
    tmp_313[2] <== 13 * evals[5][2];
    signal tmp_314[3];

    tmp_314[0] <== tmp_312[0] + tmp_313[0];
    tmp_314[1] <== tmp_312[1] + tmp_313[1];
    tmp_314[2] <== tmp_312[2] + tmp_313[2];
    signal tmp_315[3];

    tmp_315[0] <== 13 * evals[6][0];
    tmp_315[1] <== 13 * evals[6][1];
    tmp_315[2] <== 13 * evals[6][2];
    signal tmp_316[3];

    tmp_316[0] <== tmp_314[0] + tmp_315[0];
    tmp_316[1] <== tmp_314[1] + tmp_315[1];
    tmp_316[2] <== tmp_314[2] + tmp_315[2];
    signal tmp_317[3];

    tmp_317[0] <== 39 * evals[7][0];
    tmp_317[1] <== 39 * evals[7][1];
    tmp_317[2] <== 39 * evals[7][2];
    signal tmp_318[3];

    tmp_318[0] <== tmp_316[0] + tmp_317[0];
    tmp_318[1] <== tmp_316[1] + tmp_317[1];
    tmp_318[2] <== tmp_316[2] + tmp_317[2];
    signal tmp_319[3];

    tmp_319[0] <== 18 * evals[8][0];
    tmp_319[1] <== 18 * evals[8][1];
    tmp_319[2] <== 18 * evals[8][2];
    signal tmp_320[3];

    tmp_320[0] <== tmp_318[0] + tmp_319[0];
    tmp_320[1] <== tmp_318[1] + tmp_319[1];
    tmp_320[2] <== tmp_318[2] + tmp_319[2];
    signal tmp_321[3];

    tmp_321[0] <== 34 * evals[17][0];
    tmp_321[1] <== 34 * evals[17][1];
    tmp_321[2] <== 34 * evals[17][2];
    signal tmp_322[3];

    tmp_322[0] <== tmp_320[0] + tmp_321[0];
    tmp_322[1] <== tmp_320[1] + tmp_321[1];
    tmp_322[2] <== tmp_320[2] + tmp_321[2];
    signal tmp_323[3];

    tmp_323[0] <== 20 * evals[18][0];
    tmp_323[1] <== 20 * evals[18][1];
    tmp_323[2] <== 20 * evals[18][2];
    signal tmp_324[3];

    tmp_324[0] <== tmp_322[0] + tmp_323[0];
    tmp_324[1] <== tmp_322[1] + tmp_323[1];
    tmp_324[2] <== tmp_322[2] + tmp_323[2];
    signal tmp_325[3];

    tmp_325[0] <== 17 * evals[19][0];
    tmp_325[1] <== 17 * evals[19][1];
    tmp_325[2] <== 17 * evals[19][2];
    signal tmp_326[3];

    tmp_326[0] <== tmp_324[0] + tmp_325[0];
    tmp_326[1] <== tmp_324[1] + tmp_325[1];
    tmp_326[2] <== tmp_324[2] + tmp_325[2];
    signal tmp_327[3];

    tmp_327[0] <== 15 * evals[21][0];
    tmp_327[1] <== 15 * evals[21][1];
    tmp_327[2] <== 15 * evals[21][2];
    signal tmp_328[3];

    tmp_328[0] <== tmp_326[0] + tmp_327[0];
    tmp_328[1] <== tmp_326[1] + tmp_327[1];
    tmp_328[2] <== tmp_326[2] + tmp_327[2];
    signal tmp_329[3];

    tmp_329[0] <== evals[33][0] - tmp_328[0];
    tmp_329[1] <== evals[33][1] - tmp_328[1];
    tmp_329[2] <== evals[33][2] - tmp_328[2];
    signal tmp_330[3];

    component cmul_42 = CMul();
    cmul_42.ina[0] <== evals[23][0];
    cmul_42.ina[1] <== evals[23][1];
    cmul_42.ina[2] <== evals[23][2];
    cmul_42.inb[0] <== tmp_329[0];
    cmul_42.inb[1] <== tmp_329[1];
    cmul_42.inb[2] <== tmp_329[2];
    tmp_330[0] <== cmul_42.out[0];
    tmp_330[1] <== cmul_42.out[1];
    tmp_330[2] <== cmul_42.out[2];
    signal tmp_600[3];

    tmp_600[0] <== tmp_330[0] - 0;
    tmp_600[1] <== tmp_330[1];
    tmp_600[2] <== tmp_330[2];
    signal tmp_331[3];

    tmp_331[0] <== 15 * evals[0][0];
    tmp_331[1] <== 15 * evals[0][1];
    tmp_331[2] <== 15 * evals[0][2];
    signal tmp_332[3];

    tmp_332[0] <== 41 * evals[2][0];
    tmp_332[1] <== 41 * evals[2][1];
    tmp_332[2] <== 41 * evals[2][2];
    signal tmp_333[3];

    tmp_333[0] <== tmp_331[0] + tmp_332[0];
    tmp_333[1] <== tmp_331[1] + tmp_332[1];
    tmp_333[2] <== tmp_331[2] + tmp_332[2];
    signal tmp_334[3];

    tmp_334[0] <== 16 * evals[3][0];
    tmp_334[1] <== 16 * evals[3][1];
    tmp_334[2] <== 16 * evals[3][2];
    signal tmp_335[3];

    tmp_335[0] <== tmp_333[0] + tmp_334[0];
    tmp_335[1] <== tmp_333[1] + tmp_334[1];
    tmp_335[2] <== tmp_333[2] + tmp_334[2];
    signal tmp_336[3];

    tmp_336[0] <== 2 * evals[4][0];
    tmp_336[1] <== 2 * evals[4][1];
    tmp_336[2] <== 2 * evals[4][2];
    signal tmp_337[3];

    tmp_337[0] <== tmp_335[0] + tmp_336[0];
    tmp_337[1] <== tmp_335[1] + tmp_336[1];
    tmp_337[2] <== tmp_335[2] + tmp_336[2];
    signal tmp_338[3];

    tmp_338[0] <== 28 * evals[5][0];
    tmp_338[1] <== 28 * evals[5][1];
    tmp_338[2] <== 28 * evals[5][2];
    signal tmp_339[3];

    tmp_339[0] <== tmp_337[0] + tmp_338[0];
    tmp_339[1] <== tmp_337[1] + tmp_338[1];
    tmp_339[2] <== tmp_337[2] + tmp_338[2];
    signal tmp_340[3];

    tmp_340[0] <== 13 * evals[6][0];
    tmp_340[1] <== 13 * evals[6][1];
    tmp_340[2] <== 13 * evals[6][2];
    signal tmp_341[3];

    tmp_341[0] <== tmp_339[0] + tmp_340[0];
    tmp_341[1] <== tmp_339[1] + tmp_340[1];
    tmp_341[2] <== tmp_339[2] + tmp_340[2];
    signal tmp_342[3];

    tmp_342[0] <== 13 * evals[7][0];
    tmp_342[1] <== 13 * evals[7][1];
    tmp_342[2] <== 13 * evals[7][2];
    signal tmp_343[3];

    tmp_343[0] <== tmp_341[0] + tmp_342[0];
    tmp_343[1] <== tmp_341[1] + tmp_342[1];
    tmp_343[2] <== tmp_341[2] + tmp_342[2];
    signal tmp_344[3];

    tmp_344[0] <== 39 * evals[8][0];
    tmp_344[1] <== 39 * evals[8][1];
    tmp_344[2] <== 39 * evals[8][2];
    signal tmp_345[3];

    tmp_345[0] <== tmp_343[0] + tmp_344[0];
    tmp_345[1] <== tmp_343[1] + tmp_344[1];
    tmp_345[2] <== tmp_343[2] + tmp_344[2];
    signal tmp_346[3];

    tmp_346[0] <== 18 * evals[17][0];
    tmp_346[1] <== 18 * evals[17][1];
    tmp_346[2] <== 18 * evals[17][2];
    signal tmp_347[3];

    tmp_347[0] <== tmp_345[0] + tmp_346[0];
    tmp_347[1] <== tmp_345[1] + tmp_346[1];
    tmp_347[2] <== tmp_345[2] + tmp_346[2];
    signal tmp_348[3];

    tmp_348[0] <== 34 * evals[18][0];
    tmp_348[1] <== 34 * evals[18][1];
    tmp_348[2] <== 34 * evals[18][2];
    signal tmp_349[3];

    tmp_349[0] <== tmp_347[0] + tmp_348[0];
    tmp_349[1] <== tmp_347[1] + tmp_348[1];
    tmp_349[2] <== tmp_347[2] + tmp_348[2];
    signal tmp_350[3];

    tmp_350[0] <== 20 * evals[19][0];
    tmp_350[1] <== 20 * evals[19][1];
    tmp_350[2] <== 20 * evals[19][2];
    signal tmp_351[3];

    tmp_351[0] <== tmp_349[0] + tmp_350[0];
    tmp_351[1] <== tmp_349[1] + tmp_350[1];
    tmp_351[2] <== tmp_349[2] + tmp_350[2];
    signal tmp_352[3];

    tmp_352[0] <== 17 * evals[21][0];
    tmp_352[1] <== 17 * evals[21][1];
    tmp_352[2] <== 17 * evals[21][2];
    signal tmp_353[3];

    tmp_353[0] <== tmp_351[0] + tmp_352[0];
    tmp_353[1] <== tmp_351[1] + tmp_352[1];
    tmp_353[2] <== tmp_351[2] + tmp_352[2];
    signal tmp_354[3];

    tmp_354[0] <== evals[34][0] - tmp_353[0];
    tmp_354[1] <== evals[34][1] - tmp_353[1];
    tmp_354[2] <== evals[34][2] - tmp_353[2];
    signal tmp_355[3];

    component cmul_43 = CMul();
    cmul_43.ina[0] <== evals[23][0];
    cmul_43.ina[1] <== evals[23][1];
    cmul_43.ina[2] <== evals[23][2];
    cmul_43.inb[0] <== tmp_354[0];
    cmul_43.inb[1] <== tmp_354[1];
    cmul_43.inb[2] <== tmp_354[2];
    tmp_355[0] <== cmul_43.out[0];
    tmp_355[1] <== cmul_43.out[1];
    tmp_355[2] <== cmul_43.out[2];
    signal tmp_601[3];

    tmp_601[0] <== tmp_355[0] - 0;
    tmp_601[1] <== tmp_355[1];
    tmp_601[2] <== tmp_355[2];
    signal tmp_356[3];

    tmp_356[0] <== evals[2][0] + evals[3][0];
    tmp_356[1] <== evals[2][1] + evals[3][1];
    tmp_356[2] <== evals[2][2] + evals[3][2];
    signal tmp_357[3];

    tmp_357[0] <== evals[5][0] + evals[6][0];
    tmp_357[1] <== evals[5][1] + evals[6][1];
    tmp_357[2] <== evals[5][2] + evals[6][2];
    signal tmp_358[3];

    component cmul_44 = CMul();
    cmul_44.ina[0] <== tmp_356[0];
    cmul_44.ina[1] <== tmp_356[1];
    cmul_44.ina[2] <== tmp_356[2];
    cmul_44.inb[0] <== tmp_357[0];
    cmul_44.inb[1] <== tmp_357[1];
    cmul_44.inb[2] <== tmp_357[2];
    tmp_358[0] <== cmul_44.out[0];
    tmp_358[1] <== cmul_44.out[1];
    tmp_358[2] <== cmul_44.out[2];
    signal tmp_359[3];

    component cmul_45 = CMul();
    cmul_45.ina[0] <== evals[35][0];
    cmul_45.ina[1] <== evals[35][1];
    cmul_45.ina[2] <== evals[35][2];
    cmul_45.inb[0] <== Z[0];
    cmul_45.inb[1] <== Z[1];
    cmul_45.inb[2] <== Z[2];
    tmp_359[0] <== cmul_45.out[0];
    tmp_359[1] <== cmul_45.out[1];
    tmp_359[2] <== cmul_45.out[2];
    signal tmp_602[3];

    tmp_602[0] <== tmp_358[0] - tmp_359[0];
    tmp_602[1] <== tmp_358[1] - tmp_359[1];
    tmp_602[2] <== tmp_358[2] - tmp_359[2];
    signal tmp_360[3];

    component cmul_46 = CMul();
    cmul_46.ina[0] <== evals[0][0];
    cmul_46.ina[1] <== evals[0][1];
    cmul_46.ina[2] <== evals[0][2];
    cmul_46.inb[0] <== evals[4][0];
    cmul_46.inb[1] <== evals[4][1];
    cmul_46.inb[2] <== evals[4][2];
    tmp_360[0] <== cmul_46.out[0];
    tmp_360[1] <== cmul_46.out[1];
    tmp_360[2] <== cmul_46.out[2];
    signal tmp_361[3];

    component cmul_47 = CMul();
    cmul_47.ina[0] <== evals[36][0];
    cmul_47.ina[1] <== evals[36][1];
    cmul_47.ina[2] <== evals[36][2];
    cmul_47.inb[0] <== Z[0];
    cmul_47.inb[1] <== Z[1];
    cmul_47.inb[2] <== Z[2];
    tmp_361[0] <== cmul_47.out[0];
    tmp_361[1] <== cmul_47.out[1];
    tmp_361[2] <== cmul_47.out[2];
    signal tmp_603[3];

    tmp_603[0] <== tmp_360[0] - tmp_361[0];
    tmp_603[1] <== tmp_360[1] - tmp_361[1];
    tmp_603[2] <== tmp_360[2] - tmp_361[2];
    signal tmp_362[3];

    component cmul_48 = CMul();
    cmul_48.ina[0] <== evals[2][0];
    cmul_48.ina[1] <== evals[2][1];
    cmul_48.ina[2] <== evals[2][2];
    cmul_48.inb[0] <== evals[5][0];
    cmul_48.inb[1] <== evals[5][1];
    cmul_48.inb[2] <== evals[5][2];
    tmp_362[0] <== cmul_48.out[0];
    tmp_362[1] <== cmul_48.out[1];
    tmp_362[2] <== cmul_48.out[2];
    signal tmp_363[3];

    component cmul_49 = CMul();
    cmul_49.ina[0] <== evals[37][0];
    cmul_49.ina[1] <== evals[37][1];
    cmul_49.ina[2] <== evals[37][2];
    cmul_49.inb[0] <== Z[0];
    cmul_49.inb[1] <== Z[1];
    cmul_49.inb[2] <== Z[2];
    tmp_363[0] <== cmul_49.out[0];
    tmp_363[1] <== cmul_49.out[1];
    tmp_363[2] <== cmul_49.out[2];
    signal tmp_604[3];

    tmp_604[0] <== tmp_362[0] - tmp_363[0];
    tmp_604[1] <== tmp_362[1] - tmp_363[1];
    tmp_604[2] <== tmp_362[2] - tmp_363[2];
    signal tmp_364[3];

    component cmul_50 = CMul();
    cmul_50.ina[0] <== evals[3][0];
    cmul_50.ina[1] <== evals[3][1];
    cmul_50.ina[2] <== evals[3][2];
    cmul_50.inb[0] <== evals[6][0];
    cmul_50.inb[1] <== evals[6][1];
    cmul_50.inb[2] <== evals[6][2];
    tmp_364[0] <== cmul_50.out[0];
    tmp_364[1] <== cmul_50.out[1];
    tmp_364[2] <== cmul_50.out[2];
    signal tmp_365[3];

    component cmul_51 = CMul();
    cmul_51.ina[0] <== evals[38][0];
    cmul_51.ina[1] <== evals[38][1];
    cmul_51.ina[2] <== evals[38][2];
    cmul_51.inb[0] <== Z[0];
    cmul_51.inb[1] <== Z[1];
    cmul_51.inb[2] <== Z[2];
    tmp_365[0] <== cmul_51.out[0];
    tmp_365[1] <== cmul_51.out[1];
    tmp_365[2] <== cmul_51.out[2];
    signal tmp_605[3];

    tmp_605[0] <== tmp_364[0] - tmp_365[0];
    tmp_605[1] <== tmp_364[1] - tmp_365[1];
    tmp_605[2] <== tmp_364[2] - tmp_365[2];
    signal tmp_366[3];

    tmp_366[0] <== tmp_602[0] + tmp_603[0];
    tmp_366[1] <== tmp_602[1] + tmp_603[1];
    tmp_366[2] <== tmp_602[2] + tmp_603[2];
    signal tmp_367[3];

    tmp_367[0] <== tmp_366[0] - tmp_604[0];
    tmp_367[1] <== tmp_366[1] - tmp_604[1];
    tmp_367[2] <== tmp_366[2] - tmp_604[2];
    signal tmp_368[3];

    tmp_368[0] <== tmp_367[0] - tmp_605[0];
    tmp_368[1] <== tmp_367[1] - tmp_605[1];
    tmp_368[2] <== tmp_367[2] - tmp_605[2];
    signal tmp_369[3];

    tmp_369[0] <== evals[7][0] - tmp_368[0];
    tmp_369[1] <== evals[7][1] - tmp_368[1];
    tmp_369[2] <== evals[7][2] - tmp_368[2];
    signal tmp_370[3];

    component cmul_52 = CMul();
    cmul_52.ina[0] <== evals[39][0];
    cmul_52.ina[1] <== evals[39][1];
    cmul_52.ina[2] <== evals[39][2];
    cmul_52.inb[0] <== tmp_369[0];
    cmul_52.inb[1] <== tmp_369[1];
    cmul_52.inb[2] <== tmp_369[2];
    tmp_370[0] <== cmul_52.out[0];
    tmp_370[1] <== cmul_52.out[1];
    tmp_370[2] <== cmul_52.out[2];
    signal tmp_606[3];

    tmp_606[0] <== tmp_370[0] - 0;
    tmp_606[1] <== tmp_370[1];
    tmp_606[2] <== tmp_370[2];
    signal tmp_371[3];

    tmp_371[0] <== evals[0][0] + evals[2][0];
    tmp_371[1] <== evals[0][1] + evals[2][1];
    tmp_371[2] <== evals[0][2] + evals[2][2];
    signal tmp_372[3];

    tmp_372[0] <== evals[4][0] + evals[5][0];
    tmp_372[1] <== evals[4][1] + evals[5][1];
    tmp_372[2] <== evals[4][2] + evals[5][2];
    signal tmp_373[3];

    component cmul_53 = CMul();
    cmul_53.ina[0] <== tmp_371[0];
    cmul_53.ina[1] <== tmp_371[1];
    cmul_53.ina[2] <== tmp_371[2];
    cmul_53.inb[0] <== tmp_372[0];
    cmul_53.inb[1] <== tmp_372[1];
    cmul_53.inb[2] <== tmp_372[2];
    tmp_373[0] <== cmul_53.out[0];
    tmp_373[1] <== cmul_53.out[1];
    tmp_373[2] <== cmul_53.out[2];
    signal tmp_374[3];

    component cmul_54 = CMul();
    cmul_54.ina[0] <== evals[40][0];
    cmul_54.ina[1] <== evals[40][1];
    cmul_54.ina[2] <== evals[40][2];
    cmul_54.inb[0] <== Z[0];
    cmul_54.inb[1] <== Z[1];
    cmul_54.inb[2] <== Z[2];
    tmp_374[0] <== cmul_54.out[0];
    tmp_374[1] <== cmul_54.out[1];
    tmp_374[2] <== cmul_54.out[2];
    signal tmp_607[3];

    tmp_607[0] <== tmp_373[0] - tmp_374[0];
    tmp_607[1] <== tmp_373[1] - tmp_374[1];
    tmp_607[2] <== tmp_373[2] - tmp_374[2];
    signal tmp_375[3];

    tmp_375[0] <== tmp_607[0] + tmp_602[0];
    tmp_375[1] <== tmp_607[1] + tmp_602[1];
    tmp_375[2] <== tmp_607[2] + tmp_602[2];
    signal tmp_376[3];

    tmp_376[0] <== 2 * tmp_604[0];
    tmp_376[1] <== 2 * tmp_604[1];
    tmp_376[2] <== 2 * tmp_604[2];
    signal tmp_377[3];

    tmp_377[0] <== tmp_375[0] - tmp_376[0];
    tmp_377[1] <== tmp_375[1] - tmp_376[1];
    tmp_377[2] <== tmp_375[2] - tmp_376[2];
    signal tmp_378[3];

    tmp_378[0] <== tmp_377[0] - tmp_603[0];
    tmp_378[1] <== tmp_377[1] - tmp_603[1];
    tmp_378[2] <== tmp_377[2] - tmp_603[2];
    signal tmp_379[3];

    tmp_379[0] <== evals[8][0] - tmp_378[0];
    tmp_379[1] <== evals[8][1] - tmp_378[1];
    tmp_379[2] <== evals[8][2] - tmp_378[2];
    signal tmp_380[3];

    component cmul_55 = CMul();
    cmul_55.ina[0] <== evals[39][0];
    cmul_55.ina[1] <== evals[39][1];
    cmul_55.ina[2] <== evals[39][2];
    cmul_55.inb[0] <== tmp_379[0];
    cmul_55.inb[1] <== tmp_379[1];
    cmul_55.inb[2] <== tmp_379[2];
    tmp_380[0] <== cmul_55.out[0];
    tmp_380[1] <== cmul_55.out[1];
    tmp_380[2] <== cmul_55.out[2];
    signal tmp_608[3];

    tmp_608[0] <== tmp_380[0] - 0;
    tmp_608[1] <== tmp_380[1];
    tmp_608[2] <== tmp_380[2];
    signal tmp_381[3];

    tmp_381[0] <== evals[0][0] + evals[3][0];
    tmp_381[1] <== evals[0][1] + evals[3][1];
    tmp_381[2] <== evals[0][2] + evals[3][2];
    signal tmp_382[3];

    tmp_382[0] <== evals[4][0] + evals[6][0];
    tmp_382[1] <== evals[4][1] + evals[6][1];
    tmp_382[2] <== evals[4][2] + evals[6][2];
    signal tmp_383[3];

    component cmul_56 = CMul();
    cmul_56.ina[0] <== tmp_381[0];
    cmul_56.ina[1] <== tmp_381[1];
    cmul_56.ina[2] <== tmp_381[2];
    cmul_56.inb[0] <== tmp_382[0];
    cmul_56.inb[1] <== tmp_382[1];
    cmul_56.inb[2] <== tmp_382[2];
    tmp_383[0] <== cmul_56.out[0];
    tmp_383[1] <== cmul_56.out[1];
    tmp_383[2] <== cmul_56.out[2];
    signal tmp_384[3];

    component cmul_57 = CMul();
    cmul_57.ina[0] <== evals[41][0];
    cmul_57.ina[1] <== evals[41][1];
    cmul_57.ina[2] <== evals[41][2];
    cmul_57.inb[0] <== Z[0];
    cmul_57.inb[1] <== Z[1];
    cmul_57.inb[2] <== Z[2];
    tmp_384[0] <== cmul_57.out[0];
    tmp_384[1] <== cmul_57.out[1];
    tmp_384[2] <== cmul_57.out[2];
    signal tmp_609[3];

    tmp_609[0] <== tmp_383[0] - tmp_384[0];
    tmp_609[1] <== tmp_383[1] - tmp_384[1];
    tmp_609[2] <== tmp_383[2] - tmp_384[2];
    signal tmp_385[3];

    tmp_385[0] <== tmp_609[0] - tmp_603[0];
    tmp_385[1] <== tmp_609[1] - tmp_603[1];
    tmp_385[2] <== tmp_609[2] - tmp_603[2];
    signal tmp_386[3];

    tmp_386[0] <== tmp_385[0] + tmp_604[0];
    tmp_386[1] <== tmp_385[1] + tmp_604[1];
    tmp_386[2] <== tmp_385[2] + tmp_604[2];
    signal tmp_387[3];

    tmp_387[0] <== evals[17][0] - tmp_386[0];
    tmp_387[1] <== evals[17][1] - tmp_386[1];
    tmp_387[2] <== evals[17][2] - tmp_386[2];
    signal tmp_388[3];

    component cmul_58 = CMul();
    cmul_58.ina[0] <== evals[39][0];
    cmul_58.ina[1] <== evals[39][1];
    cmul_58.ina[2] <== evals[39][2];
    cmul_58.inb[0] <== tmp_387[0];
    cmul_58.inb[1] <== tmp_387[1];
    cmul_58.inb[2] <== tmp_387[2];
    tmp_388[0] <== cmul_58.out[0];
    tmp_388[1] <== cmul_58.out[1];
    tmp_388[2] <== cmul_58.out[2];
    signal tmp_610[3];

    tmp_610[0] <== tmp_388[0] - 0;
    tmp_610[1] <== tmp_388[1];
    tmp_610[2] <== tmp_388[2];
    signal tmp_389[3];

    tmp_389[0] <== evals[42][0] - 1;
    tmp_389[1] <== evals[42][1];
    tmp_389[2] <== evals[42][2];
    signal tmp_611[3];

    component cmul_59 = CMul();
    cmul_59.ina[0] <== evals[1][0];
    cmul_59.ina[1] <== evals[1][1];
    cmul_59.ina[2] <== evals[1][2];
    cmul_59.inb[0] <== tmp_389[0];
    cmul_59.inb[1] <== tmp_389[1];
    cmul_59.inb[2] <== tmp_389[2];
    tmp_611[0] <== cmul_59.out[0];
    tmp_611[1] <== cmul_59.out[1];
    tmp_611[2] <== cmul_59.out[2];
    signal tmp_612[3];

    tmp_612[0] <== evals[0][0];
    tmp_612[1] <== evals[0][1];
    tmp_612[2] <== evals[0][2];
    signal tmp_613[3];

    tmp_613[0] <== evals[43][0];
    tmp_613[1] <== evals[43][1];
    tmp_613[2] <== evals[43][2];
    signal tmp_390[3];

    component cmul_60 = CMul();
    cmul_60.ina[0] <== challenges[3][0];
    cmul_60.ina[1] <== challenges[3][1];
    cmul_60.ina[2] <== challenges[3][2];
    cmul_60.inb[0] <== tmp_613[0];
    cmul_60.inb[1] <== tmp_613[1];
    cmul_60.inb[2] <== tmp_613[2];
    tmp_390[0] <== cmul_60.out[0];
    tmp_390[1] <== cmul_60.out[1];
    tmp_390[2] <== cmul_60.out[2];
    signal tmp_391[3];

    tmp_391[0] <== tmp_612[0] + tmp_390[0];
    tmp_391[1] <== tmp_612[1] + tmp_390[1];
    tmp_391[2] <== tmp_612[2] + tmp_390[2];
    signal tmp_614[3];

    tmp_614[0] <== tmp_391[0] + challenges[2][0];
    tmp_614[1] <== tmp_391[1] + challenges[2][1];
    tmp_614[2] <== tmp_391[2] + challenges[2][2];
    signal tmp_615[3];

    tmp_615[0] <== evals[2][0];
    tmp_615[1] <== evals[2][1];
    tmp_615[2] <== evals[2][2];
    signal tmp_616[3];

    tmp_616[0] <== evals[44][0];
    tmp_616[1] <== evals[44][1];
    tmp_616[2] <== evals[44][2];
    signal tmp_392[3];

    component cmul_61 = CMul();
    cmul_61.ina[0] <== challenges[3][0];
    cmul_61.ina[1] <== challenges[3][1];
    cmul_61.ina[2] <== challenges[3][2];
    cmul_61.inb[0] <== tmp_616[0];
    cmul_61.inb[1] <== tmp_616[1];
    cmul_61.inb[2] <== tmp_616[2];
    tmp_392[0] <== cmul_61.out[0];
    tmp_392[1] <== cmul_61.out[1];
    tmp_392[2] <== cmul_61.out[2];
    signal tmp_393[3];

    tmp_393[0] <== tmp_615[0] + tmp_392[0];
    tmp_393[1] <== tmp_615[1] + tmp_392[1];
    tmp_393[2] <== tmp_615[2] + tmp_392[2];
    signal tmp_394[3];

    tmp_394[0] <== tmp_393[0] + challenges[2][0];
    tmp_394[1] <== tmp_393[1] + challenges[2][1];
    tmp_394[2] <== tmp_393[2] + challenges[2][2];
    signal tmp_395[3];

    component cmul_62 = CMul();
    cmul_62.ina[0] <== tmp_614[0];
    cmul_62.ina[1] <== tmp_614[1];
    cmul_62.ina[2] <== tmp_614[2];
    cmul_62.inb[0] <== tmp_394[0];
    cmul_62.inb[1] <== tmp_394[1];
    cmul_62.inb[2] <== tmp_394[2];
    tmp_395[0] <== cmul_62.out[0];
    tmp_395[1] <== cmul_62.out[1];
    tmp_395[2] <== cmul_62.out[2];
    signal tmp_396[3];

    component cmul_63 = CMul();
    cmul_63.ina[0] <== evals[45][0];
    cmul_63.ina[1] <== evals[45][1];
    cmul_63.ina[2] <== evals[45][2];
    cmul_63.inb[0] <== Z[0];
    cmul_63.inb[1] <== Z[1];
    cmul_63.inb[2] <== Z[2];
    tmp_396[0] <== cmul_63.out[0];
    tmp_396[1] <== cmul_63.out[1];
    tmp_396[2] <== cmul_63.out[2];
    signal tmp_617[3];

    tmp_617[0] <== tmp_395[0] - tmp_396[0];
    tmp_617[1] <== tmp_395[1] - tmp_396[1];
    tmp_617[2] <== tmp_395[2] - tmp_396[2];
    signal tmp_618[3];

    tmp_618[0] <== evals[3][0];
    tmp_618[1] <== evals[3][1];
    tmp_618[2] <== evals[3][2];
    signal tmp_619[3];

    tmp_619[0] <== evals[46][0];
    tmp_619[1] <== evals[46][1];
    tmp_619[2] <== evals[46][2];
    signal tmp_397[3];

    component cmul_64 = CMul();
    cmul_64.ina[0] <== challenges[3][0];
    cmul_64.ina[1] <== challenges[3][1];
    cmul_64.ina[2] <== challenges[3][2];
    cmul_64.inb[0] <== tmp_619[0];
    cmul_64.inb[1] <== tmp_619[1];
    cmul_64.inb[2] <== tmp_619[2];
    tmp_397[0] <== cmul_64.out[0];
    tmp_397[1] <== cmul_64.out[1];
    tmp_397[2] <== cmul_64.out[2];
    signal tmp_398[3];

    tmp_398[0] <== tmp_618[0] + tmp_397[0];
    tmp_398[1] <== tmp_618[1] + tmp_397[1];
    tmp_398[2] <== tmp_618[2] + tmp_397[2];
    signal tmp_399[3];

    tmp_399[0] <== tmp_398[0] + challenges[2][0];
    tmp_399[1] <== tmp_398[1] + challenges[2][1];
    tmp_399[2] <== tmp_398[2] + challenges[2][2];
    signal tmp_400[3];

    component cmul_65 = CMul();
    cmul_65.ina[0] <== tmp_617[0];
    cmul_65.ina[1] <== tmp_617[1];
    cmul_65.ina[2] <== tmp_617[2];
    cmul_65.inb[0] <== tmp_399[0];
    cmul_65.inb[1] <== tmp_399[1];
    cmul_65.inb[2] <== tmp_399[2];
    tmp_400[0] <== cmul_65.out[0];
    tmp_400[1] <== cmul_65.out[1];
    tmp_400[2] <== cmul_65.out[2];
    signal tmp_401[3];

    component cmul_66 = CMul();
    cmul_66.ina[0] <== evals[47][0];
    cmul_66.ina[1] <== evals[47][1];
    cmul_66.ina[2] <== evals[47][2];
    cmul_66.inb[0] <== Z[0];
    cmul_66.inb[1] <== Z[1];
    cmul_66.inb[2] <== Z[2];
    tmp_401[0] <== cmul_66.out[0];
    tmp_401[1] <== cmul_66.out[1];
    tmp_401[2] <== cmul_66.out[2];
    signal tmp_620[3];

    tmp_620[0] <== tmp_400[0] - tmp_401[0];
    tmp_620[1] <== tmp_400[1] - tmp_401[1];
    tmp_620[2] <== tmp_400[2] - tmp_401[2];
    signal tmp_621[3];

    tmp_621[0] <== evals[4][0];
    tmp_621[1] <== evals[4][1];
    tmp_621[2] <== evals[4][2];
    signal tmp_622[3];

    tmp_622[0] <== evals[48][0];
    tmp_622[1] <== evals[48][1];
    tmp_622[2] <== evals[48][2];
    signal tmp_402[3];

    component cmul_67 = CMul();
    cmul_67.ina[0] <== challenges[3][0];
    cmul_67.ina[1] <== challenges[3][1];
    cmul_67.ina[2] <== challenges[3][2];
    cmul_67.inb[0] <== tmp_622[0];
    cmul_67.inb[1] <== tmp_622[1];
    cmul_67.inb[2] <== tmp_622[2];
    tmp_402[0] <== cmul_67.out[0];
    tmp_402[1] <== cmul_67.out[1];
    tmp_402[2] <== cmul_67.out[2];
    signal tmp_403[3];

    tmp_403[0] <== tmp_621[0] + tmp_402[0];
    tmp_403[1] <== tmp_621[1] + tmp_402[1];
    tmp_403[2] <== tmp_621[2] + tmp_402[2];
    signal tmp_404[3];

    tmp_404[0] <== tmp_403[0] + challenges[2][0];
    tmp_404[1] <== tmp_403[1] + challenges[2][1];
    tmp_404[2] <== tmp_403[2] + challenges[2][2];
    signal tmp_405[3];

    component cmul_68 = CMul();
    cmul_68.ina[0] <== tmp_620[0];
    cmul_68.ina[1] <== tmp_620[1];
    cmul_68.ina[2] <== tmp_620[2];
    cmul_68.inb[0] <== tmp_404[0];
    cmul_68.inb[1] <== tmp_404[1];
    cmul_68.inb[2] <== tmp_404[2];
    tmp_405[0] <== cmul_68.out[0];
    tmp_405[1] <== cmul_68.out[1];
    tmp_405[2] <== cmul_68.out[2];
    signal tmp_406[3];

    component cmul_69 = CMul();
    cmul_69.ina[0] <== evals[49][0];
    cmul_69.ina[1] <== evals[49][1];
    cmul_69.ina[2] <== evals[49][2];
    cmul_69.inb[0] <== Z[0];
    cmul_69.inb[1] <== Z[1];
    cmul_69.inb[2] <== Z[2];
    tmp_406[0] <== cmul_69.out[0];
    tmp_406[1] <== cmul_69.out[1];
    tmp_406[2] <== cmul_69.out[2];
    signal tmp_623[3];

    tmp_623[0] <== tmp_405[0] - tmp_406[0];
    tmp_623[1] <== tmp_405[1] - tmp_406[1];
    tmp_623[2] <== tmp_405[2] - tmp_406[2];
    signal tmp_624[3];

    tmp_624[0] <== evals[5][0];
    tmp_624[1] <== evals[5][1];
    tmp_624[2] <== evals[5][2];
    signal tmp_625[3];

    tmp_625[0] <== evals[50][0];
    tmp_625[1] <== evals[50][1];
    tmp_625[2] <== evals[50][2];
    signal tmp_407[3];

    component cmul_70 = CMul();
    cmul_70.ina[0] <== challenges[3][0];
    cmul_70.ina[1] <== challenges[3][1];
    cmul_70.ina[2] <== challenges[3][2];
    cmul_70.inb[0] <== tmp_625[0];
    cmul_70.inb[1] <== tmp_625[1];
    cmul_70.inb[2] <== tmp_625[2];
    tmp_407[0] <== cmul_70.out[0];
    tmp_407[1] <== cmul_70.out[1];
    tmp_407[2] <== cmul_70.out[2];
    signal tmp_408[3];

    tmp_408[0] <== tmp_624[0] + tmp_407[0];
    tmp_408[1] <== tmp_624[1] + tmp_407[1];
    tmp_408[2] <== tmp_624[2] + tmp_407[2];
    signal tmp_409[3];

    tmp_409[0] <== tmp_408[0] + challenges[2][0];
    tmp_409[1] <== tmp_408[1] + challenges[2][1];
    tmp_409[2] <== tmp_408[2] + challenges[2][2];
    signal tmp_410[3];

    component cmul_71 = CMul();
    cmul_71.ina[0] <== tmp_623[0];
    cmul_71.ina[1] <== tmp_623[1];
    cmul_71.ina[2] <== tmp_623[2];
    cmul_71.inb[0] <== tmp_409[0];
    cmul_71.inb[1] <== tmp_409[1];
    cmul_71.inb[2] <== tmp_409[2];
    tmp_410[0] <== cmul_71.out[0];
    tmp_410[1] <== cmul_71.out[1];
    tmp_410[2] <== cmul_71.out[2];
    signal tmp_411[3];

    component cmul_72 = CMul();
    cmul_72.ina[0] <== evals[51][0];
    cmul_72.ina[1] <== evals[51][1];
    cmul_72.ina[2] <== evals[51][2];
    cmul_72.inb[0] <== Z[0];
    cmul_72.inb[1] <== Z[1];
    cmul_72.inb[2] <== Z[2];
    tmp_411[0] <== cmul_72.out[0];
    tmp_411[1] <== cmul_72.out[1];
    tmp_411[2] <== cmul_72.out[2];
    signal tmp_626[3];

    tmp_626[0] <== tmp_410[0] - tmp_411[0];
    tmp_626[1] <== tmp_410[1] - tmp_411[1];
    tmp_626[2] <== tmp_410[2] - tmp_411[2];
    signal tmp_627[3];

    tmp_627[0] <== evals[6][0];
    tmp_627[1] <== evals[6][1];
    tmp_627[2] <== evals[6][2];
    signal tmp_628[3];

    tmp_628[0] <== evals[52][0];
    tmp_628[1] <== evals[52][1];
    tmp_628[2] <== evals[52][2];
    signal tmp_412[3];

    component cmul_73 = CMul();
    cmul_73.ina[0] <== challenges[3][0];
    cmul_73.ina[1] <== challenges[3][1];
    cmul_73.ina[2] <== challenges[3][2];
    cmul_73.inb[0] <== tmp_628[0];
    cmul_73.inb[1] <== tmp_628[1];
    cmul_73.inb[2] <== tmp_628[2];
    tmp_412[0] <== cmul_73.out[0];
    tmp_412[1] <== cmul_73.out[1];
    tmp_412[2] <== cmul_73.out[2];
    signal tmp_413[3];

    tmp_413[0] <== tmp_627[0] + tmp_412[0];
    tmp_413[1] <== tmp_627[1] + tmp_412[1];
    tmp_413[2] <== tmp_627[2] + tmp_412[2];
    signal tmp_414[3];

    tmp_414[0] <== tmp_413[0] + challenges[2][0];
    tmp_414[1] <== tmp_413[1] + challenges[2][1];
    tmp_414[2] <== tmp_413[2] + challenges[2][2];
    signal tmp_415[3];

    component cmul_74 = CMul();
    cmul_74.ina[0] <== tmp_626[0];
    cmul_74.ina[1] <== tmp_626[1];
    cmul_74.ina[2] <== tmp_626[2];
    cmul_74.inb[0] <== tmp_414[0];
    cmul_74.inb[1] <== tmp_414[1];
    cmul_74.inb[2] <== tmp_414[2];
    tmp_415[0] <== cmul_74.out[0];
    tmp_415[1] <== cmul_74.out[1];
    tmp_415[2] <== cmul_74.out[2];
    signal tmp_416[3];

    component cmul_75 = CMul();
    cmul_75.ina[0] <== evals[53][0];
    cmul_75.ina[1] <== evals[53][1];
    cmul_75.ina[2] <== evals[53][2];
    cmul_75.inb[0] <== Z[0];
    cmul_75.inb[1] <== Z[1];
    cmul_75.inb[2] <== Z[2];
    tmp_416[0] <== cmul_75.out[0];
    tmp_416[1] <== cmul_75.out[1];
    tmp_416[2] <== cmul_75.out[2];
    signal tmp_629[3];

    tmp_629[0] <== tmp_415[0] - tmp_416[0];
    tmp_629[1] <== tmp_415[1] - tmp_416[1];
    tmp_629[2] <== tmp_415[2] - tmp_416[2];
    signal tmp_630[3];

    tmp_630[0] <== evals[7][0];
    tmp_630[1] <== evals[7][1];
    tmp_630[2] <== evals[7][2];
    signal tmp_631[3];

    tmp_631[0] <== evals[54][0];
    tmp_631[1] <== evals[54][1];
    tmp_631[2] <== evals[54][2];
    signal tmp_417[3];

    component cmul_76 = CMul();
    cmul_76.ina[0] <== challenges[3][0];
    cmul_76.ina[1] <== challenges[3][1];
    cmul_76.ina[2] <== challenges[3][2];
    cmul_76.inb[0] <== tmp_631[0];
    cmul_76.inb[1] <== tmp_631[1];
    cmul_76.inb[2] <== tmp_631[2];
    tmp_417[0] <== cmul_76.out[0];
    tmp_417[1] <== cmul_76.out[1];
    tmp_417[2] <== cmul_76.out[2];
    signal tmp_418[3];

    tmp_418[0] <== tmp_630[0] + tmp_417[0];
    tmp_418[1] <== tmp_630[1] + tmp_417[1];
    tmp_418[2] <== tmp_630[2] + tmp_417[2];
    signal tmp_419[3];

    tmp_419[0] <== tmp_418[0] + challenges[2][0];
    tmp_419[1] <== tmp_418[1] + challenges[2][1];
    tmp_419[2] <== tmp_418[2] + challenges[2][2];
    signal tmp_420[3];

    component cmul_77 = CMul();
    cmul_77.ina[0] <== tmp_629[0];
    cmul_77.ina[1] <== tmp_629[1];
    cmul_77.ina[2] <== tmp_629[2];
    cmul_77.inb[0] <== tmp_419[0];
    cmul_77.inb[1] <== tmp_419[1];
    cmul_77.inb[2] <== tmp_419[2];
    tmp_420[0] <== cmul_77.out[0];
    tmp_420[1] <== cmul_77.out[1];
    tmp_420[2] <== cmul_77.out[2];
    signal tmp_421[3];

    component cmul_78 = CMul();
    cmul_78.ina[0] <== evals[55][0];
    cmul_78.ina[1] <== evals[55][1];
    cmul_78.ina[2] <== evals[55][2];
    cmul_78.inb[0] <== Z[0];
    cmul_78.inb[1] <== Z[1];
    cmul_78.inb[2] <== Z[2];
    tmp_421[0] <== cmul_78.out[0];
    tmp_421[1] <== cmul_78.out[1];
    tmp_421[2] <== cmul_78.out[2];
    signal tmp_632[3];

    tmp_632[0] <== tmp_420[0] - tmp_421[0];
    tmp_632[1] <== tmp_420[1] - tmp_421[1];
    tmp_632[2] <== tmp_420[2] - tmp_421[2];
    signal tmp_633[3];

    tmp_633[0] <== evals[8][0];
    tmp_633[1] <== evals[8][1];
    tmp_633[2] <== evals[8][2];
    signal tmp_634[3];

    tmp_634[0] <== evals[56][0];
    tmp_634[1] <== evals[56][1];
    tmp_634[2] <== evals[56][2];
    signal tmp_422[3];

    component cmul_79 = CMul();
    cmul_79.ina[0] <== challenges[3][0];
    cmul_79.ina[1] <== challenges[3][1];
    cmul_79.ina[2] <== challenges[3][2];
    cmul_79.inb[0] <== tmp_634[0];
    cmul_79.inb[1] <== tmp_634[1];
    cmul_79.inb[2] <== tmp_634[2];
    tmp_422[0] <== cmul_79.out[0];
    tmp_422[1] <== cmul_79.out[1];
    tmp_422[2] <== cmul_79.out[2];
    signal tmp_423[3];

    tmp_423[0] <== tmp_633[0] + tmp_422[0];
    tmp_423[1] <== tmp_633[1] + tmp_422[1];
    tmp_423[2] <== tmp_633[2] + tmp_422[2];
    signal tmp_424[3];

    tmp_424[0] <== tmp_423[0] + challenges[2][0];
    tmp_424[1] <== tmp_423[1] + challenges[2][1];
    tmp_424[2] <== tmp_423[2] + challenges[2][2];
    signal tmp_425[3];

    component cmul_80 = CMul();
    cmul_80.ina[0] <== tmp_632[0];
    cmul_80.ina[1] <== tmp_632[1];
    cmul_80.ina[2] <== tmp_632[2];
    cmul_80.inb[0] <== tmp_424[0];
    cmul_80.inb[1] <== tmp_424[1];
    cmul_80.inb[2] <== tmp_424[2];
    tmp_425[0] <== cmul_80.out[0];
    tmp_425[1] <== cmul_80.out[1];
    tmp_425[2] <== cmul_80.out[2];
    signal tmp_426[3];

    component cmul_81 = CMul();
    cmul_81.ina[0] <== evals[57][0];
    cmul_81.ina[1] <== evals[57][1];
    cmul_81.ina[2] <== evals[57][2];
    cmul_81.inb[0] <== Z[0];
    cmul_81.inb[1] <== Z[1];
    cmul_81.inb[2] <== Z[2];
    tmp_426[0] <== cmul_81.out[0];
    tmp_426[1] <== cmul_81.out[1];
    tmp_426[2] <== cmul_81.out[2];
    signal tmp_635[3];

    tmp_635[0] <== tmp_425[0] - tmp_426[0];
    tmp_635[1] <== tmp_425[1] - tmp_426[1];
    tmp_635[2] <== tmp_425[2] - tmp_426[2];
    signal tmp_636[3];

    tmp_636[0] <== evals[17][0];
    tmp_636[1] <== evals[17][1];
    tmp_636[2] <== evals[17][2];
    signal tmp_637[3];

    tmp_637[0] <== evals[58][0];
    tmp_637[1] <== evals[58][1];
    tmp_637[2] <== evals[58][2];
    signal tmp_427[3];

    component cmul_82 = CMul();
    cmul_82.ina[0] <== challenges[3][0];
    cmul_82.ina[1] <== challenges[3][1];
    cmul_82.ina[2] <== challenges[3][2];
    cmul_82.inb[0] <== tmp_637[0];
    cmul_82.inb[1] <== tmp_637[1];
    cmul_82.inb[2] <== tmp_637[2];
    tmp_427[0] <== cmul_82.out[0];
    tmp_427[1] <== cmul_82.out[1];
    tmp_427[2] <== cmul_82.out[2];
    signal tmp_428[3];

    tmp_428[0] <== tmp_636[0] + tmp_427[0];
    tmp_428[1] <== tmp_636[1] + tmp_427[1];
    tmp_428[2] <== tmp_636[2] + tmp_427[2];
    signal tmp_429[3];

    tmp_429[0] <== tmp_428[0] + challenges[2][0];
    tmp_429[1] <== tmp_428[1] + challenges[2][1];
    tmp_429[2] <== tmp_428[2] + challenges[2][2];
    signal tmp_430[3];

    component cmul_83 = CMul();
    cmul_83.ina[0] <== tmp_635[0];
    cmul_83.ina[1] <== tmp_635[1];
    cmul_83.ina[2] <== tmp_635[2];
    cmul_83.inb[0] <== tmp_429[0];
    cmul_83.inb[1] <== tmp_429[1];
    cmul_83.inb[2] <== tmp_429[2];
    tmp_430[0] <== cmul_83.out[0];
    tmp_430[1] <== cmul_83.out[1];
    tmp_430[2] <== cmul_83.out[2];
    signal tmp_431[3];

    component cmul_84 = CMul();
    cmul_84.ina[0] <== evals[59][0];
    cmul_84.ina[1] <== evals[59][1];
    cmul_84.ina[2] <== evals[59][2];
    cmul_84.inb[0] <== Z[0];
    cmul_84.inb[1] <== Z[1];
    cmul_84.inb[2] <== Z[2];
    tmp_431[0] <== cmul_84.out[0];
    tmp_431[1] <== cmul_84.out[1];
    tmp_431[2] <== cmul_84.out[2];
    signal tmp_638[3];

    tmp_638[0] <== tmp_430[0] - tmp_431[0];
    tmp_638[1] <== tmp_430[1] - tmp_431[1];
    tmp_638[2] <== tmp_430[2] - tmp_431[2];
    signal tmp_639[3];

    tmp_639[0] <== evals[18][0];
    tmp_639[1] <== evals[18][1];
    tmp_639[2] <== evals[18][2];
    signal tmp_640[3];

    tmp_640[0] <== evals[60][0];
    tmp_640[1] <== evals[60][1];
    tmp_640[2] <== evals[60][2];
    signal tmp_432[3];

    component cmul_85 = CMul();
    cmul_85.ina[0] <== challenges[3][0];
    cmul_85.ina[1] <== challenges[3][1];
    cmul_85.ina[2] <== challenges[3][2];
    cmul_85.inb[0] <== tmp_640[0];
    cmul_85.inb[1] <== tmp_640[1];
    cmul_85.inb[2] <== tmp_640[2];
    tmp_432[0] <== cmul_85.out[0];
    tmp_432[1] <== cmul_85.out[1];
    tmp_432[2] <== cmul_85.out[2];
    signal tmp_433[3];

    tmp_433[0] <== tmp_639[0] + tmp_432[0];
    tmp_433[1] <== tmp_639[1] + tmp_432[1];
    tmp_433[2] <== tmp_639[2] + tmp_432[2];
    signal tmp_434[3];

    tmp_434[0] <== tmp_433[0] + challenges[2][0];
    tmp_434[1] <== tmp_433[1] + challenges[2][1];
    tmp_434[2] <== tmp_433[2] + challenges[2][2];
    signal tmp_435[3];

    component cmul_86 = CMul();
    cmul_86.ina[0] <== tmp_638[0];
    cmul_86.ina[1] <== tmp_638[1];
    cmul_86.ina[2] <== tmp_638[2];
    cmul_86.inb[0] <== tmp_434[0];
    cmul_86.inb[1] <== tmp_434[1];
    cmul_86.inb[2] <== tmp_434[2];
    tmp_435[0] <== cmul_86.out[0];
    tmp_435[1] <== cmul_86.out[1];
    tmp_435[2] <== cmul_86.out[2];
    signal tmp_436[3];

    component cmul_87 = CMul();
    cmul_87.ina[0] <== evals[61][0];
    cmul_87.ina[1] <== evals[61][1];
    cmul_87.ina[2] <== evals[61][2];
    cmul_87.inb[0] <== Z[0];
    cmul_87.inb[1] <== Z[1];
    cmul_87.inb[2] <== Z[2];
    tmp_436[0] <== cmul_87.out[0];
    tmp_436[1] <== cmul_87.out[1];
    tmp_436[2] <== cmul_87.out[2];
    signal tmp_641[3];

    tmp_641[0] <== tmp_435[0] - tmp_436[0];
    tmp_641[1] <== tmp_435[1] - tmp_436[1];
    tmp_641[2] <== tmp_435[2] - tmp_436[2];
    signal tmp_642[3];

    tmp_642[0] <== evals[19][0];
    tmp_642[1] <== evals[19][1];
    tmp_642[2] <== evals[19][2];
    signal tmp_643[3];

    tmp_643[0] <== evals[62][0];
    tmp_643[1] <== evals[62][1];
    tmp_643[2] <== evals[62][2];
    signal tmp_437[3];

    component cmul_88 = CMul();
    cmul_88.ina[0] <== challenges[3][0];
    cmul_88.ina[1] <== challenges[3][1];
    cmul_88.ina[2] <== challenges[3][2];
    cmul_88.inb[0] <== tmp_643[0];
    cmul_88.inb[1] <== tmp_643[1];
    cmul_88.inb[2] <== tmp_643[2];
    tmp_437[0] <== cmul_88.out[0];
    tmp_437[1] <== cmul_88.out[1];
    tmp_437[2] <== cmul_88.out[2];
    signal tmp_438[3];

    tmp_438[0] <== tmp_642[0] + tmp_437[0];
    tmp_438[1] <== tmp_642[1] + tmp_437[1];
    tmp_438[2] <== tmp_642[2] + tmp_437[2];
    signal tmp_439[3];

    tmp_439[0] <== tmp_438[0] + challenges[2][0];
    tmp_439[1] <== tmp_438[1] + challenges[2][1];
    tmp_439[2] <== tmp_438[2] + challenges[2][2];
    signal tmp_440[3];

    component cmul_89 = CMul();
    cmul_89.ina[0] <== tmp_641[0];
    cmul_89.ina[1] <== tmp_641[1];
    cmul_89.ina[2] <== tmp_641[2];
    cmul_89.inb[0] <== tmp_439[0];
    cmul_89.inb[1] <== tmp_439[1];
    cmul_89.inb[2] <== tmp_439[2];
    tmp_440[0] <== cmul_89.out[0];
    tmp_440[1] <== cmul_89.out[1];
    tmp_440[2] <== cmul_89.out[2];
    signal tmp_441[3];

    component cmul_90 = CMul();
    cmul_90.ina[0] <== evals[63][0];
    cmul_90.ina[1] <== evals[63][1];
    cmul_90.ina[2] <== evals[63][2];
    cmul_90.inb[0] <== Z[0];
    cmul_90.inb[1] <== Z[1];
    cmul_90.inb[2] <== Z[2];
    tmp_441[0] <== cmul_90.out[0];
    tmp_441[1] <== cmul_90.out[1];
    tmp_441[2] <== cmul_90.out[2];
    signal tmp_644[3];

    tmp_644[0] <== tmp_440[0] - tmp_441[0];
    tmp_644[1] <== tmp_440[1] - tmp_441[1];
    tmp_644[2] <== tmp_440[2] - tmp_441[2];
    signal tmp_645[3];

    tmp_645[0] <== evals[21][0];
    tmp_645[1] <== evals[21][1];
    tmp_645[2] <== evals[21][2];
    signal tmp_646[3];

    tmp_646[0] <== evals[64][0];
    tmp_646[1] <== evals[64][1];
    tmp_646[2] <== evals[64][2];
    signal tmp_442[3];

    component cmul_91 = CMul();
    cmul_91.ina[0] <== challenges[3][0];
    cmul_91.ina[1] <== challenges[3][1];
    cmul_91.ina[2] <== challenges[3][2];
    cmul_91.inb[0] <== tmp_646[0];
    cmul_91.inb[1] <== tmp_646[1];
    cmul_91.inb[2] <== tmp_646[2];
    tmp_442[0] <== cmul_91.out[0];
    tmp_442[1] <== cmul_91.out[1];
    tmp_442[2] <== cmul_91.out[2];
    signal tmp_443[3];

    tmp_443[0] <== tmp_645[0] + tmp_442[0];
    tmp_443[1] <== tmp_645[1] + tmp_442[1];
    tmp_443[2] <== tmp_645[2] + tmp_442[2];
    signal tmp_444[3];

    tmp_444[0] <== tmp_443[0] + challenges[2][0];
    tmp_444[1] <== tmp_443[1] + challenges[2][1];
    tmp_444[2] <== tmp_443[2] + challenges[2][2];
    signal tmp_445[3];

    component cmul_92 = CMul();
    cmul_92.ina[0] <== tmp_644[0];
    cmul_92.ina[1] <== tmp_644[1];
    cmul_92.ina[2] <== tmp_644[2];
    cmul_92.inb[0] <== tmp_444[0];
    cmul_92.inb[1] <== tmp_444[1];
    cmul_92.inb[2] <== tmp_444[2];
    tmp_445[0] <== cmul_92.out[0];
    tmp_445[1] <== cmul_92.out[1];
    tmp_445[2] <== cmul_92.out[2];
    signal tmp_446[3];

    component cmul_93 = CMul();
    cmul_93.ina[0] <== evals[65][0];
    cmul_93.ina[1] <== evals[65][1];
    cmul_93.ina[2] <== evals[65][2];
    cmul_93.inb[0] <== Z[0];
    cmul_93.inb[1] <== Z[1];
    cmul_93.inb[2] <== Z[2];
    tmp_446[0] <== cmul_93.out[0];
    tmp_446[1] <== cmul_93.out[1];
    tmp_446[2] <== cmul_93.out[2];
    signal tmp_647[3];

    tmp_647[0] <== tmp_445[0] - tmp_446[0];
    tmp_647[1] <== tmp_445[1] - tmp_446[1];
    tmp_647[2] <== tmp_445[2] - tmp_446[2];
    signal tmp_447[3];

    component cmul_94 = CMul();
    cmul_94.ina[0] <== challenges[3][0];
    cmul_94.ina[1] <== challenges[3][1];
    cmul_94.ina[2] <== challenges[3][2];
    cmul_94.inb[0] <== challenges[7][0];
    cmul_94.inb[1] <== challenges[7][1];
    cmul_94.inb[2] <== challenges[7][2];
    tmp_447[0] <== cmul_94.out[0];
    tmp_447[1] <== cmul_94.out[1];
    tmp_447[2] <== cmul_94.out[2];
    signal tmp_448[3];

    tmp_448[0] <== tmp_612[0] + tmp_447[0];
    tmp_448[1] <== tmp_612[1] + tmp_447[1];
    tmp_448[2] <== tmp_612[2] + tmp_447[2];
    signal tmp_648[3];

    tmp_648[0] <== tmp_448[0] + challenges[2][0];
    tmp_648[1] <== tmp_448[1] + challenges[2][1];
    tmp_648[2] <== tmp_448[2] + challenges[2][2];
    signal tmp_449[3];

    tmp_449[0] <== challenges[3][0] * 12275445934081160404;
    tmp_449[1] <== challenges[3][1] * 12275445934081160404;
    tmp_449[2] <== challenges[3][2] * 12275445934081160404;
    signal tmp_450[3];

    component cmul_95 = CMul();
    cmul_95.ina[0] <== tmp_449[0];
    cmul_95.ina[1] <== tmp_449[1];
    cmul_95.ina[2] <== tmp_449[2];
    cmul_95.inb[0] <== challenges[7][0];
    cmul_95.inb[1] <== challenges[7][1];
    cmul_95.inb[2] <== challenges[7][2];
    tmp_450[0] <== cmul_95.out[0];
    tmp_450[1] <== cmul_95.out[1];
    tmp_450[2] <== cmul_95.out[2];
    signal tmp_451[3];

    tmp_451[0] <== tmp_615[0] + tmp_450[0];
    tmp_451[1] <== tmp_615[1] + tmp_450[1];
    tmp_451[2] <== tmp_615[2] + tmp_450[2];
    signal tmp_452[3];

    tmp_452[0] <== tmp_451[0] + challenges[2][0];
    tmp_452[1] <== tmp_451[1] + challenges[2][1];
    tmp_452[2] <== tmp_451[2] + challenges[2][2];
    signal tmp_453[3];

    component cmul_96 = CMul();
    cmul_96.ina[0] <== tmp_648[0];
    cmul_96.ina[1] <== tmp_648[1];
    cmul_96.ina[2] <== tmp_648[2];
    cmul_96.inb[0] <== tmp_452[0];
    cmul_96.inb[1] <== tmp_452[1];
    cmul_96.inb[2] <== tmp_452[2];
    tmp_453[0] <== cmul_96.out[0];
    tmp_453[1] <== cmul_96.out[1];
    tmp_453[2] <== cmul_96.out[2];
    signal tmp_454[3];

    component cmul_97 = CMul();
    cmul_97.ina[0] <== evals[66][0];
    cmul_97.ina[1] <== evals[66][1];
    cmul_97.ina[2] <== evals[66][2];
    cmul_97.inb[0] <== Z[0];
    cmul_97.inb[1] <== Z[1];
    cmul_97.inb[2] <== Z[2];
    tmp_454[0] <== cmul_97.out[0];
    tmp_454[1] <== cmul_97.out[1];
    tmp_454[2] <== cmul_97.out[2];
    signal tmp_649[3];

    tmp_649[0] <== tmp_453[0] - tmp_454[0];
    tmp_649[1] <== tmp_453[1] - tmp_454[1];
    tmp_649[2] <== tmp_453[2] - tmp_454[2];
    signal tmp_455[3];

    tmp_455[0] <== challenges[3][0] * 4756475762779100925;
    tmp_455[1] <== challenges[3][1] * 4756475762779100925;
    tmp_455[2] <== challenges[3][2] * 4756475762779100925;
    signal tmp_456[3];

    component cmul_98 = CMul();
    cmul_98.ina[0] <== tmp_455[0];
    cmul_98.ina[1] <== tmp_455[1];
    cmul_98.ina[2] <== tmp_455[2];
    cmul_98.inb[0] <== challenges[7][0];
    cmul_98.inb[1] <== challenges[7][1];
    cmul_98.inb[2] <== challenges[7][2];
    tmp_456[0] <== cmul_98.out[0];
    tmp_456[1] <== cmul_98.out[1];
    tmp_456[2] <== cmul_98.out[2];
    signal tmp_457[3];

    tmp_457[0] <== tmp_618[0] + tmp_456[0];
    tmp_457[1] <== tmp_618[1] + tmp_456[1];
    tmp_457[2] <== tmp_618[2] + tmp_456[2];
    signal tmp_458[3];

    tmp_458[0] <== tmp_457[0] + challenges[2][0];
    tmp_458[1] <== tmp_457[1] + challenges[2][1];
    tmp_458[2] <== tmp_457[2] + challenges[2][2];
    signal tmp_459[3];

    component cmul_99 = CMul();
    cmul_99.ina[0] <== tmp_649[0];
    cmul_99.ina[1] <== tmp_649[1];
    cmul_99.ina[2] <== tmp_649[2];
    cmul_99.inb[0] <== tmp_458[0];
    cmul_99.inb[1] <== tmp_458[1];
    cmul_99.inb[2] <== tmp_458[2];
    tmp_459[0] <== cmul_99.out[0];
    tmp_459[1] <== cmul_99.out[1];
    tmp_459[2] <== cmul_99.out[2];
    signal tmp_460[3];

    component cmul_100 = CMul();
    cmul_100.ina[0] <== evals[67][0];
    cmul_100.ina[1] <== evals[67][1];
    cmul_100.ina[2] <== evals[67][2];
    cmul_100.inb[0] <== Z[0];
    cmul_100.inb[1] <== Z[1];
    cmul_100.inb[2] <== Z[2];
    tmp_460[0] <== cmul_100.out[0];
    tmp_460[1] <== cmul_100.out[1];
    tmp_460[2] <== cmul_100.out[2];
    signal tmp_650[3];

    tmp_650[0] <== tmp_459[0] - tmp_460[0];
    tmp_650[1] <== tmp_459[1] - tmp_460[1];
    tmp_650[2] <== tmp_459[2] - tmp_460[2];
    signal tmp_461[3];

    tmp_461[0] <== challenges[3][0] * 1279992132519201448;
    tmp_461[1] <== challenges[3][1] * 1279992132519201448;
    tmp_461[2] <== challenges[3][2] * 1279992132519201448;
    signal tmp_462[3];

    component cmul_101 = CMul();
    cmul_101.ina[0] <== tmp_461[0];
    cmul_101.ina[1] <== tmp_461[1];
    cmul_101.ina[2] <== tmp_461[2];
    cmul_101.inb[0] <== challenges[7][0];
    cmul_101.inb[1] <== challenges[7][1];
    cmul_101.inb[2] <== challenges[7][2];
    tmp_462[0] <== cmul_101.out[0];
    tmp_462[1] <== cmul_101.out[1];
    tmp_462[2] <== cmul_101.out[2];
    signal tmp_463[3];

    tmp_463[0] <== tmp_621[0] + tmp_462[0];
    tmp_463[1] <== tmp_621[1] + tmp_462[1];
    tmp_463[2] <== tmp_621[2] + tmp_462[2];
    signal tmp_464[3];

    tmp_464[0] <== tmp_463[0] + challenges[2][0];
    tmp_464[1] <== tmp_463[1] + challenges[2][1];
    tmp_464[2] <== tmp_463[2] + challenges[2][2];
    signal tmp_465[3];

    component cmul_102 = CMul();
    cmul_102.ina[0] <== tmp_650[0];
    cmul_102.ina[1] <== tmp_650[1];
    cmul_102.ina[2] <== tmp_650[2];
    cmul_102.inb[0] <== tmp_464[0];
    cmul_102.inb[1] <== tmp_464[1];
    cmul_102.inb[2] <== tmp_464[2];
    tmp_465[0] <== cmul_102.out[0];
    tmp_465[1] <== cmul_102.out[1];
    tmp_465[2] <== cmul_102.out[2];
    signal tmp_466[3];

    component cmul_103 = CMul();
    cmul_103.ina[0] <== evals[68][0];
    cmul_103.ina[1] <== evals[68][1];
    cmul_103.ina[2] <== evals[68][2];
    cmul_103.inb[0] <== Z[0];
    cmul_103.inb[1] <== Z[1];
    cmul_103.inb[2] <== Z[2];
    tmp_466[0] <== cmul_103.out[0];
    tmp_466[1] <== cmul_103.out[1];
    tmp_466[2] <== cmul_103.out[2];
    signal tmp_651[3];

    tmp_651[0] <== tmp_465[0] - tmp_466[0];
    tmp_651[1] <== tmp_465[1] - tmp_466[1];
    tmp_651[2] <== tmp_465[2] - tmp_466[2];
    signal tmp_467[3];

    tmp_467[0] <== challenges[3][0] * 8312008622371998338;
    tmp_467[1] <== challenges[3][1] * 8312008622371998338;
    tmp_467[2] <== challenges[3][2] * 8312008622371998338;
    signal tmp_468[3];

    component cmul_104 = CMul();
    cmul_104.ina[0] <== tmp_467[0];
    cmul_104.ina[1] <== tmp_467[1];
    cmul_104.ina[2] <== tmp_467[2];
    cmul_104.inb[0] <== challenges[7][0];
    cmul_104.inb[1] <== challenges[7][1];
    cmul_104.inb[2] <== challenges[7][2];
    tmp_468[0] <== cmul_104.out[0];
    tmp_468[1] <== cmul_104.out[1];
    tmp_468[2] <== cmul_104.out[2];
    signal tmp_469[3];

    tmp_469[0] <== tmp_624[0] + tmp_468[0];
    tmp_469[1] <== tmp_624[1] + tmp_468[1];
    tmp_469[2] <== tmp_624[2] + tmp_468[2];
    signal tmp_470[3];

    tmp_470[0] <== tmp_469[0] + challenges[2][0];
    tmp_470[1] <== tmp_469[1] + challenges[2][1];
    tmp_470[2] <== tmp_469[2] + challenges[2][2];
    signal tmp_471[3];

    component cmul_105 = CMul();
    cmul_105.ina[0] <== tmp_651[0];
    cmul_105.ina[1] <== tmp_651[1];
    cmul_105.ina[2] <== tmp_651[2];
    cmul_105.inb[0] <== tmp_470[0];
    cmul_105.inb[1] <== tmp_470[1];
    cmul_105.inb[2] <== tmp_470[2];
    tmp_471[0] <== cmul_105.out[0];
    tmp_471[1] <== cmul_105.out[1];
    tmp_471[2] <== cmul_105.out[2];
    signal tmp_472[3];

    component cmul_106 = CMul();
    cmul_106.ina[0] <== evals[69][0];
    cmul_106.ina[1] <== evals[69][1];
    cmul_106.ina[2] <== evals[69][2];
    cmul_106.inb[0] <== Z[0];
    cmul_106.inb[1] <== Z[1];
    cmul_106.inb[2] <== Z[2];
    tmp_472[0] <== cmul_106.out[0];
    tmp_472[1] <== cmul_106.out[1];
    tmp_472[2] <== cmul_106.out[2];
    signal tmp_652[3];

    tmp_652[0] <== tmp_471[0] - tmp_472[0];
    tmp_652[1] <== tmp_471[1] - tmp_472[1];
    tmp_652[2] <== tmp_471[2] - tmp_472[2];
    signal tmp_473[3];

    tmp_473[0] <== challenges[3][0] * 7781028390488215464;
    tmp_473[1] <== challenges[3][1] * 7781028390488215464;
    tmp_473[2] <== challenges[3][2] * 7781028390488215464;
    signal tmp_474[3];

    component cmul_107 = CMul();
    cmul_107.ina[0] <== tmp_473[0];
    cmul_107.ina[1] <== tmp_473[1];
    cmul_107.ina[2] <== tmp_473[2];
    cmul_107.inb[0] <== challenges[7][0];
    cmul_107.inb[1] <== challenges[7][1];
    cmul_107.inb[2] <== challenges[7][2];
    tmp_474[0] <== cmul_107.out[0];
    tmp_474[1] <== cmul_107.out[1];
    tmp_474[2] <== cmul_107.out[2];
    signal tmp_475[3];

    tmp_475[0] <== tmp_627[0] + tmp_474[0];
    tmp_475[1] <== tmp_627[1] + tmp_474[1];
    tmp_475[2] <== tmp_627[2] + tmp_474[2];
    signal tmp_476[3];

    tmp_476[0] <== tmp_475[0] + challenges[2][0];
    tmp_476[1] <== tmp_475[1] + challenges[2][1];
    tmp_476[2] <== tmp_475[2] + challenges[2][2];
    signal tmp_477[3];

    component cmul_108 = CMul();
    cmul_108.ina[0] <== tmp_652[0];
    cmul_108.ina[1] <== tmp_652[1];
    cmul_108.ina[2] <== tmp_652[2];
    cmul_108.inb[0] <== tmp_476[0];
    cmul_108.inb[1] <== tmp_476[1];
    cmul_108.inb[2] <== tmp_476[2];
    tmp_477[0] <== cmul_108.out[0];
    tmp_477[1] <== cmul_108.out[1];
    tmp_477[2] <== cmul_108.out[2];
    signal tmp_478[3];

    component cmul_109 = CMul();
    cmul_109.ina[0] <== evals[70][0];
    cmul_109.ina[1] <== evals[70][1];
    cmul_109.ina[2] <== evals[70][2];
    cmul_109.inb[0] <== Z[0];
    cmul_109.inb[1] <== Z[1];
    cmul_109.inb[2] <== Z[2];
    tmp_478[0] <== cmul_109.out[0];
    tmp_478[1] <== cmul_109.out[1];
    tmp_478[2] <== cmul_109.out[2];
    signal tmp_653[3];

    tmp_653[0] <== tmp_477[0] - tmp_478[0];
    tmp_653[1] <== tmp_477[1] - tmp_478[1];
    tmp_653[2] <== tmp_477[2] - tmp_478[2];
    signal tmp_479[3];

    tmp_479[0] <== challenges[3][0] * 11302600489504509467;
    tmp_479[1] <== challenges[3][1] * 11302600489504509467;
    tmp_479[2] <== challenges[3][2] * 11302600489504509467;
    signal tmp_480[3];

    component cmul_110 = CMul();
    cmul_110.ina[0] <== tmp_479[0];
    cmul_110.ina[1] <== tmp_479[1];
    cmul_110.ina[2] <== tmp_479[2];
    cmul_110.inb[0] <== challenges[7][0];
    cmul_110.inb[1] <== challenges[7][1];
    cmul_110.inb[2] <== challenges[7][2];
    tmp_480[0] <== cmul_110.out[0];
    tmp_480[1] <== cmul_110.out[1];
    tmp_480[2] <== cmul_110.out[2];
    signal tmp_481[3];

    tmp_481[0] <== tmp_630[0] + tmp_480[0];
    tmp_481[1] <== tmp_630[1] + tmp_480[1];
    tmp_481[2] <== tmp_630[2] + tmp_480[2];
    signal tmp_482[3];

    tmp_482[0] <== tmp_481[0] + challenges[2][0];
    tmp_482[1] <== tmp_481[1] + challenges[2][1];
    tmp_482[2] <== tmp_481[2] + challenges[2][2];
    signal tmp_483[3];

    component cmul_111 = CMul();
    cmul_111.ina[0] <== tmp_653[0];
    cmul_111.ina[1] <== tmp_653[1];
    cmul_111.ina[2] <== tmp_653[2];
    cmul_111.inb[0] <== tmp_482[0];
    cmul_111.inb[1] <== tmp_482[1];
    cmul_111.inb[2] <== tmp_482[2];
    tmp_483[0] <== cmul_111.out[0];
    tmp_483[1] <== cmul_111.out[1];
    tmp_483[2] <== cmul_111.out[2];
    signal tmp_484[3];

    component cmul_112 = CMul();
    cmul_112.ina[0] <== evals[71][0];
    cmul_112.ina[1] <== evals[71][1];
    cmul_112.ina[2] <== evals[71][2];
    cmul_112.inb[0] <== Z[0];
    cmul_112.inb[1] <== Z[1];
    cmul_112.inb[2] <== Z[2];
    tmp_484[0] <== cmul_112.out[0];
    tmp_484[1] <== cmul_112.out[1];
    tmp_484[2] <== cmul_112.out[2];
    signal tmp_654[3];

    tmp_654[0] <== tmp_483[0] - tmp_484[0];
    tmp_654[1] <== tmp_483[1] - tmp_484[1];
    tmp_654[2] <== tmp_483[2] - tmp_484[2];
    signal tmp_485[3];

    tmp_485[0] <== challenges[3][0] * 4549350404001778198;
    tmp_485[1] <== challenges[3][1] * 4549350404001778198;
    tmp_485[2] <== challenges[3][2] * 4549350404001778198;
    signal tmp_486[3];

    component cmul_113 = CMul();
    cmul_113.ina[0] <== tmp_485[0];
    cmul_113.ina[1] <== tmp_485[1];
    cmul_113.ina[2] <== tmp_485[2];
    cmul_113.inb[0] <== challenges[7][0];
    cmul_113.inb[1] <== challenges[7][1];
    cmul_113.inb[2] <== challenges[7][2];
    tmp_486[0] <== cmul_113.out[0];
    tmp_486[1] <== cmul_113.out[1];
    tmp_486[2] <== cmul_113.out[2];
    signal tmp_487[3];

    tmp_487[0] <== tmp_633[0] + tmp_486[0];
    tmp_487[1] <== tmp_633[1] + tmp_486[1];
    tmp_487[2] <== tmp_633[2] + tmp_486[2];
    signal tmp_488[3];

    tmp_488[0] <== tmp_487[0] + challenges[2][0];
    tmp_488[1] <== tmp_487[1] + challenges[2][1];
    tmp_488[2] <== tmp_487[2] + challenges[2][2];
    signal tmp_489[3];

    component cmul_114 = CMul();
    cmul_114.ina[0] <== tmp_654[0];
    cmul_114.ina[1] <== tmp_654[1];
    cmul_114.ina[2] <== tmp_654[2];
    cmul_114.inb[0] <== tmp_488[0];
    cmul_114.inb[1] <== tmp_488[1];
    cmul_114.inb[2] <== tmp_488[2];
    tmp_489[0] <== cmul_114.out[0];
    tmp_489[1] <== cmul_114.out[1];
    tmp_489[2] <== cmul_114.out[2];
    signal tmp_490[3];

    component cmul_115 = CMul();
    cmul_115.ina[0] <== evals[72][0];
    cmul_115.ina[1] <== evals[72][1];
    cmul_115.ina[2] <== evals[72][2];
    cmul_115.inb[0] <== Z[0];
    cmul_115.inb[1] <== Z[1];
    cmul_115.inb[2] <== Z[2];
    tmp_490[0] <== cmul_115.out[0];
    tmp_490[1] <== cmul_115.out[1];
    tmp_490[2] <== cmul_115.out[2];
    signal tmp_655[3];

    tmp_655[0] <== tmp_489[0] - tmp_490[0];
    tmp_655[1] <== tmp_489[1] - tmp_490[1];
    tmp_655[2] <== tmp_489[2] - tmp_490[2];
    signal tmp_491[3];

    tmp_491[0] <== challenges[3][0] * 3688660304411827445;
    tmp_491[1] <== challenges[3][1] * 3688660304411827445;
    tmp_491[2] <== challenges[3][2] * 3688660304411827445;
    signal tmp_492[3];

    component cmul_116 = CMul();
    cmul_116.ina[0] <== tmp_491[0];
    cmul_116.ina[1] <== tmp_491[1];
    cmul_116.ina[2] <== tmp_491[2];
    cmul_116.inb[0] <== challenges[7][0];
    cmul_116.inb[1] <== challenges[7][1];
    cmul_116.inb[2] <== challenges[7][2];
    tmp_492[0] <== cmul_116.out[0];
    tmp_492[1] <== cmul_116.out[1];
    tmp_492[2] <== cmul_116.out[2];
    signal tmp_493[3];

    tmp_493[0] <== tmp_636[0] + tmp_492[0];
    tmp_493[1] <== tmp_636[1] + tmp_492[1];
    tmp_493[2] <== tmp_636[2] + tmp_492[2];
    signal tmp_494[3];

    tmp_494[0] <== tmp_493[0] + challenges[2][0];
    tmp_494[1] <== tmp_493[1] + challenges[2][1];
    tmp_494[2] <== tmp_493[2] + challenges[2][2];
    signal tmp_495[3];

    component cmul_117 = CMul();
    cmul_117.ina[0] <== tmp_655[0];
    cmul_117.ina[1] <== tmp_655[1];
    cmul_117.ina[2] <== tmp_655[2];
    cmul_117.inb[0] <== tmp_494[0];
    cmul_117.inb[1] <== tmp_494[1];
    cmul_117.inb[2] <== tmp_494[2];
    tmp_495[0] <== cmul_117.out[0];
    tmp_495[1] <== cmul_117.out[1];
    tmp_495[2] <== cmul_117.out[2];
    signal tmp_496[3];

    component cmul_118 = CMul();
    cmul_118.ina[0] <== evals[73][0];
    cmul_118.ina[1] <== evals[73][1];
    cmul_118.ina[2] <== evals[73][2];
    cmul_118.inb[0] <== Z[0];
    cmul_118.inb[1] <== Z[1];
    cmul_118.inb[2] <== Z[2];
    tmp_496[0] <== cmul_118.out[0];
    tmp_496[1] <== cmul_118.out[1];
    tmp_496[2] <== cmul_118.out[2];
    signal tmp_656[3];

    tmp_656[0] <== tmp_495[0] - tmp_496[0];
    tmp_656[1] <== tmp_495[1] - tmp_496[1];
    tmp_656[2] <== tmp_495[2] - tmp_496[2];
    signal tmp_497[3];

    tmp_497[0] <== challenges[3][0] * 16725109960945739746;
    tmp_497[1] <== challenges[3][1] * 16725109960945739746;
    tmp_497[2] <== challenges[3][2] * 16725109960945739746;
    signal tmp_498[3];

    component cmul_119 = CMul();
    cmul_119.ina[0] <== tmp_497[0];
    cmul_119.ina[1] <== tmp_497[1];
    cmul_119.ina[2] <== tmp_497[2];
    cmul_119.inb[0] <== challenges[7][0];
    cmul_119.inb[1] <== challenges[7][1];
    cmul_119.inb[2] <== challenges[7][2];
    tmp_498[0] <== cmul_119.out[0];
    tmp_498[1] <== cmul_119.out[1];
    tmp_498[2] <== cmul_119.out[2];
    signal tmp_499[3];

    tmp_499[0] <== tmp_639[0] + tmp_498[0];
    tmp_499[1] <== tmp_639[1] + tmp_498[1];
    tmp_499[2] <== tmp_639[2] + tmp_498[2];
    signal tmp_500[3];

    tmp_500[0] <== tmp_499[0] + challenges[2][0];
    tmp_500[1] <== tmp_499[1] + challenges[2][1];
    tmp_500[2] <== tmp_499[2] + challenges[2][2];
    signal tmp_501[3];

    component cmul_120 = CMul();
    cmul_120.ina[0] <== tmp_656[0];
    cmul_120.ina[1] <== tmp_656[1];
    cmul_120.ina[2] <== tmp_656[2];
    cmul_120.inb[0] <== tmp_500[0];
    cmul_120.inb[1] <== tmp_500[1];
    cmul_120.inb[2] <== tmp_500[2];
    tmp_501[0] <== cmul_120.out[0];
    tmp_501[1] <== cmul_120.out[1];
    tmp_501[2] <== cmul_120.out[2];
    signal tmp_502[3];

    component cmul_121 = CMul();
    cmul_121.ina[0] <== evals[74][0];
    cmul_121.ina[1] <== evals[74][1];
    cmul_121.ina[2] <== evals[74][2];
    cmul_121.inb[0] <== Z[0];
    cmul_121.inb[1] <== Z[1];
    cmul_121.inb[2] <== Z[2];
    tmp_502[0] <== cmul_121.out[0];
    tmp_502[1] <== cmul_121.out[1];
    tmp_502[2] <== cmul_121.out[2];
    signal tmp_657[3];

    tmp_657[0] <== tmp_501[0] - tmp_502[0];
    tmp_657[1] <== tmp_501[1] - tmp_502[1];
    tmp_657[2] <== tmp_501[2] - tmp_502[2];
    signal tmp_503[3];

    tmp_503[0] <== challenges[3][0] * 16538725463549498621;
    tmp_503[1] <== challenges[3][1] * 16538725463549498621;
    tmp_503[2] <== challenges[3][2] * 16538725463549498621;
    signal tmp_504[3];

    component cmul_122 = CMul();
    cmul_122.ina[0] <== tmp_503[0];
    cmul_122.ina[1] <== tmp_503[1];
    cmul_122.ina[2] <== tmp_503[2];
    cmul_122.inb[0] <== challenges[7][0];
    cmul_122.inb[1] <== challenges[7][1];
    cmul_122.inb[2] <== challenges[7][2];
    tmp_504[0] <== cmul_122.out[0];
    tmp_504[1] <== cmul_122.out[1];
    tmp_504[2] <== cmul_122.out[2];
    signal tmp_505[3];

    tmp_505[0] <== tmp_642[0] + tmp_504[0];
    tmp_505[1] <== tmp_642[1] + tmp_504[1];
    tmp_505[2] <== tmp_642[2] + tmp_504[2];
    signal tmp_506[3];

    tmp_506[0] <== tmp_505[0] + challenges[2][0];
    tmp_506[1] <== tmp_505[1] + challenges[2][1];
    tmp_506[2] <== tmp_505[2] + challenges[2][2];
    signal tmp_507[3];

    component cmul_123 = CMul();
    cmul_123.ina[0] <== tmp_657[0];
    cmul_123.ina[1] <== tmp_657[1];
    cmul_123.ina[2] <== tmp_657[2];
    cmul_123.inb[0] <== tmp_506[0];
    cmul_123.inb[1] <== tmp_506[1];
    cmul_123.inb[2] <== tmp_506[2];
    tmp_507[0] <== cmul_123.out[0];
    tmp_507[1] <== cmul_123.out[1];
    tmp_507[2] <== cmul_123.out[2];
    signal tmp_508[3];

    component cmul_124 = CMul();
    cmul_124.ina[0] <== evals[75][0];
    cmul_124.ina[1] <== evals[75][1];
    cmul_124.ina[2] <== evals[75][2];
    cmul_124.inb[0] <== Z[0];
    cmul_124.inb[1] <== Z[1];
    cmul_124.inb[2] <== Z[2];
    tmp_508[0] <== cmul_124.out[0];
    tmp_508[1] <== cmul_124.out[1];
    tmp_508[2] <== cmul_124.out[2];
    signal tmp_658[3];

    tmp_658[0] <== tmp_507[0] - tmp_508[0];
    tmp_658[1] <== tmp_507[1] - tmp_508[1];
    tmp_658[2] <== tmp_507[2] - tmp_508[2];
    signal tmp_509[3];

    tmp_509[0] <== challenges[3][0] * 12756200801261202346;
    tmp_509[1] <== challenges[3][1] * 12756200801261202346;
    tmp_509[2] <== challenges[3][2] * 12756200801261202346;
    signal tmp_510[3];

    component cmul_125 = CMul();
    cmul_125.ina[0] <== tmp_509[0];
    cmul_125.ina[1] <== tmp_509[1];
    cmul_125.ina[2] <== tmp_509[2];
    cmul_125.inb[0] <== challenges[7][0];
    cmul_125.inb[1] <== challenges[7][1];
    cmul_125.inb[2] <== challenges[7][2];
    tmp_510[0] <== cmul_125.out[0];
    tmp_510[1] <== cmul_125.out[1];
    tmp_510[2] <== cmul_125.out[2];
    signal tmp_511[3];

    tmp_511[0] <== tmp_645[0] + tmp_510[0];
    tmp_511[1] <== tmp_645[1] + tmp_510[1];
    tmp_511[2] <== tmp_645[2] + tmp_510[2];
    signal tmp_512[3];

    tmp_512[0] <== tmp_511[0] + challenges[2][0];
    tmp_512[1] <== tmp_511[1] + challenges[2][1];
    tmp_512[2] <== tmp_511[2] + challenges[2][2];
    signal tmp_513[3];

    component cmul_126 = CMul();
    cmul_126.ina[0] <== tmp_658[0];
    cmul_126.ina[1] <== tmp_658[1];
    cmul_126.ina[2] <== tmp_658[2];
    cmul_126.inb[0] <== tmp_512[0];
    cmul_126.inb[1] <== tmp_512[1];
    cmul_126.inb[2] <== tmp_512[2];
    tmp_513[0] <== cmul_126.out[0];
    tmp_513[1] <== cmul_126.out[1];
    tmp_513[2] <== cmul_126.out[2];
    signal tmp_514[3];

    component cmul_127 = CMul();
    cmul_127.ina[0] <== evals[76][0];
    cmul_127.ina[1] <== evals[76][1];
    cmul_127.ina[2] <== evals[76][2];
    cmul_127.inb[0] <== Z[0];
    cmul_127.inb[1] <== Z[1];
    cmul_127.inb[2] <== Z[2];
    tmp_514[0] <== cmul_127.out[0];
    tmp_514[1] <== cmul_127.out[1];
    tmp_514[2] <== cmul_127.out[2];
    signal tmp_659[3];

    tmp_659[0] <== tmp_513[0] - tmp_514[0];
    tmp_659[1] <== tmp_513[1] - tmp_514[1];
    tmp_659[2] <== tmp_513[2] - tmp_514[2];
    signal tmp_515[3];

    component cmul_128 = CMul();
    cmul_128.ina[0] <== evals[77][0];
    cmul_128.ina[1] <== evals[77][1];
    cmul_128.ina[2] <== evals[77][2];
    cmul_128.inb[0] <== tmp_647[0];
    cmul_128.inb[1] <== tmp_647[1];
    cmul_128.inb[2] <== tmp_647[2];
    tmp_515[0] <== cmul_128.out[0];
    tmp_515[1] <== cmul_128.out[1];
    tmp_515[2] <== cmul_128.out[2];
    signal tmp_516[3];

    component cmul_129 = CMul();
    cmul_129.ina[0] <== evals[42][0];
    cmul_129.ina[1] <== evals[42][1];
    cmul_129.ina[2] <== evals[42][2];
    cmul_129.inb[0] <== tmp_659[0];
    cmul_129.inb[1] <== tmp_659[1];
    cmul_129.inb[2] <== tmp_659[2];
    tmp_516[0] <== cmul_129.out[0];
    tmp_516[1] <== cmul_129.out[1];
    tmp_516[2] <== cmul_129.out[2];
    signal tmp_660[3];

    tmp_660[0] <== tmp_515[0] - tmp_516[0];
    tmp_660[1] <== tmp_515[1] - tmp_516[1];
    tmp_660[2] <== tmp_515[2] - tmp_516[2];
    signal tmp_517[3];

    component cmul_130 = CMul();
    cmul_130.ina[0] <== challenges[4][0];
    cmul_130.ina[1] <== challenges[4][1];
    cmul_130.ina[2] <== challenges[4][2];
    cmul_130.inb[0] <== tmp_574[0];
    cmul_130.inb[1] <== tmp_574[1];
    cmul_130.inb[2] <== tmp_574[2];
    tmp_517[0] <== cmul_130.out[0];
    tmp_517[1] <== cmul_130.out[1];
    tmp_517[2] <== cmul_130.out[2];
    signal tmp_518[3];

    tmp_518[0] <== tmp_517[0] + tmp_575[0];
    tmp_518[1] <== tmp_517[1] + tmp_575[1];
    tmp_518[2] <== tmp_517[2] + tmp_575[2];
    signal tmp_519[3];

    component cmul_131 = CMul();
    cmul_131.ina[0] <== challenges[4][0];
    cmul_131.ina[1] <== challenges[4][1];
    cmul_131.ina[2] <== challenges[4][2];
    cmul_131.inb[0] <== tmp_518[0];
    cmul_131.inb[1] <== tmp_518[1];
    cmul_131.inb[2] <== tmp_518[2];
    tmp_519[0] <== cmul_131.out[0];
    tmp_519[1] <== cmul_131.out[1];
    tmp_519[2] <== cmul_131.out[2];
    signal tmp_520[3];

    tmp_520[0] <== tmp_519[0] + tmp_576[0];
    tmp_520[1] <== tmp_519[1] + tmp_576[1];
    tmp_520[2] <== tmp_519[2] + tmp_576[2];
    signal tmp_521[3];

    component cmul_132 = CMul();
    cmul_132.ina[0] <== challenges[4][0];
    cmul_132.ina[1] <== challenges[4][1];
    cmul_132.ina[2] <== challenges[4][2];
    cmul_132.inb[0] <== tmp_520[0];
    cmul_132.inb[1] <== tmp_520[1];
    cmul_132.inb[2] <== tmp_520[2];
    tmp_521[0] <== cmul_132.out[0];
    tmp_521[1] <== cmul_132.out[1];
    tmp_521[2] <== cmul_132.out[2];
    signal tmp_522[3];

    tmp_522[0] <== tmp_521[0] + tmp_577[0];
    tmp_522[1] <== tmp_521[1] + tmp_577[1];
    tmp_522[2] <== tmp_521[2] + tmp_577[2];
    signal tmp_523[3];

    component cmul_133 = CMul();
    cmul_133.ina[0] <== challenges[4][0];
    cmul_133.ina[1] <== challenges[4][1];
    cmul_133.ina[2] <== challenges[4][2];
    cmul_133.inb[0] <== tmp_522[0];
    cmul_133.inb[1] <== tmp_522[1];
    cmul_133.inb[2] <== tmp_522[2];
    tmp_523[0] <== cmul_133.out[0];
    tmp_523[1] <== cmul_133.out[1];
    tmp_523[2] <== cmul_133.out[2];
    signal tmp_524[3];

    tmp_524[0] <== tmp_523[0] + tmp_578[0];
    tmp_524[1] <== tmp_523[1] + tmp_578[1];
    tmp_524[2] <== tmp_523[2] + tmp_578[2];
    signal tmp_525[3];

    component cmul_134 = CMul();
    cmul_134.ina[0] <== challenges[4][0];
    cmul_134.ina[1] <== challenges[4][1];
    cmul_134.ina[2] <== challenges[4][2];
    cmul_134.inb[0] <== tmp_524[0];
    cmul_134.inb[1] <== tmp_524[1];
    cmul_134.inb[2] <== tmp_524[2];
    tmp_525[0] <== cmul_134.out[0];
    tmp_525[1] <== cmul_134.out[1];
    tmp_525[2] <== cmul_134.out[2];
    signal tmp_526[3];

    tmp_526[0] <== tmp_525[0] + tmp_579[0];
    tmp_526[1] <== tmp_525[1] + tmp_579[1];
    tmp_526[2] <== tmp_525[2] + tmp_579[2];
    signal tmp_527[3];

    component cmul_135 = CMul();
    cmul_135.ina[0] <== challenges[4][0];
    cmul_135.ina[1] <== challenges[4][1];
    cmul_135.ina[2] <== challenges[4][2];
    cmul_135.inb[0] <== tmp_526[0];
    cmul_135.inb[1] <== tmp_526[1];
    cmul_135.inb[2] <== tmp_526[2];
    tmp_527[0] <== cmul_135.out[0];
    tmp_527[1] <== cmul_135.out[1];
    tmp_527[2] <== cmul_135.out[2];
    signal tmp_528[3];

    tmp_528[0] <== tmp_527[0] + tmp_580[0];
    tmp_528[1] <== tmp_527[1] + tmp_580[1];
    tmp_528[2] <== tmp_527[2] + tmp_580[2];
    signal tmp_529[3];

    component cmul_136 = CMul();
    cmul_136.ina[0] <== challenges[4][0];
    cmul_136.ina[1] <== challenges[4][1];
    cmul_136.ina[2] <== challenges[4][2];
    cmul_136.inb[0] <== tmp_528[0];
    cmul_136.inb[1] <== tmp_528[1];
    cmul_136.inb[2] <== tmp_528[2];
    tmp_529[0] <== cmul_136.out[0];
    tmp_529[1] <== cmul_136.out[1];
    tmp_529[2] <== cmul_136.out[2];
    signal tmp_530[3];

    tmp_530[0] <== tmp_529[0] + tmp_581[0];
    tmp_530[1] <== tmp_529[1] + tmp_581[1];
    tmp_530[2] <== tmp_529[2] + tmp_581[2];
    signal tmp_531[3];

    component cmul_137 = CMul();
    cmul_137.ina[0] <== challenges[4][0];
    cmul_137.ina[1] <== challenges[4][1];
    cmul_137.ina[2] <== challenges[4][2];
    cmul_137.inb[0] <== tmp_530[0];
    cmul_137.inb[1] <== tmp_530[1];
    cmul_137.inb[2] <== tmp_530[2];
    tmp_531[0] <== cmul_137.out[0];
    tmp_531[1] <== cmul_137.out[1];
    tmp_531[2] <== cmul_137.out[2];
    signal tmp_532[3];

    tmp_532[0] <== tmp_531[0] + tmp_583[0];
    tmp_532[1] <== tmp_531[1] + tmp_583[1];
    tmp_532[2] <== tmp_531[2] + tmp_583[2];
    signal tmp_533[3];

    component cmul_138 = CMul();
    cmul_138.ina[0] <== challenges[4][0];
    cmul_138.ina[1] <== challenges[4][1];
    cmul_138.ina[2] <== challenges[4][2];
    cmul_138.inb[0] <== tmp_532[0];
    cmul_138.inb[1] <== tmp_532[1];
    cmul_138.inb[2] <== tmp_532[2];
    tmp_533[0] <== cmul_138.out[0];
    tmp_533[1] <== cmul_138.out[1];
    tmp_533[2] <== cmul_138.out[2];
    signal tmp_534[3];

    tmp_534[0] <== tmp_533[0] + tmp_585[0];
    tmp_534[1] <== tmp_533[1] + tmp_585[1];
    tmp_534[2] <== tmp_533[2] + tmp_585[2];
    signal tmp_535[3];

    component cmul_139 = CMul();
    cmul_139.ina[0] <== challenges[4][0];
    cmul_139.ina[1] <== challenges[4][1];
    cmul_139.ina[2] <== challenges[4][2];
    cmul_139.inb[0] <== tmp_534[0];
    cmul_139.inb[1] <== tmp_534[1];
    cmul_139.inb[2] <== tmp_534[2];
    tmp_535[0] <== cmul_139.out[0];
    tmp_535[1] <== cmul_139.out[1];
    tmp_535[2] <== cmul_139.out[2];
    signal tmp_536[3];

    tmp_536[0] <== tmp_535[0] + tmp_587[0];
    tmp_536[1] <== tmp_535[1] + tmp_587[1];
    tmp_536[2] <== tmp_535[2] + tmp_587[2];
    signal tmp_537[3];

    component cmul_140 = CMul();
    cmul_140.ina[0] <== challenges[4][0];
    cmul_140.ina[1] <== challenges[4][1];
    cmul_140.ina[2] <== challenges[4][2];
    cmul_140.inb[0] <== tmp_536[0];
    cmul_140.inb[1] <== tmp_536[1];
    cmul_140.inb[2] <== tmp_536[2];
    tmp_537[0] <== cmul_140.out[0];
    tmp_537[1] <== cmul_140.out[1];
    tmp_537[2] <== cmul_140.out[2];
    signal tmp_538[3];

    tmp_538[0] <== tmp_537[0] + tmp_589[0];
    tmp_538[1] <== tmp_537[1] + tmp_589[1];
    tmp_538[2] <== tmp_537[2] + tmp_589[2];
    signal tmp_539[3];

    component cmul_141 = CMul();
    cmul_141.ina[0] <== challenges[4][0];
    cmul_141.ina[1] <== challenges[4][1];
    cmul_141.ina[2] <== challenges[4][2];
    cmul_141.inb[0] <== tmp_538[0];
    cmul_141.inb[1] <== tmp_538[1];
    cmul_141.inb[2] <== tmp_538[2];
    tmp_539[0] <== cmul_141.out[0];
    tmp_539[1] <== cmul_141.out[1];
    tmp_539[2] <== cmul_141.out[2];
    signal tmp_540[3];

    tmp_540[0] <== tmp_539[0] + tmp_590[0];
    tmp_540[1] <== tmp_539[1] + tmp_590[1];
    tmp_540[2] <== tmp_539[2] + tmp_590[2];
    signal tmp_541[3];

    component cmul_142 = CMul();
    cmul_142.ina[0] <== challenges[4][0];
    cmul_142.ina[1] <== challenges[4][1];
    cmul_142.ina[2] <== challenges[4][2];
    cmul_142.inb[0] <== tmp_540[0];
    cmul_142.inb[1] <== tmp_540[1];
    cmul_142.inb[2] <== tmp_540[2];
    tmp_541[0] <== cmul_142.out[0];
    tmp_541[1] <== cmul_142.out[1];
    tmp_541[2] <== cmul_142.out[2];
    signal tmp_542[3];

    tmp_542[0] <== tmp_541[0] + tmp_591[0];
    tmp_542[1] <== tmp_541[1] + tmp_591[1];
    tmp_542[2] <== tmp_541[2] + tmp_591[2];
    signal tmp_543[3];

    component cmul_143 = CMul();
    cmul_143.ina[0] <== challenges[4][0];
    cmul_143.ina[1] <== challenges[4][1];
    cmul_143.ina[2] <== challenges[4][2];
    cmul_143.inb[0] <== tmp_542[0];
    cmul_143.inb[1] <== tmp_542[1];
    cmul_143.inb[2] <== tmp_542[2];
    tmp_543[0] <== cmul_143.out[0];
    tmp_543[1] <== cmul_143.out[1];
    tmp_543[2] <== cmul_143.out[2];
    signal tmp_544[3];

    tmp_544[0] <== tmp_543[0] + tmp_592[0];
    tmp_544[1] <== tmp_543[1] + tmp_592[1];
    tmp_544[2] <== tmp_543[2] + tmp_592[2];
    signal tmp_545[3];

    component cmul_144 = CMul();
    cmul_144.ina[0] <== challenges[4][0];
    cmul_144.ina[1] <== challenges[4][1];
    cmul_144.ina[2] <== challenges[4][2];
    cmul_144.inb[0] <== tmp_544[0];
    cmul_144.inb[1] <== tmp_544[1];
    cmul_144.inb[2] <== tmp_544[2];
    tmp_545[0] <== cmul_144.out[0];
    tmp_545[1] <== cmul_144.out[1];
    tmp_545[2] <== cmul_144.out[2];
    signal tmp_546[3];

    tmp_546[0] <== tmp_545[0] + tmp_593[0];
    tmp_546[1] <== tmp_545[1] + tmp_593[1];
    tmp_546[2] <== tmp_545[2] + tmp_593[2];
    signal tmp_547[3];

    component cmul_145 = CMul();
    cmul_145.ina[0] <== challenges[4][0];
    cmul_145.ina[1] <== challenges[4][1];
    cmul_145.ina[2] <== challenges[4][2];
    cmul_145.inb[0] <== tmp_546[0];
    cmul_145.inb[1] <== tmp_546[1];
    cmul_145.inb[2] <== tmp_546[2];
    tmp_547[0] <== cmul_145.out[0];
    tmp_547[1] <== cmul_145.out[1];
    tmp_547[2] <== cmul_145.out[2];
    signal tmp_548[3];

    tmp_548[0] <== tmp_547[0] + tmp_594[0];
    tmp_548[1] <== tmp_547[1] + tmp_594[1];
    tmp_548[2] <== tmp_547[2] + tmp_594[2];
    signal tmp_549[3];

    component cmul_146 = CMul();
    cmul_146.ina[0] <== challenges[4][0];
    cmul_146.ina[1] <== challenges[4][1];
    cmul_146.ina[2] <== challenges[4][2];
    cmul_146.inb[0] <== tmp_548[0];
    cmul_146.inb[1] <== tmp_548[1];
    cmul_146.inb[2] <== tmp_548[2];
    tmp_549[0] <== cmul_146.out[0];
    tmp_549[1] <== cmul_146.out[1];
    tmp_549[2] <== cmul_146.out[2];
    signal tmp_550[3];

    tmp_550[0] <== tmp_549[0] + tmp_595[0];
    tmp_550[1] <== tmp_549[1] + tmp_595[1];
    tmp_550[2] <== tmp_549[2] + tmp_595[2];
    signal tmp_551[3];

    component cmul_147 = CMul();
    cmul_147.ina[0] <== challenges[4][0];
    cmul_147.ina[1] <== challenges[4][1];
    cmul_147.ina[2] <== challenges[4][2];
    cmul_147.inb[0] <== tmp_550[0];
    cmul_147.inb[1] <== tmp_550[1];
    cmul_147.inb[2] <== tmp_550[2];
    tmp_551[0] <== cmul_147.out[0];
    tmp_551[1] <== cmul_147.out[1];
    tmp_551[2] <== cmul_147.out[2];
    signal tmp_552[3];

    tmp_552[0] <== tmp_551[0] + tmp_596[0];
    tmp_552[1] <== tmp_551[1] + tmp_596[1];
    tmp_552[2] <== tmp_551[2] + tmp_596[2];
    signal tmp_553[3];

    component cmul_148 = CMul();
    cmul_148.ina[0] <== challenges[4][0];
    cmul_148.ina[1] <== challenges[4][1];
    cmul_148.ina[2] <== challenges[4][2];
    cmul_148.inb[0] <== tmp_552[0];
    cmul_148.inb[1] <== tmp_552[1];
    cmul_148.inb[2] <== tmp_552[2];
    tmp_553[0] <== cmul_148.out[0];
    tmp_553[1] <== cmul_148.out[1];
    tmp_553[2] <== cmul_148.out[2];
    signal tmp_554[3];

    tmp_554[0] <== tmp_553[0] + tmp_597[0];
    tmp_554[1] <== tmp_553[1] + tmp_597[1];
    tmp_554[2] <== tmp_553[2] + tmp_597[2];
    signal tmp_555[3];

    component cmul_149 = CMul();
    cmul_149.ina[0] <== challenges[4][0];
    cmul_149.ina[1] <== challenges[4][1];
    cmul_149.ina[2] <== challenges[4][2];
    cmul_149.inb[0] <== tmp_554[0];
    cmul_149.inb[1] <== tmp_554[1];
    cmul_149.inb[2] <== tmp_554[2];
    tmp_555[0] <== cmul_149.out[0];
    tmp_555[1] <== cmul_149.out[1];
    tmp_555[2] <== cmul_149.out[2];
    signal tmp_556[3];

    tmp_556[0] <== tmp_555[0] + tmp_598[0];
    tmp_556[1] <== tmp_555[1] + tmp_598[1];
    tmp_556[2] <== tmp_555[2] + tmp_598[2];
    signal tmp_557[3];

    component cmul_150 = CMul();
    cmul_150.ina[0] <== challenges[4][0];
    cmul_150.ina[1] <== challenges[4][1];
    cmul_150.ina[2] <== challenges[4][2];
    cmul_150.inb[0] <== tmp_556[0];
    cmul_150.inb[1] <== tmp_556[1];
    cmul_150.inb[2] <== tmp_556[2];
    tmp_557[0] <== cmul_150.out[0];
    tmp_557[1] <== cmul_150.out[1];
    tmp_557[2] <== cmul_150.out[2];
    signal tmp_558[3];

    tmp_558[0] <== tmp_557[0] + tmp_599[0];
    tmp_558[1] <== tmp_557[1] + tmp_599[1];
    tmp_558[2] <== tmp_557[2] + tmp_599[2];
    signal tmp_559[3];

    component cmul_151 = CMul();
    cmul_151.ina[0] <== challenges[4][0];
    cmul_151.ina[1] <== challenges[4][1];
    cmul_151.ina[2] <== challenges[4][2];
    cmul_151.inb[0] <== tmp_558[0];
    cmul_151.inb[1] <== tmp_558[1];
    cmul_151.inb[2] <== tmp_558[2];
    tmp_559[0] <== cmul_151.out[0];
    tmp_559[1] <== cmul_151.out[1];
    tmp_559[2] <== cmul_151.out[2];
    signal tmp_560[3];

    tmp_560[0] <== tmp_559[0] + tmp_600[0];
    tmp_560[1] <== tmp_559[1] + tmp_600[1];
    tmp_560[2] <== tmp_559[2] + tmp_600[2];
    signal tmp_561[3];

    component cmul_152 = CMul();
    cmul_152.ina[0] <== challenges[4][0];
    cmul_152.ina[1] <== challenges[4][1];
    cmul_152.ina[2] <== challenges[4][2];
    cmul_152.inb[0] <== tmp_560[0];
    cmul_152.inb[1] <== tmp_560[1];
    cmul_152.inb[2] <== tmp_560[2];
    tmp_561[0] <== cmul_152.out[0];
    tmp_561[1] <== cmul_152.out[1];
    tmp_561[2] <== cmul_152.out[2];
    signal tmp_562[3];

    tmp_562[0] <== tmp_561[0] + tmp_601[0];
    tmp_562[1] <== tmp_561[1] + tmp_601[1];
    tmp_562[2] <== tmp_561[2] + tmp_601[2];
    signal tmp_563[3];

    component cmul_153 = CMul();
    cmul_153.ina[0] <== challenges[4][0];
    cmul_153.ina[1] <== challenges[4][1];
    cmul_153.ina[2] <== challenges[4][2];
    cmul_153.inb[0] <== tmp_562[0];
    cmul_153.inb[1] <== tmp_562[1];
    cmul_153.inb[2] <== tmp_562[2];
    tmp_563[0] <== cmul_153.out[0];
    tmp_563[1] <== cmul_153.out[1];
    tmp_563[2] <== cmul_153.out[2];
    signal tmp_564[3];

    tmp_564[0] <== tmp_563[0] + tmp_606[0];
    tmp_564[1] <== tmp_563[1] + tmp_606[1];
    tmp_564[2] <== tmp_563[2] + tmp_606[2];
    signal tmp_565[3];

    component cmul_154 = CMul();
    cmul_154.ina[0] <== challenges[4][0];
    cmul_154.ina[1] <== challenges[4][1];
    cmul_154.ina[2] <== challenges[4][2];
    cmul_154.inb[0] <== tmp_564[0];
    cmul_154.inb[1] <== tmp_564[1];
    cmul_154.inb[2] <== tmp_564[2];
    tmp_565[0] <== cmul_154.out[0];
    tmp_565[1] <== cmul_154.out[1];
    tmp_565[2] <== cmul_154.out[2];
    signal tmp_566[3];

    tmp_566[0] <== tmp_565[0] + tmp_608[0];
    tmp_566[1] <== tmp_565[1] + tmp_608[1];
    tmp_566[2] <== tmp_565[2] + tmp_608[2];
    signal tmp_567[3];

    component cmul_155 = CMul();
    cmul_155.ina[0] <== challenges[4][0];
    cmul_155.ina[1] <== challenges[4][1];
    cmul_155.ina[2] <== challenges[4][2];
    cmul_155.inb[0] <== tmp_566[0];
    cmul_155.inb[1] <== tmp_566[1];
    cmul_155.inb[2] <== tmp_566[2];
    tmp_567[0] <== cmul_155.out[0];
    tmp_567[1] <== cmul_155.out[1];
    tmp_567[2] <== cmul_155.out[2];
    signal tmp_568[3];

    tmp_568[0] <== tmp_567[0] + tmp_610[0];
    tmp_568[1] <== tmp_567[1] + tmp_610[1];
    tmp_568[2] <== tmp_567[2] + tmp_610[2];
    signal tmp_569[3];

    component cmul_156 = CMul();
    cmul_156.ina[0] <== challenges[4][0];
    cmul_156.ina[1] <== challenges[4][1];
    cmul_156.ina[2] <== challenges[4][2];
    cmul_156.inb[0] <== tmp_568[0];
    cmul_156.inb[1] <== tmp_568[1];
    cmul_156.inb[2] <== tmp_568[2];
    tmp_569[0] <== cmul_156.out[0];
    tmp_569[1] <== cmul_156.out[1];
    tmp_569[2] <== cmul_156.out[2];
    signal tmp_570[3];

    tmp_570[0] <== tmp_569[0] + tmp_611[0];
    tmp_570[1] <== tmp_569[1] + tmp_611[1];
    tmp_570[2] <== tmp_569[2] + tmp_611[2];
    signal tmp_571[3];

    component cmul_157 = CMul();
    cmul_157.ina[0] <== challenges[4][0];
    cmul_157.ina[1] <== challenges[4][1];
    cmul_157.ina[2] <== challenges[4][2];
    cmul_157.inb[0] <== tmp_570[0];
    cmul_157.inb[1] <== tmp_570[1];
    cmul_157.inb[2] <== tmp_570[2];
    tmp_571[0] <== cmul_157.out[0];
    tmp_571[1] <== cmul_157.out[1];
    tmp_571[2] <== cmul_157.out[2];
    signal tmp_572[3];

    tmp_572[0] <== tmp_571[0] + tmp_660[0];
    tmp_572[1] <== tmp_571[1] + tmp_660[1];
    tmp_572[2] <== tmp_571[2] + tmp_660[2];
    signal tmp_573[3];

    component cmul_158 = CMul();
    cmul_158.ina[0] <== evals[78][0];
    cmul_158.ina[1] <== evals[78][1];
    cmul_158.ina[2] <== evals[78][2];
    cmul_158.inb[0] <== Z[0];
    cmul_158.inb[1] <== Z[1];
    cmul_158.inb[2] <== Z[2];
    tmp_573[0] <== cmul_158.out[0];
    tmp_573[1] <== cmul_158.out[1];
    tmp_573[2] <== cmul_158.out[2];
    signal tmp_661[3];

    tmp_661[0] <== tmp_572[0] - tmp_573[0];
    tmp_661[1] <== tmp_572[1] - tmp_573[1];
    tmp_661[2] <== tmp_572[2] - tmp_573[2];

// Final Verification
    enable * tmp_661[0] === 0;
    enable * tmp_661[1] === 0;
    enable * tmp_661[2] === 0;

}

template VerifyQuery() {
    signal input ys[26];
    signal input challenges[8][3];
    signal input evals[79][3];
    signal input tree1[12];


    signal input tree3[3];

    signal input tree4[79];
    signal input consts[20];
    signal output out[3];

///////////
// Mapping
///////////
    component mapValues = MapValues();

    for (var i=0; i< 12; i++ ) {
        mapValues.vals1[i] <== tree1[i];
    }
    for (var i=0; i< 3; i++ ) {
        mapValues.vals3[i] <== tree3[i];
    }
    for (var i=0; i< 79; i++ ) {
        mapValues.vals4[i] <== tree4[i];
    }

    signal xacc[26];
    xacc[0] <== ys[0]*(49 * roots(26)-49) + 49;
    for (var i=1; i<26; i++ ) {
        xacc[i] <== xacc[i-1] * ( ys[i]*(roots(26 - i) - 1) +1);
    }

    component den1inv = CInv();
    den1inv.in[0] <== xacc[25] - challenges[7][0];
    den1inv.in[1] <== -challenges[7][1];
    den1inv.in[2] <== -challenges[7][2];
    signal xDivXSubXi[3];
    xDivXSubXi[0] <== xacc[25] * den1inv.out[0];
    xDivXSubXi[1] <== xacc[25] * den1inv.out[1];
    xDivXSubXi[2] <== xacc[25] * den1inv.out[2];

    component den2inv = CInv();
    den2inv.in[0] <== xacc[25] - roots(24)*challenges[7][0];
    den2inv.in[1] <== -roots(24)*challenges[7][1];
    den2inv.in[2] <== -roots(24)*challenges[7][2];
    signal xDivXSubWXi[3];
    xDivXSubWXi[0] <== xacc[25] * den2inv.out[0];
    xDivXSubWXi[1] <== xacc[25] * den2inv.out[1];
    xDivXSubWXi[2] <== xacc[25] * den2inv.out[2];

        signal tmp_0[3];

    tmp_0[0] <== challenges[5][0] * mapValues.tree1_0;
    tmp_0[1] <== challenges[5][1] * mapValues.tree1_0;
    tmp_0[2] <== challenges[5][2] * mapValues.tree1_0;
    signal tmp_1[3];

    tmp_1[0] <== tmp_0[0] + mapValues.tree1_1;
    tmp_1[1] <== tmp_0[1];
    tmp_1[2] <== tmp_0[2];
    signal tmp_2[3];

    component cmul_0 = CMul();
    cmul_0.ina[0] <== challenges[5][0];
    cmul_0.ina[1] <== challenges[5][1];
    cmul_0.ina[2] <== challenges[5][2];
    cmul_0.inb[0] <== tmp_1[0];
    cmul_0.inb[1] <== tmp_1[1];
    cmul_0.inb[2] <== tmp_1[2];
    tmp_2[0] <== cmul_0.out[0];
    tmp_2[1] <== cmul_0.out[1];
    tmp_2[2] <== cmul_0.out[2];
    signal tmp_3[3];

    tmp_3[0] <== tmp_2[0] + mapValues.tree1_2;
    tmp_3[1] <== tmp_2[1];
    tmp_3[2] <== tmp_2[2];
    signal tmp_4[3];

    component cmul_1 = CMul();
    cmul_1.ina[0] <== challenges[5][0];
    cmul_1.ina[1] <== challenges[5][1];
    cmul_1.ina[2] <== challenges[5][2];
    cmul_1.inb[0] <== tmp_3[0];
    cmul_1.inb[1] <== tmp_3[1];
    cmul_1.inb[2] <== tmp_3[2];
    tmp_4[0] <== cmul_1.out[0];
    tmp_4[1] <== cmul_1.out[1];
    tmp_4[2] <== cmul_1.out[2];
    signal tmp_5[3];

    tmp_5[0] <== tmp_4[0] + mapValues.tree1_3;
    tmp_5[1] <== tmp_4[1];
    tmp_5[2] <== tmp_4[2];
    signal tmp_6[3];

    component cmul_2 = CMul();
    cmul_2.ina[0] <== challenges[5][0];
    cmul_2.ina[1] <== challenges[5][1];
    cmul_2.ina[2] <== challenges[5][2];
    cmul_2.inb[0] <== tmp_5[0];
    cmul_2.inb[1] <== tmp_5[1];
    cmul_2.inb[2] <== tmp_5[2];
    tmp_6[0] <== cmul_2.out[0];
    tmp_6[1] <== cmul_2.out[1];
    tmp_6[2] <== cmul_2.out[2];
    signal tmp_7[3];

    tmp_7[0] <== tmp_6[0] + mapValues.tree1_4;
    tmp_7[1] <== tmp_6[1];
    tmp_7[2] <== tmp_6[2];
    signal tmp_8[3];

    component cmul_3 = CMul();
    cmul_3.ina[0] <== challenges[5][0];
    cmul_3.ina[1] <== challenges[5][1];
    cmul_3.ina[2] <== challenges[5][2];
    cmul_3.inb[0] <== tmp_7[0];
    cmul_3.inb[1] <== tmp_7[1];
    cmul_3.inb[2] <== tmp_7[2];
    tmp_8[0] <== cmul_3.out[0];
    tmp_8[1] <== cmul_3.out[1];
    tmp_8[2] <== cmul_3.out[2];
    signal tmp_9[3];

    tmp_9[0] <== tmp_8[0] + mapValues.tree1_5;
    tmp_9[1] <== tmp_8[1];
    tmp_9[2] <== tmp_8[2];
    signal tmp_10[3];

    component cmul_4 = CMul();
    cmul_4.ina[0] <== challenges[5][0];
    cmul_4.ina[1] <== challenges[5][1];
    cmul_4.ina[2] <== challenges[5][2];
    cmul_4.inb[0] <== tmp_9[0];
    cmul_4.inb[1] <== tmp_9[1];
    cmul_4.inb[2] <== tmp_9[2];
    tmp_10[0] <== cmul_4.out[0];
    tmp_10[1] <== cmul_4.out[1];
    tmp_10[2] <== cmul_4.out[2];
    signal tmp_11[3];

    tmp_11[0] <== tmp_10[0] + mapValues.tree1_6;
    tmp_11[1] <== tmp_10[1];
    tmp_11[2] <== tmp_10[2];
    signal tmp_12[3];

    component cmul_5 = CMul();
    cmul_5.ina[0] <== challenges[5][0];
    cmul_5.ina[1] <== challenges[5][1];
    cmul_5.ina[2] <== challenges[5][2];
    cmul_5.inb[0] <== tmp_11[0];
    cmul_5.inb[1] <== tmp_11[1];
    cmul_5.inb[2] <== tmp_11[2];
    tmp_12[0] <== cmul_5.out[0];
    tmp_12[1] <== cmul_5.out[1];
    tmp_12[2] <== cmul_5.out[2];
    signal tmp_13[3];

    tmp_13[0] <== tmp_12[0] + mapValues.tree1_7;
    tmp_13[1] <== tmp_12[1];
    tmp_13[2] <== tmp_12[2];
    signal tmp_14[3];

    component cmul_6 = CMul();
    cmul_6.ina[0] <== challenges[5][0];
    cmul_6.ina[1] <== challenges[5][1];
    cmul_6.ina[2] <== challenges[5][2];
    cmul_6.inb[0] <== tmp_13[0];
    cmul_6.inb[1] <== tmp_13[1];
    cmul_6.inb[2] <== tmp_13[2];
    tmp_14[0] <== cmul_6.out[0];
    tmp_14[1] <== cmul_6.out[1];
    tmp_14[2] <== cmul_6.out[2];
    signal tmp_15[3];

    tmp_15[0] <== tmp_14[0] + mapValues.tree1_8;
    tmp_15[1] <== tmp_14[1];
    tmp_15[2] <== tmp_14[2];
    signal tmp_16[3];

    component cmul_7 = CMul();
    cmul_7.ina[0] <== challenges[5][0];
    cmul_7.ina[1] <== challenges[5][1];
    cmul_7.ina[2] <== challenges[5][2];
    cmul_7.inb[0] <== tmp_15[0];
    cmul_7.inb[1] <== tmp_15[1];
    cmul_7.inb[2] <== tmp_15[2];
    tmp_16[0] <== cmul_7.out[0];
    tmp_16[1] <== cmul_7.out[1];
    tmp_16[2] <== cmul_7.out[2];
    signal tmp_17[3];

    tmp_17[0] <== tmp_16[0] + mapValues.tree1_9;
    tmp_17[1] <== tmp_16[1];
    tmp_17[2] <== tmp_16[2];
    signal tmp_18[3];

    component cmul_8 = CMul();
    cmul_8.ina[0] <== challenges[5][0];
    cmul_8.ina[1] <== challenges[5][1];
    cmul_8.ina[2] <== challenges[5][2];
    cmul_8.inb[0] <== tmp_17[0];
    cmul_8.inb[1] <== tmp_17[1];
    cmul_8.inb[2] <== tmp_17[2];
    tmp_18[0] <== cmul_8.out[0];
    tmp_18[1] <== cmul_8.out[1];
    tmp_18[2] <== cmul_8.out[2];
    signal tmp_19[3];

    tmp_19[0] <== tmp_18[0] + mapValues.tree1_10;
    tmp_19[1] <== tmp_18[1];
    tmp_19[2] <== tmp_18[2];
    signal tmp_20[3];

    component cmul_9 = CMul();
    cmul_9.ina[0] <== challenges[5][0];
    cmul_9.ina[1] <== challenges[5][1];
    cmul_9.ina[2] <== challenges[5][2];
    cmul_9.inb[0] <== tmp_19[0];
    cmul_9.inb[1] <== tmp_19[1];
    cmul_9.inb[2] <== tmp_19[2];
    tmp_20[0] <== cmul_9.out[0];
    tmp_20[1] <== cmul_9.out[1];
    tmp_20[2] <== cmul_9.out[2];
    signal tmp_21[3];

    tmp_21[0] <== tmp_20[0] + mapValues.tree1_11;
    tmp_21[1] <== tmp_20[1];
    tmp_21[2] <== tmp_20[2];
    signal tmp_22[3];

    component cmul_10 = CMul();
    cmul_10.ina[0] <== challenges[5][0];
    cmul_10.ina[1] <== challenges[5][1];
    cmul_10.ina[2] <== challenges[5][2];
    cmul_10.inb[0] <== tmp_21[0];
    cmul_10.inb[1] <== tmp_21[1];
    cmul_10.inb[2] <== tmp_21[2];
    tmp_22[0] <== cmul_10.out[0];
    tmp_22[1] <== cmul_10.out[1];
    tmp_22[2] <== cmul_10.out[2];
    signal tmp_23[3];

    tmp_23[0] <== tmp_22[0] + mapValues.tree3_0[0];
    tmp_23[1] <== tmp_22[1] + mapValues.tree3_0[1];
    tmp_23[2] <== tmp_22[2] + mapValues.tree3_0[2];
    signal tmp_24[3];

    component cmul_11 = CMul();
    cmul_11.ina[0] <== challenges[5][0];
    cmul_11.ina[1] <== challenges[5][1];
    cmul_11.ina[2] <== challenges[5][2];
    cmul_11.inb[0] <== tmp_23[0];
    cmul_11.inb[1] <== tmp_23[1];
    cmul_11.inb[2] <== tmp_23[2];
    tmp_24[0] <== cmul_11.out[0];
    tmp_24[1] <== cmul_11.out[1];
    tmp_24[2] <== cmul_11.out[2];
    signal tmp_25[3];

    tmp_25[0] <== tmp_24[0] + mapValues.tree4_0;
    tmp_25[1] <== tmp_24[1];
    tmp_25[2] <== tmp_24[2];
    signal tmp_26[3];

    component cmul_12 = CMul();
    cmul_12.ina[0] <== challenges[5][0];
    cmul_12.ina[1] <== challenges[5][1];
    cmul_12.ina[2] <== challenges[5][2];
    cmul_12.inb[0] <== tmp_25[0];
    cmul_12.inb[1] <== tmp_25[1];
    cmul_12.inb[2] <== tmp_25[2];
    tmp_26[0] <== cmul_12.out[0];
    tmp_26[1] <== cmul_12.out[1];
    tmp_26[2] <== cmul_12.out[2];
    signal tmp_27[3];

    tmp_27[0] <== tmp_26[0] + mapValues.tree4_1;
    tmp_27[1] <== tmp_26[1];
    tmp_27[2] <== tmp_26[2];
    signal tmp_28[3];

    component cmul_13 = CMul();
    cmul_13.ina[0] <== challenges[5][0];
    cmul_13.ina[1] <== challenges[5][1];
    cmul_13.ina[2] <== challenges[5][2];
    cmul_13.inb[0] <== tmp_27[0];
    cmul_13.inb[1] <== tmp_27[1];
    cmul_13.inb[2] <== tmp_27[2];
    tmp_28[0] <== cmul_13.out[0];
    tmp_28[1] <== cmul_13.out[1];
    tmp_28[2] <== cmul_13.out[2];
    signal tmp_29[3];

    tmp_29[0] <== tmp_28[0] + mapValues.tree4_2;
    tmp_29[1] <== tmp_28[1];
    tmp_29[2] <== tmp_28[2];
    signal tmp_30[3];

    component cmul_14 = CMul();
    cmul_14.ina[0] <== challenges[5][0];
    cmul_14.ina[1] <== challenges[5][1];
    cmul_14.ina[2] <== challenges[5][2];
    cmul_14.inb[0] <== tmp_29[0];
    cmul_14.inb[1] <== tmp_29[1];
    cmul_14.inb[2] <== tmp_29[2];
    tmp_30[0] <== cmul_14.out[0];
    tmp_30[1] <== cmul_14.out[1];
    tmp_30[2] <== cmul_14.out[2];
    signal tmp_31[3];

    tmp_31[0] <== tmp_30[0] + mapValues.tree4_3;
    tmp_31[1] <== tmp_30[1];
    tmp_31[2] <== tmp_30[2];
    signal tmp_32[3];

    component cmul_15 = CMul();
    cmul_15.ina[0] <== challenges[5][0];
    cmul_15.ina[1] <== challenges[5][1];
    cmul_15.ina[2] <== challenges[5][2];
    cmul_15.inb[0] <== tmp_31[0];
    cmul_15.inb[1] <== tmp_31[1];
    cmul_15.inb[2] <== tmp_31[2];
    tmp_32[0] <== cmul_15.out[0];
    tmp_32[1] <== cmul_15.out[1];
    tmp_32[2] <== cmul_15.out[2];
    signal tmp_33[3];

    tmp_33[0] <== tmp_32[0] + mapValues.tree4_4;
    tmp_33[1] <== tmp_32[1];
    tmp_33[2] <== tmp_32[2];
    signal tmp_34[3];

    component cmul_16 = CMul();
    cmul_16.ina[0] <== challenges[5][0];
    cmul_16.ina[1] <== challenges[5][1];
    cmul_16.ina[2] <== challenges[5][2];
    cmul_16.inb[0] <== tmp_33[0];
    cmul_16.inb[1] <== tmp_33[1];
    cmul_16.inb[2] <== tmp_33[2];
    tmp_34[0] <== cmul_16.out[0];
    tmp_34[1] <== cmul_16.out[1];
    tmp_34[2] <== cmul_16.out[2];
    signal tmp_35[3];

    tmp_35[0] <== tmp_34[0] + mapValues.tree4_5;
    tmp_35[1] <== tmp_34[1];
    tmp_35[2] <== tmp_34[2];
    signal tmp_36[3];

    component cmul_17 = CMul();
    cmul_17.ina[0] <== challenges[5][0];
    cmul_17.ina[1] <== challenges[5][1];
    cmul_17.ina[2] <== challenges[5][2];
    cmul_17.inb[0] <== tmp_35[0];
    cmul_17.inb[1] <== tmp_35[1];
    cmul_17.inb[2] <== tmp_35[2];
    tmp_36[0] <== cmul_17.out[0];
    tmp_36[1] <== cmul_17.out[1];
    tmp_36[2] <== cmul_17.out[2];
    signal tmp_37[3];

    tmp_37[0] <== tmp_36[0] + mapValues.tree4_6;
    tmp_37[1] <== tmp_36[1];
    tmp_37[2] <== tmp_36[2];
    signal tmp_38[3];

    component cmul_18 = CMul();
    cmul_18.ina[0] <== challenges[5][0];
    cmul_18.ina[1] <== challenges[5][1];
    cmul_18.ina[2] <== challenges[5][2];
    cmul_18.inb[0] <== tmp_37[0];
    cmul_18.inb[1] <== tmp_37[1];
    cmul_18.inb[2] <== tmp_37[2];
    tmp_38[0] <== cmul_18.out[0];
    tmp_38[1] <== cmul_18.out[1];
    tmp_38[2] <== cmul_18.out[2];
    signal tmp_39[3];

    tmp_39[0] <== tmp_38[0] + mapValues.tree4_7;
    tmp_39[1] <== tmp_38[1];
    tmp_39[2] <== tmp_38[2];
    signal tmp_40[3];

    component cmul_19 = CMul();
    cmul_19.ina[0] <== challenges[5][0];
    cmul_19.ina[1] <== challenges[5][1];
    cmul_19.ina[2] <== challenges[5][2];
    cmul_19.inb[0] <== tmp_39[0];
    cmul_19.inb[1] <== tmp_39[1];
    cmul_19.inb[2] <== tmp_39[2];
    tmp_40[0] <== cmul_19.out[0];
    tmp_40[1] <== cmul_19.out[1];
    tmp_40[2] <== cmul_19.out[2];
    signal tmp_41[3];

    tmp_41[0] <== tmp_40[0] + mapValues.tree4_8;
    tmp_41[1] <== tmp_40[1];
    tmp_41[2] <== tmp_40[2];
    signal tmp_42[3];

    component cmul_20 = CMul();
    cmul_20.ina[0] <== challenges[5][0];
    cmul_20.ina[1] <== challenges[5][1];
    cmul_20.ina[2] <== challenges[5][2];
    cmul_20.inb[0] <== tmp_41[0];
    cmul_20.inb[1] <== tmp_41[1];
    cmul_20.inb[2] <== tmp_41[2];
    tmp_42[0] <== cmul_20.out[0];
    tmp_42[1] <== cmul_20.out[1];
    tmp_42[2] <== cmul_20.out[2];
    signal tmp_43[3];

    tmp_43[0] <== tmp_42[0] + mapValues.tree4_9;
    tmp_43[1] <== tmp_42[1];
    tmp_43[2] <== tmp_42[2];
    signal tmp_44[3];

    component cmul_21 = CMul();
    cmul_21.ina[0] <== challenges[5][0];
    cmul_21.ina[1] <== challenges[5][1];
    cmul_21.ina[2] <== challenges[5][2];
    cmul_21.inb[0] <== tmp_43[0];
    cmul_21.inb[1] <== tmp_43[1];
    cmul_21.inb[2] <== tmp_43[2];
    tmp_44[0] <== cmul_21.out[0];
    tmp_44[1] <== cmul_21.out[1];
    tmp_44[2] <== cmul_21.out[2];
    signal tmp_45[3];

    tmp_45[0] <== tmp_44[0] + mapValues.tree4_10[0];
    tmp_45[1] <== tmp_44[1] + mapValues.tree4_10[1];
    tmp_45[2] <== tmp_44[2] + mapValues.tree4_10[2];
    signal tmp_46[3];

    component cmul_22 = CMul();
    cmul_22.ina[0] <== challenges[5][0];
    cmul_22.ina[1] <== challenges[5][1];
    cmul_22.ina[2] <== challenges[5][2];
    cmul_22.inb[0] <== tmp_45[0];
    cmul_22.inb[1] <== tmp_45[1];
    cmul_22.inb[2] <== tmp_45[2];
    tmp_46[0] <== cmul_22.out[0];
    tmp_46[1] <== cmul_22.out[1];
    tmp_46[2] <== cmul_22.out[2];
    signal tmp_47[3];

    tmp_47[0] <== tmp_46[0] + mapValues.tree4_11[0];
    tmp_47[1] <== tmp_46[1] + mapValues.tree4_11[1];
    tmp_47[2] <== tmp_46[2] + mapValues.tree4_11[2];
    signal tmp_48[3];

    component cmul_23 = CMul();
    cmul_23.ina[0] <== challenges[5][0];
    cmul_23.ina[1] <== challenges[5][1];
    cmul_23.ina[2] <== challenges[5][2];
    cmul_23.inb[0] <== tmp_47[0];
    cmul_23.inb[1] <== tmp_47[1];
    cmul_23.inb[2] <== tmp_47[2];
    tmp_48[0] <== cmul_23.out[0];
    tmp_48[1] <== cmul_23.out[1];
    tmp_48[2] <== cmul_23.out[2];
    signal tmp_49[3];

    tmp_49[0] <== tmp_48[0] + mapValues.tree4_12[0];
    tmp_49[1] <== tmp_48[1] + mapValues.tree4_12[1];
    tmp_49[2] <== tmp_48[2] + mapValues.tree4_12[2];
    signal tmp_50[3];

    component cmul_24 = CMul();
    cmul_24.ina[0] <== challenges[5][0];
    cmul_24.ina[1] <== challenges[5][1];
    cmul_24.ina[2] <== challenges[5][2];
    cmul_24.inb[0] <== tmp_49[0];
    cmul_24.inb[1] <== tmp_49[1];
    cmul_24.inb[2] <== tmp_49[2];
    tmp_50[0] <== cmul_24.out[0];
    tmp_50[1] <== cmul_24.out[1];
    tmp_50[2] <== cmul_24.out[2];
    signal tmp_51[3];

    tmp_51[0] <== tmp_50[0] + mapValues.tree4_13[0];
    tmp_51[1] <== tmp_50[1] + mapValues.tree4_13[1];
    tmp_51[2] <== tmp_50[2] + mapValues.tree4_13[2];
    signal tmp_52[3];

    component cmul_25 = CMul();
    cmul_25.ina[0] <== challenges[5][0];
    cmul_25.ina[1] <== challenges[5][1];
    cmul_25.ina[2] <== challenges[5][2];
    cmul_25.inb[0] <== tmp_51[0];
    cmul_25.inb[1] <== tmp_51[1];
    cmul_25.inb[2] <== tmp_51[2];
    tmp_52[0] <== cmul_25.out[0];
    tmp_52[1] <== cmul_25.out[1];
    tmp_52[2] <== cmul_25.out[2];
    signal tmp_53[3];

    tmp_53[0] <== tmp_52[0] + mapValues.tree4_14[0];
    tmp_53[1] <== tmp_52[1] + mapValues.tree4_14[1];
    tmp_53[2] <== tmp_52[2] + mapValues.tree4_14[2];
    signal tmp_54[3];

    component cmul_26 = CMul();
    cmul_26.ina[0] <== challenges[5][0];
    cmul_26.ina[1] <== challenges[5][1];
    cmul_26.ina[2] <== challenges[5][2];
    cmul_26.inb[0] <== tmp_53[0];
    cmul_26.inb[1] <== tmp_53[1];
    cmul_26.inb[2] <== tmp_53[2];
    tmp_54[0] <== cmul_26.out[0];
    tmp_54[1] <== cmul_26.out[1];
    tmp_54[2] <== cmul_26.out[2];
    signal tmp_55[3];

    tmp_55[0] <== tmp_54[0] + mapValues.tree4_15[0];
    tmp_55[1] <== tmp_54[1] + mapValues.tree4_15[1];
    tmp_55[2] <== tmp_54[2] + mapValues.tree4_15[2];
    signal tmp_56[3];

    component cmul_27 = CMul();
    cmul_27.ina[0] <== challenges[5][0];
    cmul_27.ina[1] <== challenges[5][1];
    cmul_27.ina[2] <== challenges[5][2];
    cmul_27.inb[0] <== tmp_55[0];
    cmul_27.inb[1] <== tmp_55[1];
    cmul_27.inb[2] <== tmp_55[2];
    tmp_56[0] <== cmul_27.out[0];
    tmp_56[1] <== cmul_27.out[1];
    tmp_56[2] <== cmul_27.out[2];
    signal tmp_57[3];

    tmp_57[0] <== tmp_56[0] + mapValues.tree4_16[0];
    tmp_57[1] <== tmp_56[1] + mapValues.tree4_16[1];
    tmp_57[2] <== tmp_56[2] + mapValues.tree4_16[2];
    signal tmp_58[3];

    component cmul_28 = CMul();
    cmul_28.ina[0] <== challenges[5][0];
    cmul_28.ina[1] <== challenges[5][1];
    cmul_28.ina[2] <== challenges[5][2];
    cmul_28.inb[0] <== tmp_57[0];
    cmul_28.inb[1] <== tmp_57[1];
    cmul_28.inb[2] <== tmp_57[2];
    tmp_58[0] <== cmul_28.out[0];
    tmp_58[1] <== cmul_28.out[1];
    tmp_58[2] <== cmul_28.out[2];
    signal tmp_59[3];

    tmp_59[0] <== tmp_58[0] + mapValues.tree4_17[0];
    tmp_59[1] <== tmp_58[1] + mapValues.tree4_17[1];
    tmp_59[2] <== tmp_58[2] + mapValues.tree4_17[2];
    signal tmp_60[3];

    component cmul_29 = CMul();
    cmul_29.ina[0] <== challenges[5][0];
    cmul_29.ina[1] <== challenges[5][1];
    cmul_29.ina[2] <== challenges[5][2];
    cmul_29.inb[0] <== tmp_59[0];
    cmul_29.inb[1] <== tmp_59[1];
    cmul_29.inb[2] <== tmp_59[2];
    tmp_60[0] <== cmul_29.out[0];
    tmp_60[1] <== cmul_29.out[1];
    tmp_60[2] <== cmul_29.out[2];
    signal tmp_61[3];

    tmp_61[0] <== tmp_60[0] + mapValues.tree4_18[0];
    tmp_61[1] <== tmp_60[1] + mapValues.tree4_18[1];
    tmp_61[2] <== tmp_60[2] + mapValues.tree4_18[2];
    signal tmp_62[3];

    component cmul_30 = CMul();
    cmul_30.ina[0] <== challenges[5][0];
    cmul_30.ina[1] <== challenges[5][1];
    cmul_30.ina[2] <== challenges[5][2];
    cmul_30.inb[0] <== tmp_61[0];
    cmul_30.inb[1] <== tmp_61[1];
    cmul_30.inb[2] <== tmp_61[2];
    tmp_62[0] <== cmul_30.out[0];
    tmp_62[1] <== cmul_30.out[1];
    tmp_62[2] <== cmul_30.out[2];
    signal tmp_63[3];

    tmp_63[0] <== tmp_62[0] + mapValues.tree4_19[0];
    tmp_63[1] <== tmp_62[1] + mapValues.tree4_19[1];
    tmp_63[2] <== tmp_62[2] + mapValues.tree4_19[2];
    signal tmp_64[3];

    component cmul_31 = CMul();
    cmul_31.ina[0] <== challenges[5][0];
    cmul_31.ina[1] <== challenges[5][1];
    cmul_31.ina[2] <== challenges[5][2];
    cmul_31.inb[0] <== tmp_63[0];
    cmul_31.inb[1] <== tmp_63[1];
    cmul_31.inb[2] <== tmp_63[2];
    tmp_64[0] <== cmul_31.out[0];
    tmp_64[1] <== cmul_31.out[1];
    tmp_64[2] <== cmul_31.out[2];
    signal tmp_65[3];

    tmp_65[0] <== tmp_64[0] + mapValues.tree4_20[0];
    tmp_65[1] <== tmp_64[1] + mapValues.tree4_20[1];
    tmp_65[2] <== tmp_64[2] + mapValues.tree4_20[2];
    signal tmp_66[3];

    component cmul_32 = CMul();
    cmul_32.ina[0] <== challenges[5][0];
    cmul_32.ina[1] <== challenges[5][1];
    cmul_32.ina[2] <== challenges[5][2];
    cmul_32.inb[0] <== tmp_65[0];
    cmul_32.inb[1] <== tmp_65[1];
    cmul_32.inb[2] <== tmp_65[2];
    tmp_66[0] <== cmul_32.out[0];
    tmp_66[1] <== cmul_32.out[1];
    tmp_66[2] <== cmul_32.out[2];
    signal tmp_67[3];

    tmp_67[0] <== tmp_66[0] + mapValues.tree4_21[0];
    tmp_67[1] <== tmp_66[1] + mapValues.tree4_21[1];
    tmp_67[2] <== tmp_66[2] + mapValues.tree4_21[2];
    signal tmp_68[3];

    component cmul_33 = CMul();
    cmul_33.ina[0] <== challenges[5][0];
    cmul_33.ina[1] <== challenges[5][1];
    cmul_33.ina[2] <== challenges[5][2];
    cmul_33.inb[0] <== tmp_67[0];
    cmul_33.inb[1] <== tmp_67[1];
    cmul_33.inb[2] <== tmp_67[2];
    tmp_68[0] <== cmul_33.out[0];
    tmp_68[1] <== cmul_33.out[1];
    tmp_68[2] <== cmul_33.out[2];
    signal tmp_69[3];

    tmp_69[0] <== tmp_68[0] + mapValues.tree4_22[0];
    tmp_69[1] <== tmp_68[1] + mapValues.tree4_22[1];
    tmp_69[2] <== tmp_68[2] + mapValues.tree4_22[2];
    signal tmp_70[3];

    component cmul_34 = CMul();
    cmul_34.ina[0] <== challenges[5][0];
    cmul_34.ina[1] <== challenges[5][1];
    cmul_34.ina[2] <== challenges[5][2];
    cmul_34.inb[0] <== tmp_69[0];
    cmul_34.inb[1] <== tmp_69[1];
    cmul_34.inb[2] <== tmp_69[2];
    tmp_70[0] <== cmul_34.out[0];
    tmp_70[1] <== cmul_34.out[1];
    tmp_70[2] <== cmul_34.out[2];
    signal tmp_71[3];

    tmp_71[0] <== tmp_70[0] + mapValues.tree4_23[0];
    tmp_71[1] <== tmp_70[1] + mapValues.tree4_23[1];
    tmp_71[2] <== tmp_70[2] + mapValues.tree4_23[2];
    signal tmp_72[3];

    component cmul_35 = CMul();
    cmul_35.ina[0] <== challenges[5][0];
    cmul_35.ina[1] <== challenges[5][1];
    cmul_35.ina[2] <== challenges[5][2];
    cmul_35.inb[0] <== tmp_71[0];
    cmul_35.inb[1] <== tmp_71[1];
    cmul_35.inb[2] <== tmp_71[2];
    tmp_72[0] <== cmul_35.out[0];
    tmp_72[1] <== cmul_35.out[1];
    tmp_72[2] <== cmul_35.out[2];
    signal tmp_73[3];

    tmp_73[0] <== tmp_72[0] + mapValues.tree4_24[0];
    tmp_73[1] <== tmp_72[1] + mapValues.tree4_24[1];
    tmp_73[2] <== tmp_72[2] + mapValues.tree4_24[2];
    signal tmp_74[3];

    component cmul_36 = CMul();
    cmul_36.ina[0] <== challenges[5][0];
    cmul_36.ina[1] <== challenges[5][1];
    cmul_36.ina[2] <== challenges[5][2];
    cmul_36.inb[0] <== tmp_73[0];
    cmul_36.inb[1] <== tmp_73[1];
    cmul_36.inb[2] <== tmp_73[2];
    tmp_74[0] <== cmul_36.out[0];
    tmp_74[1] <== cmul_36.out[1];
    tmp_74[2] <== cmul_36.out[2];
    signal tmp_75[3];

    tmp_75[0] <== tmp_74[0] + mapValues.tree4_25[0];
    tmp_75[1] <== tmp_74[1] + mapValues.tree4_25[1];
    tmp_75[2] <== tmp_74[2] + mapValues.tree4_25[2];
    signal tmp_76[3];

    component cmul_37 = CMul();
    cmul_37.ina[0] <== challenges[5][0];
    cmul_37.ina[1] <== challenges[5][1];
    cmul_37.ina[2] <== challenges[5][2];
    cmul_37.inb[0] <== tmp_75[0];
    cmul_37.inb[1] <== tmp_75[1];
    cmul_37.inb[2] <== tmp_75[2];
    tmp_76[0] <== cmul_37.out[0];
    tmp_76[1] <== cmul_37.out[1];
    tmp_76[2] <== cmul_37.out[2];
    signal tmp_77[3];

    tmp_77[0] <== tmp_76[0] + mapValues.tree4_26[0];
    tmp_77[1] <== tmp_76[1] + mapValues.tree4_26[1];
    tmp_77[2] <== tmp_76[2] + mapValues.tree4_26[2];
    signal tmp_78[3];

    component cmul_38 = CMul();
    cmul_38.ina[0] <== challenges[5][0];
    cmul_38.ina[1] <== challenges[5][1];
    cmul_38.ina[2] <== challenges[5][2];
    cmul_38.inb[0] <== tmp_77[0];
    cmul_38.inb[1] <== tmp_77[1];
    cmul_38.inb[2] <== tmp_77[2];
    tmp_78[0] <== cmul_38.out[0];
    tmp_78[1] <== cmul_38.out[1];
    tmp_78[2] <== cmul_38.out[2];
    signal tmp_79[3];

    tmp_79[0] <== tmp_78[0] + mapValues.tree4_27[0];
    tmp_79[1] <== tmp_78[1] + mapValues.tree4_27[1];
    tmp_79[2] <== tmp_78[2] + mapValues.tree4_27[2];
    signal tmp_80[3];

    component cmul_39 = CMul();
    cmul_39.ina[0] <== challenges[5][0];
    cmul_39.ina[1] <== challenges[5][1];
    cmul_39.ina[2] <== challenges[5][2];
    cmul_39.inb[0] <== tmp_79[0];
    cmul_39.inb[1] <== tmp_79[1];
    cmul_39.inb[2] <== tmp_79[2];
    tmp_80[0] <== cmul_39.out[0];
    tmp_80[1] <== cmul_39.out[1];
    tmp_80[2] <== cmul_39.out[2];
    signal tmp_81[3];

    tmp_81[0] <== tmp_80[0] + mapValues.tree4_28[0];
    tmp_81[1] <== tmp_80[1] + mapValues.tree4_28[1];
    tmp_81[2] <== tmp_80[2] + mapValues.tree4_28[2];
    signal tmp_82[3];

    component cmul_40 = CMul();
    cmul_40.ina[0] <== challenges[5][0];
    cmul_40.ina[1] <== challenges[5][1];
    cmul_40.ina[2] <== challenges[5][2];
    cmul_40.inb[0] <== tmp_81[0];
    cmul_40.inb[1] <== tmp_81[1];
    cmul_40.inb[2] <== tmp_81[2];
    tmp_82[0] <== cmul_40.out[0];
    tmp_82[1] <== cmul_40.out[1];
    tmp_82[2] <== cmul_40.out[2];
    signal tmp_83[3];

    tmp_83[0] <== tmp_82[0] + mapValues.tree4_29[0];
    tmp_83[1] <== tmp_82[1] + mapValues.tree4_29[1];
    tmp_83[2] <== tmp_82[2] + mapValues.tree4_29[2];
    signal tmp_84[3];

    component cmul_41 = CMul();
    cmul_41.ina[0] <== challenges[5][0];
    cmul_41.ina[1] <== challenges[5][1];
    cmul_41.ina[2] <== challenges[5][2];
    cmul_41.inb[0] <== tmp_83[0];
    cmul_41.inb[1] <== tmp_83[1];
    cmul_41.inb[2] <== tmp_83[2];
    tmp_84[0] <== cmul_41.out[0];
    tmp_84[1] <== cmul_41.out[1];
    tmp_84[2] <== cmul_41.out[2];
    signal tmp_85[3];

    tmp_85[0] <== tmp_84[0] + mapValues.tree4_30[0];
    tmp_85[1] <== tmp_84[1] + mapValues.tree4_30[1];
    tmp_85[2] <== tmp_84[2] + mapValues.tree4_30[2];
    signal tmp_86[3];

    component cmul_42 = CMul();
    cmul_42.ina[0] <== challenges[5][0];
    cmul_42.ina[1] <== challenges[5][1];
    cmul_42.ina[2] <== challenges[5][2];
    cmul_42.inb[0] <== tmp_85[0];
    cmul_42.inb[1] <== tmp_85[1];
    cmul_42.inb[2] <== tmp_85[2];
    tmp_86[0] <== cmul_42.out[0];
    tmp_86[1] <== cmul_42.out[1];
    tmp_86[2] <== cmul_42.out[2];
    signal tmp_87[3];

    tmp_87[0] <== tmp_86[0] + mapValues.tree4_31[0];
    tmp_87[1] <== tmp_86[1] + mapValues.tree4_31[1];
    tmp_87[2] <== tmp_86[2] + mapValues.tree4_31[2];
    signal tmp_88[3];

    component cmul_43 = CMul();
    cmul_43.ina[0] <== challenges[5][0];
    cmul_43.ina[1] <== challenges[5][1];
    cmul_43.ina[2] <== challenges[5][2];
    cmul_43.inb[0] <== tmp_87[0];
    cmul_43.inb[1] <== tmp_87[1];
    cmul_43.inb[2] <== tmp_87[2];
    tmp_88[0] <== cmul_43.out[0];
    tmp_88[1] <== cmul_43.out[1];
    tmp_88[2] <== cmul_43.out[2];
    signal tmp_89[3];

    tmp_89[0] <== tmp_88[0] + mapValues.tree4_32[0];
    tmp_89[1] <== tmp_88[1] + mapValues.tree4_32[1];
    tmp_89[2] <== tmp_88[2] + mapValues.tree4_32[2];
    signal tmp_90[3];

    component cmul_44 = CMul();
    cmul_44.ina[0] <== challenges[5][0];
    cmul_44.ina[1] <== challenges[5][1];
    cmul_44.ina[2] <== challenges[5][2];
    cmul_44.inb[0] <== tmp_89[0];
    cmul_44.inb[1] <== tmp_89[1];
    cmul_44.inb[2] <== tmp_89[2];
    tmp_90[0] <== cmul_44.out[0];
    tmp_90[1] <== cmul_44.out[1];
    tmp_90[2] <== cmul_44.out[2];
    signal tmp_91[3];

    tmp_91[0] <== mapValues.tree1_0 - evals[0][0];
    tmp_91[1] <== -evals[0][1];
    tmp_91[2] <== -evals[0][2];
    signal tmp_92[3];

    component cmul_45 = CMul();
    cmul_45.ina[0] <== tmp_91[0];
    cmul_45.ina[1] <== tmp_91[1];
    cmul_45.ina[2] <== tmp_91[2];
    cmul_45.inb[0] <== challenges[6][0];
    cmul_45.inb[1] <== challenges[6][1];
    cmul_45.inb[2] <== challenges[6][2];
    tmp_92[0] <== cmul_45.out[0];
    tmp_92[1] <== cmul_45.out[1];
    tmp_92[2] <== cmul_45.out[2];
    signal tmp_93[3];

    tmp_93[0] <== consts[0] - evals[1][0];
    tmp_93[1] <== -evals[1][1];
    tmp_93[2] <== -evals[1][2];
    signal tmp_94[3];

    tmp_94[0] <== tmp_92[0] + tmp_93[0];
    tmp_94[1] <== tmp_92[1] + tmp_93[1];
    tmp_94[2] <== tmp_92[2] + tmp_93[2];
    signal tmp_95[3];

    component cmul_46 = CMul();
    cmul_46.ina[0] <== tmp_94[0];
    cmul_46.ina[1] <== tmp_94[1];
    cmul_46.ina[2] <== tmp_94[2];
    cmul_46.inb[0] <== challenges[6][0];
    cmul_46.inb[1] <== challenges[6][1];
    cmul_46.inb[2] <== challenges[6][2];
    tmp_95[0] <== cmul_46.out[0];
    tmp_95[1] <== cmul_46.out[1];
    tmp_95[2] <== cmul_46.out[2];
    signal tmp_96[3];

    tmp_96[0] <== mapValues.tree1_1 - evals[2][0];
    tmp_96[1] <== -evals[2][1];
    tmp_96[2] <== -evals[2][2];
    signal tmp_97[3];

    tmp_97[0] <== tmp_95[0] + tmp_96[0];
    tmp_97[1] <== tmp_95[1] + tmp_96[1];
    tmp_97[2] <== tmp_95[2] + tmp_96[2];
    signal tmp_98[3];

    component cmul_47 = CMul();
    cmul_47.ina[0] <== tmp_97[0];
    cmul_47.ina[1] <== tmp_97[1];
    cmul_47.ina[2] <== tmp_97[2];
    cmul_47.inb[0] <== challenges[6][0];
    cmul_47.inb[1] <== challenges[6][1];
    cmul_47.inb[2] <== challenges[6][2];
    tmp_98[0] <== cmul_47.out[0];
    tmp_98[1] <== cmul_47.out[1];
    tmp_98[2] <== cmul_47.out[2];
    signal tmp_99[3];

    tmp_99[0] <== mapValues.tree1_2 - evals[3][0];
    tmp_99[1] <== -evals[3][1];
    tmp_99[2] <== -evals[3][2];
    signal tmp_100[3];

    tmp_100[0] <== tmp_98[0] + tmp_99[0];
    tmp_100[1] <== tmp_98[1] + tmp_99[1];
    tmp_100[2] <== tmp_98[2] + tmp_99[2];
    signal tmp_101[3];

    component cmul_48 = CMul();
    cmul_48.ina[0] <== tmp_100[0];
    cmul_48.ina[1] <== tmp_100[1];
    cmul_48.ina[2] <== tmp_100[2];
    cmul_48.inb[0] <== challenges[6][0];
    cmul_48.inb[1] <== challenges[6][1];
    cmul_48.inb[2] <== challenges[6][2];
    tmp_101[0] <== cmul_48.out[0];
    tmp_101[1] <== cmul_48.out[1];
    tmp_101[2] <== cmul_48.out[2];
    signal tmp_102[3];

    tmp_102[0] <== mapValues.tree1_3 - evals[4][0];
    tmp_102[1] <== -evals[4][1];
    tmp_102[2] <== -evals[4][2];
    signal tmp_103[3];

    tmp_103[0] <== tmp_101[0] + tmp_102[0];
    tmp_103[1] <== tmp_101[1] + tmp_102[1];
    tmp_103[2] <== tmp_101[2] + tmp_102[2];
    signal tmp_104[3];

    component cmul_49 = CMul();
    cmul_49.ina[0] <== tmp_103[0];
    cmul_49.ina[1] <== tmp_103[1];
    cmul_49.ina[2] <== tmp_103[2];
    cmul_49.inb[0] <== challenges[6][0];
    cmul_49.inb[1] <== challenges[6][1];
    cmul_49.inb[2] <== challenges[6][2];
    tmp_104[0] <== cmul_49.out[0];
    tmp_104[1] <== cmul_49.out[1];
    tmp_104[2] <== cmul_49.out[2];
    signal tmp_105[3];

    tmp_105[0] <== mapValues.tree1_4 - evals[5][0];
    tmp_105[1] <== -evals[5][1];
    tmp_105[2] <== -evals[5][2];
    signal tmp_106[3];

    tmp_106[0] <== tmp_104[0] + tmp_105[0];
    tmp_106[1] <== tmp_104[1] + tmp_105[1];
    tmp_106[2] <== tmp_104[2] + tmp_105[2];
    signal tmp_107[3];

    component cmul_50 = CMul();
    cmul_50.ina[0] <== tmp_106[0];
    cmul_50.ina[1] <== tmp_106[1];
    cmul_50.ina[2] <== tmp_106[2];
    cmul_50.inb[0] <== challenges[6][0];
    cmul_50.inb[1] <== challenges[6][1];
    cmul_50.inb[2] <== challenges[6][2];
    tmp_107[0] <== cmul_50.out[0];
    tmp_107[1] <== cmul_50.out[1];
    tmp_107[2] <== cmul_50.out[2];
    signal tmp_108[3];

    tmp_108[0] <== mapValues.tree1_5 - evals[6][0];
    tmp_108[1] <== -evals[6][1];
    tmp_108[2] <== -evals[6][2];
    signal tmp_109[3];

    tmp_109[0] <== tmp_107[0] + tmp_108[0];
    tmp_109[1] <== tmp_107[1] + tmp_108[1];
    tmp_109[2] <== tmp_107[2] + tmp_108[2];
    signal tmp_110[3];

    component cmul_51 = CMul();
    cmul_51.ina[0] <== tmp_109[0];
    cmul_51.ina[1] <== tmp_109[1];
    cmul_51.ina[2] <== tmp_109[2];
    cmul_51.inb[0] <== challenges[6][0];
    cmul_51.inb[1] <== challenges[6][1];
    cmul_51.inb[2] <== challenges[6][2];
    tmp_110[0] <== cmul_51.out[0];
    tmp_110[1] <== cmul_51.out[1];
    tmp_110[2] <== cmul_51.out[2];
    signal tmp_111[3];

    tmp_111[0] <== mapValues.tree1_6 - evals[7][0];
    tmp_111[1] <== -evals[7][1];
    tmp_111[2] <== -evals[7][2];
    signal tmp_112[3];

    tmp_112[0] <== tmp_110[0] + tmp_111[0];
    tmp_112[1] <== tmp_110[1] + tmp_111[1];
    tmp_112[2] <== tmp_110[2] + tmp_111[2];
    signal tmp_113[3];

    component cmul_52 = CMul();
    cmul_52.ina[0] <== tmp_112[0];
    cmul_52.ina[1] <== tmp_112[1];
    cmul_52.ina[2] <== tmp_112[2];
    cmul_52.inb[0] <== challenges[6][0];
    cmul_52.inb[1] <== challenges[6][1];
    cmul_52.inb[2] <== challenges[6][2];
    tmp_113[0] <== cmul_52.out[0];
    tmp_113[1] <== cmul_52.out[1];
    tmp_113[2] <== cmul_52.out[2];
    signal tmp_114[3];

    tmp_114[0] <== mapValues.tree1_7 - evals[8][0];
    tmp_114[1] <== -evals[8][1];
    tmp_114[2] <== -evals[8][2];
    signal tmp_115[3];

    tmp_115[0] <== tmp_113[0] + tmp_114[0];
    tmp_115[1] <== tmp_113[1] + tmp_114[1];
    tmp_115[2] <== tmp_113[2] + tmp_114[2];
    signal tmp_116[3];

    component cmul_53 = CMul();
    cmul_53.ina[0] <== tmp_115[0];
    cmul_53.ina[1] <== tmp_115[1];
    cmul_53.ina[2] <== tmp_115[2];
    cmul_53.inb[0] <== challenges[6][0];
    cmul_53.inb[1] <== challenges[6][1];
    cmul_53.inb[2] <== challenges[6][2];
    tmp_116[0] <== cmul_53.out[0];
    tmp_116[1] <== cmul_53.out[1];
    tmp_116[2] <== cmul_53.out[2];
    signal tmp_117[3];

    tmp_117[0] <== mapValues.tree4_0 - evals[9][0];
    tmp_117[1] <== -evals[9][1];
    tmp_117[2] <== -evals[9][2];
    signal tmp_118[3];

    tmp_118[0] <== tmp_116[0] + tmp_117[0];
    tmp_118[1] <== tmp_116[1] + tmp_117[1];
    tmp_118[2] <== tmp_116[2] + tmp_117[2];
    signal tmp_119[3];

    component cmul_54 = CMul();
    cmul_54.ina[0] <== tmp_118[0];
    cmul_54.ina[1] <== tmp_118[1];
    cmul_54.ina[2] <== tmp_118[2];
    cmul_54.inb[0] <== challenges[6][0];
    cmul_54.inb[1] <== challenges[6][1];
    cmul_54.inb[2] <== challenges[6][2];
    tmp_119[0] <== cmul_54.out[0];
    tmp_119[1] <== cmul_54.out[1];
    tmp_119[2] <== cmul_54.out[2];
    signal tmp_120[3];

    tmp_120[0] <== consts[13] - evals[10][0];
    tmp_120[1] <== -evals[10][1];
    tmp_120[2] <== -evals[10][2];
    signal tmp_121[3];

    tmp_121[0] <== tmp_119[0] + tmp_120[0];
    tmp_121[1] <== tmp_119[1] + tmp_120[1];
    tmp_121[2] <== tmp_119[2] + tmp_120[2];
    signal tmp_122[3];

    component cmul_55 = CMul();
    cmul_55.ina[0] <== tmp_121[0];
    cmul_55.ina[1] <== tmp_121[1];
    cmul_55.ina[2] <== tmp_121[2];
    cmul_55.inb[0] <== challenges[6][0];
    cmul_55.inb[1] <== challenges[6][1];
    cmul_55.inb[2] <== challenges[6][2];
    tmp_122[0] <== cmul_55.out[0];
    tmp_122[1] <== cmul_55.out[1];
    tmp_122[2] <== cmul_55.out[2];
    signal tmp_123[3];

    tmp_123[0] <== consts[14] - evals[11][0];
    tmp_123[1] <== -evals[11][1];
    tmp_123[2] <== -evals[11][2];
    signal tmp_124[3];

    tmp_124[0] <== tmp_122[0] + tmp_123[0];
    tmp_124[1] <== tmp_122[1] + tmp_123[1];
    tmp_124[2] <== tmp_122[2] + tmp_123[2];
    signal tmp_125[3];

    component cmul_56 = CMul();
    cmul_56.ina[0] <== tmp_124[0];
    cmul_56.ina[1] <== tmp_124[1];
    cmul_56.ina[2] <== tmp_124[2];
    cmul_56.inb[0] <== challenges[6][0];
    cmul_56.inb[1] <== challenges[6][1];
    cmul_56.inb[2] <== challenges[6][2];
    tmp_125[0] <== cmul_56.out[0];
    tmp_125[1] <== cmul_56.out[1];
    tmp_125[2] <== cmul_56.out[2];
    signal tmp_126[3];

    tmp_126[0] <== consts[15] - evals[12][0];
    tmp_126[1] <== -evals[12][1];
    tmp_126[2] <== -evals[12][2];
    signal tmp_127[3];

    tmp_127[0] <== tmp_125[0] + tmp_126[0];
    tmp_127[1] <== tmp_125[1] + tmp_126[1];
    tmp_127[2] <== tmp_125[2] + tmp_126[2];
    signal tmp_128[3];

    component cmul_57 = CMul();
    cmul_57.ina[0] <== tmp_127[0];
    cmul_57.ina[1] <== tmp_127[1];
    cmul_57.ina[2] <== tmp_127[2];
    cmul_57.inb[0] <== challenges[6][0];
    cmul_57.inb[1] <== challenges[6][1];
    cmul_57.inb[2] <== challenges[6][2];
    tmp_128[0] <== cmul_57.out[0];
    tmp_128[1] <== cmul_57.out[1];
    tmp_128[2] <== cmul_57.out[2];
    signal tmp_129[3];

    tmp_129[0] <== consts[16] - evals[13][0];
    tmp_129[1] <== -evals[13][1];
    tmp_129[2] <== -evals[13][2];
    signal tmp_130[3];

    tmp_130[0] <== tmp_128[0] + tmp_129[0];
    tmp_130[1] <== tmp_128[1] + tmp_129[1];
    tmp_130[2] <== tmp_128[2] + tmp_129[2];
    signal tmp_131[3];

    component cmul_58 = CMul();
    cmul_58.ina[0] <== tmp_130[0];
    cmul_58.ina[1] <== tmp_130[1];
    cmul_58.ina[2] <== tmp_130[2];
    cmul_58.inb[0] <== challenges[6][0];
    cmul_58.inb[1] <== challenges[6][1];
    cmul_58.inb[2] <== challenges[6][2];
    tmp_131[0] <== cmul_58.out[0];
    tmp_131[1] <== cmul_58.out[1];
    tmp_131[2] <== cmul_58.out[2];
    signal tmp_132[3];

    tmp_132[0] <== consts[17] - evals[14][0];
    tmp_132[1] <== -evals[14][1];
    tmp_132[2] <== -evals[14][2];
    signal tmp_133[3];

    tmp_133[0] <== tmp_131[0] + tmp_132[0];
    tmp_133[1] <== tmp_131[1] + tmp_132[1];
    tmp_133[2] <== tmp_131[2] + tmp_132[2];
    signal tmp_134[3];

    component cmul_59 = CMul();
    cmul_59.ina[0] <== tmp_133[0];
    cmul_59.ina[1] <== tmp_133[1];
    cmul_59.ina[2] <== tmp_133[2];
    cmul_59.inb[0] <== challenges[6][0];
    cmul_59.inb[1] <== challenges[6][1];
    cmul_59.inb[2] <== challenges[6][2];
    tmp_134[0] <== cmul_59.out[0];
    tmp_134[1] <== cmul_59.out[1];
    tmp_134[2] <== cmul_59.out[2];
    signal tmp_135[3];

    tmp_135[0] <== mapValues.tree4_1 - evals[15][0];
    tmp_135[1] <== -evals[15][1];
    tmp_135[2] <== -evals[15][2];
    signal tmp_136[3];

    tmp_136[0] <== tmp_134[0] + tmp_135[0];
    tmp_136[1] <== tmp_134[1] + tmp_135[1];
    tmp_136[2] <== tmp_134[2] + tmp_135[2];
    signal tmp_137[3];

    component cmul_60 = CMul();
    cmul_60.ina[0] <== tmp_136[0];
    cmul_60.ina[1] <== tmp_136[1];
    cmul_60.ina[2] <== tmp_136[2];
    cmul_60.inb[0] <== challenges[6][0];
    cmul_60.inb[1] <== challenges[6][1];
    cmul_60.inb[2] <== challenges[6][2];
    tmp_137[0] <== cmul_60.out[0];
    tmp_137[1] <== cmul_60.out[1];
    tmp_137[2] <== cmul_60.out[2];
    signal tmp_138[3];

    tmp_138[0] <== mapValues.tree4_2 - evals[16][0];
    tmp_138[1] <== -evals[16][1];
    tmp_138[2] <== -evals[16][2];
    signal tmp_139[3];

    tmp_139[0] <== tmp_137[0] + tmp_138[0];
    tmp_139[1] <== tmp_137[1] + tmp_138[1];
    tmp_139[2] <== tmp_137[2] + tmp_138[2];
    signal tmp_140[3];

    component cmul_61 = CMul();
    cmul_61.ina[0] <== tmp_139[0];
    cmul_61.ina[1] <== tmp_139[1];
    cmul_61.ina[2] <== tmp_139[2];
    cmul_61.inb[0] <== challenges[6][0];
    cmul_61.inb[1] <== challenges[6][1];
    cmul_61.inb[2] <== challenges[6][2];
    tmp_140[0] <== cmul_61.out[0];
    tmp_140[1] <== cmul_61.out[1];
    tmp_140[2] <== cmul_61.out[2];
    signal tmp_141[3];

    tmp_141[0] <== mapValues.tree1_8 - evals[17][0];
    tmp_141[1] <== -evals[17][1];
    tmp_141[2] <== -evals[17][2];
    signal tmp_142[3];

    tmp_142[0] <== tmp_140[0] + tmp_141[0];
    tmp_142[1] <== tmp_140[1] + tmp_141[1];
    tmp_142[2] <== tmp_140[2] + tmp_141[2];
    signal tmp_143[3];

    component cmul_62 = CMul();
    cmul_62.ina[0] <== tmp_142[0];
    cmul_62.ina[1] <== tmp_142[1];
    cmul_62.ina[2] <== tmp_142[2];
    cmul_62.inb[0] <== challenges[6][0];
    cmul_62.inb[1] <== challenges[6][1];
    cmul_62.inb[2] <== challenges[6][2];
    tmp_143[0] <== cmul_62.out[0];
    tmp_143[1] <== cmul_62.out[1];
    tmp_143[2] <== cmul_62.out[2];
    signal tmp_144[3];

    tmp_144[0] <== mapValues.tree1_9 - evals[18][0];
    tmp_144[1] <== -evals[18][1];
    tmp_144[2] <== -evals[18][2];
    signal tmp_145[3];

    tmp_145[0] <== tmp_143[0] + tmp_144[0];
    tmp_145[1] <== tmp_143[1] + tmp_144[1];
    tmp_145[2] <== tmp_143[2] + tmp_144[2];
    signal tmp_146[3];

    component cmul_63 = CMul();
    cmul_63.ina[0] <== tmp_145[0];
    cmul_63.ina[1] <== tmp_145[1];
    cmul_63.ina[2] <== tmp_145[2];
    cmul_63.inb[0] <== challenges[6][0];
    cmul_63.inb[1] <== challenges[6][1];
    cmul_63.inb[2] <== challenges[6][2];
    tmp_146[0] <== cmul_63.out[0];
    tmp_146[1] <== cmul_63.out[1];
    tmp_146[2] <== cmul_63.out[2];
    signal tmp_147[3];

    tmp_147[0] <== mapValues.tree1_10 - evals[19][0];
    tmp_147[1] <== -evals[19][1];
    tmp_147[2] <== -evals[19][2];
    signal tmp_148[3];

    tmp_148[0] <== tmp_146[0] + tmp_147[0];
    tmp_148[1] <== tmp_146[1] + tmp_147[1];
    tmp_148[2] <== tmp_146[2] + tmp_147[2];
    signal tmp_149[3];

    component cmul_64 = CMul();
    cmul_64.ina[0] <== tmp_148[0];
    cmul_64.ina[1] <== tmp_148[1];
    cmul_64.ina[2] <== tmp_148[2];
    cmul_64.inb[0] <== challenges[6][0];
    cmul_64.inb[1] <== challenges[6][1];
    cmul_64.inb[2] <== challenges[6][2];
    tmp_149[0] <== cmul_64.out[0];
    tmp_149[1] <== cmul_64.out[1];
    tmp_149[2] <== cmul_64.out[2];
    signal tmp_150[3];

    tmp_150[0] <== mapValues.tree4_3 - evals[20][0];
    tmp_150[1] <== -evals[20][1];
    tmp_150[2] <== -evals[20][2];
    signal tmp_151[3];

    tmp_151[0] <== tmp_149[0] + tmp_150[0];
    tmp_151[1] <== tmp_149[1] + tmp_150[1];
    tmp_151[2] <== tmp_149[2] + tmp_150[2];
    signal tmp_152[3];

    component cmul_65 = CMul();
    cmul_65.ina[0] <== tmp_151[0];
    cmul_65.ina[1] <== tmp_151[1];
    cmul_65.ina[2] <== tmp_151[2];
    cmul_65.inb[0] <== challenges[6][0];
    cmul_65.inb[1] <== challenges[6][1];
    cmul_65.inb[2] <== challenges[6][2];
    tmp_152[0] <== cmul_65.out[0];
    tmp_152[1] <== cmul_65.out[1];
    tmp_152[2] <== cmul_65.out[2];
    signal tmp_153[3];

    tmp_153[0] <== mapValues.tree1_11 - evals[21][0];
    tmp_153[1] <== -evals[21][1];
    tmp_153[2] <== -evals[21][2];
    signal tmp_154[3];

    tmp_154[0] <== tmp_152[0] + tmp_153[0];
    tmp_154[1] <== tmp_152[1] + tmp_153[1];
    tmp_154[2] <== tmp_152[2] + tmp_153[2];
    signal tmp_155[3];

    component cmul_66 = CMul();
    cmul_66.ina[0] <== tmp_154[0];
    cmul_66.ina[1] <== tmp_154[1];
    cmul_66.ina[2] <== tmp_154[2];
    cmul_66.inb[0] <== challenges[6][0];
    cmul_66.inb[1] <== challenges[6][1];
    cmul_66.inb[2] <== challenges[6][2];
    tmp_155[0] <== cmul_66.out[0];
    tmp_155[1] <== cmul_66.out[1];
    tmp_155[2] <== cmul_66.out[2];
    signal tmp_156[3];

    tmp_156[0] <== consts[18] - evals[23][0];
    tmp_156[1] <== -evals[23][1];
    tmp_156[2] <== -evals[23][2];
    signal tmp_157[3];

    tmp_157[0] <== tmp_155[0] + tmp_156[0];
    tmp_157[1] <== tmp_155[1] + tmp_156[1];
    tmp_157[2] <== tmp_155[2] + tmp_156[2];
    signal tmp_158[3];

    component cmul_67 = CMul();
    cmul_67.ina[0] <== tmp_157[0];
    cmul_67.ina[1] <== tmp_157[1];
    cmul_67.ina[2] <== tmp_157[2];
    cmul_67.inb[0] <== challenges[6][0];
    cmul_67.inb[1] <== challenges[6][1];
    cmul_67.inb[2] <== challenges[6][2];
    tmp_158[0] <== cmul_67.out[0];
    tmp_158[1] <== cmul_67.out[1];
    tmp_158[2] <== cmul_67.out[2];
    signal tmp_159[3];

    tmp_159[0] <== mapValues.tree4_4 - evals[35][0];
    tmp_159[1] <== -evals[35][1];
    tmp_159[2] <== -evals[35][2];
    signal tmp_160[3];

    tmp_160[0] <== tmp_158[0] + tmp_159[0];
    tmp_160[1] <== tmp_158[1] + tmp_159[1];
    tmp_160[2] <== tmp_158[2] + tmp_159[2];
    signal tmp_161[3];

    component cmul_68 = CMul();
    cmul_68.ina[0] <== tmp_160[0];
    cmul_68.ina[1] <== tmp_160[1];
    cmul_68.ina[2] <== tmp_160[2];
    cmul_68.inb[0] <== challenges[6][0];
    cmul_68.inb[1] <== challenges[6][1];
    cmul_68.inb[2] <== challenges[6][2];
    tmp_161[0] <== cmul_68.out[0];
    tmp_161[1] <== cmul_68.out[1];
    tmp_161[2] <== cmul_68.out[2];
    signal tmp_162[3];

    tmp_162[0] <== mapValues.tree4_5 - evals[36][0];
    tmp_162[1] <== -evals[36][1];
    tmp_162[2] <== -evals[36][2];
    signal tmp_163[3];

    tmp_163[0] <== tmp_161[0] + tmp_162[0];
    tmp_163[1] <== tmp_161[1] + tmp_162[1];
    tmp_163[2] <== tmp_161[2] + tmp_162[2];
    signal tmp_164[3];

    component cmul_69 = CMul();
    cmul_69.ina[0] <== tmp_163[0];
    cmul_69.ina[1] <== tmp_163[1];
    cmul_69.ina[2] <== tmp_163[2];
    cmul_69.inb[0] <== challenges[6][0];
    cmul_69.inb[1] <== challenges[6][1];
    cmul_69.inb[2] <== challenges[6][2];
    tmp_164[0] <== cmul_69.out[0];
    tmp_164[1] <== cmul_69.out[1];
    tmp_164[2] <== cmul_69.out[2];
    signal tmp_165[3];

    tmp_165[0] <== mapValues.tree4_6 - evals[37][0];
    tmp_165[1] <== -evals[37][1];
    tmp_165[2] <== -evals[37][2];
    signal tmp_166[3];

    tmp_166[0] <== tmp_164[0] + tmp_165[0];
    tmp_166[1] <== tmp_164[1] + tmp_165[1];
    tmp_166[2] <== tmp_164[2] + tmp_165[2];
    signal tmp_167[3];

    component cmul_70 = CMul();
    cmul_70.ina[0] <== tmp_166[0];
    cmul_70.ina[1] <== tmp_166[1];
    cmul_70.ina[2] <== tmp_166[2];
    cmul_70.inb[0] <== challenges[6][0];
    cmul_70.inb[1] <== challenges[6][1];
    cmul_70.inb[2] <== challenges[6][2];
    tmp_167[0] <== cmul_70.out[0];
    tmp_167[1] <== cmul_70.out[1];
    tmp_167[2] <== cmul_70.out[2];
    signal tmp_168[3];

    tmp_168[0] <== mapValues.tree4_7 - evals[38][0];
    tmp_168[1] <== -evals[38][1];
    tmp_168[2] <== -evals[38][2];
    signal tmp_169[3];

    tmp_169[0] <== tmp_167[0] + tmp_168[0];
    tmp_169[1] <== tmp_167[1] + tmp_168[1];
    tmp_169[2] <== tmp_167[2] + tmp_168[2];
    signal tmp_170[3];

    component cmul_71 = CMul();
    cmul_71.ina[0] <== tmp_169[0];
    cmul_71.ina[1] <== tmp_169[1];
    cmul_71.ina[2] <== tmp_169[2];
    cmul_71.inb[0] <== challenges[6][0];
    cmul_71.inb[1] <== challenges[6][1];
    cmul_71.inb[2] <== challenges[6][2];
    tmp_170[0] <== cmul_71.out[0];
    tmp_170[1] <== cmul_71.out[1];
    tmp_170[2] <== cmul_71.out[2];
    signal tmp_171[3];

    tmp_171[0] <== consts[19] - evals[39][0];
    tmp_171[1] <== -evals[39][1];
    tmp_171[2] <== -evals[39][2];
    signal tmp_172[3];

    tmp_172[0] <== tmp_170[0] + tmp_171[0];
    tmp_172[1] <== tmp_170[1] + tmp_171[1];
    tmp_172[2] <== tmp_170[2] + tmp_171[2];
    signal tmp_173[3];

    component cmul_72 = CMul();
    cmul_72.ina[0] <== tmp_172[0];
    cmul_72.ina[1] <== tmp_172[1];
    cmul_72.ina[2] <== tmp_172[2];
    cmul_72.inb[0] <== challenges[6][0];
    cmul_72.inb[1] <== challenges[6][1];
    cmul_72.inb[2] <== challenges[6][2];
    tmp_173[0] <== cmul_72.out[0];
    tmp_173[1] <== cmul_72.out[1];
    tmp_173[2] <== cmul_72.out[2];
    signal tmp_174[3];

    tmp_174[0] <== mapValues.tree4_8 - evals[40][0];
    tmp_174[1] <== -evals[40][1];
    tmp_174[2] <== -evals[40][2];
    signal tmp_175[3];

    tmp_175[0] <== tmp_173[0] + tmp_174[0];
    tmp_175[1] <== tmp_173[1] + tmp_174[1];
    tmp_175[2] <== tmp_173[2] + tmp_174[2];
    signal tmp_176[3];

    component cmul_73 = CMul();
    cmul_73.ina[0] <== tmp_175[0];
    cmul_73.ina[1] <== tmp_175[1];
    cmul_73.ina[2] <== tmp_175[2];
    cmul_73.inb[0] <== challenges[6][0];
    cmul_73.inb[1] <== challenges[6][1];
    cmul_73.inb[2] <== challenges[6][2];
    tmp_176[0] <== cmul_73.out[0];
    tmp_176[1] <== cmul_73.out[1];
    tmp_176[2] <== cmul_73.out[2];
    signal tmp_177[3];

    tmp_177[0] <== mapValues.tree4_9 - evals[41][0];
    tmp_177[1] <== -evals[41][1];
    tmp_177[2] <== -evals[41][2];
    signal tmp_178[3];

    tmp_178[0] <== tmp_176[0] + tmp_177[0];
    tmp_178[1] <== tmp_176[1] + tmp_177[1];
    tmp_178[2] <== tmp_176[2] + tmp_177[2];
    signal tmp_179[3];

    component cmul_74 = CMul();
    cmul_74.ina[0] <== tmp_178[0];
    cmul_74.ina[1] <== tmp_178[1];
    cmul_74.ina[2] <== tmp_178[2];
    cmul_74.inb[0] <== challenges[6][0];
    cmul_74.inb[1] <== challenges[6][1];
    cmul_74.inb[2] <== challenges[6][2];
    tmp_179[0] <== cmul_74.out[0];
    tmp_179[1] <== cmul_74.out[1];
    tmp_179[2] <== cmul_74.out[2];
    signal tmp_180[3];

    tmp_180[0] <== mapValues.tree3_0[0] - evals[42][0];
    tmp_180[1] <== mapValues.tree3_0[1] - evals[42][1];
    tmp_180[2] <== mapValues.tree3_0[2] - evals[42][2];
    signal tmp_181[3];

    tmp_181[0] <== tmp_179[0] + tmp_180[0];
    tmp_181[1] <== tmp_179[1] + tmp_180[1];
    tmp_181[2] <== tmp_179[2] + tmp_180[2];
    signal tmp_182[3];

    component cmul_75 = CMul();
    cmul_75.ina[0] <== tmp_181[0];
    cmul_75.ina[1] <== tmp_181[1];
    cmul_75.ina[2] <== tmp_181[2];
    cmul_75.inb[0] <== challenges[6][0];
    cmul_75.inb[1] <== challenges[6][1];
    cmul_75.inb[2] <== challenges[6][2];
    tmp_182[0] <== cmul_75.out[0];
    tmp_182[1] <== cmul_75.out[1];
    tmp_182[2] <== cmul_75.out[2];
    signal tmp_183[3];

    tmp_183[0] <== consts[1] - evals[43][0];
    tmp_183[1] <== -evals[43][1];
    tmp_183[2] <== -evals[43][2];
    signal tmp_184[3];

    tmp_184[0] <== tmp_182[0] + tmp_183[0];
    tmp_184[1] <== tmp_182[1] + tmp_183[1];
    tmp_184[2] <== tmp_182[2] + tmp_183[2];
    signal tmp_185[3];

    component cmul_76 = CMul();
    cmul_76.ina[0] <== tmp_184[0];
    cmul_76.ina[1] <== tmp_184[1];
    cmul_76.ina[2] <== tmp_184[2];
    cmul_76.inb[0] <== challenges[6][0];
    cmul_76.inb[1] <== challenges[6][1];
    cmul_76.inb[2] <== challenges[6][2];
    tmp_185[0] <== cmul_76.out[0];
    tmp_185[1] <== cmul_76.out[1];
    tmp_185[2] <== cmul_76.out[2];
    signal tmp_186[3];

    tmp_186[0] <== consts[2] - evals[44][0];
    tmp_186[1] <== -evals[44][1];
    tmp_186[2] <== -evals[44][2];
    signal tmp_187[3];

    tmp_187[0] <== tmp_185[0] + tmp_186[0];
    tmp_187[1] <== tmp_185[1] + tmp_186[1];
    tmp_187[2] <== tmp_185[2] + tmp_186[2];
    signal tmp_188[3];

    component cmul_77 = CMul();
    cmul_77.ina[0] <== tmp_187[0];
    cmul_77.ina[1] <== tmp_187[1];
    cmul_77.ina[2] <== tmp_187[2];
    cmul_77.inb[0] <== challenges[6][0];
    cmul_77.inb[1] <== challenges[6][1];
    cmul_77.inb[2] <== challenges[6][2];
    tmp_188[0] <== cmul_77.out[0];
    tmp_188[1] <== cmul_77.out[1];
    tmp_188[2] <== cmul_77.out[2];
    signal tmp_189[3];

    tmp_189[0] <== mapValues.tree4_11[0] - evals[45][0];
    tmp_189[1] <== mapValues.tree4_11[1] - evals[45][1];
    tmp_189[2] <== mapValues.tree4_11[2] - evals[45][2];
    signal tmp_190[3];

    tmp_190[0] <== tmp_188[0] + tmp_189[0];
    tmp_190[1] <== tmp_188[1] + tmp_189[1];
    tmp_190[2] <== tmp_188[2] + tmp_189[2];
    signal tmp_191[3];

    component cmul_78 = CMul();
    cmul_78.ina[0] <== tmp_190[0];
    cmul_78.ina[1] <== tmp_190[1];
    cmul_78.ina[2] <== tmp_190[2];
    cmul_78.inb[0] <== challenges[6][0];
    cmul_78.inb[1] <== challenges[6][1];
    cmul_78.inb[2] <== challenges[6][2];
    tmp_191[0] <== cmul_78.out[0];
    tmp_191[1] <== cmul_78.out[1];
    tmp_191[2] <== cmul_78.out[2];
    signal tmp_192[3];

    tmp_192[0] <== consts[3] - evals[46][0];
    tmp_192[1] <== -evals[46][1];
    tmp_192[2] <== -evals[46][2];
    signal tmp_193[3];

    tmp_193[0] <== tmp_191[0] + tmp_192[0];
    tmp_193[1] <== tmp_191[1] + tmp_192[1];
    tmp_193[2] <== tmp_191[2] + tmp_192[2];
    signal tmp_194[3];

    component cmul_79 = CMul();
    cmul_79.ina[0] <== tmp_193[0];
    cmul_79.ina[1] <== tmp_193[1];
    cmul_79.ina[2] <== tmp_193[2];
    cmul_79.inb[0] <== challenges[6][0];
    cmul_79.inb[1] <== challenges[6][1];
    cmul_79.inb[2] <== challenges[6][2];
    tmp_194[0] <== cmul_79.out[0];
    tmp_194[1] <== cmul_79.out[1];
    tmp_194[2] <== cmul_79.out[2];
    signal tmp_195[3];

    tmp_195[0] <== mapValues.tree4_13[0] - evals[47][0];
    tmp_195[1] <== mapValues.tree4_13[1] - evals[47][1];
    tmp_195[2] <== mapValues.tree4_13[2] - evals[47][2];
    signal tmp_196[3];

    tmp_196[0] <== tmp_194[0] + tmp_195[0];
    tmp_196[1] <== tmp_194[1] + tmp_195[1];
    tmp_196[2] <== tmp_194[2] + tmp_195[2];
    signal tmp_197[3];

    component cmul_80 = CMul();
    cmul_80.ina[0] <== tmp_196[0];
    cmul_80.ina[1] <== tmp_196[1];
    cmul_80.ina[2] <== tmp_196[2];
    cmul_80.inb[0] <== challenges[6][0];
    cmul_80.inb[1] <== challenges[6][1];
    cmul_80.inb[2] <== challenges[6][2];
    tmp_197[0] <== cmul_80.out[0];
    tmp_197[1] <== cmul_80.out[1];
    tmp_197[2] <== cmul_80.out[2];
    signal tmp_198[3];

    tmp_198[0] <== consts[4] - evals[48][0];
    tmp_198[1] <== -evals[48][1];
    tmp_198[2] <== -evals[48][2];
    signal tmp_199[3];

    tmp_199[0] <== tmp_197[0] + tmp_198[0];
    tmp_199[1] <== tmp_197[1] + tmp_198[1];
    tmp_199[2] <== tmp_197[2] + tmp_198[2];
    signal tmp_200[3];

    component cmul_81 = CMul();
    cmul_81.ina[0] <== tmp_199[0];
    cmul_81.ina[1] <== tmp_199[1];
    cmul_81.ina[2] <== tmp_199[2];
    cmul_81.inb[0] <== challenges[6][0];
    cmul_81.inb[1] <== challenges[6][1];
    cmul_81.inb[2] <== challenges[6][2];
    tmp_200[0] <== cmul_81.out[0];
    tmp_200[1] <== cmul_81.out[1];
    tmp_200[2] <== cmul_81.out[2];
    signal tmp_201[3];

    tmp_201[0] <== mapValues.tree4_15[0] - evals[49][0];
    tmp_201[1] <== mapValues.tree4_15[1] - evals[49][1];
    tmp_201[2] <== mapValues.tree4_15[2] - evals[49][2];
    signal tmp_202[3];

    tmp_202[0] <== tmp_200[0] + tmp_201[0];
    tmp_202[1] <== tmp_200[1] + tmp_201[1];
    tmp_202[2] <== tmp_200[2] + tmp_201[2];
    signal tmp_203[3];

    component cmul_82 = CMul();
    cmul_82.ina[0] <== tmp_202[0];
    cmul_82.ina[1] <== tmp_202[1];
    cmul_82.ina[2] <== tmp_202[2];
    cmul_82.inb[0] <== challenges[6][0];
    cmul_82.inb[1] <== challenges[6][1];
    cmul_82.inb[2] <== challenges[6][2];
    tmp_203[0] <== cmul_82.out[0];
    tmp_203[1] <== cmul_82.out[1];
    tmp_203[2] <== cmul_82.out[2];
    signal tmp_204[3];

    tmp_204[0] <== consts[5] - evals[50][0];
    tmp_204[1] <== -evals[50][1];
    tmp_204[2] <== -evals[50][2];
    signal tmp_205[3];

    tmp_205[0] <== tmp_203[0] + tmp_204[0];
    tmp_205[1] <== tmp_203[1] + tmp_204[1];
    tmp_205[2] <== tmp_203[2] + tmp_204[2];
    signal tmp_206[3];

    component cmul_83 = CMul();
    cmul_83.ina[0] <== tmp_205[0];
    cmul_83.ina[1] <== tmp_205[1];
    cmul_83.ina[2] <== tmp_205[2];
    cmul_83.inb[0] <== challenges[6][0];
    cmul_83.inb[1] <== challenges[6][1];
    cmul_83.inb[2] <== challenges[6][2];
    tmp_206[0] <== cmul_83.out[0];
    tmp_206[1] <== cmul_83.out[1];
    tmp_206[2] <== cmul_83.out[2];
    signal tmp_207[3];

    tmp_207[0] <== mapValues.tree4_17[0] - evals[51][0];
    tmp_207[1] <== mapValues.tree4_17[1] - evals[51][1];
    tmp_207[2] <== mapValues.tree4_17[2] - evals[51][2];
    signal tmp_208[3];

    tmp_208[0] <== tmp_206[0] + tmp_207[0];
    tmp_208[1] <== tmp_206[1] + tmp_207[1];
    tmp_208[2] <== tmp_206[2] + tmp_207[2];
    signal tmp_209[3];

    component cmul_84 = CMul();
    cmul_84.ina[0] <== tmp_208[0];
    cmul_84.ina[1] <== tmp_208[1];
    cmul_84.ina[2] <== tmp_208[2];
    cmul_84.inb[0] <== challenges[6][0];
    cmul_84.inb[1] <== challenges[6][1];
    cmul_84.inb[2] <== challenges[6][2];
    tmp_209[0] <== cmul_84.out[0];
    tmp_209[1] <== cmul_84.out[1];
    tmp_209[2] <== cmul_84.out[2];
    signal tmp_210[3];

    tmp_210[0] <== consts[6] - evals[52][0];
    tmp_210[1] <== -evals[52][1];
    tmp_210[2] <== -evals[52][2];
    signal tmp_211[3];

    tmp_211[0] <== tmp_209[0] + tmp_210[0];
    tmp_211[1] <== tmp_209[1] + tmp_210[1];
    tmp_211[2] <== tmp_209[2] + tmp_210[2];
    signal tmp_212[3];

    component cmul_85 = CMul();
    cmul_85.ina[0] <== tmp_211[0];
    cmul_85.ina[1] <== tmp_211[1];
    cmul_85.ina[2] <== tmp_211[2];
    cmul_85.inb[0] <== challenges[6][0];
    cmul_85.inb[1] <== challenges[6][1];
    cmul_85.inb[2] <== challenges[6][2];
    tmp_212[0] <== cmul_85.out[0];
    tmp_212[1] <== cmul_85.out[1];
    tmp_212[2] <== cmul_85.out[2];
    signal tmp_213[3];

    tmp_213[0] <== mapValues.tree4_19[0] - evals[53][0];
    tmp_213[1] <== mapValues.tree4_19[1] - evals[53][1];
    tmp_213[2] <== mapValues.tree4_19[2] - evals[53][2];
    signal tmp_214[3];

    tmp_214[0] <== tmp_212[0] + tmp_213[0];
    tmp_214[1] <== tmp_212[1] + tmp_213[1];
    tmp_214[2] <== tmp_212[2] + tmp_213[2];
    signal tmp_215[3];

    component cmul_86 = CMul();
    cmul_86.ina[0] <== tmp_214[0];
    cmul_86.ina[1] <== tmp_214[1];
    cmul_86.ina[2] <== tmp_214[2];
    cmul_86.inb[0] <== challenges[6][0];
    cmul_86.inb[1] <== challenges[6][1];
    cmul_86.inb[2] <== challenges[6][2];
    tmp_215[0] <== cmul_86.out[0];
    tmp_215[1] <== cmul_86.out[1];
    tmp_215[2] <== cmul_86.out[2];
    signal tmp_216[3];

    tmp_216[0] <== consts[7] - evals[54][0];
    tmp_216[1] <== -evals[54][1];
    tmp_216[2] <== -evals[54][2];
    signal tmp_217[3];

    tmp_217[0] <== tmp_215[0] + tmp_216[0];
    tmp_217[1] <== tmp_215[1] + tmp_216[1];
    tmp_217[2] <== tmp_215[2] + tmp_216[2];
    signal tmp_218[3];

    component cmul_87 = CMul();
    cmul_87.ina[0] <== tmp_217[0];
    cmul_87.ina[1] <== tmp_217[1];
    cmul_87.ina[2] <== tmp_217[2];
    cmul_87.inb[0] <== challenges[6][0];
    cmul_87.inb[1] <== challenges[6][1];
    cmul_87.inb[2] <== challenges[6][2];
    tmp_218[0] <== cmul_87.out[0];
    tmp_218[1] <== cmul_87.out[1];
    tmp_218[2] <== cmul_87.out[2];
    signal tmp_219[3];

    tmp_219[0] <== mapValues.tree4_21[0] - evals[55][0];
    tmp_219[1] <== mapValues.tree4_21[1] - evals[55][1];
    tmp_219[2] <== mapValues.tree4_21[2] - evals[55][2];
    signal tmp_220[3];

    tmp_220[0] <== tmp_218[0] + tmp_219[0];
    tmp_220[1] <== tmp_218[1] + tmp_219[1];
    tmp_220[2] <== tmp_218[2] + tmp_219[2];
    signal tmp_221[3];

    component cmul_88 = CMul();
    cmul_88.ina[0] <== tmp_220[0];
    cmul_88.ina[1] <== tmp_220[1];
    cmul_88.ina[2] <== tmp_220[2];
    cmul_88.inb[0] <== challenges[6][0];
    cmul_88.inb[1] <== challenges[6][1];
    cmul_88.inb[2] <== challenges[6][2];
    tmp_221[0] <== cmul_88.out[0];
    tmp_221[1] <== cmul_88.out[1];
    tmp_221[2] <== cmul_88.out[2];
    signal tmp_222[3];

    tmp_222[0] <== consts[8] - evals[56][0];
    tmp_222[1] <== -evals[56][1];
    tmp_222[2] <== -evals[56][2];
    signal tmp_223[3];

    tmp_223[0] <== tmp_221[0] + tmp_222[0];
    tmp_223[1] <== tmp_221[1] + tmp_222[1];
    tmp_223[2] <== tmp_221[2] + tmp_222[2];
    signal tmp_224[3];

    component cmul_89 = CMul();
    cmul_89.ina[0] <== tmp_223[0];
    cmul_89.ina[1] <== tmp_223[1];
    cmul_89.ina[2] <== tmp_223[2];
    cmul_89.inb[0] <== challenges[6][0];
    cmul_89.inb[1] <== challenges[6][1];
    cmul_89.inb[2] <== challenges[6][2];
    tmp_224[0] <== cmul_89.out[0];
    tmp_224[1] <== cmul_89.out[1];
    tmp_224[2] <== cmul_89.out[2];
    signal tmp_225[3];

    tmp_225[0] <== mapValues.tree4_23[0] - evals[57][0];
    tmp_225[1] <== mapValues.tree4_23[1] - evals[57][1];
    tmp_225[2] <== mapValues.tree4_23[2] - evals[57][2];
    signal tmp_226[3];

    tmp_226[0] <== tmp_224[0] + tmp_225[0];
    tmp_226[1] <== tmp_224[1] + tmp_225[1];
    tmp_226[2] <== tmp_224[2] + tmp_225[2];
    signal tmp_227[3];

    component cmul_90 = CMul();
    cmul_90.ina[0] <== tmp_226[0];
    cmul_90.ina[1] <== tmp_226[1];
    cmul_90.ina[2] <== tmp_226[2];
    cmul_90.inb[0] <== challenges[6][0];
    cmul_90.inb[1] <== challenges[6][1];
    cmul_90.inb[2] <== challenges[6][2];
    tmp_227[0] <== cmul_90.out[0];
    tmp_227[1] <== cmul_90.out[1];
    tmp_227[2] <== cmul_90.out[2];
    signal tmp_228[3];

    tmp_228[0] <== consts[9] - evals[58][0];
    tmp_228[1] <== -evals[58][1];
    tmp_228[2] <== -evals[58][2];
    signal tmp_229[3];

    tmp_229[0] <== tmp_227[0] + tmp_228[0];
    tmp_229[1] <== tmp_227[1] + tmp_228[1];
    tmp_229[2] <== tmp_227[2] + tmp_228[2];
    signal tmp_230[3];

    component cmul_91 = CMul();
    cmul_91.ina[0] <== tmp_229[0];
    cmul_91.ina[1] <== tmp_229[1];
    cmul_91.ina[2] <== tmp_229[2];
    cmul_91.inb[0] <== challenges[6][0];
    cmul_91.inb[1] <== challenges[6][1];
    cmul_91.inb[2] <== challenges[6][2];
    tmp_230[0] <== cmul_91.out[0];
    tmp_230[1] <== cmul_91.out[1];
    tmp_230[2] <== cmul_91.out[2];
    signal tmp_231[3];

    tmp_231[0] <== mapValues.tree4_25[0] - evals[59][0];
    tmp_231[1] <== mapValues.tree4_25[1] - evals[59][1];
    tmp_231[2] <== mapValues.tree4_25[2] - evals[59][2];
    signal tmp_232[3];

    tmp_232[0] <== tmp_230[0] + tmp_231[0];
    tmp_232[1] <== tmp_230[1] + tmp_231[1];
    tmp_232[2] <== tmp_230[2] + tmp_231[2];
    signal tmp_233[3];

    component cmul_92 = CMul();
    cmul_92.ina[0] <== tmp_232[0];
    cmul_92.ina[1] <== tmp_232[1];
    cmul_92.ina[2] <== tmp_232[2];
    cmul_92.inb[0] <== challenges[6][0];
    cmul_92.inb[1] <== challenges[6][1];
    cmul_92.inb[2] <== challenges[6][2];
    tmp_233[0] <== cmul_92.out[0];
    tmp_233[1] <== cmul_92.out[1];
    tmp_233[2] <== cmul_92.out[2];
    signal tmp_234[3];

    tmp_234[0] <== consts[10] - evals[60][0];
    tmp_234[1] <== -evals[60][1];
    tmp_234[2] <== -evals[60][2];
    signal tmp_235[3];

    tmp_235[0] <== tmp_233[0] + tmp_234[0];
    tmp_235[1] <== tmp_233[1] + tmp_234[1];
    tmp_235[2] <== tmp_233[2] + tmp_234[2];
    signal tmp_236[3];

    component cmul_93 = CMul();
    cmul_93.ina[0] <== tmp_235[0];
    cmul_93.ina[1] <== tmp_235[1];
    cmul_93.ina[2] <== tmp_235[2];
    cmul_93.inb[0] <== challenges[6][0];
    cmul_93.inb[1] <== challenges[6][1];
    cmul_93.inb[2] <== challenges[6][2];
    tmp_236[0] <== cmul_93.out[0];
    tmp_236[1] <== cmul_93.out[1];
    tmp_236[2] <== cmul_93.out[2];
    signal tmp_237[3];

    tmp_237[0] <== mapValues.tree4_27[0] - evals[61][0];
    tmp_237[1] <== mapValues.tree4_27[1] - evals[61][1];
    tmp_237[2] <== mapValues.tree4_27[2] - evals[61][2];
    signal tmp_238[3];

    tmp_238[0] <== tmp_236[0] + tmp_237[0];
    tmp_238[1] <== tmp_236[1] + tmp_237[1];
    tmp_238[2] <== tmp_236[2] + tmp_237[2];
    signal tmp_239[3];

    component cmul_94 = CMul();
    cmul_94.ina[0] <== tmp_238[0];
    cmul_94.ina[1] <== tmp_238[1];
    cmul_94.ina[2] <== tmp_238[2];
    cmul_94.inb[0] <== challenges[6][0];
    cmul_94.inb[1] <== challenges[6][1];
    cmul_94.inb[2] <== challenges[6][2];
    tmp_239[0] <== cmul_94.out[0];
    tmp_239[1] <== cmul_94.out[1];
    tmp_239[2] <== cmul_94.out[2];
    signal tmp_240[3];

    tmp_240[0] <== consts[11] - evals[62][0];
    tmp_240[1] <== -evals[62][1];
    tmp_240[2] <== -evals[62][2];
    signal tmp_241[3];

    tmp_241[0] <== tmp_239[0] + tmp_240[0];
    tmp_241[1] <== tmp_239[1] + tmp_240[1];
    tmp_241[2] <== tmp_239[2] + tmp_240[2];
    signal tmp_242[3];

    component cmul_95 = CMul();
    cmul_95.ina[0] <== tmp_241[0];
    cmul_95.ina[1] <== tmp_241[1];
    cmul_95.ina[2] <== tmp_241[2];
    cmul_95.inb[0] <== challenges[6][0];
    cmul_95.inb[1] <== challenges[6][1];
    cmul_95.inb[2] <== challenges[6][2];
    tmp_242[0] <== cmul_95.out[0];
    tmp_242[1] <== cmul_95.out[1];
    tmp_242[2] <== cmul_95.out[2];
    signal tmp_243[3];

    tmp_243[0] <== mapValues.tree4_29[0] - evals[63][0];
    tmp_243[1] <== mapValues.tree4_29[1] - evals[63][1];
    tmp_243[2] <== mapValues.tree4_29[2] - evals[63][2];
    signal tmp_244[3];

    tmp_244[0] <== tmp_242[0] + tmp_243[0];
    tmp_244[1] <== tmp_242[1] + tmp_243[1];
    tmp_244[2] <== tmp_242[2] + tmp_243[2];
    signal tmp_245[3];

    component cmul_96 = CMul();
    cmul_96.ina[0] <== tmp_244[0];
    cmul_96.ina[1] <== tmp_244[1];
    cmul_96.ina[2] <== tmp_244[2];
    cmul_96.inb[0] <== challenges[6][0];
    cmul_96.inb[1] <== challenges[6][1];
    cmul_96.inb[2] <== challenges[6][2];
    tmp_245[0] <== cmul_96.out[0];
    tmp_245[1] <== cmul_96.out[1];
    tmp_245[2] <== cmul_96.out[2];
    signal tmp_246[3];

    tmp_246[0] <== consts[12] - evals[64][0];
    tmp_246[1] <== -evals[64][1];
    tmp_246[2] <== -evals[64][2];
    signal tmp_247[3];

    tmp_247[0] <== tmp_245[0] + tmp_246[0];
    tmp_247[1] <== tmp_245[1] + tmp_246[1];
    tmp_247[2] <== tmp_245[2] + tmp_246[2];
    signal tmp_248[3];

    component cmul_97 = CMul();
    cmul_97.ina[0] <== tmp_247[0];
    cmul_97.ina[1] <== tmp_247[1];
    cmul_97.ina[2] <== tmp_247[2];
    cmul_97.inb[0] <== challenges[6][0];
    cmul_97.inb[1] <== challenges[6][1];
    cmul_97.inb[2] <== challenges[6][2];
    tmp_248[0] <== cmul_97.out[0];
    tmp_248[1] <== cmul_97.out[1];
    tmp_248[2] <== cmul_97.out[2];
    signal tmp_249[3];

    tmp_249[0] <== mapValues.tree4_31[0] - evals[65][0];
    tmp_249[1] <== mapValues.tree4_31[1] - evals[65][1];
    tmp_249[2] <== mapValues.tree4_31[2] - evals[65][2];
    signal tmp_250[3];

    tmp_250[0] <== tmp_248[0] + tmp_249[0];
    tmp_250[1] <== tmp_248[1] + tmp_249[1];
    tmp_250[2] <== tmp_248[2] + tmp_249[2];
    signal tmp_251[3];

    component cmul_98 = CMul();
    cmul_98.ina[0] <== tmp_250[0];
    cmul_98.ina[1] <== tmp_250[1];
    cmul_98.ina[2] <== tmp_250[2];
    cmul_98.inb[0] <== challenges[6][0];
    cmul_98.inb[1] <== challenges[6][1];
    cmul_98.inb[2] <== challenges[6][2];
    tmp_251[0] <== cmul_98.out[0];
    tmp_251[1] <== cmul_98.out[1];
    tmp_251[2] <== cmul_98.out[2];
    signal tmp_252[3];

    tmp_252[0] <== mapValues.tree4_10[0] - evals[66][0];
    tmp_252[1] <== mapValues.tree4_10[1] - evals[66][1];
    tmp_252[2] <== mapValues.tree4_10[2] - evals[66][2];
    signal tmp_253[3];

    tmp_253[0] <== tmp_251[0] + tmp_252[0];
    tmp_253[1] <== tmp_251[1] + tmp_252[1];
    tmp_253[2] <== tmp_251[2] + tmp_252[2];
    signal tmp_254[3];

    component cmul_99 = CMul();
    cmul_99.ina[0] <== tmp_253[0];
    cmul_99.ina[1] <== tmp_253[1];
    cmul_99.ina[2] <== tmp_253[2];
    cmul_99.inb[0] <== challenges[6][0];
    cmul_99.inb[1] <== challenges[6][1];
    cmul_99.inb[2] <== challenges[6][2];
    tmp_254[0] <== cmul_99.out[0];
    tmp_254[1] <== cmul_99.out[1];
    tmp_254[2] <== cmul_99.out[2];
    signal tmp_255[3];

    tmp_255[0] <== mapValues.tree4_12[0] - evals[67][0];
    tmp_255[1] <== mapValues.tree4_12[1] - evals[67][1];
    tmp_255[2] <== mapValues.tree4_12[2] - evals[67][2];
    signal tmp_256[3];

    tmp_256[0] <== tmp_254[0] + tmp_255[0];
    tmp_256[1] <== tmp_254[1] + tmp_255[1];
    tmp_256[2] <== tmp_254[2] + tmp_255[2];
    signal tmp_257[3];

    component cmul_100 = CMul();
    cmul_100.ina[0] <== tmp_256[0];
    cmul_100.ina[1] <== tmp_256[1];
    cmul_100.ina[2] <== tmp_256[2];
    cmul_100.inb[0] <== challenges[6][0];
    cmul_100.inb[1] <== challenges[6][1];
    cmul_100.inb[2] <== challenges[6][2];
    tmp_257[0] <== cmul_100.out[0];
    tmp_257[1] <== cmul_100.out[1];
    tmp_257[2] <== cmul_100.out[2];
    signal tmp_258[3];

    tmp_258[0] <== mapValues.tree4_14[0] - evals[68][0];
    tmp_258[1] <== mapValues.tree4_14[1] - evals[68][1];
    tmp_258[2] <== mapValues.tree4_14[2] - evals[68][2];
    signal tmp_259[3];

    tmp_259[0] <== tmp_257[0] + tmp_258[0];
    tmp_259[1] <== tmp_257[1] + tmp_258[1];
    tmp_259[2] <== tmp_257[2] + tmp_258[2];
    signal tmp_260[3];

    component cmul_101 = CMul();
    cmul_101.ina[0] <== tmp_259[0];
    cmul_101.ina[1] <== tmp_259[1];
    cmul_101.ina[2] <== tmp_259[2];
    cmul_101.inb[0] <== challenges[6][0];
    cmul_101.inb[1] <== challenges[6][1];
    cmul_101.inb[2] <== challenges[6][2];
    tmp_260[0] <== cmul_101.out[0];
    tmp_260[1] <== cmul_101.out[1];
    tmp_260[2] <== cmul_101.out[2];
    signal tmp_261[3];

    tmp_261[0] <== mapValues.tree4_16[0] - evals[69][0];
    tmp_261[1] <== mapValues.tree4_16[1] - evals[69][1];
    tmp_261[2] <== mapValues.tree4_16[2] - evals[69][2];
    signal tmp_262[3];

    tmp_262[0] <== tmp_260[0] + tmp_261[0];
    tmp_262[1] <== tmp_260[1] + tmp_261[1];
    tmp_262[2] <== tmp_260[2] + tmp_261[2];
    signal tmp_263[3];

    component cmul_102 = CMul();
    cmul_102.ina[0] <== tmp_262[0];
    cmul_102.ina[1] <== tmp_262[1];
    cmul_102.ina[2] <== tmp_262[2];
    cmul_102.inb[0] <== challenges[6][0];
    cmul_102.inb[1] <== challenges[6][1];
    cmul_102.inb[2] <== challenges[6][2];
    tmp_263[0] <== cmul_102.out[0];
    tmp_263[1] <== cmul_102.out[1];
    tmp_263[2] <== cmul_102.out[2];
    signal tmp_264[3];

    tmp_264[0] <== mapValues.tree4_18[0] - evals[70][0];
    tmp_264[1] <== mapValues.tree4_18[1] - evals[70][1];
    tmp_264[2] <== mapValues.tree4_18[2] - evals[70][2];
    signal tmp_265[3];

    tmp_265[0] <== tmp_263[0] + tmp_264[0];
    tmp_265[1] <== tmp_263[1] + tmp_264[1];
    tmp_265[2] <== tmp_263[2] + tmp_264[2];
    signal tmp_266[3];

    component cmul_103 = CMul();
    cmul_103.ina[0] <== tmp_265[0];
    cmul_103.ina[1] <== tmp_265[1];
    cmul_103.ina[2] <== tmp_265[2];
    cmul_103.inb[0] <== challenges[6][0];
    cmul_103.inb[1] <== challenges[6][1];
    cmul_103.inb[2] <== challenges[6][2];
    tmp_266[0] <== cmul_103.out[0];
    tmp_266[1] <== cmul_103.out[1];
    tmp_266[2] <== cmul_103.out[2];
    signal tmp_267[3];

    tmp_267[0] <== mapValues.tree4_20[0] - evals[71][0];
    tmp_267[1] <== mapValues.tree4_20[1] - evals[71][1];
    tmp_267[2] <== mapValues.tree4_20[2] - evals[71][2];
    signal tmp_268[3];

    tmp_268[0] <== tmp_266[0] + tmp_267[0];
    tmp_268[1] <== tmp_266[1] + tmp_267[1];
    tmp_268[2] <== tmp_266[2] + tmp_267[2];
    signal tmp_269[3];

    component cmul_104 = CMul();
    cmul_104.ina[0] <== tmp_268[0];
    cmul_104.ina[1] <== tmp_268[1];
    cmul_104.ina[2] <== tmp_268[2];
    cmul_104.inb[0] <== challenges[6][0];
    cmul_104.inb[1] <== challenges[6][1];
    cmul_104.inb[2] <== challenges[6][2];
    tmp_269[0] <== cmul_104.out[0];
    tmp_269[1] <== cmul_104.out[1];
    tmp_269[2] <== cmul_104.out[2];
    signal tmp_270[3];

    tmp_270[0] <== mapValues.tree4_22[0] - evals[72][0];
    tmp_270[1] <== mapValues.tree4_22[1] - evals[72][1];
    tmp_270[2] <== mapValues.tree4_22[2] - evals[72][2];
    signal tmp_271[3];

    tmp_271[0] <== tmp_269[0] + tmp_270[0];
    tmp_271[1] <== tmp_269[1] + tmp_270[1];
    tmp_271[2] <== tmp_269[2] + tmp_270[2];
    signal tmp_272[3];

    component cmul_105 = CMul();
    cmul_105.ina[0] <== tmp_271[0];
    cmul_105.ina[1] <== tmp_271[1];
    cmul_105.ina[2] <== tmp_271[2];
    cmul_105.inb[0] <== challenges[6][0];
    cmul_105.inb[1] <== challenges[6][1];
    cmul_105.inb[2] <== challenges[6][2];
    tmp_272[0] <== cmul_105.out[0];
    tmp_272[1] <== cmul_105.out[1];
    tmp_272[2] <== cmul_105.out[2];
    signal tmp_273[3];

    tmp_273[0] <== mapValues.tree4_24[0] - evals[73][0];
    tmp_273[1] <== mapValues.tree4_24[1] - evals[73][1];
    tmp_273[2] <== mapValues.tree4_24[2] - evals[73][2];
    signal tmp_274[3];

    tmp_274[0] <== tmp_272[0] + tmp_273[0];
    tmp_274[1] <== tmp_272[1] + tmp_273[1];
    tmp_274[2] <== tmp_272[2] + tmp_273[2];
    signal tmp_275[3];

    component cmul_106 = CMul();
    cmul_106.ina[0] <== tmp_274[0];
    cmul_106.ina[1] <== tmp_274[1];
    cmul_106.ina[2] <== tmp_274[2];
    cmul_106.inb[0] <== challenges[6][0];
    cmul_106.inb[1] <== challenges[6][1];
    cmul_106.inb[2] <== challenges[6][2];
    tmp_275[0] <== cmul_106.out[0];
    tmp_275[1] <== cmul_106.out[1];
    tmp_275[2] <== cmul_106.out[2];
    signal tmp_276[3];

    tmp_276[0] <== mapValues.tree4_26[0] - evals[74][0];
    tmp_276[1] <== mapValues.tree4_26[1] - evals[74][1];
    tmp_276[2] <== mapValues.tree4_26[2] - evals[74][2];
    signal tmp_277[3];

    tmp_277[0] <== tmp_275[0] + tmp_276[0];
    tmp_277[1] <== tmp_275[1] + tmp_276[1];
    tmp_277[2] <== tmp_275[2] + tmp_276[2];
    signal tmp_278[3];

    component cmul_107 = CMul();
    cmul_107.ina[0] <== tmp_277[0];
    cmul_107.ina[1] <== tmp_277[1];
    cmul_107.ina[2] <== tmp_277[2];
    cmul_107.inb[0] <== challenges[6][0];
    cmul_107.inb[1] <== challenges[6][1];
    cmul_107.inb[2] <== challenges[6][2];
    tmp_278[0] <== cmul_107.out[0];
    tmp_278[1] <== cmul_107.out[1];
    tmp_278[2] <== cmul_107.out[2];
    signal tmp_279[3];

    tmp_279[0] <== mapValues.tree4_28[0] - evals[75][0];
    tmp_279[1] <== mapValues.tree4_28[1] - evals[75][1];
    tmp_279[2] <== mapValues.tree4_28[2] - evals[75][2];
    signal tmp_280[3];

    tmp_280[0] <== tmp_278[0] + tmp_279[0];
    tmp_280[1] <== tmp_278[1] + tmp_279[1];
    tmp_280[2] <== tmp_278[2] + tmp_279[2];
    signal tmp_281[3];

    component cmul_108 = CMul();
    cmul_108.ina[0] <== tmp_280[0];
    cmul_108.ina[1] <== tmp_280[1];
    cmul_108.ina[2] <== tmp_280[2];
    cmul_108.inb[0] <== challenges[6][0];
    cmul_108.inb[1] <== challenges[6][1];
    cmul_108.inb[2] <== challenges[6][2];
    tmp_281[0] <== cmul_108.out[0];
    tmp_281[1] <== cmul_108.out[1];
    tmp_281[2] <== cmul_108.out[2];
    signal tmp_282[3];

    tmp_282[0] <== mapValues.tree4_30[0] - evals[76][0];
    tmp_282[1] <== mapValues.tree4_30[1] - evals[76][1];
    tmp_282[2] <== mapValues.tree4_30[2] - evals[76][2];
    signal tmp_283[3];

    tmp_283[0] <== tmp_281[0] + tmp_282[0];
    tmp_283[1] <== tmp_281[1] + tmp_282[1];
    tmp_283[2] <== tmp_281[2] + tmp_282[2];
    signal tmp_284[3];

    component cmul_109 = CMul();
    cmul_109.ina[0] <== tmp_283[0];
    cmul_109.ina[1] <== tmp_283[1];
    cmul_109.ina[2] <== tmp_283[2];
    cmul_109.inb[0] <== challenges[6][0];
    cmul_109.inb[1] <== challenges[6][1];
    cmul_109.inb[2] <== challenges[6][2];
    tmp_284[0] <== cmul_109.out[0];
    tmp_284[1] <== cmul_109.out[1];
    tmp_284[2] <== cmul_109.out[2];
    signal tmp_285[3];

    tmp_285[0] <== mapValues.tree4_32[0] - evals[78][0];
    tmp_285[1] <== mapValues.tree4_32[1] - evals[78][1];
    tmp_285[2] <== mapValues.tree4_32[2] - evals[78][2];
    signal tmp_286[3];

    tmp_286[0] <== tmp_284[0] + tmp_285[0];
    tmp_286[1] <== tmp_284[1] + tmp_285[1];
    tmp_286[2] <== tmp_284[2] + tmp_285[2];
    signal tmp_287[3];

    component cmul_110 = CMul();
    cmul_110.ina[0] <== tmp_286[0];
    cmul_110.ina[1] <== tmp_286[1];
    cmul_110.ina[2] <== tmp_286[2];
    cmul_110.inb[0] <== xDivXSubXi[0];
    cmul_110.inb[1] <== xDivXSubXi[1];
    cmul_110.inb[2] <== xDivXSubXi[2];
    tmp_287[0] <== cmul_110.out[0];
    tmp_287[1] <== cmul_110.out[1];
    tmp_287[2] <== cmul_110.out[2];
    signal tmp_288[3];

    tmp_288[0] <== tmp_90[0] + tmp_287[0];
    tmp_288[1] <== tmp_90[1] + tmp_287[1];
    tmp_288[2] <== tmp_90[2] + tmp_287[2];
    signal tmp_289[3];

    component cmul_111 = CMul();
    cmul_111.ina[0] <== challenges[5][0];
    cmul_111.ina[1] <== challenges[5][1];
    cmul_111.ina[2] <== challenges[5][2];
    cmul_111.inb[0] <== tmp_288[0];
    cmul_111.inb[1] <== tmp_288[1];
    cmul_111.inb[2] <== tmp_288[2];
    tmp_289[0] <== cmul_111.out[0];
    tmp_289[1] <== cmul_111.out[1];
    tmp_289[2] <== cmul_111.out[2];
    signal tmp_290[3];

    tmp_290[0] <== mapValues.tree1_0 - evals[22][0];
    tmp_290[1] <== -evals[22][1];
    tmp_290[2] <== -evals[22][2];
    signal tmp_291[3];

    component cmul_112 = CMul();
    cmul_112.ina[0] <== tmp_290[0];
    cmul_112.ina[1] <== tmp_290[1];
    cmul_112.ina[2] <== tmp_290[2];
    cmul_112.inb[0] <== challenges[6][0];
    cmul_112.inb[1] <== challenges[6][1];
    cmul_112.inb[2] <== challenges[6][2];
    tmp_291[0] <== cmul_112.out[0];
    tmp_291[1] <== cmul_112.out[1];
    tmp_291[2] <== cmul_112.out[2];
    signal tmp_292[3];

    tmp_292[0] <== mapValues.tree1_1 - evals[24][0];
    tmp_292[1] <== -evals[24][1];
    tmp_292[2] <== -evals[24][2];
    signal tmp_293[3];

    tmp_293[0] <== tmp_291[0] + tmp_292[0];
    tmp_293[1] <== tmp_291[1] + tmp_292[1];
    tmp_293[2] <== tmp_291[2] + tmp_292[2];
    signal tmp_294[3];

    component cmul_113 = CMul();
    cmul_113.ina[0] <== tmp_293[0];
    cmul_113.ina[1] <== tmp_293[1];
    cmul_113.ina[2] <== tmp_293[2];
    cmul_113.inb[0] <== challenges[6][0];
    cmul_113.inb[1] <== challenges[6][1];
    cmul_113.inb[2] <== challenges[6][2];
    tmp_294[0] <== cmul_113.out[0];
    tmp_294[1] <== cmul_113.out[1];
    tmp_294[2] <== cmul_113.out[2];
    signal tmp_295[3];

    tmp_295[0] <== mapValues.tree1_2 - evals[25][0];
    tmp_295[1] <== -evals[25][1];
    tmp_295[2] <== -evals[25][2];
    signal tmp_296[3];

    tmp_296[0] <== tmp_294[0] + tmp_295[0];
    tmp_296[1] <== tmp_294[1] + tmp_295[1];
    tmp_296[2] <== tmp_294[2] + tmp_295[2];
    signal tmp_297[3];

    component cmul_114 = CMul();
    cmul_114.ina[0] <== tmp_296[0];
    cmul_114.ina[1] <== tmp_296[1];
    cmul_114.ina[2] <== tmp_296[2];
    cmul_114.inb[0] <== challenges[6][0];
    cmul_114.inb[1] <== challenges[6][1];
    cmul_114.inb[2] <== challenges[6][2];
    tmp_297[0] <== cmul_114.out[0];
    tmp_297[1] <== cmul_114.out[1];
    tmp_297[2] <== cmul_114.out[2];
    signal tmp_298[3];

    tmp_298[0] <== mapValues.tree1_3 - evals[26][0];
    tmp_298[1] <== -evals[26][1];
    tmp_298[2] <== -evals[26][2];
    signal tmp_299[3];

    tmp_299[0] <== tmp_297[0] + tmp_298[0];
    tmp_299[1] <== tmp_297[1] + tmp_298[1];
    tmp_299[2] <== tmp_297[2] + tmp_298[2];
    signal tmp_300[3];

    component cmul_115 = CMul();
    cmul_115.ina[0] <== tmp_299[0];
    cmul_115.ina[1] <== tmp_299[1];
    cmul_115.ina[2] <== tmp_299[2];
    cmul_115.inb[0] <== challenges[6][0];
    cmul_115.inb[1] <== challenges[6][1];
    cmul_115.inb[2] <== challenges[6][2];
    tmp_300[0] <== cmul_115.out[0];
    tmp_300[1] <== cmul_115.out[1];
    tmp_300[2] <== cmul_115.out[2];
    signal tmp_301[3];

    tmp_301[0] <== mapValues.tree1_4 - evals[27][0];
    tmp_301[1] <== -evals[27][1];
    tmp_301[2] <== -evals[27][2];
    signal tmp_302[3];

    tmp_302[0] <== tmp_300[0] + tmp_301[0];
    tmp_302[1] <== tmp_300[1] + tmp_301[1];
    tmp_302[2] <== tmp_300[2] + tmp_301[2];
    signal tmp_303[3];

    component cmul_116 = CMul();
    cmul_116.ina[0] <== tmp_302[0];
    cmul_116.ina[1] <== tmp_302[1];
    cmul_116.ina[2] <== tmp_302[2];
    cmul_116.inb[0] <== challenges[6][0];
    cmul_116.inb[1] <== challenges[6][1];
    cmul_116.inb[2] <== challenges[6][2];
    tmp_303[0] <== cmul_116.out[0];
    tmp_303[1] <== cmul_116.out[1];
    tmp_303[2] <== cmul_116.out[2];
    signal tmp_304[3];

    tmp_304[0] <== mapValues.tree1_5 - evals[28][0];
    tmp_304[1] <== -evals[28][1];
    tmp_304[2] <== -evals[28][2];
    signal tmp_305[3];

    tmp_305[0] <== tmp_303[0] + tmp_304[0];
    tmp_305[1] <== tmp_303[1] + tmp_304[1];
    tmp_305[2] <== tmp_303[2] + tmp_304[2];
    signal tmp_306[3];

    component cmul_117 = CMul();
    cmul_117.ina[0] <== tmp_305[0];
    cmul_117.ina[1] <== tmp_305[1];
    cmul_117.ina[2] <== tmp_305[2];
    cmul_117.inb[0] <== challenges[6][0];
    cmul_117.inb[1] <== challenges[6][1];
    cmul_117.inb[2] <== challenges[6][2];
    tmp_306[0] <== cmul_117.out[0];
    tmp_306[1] <== cmul_117.out[1];
    tmp_306[2] <== cmul_117.out[2];
    signal tmp_307[3];

    tmp_307[0] <== mapValues.tree1_6 - evals[29][0];
    tmp_307[1] <== -evals[29][1];
    tmp_307[2] <== -evals[29][2];
    signal tmp_308[3];

    tmp_308[0] <== tmp_306[0] + tmp_307[0];
    tmp_308[1] <== tmp_306[1] + tmp_307[1];
    tmp_308[2] <== tmp_306[2] + tmp_307[2];
    signal tmp_309[3];

    component cmul_118 = CMul();
    cmul_118.ina[0] <== tmp_308[0];
    cmul_118.ina[1] <== tmp_308[1];
    cmul_118.ina[2] <== tmp_308[2];
    cmul_118.inb[0] <== challenges[6][0];
    cmul_118.inb[1] <== challenges[6][1];
    cmul_118.inb[2] <== challenges[6][2];
    tmp_309[0] <== cmul_118.out[0];
    tmp_309[1] <== cmul_118.out[1];
    tmp_309[2] <== cmul_118.out[2];
    signal tmp_310[3];

    tmp_310[0] <== mapValues.tree1_7 - evals[30][0];
    tmp_310[1] <== -evals[30][1];
    tmp_310[2] <== -evals[30][2];
    signal tmp_311[3];

    tmp_311[0] <== tmp_309[0] + tmp_310[0];
    tmp_311[1] <== tmp_309[1] + tmp_310[1];
    tmp_311[2] <== tmp_309[2] + tmp_310[2];
    signal tmp_312[3];

    component cmul_119 = CMul();
    cmul_119.ina[0] <== tmp_311[0];
    cmul_119.ina[1] <== tmp_311[1];
    cmul_119.ina[2] <== tmp_311[2];
    cmul_119.inb[0] <== challenges[6][0];
    cmul_119.inb[1] <== challenges[6][1];
    cmul_119.inb[2] <== challenges[6][2];
    tmp_312[0] <== cmul_119.out[0];
    tmp_312[1] <== cmul_119.out[1];
    tmp_312[2] <== cmul_119.out[2];
    signal tmp_313[3];

    tmp_313[0] <== mapValues.tree1_8 - evals[31][0];
    tmp_313[1] <== -evals[31][1];
    tmp_313[2] <== -evals[31][2];
    signal tmp_314[3];

    tmp_314[0] <== tmp_312[0] + tmp_313[0];
    tmp_314[1] <== tmp_312[1] + tmp_313[1];
    tmp_314[2] <== tmp_312[2] + tmp_313[2];
    signal tmp_315[3];

    component cmul_120 = CMul();
    cmul_120.ina[0] <== tmp_314[0];
    cmul_120.ina[1] <== tmp_314[1];
    cmul_120.ina[2] <== tmp_314[2];
    cmul_120.inb[0] <== challenges[6][0];
    cmul_120.inb[1] <== challenges[6][1];
    cmul_120.inb[2] <== challenges[6][2];
    tmp_315[0] <== cmul_120.out[0];
    tmp_315[1] <== cmul_120.out[1];
    tmp_315[2] <== cmul_120.out[2];
    signal tmp_316[3];

    tmp_316[0] <== mapValues.tree1_9 - evals[32][0];
    tmp_316[1] <== -evals[32][1];
    tmp_316[2] <== -evals[32][2];
    signal tmp_317[3];

    tmp_317[0] <== tmp_315[0] + tmp_316[0];
    tmp_317[1] <== tmp_315[1] + tmp_316[1];
    tmp_317[2] <== tmp_315[2] + tmp_316[2];
    signal tmp_318[3];

    component cmul_121 = CMul();
    cmul_121.ina[0] <== tmp_317[0];
    cmul_121.ina[1] <== tmp_317[1];
    cmul_121.ina[2] <== tmp_317[2];
    cmul_121.inb[0] <== challenges[6][0];
    cmul_121.inb[1] <== challenges[6][1];
    cmul_121.inb[2] <== challenges[6][2];
    tmp_318[0] <== cmul_121.out[0];
    tmp_318[1] <== cmul_121.out[1];
    tmp_318[2] <== cmul_121.out[2];
    signal tmp_319[3];

    tmp_319[0] <== mapValues.tree1_10 - evals[33][0];
    tmp_319[1] <== -evals[33][1];
    tmp_319[2] <== -evals[33][2];
    signal tmp_320[3];

    tmp_320[0] <== tmp_318[0] + tmp_319[0];
    tmp_320[1] <== tmp_318[1] + tmp_319[1];
    tmp_320[2] <== tmp_318[2] + tmp_319[2];
    signal tmp_321[3];

    component cmul_122 = CMul();
    cmul_122.ina[0] <== tmp_320[0];
    cmul_122.ina[1] <== tmp_320[1];
    cmul_122.ina[2] <== tmp_320[2];
    cmul_122.inb[0] <== challenges[6][0];
    cmul_122.inb[1] <== challenges[6][1];
    cmul_122.inb[2] <== challenges[6][2];
    tmp_321[0] <== cmul_122.out[0];
    tmp_321[1] <== cmul_122.out[1];
    tmp_321[2] <== cmul_122.out[2];
    signal tmp_322[3];

    tmp_322[0] <== mapValues.tree1_11 - evals[34][0];
    tmp_322[1] <== -evals[34][1];
    tmp_322[2] <== -evals[34][2];
    signal tmp_323[3];

    tmp_323[0] <== tmp_321[0] + tmp_322[0];
    tmp_323[1] <== tmp_321[1] + tmp_322[1];
    tmp_323[2] <== tmp_321[2] + tmp_322[2];
    signal tmp_324[3];

    component cmul_123 = CMul();
    cmul_123.ina[0] <== tmp_323[0];
    cmul_123.ina[1] <== tmp_323[1];
    cmul_123.ina[2] <== tmp_323[2];
    cmul_123.inb[0] <== challenges[6][0];
    cmul_123.inb[1] <== challenges[6][1];
    cmul_123.inb[2] <== challenges[6][2];
    tmp_324[0] <== cmul_123.out[0];
    tmp_324[1] <== cmul_123.out[1];
    tmp_324[2] <== cmul_123.out[2];
    signal tmp_325[3];

    tmp_325[0] <== mapValues.tree3_0[0] - evals[77][0];
    tmp_325[1] <== mapValues.tree3_0[1] - evals[77][1];
    tmp_325[2] <== mapValues.tree3_0[2] - evals[77][2];
    signal tmp_326[3];

    tmp_326[0] <== tmp_324[0] + tmp_325[0];
    tmp_326[1] <== tmp_324[1] + tmp_325[1];
    tmp_326[2] <== tmp_324[2] + tmp_325[2];
    signal tmp_327[3];

    component cmul_124 = CMul();
    cmul_124.ina[0] <== tmp_326[0];
    cmul_124.ina[1] <== tmp_326[1];
    cmul_124.ina[2] <== tmp_326[2];
    cmul_124.inb[0] <== xDivXSubWXi[0];
    cmul_124.inb[1] <== xDivXSubWXi[1];
    cmul_124.inb[2] <== xDivXSubWXi[2];
    tmp_327[0] <== cmul_124.out[0];
    tmp_327[1] <== cmul_124.out[1];
    tmp_327[2] <== cmul_124.out[2];
    signal tmp_328[3];

    tmp_328[0] <== tmp_289[0] + tmp_327[0];
    tmp_328[1] <== tmp_289[1] + tmp_327[1];
    tmp_328[2] <== tmp_289[2] + tmp_327[2];

    out[0] <== tmp_328[0];
    out[1] <== tmp_328[1];
    out[2] <== tmp_328[2];
}


template MapValues() {
    signal input vals1[12];
    signal input vals3[3];
    signal input vals4[79];

    signal output tree1_0;
    signal output tree1_1;
    signal output tree1_2;
    signal output tree1_3;
    signal output tree1_4;
    signal output tree1_5;
    signal output tree1_6;
    signal output tree1_7;
    signal output tree1_8;
    signal output tree1_9;
    signal output tree1_10;
    signal output tree1_11;
    signal output tree3_0[3];
    signal output tree4_0;
    signal output tree4_1;
    signal output tree4_2;
    signal output tree4_3;
    signal output tree4_4;
    signal output tree4_5;
    signal output tree4_6;
    signal output tree4_7;
    signal output tree4_8;
    signal output tree4_9;
    signal output tree4_10[3];
    signal output tree4_11[3];
    signal output tree4_12[3];
    signal output tree4_13[3];
    signal output tree4_14[3];
    signal output tree4_15[3];
    signal output tree4_16[3];
    signal output tree4_17[3];
    signal output tree4_18[3];
    signal output tree4_19[3];
    signal output tree4_20[3];
    signal output tree4_21[3];
    signal output tree4_22[3];
    signal output tree4_23[3];
    signal output tree4_24[3];
    signal output tree4_25[3];
    signal output tree4_26[3];
    signal output tree4_27[3];
    signal output tree4_28[3];
    signal output tree4_29[3];
    signal output tree4_30[3];
    signal output tree4_31[3];
    signal output tree4_32[3];

    tree1_0 <== vals1[0];
    tree1_1 <== vals1[1];
    tree1_2 <== vals1[2];
    tree1_3 <== vals1[3];
    tree1_4 <== vals1[4];
    tree1_5 <== vals1[5];
    tree1_6 <== vals1[6];
    tree1_7 <== vals1[7];
    tree1_8 <== vals1[8];
    tree1_9 <== vals1[9];
    tree1_10 <== vals1[10];
    tree1_11 <== vals1[11];
    tree3_0[0] <== vals3[0];
    tree3_0[1] <== vals3[1];
    tree3_0[2] <== vals3[2];
    tree4_0 <== vals4[0];
    tree4_1 <== vals4[1];
    tree4_2 <== vals4[2];
    tree4_3 <== vals4[3];
    tree4_4 <== vals4[4];
    tree4_5 <== vals4[5];
    tree4_6 <== vals4[6];
    tree4_7 <== vals4[7];
    tree4_8 <== vals4[8];
    tree4_9 <== vals4[9];
    tree4_10[0] <== vals4[10];
    tree4_10[1] <== vals4[11];
    tree4_10[2] <== vals4[12];
    tree4_11[0] <== vals4[13];
    tree4_11[1] <== vals4[14];
    tree4_11[2] <== vals4[15];
    tree4_12[0] <== vals4[16];
    tree4_12[1] <== vals4[17];
    tree4_12[2] <== vals4[18];
    tree4_13[0] <== vals4[19];
    tree4_13[1] <== vals4[20];
    tree4_13[2] <== vals4[21];
    tree4_14[0] <== vals4[22];
    tree4_14[1] <== vals4[23];
    tree4_14[2] <== vals4[24];
    tree4_15[0] <== vals4[25];
    tree4_15[1] <== vals4[26];
    tree4_15[2] <== vals4[27];
    tree4_16[0] <== vals4[28];
    tree4_16[1] <== vals4[29];
    tree4_16[2] <== vals4[30];
    tree4_17[0] <== vals4[31];
    tree4_17[1] <== vals4[32];
    tree4_17[2] <== vals4[33];
    tree4_18[0] <== vals4[34];
    tree4_18[1] <== vals4[35];
    tree4_18[2] <== vals4[36];
    tree4_19[0] <== vals4[37];
    tree4_19[1] <== vals4[38];
    tree4_19[2] <== vals4[39];
    tree4_20[0] <== vals4[40];
    tree4_20[1] <== vals4[41];
    tree4_20[2] <== vals4[42];
    tree4_21[0] <== vals4[43];
    tree4_21[1] <== vals4[44];
    tree4_21[2] <== vals4[45];
    tree4_22[0] <== vals4[46];
    tree4_22[1] <== vals4[47];
    tree4_22[2] <== vals4[48];
    tree4_23[0] <== vals4[49];
    tree4_23[1] <== vals4[50];
    tree4_23[2] <== vals4[51];
    tree4_24[0] <== vals4[52];
    tree4_24[1] <== vals4[53];
    tree4_24[2] <== vals4[54];
    tree4_25[0] <== vals4[55];
    tree4_25[1] <== vals4[56];
    tree4_25[2] <== vals4[57];
    tree4_26[0] <== vals4[58];
    tree4_26[1] <== vals4[59];
    tree4_26[2] <== vals4[60];
    tree4_27[0] <== vals4[61];
    tree4_27[1] <== vals4[62];
    tree4_27[2] <== vals4[63];
    tree4_28[0] <== vals4[64];
    tree4_28[1] <== vals4[65];
    tree4_28[2] <== vals4[66];
    tree4_29[0] <== vals4[67];
    tree4_29[1] <== vals4[68];
    tree4_29[2] <== vals4[69];
    tree4_30[0] <== vals4[70];
    tree4_30[1] <== vals4[71];
    tree4_30[2] <== vals4[72];
    tree4_31[0] <== vals4[73];
    tree4_31[1] <== vals4[74];
    tree4_31[2] <== vals4[75];
    tree4_32[0] <== vals4[76];
    tree4_32[1] <== vals4[77];
    tree4_32[2] <== vals4[78];
}

template StarkVerifier() {
    signal input publics[43];
    signal input root1[4];
    signal input root2[4];
    signal input root3[4];
    signal input root4[4];

    signal input rootC[4];


    signal input evals[79][3];

    signal input s0_vals1[64][12];
    signal input s0_vals3[64][3];
    signal input s0_vals4[64][79];
    signal input s0_valsC[64][20];
    signal input s0_siblings1[64][26][4];
    signal input s0_siblings3[64][26][4];
    signal input s0_siblings4[64][26][4];
    signal input s0_siblingsC[64][26][4];

    signal input s1_root[4];
    signal input s2_root[4];
    signal input s3_root[4];
    signal input s4_root[4];

    signal input s1_vals[64][96];
    signal input s1_siblings[64][21][4];
    signal input s2_vals[64][96];
    signal input s2_siblings[64][16][4];
    signal input s3_vals[64][96];
    signal input s3_siblings[64][11][4];
    signal input s4_vals[64][96];
    signal input s4_siblings[64][6][4];

    signal input finalPol[64][3];

    signal enable;
    enable <== 1;


    signal challenges[8][3];
    signal s0_specialX[3];
    signal s1_specialX[3];
    signal s2_specialX[3];
    signal s3_specialX[3];
    signal s4_specialX[3];

    signal ys[64][26];


///////////
// challenge calculation
///////////

    component tcHahs_0 = Poseidon(12);
    tcHahs_0.in[0] <== root1[0];
    tcHahs_0.in[1] <== root1[1];
    tcHahs_0.in[2] <== root1[2];
    tcHahs_0.in[3] <== root1[3];
    tcHahs_0.in[4] <== 0;
    tcHahs_0.in[5] <== 0;
    tcHahs_0.in[6] <== 0;
    tcHahs_0.in[7] <== 0;
    tcHahs_0.capacity[0] <== 0;
    tcHahs_0.capacity[1] <== 0;
    tcHahs_0.capacity[2] <== 0;
    tcHahs_0.capacity[3] <== 0;
    challenges[0][0] <== tcHahs_0.out[0];
    challenges[0][1] <== tcHahs_0.out[1];
    challenges[0][2] <== tcHahs_0.out[2];
    challenges[1][0] <== tcHahs_0.out[3];
    challenges[1][1] <== tcHahs_0.out[4];
    challenges[1][2] <== tcHahs_0.out[5];
    component tcHahs_1 = Poseidon(12);
    tcHahs_1.in[0] <== root2[0];
    tcHahs_1.in[1] <== root2[1];
    tcHahs_1.in[2] <== root2[2];
    tcHahs_1.in[3] <== root2[3];
    tcHahs_1.in[4] <== 0;
    tcHahs_1.in[5] <== 0;
    tcHahs_1.in[6] <== 0;
    tcHahs_1.in[7] <== 0;
    tcHahs_1.capacity[0] <== tcHahs_0.out[0];
    tcHahs_1.capacity[1] <== tcHahs_0.out[1];
    tcHahs_1.capacity[2] <== tcHahs_0.out[2];
    tcHahs_1.capacity[3] <== tcHahs_0.out[3];
    challenges[2][0] <== tcHahs_1.out[0];
    challenges[2][1] <== tcHahs_1.out[1];
    challenges[2][2] <== tcHahs_1.out[2];
    challenges[3][0] <== tcHahs_1.out[3];
    challenges[3][1] <== tcHahs_1.out[4];
    challenges[3][2] <== tcHahs_1.out[5];
    component tcHahs_2 = Poseidon(12);
    tcHahs_2.in[0] <== root3[0];
    tcHahs_2.in[1] <== root3[1];
    tcHahs_2.in[2] <== root3[2];
    tcHahs_2.in[3] <== root3[3];
    tcHahs_2.in[4] <== 0;
    tcHahs_2.in[5] <== 0;
    tcHahs_2.in[6] <== 0;
    tcHahs_2.in[7] <== 0;
    tcHahs_2.capacity[0] <== tcHahs_1.out[0];
    tcHahs_2.capacity[1] <== tcHahs_1.out[1];
    tcHahs_2.capacity[2] <== tcHahs_1.out[2];
    tcHahs_2.capacity[3] <== tcHahs_1.out[3];
    challenges[4][0] <== tcHahs_2.out[0];
    challenges[4][1] <== tcHahs_2.out[1];
    challenges[4][2] <== tcHahs_2.out[2];
    component tcHahs_3 = Poseidon(12);
    tcHahs_3.in[0] <== root4[0];
    tcHahs_3.in[1] <== root4[1];
    tcHahs_3.in[2] <== root4[2];
    tcHahs_3.in[3] <== root4[3];
    tcHahs_3.in[4] <== 0;
    tcHahs_3.in[5] <== 0;
    tcHahs_3.in[6] <== 0;
    tcHahs_3.in[7] <== 0;
    tcHahs_3.capacity[0] <== tcHahs_2.out[0];
    tcHahs_3.capacity[1] <== tcHahs_2.out[1];
    tcHahs_3.capacity[2] <== tcHahs_2.out[2];
    tcHahs_3.capacity[3] <== tcHahs_2.out[3];
    challenges[5][0] <== tcHahs_3.out[0];
    challenges[5][1] <== tcHahs_3.out[1];
    challenges[5][2] <== tcHahs_3.out[2];
    challenges[6][0] <== tcHahs_3.out[3];
    challenges[6][1] <== tcHahs_3.out[4];
    challenges[6][2] <== tcHahs_3.out[5];
    challenges[7][0] <== tcHahs_3.out[6];
    challenges[7][1] <== tcHahs_3.out[7];
    challenges[7][2] <== tcHahs_3.out[8];
    s0_specialX[0] <== tcHahs_3.out[9];
    s0_specialX[1] <== tcHahs_3.out[10];
    s0_specialX[2] <== tcHahs_3.out[11];
    component tcHahs_4 = Poseidon(12);
    tcHahs_4.in[0] <== s1_root[0];
    tcHahs_4.in[1] <== s1_root[1];
    tcHahs_4.in[2] <== s1_root[2];
    tcHahs_4.in[3] <== s1_root[3];
    tcHahs_4.in[4] <== 0;
    tcHahs_4.in[5] <== 0;
    tcHahs_4.in[6] <== 0;
    tcHahs_4.in[7] <== 0;
    tcHahs_4.capacity[0] <== tcHahs_3.out[0];
    tcHahs_4.capacity[1] <== tcHahs_3.out[1];
    tcHahs_4.capacity[2] <== tcHahs_3.out[2];
    tcHahs_4.capacity[3] <== tcHahs_3.out[3];
    s1_specialX[0] <== tcHahs_4.out[0];
    s1_specialX[1] <== tcHahs_4.out[1];
    s1_specialX[2] <== tcHahs_4.out[2];
    component tcHahs_5 = Poseidon(12);
    tcHahs_5.in[0] <== s2_root[0];
    tcHahs_5.in[1] <== s2_root[1];
    tcHahs_5.in[2] <== s2_root[2];
    tcHahs_5.in[3] <== s2_root[3];
    tcHahs_5.in[4] <== 0;
    tcHahs_5.in[5] <== 0;
    tcHahs_5.in[6] <== 0;
    tcHahs_5.in[7] <== 0;
    tcHahs_5.capacity[0] <== tcHahs_4.out[0];
    tcHahs_5.capacity[1] <== tcHahs_4.out[1];
    tcHahs_5.capacity[2] <== tcHahs_4.out[2];
    tcHahs_5.capacity[3] <== tcHahs_4.out[3];
    s2_specialX[0] <== tcHahs_5.out[0];
    s2_specialX[1] <== tcHahs_5.out[1];
    s2_specialX[2] <== tcHahs_5.out[2];
    component tcHahs_6 = Poseidon(12);
    tcHahs_6.in[0] <== s3_root[0];
    tcHahs_6.in[1] <== s3_root[1];
    tcHahs_6.in[2] <== s3_root[2];
    tcHahs_6.in[3] <== s3_root[3];
    tcHahs_6.in[4] <== 0;
    tcHahs_6.in[5] <== 0;
    tcHahs_6.in[6] <== 0;
    tcHahs_6.in[7] <== 0;
    tcHahs_6.capacity[0] <== tcHahs_5.out[0];
    tcHahs_6.capacity[1] <== tcHahs_5.out[1];
    tcHahs_6.capacity[2] <== tcHahs_5.out[2];
    tcHahs_6.capacity[3] <== tcHahs_5.out[3];
    s3_specialX[0] <== tcHahs_6.out[0];
    s3_specialX[1] <== tcHahs_6.out[1];
    s3_specialX[2] <== tcHahs_6.out[2];
    component tcHahs_7 = Poseidon(12);
    tcHahs_7.in[0] <== s4_root[0];
    tcHahs_7.in[1] <== s4_root[1];
    tcHahs_7.in[2] <== s4_root[2];
    tcHahs_7.in[3] <== s4_root[3];
    tcHahs_7.in[4] <== 0;
    tcHahs_7.in[5] <== 0;
    tcHahs_7.in[6] <== 0;
    tcHahs_7.in[7] <== 0;
    tcHahs_7.capacity[0] <== tcHahs_6.out[0];
    tcHahs_7.capacity[1] <== tcHahs_6.out[1];
    tcHahs_7.capacity[2] <== tcHahs_6.out[2];
    tcHahs_7.capacity[3] <== tcHahs_6.out[3];
    s4_specialX[0] <== tcHahs_7.out[0];
    s4_specialX[1] <== tcHahs_7.out[1];
    s4_specialX[2] <== tcHahs_7.out[2];
    component tcHahs_8 = Poseidon(12);
    tcHahs_8.in[0] <== finalPol[0][0];
    tcHahs_8.in[1] <== finalPol[0][1];
    tcHahs_8.in[2] <== finalPol[0][2];
    tcHahs_8.in[3] <== finalPol[1][0];
    tcHahs_8.in[4] <== finalPol[1][1];
    tcHahs_8.in[5] <== finalPol[1][2];
    tcHahs_8.in[6] <== finalPol[2][0];
    tcHahs_8.in[7] <== finalPol[2][1];
    tcHahs_8.capacity[0] <== tcHahs_7.out[0];
    tcHahs_8.capacity[1] <== tcHahs_7.out[1];
    tcHahs_8.capacity[2] <== tcHahs_7.out[2];
    tcHahs_8.capacity[3] <== tcHahs_7.out[3];
    component tcHahs_9 = Poseidon(12);
    tcHahs_9.in[0] <== finalPol[2][2];
    tcHahs_9.in[1] <== finalPol[3][0];
    tcHahs_9.in[2] <== finalPol[3][1];
    tcHahs_9.in[3] <== finalPol[3][2];
    tcHahs_9.in[4] <== finalPol[4][0];
    tcHahs_9.in[5] <== finalPol[4][1];
    tcHahs_9.in[6] <== finalPol[4][2];
    tcHahs_9.in[7] <== finalPol[5][0];
    tcHahs_9.capacity[0] <== tcHahs_8.out[0];
    tcHahs_9.capacity[1] <== tcHahs_8.out[1];
    tcHahs_9.capacity[2] <== tcHahs_8.out[2];
    tcHahs_9.capacity[3] <== tcHahs_8.out[3];
    component tcHahs_10 = Poseidon(12);
    tcHahs_10.in[0] <== finalPol[5][1];
    tcHahs_10.in[1] <== finalPol[5][2];
    tcHahs_10.in[2] <== finalPol[6][0];
    tcHahs_10.in[3] <== finalPol[6][1];
    tcHahs_10.in[4] <== finalPol[6][2];
    tcHahs_10.in[5] <== finalPol[7][0];
    tcHahs_10.in[6] <== finalPol[7][1];
    tcHahs_10.in[7] <== finalPol[7][2];
    tcHahs_10.capacity[0] <== tcHahs_9.out[0];
    tcHahs_10.capacity[1] <== tcHahs_9.out[1];
    tcHahs_10.capacity[2] <== tcHahs_9.out[2];
    tcHahs_10.capacity[3] <== tcHahs_9.out[3];
    component tcHahs_11 = Poseidon(12);
    tcHahs_11.in[0] <== finalPol[8][0];
    tcHahs_11.in[1] <== finalPol[8][1];
    tcHahs_11.in[2] <== finalPol[8][2];
    tcHahs_11.in[3] <== finalPol[9][0];
    tcHahs_11.in[4] <== finalPol[9][1];
    tcHahs_11.in[5] <== finalPol[9][2];
    tcHahs_11.in[6] <== finalPol[10][0];
    tcHahs_11.in[7] <== finalPol[10][1];
    tcHahs_11.capacity[0] <== tcHahs_10.out[0];
    tcHahs_11.capacity[1] <== tcHahs_10.out[1];
    tcHahs_11.capacity[2] <== tcHahs_10.out[2];
    tcHahs_11.capacity[3] <== tcHahs_10.out[3];
    component tcHahs_12 = Poseidon(12);
    tcHahs_12.in[0] <== finalPol[10][2];
    tcHahs_12.in[1] <== finalPol[11][0];
    tcHahs_12.in[2] <== finalPol[11][1];
    tcHahs_12.in[3] <== finalPol[11][2];
    tcHahs_12.in[4] <== finalPol[12][0];
    tcHahs_12.in[5] <== finalPol[12][1];
    tcHahs_12.in[6] <== finalPol[12][2];
    tcHahs_12.in[7] <== finalPol[13][0];
    tcHahs_12.capacity[0] <== tcHahs_11.out[0];
    tcHahs_12.capacity[1] <== tcHahs_11.out[1];
    tcHahs_12.capacity[2] <== tcHahs_11.out[2];
    tcHahs_12.capacity[3] <== tcHahs_11.out[3];
    component tcHahs_13 = Poseidon(12);
    tcHahs_13.in[0] <== finalPol[13][1];
    tcHahs_13.in[1] <== finalPol[13][2];
    tcHahs_13.in[2] <== finalPol[14][0];
    tcHahs_13.in[3] <== finalPol[14][1];
    tcHahs_13.in[4] <== finalPol[14][2];
    tcHahs_13.in[5] <== finalPol[15][0];
    tcHahs_13.in[6] <== finalPol[15][1];
    tcHahs_13.in[7] <== finalPol[15][2];
    tcHahs_13.capacity[0] <== tcHahs_12.out[0];
    tcHahs_13.capacity[1] <== tcHahs_12.out[1];
    tcHahs_13.capacity[2] <== tcHahs_12.out[2];
    tcHahs_13.capacity[3] <== tcHahs_12.out[3];
    component tcHahs_14 = Poseidon(12);
    tcHahs_14.in[0] <== finalPol[16][0];
    tcHahs_14.in[1] <== finalPol[16][1];
    tcHahs_14.in[2] <== finalPol[16][2];
    tcHahs_14.in[3] <== finalPol[17][0];
    tcHahs_14.in[4] <== finalPol[17][1];
    tcHahs_14.in[5] <== finalPol[17][2];
    tcHahs_14.in[6] <== finalPol[18][0];
    tcHahs_14.in[7] <== finalPol[18][1];
    tcHahs_14.capacity[0] <== tcHahs_13.out[0];
    tcHahs_14.capacity[1] <== tcHahs_13.out[1];
    tcHahs_14.capacity[2] <== tcHahs_13.out[2];
    tcHahs_14.capacity[3] <== tcHahs_13.out[3];
    component tcHahs_15 = Poseidon(12);
    tcHahs_15.in[0] <== finalPol[18][2];
    tcHahs_15.in[1] <== finalPol[19][0];
    tcHahs_15.in[2] <== finalPol[19][1];
    tcHahs_15.in[3] <== finalPol[19][2];
    tcHahs_15.in[4] <== finalPol[20][0];
    tcHahs_15.in[5] <== finalPol[20][1];
    tcHahs_15.in[6] <== finalPol[20][2];
    tcHahs_15.in[7] <== finalPol[21][0];
    tcHahs_15.capacity[0] <== tcHahs_14.out[0];
    tcHahs_15.capacity[1] <== tcHahs_14.out[1];
    tcHahs_15.capacity[2] <== tcHahs_14.out[2];
    tcHahs_15.capacity[3] <== tcHahs_14.out[3];
    component tcHahs_16 = Poseidon(12);
    tcHahs_16.in[0] <== finalPol[21][1];
    tcHahs_16.in[1] <== finalPol[21][2];
    tcHahs_16.in[2] <== finalPol[22][0];
    tcHahs_16.in[3] <== finalPol[22][1];
    tcHahs_16.in[4] <== finalPol[22][2];
    tcHahs_16.in[5] <== finalPol[23][0];
    tcHahs_16.in[6] <== finalPol[23][1];
    tcHahs_16.in[7] <== finalPol[23][2];
    tcHahs_16.capacity[0] <== tcHahs_15.out[0];
    tcHahs_16.capacity[1] <== tcHahs_15.out[1];
    tcHahs_16.capacity[2] <== tcHahs_15.out[2];
    tcHahs_16.capacity[3] <== tcHahs_15.out[3];
    component tcHahs_17 = Poseidon(12);
    tcHahs_17.in[0] <== finalPol[24][0];
    tcHahs_17.in[1] <== finalPol[24][1];
    tcHahs_17.in[2] <== finalPol[24][2];
    tcHahs_17.in[3] <== finalPol[25][0];
    tcHahs_17.in[4] <== finalPol[25][1];
    tcHahs_17.in[5] <== finalPol[25][2];
    tcHahs_17.in[6] <== finalPol[26][0];
    tcHahs_17.in[7] <== finalPol[26][1];
    tcHahs_17.capacity[0] <== tcHahs_16.out[0];
    tcHahs_17.capacity[1] <== tcHahs_16.out[1];
    tcHahs_17.capacity[2] <== tcHahs_16.out[2];
    tcHahs_17.capacity[3] <== tcHahs_16.out[3];
    component tcHahs_18 = Poseidon(12);
    tcHahs_18.in[0] <== finalPol[26][2];
    tcHahs_18.in[1] <== finalPol[27][0];
    tcHahs_18.in[2] <== finalPol[27][1];
    tcHahs_18.in[3] <== finalPol[27][2];
    tcHahs_18.in[4] <== finalPol[28][0];
    tcHahs_18.in[5] <== finalPol[28][1];
    tcHahs_18.in[6] <== finalPol[28][2];
    tcHahs_18.in[7] <== finalPol[29][0];
    tcHahs_18.capacity[0] <== tcHahs_17.out[0];
    tcHahs_18.capacity[1] <== tcHahs_17.out[1];
    tcHahs_18.capacity[2] <== tcHahs_17.out[2];
    tcHahs_18.capacity[3] <== tcHahs_17.out[3];
    component tcHahs_19 = Poseidon(12);
    tcHahs_19.in[0] <== finalPol[29][1];
    tcHahs_19.in[1] <== finalPol[29][2];
    tcHahs_19.in[2] <== finalPol[30][0];
    tcHahs_19.in[3] <== finalPol[30][1];
    tcHahs_19.in[4] <== finalPol[30][2];
    tcHahs_19.in[5] <== finalPol[31][0];
    tcHahs_19.in[6] <== finalPol[31][1];
    tcHahs_19.in[7] <== finalPol[31][2];
    tcHahs_19.capacity[0] <== tcHahs_18.out[0];
    tcHahs_19.capacity[1] <== tcHahs_18.out[1];
    tcHahs_19.capacity[2] <== tcHahs_18.out[2];
    tcHahs_19.capacity[3] <== tcHahs_18.out[3];
    component tcHahs_20 = Poseidon(12);
    tcHahs_20.in[0] <== finalPol[32][0];
    tcHahs_20.in[1] <== finalPol[32][1];
    tcHahs_20.in[2] <== finalPol[32][2];
    tcHahs_20.in[3] <== finalPol[33][0];
    tcHahs_20.in[4] <== finalPol[33][1];
    tcHahs_20.in[5] <== finalPol[33][2];
    tcHahs_20.in[6] <== finalPol[34][0];
    tcHahs_20.in[7] <== finalPol[34][1];
    tcHahs_20.capacity[0] <== tcHahs_19.out[0];
    tcHahs_20.capacity[1] <== tcHahs_19.out[1];
    tcHahs_20.capacity[2] <== tcHahs_19.out[2];
    tcHahs_20.capacity[3] <== tcHahs_19.out[3];
    component tcHahs_21 = Poseidon(12);
    tcHahs_21.in[0] <== finalPol[34][2];
    tcHahs_21.in[1] <== finalPol[35][0];
    tcHahs_21.in[2] <== finalPol[35][1];
    tcHahs_21.in[3] <== finalPol[35][2];
    tcHahs_21.in[4] <== finalPol[36][0];
    tcHahs_21.in[5] <== finalPol[36][1];
    tcHahs_21.in[6] <== finalPol[36][2];
    tcHahs_21.in[7] <== finalPol[37][0];
    tcHahs_21.capacity[0] <== tcHahs_20.out[0];
    tcHahs_21.capacity[1] <== tcHahs_20.out[1];
    tcHahs_21.capacity[2] <== tcHahs_20.out[2];
    tcHahs_21.capacity[3] <== tcHahs_20.out[3];
    component tcHahs_22 = Poseidon(12);
    tcHahs_22.in[0] <== finalPol[37][1];
    tcHahs_22.in[1] <== finalPol[37][2];
    tcHahs_22.in[2] <== finalPol[38][0];
    tcHahs_22.in[3] <== finalPol[38][1];
    tcHahs_22.in[4] <== finalPol[38][2];
    tcHahs_22.in[5] <== finalPol[39][0];
    tcHahs_22.in[6] <== finalPol[39][1];
    tcHahs_22.in[7] <== finalPol[39][2];
    tcHahs_22.capacity[0] <== tcHahs_21.out[0];
    tcHahs_22.capacity[1] <== tcHahs_21.out[1];
    tcHahs_22.capacity[2] <== tcHahs_21.out[2];
    tcHahs_22.capacity[3] <== tcHahs_21.out[3];
    component tcHahs_23 = Poseidon(12);
    tcHahs_23.in[0] <== finalPol[40][0];
    tcHahs_23.in[1] <== finalPol[40][1];
    tcHahs_23.in[2] <== finalPol[40][2];
    tcHahs_23.in[3] <== finalPol[41][0];
    tcHahs_23.in[4] <== finalPol[41][1];
    tcHahs_23.in[5] <== finalPol[41][2];
    tcHahs_23.in[6] <== finalPol[42][0];
    tcHahs_23.in[7] <== finalPol[42][1];
    tcHahs_23.capacity[0] <== tcHahs_22.out[0];
    tcHahs_23.capacity[1] <== tcHahs_22.out[1];
    tcHahs_23.capacity[2] <== tcHahs_22.out[2];
    tcHahs_23.capacity[3] <== tcHahs_22.out[3];
    component tcHahs_24 = Poseidon(12);
    tcHahs_24.in[0] <== finalPol[42][2];
    tcHahs_24.in[1] <== finalPol[43][0];
    tcHahs_24.in[2] <== finalPol[43][1];
    tcHahs_24.in[3] <== finalPol[43][2];
    tcHahs_24.in[4] <== finalPol[44][0];
    tcHahs_24.in[5] <== finalPol[44][1];
    tcHahs_24.in[6] <== finalPol[44][2];
    tcHahs_24.in[7] <== finalPol[45][0];
    tcHahs_24.capacity[0] <== tcHahs_23.out[0];
    tcHahs_24.capacity[1] <== tcHahs_23.out[1];
    tcHahs_24.capacity[2] <== tcHahs_23.out[2];
    tcHahs_24.capacity[3] <== tcHahs_23.out[3];
    component tcHahs_25 = Poseidon(12);
    tcHahs_25.in[0] <== finalPol[45][1];
    tcHahs_25.in[1] <== finalPol[45][2];
    tcHahs_25.in[2] <== finalPol[46][0];
    tcHahs_25.in[3] <== finalPol[46][1];
    tcHahs_25.in[4] <== finalPol[46][2];
    tcHahs_25.in[5] <== finalPol[47][0];
    tcHahs_25.in[6] <== finalPol[47][1];
    tcHahs_25.in[7] <== finalPol[47][2];
    tcHahs_25.capacity[0] <== tcHahs_24.out[0];
    tcHahs_25.capacity[1] <== tcHahs_24.out[1];
    tcHahs_25.capacity[2] <== tcHahs_24.out[2];
    tcHahs_25.capacity[3] <== tcHahs_24.out[3];
    component tcHahs_26 = Poseidon(12);
    tcHahs_26.in[0] <== finalPol[48][0];
    tcHahs_26.in[1] <== finalPol[48][1];
    tcHahs_26.in[2] <== finalPol[48][2];
    tcHahs_26.in[3] <== finalPol[49][0];
    tcHahs_26.in[4] <== finalPol[49][1];
    tcHahs_26.in[5] <== finalPol[49][2];
    tcHahs_26.in[6] <== finalPol[50][0];
    tcHahs_26.in[7] <== finalPol[50][1];
    tcHahs_26.capacity[0] <== tcHahs_25.out[0];
    tcHahs_26.capacity[1] <== tcHahs_25.out[1];
    tcHahs_26.capacity[2] <== tcHahs_25.out[2];
    tcHahs_26.capacity[3] <== tcHahs_25.out[3];
    component tcHahs_27 = Poseidon(12);
    tcHahs_27.in[0] <== finalPol[50][2];
    tcHahs_27.in[1] <== finalPol[51][0];
    tcHahs_27.in[2] <== finalPol[51][1];
    tcHahs_27.in[3] <== finalPol[51][2];
    tcHahs_27.in[4] <== finalPol[52][0];
    tcHahs_27.in[5] <== finalPol[52][1];
    tcHahs_27.in[6] <== finalPol[52][2];
    tcHahs_27.in[7] <== finalPol[53][0];
    tcHahs_27.capacity[0] <== tcHahs_26.out[0];
    tcHahs_27.capacity[1] <== tcHahs_26.out[1];
    tcHahs_27.capacity[2] <== tcHahs_26.out[2];
    tcHahs_27.capacity[3] <== tcHahs_26.out[3];
    component tcHahs_28 = Poseidon(12);
    tcHahs_28.in[0] <== finalPol[53][1];
    tcHahs_28.in[1] <== finalPol[53][2];
    tcHahs_28.in[2] <== finalPol[54][0];
    tcHahs_28.in[3] <== finalPol[54][1];
    tcHahs_28.in[4] <== finalPol[54][2];
    tcHahs_28.in[5] <== finalPol[55][0];
    tcHahs_28.in[6] <== finalPol[55][1];
    tcHahs_28.in[7] <== finalPol[55][2];
    tcHahs_28.capacity[0] <== tcHahs_27.out[0];
    tcHahs_28.capacity[1] <== tcHahs_27.out[1];
    tcHahs_28.capacity[2] <== tcHahs_27.out[2];
    tcHahs_28.capacity[3] <== tcHahs_27.out[3];
    component tcHahs_29 = Poseidon(12);
    tcHahs_29.in[0] <== finalPol[56][0];
    tcHahs_29.in[1] <== finalPol[56][1];
    tcHahs_29.in[2] <== finalPol[56][2];
    tcHahs_29.in[3] <== finalPol[57][0];
    tcHahs_29.in[4] <== finalPol[57][1];
    tcHahs_29.in[5] <== finalPol[57][2];
    tcHahs_29.in[6] <== finalPol[58][0];
    tcHahs_29.in[7] <== finalPol[58][1];
    tcHahs_29.capacity[0] <== tcHahs_28.out[0];
    tcHahs_29.capacity[1] <== tcHahs_28.out[1];
    tcHahs_29.capacity[2] <== tcHahs_28.out[2];
    tcHahs_29.capacity[3] <== tcHahs_28.out[3];
    component tcHahs_30 = Poseidon(12);
    tcHahs_30.in[0] <== finalPol[58][2];
    tcHahs_30.in[1] <== finalPol[59][0];
    tcHahs_30.in[2] <== finalPol[59][1];
    tcHahs_30.in[3] <== finalPol[59][2];
    tcHahs_30.in[4] <== finalPol[60][0];
    tcHahs_30.in[5] <== finalPol[60][1];
    tcHahs_30.in[6] <== finalPol[60][2];
    tcHahs_30.in[7] <== finalPol[61][0];
    tcHahs_30.capacity[0] <== tcHahs_29.out[0];
    tcHahs_30.capacity[1] <== tcHahs_29.out[1];
    tcHahs_30.capacity[2] <== tcHahs_29.out[2];
    tcHahs_30.capacity[3] <== tcHahs_29.out[3];
    component tcHahs_31 = Poseidon(12);
    tcHahs_31.in[0] <== finalPol[61][1];
    tcHahs_31.in[1] <== finalPol[61][2];
    tcHahs_31.in[2] <== finalPol[62][0];
    tcHahs_31.in[3] <== finalPol[62][1];
    tcHahs_31.in[4] <== finalPol[62][2];
    tcHahs_31.in[5] <== finalPol[63][0];
    tcHahs_31.in[6] <== finalPol[63][1];
    tcHahs_31.in[7] <== finalPol[63][2];
    tcHahs_31.capacity[0] <== tcHahs_30.out[0];
    tcHahs_31.capacity[1] <== tcHahs_30.out[1];
    tcHahs_31.capacity[2] <== tcHahs_30.out[2];
    tcHahs_31.capacity[3] <== tcHahs_30.out[3];
    component tcN2b_0 = Num2Bits_strict();
    tcN2b_0.in <== tcHahs_31.out[0];
    component tcN2b_1 = Num2Bits_strict();
    tcN2b_1.in <== tcHahs_31.out[1];
    component tcN2b_2 = Num2Bits_strict();
    tcN2b_2.in <== tcHahs_31.out[2];
    component tcN2b_3 = Num2Bits_strict();
    tcN2b_3.in <== tcHahs_31.out[3];
    component tcN2b_4 = Num2Bits_strict();
    tcN2b_4.in <== tcHahs_31.out[4];
    component tcN2b_5 = Num2Bits_strict();
    tcN2b_5.in <== tcHahs_31.out[5];
    component tcN2b_6 = Num2Bits_strict();
    tcN2b_6.in <== tcHahs_31.out[6];
    component tcN2b_7 = Num2Bits_strict();
    tcN2b_7.in <== tcHahs_31.out[7];
    component tcN2b_8 = Num2Bits_strict();
    tcN2b_8.in <== tcHahs_31.out[8];
    component tcN2b_9 = Num2Bits_strict();
    tcN2b_9.in <== tcHahs_31.out[9];
    component tcN2b_10 = Num2Bits_strict();
    tcN2b_10.in <== tcHahs_31.out[10];
    component tcN2b_11 = Num2Bits_strict();
    tcN2b_11.in <== tcHahs_31.out[11];
    component tcHahs_32 = Poseidon(12);
    tcHahs_32.in[0] <== 0;
    tcHahs_32.in[1] <== 0;
    tcHahs_32.in[2] <== 0;
    tcHahs_32.in[3] <== 0;
    tcHahs_32.in[4] <== 0;
    tcHahs_32.in[5] <== 0;
    tcHahs_32.in[6] <== 0;
    tcHahs_32.in[7] <== 0;
    tcHahs_32.capacity[0] <== tcHahs_31.out[0];
    tcHahs_32.capacity[1] <== tcHahs_31.out[1];
    tcHahs_32.capacity[2] <== tcHahs_31.out[2];
    tcHahs_32.capacity[3] <== tcHahs_31.out[3];
    component tcN2b_12 = Num2Bits_strict();
    tcN2b_12.in <== tcHahs_32.out[0];
    component tcN2b_13 = Num2Bits_strict();
    tcN2b_13.in <== tcHahs_32.out[1];
    component tcN2b_14 = Num2Bits_strict();
    tcN2b_14.in <== tcHahs_32.out[2];
    component tcN2b_15 = Num2Bits_strict();
    tcN2b_15.in <== tcHahs_32.out[3];
    component tcN2b_16 = Num2Bits_strict();
    tcN2b_16.in <== tcHahs_32.out[4];
    component tcN2b_17 = Num2Bits_strict();
    tcN2b_17.in <== tcHahs_32.out[5];
    component tcN2b_18 = Num2Bits_strict();
    tcN2b_18.in <== tcHahs_32.out[6];
    component tcN2b_19 = Num2Bits_strict();
    tcN2b_19.in <== tcHahs_32.out[7];
    component tcN2b_20 = Num2Bits_strict();
    tcN2b_20.in <== tcHahs_32.out[8];
    component tcN2b_21 = Num2Bits_strict();
    tcN2b_21.in <== tcHahs_32.out[9];
    component tcN2b_22 = Num2Bits_strict();
    tcN2b_22.in <== tcHahs_32.out[10];
    component tcN2b_23 = Num2Bits_strict();
    tcN2b_23.in <== tcHahs_32.out[11];
    component tcHahs_33 = Poseidon(12);
    tcHahs_33.in[0] <== 0;
    tcHahs_33.in[1] <== 0;
    tcHahs_33.in[2] <== 0;
    tcHahs_33.in[3] <== 0;
    tcHahs_33.in[4] <== 0;
    tcHahs_33.in[5] <== 0;
    tcHahs_33.in[6] <== 0;
    tcHahs_33.in[7] <== 0;
    tcHahs_33.capacity[0] <== tcHahs_32.out[0];
    tcHahs_33.capacity[1] <== tcHahs_32.out[1];
    tcHahs_33.capacity[2] <== tcHahs_32.out[2];
    tcHahs_33.capacity[3] <== tcHahs_32.out[3];
    component tcN2b_24 = Num2Bits_strict();
    tcN2b_24.in <== tcHahs_33.out[0];
    component tcN2b_25 = Num2Bits_strict();
    tcN2b_25.in <== tcHahs_33.out[1];
    component tcN2b_26 = Num2Bits_strict();
    tcN2b_26.in <== tcHahs_33.out[2];
    ys[0][0] <== tcN2b_0.out[0];
    ys[0][1] <== tcN2b_0.out[1];
    ys[0][2] <== tcN2b_0.out[2];
    ys[0][3] <== tcN2b_0.out[3];
    ys[0][4] <== tcN2b_0.out[4];
    ys[0][5] <== tcN2b_0.out[5];
    ys[0][6] <== tcN2b_0.out[6];
    ys[0][7] <== tcN2b_0.out[7];
    ys[0][8] <== tcN2b_0.out[8];
    ys[0][9] <== tcN2b_0.out[9];
    ys[0][10] <== tcN2b_0.out[10];
    ys[0][11] <== tcN2b_0.out[11];
    ys[0][12] <== tcN2b_0.out[12];
    ys[0][13] <== tcN2b_0.out[13];
    ys[0][14] <== tcN2b_0.out[14];
    ys[0][15] <== tcN2b_0.out[15];
    ys[0][16] <== tcN2b_0.out[16];
    ys[0][17] <== tcN2b_0.out[17];
    ys[0][18] <== tcN2b_0.out[18];
    ys[0][19] <== tcN2b_0.out[19];
    ys[0][20] <== tcN2b_0.out[20];
    ys[0][21] <== tcN2b_0.out[21];
    ys[0][22] <== tcN2b_0.out[22];
    ys[0][23] <== tcN2b_0.out[23];
    ys[0][24] <== tcN2b_0.out[24];
    ys[0][25] <== tcN2b_0.out[25];
    ys[1][0] <== tcN2b_0.out[26];
    ys[1][1] <== tcN2b_0.out[27];
    ys[1][2] <== tcN2b_0.out[28];
    ys[1][3] <== tcN2b_0.out[29];
    ys[1][4] <== tcN2b_0.out[30];
    ys[1][5] <== tcN2b_0.out[31];
    ys[1][6] <== tcN2b_0.out[32];
    ys[1][7] <== tcN2b_0.out[33];
    ys[1][8] <== tcN2b_0.out[34];
    ys[1][9] <== tcN2b_0.out[35];
    ys[1][10] <== tcN2b_0.out[36];
    ys[1][11] <== tcN2b_0.out[37];
    ys[1][12] <== tcN2b_0.out[38];
    ys[1][13] <== tcN2b_0.out[39];
    ys[1][14] <== tcN2b_0.out[40];
    ys[1][15] <== tcN2b_0.out[41];
    ys[1][16] <== tcN2b_0.out[42];
    ys[1][17] <== tcN2b_0.out[43];
    ys[1][18] <== tcN2b_0.out[44];
    ys[1][19] <== tcN2b_0.out[45];
    ys[1][20] <== tcN2b_0.out[46];
    ys[1][21] <== tcN2b_0.out[47];
    ys[1][22] <== tcN2b_0.out[48];
    ys[1][23] <== tcN2b_0.out[49];
    ys[1][24] <== tcN2b_0.out[50];
    ys[1][25] <== tcN2b_0.out[51];
    ys[2][0] <== tcN2b_0.out[52];
    ys[2][1] <== tcN2b_0.out[53];
    ys[2][2] <== tcN2b_0.out[54];
    ys[2][3] <== tcN2b_0.out[55];
    ys[2][4] <== tcN2b_0.out[56];
    ys[2][5] <== tcN2b_0.out[57];
    ys[2][6] <== tcN2b_0.out[58];
    ys[2][7] <== tcN2b_0.out[59];
    ys[2][8] <== tcN2b_0.out[60];
    ys[2][9] <== tcN2b_0.out[61];
    ys[2][10] <== tcN2b_0.out[62];
    ys[2][11] <== tcN2b_1.out[0];
    ys[2][12] <== tcN2b_1.out[1];
    ys[2][13] <== tcN2b_1.out[2];
    ys[2][14] <== tcN2b_1.out[3];
    ys[2][15] <== tcN2b_1.out[4];
    ys[2][16] <== tcN2b_1.out[5];
    ys[2][17] <== tcN2b_1.out[6];
    ys[2][18] <== tcN2b_1.out[7];
    ys[2][19] <== tcN2b_1.out[8];
    ys[2][20] <== tcN2b_1.out[9];
    ys[2][21] <== tcN2b_1.out[10];
    ys[2][22] <== tcN2b_1.out[11];
    ys[2][23] <== tcN2b_1.out[12];
    ys[2][24] <== tcN2b_1.out[13];
    ys[2][25] <== tcN2b_1.out[14];
    ys[3][0] <== tcN2b_1.out[15];
    ys[3][1] <== tcN2b_1.out[16];
    ys[3][2] <== tcN2b_1.out[17];
    ys[3][3] <== tcN2b_1.out[18];
    ys[3][4] <== tcN2b_1.out[19];
    ys[3][5] <== tcN2b_1.out[20];
    ys[3][6] <== tcN2b_1.out[21];
    ys[3][7] <== tcN2b_1.out[22];
    ys[3][8] <== tcN2b_1.out[23];
    ys[3][9] <== tcN2b_1.out[24];
    ys[3][10] <== tcN2b_1.out[25];
    ys[3][11] <== tcN2b_1.out[26];
    ys[3][12] <== tcN2b_1.out[27];
    ys[3][13] <== tcN2b_1.out[28];
    ys[3][14] <== tcN2b_1.out[29];
    ys[3][15] <== tcN2b_1.out[30];
    ys[3][16] <== tcN2b_1.out[31];
    ys[3][17] <== tcN2b_1.out[32];
    ys[3][18] <== tcN2b_1.out[33];
    ys[3][19] <== tcN2b_1.out[34];
    ys[3][20] <== tcN2b_1.out[35];
    ys[3][21] <== tcN2b_1.out[36];
    ys[3][22] <== tcN2b_1.out[37];
    ys[3][23] <== tcN2b_1.out[38];
    ys[3][24] <== tcN2b_1.out[39];
    ys[3][25] <== tcN2b_1.out[40];
    ys[4][0] <== tcN2b_1.out[41];
    ys[4][1] <== tcN2b_1.out[42];
    ys[4][2] <== tcN2b_1.out[43];
    ys[4][3] <== tcN2b_1.out[44];
    ys[4][4] <== tcN2b_1.out[45];
    ys[4][5] <== tcN2b_1.out[46];
    ys[4][6] <== tcN2b_1.out[47];
    ys[4][7] <== tcN2b_1.out[48];
    ys[4][8] <== tcN2b_1.out[49];
    ys[4][9] <== tcN2b_1.out[50];
    ys[4][10] <== tcN2b_1.out[51];
    ys[4][11] <== tcN2b_1.out[52];
    ys[4][12] <== tcN2b_1.out[53];
    ys[4][13] <== tcN2b_1.out[54];
    ys[4][14] <== tcN2b_1.out[55];
    ys[4][15] <== tcN2b_1.out[56];
    ys[4][16] <== tcN2b_1.out[57];
    ys[4][17] <== tcN2b_1.out[58];
    ys[4][18] <== tcN2b_1.out[59];
    ys[4][19] <== tcN2b_1.out[60];
    ys[4][20] <== tcN2b_1.out[61];
    ys[4][21] <== tcN2b_1.out[62];
    ys[4][22] <== tcN2b_2.out[0];
    ys[4][23] <== tcN2b_2.out[1];
    ys[4][24] <== tcN2b_2.out[2];
    ys[4][25] <== tcN2b_2.out[3];
    ys[5][0] <== tcN2b_2.out[4];
    ys[5][1] <== tcN2b_2.out[5];
    ys[5][2] <== tcN2b_2.out[6];
    ys[5][3] <== tcN2b_2.out[7];
    ys[5][4] <== tcN2b_2.out[8];
    ys[5][5] <== tcN2b_2.out[9];
    ys[5][6] <== tcN2b_2.out[10];
    ys[5][7] <== tcN2b_2.out[11];
    ys[5][8] <== tcN2b_2.out[12];
    ys[5][9] <== tcN2b_2.out[13];
    ys[5][10] <== tcN2b_2.out[14];
    ys[5][11] <== tcN2b_2.out[15];
    ys[5][12] <== tcN2b_2.out[16];
    ys[5][13] <== tcN2b_2.out[17];
    ys[5][14] <== tcN2b_2.out[18];
    ys[5][15] <== tcN2b_2.out[19];
    ys[5][16] <== tcN2b_2.out[20];
    ys[5][17] <== tcN2b_2.out[21];
    ys[5][18] <== tcN2b_2.out[22];
    ys[5][19] <== tcN2b_2.out[23];
    ys[5][20] <== tcN2b_2.out[24];
    ys[5][21] <== tcN2b_2.out[25];
    ys[5][22] <== tcN2b_2.out[26];
    ys[5][23] <== tcN2b_2.out[27];
    ys[5][24] <== tcN2b_2.out[28];
    ys[5][25] <== tcN2b_2.out[29];
    ys[6][0] <== tcN2b_2.out[30];
    ys[6][1] <== tcN2b_2.out[31];
    ys[6][2] <== tcN2b_2.out[32];
    ys[6][3] <== tcN2b_2.out[33];
    ys[6][4] <== tcN2b_2.out[34];
    ys[6][5] <== tcN2b_2.out[35];
    ys[6][6] <== tcN2b_2.out[36];
    ys[6][7] <== tcN2b_2.out[37];
    ys[6][8] <== tcN2b_2.out[38];
    ys[6][9] <== tcN2b_2.out[39];
    ys[6][10] <== tcN2b_2.out[40];
    ys[6][11] <== tcN2b_2.out[41];
    ys[6][12] <== tcN2b_2.out[42];
    ys[6][13] <== tcN2b_2.out[43];
    ys[6][14] <== tcN2b_2.out[44];
    ys[6][15] <== tcN2b_2.out[45];
    ys[6][16] <== tcN2b_2.out[46];
    ys[6][17] <== tcN2b_2.out[47];
    ys[6][18] <== tcN2b_2.out[48];
    ys[6][19] <== tcN2b_2.out[49];
    ys[6][20] <== tcN2b_2.out[50];
    ys[6][21] <== tcN2b_2.out[51];
    ys[6][22] <== tcN2b_2.out[52];
    ys[6][23] <== tcN2b_2.out[53];
    ys[6][24] <== tcN2b_2.out[54];
    ys[6][25] <== tcN2b_2.out[55];
    ys[7][0] <== tcN2b_2.out[56];
    ys[7][1] <== tcN2b_2.out[57];
    ys[7][2] <== tcN2b_2.out[58];
    ys[7][3] <== tcN2b_2.out[59];
    ys[7][4] <== tcN2b_2.out[60];
    ys[7][5] <== tcN2b_2.out[61];
    ys[7][6] <== tcN2b_2.out[62];
    ys[7][7] <== tcN2b_3.out[0];
    ys[7][8] <== tcN2b_3.out[1];
    ys[7][9] <== tcN2b_3.out[2];
    ys[7][10] <== tcN2b_3.out[3];
    ys[7][11] <== tcN2b_3.out[4];
    ys[7][12] <== tcN2b_3.out[5];
    ys[7][13] <== tcN2b_3.out[6];
    ys[7][14] <== tcN2b_3.out[7];
    ys[7][15] <== tcN2b_3.out[8];
    ys[7][16] <== tcN2b_3.out[9];
    ys[7][17] <== tcN2b_3.out[10];
    ys[7][18] <== tcN2b_3.out[11];
    ys[7][19] <== tcN2b_3.out[12];
    ys[7][20] <== tcN2b_3.out[13];
    ys[7][21] <== tcN2b_3.out[14];
    ys[7][22] <== tcN2b_3.out[15];
    ys[7][23] <== tcN2b_3.out[16];
    ys[7][24] <== tcN2b_3.out[17];
    ys[7][25] <== tcN2b_3.out[18];
    ys[8][0] <== tcN2b_3.out[19];
    ys[8][1] <== tcN2b_3.out[20];
    ys[8][2] <== tcN2b_3.out[21];
    ys[8][3] <== tcN2b_3.out[22];
    ys[8][4] <== tcN2b_3.out[23];
    ys[8][5] <== tcN2b_3.out[24];
    ys[8][6] <== tcN2b_3.out[25];
    ys[8][7] <== tcN2b_3.out[26];
    ys[8][8] <== tcN2b_3.out[27];
    ys[8][9] <== tcN2b_3.out[28];
    ys[8][10] <== tcN2b_3.out[29];
    ys[8][11] <== tcN2b_3.out[30];
    ys[8][12] <== tcN2b_3.out[31];
    ys[8][13] <== tcN2b_3.out[32];
    ys[8][14] <== tcN2b_3.out[33];
    ys[8][15] <== tcN2b_3.out[34];
    ys[8][16] <== tcN2b_3.out[35];
    ys[8][17] <== tcN2b_3.out[36];
    ys[8][18] <== tcN2b_3.out[37];
    ys[8][19] <== tcN2b_3.out[38];
    ys[8][20] <== tcN2b_3.out[39];
    ys[8][21] <== tcN2b_3.out[40];
    ys[8][22] <== tcN2b_3.out[41];
    ys[8][23] <== tcN2b_3.out[42];
    ys[8][24] <== tcN2b_3.out[43];
    ys[8][25] <== tcN2b_3.out[44];
    ys[9][0] <== tcN2b_3.out[45];
    ys[9][1] <== tcN2b_3.out[46];
    ys[9][2] <== tcN2b_3.out[47];
    ys[9][3] <== tcN2b_3.out[48];
    ys[9][4] <== tcN2b_3.out[49];
    ys[9][5] <== tcN2b_3.out[50];
    ys[9][6] <== tcN2b_3.out[51];
    ys[9][7] <== tcN2b_3.out[52];
    ys[9][8] <== tcN2b_3.out[53];
    ys[9][9] <== tcN2b_3.out[54];
    ys[9][10] <== tcN2b_3.out[55];
    ys[9][11] <== tcN2b_3.out[56];
    ys[9][12] <== tcN2b_3.out[57];
    ys[9][13] <== tcN2b_3.out[58];
    ys[9][14] <== tcN2b_3.out[59];
    ys[9][15] <== tcN2b_3.out[60];
    ys[9][16] <== tcN2b_3.out[61];
    ys[9][17] <== tcN2b_3.out[62];
    ys[9][18] <== tcN2b_4.out[0];
    ys[9][19] <== tcN2b_4.out[1];
    ys[9][20] <== tcN2b_4.out[2];
    ys[9][21] <== tcN2b_4.out[3];
    ys[9][22] <== tcN2b_4.out[4];
    ys[9][23] <== tcN2b_4.out[5];
    ys[9][24] <== tcN2b_4.out[6];
    ys[9][25] <== tcN2b_4.out[7];
    ys[10][0] <== tcN2b_4.out[8];
    ys[10][1] <== tcN2b_4.out[9];
    ys[10][2] <== tcN2b_4.out[10];
    ys[10][3] <== tcN2b_4.out[11];
    ys[10][4] <== tcN2b_4.out[12];
    ys[10][5] <== tcN2b_4.out[13];
    ys[10][6] <== tcN2b_4.out[14];
    ys[10][7] <== tcN2b_4.out[15];
    ys[10][8] <== tcN2b_4.out[16];
    ys[10][9] <== tcN2b_4.out[17];
    ys[10][10] <== tcN2b_4.out[18];
    ys[10][11] <== tcN2b_4.out[19];
    ys[10][12] <== tcN2b_4.out[20];
    ys[10][13] <== tcN2b_4.out[21];
    ys[10][14] <== tcN2b_4.out[22];
    ys[10][15] <== tcN2b_4.out[23];
    ys[10][16] <== tcN2b_4.out[24];
    ys[10][17] <== tcN2b_4.out[25];
    ys[10][18] <== tcN2b_4.out[26];
    ys[10][19] <== tcN2b_4.out[27];
    ys[10][20] <== tcN2b_4.out[28];
    ys[10][21] <== tcN2b_4.out[29];
    ys[10][22] <== tcN2b_4.out[30];
    ys[10][23] <== tcN2b_4.out[31];
    ys[10][24] <== tcN2b_4.out[32];
    ys[10][25] <== tcN2b_4.out[33];
    ys[11][0] <== tcN2b_4.out[34];
    ys[11][1] <== tcN2b_4.out[35];
    ys[11][2] <== tcN2b_4.out[36];
    ys[11][3] <== tcN2b_4.out[37];
    ys[11][4] <== tcN2b_4.out[38];
    ys[11][5] <== tcN2b_4.out[39];
    ys[11][6] <== tcN2b_4.out[40];
    ys[11][7] <== tcN2b_4.out[41];
    ys[11][8] <== tcN2b_4.out[42];
    ys[11][9] <== tcN2b_4.out[43];
    ys[11][10] <== tcN2b_4.out[44];
    ys[11][11] <== tcN2b_4.out[45];
    ys[11][12] <== tcN2b_4.out[46];
    ys[11][13] <== tcN2b_4.out[47];
    ys[11][14] <== tcN2b_4.out[48];
    ys[11][15] <== tcN2b_4.out[49];
    ys[11][16] <== tcN2b_4.out[50];
    ys[11][17] <== tcN2b_4.out[51];
    ys[11][18] <== tcN2b_4.out[52];
    ys[11][19] <== tcN2b_4.out[53];
    ys[11][20] <== tcN2b_4.out[54];
    ys[11][21] <== tcN2b_4.out[55];
    ys[11][22] <== tcN2b_4.out[56];
    ys[11][23] <== tcN2b_4.out[57];
    ys[11][24] <== tcN2b_4.out[58];
    ys[11][25] <== tcN2b_4.out[59];
    ys[12][0] <== tcN2b_4.out[60];
    ys[12][1] <== tcN2b_4.out[61];
    ys[12][2] <== tcN2b_4.out[62];
    ys[12][3] <== tcN2b_5.out[0];
    ys[12][4] <== tcN2b_5.out[1];
    ys[12][5] <== tcN2b_5.out[2];
    ys[12][6] <== tcN2b_5.out[3];
    ys[12][7] <== tcN2b_5.out[4];
    ys[12][8] <== tcN2b_5.out[5];
    ys[12][9] <== tcN2b_5.out[6];
    ys[12][10] <== tcN2b_5.out[7];
    ys[12][11] <== tcN2b_5.out[8];
    ys[12][12] <== tcN2b_5.out[9];
    ys[12][13] <== tcN2b_5.out[10];
    ys[12][14] <== tcN2b_5.out[11];
    ys[12][15] <== tcN2b_5.out[12];
    ys[12][16] <== tcN2b_5.out[13];
    ys[12][17] <== tcN2b_5.out[14];
    ys[12][18] <== tcN2b_5.out[15];
    ys[12][19] <== tcN2b_5.out[16];
    ys[12][20] <== tcN2b_5.out[17];
    ys[12][21] <== tcN2b_5.out[18];
    ys[12][22] <== tcN2b_5.out[19];
    ys[12][23] <== tcN2b_5.out[20];
    ys[12][24] <== tcN2b_5.out[21];
    ys[12][25] <== tcN2b_5.out[22];
    ys[13][0] <== tcN2b_5.out[23];
    ys[13][1] <== tcN2b_5.out[24];
    ys[13][2] <== tcN2b_5.out[25];
    ys[13][3] <== tcN2b_5.out[26];
    ys[13][4] <== tcN2b_5.out[27];
    ys[13][5] <== tcN2b_5.out[28];
    ys[13][6] <== tcN2b_5.out[29];
    ys[13][7] <== tcN2b_5.out[30];
    ys[13][8] <== tcN2b_5.out[31];
    ys[13][9] <== tcN2b_5.out[32];
    ys[13][10] <== tcN2b_5.out[33];
    ys[13][11] <== tcN2b_5.out[34];
    ys[13][12] <== tcN2b_5.out[35];
    ys[13][13] <== tcN2b_5.out[36];
    ys[13][14] <== tcN2b_5.out[37];
    ys[13][15] <== tcN2b_5.out[38];
    ys[13][16] <== tcN2b_5.out[39];
    ys[13][17] <== tcN2b_5.out[40];
    ys[13][18] <== tcN2b_5.out[41];
    ys[13][19] <== tcN2b_5.out[42];
    ys[13][20] <== tcN2b_5.out[43];
    ys[13][21] <== tcN2b_5.out[44];
    ys[13][22] <== tcN2b_5.out[45];
    ys[13][23] <== tcN2b_5.out[46];
    ys[13][24] <== tcN2b_5.out[47];
    ys[13][25] <== tcN2b_5.out[48];
    ys[14][0] <== tcN2b_5.out[49];
    ys[14][1] <== tcN2b_5.out[50];
    ys[14][2] <== tcN2b_5.out[51];
    ys[14][3] <== tcN2b_5.out[52];
    ys[14][4] <== tcN2b_5.out[53];
    ys[14][5] <== tcN2b_5.out[54];
    ys[14][6] <== tcN2b_5.out[55];
    ys[14][7] <== tcN2b_5.out[56];
    ys[14][8] <== tcN2b_5.out[57];
    ys[14][9] <== tcN2b_5.out[58];
    ys[14][10] <== tcN2b_5.out[59];
    ys[14][11] <== tcN2b_5.out[60];
    ys[14][12] <== tcN2b_5.out[61];
    ys[14][13] <== tcN2b_5.out[62];
    ys[14][14] <== tcN2b_6.out[0];
    ys[14][15] <== tcN2b_6.out[1];
    ys[14][16] <== tcN2b_6.out[2];
    ys[14][17] <== tcN2b_6.out[3];
    ys[14][18] <== tcN2b_6.out[4];
    ys[14][19] <== tcN2b_6.out[5];
    ys[14][20] <== tcN2b_6.out[6];
    ys[14][21] <== tcN2b_6.out[7];
    ys[14][22] <== tcN2b_6.out[8];
    ys[14][23] <== tcN2b_6.out[9];
    ys[14][24] <== tcN2b_6.out[10];
    ys[14][25] <== tcN2b_6.out[11];
    ys[15][0] <== tcN2b_6.out[12];
    ys[15][1] <== tcN2b_6.out[13];
    ys[15][2] <== tcN2b_6.out[14];
    ys[15][3] <== tcN2b_6.out[15];
    ys[15][4] <== tcN2b_6.out[16];
    ys[15][5] <== tcN2b_6.out[17];
    ys[15][6] <== tcN2b_6.out[18];
    ys[15][7] <== tcN2b_6.out[19];
    ys[15][8] <== tcN2b_6.out[20];
    ys[15][9] <== tcN2b_6.out[21];
    ys[15][10] <== tcN2b_6.out[22];
    ys[15][11] <== tcN2b_6.out[23];
    ys[15][12] <== tcN2b_6.out[24];
    ys[15][13] <== tcN2b_6.out[25];
    ys[15][14] <== tcN2b_6.out[26];
    ys[15][15] <== tcN2b_6.out[27];
    ys[15][16] <== tcN2b_6.out[28];
    ys[15][17] <== tcN2b_6.out[29];
    ys[15][18] <== tcN2b_6.out[30];
    ys[15][19] <== tcN2b_6.out[31];
    ys[15][20] <== tcN2b_6.out[32];
    ys[15][21] <== tcN2b_6.out[33];
    ys[15][22] <== tcN2b_6.out[34];
    ys[15][23] <== tcN2b_6.out[35];
    ys[15][24] <== tcN2b_6.out[36];
    ys[15][25] <== tcN2b_6.out[37];
    ys[16][0] <== tcN2b_6.out[38];
    ys[16][1] <== tcN2b_6.out[39];
    ys[16][2] <== tcN2b_6.out[40];
    ys[16][3] <== tcN2b_6.out[41];
    ys[16][4] <== tcN2b_6.out[42];
    ys[16][5] <== tcN2b_6.out[43];
    ys[16][6] <== tcN2b_6.out[44];
    ys[16][7] <== tcN2b_6.out[45];
    ys[16][8] <== tcN2b_6.out[46];
    ys[16][9] <== tcN2b_6.out[47];
    ys[16][10] <== tcN2b_6.out[48];
    ys[16][11] <== tcN2b_6.out[49];
    ys[16][12] <== tcN2b_6.out[50];
    ys[16][13] <== tcN2b_6.out[51];
    ys[16][14] <== tcN2b_6.out[52];
    ys[16][15] <== tcN2b_6.out[53];
    ys[16][16] <== tcN2b_6.out[54];
    ys[16][17] <== tcN2b_6.out[55];
    ys[16][18] <== tcN2b_6.out[56];
    ys[16][19] <== tcN2b_6.out[57];
    ys[16][20] <== tcN2b_6.out[58];
    ys[16][21] <== tcN2b_6.out[59];
    ys[16][22] <== tcN2b_6.out[60];
    ys[16][23] <== tcN2b_6.out[61];
    ys[16][24] <== tcN2b_6.out[62];
    ys[16][25] <== tcN2b_7.out[0];
    ys[17][0] <== tcN2b_7.out[1];
    ys[17][1] <== tcN2b_7.out[2];
    ys[17][2] <== tcN2b_7.out[3];
    ys[17][3] <== tcN2b_7.out[4];
    ys[17][4] <== tcN2b_7.out[5];
    ys[17][5] <== tcN2b_7.out[6];
    ys[17][6] <== tcN2b_7.out[7];
    ys[17][7] <== tcN2b_7.out[8];
    ys[17][8] <== tcN2b_7.out[9];
    ys[17][9] <== tcN2b_7.out[10];
    ys[17][10] <== tcN2b_7.out[11];
    ys[17][11] <== tcN2b_7.out[12];
    ys[17][12] <== tcN2b_7.out[13];
    ys[17][13] <== tcN2b_7.out[14];
    ys[17][14] <== tcN2b_7.out[15];
    ys[17][15] <== tcN2b_7.out[16];
    ys[17][16] <== tcN2b_7.out[17];
    ys[17][17] <== tcN2b_7.out[18];
    ys[17][18] <== tcN2b_7.out[19];
    ys[17][19] <== tcN2b_7.out[20];
    ys[17][20] <== tcN2b_7.out[21];
    ys[17][21] <== tcN2b_7.out[22];
    ys[17][22] <== tcN2b_7.out[23];
    ys[17][23] <== tcN2b_7.out[24];
    ys[17][24] <== tcN2b_7.out[25];
    ys[17][25] <== tcN2b_7.out[26];
    ys[18][0] <== tcN2b_7.out[27];
    ys[18][1] <== tcN2b_7.out[28];
    ys[18][2] <== tcN2b_7.out[29];
    ys[18][3] <== tcN2b_7.out[30];
    ys[18][4] <== tcN2b_7.out[31];
    ys[18][5] <== tcN2b_7.out[32];
    ys[18][6] <== tcN2b_7.out[33];
    ys[18][7] <== tcN2b_7.out[34];
    ys[18][8] <== tcN2b_7.out[35];
    ys[18][9] <== tcN2b_7.out[36];
    ys[18][10] <== tcN2b_7.out[37];
    ys[18][11] <== tcN2b_7.out[38];
    ys[18][12] <== tcN2b_7.out[39];
    ys[18][13] <== tcN2b_7.out[40];
    ys[18][14] <== tcN2b_7.out[41];
    ys[18][15] <== tcN2b_7.out[42];
    ys[18][16] <== tcN2b_7.out[43];
    ys[18][17] <== tcN2b_7.out[44];
    ys[18][18] <== tcN2b_7.out[45];
    ys[18][19] <== tcN2b_7.out[46];
    ys[18][20] <== tcN2b_7.out[47];
    ys[18][21] <== tcN2b_7.out[48];
    ys[18][22] <== tcN2b_7.out[49];
    ys[18][23] <== tcN2b_7.out[50];
    ys[18][24] <== tcN2b_7.out[51];
    ys[18][25] <== tcN2b_7.out[52];
    ys[19][0] <== tcN2b_7.out[53];
    ys[19][1] <== tcN2b_7.out[54];
    ys[19][2] <== tcN2b_7.out[55];
    ys[19][3] <== tcN2b_7.out[56];
    ys[19][4] <== tcN2b_7.out[57];
    ys[19][5] <== tcN2b_7.out[58];
    ys[19][6] <== tcN2b_7.out[59];
    ys[19][7] <== tcN2b_7.out[60];
    ys[19][8] <== tcN2b_7.out[61];
    ys[19][9] <== tcN2b_7.out[62];
    ys[19][10] <== tcN2b_8.out[0];
    ys[19][11] <== tcN2b_8.out[1];
    ys[19][12] <== tcN2b_8.out[2];
    ys[19][13] <== tcN2b_8.out[3];
    ys[19][14] <== tcN2b_8.out[4];
    ys[19][15] <== tcN2b_8.out[5];
    ys[19][16] <== tcN2b_8.out[6];
    ys[19][17] <== tcN2b_8.out[7];
    ys[19][18] <== tcN2b_8.out[8];
    ys[19][19] <== tcN2b_8.out[9];
    ys[19][20] <== tcN2b_8.out[10];
    ys[19][21] <== tcN2b_8.out[11];
    ys[19][22] <== tcN2b_8.out[12];
    ys[19][23] <== tcN2b_8.out[13];
    ys[19][24] <== tcN2b_8.out[14];
    ys[19][25] <== tcN2b_8.out[15];
    ys[20][0] <== tcN2b_8.out[16];
    ys[20][1] <== tcN2b_8.out[17];
    ys[20][2] <== tcN2b_8.out[18];
    ys[20][3] <== tcN2b_8.out[19];
    ys[20][4] <== tcN2b_8.out[20];
    ys[20][5] <== tcN2b_8.out[21];
    ys[20][6] <== tcN2b_8.out[22];
    ys[20][7] <== tcN2b_8.out[23];
    ys[20][8] <== tcN2b_8.out[24];
    ys[20][9] <== tcN2b_8.out[25];
    ys[20][10] <== tcN2b_8.out[26];
    ys[20][11] <== tcN2b_8.out[27];
    ys[20][12] <== tcN2b_8.out[28];
    ys[20][13] <== tcN2b_8.out[29];
    ys[20][14] <== tcN2b_8.out[30];
    ys[20][15] <== tcN2b_8.out[31];
    ys[20][16] <== tcN2b_8.out[32];
    ys[20][17] <== tcN2b_8.out[33];
    ys[20][18] <== tcN2b_8.out[34];
    ys[20][19] <== tcN2b_8.out[35];
    ys[20][20] <== tcN2b_8.out[36];
    ys[20][21] <== tcN2b_8.out[37];
    ys[20][22] <== tcN2b_8.out[38];
    ys[20][23] <== tcN2b_8.out[39];
    ys[20][24] <== tcN2b_8.out[40];
    ys[20][25] <== tcN2b_8.out[41];
    ys[21][0] <== tcN2b_8.out[42];
    ys[21][1] <== tcN2b_8.out[43];
    ys[21][2] <== tcN2b_8.out[44];
    ys[21][3] <== tcN2b_8.out[45];
    ys[21][4] <== tcN2b_8.out[46];
    ys[21][5] <== tcN2b_8.out[47];
    ys[21][6] <== tcN2b_8.out[48];
    ys[21][7] <== tcN2b_8.out[49];
    ys[21][8] <== tcN2b_8.out[50];
    ys[21][9] <== tcN2b_8.out[51];
    ys[21][10] <== tcN2b_8.out[52];
    ys[21][11] <== tcN2b_8.out[53];
    ys[21][12] <== tcN2b_8.out[54];
    ys[21][13] <== tcN2b_8.out[55];
    ys[21][14] <== tcN2b_8.out[56];
    ys[21][15] <== tcN2b_8.out[57];
    ys[21][16] <== tcN2b_8.out[58];
    ys[21][17] <== tcN2b_8.out[59];
    ys[21][18] <== tcN2b_8.out[60];
    ys[21][19] <== tcN2b_8.out[61];
    ys[21][20] <== tcN2b_8.out[62];
    ys[21][21] <== tcN2b_9.out[0];
    ys[21][22] <== tcN2b_9.out[1];
    ys[21][23] <== tcN2b_9.out[2];
    ys[21][24] <== tcN2b_9.out[3];
    ys[21][25] <== tcN2b_9.out[4];
    ys[22][0] <== tcN2b_9.out[5];
    ys[22][1] <== tcN2b_9.out[6];
    ys[22][2] <== tcN2b_9.out[7];
    ys[22][3] <== tcN2b_9.out[8];
    ys[22][4] <== tcN2b_9.out[9];
    ys[22][5] <== tcN2b_9.out[10];
    ys[22][6] <== tcN2b_9.out[11];
    ys[22][7] <== tcN2b_9.out[12];
    ys[22][8] <== tcN2b_9.out[13];
    ys[22][9] <== tcN2b_9.out[14];
    ys[22][10] <== tcN2b_9.out[15];
    ys[22][11] <== tcN2b_9.out[16];
    ys[22][12] <== tcN2b_9.out[17];
    ys[22][13] <== tcN2b_9.out[18];
    ys[22][14] <== tcN2b_9.out[19];
    ys[22][15] <== tcN2b_9.out[20];
    ys[22][16] <== tcN2b_9.out[21];
    ys[22][17] <== tcN2b_9.out[22];
    ys[22][18] <== tcN2b_9.out[23];
    ys[22][19] <== tcN2b_9.out[24];
    ys[22][20] <== tcN2b_9.out[25];
    ys[22][21] <== tcN2b_9.out[26];
    ys[22][22] <== tcN2b_9.out[27];
    ys[22][23] <== tcN2b_9.out[28];
    ys[22][24] <== tcN2b_9.out[29];
    ys[22][25] <== tcN2b_9.out[30];
    ys[23][0] <== tcN2b_9.out[31];
    ys[23][1] <== tcN2b_9.out[32];
    ys[23][2] <== tcN2b_9.out[33];
    ys[23][3] <== tcN2b_9.out[34];
    ys[23][4] <== tcN2b_9.out[35];
    ys[23][5] <== tcN2b_9.out[36];
    ys[23][6] <== tcN2b_9.out[37];
    ys[23][7] <== tcN2b_9.out[38];
    ys[23][8] <== tcN2b_9.out[39];
    ys[23][9] <== tcN2b_9.out[40];
    ys[23][10] <== tcN2b_9.out[41];
    ys[23][11] <== tcN2b_9.out[42];
    ys[23][12] <== tcN2b_9.out[43];
    ys[23][13] <== tcN2b_9.out[44];
    ys[23][14] <== tcN2b_9.out[45];
    ys[23][15] <== tcN2b_9.out[46];
    ys[23][16] <== tcN2b_9.out[47];
    ys[23][17] <== tcN2b_9.out[48];
    ys[23][18] <== tcN2b_9.out[49];
    ys[23][19] <== tcN2b_9.out[50];
    ys[23][20] <== tcN2b_9.out[51];
    ys[23][21] <== tcN2b_9.out[52];
    ys[23][22] <== tcN2b_9.out[53];
    ys[23][23] <== tcN2b_9.out[54];
    ys[23][24] <== tcN2b_9.out[55];
    ys[23][25] <== tcN2b_9.out[56];
    ys[24][0] <== tcN2b_9.out[57];
    ys[24][1] <== tcN2b_9.out[58];
    ys[24][2] <== tcN2b_9.out[59];
    ys[24][3] <== tcN2b_9.out[60];
    ys[24][4] <== tcN2b_9.out[61];
    ys[24][5] <== tcN2b_9.out[62];
    ys[24][6] <== tcN2b_10.out[0];
    ys[24][7] <== tcN2b_10.out[1];
    ys[24][8] <== tcN2b_10.out[2];
    ys[24][9] <== tcN2b_10.out[3];
    ys[24][10] <== tcN2b_10.out[4];
    ys[24][11] <== tcN2b_10.out[5];
    ys[24][12] <== tcN2b_10.out[6];
    ys[24][13] <== tcN2b_10.out[7];
    ys[24][14] <== tcN2b_10.out[8];
    ys[24][15] <== tcN2b_10.out[9];
    ys[24][16] <== tcN2b_10.out[10];
    ys[24][17] <== tcN2b_10.out[11];
    ys[24][18] <== tcN2b_10.out[12];
    ys[24][19] <== tcN2b_10.out[13];
    ys[24][20] <== tcN2b_10.out[14];
    ys[24][21] <== tcN2b_10.out[15];
    ys[24][22] <== tcN2b_10.out[16];
    ys[24][23] <== tcN2b_10.out[17];
    ys[24][24] <== tcN2b_10.out[18];
    ys[24][25] <== tcN2b_10.out[19];
    ys[25][0] <== tcN2b_10.out[20];
    ys[25][1] <== tcN2b_10.out[21];
    ys[25][2] <== tcN2b_10.out[22];
    ys[25][3] <== tcN2b_10.out[23];
    ys[25][4] <== tcN2b_10.out[24];
    ys[25][5] <== tcN2b_10.out[25];
    ys[25][6] <== tcN2b_10.out[26];
    ys[25][7] <== tcN2b_10.out[27];
    ys[25][8] <== tcN2b_10.out[28];
    ys[25][9] <== tcN2b_10.out[29];
    ys[25][10] <== tcN2b_10.out[30];
    ys[25][11] <== tcN2b_10.out[31];
    ys[25][12] <== tcN2b_10.out[32];
    ys[25][13] <== tcN2b_10.out[33];
    ys[25][14] <== tcN2b_10.out[34];
    ys[25][15] <== tcN2b_10.out[35];
    ys[25][16] <== tcN2b_10.out[36];
    ys[25][17] <== tcN2b_10.out[37];
    ys[25][18] <== tcN2b_10.out[38];
    ys[25][19] <== tcN2b_10.out[39];
    ys[25][20] <== tcN2b_10.out[40];
    ys[25][21] <== tcN2b_10.out[41];
    ys[25][22] <== tcN2b_10.out[42];
    ys[25][23] <== tcN2b_10.out[43];
    ys[25][24] <== tcN2b_10.out[44];
    ys[25][25] <== tcN2b_10.out[45];
    ys[26][0] <== tcN2b_10.out[46];
    ys[26][1] <== tcN2b_10.out[47];
    ys[26][2] <== tcN2b_10.out[48];
    ys[26][3] <== tcN2b_10.out[49];
    ys[26][4] <== tcN2b_10.out[50];
    ys[26][5] <== tcN2b_10.out[51];
    ys[26][6] <== tcN2b_10.out[52];
    ys[26][7] <== tcN2b_10.out[53];
    ys[26][8] <== tcN2b_10.out[54];
    ys[26][9] <== tcN2b_10.out[55];
    ys[26][10] <== tcN2b_10.out[56];
    ys[26][11] <== tcN2b_10.out[57];
    ys[26][12] <== tcN2b_10.out[58];
    ys[26][13] <== tcN2b_10.out[59];
    ys[26][14] <== tcN2b_10.out[60];
    ys[26][15] <== tcN2b_10.out[61];
    ys[26][16] <== tcN2b_10.out[62];
    ys[26][17] <== tcN2b_11.out[0];
    ys[26][18] <== tcN2b_11.out[1];
    ys[26][19] <== tcN2b_11.out[2];
    ys[26][20] <== tcN2b_11.out[3];
    ys[26][21] <== tcN2b_11.out[4];
    ys[26][22] <== tcN2b_11.out[5];
    ys[26][23] <== tcN2b_11.out[6];
    ys[26][24] <== tcN2b_11.out[7];
    ys[26][25] <== tcN2b_11.out[8];
    ys[27][0] <== tcN2b_11.out[9];
    ys[27][1] <== tcN2b_11.out[10];
    ys[27][2] <== tcN2b_11.out[11];
    ys[27][3] <== tcN2b_11.out[12];
    ys[27][4] <== tcN2b_11.out[13];
    ys[27][5] <== tcN2b_11.out[14];
    ys[27][6] <== tcN2b_11.out[15];
    ys[27][7] <== tcN2b_11.out[16];
    ys[27][8] <== tcN2b_11.out[17];
    ys[27][9] <== tcN2b_11.out[18];
    ys[27][10] <== tcN2b_11.out[19];
    ys[27][11] <== tcN2b_11.out[20];
    ys[27][12] <== tcN2b_11.out[21];
    ys[27][13] <== tcN2b_11.out[22];
    ys[27][14] <== tcN2b_11.out[23];
    ys[27][15] <== tcN2b_11.out[24];
    ys[27][16] <== tcN2b_11.out[25];
    ys[27][17] <== tcN2b_11.out[26];
    ys[27][18] <== tcN2b_11.out[27];
    ys[27][19] <== tcN2b_11.out[28];
    ys[27][20] <== tcN2b_11.out[29];
    ys[27][21] <== tcN2b_11.out[30];
    ys[27][22] <== tcN2b_11.out[31];
    ys[27][23] <== tcN2b_11.out[32];
    ys[27][24] <== tcN2b_11.out[33];
    ys[27][25] <== tcN2b_11.out[34];
    ys[28][0] <== tcN2b_11.out[35];
    ys[28][1] <== tcN2b_11.out[36];
    ys[28][2] <== tcN2b_11.out[37];
    ys[28][3] <== tcN2b_11.out[38];
    ys[28][4] <== tcN2b_11.out[39];
    ys[28][5] <== tcN2b_11.out[40];
    ys[28][6] <== tcN2b_11.out[41];
    ys[28][7] <== tcN2b_11.out[42];
    ys[28][8] <== tcN2b_11.out[43];
    ys[28][9] <== tcN2b_11.out[44];
    ys[28][10] <== tcN2b_11.out[45];
    ys[28][11] <== tcN2b_11.out[46];
    ys[28][12] <== tcN2b_11.out[47];
    ys[28][13] <== tcN2b_11.out[48];
    ys[28][14] <== tcN2b_11.out[49];
    ys[28][15] <== tcN2b_11.out[50];
    ys[28][16] <== tcN2b_11.out[51];
    ys[28][17] <== tcN2b_11.out[52];
    ys[28][18] <== tcN2b_11.out[53];
    ys[28][19] <== tcN2b_11.out[54];
    ys[28][20] <== tcN2b_11.out[55];
    ys[28][21] <== tcN2b_11.out[56];
    ys[28][22] <== tcN2b_11.out[57];
    ys[28][23] <== tcN2b_11.out[58];
    ys[28][24] <== tcN2b_11.out[59];
    ys[28][25] <== tcN2b_11.out[60];
    ys[29][0] <== tcN2b_11.out[61];
    ys[29][1] <== tcN2b_11.out[62];
    ys[29][2] <== tcN2b_12.out[0];
    ys[29][3] <== tcN2b_12.out[1];
    ys[29][4] <== tcN2b_12.out[2];
    ys[29][5] <== tcN2b_12.out[3];
    ys[29][6] <== tcN2b_12.out[4];
    ys[29][7] <== tcN2b_12.out[5];
    ys[29][8] <== tcN2b_12.out[6];
    ys[29][9] <== tcN2b_12.out[7];
    ys[29][10] <== tcN2b_12.out[8];
    ys[29][11] <== tcN2b_12.out[9];
    ys[29][12] <== tcN2b_12.out[10];
    ys[29][13] <== tcN2b_12.out[11];
    ys[29][14] <== tcN2b_12.out[12];
    ys[29][15] <== tcN2b_12.out[13];
    ys[29][16] <== tcN2b_12.out[14];
    ys[29][17] <== tcN2b_12.out[15];
    ys[29][18] <== tcN2b_12.out[16];
    ys[29][19] <== tcN2b_12.out[17];
    ys[29][20] <== tcN2b_12.out[18];
    ys[29][21] <== tcN2b_12.out[19];
    ys[29][22] <== tcN2b_12.out[20];
    ys[29][23] <== tcN2b_12.out[21];
    ys[29][24] <== tcN2b_12.out[22];
    ys[29][25] <== tcN2b_12.out[23];
    ys[30][0] <== tcN2b_12.out[24];
    ys[30][1] <== tcN2b_12.out[25];
    ys[30][2] <== tcN2b_12.out[26];
    ys[30][3] <== tcN2b_12.out[27];
    ys[30][4] <== tcN2b_12.out[28];
    ys[30][5] <== tcN2b_12.out[29];
    ys[30][6] <== tcN2b_12.out[30];
    ys[30][7] <== tcN2b_12.out[31];
    ys[30][8] <== tcN2b_12.out[32];
    ys[30][9] <== tcN2b_12.out[33];
    ys[30][10] <== tcN2b_12.out[34];
    ys[30][11] <== tcN2b_12.out[35];
    ys[30][12] <== tcN2b_12.out[36];
    ys[30][13] <== tcN2b_12.out[37];
    ys[30][14] <== tcN2b_12.out[38];
    ys[30][15] <== tcN2b_12.out[39];
    ys[30][16] <== tcN2b_12.out[40];
    ys[30][17] <== tcN2b_12.out[41];
    ys[30][18] <== tcN2b_12.out[42];
    ys[30][19] <== tcN2b_12.out[43];
    ys[30][20] <== tcN2b_12.out[44];
    ys[30][21] <== tcN2b_12.out[45];
    ys[30][22] <== tcN2b_12.out[46];
    ys[30][23] <== tcN2b_12.out[47];
    ys[30][24] <== tcN2b_12.out[48];
    ys[30][25] <== tcN2b_12.out[49];
    ys[31][0] <== tcN2b_12.out[50];
    ys[31][1] <== tcN2b_12.out[51];
    ys[31][2] <== tcN2b_12.out[52];
    ys[31][3] <== tcN2b_12.out[53];
    ys[31][4] <== tcN2b_12.out[54];
    ys[31][5] <== tcN2b_12.out[55];
    ys[31][6] <== tcN2b_12.out[56];
    ys[31][7] <== tcN2b_12.out[57];
    ys[31][8] <== tcN2b_12.out[58];
    ys[31][9] <== tcN2b_12.out[59];
    ys[31][10] <== tcN2b_12.out[60];
    ys[31][11] <== tcN2b_12.out[61];
    ys[31][12] <== tcN2b_12.out[62];
    ys[31][13] <== tcN2b_13.out[0];
    ys[31][14] <== tcN2b_13.out[1];
    ys[31][15] <== tcN2b_13.out[2];
    ys[31][16] <== tcN2b_13.out[3];
    ys[31][17] <== tcN2b_13.out[4];
    ys[31][18] <== tcN2b_13.out[5];
    ys[31][19] <== tcN2b_13.out[6];
    ys[31][20] <== tcN2b_13.out[7];
    ys[31][21] <== tcN2b_13.out[8];
    ys[31][22] <== tcN2b_13.out[9];
    ys[31][23] <== tcN2b_13.out[10];
    ys[31][24] <== tcN2b_13.out[11];
    ys[31][25] <== tcN2b_13.out[12];
    ys[32][0] <== tcN2b_13.out[13];
    ys[32][1] <== tcN2b_13.out[14];
    ys[32][2] <== tcN2b_13.out[15];
    ys[32][3] <== tcN2b_13.out[16];
    ys[32][4] <== tcN2b_13.out[17];
    ys[32][5] <== tcN2b_13.out[18];
    ys[32][6] <== tcN2b_13.out[19];
    ys[32][7] <== tcN2b_13.out[20];
    ys[32][8] <== tcN2b_13.out[21];
    ys[32][9] <== tcN2b_13.out[22];
    ys[32][10] <== tcN2b_13.out[23];
    ys[32][11] <== tcN2b_13.out[24];
    ys[32][12] <== tcN2b_13.out[25];
    ys[32][13] <== tcN2b_13.out[26];
    ys[32][14] <== tcN2b_13.out[27];
    ys[32][15] <== tcN2b_13.out[28];
    ys[32][16] <== tcN2b_13.out[29];
    ys[32][17] <== tcN2b_13.out[30];
    ys[32][18] <== tcN2b_13.out[31];
    ys[32][19] <== tcN2b_13.out[32];
    ys[32][20] <== tcN2b_13.out[33];
    ys[32][21] <== tcN2b_13.out[34];
    ys[32][22] <== tcN2b_13.out[35];
    ys[32][23] <== tcN2b_13.out[36];
    ys[32][24] <== tcN2b_13.out[37];
    ys[32][25] <== tcN2b_13.out[38];
    ys[33][0] <== tcN2b_13.out[39];
    ys[33][1] <== tcN2b_13.out[40];
    ys[33][2] <== tcN2b_13.out[41];
    ys[33][3] <== tcN2b_13.out[42];
    ys[33][4] <== tcN2b_13.out[43];
    ys[33][5] <== tcN2b_13.out[44];
    ys[33][6] <== tcN2b_13.out[45];
    ys[33][7] <== tcN2b_13.out[46];
    ys[33][8] <== tcN2b_13.out[47];
    ys[33][9] <== tcN2b_13.out[48];
    ys[33][10] <== tcN2b_13.out[49];
    ys[33][11] <== tcN2b_13.out[50];
    ys[33][12] <== tcN2b_13.out[51];
    ys[33][13] <== tcN2b_13.out[52];
    ys[33][14] <== tcN2b_13.out[53];
    ys[33][15] <== tcN2b_13.out[54];
    ys[33][16] <== tcN2b_13.out[55];
    ys[33][17] <== tcN2b_13.out[56];
    ys[33][18] <== tcN2b_13.out[57];
    ys[33][19] <== tcN2b_13.out[58];
    ys[33][20] <== tcN2b_13.out[59];
    ys[33][21] <== tcN2b_13.out[60];
    ys[33][22] <== tcN2b_13.out[61];
    ys[33][23] <== tcN2b_13.out[62];
    ys[33][24] <== tcN2b_14.out[0];
    ys[33][25] <== tcN2b_14.out[1];
    ys[34][0] <== tcN2b_14.out[2];
    ys[34][1] <== tcN2b_14.out[3];
    ys[34][2] <== tcN2b_14.out[4];
    ys[34][3] <== tcN2b_14.out[5];
    ys[34][4] <== tcN2b_14.out[6];
    ys[34][5] <== tcN2b_14.out[7];
    ys[34][6] <== tcN2b_14.out[8];
    ys[34][7] <== tcN2b_14.out[9];
    ys[34][8] <== tcN2b_14.out[10];
    ys[34][9] <== tcN2b_14.out[11];
    ys[34][10] <== tcN2b_14.out[12];
    ys[34][11] <== tcN2b_14.out[13];
    ys[34][12] <== tcN2b_14.out[14];
    ys[34][13] <== tcN2b_14.out[15];
    ys[34][14] <== tcN2b_14.out[16];
    ys[34][15] <== tcN2b_14.out[17];
    ys[34][16] <== tcN2b_14.out[18];
    ys[34][17] <== tcN2b_14.out[19];
    ys[34][18] <== tcN2b_14.out[20];
    ys[34][19] <== tcN2b_14.out[21];
    ys[34][20] <== tcN2b_14.out[22];
    ys[34][21] <== tcN2b_14.out[23];
    ys[34][22] <== tcN2b_14.out[24];
    ys[34][23] <== tcN2b_14.out[25];
    ys[34][24] <== tcN2b_14.out[26];
    ys[34][25] <== tcN2b_14.out[27];
    ys[35][0] <== tcN2b_14.out[28];
    ys[35][1] <== tcN2b_14.out[29];
    ys[35][2] <== tcN2b_14.out[30];
    ys[35][3] <== tcN2b_14.out[31];
    ys[35][4] <== tcN2b_14.out[32];
    ys[35][5] <== tcN2b_14.out[33];
    ys[35][6] <== tcN2b_14.out[34];
    ys[35][7] <== tcN2b_14.out[35];
    ys[35][8] <== tcN2b_14.out[36];
    ys[35][9] <== tcN2b_14.out[37];
    ys[35][10] <== tcN2b_14.out[38];
    ys[35][11] <== tcN2b_14.out[39];
    ys[35][12] <== tcN2b_14.out[40];
    ys[35][13] <== tcN2b_14.out[41];
    ys[35][14] <== tcN2b_14.out[42];
    ys[35][15] <== tcN2b_14.out[43];
    ys[35][16] <== tcN2b_14.out[44];
    ys[35][17] <== tcN2b_14.out[45];
    ys[35][18] <== tcN2b_14.out[46];
    ys[35][19] <== tcN2b_14.out[47];
    ys[35][20] <== tcN2b_14.out[48];
    ys[35][21] <== tcN2b_14.out[49];
    ys[35][22] <== tcN2b_14.out[50];
    ys[35][23] <== tcN2b_14.out[51];
    ys[35][24] <== tcN2b_14.out[52];
    ys[35][25] <== tcN2b_14.out[53];
    ys[36][0] <== tcN2b_14.out[54];
    ys[36][1] <== tcN2b_14.out[55];
    ys[36][2] <== tcN2b_14.out[56];
    ys[36][3] <== tcN2b_14.out[57];
    ys[36][4] <== tcN2b_14.out[58];
    ys[36][5] <== tcN2b_14.out[59];
    ys[36][6] <== tcN2b_14.out[60];
    ys[36][7] <== tcN2b_14.out[61];
    ys[36][8] <== tcN2b_14.out[62];
    ys[36][9] <== tcN2b_15.out[0];
    ys[36][10] <== tcN2b_15.out[1];
    ys[36][11] <== tcN2b_15.out[2];
    ys[36][12] <== tcN2b_15.out[3];
    ys[36][13] <== tcN2b_15.out[4];
    ys[36][14] <== tcN2b_15.out[5];
    ys[36][15] <== tcN2b_15.out[6];
    ys[36][16] <== tcN2b_15.out[7];
    ys[36][17] <== tcN2b_15.out[8];
    ys[36][18] <== tcN2b_15.out[9];
    ys[36][19] <== tcN2b_15.out[10];
    ys[36][20] <== tcN2b_15.out[11];
    ys[36][21] <== tcN2b_15.out[12];
    ys[36][22] <== tcN2b_15.out[13];
    ys[36][23] <== tcN2b_15.out[14];
    ys[36][24] <== tcN2b_15.out[15];
    ys[36][25] <== tcN2b_15.out[16];
    ys[37][0] <== tcN2b_15.out[17];
    ys[37][1] <== tcN2b_15.out[18];
    ys[37][2] <== tcN2b_15.out[19];
    ys[37][3] <== tcN2b_15.out[20];
    ys[37][4] <== tcN2b_15.out[21];
    ys[37][5] <== tcN2b_15.out[22];
    ys[37][6] <== tcN2b_15.out[23];
    ys[37][7] <== tcN2b_15.out[24];
    ys[37][8] <== tcN2b_15.out[25];
    ys[37][9] <== tcN2b_15.out[26];
    ys[37][10] <== tcN2b_15.out[27];
    ys[37][11] <== tcN2b_15.out[28];
    ys[37][12] <== tcN2b_15.out[29];
    ys[37][13] <== tcN2b_15.out[30];
    ys[37][14] <== tcN2b_15.out[31];
    ys[37][15] <== tcN2b_15.out[32];
    ys[37][16] <== tcN2b_15.out[33];
    ys[37][17] <== tcN2b_15.out[34];
    ys[37][18] <== tcN2b_15.out[35];
    ys[37][19] <== tcN2b_15.out[36];
    ys[37][20] <== tcN2b_15.out[37];
    ys[37][21] <== tcN2b_15.out[38];
    ys[37][22] <== tcN2b_15.out[39];
    ys[37][23] <== tcN2b_15.out[40];
    ys[37][24] <== tcN2b_15.out[41];
    ys[37][25] <== tcN2b_15.out[42];
    ys[38][0] <== tcN2b_15.out[43];
    ys[38][1] <== tcN2b_15.out[44];
    ys[38][2] <== tcN2b_15.out[45];
    ys[38][3] <== tcN2b_15.out[46];
    ys[38][4] <== tcN2b_15.out[47];
    ys[38][5] <== tcN2b_15.out[48];
    ys[38][6] <== tcN2b_15.out[49];
    ys[38][7] <== tcN2b_15.out[50];
    ys[38][8] <== tcN2b_15.out[51];
    ys[38][9] <== tcN2b_15.out[52];
    ys[38][10] <== tcN2b_15.out[53];
    ys[38][11] <== tcN2b_15.out[54];
    ys[38][12] <== tcN2b_15.out[55];
    ys[38][13] <== tcN2b_15.out[56];
    ys[38][14] <== tcN2b_15.out[57];
    ys[38][15] <== tcN2b_15.out[58];
    ys[38][16] <== tcN2b_15.out[59];
    ys[38][17] <== tcN2b_15.out[60];
    ys[38][18] <== tcN2b_15.out[61];
    ys[38][19] <== tcN2b_15.out[62];
    ys[38][20] <== tcN2b_16.out[0];
    ys[38][21] <== tcN2b_16.out[1];
    ys[38][22] <== tcN2b_16.out[2];
    ys[38][23] <== tcN2b_16.out[3];
    ys[38][24] <== tcN2b_16.out[4];
    ys[38][25] <== tcN2b_16.out[5];
    ys[39][0] <== tcN2b_16.out[6];
    ys[39][1] <== tcN2b_16.out[7];
    ys[39][2] <== tcN2b_16.out[8];
    ys[39][3] <== tcN2b_16.out[9];
    ys[39][4] <== tcN2b_16.out[10];
    ys[39][5] <== tcN2b_16.out[11];
    ys[39][6] <== tcN2b_16.out[12];
    ys[39][7] <== tcN2b_16.out[13];
    ys[39][8] <== tcN2b_16.out[14];
    ys[39][9] <== tcN2b_16.out[15];
    ys[39][10] <== tcN2b_16.out[16];
    ys[39][11] <== tcN2b_16.out[17];
    ys[39][12] <== tcN2b_16.out[18];
    ys[39][13] <== tcN2b_16.out[19];
    ys[39][14] <== tcN2b_16.out[20];
    ys[39][15] <== tcN2b_16.out[21];
    ys[39][16] <== tcN2b_16.out[22];
    ys[39][17] <== tcN2b_16.out[23];
    ys[39][18] <== tcN2b_16.out[24];
    ys[39][19] <== tcN2b_16.out[25];
    ys[39][20] <== tcN2b_16.out[26];
    ys[39][21] <== tcN2b_16.out[27];
    ys[39][22] <== tcN2b_16.out[28];
    ys[39][23] <== tcN2b_16.out[29];
    ys[39][24] <== tcN2b_16.out[30];
    ys[39][25] <== tcN2b_16.out[31];
    ys[40][0] <== tcN2b_16.out[32];
    ys[40][1] <== tcN2b_16.out[33];
    ys[40][2] <== tcN2b_16.out[34];
    ys[40][3] <== tcN2b_16.out[35];
    ys[40][4] <== tcN2b_16.out[36];
    ys[40][5] <== tcN2b_16.out[37];
    ys[40][6] <== tcN2b_16.out[38];
    ys[40][7] <== tcN2b_16.out[39];
    ys[40][8] <== tcN2b_16.out[40];
    ys[40][9] <== tcN2b_16.out[41];
    ys[40][10] <== tcN2b_16.out[42];
    ys[40][11] <== tcN2b_16.out[43];
    ys[40][12] <== tcN2b_16.out[44];
    ys[40][13] <== tcN2b_16.out[45];
    ys[40][14] <== tcN2b_16.out[46];
    ys[40][15] <== tcN2b_16.out[47];
    ys[40][16] <== tcN2b_16.out[48];
    ys[40][17] <== tcN2b_16.out[49];
    ys[40][18] <== tcN2b_16.out[50];
    ys[40][19] <== tcN2b_16.out[51];
    ys[40][20] <== tcN2b_16.out[52];
    ys[40][21] <== tcN2b_16.out[53];
    ys[40][22] <== tcN2b_16.out[54];
    ys[40][23] <== tcN2b_16.out[55];
    ys[40][24] <== tcN2b_16.out[56];
    ys[40][25] <== tcN2b_16.out[57];
    ys[41][0] <== tcN2b_16.out[58];
    ys[41][1] <== tcN2b_16.out[59];
    ys[41][2] <== tcN2b_16.out[60];
    ys[41][3] <== tcN2b_16.out[61];
    ys[41][4] <== tcN2b_16.out[62];
    ys[41][5] <== tcN2b_17.out[0];
    ys[41][6] <== tcN2b_17.out[1];
    ys[41][7] <== tcN2b_17.out[2];
    ys[41][8] <== tcN2b_17.out[3];
    ys[41][9] <== tcN2b_17.out[4];
    ys[41][10] <== tcN2b_17.out[5];
    ys[41][11] <== tcN2b_17.out[6];
    ys[41][12] <== tcN2b_17.out[7];
    ys[41][13] <== tcN2b_17.out[8];
    ys[41][14] <== tcN2b_17.out[9];
    ys[41][15] <== tcN2b_17.out[10];
    ys[41][16] <== tcN2b_17.out[11];
    ys[41][17] <== tcN2b_17.out[12];
    ys[41][18] <== tcN2b_17.out[13];
    ys[41][19] <== tcN2b_17.out[14];
    ys[41][20] <== tcN2b_17.out[15];
    ys[41][21] <== tcN2b_17.out[16];
    ys[41][22] <== tcN2b_17.out[17];
    ys[41][23] <== tcN2b_17.out[18];
    ys[41][24] <== tcN2b_17.out[19];
    ys[41][25] <== tcN2b_17.out[20];
    ys[42][0] <== tcN2b_17.out[21];
    ys[42][1] <== tcN2b_17.out[22];
    ys[42][2] <== tcN2b_17.out[23];
    ys[42][3] <== tcN2b_17.out[24];
    ys[42][4] <== tcN2b_17.out[25];
    ys[42][5] <== tcN2b_17.out[26];
    ys[42][6] <== tcN2b_17.out[27];
    ys[42][7] <== tcN2b_17.out[28];
    ys[42][8] <== tcN2b_17.out[29];
    ys[42][9] <== tcN2b_17.out[30];
    ys[42][10] <== tcN2b_17.out[31];
    ys[42][11] <== tcN2b_17.out[32];
    ys[42][12] <== tcN2b_17.out[33];
    ys[42][13] <== tcN2b_17.out[34];
    ys[42][14] <== tcN2b_17.out[35];
    ys[42][15] <== tcN2b_17.out[36];
    ys[42][16] <== tcN2b_17.out[37];
    ys[42][17] <== tcN2b_17.out[38];
    ys[42][18] <== tcN2b_17.out[39];
    ys[42][19] <== tcN2b_17.out[40];
    ys[42][20] <== tcN2b_17.out[41];
    ys[42][21] <== tcN2b_17.out[42];
    ys[42][22] <== tcN2b_17.out[43];
    ys[42][23] <== tcN2b_17.out[44];
    ys[42][24] <== tcN2b_17.out[45];
    ys[42][25] <== tcN2b_17.out[46];
    ys[43][0] <== tcN2b_17.out[47];
    ys[43][1] <== tcN2b_17.out[48];
    ys[43][2] <== tcN2b_17.out[49];
    ys[43][3] <== tcN2b_17.out[50];
    ys[43][4] <== tcN2b_17.out[51];
    ys[43][5] <== tcN2b_17.out[52];
    ys[43][6] <== tcN2b_17.out[53];
    ys[43][7] <== tcN2b_17.out[54];
    ys[43][8] <== tcN2b_17.out[55];
    ys[43][9] <== tcN2b_17.out[56];
    ys[43][10] <== tcN2b_17.out[57];
    ys[43][11] <== tcN2b_17.out[58];
    ys[43][12] <== tcN2b_17.out[59];
    ys[43][13] <== tcN2b_17.out[60];
    ys[43][14] <== tcN2b_17.out[61];
    ys[43][15] <== tcN2b_17.out[62];
    ys[43][16] <== tcN2b_18.out[0];
    ys[43][17] <== tcN2b_18.out[1];
    ys[43][18] <== tcN2b_18.out[2];
    ys[43][19] <== tcN2b_18.out[3];
    ys[43][20] <== tcN2b_18.out[4];
    ys[43][21] <== tcN2b_18.out[5];
    ys[43][22] <== tcN2b_18.out[6];
    ys[43][23] <== tcN2b_18.out[7];
    ys[43][24] <== tcN2b_18.out[8];
    ys[43][25] <== tcN2b_18.out[9];
    ys[44][0] <== tcN2b_18.out[10];
    ys[44][1] <== tcN2b_18.out[11];
    ys[44][2] <== tcN2b_18.out[12];
    ys[44][3] <== tcN2b_18.out[13];
    ys[44][4] <== tcN2b_18.out[14];
    ys[44][5] <== tcN2b_18.out[15];
    ys[44][6] <== tcN2b_18.out[16];
    ys[44][7] <== tcN2b_18.out[17];
    ys[44][8] <== tcN2b_18.out[18];
    ys[44][9] <== tcN2b_18.out[19];
    ys[44][10] <== tcN2b_18.out[20];
    ys[44][11] <== tcN2b_18.out[21];
    ys[44][12] <== tcN2b_18.out[22];
    ys[44][13] <== tcN2b_18.out[23];
    ys[44][14] <== tcN2b_18.out[24];
    ys[44][15] <== tcN2b_18.out[25];
    ys[44][16] <== tcN2b_18.out[26];
    ys[44][17] <== tcN2b_18.out[27];
    ys[44][18] <== tcN2b_18.out[28];
    ys[44][19] <== tcN2b_18.out[29];
    ys[44][20] <== tcN2b_18.out[30];
    ys[44][21] <== tcN2b_18.out[31];
    ys[44][22] <== tcN2b_18.out[32];
    ys[44][23] <== tcN2b_18.out[33];
    ys[44][24] <== tcN2b_18.out[34];
    ys[44][25] <== tcN2b_18.out[35];
    ys[45][0] <== tcN2b_18.out[36];
    ys[45][1] <== tcN2b_18.out[37];
    ys[45][2] <== tcN2b_18.out[38];
    ys[45][3] <== tcN2b_18.out[39];
    ys[45][4] <== tcN2b_18.out[40];
    ys[45][5] <== tcN2b_18.out[41];
    ys[45][6] <== tcN2b_18.out[42];
    ys[45][7] <== tcN2b_18.out[43];
    ys[45][8] <== tcN2b_18.out[44];
    ys[45][9] <== tcN2b_18.out[45];
    ys[45][10] <== tcN2b_18.out[46];
    ys[45][11] <== tcN2b_18.out[47];
    ys[45][12] <== tcN2b_18.out[48];
    ys[45][13] <== tcN2b_18.out[49];
    ys[45][14] <== tcN2b_18.out[50];
    ys[45][15] <== tcN2b_18.out[51];
    ys[45][16] <== tcN2b_18.out[52];
    ys[45][17] <== tcN2b_18.out[53];
    ys[45][18] <== tcN2b_18.out[54];
    ys[45][19] <== tcN2b_18.out[55];
    ys[45][20] <== tcN2b_18.out[56];
    ys[45][21] <== tcN2b_18.out[57];
    ys[45][22] <== tcN2b_18.out[58];
    ys[45][23] <== tcN2b_18.out[59];
    ys[45][24] <== tcN2b_18.out[60];
    ys[45][25] <== tcN2b_18.out[61];
    ys[46][0] <== tcN2b_18.out[62];
    ys[46][1] <== tcN2b_19.out[0];
    ys[46][2] <== tcN2b_19.out[1];
    ys[46][3] <== tcN2b_19.out[2];
    ys[46][4] <== tcN2b_19.out[3];
    ys[46][5] <== tcN2b_19.out[4];
    ys[46][6] <== tcN2b_19.out[5];
    ys[46][7] <== tcN2b_19.out[6];
    ys[46][8] <== tcN2b_19.out[7];
    ys[46][9] <== tcN2b_19.out[8];
    ys[46][10] <== tcN2b_19.out[9];
    ys[46][11] <== tcN2b_19.out[10];
    ys[46][12] <== tcN2b_19.out[11];
    ys[46][13] <== tcN2b_19.out[12];
    ys[46][14] <== tcN2b_19.out[13];
    ys[46][15] <== tcN2b_19.out[14];
    ys[46][16] <== tcN2b_19.out[15];
    ys[46][17] <== tcN2b_19.out[16];
    ys[46][18] <== tcN2b_19.out[17];
    ys[46][19] <== tcN2b_19.out[18];
    ys[46][20] <== tcN2b_19.out[19];
    ys[46][21] <== tcN2b_19.out[20];
    ys[46][22] <== tcN2b_19.out[21];
    ys[46][23] <== tcN2b_19.out[22];
    ys[46][24] <== tcN2b_19.out[23];
    ys[46][25] <== tcN2b_19.out[24];
    ys[47][0] <== tcN2b_19.out[25];
    ys[47][1] <== tcN2b_19.out[26];
    ys[47][2] <== tcN2b_19.out[27];
    ys[47][3] <== tcN2b_19.out[28];
    ys[47][4] <== tcN2b_19.out[29];
    ys[47][5] <== tcN2b_19.out[30];
    ys[47][6] <== tcN2b_19.out[31];
    ys[47][7] <== tcN2b_19.out[32];
    ys[47][8] <== tcN2b_19.out[33];
    ys[47][9] <== tcN2b_19.out[34];
    ys[47][10] <== tcN2b_19.out[35];
    ys[47][11] <== tcN2b_19.out[36];
    ys[47][12] <== tcN2b_19.out[37];
    ys[47][13] <== tcN2b_19.out[38];
    ys[47][14] <== tcN2b_19.out[39];
    ys[47][15] <== tcN2b_19.out[40];
    ys[47][16] <== tcN2b_19.out[41];
    ys[47][17] <== tcN2b_19.out[42];
    ys[47][18] <== tcN2b_19.out[43];
    ys[47][19] <== tcN2b_19.out[44];
    ys[47][20] <== tcN2b_19.out[45];
    ys[47][21] <== tcN2b_19.out[46];
    ys[47][22] <== tcN2b_19.out[47];
    ys[47][23] <== tcN2b_19.out[48];
    ys[47][24] <== tcN2b_19.out[49];
    ys[47][25] <== tcN2b_19.out[50];
    ys[48][0] <== tcN2b_19.out[51];
    ys[48][1] <== tcN2b_19.out[52];
    ys[48][2] <== tcN2b_19.out[53];
    ys[48][3] <== tcN2b_19.out[54];
    ys[48][4] <== tcN2b_19.out[55];
    ys[48][5] <== tcN2b_19.out[56];
    ys[48][6] <== tcN2b_19.out[57];
    ys[48][7] <== tcN2b_19.out[58];
    ys[48][8] <== tcN2b_19.out[59];
    ys[48][9] <== tcN2b_19.out[60];
    ys[48][10] <== tcN2b_19.out[61];
    ys[48][11] <== tcN2b_19.out[62];
    ys[48][12] <== tcN2b_20.out[0];
    ys[48][13] <== tcN2b_20.out[1];
    ys[48][14] <== tcN2b_20.out[2];
    ys[48][15] <== tcN2b_20.out[3];
    ys[48][16] <== tcN2b_20.out[4];
    ys[48][17] <== tcN2b_20.out[5];
    ys[48][18] <== tcN2b_20.out[6];
    ys[48][19] <== tcN2b_20.out[7];
    ys[48][20] <== tcN2b_20.out[8];
    ys[48][21] <== tcN2b_20.out[9];
    ys[48][22] <== tcN2b_20.out[10];
    ys[48][23] <== tcN2b_20.out[11];
    ys[48][24] <== tcN2b_20.out[12];
    ys[48][25] <== tcN2b_20.out[13];
    ys[49][0] <== tcN2b_20.out[14];
    ys[49][1] <== tcN2b_20.out[15];
    ys[49][2] <== tcN2b_20.out[16];
    ys[49][3] <== tcN2b_20.out[17];
    ys[49][4] <== tcN2b_20.out[18];
    ys[49][5] <== tcN2b_20.out[19];
    ys[49][6] <== tcN2b_20.out[20];
    ys[49][7] <== tcN2b_20.out[21];
    ys[49][8] <== tcN2b_20.out[22];
    ys[49][9] <== tcN2b_20.out[23];
    ys[49][10] <== tcN2b_20.out[24];
    ys[49][11] <== tcN2b_20.out[25];
    ys[49][12] <== tcN2b_20.out[26];
    ys[49][13] <== tcN2b_20.out[27];
    ys[49][14] <== tcN2b_20.out[28];
    ys[49][15] <== tcN2b_20.out[29];
    ys[49][16] <== tcN2b_20.out[30];
    ys[49][17] <== tcN2b_20.out[31];
    ys[49][18] <== tcN2b_20.out[32];
    ys[49][19] <== tcN2b_20.out[33];
    ys[49][20] <== tcN2b_20.out[34];
    ys[49][21] <== tcN2b_20.out[35];
    ys[49][22] <== tcN2b_20.out[36];
    ys[49][23] <== tcN2b_20.out[37];
    ys[49][24] <== tcN2b_20.out[38];
    ys[49][25] <== tcN2b_20.out[39];
    ys[50][0] <== tcN2b_20.out[40];
    ys[50][1] <== tcN2b_20.out[41];
    ys[50][2] <== tcN2b_20.out[42];
    ys[50][3] <== tcN2b_20.out[43];
    ys[50][4] <== tcN2b_20.out[44];
    ys[50][5] <== tcN2b_20.out[45];
    ys[50][6] <== tcN2b_20.out[46];
    ys[50][7] <== tcN2b_20.out[47];
    ys[50][8] <== tcN2b_20.out[48];
    ys[50][9] <== tcN2b_20.out[49];
    ys[50][10] <== tcN2b_20.out[50];
    ys[50][11] <== tcN2b_20.out[51];
    ys[50][12] <== tcN2b_20.out[52];
    ys[50][13] <== tcN2b_20.out[53];
    ys[50][14] <== tcN2b_20.out[54];
    ys[50][15] <== tcN2b_20.out[55];
    ys[50][16] <== tcN2b_20.out[56];
    ys[50][17] <== tcN2b_20.out[57];
    ys[50][18] <== tcN2b_20.out[58];
    ys[50][19] <== tcN2b_20.out[59];
    ys[50][20] <== tcN2b_20.out[60];
    ys[50][21] <== tcN2b_20.out[61];
    ys[50][22] <== tcN2b_20.out[62];
    ys[50][23] <== tcN2b_21.out[0];
    ys[50][24] <== tcN2b_21.out[1];
    ys[50][25] <== tcN2b_21.out[2];
    ys[51][0] <== tcN2b_21.out[3];
    ys[51][1] <== tcN2b_21.out[4];
    ys[51][2] <== tcN2b_21.out[5];
    ys[51][3] <== tcN2b_21.out[6];
    ys[51][4] <== tcN2b_21.out[7];
    ys[51][5] <== tcN2b_21.out[8];
    ys[51][6] <== tcN2b_21.out[9];
    ys[51][7] <== tcN2b_21.out[10];
    ys[51][8] <== tcN2b_21.out[11];
    ys[51][9] <== tcN2b_21.out[12];
    ys[51][10] <== tcN2b_21.out[13];
    ys[51][11] <== tcN2b_21.out[14];
    ys[51][12] <== tcN2b_21.out[15];
    ys[51][13] <== tcN2b_21.out[16];
    ys[51][14] <== tcN2b_21.out[17];
    ys[51][15] <== tcN2b_21.out[18];
    ys[51][16] <== tcN2b_21.out[19];
    ys[51][17] <== tcN2b_21.out[20];
    ys[51][18] <== tcN2b_21.out[21];
    ys[51][19] <== tcN2b_21.out[22];
    ys[51][20] <== tcN2b_21.out[23];
    ys[51][21] <== tcN2b_21.out[24];
    ys[51][22] <== tcN2b_21.out[25];
    ys[51][23] <== tcN2b_21.out[26];
    ys[51][24] <== tcN2b_21.out[27];
    ys[51][25] <== tcN2b_21.out[28];
    ys[52][0] <== tcN2b_21.out[29];
    ys[52][1] <== tcN2b_21.out[30];
    ys[52][2] <== tcN2b_21.out[31];
    ys[52][3] <== tcN2b_21.out[32];
    ys[52][4] <== tcN2b_21.out[33];
    ys[52][5] <== tcN2b_21.out[34];
    ys[52][6] <== tcN2b_21.out[35];
    ys[52][7] <== tcN2b_21.out[36];
    ys[52][8] <== tcN2b_21.out[37];
    ys[52][9] <== tcN2b_21.out[38];
    ys[52][10] <== tcN2b_21.out[39];
    ys[52][11] <== tcN2b_21.out[40];
    ys[52][12] <== tcN2b_21.out[41];
    ys[52][13] <== tcN2b_21.out[42];
    ys[52][14] <== tcN2b_21.out[43];
    ys[52][15] <== tcN2b_21.out[44];
    ys[52][16] <== tcN2b_21.out[45];
    ys[52][17] <== tcN2b_21.out[46];
    ys[52][18] <== tcN2b_21.out[47];
    ys[52][19] <== tcN2b_21.out[48];
    ys[52][20] <== tcN2b_21.out[49];
    ys[52][21] <== tcN2b_21.out[50];
    ys[52][22] <== tcN2b_21.out[51];
    ys[52][23] <== tcN2b_21.out[52];
    ys[52][24] <== tcN2b_21.out[53];
    ys[52][25] <== tcN2b_21.out[54];
    ys[53][0] <== tcN2b_21.out[55];
    ys[53][1] <== tcN2b_21.out[56];
    ys[53][2] <== tcN2b_21.out[57];
    ys[53][3] <== tcN2b_21.out[58];
    ys[53][4] <== tcN2b_21.out[59];
    ys[53][5] <== tcN2b_21.out[60];
    ys[53][6] <== tcN2b_21.out[61];
    ys[53][7] <== tcN2b_21.out[62];
    ys[53][8] <== tcN2b_22.out[0];
    ys[53][9] <== tcN2b_22.out[1];
    ys[53][10] <== tcN2b_22.out[2];
    ys[53][11] <== tcN2b_22.out[3];
    ys[53][12] <== tcN2b_22.out[4];
    ys[53][13] <== tcN2b_22.out[5];
    ys[53][14] <== tcN2b_22.out[6];
    ys[53][15] <== tcN2b_22.out[7];
    ys[53][16] <== tcN2b_22.out[8];
    ys[53][17] <== tcN2b_22.out[9];
    ys[53][18] <== tcN2b_22.out[10];
    ys[53][19] <== tcN2b_22.out[11];
    ys[53][20] <== tcN2b_22.out[12];
    ys[53][21] <== tcN2b_22.out[13];
    ys[53][22] <== tcN2b_22.out[14];
    ys[53][23] <== tcN2b_22.out[15];
    ys[53][24] <== tcN2b_22.out[16];
    ys[53][25] <== tcN2b_22.out[17];
    ys[54][0] <== tcN2b_22.out[18];
    ys[54][1] <== tcN2b_22.out[19];
    ys[54][2] <== tcN2b_22.out[20];
    ys[54][3] <== tcN2b_22.out[21];
    ys[54][4] <== tcN2b_22.out[22];
    ys[54][5] <== tcN2b_22.out[23];
    ys[54][6] <== tcN2b_22.out[24];
    ys[54][7] <== tcN2b_22.out[25];
    ys[54][8] <== tcN2b_22.out[26];
    ys[54][9] <== tcN2b_22.out[27];
    ys[54][10] <== tcN2b_22.out[28];
    ys[54][11] <== tcN2b_22.out[29];
    ys[54][12] <== tcN2b_22.out[30];
    ys[54][13] <== tcN2b_22.out[31];
    ys[54][14] <== tcN2b_22.out[32];
    ys[54][15] <== tcN2b_22.out[33];
    ys[54][16] <== tcN2b_22.out[34];
    ys[54][17] <== tcN2b_22.out[35];
    ys[54][18] <== tcN2b_22.out[36];
    ys[54][19] <== tcN2b_22.out[37];
    ys[54][20] <== tcN2b_22.out[38];
    ys[54][21] <== tcN2b_22.out[39];
    ys[54][22] <== tcN2b_22.out[40];
    ys[54][23] <== tcN2b_22.out[41];
    ys[54][24] <== tcN2b_22.out[42];
    ys[54][25] <== tcN2b_22.out[43];
    ys[55][0] <== tcN2b_22.out[44];
    ys[55][1] <== tcN2b_22.out[45];
    ys[55][2] <== tcN2b_22.out[46];
    ys[55][3] <== tcN2b_22.out[47];
    ys[55][4] <== tcN2b_22.out[48];
    ys[55][5] <== tcN2b_22.out[49];
    ys[55][6] <== tcN2b_22.out[50];
    ys[55][7] <== tcN2b_22.out[51];
    ys[55][8] <== tcN2b_22.out[52];
    ys[55][9] <== tcN2b_22.out[53];
    ys[55][10] <== tcN2b_22.out[54];
    ys[55][11] <== tcN2b_22.out[55];
    ys[55][12] <== tcN2b_22.out[56];
    ys[55][13] <== tcN2b_22.out[57];
    ys[55][14] <== tcN2b_22.out[58];
    ys[55][15] <== tcN2b_22.out[59];
    ys[55][16] <== tcN2b_22.out[60];
    ys[55][17] <== tcN2b_22.out[61];
    ys[55][18] <== tcN2b_22.out[62];
    ys[55][19] <== tcN2b_23.out[0];
    ys[55][20] <== tcN2b_23.out[1];
    ys[55][21] <== tcN2b_23.out[2];
    ys[55][22] <== tcN2b_23.out[3];
    ys[55][23] <== tcN2b_23.out[4];
    ys[55][24] <== tcN2b_23.out[5];
    ys[55][25] <== tcN2b_23.out[6];
    ys[56][0] <== tcN2b_23.out[7];
    ys[56][1] <== tcN2b_23.out[8];
    ys[56][2] <== tcN2b_23.out[9];
    ys[56][3] <== tcN2b_23.out[10];
    ys[56][4] <== tcN2b_23.out[11];
    ys[56][5] <== tcN2b_23.out[12];
    ys[56][6] <== tcN2b_23.out[13];
    ys[56][7] <== tcN2b_23.out[14];
    ys[56][8] <== tcN2b_23.out[15];
    ys[56][9] <== tcN2b_23.out[16];
    ys[56][10] <== tcN2b_23.out[17];
    ys[56][11] <== tcN2b_23.out[18];
    ys[56][12] <== tcN2b_23.out[19];
    ys[56][13] <== tcN2b_23.out[20];
    ys[56][14] <== tcN2b_23.out[21];
    ys[56][15] <== tcN2b_23.out[22];
    ys[56][16] <== tcN2b_23.out[23];
    ys[56][17] <== tcN2b_23.out[24];
    ys[56][18] <== tcN2b_23.out[25];
    ys[56][19] <== tcN2b_23.out[26];
    ys[56][20] <== tcN2b_23.out[27];
    ys[56][21] <== tcN2b_23.out[28];
    ys[56][22] <== tcN2b_23.out[29];
    ys[56][23] <== tcN2b_23.out[30];
    ys[56][24] <== tcN2b_23.out[31];
    ys[56][25] <== tcN2b_23.out[32];
    ys[57][0] <== tcN2b_23.out[33];
    ys[57][1] <== tcN2b_23.out[34];
    ys[57][2] <== tcN2b_23.out[35];
    ys[57][3] <== tcN2b_23.out[36];
    ys[57][4] <== tcN2b_23.out[37];
    ys[57][5] <== tcN2b_23.out[38];
    ys[57][6] <== tcN2b_23.out[39];
    ys[57][7] <== tcN2b_23.out[40];
    ys[57][8] <== tcN2b_23.out[41];
    ys[57][9] <== tcN2b_23.out[42];
    ys[57][10] <== tcN2b_23.out[43];
    ys[57][11] <== tcN2b_23.out[44];
    ys[57][12] <== tcN2b_23.out[45];
    ys[57][13] <== tcN2b_23.out[46];
    ys[57][14] <== tcN2b_23.out[47];
    ys[57][15] <== tcN2b_23.out[48];
    ys[57][16] <== tcN2b_23.out[49];
    ys[57][17] <== tcN2b_23.out[50];
    ys[57][18] <== tcN2b_23.out[51];
    ys[57][19] <== tcN2b_23.out[52];
    ys[57][20] <== tcN2b_23.out[53];
    ys[57][21] <== tcN2b_23.out[54];
    ys[57][22] <== tcN2b_23.out[55];
    ys[57][23] <== tcN2b_23.out[56];
    ys[57][24] <== tcN2b_23.out[57];
    ys[57][25] <== tcN2b_23.out[58];
    ys[58][0] <== tcN2b_23.out[59];
    ys[58][1] <== tcN2b_23.out[60];
    ys[58][2] <== tcN2b_23.out[61];
    ys[58][3] <== tcN2b_23.out[62];
    ys[58][4] <== tcN2b_24.out[0];
    ys[58][5] <== tcN2b_24.out[1];
    ys[58][6] <== tcN2b_24.out[2];
    ys[58][7] <== tcN2b_24.out[3];
    ys[58][8] <== tcN2b_24.out[4];
    ys[58][9] <== tcN2b_24.out[5];
    ys[58][10] <== tcN2b_24.out[6];
    ys[58][11] <== tcN2b_24.out[7];
    ys[58][12] <== tcN2b_24.out[8];
    ys[58][13] <== tcN2b_24.out[9];
    ys[58][14] <== tcN2b_24.out[10];
    ys[58][15] <== tcN2b_24.out[11];
    ys[58][16] <== tcN2b_24.out[12];
    ys[58][17] <== tcN2b_24.out[13];
    ys[58][18] <== tcN2b_24.out[14];
    ys[58][19] <== tcN2b_24.out[15];
    ys[58][20] <== tcN2b_24.out[16];
    ys[58][21] <== tcN2b_24.out[17];
    ys[58][22] <== tcN2b_24.out[18];
    ys[58][23] <== tcN2b_24.out[19];
    ys[58][24] <== tcN2b_24.out[20];
    ys[58][25] <== tcN2b_24.out[21];
    ys[59][0] <== tcN2b_24.out[22];
    ys[59][1] <== tcN2b_24.out[23];
    ys[59][2] <== tcN2b_24.out[24];
    ys[59][3] <== tcN2b_24.out[25];
    ys[59][4] <== tcN2b_24.out[26];
    ys[59][5] <== tcN2b_24.out[27];
    ys[59][6] <== tcN2b_24.out[28];
    ys[59][7] <== tcN2b_24.out[29];
    ys[59][8] <== tcN2b_24.out[30];
    ys[59][9] <== tcN2b_24.out[31];
    ys[59][10] <== tcN2b_24.out[32];
    ys[59][11] <== tcN2b_24.out[33];
    ys[59][12] <== tcN2b_24.out[34];
    ys[59][13] <== tcN2b_24.out[35];
    ys[59][14] <== tcN2b_24.out[36];
    ys[59][15] <== tcN2b_24.out[37];
    ys[59][16] <== tcN2b_24.out[38];
    ys[59][17] <== tcN2b_24.out[39];
    ys[59][18] <== tcN2b_24.out[40];
    ys[59][19] <== tcN2b_24.out[41];
    ys[59][20] <== tcN2b_24.out[42];
    ys[59][21] <== tcN2b_24.out[43];
    ys[59][22] <== tcN2b_24.out[44];
    ys[59][23] <== tcN2b_24.out[45];
    ys[59][24] <== tcN2b_24.out[46];
    ys[59][25] <== tcN2b_24.out[47];
    ys[60][0] <== tcN2b_24.out[48];
    ys[60][1] <== tcN2b_24.out[49];
    ys[60][2] <== tcN2b_24.out[50];
    ys[60][3] <== tcN2b_24.out[51];
    ys[60][4] <== tcN2b_24.out[52];
    ys[60][5] <== tcN2b_24.out[53];
    ys[60][6] <== tcN2b_24.out[54];
    ys[60][7] <== tcN2b_24.out[55];
    ys[60][8] <== tcN2b_24.out[56];
    ys[60][9] <== tcN2b_24.out[57];
    ys[60][10] <== tcN2b_24.out[58];
    ys[60][11] <== tcN2b_24.out[59];
    ys[60][12] <== tcN2b_24.out[60];
    ys[60][13] <== tcN2b_24.out[61];
    ys[60][14] <== tcN2b_24.out[62];
    ys[60][15] <== tcN2b_25.out[0];
    ys[60][16] <== tcN2b_25.out[1];
    ys[60][17] <== tcN2b_25.out[2];
    ys[60][18] <== tcN2b_25.out[3];
    ys[60][19] <== tcN2b_25.out[4];
    ys[60][20] <== tcN2b_25.out[5];
    ys[60][21] <== tcN2b_25.out[6];
    ys[60][22] <== tcN2b_25.out[7];
    ys[60][23] <== tcN2b_25.out[8];
    ys[60][24] <== tcN2b_25.out[9];
    ys[60][25] <== tcN2b_25.out[10];
    ys[61][0] <== tcN2b_25.out[11];
    ys[61][1] <== tcN2b_25.out[12];
    ys[61][2] <== tcN2b_25.out[13];
    ys[61][3] <== tcN2b_25.out[14];
    ys[61][4] <== tcN2b_25.out[15];
    ys[61][5] <== tcN2b_25.out[16];
    ys[61][6] <== tcN2b_25.out[17];
    ys[61][7] <== tcN2b_25.out[18];
    ys[61][8] <== tcN2b_25.out[19];
    ys[61][9] <== tcN2b_25.out[20];
    ys[61][10] <== tcN2b_25.out[21];
    ys[61][11] <== tcN2b_25.out[22];
    ys[61][12] <== tcN2b_25.out[23];
    ys[61][13] <== tcN2b_25.out[24];
    ys[61][14] <== tcN2b_25.out[25];
    ys[61][15] <== tcN2b_25.out[26];
    ys[61][16] <== tcN2b_25.out[27];
    ys[61][17] <== tcN2b_25.out[28];
    ys[61][18] <== tcN2b_25.out[29];
    ys[61][19] <== tcN2b_25.out[30];
    ys[61][20] <== tcN2b_25.out[31];
    ys[61][21] <== tcN2b_25.out[32];
    ys[61][22] <== tcN2b_25.out[33];
    ys[61][23] <== tcN2b_25.out[34];
    ys[61][24] <== tcN2b_25.out[35];
    ys[61][25] <== tcN2b_25.out[36];
    ys[62][0] <== tcN2b_25.out[37];
    ys[62][1] <== tcN2b_25.out[38];
    ys[62][2] <== tcN2b_25.out[39];
    ys[62][3] <== tcN2b_25.out[40];
    ys[62][4] <== tcN2b_25.out[41];
    ys[62][5] <== tcN2b_25.out[42];
    ys[62][6] <== tcN2b_25.out[43];
    ys[62][7] <== tcN2b_25.out[44];
    ys[62][8] <== tcN2b_25.out[45];
    ys[62][9] <== tcN2b_25.out[46];
    ys[62][10] <== tcN2b_25.out[47];
    ys[62][11] <== tcN2b_25.out[48];
    ys[62][12] <== tcN2b_25.out[49];
    ys[62][13] <== tcN2b_25.out[50];
    ys[62][14] <== tcN2b_25.out[51];
    ys[62][15] <== tcN2b_25.out[52];
    ys[62][16] <== tcN2b_25.out[53];
    ys[62][17] <== tcN2b_25.out[54];
    ys[62][18] <== tcN2b_25.out[55];
    ys[62][19] <== tcN2b_25.out[56];
    ys[62][20] <== tcN2b_25.out[57];
    ys[62][21] <== tcN2b_25.out[58];
    ys[62][22] <== tcN2b_25.out[59];
    ys[62][23] <== tcN2b_25.out[60];
    ys[62][24] <== tcN2b_25.out[61];
    ys[62][25] <== tcN2b_25.out[62];
    ys[63][0] <== tcN2b_26.out[0];
    ys[63][1] <== tcN2b_26.out[1];
    ys[63][2] <== tcN2b_26.out[2];
    ys[63][3] <== tcN2b_26.out[3];
    ys[63][4] <== tcN2b_26.out[4];
    ys[63][5] <== tcN2b_26.out[5];
    ys[63][6] <== tcN2b_26.out[6];
    ys[63][7] <== tcN2b_26.out[7];
    ys[63][8] <== tcN2b_26.out[8];
    ys[63][9] <== tcN2b_26.out[9];
    ys[63][10] <== tcN2b_26.out[10];
    ys[63][11] <== tcN2b_26.out[11];
    ys[63][12] <== tcN2b_26.out[12];
    ys[63][13] <== tcN2b_26.out[13];
    ys[63][14] <== tcN2b_26.out[14];
    ys[63][15] <== tcN2b_26.out[15];
    ys[63][16] <== tcN2b_26.out[16];
    ys[63][17] <== tcN2b_26.out[17];
    ys[63][18] <== tcN2b_26.out[18];
    ys[63][19] <== tcN2b_26.out[19];
    ys[63][20] <== tcN2b_26.out[20];
    ys[63][21] <== tcN2b_26.out[21];
    ys[63][22] <== tcN2b_26.out[22];
    ys[63][23] <== tcN2b_26.out[23];
    ys[63][24] <== tcN2b_26.out[24];
    ys[63][25] <== tcN2b_26.out[25];

///////////
// Constrain polynomial check in vauations
///////////
    component verifyEvaluations = VerifyEvaluations();
    verifyEvaluations.enable <== enable;
    for (var i=0; i<8; i++) {
        for (var k=0; k<3; k++) {
            verifyEvaluations.challenges[i][k] <== challenges[i][k];
        }
    }
    for (var i=0; i<8; i++) {
        verifyEvaluations.publics[i] <== publics[i];
    }
    for (var i=0; i<79; i++) {
        for (var k=0; k<3; k++) {
            verifyEvaluations.evals[i][k] <== evals[i][k];
        }
    }

///////////
// Step0 Check and evaluate queries
///////////

    component verifyQueries[64];
    component s0_merkle1[64];


    component s0_merkle3[64];

    component s0_merkle4[64];
    component s0_merkleC[64];
    component s0_lowValues[64];

    for (var q=0; q<64; q++) {
        verifyQueries[q] = VerifyQuery();
        s0_merkle1[q] = MerkleHash(1, 12, 67108864);


        s0_merkle3[q] = MerkleHash(1, 3, 67108864);

        s0_merkle4[q] = MerkleHash(1, 79, 67108864);
        s0_merkleC[q] = MerkleHash(1, 20, 67108864);
        s0_lowValues[q] = TreeSelector(5, 3) ;

        for (var i=0; i<26; i++ ) {
            verifyQueries[q].ys[i] <== ys[q][i];
            s0_merkle1[q].key[i] <== ys[q][i];


            s0_merkle3[q].key[i] <== ys[q][i];

            s0_merkle4[q].key[i] <== ys[q][i];
            s0_merkleC[q].key[i] <== ys[q][i];
        }
        for (var i=0; i<12; i++ ) {
            verifyQueries[q].tree1[i] <== s0_vals1[q][i];
            s0_merkle1[q].values[i][0] <== s0_vals1[q][i];
        }


        for (var i=0; i<3; i++ ) {
            verifyQueries[q].tree3[i] <== s0_vals3[q][i];
            s0_merkle3[q].values[i][0] <== s0_vals3[q][i];
        }

        for (var i=0; i<79; i++ ) {
            verifyQueries[q].tree4[i] <== s0_vals4[q][i];
            s0_merkle4[q].values[i][0] <== s0_vals4[q][i];
        }
        for (var i=0; i<20; i++ ) {
            verifyQueries[q].consts[i] <== s0_valsC[q][i];
            s0_merkleC[q].values[i][0] <== s0_valsC[q][i];
        }
        for (var i=0; i<8; i++) {
            for (var e=0; e<3; e++) {
                verifyQueries[q].challenges[i][e] <== challenges[i][e];
            }
        }
        for (var i=0; i<79; i++) {
            for (var e=0; e<3; e++) {
                verifyQueries[q].evals[i][e] <== evals[i][e];
            }
        }
        for (var i=0; i<26;i++) {
            for (var j=0; j<4; j++) {
                s0_merkle1[q].siblings[i][j] <== s0_siblings1[q][i][j];


                s0_merkle3[q].siblings[i][j] <== s0_siblings3[q][i][j];

                s0_merkle4[q].siblings[i][j] <== s0_siblings4[q][i][j];
                s0_merkleC[q].siblings[i][j] <== s0_siblingsC[q][i][j];
            }
        }
        for (var j=0; j<4; j++) {
            enable * (s0_merkle1[q].root[j] - root1[j]) === 0;


            enable * (s0_merkle3[q].root[j] - root3[j]) === 0;

            enable * (s0_merkle4[q].root[j] - root4[j]) === 0;
            enable * (s0_merkleC[q].root[j] - rootC[j]) === 0;
        }

        for (var i=0; i<32; i++) {
            for (var e=0; e<3; e++) {
                s0_lowValues[q].values[i][e] <== s1_vals[q][i*3+e];
            }
        }
        for (var i=0; i<5; i++) {
            s0_lowValues[q].key[i] <== ys[q][i + 21];
        }
        for (var e=0; e<3; e++) {
            enable * (s0_lowValues[q].out[e] - verifyQueries[q].out[e]) === 0;
        }

    }

    component s1_merkle[64];
    component s1_fft[64];
    component s1_evalPol[64];
    component s1_lowValues[64];
    signal s1_sx[64][21];

    for (var q=0; q<64; q++) {
        s1_merkle[q] = MerkleHash(3, 32, 2097152);
        s1_fft[q] = FFT(5, 3, 1, 1);
        s1_evalPol[q] = EvalPol(32);
        s1_lowValues[q] = TreeSelector(5, 3) ;
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s1_merkle[q].values[i][e] <== s1_vals[q][i*3+e];
                s1_fft[q].in[i][e] <== s1_vals[q][i*3+e];
            }
        }
        for (var i=0; i<21; i++) {
            for (var j=0; j<4; j++) {
                s1_merkle[q].siblings[i][j] <== s1_siblings[q][i][j];
            }
            s1_merkle[q].key[i] <== ys[q][i];
        }
        s1_sx[q][0] <==  5646962470228954384 *  ( ys[q][0] * 16884827967813875097 +1);
        for (var i=1; i<21; i++) {
            s1_sx[q][i] <== s1_sx[q][i-1] *  ( ys[q][i] * ((1/roots(26 -i)) -1) +1);
        }
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s1_evalPol[q].pol[i][e] <== s1_fft[q].out[i][e];
            }
        }
        for (var e=0; e<3; e++) {
            s1_evalPol[q].x[e] <== s1_specialX[e] *  s1_sx[q][20];
        }
        for (var i=0; i<32; i++) {
            for (var e=0; e<3; e++) {
                s1_lowValues[q].values[i][e] <== s2_vals[q][i*3+e];
            }
        }
        for (var i=0; i<5; i++) {
            s1_lowValues[q].key[i] <== ys[q][i + 16];
        }
        for (var e=0; e<3; e++) {
            enable * (s1_lowValues[q].out[e] - s1_evalPol[q].out[e]) === 0;
        }

        enable * (s1_merkle[q].root[0] - s1_root[0]) === 0;
        enable * (s1_merkle[q].root[1] - s1_root[1]) === 0;
        enable * (s1_merkle[q].root[2] - s1_root[2]) === 0;
        enable * (s1_merkle[q].root[3] - s1_root[3]) === 0;
    }
    component s2_merkle[64];
    component s2_fft[64];
    component s2_evalPol[64];
    component s2_lowValues[64];
    signal s2_sx[64][16];

    for (var q=0; q<64; q++) {
        s2_merkle[q] = MerkleHash(3, 32, 65536);
        s2_fft[q] = FFT(5, 3, 1, 1);
        s2_evalPol[q] = EvalPol(32);
        s2_lowValues[q] = TreeSelector(5, 3) ;
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s2_merkle[q].values[i][e] <== s2_vals[q][i*3+e];
                s2_fft[q].in[i][e] <== s2_vals[q][i*3+e];
            }
        }
        for (var i=0; i<16; i++) {
            for (var j=0; j<4; j++) {
                s2_merkle[q].siblings[i][j] <== s2_siblings[q][i][j];
            }
            s2_merkle[q].key[i] <== ys[q][i];
        }
        s2_sx[q][0] <==  11143297345130450484 *  ( ys[q][0] * 11898519751787946855 +1);
        for (var i=1; i<16; i++) {
            s2_sx[q][i] <== s2_sx[q][i-1] *  ( ys[q][i] * ((1/roots(21 -i)) -1) +1);
        }
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s2_evalPol[q].pol[i][e] <== s2_fft[q].out[i][e];
            }
        }
        for (var e=0; e<3; e++) {
            s2_evalPol[q].x[e] <== s2_specialX[e] *  s2_sx[q][15];
        }
        for (var i=0; i<32; i++) {
            for (var e=0; e<3; e++) {
                s2_lowValues[q].values[i][e] <== s3_vals[q][i*3+e];
            }
        }
        for (var i=0; i<5; i++) {
            s2_lowValues[q].key[i] <== ys[q][i + 11];
        }
        for (var e=0; e<3; e++) {
            enable * (s2_lowValues[q].out[e] - s2_evalPol[q].out[e]) === 0;
        }

        enable * (s2_merkle[q].root[0] - s2_root[0]) === 0;
        enable * (s2_merkle[q].root[1] - s2_root[1]) === 0;
        enable * (s2_merkle[q].root[2] - s2_root[2]) === 0;
        enable * (s2_merkle[q].root[3] - s2_root[3]) === 0;
    }
    component s3_merkle[64];
    component s3_fft[64];
    component s3_evalPol[64];
    component s3_lowValues[64];
    signal s3_sx[64][11];

    for (var q=0; q<64; q++) {
        s3_merkle[q] = MerkleHash(3, 32, 2048);
        s3_fft[q] = FFT(5, 3, 1, 1);
        s3_evalPol[q] = EvalPol(32);
        s3_lowValues[q] = TreeSelector(5, 3) ;
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s3_merkle[q].values[i][e] <== s3_vals[q][i*3+e];
                s3_fft[q].in[i][e] <== s3_vals[q][i*3+e];
            }
        }
        for (var i=0; i<11; i++) {
            for (var j=0; j<4; j++) {
                s3_merkle[q].siblings[i][j] <== s3_siblings[q][i][j];
            }
            s3_merkle[q].key[i] <== ys[q][i];
        }
        s3_sx[q][0] <==  18352195122931766578 *  ( ys[q][0] * 7868944258580147480 +1);
        for (var i=1; i<11; i++) {
            s3_sx[q][i] <== s3_sx[q][i-1] *  ( ys[q][i] * ((1/roots(16 -i)) -1) +1);
        }
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s3_evalPol[q].pol[i][e] <== s3_fft[q].out[i][e];
            }
        }
        for (var e=0; e<3; e++) {
            s3_evalPol[q].x[e] <== s3_specialX[e] *  s3_sx[q][10];
        }
        for (var i=0; i<32; i++) {
            for (var e=0; e<3; e++) {
                s3_lowValues[q].values[i][e] <== s4_vals[q][i*3+e];
            }
        }
        for (var i=0; i<5; i++) {
            s3_lowValues[q].key[i] <== ys[q][i + 6];
        }
        for (var e=0; e<3; e++) {
            enable * (s3_lowValues[q].out[e] - s3_evalPol[q].out[e]) === 0;
        }

        enable * (s3_merkle[q].root[0] - s3_root[0]) === 0;
        enable * (s3_merkle[q].root[1] - s3_root[1]) === 0;
        enable * (s3_merkle[q].root[2] - s3_root[2]) === 0;
        enable * (s3_merkle[q].root[3] - s3_root[3]) === 0;
    }
    component s4_merkle[64];
    component s4_fft[64];
    component s4_evalPol[64];
    component s4_lowValues[64];
    signal s4_sx[64][6];

    for (var q=0; q<64; q++) {
        s4_merkle[q] = MerkleHash(3, 32, 64);
        s4_fft[q] = FFT(5, 3, 1, 1);
        s4_evalPol[q] = EvalPol(32);
        s4_lowValues[q] = TreeSelector(6, 3) ;
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s4_merkle[q].values[i][e] <== s4_vals[q][i*3+e];
                s4_fft[q].in[i][e] <== s4_vals[q][i*3+e];
            }
        }
        for (var i=0; i<6; i++) {
            for (var j=0; j<4; j++) {
                s4_merkle[q].siblings[i][j] <== s4_siblings[q][i][j];
            }
            s4_merkle[q].key[i] <== ys[q][i];
        }
        s4_sx[q][0] <==  18001238828729130303 *  ( ys[q][0] * 8548973421900915980 +1);
        for (var i=1; i<6; i++) {
            s4_sx[q][i] <== s4_sx[q][i-1] *  ( ys[q][i] * ((1/roots(11 -i)) -1) +1);
        }
        for (var i=0; i< 32; i++) {
            for (var e=0; e<3; e++) {
                s4_evalPol[q].pol[i][e] <== s4_fft[q].out[i][e];
            }
        }
        for (var e=0; e<3; e++) {
            s4_evalPol[q].x[e] <== s4_specialX[e] *  s4_sx[q][5];
        }
        for (var i=0; i<64; i++) {
            for (var e=0; e<3; e++) {
                s4_lowValues[q].values[i][e] <== finalPol[i][e];
            }
        }
        for (var i=0; i<6; i++) {
            s4_lowValues[q].key[i] <== ys[q][i];
        }
        for (var e=0; e<3; e++) {
            enable * (s4_lowValues[q].out[e] - s4_evalPol[q].out[e]) === 0;
        }

        enable * (s4_merkle[q].root[0] - s4_root[0]) === 0;
        enable * (s4_merkle[q].root[1] - s4_root[1]) === 0;
        enable * (s4_merkle[q].root[2] - s4_root[2]) === 0;
        enable * (s4_merkle[q].root[3] - s4_root[3]) === 0;
    }

///////
// Check Degree last pol
///////
// Last FFT
    component lastIFFT = FFT(6, 3, 1, 1 );

    for (var k=0; k< 64; k++ ){
        for (var e=0; e<3; e++) {
            lastIFFT.in[k][e] <== finalPol[k][e];
        }
    }

    for (var k= 16; k< 64; k++ ) {
        for (var e=0; e<3; e++) {
            enable * lastIFFT.out[k][e] === 0;
        }
    }
}

