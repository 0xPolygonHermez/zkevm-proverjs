checkMandatoryOptArg() {
    argname=$3
    [ "$2" = "true" ] && echo "ERROR: --$1 without mandatory argument. usage: --$1=<${argname:=value}>" && exit 1
}

checkMandatoryOptArg build $npm_config_build buildpath
checkMandatoryOptArg pil $npm_config_pil file.pil
checkMandatoryOptArg pilconfig $npm_config_pilconfig pilconfig.json
checkMandatoryOptArg nth $npm_config_nth

BDIR="${npm_config_build:=build/proof}"
mkdir -p $BDIR
# NODE="--trace-gc --trace-gc-ignore-scavenger --max-semi-space-size=1024 --max-old-space-size=524288"
MEM=130000
type head free tail sed >/dev/null 2>&1 && MEM=`free|head -2|tail -1|sed 's/Mem: *\([0-9]*\).*/\1/'`
MEM=$((MEM * 9/10000))
[ $MEM -gt 524288 ] && MEM=524288
NODE="--max-old-space-size=$MEM"
PIL="-p ${npm_config_pil:=pil/main.pil}`[ ! -z $npm_config_pilconfig ] && echo \" -P $npm_config_pilconfig\"`"
PILSTARK="node $NODE node_modules/pil-stark/src"
PILCOM="node $NODE node_modules/pilcom/src"
SNARKJS="node $NODE node_modules/snarkjs/cli.js"
BCTREE="${npm_config_bctree:=$PILSTARK/main_buildconsttree.js}"
# [ ! -z $npm_config_nth ] &&
NTH="${npm_config_nth}"
true