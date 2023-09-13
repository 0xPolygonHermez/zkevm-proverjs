/*
* code generated with arith_eq_gen.js
* equation: a*b-p2_64*d+c-op
* 
* p2_64=0x10000000000000000
*/

module.exports.calculate = function (p, step, _o)
{
	switch(step) {
	case 0: return (
		(p.a[0][_o]   * p.b[0][_o]  )
		 + p.c[0][_o]   - p.op[0][_o] );

	case 1: return (
		(p.a[0][_o]   * p.b[1][_o]  ) +
		(p.a[1][_o]   * p.b[0][_o]  )
		 + p.c[1][_o]   - p.op[1][_o] );

	case 2: return (
		(p.a[0][_o]   * p.b[2][_o]  ) +
		(p.a[1][_o]   * p.b[1][_o]  ) +
		(p.a[2][_o]   * p.b[0][_o]  )
		 + p.c[2][_o]   - p.op[2][_o] );

	case 3: return (
		(p.a[0][_o]   * p.b[3][_o]  ) +
		(p.a[1][_o]   * p.b[2][_o]  ) +
		(p.a[2][_o]   * p.b[1][_o]  ) +
		(p.a[3][_o]   * p.b[0][_o]  )
		 + p.c[3][_o]   - p.op[3][_o] );

	case 4: return (
		(p.a[1][_o]   * p.b[3][_o]  ) +
		(p.a[2][_o]   * p.b[2][_o]  ) +
		(p.a[3][_o]   * p.b[1][_o]  )
		    - p.d[0][_o]  );

	case 5: return (
		(p.a[2][_o]   * p.b[3][_o]  ) +
		(p.a[3][_o]   * p.b[2][_o]  )
		    - p.d[1][_o]  );

	case 6: return (
		(p.a[3][_o]   * p.b[3][_o]  )
		    - p.d[2][_o]  );

	case 7: return (
		    - p.d[3][_o]  );
	}
	return 0n;
}
