/*
* code generated with arith_eq_gen.js
* equation: y1-y2-y3+p*q2-p*offset
* 
* p=0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47
* offset=0x40000000000000000000000000000000000000000000000000000000000000000
*/

module.exports.calculate = function (p, step, _o)
{
	switch(step) {
		case 0: return (
			(0xfd47n  * p.q2[0][_o] )
			 + p.y1[0][_o]  - p.y2[0][_o]  - p.y3[0][_o] );

		case 1: return (
			(0xfd47n  * p.q2[1][_o] ) +
			(0xd87cn  * p.q2[0][_o] )
			 + p.y1[1][_o]  - p.y2[1][_o]  - p.y3[1][_o] );

		case 2: return (
			(0xfd47n  * p.q2[2][_o] ) +
			(0xd87cn  * p.q2[1][_o] ) +
			(0x8c16n  * p.q2[0][_o] )
			 + p.y1[2][_o]  - p.y2[2][_o]  - p.y3[2][_o] );

		case 3: return (
			(0xfd47n  * p.q2[3][_o] ) +
			(0xd87cn  * p.q2[2][_o] ) +
			(0x8c16n  * p.q2[1][_o] ) +
			(0x3c20n  * p.q2[0][_o] )
			 + p.y1[3][_o]  - p.y2[3][_o]  - p.y3[3][_o] );

		case 4: return (
			(0xfd47n  * p.q2[4][_o] ) +
			(0xd87cn  * p.q2[3][_o] ) +
			(0x8c16n  * p.q2[2][_o] ) +
			(0x3c20n  * p.q2[1][_o] ) +
			(0xca8dn  * p.q2[0][_o] )
			 + p.y1[4][_o]  - p.y2[4][_o]  - p.y3[4][_o] );

		case 5: return (
			(0xfd47n  * p.q2[5][_o] ) +
			(0xd87cn  * p.q2[4][_o] ) +
			(0x8c16n  * p.q2[3][_o] ) +
			(0x3c20n  * p.q2[2][_o] ) +
			(0xca8dn  * p.q2[1][_o] ) +
			(0x6871n  * p.q2[0][_o] )
			 + p.y1[5][_o]  - p.y2[5][_o]  - p.y3[5][_o] );

		case 6: return (
			(0xfd47n  * p.q2[6][_o] ) +
			(0xd87cn  * p.q2[5][_o] ) +
			(0x8c16n  * p.q2[4][_o] ) +
			(0x3c20n  * p.q2[3][_o] ) +
			(0xca8dn  * p.q2[2][_o] ) +
			(0x6871n  * p.q2[1][_o] ) +
			(0x6a91n  * p.q2[0][_o] )
			 + p.y1[6][_o]  - p.y2[6][_o]  - p.y3[6][_o] );

		case 7: return (
			(0xfd47n  * p.q2[7][_o] ) +
			(0xd87cn  * p.q2[6][_o] ) +
			(0x8c16n  * p.q2[5][_o] ) +
			(0x3c20n  * p.q2[4][_o] ) +
			(0xca8dn  * p.q2[3][_o] ) +
			(0x6871n  * p.q2[2][_o] ) +
			(0x6a91n  * p.q2[1][_o] ) +
			(0x9781n  * p.q2[0][_o] )
			 + p.y1[7][_o]  - p.y2[7][_o]  - p.y3[7][_o] );

		case 8: return (
			(0xfd47n  * p.q2[8][_o] ) +
			(0xd87cn  * p.q2[7][_o] ) +
			(0x8c16n  * p.q2[6][_o] ) +
			(0x3c20n  * p.q2[5][_o] ) +
			(0xca8dn  * p.q2[4][_o] ) +
			(0x6871n  * p.q2[3][_o] ) +
			(0x6a91n  * p.q2[2][_o] ) +
			(0x9781n  * p.q2[1][_o] ) +
			(0x585dn  * p.q2[0][_o] )
			 + p.y1[8][_o]  - p.y2[8][_o]  - p.y3[8][_o] );

		case 9: return (
			(0xfd47n  * p.q2[9][_o] ) +
			(0xd87cn  * p.q2[8][_o] ) +
			(0x8c16n  * p.q2[7][_o] ) +
			(0x3c20n  * p.q2[6][_o] ) +
			(0xca8dn  * p.q2[5][_o] ) +
			(0x6871n  * p.q2[4][_o] ) +
			(0x6a91n  * p.q2[3][_o] ) +
			(0x9781n  * p.q2[2][_o] ) +
			(0x585dn  * p.q2[1][_o] ) +
			(0x8181n  * p.q2[0][_o] )
			 + p.y1[9][_o]  - p.y2[9][_o]  - p.y3[9][_o] );

		case 10: return (
			(0xfd47n  * p.q2[10][_o]) +
			(0xd87cn  * p.q2[9][_o] ) +
			(0x8c16n  * p.q2[8][_o] ) +
			(0x3c20n  * p.q2[7][_o] ) +
			(0xca8dn  * p.q2[6][_o] ) +
			(0x6871n  * p.q2[5][_o] ) +
			(0x6a91n  * p.q2[4][_o] ) +
			(0x9781n  * p.q2[3][_o] ) +
			(0x585dn  * p.q2[2][_o] ) +
			(0x8181n  * p.q2[1][_o] ) +
			(0x45b6n  * p.q2[0][_o] )
			 + p.y1[10][_o] - p.y2[10][_o] - p.y3[10][_o]);

		case 11: return (
			(0xfd47n  * p.q2[11][_o]) +
			(0xd87cn  * p.q2[10][_o]) +
			(0x8c16n  * p.q2[9][_o] ) +
			(0x3c20n  * p.q2[8][_o] ) +
			(0xca8dn  * p.q2[7][_o] ) +
			(0x6871n  * p.q2[6][_o] ) +
			(0x6a91n  * p.q2[5][_o] ) +
			(0x9781n  * p.q2[4][_o] ) +
			(0x585dn  * p.q2[3][_o] ) +
			(0x8181n  * p.q2[2][_o] ) +
			(0x45b6n  * p.q2[1][_o] ) +
			(0xb850n  * p.q2[0][_o] )
			 + p.y1[11][_o] - p.y2[11][_o] - p.y3[11][_o]);

		case 12: return (
			(0xfd47n  * p.q2[12][_o]) +
			(0xd87cn  * p.q2[11][_o]) +
			(0x8c16n  * p.q2[10][_o]) +
			(0x3c20n  * p.q2[9][_o] ) +
			(0xca8dn  * p.q2[8][_o] ) +
			(0x6871n  * p.q2[7][_o] ) +
			(0x6a91n  * p.q2[6][_o] ) +
			(0x9781n  * p.q2[5][_o] ) +
			(0x585dn  * p.q2[4][_o] ) +
			(0x8181n  * p.q2[3][_o] ) +
			(0x45b6n  * p.q2[2][_o] ) +
			(0xb850n  * p.q2[1][_o] ) +
			(0xa029n  * p.q2[0][_o] )
			 + p.y1[12][_o] - p.y2[12][_o] - p.y3[12][_o]);

		case 13: return (
			(0xfd47n  * p.q2[13][_o]) +
			(0xd87cn  * p.q2[12][_o]) +
			(0x8c16n  * p.q2[11][_o]) +
			(0x3c20n  * p.q2[10][_o]) +
			(0xca8dn  * p.q2[9][_o] ) +
			(0x6871n  * p.q2[8][_o] ) +
			(0x6a91n  * p.q2[7][_o] ) +
			(0x9781n  * p.q2[6][_o] ) +
			(0x585dn  * p.q2[5][_o] ) +
			(0x8181n  * p.q2[4][_o] ) +
			(0x45b6n  * p.q2[3][_o] ) +
			(0xb850n  * p.q2[2][_o] ) +
			(0xa029n  * p.q2[1][_o] ) +
			(0xe131n  * p.q2[0][_o] )
			 + p.y1[13][_o] - p.y2[13][_o] - p.y3[13][_o]);

		case 14: return (
			(0xfd47n  * p.q2[14][_o]) +
			(0xd87cn  * p.q2[13][_o]) +
			(0x8c16n  * p.q2[12][_o]) +
			(0x3c20n  * p.q2[11][_o]) +
			(0xca8dn  * p.q2[10][_o]) +
			(0x6871n  * p.q2[9][_o] ) +
			(0x6a91n  * p.q2[8][_o] ) +
			(0x9781n  * p.q2[7][_o] ) +
			(0x585dn  * p.q2[6][_o] ) +
			(0x8181n  * p.q2[5][_o] ) +
			(0x45b6n  * p.q2[4][_o] ) +
			(0xb850n  * p.q2[3][_o] ) +
			(0xa029n  * p.q2[2][_o] ) +
			(0xe131n  * p.q2[1][_o] ) +
			(0x4e72n  * p.q2[0][_o] )
			 + p.y1[14][_o] - p.y2[14][_o] - p.y3[14][_o]);

		case 15: return (
			(0xfd47n  * p.q2[15][_o]) +
			(0xd87cn  * p.q2[14][_o]) +
			(0x8c16n  * p.q2[13][_o]) +
			(0x3c20n  * p.q2[12][_o]) +
			(0xca8dn  * p.q2[11][_o]) +
			(0x6871n  * p.q2[10][_o]) +
			(0x6a91n  * p.q2[9][_o] ) +
			(0x9781n  * p.q2[8][_o] ) +
			(0x585dn  * p.q2[7][_o] ) +
			(0x8181n  * p.q2[6][_o] ) +
			(0x45b6n  * p.q2[5][_o] ) +
			(0xb850n  * p.q2[4][_o] ) +
			(0xa029n  * p.q2[3][_o] ) +
			(0xe131n  * p.q2[2][_o] ) +
			(0x4e72n  * p.q2[1][_o] ) +
			(0x3064n  * p.q2[0][_o] )
			 + p.y1[15][_o] - p.y2[15][_o] - p.y3[15][_o]);

		case 16: return (
			(0xd87cn  * p.q2[15][_o]) +
			(0x8c16n  * p.q2[14][_o]) +
			(0x3c20n  * p.q2[13][_o]) +
			(0xca8dn  * p.q2[12][_o]) +
			(0x6871n  * p.q2[11][_o]) +
			(0x6a91n  * p.q2[10][_o]) +
			(0x9781n  * p.q2[9][_o] ) +
			(0x585dn  * p.q2[8][_o] ) +
			(0x8181n  * p.q2[7][_o] ) +
			(0x45b6n  * p.q2[6][_o] ) +
			(0xb850n  * p.q2[5][_o] ) +
			(0xa029n  * p.q2[4][_o] ) +
			(0xe131n  * p.q2[3][_o] ) +
			(0x4e72n  * p.q2[2][_o] ) +
			(0x3064n  * p.q2[1][_o] )
			    - 0x3f51cn);

		case 17: return (
			(0x8c16n  * p.q2[15][_o]) +
			(0x3c20n  * p.q2[14][_o]) +
			(0xca8dn  * p.q2[13][_o]) +
			(0x6871n  * p.q2[12][_o]) +
			(0x6a91n  * p.q2[11][_o]) +
			(0x9781n  * p.q2[10][_o]) +
			(0x585dn  * p.q2[9][_o] ) +
			(0x8181n  * p.q2[8][_o] ) +
			(0x45b6n  * p.q2[7][_o] ) +
			(0xb850n  * p.q2[6][_o] ) +
			(0xa029n  * p.q2[5][_o] ) +
			(0xe131n  * p.q2[4][_o] ) +
			(0x4e72n  * p.q2[3][_o] ) +
			(0x3064n  * p.q2[2][_o] )
			    - 0x361f0n);

		case 18: return (
			(0x3c20n  * p.q2[15][_o]) +
			(0xca8dn  * p.q2[14][_o]) +
			(0x6871n  * p.q2[13][_o]) +
			(0x6a91n  * p.q2[12][_o]) +
			(0x9781n  * p.q2[11][_o]) +
			(0x585dn  * p.q2[10][_o]) +
			(0x8181n  * p.q2[9][_o] ) +
			(0x45b6n  * p.q2[8][_o] ) +
			(0xb850n  * p.q2[7][_o] ) +
			(0xa029n  * p.q2[6][_o] ) +
			(0xe131n  * p.q2[5][_o] ) +
			(0x4e72n  * p.q2[4][_o] ) +
			(0x3064n  * p.q2[3][_o] )
			    - 0x23058n);

		case 19: return (
			(0xca8dn  * p.q2[15][_o]) +
			(0x6871n  * p.q2[14][_o]) +
			(0x6a91n  * p.q2[13][_o]) +
			(0x9781n  * p.q2[12][_o]) +
			(0x585dn  * p.q2[11][_o]) +
			(0x8181n  * p.q2[10][_o]) +
			(0x45b6n  * p.q2[9][_o] ) +
			(0xb850n  * p.q2[8][_o] ) +
			(0xa029n  * p.q2[7][_o] ) +
			(0xe131n  * p.q2[6][_o] ) +
			(0x4e72n  * p.q2[5][_o] ) +
			(0x3064n  * p.q2[4][_o] )
			    - 0xf080n );

		case 20: return (
			(0x6871n  * p.q2[15][_o]) +
			(0x6a91n  * p.q2[14][_o]) +
			(0x9781n  * p.q2[13][_o]) +
			(0x585dn  * p.q2[12][_o]) +
			(0x8181n  * p.q2[11][_o]) +
			(0x45b6n  * p.q2[10][_o]) +
			(0xb850n  * p.q2[9][_o] ) +
			(0xa029n  * p.q2[8][_o] ) +
			(0xe131n  * p.q2[7][_o] ) +
			(0x4e72n  * p.q2[6][_o] ) +
			(0x3064n  * p.q2[5][_o] )
			    - 0x32a34n);

		case 21: return (
			(0x6a91n  * p.q2[15][_o]) +
			(0x9781n  * p.q2[14][_o]) +
			(0x585dn  * p.q2[13][_o]) +
			(0x8181n  * p.q2[12][_o]) +
			(0x45b6n  * p.q2[11][_o]) +
			(0xb850n  * p.q2[10][_o]) +
			(0xa029n  * p.q2[9][_o] ) +
			(0xe131n  * p.q2[8][_o] ) +
			(0x4e72n  * p.q2[7][_o] ) +
			(0x3064n  * p.q2[6][_o] )
			    - 0x1a1c4n);

		case 22: return (
			(0x9781n  * p.q2[15][_o]) +
			(0x585dn  * p.q2[14][_o]) +
			(0x8181n  * p.q2[13][_o]) +
			(0x45b6n  * p.q2[12][_o]) +
			(0xb850n  * p.q2[11][_o]) +
			(0xa029n  * p.q2[10][_o]) +
			(0xe131n  * p.q2[9][_o] ) +
			(0x4e72n  * p.q2[8][_o] ) +
			(0x3064n  * p.q2[7][_o] )
			    - 0x1aa44n);

		case 23: return (
			(0x585dn  * p.q2[15][_o]) +
			(0x8181n  * p.q2[14][_o]) +
			(0x45b6n  * p.q2[13][_o]) +
			(0xb850n  * p.q2[12][_o]) +
			(0xa029n  * p.q2[11][_o]) +
			(0xe131n  * p.q2[10][_o]) +
			(0x4e72n  * p.q2[9][_o] ) +
			(0x3064n  * p.q2[8][_o] )
			    - 0x25e04n);

		case 24: return (
			(0x8181n  * p.q2[15][_o]) +
			(0x45b6n  * p.q2[14][_o]) +
			(0xb850n  * p.q2[13][_o]) +
			(0xa029n  * p.q2[12][_o]) +
			(0xe131n  * p.q2[11][_o]) +
			(0x4e72n  * p.q2[10][_o]) +
			(0x3064n  * p.q2[9][_o] )
			    - 0x16174n);

		case 25: return (
			(0x45b6n  * p.q2[15][_o]) +
			(0xb850n  * p.q2[14][_o]) +
			(0xa029n  * p.q2[13][_o]) +
			(0xe131n  * p.q2[12][_o]) +
			(0x4e72n  * p.q2[11][_o]) +
			(0x3064n  * p.q2[10][_o])
			    - 0x20604n);

		case 26: return (
			(0xb850n  * p.q2[15][_o]) +
			(0xa029n  * p.q2[14][_o]) +
			(0xe131n  * p.q2[13][_o]) +
			(0x4e72n  * p.q2[12][_o]) +
			(0x3064n  * p.q2[11][_o])
			    - 0x116d8n);

		case 27: return (
			(0xa029n  * p.q2[15][_o]) +
			(0xe131n  * p.q2[14][_o]) +
			(0x4e72n  * p.q2[13][_o]) +
			(0x3064n  * p.q2[12][_o])
			    - 0x2e140n);

		case 28: return (
			(0xe131n  * p.q2[15][_o]) +
			(0x4e72n  * p.q2[14][_o]) +
			(0x3064n  * p.q2[13][_o])
			    - 0x280a4n);

		case 29: return (
			(0x4e72n  * p.q2[15][_o]) +
			(0x3064n  * p.q2[14][_o])
			    - 0x384c4n);

		case 30: return (
			(0x3064n  * p.q2[15][_o])
			    - 0x139c8n);

		case 31: return ( - 0xc190n);
	}
	return 0n;
}
