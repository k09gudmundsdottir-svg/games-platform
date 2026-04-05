const { Router } = require('express');
const { recordResult } = require('../../scoring/elo');
const router = Router();

const ROWS = 6;
const COLS = 7;

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function dropPiece(board, col, player) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      board[row][col] = player;
      return row;
    }
  }
  return -1; // column full
}

function checkWin(board, row, col, player) {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
      } else break;
    }
    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
      } else break;
    }
    if (count >= 4) return true;
  }
  return false;
}

function isBoardFull(board) {
  return board[0].every(cell => cell !== null);
}

// Initialize a Connect 4 game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length !== 2) {
    return res.status(400).json({ error: 'roomId and exactly 2 players required' });
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const player1 = shuffled[0]; // Red
  const player2 = shuffled[1]; // Yellow

  const boardState = {
    board: createEmptyBoard(),
    player1: { id: player1.id, name: player1.name, color: 'red' },
    player2: { id: player2.id, name: player2.name, color: 'yellow' },
    moveHistory: [],
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: player1.id,
    extra_state: { status: 'active', lastMove: null, winner: null },
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ boardState, currentTurn: player1.id });
});

// Drop a piece
router.post('/drop', async (req, res) => {
  const { roomId, playerId, column } = req.body;
  const supabase = req.app.locals.supabase;

  if (column === undefined || column < 0 || column >= COLS) {
    return res.status(400).json({ error: 'Invalid column (0-6)' });
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

  const row = dropPiece(board, column, playerNum);
  if (row === -1) {
    return res.status(400).json({ error: 'Column is full' });
  }

  bs.moveHistory.push({ playerId, column, row });

  let gameStatus = 'active';
  let winner = null;

  if (checkWin(board, row, column, playerNum)) {
    gameStatus = 'won';
    winner = playerNum === 1 ? bs.player1 : bs.player2;
  } else if (isBoardFull(board)) {
    gameStatus = 'draw';
  }

  const nextTurn = playerId === bs.player1.id ? bs.player2.id : bs.player1.id;

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: gameStatus === 'active' ? nextTurn : state.current_turn,
    extra_state: {
      status: gameStatus,
      lastMove: { column, row },
      winner,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { column, row, playerNum },
  });

  if (gameStatus !== 'active') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
    if (gameStatus === 'won' && winner) {
      const loser = winner.id === bs.player1.id ? bs.player2 : bs.player1;
      await recordResult(supabase, 'connect4', roomId, winner, loser);
    } else if (gameStatus === 'draw') {
      await recordResult(supabase, 'connect4', roomId, null, null, [bs.player1, bs.player2]);
    }
  }

  res.json({
    board: bs.board,
    gameStatus,
    winner,
    currentTurn: gameStatus === 'active' ? nextTurn : null,
    lastMove: { column, row },
    moveHistory: bs.moveHistory,
  });
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
