/*
* no generated code, manual code for operation 256TO384
*/

module.exports.calculate = function (p, step, _o)
{
	switch(step) {
		case 0: return (p.x1[0][_o] + 0x10000n * p.x1[1][_o] - p.y3[0][_o]);
		case 1: return (0x40000n * p.x1[2][_o] - p.y3[1][_o]);
		case 2: return (p.x1[3][_o] + 0x10000n * p.x1[5][_o] - p.y3[2][_o]);
		case 3: return (0x40000n * p.x1[5][_o] - p.y3[3][_o]);
		case 4: return (p.x1[6][_o] + 0x10000n * p.x1[7][_o] - p.y3[4][_o]);

		case 5: return (0x40000n * p.y1[0][_o] - p.y3[5][_o]);
		case 6: return (p.y1[1][_o] + 0x10000n * p.y1[2][_o] - p.y3[6][_o]);
		case 7: return (0x40000n * p.y1[3][_o] - p.y3[7][_o]);
	}
	return 0n;
}
