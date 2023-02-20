#!/bin/bash

usage()
{
    echo "copy_files <build-dir> <destination>"
    exit 1
}

cpfile()
{
    if [ $WAIT -eq 1 ]; then
        lsof $1 >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -n "waiting file $1 ..."
            while true; do lsof $1 >/dev/null 2>&1; [ $? -ne 0 ] && break; echo -n "."; sleep 30; done
            echo " (ready)"
        fi
    fi
    cp -v $1 $2
}

cpdir()
{
    if [ $WAIT -eq 1 ]; then
        PF=`find $1 -mmin -1 | wc -l 2>/dev/null`
        if [ $PF -gt 0 ]; then
            echo -n "waiting directory $1 ..."
            while true; do PF=`find $1 -mmin -1 | wc -l 2>/dev/null`; [ $PF -eq 0 ] && break; echo -n "."; sleep 30; done
            echo " (ready)"
        fi
    fi
    cp -rv $1 $2
}

WAIT=0

while [ $# -gt 0 ]; do
    if [ ${1:0:1} = '-' ]; then
        case $1 in
            -w)
                WAIT=1
                ;;
            *)
                echo "Unknow option $1"
                usage
                ;;
        esac
    else
        if [ -z $BDIR ]; then
            BDIR=$1
        elif [ -z $DST ]; then
            DST=$1
        else
            echo "Unknown option $1"
            usage
        fi
    fi
    shift
done

[ -z $BDIR ] && usage
[ -z $DST ] && usage

# VERSION=v0.7.0.0-rc.3
# BDIR=build/$VERSION
BASEDIR=.
# DST=/mnt/ofs/zkproverc/$VERSION

CPFLAGS=-v
[ ! -d $DST/c_files ] && mkdir -p $DST/c_files
[ ! -d $DST/pil ] && mkdir -p $DST/pil

CP_SCRIPTS=1
CP_ZKEVM=1
CP_C12A=1
CP_RECURSIVE1=1
CP_RECURSIVE2=1
CP_RECURSIVEF=1
CP_FINAL=1
CP_CIRCOM=1

CP="cp $CPFLAGS"

if [ $CP_SCRIPTS -eq 1 ]; then
# scripts
FULLDST=$DST/config/scripts
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/rom.json                                      $FULLDST
cpfile $BDIR/metadata-rom.txt                              $FULLDST
cpfile $BASEDIR/testvectors/storage_sm_rom.json            $FULLDST/storage_sm_rom.json
cpfile $BASEDIR/src/sm/sm_keccakf/keccak_script.json       $FULLDST/keccak_script.json
cpfile $BASEDIR/src/sm/sm_keccakf/keccak_connections.json  $FULLDST/keccak_connections.json
fi

if [ $CP_ZKEVM -eq 1 ]; then
# zkevm
FULLDST=$DST/config/zkevm
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/zkevm.const                                   $FULLDST
cpfile $BDIR/zkevm.verifier_cpp/zkevm.verifier.dat         $FULLDST/zkevm.verifier.dat
cpfile $BDIR/zkevm.consttree                               $FULLDST
cpfile $BDIR/zkevm.starkinfo.json                          $FULLDST
cpfile $BDIR/zkevm.verkey.json        		                $FULLDST
cpdir $BDIR/pols_generated                             $DST/c_files
cpdir $BDIR/zkevm.verifier_cpp                         $DST/c_files
cpdir $BDIR/zkevm.chelpers                             $DST/c_files
cpdir $BDIR/pil/zkevm                                  $DST/pil/
fi

if [ $CP_C12A -eq 1 ]; then
# c12a
FULLDST=$DST/config/c12a
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/c12a.const                    $FULLDST
cpfile $BDIR/c12a.exec                     $FULLDST
cpfile $BDIR/c12a.consttree                $FULLDST
cpfile $BDIR/c12a.verkey.json              $FULLDST
cpfile $BDIR/c12a.starkinfo.json           $FULLDST
cpfile $BDIR/c12a.pil                      $DST/pil
cpdir $BDIR/c12a.chelpers              $DST/c_files
fi

if [ $CP_RECURSIVE1 -eq 1 ]; then
# recursive1
FULLDST=$DST/config/recursive1
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/recursive1.const              $FULLDST
cpfile $BDIR/recursive1_cpp/recursive1.dat $FULLDST/recursive1.verifier.dat
cpfile $BDIR/recursive1.consttree          $FULLDST
cpfile $BDIR/recursive1.exec               $FULLDST
cpfile $BDIR/recursive.starkstruct.json    $FULLDST/recursive1.starkstruct.json
cpfile $BDIR/recursive1.starkinfo.json     $FULLDST
cpfile $BDIR/recursive1.verkey.json        $FULLDST
cpfile $BDIR/recursive1.pil                $DST/pil
cpdir $BDIR/recursive1_cpp             $DST/c_files
cpdir $BDIR/recursive1.chelpers        $DST/c_files
fi

if [ $CP_RECURSIVE2 -eq 1 ]; then
# recursive 2
FULLDST=$DST/config/recursive2
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/recursive2.starkinfo.json     $FULLDST
cpfile $BDIR/recursive.starkstruct.json    $FULLDST/recursive2.starkstruct.json
cpfile $BDIR/recursive2.exec               $FULLDST
cpfile $BDIR/recursive2_cpp/recursive2.dat $FULLDST/recursive2.verifier.dat
cpfile $BDIR/recursive2.verkey.json        $FULLDST
cpfile $BDIR/recursive2.consttree          $FULLDST
cpfile $BDIR/recursive2.const              $FULLDST
cpfile $BDIR/recursive2.pil                $DST/pil
cpdir $BDIR/recursive2_cpp             $DST/c_files
cpdir $BDIR/recursive2.chelpers        $DST/c_files
fi

if [ $CP_RECURSIVEF -eq 1 ]; then
# recursive f
FULLDST=$DST/config/recursivef
[ ! -d $FULLDST ] && mkdir -p $FULLDST
cpfile $BDIR/recursivef.verkey.json        $FULLDST
cpfile $BDIR/recursivef.consttree          $FULLDST
cpfile $BDIR/recursivef.starkinfo.json     $FULLDST
cpfile $BDIR/recursivef.exec               $FULLDST
cpfile $BDIR/recursivef.const              $FULLDST
cpfile $BDIR/recursivef_cpp/recursivef.dat $FULLDST/recursivef.verifier.dat
cpfile $BDIR/recursivef.pil                $DST/pil
cpdir $BDIR/recursivef_cpp             $DST/c_files
cpdir $BDIR/recursivef.chelpers        $DST/c_files
fi

if [ $CP_FINAL -eq 1 ]; then
# final
FULLDST=$DST/config/final
[ ! -d $FULLDST ] && mkdir -p           $FULLDST
cpfile $BDIR/final.g16.0001.zkey           $FULLDST
cpfile $BDIR/final_cpp/final.dat           $FULLDST/final.verifier.dat
cpfile $BDIR/final.g16.verkey.json         $FULLDST
cpdir $BDIR/final_cpp                  $DST/c_files
fi

if [ $CP_CIRCOM -eq 1 ]; then
# circom
FULLDST=$DST/circom
[ ! -d $FULLDST ] && mkdir -p $FULLDST
for F in $BDIR/*.circom; do
    cpfile $F $FULLDST
done
fi

if [ $CP_BUILDS -eq 1 ]; then
# builds
FULLDST=$DST/build
[ ! -d $FULLDST ] && mkdir -p $FULLDST

cpfile package.json $FULLDST

NPMFILE=$BDIR/npm.txt
[ ! -f $NPMFILE ] && npm ls > $NPMFILE
cpfile $NPMFILE $FULLDST

BUILDS="sha256.txt steps.log c12a.starkstruct.json final.g16.0000.zkey final.g16.verifier.sol final.r1cs final.sym recursive.starkstruct.json recursive1.r1cs recursive1.sym recursive2.r1cs recursive2.sym recursivef.r1cs recursivef.starkstruct.json recursivef.sym zkevm.starkstruct.json zkevm.verifier.r1cs zkevm.verifier.sym"
for F in $BUILDS; do
    cpfile $BDIR/$F $FULLDST
done
fi