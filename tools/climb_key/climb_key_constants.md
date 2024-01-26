# ClimbKey (constants)

Goldilocks = **0xFFFFFFFF00000001**
Chunks = 18 bits, 18 bits, 18 bits, 10 bits (LSB => MSB)  
GoldilocksChunks[4] = [0x00001, 0x3C000, 0x3FFFF, 0x3FF]  
0xFFFFFFFF00000001 == 0x00001 + 2**18 * 0x3C000 + 2 **36 * 0x3FFFF + 2 ** 54 * 0x3FF

*carry* and *lt* are after apply shift and set climb bit  
*lt* is done only with bits of chunk  
*carryLt* = *carry* + 2 * *lt*

*cols* = CLKSEL, CARRY_LT_IN, CARRY_LT_OUT, CHUNK_RANGE, LEVELS  
*climb* = (CHUNK_RANGE * 2 + bit) & CHUNK_MASK  
*glc* = goldilocks chunk

CLKSEL = CLK + 4 * selKey0 + 8 * selKey1 + 16 * selKey2 + 32 * selKey3  
[a1,a2..+..an] arithmetic serie with values = a1, a2, a2 + (a2-a1), a2 + 2*(a2-a1),..,an

values of *cols* generated with *tools/climb_key/cpp_helpers.js* parsing output of *buildConstants*.

## CLK0 GL_CHUNK = 0x00001

#### clock = 0, bit = 0 (carryLtIn = 0)
valid chunk values (all) = 0x0, 0x1-0x1ffff, 0x20000, 0x20001-0x3ffff
|cols(*) |climb|glc|notes|
|------|-------|---|----|
|0,0,**2**,0x0,0|0x0|0x00001|ltOut = 1 (only for chunk = 0) ⇒ carryLtOut = 2|
|0,0,**0**,0x1-0x1ffff,0|0x2-0x3fffe|0x00001|ltOut = 0, carryOut = 0 ⇒ carryLtOut = 0|
|0,0,**3**,0x20000,0|0x00000|0x00001|ltOut = 1, carryOut = 1 ⇒ carryLtOut = 3 (1)|
|0,0,**1**,0x20001-0x3ffff,0|0x00001-0x3fffe|0x00001|ltOut = 0, carryOut = 1 ⇒ carryLtOut = 2|

(1) lt is active because ((0x20000 << 1) & 0x3FFFF) = 0

#### clock = 0, bit = 1 (carryLtIn = 1)
valid chunk values (all) = 0x0-0x1ffff, 0x20000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|0,1,0,0x0-0x1ffff,0|0x1-0x3ffff|0x00001|ltOut = 0, carryOut = 0 ⇒ carryLtOut = 0|
|0,1,1,0x20000-0x3ffff,0|0x1-0x3ffff|0x00001|ltOut = 0, carryOut = 1 ⇒ carryLtOut = 1|

## CLK1 GL_CHUNK = 0x3C000

#### clock = 1, carryIn = 0, ltIn = 0 (carryLtIn = 0)
valid chunk values (all) = 0x0-0x1dfff, 0x1e000-0x1ffff, 0x20000-0x3dfff, 0x3e000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|1,0,2,0x0-0x1dfff,0|0x0-0x3bffe(1)|0x3c00|carryOut = 0 ltOut  = 1 ⇒ carryLtOut = 2 |
|1,0,0,0x1e000-0x1ffff,0|0x3c000-0x3fffe|0x3c00|carryOut = 0 ltOut = 0 ⇒ carryLtOut = 0|
|1,0,3,0x20000-0x3dfff,0|0x0-0x3bffe|0x3c00|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|
|1,0,1,0x3e000-0x3ffff,0|0x3c000-0x3fffe|0x3c00|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 1|

(1) 0x3bfff not included because after shift LSB is zero

#### clock = 1, carryIn = 1, ltIn = 0 (carryLtIn = 1)
valid chunk values (all) = 0x0-0x1dfff, 0x1e000-0x1ffff, 0x20000-0x3dfff, 0x3e000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|1,1,2,0x0-0x1dfff,0|0x1-0x3bfff|0x3c000|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|1,1,0,0x1e000-0x1ffff,0|0x3c001-0x3ffff|0x3c000|carryOut = 0 ltOut = 0 ⇒ carryLtOut = 0|
|1,1,3,0x20000-0x3dfff,0|0x1-0x3dfff|0x3c000|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|
|1,1,1,0x3e000-0x3ffff,0|0x3c001-0x3ffff|0x3c000|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 2|

#### clock = 1, carryIn = 0, ltIn = 1 (carryLtIn = 2)
valid chunk values (all) = 0x0-0x1e000, 0x1e001-0x1ffff, 0x20000-0x3e000, 0x3e001-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|1,2,2,0x0,0|0x0|0x3c000|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2 (1)|
|1,2,2,0x0-0x1e000,0|0x0-0x3c000|0x3c000|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|1,2,0,0x1e001-0x1ffff,0|0x3c002-3fffe|0x3c000|carryOut = 0 ltOut = 0 ⇒ carryLtOut = 0|
|1,2,3,0x20000-0x3e000,0|0x0-3c000|0x3c000|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|
|1,2,1,0x3e001-0x3ffff,0|0x3c002-0x3fffe|0x3c000|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 1|

(1) specific case at begining of table for empty rows

#### clock = 1, carryIn = 1, ltIn = 1 (carryLtIn = 3)
valid chunk values (all) = 0x0-0x1dfff, 0x1e000-0x1ffff, 0x20000-0x3dfff, 0x3e000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|1,3,2,0x0-0x1dfff,0|0x1-0x3bfff|0x3c000|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|1,3,0,0x1e000-0x1ffff,0|0x3c001-0x3ffff|0x3c000|carryOut = 0 ltOut = 0 ⇒ carryLtOut = 0|
|1,3,3,0x20000-0x3dfff,0|0x1-0x3bfff|0x3c000|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|
|1,3,1,0x3e000-0x3ffff,0|0x3c001-0x3ffff|0x3c000|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 1|

## CLK2 GL_CHUNK = 0x3FFFF

#### clock = 2, carryIn = 0, ltIn = 0 (carryLtIn = 0)
valid chunk values (all) = 0x0-0x1ffff, 0x20000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|2,0,2,0x0-0x1ffff,0|0x0-0x3fffe|0x3ffff|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|2,0,3,0x20000-0x3ffff,0|0x0-0x3fffe|0x3ffff|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|

#### clock = 2, carryIn = 1, ltIn = 0 (carryLtIn = 1) 
valid chunk values (all) = 0x0-0x1fffe, 0x1ffff, 0x20000-0x3fffe, 0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|2,1,2,0x0-0x1fffe,0|0x1-0x3fffd|0x3ffff|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|2,1,0,0x1ffff,0|0x3ffff|0x3ffff|carryOut = 0 ltOut = 0 ⇒ carryLtOut = 0|
|2,1,3,0x20000-0x3fffe,0|0x1-0x3fffd|0x3ffff|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|
|2,1,1,0x3ffff,0|0x3ffff|0x3ffff|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 1|

#### clock = 2, carryIn = 0, ltIn = 1 (carryLtIn = 2)
valid chunk values (all) = 0x0-0x1ffff, 0x20000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|2,2,2,0x0|0x0|0x3ffff|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|2,2,2,0x0-0x1ffff,0|0x0-0x3fffe|0x3ffff|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|2,2,3,0x20000-0x3ffff,0|0x0-0x3fffe|0x3ffff|carryOut = 1 ltOut = 1 ⇒ carryLtOut = 3|

#### clock = 2, carryIn = 1, ltIn = 1 (carryLtIn = 3)
valid chunk values (all) = 0x0-0x1ffff, 0x20000-0x3ffff

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|2,3,2,0x0-0x1ffff,0|0x0-0x3ffff|0x3ffff|carryOut = 0 ltOut = 1 ⇒ carryLtOut = 2|
|2,3,3,0x20000-0x3ffff,0|0x1-0x3ffff|0x3ffff|carryOut = 1 ltOut = 0 ⇒ carryLtOut = 3|

## CLK3 GL_CHUNK = 0x3FF
In this clock all carryOut = 0 and ltOut = 1 otherwise key is greater o equal goldilocks, and it means invalid key (not include in lockup table)

#### clock = 3 carryIn = 0, ltIn = 0 (carryLtIn = 0)  
valid chunk values (all) = 0x0-0x1ff  
0x1ff * 2 + 0 = 0x3fe < 0x3ff ⇒ OK !!

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|7,0,0,0x0-0x1ff,[0,4..+..252]|0x0-0x3fe|0x3ff|level % 4 == 0 ⇒ selKey0 = 1|
|11,0,0,0x0-0x1ff,[1,5..+..253]|0x0-0x3fe|0x3ff|level % 4 == 1 ⇒ selKey1 = 1|
|19,0,0,0x0-0x1ff,[2,6..+..254]|0x0-0x3fe|0x3ff|level % 4 == 2 ⇒ selKey2 = 1|
|35,0,0,0x0-0x1ff,[3,7..+..255]|0x0-0x3fe|0x3ff|level % 4 == 3 ⇒ selKey3 = 1|

#### clock = 3 carryIn = 1, ltIn = 0 (carryLtIn = 1)
valid chunk values (all) = 0x0-0x1fe  
0x1fe * 2 + 1 = 0x3fd < 0x3ff ⇒ OK !!  
0x1ff * 2 + 1 = 0x3ff == 0x3ff && ltIn = 0 ⇒ FAILS !!

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|7,1,0,0x0-0x1fe,[0,4..+..252]|0x1-0x3fd|0x3ff|level % 4 = 0 ⇒ selKey0 = 1|
|11,1,0,0x0-0x1fe,[1,5..+..253]|0x1-0x3fd|0x3ff|level % 4 = 1 ⇒ selKey1 = 1|
|19,1,0,0x0-0x1fe,[2,6..+..254]|0x1-0x3fd|0x3ff|level % 4 = 2 ⇒ selKey2 = 1|
|35,1,0,0x0-0x1fe,[3,7..+..255]|0x1-0x3fd|0x3ff|level % 4 = 3 ⇒ selKey3 = 1|

#### clock = 3 carryIn = 0, ltIn = 1 (carryLtIn = 2)
valid chunk values (all) = 0x0-0x1ff  
0x1ff * 2 + 0 = 0x3fe < 0x3ff ⇒ OK !!  

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|7,2,0,0x0-0x0,0|0x0-0x3fe|0x3ff|level = 0 ⇒ selKey0 = 1|
|7,2,0,0x0-0x1ff,[0,4..+..252]|0x0-0x3fe|0x3ff|level % 4 = 0 ⇒ selKey0 = 1|
|11,2,0,0x0-0x1ff,[1,5..+..253]|0x0-0x3fe|0x3ff|level % 4 = 1 ⇒ selKey1 = 1|
|19,2,0,0x0-0x1ff,[2,6..+..254]|0x0-0x3fe|0x3ff|level % 4 = 2 ⇒ selKey2 = 1|
|35,2,0,0x0-0x1ff,[3,7..+..255]|0x0-0x3fe|0x3ff|level % 4 = 3 ⇒ selKey3 = 1|


#### clock = 3 carryIn = 1, ltIn = 1 (carryLtIn = 3)
valid chunk values (all) = 0x0-0x1ff  
0x1fe * 2 + 1 = 0x3fd < 0x3ff ⇒ OK !!  
0x1ff * 2 + 1 = 0x3ff == 0x3ff && ltIn = 1 ⇒ OK !!

|cols(*) |climb|glc|notes|
|------|-------|---|----|
|7,3,0,0x0-0x1ff,[0,4..+..252]|0x1-0x3ff|0x3ff|level % 4 = 0 => selKey0 = 1|
|11,3,0,0x0-0x1ff,[1,5..+..253]|0x1-0x3ff|0x3ff|level % 4 = 1 => selKey1 = 1|
|19,3,0,0x0-0x1ff,[2,6..+..254]|0x1-0x3ff|0x3ff|level % 4 = 2 => selKey2 = 1|
|35,3,0,0x0-0x1ff,[3,7..+..255]|0x1-0x3ff|0x3ff|level % 4 = 3 => selKey3 = 1|