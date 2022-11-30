#!/bin/sh

BDIR=/mnt/data/zkronos73/build/v0.5.0.0-rc.3
BASEDIR=.
DST=/mnt/ofs/zkproverc/v0.5.0.0-rc.3
# DST=build/postmerge.config2
# CPFLAGS=-lv
CPFLAGS=-v
FOLDERS="c12a final recursive1 recursive2 recursivef scripts zkevm"

for FOLDER in $FOLDERS; do [ ! -d $DST/config/$FOLDER ] && mkdir -p  $DST/config/$FOLDER; done

cp $CPFLAGS $BDIR/rom.json $DST/config/scripts/rom.json
cp $CPFLAGS $BASEDIR/testvectors/storage_sm_rom.json $DST/config/scripts/storage_sm_rom.json
cp $CPFLAGS $BASEDIR/src/sm/sm_keccakf/keccak_script.json $DST/config/scripts/keccak_script.json

#zkevm
cp $CPFLAGS $BDIR/zkevm.const $DST/config/zkevm/zkevm.const
cp $CPFLAGS $BDIR/zkevm.verifier_cpp/zkevm.verifier.dat $DST/config/zkevm/zkevm.verifier.dat
cp $CPFLAGS $BDIR/zkevm.consttree $DST/config/zkevm/zkevm.consttree
cp $CPFLAGS $BDIR/zkevm.starkinfo.json $DST/config/zkevm/zkevm.starkinfo.json

#c12a
cp $CPFLAGS $BDIR/zkevm.c12a.const $DST/config/c12a/c12a.const
cp $CPFLAGS $BDIR/zkevm.c12a.exec $DST/config/c12a/c12a.exec
cp $CPFLAGS $BDIR/zkevm.c12a.consttree $DST/config/c12a/c12a.consttree
cp $CPFLAGS $BDIR/zkevm.c12a.verkey.json $DST/config/c12a/c12a.verkey.json
cp $CPFLAGS $BDIR/zkevm.c12a.starkinfo.json $DST/config/c12a/c12a.starkinfo.json

#recursive1
cp $CPFLAGS $BDIR/recursive1.const $DST/config/recursive1/recursive1.const
cp $CPFLAGS $BDIR/recursive1_cpp/recursive1.dat $DST/config/recursive1/recursive1.verifier.dat
cp $CPFLAGS $BDIR/recursive1.consttree $DST/config/recursive1/recursive1.consttree
cp $CPFLAGS $BDIR/recursive1.exec $DST/config/recursive1/recursive1.exec
cp $CPFLAGS $BDIR/recursive.starkstruct.json $DST/config/recursive1/recursive1.starkstruct.json
cp $CPFLAGS $BDIR/recursive1.starkinfo.json $DST/config/recursive1/recursive1.starkinfo.json
cp $CPFLAGS $BDIR/recursive1.verkey.json $DST/config/recursive1/recursive1.verkey.json
cp $CPFLAGS $BDIR/recursive1.pil $DST/config/recursive1/recursive1.pil

# recursive 2
cp $CPFLAGS $BDIR/recursive2.starkinfo.json $DST/config/recursive2/recursive2.starkinfo.json
cp $CPFLAGS $BDIR/recursive.starkstruct.json $DST/config/recursive2/recursive2.starkstruct.json
cp $CPFLAGS $BDIR/recursive2.pil $DST/config/recursive2/recursive2.pil
cp $CPFLAGS $BDIR/recursive2.exec $DST/config/recursive2/recursive2.exec
cp $CPFLAGS $BDIR/recursive2_cpp/recursive2.dat $DST/config/recursive2/recursive2.verifier.dat
cp $CPFLAGS $BDIR/recursive2.verkey.json $DST/config/recursive2/recursive2.verkey.json
cp $CPFLAGS $BDIR/recursive2.consttree $DST/config/recursive2/recursive2.consttree
cp $CPFLAGS $BDIR/recursive2.const $DST/config/recursive2/recursive2.const
# recursive f
cp $CPFLAGS $BDIR/recursivef.consttree $DST/config/recursivef/recursivef.consttree
cp $CPFLAGS $BDIR/recursivef.starkinfo.json $DST/config/recursivef/recursivef.starkinfo.json
cp $CPFLAGS $BDIR/recursivef.exec $DST/config/recursivef/recursivef.exec
cp $CPFLAGS $BDIR/recursivef.const $DST/config/recursivef/recursivef.const
cp $CPFLAGS $BDIR/recursivef_cpp/recursivef.dat $DST/config/recursivef/recursivef.verifier.dat

# final
cp $CPFLAGS $BDIR/final.g16.0001.zkey $DST/config/final/final.g16.0001.zkey
cp $CPFLAGS $BDIR/final_cpp/final.dat $DST/config/final/final.verifier.dat
cp $CPFLAGS $BDIR/final.g16.verkey.json $DST/config/final/final.g16.verkey.json

