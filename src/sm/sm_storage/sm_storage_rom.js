class StorageRomLine
{
    constructor ()
    {
        // Mandatory fields
        this.line = 0;
        this.fileName = "";

        // Instructions
        this.jmpz = false;
        this.jmpnz = false;
        this.jmp = false;
        this.rotateLevel = false;
        this.hash = false;
        this.hashType = 0;
        this.climbRkey = false;
        this.climbSiblingRkey = false;
        this.climbBitN = false;
        this.latchGet = false;
        this.latchSet = false;

        // Selectors
        this.inFREE = false;
        this.inOLD_ROOT = false;
        this.inNEW_ROOT = false;
        this.inRKEY_BIT = false;
        this.inVALUE_LOW = false;
        this.inVALUE_HIGH = false;
        this.inRKEY = false;
        this.inSIBLING_RKEY = false;
        this.inSIBLING_VALUE_HASH = false;
        this.inLEVEL = false;

        // Setters
        this.setRKEY = false;
        this.setRKEY_BIT = false;
        this.setVALUE_LOW = false;
        this.setVALUE_HIGH = false;
        this.setLEVEL = false;
        this.setOLD_ROOT = false;
        this.setNEW_ROOT = false;
        this.setHASH_LEFT = false;
        this.setHASH_RIGHT = false;
        this.setSIBLING_RKEY = false;
        this.setSIBLING_VALUE_HASH = false;

        // Jump parameters
        this.jmpAddressLabel = "";
        this.jmpAddress = 0;

        // inFREE parameters
        this.op = "";
        this.funcName = "";
        this.params = []; //vector<uint64_t>

        // Constant
        this.CONST = "";
    }

    print(l)
    {
        let found = this.fileName.lastIndexOf("/");
        if (found==-1) found = this.fileName.lastIndexOf("\\");
        let path = this.fileName.substring(0,found);
        let file = this.fileName.substring(found+1);

        // Mandatory fields
        let logstr = "StorageRomLine l="+l+" line="+this.line+" file="+file+" ";

         // Selectors
        if (this.inFREE) logstr += "inFREE ";
        if (this.op.length>0) // inFREE parameters
        {
            logstr += "op=" + this.op;
            logstr += " funcName=" + this.funcName;
            logstr += " #params=" + this.params.length + " ";
            for (let i=0; i<this.params.length; i++)
            {
                logstr += "params[" + i + "]=" + this.params[i] + " ";
            }
        }
        if (this.CONST.length>0) logstr += "CONST=" + this.CONST + " "; // Constant
        if (this.inOLD_ROOT) logstr += (inOLD_ROOT == 1 ? '':inOLD_ROOT + '*') + "inOLD_ROOT ";
        if (this.inNEW_ROOT) logstr += (inNEW_ROOT == 1 ? '':inNEW_ROOT + '*') + "inNEW_ROOT ";
        if (this.inRKEY_BIT) logstr += (inRKEY_BIT == 1 ? '':inRKEY_BIT + '*') + "inRKEY_BIT ";
        if (this.inVALUE_LOW) logstr += (inVALUE_LOW == 1 ? '':inVALUE_LOW + '*') + "inVALUE_LOW ";
        if (this.inVALUE_HIGH) logstr += (inVALUE_HIGH == 1 ? '':inVALUE_HIGH + '*') + "inVALUE_HIGH ";
        if (this.inRKEY) logstr += (inRKEY == 1 ? '':inRKEY + '*') + "inRKEY ";
        if (this.inSIBLING_RKEY) logstr += (inSIBLING_RKEY == 1 ? '':inSIBLING_RKEY + '*') + "inSIBLING_RKEY ";
        if (this.inSIBLING_VALUE_HASH) logstr += (inSIBLING_VALUE_HASH == 1 ? '':inSIBLING_VALUE_HASH + '*') + "inSIBLING_VALUE_HASH ";
        if (this.inROTL_VH) logstr += (inROTL_VH == 1 ? '':inROTL_VH + '*') + "inROTL_VH ";
        if (this.inLEVEL) logstr += (inLEVEL == 1 ? '':inLEVEL + '*') + "inLEVEL ";

        // Instructions
        if (this.jmpz) logstr += "jmpz ";
        if (this.jmpz) logstr += "jmpnz ";
        if (this.jmp) logstr += "jmp ";
        if (this.jmpAddressLabel.length>0) logstr += "jmpAddressLabel=" + this.jmpAddressLabel + " "; // Jump parameter
        if (this.jmpAddress>0) logstr += "jmpAddress=" + this.jmpAddress + " "; // Jump parameter
        if (this.hash) logstr += "hash " + "hashType=" + this.iHashType + " ";
        if (this.climbRkey) logstr += "climbRkey ";
        if (this.climbSiblingRkey) logstr += "climbSiblingRkey ";
        if (this.climbBitN) logstr += "climbBitN ";
        if (this.latchGet) logstr += "latchGet ";
        if (this.latchSet) logstr += "latchSet ";

        // Setters
        if (this.setRKEY) logstr += "setRKEY ";
        if (this.setRKEY_BIT) logstr += "setRKEY_BIT ";
        if (this.setVALUE_LOW) logstr += "setVALUE_LOW ";
        if (this.setVALUE_HIGH) logstr += "setVALUE_HIGH ";
        if (this.setLEVEL) logstr += "setLEVEL ";
        if (this.setOLD_ROOT) logstr += "setOLD_ROOT ";
        if (this.setNEW_ROOT) logstr += "setNEW_ROOT ";
        if (this.setHASH_LEFT) logstr += "setHASH_LEFT ";
        if (this.setHASH_RIGHT) logstr += "setHASH_RIGHT ";
        if (this.setSIBLING_RKEY) logstr += "setSIBLING_RKEY ";
        if (this.setSIBLING_VALUE_HASH) logstr += "setSIBLING_VALUE_HASH ";

        console.log(logstr);
    }
}

class StorageRom
{
    constructor ()
    {
        this.line = [];
    }

    load (j)
    {
        if (!j.hasOwnProperty("program") || !j.program.length>0) {
            console.error("Error: StorageRom::load() could not find a root program array");
            process.exit(-1);
        }

        // TODO: review lines padding !!!

        for (let i=0; i<j.program.length; i++) {
            let romLine = new StorageRomLine;
            const l = j.program[i];


            // Mandatory fields
            romLine.line = l.line;
            romLine.fileName = l.fileName;
            romLine.lineStr = l.lineStr;

            // Instructions
            if (l.jmpz) romLine.jmpz = true;
            if (l.jmpnz) romLine.jmpnz = true;
            if (l.jmp) romLine.jmp = true;
            if (l.hash) romLine.hash = true;
            if (l.hashType) romLine.hashType = l.hashType;

            if (l.climbRkey) romLine.climbRkey = BigInt(l.climbRkey);
            if (l.climbSiblingRkey) romLine.climbSiblingRkey = BigInt(l.climbSiblingRkey);
            if (l.climbBitN) romLine.climbBitN = BigInt(l.climbBitN);

            if (l.latchGet) romLine.latchGet = true;
            if (l.latchSet) romLine.latchSet = true;

            // Selectors
            if (l.inFREE) romLine.inFREE = BigInt(l.inFREE);
            if (l.inOLD_ROOT) romLine.inOLD_ROOT = BigInt(l.inOLD_ROOT);
            if (l.inNEW_ROOT) romLine.inNEW_ROOT = BigInt(l.inNEW_ROOT);
            if (l.inVALUE_LOW) romLine.inVALUE_LOW = BigInt(l.inVALUE_LOW);
            if (l.inVALUE_HIGH) romLine.inVALUE_HIGH = BigInt(l.inVALUE_HIGH);
            if (l.inRKEY) romLine.inRKEY = BigInt(l.inRKEY);
            if (l.inRKEY_BIT) romLine.inRKEY_BIT = BigInt(l.inRKEY_BIT);
            if (l.inSIBLING_RKEY) romLine.inSIBLING_RKEY = BigInt(l.inSIBLING_RKEY);
            if (l.inSIBLING_VALUE_HASH) romLine.inSIBLING_VALUE_HASH = BigInt(l.inSIBLING_VALUE_HASH);
            if (l.inROTL_VH) romLine.inROTL_VH = BigInt(l.inROTL_VH);
            if (l.inLEVEL) romLine.inLEVEL = BigInt(l.inLEVEL);

            // Setters
            if (l.setRKEY) romLine.setRKEY = true;
            if (l.setRKEY_BIT) romLine.setRKEY_BIT = true;
            if (l.setVALUE_LOW) romLine.setVALUE_LOW = true;
            if (l.setVALUE_HIGH) romLine.setVALUE_HIGH = true;
            if (l.setLEVEL) romLine.setLEVEL = true;
            if (l.setOLD_ROOT) romLine.setOLD_ROOT = true;
            if (l.setNEW_ROOT) romLine.setNEW_ROOT = true;
            if (l.setHASH_LEFT) romLine.setHASH_LEFT = true;
            if (l.setHASH_RIGHT) romLine.setHASH_RIGHT = true;
            if (l.setSIBLING_RKEY) romLine.setSIBLING_RKEY = true;
            if (l.setSIBLING_VALUE_HASH) romLine.setSIBLING_VALUE_HASH = true;

            // Jump parameters
            if (romLine.jmp || romLine.jmpz || romLine.jmpnz)
            {
                romLine.jmpAddressLabel = l.jmpAddressLabel;
                romLine.jmpAddress = l.jmpAddress;
            }

            // inFREE parameters
            if (romLine.inFREE && l.freeInTag)
            {
                romLine.op = l.freeInTag.op;
                if (romLine.op=="functionCall")
                {
                    romLine.funcName = l.freeInTag.funcName;
                    for (let p=0; p<l.freeInTag.params.length; p++)
                    {
                        romLine.params.push(l.freeInTag.params[p].num);
                    }
                }
            }

            // Constant
            if (l.hasOwnProperty("CONST"))
            {
                romLine.CONST = l.CONST;
            }
            this.line.push(romLine);
        }
    }
}

module.exports = {StorageRomLine, StorageRom};
