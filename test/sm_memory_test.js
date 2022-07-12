const chai = require("chai");
const assert = chai.assert;
const F1Field = require("ffjavascript").F1Field;

const { createCommitedPols, createConstantPols, compile, verifyPil } = require("@0xpolygonhermez/pilcom");
const sm_memory = require("../src/sm/sm_mem.js");

function log (m) {console.log(m);}

/* Prints access list contents, for debugging purposes */
function print (fr, list)
{
    for (let i=0; i<list.length; i++)
    {
        console.log("Memory access i="+i+
        " address="+list[i].address.toString(16)+
        " pc="+list[i].pc+
        " "+(list[i].bIsWrite?"WRITE":"READ")+
        " value="+fr.toString(list[i].fe7,16)+
            ":"+fr.toString(list[i].fe6,16)+
            ":"+fr.toString(list[i].fe5,16)+
            ":"+fr.toString(list[i].fe4,16)+
            ":"+fr.toString(list[i].fe3,16)+
            ":"+fr.toString(list[i].fe2,16)+
            ":"+fr.toString(list[i].fe1,16)+
            ":"+fr.toString(list[i].fe0,16));
    }
}

function reorder (list)
{
    let aux = [];
    let p = 0;

    for (let i=0; i<list.length; i++)
    {
        let ma = list[i];
        for (p=0; p<aux.length; p++)
        {
            if (ma.address < aux[p].address) break;
            else if ((ma.address == aux[p].address) &&
                     (ma.pc < aux[p].pc)) break;
        }
        aux.splice(p,0,ma); //Insert ma object in the p position
    }
    return aux;
}

let access = [
    {
        bIsWrite: true,
        address: 0x40,
        pc: 18,
        fe0: 0x1003, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: true,
        address: 0x10,
        pc: 1,
        fe0: 0x70, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: false,
        address: 0x10,
        pc: 2,
        fe0: 0x70, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: true,
        address: 0x40,
        pc: 4,
        fe0: 0x1000, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: true,
        address: 0x10,
        pc: 3,
        fe0: 0x80, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: true,
        address: 0x40,
        pc: 5,
        fe0: 0x1001, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: false,
        address: 0x10,
        pc: 12,
        fe0: 0x80, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: false,
        address: 0x10,
        pc: 10,
        fe0: 0x80, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: false,
        address: 0x40,
        pc: 8,
        fe0: 0x1001, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    },
    {
        bIsWrite: true,
        address: 0x40,
        pc: 11,
        fe0: 0x1002, fe1:0, fe2:0, fe3:0, fe4:0, fe5:0, fe6:0, fe7:0
    }
];

describe("test memory operations", async function () {
    this.timeout(10000000);

    it("It should create the pols, excute test and verify the pil", async () => {

        const Fr = new F1Field("0xFFFFFFFF00000001");
        const pil = await compile(Fr, "pil/mem.pil");
        const [constPols, constPolsArray, constPolsDef] = createConstantPols(pil);
        const [cmPols, cmPolsArray, cmPolsDef] = createCommitedPols(pil);

        await sm_memory.buildConstants(constPols.Mem, constPolsDef.Mem);
        await sm_memory.execute(cmPols.Mem, cmPolsDef.Mem, access);

        // Verify
        const res = await verifyPil(Fr, pil, cmPolsArray, constPolsArray);

        if (res.length != 0) {
            console.log("Pil does not pass");
            for (let i = 0; i < res.length; i++) {
                console.log(res[i]);
            }
            assert(0);
        }
    });
});
