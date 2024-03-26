const Helper = require('./helper.js');
const { Scalar } = require("ffjavascript");
const {
    scalar2fea,
    fea2scalar,
} = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const { MODE_TO_LEN, MODE_TO_OFFSET, MODE_TO_LITTLE_ENDIAN, MODE_TO_LEFT_ALIGN } = require('../../sm_mem_align/sm_mem_align_constants.js');

const Mask256 = 2n**256n - 1n;
module.exports = class MemAlign extends Helper {
    modeToParams(mode) {
        const _mode = Number(mode);
        const _len = MODE_TO_LEN(_mode);
        return {
            offset: MODE_TO_OFFSET(_mode),
            len: _len == 0 ? 32 : _len,
            left: MODE_TO_LEFT_ALIGN(_mode),
            le: MODE_TO_LITTLE_ENDIAN(_mode)
        }
    }
    calculate(a, b, c) {
        return this.#calculateRD(a, b, c);
    }
    propsToHex(props) {
        let res = {};
        console.log(props);
        for (const key in props) {
            res[key] = '0x' + props[key].toString(16).padStart(64, '0');
        }
        return res;
    }
    verify(wr, a, b, c, op, d = 0n, e = 0n, required = []) {
        if (wr) {
            const [_d,_e] = this.#calculateWR(a, b, c, op);
            if (_d !== d || _e !== e) {
                const hex = this.propsToHex({a, b, op, d, e, _d, _e});
                throw new Error(`MEM_ALIGN_WR does not match when writting \n\tM: ${hex.a} ${hex.b}\n\tV: ${hex.op} (mode:${c})\n\tW: ${hex.d} ${hex.e}`+
                                `\n\tW: ${hex._d} ${hex._e} (expected) ${this.ctx.sourceRef}`);
            }        
            required.push({m0:a, m1:b, mode: c, v:op, wr: true});
            return true;
        }
        const _op = this.#calculateRD(a, b, c);
        if (_op !== op) {
            const hex = this.propsToHex({a, b, op, _op});
            throw new Error(`MEM_ALIGN_RD does not match expected: ${hex._op} vs ${hex.op} (A:${hex._a}, B:${hex._b} C:${c}) ${this.ctx.sourceRef}`);
        }
        required.push({m0:a, m1:b, mode: c, v:op, wr: false});
        return true;
    }
    #calculateRD(a, b, c) {
        const params = this.modeToParams(c);
        const _m = a.toString(16).padStart(64, '0') + b.toString(16).padStart(64, '0');
        let _len = (params.offset + params.len) > 64 ? 64 - params.offset : params.len;
        let _value = _m.slice(params.offset * 2, (params.offset + _len) * 2);

        if (params.le) {
            let _valueOrg = _value;
            let index = _value.length - 2;
            _value = '';
            while (index >= 0) {
                _value += _valueOrg.slice(index, index + 2);
                index -= 2;
            }
        }

        if (_len != 32) {
            _value = params.left ? _value.padEnd(64, '0') : _value.padStart(64, '0');
        }
        return Scalar.e('0x'+_value);
    }
    #calculateWR(a, b, c, op) {
        const params = this.modeToParams(c);
        const _m = a.toString(16).padStart(64, '0') + b.toString(16).padStart(64, '0');
        let _len = (params.offset + params.len) > 64 ? 64 - params.offset : params.len;
        let _value = this.prepareHexValue(op, {...params, len: _len});
        let _w = (params.offset > 0 ? _m.slice(0, params.offset * 2) : '') + _value + 
                 ((params.offset + _len > 64) ? '': _m.slice((params.offset + _len - 64)*2));
        _w = _w.slice(0, 128);
        return [BigInt('0x'+_w.slice(0, 64)), BigInt('0x'+_w.slice(64, 128))];
    }
    prepareHexValue(value, params) {
        let _value = value.toString(16).padStart(64,'0');
        if (params.len != 32) {
            _value = params.left ? _value.slice(0, params.len * 2) : _value.slice(-(params.len * 2))
        }
        if (!params.le) {
            return _value;
        }
         
        let valueLe = '';
        let index = _value.length - 2;
        while (index >= 0) {
            valueLe += _value.slice(index, index + 2);
            index -= 2;
        }
        return valueLe;
    }
    eval_memAlignRD(ctx, tag) {
        // parameters: M0, value, offset
        const a = this.evalCommand(ctx, tag.params[0]);
        const b = this.evalCommand(ctx, tag.params[1]);
        const mode = this.evalCommand(ctx, tag.params[2]);
        return(this.#calculateRD(a,b,mode));
    }

    eval_memAlignWR_W0(ctx, tag) {
        // parameters: M0, value, offset
        const m0 = this.evalCommand(ctx, tag.params[0]);
        const value = this.evalCommand(ctx, tag.params[1]);
        const mode = this.evalCommand(ctx, tag.params[2]);
        const params = this.modeToParams(mode);

        const _m0 = m0.toString(16).padStart(64, '0');

        if (params.offset >= 32) {
            // no change w0, only w1
            return scalar2fea(m0);
        }
        let _value = this.prepareHexValue(value, params);
        if (params.offset + params.len > 32) {
            _value = _value.slice(0, (32 - params.offset) * 2);
        }
        const w0 = '0x' + (params.offset ? _m0.slice(0, params.offset * 2) : '') + _value 
                    + ((params.offset + params.len < 32) ? _m0.slice((params.offset + params.len - 32)*2) : '');
        
        return scalar2fea(ctx.Fr, w0);
    }

    eval_memAlignWR_W1(ctx, tag) {
        // parameters: M1, value, offset
        const m1 = this.evalCommand(ctx, tag.params[0]);
        const value = this.evalCommand(ctx, tag.params[1]);
        const mode = this.evalCommand(ctx, tag.params[2]);
        const params = this.modeToParams(mode);

        const _m1 = m1.toString(16).padStart(64, '0');
        if (params.offset + params.len <= 32) {
            // no change w1, only w0
            return scalar2fea(ctx.Fr, m1);
        }
        let _value = this.prepareHexValue(value, params);
        if (params.offset < 32) {
            _value = _value.slice((32 - params.offset) * 2);
        }

        const w1 = '0x' + (params.offset > 32 ? _m1.slice(0, (32 - params.offset) * 2) : '') + _value 
                    + ((params.offset + params.len < 64) ? _m1.slice((params.offset + params.len - 64)*2) : '');
        
        return scalar2fea(ctx.Fr, Scalar.e(w1));
    }
}