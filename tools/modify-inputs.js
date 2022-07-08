const fs = require("fs");
const path = require("path");
const dir = "../test/state-transition/inputs-executor/";

async function main() {

    const folders = []
    folders.push(path.join(__dirname, dir.trim()))

    while (folders.length > 0) {
        const files = folders.pop()
        fs.readdirSync(files).forEach(file => {
            const fileDir = `${files}${file}`
            //Print file name
            console.log(file)
            //Check is a dir
            if(fs.lstatSync(fileDir).isDirectory()) {
                folders.push(`${fileDir}/`)
                return
            }

            //Check is json files
            if(!file.endsWith(".json")) {
                return
            }
            const data = JSON.parse(fs.readFileSync(fileDir, "utf8"));
            // TODO: Update the json content
            delete data["defaultChainId"]

            //Update data
            fs.writeFileSync(fileDir, JSON.stringify(data, null, 2));
            console.log("Updated")
        })
    }
}

main().then(() => {
    process.exit(0);
}, (err) => {
    console.log(err.message);
    console.log(err.stack);
    process.exit(1);
});