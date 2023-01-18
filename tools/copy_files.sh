#!/bin/sh

VERSION=v0.7.0.0-rc.1
BDIR=build/$VERSION
BASEDIR=.
DST=/mnt/ofs/zkproverc/$VERSION
CPFLAGS=-v

[ ! -d $DST/c_files ] && mkdir -p $DST/c_files

CP_SCRIPTS=1
CP_ZKEVM=1
CP_C12A=1
CP_RECURSIVE1=1
CP_RECURSIVE2=1
CP_RECURSIVEF=1
CP_FINAL=1
CP_CIRCOM=1
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
$CP $BDIR/zkevm.const                                   $FULLDST
$CP $BDIR/zkevm.verifier_cpp/zkevm.verifier.dat         $FULLDST/zkevm.verifier.dat
$CP $BDIR/zkevm.consttree                               $FULLDST
$CP $BDIR/zkevm.starkinfo.json                          $FULLDST
$CP $BDIR/zkevm.verkey.json        		                $FULLDST
$CP -r $BDIR/pols_generated                             $DST/c_files
$CP -r $BDIR/zkevm.verifier_cpp                         $DST/c_files
$CP -r $BDIR/zkevm.chelpers                             $DST/c_files
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
$CP -r $BDIR/c12a.chelpers              $DST/c_files
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
$CP -r $BDIR/recursive1_cpp             $DST/c_files
$CP -r $BDIR/recursive1.chelpers        $DST/c_files
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
$CP -r $BDIR/recursive2_cpp             $DST/c_files
$CP -r $BDIR/recursive2.chelpers        $DST/c_files
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
$CP -r $BDIR/recursivef_cpp             $DST/c_files
$CP -r $BDIR/recursivef.chelpers        $DST/c_files
fi

if [ $CP_FINAL -eq 1 ]; then
# final
FULLDST=$DST/config/final
[ ! -d $FULLDST ] && mkdir -p           $FULLDST
$CP $BDIR/final.g16.0001.zkey           $FULLDST
$CP $BDIR/final_cpp/final.dat           $FULLDST/final.verifier.dat
$CP $BDIR/final.g16.verkey.json         $FULLDST
$CP -r $BDIR/final_cpp                  $DST/c_files
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
