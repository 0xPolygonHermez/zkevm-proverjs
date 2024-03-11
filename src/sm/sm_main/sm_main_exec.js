const batchExecutor = require('./sm_main_exec_batch.js');
const blobExecutor = require('./sm_main_exec_blob.js');

module.exports = async function execute(pols, input, rom, config = {}, metadata = {}) {
    // if (config.blob) {
        return await blobExecutor(pols, input, rom, config, metadata);
    // }
    return await batchExecutor(pols, input, rom, config, metadata);
}