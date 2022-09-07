## Usage
### Pil generation
```sh
$ node parse <template.ejs.pil> [-o <output.pil>]
```
Example:
```sh
$ node parse arith.ejs.pil -o ../../pil/arith.pil
```
### Cpp/Javascripts helpers
```sh
$ node arith_eq_gen <equation|template.ejs.pil> [-o <output.pil>]
```
Example:
```sh
$ node arith_eq_gen arith.ejs.pil
```