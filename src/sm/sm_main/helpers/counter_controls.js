const Helper = require('./helper.js')

const MASK64 = 0xFFFFFFFFFFFFFFFFn;
const PRIME = 0xFFFFFFFF00000001n;
const FIRST_NEGATIVE_VALUE = PRIME - MASK64;

module.exports = class CounterControls extends Helper {
/*
    constructor() {
        super();
        this.counterControls = {
            outOfCountersStep:      {limitConstant: 'MAX_CNT_STEPS',             counter: 'cntStep'     },
            outOfCountersArith:     {limitConstant: 'MAX_CNT_ARITH',             counter: 'cntArith'    },
            outOfCountersBinary:    {limitConstant: 'MAX_CNT_BINARY',            counter: 'cntBinary'   },
            outOfCountersKeccak:    {limitConstant: 'MAX_CNT_KECCAK_F',          counter: 'cntKeccakF'  },
            outOfCountersSha256:    {limitConstant: 'MAX_CNT_SHA256_F',          counter: 'cntSha256F'  },
            outOfCountersMemalign:  {limitConstant: 'MAX_CNT_MEM_ALIGN',         counter: 'cntMemAlign' },
            outOfCountersPoseidon:  {limitConstant: 'MAX_CNT_POSEIDON_G',        counter: 'cntPoseidonG'},
            outOfCountersPadding:   {limitConstant: 'MAX_CNT_PADDING_PG_LIMIT',  counter: 'cntPaddingPG'}
        };
    }
    setup(props) {
        super.setup(props);
        this.initCounterControls();    
    }
    getData() {
        return this.counterControls;
    }
    checkLabel(label, o) {
        const counterControl = this.counterControls[label] ?? false;
        if (counterControl === false || counterControl.limit === false) {
            return;
        }
        const reserv = counterControl.limit - (o < FIRST_NEGATIVE_VALUE ? o : o - PRIME);
        if (typeof counterControl.reserved === 'undefined' || counterControl.reserved < reserv) {
            counterControl.reserved = reserv;
            counterControl.reservedCalculated = reserv;
            counterControl.sourceRef = sourceRef;
        }
    }
    initCounterControls() {
        for (const label in this.counterControls) {
            const cc = this.counterControls[label];
            cc.limit = this.ctx.rom.constants[cc.limitConstant] ? BigInt(this.ctx.rom.constants[cc.limitConstant].value) : false;
            cc.reserved = false;
            cc.sourceRef = false;
            cc.reservedCalculated = false;
            cc.lessThanFinalSteps = false;
        }
    }
    updateWithCounters() {
        for (const label in this.counterControls) {
            const cc = this.counterControls[label];
            if (this.ctx[cc.counter] <= cc.limit) continue;
            cc.reserved = this.ctx[cc.counter];
            cc.lessThanFinalSteps = true;
        }        
    }
*/
}