# Generate input executor

## Pre-requisites
- [nodejs](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  - recommendation to install both using [nvm](https://github.com/nvm-sh/nvm)
- install and build the following repositories
  - [zkrom](https://github.com/hermeznetwork/zkrom)
    - please, switch to branch [fix/varp](https://github.com/hermeznetwork/zkrom/tree/fix/varp) to process more than one transaction
  - [zkvmpil](https://github.com/hermeznetwork/zkvmpil)

## Install tool dependencies
- On `zkproverjs` repository root: `npm i`

## Usage
- `node generate-txs.js -t <nTx> -e <flagRun> -r <rom.json> -p <pil.json> -o <flagOnlyExecutor>`
  - `-t <nTx>`: number of transaction to process. Creates a json file with the inputs ready to be processed by the executor. Input file would have the following format: `input-${nTx}.json`
  - `-e <flagRun>`: flag to run executor written in javascript with the input generated. If this flag is activated, `rom.json` and `pil.json` must be provided
  - `-r <rom.json>`: path to rom json file
  - `-p <pil.json>`: path to pil json file
  - `-o <flagOnlyExecutor>`: flag to skip building input for `nTx`. This flag assumes that `input-${nTx}.json` is already created and its main purpose is to run the executor without generate again the input.

## Example
```
node run-gen-txs.js -t 20 -e true -r ../../../zkrom/build/rom.json -p ../../../zkvmpil/build/zkevm.pil.json
```