BDIR="${npm_config_build:=build/proof}"
mkdir -p $BDIR
# NODE="--trace-gc --trace-gc-ignore-scavenger --max-semi-space-size=1024 --max-old-space-size=524288"
MEM=130000
type free tail sed >/dev/null 2>&1 && MEM=`free -t|tail -1|sed 's/Total: *\([0-9]*\).*/\1/'`
MEM=$((MEM * 9/10))
[ $MEM -gt 524288 ] && MEM=524288
NODE="--max-old-space-size=$MEM"
PILSTARK="node $NODE node_modules/pil-stark/src"
PILCOM="node $NODE node_modules/pilcom/src"
SNARKJS="node $NODE node_modules/snarkjs/cli.js"
PIL="-p ${npm_config_pil:=pil/main.pil}`[ ! -z $npm_config_pilconfig ] && echo \" -P $npm_config_pilconfig\"`"