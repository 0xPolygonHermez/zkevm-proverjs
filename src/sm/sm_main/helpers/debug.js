const Helper = require('./helper.js');
const { ethers } = require("ethers");
const {
    encodedStringToArray,
    decodeCustomRawTxProverMethod,
    decodeChangeL2BlockTx,
} = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;

module.exports = class Debug extends Helper {
    eval_dumpRegs(ctx, tag) {

        console.log(`dumpRegs ${ctx.fileName}:${ctx.line}`);

        if (ctx.fullFe) {
            console.log(['A', this.fea2scalar(ctx.Fr, ctx.A)]);
            console.log(['B', this.fea2scalar(ctx.Fr, ctx.B)]);
            console.log(['C', this.fea2scalar(ctx.Fr, ctx.C)]);
            console.log(['D', this.fea2scalar(ctx.Fr, ctx.D)]);
            console.log(['E', this.fea2scalar(ctx.Fr, ctx.E)]);
        } else {
            console.log(['A', this.safeFea2scalar(ctx.Fr, ctx.A)]);
            console.log(['B', this.safeFea2scalar(ctx.Fr, ctx.B)]);
            console.log(['C', this.safeFea2scalar(ctx.Fr, ctx.C)]);
            console.log(['D', this.safeFea2scalar(ctx.Fr, ctx.D)]);
            console.log(['E', this.safeFea2scalar(ctx.Fr, ctx.E)]);
        }

        return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_dump(ctx, tag) {
        console.log("\x1b[38;2;175;175;255mDUMP on " + ctx.fileName + ":" + ctx.line+"\x1b[0m");

        tag.params.forEach((value) => {
            let name = value.varName || value.paramName || value.regName || value.offsetLabel;
            if (typeof name == 'undefined' && value.path) {
                name = value.path.join('.');
            }
            console.log("\x1b[35m"+ name +"\x1b[0;35m: "+this.evalCommand(ctx, value)+"\x1b[0m");
        });

        return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_dumphex(ctx, tag) {
        console.log("\x1b[38;2;175;175;255mDUMP on " + ctx.fileName + ":" + ctx.line+"\x1b[0m");

        tag.params.forEach((value) => {
            let name = value.varName || value.paramName || value.regName;
            if (typeof name == 'undefined' && value.path) {
                name = value.path.join('.');
            }
            console.log("\x1b[35m"+ name +"\x1b[0;35m: 0x"+this.evalCommand(ctx, value).toString(16)+"\x1b[0m");
        });

        return [ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }

    eval_storeLog(ctx, tag){
        this.checkParams(ctx, tag, 3);

        const indexLog = this.evalCommand(ctx, tag.params[0]);
        const isTopic = this.evalCommand(ctx, tag.params[1]);
        const data = this.evalCommand(ctx, tag.params[2]);

        if (typeof ctx.outLogs[indexLog] === "undefined"){
            ctx.outLogs[indexLog] = {
                data: [],
                topics: []
            }
        }

        if (isTopic) {
            ctx.outLogs[indexLog].topics.push(data.toString(16));
        } else {
            ctx.outLogs[indexLog].data.push(data.toString(16));
        }
        if (fullTracer)
            fullTracer.handleEvent(ctx, tag);
    }

    eval_log(ctx, tag) {
        const frLog = ctx[tag.params[0].regName];
        const label = typeof tag.params[1] === "undefined" ? "notset" : tag.params[1].varName;
        if(typeof(frLog) == "number") {
            console.log(frLog)
        } else {
            let scalarLog;
            let hexLog;
            if (tag.params[0].regName !== "HASHPOS" && tag.params[0].regName !== "GAS"){
                scalarLog = this.safeFea2scalar(ctx.Fr, frLog);
                hexLog = `0x${scalarLog.toString(16)}`;
            } else {
                scalarLog = Scalar.e(frLog);
                hexLog = `0x${scalarLog.toString(16)}`;
            }

            console.log(`Log regname ${tag.params[0].regName} ${ctx.sourceRef}`);
            if (label !== "notset")
                console.log("       Label: ", label);
            console.log("       Scalar: ", scalarLog);
            console.log("       Hex:    ", hexLog);
            console.log("--------------------------");
        }
        return this.scalar2fea(ctx.Fr, Scalar.e(0));
    }

    eval_breakPoint(ctx, tag) {
        console.log(`Breakpoint: ${ctx.sourceRef}`);
        return this.scalar2fea(ctx.Fr, Scalar.e(0));
    }


    printRegs(Fr, ctx) {
        this.printReg8(Fr, "A", ctx.A);
        this.printReg8(Fr, "B", ctx.B);
        this.printReg8(Fr, "C", ctx.C);
        this.printReg8(Fr, "D", ctx.D);
        this.printReg8(Fr, "E", ctx.E);
        this.printReg4(Fr,  "SR", ctx.SR);
        this.printReg1("CTX", ctx.CTX);
        this.printReg1("SP", ctx.SP);
        this.printReg1("PC", ctx.PC);
        this.printReg1("GAS", ctx.GAS);
        this.printReg1("zkPC", ctx.zkPC);
        this.printReg1("RR", ctx.RR);
        this.printReg1("STEP", ctx.step, false, true);
        console.log(ctx.fileName + ":" + ctx.line);
    }

    printReg8(Fr, name, V) {
        this.printReg(Fr, name+"7", V[7], true);
        this.printReg(Fr, name+"6", V[6], true);
        this.printReg(Fr, name+"5", V[5], true);
        this.printReg(Fr, name+"4", V[4], true);
        this.printReg(Fr, name+"3", V[3], true);
        this.printReg(Fr, name+"2", V[2], true);
        this.printReg(Fr, name+"1", V[1], true);
        this.printReg(Fr, name+"0", V[0]);
        console.log("");
    }


    printReg4(Fr, name, V) {
        this.printReg(Fr, name+"3", V[3], true);
        this.printReg(Fr, name+"2", V[2], true);
        this.printReg(Fr, name+"1", V[1], true);
        this.printReg(Fr, name+"0", V[0]);
        console.log("");
    }

    printReg(Fr, name, V, h, short) {
        const maxInt = this.Scalar.e("0x7FFFFFFF");
        const minInt = this.Scalar.sub(Fr.p, this.Scalar.e("0x80000000"));

        let S;
        S = name.padEnd(6) +": ";

        let S2;
        if (!h) {
            const o = Fr.toObject(V);
            if (Scalar.gt(o, maxInt)) {
                const on = Scalar.sub(Fr.p, o);
                if (Scalar.gt(o, minInt)) {
                    S2 = "-" + Scalar.toString(on);
                } else {
                    S2 = "LONG";
                }
            } else {
                S2 = Scalar.toString(o);
            }
        } else {
            S2 = "";
        }

        S += S2.padStart(8, " ");

        if (!short) {
            const o = Fr.toObject(V);
            S+= "   " + o.toString(16).padStart(32, "0");
        }

        console.log(S);
    }


    printReg1(name, V, h, short) {
        let S;
        S = name.padEnd(6) +": ";

        let S2 = V.toString();

        S += S2.padStart(16, " ");

        console.log(S);
    }

    async printBatchL2Data(batchL2Data, getNameSelector) {
        console.log('/////////////////////////////');
        console.log('/////// BATCH L2 DATA ///////');
        console.log('/////////////////////////////\n');

        const txs = encodedStringToArray(batchL2Data);
        console.log('Number of transactions: ', txs.length);
        console.log('--------------------------');
        for (let i = 0; i < txs.length; i++) {
            const rawTx = txs[i];

            if (rawTx.startsWith(`0x${ConstantsCommon.TX_CHANGE_L2_BLOCK.toString(16).padStart(2, '0')}`)) {
                console.log(`Tx ${i} --> new Block L2`);
                const txDecoded = await decodeChangeL2BlockTx(rawTx);
                console.log(txDecoded);
            } else {
                const infoTx = decodeCustomRawTxProverMethod(rawTx);

                const digest = ethers.utils.keccak256(infoTx.rlpSignData);
                const from = ethers.utils.recoverAddress(digest, {
                    r: infoTx.txDecoded.r,
                    s: infoTx.txDecoded.s,
                    v: infoTx.txDecoded.v,
                });

                infoTx.txDecoded.from = from;

                if (getNameSelector) {
                    infoTx.txDecoded.selectorLink = `${getNameSelector}${infoTx.txDecoded.data.slice(0, 10)}`;
                }
                console.log(`Tx ${i} --> new Tx`);
                console.log(infoTx.txDecoded);
            }
            console.log('--------------------------');
        }

        console.log('/////////////////////////////');
        console.log('/////////////////////////////\n');
    }

}