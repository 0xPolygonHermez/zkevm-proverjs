#!/bin/sh

BDIR=build/v0.5.1.0-evals2-20221212
BASEDIR=.
DST=/mnt/ofs/zkproverc/v0.5.1.0-evals2-20221212
# DST=build/postmerge.config2
# CPFLAGS=-lv
CPFLAGS=-v
FOLDERS="c12a final recursive1 recursive2 recursivef scripts zkevm"

for FOLDER in $FOLDERS; do [ ! -d $DST/config/$FOLDER ] && mkdir -p  $DST/config/$FOLDER; done

CP_SCRIPTS=1
CP_ZKEVM=1
CP_C12A=1
CP_RECURSIVE1=1
CP_RECURSIVE2=1
CP_RECURSIVEF=1
CP_FINAL=1
CP_CIRCOM=1
CP_SOURCES=1
CP_PIL=1

CP="cp $CPFLAGS"

if [ $CP_SCRIPTS -eq 1 ]; then
# scripts
FULLDST=$DST/config/scripts
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/rom.json                                      $FULLDST
$CP $BASEDIR/testvectors/storage_sm_rom.json            $FULLDST/storage_sm_rom.json
$CP $BASEDIR/src/sm/sm_keccakf/keccak_script.json       $FULLDST/keccak_script.json
$CP $BASEDIR/src/sm/sm_keccakf/keccak_connections.json  $FULLDST/keccak_connections.json
fi

if [ $CP_ZKEVM -eq 1 ]; then
# zkevm
FULLDST=$DST/config/zkevm
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/zkevm.const                           $FULLDST
$CP $BDIR/zkevm.verifier_cpp/zkevm.verifier.dat $FULLDST/zkevm.verifier.dat
$CP $BDIR/zkevm.consttree                       $FULLDST
$CP $BDIR/zkevm.starkinfo.json                  $FULLDST
$CP $BDIR/zkevm.verkey.json        		$FULLDST
fi

if [ $CP_C12A -eq 1 ]; then
# c12a
FULLDST=$DST/config/c12a
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/c12a.const                    $FULLDST
$CP $BDIR/c12a.exec                     $FULLDST
$CP $BDIR/c12a.consttree                $FULLDST
$CP $BDIR/c12a.verkey.json              $FULLDST
$CP $BDIR/c12a.starkinfo.json           $FULLDST
fi

if [ $CP_RECURSIVE1 -eq 1 ]; then
# recursive1
FULLDST=$DST/config/recursive1
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/recursive1.const              $FULLDST
$CP $BDIR/recursive1_cpp/recursive1.dat $FULLDST/recursive1.verifier.dat
$CP $BDIR/recursive1.consttree          $FULLDST
$CP $BDIR/recursive1.exec               $FULLDST
$CP $BDIR/recursive.starkstruct.json    $FULLDST/recursive1.starkstruct.json
$CP $BDIR/recursive1.starkinfo.json     $FULLDST
$CP $BDIR/recursive1.verkey.json        $FULLDST
$CP $BDIR/recursive1.pil                $FULLDST
fi

if [ $CP_RECURSIVE2 -eq 1 ]; then
# recursive 2
FULLDST=$DST/config/recursive2
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/recursive2.starkinfo.json     $FULLDST
$CP $BDIR/recursive.starkstruct.json    $FULLDST/recursive2.starkstruct.json
$CP $BDIR/recursive2.pil                $FULLDST
$CP $BDIR/recursive2.exec               $FULLDST
$CP $BDIR/recursive2_cpp/recursive2.dat $FULLDST/recursive2.verifier.dat
$CP $BDIR/recursive2.verkey.json        $FULLDST
$CP $BDIR/recursive2.consttree          $FULLDST
$CP $BDIR/recursive2.const              $FULLDST
fi

if [ $CP_RECURSIVEF -eq 1 ]; then
# recursive f
FULLDST=$DST/config/recursivef
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/recursivef.consttree          $FULLDST
$CP $BDIR/recursivef.starkinfo.json     $FULLDST
$CP $BDIR/recursivef.exec               $FULLDST
$CP $BDIR/recursivef.const              $FULLDST
$CP $BDIR/recursivef_cpp/recursivef.dat $FULLDST/recursivef.verifier.dat
fi

if [ $CP_FINAL -eq 1 ]; then
# final
FULLDST=$DST/config/final
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/final.g16.0001.zkey $FULLDST
$CP $BDIR/final_cpp/final.dat $FULLDST/final.verifier.dat
$CP $BDIR/final.g16.verkey.json $FULLDST
fi

if [ $CP_SOURCES -eq 1 ]; then
# sources
FULLDST=$DST/c_files
[ ! -d $FULLDST ] && mkdir -p $FULLDST
SOURCE_FOLDERS="pols_generated zkevm.verifier_cpp zkevm.chelpers c12a.chelpers recursive1_cpp recursive1.chelpers recursive2_cpp recursive2.chelpers recursivef_cpp recursivef.chelpers final_cpp"
for SOURCE_FOLDER in $SOURCE_FOLDERS; do
$CP -r $BDIR/$SOURCE_FOLDER $FULLDST; done
fi

if [ $CP_CIRCOM -eq 1 ]; then
# circom
FULLDST=$DST/circom
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/*.circom $FULLDST
fi

if [ $CP_PIL -eq 1 ]; then
# pils
FULLDST=$DST/pil
[ ! -d $FULLDST ] && mkdir -p $FULLDST
$CP $BDIR/*.pil $FULLDST
fi
