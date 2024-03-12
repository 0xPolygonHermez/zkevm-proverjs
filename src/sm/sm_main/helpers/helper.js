module.exports = class Helper {

    setup(props) {
        for (const name in props) {
            this[name] = props[name];
        }
    }
}