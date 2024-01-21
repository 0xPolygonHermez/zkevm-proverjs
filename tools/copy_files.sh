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
    cp -$CP_FLAGS $1 $2
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
    cp -r$CP_FLAGS $1 $2
}

CP_FLAGS=v
WAIT=0
FINAL_PHASE_1=1
FINAL_PHASE_2=1
ONLY_HASH=0
ONLY_CONFIG=0

while [ $# -gt 0 ]; do
    if [ ${1:0:1} = '-' ]; then
        case $1 in
            --final1)
                FINAL_PHASE_1=1
                FINAL_PHASE_2=0
                ;;
            --final2)
                FINAL_PHASE_1=0
                FINAL_PHASE_2=1
                ;;
            --link)
                CP_FLAGS="vl"
                ;;
            --hash)
                ONLY_HASH=1
                ;;
            --config)
                ONLY_CONFIG=1
                ;;
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

BASEDIR=.
if [ $ONLY_HASH -eq 0 ]; then
    [ -z $DST ] && usage
    [ ! -d $DST/c_files ] && mkdir -p $DST/c_files
    [ ! -d $DST/pil ] && mkdir -p $DST/pil
    echo "`date +'%Y%m%d_%H%M%S'` DST=$DST FINAL_PHASE_1=$FINAL_PHASE_1 FINAL_PHASE_2=$FINAL_PHASE_2" >> $BDIR/copy.log
fi

if [ $FINAL_PHASE_1 -eq 0 -o $ONLY_HASH -eq 1 ]; then
    CP_DEFAULT=0
else
    CP_DEFAULT=1
fi
CP_SCRIPTS=$CP_DEFAULT
CP_ZKEVM=$CP_DEFAULT
CP_C12A=$CP_DEFAULT
CP_RECURSIVE1=$CP_DEFAULT
CP_RECURSIVE2=$CP_DEFAULT
CP_RECURSIVEF=$CP_DEFAULT
CP_FINAL=1
CP_CIRCOM=$CP_DEFAULT
CP_BUILDS=1
GENERATE_HASH=1

if [ $ONLY_HASH -eq 1 ]; then
    CP_FINAL=0
    CP_BUILDS=0
fi
if [ $ONLY_HASH -eq 1 ]; then
    CP_FINAL=0
    CP_BUILDS=0
fi

if [ $CP_SCRIPTS -eq 1 ]; then
    # scripts
    FULLDST=$DST/config/scripts
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/rom.json                                      $FULLDST
    cpfile $BDIR/metadata-rom.txt                              $FULLDST
    cpfile $BDIR/storage_sm_rom.json                           $FULLDST
    cpfile $BASEDIR/src/sm/sm_keccakf/keccak_script.json       $FULLDST/keccak_script.json
    cpfile $BASEDIR/src/sm/sm_keccakf/keccak_connections.json  $FULLDST/keccak_connections.json
    cpfile $BASEDIR/src/sm/sm_sha256f/sha256_script.json       $FULLDST/sha256_script.json
    cpfile $BASEDIR/src/sm/sm_sha256f/sha256_gates.json        $FULLDST/sha256_gates.json
fi

if [ $CP_ZKEVM -eq 1 ]; then
    # zkevm
    FULLDST=$DST/config/zkevm
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/zkevm.const                                   $FULLDST
    cpfile $BDIR/zkevm.verifier_cpp/zkevm.verifier.dat         $FULLDST/zkevm.verifier.dat
    cpfile $BDIR/zkevm.consttree                               $FULLDST
    cpfile $BDIR/zkevm.starkinfo.json                          $FULLDST
    cpfile $BDIR/zkevm.verkey.json        		               $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpdir $BDIR/zkevm.verifier_cpp                         $DST/c_files
        cpdir $BDIR/zkevm.chelpers                             $DST/c_files
        cpdir $BDIR/pil/zkevm                                  $DST/pil/
    fi
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
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/c12a.pil                      $DST/pil
        cpdir $BDIR/c12a.chelpers              $DST/c_files
    fi
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
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive1.pil            $DST/pil
        cpdir $BDIR/recursive1_cpp             $DST/c_files
        cpdir $BDIR/recursive1.chelpers        $DST/c_files
    fi
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
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive2.pil            $DST/pil
        cpdir $BDIR/recursive2_cpp             $DST/c_files
        cpdir $BDIR/recursive2.chelpers        $DST/c_files
    fi
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
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursivef.pil            $DST/pil
        cpdir $BDIR/recursivef_cpp             $DST/c_files
        cpdir $BDIR/recursivef.chelpers        $DST/c_files
    fi
fi

if [ $CP_FINAL -eq 1 ]; then
    # final
    FULLDST=$DST/config/final
    [ ! -d $FULLDST ] && mkdir -p          $FULLDST
    if [ $FINAL_PHASE_2 -eq 1 ]; then
        cpfile $BDIR/final.fflonk.zkey         $FULLDST
        cpfile $BDIR/final.fflonk.verkey.json  $FULLDST
    fi
    if [ $FINAL_PHASE_1 -eq 1 ]; then
        cpfile $BDIR/final_cpp/final.dat       $FULLDST/final.verifier.dat
        if [ $ONLY_CONFIG -eq 0 ]; then
            cpdir $BDIR/final_cpp                  $DST/c_files
        fi
    fi
fi

if [ $ONLY_CONFIG -eq 0 ]; then
    if [ $CP_CIRCOM -eq 1 ]; then
        # circom
        FULLDST=$DST/circom
        [ ! -d $FULLDST ] && mkdir -p $FULLDST
        for F in $BDIR/*.circom; do
            cpfile $F $FULLDST
        done
    fi

    if [ $GENERATE_HASH -eq 1 ]; then
        FIND_EXTRA_ARG=""
        HASHFILE=$BDIR/sha256.txt
        TMPHASHFILE=$HASHFILE".tmp"
        if [ -f $HASHFILE -a $FINAL_PHASE_1 -eq 0 -a $FINAL_PHASE_2 -eq 1 ]; then
            echo "calculating sha256 of newer files ...."
            FIND_EXTRA_ARG=" -newer steps/fflonk_setup"
            cp $HASHFILE $TMPHASHFILE
            mv $HASHFILE $HASHFILE"."`date +'%Y%m%d_%H%M%S'`
        else 
            [ -f $TMPHASHFILE ] && rm -f $TMPHASHFILE
        fi
        if [ ! -f $HASHFILE ]; then
            echo "calculating sha256 ...."
            for F in `LC_ALL=C; cd $BDIR; find * -type f ! -name "steps.log" !  -path "steps*" ! -name "sha256.txt*" ! -name "last_step.txt"$FIND_EXTRA_ARG|sort`; do
                echo " sha256($F) ...."
                (cd $BDIR; sha256sum $F) >> $TMPHASHFILE
            done
            mv $TMPHASHFILE $HASHFILE
        fi
    fi

    if [ $CP_BUILDS -eq 1 ]; then
        # builds
        FULLDST=$DST/build
        [ ! -d $FULLDST ] && mkdir -p $FULLDST

        cpfile package.json $FULLDST
        cpfile package-lock.json $FULLDST

        DEPENDENCIES=$BDIR/dependencies.txt
        cpfile $DEPENDENCIES $FULLDST
        cpdir  $BDIR/steps $FULLDST

        BUILDS=""
        if [ -f $HASHFILE ]; then
            BUILDS=`basename $HASHFILE`" "
        fi
        cpfile $BDIR/steps.log $FULLDST
        if [ $FINAL_PHASE_2 -eq 1 ]; then
            cpfile $BDIR/final.fflonk.verifier.sol $FULLDST
        fi
        if [ $FINAL_PHASE_1 -eq 1 ]; then
            BUILDS="c12a.starkstruct.json final.r1cs final.sym recursive.starkstruct.json recursive1.r1cs recursive1.sym recursive2.r1cs recursive2.sym recursivef.r1cs recursivef.starkstruct.json recursivef.sym zkevm.starkstruct.json zkevm.verifier.r1cs zkevm.verifier.sym"
            for F in $BUILDS; do
                cpfile $BDIR/$F $FULLDST
            done
        fi
    fi
fi