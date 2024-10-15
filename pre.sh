#set -x
checkMandatoryOptArg() {
    argname=$3
    [ "$2" = "true" ] && echo "ERROR: --$1 without mandatory argument. usage: --$1=<${argname:=value}>" && exit 1
}

checkAllMandatoryOptArgs() {
    checkMandatoryOptArg build $npm_config_build buildpath
    checkMandatoryOptArg pil $npm_config_pil file.pil
    checkMandatoryOptArg pilconfig $npm_config_pilconfig pilconfig.json
    checkMandatoryOptArg bctree $npm_config_bctree constanttreebuilder
    checkMandatoryOptArg nth $npm_config_nth
    checkMandatoryOptArg starkstruct $npm_config_starkstruct debug
    checkMandatoryOptArg input $npm_config_input input
    checkMandatoryOptArg from $npm_config_from step
    checkMandatoryOptArg to $npm_config_to step
    checkMandatoryOptArg step $npm_config_step step
    checkMandatoryOptArg mem $npm_config_mem mem
}

usage() {
    echo "options:"
    echo " --build=<buildpath>               folder were outputs was stored."
    echo " --pil=<file.pil>"
    echo " --pilconfig=<pilconfig.json>"
    echo " --bctree=<builder>                alternative binary to generate constanttree (ex: ../zkevm-prover/build/bctree)"
    echo " --nth=<sufix>                     suffix used on commited files and derivated (ex: _0)"
    echo " --starkstruct=debug               auto-generate starkstruct, used in non-stardard pil as basic."
    echo " --input=<input.json>              input used in execution/proof."
    echo " --from=<step>                     where start the process (ex: buildconstanttree)"
    echo " --to=<step>                       where fiuish the process (ex: pilverify)"
    echo " --step=<step>                     execute only one step of proccess (ex: exec)"
    echo " --continue                        restart process from last step wellprocessed"
}

checkAllMandatoryOptArgs

[ ! -z $npm_config_help ] && usage && exit 1

# Check if circom is installed and its version is lower or equal to 2.1.8
if command -v circom >/dev/null 2>&1; then
    CIRCOM_VERSION=$(circom --version | awk '{print $NF}')
    REQUIRED_VERSION="2.1.8"

    echo "Detected circom version: $CIRCOM_VERSION"
    # Compare version numbers
    if [ "$(printf '%s\n' "$CIRCOM_VERSION" "$REQUIRED_VERSION" | sort -V | head -n1)" = "$CIRCOM_VERSION" ]; then
        echo "Using circom version $CIRCOM_VERSION."
    else
        echo "ERROR: Using circom version $CIRCOM_VERSION, but required version is <= $REQUIRED_VERSION."
        exit 1
    fi
else
    echo "ERROR: circom is not installed."
    exit 1
fi

BDIR="${npm_config_build:=build/proof}"
mkdir -p $BDIR
# NODE="--trace-gc --trace-gc-ignore-scavenger --max-semi-space-size=1024 --max-old-space-size=524288"
if [ -z ${npm_config_mem} ]; then
	MEM=130000
	type head free tail sed >/dev/null 2>&1 && MEM=`free|head -2|tail -1|sed 's/Mem[a-zA-Z]*: *\([0-9]*\).*/\1/'`
	MEM=$((MEM * 9/10000))
	[ $MEM -gt 524288 ] && MEM=524288
else
	MEM=$((${npm_config_mem} * 1000))
fi
echo "Using ${MEM} MB"
NODE="--max-old-space-size=$MEM"
PIL_MAIN="${npm_config_pil:=pil/main.pil}"
PIL_JSON="`basename $PIL_MAIN`.json"
PIL_DIR="`dirname $PIL_MAIN`"
PIL="$PIL_MAIN`[ ! -z $npm_config_pilconfig ] && echo \" -P $npm_config_pilconfig\"`"
PILSTARK="node $NODE node_modules/pil-stark/src"
PILCOM="node $NODE node_modules/.bin/pilcom"
SNARKJS="node $NODE node_modules/snarkjs/cli.js"
BCTREE="${npm_config_bctree:=$PILSTARK/main_buildconsttree.js}"
# [ ! -z $npm_config_nth ] &&
NTH="${npm_config_nth}"
true
