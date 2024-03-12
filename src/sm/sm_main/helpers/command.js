const Helper = require('./helper.js');

module.exports = class Command extends Helper {
    eval(ctx, tag) {
        if (tag.op == "number") {
            return this.eval_number(ctx, tag);
        } else if (tag.op == "declareVar") {
            return this.eval_declareVar(ctx, tag);
        } else if (tag.op == "setVar") {
            return this.eval_setVar(ctx, tag);
        } else if (tag.op == "getVar") {
            return this.eval_getVar(ctx, tag);
        } else if (tag.op == "getReg") {
            return this.eval_getReg(ctx, tag);
        } else if (tag.op == "add") {
            return this.eval_add(ctx, tag);
        } else if (tag.op == "sub") {
            return this.eval_sub(ctx, tag);
        } else if (tag.op == "neg") {
            return this.eval_neg(ctx, tag);
        } else if (tag.op == "mul") {
            return this.eval_mul(ctx, tag);
        } else if (tag.op == "div") {
            return this.eval_div(ctx, tag);
        } else if (tag.op == "mod") {
            return this.eval_mod(ctx, tag);
        } else if (tag.op == "or" || tag.op == "and" || tag.op == "gt" || tag.op == "ge" || tag.op == "lt" || tag.op == "le" ||
                tag.op == "eq" || tag.op == "ne" || tag.op == "not" ) {
            return this.eval_logical_operation(ctx, tag);
        } else if (tag.op == "bitand" || tag.op == "bitor" || tag.op == "bitxor" || tag.op == "bitnot"|| tag.op == "shl" || tag.op == "shr") {
            return this.eval_bit_operation(ctx, tag);
        } else if (tag.op == "if") {
            return this.eval_if(ctx, tag);
        } else if (tag.op == "getMemValue") {
            return this.eval_getMemValue(ctx, tag);
        } else {
            throw new Error(`Invalid operation ${tag.op} ${ctx.sourceRef}`);
        }
    }

    eval_number(ctx, tag) {
        return this.Scalar.e(tag.num);
    }


    eval_setVar(ctx, tag) {

        const varName = this.eval_left(ctx, tag.values[0]);

        if (typeof ctx.vars[varName] == "undefined") throw new Error(`Variable ${varName} not defined ${ctx.sourceRef}`);

        ctx.vars[varName] = this.evalCommand(ctx, tag.values[1]);
        return ctx.vars[varName];
    }

    eval_left(ctx, tag) {
        if (tag.op == "declareVar") {
            this.eval_declareVar(ctx, tag);
            return tag.varName;
        } else if (tag.op == "getVar") {
            return tag.varName;
        } else {
            throw new Error(`Invalid left expression (${tag.op}) ${ctx.sourceRef}`);
        }
    }

    eval_declareVar(ctx, tag) {
        // local variables, redeclared must start with _
        if (tag.varName[0] !== '_' && typeof ctx.vars[tag.varName] != "undefined") {
            throw new Error(`Variable ${tag.varName} already declared ${ctx.sourceRef}`);
        }
        ctx.vars[tag.varName] = this.Scalar.e(0);
        return ctx.vars[tag.varName];
    }

    eval_getVar(ctx, tag) {
        if (typeof ctx.vars[tag.varName] == "undefined") throw new Error(`Variable ${tag.varName} not defined ${ctx.sourceRef}`);
        return ctx.vars[tag.varName];
    }

    eval_getReg(ctx, tag) {
        if (tag.regName == "A") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.A) : this.safeFea2scalar(ctx.Fr, ctx.A);
        } else if (tag.regName == "B") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.B) : this.safeFea2scalar(ctx.Fr, ctx.B);
        } else if (tag.regName == "C") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.C) : this.safeFea2scalar(ctx.Fr, ctx.C);
        } else if (tag.regName == "D") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.D) : this.safeFea2scalar(ctx.Fr, ctx.D);
        } else if (tag.regName == "E") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.E) : this.safeFea2scalar(ctx.Fr, ctx.E);
        } else if (tag.regName == "SR") {
            return ctx.fullFe ? this.fea2scalar(ctx.Fr, ctx.SR) : this.safeFea2scalar(ctx.Fr, ctx.SR);
        } else if (tag.regName == "CTX") {
            return this.Scalar.e(ctx.CTX);
        } else if (tag.regName == "SP") {
            return this.Scalar.e(ctx.SP);
        } else if (tag.regName == "PC") {
            return this.Scalar.e(ctx.PC);
        } else if (tag.regName == "GAS") {
            return this.Scalar.e(ctx.GAS);
        } else if (tag.regName == "zkPC") {
            return this.Scalar.e(ctx.zkPC);
        } else if (tag.regName == "RR") {
            return this.Scalar.e(ctx.RR);
        } else if (tag.regName == "CNT_ARITH") {
            return this.Scalar.e(ctx.cntArith);
        } else if (tag.regName == "CNT_BINARY") {
            return this.Scalar.e(ctx.cntBinary);
        } else if (tag.regName == "CNT_KECCAK_F") {
            return this.Scalar.e(ctx.cntKeccakF);
        } else if (tag.regName == 'CNT_SHA256_F') {
            return this.Scalar.e(ctx.cntSha256F);
        } else if (tag.regName == "CNT_MEM_ALIGN") {
            return this.Scalar.e(ctx.cntMemAlign);
        } else if (tag.regName == "CNT_PADDING_PG") {
            return this.Scalar.e(ctx.cntPaddingPG);
        } else if (tag.regName == "CNT_POSEIDON_G") {
            return this.Scalar.e(ctx.cntPoseidonG);
        } else if (tag.regName == "STEP") {
            return this.Scalar.e(ctx.step);
        } else if (tag.regName == "HASHPOS") {
            return this.Scalar.e(ctx.HASHPOS);
        } else if (tag.regName == "RCX") {
            return this.Scalar.e(ctx.RCX);
        } else if (tag.regName == "RID") {
            return this.Scalar.e(ctx.RID);
        } else {
            throw new Error(`Invalid register ${tag.regName} ${ctx.sourceRef}`);
        }
    }

    eval_add(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        const b = this.evalCommand(ctx, tag.values[1]);
        return this.Scalar.add(a,b);
    }

    eval_sub(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        const b = this.evalCommand(ctx, tag.values[1]);
        return this.Scalar.sub(a,b);
    }

    eval_neg(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        return this.Scalar.neg(a);
    }

    eval_mul(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        const b = this.evalCommand(ctx, tag.values[1]);
        return this.Scalar.mul(a,b);
    }

    eval_div(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        const b = this.evalCommand(ctx, tag.values[1]);
        return this.Scalar.div(a,b);
    }

    eval_mod(ctx, tag) {
        const a = this.evalCommand(ctx, tag.values[0]);
        const b = this.evalCommand(ctx, tag.values[1]);
        return this.Scalar.mod(a,b);
    }

    eval_bit_operation(ctx, tag)
    {
        const a = this.evalCommand(ctx, tag.values[0]);
        if (tag.op == "bitnot") {
            return ~a;
        }
        const b = this.evalCommand(ctx, tag.values[1]);
        switch(tag.op) {
            case 'bitor':    return this.Scalar.bor(a,b);
            case 'bitand':   return this.Scalar.band(a,b);
            case 'bitxor':   return this.Scalar.bxor(a,b);
            case 'shl':      return this.Scalar.shl(a,b);
            case 'shr':      return this.Scalar.shr(a,b);
        }
        throw new Error(`bit operation ${tag.op} not defined ${ctx.sourceRef}`);
    }

    eval_if(ctx, tag)
    {
        const a = this.evalCommand(ctx, tag.values[0]);
        return this.evalCommand(ctx, tag.values[ a ? 1:2]);
    }

    eval_logical_operation(ctx, tag)
    {
        const a = this.evalCommand(ctx, tag.values[0]);
        if (tag.op === "not") {
            return (a)  ? 0 : 1;
        }
        const b = this.evalCommand(ctx, tag.values[1]);
        switch(tag.op) {
            case 'or':      return (a || b) ? 1 : 0;
            case 'and':     return (a && b) ? 1 : 0;
            case 'eq':      return (a == b) ? 1 : 0;
            case 'ne':      return (a != b) ? 1 : 0;
            case 'gt':      return (a > b)  ? 1 : 0;
            case 'ge':      return (a >= b) ? 1 : 0;
            case 'lt':      return (a < b)  ? 1 : 0;
            case 'le':      return (a <= b)  ? 1 : 0;
        }
        throw new Error(`logical operation ${tag.op} not defined ${ctx.sourceRef}`);
    }

    eval_getMemValue(ctx, tag) {
        let addr = tag.offset;

        if (tag.useCTX === 1) {
            addr += Number(ctx.CTX) * 0x40000;
        }

        if (ctx.fullFe) {
            return this.fea2scalar(ctx.Fr, ctx.mem[addr]);
        }

        return this.safeFea2scalar(ctx.Fr, ctx.mem[addr]);
    }
}