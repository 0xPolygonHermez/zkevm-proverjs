

class ExpressionOps {

    add(a, b) {
        if (!a) return b;
        if (!b) return a;
        return {
            op: "add",
            values: [ a, b]
        }
    }

    sub(a, b) {
        if (!a) return b;
        if (!b) return a;
        return {
            op: "sub",
            values: [ a, b]
        }
    }

    addc(a, c) {
        return {
            op: "addc",
            const: c,
            values: [a]
        }
    }

    mul(a, b) {
        if (!a) return b;
        if (!b) return a;
        return {
            op: "mul",
            values: [ a, b]
        }
    }

    mulc(a, c) {
        return {
            op: "mulc",
            const: c,
            values: [a]
        }
    }

    neg(a) {
        return {
            op: "neg",
            values: [a]
        }
    }

    exp(id, next) {
        return {
            op: "exp",
            id: id,
            next: !!next 
        }
    }

    cm(id, next) {
        return {
            op: "cm",
            id: id,
            next: !!next 
        }
    }

    const(id, next) {
        return {
            op: "const",
            id: id,
            next: !!next 
        }
    }

    q(id, next) {
        return {
            op: "q",
            id: id,
            next: !!next 
        }
    }

    challange(name) {
        return { op: "challange", name: name};
    }

    number(n) {
        return {
            op: "number",
            value: n
        }
    }

}

module.exports = ExpressionOps;