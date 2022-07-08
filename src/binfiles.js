
module.exports.exportMerkleGroupMultipol = async function exportMerkleGroupMultipol(fileName, MGP, tree) {
    // Check polynomials are ok

    const fd =await fs.promises.open(fileName, "w+");

    for (let i=0; i<MGP.nGroups; i++) {
        for (j=0; j<MGP.groupSize; j++) {
            await fd.write(tree.polTrees[i][j]);
        }
        await fd.write(tree.groupTrees[i]);
    }
    await fd.write(tree.mainTree);

    await fd.close();
}


module.exports.importMerkleGroupMultipol = async function exportPolynomials(fileName, MGP) {
    const tree = {
        polTrees: [],
        groupTrees: [],
        mainTree: null
    };

    const fd =await fs.promises.open(fileName, "r");
    for (let i=0; i<MGP.nGroups; i++) {
        tree.polTrees[i] = [];
        for (j=0; j<MGP.groupSize; j++) {
            tree.polTrees[i][j] = new Uint8Array( MGP.M._size(MGP.nPols)*MGP.M.n8 );
            await fd.read(tree.polTrees[i][j] , 0, tree.polTrees[i][j].byteLength);
        }
        tree.groupTrees[i] = new Uint8Array( MGP.M._size(MGP.groupSize)*MGP.M.n8 );
        await fd.read(tree.groupTrees[i], 0, tree.groupTrees[i].byteLength);
    }
    tree.mainTree = new Uint8Array( MGP.M._size(MGP.nGroups)*MGP.M.n8 );
    await fd.read(tree.mainTree, 0, tree.mainTree.byteLength);

    await fd.close();

    return tree;
}