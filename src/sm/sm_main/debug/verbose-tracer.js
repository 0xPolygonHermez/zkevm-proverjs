const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const { smtUtils, stateUtils, utils } = require("@0xpolygonhermez/zkevm-commonjs");

class VerboseTracer {
    /**
     * @param {Object} options full-tracer options
     * @param {Bool} options.enable flag to print traces
     * @param {Bool} options.printOpcodes flag to print opcodes
     * @param {Bool} options.filterOpcodes string filtering opcodes
     * @param {String} fileName Name of the output file
     */
    constructor(options, smt, fileName) {
        this.enable = (options.enable == true);
        this.enableOpcodes = (options.printOpcodes == true);
        this.filterOpcodes = options.filterOpcodes;
        this.initFinalState = options.initFinalState;
        this.saveInitFinalState = options.saveInitFinalState;
        this.bytecode = options.bytecode;

        this.smt = smt;
        this.touched = {};

        // Logs init-final state path
        this.folderLogs = path.join(__dirname, "../logs-verbose");
        this.pathLogFile = `${this.folderLogs}/${fileName.split('.')[0]}-verbose`;
    }

    saveInitStateRoot(initSR) {
        this.initSR = initSR;
    }

    saveFinalStateRoot(finalSR) {
        this.finalSR = finalSR;
    }

    addTouchedAddress(address, slotStorage) {
        if (typeof this.touched[address] === 'undefined')
            this.touched[address] = [];

        if (typeof slotStorage !== 'undefined'){
            this.touched[address].push(slotStorage);
        }
    }

    printOpcode(message) {
        if (this.enable !== true) return;
        if (this.enableOpcodes !== true) return;

        let info = `${chalk.magenta("OPCODE".padEnd(7))} | `;
        info += `${message}`;

        if (typeof this.filterOpcodes === 'undefined' || this.filterOpcodes.length === 0){
            console.log(info);
        } else if (this.filterOpcodes.includes(`${message}`)){
            console.log(info);
        }
    }

    printTx(message) {
        if (this.enable !== true) return;

        let info = `${chalk.yellowBright("TX".padEnd(7))} | `;
        info += `${message}`;
        console.log(info);
    }

    printBatch(message) {
        if (this.enable !== true) return;

        let info = `${chalk.blue("BATCH".padEnd(7))} | `;
        info += `${message}`;
        console.log(info);
    }

    printError(message) {
        if (this.enable !== true) return;

        let info = `${chalk.red("ERROR".padEnd(7))} | `;
        info += `${message}`;
        console.log(info);
    }

    async printPrePostState (){
        if (this.enable !== true) return;
        if (this.initFinalState !== true) return;

        const fullInfo = {
            pre: {},
            post: {}
        };

        // get all states pre/post processig the batch
        for (const [key, value] of Object.entries(this.touched)){
            const preInfo = await this.getInfoAddress(key, value, this.initSR);
            fullInfo.pre[key] = preInfo;

            const postInfo = await this.getInfoAddress(key, value, this.finalSR);
            fullInfo.post[key] = postInfo;
        }

        let infoHeader = `${chalk.greenBright("/////////////////////////////\n")}`;
        infoHeader += `${chalk.greenBright("//////////PRE STATE/////////\n")}`;
        infoHeader += `${chalk.greenBright("///////////////////////////")}`;

        console.log(infoHeader);
        console.log(fullInfo.pre);

        infoHeader = `${chalk.blueBright("/////////////////////////////\n")}`;
        infoHeader += `${chalk.blueBright("//////////POST STATE////////\n")}`;
        infoHeader += `${chalk.blueBright("///////////////////////////")}`;

        console.log(infoHeader);
        console.log(fullInfo.post);

        if (this.saveInitFinalState) {
            if (!fs.existsSync(this.folderLogs)) {
                fs.mkdirSync(this.folderLogs);
            }
            fs.writeFileSync(`${this.pathLogFile}.json`, JSON.stringify(fullInfo, null, 2));
        }
    }

    async getInfoAddress(address, storage, root){
        const info = {};
        const storageInfo = {};

        const rootArray = smtUtils.stringToH4(root);

        // get balance & nonce
        const state = await stateUtils.getState(address, this.smt, rootArray);
        const hashBytecode = await stateUtils.getContractHashBytecode(address, this.smt, rootArray);
        const hashBytecodeLength = await stateUtils.getContractBytecodeLength(address, this.smt, rootArray);
        const bytecodeArray = await this.smt.db.getProgram(smtUtils.stringToH4(hashBytecode));
        const sto = await stateUtils.getContractStorage(address, this.smt, rootArray, storage);

        info.balance = state.balance.toString();
        info.nonce = state.nonce.toString();
        info.hashBytecode = hashBytecode;
        info.hashBytecodeLength = Number(hashBytecodeLength);
        if (this.bytecode && bytecodeArray !== null) {
            info.bytecode = `0x${utils.byteArray2HexString(bytecodeArray)}`;
        } else {
            info.bytecode = "none";
        }

        for (const key of Object.keys(sto)) {
            const keyS = "0x" + Scalar.e(key).toString(16).padStart(64, '0');
            storageInfo[keyS] = sto[key].toString(16).length%2 === 0 ? "0x" + sto[key].toString(16) : "0x0" + sto[key].toString(16);
        }
        info.storage = storageInfo;

        return info;
    }
}

module.exports = VerboseTracer;