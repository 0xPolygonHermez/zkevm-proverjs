/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { smtUtils, stateUtils, utils } = require('@0xpolygonhermez/zkevm-commonjs');
const { Scalar } = require('ffjavascript');
const chalk = require('chalk');

function sr8to4(F, SR) {
    const r = [];
    r[0] = F.add(SR[0], F.mul(SR[1], F.e('0x100000000')));
    r[1] = F.add(SR[2], F.mul(SR[3], F.e('0x100000000')));
    r[2] = F.add(SR[4], F.mul(SR[5], F.e('0x100000000')));
    r[3] = F.add(SR[6], F.mul(SR[7], F.e('0x100000000')));

    return r;
}

class Prints {
    constructor(ctx, smt, externalLogs) {
        this.ctx = ctx;
        this.smt = smt;
        this.externalLogs = externalLogs;
    }

    async printAddress(address, stoKeys = [], options = {}) {
        const print = this._shouldPrint(options);

        if (print) {
            const root = sr8to4(this.ctx.Fr, this.ctx.SR);
            const state = await stateUtils.getState(address, this.smt, root);

            const hashBytecode = await stateUtils.getContractHashBytecode(address, this.smt, root);
            const hashBytecodeLength = await stateUtils.getContractBytecodeLength(address, this.smt, root);
            // const bytecode = this.smt.db.getProgram();
            const sto = await stateUtils.getContractStorage(address, this.smt, root, stoKeys);

            const infoAddress = {};
            const storage = {};

            infoAddress.address = address;
            infoAddress.balance = state.balance.toString();
            infoAddress.nonce = state.nonce.toString();
            infoAddress.hashBytecode = hashBytecode;
            infoAddress.hashBytecodeLength = Number(hashBytecodeLength);
            // infoAddress.bytecode = typeof bytecode === "undefined" ? "0x0": bytecode;
            for (const key of Object.keys(sto)) {
                const keyS = `0x${Scalar.e(key).toString(16).padStart(64, '0')}`;
                storage[keyS] = sto[key].toString(16).length % 2 === 0 ? `0x${sto[key].toString(16)}` : `0x0${sto[key].toString(16)}`;
            }
            infoAddress.storage = storage;

            console.log(JSON.stringify(infoAddress, null, 2));
        }
    }

    async printStateRoot(options = {}) {
        const print = this._shouldPrint(options);

        if (print) {
            const h4 = sr8to4(this.ctx.Fr, this.ctx.SR);
            const root = smtUtils.h4toString(h4);
            console.log('State Root: ', root);
        }
    }

    async printRegister(options = {}) {
        const print = this._shouldPrint(options);

        if (print) {
            const h4 = sr8to4(this.ctx.Fr, this.ctx.SR);
            const root = smtUtils.h4toString(h4);
            console.log('State Root: ', root);
        }
    }

    processExternalLogs() {
        const currentFileName = this.ctx.fileName;
        const currentLine = this.ctx.line;

        for (const log of this.externalLogs) {
            // check hit line
            if (log.fileName === currentFileName && log.line === currentLine) {
                // print registers
                for (const reg of log.regs) {
                    let info = `${chalk.yellow(`-----> ${log.fileName}:${log.line}`)} | `;

                    const frReg = this.ctx[reg];

                    // build output
                    info += `${chalk.yellowBright(`${reg}`)} | `;

                    if (typeof log.tag !== 'undefined') {
                        info += `${chalk.yellowBright(`${log.tag}`)} | `;
                    }

                    let resNum;
                    // check if register is an array
                    if (Array.isArray(frReg)) {
                        resNum = this.safeFea2scalar(this.ctx.Fr, frReg);
                    } else {
                        resNum = Scalar.e(frReg);
                    }
                    const resHex = utils.valueToHexStr(resNum, true);
                    info += `${chalk.white(`${resNum}`)} | `;
                    info += `${chalk.white(`${resHex}`)} | `;
                    console.log(info);
                }
            }
        }
    }

    _shouldPrint(options) {
        let print = false;

        if (Object.keys(options).length === 0) {
            print = true;
        // eslint-disable-next-line no-prototype-builtins
        } else if (options.hasOwnProperty('step')) {
            if (options.step === this.ctx.step) {
                print = true;
            }
        } else if (options.line === this.ctx.line && this.ctx.fileName.includes(options.fileName)) {
            print = true;
        }

        return print;
    }

    safeFea2scalar(Fr, arr) {
        for (let index = 0; index < 8; ++index) {
            const value = Fr.toObject(arr[index]);
            if (value > 0xFFFFFFFFn) {
                throw new Error(`Invalid value 0x${value.toString(16)} to convert to scalar on index ${index}`);
            }
        }

        return smtUtils.fea2scalar(Fr, arr);
    }
}

module.exports = Prints;
