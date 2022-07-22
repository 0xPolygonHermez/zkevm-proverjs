const fs = require("fs");
const path = require("path");
const { smtUtils } = require("@0xpolygonhermez/zkevm-commonjs");
const codes = require("./opcodes");

class Tracer {

    constructor (fileName, logFileName){
        this.info = [];
        this.fullStack = [];
        this.trace = [];
        this.fileName = fileName;
        this.folderLogs = path.join(__dirname, "../logs-trace");
        this.pathLogFile = path.join(this.folderLogs, `${logFileName}__trace.json`);
        this.labels = {};
    }

    async getTrace(ctx, romStep , print = false){

        if (romStep.offsetLabel === "mapping_opcodes" && ctx.fileName.includes(this.fileName)){
            let singleTrace = {};
            const singleInfo = {};

            const offsetCtx = Number(ctx.CTX) * 0x40000;

            const codeId = ctx.RR;
            const opcode = codes[codeId];

            // store memory
            let addrMem = 0;
            addrMem += offsetCtx;
            addrMem += 0x30000;

            const finalMemory = [];
            const lengthMemOffset = this._findOffsetLabel(ctx.rom.program ,"memLength");
            const lenMemValue = ctx.mem[offsetCtx + lengthMemOffset];
            const lenMemValueFinal = typeof lenMemValue === "undefined" ? 0 : Number(smtUtils.fea2scalar(ctx.Fr, lenMemValue));


            for (let i = 0; i < lenMemValueFinal; i++) {
                const memValue = ctx.mem[addrMem + i];
                if (typeof memValue === "undefined")
                    continue;
                let memScalar = smtUtils.fea2scalar(ctx.Fr, memValue);
                let hexString = memScalar.toString(16);
                hexString = hexString.length % 2 ? `0${hexString}` : hexString;
                finalMemory.push(`0x${hexString}`);
            }

            // store stack
            let addr = 0;
            addr += offsetCtx;
            addr += 0x20000;

            const finalStack = [];

            for (let i = 0; i < ctx.SP; i++) {
                const stack = ctx.mem[addr + i];
                if (typeof stack === "undefined")
                    continue;
                let stackScalar = smtUtils.fea2scalar(ctx.Fr, stack);
                let hexString = stackScalar.toString(16);
                hexString = hexString.length % 2 ? `0${hexString}` : hexString;
                finalStack.push(`0x${hexString}`);
            }

            // add info opcodes
            singleInfo.pc = Number(ctx.PC) - 1;
            singleInfo.opcode = opcode.toString();
            singleInfo.gasLeft = Number(ctx.GAS.toString());

            // add ctx vars
            const varsToAdd = ["gasRefund"];

            for (let i = 0; i < varsToAdd.length; i++){
                const varLabel = varsToAdd[i];
                const offsetRelative = this._findOffsetLabel(ctx.rom.program ,varLabel);
                const addressMem = offsetCtx + offsetRelative;
                const value = ctx.mem[addressMem];
                const finaValue = typeof value === "undefined" ? 0 : Number(smtUtils.fea2scalar(ctx.Fr, value));
                singleInfo[varLabel] = finaValue;
            }

            // add debug info
            singleInfo.step = ctx.step;

            this.info.push(singleInfo);
            this.fullStack.push(finalStack);

            // build trace
            const index = this.fullStack.length;

            if (index > 1){
                singleTrace = this.info[index - 2];
                singleTrace.stack = finalStack;
                singleTrace.memory = finalMemory;
                this.trace.push(singleTrace);

                if (print){
                    console.log(JSON.stringify(singleTrace, null, 2));
                }
            }
        }
    }

    exportTrace(){
        if (!fs.existsSync(this.folderLogs)){
            fs.mkdirSync(this.folderLogs)
        }
        fs.writeFileSync(this.pathLogFile, JSON.stringify(this.trace, null, 2));
    }

    _findOffsetLabel(program, label){
        if (typeof this.labels[label] !== "undefined"){
            return this.labels[label];
        }

        for (let i = 0; i < program.length; i++){
            if (program[i].offsetLabel === label){
                this.labels[label] = program[i].offset;
                return program[i].offset;
            }
        }

        return null;
    }
}

module.exports = Tracer;