const { Router } = require('express');
const router = Router();

// 30+ Imgflip meme template IDs and names
const MEME_TEMPLATES = [
  { id: '181913649', name: 'Drake Hotline Bling' },
  { id: '87743020', name: 'Two Buttons' },
  { id: '112126428', name: 'Distracted Boyfriend' },
  { id: '131087935', name: 'Running Away Balloon' },
  { id: '97984', name: 'Disaster Girl' },
  { id: '438680', name: 'Batman Slapping Robin' },
  { id: '4087833', name: 'Waiting Skeleton' },
  { id: '124822590', name: 'Left Exit 12 Off Ramp' },
  { id: '93895088', name: 'Expanding Brain' },
  { id: '102156234', name: 'Mocking Spongebob' },
  { id: '61579', name: 'One Does Not Simply' },
  { id: '91538330', name: 'X X Everywhere' },
  { id: '247375501', name: 'Buff Doge vs Cheems' },
  { id: '222403160', name: 'Bernie I Am Once Again Asking' },
  { id: '188390779', name: 'Woman Yelling at Cat' },
  { id: '119139145', name: 'Blank Nut Button' },
  { id: '129242436', name: 'Change My Mind' },
  { id: '217743513', name: 'UNO Draw 25 Cards' },
  { id: '252600902', name: 'Always Has Been' },
  { id: '61520', name: 'Futurama Fry' },
  { id: '101470', name: 'Ancient Aliens' },
  { id: '61532', name: 'The Most Interesting Man' },
  { id: '61546', name: 'Brace Yourselves' },
  { id: '135256802', name: 'Epic Handshake' },
  { id: '80707627', name: 'Sad Pablo Escobar' },
  { id: '114585149', name: 'Inhaling Seagull' },
  { id: '161865971', name: 'Monkey Puppet' },
  { id: '259237855', name: 'Gigachad' },
  { id: '316466202', name: 'This Is Fine' },
  { id: '370867422', name: 'Megamind No Bitches' },
  { id: '91545132', name: 'Trump Bill Signing' },
  { id: '195515965', name: 'Clown Applying Makeup' },
];

// 150 unique caption cards
const CAPTION_CARDS = [
  // Awkward situations
  'When you wave back at someone who wasn\'t waving at you',
  'When you pull a push door in front of a crowd',
  'When you say "you too" after the waiter says "enjoy your meal"',
  'When you laugh at a joke you didn\'t hear and they ask you to explain it',
  'Sending a text to the person you were talking about',
  'When the barber shows you the back of your head and you pretend to check',
  'Making eye contact with someone through the bathroom stall gap',
  'When you trip in public and pretend to jog',
  'Accidentally liking a photo from 3 years deep in someone\'s feed',
  'When you and a stranger keep dodging the same direction on the sidewalk',
  'When the teacher says "pick a partner" and you make eye contact with no one',
  'Calling your teacher "mom" in front of the whole class',
  'When you forget someone\'s name 0.5 seconds after they tell you',
  'Holding the door for someone who\'s just far enough away to make it awkward',
  'When your stomach growls during a silent exam',

  // Tech culture
  'My code works and I have no idea why',
  'Closing 47 browser tabs after finishing one task',
  'When the fix is just adding a semicolon',
  '"Have you tried turning it off and on again?"',
  'When your 500 line function passes all tests on the first try',
  'Reading your own code from 6 months ago',
  'When the client says "just one small change"',
  'Stack Overflow: your question was marked as duplicate',
  'Deploying on a Friday afternoon',
  'When the intern pushes to main',
  'My WiFi signal in the room vs 2 feet away',
  'Git merge conflicts at 11 PM',
  'When you Google the error and the only result is your own unanswered post',
  'Explaining to grandma what you do for a living',
  'When the meeting could have been an email',

  // Work life
  'My face in the meeting vs my face after the meeting',
  'Pretending to type when the boss walks by',
  'When someone asks "got a minute?" and it takes an hour',
  'Logging in Monday morning like',
  'The vending machine taking my dollar and giving nothing',
  'When the office thermostat is set to either Arctic or Sahara',
  'Reply all apocalypse',
  'When your lunch disappears from the office fridge',
  'Taking a mental health day to binge an entire series',
  'When the printer jams right before the big presentation',
  'My LinkedIn profile vs my actual job',
  'Quiet quitting vs loud quitting',
  'When HR says "we\'re like a family here"',
  'Finding out the company pizza party is the annual raise',
  'The five stages of grief on a Sunday evening',

  // Relationships
  'When bae texts "we need to talk"',
  'My dating profile vs me in real life',
  'Watching your ex\'s life fall apart from a safe distance',
  'When they leave you on read for 3 hours then text "lol"',
  'Planning the wedding after the first date',
  'When your friend cancels plans and you were secretly hoping they would',
  'Me flirting vs me thinking I\'m flirting',
  'When your partner says "I\'m fine"',
  'Third-wheeling at dinner like',
  'When your crush likes your story but ignores your DM',
  'Stalking their Spotify playlists for emotional clues',
  'When they say "you\'re like a brother to me"',
  'My friend group chat at 3 AM',
  'When you both reach for the check but you\'re really hoping they grab it',
  'Sending a risky text then throwing your phone across the room',

  // Food
  'Ordering a salad then stealing fries off everyone else\'s plate',
  'When the waiter walks by with food but it\'s not for your table',
  'Meal prepping on Sunday vs ordering takeout on Monday',
  'My diet starting Monday vs my diet on Monday',
  'When someone says "I\'m not hungry" then eats half your food',
  'The audacity of charging extra for guacamole',
  'When the food delivery app says 15 minutes but it\'s been an hour',
  'Eating at 2 AM like nobody\'s watching',
  'When the recipe says "season to taste" and you have no taste',
  'The emotional damage of a broken yolk',
  'Pretending to read the menu when you already know your order',
  'When the grocery bill hits triple digits for 4 bags',
  'Microwave at work judging my sad desk lunch',
  'When someone eats the leftovers you were dreaming about all day',
  'My Uber Eats budget vs my savings account',

  // Animals
  'My dog when I come back from taking out the trash',
  'Cats at 3 AM for absolutely no reason',
  'When you talk to your pet in a full conversation',
  'The neighbor\'s dog barking at literally nothing',
  'My cat knocking things off the table and maintaining eye contact',
  'When the dog hears a cheese wrapper from three rooms away',
  'Trying to take a cute photo of your pet and they move',
  'When your fish is the only one who truly understands you',
  'Walking the dog at 6 AM in January regretting every life choice',
  'My cat sitting on my laptop during every important meeting',
  'When the vet bill costs more than your rent',
  'Dog: I will love you forever. Cat: I will allow your existence.',
  'When your pet gives you the guilt eyes as you leave for work',
  'Squirrels acting like they own the entire neighborhood',
  'My pet\'s vet behavior vs their home behavior',

  // Existential dread
  'When you realize it\'s already Wednesday and you\'ve done nothing',
  'Lying in bed doing the math on how much sleep you can still get',
  'My alarm going off: the villain origin story',
  'When you open the fridge for the 5th time hoping something new appeared',
  'Realizing your 10 year high school reunion is soon',
  'The void staring back during a 3 AM ceiling session',
  'When Sunday feels like it lasts 5 minutes',
  'Remembering something embarrassing from 7 years ago at 2 AM',
  'Checking your bank account after a weekend out',
  'When you sneeze and no one says bless you',
  'The existential crisis between shower and getting dressed',
  'When the dentist asks how often you floss and you consider lying',
  'Aging is just collecting new sounds your body makes',
  'Waking up before the alarm and feeling like you cheated death',
  'Googling symptoms at midnight and writing your will by 12:15',

  // Gen Z humor
  'Me: I should sleep. My brain: let\'s recap every mistake since 2009.',
  'POV: you\'re the main character but the genre is horror',
  'It\'s giving unhinged and I\'m here for it',
  'This is my Roman Empire',
  'No thoughts, head empty, just vibes',
  'The intrusive thoughts winning again',
  'Living my best life (delusional)',
  'Core memory unlocked (it\'s traumatic)',
  'Understood the assignment (the assignment was chaos)',
  'Caught in 4K and choosing to not elaborate',
  'That one neuron working overtime',
  'Tell me you\'re sleep deprived without telling me you\'re sleep deprived',
  'Emotional damage: critical hit',
  'When the group project carries your entire GPA',
  'My last brain cell during finals week',

  // Misc bangers
  'When the beat drops and you become a different person',
  'How I think I look vs how I actually look',
  'The "before coffee" vs "after coffee" transformation',
  'When you finally understand the math problem after the test',
  'Me explaining my purchase history to my bank account',
  'Pretending to be surprised at a surprise party',
  'When you hear your name in someone else\'s conversation',
  'The face you make when someone says "we need to talk about your browser history"',
  'When you find money in your old jacket pocket',
  'Taking 47 selfies and liking none of them',
  'Saying "that\'s crazy" when you weren\'t even listening',
  'When the teacher picks the kid who wasn\'t raising their hand',
  'Every Monday: surprised that it\'s Monday again',
  'When you promise to be ready in 5 minutes and it\'s been 30',
  'That feeling when you cancel plans successfully',
  'When someone starts a sentence with "no offense but"',
  'My face when the gas pump just keeps going',
  'When you step on a Lego at night',
  'When your phone dies at 20% because it gave up on life too',
  'The disappointed cricket noise when nobody laughs at your joke',
];

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandomMeme(usedIds) {
  const available = MEME_TEMPLATES.filter(t => !usedIds.includes(t.id));
  if (available.length === 0) return MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];
  return available[Math.floor(Math.random() * available.length)];
}

// Initialize a meme game
router.post('/init', async (req, res) => {
  const { roomId, players } = req.body;
  const supabase = req.app.locals.supabase;

  if (!roomId || !players || players.length < 3 || players.length > 8) {
    return res.status(400).json({ error: 'roomId and 3-8 players required' });
  }

  const shuffledCaptions = shuffle(CAPTION_CARDS);

  // Deal 7 caption cards per player
  const hands = {};
  let deckIndex = 0;
  for (const player of players) {
    hands[player.id] = [];
    for (let i = 0; i < 7; i++) {
      hands[player.id].push({
        id: deckIndex,
        text: shuffledCaptions[deckIndex % shuffledCaptions.length],
      });
      deckIndex++;
    }
  }

  // Build remaining caption deck
  const captionDeck = [];
  for (let i = deckIndex; i < shuffledCaptions.length; i++) {
    captionDeck.push({ id: i, text: shuffledCaptions[i] });
  }

  const currentMeme = pickRandomMeme([]);

  const playerList = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    score: 0,
  }));

  const boardState = {
    players: playerList,
    hands,
    captionDeck,
    currentMeme,
    usedMemeIds: [currentMeme.id],
    judgeIndex: 0,
    round: 1,
    submissions: [],
    phase: 'submitting', // submitting, judging, results
    roundHistory: [],
    winScore: 5,
    nextCardId: deckIndex + captionDeck.length,
  };

  const { error } = await supabase.from('game_state').upsert({
    room_id: roomId,
    board_state: boardState,
    current_turn: players[0].id, // judge
    extra_state: {
      status: 'active',
      phase: 'submitting',
      winner: null,
      currentMeme,
      judge: playerList[0],
    },
  });

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    currentMeme,
    judge: playerList[0],
    round: 1,
    players: playerList,
    phase: 'submitting',
  });
});

// Submit a caption
router.post('/submit-caption', async (req, res) => {
  const { roomId, playerId, cardId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;

  if (bs.phase !== 'submitting') {
    return res.status(400).json({ error: 'Not in submission phase' });
  }

  // Judge cannot submit
  const judgeId = bs.players[bs.judgeIndex].id;
  if (playerId === judgeId) {
    return res.status(400).json({ error: 'The judge cannot submit a caption' });
  }

  // Check player hasn't already submitted
  if (bs.submissions.find(s => s.playerId === playerId)) {
    return res.status(400).json({ error: 'You already submitted a caption this round' });
  }

  // Find the card in player's hand
  const hand = bs.hands[playerId];
  if (!hand) {
    return res.status(400).json({ error: 'Player not in this game' });
  }

  const cardIndex = hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(400).json({ error: 'Card not in your hand' });
  }

  const card = hand[cardIndex];

  // Remove card from hand
  hand.splice(cardIndex, 1);

  // Draw a replacement card from deck
  if (bs.captionDeck.length > 0) {
    hand.push(bs.captionDeck.shift());
  } else {
    // Recycle used captions from previous rounds
    const recycled = shuffle(CAPTION_CARDS).map((text, i) => ({
      id: bs.nextCardId + i,
      text,
    }));
    bs.nextCardId += recycled.length;
    bs.captionDeck = recycled;
    hand.push(bs.captionDeck.shift());
  }

  bs.submissions.push({
    playerId,
    playerName: bs.players.find(p => p.id === playerId).name,
    cardId: card.id,
    caption: card.text,
  });

  // Store submission in meme_submissions table
  await supabase.from('meme_submissions').insert({
    room_id: roomId,
    player_id: playerId,
    round: bs.round,
    caption: card.text,
    meme_template_id: bs.currentMeme.id,
  }).catch(() => {}); // Non-critical, don't fail the request

  // Check if all non-judge players have submitted
  const expectedSubmissions = bs.players.length - 1;
  if (bs.submissions.length >= expectedSubmissions) {
    bs.phase = 'judging';
    // Shuffle submissions so judge doesn't know who submitted what
    bs.submissions = shuffle(bs.submissions);
  }

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    extra_state: {
      ...state.extra_state,
      phase: bs.phase,
      submissionCount: bs.submissions.length,
      totalExpected: expectedSubmissions,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({
    submitted: true,
    phase: bs.phase,
    submissionCount: bs.submissions.length,
    totalExpected: expectedSubmissions,
    yourHand: hand,
  });
});

// Judge picks a winner
router.post('/judge-pick', async (req, res) => {
  const { roomId, playerId, winnerIndex } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;

  if (bs.phase !== 'judging') {
    return res.status(400).json({ error: 'Not in judging phase' });
  }

  const judgeId = bs.players[bs.judgeIndex].id;
  if (playerId !== judgeId) {
    return res.status(400).json({ error: 'Only the judge can pick a winner' });
  }

  if (winnerIndex < 0 || winnerIndex >= bs.submissions.length) {
    return res.status(400).json({ error: 'Invalid submission index' });
  }

  const winningSubmission = bs.submissions[winnerIndex];

  // Award point to winner
  const winnerPlayer = bs.players.find(p => p.id === winningSubmission.playerId);
  winnerPlayer.score += 1;

  // Store score in meme_scores
  await supabase.from('meme_scores').upsert({
    room_id: roomId,
    player_id: winningSubmission.playerId,
    score: winnerPlayer.score,
    rounds_won: winnerPlayer.score,
  }, { onConflict: 'room_id,player_id' }).catch(() => {});

  // Save round results
  bs.roundHistory.push({
    round: bs.round,
    meme: bs.currentMeme,
    judge: bs.players[bs.judgeIndex],
    submissions: bs.submissions,
    winner: winningSubmission,
  });

  bs.phase = 'results';

  // Check if someone won the game
  let gameWinner = null;
  let gameStatus = 'active';
  if (winnerPlayer.score >= bs.winScore) {
    gameWinner = winnerPlayer;
    gameStatus = 'won';
  }

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    extra_state: {
      status: gameStatus,
      phase: 'results',
      roundWinner: winningSubmission,
      winner: gameWinner,
      currentMeme: bs.currentMeme,
      judge: bs.players[bs.judgeIndex],
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  if (gameStatus === 'won') {
    await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomId);
  }

  res.json({
    roundWinner: winningSubmission,
    winningCaption: winningSubmission.caption,
    scores: bs.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    gameWinner,
    gameStatus,
    allSubmissions: bs.submissions,
  });
});

// Advance to next round
router.post('/next-round', async (req, res) => {
  const { roomId, playerId } = req.body;
  const supabase = req.app.locals.supabase;

  const { data: state, error: fetchErr } = await supabase
    .from('game_state')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (fetchErr || !state) return res.status(404).json({ error: 'Game not found' });

  const bs = state.board_state;

  if (bs.phase !== 'results') {
    return res.status(400).json({ error: 'Not in results phase' });
  }

  if (state.extra_state.status === 'won') {
    return res.status(400).json({ error: 'Game is already over' });
  }

  // Rotate judge
  bs.judgeIndex = (bs.judgeIndex + 1) % bs.players.length;
  bs.round += 1;
  bs.submissions = [];
  bs.phase = 'submitting';

  // Pick new meme
  bs.currentMeme = pickRandomMeme(bs.usedMemeIds);
  bs.usedMemeIds.push(bs.currentMeme.id);

  const newJudge = bs.players[bs.judgeIndex];

  const { error: updateErr } = await supabase.from('game_state').update({
    board_state: bs,
    current_turn: newJudge.id,
    extra_state: {
      status: 'active',
      phase: 'submitting',
      winner: null,
      currentMeme: bs.currentMeme,
      judge: newJudge,
    },
  }).eq('room_id', roomId);

  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({
    round: bs.round,
    currentMeme: bs.currentMeme,
    judge: newJudge,
    phase: 'submitting',
    scores: bs.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
  });
});

// Get current state
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
  const judge = bs.players[bs.judgeIndex];

  const response = {
    round: bs.round,
    phase: bs.phase,
    currentMeme: bs.currentMeme,
    judge,
    players: bs.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    submissionCount: bs.submissions.length,
    totalExpected: bs.players.length - 1,
    extra_state: data.extra_state,
    roundHistory: bs.roundHistory,
  };

  // Show submissions only during judging/results (anonymized during judging for non-judges)
  if (bs.phase === 'judging') {
    if (playerId === judge.id) {
      // Judge sees captions but not who submitted
      response.submissions = bs.submissions.map((s, i) => ({
        index: i,
        caption: s.caption,
      }));
    }
  } else if (bs.phase === 'results') {
    response.submissions = bs.submissions;
    response.roundWinner = data.extra_state.roundWinner;
  }

  // Include requesting player's hand
  if (playerId && bs.hands[playerId]) {
    response.yourHand = bs.hands[playerId];
  }

  // Has this player submitted this round?
  if (playerId) {
    response.hasSubmitted = bs.submissions.some(s => s.playerId === playerId);
  }

  res.json(response);
});

module.exports = router;
