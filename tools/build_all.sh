. $PWD/pre.sh
SKIP=0
START_OPTIONS=`env|grep -wE '(npm_config_pil|npm_config_pil|npm_config_continue|npm_config_from|npm_config_build|npm_config_starkstruct)'|sed 's/npm_config_//g'|xargs`
echo "####### START $(date +'%Y-%m-%d %H:%M:%S') $START_OPTIONS ########" >> $BDIR/steps.log
LAST_STEP_FILE=$BDIR/last_step.txt
[ ! -z $npm_config_from ] && SKIP=1
[ ! -z $npm_config_step ] && npm_config_from=$npm_config_step && npm_config_to=$npm_config_step && SKIP=1
[ $npm_config_continue ] && [ -f $LAST_STEP_FILE ] && LAST_STEP=`cat $LAST_STEP_FILE` && echo "last step done: $LAST_STEP" && SKIP=1
START_TIME=$(date +%s)
while [ $# -gt 0 ]; do
    PREV_STEP=$STEP
    STEP=$1
    shift
    [ "$npm_config_from" = "$STEP" ] && SKIP=0
    [ ! -z "$PREV_STEP" ] && [ "$PREV_STEP" = "$LAST_STEP" ] && SKIP=0
    [ $SKIP -eq 1 ] && continue
    mkdir -p $BDIR/steps
    touch $BDIR/steps/$STEP
    echo "\e[35;1m####### $STEP #######\e[0m"
    START_STEP_TIME=$(date +%s)
    npm run $STEP
    RES=$?
    END_STEP_TIME=$(date +%s)
    ELAPSED_SECONDS=$((END_STEP_TIME - START_STEP_TIME))
    ELAPSED=$(date -ud "@$ELAPSED_SECONDS" +"$((ELAPSED_SECONDS/3600)):%M:%S")
    TOT_ELAPSED_SECONDS=$((END_STEP_TIME - START_TIME))
    TOT_ELAPSED=$(date -ud "@$TOT_ELAPSED_SECONDS" +"$((TOT_ELAPSED_SECONDS/3600)):%M:%S")
    if [ $RES -ne 0 ]; then
        echo "$STEP FAIL $ELAPSED / $TOT_ELAPSED" >> $BDIR/steps.log
        echo "$STEP ...[\e[31;1mFAIL\e[0m] $ELAPSED / $TOT_ELAPSED\n"
        break
    fi
    echo "$STEP OK $ELAPSED / $TOT_ELAPSED" >> $BDIR/steps.log
    echo "$STEP ...[\e[32;1mOK\e[0m] $ELAPSED / $TOT_ELAPSED\n"
    echo $STEP > $LAST_STEP_FILE
    [ "$npm_config_to" = "$STEP" ] && break
    sleep 1
done
echo "####### END $(date +'%Y-%m-%d %H:%M:%S') ########" >> $BDIR/steps.log
