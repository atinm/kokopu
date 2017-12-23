/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chess, a JavaScript chess library.             *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


'use strict';


var RPBChess = require('../src/core.js');
var generateSuccessors = require('./common/generatesuccessors');
var readCSV = require('./common/readcsv');
var test = require('unit.js');


var DEPTH_MAX = 5;
var SPEED_MAX = 100; // kN/s
var FIXED_TIMOUT = 100; // ms


function testData() {
	return readCSV('performance.csv', function(fields) {
		return {
			fen: fields[0],
			nodes: fields.slice(1, DEPTH_MAX + 2)
		};
	});
}


describe('Recursive move generation', function() {
	testData().forEach(function(elem) {
		var initialPos = new RPBChess.Position(elem.fen);
		elem.nodes.forEach(function(expectedNodeCount, depth) {
			it('From ' + elem.fen + ' up to depth ' + depth, function() {
				test.value(generateSuccessors(initialPos, depth), expectedNodeCount);
			}).timeout(FIXED_TIMOUT + expectedNodeCount / SPEED_MAX);
		});
	});
});