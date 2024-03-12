const Helper = require('./helper.js');

module.exports = class Main extends Helper {
    /**
    * Set input parameters to initial registers
    * @param {Field} Fr - field element
    * @param {Object} pols - polynomials
    * @param {Object} ctx - context
    */
    initState(Fr, pols, ctx) {
        // Set oldBlobStateRoot to register B
        [
            pols.B0[0],
            pols.B1[0],
            pols.B2[0],
            pols.B3[0],
            pols.B4[0],
            pols.B5[0],
            pols.B6[0],
            pols.B7[0]
        ] = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldBlobStateRoot));

        // Set oldBlobAccInputHash to register C
        [
            pols.C0[0],
            pols.C1[0],
            pols.C2[0],
            pols.C3[0],
            pols.C4[0],
            pols.C5[0],
            pols.C6[0],
            pols.C7[0]
        ] = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldBlobAccInputHash));

        // Set oldNumBlob to RR register
        pols.RR[0] = ctx.Fr.e(ctx.input.oldNumBlob);

        // Set oldStateRoot to register SR
        [
            pols.SR0[0],
            pols.SR1[0],
            pols.SR2[0],
            pols.SR3[0],
            pols.SR4[0],
            pols.SR5[0],
            pols.SR6[0],
            pols.SR7[0]
        ] = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldStateRoot));

        // Set forkID to RCX register
        pols.RCX[0] = ctx.Fr.e(ctx.input.forkID);

        pols.A0[0] = Fr.zero;
        pols.A1[0] = Fr.zero;
        pols.A2[0] = Fr.zero;
        pols.A3[0] = Fr.zero;
        pols.A4[0] = Fr.zero;
        pols.A5[0] = Fr.zero;
        pols.A6[0] = Fr.zero;
        pols.A7[0] = Fr.zero;
        pols.D0[0] = Fr.zero;
        pols.D1[0] = Fr.zero;
        pols.D2[0] = Fr.zero;
        pols.D3[0] = Fr.zero;
        pols.D4[0] = Fr.zero;
        pols.D5[0] = Fr.zero;
        pols.D6[0] = Fr.zero;
        pols.D7[0] = Fr.zero;
        pols.E0[0] = Fr.zero;
        pols.E1[0] = Fr.zero;
        pols.E2[0] = Fr.zero;
        pols.E3[0] = Fr.zero;
        pols.E4[0] = Fr.zero;
        pols.E5[0] = Fr.zero;
        pols.E6[0] = Fr.zero;
        pols.E7[0] = Fr.zero;
        pols.CTX[0] = 0n;
        pols.SP[0] = 0n;
        pols.PC[0] = 0n;
        pols.GAS[0] = 0n;
        pols.HASHPOS[0] = 0n;
        pols.zkPC[0] = 0n;
        pols.cntArith[0] = 0n;
        pols.cntBinary[0] = 0n;
        pols.cntKeccakF[0] = 0n;
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
            (!Fr.isZero(pols.D0[0])) ||
            (!Fr.isZero(pols.D1[0])) ||
            (!Fr.isZero(pols.D2[0])) ||
            (!Fr.isZero(pols.D3[0])) ||
            (!Fr.isZero(pols.D4[0])) ||
            (!Fr.isZero(pols.D5[0])) ||
            (!Fr.isZero(pols.D6[0])) ||
            (!Fr.isZero(pols.D7[0])) ||
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
            (pols.GAS[0]) ||
            (pols.HASHPOS[0])
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();

            if(ctx.step >= (ctx.stepsN - 1)) console.log("Not enough steps to finalize execution (${ctx.step},${ctx.stepsN-1})\n");
            throw new Error("Program terminated with registers A, D, E, SP, PC, GAS, HASHPOS, zkPC not set to zero");
        }

        const feaOldBlobStateRoot = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldBlobStateRoot));
        if (
            (!Fr.eq(pols.B0[0], feaOldBlobStateRoot[0])) ||
            (!Fr.eq(pols.B1[0], feaOldBlobStateRoot[1])) ||
            (!Fr.eq(pols.B2[0], feaOldBlobStateRoot[2])) ||
            (!Fr.eq(pols.B3[0], feaOldBlobStateRoot[3])) ||
            (!Fr.eq(pols.B4[0], feaOldBlobStateRoot[4])) ||
            (!Fr.eq(pols.B5[0], feaOldBlobStateRoot[5])) ||
            (!Fr.eq(pols.B6[0], feaOldBlobStateRoot[6])) ||
            (!Fr.eq(pols.B7[0], feaOldBlobStateRoot[7]))
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register B not terminetd equal as its initial value");
        }

        const feaOldBlobAccInputHash = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldBlobAccInputHash));
        if (
            (!Fr.eq(pols.C0[0], feaOldBlobAccInputHash[0])) ||
            (!Fr.eq(pols.C1[0], feaOldBlobAccInputHash[1])) ||
            (!Fr.eq(pols.C2[0], feaOldBlobAccInputHash[2])) ||
            (!Fr.eq(pols.C3[0], feaOldBlobAccInputHash[3])) ||
            (!Fr.eq(pols.C4[0], feaOldBlobAccInputHash[4])) ||
            (!Fr.eq(pols.C5[0], feaOldBlobAccInputHash[5])) ||
            (!Fr.eq(pols.C6[0], feaOldBlobAccInputHash[6])) ||
            (!Fr.eq(pols.C7[0], feaOldBlobAccInputHash[7]))
        ) {
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register C not termined equal as its initial value");
        }

        if (!Fr.eq(pols.RR[0], ctx.Fr.e(ctx.input.oldNumBatch))){
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error("Register RR not termined equal as its initial value");
        }

        const feaOldStateRoot = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.oldStateRoot));
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
            throw new Error("Register SR not termined equal as its initial value");
        }

        if (!Fr.eq(pols.RCX[0], ctx.Fr.e(ctx.input.forkID))){
            if(this.fullTracer) this.fullTracer.exportTrace();
            throw new Error(`Register RCX not termined equal as its initial value RCX[0]:${pols.RCX[0]} forkID:${ctx.input.forkID}`);
        }
    }

    /**
    * get output registers and assert them against outputs provided
    * @param {Object} ctx - context
    */
    assertOutputs(ctx){
        const feaNewBlobStateRoot = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.newBlobStateRoot));

        if (
            (!ctx.Fr.eq(ctx.B[0], feaNewBlobStateRoot[0])) ||
            (!ctx.Fr.eq(ctx.B[1], feaNewBlobStateRoot[1])) ||
            (!ctx.Fr.eq(ctx.B[2], feaNewBlobStateRoot[2])) ||
            (!ctx.Fr.eq(ctx.B[3], feaNewBlobStateRoot[3])) ||
            (!ctx.Fr.eq(ctx.B[4], feaNewBlobStateRoot[4])) ||
            (!ctx.Fr.eq(ctx.B[5], feaNewBlobStateRoot[5])) ||
            (!ctx.Fr.eq(ctx.B[6], feaNewBlobStateRoot[6])) ||
            (!ctx.Fr.eq(ctx.B[7], feaNewBlobStateRoot[7]))
        ) {
            let errorMsg = "Assert Error: newStateRoot does not match\n";
            errorMsg += `   newBlobStateRoot computed: ${this.fea2String(ctx.Fr, ctx.B)}\n`;
            errorMsg += `   newBlobStateRoot expected: ${ctx.input.newBlobStateRoot}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        const feaNewBlobAccInputHash = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.newBlobAccInputHash));

        if (
            (!ctx.Fr.eq(ctx.C[0], feaNewBlobAccInputHash[0])) ||
            (!ctx.Fr.eq(ctx.C[1], feaNewBlobAccInputHash[1])) ||
            (!ctx.Fr.eq(ctx.C[2], feaNewBlobAccInputHash[2])) ||
            (!ctx.Fr.eq(ctx.C[3], feaNewBlobAccInputHash[3])) ||
            (!ctx.Fr.eq(ctx.C[4], feaNewBlobAccInputHash[4])) ||
            (!ctx.Fr.eq(ctx.C[5], feaNewBlobAccInputHash[5])) ||
            (!ctx.Fr.eq(ctx.C[6], feaNewBlobAccInputHash[6])) ||
            (!ctx.Fr.eq(ctx.C[7], feaNewBlobAccInputHash[7]))
        ) {
            let errorMsg = "Assert Error: newBlobAccInputHash does not match\n";
            errorMsg += `   newBlobAccInputHash computed: ${this.fea2String(ctx.Fr, ctx.C)}\n`;
            errorMsg += `   newBlobAccInputHash expected: ${ctx.input.newBlobAccInputHash}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        if (!ctx.Fr.eq(ctx.GAS, ctx.Fr.e(ctx.input.newNumBlob))){
            let errorMsg = "Assert Error: newNumBlob does not match\n";
            errorMsg += `   newNumBlob computed: ${Number(ctx.GAS)}\n`;
            errorMsg += `   newNumBlob expected: ${ctx.input.newNumBlob}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        const feaFinalAccBatchHashData = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.finalAccBatchHashData));

        if (
            (!ctx.Fr.eq(ctx.A[0], feaFinalAccBatchHashData[0])) ||
            (!ctx.Fr.eq(ctx.A[1], feaFinalAccBatchHashData[1])) ||
            (!ctx.Fr.eq(ctx.A[2], feaFinalAccBatchHashData[2])) ||
            (!ctx.Fr.eq(ctx.A[3], feaFinalAccBatchHashData[3])) ||
            (!ctx.Fr.eq(ctx.A[4], feaFinalAccBatchHashData[4])) ||
            (!ctx.Fr.eq(ctx.A[5], feaFinalAccBatchHashData[5])) ||
            (!ctx.Fr.eq(ctx.A[6], feaFinalAccBatchHashData[6])) ||
            (!ctx.Fr.eq(ctx.A[7], feaFinalAccBatchHashData[7]))
        ) {
            let errorMsg = "Assert Error: finalAccBatchHashData does not match\n";
            errorMsg += `   finalAccBatchHashData computed: ${this.fea2String(ctx.Fr, ctx.A)}\n`;
            errorMsg += `   finalAccBatchHashData expected: ${ctx.input.finalAccBatchHashData}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        const feaLocalExitRootFromBlob = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.localExitRootFromBlob));

        if (
            (!ctx.Fr.eq(ctx.E[0], feaLocalExitRootFromBlob[0])) ||
            (!ctx.Fr.eq(ctx.E[1], feaLocalExitRootFromBlob[1])) ||
            (!ctx.Fr.eq(ctx.E[2], feaLocalExitRootFromBlob[2])) ||
            (!ctx.Fr.eq(ctx.E[3], feaLocalExitRootFromBlob[3])) ||
            (!ctx.Fr.eq(ctx.E[4], feaLocalExitRootFromBlob[4])) ||
            (!ctx.Fr.eq(ctx.E[5], feaLocalExitRootFromBlob[5])) ||
            (!ctx.Fr.eq(ctx.E[6], feaLocalExitRootFromBlob[6])) ||
            (!ctx.Fr.eq(ctx.E[7], feaLocalExitRootFromBlob[7]))
        ) {
            let errorMsg = "Assert Error: localExitRootFromBlob does not match\n";
            errorMsg += `   localExitRootFromBlob computed: ${this.fea2String(ctx.Fr, ctx.E)}\n`;
            errorMsg += `   localExitRootFromBlob expected: ${ctx.input.localExitRootFromBlob}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        if (!ctx.Fr.eq(ctx.CTX, ctx.Fr.e(ctx.input.isInvalid))){
            let errorMsg = "Assert Error: isInvalid does not match\n";
            errorMsg += `   isInvalid computed: ${Number(ctx.CTX)}\n`;
            errorMsg += `   isInvalid expected: ${ctx.input.isInvalid}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        if (!ctx.Fr.eq(ctx.RR, ctx.Fr.e(ctx.input.timestampLimit))){
            let errorMsg = "Assert Error: timestampLimit does not match\n";
            errorMsg += `   timestampLimit computed: ${Number(ctx.RR)}\n`;
            errorMsg += `   timestampLimit expected: ${ctx.input.timestampLimit}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        const feaLastL1InfoTreeRoot = this.scalar2fea(ctx.Fr, this.Scalar.e(ctx.input.lastL1InfoTreeRoot));

        if (
            (!ctx.Fr.eq(ctx.D[0], feaLastL1InfoTreeRoot[0])) ||
            (!ctx.Fr.eq(ctx.D[1], feaLastL1InfoTreeRoot[1])) ||
            (!ctx.Fr.eq(ctx.D[2], feaLastL1InfoTreeRoot[2])) ||
            (!ctx.Fr.eq(ctx.D[3], feaLastL1InfoTreeRoot[3])) ||
            (!ctx.Fr.eq(ctx.D[4], feaLastL1InfoTreeRoot[4])) ||
            (!ctx.Fr.eq(ctx.D[5], feaLastL1InfoTreeRoot[5])) ||
            (!ctx.Fr.eq(ctx.D[6], feaLastL1InfoTreeRoot[6])) ||
            (!ctx.Fr.eq(ctx.D[7], feaLastL1InfoTreeRoot[7]))
        ) {
            let errorMsg = "Assert Error: lastL1InfoTreeRoot does not match\n";
            errorMsg += `   lastL1InfoTreeRoot computed: ${this.fea2String(ctx.Fr, ctx.D)}\n`;
            errorMsg += `   lastL1InfoTreeRoot expected: ${ctx.input.lastL1InfoTreeRoot}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }


        if (!ctx.Fr.eq(ctx.RCX, ctx.Fr.e(ctx.input.lastL1InfoTreeIdx))){
            let errorMsg = "Assert Error: lastL1InfoTreeIdx does not match\n";
            errorMsg += `   lastL1InfoTreeIdx computed: ${Number(ctx.RCX)}\n`;
            errorMsg += `   lastL1InfoTreeIdx expected: ${ctx.input.lastL1InfoTreeIdx}\n`;
            errorMsg += `Errors: ${this.nameRomErrors.toString()}`;
            throw new Error(errorMsg);
        }

        console.log("Assert outputs run succesfully");
    }
}