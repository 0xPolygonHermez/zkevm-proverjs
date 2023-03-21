# zkEVM ProverJS
zkEVM proof generator reference written in Javascript

## General info

## setup
```sh
$ npm install
$ npm run build
```

## Usage
Basic usage:
```sh
$ node src/main_executor <input.json> -r <rom.json> -o <proof.json>
```
Example:
```sh
$ node src/main_executor tools/build-genesis/input_executor.json -r ../zkevm-rom/build/rom.json -o tmp/commit.bin
```
Additional parameters:

- `-t <test.json>`: test
- `-l <logs.json>`: logs
- `-s`: skip compile pil
- `-d`: debug mode
- `-p`: select pilprogram.pil
- `-P`: load pilConfig.json file
- `-u`: unsigned transactions mode
- `-e`: skip asserts `newStateRoot` and `newLocalExitRoot`
- `-v`: verbose mode PIL
- `-T`: enable tracer
- `-c`: disable zk-counters
- `-N <number>`: override number of steps
- `-V <verbose-config.json>`: verbode executor & full-tracer. Loads `verbose-config.json`
- `-S <stats.json>`: save stats to a file

## Verbose configuration
- `fulltracer.enable`: prints events originated in the full tracer
- `fulltracer.printOpcodes`: print opcodes
- `fulltracer.filterOpcodes`: string filter when printing opcodes
- `fulltracer.initFinalState`: print pre/post state of touched addresses
- `fulltracer.bytecode`: add bytecode to pre/post state
- `fulltracer.saveInitFinalState`: save file with pre/post state
- `zkPC`: print info program counter
- `batchL2Data`: print info about batch L2 data
- `step`: print executor step

### Build setup
```sh
npm run buildsetup --build=build/v0.7.0.0-rc.1 --bctree=../zkevm-prover/build/bctree
```
### Build prove
```sh
npm run buildall
```
### Build prove with basic main (without SM, only for debugging)
```sh
npm run buildall --pil=pil/basic_main.pil --starkstruct=debug
```
### Build prove with pilconfig (only for debugging)
```sh
npm run buildall --pilconfig=testvectors/pilconfig.pil --starkstruct=debug
```
### Build options
**from**: syntax is --from=\<step\> to indicate step where start build/rebuild
```sh
npm run buildsetup --from=c12setup
```
**continue**: this option hasn't additional argument. With this option buildall detected last step well done and continues from next step.
```sh
npm run buildsetup --continue
```
**step**: syntax is --step=\<step\> to indicate step to execute (one step only)
```sh
npm run buildsetup --step=c12setup
```
**steps**: to show list of steps
```sh
npm run buildsetup --steps
```
**pil**: syntax is --pil=\<main.pil\> where main.pil was name of pil to compile. For debugging could use basic_main.pil. See --starkstruct option
```sh
npm run buildsetup --pil=pil/basic_main.pil --starkstruct=debug
```
**pilconfig**: syntax is --pilconfig=<pilconfig.json> where pilconfig.json was name of config used in pil compilation. See --starkstruct option
```sh
npm run buildall --pilconfig=testvectors/pilconfig.json --starkstruct=debug
```
**starkstruct**: syntax is --startstruct=debug to generates automatic starkstruct adapted to pil bits number. Only for debugging. This option shall used with --pil or pilconfig if number of bits change.
```sh
npm run buildall --starkstruct=debug
```
**build**: with this option could change build directory, by default build directory is build/proof.
```sh
npm run buildall --build=build/basic_proof
```
**input**: with this option indicates input file to use.
```sh
npm run buildall --input=test/myinputfile.json
```
**bctree**: syntax is --bctree=\<bctree_exec\> specify an external binary (executable) to generate build constanttree
```sh
npm run buildall --bctree=../zkevm-prover/build/bctree
```
### Memory

| Region (base-to)| Size | Content |
|---|---|---|
| 0x000000 - 0x03FFFF | 8MiB |
| 0x040000 - 0x07FFFF | 8MiB | First context
| 0x080000 - 0x0BFFFF | 8MiB | Second context
|     :               | 8MiB | :


| Region (base-to)| Size | Content |
|---|---|---|
| CTX.base + [0x000000 - 0x00FFFF] | 2MiB | Context specific variables
| CTX.base + [0x010000 - 0x01FFFF] | 2MiB | EVM Stack
| CTX.base + [0x020000 - 0x03FFFF] | 4MiB | EVM Memory


## License

### Copyright
Polygon `zkevm-proverjs` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.

### Disclaimer
This code has not yet been audited, and should not be used in any production systems.ode has not yet been audited, and should not be used in any production systems.
