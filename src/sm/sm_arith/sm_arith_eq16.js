/*
* code generated with arith_eq_gen.js
* equation: y1+y2-y3-p*q2+p*offset
* 
* p=0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab
* offset=0x10
*/

module.exports.calculate = function (p, step, _o)
{
	switch(step) {
		case 0: return (
			( - 0xffaaabn * p.q2[0][_o] )
			    + 0xffaaab0n + p.y1[0][_o]  + p.y2[0][_o]  - p.y3[0][_o] );

		case 1: return (
			( - 0xffaaabn * p.q2[1][_o] ) +
			( - 0xffffffn * p.q2[0][_o] )
			    + 0xffffff0n + p.y1[1][_o]  + p.y2[1][_o]  - p.y3[1][_o] );

		case 2: return (
			( - 0xffaaabn * p.q2[2][_o] ) +
			( - 0xffffffn * p.q2[1][_o] ) +
			( - 0xffb9fen * p.q2[0][_o] )
			    + 0xffb9fe0n + p.y1[2][_o]  + p.y2[2][_o]  - p.y3[2][_o] );

		case 3: return (
			( - 0xffaaabn * p.q2[3][_o] ) +
			( - 0xffffffn * p.q2[2][_o] ) +
			( - 0xffb9fen * p.q2[1][_o] ) +
			( - 0xb153ffn * p.q2[0][_o] )
			    + 0xb153ff0n + p.y1[3][_o]  + p.y2[3][_o]  - p.y3[3][_o] );

		case 4: return (
			( - 0xffaaabn * p.q2[4][_o] ) +
			( - 0xffffffn * p.q2[3][_o] ) +
			( - 0xffb9fen * p.q2[2][_o] ) +
			( - 0xb153ffn * p.q2[1][_o] ) +
			( - 0xabfffen * p.q2[0][_o] )
			    + 0xabfffe0n + p.y1[4][_o]  + p.y2[4][_o]  - p.y3[4][_o] );

		case 5: return (
			( - 0xffaaabn * p.q2[5][_o] ) +
			( - 0xffffffn * p.q2[4][_o] ) +
			( - 0xffb9fen * p.q2[3][_o] ) +
			( - 0xb153ffn * p.q2[2][_o] ) +
			( - 0xabfffen * p.q2[1][_o] ) +
			( - 0xf6241en * p.q2[0][_o] )
			    + 0xf6241e0n + p.y1[5][_o]  + p.y2[5][_o]  - p.y3[5][_o] );

		case 6: return (
			( - 0xffaaabn * p.q2[6][_o] ) +
			( - 0xffffffn * p.q2[5][_o] ) +
			( - 0xffb9fen * p.q2[4][_o] ) +
			( - 0xb153ffn * p.q2[3][_o] ) +
			( - 0xabfffen * p.q2[2][_o] ) +
			( - 0xf6241en * p.q2[1][_o] ) +
			( - 0xa0f6b0n * p.q2[0][_o] )
			    + 0xa0f6b00n + p.y1[6][_o]  + p.y2[6][_o]  - p.y3[6][_o] );

		case 7: return (
			( - 0xffaaabn * p.q2[7][_o] ) +
			( - 0xffffffn * p.q2[6][_o] ) +
			( - 0xffb9fen * p.q2[5][_o] ) +
			( - 0xb153ffn * p.q2[4][_o] ) +
			( - 0xabfffen * p.q2[3][_o] ) +
			( - 0xf6241en * p.q2[2][_o] ) +
			( - 0xa0f6b0n * p.q2[1][_o] ) +
			( - 0x6730d2n * p.q2[0][_o] )
			    + 0x6730d20n + p.y1[7][_o]  + p.y2[7][_o]  - p.y3[7][_o] );

		case 8: return (
			( - 0xffaaabn * p.q2[8][_o] ) +
			( - 0xffffffn * p.q2[7][_o] ) +
			( - 0xffb9fen * p.q2[6][_o] ) +
			( - 0xb153ffn * p.q2[5][_o] ) +
			( - 0xabfffen * p.q2[4][_o] ) +
			( - 0xf6241en * p.q2[3][_o] ) +
			( - 0xa0f6b0n * p.q2[2][_o] ) +
			( - 0x6730d2n * p.q2[1][_o] ) +
			( - 0x8512bfn * p.q2[0][_o] )
			    + 0x8512bf0n + p.y1[8][_o]  + p.y2[8][_o]  - p.y3[8][_o] );

		case 9: return (
			( - 0xffaaabn * p.q2[9][_o] ) +
			( - 0xffffffn * p.q2[8][_o] ) +
			( - 0xffb9fen * p.q2[7][_o] ) +
			( - 0xb153ffn * p.q2[6][_o] ) +
			( - 0xabfffen * p.q2[5][_o] ) +
			( - 0xf6241en * p.q2[4][_o] ) +
			( - 0xa0f6b0n * p.q2[3][_o] ) +
			( - 0x6730d2n * p.q2[2][_o] ) +
			( - 0x8512bfn * p.q2[1][_o] ) +
			( - 0x4b84f3n * p.q2[0][_o] )
			    + 0x4b84f30n + p.y1[9][_o]  + p.y2[9][_o]  - p.y3[9][_o] );

		case 10: return (
			( - 0xffaaabn * p.q2[10][_o]) +
			( - 0xffffffn * p.q2[9][_o] ) +
			( - 0xffb9fen * p.q2[8][_o] ) +
			( - 0xb153ffn * p.q2[7][_o] ) +
			( - 0xabfffen * p.q2[6][_o] ) +
			( - 0xf6241en * p.q2[5][_o] ) +
			( - 0xa0f6b0n * p.q2[4][_o] ) +
			( - 0x6730d2n * p.q2[3][_o] ) +
			( - 0x8512bfn * p.q2[2][_o] ) +
			( - 0x4b84f3n * p.q2[1][_o] ) +
			( - 0xd76477n * p.q2[0][_o] )
			    + 0xd764770n + p.y1[10][_o] + p.y2[10][_o] - p.y3[10][_o]);

		case 11: return (
			( - 0xffaaabn * p.q2[11][_o]) +
			( - 0xffffffn * p.q2[10][_o]) +
			( - 0xffb9fen * p.q2[9][_o] ) +
			( - 0xb153ffn * p.q2[8][_o] ) +
			( - 0xabfffen * p.q2[7][_o] ) +
			( - 0xf6241en * p.q2[6][_o] ) +
			( - 0xa0f6b0n * p.q2[5][_o] ) +
			( - 0x6730d2n * p.q2[4][_o] ) +
			( - 0x8512bfn * p.q2[3][_o] ) +
			( - 0x4b84f3n * p.q2[2][_o] ) +
			( - 0xd76477n * p.q2[1][_o] ) +
			( - 0x434bacn * p.q2[0][_o] )
			    + 0x434bac0n + p.y1[11][_o] + p.y2[11][_o] - p.y3[11][_o]);

		case 12: return (
			( - 0xffaaabn * p.q2[12][_o]) +
			( - 0xffffffn * p.q2[11][_o]) +
			( - 0xffb9fen * p.q2[10][_o]) +
			( - 0xb153ffn * p.q2[9][_o] ) +
			( - 0xabfffen * p.q2[8][_o] ) +
			( - 0xf6241en * p.q2[7][_o] ) +
			( - 0xa0f6b0n * p.q2[6][_o] ) +
			( - 0x6730d2n * p.q2[5][_o] ) +
			( - 0x8512bfn * p.q2[4][_o] ) +
			( - 0x4b84f3n * p.q2[3][_o] ) +
			( - 0xd76477n * p.q2[2][_o] ) +
			( - 0x434bacn * p.q2[1][_o] ) +
			( - 0x1ba7b6n * p.q2[0][_o] )
			    + 0x1ba7b60n + p.y1[12][_o] + p.y2[12][_o] - p.y3[12][_o]);

		case 13: return (
			( - 0xffaaabn * p.q2[13][_o]) +
			( - 0xffffffn * p.q2[12][_o]) +
			( - 0xffb9fen * p.q2[11][_o]) +
			( - 0xb153ffn * p.q2[10][_o]) +
			( - 0xabfffen * p.q2[9][_o] ) +
			( - 0xf6241en * p.q2[8][_o] ) +
			( - 0xa0f6b0n * p.q2[7][_o] ) +
			( - 0x6730d2n * p.q2[6][_o] ) +
			( - 0x8512bfn * p.q2[5][_o] ) +
			( - 0x4b84f3n * p.q2[4][_o] ) +
			( - 0xd76477n * p.q2[3][_o] ) +
			( - 0x434bacn * p.q2[2][_o] ) +
			( - 0x1ba7b6n * p.q2[1][_o] ) +
			( - 0xe69a4bn * p.q2[0][_o] )
			    + 0xe69a4b0n + p.y1[13][_o] + p.y2[13][_o] - p.y3[13][_o]);

		case 14: return (
			( - 0xffaaabn * p.q2[14][_o]) +
			( - 0xffffffn * p.q2[13][_o]) +
			( - 0xffb9fen * p.q2[12][_o]) +
			( - 0xb153ffn * p.q2[11][_o]) +
			( - 0xabfffen * p.q2[10][_o]) +
			( - 0xf6241en * p.q2[9][_o] ) +
			( - 0xa0f6b0n * p.q2[8][_o] ) +
			( - 0x6730d2n * p.q2[7][_o] ) +
			( - 0x8512bfn * p.q2[6][_o] ) +
			( - 0x4b84f3n * p.q2[5][_o] ) +
			( - 0xd76477n * p.q2[4][_o] ) +
			( - 0x434bacn * p.q2[3][_o] ) +
			( - 0x1ba7b6n * p.q2[2][_o] ) +
			( - 0xe69a4bn * p.q2[1][_o] ) +
			( - 0xea397fn * p.q2[0][_o] )
			    + 0xea397f0n + p.y1[14][_o] + p.y2[14][_o] - p.y3[14][_o]);

		case 15: return (
			( - 0xffaaabn * p.q2[15][_o]) +
			( - 0xffffffn * p.q2[14][_o]) +
			( - 0xffb9fen * p.q2[13][_o]) +
			( - 0xb153ffn * p.q2[12][_o]) +
			( - 0xabfffen * p.q2[11][_o]) +
			( - 0xf6241en * p.q2[10][_o]) +
			( - 0xa0f6b0n * p.q2[9][_o] ) +
			( - 0x6730d2n * p.q2[8][_o] ) +
			( - 0x8512bfn * p.q2[7][_o] ) +
			( - 0x4b84f3n * p.q2[6][_o] ) +
			( - 0xd76477n * p.q2[5][_o] ) +
			( - 0x434bacn * p.q2[4][_o] ) +
			( - 0x1ba7b6n * p.q2[3][_o] ) +
			( - 0xe69a4bn * p.q2[2][_o] ) +
			( - 0xea397fn * p.q2[1][_o] ) +
			( - 0x1a0111n * p.q2[0][_o] )
			    + 0x1a01110n + p.y1[15][_o] + p.y2[15][_o] - p.y3[15][_o]);

		case 16: return (
			( - 0xffffffn * p.q2[15][_o]) +
			( - 0xffb9fen * p.q2[14][_o]) +
			( - 0xb153ffn * p.q2[13][_o]) +
			( - 0xabfffen * p.q2[12][_o]) +
			( - 0xf6241en * p.q2[11][_o]) +
			( - 0xa0f6b0n * p.q2[10][_o]) +
			( - 0x6730d2n * p.q2[9][_o] ) +
			( - 0x8512bfn * p.q2[8][_o] ) +
			( - 0x4b84f3n * p.q2[7][_o] ) +
			( - 0xd76477n * p.q2[6][_o] ) +
			( - 0x434bacn * p.q2[5][_o] ) +
			( - 0x1ba7b6n * p.q2[4][_o] ) +
			( - 0xe69a4bn * p.q2[3][_o] ) +
			( - 0xea397fn * p.q2[2][_o] ) +
			( - 0x1a0111n * p.q2[1][_o] ));

		case 17: return (
			( - 0xffb9fen * p.q2[15][_o]) +
			( - 0xb153ffn * p.q2[14][_o]) +
			( - 0xabfffen * p.q2[13][_o]) +
			( - 0xf6241en * p.q2[12][_o]) +
			( - 0xa0f6b0n * p.q2[11][_o]) +
			( - 0x6730d2n * p.q2[10][_o]) +
			( - 0x8512bfn * p.q2[9][_o] ) +
			( - 0x4b84f3n * p.q2[8][_o] ) +
			( - 0xd76477n * p.q2[7][_o] ) +
			( - 0x434bacn * p.q2[6][_o] ) +
			( - 0x1ba7b6n * p.q2[5][_o] ) +
			( - 0xe69a4bn * p.q2[4][_o] ) +
			( - 0xea397fn * p.q2[3][_o] ) +
			( - 0x1a0111n * p.q2[2][_o] ));

		case 18: return (
			( - 0xb153ffn * p.q2[15][_o]) +
			( - 0xabfffen * p.q2[14][_o]) +
			( - 0xf6241en * p.q2[13][_o]) +
			( - 0xa0f6b0n * p.q2[12][_o]) +
			( - 0x6730d2n * p.q2[11][_o]) +
			( - 0x8512bfn * p.q2[10][_o]) +
			( - 0x4b84f3n * p.q2[9][_o] ) +
			( - 0xd76477n * p.q2[8][_o] ) +
			( - 0x434bacn * p.q2[7][_o] ) +
			( - 0x1ba7b6n * p.q2[6][_o] ) +
			( - 0xe69a4bn * p.q2[5][_o] ) +
			( - 0xea397fn * p.q2[4][_o] ) +
			( - 0x1a0111n * p.q2[3][_o] ));

		case 19: return (
			( - 0xabfffen * p.q2[15][_o]) +
			( - 0xf6241en * p.q2[14][_o]) +
			( - 0xa0f6b0n * p.q2[13][_o]) +
			( - 0x6730d2n * p.q2[12][_o]) +
			( - 0x8512bfn * p.q2[11][_o]) +
			( - 0x4b84f3n * p.q2[10][_o]) +
			( - 0xd76477n * p.q2[9][_o] ) +
			( - 0x434bacn * p.q2[8][_o] ) +
			( - 0x1ba7b6n * p.q2[7][_o] ) +
			( - 0xe69a4bn * p.q2[6][_o] ) +
			( - 0xea397fn * p.q2[5][_o] ) +
			( - 0x1a0111n * p.q2[4][_o] ));

		case 20: return (
			( - 0xf6241en * p.q2[15][_o]) +
			( - 0xa0f6b0n * p.q2[14][_o]) +
			( - 0x6730d2n * p.q2[13][_o]) +
			( - 0x8512bfn * p.q2[12][_o]) +
			( - 0x4b84f3n * p.q2[11][_o]) +
			( - 0xd76477n * p.q2[10][_o]) +
			( - 0x434bacn * p.q2[9][_o] ) +
			( - 0x1ba7b6n * p.q2[8][_o] ) +
			( - 0xe69a4bn * p.q2[7][_o] ) +
			( - 0xea397fn * p.q2[6][_o] ) +
			( - 0x1a0111n * p.q2[5][_o] ));

		case 21: return (
			( - 0xa0f6b0n * p.q2[15][_o]) +
			( - 0x6730d2n * p.q2[14][_o]) +
			( - 0x8512bfn * p.q2[13][_o]) +
			( - 0x4b84f3n * p.q2[12][_o]) +
			( - 0xd76477n * p.q2[11][_o]) +
			( - 0x434bacn * p.q2[10][_o]) +
			( - 0x1ba7b6n * p.q2[9][_o] ) +
			( - 0xe69a4bn * p.q2[8][_o] ) +
			( - 0xea397fn * p.q2[7][_o] ) +
			( - 0x1a0111n * p.q2[6][_o] ));

		case 22: return (
			( - 0x6730d2n * p.q2[15][_o]) +
			( - 0x8512bfn * p.q2[14][_o]) +
			( - 0x4b84f3n * p.q2[13][_o]) +
			( - 0xd76477n * p.q2[12][_o]) +
			( - 0x434bacn * p.q2[11][_o]) +
			( - 0x1ba7b6n * p.q2[10][_o]) +
			( - 0xe69a4bn * p.q2[9][_o] ) +
			( - 0xea397fn * p.q2[8][_o] ) +
			( - 0x1a0111n * p.q2[7][_o] ));

		case 23: return (
			( - 0x8512bfn * p.q2[15][_o]) +
			( - 0x4b84f3n * p.q2[14][_o]) +
			( - 0xd76477n * p.q2[13][_o]) +
			( - 0x434bacn * p.q2[12][_o]) +
			( - 0x1ba7b6n * p.q2[11][_o]) +
			( - 0xe69a4bn * p.q2[10][_o]) +
			( - 0xea397fn * p.q2[9][_o] ) +
			( - 0x1a0111n * p.q2[8][_o] ));

		case 24: return (
			( - 0x4b84f3n * p.q2[15][_o]) +
			( - 0xd76477n * p.q2[14][_o]) +
			( - 0x434bacn * p.q2[13][_o]) +
			( - 0x1ba7b6n * p.q2[12][_o]) +
			( - 0xe69a4bn * p.q2[11][_o]) +
			( - 0xea397fn * p.q2[10][_o]) +
			( - 0x1a0111n * p.q2[9][_o] ));

		case 25: return (
			( - 0xd76477n * p.q2[15][_o]) +
			( - 0x434bacn * p.q2[14][_o]) +
			( - 0x1ba7b6n * p.q2[13][_o]) +
			( - 0xe69a4bn * p.q2[12][_o]) +
			( - 0xea397fn * p.q2[11][_o]) +
			( - 0x1a0111n * p.q2[10][_o]));

		case 26: return (
			( - 0x434bacn * p.q2[15][_o]) +
			( - 0x1ba7b6n * p.q2[14][_o]) +
			( - 0xe69a4bn * p.q2[13][_o]) +
			( - 0xea397fn * p.q2[12][_o]) +
			( - 0x1a0111n * p.q2[11][_o]));

		case 27: return (
			( - 0x1ba7b6n * p.q2[15][_o]) +
			( - 0xe69a4bn * p.q2[14][_o]) +
			( - 0xea397fn * p.q2[13][_o]) +
			( - 0x1a0111n * p.q2[12][_o]));

		case 28: return (
			( - 0xe69a4bn * p.q2[15][_o]) +
			( - 0xea397fn * p.q2[14][_o]) +
			( - 0x1a0111n * p.q2[13][_o]));

		case 29: return (
			( - 0xea397fn * p.q2[15][_o]) +
			( - 0x1a0111n * p.q2[14][_o]));

		case 30: return ( ( - 0x1a0111n * p.q2[15][_o]));

		case 31: return (
			0x0n    );
	}
	return 0n;
}
