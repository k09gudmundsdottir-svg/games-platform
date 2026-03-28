import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../lib/api';
import { useRealtime } from '../../../hooks/useRealtime';
import JitsiPanel from '../../shared/JitsiPanel';

// ─── Piece definitions ────────────────────────────────────────────────────────
const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const PIECE_NAMES = {
  K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// ─── Initial board setup ──────────────────────────────────────────────────────
function createInitialBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRank[col].toLowerCase(), color: 'black' };
    board[1][col] = { type: 'p', color: 'black' };
    board[6][col] = { type: 'P', color: 'white' };
    board[7][col] = { type: backRank[col], color: 'white' };
  }
  return board;
}

// ─── Chess logic helpers ──────────────────────────────────────────────────────
function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isWhite(piece) {
  return piece && piece.color === 'white';
}

function isBlack(piece) {
  return piece && piece.color === 'black';
}

function isEnemy(piece, color) {
  return piece && piece.color !== color;
}

function isAlly(piece, color) {
  return piece && piece.color === color;
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function findKing(board, color) {
  const kingType = color === 'white' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].type === kingType) {
        return [r, c];
      }
    }
  }
  return null;
}

function getRawMoves(board, row, col, castling, enPassant) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const color = piece.color;
  const type = piece.type.toUpperCase();

  const addIfValid = (r, c) => {
    if (inBounds(r, c) && !isAlly(board[r][c], color)) {
      moves.push([r, c]);
    }
  };

  const addSliding = (dirs) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        if (isAlly(board[r][c], color)) break;
        moves.push([r, c]);
        if (isEnemy(board[r][c], color)) break;
        r += dr;
        c += dc;
      }
    }
  };

  switch (type) {
    case 'P': {
      const dir = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      // Forward
      if (inBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const nr = row + dir, nc = col + dc;
        if (inBounds(nr, nc) && isEnemy(board[nr][nc], color)) {
          moves.push([nr, nc]);
        }
        // En passant
        if (enPassant && enPassant[0] === nr && enPassant[1] === nc) {
          moves.push([nr, nc]);
        }
      }
      break;
    }
    case 'N':
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        addIfValid(row + dr, col + dc);
      }
      break;
    case 'B':
      addSliding([[-1,-1],[-1,1],[1,-1],[1,1]]);
      break;
    case 'R':
      addSliding([[-1,0],[1,0],[0,-1],[0,1]]);
      break;
    case 'Q':
      addSliding([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
      break;
    case 'K':
      for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        addIfValid(row + dr, col + dc);
      }
      // Castling
      if (castling) {
        const baseRow = color === 'white' ? 7 : 0;
        if (row === baseRow && col === 4) {
          // Kingside
          const ks = color === 'white' ? 'K' : 'k';
          if (castling.includes(ks) && !board[baseRow][5] && !board[baseRow][6] &&
              board[baseRow][7] && board[baseRow][7].type === (color === 'white' ? 'R' : 'r')) {
            if (!isSquareAttacked(board, baseRow, 4, color) &&
                !isSquareAttacked(board, baseRow, 5, color) &&
                !isSquareAttacked(board, baseRow, 6, color)) {
              moves.push([baseRow, 6]);
            }
          }
          // Queenside
          const qs = color === 'white' ? 'Q' : 'q';
          if (castling.includes(qs) && !board[baseRow][3] && !board[baseRow][2] && !board[baseRow][1] &&
              board[baseRow][0] && board[baseRow][0].type === (color === 'white' ? 'R' : 'r')) {
            if (!isSquareAttacked(board, baseRow, 4, color) &&
                !isSquareAttacked(board, baseRow, 3, color) &&
                !isSquareAttacked(board, baseRow, 2, color)) {
              moves.push([baseRow, 2]);
            }
          }
        }
      }
      break;
  }
  return moves;
}

function isSquareAttacked(board, row, col, byColor) {
  const enemyColor = byColor === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === enemyColor) {
        // Use raw moves without castling to avoid infinite loop
        const moves = getRawMoves(board, r, c, '', null);
        if (moves.some(([mr, mc]) => mr === row && mc === col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king[0], king[1], color);
}

function getLegalMoves(board, row, col, castling, enPassant) {
  const piece = board[row][col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, row, col, castling, enPassant);
  const legalMoves = [];

  for (const [mr, mc] of rawMoves) {
    const testBoard = cloneBoard(board);
    // Handle en passant capture
    const type = piece.type.toUpperCase();
    if (type === 'P' && enPassant && mr === enPassant[0] && mc === enPassant[1]) {
      const capturedRow = piece.color === 'white' ? mr + 1 : mr - 1;
      testBoard[capturedRow][mc] = null;
    }
    testBoard[mr][mc] = testBoard[row][col];
    testBoard[row][col] = null;
    // Handle castling rook movement
    if (type === 'K' && Math.abs(mc - col) === 2) {
      const baseRow = piece.color === 'white' ? 7 : 0;
      if (mc === 6) { // Kingside
        testBoard[baseRow][5] = testBoard[baseRow][7];
        testBoard[baseRow][7] = null;
      } else if (mc === 2) { // Queenside
        testBoard[baseRow][3] = testBoard[baseRow][0];
        testBoard[baseRow][0] = null;
      }
    }
    if (!isInCheck(testBoard, piece.color)) {
      legalMoves.push([mr, mc]);
    }
  }
  return legalMoves;
}

function hasAnyLegalMove(board, color, castling, enPassant) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c].color === color) {
        if (getLegalMoves(board, r, c, castling, enPassant).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

function toAlgebraic(row, col) {
  return `${FILES[col]}${8 - row}`;
}

function getMoveNotation(board, fromRow, fromCol, toRow, toCol, promotion, resultBoard) {
  const piece = board[fromRow][fromCol];
  if (!piece) return '';
  const type = piece.type.toUpperCase();
  const capture = board[toRow][toCol] !== null ||
    (type === 'P' && fromCol !== toCol); // en passant

  // Castling
  if (type === 'K' && Math.abs(toCol - fromCol) === 2) {
    return toCol === 6 ? 'O-O' : 'O-O-O';
  }

  let notation = '';

  if (type === 'P') {
    if (capture) notation += FILES[fromCol];
  } else {
    notation += type;
  }

  if (capture) notation += 'x';
  notation += toAlgebraic(toRow, toCol);

  if (promotion) {
    notation += '=' + promotion.toUpperCase();
  }

  // Check/checkmate
  if (resultBoard) {
    const enemyColor = piece.color === 'white' ? 'black' : 'white';
    if (isInCheck(resultBoard, enemyColor)) {
      if (!hasAnyLegalMove(resultBoard, enemyColor, '', null)) {
        notation += '#';
      } else {
        notation += '+';
      }
    }
  }

  return notation;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChessGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(createInitialBoard);
  const [turn, setTurn] = useState('white');
  const [selected, setSelected] = useState(null); // [row, col]
  const [legalMoves, setLegalMoves] = useState([]);
  const [castling, setCastling] = useState('KQkq');
  const [enPassant, setEnPassant] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]); // pieces captured by black (white pieces lost)
  const [capturedBlack, setCapturedBlack] = useState([]); // pieces captured by white (black pieces lost)
  const [gameStatus, setGameStatus] = useState('playing'); // playing, check, checkmate, stalemate, resigned
  const [winner, setWinner] = useState(null);
  const [promotionPending, setPromotionPending] = useState(null); // { row, col, fromRow, fromCol }
  const [showJitsi, setShowJitsi] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  const [lastMove, setLastMove] = useState(null); // { from: [r,c], to: [r,c] }

  const playerId = localStorage.getItem('player_id');
  const playerName = localStorage.getItem('player_name') || 'Player';

  // Load initial game state from server
  useEffect(() => {
    async function fetchState() {
      try {
        const state = await api.games.getState(roomCode);
        if (state?.board) applyServerState(state);
      } catch {
        // Use local state if server unavailable
      }
    }
    fetchState();
  }, [roomCode]);

  function applyServerState(state) {
    if (state.board) setBoard(state.board);
    if (state.turn) setTurn(state.turn);
    if (state.castling !== undefined) setCastling(state.castling);
    if (state.en_passant !== undefined) setEnPassant(state.en_passant);
    if (state.move_history) setMoveHistory(state.move_history);
    if (state.captured_white) setCapturedWhite(state.captured_white);
    if (state.captured_black) setCapturedBlack(state.captured_black);
    if (state.status) setGameStatus(state.status);
    if (state.winner) setWinner(state.winner);
    if (state.player_color) setPlayerColor(state.player_color);
    if (state.last_move) setLastMove(state.last_move);
  }

  // Realtime subscription
  const handleRealtimeUpdate = useCallback((newState) => {
    if (newState?.state) applyServerState(newState.state);
  }, []);

  useRealtime(roomCode, handleRealtimeUpdate);

  // Calculate flipped board for black player
  const isFlipped = playerColor === 'black';

  const displayRanks = isFlipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = isFlipped ? [...FILES].reverse() : FILES;

  function getDisplayCoords(row, col) {
    if (isFlipped) return [7 - row, 7 - col];
    return [row, col];
  }

  function handleSquareClick(displayRow, displayCol) {
    const [row, col] = isFlipped
      ? [7 - displayRow, 7 - displayCol]
      : [displayRow, displayCol];

    // If promotion is pending, ignore board clicks
    if (promotionPending) return;

    const piece = board[row][col];

    // If a piece is already selected
    if (selected) {
      const [sr, sc] = selected;

      // Check if clicked square is a legal move
      const isLegal = legalMoves.some(([mr, mc]) => mr === row && mc === col);

      if (isLegal) {
        // Check for pawn promotion
        const selectedPiece = board[sr][sc];
        if (selectedPiece.type.toUpperCase() === 'P' &&
            (row === 0 || row === 7)) {
          setPromotionPending({ row, col, fromRow: sr, fromCol: sc });
          return;
        }
        executeMove(sr, sc, row, col);
      } else if (piece && piece.color === turn) {
        // Select a different piece of same color
        setSelected([row, col]);
        setLegalMoves(getLegalMoves(board, row, col, castling, enPassant));
      } else {
        setSelected(null);
        setLegalMoves([]);
      }
    } else {
      // Select a piece
      if (piece && piece.color === turn) {
        setSelected([row, col]);
        setLegalMoves(getLegalMoves(board, row, col, castling, enPassant));
      }
    }
  }

  function handlePromotion(promotionType) {
    if (!promotionPending) return;
    const { fromRow, fromCol, row, col } = promotionPending;
    executeMove(fromRow, fromCol, row, col, promotionType);
    setPromotionPending(null);
  }

  function executeMove(fromRow, fromCol, toRow, toCol, promotion = null) {
    const newBoard = cloneBoard(board);
    const piece = newBoard[fromRow][fromCol];
    const captured = newBoard[toRow][toCol];
    const type = piece.type.toUpperCase();

    // Handle en passant capture
    let epCapture = false;
    if (type === 'P' && enPassant && toRow === enPassant[0] && toCol === enPassant[1]) {
      const capturedRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
      const epPiece = newBoard[capturedRow][toCol];
      if (epPiece) {
        if (epPiece.color === 'white') {
          setCapturedWhite(prev => [...prev, epPiece.type]);
        } else {
          setCapturedBlack(prev => [...prev, epPiece.type]);
        }
      }
      newBoard[capturedRow][toCol] = null;
      epCapture = true;
    }

    // Track captures
    if (captured) {
      if (captured.color === 'white') {
        setCapturedWhite(prev => [...prev, captured.type]);
      } else {
        setCapturedBlack(prev => [...prev, captured.type]);
      }
    }

    // Move piece
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    // Handle castling rook movement
    if (type === 'K' && Math.abs(toCol - fromCol) === 2) {
      const baseRow = piece.color === 'white' ? 7 : 0;
      if (toCol === 6) {
        newBoard[baseRow][5] = newBoard[baseRow][7];
        newBoard[baseRow][7] = null;
      } else if (toCol === 2) {
        newBoard[baseRow][3] = newBoard[baseRow][0];
        newBoard[baseRow][0] = null;
      }
    }

    // Handle pawn promotion
    if (promotion && type === 'P' && (toRow === 0 || toRow === 7)) {
      const promoMap = {
        Q: piece.color === 'white' ? 'Q' : 'q',
        R: piece.color === 'white' ? 'R' : 'r',
        B: piece.color === 'white' ? 'B' : 'b',
        N: piece.color === 'white' ? 'N' : 'n',
      };
      newBoard[toRow][toCol] = { type: promoMap[promotion], color: piece.color };
    }

    // Update castling rights
    let newCastling = castling;
    if (type === 'K') {
      newCastling = newCastling.replace(piece.color === 'white' ? /[KQ]/g : /[kq]/g, '');
    }
    if (type === 'R') {
      if (fromCol === 0 && fromRow === 7) newCastling = newCastling.replace('Q', '');
      if (fromCol === 7 && fromRow === 7) newCastling = newCastling.replace('K', '');
      if (fromCol === 0 && fromRow === 0) newCastling = newCastling.replace('q', '');
      if (fromCol === 7 && fromRow === 0) newCastling = newCastling.replace('k', '');
    }
    if (newCastling === '') newCastling = '-';
    setCastling(newCastling);

    // Update en passant target
    let newEnPassant = null;
    if (type === 'P' && Math.abs(toRow - fromRow) === 2) {
      const epRow = (fromRow + toRow) / 2;
      newEnPassant = [epRow, fromCol];
    }
    setEnPassant(newEnPassant);

    // Build move notation
    const notation = getMoveNotation(board, fromRow, fromCol, toRow, toCol, promotion, newBoard);
    setMoveHistory(prev => [...prev, notation]);

    // Set last move highlighting
    setLastMove({ from: [fromRow, fromCol], to: [toRow, toCol] });

    // Update board and turn
    setBoard(newBoard);
    const nextTurn = turn === 'white' ? 'black' : 'white';
    setTurn(nextTurn);
    setSelected(null);
    setLegalMoves([]);

    // Check game end conditions
    const inCheck = isInCheck(newBoard, nextTurn);
    const hasLegal = hasAnyLegalMove(newBoard, nextTurn, newCastling, newEnPassant);

    if (!hasLegal) {
      if (inCheck) {
        setGameStatus('checkmate');
        setWinner(turn);
      } else {
        setGameStatus('stalemate');
      }
    } else if (inCheck) {
      setGameStatus('check');
    } else {
      setGameStatus('playing');
    }

    // Send move to server
    try {
      api.games.move(roomCode, {
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        promotion: promotion || undefined,
      });
    } catch {
      // Continue with local state
    }
  }

  async function handleResign() {
    setGameStatus('resigned');
    setWinner(turn === 'white' ? 'black' : 'white');
    try {
      await api.games.resign(roomCode);
    } catch {
      // Already set locally
    }
  }

  // Format move history into pairs
  const movePairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1] || '',
      });
    }
    return pairs;
  }, [moveHistory]);

  const gameOverMessage = useMemo(() => {
    switch (gameStatus) {
      case 'checkmate':
        return `Checkmate! ${winner === 'white' ? 'White' : 'Black'} wins.`;
      case 'stalemate':
        return 'Stalemate! The game is a draw.';
      case 'resigned':
        return `${winner === 'white' ? 'White' : 'Black'} wins by resignation.`;
      default:
        return null;
    }
  }, [gameStatus, winner]);

  const isGameOver = ['checkmate', 'stalemate', 'resigned'].includes(gameStatus);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="btn-ghost text-gray-400"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Lobby
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-mono">{roomCode}</span>
            <button
              onClick={() => setShowJitsi(!showJitsi)}
              className="btn-ghost text-brand-400 text-sm"
            >
              Video
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left panel — captures & info */}
          <div className="hidden lg:flex flex-col gap-4 w-48">
            {/* Opponent captured pieces */}
            <div className="card p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {isFlipped ? 'White' : 'Black'} captured
              </p>
              <div className="flex flex-wrap gap-1 min-h-[2rem]">
                {(isFlipped ? capturedBlack : capturedWhite).map((p, i) => (
                  <span key={i} className="text-xl opacity-70">
                    {PIECES[p]}
                  </span>
                ))}
              </div>
            </div>

            {/* Turn indicator */}
            <div className={`card p-4 border ${
              gameStatus === 'check'
                ? 'border-yellow-500/50 bg-yellow-500/5'
                : 'border-gray-800'
            }`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {isGameOver ? 'Result' : 'Turn'}
              </p>
              {isGameOver ? (
                <p className="text-sm font-semibold text-white">{gameOverMessage}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${
                    turn === 'white' ? 'bg-white' : 'bg-gray-700 border-2 border-gray-500'
                  }`} />
                  <span className="text-sm font-semibold text-white capitalize">{turn}</span>
                  {gameStatus === 'check' && (
                    <span className="text-xs text-yellow-400 font-bold">CHECK</span>
                  )}
                </div>
              )}
            </div>

            {/* Player captured pieces */}
            <div className="card p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {isFlipped ? 'Black' : 'White'} captured
              </p>
              <div className="flex flex-wrap gap-1 min-h-[2rem]">
                {(isFlipped ? capturedWhite : capturedBlack).map((p, i) => (
                  <span key={i} className="text-xl opacity-70">
                    {PIECES[p]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Chess Board */}
          <div className="flex-shrink-0">
            {/* Opponent label */}
            <div className="flex items-center gap-2 mb-2 pl-8">
              <div className={`w-3 h-3 rounded-full ${
                (isFlipped ? 'white' : 'black') === turn && !isGameOver
                  ? 'bg-green-500 animate-pulse'
                  : isFlipped ? 'bg-white' : 'bg-gray-600 border border-gray-500'
              }`} />
              <span className="text-sm text-gray-400">
                {isFlipped ? 'White' : 'Black'}
              </span>
            </div>

            <div className="relative">
              {/* Board */}
              <div className="inline-grid grid-cols-[auto_repeat(8,1fr)] grid-rows-[repeat(8,1fr)_auto] gap-0">
                {displayRanks.map((rank, displayRow) => (
                  <React.Fragment key={rank}>
                    {/* Rank label */}
                    <div className="w-6 flex items-center justify-center text-xs text-gray-600 font-mono">
                      {rank}
                    </div>
                    {/* Squares */}
                    {displayFiles.map((file, displayCol) => {
                      const [actualRow, actualCol] = isFlipped
                        ? [7 - displayRow, 7 - displayCol]
                        : [displayRow, displayCol];
                      const piece = board[actualRow][actualCol];
                      const isLight = (actualRow + actualCol) % 2 === 0;
                      const isSelected = selected && selected[0] === actualRow && selected[1] === actualCol;
                      const isLegal = legalMoves.some(([mr, mc]) => mr === actualRow && mc === actualCol);
                      const isLastMoveFrom = lastMove && lastMove.from[0] === actualRow && lastMove.from[1] === actualCol;
                      const isLastMoveTo = lastMove && lastMove.to[0] === actualRow && lastMove.to[1] === actualCol;
                      const isCapture = isLegal && piece;
                      const kingPos = findKing(board, turn);
                      const isKingInCheck = gameStatus === 'check' && kingPos &&
                        kingPos[0] === actualRow && kingPos[1] === actualCol;

                      return (
                        <button
                          key={`${actualRow}-${actualCol}`}
                          onClick={() => handleSquareClick(displayRow, displayCol)}
                          disabled={isGameOver}
                          className={`
                            w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem]
                            flex items-center justify-center
                            text-3xl sm:text-4xl md:text-[2.5rem]
                            relative select-none transition-colors duration-100
                            ${isLight
                              ? 'bg-[#B7C0D8]'
                              : 'bg-[#6B7CB0]'
                            }
                            ${isSelected ? '!bg-yellow-400/70' : ''}
                            ${isLastMoveFrom ? (isLight ? '!bg-[#CDD28A]' : '!bg-[#A9B044]') : ''}
                            ${isLastMoveTo ? (isLight ? '!bg-[#CDD28A]' : '!bg-[#A9B044]') : ''}
                            ${isKingInCheck ? '!bg-red-500/60' : ''}
                            hover:brightness-110
                            disabled:cursor-default
                          `}
                        >
                          {/* Legal move indicator */}
                          {isLegal && !isCapture && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-3.5 h-3.5 rounded-full bg-green-500/40" />
                            </div>
                          )}
                          {isLegal && isCapture && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-full h-full rounded-full border-[5px] border-green-500/40" />
                            </div>
                          )}
                          {/* Piece */}
                          {piece && (
                            <span className={`relative z-10 drop-shadow-md ${
                              piece.color === 'white' ? 'text-white' : 'text-gray-900'
                            }`} style={{ textShadow: piece.color === 'white' ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(255,255,255,0.3)' }}>
                              {PIECES[piece.type]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
                {/* File labels */}
                <div /> {/* Empty corner */}
                {displayFiles.map((file) => (
                  <div key={file} className="h-6 flex items-center justify-center text-xs text-gray-600 font-mono">
                    {file}
                  </div>
                ))}
              </div>

              {/* Promotion overlay */}
              {promotionPending && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                  <div className="card p-4">
                    <p className="text-sm font-medium text-gray-400 mb-3 text-center">Promote to:</p>
                    <div className="flex gap-2">
                      {['Q', 'R', 'B', 'N'].map((promo) => (
                        <button
                          key={promo}
                          onClick={() => handlePromotion(promo)}
                          className="w-14 h-14 rounded-xl bg-gray-800 hover:bg-brand-600 border border-gray-700 hover:border-brand-500 flex items-center justify-center text-3xl transition-all duration-150"
                          title={PIECE_NAMES[promo]}
                        >
                          {PIECES[turn === 'white' ? promo : promo.toLowerCase()]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Game over overlay */}
              {isGameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                  <div className="card p-6 text-center max-w-xs">
                    <p className="text-2xl font-bold text-white mb-2">
                      {gameStatus === 'checkmate' ? 'Checkmate!' : gameStatus === 'stalemate' ? 'Stalemate!' : 'Game Over'}
                    </p>
                    <p className="text-gray-400 mb-4">{gameOverMessage}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate('/')}
                        className="btn-secondary flex-1"
                      >
                        Home
                      </button>
                      <button
                        onClick={() => navigate(`/room/${roomCode}`)}
                        className="btn-primary flex-1"
                      >
                        Rematch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player label */}
            <div className="flex items-center gap-2 mt-2 pl-8">
              <div className={`w-3 h-3 rounded-full ${
                (isFlipped ? 'black' : 'white') === turn && !isGameOver
                  ? 'bg-green-500 animate-pulse'
                  : isFlipped ? 'bg-gray-600 border border-gray-500' : 'bg-white'
              }`} />
              <span className="text-sm text-gray-400">
                {isFlipped ? 'Black' : 'White'} (You)
              </span>
            </div>

            {/* Mobile captured pieces */}
            <div className="lg:hidden flex justify-between mt-4 gap-4">
              <div className="card p-3 flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Your captures</p>
                <div className="flex flex-wrap gap-0.5 min-h-[1.5rem]">
                  {(isFlipped ? capturedWhite : capturedBlack).map((p, i) => (
                    <span key={i} className="text-lg opacity-70">{PIECES[p]}</span>
                  ))}
                </div>
              </div>
              <div className="card p-3 flex-1">
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Opponent captures</p>
                <div className="flex flex-wrap gap-0.5 min-h-[1.5rem]">
                  {(isFlipped ? capturedBlack : capturedWhite).map((p, i) => (
                    <span key={i} className="text-lg opacity-70">{PIECES[p]}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — move history & controls */}
          <div className="flex-1 min-w-0 lg:max-w-xs flex flex-col gap-4">
            {/* Game status for mobile */}
            <div className="lg:hidden">
              {gameStatus === 'check' && (
                <div className="card p-3 border-yellow-500/50 bg-yellow-500/5 text-center">
                  <span className="text-sm font-bold text-yellow-400">CHECK!</span>
                </div>
              )}
            </div>

            {/* Move History */}
            <div className="card p-4 flex-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Moves</h3>
              <div className="max-h-80 overflow-y-auto space-y-0.5 pr-1">
                {movePairs.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">No moves yet</p>
                ) : (
                  movePairs.map((pair) => (
                    <div
                      key={pair.number}
                      className="flex text-sm font-mono py-1 px-2 rounded hover:bg-gray-800/50"
                    >
                      <span className="w-8 text-gray-600 flex-shrink-0">{pair.number}.</span>
                      <span className="w-20 text-gray-200 flex-shrink-0">{pair.white}</span>
                      <span className="w-20 text-gray-400">{pair.black}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            {!isGameOver && (
              <button
                onClick={handleResign}
                className="w-full py-2.5 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 text-sm font-semibold hover:bg-red-600/20 transition-all duration-200"
              >
                Resign
              </button>
            )}
          </div>
        </div>
      </div>

      {showJitsi && (
        <JitsiPanel roomCode={roomCode} displayName={playerName} />
      )}
    </div>
  );
}
