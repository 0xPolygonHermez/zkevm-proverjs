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
- **buildrom**
- **buildconstants**
- **exec**
- **pilverify**
- **buildstarkinfo**
- **buildchelpers**
- **buildconstanttree**
- **prove**
- **verify**
- **gencircom**
- **compilecircom**
- **c12setup**
- **c12buildstarkinfo**
- **c12buildchelpers**
- **c12exec**
- **c12pilverify**
- **c12buildconstanttree**
- **c12prove**
- **c12verify**
- **c12gencircom**
- **c12compilecircom**
- **downloadptaw**
- **g16setup**
- **g16contribute**
- **g16evk**
- **g16wc**
- **g16prove**
- **g16verify**
- **g16solidity**

## License

### Copyright
Polygon `zkevm-proverjs` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.

### Disclaimer
This code has not yet been audited, and should not be used in any production systems.ode has not yet been audited, and should not be used in any production systems.
