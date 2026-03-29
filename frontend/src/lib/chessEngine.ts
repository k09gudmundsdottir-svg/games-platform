// Full chess move validation engine

export type Board = string[][];
export type Pos = [number, number];

export interface GameState {
  board: Board;
  turn: "white" | "black";
  castling: { K: boolean; Q: boolean; k: boolean; q: boolean }; // king/queenside for each color
  enPassantTarget: Pos | null; // square that can be captured en passant
  halfmoveClock: number;
  fullmoveNumber: number;
}

export interface MoveResult {
  newState: GameState;
  captured: string;
  isPromotion: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  notation: string;
}

const isWhitePiece = (p: string) => p !== "" && p === p.toUpperCase();
const isBlackPiece = (p: string) => p !== "" && p === p.toLowerCase();
const isOwnPiece = (p: string, turn: "white" | "black") =>
  turn === "white" ? isWhitePiece(p) : isBlackPiece(p);
const isEnemyPiece = (p: string, turn: "white" | "black") =>
  p !== "" && !isOwnPiece(p, turn);
const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const cloneBoard = (b: Board): Board => b.map(row => [...row]);

export const createInitialState = (): GameState => ({
  board: [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ],
  turn: "white",
  castling: { K: true, Q: true, k: true, q: true },
  enPassantTarget: null,
  halfmoveClock: 0,
  fullmoveNumber: 1,
});

// Find king position
const findKing = (board: Board, color: "white" | "black"): Pos => {
  const king = color === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === king) return [r, c];
  return [-1, -1]; // should never happen
};

// Generate raw moves for a piece (no check filtering)
const rawMovesForPiece = (
  board: Board,
  r: number,
  c: number,
  state: GameState
): Pos[] => {
  const piece = board[r][c];
  if (!piece) return [];
  const turn = isWhitePiece(piece) ? "white" : "black";
  const moves: Pos[] = [];

  const addIfValid = (tr: number, tc: number) => {
    if (!inBounds(tr, tc)) return false;
    if (isOwnPiece(board[tr][tc], turn)) return false;
    moves.push([tr, tc]);
    return board[tr][tc] === ""; // continue sliding if empty
  };

  const slide = (dr: number, dc: number) => {
    for (let i = 1; i < 8; i++) {
      if (!addIfValid(r + dr * i, c + dc * i)) break;
    }
  };

  const type = piece.toLowerCase();

  if (type === "p") {
    const dir = turn === "white" ? -1 : 1;
    const startRow = turn === "white" ? 6 : 1;
    // Forward
    if (inBounds(r + dir, c) && board[r + dir][c] === "") {
      moves.push([r + dir, c]);
      if (r === startRow && board[r + 2 * dir][c] === "") {
        moves.push([r + 2 * dir, c]);
      }
    }
    // Captures
    for (const dc of [-1, 1]) {
      const tr = r + dir, tc = c + dc;
      if (inBounds(tr, tc)) {
        if (isEnemyPiece(board[tr][tc], turn)) moves.push([tr, tc]);
        // En passant
        if (state.enPassantTarget && state.enPassantTarget[0] === tr && state.enPassantTarget[1] === tc) {
          moves.push([tr, tc]);
        }
      }
    }
  } else if (type === "n") {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      addIfValid(r + dr, c + dc);
    }
  } else if (type === "b") {
    slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
  } else if (type === "r") {
    slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
  } else if (type === "q") {
    slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
    slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
  } else if (type === "k") {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr !== 0 || dc !== 0) addIfValid(r + dr, c + dc);

    // Castling
    const row = turn === "white" ? 7 : 0;
    if (r === row && c === 4) {
      // Kingside
      const ksKey = turn === "white" ? "K" : "k";
      if (state.castling[ksKey as keyof typeof state.castling] &&
          board[row][5] === "" && board[row][6] === "" &&
          board[row][7].toLowerCase() === "r") {
        // Check squares king passes through are not attacked
        if (!isSquareAttacked(board, [row, 4], turn) &&
            !isSquareAttacked(board, [row, 5], turn) &&
            !isSquareAttacked(board, [row, 6], turn)) {
          moves.push([row, 6]);
        }
      }
      // Queenside
      const qsKey = turn === "white" ? "Q" : "q";
      if (state.castling[qsKey as keyof typeof state.castling] &&
          board[row][3] === "" && board[row][2] === "" && board[row][1] === "" &&
          board[row][0].toLowerCase() === "r") {
        if (!isSquareAttacked(board, [row, 4], turn) &&
            !isSquareAttacked(board, [row, 3], turn) &&
            !isSquareAttacked(board, [row, 2], turn)) {
          moves.push([row, 2]);
        }
      }
    }
  }

  return moves;
};

// Check if a square is attacked by the opponent
const isSquareAttacked = (board: Board, pos: Pos, defendingColor: "white" | "black"): boolean => {
  const [r, c] = pos;
  const attackColor = defendingColor === "white" ? "black" : "white";

  // Knight attacks
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const tr = r + dr, tc = c + dc;
    if (inBounds(tr, tc)) {
      const p = board[tr][tc];
      if (p.toLowerCase() === "n" && isOwnPiece(p, attackColor)) return true;
    }
  }

  // Sliding attacks (bishop/rook/queen)
  const directions = [
    { dr: 1, dc: 0, pieces: ["r", "q"] },
    { dr: -1, dc: 0, pieces: ["r", "q"] },
    { dr: 0, dc: 1, pieces: ["r", "q"] },
    { dr: 0, dc: -1, pieces: ["r", "q"] },
    { dr: 1, dc: 1, pieces: ["b", "q"] },
    { dr: 1, dc: -1, pieces: ["b", "q"] },
    { dr: -1, dc: 1, pieces: ["b", "q"] },
    { dr: -1, dc: -1, pieces: ["b", "q"] },
  ];

  for (const { dr, dc, pieces } of directions) {
    for (let i = 1; i < 8; i++) {
      const tr = r + dr * i, tc = c + dc * i;
      if (!inBounds(tr, tc)) break;
      const p = board[tr][tc];
      if (p === "") continue;
      if (isOwnPiece(p, attackColor) && pieces.includes(p.toLowerCase())) return true;
      break; // blocked
    }
  }

  // Pawn attacks
  const pawnDir = defendingColor === "white" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const tr = r + pawnDir, tc = c + dc;
    if (inBounds(tr, tc)) {
      const p = board[tr][tc];
      if (p.toLowerCase() === "p" && isOwnPiece(p, attackColor)) return true;
    }
  }

  // King attacks
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const tr = r + dr, tc = c + dc;
      if (inBounds(tr, tc)) {
        const p = board[tr][tc];
        if (p.toLowerCase() === "k" && isOwnPiece(p, attackColor)) return true;
      }
    }

  return false;
};

export const isInCheck = (board: Board, color: "white" | "black"): boolean => {
  const kingPos = findKing(board, color);
  return isSquareAttacked(board, kingPos, color);
};

// Simulate a move and check if it leaves own king in check
const simulateMove = (board: Board, from: Pos, to: Pos, state: GameState): Board => {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from[0]][from[1]];
  const turn = isWhitePiece(piece) ? "white" : "black";

  // En passant capture
  if (piece.toLowerCase() === "p" && state.enPassantTarget &&
      to[0] === state.enPassantTarget[0] && to[1] === state.enPassantTarget[1]) {
    const capturedRow = turn === "white" ? to[0] + 1 : to[0] - 1;
    newBoard[capturedRow][to[1]] = "";
  }

  // Castling rook move
  if (piece.toLowerCase() === "k" && Math.abs(to[1] - from[1]) === 2) {
    const row = from[0];
    if (to[1] === 6) { newBoard[row][5] = newBoard[row][7]; newBoard[row][7] = ""; }
    if (to[1] === 2) { newBoard[row][3] = newBoard[row][0]; newBoard[row][0] = ""; }
  }

  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = "";
  return newBoard;
};

// Get all legal moves for a piece (filtered for check)
export const getLegalMoves = (state: GameState, from: Pos): Pos[] => {
  const piece = state.board[from[0]][from[1]];
  if (!piece) return [];
  const color = isWhitePiece(piece) ? "white" : "black";
  if (color !== state.turn) return [];

  const raw = rawMovesForPiece(state.board, from[0], from[1], state);
  return raw.filter(to => {
    const newBoard = simulateMove(state.board, from, to, state);
    return !isInCheck(newBoard, color);
  });
};

// Check if a player has any legal moves
export const hasLegalMoves = (state: GameState): boolean => {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c];
      if (piece && isOwnPiece(piece, state.turn)) {
        if (getLegalMoves(state, [r, c]).length > 0) return true;
      }
    }
  return false;
};

export const isCheckmate = (state: GameState): boolean =>
  isInCheck(state.board, state.turn) && !hasLegalMoves(state);

export const isStalemate = (state: GameState): boolean =>
  !isInCheck(state.board, state.turn) && !hasLegalMoves(state);

const fileChar = (c: number) => "abcdefgh"[c];
const rankChar = (r: number) => String(8 - r);

// Execute a legal move and return new state
export const makeMove = (state: GameState, from: Pos, to: Pos, promoteTo?: string): MoveResult => {
  const piece = state.board[from[0]][from[1]];
  const turn = state.turn;
  const newBoard = cloneBoard(state.board);
  let captured = newBoard[to[0]][to[1]];
  let isEnPassant = false;
  let isCastling = false;
  let isPromotion = false;

  // En passant
  if (piece.toLowerCase() === "p" && state.enPassantTarget &&
      to[0] === state.enPassantTarget[0] && to[1] === state.enPassantTarget[1]) {
    const capturedRow = turn === "white" ? to[0] + 1 : to[0] - 1;
    captured = newBoard[capturedRow][to[1]];
    newBoard[capturedRow][to[1]] = "";
    isEnPassant = true;
  }

  // Castling
  if (piece.toLowerCase() === "k" && Math.abs(to[1] - from[1]) === 2) {
    isCastling = true;
    const row = from[0];
    if (to[1] === 6) { newBoard[row][5] = newBoard[row][7]; newBoard[row][7] = ""; }
    if (to[1] === 2) { newBoard[row][3] = newBoard[row][0]; newBoard[row][0] = ""; }
  }

  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = "";

  // Pawn promotion
  const promoRow = turn === "white" ? 0 : 7;
  if (piece.toLowerCase() === "p" && to[0] === promoRow) {
    isPromotion = true;
    const promo = promoteTo || (turn === "white" ? "Q" : "q");
    newBoard[to[0]][to[1]] = promo;
  }

  // Update castling rights
  const newCastling = { ...state.castling };
  if (piece === "K") { newCastling.K = false; newCastling.Q = false; }
  if (piece === "k") { newCastling.k = false; newCastling.q = false; }
  if (piece === "R" && from[0] === 7 && from[1] === 7) newCastling.K = false;
  if (piece === "R" && from[0] === 7 && from[1] === 0) newCastling.Q = false;
  if (piece === "r" && from[0] === 0 && from[1] === 7) newCastling.k = false;
  if (piece === "r" && from[0] === 0 && from[1] === 0) newCastling.q = false;
  // If rook captured
  if (to[0] === 0 && to[1] === 7) newCastling.k = false;
  if (to[0] === 0 && to[1] === 0) newCastling.q = false;
  if (to[0] === 7 && to[1] === 7) newCastling.K = false;
  if (to[0] === 7 && to[1] === 0) newCastling.Q = false;

  // En passant target
  let newEnPassant: Pos | null = null;
  if (piece.toLowerCase() === "p" && Math.abs(to[0] - from[0]) === 2) {
    newEnPassant = [(from[0] + to[0]) / 2, from[1]];
  }

  // Notation
  let notation = "";
  if (isCastling) {
    notation = to[1] === 6 ? "O-O" : "O-O-O";
  } else {
    const pieceChar = piece.toLowerCase() === "p" ? "" : piece.toUpperCase();
    const captureChar = captured ? "x" : "";
    const fromFile = piece.toLowerCase() === "p" && captured ? fileChar(from[1]) : "";
    const dest = fileChar(to[1]) + rankChar(to[0]);
    const promoStr = isPromotion ? "=" + (promoteTo || "Q").toUpperCase() : "";
    notation = (pieceChar || fromFile) + captureChar + dest + promoStr;
  }

  const nextTurn = turn === "white" ? "black" : "white";
  const newState: GameState = {
    board: newBoard,
    turn: nextTurn,
    castling: newCastling,
    enPassantTarget: newEnPassant,
    halfmoveClock: piece.toLowerCase() === "p" || captured ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: turn === "black" ? state.fullmoveNumber + 1 : state.fullmoveNumber,
  };

  // Add check/checkmate symbols
  if (isCheckmate(newState)) notation += "#";
  else if (isInCheck(newBoard, nextTurn)) notation += "+";

  return { newState, captured, isPromotion, isCastling, isEnPassant, notation };
};
