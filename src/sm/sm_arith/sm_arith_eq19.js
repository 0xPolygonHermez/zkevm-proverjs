/*
* no generated code, manual code for operation 256TO384
*/

module.exports.calculate = function (p, step, _o)
{
	switch(step) {
		case 0: return (p.x1[0][_o] + 0x10000n * p.x1[1][_o] - p.y3[0][_o]);
		case 1: return (0x100n * p.x1[2][_o] - p.y3[1][_o]);
		case 2: return (p.x1[3][_o] + 0x10000n * p.x1[5][_o] - p.y3[2][_o]);
		case 3: return (0x100n * p.x1[5][_o] - p.y3[3][_o]);
		case 4: return (p.x1[6][_o] + 0x10000n * p.x1[7][_o] - p.y3[4][_o]);
		case 5: return (0x100n * p.x1[8][_o] - p.y3[5][_o]);
		case 6: return (p.x1[9][_o] + 0x10000n * p.x1[10][_o] - p.y3[6][_o]);
		case 7: return (0x100n * p.x1[11][_o] - p.y3[7][_o]);
		case 8: return (p.x1[12][_o] + 0x10000n * p.x1[13][_o] - p.y3[8][_o]);
		case 9: return (0x100n * p.x1[14][_o] - p.y3[9][_o]);
		case 10: return (p.x1[15][_o] + 0x10000n * p.y1[0][_o] - p.y3[10][_o]);
		case 11: return (0x100n * p.y1[1][_o] - p.y3[11][_o]);
		case 12: return (p.y1[2][_o] + 0x10000n * p.y1[3][_o] - p.y3[12][_o]);
		case 13: return (0x100n * p.y1[4][_o] - p.y3[13][_o]);
		case 14: return (p.y1[5][_o] + 0x10000n * p.y1[6][_o] - p.y3[14][_o]);
		case 15: return (0x100n * p.y1[7][_o] - p.y3[15][_o]);

        case 19: return p.y1[8][_o];
        case 20: return p.y1[9][_o];
        case 21: return p.y1[10][_o];
        case 22: return p.y1[11][_o];
        case 23: return p.y1[12][_o];
        case 24: return p.y1[13][_o];
        case 25: return p.y1[14][_o];
        case 26: return p.y1[15][_o];
	}
	return 0n;
}
