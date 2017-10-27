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


var bt = require('./basetypes');
var attacks = require('./attacks');
var legality = require('./legality');
var moveDescriptor = require('./movedescriptor');


// Displacement lookup per square index difference.
var /* const */ DISPLACEMENT_LOOKUP = [
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  768, 2255, 2111, 2255,  768,    0,    0,    0,    0,    0,    0,
	60,   60,   60,   60,   60,   60,   63,    0,   63,   60,   60,   60,   60,   60,   60,    0,
	 0,    0,    0,    0,    0,  768, 1231, 1087, 1231,  768,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,    0,  204,  768,   60,  768,  204,    0,    0,    0,    0,    0,    0,
	 0,    0,    0,    0,  204,    0,    0,   60,    0,    0,  204,    0,    0,    0,    0,    0,
	 0,    0,    0,  204,    0,    0,    0,   60,    0,    0,    0,  204,    0,    0,    0,    0,
	 0,    0,  204,    0,    0,    0,    0,   60,    0,    0,    0,    0,  204,    0,    0,    0,
	 0,  204,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,  204,    0,    0,
 204,    0,    0,    0,    0,    0,    0,   60,    0,    0,    0,    0,    0,    0,  204,    0
];

// Sliding direction
var /* const */ SLIDING_DIRECTION = [
	-17,   0,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0,   0, -15,   0,
		0, -17,   0,   0,   0,   0,   0, -16,   0,   0,   0,   0,   0, -15,   0,   0,
		0,   0, -17,   0,   0,   0,   0, -16,   0,   0,   0,   0, -15,   0,   0,   0,
		0,   0,   0, -17,   0,   0,   0, -16,   0,   0,   0, -15,   0,   0,   0,   0,
		0,   0,   0,   0, -17,   0,   0, -16,   0,   0, -15,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0, -17,   0, -16,   0, -15,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,   0, -17, -16, -15,   0,   0,   0,   0,   0,   0,   0,
	 -1,  -1,  -1,  -1,  -1,  -1,  -1,   0,   1,   1,   1,   1,   1,   1,   1,   0,
		0,   0,   0,   0,   0,   0,  15,  16,  17,   0,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,   0,  15,   0,  16,   0,  17,   0,   0,   0,   0,   0,   0,
		0,   0,   0,   0,  15,   0,   0,  16,   0,   0,  17,   0,   0,   0,   0,   0,
		0,   0,   0,  15,   0,   0,   0,  16,   0,   0,   0,  17,   0,   0,   0,   0,
		0,   0,  15,   0,   0,   0,   0,  16,   0,   0,   0,   0,  17,   0,   0,   0,
		0,  15,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,  17,   0,   0,
	 15,   0,   0,   0,   0,   0,   0,  16,   0,   0,   0,   0,   0,   0,  17,   0
];


exports.isCheck = function(position) {
	return legality.isLegal(position) && attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


exports.isCheckmate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


exports.isStalemate = function(position) {
	return legality.isLegal(position) && !hasMove(position) && !attacks.isAttacked(position, position._king[position._turn], 1-position._turn);
};


var hasMove = exports.hasMove = function(position) {
	function MoveFound() {}
	try {
		generateMoves(position, function(descriptor) {
			if(descriptor) { throw new MoveFound(); }
		});
		return false;
	}
	catch(err) {
		if(err instanceof MoveFound) { return true; }
		else { throw err; }
	}
};


exports.moves = function(position) {
	var res = [];
	generateMoves(position, function(descriptor, generatePromotions) {
		if(descriptor) {
			if(generatePromotions) {
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.QUEEN , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.ROOK  , descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.BISHOP, descriptor._optionalPiece));
				res.push(moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._turn, bt.KNIGHT, descriptor._optionalPiece));
			}
			else {
				res.push(descriptor);
			}
		}
	});
	return res;
};


/**
 * Generate all the legal moves of the given position.
 */
function generateMoves(position, fun) {

	// Ensure that the position is legal.
	if(!position.isLegal()) { return; }

	// For all potential 'from' square...
	for(var from=0; from<120; from += (from /* jshint bitwise:false */ & 0x7 /* jshint bitwise:true */)===7 ? 9 : 1) {

		// Nothing to do if the current square does not contain a piece of the right color.
		var fromContent = position._board[from];
		var movingPiece = Math.floor(fromContent / 2);
		if(fromContent < 0 || fromContent%2 !== position._turn) {
			continue;
		}

		// Generate moves for pawns
		if(movingPiece === bt.PAWN) {

			// Capturing moves
			var attackDirections = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<attackDirections.length; ++i) {
				var to = from + attackDirections[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent >= 0 && toContent%2 !== position._turn) { // regular capturing move
						fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);
					}
					else if(toContent < 0 && to === (5-position._turn*3)*16 + position._enPassant) { // en-passant move
						fun(isKingSafeAfterMove(position, from, to, (4-position._turn)*16 + position._enPassant), false);
					}
				}
			}

			// Non-capturing moves
			var moveDirection = 16 - position._turn*32;
			var to = from + moveDirection;
			if(position._board[to] < 0) {
				fun(isKingSafeAfterMove(position, from, to, -1), to<8 || to>=112);

				// 2-square pawn move
				var firstSquareOfRow = (1 + position._turn*5) * 16;
				if(from>=firstSquareOfRow && from<firstSquareOfRow+8) {
					to += moveDirection;
					if(position._board[to] < 0) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}
		
		// Generate moves for non-sliding non-pawn pieces
		else if(movingPiece===bt.KNIGHT || movingPiece===bt.KING) {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				var to = from + directions[i];
				if((to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
				}
			}
		}

		// Generate moves for sliding pieces
		else {
			var directions = attacks.ATTACK_DIRECTIONS[fromContent];
			for(var i=0; i<directions.length; ++i) {
				for(var to=from+directions[i]; (to /* jshint bitwise:false */ & 0x88 /* jshint bitwise:true */)===0; to+=directions[i]) {
					var toContent = position._board[to];
					if(toContent < 0 || toContent%2 !== position._turn) {
						fun(isKingSafeAfterMove(position, from, to, -1), false);
					}
					if(toContent >= 0) { break; }
				}
			}
		}

		// Generate castling moves
		if(movingPiece === bt.KING && position._castling[position._turn] !== 0) {
			var to = [from-2, from+2];
			for(var i=0; i<to.length; ++i) {
				fun(isCastlingLegal(position, from, to[i]), false);
			}
		}
	}
}


/**
 * Check whether the current player king is in check after moving from `from` to `to`.
 *
 * This function implements the verification steps (7) to (9) as defined in {@link #isMoveLegal}
 *
 * @param {number} enPassantSquare Index of the square where the "en-passant" taken pawn lies if any, `-1` otherwise.
 * @returns {boolean|MoveDescriptor} The move descriptor if the move is legal, `false` otherwise.
 */
function isKingSafeAfterMove(position, from, to, enPassantSquare) {
	var fromContent = position._board[from];
	var toContent   = position._board[to  ];
	var movingPiece = Math.floor(fromContent / 2);

	// Step (7) -> Execute the displacement (castling moves are processed separately).
	position._board[to  ] = fromContent;
	position._board[from] = bt.EMPTY;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = bt.EMPTY;
	}

	// Step (8) -> Is the king safe after the displacement?
	var kingSquare    = movingPiece===bt.KING ? to : position._king[position._turn];
	var kingIsInCheck = attacks.isAttacked(position, kingSquare, 1-position._turn);

	// Step (9) -> Reverse the displacement.
	position._board[from] = fromContent;
	position._board[to  ] = toContent;
	if(enPassantSquare >= 0) {
		position._board[enPassantSquare] = bt.PAWN*2 + 1-position._turn;
	}

	// Final result
	if(kingIsInCheck) {
		return false;
	}
	else {
		if(enPassantSquare >= 0) {
			return moveDescriptor.makeEnPassant(from, to, enPassantSquare, position._turn);
		}
		else {
			return moveDescriptor.make(from, to, position._turn, movingPiece, toContent);
		}
	}
}


/**
 * Delegated method for checking whether a castling move is legal or not.
 *
 * TODO: make it chess-960 compatible.
 */
function isCastlingLegal(position, from, to) {

	// Ensure that the given underlying castling is allowed.
	var column = from < to ? 7 : 0;
	if((position._castling[position._turn] /* jshint bitwise:false */ & 1<<column /* jshint bitwise:true */) === 0) {
		return false;
	}

	// Origin and destination squares of the rook involved in the move.
	var rookFrom = column + position._turn*112;
	var rookTo   = (from + to) / 2;

	// Ensure that each square between the king and the rook is empty.
	var offset = from < rookFrom ? 1 : -1;
	for(var sq=from+offset; sq!==rookFrom; sq+=offset) {
		if(position._board[sq] !== bt.EMPTY) { return false; }
	}

	// The origin and destination squares of the king, and the square between them must not be attacked.
	var byWho = 1-position._turn;
	if(attacks.isAttacked(position, from, byWho) || attacks.isAttacked(position, to, byWho) || attacks.isAttacked(position, rookTo, byWho)) {
		return false;
	}

	// The move is legal -> generate the move descriptor.
	return moveDescriptor.makeCastling(from, to, rookFrom, rookTo, position._turn);
}


/**
 * Core algorithm to determine whether a move is legal or not. The verification flow is the following:
 *
 *  1. Ensure that the position itself is legal.
 *  2. Ensure that the origin square contains a piece (denoted as the moving-piece)
 *     whose color is the same than the color of the player about to play.
 *  4. Ensure that the displacement is geometrically correct, with respect to the moving piece.
 *  5. Check the content of the destination square.
 *  6. For the sliding pieces (and in case of a 2-square pawn move), ensure that there is no piece
 *     on the trajectory.
 *
 * The move is almost ensured to be legal at this point. The last condition to check
 * is whether the king of the current player will be in check after the move or not.
 *
 *  7. Execute the displacement from the origin to the destination square, in such a way that
 *     it can be reversed. Only the state of the board is updated at this point.
 *  8. Look for king attacks.
 *  9. Reverse the displacement.
 *
 * Castling moves fail at step (4). They are taken out of this flow and processed
 * by the dedicated method `isLegalCastling()`.
 */
exports.isMoveLegal = function(position, from, to) {

	// Step (1)
	if(!legality.isLegal(position)) { return false; }

	// Step (2)
	var fromContent = position._board[from];
	var toContent   = position._board[to  ];
	var movingPiece = Math.floor(fromContent / 2);
	if(fromContent < 0 || fromContent%2 !== position._turn) { return false; }

	// Miscellaneous variables
	var displacement = to - from + 119;
	var enPassantSquare = -1; // square where a pawn is taken if the move is "en-passant"
	var isTwoSquarePawnMove = false;
	var isPromotion = movingPiece===bt.PAWN && (to<8 || to>=112);

	// Step (4)
	if((DISPLACEMENT_LOOKUP[displacement] /* jshint bitwise:false */ & 1<<fromContent /* jshint bitwise:true */) === 0) {
		if(movingPiece === bt.PAWN && displacement === 151-position._turn*64) {
			var firstSquareOfRow = (1 + position._turn*5) * 16;
			if(from < firstSquareOfRow || from >= firstSquareOfRow+8) { return false; }
			isTwoSquarePawnMove = true;
		}
		else if(movingPiece === bt.KING && (displacement === 117 || displacement === 121)) {
			return isCastlingLegal(position, from, to);
		}
		else {
			return false;
		}
	}

	// Step (5) -> check the content of the destination square
	if(movingPiece === bt.PAWN) {
		if(displacement === 135-position._turn*32 || isTwoSquarePawnMove) { // non-capturing pawn move
			if(toContent !== bt.EMPTY) { return false; }
		}
		else if(toContent === bt.EMPTY) { // en-passant pawn move
			if(position._enPassant < 0 || to !== (5-position._turn*3)*16 + position._enPassant) { return false; }
			enPassantSquare = (4-position._turn)*16 + position._enPassant;
		}
		else { // regular capturing pawn move
			if(toContent%2 === position._turn) { return false; }
		}
	}
	else { // piece move
		if(toContent >= 0 && toContent%2 === position._turn) { return false; }
	}

	// Step (6) -> For sliding pieces, ensure that there is nothing between the origin and the destination squares.
	if(movingPiece === bt.BISHOP || movingPiece === bt.ROOK || movingPiece === bt.QUEEN) {
		var direction = SLIDING_DIRECTION[displacement];
		for(var sq=from + direction; sq !== to; sq += direction) {
			if(position._board[sq] !== bt.EMPTY) { return false; }
		}
	}
	else if(isTwoSquarePawnMove) { // two-square pawn moves also require this test.
		if(position._board[(from + to) / 2] !== bt.EMPTY) { return false; }
	}

	// Steps (7) to (9) are delegated to `isKingSafeAfterMove`.
	var descriptor = isKingSafeAfterMove(position, from, to, enPassantSquare);
	return descriptor && isPromotion ? function(promotion) {
		if(promotion === bt.QUEEN || promotion === bt.ROOK || promotion === bt.BISHOP || promotion === bt.KNIGHT) {
			return moveDescriptor.makePromotion(descriptor._from, descriptor._to, position._movingPiece % 2, promotion, descriptor._optionalPiece);
		}
		return false;
	} : descriptor;
};
