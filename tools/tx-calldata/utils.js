function checkParam(param, paramStr){
    if (typeof param === "undefined"){
        console.error(`option "${paramStr}" not set`);
        process.exit(1);
    }
}

function getParamRLP(param){
    let hexParam = Number(param).toString(16);
    if(hexParam.startsWith("0x")) {
        hexParam = (hexParam.length%2 === 0) ? hexParam : "0x0"+hexParam.slice(2);
    } else {
        if(hexParam === "0") hexParam = "0x";
        else hexParam = (hexParam.length%2 === 0) ? "0x"+hexParam : "0x0"+hexParam;
    }
    return hexParam;
}

module.exports = {
    checkParam,
    getParamRLP
};