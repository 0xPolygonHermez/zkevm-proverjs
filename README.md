# zkEVM ProverJS
zkEVM proof generator reference written in Javascript

## General info

To build and run the files in this repository requires a Linux environment with at least 500GB+ of RAM. The build process has been tested on Ubuntu 22.04.

## Requirements

Before you proceed, make sure you have the following installed:

- [Node.js](https://nodejs.org/en/) (version 16 or higher)
- [Circom](https://docs.circom.io/getting-started/installation/)

To avoid some OOM (Out-Of-Memory) errors, it is recommended to increase the number memory map areas that a process can use on your system. To do this, run the following command:

```sh
sudo sysctl -w vm.max_map_count=655300
``````

## Setup

To install the dependencies, run the following command:

```sh
npm install
```

To build the configuration files required to run the prover, run the following command:

```sh
npm run buildsetup
```

>> The whole process can take more than a day to run, and it will require downloading and compiling several dependencies, including a massive file with 388GB (powersOfTau).

To build and test the configuration files run the following command:

```sh
npm run buildall
```

#### [OPTIONAL] Build prove with basic main (without SM, only for debugging)

```sh
npm run buildall --pil=pil/basic_main.pil --starkstruct=debug
```

#### [OPTIONAL] Build prove with pilconfig (only for debugging)

```sh
npm run buildall --pilconfig=testvectors/pilconfig.pil --starkstruct=debug
```

### Build options

**continue**: this option hasn't additional argument. With this option buildall will detect the last step well done and will continue from next step.

```sh
npm run buildsetup --continue
```

**from**: syntax is --from=\<step\> to indicate step where start build/rebuild

```sh
npm run buildsetup --from=c12setup
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

**starkstruct**: syntax is --startstruct=debug to generate automatic starkstruct adapted to pil bits number. Only for debugging. This option shall be used with --pil or pilconfig if number of bits change.

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

## Configuration files for the C++ version of the Prover

The command `npm run buildsetup` will generate the configuration files required to run [the C++ version of the Prover](https://github.com/0xPolygonHermez/zkevm-prover). However, the generated files will be not in the expected structure. To fix this, you can run the following command:

```sh
./move-files.sh <path-to-the-build-repository> <path-to-zkevm-prover/config>
```

For example:

```sh
./move-files.sh ./build ../zkevm-prover/config
```

## Usage

Basic usage:
```sh
node src/main_executor <input.json> -r <rom.json> -o <proof.json>
```

Example:
```sh
node src/main_executor tools/build-genesis/input_executor.json -r ../zkevm-rom/build/rom.json -o tmp/commit.bin
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

### Memory

| Region (base-to)    | Size | Content        |
| ------------------- | ---- | -------------- |
| 0x000000 - 0x03FFFF | 8MiB |
| 0x040000 - 0x07FFFF | 8MiB | First context  |
| 0x080000 - 0x0BFFFF | 8MiB | Second context |
| :                   | 8MiB | :              |


| Region (base-to)                 | Size | Content                    |
| -------------------------------- | ---- | -------------------------- |
| CTX.base + [0x000000 - 0x00FFFF] | 2MiB | Context specific variables |
| CTX.base + [0x010000 - 0x01FFFF] | 2MiB | EVM Stack                  |
| CTX.base + [0x020000 - 0x03FFFF] | 4MiB | EVM Memory                 |
