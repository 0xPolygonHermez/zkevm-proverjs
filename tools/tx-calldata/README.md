# Generate input executor

## Pre-requisites
- [nodejs](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  - recommendation to install both using [nvm](https://github.com/nvm-sh/nvm)

## Install tool dependencies
- On `zkproverjs` repository root: `npm i`

## Usage
- First step, copy the example transaction json to be used by default: `cp tx-example.json tx.json`.
- `node tx-calldata.js -n <nonce> -p <gasPrice> -l <gasLimit> -t <to> -a <value> -d <data> -v <v> -r <r> -s <s> -x <transaction.json>`
  - `-n <nonce> (optional)`: tx nonce
  - `-p <gasPrice> (optional)`: tx gasPrice
  - `-l <gasLimit> (optional)`: tx gasLimit
  - `-t <to> (optional)`:  tx to
  - `-a <value> (optional)`: tx value
  - `-d <data> (optional)`: tx data
  - `-v <v> (optional)`: v
  - `-r <r> (optional)`: r
  - `-s <s> (optional)`: s
  - `-x <transaction.json> (optional)`: json file with all the previous parameters. Default: "tx.json"

By default the parameters defined in tx.json will be used.
With the above options, there is the option to choose another json or modify only some of the parameters with its flag.

## Examples
```
node tx-calldata.js --nonce 2
```
```
node tx-calldata.js --transaction ./tx-2.json
```
```
node tx-calldata.js --transaction ./tx-2.json --nonce 3 --value 10
```
```
node tx-calldata.js --nonce 3 --value 10
```