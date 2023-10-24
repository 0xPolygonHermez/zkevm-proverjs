module.exports = class myHelper {
    setup (props) {
        for(const name in props) {
            this[name] = props[name];
        }
    }
    eval_hello(ctx, tag) {
        const a = this.evalCommand(ctx, tag.params[0]);
        const b = this.evalCommand(ctx, tag.params[1]);
        return a + 3n*b;
    }
    eval_dumpFe(ctx, tag) {
        for (let index = 0; index < tag.params.length; ++index) {
            const param = tag.params[index];
            if (param.op !== 'getReg') {
                console.log(`Ignore invalid operation ${param.op} on param #${index}`);
                continue;
            }
            console.log(`${param.regName}: [${ctx[param.regName].join(',')}]`);
        }
        return 0n;
    }
    eval_dumpFe(ctx, tag) {
        for (let index = 0; index < tag.params.length; ++index) {
            const param = tag.params[index];
            if (param.op !== 'getReg') {
                console.log(`Ignore invalid operation ${param.op} on param #${index}`);
                continue;
            }
            console.log(`${param.regName}: [${ctx[param.regName].join(',')}]`);
        }
        return 0n;
    }
    eval_dumpHexFe(ctx, tag) {
        for (let index = 0; index < tag.params.length; ++index) {
            const param = tag.params[index];
            if (param.op !== 'getReg') {
                console.log(`Ignore invalid operation ${param.op} on param #${index}`);
                continue;
            }
            console.log(`${param.regName}: [${ctx[param.regName].map(x => "0x"+x.toString(16).padStart(16, '0')).join(',')}]`);
        }
        return 0n;
    }
}