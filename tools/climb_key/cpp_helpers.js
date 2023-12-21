const fs = require("fs");
const path = require("path");
const tty = require('tty');
const version = require("../../package").version;

const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const F1Field = require("ffjavascript").F1Field;
const util = require('util');

const { newConstantPolsArray, newCommitPolsArray, compile, verifyPil } = require("pilcom");
const smClimbKey = require("../../src/sm/sm_climb_key.js");

const argv = require("yargs")
    .version(version)
    .usage("main_buildconstants -r <rom.json> -o <constant.bin|json> [-p <main.pil>] [-P <pilconfig.json>] [-v]")
    .alias("r", "rom")
    .alias("o", "output")
    .alias("t", "text")
    .alias("p", "pil")
    .alias("P", "pilconfig")
    .alias("v", "verbose")
    .argv;

const DEBUG = false;

async function run() {
    const F = new F1Field("0xFFFFFFFF00000001");
    const pilCode = `
    include "pil/global.pil";
    include "pil/climb_key.pil";
    `;

    const pil = await compile(F, pilCode, null, { compileFromString: true, defines: {N: 2 ** 22}});
    const constPols = newConstantPolsArray(pil);
    const pols = constPols.ClimbKey;

    await smClimbKey.buildConstants(pols);

    // T_CLKEYSEL, T_LEVEL, T_CHUNK_VALUE, T_CARRYLT_IN, T_CARRYLT_OUT => "T_CLKEYSEL,T_LEVEL,T_CARRYLT_IN, T_CARRYLT_OUT", FROM_T_CHUNK_VALUE, TO_T_CHUNK_VALUE

    const N = pols.T_CLKEYSEL.length;
    let _cols = false;
    let _colvalues = [];
    let _fromChunkValue = false;
    let _toChunkValue = false;
    let _row = false;
    let groups = [];
    let _level = false;
    let cols ;

    for (let row = 0; row <= N; ++row) {
        if (DEBUG && row < N) {
            console.log('ROW#'+row+' '+[pols.T_CLKEYSEL[row], pols.T_CARRYLT_IN[row], pols.T_CARRYLT_OUT[row], pols.T_LEVEL[row], pols.T_CHUNK_VALUE[row].toString(16)].join(','));
        }
        const colvalues = (row < N) ? [pols.T_CLKEYSEL[row], pols.T_CARRYLT_IN[row], pols.T_CARRYLT_OUT[row], pols.T_LEVEL[row]] : false;
        const cols = colvalues === false ? false : colvalues.join(',');
        if (_cols === false) {
            _cols = cols;
            _colvalues = [...colvalues];
            _row = row;
        } else if (_cols !== cols) {
            groups.push({cols: _cols, chunk: _fromChunkValue == _toChunkValue ? [_fromChunkValue] : [_fromChunkValue, _toChunkValue], colvalues: [..._colvalues], label: `[${_row}..${row-1}] ${cols} ${Math.round((_row*10000)/N)/100}%`});
            _fromChunkValue = false;
            _toChunkValue = false;
            _cols = cols;
            _colvalues = [...colvalues];
            _row = row;
        }
        // Check end of loop, after that repeat sequence.
        if (_level > 0 && pols.T_LEVEL[row] === 0n) {
            break;
        }
        _level = Number(pols.T_LEVEL[row]);
        if (_fromChunkValue === false || _fromChunkValue > pols.T_CHUNK_VALUE[row]) {
            _fromChunkValue = pols.T_CHUNK_VALUE[row];
        }
        if (_toChunkValue === false || _toChunkValue < pols.T_CHUNK_VALUE[row]) {
            _toChunkValue = pols.T_CHUNK_VALUE[row];
        }
    }
    if (DEBUG) console.log("{\n" + groups.map(x => `\t\t{"${x.cols}", ${x.chunk.map(x => '0x'+x.toString(16)).join('-')}, ${x.colvalues.slice(0, 3).join(',')}}, // ${x.label}`).join("\n") + '\n};');
    let common3 = {};
    groups.map(x => {
        let ckey = [...x.colvalues.slice(0, 3),x.chunk.map(x => '0x'+x.toString(16)).join('-')].join();
        if (!common3[ckey]) {
            common3[ckey] = []; 
        }
        common3[ckey].push(x.colvalues[3]);
        return x.colvalues.join(',');
    });
    for (const key in common3) {
        const levels = common3[key];
        if (levels.length == 1 || (levels.length == 2 && levels[0] == levels[1])) {
            common3[key] = levels[0].toString();
            continue;
        }
        let clevel = levels[0];
        if (levels.every(level => {const _clevel = clevel; clevel += 4n; return level === _clevel;})) {
            common3[key] = levels[0] + ',' + levels[1] + '..+..' + levels.slice(-1)[0];
        }
    }
    for (const key in common3) {
        console.log(key+','+common3[key]);
    }
}

run().then(()=> {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});
