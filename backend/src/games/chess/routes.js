const { Router } = require('express');
const { Chess } = require('chess.js');
const router = Router();

// In-memory chess instances per room (for move validation)
const games = new Map();

function getGame(roomId) {
  if (!games.has(roomId)) {
    games.set(roomId, new Chess());
  }
  return games.get(roomId);
}

// Initialize a chess game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length !== 2) {
    return res.status(400).json({ error: 'roomId and exactly 2 players required' });
  }

  // Randomly assign colors
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const white = shuffled[0];
  const black = shuffled[1];

  const chess = new Chess();
  games.set(roomId, chess);

  const boardState = {
    fen: chess.fen(),
    pgn: chess.pgn(),
    white: { id: white.id, name: white.name },
    black: { id: black.id, name: black.name },
    captured: { white: [], black: [] },
    moveHistory: [],
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: white.id,
    extra_state: { status: 'active', lastMove: null },
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ boardState, currentTurn: white.id });
});

// Make a move
router.post('/move', async (req, res) => {
  const { roomId, playerId, from, to, promotion } = req.body;
  const supabase = req.app.locals.supabase;

  // Get current state
  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const chess = getGame(roomId);

  // Restore from FEN if out of sync
  if (chess.fen() !== bs.fen) {
    chess.load(bs.fen);
  }

  // Validate turn
  const isWhiteTurn = chess.turn() === 'w';
  const expectedPlayer = isWhiteTurn ? bs.white.id : bs.black.id;
  if (playerId !== expectedPlayer) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  // Attempt the move
  const move = chess.move({ from, to, promotion: promotion || 'q' });
  if (!move) {
    return res.status(400).json({ error: 'Illegal move' });
  }

  // Track captured pieces
  if (move.captured) {
    const capturedBy = move.color === 'w' ? 'white' : 'black';
    bs.captured[capturedBy].push(move.captured);
  }

  // Update move history
  bs.moveHistory.push({
    san: move.san,
    from: move.from,
    to: move.to,
    color: move.color,
    piece: move.piece,
    captured: move.captured || null,
    flags: move.flags,
  });

  // Check game status
  let gameStatus = 'active';
  let winner = null;
  if (chess.isCheckmate()) {
    gameStatus = 'checkmate';
    winner = move.color === 'w' ? bs.white : bs.black;
  } else if (chess.isStalemate()) {
    gameStatus = 'stalemate';
  } else if (chess.isDraw()) {
    gameStatus = 'draw';
  }

  // Update state
  const newTurn = chess.turn() === 'w' ? bs.white.id : bs.black.id;
  bs.fen = chess.fen();
  bs.pgn = chess.pgn();

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: newTurn,
    extra_state: {
      status: gameStatus,
      lastMove: { from, to, san: move.san },
      isCheck: chess.isCheck(),
      winner: winner,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // Record move
  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { from, to, san: move.san, promotion: move.promotion, captured: move.captured },
  });

  // Update room status if game over
  if (gameStatus !== 'active') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
    games.delete(roomId);
  }

  res.json({
    fen: chess.fen(),
    san: move.san,
    gameStatus,
    isCheck: chess.isCheck(),
    winner,
    currentTurn: newTurn,
    moveHistory: bs.moveHistory,
    captured: bs.captured,
  });
});

// Get legal moves for a position
router.post('/legal-moves', async (req, res) => {
  const { roomId, square } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state } = await supabase
    .from('game_state')
    .select('board_state')
    .eq('room_id', roomId)
    .single();

  if (!state) return res.status(404).json({ error: 'Game not found' });

  const chess = getGame(roomId);
  if (chess.fen() !== state.board_state.fen) {
    chess.load(state.board_state.fen);
  }

  const moves = chess.moves({ square, verbose: true });
  res.json({ moves: moves.map(m => ({ to: m.to, flags: m.flags, san: m.san })) });
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

// Resign
router.post('/resign', async (req, res) => {
  const { roomId, playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const winner = playerId === bs.white.id ? bs.black : bs.white;

  await supabase.from('game_state').update({
    extra_state: { status: 'resigned', winner },
  }).eq('room_id', roomId);

  await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
  games.delete(roomId);

  res.json({ status: 'resigned', winner });
});

module.exports = router;
