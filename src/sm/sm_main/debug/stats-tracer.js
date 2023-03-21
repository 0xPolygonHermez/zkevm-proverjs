const fs = require('fs');
const path = require('path');

class StatsTracer {
    /**
     * @param {String} fileName Name of the output file
     */
    constructor(fileName) {
        // Logs stats path
        this.folderLogs = path.join(__dirname, '../logs-stats');
        this.pathLogFile = `${this.folderLogs}/${fileName.split('.')[0]}-stats`;

        this.fullZkPC = [];
    }

    addZkPC(zkPC) {
        this.fullZkPC.push(Number(zkPC));
    }

    saveStatsFile() {
        if (!fs.existsSync(this.folderLogs)) {
            fs.mkdirSync(this.folderLogs);
        }
        fs.writeFileSync(`${this.pathLogFile}.json`, JSON.stringify(this.fullZkPC, null, 2));
    }
}

module.exports = StatsTracer;
