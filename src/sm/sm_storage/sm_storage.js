const fs = require('fs');

const { scalar2fea } = require("@0xpolygonhermez/zkevm-commonjs").smtUtils;
const buildPoseidon = require("@0xpolygonhermez/zkevm-commonjs").getPoseidon;

const { isLogging, logger, fea42String, scalar2fea4, fea4IsEq }  = require("./sm_storage_utils.js");
const SmtActionContext = require("./smt_action_context.js");
const { StorageRomLine } = require("./sm_storage_rom.js");
const StorageRom = require("./sm_storage_rom.js").StorageRom;
const StorageRomFile = __dirname + "/storage_sm_rom.json";
const util = require('util');

module.exports.buildConstants = async function (pols) {
    const poseidon = await buildPoseidon();
    const fr = poseidon.F;

    // Init rom from file
    const rawdata = fs.readFileSync(StorageRomFile);
    const j = JSON.parse(rawdata);
    rom = new StorageRom;
    rom.load(j);

    const polSize = pols.LINE.length;

    for (let i=0; i<polSize; i++) {
        const romLine = i % rom.line.length;
        const l = rom.line[romLine];
        // if (i < rom.line.length) console.log({_:romLine, ...l});

        if (l.CONST && (BigInt(l.CONST) >= 2n ** 32n || BigInt(l.CONST) <= -(2n ** 32n))) {
            throw new Error(`Invalid value for CONST ${BigInt(l.CONST)} on ${l.fileName}:${l.line}`);
        }
        pols.CONST0[i] = l.CONST ? fr.e(BigInt(l.CONST)) : fr.zero;

        pols.ADDRESS[i] = l.address ? BigInt(l.address) : 0n;
        pols.LINE[i] = BigInt(romLine);

        pols.IN_SIBLING_RKEY[i] = l.inSIBLING_RKEY ? BigInt(l.inSIBLING_RKEY):0n;

        /*
            code PARTIAL generated with:
            node tools/pil_pol_table/bits_compose.js "hash,hashType,latchGet,latchSet,climbRkey,climbSiblingRkey,climbBitN,jmpz,jmp,setHashLeft,setHashRight,setLevel,setNewRoot,setOldRoot,setRkey,setRkeyBit,setSiblingRkey,setSiblingValueHash,setValueHigh,setValueLow,jmpnz,inFree,inNewRoot,inOldRoot,inRkey,inRkeyBit,inSiblingValueHash,inValueLow,inValueHigh,inRotlVh,inLevel" -B -e -p "l."
        */

        pols.OPERATION[i] =
              (l.hash ? (2n**0n  * BigInt(l.hash)) : 0n)
            + (l.hashType ? (2n**1n  * BigInt(l.hashType)) : 0n)
            + (l.latchGet ? (2n**2n  * BigInt(l.latchGet)) : 0n)
            + (l.latchSet ? (2n**3n  * BigInt(l.latchSet)) : 0n)
            + (l.climbRkey ? (2n**4n  * BigInt(l.climbRkey)) : 0n)
            + (l.climbSiblingRkey ? (2n**5n  * BigInt(l.climbSiblingRkey)) : 0n)
            + (l.climbBitN ? (2n**6n  * BigInt(l.climbBitN)) : 0n)
            + (l.jmpz ? (2n**7n  * BigInt(l.jmpz)) : 0n)
            + (l.jmp ? (2n**8n  * BigInt(l.jmp)) : 0n)
            + (l.setHASH_LEFT ? (2n**9n  * BigInt(l.setHASH_LEFT)) : 0n)
            + (l.setHASH_RIGHT ? (2n**10n * BigInt(l.setHASH_RIGHT)) : 0n)
            + (l.setLEVEL ? (2n**11n * BigInt(l.setLEVEL)) : 0n)
            + (l.setNEW_ROOT ? (2n**12n * BigInt(l.setNEW_ROOT)) : 0n)
            + (l.setOLD_ROOT ? (2n**13n * BigInt(l.setOLD_ROOT)) : 0n)
            + (l.setRKEY ? (2n**14n * BigInt(l.setRKEY)) : 0n)
            + (l.setRKEY_BIT ? (2n**15n * BigInt(l.setRKEY_BIT)) : 0n)
            + (l.setSIBLING_RKEY ? (2n**16n * BigInt(l.setSIBLING_RKEY)) : 0n)
            + (l.setSIBLING_VALUE_HASH ? (2n**17n * BigInt(l.setSIBLING_VALUE_HASH)) : 0n)
            + (l.setVALUE_HIGH ? (2n**18n * BigInt(l.setVALUE_HIGH)) : 0n)
            + (l.setVALUE_LOW ? (2n**19n * BigInt(l.setVALUE_LOW)) : 0n)
            + (l.jmpnz ? (2n**20n * BigInt(l.jmpnz)) : 0n)
            + (l.inFREE ? (2n**21n * BigInt(l.inFREE)) : 0n)
            + (l.inNEW_ROOT ? (2n**22n * BigInt(l.inNEW_ROOT)) : 0n)
            + (l.inOLD_ROOT ? (2n**23n * BigInt(l.inOLD_ROOT)) : 0n)
            + (l.inRKEY ? (2n**24n * BigInt(l.inRKEY)) : 0n)
            + (l.inRKEY_BIT ? (2n**25n * BigInt(l.inRKEY_BIT)) : 0n)
            + (l.inSIBLING_VALUE_HASH ? (2n**26n * BigInt(l.inSIBLING_VALUE_HASH)) : 0n)
            + (l.inVALUE_LOW ? (2n**27n * BigInt(l.inVALUE_LOW)) : 0n)
            + (l.inVALUE_HIGH ? (2n**28n * BigInt(l.inVALUE_HIGH)) : 0n)
            + (l.inROTL_VH ? (2n**29n * BigInt(l.inROTL_VH)) : 0n)
            + (l.inLEVEL ? (2n**30n * BigInt(l.inLEVEL)) : 0n);

        const flags = ['hash','hashType','latchGet','latchSet','climbRkey','climbSiblingRkey','climbBitN',
                       'jmpz','jmp','setHASH_LEFT','setHASH_RIGHT','setLEVEL','setNEW_ROOT','setOLD_ROOT',
                       'setRKEY','setRKEY_BIT','setSIBLING_RKEY','setSIBLING_VALUE_HASH','setVALUE_HIGH',
                       'setVALUE_LOW','jmpnz','inFREE','inNEW_ROOT','inOLD_ROOT','inRKEY','inRKEY_BIT',
                       'inSIBLING_VALUE_HASH','inVALUE_LOW','inVALUE_HIGH','inROTL_VH','inLEVEL'];

        for (const flag of flags) {
            if (l[flag] && BigInt(l[flag]) !== 0n && BigInt(l[flag]) !== 1n) {
                throw new Error(`Invalid value for ${flag} on ${l.fileName}:${l.line}`);
            }
        }

        if (i < rom.line.length) console.log(`pols.OPERATION[${i}]=${pols.OPERATION[i]}`);
    }
    console.log('StorageRom Done');
}

module.exports.execute = async function (pols, action) {
    const polSize = pols.pc.length;

    const poseidon = await buildPoseidon();
    const fr = poseidon.F;
    const POSEIDONG_PERMUTATION3_ID = 3;

    // Init rom from file
    const rawdata = fs.readFileSync(StorageRomFile);
    const j = JSON.parse(rawdata);
    rom = new StorageRom;
    rom.load(j);

    const required = {PoseidonG: [], ClimbKey: []};

    initPols (pols, polSize);

    let l=0; // rom line number, so current line is rom.line[l]
    let a=0; // action number, so current action is action[a]
    let actionListEmpty = (action.length==0); // becomes true when we run out of actions

    logger("actionListEmpty="+actionListEmpty);
    const ctx = new SmtActionContext(isLogging);

    if (!actionListEmpty) {
        ctx.init (fr, action[a]);
    }
    let dumpedAction = false;
    let onFinal = false;
    for (let i=0; i<polSize; i++) {
        // op is the internal register, reset to 0 at every evaluation
        let op = [fr.zero, fr.zero, fr.zero, fr.zero];
        // Current rom line is set by the program counter of this evaluation
        l = pols.pc[i];
        // console.log('RUN: '+rom.line[l].fileName+':'+rom.line[l].line+' '+rom.line[l].lineStr);
        // console.log('RUN: '+rom.line[l].fileName+':'+rom.line[l].line);

        // Set the next evaluation index, which will be 0 when we reach the last evaluation
        let nexti = (i+1)%polSize;
        if (i == 65) debugger;

        if (isLogging) {
            if (rom.line[l].funcName!="isAlmostEndPolynomial") {
                rom.line[l].print(l);
            }
        }
        if (!onFinal) {
            console.log(`LEVEL ${pols.level[i]} ctx.currentLevel:${ctx.currentLevel}`);
            console.log('TRACE '+l.toString(10).padStart(3)+` ${rom.line[l].fileName.slice(0,-6)}:${rom.line[l].line}`.padEnd(35)+rom.line[l].lineStr);
        }
        /*************/
        /* Selectors */
        /*************/

        // When the rom assembler code calls inFREE, it specifies the requested input data
        // using an operation + function name string couple

        if (a !== dumpedAction) {
            console.log(`************* DUMP ACTION ${a}*********************`);
            console.log(util.inspect(action[a], false, null,true));
            dumpedAction = a;
        }
        if (rom.line[l].inFREE)
        {
            const currentLevel = Number(pols.level[i]);

            if (rom.line[l].op == "functionCall")
            {
                /* Possible values of mode when action is SMT Set:
                    - update -> update existing value
                    - insertFound -> insert with found key; found a leaf node with a common set of key bits
                    - insertNotFound -> insert with no found key
                    - deleteFound -> delete with found key
                    - deleteNotFound -> delete with no found key
                    - deleteLast -> delete the last node, so root becomes 0
                    - zeroToZero -> value was zero and remains zero
                */
                if (rom.line[l].funcName == "isSetUpdate")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "update")
                    {
                        op[0] = fr.one;
                        logger ("StorageExecutor isUpdate returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetInsertFound")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "insertFound")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isInsertFound returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetInsertNotFound")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "insertNotFound")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isInsertNotFound returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetDeleteLast")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "deleteLast")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isDeleteLast returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetDeleteFound")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "deleteFound")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isSetDeleteFound returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetDeleteNotFound")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "deleteNotFound")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isSetDeleteNotFound returns " + fea42String(fr, op));
                    }
                }
                else if (rom.line[l].funcName == "isSetZeroToZero")
                {
                    if (!actionListEmpty && action[a].bIsSet &&
                        action[a].setResult.mode == "zeroToZero")
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isZeroToZero returns " + fea42String(fr, op));
                    }
                }

                // The SMT action can be a final leaf (isOld0 = true)
                else if (rom.line[l].funcName=="GetIsOld0")
                {
                    if (!actionListEmpty && (action[a].bIsSet ? action[a].setResult.isOld0 : action[a].getResult.isOld0))
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isOld0 returns " + fea42String(fr, op));
                    }
                }
                // The SMT action can be a get, which can return a zero value (key not found) or a non-zero value
                else if (rom.line[l].funcName=="isGet")
                {
                    if (!actionListEmpty && !action[a].bIsSet)
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isGet returns " + fea42String(fr, op));
                    }
                }

                // Get the remaining key, i.e. the key after removing the bits used in the tree node navigation
                else if (rom.line[l].funcName=="GetRkey")
                {
                    op[0] = ctx.rkey[0];
                    op[1] = ctx.rkey[1];
                    op[2] = ctx.rkey[2];
                    op[3] = ctx.rkey[3];

                    logger("StorageExecutor GetRkey returns " + fea42String(fr, op));
                }

                // Get the sibling remaining key, i.e. the part that is not common to the value key
                else if (rom.line[l].funcName=="GetSiblingRkey")
                {
                    op[0] = ctx.siblingRkey[0];
                    op[1] = ctx.siblingRkey[1];
                    op[2] = ctx.siblingRkey[2];
                    op[3] = ctx.siblingRkey[3];

                    logger("StorageExecutor GetSiblingRkey returns " + fea42String(fr, op));
                }

                // Get the sibling hash, obtained from the siblings array of the current level,
                // taking into account that the sibling bit is the opposite (1-x) of the value bit
                else if (rom.line[l].funcName=="GetSiblingHash")
                {
                    console.log(currentLevel);
                    if (action[a].bIsSet)
                    {
                        op[0] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n];
                        op[1] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+1n];
                        op[2] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+2n];
                        op[3] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+3n];
                    }
                    else
                    {
                        op[0] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n];
                        op[1] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+1n];
                        op[2] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+2n];
                        op[3] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+3n];
                    }

                    logger("StorageExecutor GetSiblingHash returns " + fea42String(fr, op));
                }
                // Get the sibling hash, obtained from the siblings array of the current level,
                // taking into account that the sibling bit is the opposite (1-x) of the value bit
                else if (rom.line[l].funcName=="GetSiblingHash")
                {
                    console.log(currentLevel);
                    if (action[a].bIsSet)
                    {
                        op[0] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n];
                        op[1] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+1n];
                        op[2] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+2n];
                        op[3] = action[a].setResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+3n];
                    }
                    else
                    {
                        op[0] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n];
                        op[1] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+1n];
                        op[2] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+2n];
                        op[3] = action[a].getResult.siblings[currentLevel][(1n-ctx.bits[currentLevel])*4n+3n];
                    }

                    logger("StorageExecutor GetSiblingHash returns " + fea42String(fr, op));
                }
                // Get the sibling hash, obtained from the siblings array of the current level,
                // taking into account that the sibling bit is the opposite (1-x) of the value bit
                else if (rom.line[l].funcName=="GetSiblingLeftChildHash")
                {
                    if (action[a].bIsSet)
                    {
                        if (typeof action[a].setResult.siblingsLeftChild === 'undefined') {
                            console.log(action[a]);
                        }
                        if ((ctx.level - currentLevel) !== 1) {
                            throw new Error(`Invalid currentLevel ${currentLevel} for level ${ctx.level}`);
                        }
                        op = [...action[a].setResult.siblingLeftChild];
                        // op = [...action[a].setResult.siblingsLeftChild[currentLevel]];
                    }
                    logger("StorageExecutor GetSiblingLeftChildHash returns " + fea42String(fr, op));
                }

                // Get the sibling hash, obtained from the siblings array of the current level,
                // taking into account that the sibling bit is the opposite (1-x) of the value bit
                else if (rom.line[l].funcName=="GetSiblingRightChildHash")
                {
                    if (action[a].bIsSet)
                    {
                        if ((ctx.level - currentLevel) !== 1) {
                            throw new Error(`Invalid currentLevel ${currentLevel} for level ${ctx.level}`);
                        }
                        op = [...action[a].setResult.siblingRightChild];
                        // op = [...action[a].setResult.siblingsRightChild[currentLevel]];
                    }
                    logger("StorageExecutor GetSiblingRightChildHash returns " + fea42String(fr, op));
                }

                // Value is an u256 split in 8 u32 chuncks, each one stored in the lower 32 bits of an u63 field element
                // u63 means that it is not an u64, since some of the possible values are lost due to the prime effect

                // Get the lower 4 field elements of the value
                else if (rom.line[l].funcName=="isValueZero")
                {
                    op[0] = (actionListEmpty || a >= action.length || (action[a].bIsSet ? action[a].setResult.newValue : action[a].getResult.value) === 0n) ? 1n : 0n;
                    logger("StorageExecutor isGet returns " + fea42String(fr, op));
                }

                else if (rom.line[l].funcName=="GetValueLow")
                {
                    let fea = scalar2fea(fr, action[a].bIsSet ? action[a].setResult.newValue : action[a].getResult.value);
                    op[0] = fea[0];
                    op[1] = fea[1];
                    op[2] = fea[2];
                    op[3] = fea[3];

                    logger("StorageExecutor GetValueLow returns " + fea42String(fr, op));
                }
                // Get the higher 4 field elements of the value
                else if (rom.line[l].funcName=="GetValueHigh")
                {
                    let fea = scalar2fea(fr, action[a].bIsSet ? action[a].setResult.newValue : action[a].getResult.value);
                    op[0] = fea[4];
                    op[1] = fea[5];
                    op[2] = fea[6];
                    op[3] = fea[7];

                    logger("StorageExecutor GetValueHigh returns " + fea42String(fr, op));
                }

                // Get the lower 4 field elements of the sibling value
                else if (rom.line[l].funcName=="GetSiblingValueLow")
                {
                    let fea = scalar2fea(fr, action[a].bIsSet ? action[a].setResult.insValue : action[a].getResult.insValue);
                    op[0] = fea[0];
                    op[1] = fea[1];
                    op[2] = fea[2];
                    op[3] = fea[3];

                    logger("StorageExecutor GetSiblingValueLow returns " + fea42String(fr, op));
                }

                // Get the higher 4 field elements of the sibling value
                else if (rom.line[l].funcName=="GetSiblingValueHigh")
                {
                    let fea = scalar2fea(fr, action[a].bIsSet ? action[a].setResult.insValue : action[a].getResult.insValue);
                    op[0] = fea[4];
                    op[1] = fea[5];
                    op[2] = fea[6];
                    op[3] = fea[7];

                    logger("StorageExecutor GetSiblingValueHigh returns " + fea42String(fr, op));
                }

                // Get the lower 4 field elements of the old value
                else if (rom.line[l].funcName=="GetOldValueLow")
                {
                    // This call only makes sense then this is an SMT set
                    if (!action[a].bIsSet)
                    {
                        console.error("Error: StorageExecutor() GetOldValueLow called in an SMT get action");
                        process.exit(-1);
                    }

                    logger("StorageExecutor action[a].setResult.oldValue = "+action[a].setResult.oldValue);
                    // Convert the oldValue scalar to an 8 field elements array
                    fea = scalar2fea(fr, action[a].setResult.oldValue);

                    // Take the lower 4 field elements
                    op[0] = fea[0];
                    op[1] = fea[1];
                    op[2] = fea[2];
                    op[3] = fea[3];

                    logger("StorageExecutor GetOldValueLow returns " + fea42String(fr, op));
                }

                // Get the higher 4 field elements of the old value
                else if (rom.line[l].funcName=="GetOldValueHigh")
                {
                    // This call only makes sense then this is an SMT set
                    if (!action[a].bIsSet)
                    {
                        console.error("Error: StorageExecutor() GetOldValueLow called in an SMT get action");
                        process.exit(-1);
                    }

                    // Convert the oldValue scalar to an 8 field elements array
                    fea=scalar2fea(fr, action[a].setResult.oldValue);

                    // Take the higher 4 field elements
                    op[0] = fea[4];
                    op[1] = fea[5];
                    op[2] = fea[6];
                    op[3] = fea[7];

                    logger("StorageExecutor GetOldValueHigh returns " + fea42String(fr, op));
                }

                // Get the level bit, i.e. the bit x (specified by the parameter) of the level number
                else if (rom.line[l].funcName=="GetLevel")
                {
                    // Check that we haven't parameters
                    if (rom.line[l].params.length!=0)
                    {
                        console.error("Error: StorageExecutor() called with GetLevel but wrong number of parameters=" + rom.line[l].params.length);
                        process.exit(-1);
                    }
                    // TODO: difference ctx.level vs currentLevel
                    op[0] = fr.e(ctx.level);

                    logger("StorageExecutor GetLevel() returns " + fea42String(fr, op));
                }

                // Returns 0 if we reached the top of the tree, i.e. if the current level is 0
                else if (rom.line[l].funcName=="GetTopTree")
                {
                    // Return 0 only if we reached the end of the tree, i.e. if the current level is 0
                    if (currentLevel > 0)
                    {
                        op[0] = fr.one;
                    }

                    logger("StorageExecutor GetTopTree returns " + fea42String(fr, op));
                }

                // Returns 0 if we reached the top of the branch, i.e. if the level matches the siblings size
                else if (rom.line[l].funcName=="GetTopOfBranch")
                {
                    // If we have consumed enough key bits to reach the deepest level of the siblings array, then we are at the top of the branch and we can start climing the tree
                    let siblingsSize = action[a].bIsSet ? action[a].setResult.siblings.length : action[a].getResult.siblings.length;
                    if (currentLevel > siblingsSize )
                    {
                        op[0] = fr.one;
                    }

                    logger("StorageExecutor GetTopOfBranch returns " + fea42String(fr, op));
                }

                // Get the next key bit
                // This call decrements automatically the current level
                else if (rom.line[l].funcName=="GetNextKeyBit")
                {
                    // Decrease current level
                    console.log('ctx.level', ctx.level, currentLevel);
                    ctx.currentLevel--;
                    if (currentLevel < 0)
                    {
                        console.error("Error: StorageExecutor.execute() GetNextKeyBit() found currentLevel<0");
                        process.exit(-1);
                    }

                    // Get the key bit corresponding to the current level
                    op[0] = ctx.bits[currentLevel];

                    logger("StorageExecutor GetNextKeyBit returns " + fea42String(fr, op));
                }

                // Return 1 if we completed all evaluations, except one
                else if (rom.line[l].funcName=="isAlmostEndPolynomial")
                {
                    onFinal = true;
                    // Return one if this is the one before the last evaluation of the polynomials
                    if (i == (polSize-2))
                    {
                        op[0] = fr.one;
                        logger("StorageExecutor isEndPolynomial returns " + fea42String(fr,op));
                    }
                }
                else
                {
                    logger("Error: StorageExecutor() unknown funcName:" + rom.line[l].funcName);
                    console.log(rom.line[l].funcName);
                    process.exit(-1);
                }
            }
            else if (rom.line[l].climbRkey) {
                const bit = rom.line[l].climbBitN ? (1n - pols.rkeyBit[i]) : pols.rkeyBit[i];
                const currentRkey = [pols.rkey0[i], pols.rkey1[i], pols.rkey2[i], pols.rkey3[i]];
                op = climbKey(currentRkey, pols.level[i], bit);
                console.log(`$ Rkey: ${op.map(x => x.toString(16)).join(',')} level:${pols.level[i]} bit:${bit} current:${currentRkey.map(x => x.toString(16)).join(',')}`);
            }
            else if (rom.line[l].climbSiblingRkey) {
                const bit = rom.line[l].climbBitN ? (1n - pols.rkeyBit[i]) : pols.rkeyBit[i];
                const currentRkey = [pols.siblingRkey0[i], pols.siblingRkey1[i], pols.siblingRkey2[i], pols.siblingRkey3[i]];
                op = climbKey(currentRkey, pols.level[i], bit);
                console.log(`$ clibSiblingRkey: ${op.map(x => x.toString(16)).join(',')} level:${pols.level[i]} bit: ${bit} current: ${currentRkey.map(x => x.toString(16)).join(',')}`);
            }
            else if (rom.line[l].op=="")
            {
                // Ignore; this is just to report a list of setters
            }
            else
            {
                // Any other value is an unexpected value
                console.error("Error: StorageExecutor() unknown op:" + rom.line[l].op);
                process.exit(-1);
            }

            if (!fr.isZero(op[0])) pols.free0[i] = op[0];
            if (!fr.isZero(op[1])) pols.free1[i] = op[1];
            if (!fr.isZero(op[2])) pols.free2[i] = op[2];
            if (!fr.isZero(op[3])) pols.free3[i] = op[3];

            // Mark the inFREE register as 1
            pols.inFree[i] = 1n;
        }

        // If a constant is provided, add the constant to the op0
        if (rom.line[l].CONST != "")
        {
            op[0] = fr.add(op[0], fr.e(rom.line[l].CONST));
            pols.const0[i] = fr.e(rom.line[l].CONST);
        }

        // If inOLD_ROOT then op += OLD_ROOT
        if (rom.line[l].inOLD_ROOT)
        {
            op[0] = fr.add(op[0], pols.oldRoot0[i]);
            op[1] = fr.add(op[1], pols.oldRoot1[i]);
            op[2] = fr.add(op[2], pols.oldRoot2[i]);
            op[3] = fr.add(op[3], pols.oldRoot3[i]);
            pols.inOldRoot[i] = fr.one;
        }

        // If inNEW_ROOT then op += NEW_ROOT
        if (rom.line[l].inNEW_ROOT)
        {
            op[0] = fr.add(op[0], pols.newRoot0[i]);
            op[1] = fr.add(op[1], pols.newRoot1[i]);
            op[2] = fr.add(op[2], pols.newRoot2[i]);
            op[3] = fr.add(op[3], pols.newRoot3[i]);
            pols.inNewRoot[i] = fr.one;
        }

        // If inRKEY_BIT then op0 += RKEY_BIT
        if (rom.line[l].inRKEY_BIT)
        {
            op[0] = fr.add(op[0], pols.rkeyBit[i]);
            pols.inRkeyBit[i] = fr.one;
        }

        // If inVALUE_LOW then op += VALUE_LOW
        if (rom.line[l].inVALUE_LOW)
        {
            op[0] = fr.add(op[0], pols.valueLow0[i]);
            op[1] = fr.add(op[1], pols.valueLow1[i]);
            op[2] = fr.add(op[2], pols.valueLow2[i]);
            op[3] = fr.add(op[3], pols.valueLow3[i]);
            pols.inValueLow[i] = fr.one;
        }

        // If inVALUE_HIGH then op += VALUE_HIGH
        if (rom.line[l].inVALUE_HIGH)
        {
            op[0] = fr.add(op[0], pols.valueHigh0[i]);
            op[1] = fr.add(op[1], pols.valueHigh1[i]);
            op[2] = fr.add(op[2], pols.valueHigh2[i]);
            op[3] = fr.add(op[3], pols.valueHigh3[i]);
            pols.inValueHigh[i] = fr.one;
        }

        // If inRKEY then op += RKEY
        if (rom.line[l].inRKEY)
        {
            console.log('RKEY=['+[0,1,2,3].map(index => pols[`rkey${index}`][i].toString(16).toUpperCase()).join()+"]");
            op[0] = fr.add(op[0], pols.rkey0[i]);
            op[1] = fr.add(op[1], pols.rkey1[i]);
            op[2] = fr.add(op[2], pols.rkey2[i]);
            op[3] = fr.add(op[3], pols.rkey3[i]);
            pols.inRkey[i] = fr.one;
        }

        // If inSIBLING_RKEY then op += inSIBLING_RKEY * SIBLING_RKEY
        if (rom.line[l].inSIBLING_RKEY)
        {
            console.log('SIBLING_RKEY=['+[0,1,2,3].map(index => pols[`siblingRkey${index}`][i].toString(16).toUpperCase()).join()+"]");
            pols.inSiblingRkey[i] = fr.e(rom.line[l].inSIBLING_RKEY)
            op[0] = fr.add(op[0], fr.mul(pols.inSiblingRkey[i], pols.siblingRkey0[i]));
            op[1] = fr.add(op[1], fr.mul(pols.inSiblingRkey[i], pols.siblingRkey1[i]));
            op[2] = fr.add(op[2], fr.mul(pols.inSiblingRkey[i], pols.siblingRkey2[i]));
            op[3] = fr.add(op[3], fr.mul(pols.inSiblingRkey[i], pols.siblingRkey3[i]));
            console.log('OP=['+op.map(value => value.toString(16).toUpperCase()).join()+"]");
        }

        // If inSIBLING_VALUE_HASH then op += SIBLING_VALUE_HASH
        if (rom.line[l].inSIBLING_VALUE_HASH)
        {
            op[0] = fr.add(op[0], pols.siblingValueHash0[i]);
            op[1] = fr.add(op[1], pols.siblingValueHash1[i]);
            op[2] = fr.add(op[2], pols.siblingValueHash2[i]);
            op[3] = fr.add(op[3], pols.siblingValueHash3[i]);
            pols.inSiblingValueHash[i] = fr.one;
        }

        // If inROTL_VH then op += rotate_left(VALUE_HIGH)
        if (rom.line[l].inROTL_VH)
        {
            op[0] = fr.add(op[0], pols.valueHigh3[i]);
            op[1] = fr.add(op[1], pols.valueHigh0[i]);
            op[2] = fr.add(op[2], pols.valueHigh1[i]);
            op[3] = fr.add(op[3], pols.valueHigh2[i]);
            pols.inRotlVh[i] = fr.one;
        }

        // If inLEVEL then op0 += LEVEL
        if (rom.line[l].inLEVEL)
        {
            op[0] = fr.add(op[0], pols.level[i]);
            pols.inLevel[i] = fr.one;
        }

        /****************/
        /* Instructions */
        /****************/

        // JMPZ: Jump if OP==0
        if (rom.line[l].jmpz)
        {
            if (fr.isZero(op[0]))
            {
                pols.pc[nexti] = BigInt(rom.line[l].address);
            }
            else
            {
                pols.pc[nexti] = pols.pc[i] + 1n;
            }
            pols.address[i] = BigInt(rom.line[l].address);
            pols.jmpz[i] = 1n;
        }
        else if (rom.line[l].jmpnz)
        {
            if (fr.isZero(op[0]))
            {
                pols.pc[nexti] = pols.pc[i] + 1n;
            }
            else
            {
                pols.pc[nexti] = BigInt(rom.line[l].address);
            }
            pols.address[i] = BigInt(rom.line[l].address);
            pols.jmpnz[i] = 1n;
        }
        // JMP: Jump always
        else if (rom.line[l].jmp)
        {
            pols.pc[nexti] = BigInt(rom.line[l].address);
            pols.address[i] = BigInt(rom.line[l].address);
            pols.jmp[i] = 1n;
        }
        // If not any jump, then simply increment program counter
        else
        {
            pols.pc[nexti] = pols.pc[i] + 1n;
        }

        // Hash: op = poseidon.hash(HASH_LEFT + HASH_RIGHT + (0 or 1, depending on iHashType))
        if (rom.line[l].hash)
        {
            // Prepare the data to hash: HASH_LEFT + HASH_RIGHT + 0 or 1, depending on iHashType
            let fea = [];
            fea[0] = pols.hashLeft0[i];
            fea[1] = pols.hashLeft1[i];
            fea[2] = pols.hashLeft2[i];
            fea[3] = pols.hashLeft3[i];
            fea[4] = pols.hashRight0[i];
            fea[5] = pols.hashRight1[i];
            fea[6] = pols.hashRight2[i];
            fea[7] = pols.hashRight3[i];
            let cap = [];
            if (rom.line[l].hashType==0)
            {
                cap[0] = fr.zero;
            }
            else if (rom.line[l].hashType==1)
            {
                cap[0] = fr.one;
                pols.hashType[i] = 1n;
            }
            else
            {
                console.error("Error: StorageExecutor:execute() found invalid iHashType=" + rom.line[l].hashType);
                process.exit(-1);
            }
            cap[1] = fr.zero;
            cap[2] = fr.zero;
            cap[3] = fr.zero;

            // Call poseidon
            let rp = poseidon(fea, cap);

            // Get the calculated hash from the first 4 elements
            pols.free0[i] = rp[0];
            pols.free1[i] = rp[1];
            pols.free2[i] = rp[2];
            pols.free3[i] = rp[3];

            op[0] = fr.add(op[0],fr.mul(BigInt(rom.line[l].inFREE), pols.free0[i]));
            op[1] = fr.add(op[1],fr.mul(BigInt(rom.line[l].inFREE), pols.free1[i]));
            op[2] = fr.add(op[2],fr.mul(BigInt(rom.line[l].inFREE), pols.free2[i]));
            op[3] = fr.add(op[3],fr.mul(BigInt(rom.line[l].inFREE), pols.free3[i]));

            pols.hash[i] = 1n;
            const hashLeft = [pols.hashLeft0[i],pols.hashLeft1[i],pols.hashLeft2[i],pols.hashLeft3[i]];
            const hashRight = [pols.hashRight0[i],pols.hashRight1[i],pols.hashRight2[i],pols.hashRight3[i]];
            console.log(`HASH${pols.hashType[i]} ${op.slice(0, 4).map(x => x.toString(16).padStart(16,'0')).join('_')} L=${hashLeft.map(x => x.toString(16).padStart(16,'0')).join('_')} R=${hashRight.map(x => x.toString(16).padStart(16,'0')).join('_')}`);
            // console.log('POSEIDON:'+rom.line[l].fileName + ':' + rom.line[l].line+' '+[fea[0],fea[1],fea[2],fea[3],fea[4],fea[5],fea[6],fea[7],cap[0],cap[1],cap[2],cap[3],rp[0],rp[1],rp[2],rp[3]].map(x => x.toString(16)).join(','));
            required.PoseidonG.push([fea[0],fea[1],fea[2],fea[3],fea[4],fea[5],fea[6],fea[7],cap[0],cap[1],cap[2],cap[3],rp[0],rp[1],rp[2],rp[3], POSEIDONG_PERMUTATION3_ID]);

            if (isLogging) {
                let mlog = "StorageExecutor iHash" + rom.line[l].hashType + " hash=" + fea42String(fr, op) + " value=";
                for (let i=0; i<8; i++) mlog += fr.toString(fea[i],16) + ":";
                for (let i=0; i<4; i++) mlog += fr.toString(cap[i],16) + ":";
                logger(mlog);
            }
        }

        // Climb the remaining key, by injecting the RKEY_BIT in the register specified by LEVEL
        if (rom.line[l].climbRkey)
        {
            const bit = rom.line[l].climbBitN ? (1n - pols.rkeyBit[i]) : pols.rkeyBit[i];
            const currentRkey = [pols.rkey0[i], pols.rkey1[i], pols.rkey2[i], pols.rkey3[i]];
            const expectedRkey = climbKey(currentRkey, pols.level[i], bit);
            if (op.some((x, index) => x !== expectedRkey[index])) {
                console.log(rom.line[l]);
                throw new Error(`rkey not match current: (${currentRkey.map(x => x.toString(16)).join(',')}) op:(${op.map(x => x.toString(16)).join(',')}) vs expected:(${expectedRkey.map(x => x.toString(16)).join(',')})`
                                +` level:${pols.level[i]} bit:${bit} rkeyBit:${pols.rkeyBit[i]} on ${rom.line[l].fileName}:${rom.line[l].line} (w:${i})`);
            }
            [pols.rkey0[nexti], pols.rkey1[nexti], pols.rkey2[nexti], pols.rkey3[nexti]] = op;
            pols.climbBitN[i] = rom.line[l].climbBitN ? 1n : 0n;
            pols.climbRkey[i] = 1n;
            required.ClimbKey.push({key: currentRkey, level: pols.level[i], bit});

            if (isLogging) {
                let fea = [pols.rkey0[nexti], pols.rkey1[nexti], pols.rkey2[nexti], pols.rkey3[nexti]];
                logger("StorageExecutor iClimbRkey sibling "+(rom.line[l].climbBitN ? '!':'')+"bit=" + bit + " rkey=" + fea42String(fr,fea));
            }
        }

        // Climb the sibling remaining key, by injecting the sibling bit in the register specified by LEVEL
        if (rom.line[l].climbSiblingRkey)
        {
            if (isLogging) {
                let fea1 = [pols.siblingRkey0[i], pols.siblingRkey1[i], pols.siblingRkey2[i], pols.siblingRkey3[i]];
                logger("StorageExecutor iClimbSiblingRkey before rkey=" + fea42String(fr,fea1));
            }
            const bit = rom.line[l].climbBitN ? (1n - pols.rkeyBit[i]) : pols.rkeyBit[i];
            const currentRkey = [pols.siblingRkey0[i], pols.siblingRkey1[i], pols.siblingRkey2[i], pols.siblingRkey3[i]];
            const expectedRkey = climbKey(currentRkey, pols.level[i], bit);
            if (op.some((x, index) => x !== expectedRkey[index])) {
                console.log(rom.line[l]);
                throw new Error(`siblingRkey not match current: (${currentRkey.map(x => x.toString(16)).join(',')}) op:(${op.map(x => x.toString(16)).join(',')}) vs expected:(${expectedRkey.map(x => x.toString(16)).join(',')})`
                                +` level:${pols.level[i]} bit:${bit} rkeyBit:${pols.rkeyBit[i]} on ${rom.line[l].fileName}:${rom.line[l].line} (w:${i})`);
            }
            [pols.siblingRkey0[nexti], pols.siblingRkey1[nexti], pols.siblingRkey2[nexti], pols.siblingRkey3[nexti]] = op;
            pols.climbBitN[i] = rom.line[l].climbBitN ? 1n : 0n;
            pols.climbSiblingRkey[i] = 1n;
            required.ClimbKey.push({key: currentRkey, level: pols.level[i], bit});

            let fea = [pols.siblingRkey0[nexti], pols.siblingRkey1[nexti], pols.siblingRkey2[nexti], pols.siblingRkey3[nexti]];
            logger("StorageExecutor iClimbSiblingRkey after sibling "+(rom.line[l].climbBitN ? '!':'')+"bit=" + bit + " rkey=" + fea42String(fr,fea));
        }

        // Latch get: at this point consistency is granted: OLD_ROOT, RKEY (complete key), VALUE_LOW, VALUE_HIGH, LEVEL
        if (rom.line[l].latchGet)
        {
            // Check that the current action is an SMT get
            if (action[a].bIsSet)
            {
                console.error("Error: StorageExecutor() LATCH GET found action " + a + " bIsSet=true");
                process.exit(-1);
            }

            // Check that the calculated old root is the same as the provided action root
            let oldRoot = [pols.oldRoot0[i], pols.oldRoot1[i], pols.oldRoot2[i], pols.oldRoot3[i]];
            if ( !fea4IsEq(fr, oldRoot, action[a].getResult.root) )
            {
                console.error("Error: StorageExecutor() LATCH GET found action " + a + " pols.oldRoot=" + fea42String(fr,oldRoot) + " different from action.getResult.root=" + fea42String(fr,action[a].getResult.root));
                process.exit(-1);
            }

            // Check that the calculated complete key is the same as the provided action key
            if ( pols.rkey0[i] != action[a].getResult.key[0] ||
                 pols.rkey1[i] != action[a].getResult.key[1] ||
                 pols.rkey2[i] != action[a].getResult.key[2] ||
                 pols.rkey3[i] != action[a].getResult.key[3] )
            {
                console.error("Error: StorageExecutor() LATCH GET found action " + a + " pols.rkey!=action.getResult.key");
                process.exit(-1);
            }

            // Check that final level state is consistent
            if ( pols.level[i] != fr.zero )
            {
                console.error("Error: StorageExecutor() LATCH GET found action " + a + " wrong level=" + pols.level[i]);
                process.exit(-1);
            }

            // Check hash counters
            if (typeof action[a].getResult.incCounter !== 'undefined' && !fr.eq(action[a].getResult.incCounter, pols.incCounter[i]))
            {
                console.error(`Error: StorageExecutor() LATCH GET ${a} counters no match ${action[a].getResult.incCounter} pols.incCounter:${pols.incCounter[i]}`);
                process.exit(-1);
            }

            const values = [...oldRoot, pols.rkey0[0], pols.rkey1[i], pols.rkey2[i], pols.rkey3[i],
                            pols.valueLow0[i], pols.valueLow1[i], pols.valueLow2[i], pols.valueLow3[i],
                            pols.valueHigh0[i], pols.valueHigh1[i], pols.valueHigh2[i], pols.valueHigh3[i],
                            pols.incCounter[i]];
            console.log(`LATCH_GET input#${a} w=${action[a].main ? action[a].main.w:''} 1:${values.join()}`);

            logger("StorageExecutor LATCH GET");

            // Increase action
            a++;

            // In case we run out of actions, report the empty list to consume the rest of evaluations
            if (a>=action.length)
            {
                actionListEmpty = true;
                logger("StorageExecutor LATCH GET detected the end of the action list a=" + a + " i=" + i);
            }
            // Initialize the context for the new action
            else
            {
                ctx.init(fr, action[a]);
            }

            pols.latchGet[i] = 1n;
        }

        // Latch set: at this point consistency is granted: OLD_ROOT, NEW_ROOT, RKEY (complete key), VALUE_LOW, VALUE_HIGH, LEVEL
        if (rom.line[l].latchSet)
        {
            // Check that the current action is an SMT set
            if (!action[a].bIsSet)
            {
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " bIsSet=false");
                process.exit(-1); //@exit(-1);;
            }

            // Check that the calculated old root is the same as the provided action root
            let oldRoot = [pols.oldRoot0[i], pols.oldRoot1[i], pols.oldRoot2[i], pols.oldRoot3[i]];
            if ( !fea4IsEq(fr, oldRoot, action[a].setResult.oldRoot) )
            {
                let newRoot = [pols.newRoot0[i], pols.newRoot1[i], pols.newRoot2[i], pols.newRoot3[i]];
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " pols.oldRoot=" + fea42String(fr,oldRoot) + " different from action.setResult.oldRoot=" + fea42String(fr,action[a].setResult.oldRoot));
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " pols.newRoot=" + fea42String(fr,newRoot) + " different from action.setResult.newRoot=" + fea42String(fr,action[a].setResult.newRoot));
                process.exit(-1); //@exit(-1);;
            }

            // Check that the calculated old root is the same as the provided action root
            let newRoot = [pols.newRoot0[i], pols.newRoot1[i], pols.newRoot2[i], pols.newRoot3[i]];
            if ( !fea4IsEq(fr, newRoot, action[a].setResult.newRoot) )
            {
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " pols.newRoot=" + fea42String(fr,newRoot) + " different from action.setResult.newRoot=" + fea42String(fr,action[a].setResult.newRoot));
                process.exit(-1);
            }

            // Check that the calculated complete key is the same as the provided action key
            if ( pols.rkey0[i] != action[a].setResult.key[0] ||
                 pols.rkey1[i] != action[a].setResult.key[1] ||
                 pols.rkey2[i] != action[a].setResult.key[2] ||
                 pols.rkey3[i] != action[a].setResult.key[3] )
            {
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " pols.rkey!=action.setResult.key");
                process.exit(-1);
            }

            // Check that final level state is consistent
            if ( pols.level[i] != fr.zero )
            {
                console.error("Error: StorageExecutor() LATCH SET found action " + a + " wrong level=" + pols.level);
                process.exit(-1);
            }
            const values = [...oldRoot, pols.rkey0[i], pols.rkey1[i], pols.rkey2[i], pols.rkey3[i],
                            pols.valueLow0[i], pols.valueLow1[i], pols.valueLow2[i], pols.valueLow3[i],
                            pols.valueHigh0[i], pols.valueHigh1[i], pols.valueHigh2[i], pols.valueHigh3[i],
                            pols.newRoot0[i], pols.newRoot1[i], pols.newRoot2[i], pols.newRoot3[i], pols.incCounter[i]+2n];

            console.log(`LATCH_SET input#${a} w=${action[a].main ? action[a].main.w:''} 1:${values.join()}`);

            logger("StorageExecutor LATCH SET");

            // Check hash counters
            if (typeof action[a].setResult.incCounter !== 'undefined' && !fr.eq(action[a].setResult.incCounter, pols.incCounter[i]))
            {
                console.error(`Error: StorageExecutor() LATCH SET ${a}  counters no match ${action[a].setResult.incCounter} pols.incCounter:${pols.incCounter[i]}`);
                process.exit(-1);
            }

            // Increase action
            a++;

            // In case we run out of actions, report the empty list to consume the rest of evaluations
            if (a>=action.length)
            {
                actionListEmpty = true;

                logger("StorageExecutor() LATCH SET detected the end of the action list a=" + a + " i=" + i);
            }
            // Initialize the context for the new action
            else
            {
                ctx.init(fr, action[a]);
            }

            pols.latchSet[i] = 1n;
        }

        /***********/
        /* Setters */
        /***********/

        // If setRKEY then RKEY=op
        if (rom.line[l].setRKEY)
        {
            pols.rkey0[nexti] = op[0];
            pols.rkey1[nexti] = op[1];
            pols.rkey2[nexti] = op[2];
            pols.rkey3[nexti] = op[3];
            pols.setRkey[i] = 1n;
        }
        else if (pols.climbRkey[i] == 0)
        {
            pols.rkey0[nexti] = pols.rkey0[i];
            pols.rkey1[nexti] = pols.rkey1[i];
            pols.rkey2[nexti] = pols.rkey2[i];
            pols.rkey3[nexti] = pols.rkey3[i];

        }

        // If setRKEY_BIT then RKEY_BIT=op
        if (rom.line[l].setRKEY_BIT)
        {
            pols.rkeyBit[nexti] = op[0];
            pols.setRkeyBit[i] = 1n;
        }
        else
        {
            pols.rkeyBit[nexti] = pols.rkeyBit[i];
        }

        // If setVALUE_LOW then VALUE_LOW=op
        if (rom.line[l].setVALUE_LOW)
        {
            pols.valueLow0[nexti] = op[0];
            pols.valueLow1[nexti] = op[1];
            pols.valueLow2[nexti] = op[2];
            pols.valueLow3[nexti] = op[3];
            pols.setValueLow[i] = 1n;
        }
        else
        {
            pols.valueLow0[nexti] = pols.valueLow0[i];
            pols.valueLow1[nexti] = pols.valueLow1[i];
            pols.valueLow2[nexti] = pols.valueLow2[i];
            pols.valueLow3[nexti] = pols.valueLow3[i];
        }

        // If setVALUE_HIGH then VALUE_HIGH=op
        if (rom.line[l].setVALUE_HIGH)
        {
            pols.valueHigh0[nexti] = op[0];
            pols.valueHigh1[nexti] = op[1];
            pols.valueHigh2[nexti] = op[2];
            pols.valueHigh3[nexti] = op[3];
            pols.setValueHigh[i] = 1n;
        }
        else
        {
            pols.valueHigh0[nexti] = pols.valueHigh0[i];
            pols.valueHigh1[nexti] = pols.valueHigh1[i];
            pols.valueHigh2[nexti] = pols.valueHigh2[i];
            pols.valueHigh3[nexti] = pols.valueHigh3[i];
        }

        // If setLEVEL then LEVEL=op
        if (rom.line[l].setLEVEL)
        {
            pols.level[nexti] = op[0];
            pols.setLevel[i] = 1n;
        }
        else
        {
            pols.level[nexti] = pols.level[i];
        }

        // If setOLD_ROOT then OLD_ROOT=op
        if (rom.line[l].setOLD_ROOT)
        {
            pols.oldRoot0[nexti] = op[0];
            pols.oldRoot1[nexti] = op[1];
            pols.oldRoot2[nexti] = op[2];
            pols.oldRoot3[nexti] = op[3];
            console.log(`RUN SET_OLD_ROOT level:${pols.level[i]} hash:${op.map(x => x.toString(16)).join(',')}`);
            pols.setOldRoot[i] = 1n;
        }
        else
        {
            pols.oldRoot0[nexti] = pols.oldRoot0[i];
            pols.oldRoot1[nexti] = pols.oldRoot1[i];
            pols.oldRoot2[nexti] = pols.oldRoot2[i];
            pols.oldRoot3[nexti] = pols.oldRoot3[i];
        }

        // If setNEW_ROOT then NEW_ROOT=op
        if (rom.line[l].setNEW_ROOT)
        {
            pols.newRoot0[nexti] = op[0];
            pols.newRoot1[nexti] = op[1];
            pols.newRoot2[nexti] = op[2];
            pols.newRoot3[nexti] = op[3];
            console.log(`RUN SET_NEW_ROOT level:${pols.level[i]} hash:${op.map(x => x.toString(16)).join(',')}`);
            pols.setNewRoot[i] = 1n;
        }
        else
        {
            pols.newRoot0[nexti] = pols.newRoot0[i];
            pols.newRoot1[nexti] = pols.newRoot1[i];
            pols.newRoot2[nexti] = pols.newRoot2[i];
            pols.newRoot3[nexti] = pols.newRoot3[i];
        }

        // If setHASH_LEFT then HASH_LEFT=op
        if (rom.line[l].setHASH_LEFT)
        {
            pols.hashLeft0[nexti] = op[0];
            pols.hashLeft1[nexti] = op[1];
            pols.hashLeft2[nexti] = op[2];
            pols.hashLeft3[nexti] = op[3];
            console.log('RUN SET_HASH_LEFT: '+op.map(x => x.toString(16).padStart(16,'0')).join('_'));
            pols.setHashLeft[i] = 1n;
        }
        else
        {
            pols.hashLeft0[nexti] = pols.hashLeft0[i];
            pols.hashLeft1[nexti] = pols.hashLeft1[i];
            pols.hashLeft2[nexti] = pols.hashLeft2[i];
            pols.hashLeft3[nexti] = pols.hashLeft3[i];
        }

        // If setHASH_RIGHT then HASH_RIGHT=op
        if (rom.line[l].setHASH_RIGHT)
        {
            pols.hashRight0[nexti] = op[0];
            pols.hashRight1[nexti] = op[1];
            pols.hashRight2[nexti] = op[2];
            pols.hashRight3[nexti] = op[3];
            console.log('RUN SET_HASH_RIGHT: '+op.map(x => x.toString(16).padStart(16,'0')).join('_'));
            pols.setHashRight[i] = 1n;
        }
        else
        {
            pols.hashRight0[nexti] = pols.hashRight0[i];
            pols.hashRight1[nexti] = pols.hashRight1[i];
            pols.hashRight2[nexti] = pols.hashRight2[i];
            pols.hashRight3[nexti] = pols.hashRight3[i];
        }

        // If setSIBLING_RKEY then SIBLING_RKEY=op
        if (rom.line[l].setSIBLING_RKEY)
        {
            pols.siblingRkey0[nexti] = op[0];
            pols.siblingRkey1[nexti] = op[1];
            pols.siblingRkey2[nexti] = op[2];
            pols.siblingRkey3[nexti] = op[3];
            pols.setSiblingRkey[i] = 1n;
        }
        else if (pols.climbSiblingRkey[i] == 0)
        {
            pols.siblingRkey0[nexti] = pols.siblingRkey0[i];
            pols.siblingRkey1[nexti] = pols.siblingRkey1[i];
            pols.siblingRkey2[nexti] = pols.siblingRkey2[i];
            pols.siblingRkey3[nexti] = pols.siblingRkey3[i];
        }

        // If setSIBLING_VALUE_HASH then SIBLING_VALUE_HASH=op
        if (rom.line[l].setSIBLING_VALUE_HASH)
        {
            pols.siblingValueHash0[nexti] = op[0];
            pols.siblingValueHash1[nexti] = op[1];
            pols.siblingValueHash2[nexti] = op[2];
            pols.siblingValueHash3[nexti] = op[3];
            pols.setSiblingValueHash[i] = 1n;
        }
        else
        {
            pols.siblingValueHash0[nexti] = pols.siblingValueHash0[i];
            pols.siblingValueHash1[nexti] = pols.siblingValueHash1[i];
            pols.siblingValueHash2[nexti] = pols.siblingValueHash2[i];
            pols.siblingValueHash3[nexti] = pols.siblingValueHash3[i];
        }

        if (!fr.isZero(op[0]))
        {
            pols.op0inv[i] = fr.inv(op[0]);
        }


        // Increment counter at every hash, and reset it at every latch
        if (rom.line[l].hash)
        {
            pols.incCounter[nexti] = pols.incCounter[i] + 1n;
        }
        else if (rom.line[l].latchGet || rom.line[l].latchSet)
        {
            pols.incCounter[nexti] = 0n;
        }
        else
        {
            pols.incCounter[nexti] = pols.incCounter[i];
        }

        if ((i%1000)==0) logger("StorageExecutor step "+ i +" done");

    }

    logger("StorageExecutor successfully processed " + action.length + " SMT actions");

    return required;
}

function initPols (pols, polSize) {
    for (let i=0; i<polSize; i++) {
        pols.free0[i] = 0n;
        pols.free1[i] = 0n;
        pols.free2[i] = 0n;
        pols.free3[i] = 0n;

        pols.hashLeft0[i] = 0n;
        pols.hashLeft1[i] = 0n;
        pols.hashLeft2[i] = 0n;
        pols.hashLeft3[i] = 0n;

        pols.hashRight0[i] = 0n;
        pols.hashRight1[i] = 0n;
        pols.hashRight2[i] = 0n;
        pols.hashRight3[i] = 0n;

        pols.oldRoot0[i] = 0n;
        pols.oldRoot1[i] = 0n;
        pols.oldRoot2[i] = 0n;
        pols.oldRoot3[i] = 0n;

        pols.newRoot0[i] = 0n;
        pols.newRoot1[i] = 0n;
        pols.newRoot2[i] = 0n;
        pols.newRoot3[i] = 0n;

        pols.valueLow0[i] = 0n;
        pols.valueLow1[i] = 0n;
        pols.valueLow2[i] = 0n;
        pols.valueLow3[i] = 0n;

        pols.valueHigh0[i] = 0n;
        pols.valueHigh1[i] = 0n;
        pols.valueHigh2[i] = 0n;
        pols.valueHigh3[i] = 0n;

        pols.siblingValueHash0[i] = 0n;
        pols.siblingValueHash1[i] = 0n;
        pols.siblingValueHash2[i] = 0n;
        pols.siblingValueHash3[i] = 0n;

        pols.rkey0[i] = 0n;
        pols.rkey1[i] = 0n;
        pols.rkey2[i] = 0n;
        pols.rkey3[i] = 0n;

        pols.siblingRkey0[i] = 0n;
        pols.siblingRkey1[i] = 0n;
        pols.siblingRkey2[i] = 0n;
        pols.siblingRkey3[i] = 0n;

        pols.rkeyBit[i] = 0n;

        pols.level[i] = 0n;

        pols.pc[i] = 0n;

        pols.inOldRoot[i] = 0n;
        pols.inNewRoot[i] = 0n;
        pols.inValueLow[i] = 0n;
        pols.inValueHigh[i] = 0n;
        pols.inSiblingValueHash[i] = 0n;
        pols.inRkey[i] = 0n;
        pols.inRkeyBit[i] = 0n;
        pols.inSiblingRkey[i] = 0n;
        pols.inFree[i] = 0n;
        pols.inRotlVh[i] = 0n;
        pols.inLevel[i] = 0n;

        pols.setHashLeft[i] = 0n;
        pols.setHashRight[i] = 0n;
        pols.setOldRoot[i] = 0n;
        pols.setNewRoot[i] = 0n;
        pols.setValueLow[i] = 0n;
        pols.setValueHigh[i] = 0n;
        pols.setSiblingValueHash[i] = 0n;
        pols.setRkey[i] = 0n;
        pols.setSiblingRkey[i] = 0n;
        pols.setRkeyBit[i] = 0n;
        pols.setLevel[i] = 0n;

        pols.hash[i] = 0n;
        pols.hashType[i] = 0n;
        pols.latchGet[i] = 0n;
        pols.latchSet[i] = 0n;
        pols.climbRkey[i] = 0n;
        pols.climbSiblingRkey[i] = 0n;
        pols.climbBitN[i] = 0n;
        pols.jmpz[i] = 0n;
        pols.jmpnz[i] = 0n;
        pols.jmp[i] = 0n;
        pols.const0[i] = 0n;
        pols.address[i] = 0n;

        pols.op0inv[i] = 0n;
        pols.incCounter[i] = 0n;
    }
}

function climbKey (key, level, bit) {
    let result = [...key];
    const levelKey = Number(level) % 4;
    result[levelKey] = result[levelKey] * 2n + bit;
    return result;
}
