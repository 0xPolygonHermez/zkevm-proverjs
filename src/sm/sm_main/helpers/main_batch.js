const Helper = require('./helper.js');
const { Scalar } = require("ffjavascript");
const {
    scalar2fea,
    fea2String,
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;

module.exports = class Main extends Helper {
    /**
    * Set input parameters to initial registers
    * @param {Field} Fr - field element
    * @param {Object} pols - polynomials
    * @param {Object} ctx - context
    */
    initState(Fr, pols, ctx) {
        // Set oldStateRoot to register B
        [
            pols.SR0[0],
            pols.SR1[0],
            pols.SR2[0],
            pols.SR3[0],
            pols.SR4[0],
            pols.SR5[0],
            pols.SR6[0],
            pols.SR7[0],
        ] = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldStateRoot));

        // Set oldBatchAccInputHash to register C
        [
            pols.C0[0],
            pols.C1[0],
            pols.C2[0],
            pols.C3[0],
            pols.C4[0],
            pols.C5[0],
            pols.C6[0],
            pols.C7[0],
        ] = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldBatchAccInputHash));

        // Set previousL1InfoTreeRoot to register D
        [
            pols.D0[0],
            pols.D1[0],
            pols.D2[0],
            pols.D3[0],
            pols.D4[0],
            pols.D5[0],
            pols.D6[0],
            pols.D7[0],
        ] = scalar2fea(ctx.Fr, Scalar.e(ctx.input.previousL1InfoTreeRoot));

        // Set previousL1InfoTreeIndex to RCX register
        pols.RCX[0] = ctx.Fr.e(ctx.input.previousL1InfoTreeIndex);

        // Set chainID to GAS register
        pols.GAS[0] = ctx.Fr.e(ctx.input.chainID);

        // Set forkID to CTX register
        pols.CTX[0] = ctx.Fr.e(ctx.input.forkID);

        // Set other registers to zero
        pols.A0[0] = Fr.zero;
        pols.A1[0] = Fr.zero;
        pols.A2[0] = Fr.zero;
        pols.A3[0] = Fr.zero;
        pols.A4[0] = Fr.zero;
        pols.A5[0] = Fr.zero;
        pols.A6[0] = Fr.zero;
        pols.A7[0] = Fr.zero;
        pols.B0[0] = Fr.zero;
        pols.B1[0] = Fr.zero;
        pols.B2[0] = Fr.zero;
        pols.B3[0] = Fr.zero;
        pols.B4[0] = Fr.zero;
        pols.B5[0] = Fr.zero;
        pols.B6[0] = Fr.zero;
        pols.B7[0] = Fr.zero;
        pols.E0[0] = Fr.zero;
        pols.E1[0] = Fr.zero;
        pols.E2[0] = Fr.zero;
        pols.E3[0] = Fr.zero;
        pols.E4[0] = Fr.zero;
        pols.E5[0] = Fr.zero;
        pols.E6[0] = Fr.zero;
        pols.E7[0] = Fr.zero;
        pols.SP[0] = 0n;
        pols.PC[0] = 0n;
        pols.HASHPOS[0] = 0n;
        pols.RR[0] = 0n;
        pols.zkPC[0] = 0n;
        pols.cntArith[0] = 0n;
        pols.cntBinary[0] = 0n;
        pols.cntKeccakF[0] = 0n;
        pols.cntSha256F[0] = 0n;
        pols.cntMemAlign[0] = 0n;
        pols.cntPaddingPG[0] = 0n;
        pols.cntPoseidonG[0] = 0n;
        pols.RCXInv[0] = 0n;
        pols.op0Inv[0] = 0n;
        pols.RID[0] = 0n;
    }

    /**
    * This function creates an array of polynomials and a mapping that maps the reference name in pil to the polynomial
    * @param {Field} Fr - Field element
    * @param {Object} pols - polynomials
    * @param {Object} ctx - context
    */
    checkFinalState(Fr, pols, ctx) {

        if (
            (!Fr.isZero(pols.A0[0])) ||
            (!Fr.isZero(pols.A1[0])) ||
            (!Fr.isZero(pols.A2[0])) ||
            (!Fr.isZero(pols.A3[0])) ||
            (!Fr.isZero(pols.A4[0])) ||
            (!Fr.isZero(pols.A5[0])) ||
            (!Fr.isZero(pols.A6[0])) ||
            (!Fr.isZero(pols.A7[0])) ||
            (!Fr.isZero(pols.B0[0])) ||
            (!Fr.isZero(pols.B1[0])) ||
            (!Fr.isZero(pols.B2[0])) ||
            (!Fr.isZero(pols.B3[0])) ||
            (!Fr.isZero(pols.B4[0])) ||
            (!Fr.isZero(pols.B5[0])) ||
            (!Fr.isZero(pols.B6[0])) ||
            (!Fr.isZero(pols.B7[0])) ||
            (!Fr.isZero(pols.E0[0])) ||
            (!Fr.isZero(pols.E1[0])) ||
            (!Fr.isZero(pols.E2[0])) ||
            (!Fr.isZero(pols.E3[0])) ||
            (!Fr.isZero(pols.E4[0])) ||
            (!Fr.isZero(pols.E5[0])) ||
            (!Fr.isZero(pols.E6[0])) ||
            (!Fr.isZero(pols.E7[0])) ||
            (pols.PC[0]) ||
            (pols.SP[0]) ||
            (pols.HASHPOS[0]) ||
            (pols.RR[0]) ||
            (pols.zkPC[0])
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();

            if(ctx.step >= (ctx.stepsN - 1)) console.log("Not enough steps to finalize execution (${ctx.step},${ctx.stepsN-1})\n");
            throw new Error("Program terminated with registers A, B, E, PC, SP, HASHPOS, RR, zkPC not set to zero");
        }

        const feaOldStateRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldStateRoot));
        if (
            (!Fr.eq(pols.SR0[0], feaOldStateRoot[0])) ||
            (!Fr.eq(pols.SR1[0], feaOldStateRoot[1])) ||
            (!Fr.eq(pols.SR2[0], feaOldStateRoot[2])) ||
            (!Fr.eq(pols.SR3[0], feaOldStateRoot[3])) ||
            (!Fr.eq(pols.SR4[0], feaOldStateRoot[4])) ||
            (!Fr.eq(pols.SR5[0], feaOldStateRoot[5])) ||
            (!Fr.eq(pols.SR6[0], feaOldStateRoot[6])) ||
            (!Fr.eq(pols.SR7[0], feaOldStateRoot[7]))
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register SR not ended equal as its initial value");
        }

        const feaOldBatchAccInputHash = scalar2fea(ctx.Fr, Scalar.e(ctx.input.oldBatchAccInputHash));
        if (
            (!Fr.eq(pols.C0[0], feaOldBatchAccInputHash[0])) ||
            (!Fr.eq(pols.C1[0], feaOldBatchAccInputHash[1])) ||
            (!Fr.eq(pols.C2[0], feaOldBatchAccInputHash[2])) ||
            (!Fr.eq(pols.C3[0], feaOldBatchAccInputHash[3])) ||
            (!Fr.eq(pols.C4[0], feaOldBatchAccInputHash[4])) ||
            (!Fr.eq(pols.C5[0], feaOldBatchAccInputHash[5])) ||
            (!Fr.eq(pols.C6[0], feaOldBatchAccInputHash[6])) ||
            (!Fr.eq(pols.C7[0], feaOldBatchAccInputHash[7]))
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register C not ended equal as its initial value");
        }

        const feaPreviousL1InfoTreeRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.previousL1InfoTreeRoot));
        if (
            (!Fr.eq(pols.D0[0], feaPreviousL1InfoTreeRoot[0])) ||
            (!Fr.eq(pols.D1[0], feaPreviousL1InfoTreeRoot[1])) ||
            (!Fr.eq(pols.D2[0], feaPreviousL1InfoTreeRoot[2])) ||
            (!Fr.eq(pols.D3[0], feaPreviousL1InfoTreeRoot[3])) ||
            (!Fr.eq(pols.D4[0], feaPreviousL1InfoTreeRoot[4])) ||
            (!Fr.eq(pols.D5[0], feaPreviousL1InfoTreeRoot[5])) ||
            (!Fr.eq(pols.D6[0], feaPreviousL1InfoTreeRoot[6])) ||
            (!Fr.eq(pols.D7[0], feaPreviousL1InfoTreeRoot[7]))
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register D not ended equal as its initial value");
        }

        if (!Fr.eq(pols.RCX[0], ctx.Fr.e(ctx.input.previousL1InfoTreeIndex))){
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register RCX not ended equal as its initial value");
        }

        if (!Fr.eq(pols.GAS[0], ctx.Fr.e(ctx.input.chainID))){
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register GAS not ended equal as its initial value");
        }

        if (!Fr.eq(pols.CTX[0], ctx.Fr.e(ctx.input.forkID))){
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error(`Register CTX not ended equal as its initial value CTX[0]:${pols.CTX[0]} forkID:${ctx.input.forkID}`);
        }
    }


    /**
    * get output registers and assert them against outputs provided
    * @param {Object} ctx - context
    */
    assertOutputs(ctx){
        const feaNewStateRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newStateRoot));

        if (
            (!ctx.Fr.eq(ctx.SR[0], feaNewStateRoot[0])) ||
            (!ctx.Fr.eq(ctx.SR[1], feaNewStateRoot[1])) ||
            (!ctx.Fr.eq(ctx.SR[2], feaNewStateRoot[2])) ||
            (!ctx.Fr.eq(ctx.SR[3], feaNewStateRoot[3])) ||
            (!ctx.Fr.eq(ctx.SR[4], feaNewStateRoot[4])) ||
            (!ctx.Fr.eq(ctx.SR[5], feaNewStateRoot[5])) ||
            (!ctx.Fr.eq(ctx.SR[6], feaNewStateRoot[6])) ||
            (!ctx.Fr.eq(ctx.SR[7], feaNewStateRoot[7]))
        ) {
            let errorMsg = "Assert Error: newStateRoot does not match\n";
            errorMsg += `   State root computed: ${fea2String(ctx.Fr, ctx.SR)}\n`;
            errorMsg += `   State root expected: ${ctx.input.newStateRoot}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

    // Check timestamp
    const scalarNewLastTimestamp = Scalar.e(ctx.input.newLastTimestamp);

    if (!Scalar.eq(ctx.RR, scalarNewLastTimestamp)) {
        let errorMsg = "Assert Error: newLastTimestamp does not match\n";
        errorMsg += `   newLastTimestamp computed: ${Scalar.e(ctx.RR)}\n`;
        errorMsg += `   newLastTimestamp expected: ${scalarNewLastTimestamp}\n`;
        errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    // Check currentL1InfoTreeIndex
    const scalarcurrentL1InfoTreeIndex = Scalar.e(ctx.input.currentL1InfoTreeIndex);

    if (!Scalar.eq(ctx.RCX, scalarcurrentL1InfoTreeIndex)) {
        let errorMsg = "Assert Error: currentL1InfoTreeIndex does not match\n";
        errorMsg += `   currentL1InfoTreeIndex computed: ${Scalar.e(ctx.RCX)}\n`;
        errorMsg += `   currentL1InfoTreeIndex expected: ${scalarcurrentL1InfoTreeIndex}\n`;
        errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

    // Check currentL1InfoTreeRoot
    const feaCurrentL1InfoTreeRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.currentL1InfoTreeRoot));

    if (
        (!ctx.Fr.eq(ctx.D[0], feaCurrentL1InfoTreeRoot[0])) ||
        (!ctx.Fr.eq(ctx.D[1], feaCurrentL1InfoTreeRoot[1])) ||
        (!ctx.Fr.eq(ctx.D[2], feaCurrentL1InfoTreeRoot[2])) ||
        (!ctx.Fr.eq(ctx.D[3], feaCurrentL1InfoTreeRoot[3])) ||
        (!ctx.Fr.eq(ctx.D[4], feaCurrentL1InfoTreeRoot[4])) ||
        (!ctx.Fr.eq(ctx.D[5], feaCurrentL1InfoTreeRoot[5])) ||
        (!ctx.Fr.eq(ctx.D[6], feaCurrentL1InfoTreeRoot[6])) ||
        (!ctx.Fr.eq(ctx.D[7], feaCurrentL1InfoTreeRoot[7]))
    ) {
        let errorMsg = "Assert Error: currentL1InfoTreeRoot does not match\n";
        errorMsg += `   currentL1InfoTreeRoot computed: ${fea2String(ctx.Fr, ctx.D)}\n`;
        errorMsg += `   currentL1InfoTreeRoot expected: ${ctx.input.currentL1InfoTreeRoot}\n`;
        errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
        throw new Error(errorMsg);
    }

        // Check newBatchAccInputHash
        const feaNewBatchAccInputHash = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newBatchAccInputHash));

        if (
            (!ctx.Fr.eq(ctx.C[0], feaNewBatchAccInputHash[0])) ||
            (!ctx.Fr.eq(ctx.C[1], feaNewBatchAccInputHash[1])) ||
            (!ctx.Fr.eq(ctx.C[2], feaNewBatchAccInputHash[2])) ||
            (!ctx.Fr.eq(ctx.C[3], feaNewBatchAccInputHash[3])) ||
            (!ctx.Fr.eq(ctx.C[4], feaNewBatchAccInputHash[4])) ||
            (!ctx.Fr.eq(ctx.C[5], feaNewBatchAccInputHash[5])) ||
            (!ctx.Fr.eq(ctx.C[6], feaNewBatchAccInputHash[6])) ||
            (!ctx.Fr.eq(ctx.C[7], feaNewBatchAccInputHash[7]))
        ) {
            let errorMsg = "Assert Error: newBatchAccInputHash does not match\n";
            errorMsg += `   newBatchAccInputHash computed: ${fea2String(ctx.Fr, ctx.C)}\n`;
            errorMsg += `   newBatchAccInputHash expected: ${ctx.input.newBatchAccInputHash}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        // Check newLocalExitRoot
        const feaNewLocalExitRoot = scalar2fea(ctx.Fr, Scalar.e(ctx.input.newLocalExitRoot));

        if (
            (!ctx.Fr.eq(ctx.E[0], feaNewLocalExitRoot[0])) ||
            (!ctx.Fr.eq(ctx.E[1], feaNewLocalExitRoot[1])) ||
            (!ctx.Fr.eq(ctx.E[2], feaNewLocalExitRoot[2])) ||
            (!ctx.Fr.eq(ctx.E[3], feaNewLocalExitRoot[3])) ||
            (!ctx.Fr.eq(ctx.E[4], feaNewLocalExitRoot[4])) ||
            (!ctx.Fr.eq(ctx.E[5], feaNewLocalExitRoot[5])) ||
            (!ctx.Fr.eq(ctx.E[6], feaNewLocalExitRoot[6])) ||
            (!ctx.Fr.eq(ctx.E[7], feaNewLocalExitRoot[7]))
        ) {
            let errorMsg = "Assert Error: NewLocalExitRoot does not match\n";
            errorMsg += `   NewLocalExitRoot computed: ${fea2String(ctx.Fr, ctx.E)}\n`;
            errorMsg += `   NewLocalExitRoot expected: ${ctx.input.newLocalExitRoot}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }
        console.log("Assert outputs run successfully");
    }
}