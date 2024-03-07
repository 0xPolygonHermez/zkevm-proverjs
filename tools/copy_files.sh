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

srcs_batch=("zkevm" "compressor_batch" "recursive1_batch" "recursive2_batch" "recursivef_batch")
dsts_batch=("zkevm" "c12a" "recursive1" "recursive2" "recursivef")

srcs_eip4844=("zkevm" "compressor_batch" "recursive1_batch" "recursive2_batch" "recursivef_batch" "blob_inner" "compressor_blob" "recursive1_blob" "batch_blob" "recursive2_blob" "recursivef_blob")
dsts_eip4844=("zkevm" "c12a" "recursive1" "recursive2" "recursivef" "blob" "compressorBlob" "recursive1Blob" "batchBlob" "recursive2Blob" "recursivefBlob")

if [ "$EIP4844" -eq 1 ]; then
    srcs=("${srcs_eip4844[@]}")
    dsts=("${dsts_eip4844[@]}")
else
    srcs=("${srcs_batch[@]}")
    dsts=("${dsts_batch[@]}")
fi

if [ ${#srcs[@]} -ne ${#dsts[@]} ]; then
    echo "Assertion failed: Arrays 'srcs' and 'dsts' have different lengths."
    exit 1
fi

BUILDDST=$DST/build
if [ $CP_BUILDS -eq 1 ]; then
    # builds
    makedir $BUILDDST

    cpfile package.json $BUILDDST
    cpfile package-lock.json $BUILDDST

    DEPENDENCIES=$BDIR/dependencies.txt
    cpfile $DEPENDENCIES $BUILDDST
    cpdir  $BDIR/steps $BUILDDST
    cpfile $BDIR/steps.log $FULLDST
fi

for ((i = 0; i < ${#srcs[@]}; i++)); do
    if [ "$CP_DEFAULT" -eq 0 ]; then
        continue  # Skip the rest of the loop iteration
    fi
    src="${srcs[i]}"
    dst="${dsts[i]}"
    FULLDST=$DST/config/$dst
    [ ! -d $FULLDST ] && mkdir -p $FULLDST
    cpfile $BDIR/$src.const                                                  $FULLDST/$dst.const
    cpfile $BDIR/$src.consttree                                              $FULLDST/$dst.consttree
    cpfile $BDIR/$src.starkinfo.json                                         $FULLDST/$dst.starkinfo.json
    cpfile $BDIR/$src.verkey.json        		                             $FULLDST/$dst.verkey.json
    cpfile $BDIR/$src.chelpers.bin                                           $FULLDST/$dst.chelpers.bin
    if [[ "$dst" != "zkevm" && "$dst" != "blob" ]]; then
        cpfile $BDIR/$src.exec        		                                 $FULLDST/$dst.exec
    fi

    if [[ "$dst" != "c12a" && "$dst" != "compressorBlob" ]]; then
        if [[ "$dst" == "zkevm" || "$dst" == "blob" ]]; then
            cpfile $BDIR/$src.verifier_cpp/$src.verifier.dat                 $FULLDST/$dst.verifier.dat
        else
            cpfile $BDIR/${src}_cpp/$src.dat                                 $FULLDST/$dst.verifier.dat
        fi
    fi

    if [ $ONLY_CONFIG -eq 0 ]; then
        [ ! -d $DST/c_files/$dst ] && mkdir -p $DST/c_files/$dst
        if [[ "$dst" == "zkevm" || "$dst" == "blob" ]]; then
            cpdir $BDIR/$src/pil                                             $DST/pil/$dst
            cpfile $BDIR/$src.verifier_cpp/$src.verifier.cpp                 $DST/c_files/$dst/$dst.verifier.cpp
        else
            cpfile $BDIR/pil/$src                                            $DST/pil
            if [[ "$dst" != "c12a" && "$dst" != "compressorBlob" ]]; then
                cpfile $BDIR/${src}_cpp/$src.cpp                             $DST/c_files/$dst/$dst.cpp
            fi
        fi
          
        chelpersFileSrc=$(echo "$src" | sed 's/_\([a-z]\)/\U\1/g; s/^./\U&/')"Steps"
        chelpersFileDst=$(echo "$dst" | sed 's/_\([a-z]\)/\U\1/g; s/^./\U&/')"Steps"
        cpfile $BDIR/$src.chelpers/$chelpersFileSrc.hpp                      $DST/c_files/$dst/$chelpersFileDst.hpp
    fi

    if [ $CP_BUILDS -eq 1 ]; then
        if [[ "$dst" == "zkevm" || "$dst" == "blob" ]]; then
            cpfile $BDIR/$src.verifier.r1cs                                  $BUILDDST/$dst.verifier.r1cs
            cpfile $BDIR/$src.verifier.sym                                   $BUILDDST/$dst.verifier.sym
        else
            cpfile $BDIR/$src.r1cs                                           $BUILDDST/$dst.r1cs
            cpfile $BDIR/$src.sym                                            $BUILDDST/$dst.sym
        fi
    fi
done

if [ $CP_FINAL -eq 1 ]; then
    # final
    FULLDST=$DST/config/final
    makedir $FULLDST
    if [ $FINAL_PHASE_2 -eq 1 ]; then
        cpfile $BDIR/final.fflonk.zkey         $FULLDST
        cpfile $BDIR/final.fflonk.verkey.json  $FULLDST
        if [ $CP_BUILDS -eq 1 ]; then
            cpfile $BDIR/final.fflonk.verifier.sol $BUILDDST
        fi
    fi
    if [ $FINAL_PHASE_1 -eq 1 ]; then
        cpfile $BDIR/final_cpp/final.dat       $FULLDST/final.verifier.dat
        if [ $ONLY_CONFIG -eq 0 ]; then
            [ ! -d $DST/c_files/final ] && mkdir -p $DST/c_files/final
            cpfile $BDIR/final_cpp/final.cpp   $DST/c_files/final/final.cpp
        fi
    fi

    if [ $CP_BUILDS -eq 1 ]; then
        cpfile $BDIR/final.r1cs $BUILDDST
        cpfile $BDIR/final.sym $BUILDDST
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

        if [ $CP_BUILDS -eq 1 ]; then
            cpfile $HASHFILE $BUILDDST
        fi
    fi
fi
