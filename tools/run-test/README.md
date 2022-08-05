# Pass inputs tests

## Pre-requisites
- [nodejs](https://nodejs.org/en/)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
  - recommendation to install both using [nvm](https://github.com/nvm-sh/nvm)
- install and build the following repositories
  - [zkrom](https://github.com/hermeznetwork/zkrom)
    - please, switch to branch [develop](https://github.com/hermeznetwork/zkrom/develop)

## Install tool dependencies
- On `zkproverjs` repository root: `npm i`

## Usage
- `node run-inputs.js -i <input.json> -f <inputsFolderPath> -r <rom.json> -o <information output>`:
    - `-o <information output> (optional)`: Name of the output file with the test information. Default: `output.txt`.
    One of the following two parameters is required:
    - `-i <input.json> (optional)`: Input path. If you only want to pass the test with a single input.json file, this parameter is necessary.
    - `-f <inputsFolderPath> (optional)`: Folder where the inputs are located. It supports that there is a folder inside it with other inputs.
    The following parameters are all required:
    - `-r <rom.json>`: path to rom json file
    - `-e`: stops the inputs execution when one fails

## Example
```
node run-inputs.js -f ../../../test-vectors/inputs-executor/inputs/ -r ../../../zkrom/build/rom.json
```
```
node run-inputs.js -f ../../../test-vectors/inputs-executor/inputs/ -r ../../../zkrom/build/rom.json -o info.txt --exit
```