const { Router } = require('express');
const { recordResult } = require('../../scoring/elo');
const router = Router();

// Board: 24 points (indices 0-23), plus bar (index 24) and off (index 25)
// Player 1 moves from point 24 toward point 1 (high to low), bears off past point 1
// Player 2 moves from point 1 toward point 24 (low to high), bears off past point 24
// Internal representation: points[0..23] where points[i] = { count, player } or null
// bar = { 1: count, 2: count }, off = { 1: count, 2: count }

function createInitialBoard() {
  const points = Array(24).fill(null);

  // Standard backgammon starting position
  // Player 1 (moves 24->1): pieces at points 24,13,8,6 (0-indexed: 23,12,7,5)
  points[23] = { count: 2, player: 1 };
  points[12] = { count: 5, player: 1 };
  points[7]  = { count: 3, player: 1 };
  points[5]  = { count: 5, player: 1 };

  // Player 2 (moves 1->24): pieces at points 1,12,17,19 (0-indexed: 0,11,16,18)
  points[0]  = { count: 2, player: 2 };
  points[11] = { count: 5, player: 2 };
  points[16] = { count: 3, player: 2 };
  points[18] = { count: 5, player: 2 };

  return points;
}

function rollDice() {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  // Doubles: use each die twice
  if (d1 === d2) return [d1, d1, d1, d1];
  return [d1, d2];
}

function getPointCount(points, index, player) {
  const p = points[index];
  if (!p || p.player !== player) return 0;
  return p.count;
}

function setPoint(points, index, player, count) {
  if (count <= 0) {
    points[index] = null;
  } else {
    points[index] = { count, player };
  }
}

function canBearOff(points, bar, player) {
  if (bar[player] > 0) return false;
  // All pieces must be in home board
  if (player === 1) {
    // Home board: points 0-5 (points 1-6)
    for (let i = 6; i < 24; i++) {
      if (points[i] && points[i].player === 1) return false;
    }
  } else {
    // Home board: points 18-23 (points 19-24)
    for (let i = 0; i < 18; i++) {
      if (points[i] && points[i].player === 2) return false;
    }
  }
  return true;
}

function getTargetIndex(fromIndex, die, player) {
  // Player 1 moves from high index to low (24->1)
  // Player 2 moves from low index to high (1->24)
  if (player === 1) return fromIndex - die;
  return fromIndex + die;
}

function getBarEntryIndex(die, player) {
  // Player 1 enters from point 25 (conceptual), moving by die value toward point 1
  // Entry point: 24 - die (0-indexed: 24-die)
  if (player === 1) return 24 - die;
  // Player 2 enters from point 0 (conceptual), moving by die value toward point 24
  return die - 1;
}

function isValidLanding(points, targetIndex, player) {
  if (targetIndex < 0 || targetIndex > 23) return false;
  const target = points[targetIndex];
  if (!target) return true;
  if (target.player === player) return true;
  if (target.count <= 1) return true; // can hit
  return false;
}

function getLegalMovesForDie(points, bar, off, player, die) {
  const moves = [];

  // Must enter from bar first
  if (bar[player] > 0) {
    const entryIdx = getBarEntryIndex(die, player);
    if (isValidLanding(points, entryIdx, player)) {
      moves.push({ from: 'bar', to: entryIdx, die });
    }
    return moves; // Can only enter from bar, nothing else
  }

  const bearingOff = canBearOff(points, bar, player);

  for (let i = 0; i < 24; i++) {
    if (!points[i] || points[i].player !== player) continue;

    const targetIdx = getTargetIndex(i, die, player);

    // Bearing off
    if (bearingOff) {
      if (player === 1 && targetIdx < 0) {
        // Exact bear off or highest occupied point
        if (targetIdx === -1) {
          moves.push({ from: i, to: 'off', die });
        } else {
          // Can only bear off with higher die if no pieces on higher points
          let higherExists = false;
          for (let j = i + 1; j <= 5; j++) {
            if (points[j] && points[j].player === 1) { higherExists = true; break; }
          }
          if (!higherExists) moves.push({ from: i, to: 'off', die });
        }
        continue;
      }
      if (player === 2 && targetIdx > 23) {
        if (targetIdx === 24) {
          moves.push({ from: i, to: 'off', die });
        } else {
          let higherExists = false;
          for (let j = i - 1; j >= 18; j--) {
            if (points[j] && points[j].player === 2) { higherExists = true; break; }
          }
          if (!higherExists) moves.push({ from: i, to: 'off', die });
        }
        continue;
      }
    }

    if (targetIdx >= 0 && targetIdx <= 23 && isValidLanding(points, targetIdx, player)) {
      moves.push({ from: i, to: targetIdx, die });
    }
  }

  return moves;
}

function getAllLegalMoves(points, bar, off, player, dice) {
  // Return all possible move sequences for the remaining dice
  if (dice.length === 0) return [[]];

  // Try each die
  const usedDice = new Set();
  const allSequences = [];

  for (let d = 0; d < dice.length; d++) {
    if (usedDice.has(`${d}-${dice[d]}`)) continue;
    usedDice.add(`${d}-${dice[d]}`);

    const die = dice[d];
    const legalMoves = getLegalMovesForDie(points, bar, off, player, die);

    for (const move of legalMoves) {
      // Apply move temporarily
      const newPoints = points.map(p => p ? { ...p } : null);
      const newBar = { ...bar };
      const newOff = { ...off };

      if (move.from === 'bar') {
        newBar[player]--;
      } else {
        const fromCount = newPoints[move.from].count - 1;
        setPoint(newPoints, move.from, player, fromCount);
      }

      if (move.to === 'off') {
        newOff[player]++;
      } else {
        // Check for hit
        if (newPoints[move.to] && newPoints[move.to].player !== player) {
          newBar[newPoints[move.to].player]++;
          newPoints[move.to] = null;
        }
        const toCount = (newPoints[move.to] && newPoints[move.to].player === player)
          ? newPoints[move.to].count + 1
          : 1;
        setPoint(newPoints, move.to, player, toCount);
      }

      const remainingDice = [...dice];
      remainingDice.splice(d, 1);

      const continuations = getAllLegalMoves(newPoints, newBar, newOff, player, remainingDice);
      for (const cont of continuations) {
        allSequences.push([move, ...cont]);
      }
    }
  }

  // If no moves possible, return empty sequence
  if (allSequences.length === 0) return [[]];

  // Must use maximum number of dice possible
  const maxLen = Math.max(...allSequences.map(s => s.length));
  return allSequences.filter(s => s.length === maxLen);
}

function applyMoveToState(bs, move, player) {
  const points = bs.points;
  const bar = bs.bar;
  const off = bs.off;

  // Remove piece from source
  if (move.from === 'bar') {
    bar[player]--;
  } else {
    const fromCount = points[move.from].count - 1;
    setPoint(points, move.from, player, fromCount);
  }

  // Place piece at destination
  if (move.to === 'off') {
    off[player]++;
  } else {
    // Hit opponent
    const opponent = player === 1 ? 2 : 1;
    if (points[move.to] && points[move.to].player === opponent) {
      bar[opponent] += points[move.to].count;
      points[move.to] = null;
    }
    const toCount = (points[move.to] && points[move.to].player === player)
      ? points[move.to].count + 1
      : 1;
    setPoint(points, move.to, player, toCount);
  }
}

// Initialize a backgammon game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length !== 2) {
    return res.status(400).json({ error: 'roomId and exactly 2 players required' });
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5);

  const boardState = {
    points: createInitialBoard(),
    bar: { 1: 0, 2: 0 },
    off: { 1: 0, 2: 0 },
    player1: { id: shuffled[0].id, name: shuffled[0].name },
    player2: { id: shuffled[1].id, name: shuffled[1].name },
    moveHistory: [],
    doublingCube: { value: 1, owner: null },
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: shuffled[0].id,
    extra_state: {
      status: 'awaiting_roll',
      dice: null,
      remainingDice: null,
      lastMove: null,
      winner: null,
    },
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ boardState, currentTurn: shuffled[0].id });
});

// Roll dice
router.post('/roll', async (req, res) => {
  const { roomId, playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const extra = state.extra_state;

  if (extra.status !== 'awaiting_roll') {
    return res.status(400).json({ error: 'Not time to roll dice' });
  }

  if (playerId !== state.current_turn) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  const dice = rollDice();
  const bs = state.board_state;
  const playerNum = playerId === bs.player1.id ? 1 : 2;

  // Check if any legal moves exist
  const allSequences = getAllLegalMoves(bs.points, bs.bar, bs.off, playerNum, dice);
  const hasLegalMoves = allSequences.length > 0 && allSequences[0].length > 0;

  let newStatus = 'awaiting_move';
  if (!hasLegalMoves) {
    // No legal moves, turn passes
    const nextPlayer = playerId === bs.player1.id ? bs.player2.id : bs.player1.id;
    const { error: updateErr } = await supabase.from('game_state').update({
      current_turn: nextPlayer,
      extra_state: {
        ...extra,
        status: 'awaiting_roll',
        dice,
        remainingDice: [],
        lastMove: null,
      },
    }).eq('room_id', roomId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.json({
      dice,
      legalMoves: [],
      noMoves: true,
      currentTurn: nextPlayer,
    });
  }

  // Get legal moves for the first die
  const legalMoves = [];
  const uniqueFirstMoves = new Map();
  for (const seq of allSequences) {
    if (seq.length > 0) {
      const key = `${seq[0].from}-${seq[0].to}-${seq[0].die}`;
      if (!uniqueFirstMoves.has(key)) {
        uniqueFirstMoves.set(key, seq[0]);
        legalMoves.push(seq[0]);
      }
    }
  }

  const { error: updateErr } = await supabase.from('game_state').update({
    extra_state: {
      ...extra,
      status: 'awaiting_move',
      dice,
      remainingDice: [...dice],
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ dice, legalMoves, noMoves: false });
});

// Make a move (one die at a time)
router.post('/move', async (req, res) => {
  const { roomId, playerId, from, to } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const extra = state.extra_state;

  if (extra.status !== 'awaiting_move') {
    return res.status(400).json({ error: 'Not time to move' });
  }

  if (playerId !== state.current_turn) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  const playerNum = playerId === bs.player1.id ? 1 : 2;
  const remainingDice = extra.remainingDice;

  // Find which die this move uses
  let usedDie = null;
  let usedDieIndex = -1;

  for (let d = 0; d < remainingDice.length; d++) {
    const die = remainingDice[d];
    const legalMoves = getLegalMovesForDie(bs.points, bs.bar, bs.off, playerNum, die);
    const match = legalMoves.find(m => {
      const mFrom = m.from === 'bar' ? 'bar' : m.from;
      const mTo = m.to === 'off' ? 'off' : m.to;
      return mFrom === from && mTo === to;
    });
    if (match) {
      usedDie = die;
      usedDieIndex = d;
      break;
    }
  }

  if (usedDie === null) {
    return res.status(400).json({ error: 'Illegal move' });
  }

  // Validate this move is part of a maximal legal sequence
  const allSequences = getAllLegalMoves(bs.points, bs.bar, bs.off, playerNum, remainingDice);
  const validFirstMove = allSequences.some(seq =>
    seq.length > 0 &&
    (seq[0].from === from || (seq[0].from === 'bar' && from === 'bar')) &&
    (seq[0].to === to || (seq[0].to === 'off' && to === 'off')) &&
    seq[0].die === usedDie
  );

  if (!validFirstMove) {
    return res.status(400).json({ error: 'This move does not allow using the maximum number of dice' });
  }

  // Apply the move
  const moveObj = { from, to, die: usedDie };
  applyMoveToState(bs, moveObj, playerNum);

  // Update remaining dice
  const newRemaining = [...remainingDice];
  newRemaining.splice(usedDieIndex, 1);

  bs.moveHistory.push({ playerId, from, to, die: usedDie });

  // Check win condition (all 15 pieces borne off)
  let gameStatus = 'awaiting_move';
  let winner = null;

  if (bs.off[playerNum] === 15) {
    gameStatus = 'won';
    winner = playerNum === 1 ? bs.player1 : bs.player2;
  } else if (newRemaining.length === 0) {
    // All dice used, next player's turn
    gameStatus = 'awaiting_roll';
  } else {
    // Check if remaining moves are possible
    const nextSequences = getAllLegalMoves(bs.points, bs.bar, bs.off, playerNum, newRemaining);
    const hasNextMoves = nextSequences.length > 0 && nextSequences[0].length > 0;
    if (!hasNextMoves) {
      gameStatus = 'awaiting_roll';
    }
  }

  const isEndOfTurn = gameStatus === 'awaiting_roll' || gameStatus === 'won';
  const nextTurn = isEndOfTurn && gameStatus !== 'won'
    ? (playerId === bs.player1.id ? bs.player2.id : bs.player1.id)
    : state.current_turn;

  // Get legal moves for next die if still this player's turn
  let nextLegalMoves = [];
  if (gameStatus === 'awaiting_move') {
    const nextSequences = getAllLegalMoves(bs.points, bs.bar, bs.off, playerNum, newRemaining);
    const uniqueMoves = new Map();
    for (const seq of nextSequences) {
      if (seq.length > 0) {
        const key = `${seq[0].from}-${seq[0].to}-${seq[0].die}`;
        if (!uniqueMoves.has(key)) {
          uniqueMoves.set(key, seq[0]);
          nextLegalMoves.push(seq[0]);
        }
      }
    }
  }

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: nextTurn,
    extra_state: {
      status: gameStatus,
      dice: extra.dice,
      remainingDice: newRemaining,
      lastMove: { from, to, die: usedDie },
      winner,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { from, to, die: usedDie },
  });

  if (gameStatus === 'won') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
    const loser = winner.id === bs.player1.id ? bs.player2 : bs.player1;
    await recordResult(supabase, 'backgammon', roomId, winner, loser);
  }

  res.json({
    points: bs.points,
    bar: bs.bar,
    off: bs.off,
    gameStatus,
    winner,
    currentTurn: nextTurn,
    remainingDice: newRemaining,
    legalMoves: nextLegalMoves,
    lastMove: { from, to, die: usedDie },
  });
});

// Get legal moves for current state
router.post('/legal-moves', async (req, res) => {
  const { roomId, playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (!state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const extra = state.extra_state;

  if (extra.status !== 'awaiting_move' || !extra.remainingDice) {
    return res.json({ moves: [] });
  }

  const playerNum = playerId === bs.player1.id ? 1 : 2;
  const allSequences = getAllLegalMoves(bs.points, bs.bar, bs.off, playerNum, extra.remainingDice);
  const uniqueMoves = new Map();
  const moves = [];

  for (const seq of allSequences) {
    if (seq.length > 0) {
      const key = `${seq[0].from}-${seq[0].to}-${seq[0].die}`;
      if (!uniqueMoves.has(key)) {
        uniqueMoves.set(key, seq[0]);
        moves.push(seq[0]);
      }
    }
  }

  res.json({ moves });
});

// Doubling cube
router.post('/double', async (req, res) => {
  const { roomId, playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const extra = state.extra_state;
  const cube = bs.doublingCube;

  if (extra.status !== 'awaiting_roll') {
    return res.status(400).json({ error: 'Can only double before rolling' });
  }

  if (playerId !== state.current_turn) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  // Check cube ownership
  if (cube.owner !== null && cube.owner !== playerId) {
    return res.status(400).json({ error: 'You do not control the doubling cube' });
  }

  const { error: updateErr } = await supabase.from('game_state').update({
    extra_state: {
      ...extra,
      status: 'awaiting_double_response',
      doubleProposer: playerId,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ proposedValue: cube.value * 2, proposer: playerId });
});

// Respond to doubling
router.post('/double-response', async (req, res) => {
  const { roomId, playerId, accept } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;
  const extra = state.extra_state;

  if (extra.status !== 'awaiting_double_response') {
    return res.status(400).json({ error: 'No doubling offer pending' });
  }

  if (playerId === extra.doubleProposer) {
    return res.status(400).json({ error: 'Cannot respond to your own double' });
  }

  if (accept) {
    bs.doublingCube.value *= 2;
    bs.doublingCube.owner = playerId; // Responder gets cube control

    const { error: updateErr } = await supabase.from('game_state').update({
      board_state: bs,
      extra_state: {
        ...extra,
        status: 'awaiting_roll',
        doubleProposer: null,
      },
    }).eq('room_id', roomId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    res.json({ accepted: true, cubeValue: bs.doublingCube.value });
  } else {
    // Decline = forfeit
    const winner = extra.doubleProposer === bs.player1.id ? bs.player1 : bs.player2;

    const { error: updateErr } = await supabase.from('game_state').update({
      extra_state: {
        ...extra,
        status: 'won',
        winner,
        doubleProposer: null,
      },
    }).eq('room_id', roomId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);

    res.json({ accepted: false, winner, stakes: bs.doublingCube.value });
  }
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
