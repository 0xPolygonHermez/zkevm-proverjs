# zkEVM ProverJS
zkEVM proof generator reference written in Javascript

## General info

## Setup
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
$ node src/main_executor testvectors/input_executor.json -r ../zkevm-rom/build/rom.json -o tmp/commit.bin
``` 
Additional parameters:

- `-t <test.json>`: test
- `-l <logs.json>`: logs
- `-s`: skip              
- `-d`: debug
- `-n <number>`: N

*Note: May require `--max-old-space-size=16384` to increase JavaScript heap size.*


## License

### Copyright
Polygon `zkevm-proverjs` was developed by Polygon. While we plan to adopt an open source license, we haven’t selected one yet, so all rights are reserved for the time being. Please reach out to us if you have thoughts on licensing.  
  
### Disclaimer
This code has not yet been audited, and should not be used in any production systems.ode has not yet been audited, and should not be used in any production systems.
