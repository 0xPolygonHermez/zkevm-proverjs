const path = require('path');
const fs = require('fs');

module.exports = class Helpers {
    constructor (helpers, config = {}) {
        this.config = config;
        this.helpers = [];
        this.names = {};
        this.init(helpers);
    }
    init(helpers) {
        this.setHelperReferences(this.loadInstances(helpers));
    }
    
    loadInstances(helpers) {
        helpers = Array.isArray(helpers) ? helpers : [helpers];
        const paths = this.config.paths ?? [];
        const result = [];
        for (let helper of helpers) {
            if (typeof helper !== 'string') {
                result.push(helper);
                continue;
            }

            let helperLoaded = false;
            for (const helperPath of [false, '', ...paths]) {
                const helperFile = this.getHelperFullFilePath(helperPath, helper);
                if (!fs.existsSync(helperFile)) continue;
                helperLoaded = require(helperFile);
            }
            if (helperLoaded === false) {
                throw new Error(`Helper ${helper} not found on paths: ${paths.join(';')}`);
            }
            result.push(new helperLoaded());
        }
        return result;
    }
    getHelperFullFilePath(helperPath, helper) {
        if (helperPath === false) {
            return helper;
        }
        return path.resolve(helperPath, helper + (path.extname(helper) === '.js' ? '':'.js'));            
    }
    getHelperName(helper) {
        let name = helper.constructor.name ?? 'anonymous';
        const originalName = name;
        let nameIndex = 2;    
        while (typeof this.names[name] !== 'undefined') {            
            name = originalName + nameIndex;
            ++nameIndex;
        }
        return name;
    }
    setHelperReferences(helpers) {
        for (let helper of helpers) {
            const name = this.getHelperName(helper);
            this.names[name] = helper;
            this[name] = helper;
            this.helpers.push(helper);
        }
    }
    setup(properties) { 
        for (const helper of this.helpers) {
            helper.setup(properties);
        }
    }
    isDefined(method) {
        for (const helper of this.helpers) {
            if (typeof helper[method] === 'function') {
                return true;
            }
        }
        return false;
    }
    call(method, args = []) {
        return this.#call(method, args, false);
    }
    callDefault(method, args = [], defaultReturn = null) {
        return this.#call(method, args, true, defaultReturn);
    }
    #call(method, args = [], hasDefault = false, defaultReturn = null) {
        for (const helper of this.helpers) {
            if (typeof helper[method] === 'function') {
                return helper[method].apply(helper, args);
            }
        }
        if (hasDefault) {
            return defaultReturn;
        }
        throw new Error(`called method ${method} not exists in current loaded helpers`);
   }
}