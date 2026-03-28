const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const router = Router();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new room
router.post('/create', async (req, res) => {
  const { gameType, hostName, settings } = req.body;
  const supabase = req.app.locals.supabase;

  if (!gameType || !hostName) {
    return res.status(400).json({ error: 'gameType and hostName required' });
  }

  const validGames = ['chess', 'backgammon', 'meme', 'uno', 'connect4', 'checkers'];
  if (!validGames.includes(gameType)) {
    return res.status(400).json({ error: `Invalid game type. Valid: ${validGames.join(', ')}` });
  }

  const playerId = uuidv4();
  const roomCode = generateRoomCode();

  const { data, error } = await supabase.from('game_rooms').insert({
    game_type: gameType,
    room_code: roomCode,
    status: 'waiting',
    host_player_id: playerId,
    player_ids: [{ id: playerId, name: hostName, ready: false }],
    settings: settings || {},
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ room: data, playerId, roomCode });
});

// Join a room
router.post('/join', async (req, res) => {
  const { roomCode, playerName } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomCode || !playerName) {
    return res.status(400).json({ error: 'roomCode and playerName required' });
  }

  const { data: room, error: fetchErr } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .single();

  if (fetchErr || !room) return res.status(404).json({ error: 'Room not found' });
  if (room.status !== 'waiting') return res.status(400).json({ error: 'Game already in progress' });

  const maxPlayers = { chess: 2, backgammon: 2, connect4: 2, checkers: 2, meme: 8, uno: 8 };
  const max = maxPlayers[room.game_type] || 2;
  if (room.player_ids.length >= max) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const playerId = uuidv4();
  const updatedPlayers = [...room.player_ids, { id: playerId, name: playerName, ready: false }];

  const { error: updateErr } = await supabase
    .from('game_rooms')
    .update({ player_ids: updatedPlayers })
    .eq('id', room.id);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ room: { ...room, player_ids: updatedPlayers }, playerId });
});

// Get room info
router.get('/:roomCode', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', req.params.roomCode.toUpperCase())
    .single();

  if (error || !room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room });
});

// Toggle ready status
router.post('/:roomCode/ready', async (req, res) => {
  const { playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', req.params.roomCode.toUpperCase())
    .single();

  if (error || !room) return res.status(404).json({ error: 'Room not found' });

  const updatedPlayers = room.player_ids.map(p =>
    p.id === playerId ? { ...p, ready: !p.ready } : p
  );

  await supabase.from('game_rooms').update({ player_ids: updatedPlayers }).eq('id', room.id);
  res.json({ players: updatedPlayers });
});

// Start game (host only)
router.post('/:roomCode/start', async (req, res) => {
  const { playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', req.params.roomCode.toUpperCase())
    .single();

  if (error || !room) return res.status(404).json({ error: 'Room not found' });
  if (room.host_player_id !== playerId) return res.status(403).json({ error: 'Only host can start' });

  const minPlayers = { chess: 2, backgammon: 2, connect4: 2, checkers: 2, meme: 3, uno: 2 };
  const min = minPlayers[room.game_type] || 2;
  if (room.player_ids.length < min) {
    return res.status(400).json({ error: `Need at least ${min} players` });
  }

  await supabase.from('game_rooms').update({ status: 'playing' }).eq('id', room.id);
  res.json({ status: 'playing' });
});

// Leave room
router.post('/:roomCode/leave', async (req, res) => {
  const { playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: room, error } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', req.params.roomCode.toUpperCase())
    .single();

  if (error || !room) return res.status(404).json({ error: 'Room not found' });

  const updatedPlayers = room.player_ids.filter(p => p.id !== playerId);

  if (updatedPlayers.length === 0) {
    // Delete empty room
    await supabase.from('game_rooms').delete().eq('id', room.id);
    return res.json({ deleted: true });
  }

  // Transfer host if host left
  const updates = { player_ids: updatedPlayers };
  if (room.host_player_id === playerId) {
    updates.host_player_id = updatedPlayers[0].id;
  }

  await supabase.from('game_rooms').update(updates).eq('id', room.id);
  res.json({ players: updatedPlayers });
});

module.exports = router;
