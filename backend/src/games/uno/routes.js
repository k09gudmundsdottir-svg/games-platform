const { Router } = require('express');
const router = Router();

const COLORS = ['red', 'blue', 'green', 'yellow'];
const NUMBER_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTION_VALUES = ['skip', 'reverse', 'draw2'];
const WILD_TYPES = ['wild', 'wild_draw4'];

function createDeck() {
  const deck = [];
  let id = 0;

  for (const color of COLORS) {
    // One 0 per color
    deck.push({ id: id++, color, value: '0', type: 'number' });

    // Two each of 1-9
    for (let i = 0; i < 2; i++) {
      for (const val of NUMBER_VALUES.slice(1)) {
        deck.push({ id: id++, color, value: val, type: 'number' });
      }
    }

    // Two each of action cards
    for (let i = 0; i < 2; i++) {
      for (const val of ACTION_VALUES) {
        deck.push({ id: id++, color, value: val, type: 'action' });
      }
    }
  }

  // Four Wild and four Wild Draw 4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: id++, color: null, value: 'wild', type: 'wild' });
    deck.push({ id: id++, color: null, value: 'wild_draw4', type: 'wild' });
  }

  return deck; // 108 cards total
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function canPlayCard(card, topCard, currentColor, drawPending) {
  // If there's a draw pending (draw2/draw4 stacking), only matching draw cards can be played
  if (drawPending > 0) {
    if (topCard.value === 'draw2' && card.value === 'draw2') return true;
    if (topCard.value === 'wild_draw4' && card.value === 'wild_draw4') return true;
    return false;
  }

  // Wild cards can always be played
  if (card.type === 'wild') return true;

  // Match color
  if (card.color === currentColor) return true;

  // Match value/number
  if (card.value === topCard.value) return true;

  return false;
}

function getNextPlayerIndex(currentIndex, direction, playerCount, skip) {
  let next = (currentIndex + direction + playerCount) % playerCount;
  if (skip) {
    next = (next + direction + playerCount) % playerCount;
  }
  return next;
}

// Initialize an UNO game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length < 2 || players.length > 8) {
    return res.status(400).json({ error: 'roomId and 2-8 players required' });
  }

  let deck = shuffleDeck(createDeck());

  // Deal 7 cards to each player
  const hands = {};
  for (const player of players) {
    hands[player.id] = deck.splice(0, 7);
  }

  // Flip starting card (if it's a wild, reshuffle until it's not)
  let startingCard = deck.shift();
  while (startingCard.type === 'wild') {
    deck.push(startingCard);
    deck = shuffleDeck(deck);
    startingCard = deck.shift();
  }

  const discardPile = [startingCard];

  // Handle starting card effects
  let direction = 1; // 1 = clockwise, -1 = counter-clockwise
  let startingPlayerIndex = 0;
  let drawPending = 0;

  if (startingCard.value === 'reverse') {
    direction = -1;
    // In 2-player, reverse acts as skip
    if (players.length === 2) {
      startingPlayerIndex = 1; // skip to second player effectively
    }
  } else if (startingCard.value === 'skip') {
    startingPlayerIndex = 1; // skip first player
  } else if (startingCard.value === 'draw2') {
    drawPending = 2;
    // First player must draw 2 or stack
  }

  const playerList = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    cardCount: 7,
    calledUno: false,
  }));

  const boardState = {
    players: playerList,
    hands,
    drawPile: deck,
    discardPile,
    currentColor: startingCard.color,
    direction,
    drawPending,
    currentPlayerIndex: startingPlayerIndex,
    moveHistory: [],
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: players[startingPlayerIndex].id,
    extra_state: { status: 'active', lastAction: null, winner: null },
  });

  if (error) return res.status(500).json({ error: error.message });

  // Return state without other players' hands
  const publicState = {
    players: playerList,
    topCard: startingCard,
    currentColor: startingCard.color,
    direction,
    drawPending,
    currentTurn: players[startingPlayerIndex].id,
    cardCounts: Object.fromEntries(playerList.map(p => [p.id, 7])),
  };

  res.json({ boardState: publicState, currentTurn: players[startingPlayerIndex].id });
});

// Play a card
router.post('/play-card', async (req, res) => {
  const { roomId, playerId, cardId, chosenColor } = req.body;
  const supabase = req.app.locals.supabase;

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

  const hand = bs.hands[playerId];
  const cardIndex = hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(400).json({ error: 'Card not in your hand' });
  }

  const card = hand[cardIndex];
  const topCard = bs.discardPile[bs.discardPile.length - 1];

  if (!canPlayCard(card, topCard, bs.currentColor, bs.drawPending)) {
    return res.status(400).json({ error: 'Cannot play this card' });
  }

  // Wild cards need a chosen color
  if (card.type === 'wild' && (!chosenColor || !COLORS.includes(chosenColor))) {
    return res.status(400).json({ error: 'Must choose a color (red, blue, green, yellow)' });
  }

  // Remove card from hand
  hand.splice(cardIndex, 1);
  bs.discardPile.push(card);

  // Reset UNO call status for this player since they played
  const playerObj = bs.players.find(p => p.id === playerId);
  playerObj.calledUno = false;
  playerObj.cardCount = hand.length;

  // Update current color
  bs.currentColor = card.type === 'wild' ? chosenColor : card.color;

  // Process card effects
  let skip = false;
  const playerCount = bs.players.length;

  if (card.value === 'reverse') {
    if (playerCount === 2) {
      skip = true; // In 2-player, reverse acts as skip
    } else {
      bs.direction *= -1;
    }
  } else if (card.value === 'skip') {
    skip = true;
  } else if (card.value === 'draw2') {
    bs.drawPending += 2;
  } else if (card.value === 'wild_draw4') {
    bs.drawPending += 4;
  }

  // Check win
  let gameStatus = 'active';
  let winner = null;

  if (hand.length === 0) {
    gameStatus = 'won';
    winner = { id: playerId, name: playerObj.name };
  }

  // Advance to next player
  const nextIndex = getNextPlayerIndex(bs.currentPlayerIndex, bs.direction, playerCount, skip);
  bs.currentPlayerIndex = nextIndex;

  bs.moveHistory.push({
    playerId,
    action: 'play',
    card: { id: card.id, color: card.color, value: card.value },
    chosenColor: card.type === 'wild' ? chosenColor : null,
  });

  const nextPlayerId = bs.players[nextIndex].id;

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: gameStatus === 'active' ? nextPlayerId : state.current_turn,
    extra_state: {
      status: gameStatus,
      lastAction: {
        type: 'play',
        playerId,
        card: { color: card.type === 'wild' ? chosenColor : card.color, value: card.value },
      },
      winner,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { action: 'play', cardId: card.id, cardValue: card.value, cardColor: card.color, chosenColor },
  });

  if (gameStatus !== 'active') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
  }

  res.json({
    topCard: card,
    currentColor: bs.currentColor,
    direction: bs.direction,
    drawPending: bs.drawPending,
    gameStatus,
    winner,
    currentTurn: gameStatus === 'active' ? nextPlayerId : null,
    yourHand: hand,
    cardCounts: Object.fromEntries(bs.players.map(p => [p.id, bs.hands[p.id].length])),
  });
});

// Draw a card
router.post('/draw-card', async (req, res) => {
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

  if (extra.status !== 'active') {
    return res.status(400).json({ error: 'Game is already over' });
  }

  if (playerId !== state.current_turn) {
    return res.status(400).json({ error: 'Not your turn' });
  }

  // If drawPending > 0, player must draw that many
  const drawCount = bs.drawPending > 0 ? bs.drawPending : 1;

  // Reshuffle discard pile into draw pile if needed
  function ensureDrawPile() {
    if (bs.drawPile.length === 0) {
      const topCard = bs.discardPile.pop();
      bs.drawPile = shuffleDeck(bs.discardPile);
      bs.discardPile = [topCard];
    }
  }

  const drawnCards = [];
  for (let i = 0; i < drawCount; i++) {
    ensureDrawPile();
    if (bs.drawPile.length === 0) break; // Extremely rare edge case
    drawnCards.push(bs.drawPile.shift());
  }

  bs.hands[playerId].push(...drawnCards);
  bs.drawPending = 0;

  // Update player card count
  const playerObj = bs.players.find(p => p.id === playerId);
  playerObj.cardCount = bs.hands[playerId].length;

  // After drawing penalty cards, turn passes. After voluntary draw of 1, turn also passes.
  const nextIndex = getNextPlayerIndex(bs.currentPlayerIndex, bs.direction, bs.players.length, false);
  bs.currentPlayerIndex = nextIndex;
  const nextPlayerId = bs.players[nextIndex].id;

  bs.moveHistory.push({ playerId, action: 'draw', count: drawnCards.length });

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: nextPlayerId,
    extra_state: {
      ...extra,
      lastAction: { type: 'draw', playerId, count: drawnCards.length },
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  await supabase.from('game_moves').insert({
    room_id: roomId,
    player_id: playerId,
    move_data: { action: 'draw', count: drawnCards.length },
  });

  res.json({
    drawnCards,
    yourHand: bs.hands[playerId],
    currentTurn: nextPlayerId,
    cardCounts: Object.fromEntries(bs.players.map(p => [p.id, bs.hands[p.id].length])),
  });
});

// Call UNO (when at 1 card)
router.post('/call-uno', async (req, res) => {
  const { roomId, playerId, targetPlayerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;

  // Self call: player declares UNO for themselves
  if (!targetPlayerId || targetPlayerId === playerId) {
    const hand = bs.hands[playerId];
    if (hand.length !== 1) {
      return res.status(400).json({ error: 'You can only call UNO when you have 1 card' });
    }

    const playerObj = bs.players.find(p => p.id === playerId);
    playerObj.calledUno = true;

    const { error: updateErr } = await supabase.from('game_state').update({
      board_state: bs,
    }).eq('room_id', roomId);

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    return res.json({ message: 'UNO called!', playerId });
  }

  // Catch another player: if they have 1 card and haven't called UNO, they draw 2
  const targetObj = bs.players.find(p => p.id === targetPlayerId);
  if (!targetObj) {
    return res.status(400).json({ error: 'Target player not found' });
  }

  const targetHand = bs.hands[targetPlayerId];
  if (targetHand.length !== 1) {
    return res.status(400).json({ error: 'Target does not have 1 card' });
  }

  if (targetObj.calledUno) {
    return res.status(400).json({ error: 'Target already called UNO' });
  }

  // Penalty: draw 2 cards
  function ensureDrawPile() {
    if (bs.drawPile.length === 0) {
      const topCard = bs.discardPile.pop();
      bs.drawPile = shuffleDeck(bs.discardPile);
      bs.discardPile = [topCard];
    }
  }

  const penaltyCards = [];
  for (let i = 0; i < 2; i++) {
    ensureDrawPile();
    if (bs.drawPile.length > 0) {
      penaltyCards.push(bs.drawPile.shift());
    }
  }

  targetHand.push(...penaltyCards);
  targetObj.cardCount = targetHand.length;

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    extra_state: {
      ...state.extra_state,
      lastAction: { type: 'uno_catch', catcher: playerId, target: targetPlayerId },
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({
    message: `${targetObj.name} caught without UNO! Drew 2 penalty cards.`,
    targetPlayerId,
    penaltyCount: penaltyCards.length,
    cardCounts: Object.fromEntries(bs.players.map(p => [p.id, bs.hands[p.id].length])),
  });
});

// Get current state (returns public info + requesting player's hand)
router.get('/state/:roomId', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const playerId = req.query.playerId;

  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', req.params.roomId)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Game not found' });

  const bs = data.board_state;
  const response = {
    players: bs.players,
    topCard: bs.discardPile[bs.discardPile.length - 1],
    currentColor: bs.currentColor,
    direction: bs.direction,
    drawPending: bs.drawPending,
    currentTurn: data.current_turn,
    extra_state: data.extra_state,
    cardCounts: Object.fromEntries(bs.players.map(p => [p.id, bs.hands[p.id].length])),
    drawPileCount: bs.drawPile.length,
  };

  // Include requesting player's hand if they identify themselves
  if (playerId && bs.hands[playerId]) {
    response.yourHand = bs.hands[playerId];
  }

  res.json(response);
});

module.exports = router;
