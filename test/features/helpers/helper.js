module.exports = class myHelper {
    setup (props) {
        for(const name in props) {
            this[name] = props[name];
        }
    }
    eval_Hello(ctx, tag) {
        const a = this.evalCommand(ctx, tag.params[0]);
        const b = this.evalCommand(ctx, tag.params[1]);
        return a + 3n*b;
    }
}