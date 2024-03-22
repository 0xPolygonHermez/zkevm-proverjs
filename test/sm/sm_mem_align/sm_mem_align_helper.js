const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const {
    scalar2fea,
    fea2scalar,
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;


const F1Field = require("ffjavascript").F1Field;
const MemAlignHelper = require("../../../src/sm/sm_main/helpers/mem_align.js");
const input = require('./sm_mem_align_test_data.js');

describe("test helper functions", async function () {

    this.timeout(10000000);
    const Fr = new F1Field("0xFFFFFFFF00000001");
    const memAlignHelper = new MemAlignHelper();
    const ctx = {Fr};
    memAlignHelper.setup({
        ctx,
        evalCommand: (ctx,x) => x
    });

    it("check calculate", async () => {
        let msg;
        for (const _input of input) {
            if (_input.memAlignWR) continue;
            const _OP = memAlignHelper.calculate(_input.A, _input.B, _input.C0);
            msg = `\nA: ${_input.A.toString(16).padStart(64, '0')}\nB: ${_input.B.toString(16).padStart(64, '0')}\nOP:${_input.OP.toString(16).padStart(64, '0')}\nOP:${_OP.toString(16).padStart(64, '0')}\nmode: ${_input.C0}\n`;
            assert.equal(_input.OP, _OP, msg);
        }
    });
    it("check verify", async () => {
        let msg;
        for (const _input of input) {
            if (_input.memAlignWR) {
                assert.equal(memAlignHelper.verify(true, _input.A, _input.B, _input.C0, _input.OP, _input.D, _input.E, []), true);
            } else {
                assert.equal(memAlignHelper.verify(false, _input.A, _input.B, _input.C0, _input.OP, 0n, 0n, []), true);
            }
        }
    });
    it("check eval_memAlignWR_W0_W1", async () => {
        let msg;
        for (const _input of input) {
            if (!_input.memAlignWR) continue;
            msg = `W0 \nA:${_input.A.toString(16).padStart(64, '0')}\nV:${_input.OP.toString(16).padStart(64, '0')} mode: ${_input.C0}`;
            assert.equal(_input.D, fea2scalar(Fr, memAlignHelper.eval_memAlignWR_W0(ctx, {params: [_input.A, _input.OP, _input.C0]})), 'W0 '+msg);
            msg = `W1 \nB:${_input.A.toString(16).padStart(64, '0')}\nV:${_input.OP.toString(16).padStart(64, '0')} mode: ${_input.C0}`;
            assert.equal(_input.E, fea2scalar(Fr, memAlignHelper.eval_memAlignWR_W1(ctx, {params: [_input.B, _input.OP, _input.C0]})), 'W1 '+msg);
        }
    });
});
