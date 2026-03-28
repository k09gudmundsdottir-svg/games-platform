const { Router } = require('express');
const router = Router();

const BOARD_SIZE = 8;

// Piece constants
const EMPTY = 0;
const P1 = 1;       // Player 1 regular
const P1_KING = 2;  // Player 1 king
const P2 = 3;       // Player 2 regular
const P2_KING = 4;  // Player 2 king

function createInitialBoard() {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
  // Player 2 pieces (top of board, rows 0-2)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = P2;
    }
  }
  // Player 1 pieces (bottom of board, rows 5-7)
  for (let r = 5; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 1) board[r][c] = P1;
    }
  }
  return board;
}

function isPlayer(piece, playerNum) {
  if (playerNum === 1) return piece === P1 || piece === P1_KING;
  return piece === P2 || piece === P2_KING;
}

function isKing(piece) {
  return piece === P1_KING || piece === P2_KING;
}

function isOpponent(piece, playerNum) {
  if (playerNum === 1) return piece === P2 || piece === P2_KING;
  return piece === P1 || piece === P1_KING;
}

function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function getMoveDirections(piece) {
  if (piece === P1) return [[-1, -1], [-1, 1]]; // P1 moves up
  if (piece === P2) return [[1, -1], [1, 1]];   // P2 moves down
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]];  // Kings move both ways
}

function getSimpleMoves(board, r, c) {
  const piece = board[r][c];
  const moves = [];
  const directions = getMoveDirections(piece);
  for (const [dr, dc] of directions) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && board[nr][nc] === EMPTY) {
      moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, captures: [] });
    }
  }
  return moves;
}

function getCaptureMoves(board, r, c, playerNum) {
  const piece = board[r][c];
  const results = [];

  function dfs(board, cr, cc, currentPiece, captures) {
    const directions = getMoveDirections(currentPiece);
    let foundCapture = false;

    for (const [dr, dc] of directions) {
      const mr = cr + dr;
      const mc = cc + dc;
      const lr = cr + 2 * dr;
      const lc = cc + 2 * dc;

      if (
        inBounds(lr, lc) &&
        isOpponent(board[mr][mc], playerNum) &&
        board[lr][lc] === EMPTY
      ) {
        foundCapture = true;
        const newBoard = board.map(row => [...row]);
        const capturedPiece = newBoard[mr][mc];
        newBoard[mr][mc] = EMPTY;
        newBoard[cr][cc] = EMPTY;

        // Check for promotion mid-chain
        let landingPiece = currentPiece;
        if (lr === 0 && currentPiece === P1) landingPiece = P1_KING;
        if (lr === BOARD_SIZE - 1 && currentPiece === P2) landingPiece = P2_KING;

        newBoard[lr][lc] = landingPiece;

        const newCaptures = [...captures, { row: mr, col: mc, piece: capturedPiece }];

        // If promoted during capture, stop the chain
        if (landingPiece !== currentPiece) {
          results.push({
            from: { row: r, col: c },
            to: { row: lr, col: lc },
            captures: newCaptures,
          });
        } else {
          dfs(newBoard, lr, lc, landingPiece, newCaptures);
        }
      }
    }

    if (!foundCapture && captures.length > 0) {
      results.push({
        from: { row: r, col: c },
        to: { row: cr, col: cc },
        captures,
      });
    }
  }

  dfs(board, r, c, piece, []);
  return results;
}

function getAllLegalMoves(board, playerNum) {
  const captureMoves = [];
  const simpleMoves = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isPlayer(board[r][c], playerNum)) {
        captureMoves.push(...getCaptureMoves(board, r, c, playerNum));
        simpleMoves.push(...getSimpleMoves(board, r, c));
      }
    }
  }

  // Forced capture rule: if captures exist, must capture
  if (captureMoves.length > 0) return captureMoves;
  return simpleMoves;
}

function applyMove(board, move, playerNum) {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = EMPTY;

  // Remove captured pieces
  for (const cap of move.captures) {
    newBoard[cap.row][cap.col] = EMPTY;
  }

  // King promotion
  let landingPiece = piece;
  if (move.to.row === 0 && piece === P1) landingPiece = P1_KING;
  if (move.to.row === BOARD_SIZE - 1 && piece === P2) landingPiece = P2_KING;

  newBoard[move.to.row][move.to.col] = landingPiece;
  return newBoard;
}

function countPieces(board, playerNum) {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isPlayer(board[r][c], playerNum)) count++;
    }
  }
  return count;
}

// Initialize a checkers game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length !== 2) {
    return res.status(400).json({ error: 'roomId and exactly 2 players required' });
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const boardState = {
    board: createInitialBoard(),
    player1: { id: shuffled[0].id, name: shuffled[0].name },
    player2: { id: shuffled[1].id, name: shuffled[1].name },
    moveHistory: [],
    capturedCount: { player1: 0, player2: 0 },
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: shuffled[0].id,
    extra_state: { status: 'active', lastMove: null, winner: null },
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ boardState, currentTurn: shuffled[0].id });
});

// Make a move
router.post('/move', async (req, res) => {
  const { roomId, playerId, from, to } = req.body;
  const supabase = req.app.locals.supabase;

  if (!from || !to || from.row === undefined || from.col === undefined || to.row === undefined || to.col === undefined) {
    return res.status(400).json({ error: 'from and to positions required with row and col' });
  }

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const extra = state.extra_state;

  if (extra.status !== 'active') {
    return res.status(400).json({ error: 'Game is already over' });
  }

  if (playerId !== state.current_turn) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  const playerNum = playerId === bs.player1.id ? 1 : 2;
  const board = bs.board;

  // Validate piece belongs to player
  if (!isPlayer(board[from.row][from.col], playerNum)) {
    return res.status(400).json({ error: 'Not your piece' });
  }

  // Get all legal moves and find matching one
  const legalMoves = getAllLegalMoves(board, playerNum);
  const matchingMove = legalMoves.find(
    m => m.from.row === from.row && m.from.col === from.col &&
         m.to.row === to.row && m.to.col === to.col
  );

  if (!matchingMove) {
    return res.status(400).json({ error: 'Illegal move' });
  }

  // Apply move
  bs.board = applyMove(board, matchingMove, playerNum);
  bs.capturedCount[`player${playerNum}`] += matchingMove.captures.length;
  bs.moveHistory.push({
    playerId,
    from,
    to,
    captures: matchingMove.captures,
  });

  // Check game over
  const opponent = playerNum === 1 ? 2 : 1;
  const opponentMoves = getAllLegalMoves(bs.board, opponent);
  const opponentPieces = countPieces(bs.board, opponent);

  let gameStatus = 'active';
  let winner = null;

  if (opponentPieces === 0 || opponentMoves.length === 0) {
    gameStatus = 'won';
    winner = playerNum === 1 ? bs.player1 : bs.player2;
  }

  const nextTurn = playerId === bs.player1.id ? bs.player2.id : bs.player1.id;

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: gameStatus === 'active' ? nextTurn : state.current_turn,
    extra_state: { status: gameStatus, lastMove: { from, to }, winner },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { from, to, captures: matchingMove.captures },
  });

  if (gameStatus !== 'active') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
  }

  res.json({
    board: bs.board,
    gameStatus,
    winner,
    currentTurn: gameStatus === 'active' ? nextTurn : null,
    lastMove: { from, to, captures: matchingMove.captures },
    capturedCount: bs.capturedCount,
    moveHistory: bs.moveHistory,
  });
});

// Get legal moves for a piece or all pieces
router.post('/legal-moves', async (req, res) => {
  const { roomId, playerId, from } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const playerNum = playerId === bs.player1.id ? 1 : 2;
  const allMoves = getAllLegalMoves(bs.board, playerNum);

  if (from) {
    const filtered = allMoves.filter(m => m.from.row === from.row && m.from.col === from.col);
    return res.json({ moves: filtered });
  }

  res.json({ moves: allMoves });
});

// Get current state
router.get('/state/:roomId', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', req.params.roomId)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Game not found' });
  res.json(data);
});

module.exports = router;
