function checkParam(param, paramStr){
    if (typeof param === "undefined"){
        console.error(`option "${paramStr}" not set`);
        process.exit(1);
    }
}

module.exports = {
    checkParam
};