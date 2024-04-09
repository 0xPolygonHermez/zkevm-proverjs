const Helper = require('./helper.js');

module.exports = class SaveRestore extends Helper {
    onFinishExecution() {
        const nonRestoredSaves = Object.keys(this.ctx.saved).filter(id => !this.ctx.saved[id].restored);
        if (nonRestoredSaves.length === 0) return;

        throw new Error(`Found ${nonRestoredSaves.length} saves not restored: `+nonRestoredSaves.map(rid => this.ctx.saved[rid].sourceRef).join());
    }
    eval_getPendingRID(ctx, tag) {
        const rid = Number(this.evalCommand(ctx, tag.params[0]));
        const _rid = Object.keys(ctx.saved).find(id => id != rid && !ctx.saved[id].restored);

        if (typeof _rid === 'undefined') {
            return [ctx.Fr.e(-1), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
        }        
        return [ctx.Fr.e(_rid), ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero, ctx.Fr.zero];
    }
};