#!/bin/bash
usage()
{
    echo "copy_files <build-dir> <destination>"
    exit 1
}

makedir()
{
    if [ $REMOTE -eq 1 ]; then
	HOST=`echo $1|sed 's/\([^:]*\):.*/\1/'`
	DIR=`echo $1|sed 's/[^:]*://'`
	echo "creating directory $DIR => ssh $HOST mkdir -p $DIR"
	ssh $HOST mkdir -p $DIR     
    else
	[ ! -d $1 ] && mkdir -p $1
    fi
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
    if [ ! -z $CP_FLAGS ]; then
    	$CP_CMD -$CP_FLAGS $1 $2
    else
    	$CP_CMD $1 $2
    fi
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
    $CP_CMD -r$CP_FLAGS $1 $2
}
CP_CMD=cp
CP_FLAGS=v
WAIT=0
FINAL_PHASE_1=1
FINAL_PHASE_2=1
ONLY_HASH=0
ONLY_CONFIG=0
EIP4844=0

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
                /ONLY_CONFIG=1
                ;;
	    --scp)
		REMOTE=1
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
if [ $REMOTE -eq 1 ]; then
    CP_CMD=scp
    CP_FLAGS=
fi
if [ $ONLY_HASH -eq 0 ]; then
    [ -z $DST ] && usage
    makedir $DST/c_files
    makedir $DST/pil
    echo "`date +'%Y%m%d_%H%M%S'` DST=$DST FINAL_PHASE_1=$FINAL_PHASE_1 FINAL_PHASE_2=$FINAL_PHASE_2" >> $BDIR/copy.log
fi
if [ $FINAL_PHASE_1 -eq 0 -o $ONLY_HASH -eq 1 ]; then
    CP_DEFAULT=0
else
    CP_DEFAULT=1
fi
CP_SCRIPTS=$CP_DEFAULT


CP_ZKEVM=$CP_DEFAULT
CP_COMPRESSOR_BATCH=$CP_DEFAULT
CP_RECURSIVE1_BATCH=$CP_DEFAULT
CP_RECURSIVE2_BATCH=$CP_DEFAULT

if [ $EIP4844 -eq 1 ]; then
    CP_RECURSIVEF_BATCH=0
    CP_BLOB=$CP_DEFAULT
else
    CP_RECURSIVEF_BATCH=$CP_DEFAULT
    CP_BLOB=0
fi

CP_COMPRESSOR_BLOB=$CP_BLOB
CP_RECURSIVE1_BLOB=$CP_BLOB
CP_BATCH_BLOB=$CP_BLOB
CP_RECURSIVE2_BLOB=$CP_BLOB
CP_RECURSIVEF_BLOB=$CP_BLOB

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
    makedir $FULLDST
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
    makedir $FULLDST
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

if [ $CP_COMPRESSOR_BATCH -eq 1 ]; then
    # compressor_batch
    FULLDST=$DST/config/compressor_batch
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/compressor_batch.const                    $FULLDST
    cpfile $BDIR/compressor_batch.exec                     $FULLDST
    cpfile $BDIR/compressor_batch.consttree                $FULLDST
    cpfile $BDIR/compressor_batch.verkey.json              $FULLDST
    cpfile $BDIR/compressor_batch.starkinfo.json           $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/compressor_batch.pil                      $DST/pil
        cpdir $BDIR/compressor_batch.chelpers              $DST/c_files
    fi
fi

if [ $CP_RECURSIVE1_BATCH -eq 1 ]; then
    # recursive1_batch
    FULLDST=$DST/config/recursive1_batch
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursive1_batch.const                    $FULLDST
    cpfile $BDIR/recursive1_batch_cpp/recursive1_batch.dat $FULLDST/recursive1_batch.verifier.dat
    cpfile $BDIR/recursive1_batch.consttree                $FULLDST
    cpfile $BDIR/recursive1_batch.exec                     $FULLDST
    cpfile $BDIR/recursive_batch.starkstruct.json          $FULLDST/recursive1_batch.starkstruct.json
    cpfile $BDIR/recursive1_batch.starkinfo.json           $FULLDST
    cpfile $BDIR/recursive1_batch.verkey.json              $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive1_batch.pil                  $DST/pil
        cpdir $BDIR/recursive1_batch_cpp                   $DST/c_files
        cpdir $BDIR/recursive1_batch.chelpers              $DST/c_files
    fi
fi

if [ $CP_RECURSIVE2_BATCH -eq 1 ]; then
    # recursive2_batch
    FULLDST=$DST/config/recursive2_batch
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursive2_batch.starkinfo.json           $FULLDST
    cpfile $BDIR/recursive_batch.starkstruct.json          $FULLDST/recursive2_batch.starkstruct.json
    cpfile $BDIR/recursive2_batch.exec                     $FULLDST
    cpfile $BDIR/recursive2_batch_cpp/recursive2_batch.dat $FULLDST/recursive2_batch.verifier.dat
    cpfile $BDIR/recursive2_batch.verkey.json              $FULLDST
    cpfile $BDIR/recursive2_batch.consttree                $FULLDST
    cpfile $BDIR/recursive2_batch.const                    $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive2_batch.pil                  $DST/pil
        cpdir $BDIR/recursive2_batch_cpp                   $DST/c_files
        cpdir $BDIR/recursive2_batch.chelpers              $DST/c_files
    fi
fi

if [ $CP_RECURSIVEF_BATCH -eq 1 ]; then
    # recursivef_batch
    FULLDST=$DST/config/recursivef_batch
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursivef_batch.verkey.json              $FULLDST
    cpfile $BDIR/recursivef_batch.consttree                $FULLDST
    cpfile $BDIR/recursivef_batch.starkinfo.json           $FULLDST
    cpfile $BDIR/recursivef_batch.exec                     $FULLDST
    cpfile $BDIR/recursivef_batch.const                    $FULLDST
    cpfile $BDIR/recursivef_batch_cpp/recursivef_batch.dat $FULLDST/recursivef_batch.verifier.dat
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursivef_batch.pil                  $DST/pil
        cpdir $BDIR/recursivef_batch_cpp                   $DST/c_files
        cpdir $BDIR/recursivef_batch.chelpers              $DST/c_files
    fi
fi

if [ $CP_BLOB -eq 1 ]; then
    # blob_inner
    FULLDST=$DST/config/blobInner
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/blob_inner.const                                   $FULLDST
    cpfile $BDIR/blob_inner.verifier_cpp/blob_inner.verifier.dat    $FULLDST/blob_inner.verifier.dat
    cpfile $BDIR/blob_inner.consttree                               $FULLDST
    cpfile $BDIR/blob_inner.starkinfo.json                          $FULLDST
    cpfile $BDIR/blob_inner.verkey.json        		                $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpdir $BDIR/blob_inner.verifier_cpp                         $DST/c_files
        cpdir $BDIR/blob_inner.chelpers                             $DST/c_files
        cpdir $BDIR/pil/blob_inner                                  $DST/pil/
    fi
fi

if [ $CP_COMPRESSOR_BLOB -eq 1 ]; then
    # compressor_blob
    FULLDST=$DST/config/compressor_blob
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/compressor_blob.const                    $FULLDST
    cpfile $BDIR/compressor_blob.exec                     $FULLDST
    cpfile $BDIR/compressor_blob.consttree                $FULLDST
    cpfile $BDIR/compressor_blob.verkey.json              $FULLDST
    cpfile $BDIR/compressor_blob.starkinfo.json           $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/compressor_blob.pil                  $DST/pil
        cpdir $BDIR/compressor_blob.chelpers              $DST/c_files
    fi
fi

if [ $CP_RECURSIVE1_BLOB -eq 1 ]; then
    # recursive1_blob
    FULLDST=$DST/config/recursive1_blob
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursive1_blob.const                    $FULLDST
    cpfile $BDIR/recursive1_blob_cpp/recursive1_blob.dat  $FULLDST/recursive1_blob.verifier.dat
    cpfile $BDIR/recursive1_blob.consttree                $FULLDST
    cpfile $BDIR/recursive1_blob.exec                     $FULLDST
    cpfile $BDIR/recursive_blob_inner.starkstruct.json    $FULLDST/recursive_blob_inner.starkstruct.json
    cpfile $BDIR/recursive1_blob.starkinfo.json           $FULLDST
    cpfile $BDIR/recursive1_blob.verkey.json              $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive1_blob.pil                  $DST/pil
        cpdir $BDIR/recursive1_blob_cpp                   $DST/c_files
        cpdir $BDIR/recursive1_blob.chelpers              $DST/c_files
    fi
fi

if [ $CP_BATCH_BLOB -eq 1 ]; then
    # batch_blob
    FULLDST=$DST/config/batch_blob
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/batch_blob.const                         $FULLDST
    cpfile $BDIR/batch_blob_cpp/batch_blob.dat            $FULLDST/batch_blob.verifier.dat
    cpfile $BDIR/batch_blob.consttree                     $FULLDST
    cpfile $BDIR/batch_blob.exec                          $FULLDST
    cpfile $BDIR/recursive_blob_outer.starkstruct.json    $FULLDST/recursive_blob_outer.starkstruct.json
    cpfile $BDIR/batch_blob.starkinfo.json                $FULLDST
    cpfile $BDIR/batch_blob.verkey.json                   $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/batch_blob.pil                       $DST/pil
        cpdir $BDIR/batch_blob_cpp                        $DST/c_files
        cpdir $BDIR/batch_blob.chelpers                   $DST/c_files
    fi
fi


if [ $CP_RECURSIVE2_BLOB -eq 1 ]; then
    # recursive2_blob
    FULLDST=$DST/config/recursive2_blob
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursive2_blob.starkinfo.json           $FULLDST
    cpfile $BDIR/recursive_blob_outer.starkstruct.json    $FULLDST/recursive_blob_outer.starkstruct.json
    cpfile $BDIR/recursive2_blob.exec                     $FULLDST
    cpfile $BDIR/recursive2_blob_cpp/recursive2_blob.dat  $FULLDST/recursive2_blob.verifier.dat
    cpfile $BDIR/recursive2_blob.verkey.json              $FULLDST
    cpfile $BDIR/recursive2_blob.consttree                $FULLDST
    cpfile $BDIR/recursive2_blob.const                    $FULLDST
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursive2_blob.pil                  $DST/pil
        cpdir $BDIR/recursive2_blob_cpp                   $DST/c_files
        cpdir $BDIR/recursive2_blob.chelpers              $DST/c_files
    fi
fi

if [ $CP_RECURSIVEF_BLOB -eq 1 ]; then
    # recursivef_blob
    FULLDST=$DST/config/recursivef_blob
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/recursivef_blob.verkey.json              $FULLDST
    cpfile $BDIR/recursivef_blob.consttree                $FULLDST
    cpfile $BDIR/recursivef_blob.starkinfo.json           $FULLDST
    cpfile $BDIR/recursivef_blob.exec                     $FULLDST
    cpfile $BDIR/recursivef_blob.const                    $FULLDST
    cpfile $BDIR/recursivef_blob_cpp/recursivef_blob.dat  $FULLDST/recursivef_blob.verifier.dat
    if [ $ONLY_CONFIG -eq 0 ]; then
        cpfile $BDIR/recursivef_blob.pil                  $DST/pil
        cpdir $BDIR/recursivef_blob_cpp                   $DST/c_files
        cpdir $BDIR/recursivef_blob.chelpers              $DST/c_files
    fi
fi

if [ $CP_FINAL -eq 1 ]; then
    # final
    FULLDST=$DST/config/final
    makedir $FULLDST
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
        makedir $FULLDST
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
        makedir $FULLDST

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
            BUILDS="compressor_batch.starkstruct.json final.r1cs final.sym recursive_batch.starkstruct.json recursive1_batch.r1cs recursive1_batch.sym recursive2_batch.r1cs recursive2_batch.sym recursivef_batch.r1cs recursivef_batch.starkstruct.json recursivef_batch.sym zkevm.starkstruct.json zkevm.verifier.r1cs zkevm.verifier.sym"
            for F in $BUILDS; do
                cpfile $BDIR/$F $FULLDST
            done
        fi
    fi
fi
