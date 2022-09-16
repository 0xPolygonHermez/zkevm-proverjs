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
$ node src/main_executor testvectors/input_executor.json -r ../zkrom/build/rom.json -o tmp/commit.bin
```
Additional parameters:

- `-t <test.json>`: test
- `-l <logs.json>`: logs
- `-s`: skip
- `-d`: debug
- `-p`: pilprogram.pil
- `-P`: pilConfig.json
- `-n <number>`: N

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
npm run buildall --from=c12setup
```
**continue**: this option hasn't additional argument. With this option buildall detected last step well done and continues from next step.
```sh
npm run buildall --continue
```
**pil**: syntax is --pil=\<main.pil\> where main.pil was name of pil to compile. For debugging could use basic_main.pil. See --starkstruct option
```sh
npm run buildall --pil=pil/basic_main.pil --starkstruct=debug
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
### Build steps
| step | inputs | outputs | description|
|---|---|---|---|
| buildrom | | | compile main rom of zkevm-rom|
| buildconstants | | | generate file with all evaluations of constant polynomials|
| exec | | | execute all state machines to generate file with all evaluations of commited polynomials |
| pilverify | | | verify constraints |
| buildstarkinfo | | | |
| buildchelpers | | | |
| buildconstanttree | | | |
| prove | | | |
| verify | | | |
| gencircom | | | |
| compilecircom | | | |
| c12a_setup | | | |
| c12a_buildstarkinfo | | | |
| c12a_buildchelpers | | | |
| c12a_exec | | | |
| c12a_pilverify | | | |
| c12a_buildconstanttree | | | |
| c12a_prove | | | |
| c12a_verify | | | |
| c12a_gencircom | | | |
| c12a_compilecircom | | | |
| c12b_setup | | | |
| c12b_buildstarkinfo | | | |
| c12b_buildchelpers | | | |
| c12b_exec | | | |
| c12b_pilverify | | | |
| c12b_buildconstanttree | | | |
| c12b_prove | | | |
| c12b_verify | | | |
| c12b_gencircom | | | |
| c12b_compilecircom | | | |
| g16setup | | | |
| g16contribute | | | |
| g16evk | | | |
| g16wc | | | |
| g16prove | | | |
| g16verify | | | |
| g16solidity | | | |

## License

### Copyright
Polygon `zkevm-proverjs` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.

### Disclaimer
This code has not yet been audited, and should not be used in any production systems.ode has not yet been audited, and should not be used in any production systems.
