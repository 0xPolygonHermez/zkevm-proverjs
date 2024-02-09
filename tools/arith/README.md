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
## Template Syntax
These tools use the ejs template. Inside ejs template could use some helpers between tokens <%- and %> to generate PIL code. Ejs supports for more info at https://ejs.co/

For specify a range of array indexes/terms use .., how this syntax wasn't javascript compatible must write as string 'A[0..3]' for example. In these example indicate A[0], A[1], A[2], A[3].

It's possible to specify multiple arrays or single elements using javascript array, for example: ['A[0..3]', 'B[0..12]', 'C[3]'].
## Template Macros
### equation
This macro generates all intermediate calculates of the equation. The equation must be simple as the sum of products. For example: x1 + x2 * x3 + y1 * 10 - y2 - y3 * y3

Syntax:
```javascript
equation(name, value, constValues, clockName, config)
```
- **name**: name of the equation/polynomial, replace in the equation the text ## by number of intermediate calculates, for example pol eq_##, generates pol eq_0, pol eq_1, pol eq_2.
- **value**: expression that defines the equation. 3 * x + y * y - 5
- **constValues**: object with all constant values. For example: {p: 2n**256n}
- **config**: object with options to generate equations.
    - **chunkSize**: number of chunks of 16 bits used in calculations.

Example:

```javascript
<%- equation('pol eq1_## =', 's*x2-s*x1-y2+y1+p*q0-p*offset',
             {p: 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
             offset:0x40000000000000000000000000000000000000000000000000000000000000000n}) %>
```
generates:
```
pol eq1_0 =
		(s[0] * x2[0] - s[0] * x1[0] + 64559 * q0[0])
		 - y2[0] + y1[0];
pol eq1_1 =
    (s[0] * x2[1] - s[0] * x1[1] + 64559 * q0[1]) +
    (s[1] * x2[0] - s[1] * x1[0] + 65535 * q0[0])
        - y2[1] + y1[1];

pol eq1_2 = ...

        :

pol eq1_30 =
    (s[15] * x2[15] - s[15] * x1[15] + 65535 * q0[15])
        - 262140;
pol eq1_31 =
        - 262140;

```

### latch
This macro was used to generate the constraints to latch polynomials specified on the first argument, the evaluations only could change when the evaluation was 1, usually a CLOCK o RESET polynomial.

Syntax:
```javascript
latch(values, clockName)
```

Example:

```javascript
<%- latch('A[0..3]','CLK[31]') %>
```
generates:
```
A[0]' * (1-CLK[47]) = A[0] * (1-CLK[31]);
A[1]' * (1-CLK[47]) = A[1] * (1-CLK[31]);
A[2]' * (1-CLK[47]) = A[2] * (1-CLK[31]);
A[3]' * (1-CLK[47]) = A[3] * (1-CLK[31]);
```

### binary
This macro was used to generate constraints with polynomials specified on the first argument, the evaluations only could be 0 or 1.

Syntax:

```javascript
binary(values)
```

Example:

```javascript
<%- binary('A[1..2]','B[2]') %>
```
generates:
```
A[1] * (1 - A[1]) = 0;
A[2] * (1 - A[2]) = 0;
B[2] * (1 - B[2]) = 0;
```

### cksel (clock selector)
This macro was used to generate a polynomial that enables in each clock only a value of array, in the first clock polynomial enables first value/term, in the second clock, the second valu/term, ...

Syntax:

```javascript
clksel(values, clk)
```
Example:

```javascript
pol eq0 = <%- clksel(['eq0_[0..31]']) %>;
```
generates:
```
pol eq0 = eq0_0*CLK[0] + eq0_1*CLK[1] + eq0_2*CLK[2] + eq0_3*CLK[3] + eq0_4*CLK[4] + ....
          .... + eq0_30*CLK[30] + eq0_31*CLK[31];
```

### join
This macro is used to join all terms with "glue".

Syntax:

```javascript
join(values, glue)
```
Example:

```javascript
pol tmp = <%- join('A[0..3]',' + ') %>;
```
generates:
```
pol tmp = A[0] + A[1] +  A[2] + A[3];

```

### expandTerms
This macro is used to expand terms such as 'A[0..3]' to a native javascript array.

Syntax:

```javascript
expandTerms(values, glue)
```
Example:

```javascript
pol tmp = <%- expandTerms('A[0..3]').forEach(.... %>
```

