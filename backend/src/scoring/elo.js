/**
 * PlayVault Legends — ELO Rating & Score Tracking
 *
 * Standard ELO with K-factor adjustments:
 *   - New players (< 10 games): K=40
 *   - Intermediate (10-30 games): K=24
 *   - Established (> 30 games): K=16
 */

const GAME_TYPE_MAP = {
  chess: 'Chess',
  backgammon: 'Backgammon',
  checkers: 'Checkers',
  connect4: 'Connect Four',
  uno: 'UNO',
  meme: 'What Do You Meme',
  snap: 'Snap',
  war: 'War',
};

function getK(totalGames) {
  if (totalGames < 10) return 40;
  if (totalGames < 30) return 24;
  return 16;
}

function calculateElo(winnerRating, loserRating, winnerGames, loserGames, isDraw = false) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  const kW = getK(winnerGames);
  const kL = getK(loserGames);

  if (isDraw) {
    return {
      winnerNew: Math.round(winnerRating + kW * (0.5 - expectedWinner)),
      loserNew: Math.round(loserRating + kL * (0.5 - expectedLoser)),
      winnerChange: Math.round(kW * (0.5 - expectedWinner)),
      loserChange: Math.round(kL * (0.5 - expectedLoser)),
    };
  }

  return {
    winnerNew: Math.round(winnerRating + kW * (1 - expectedWinner)),
    loserNew: Math.round(loserRating + kL * (0 - expectedLoser)),
    winnerChange: Math.round(kW * (1 - expectedWinner)),
    loserChange: Math.round(kL * (0 - expectedLoser)),
  };
}

/**
 * Record game result and update player stats.
 * Called from game-end handlers.
 *
 * @param {object} supabase - Supabase client
 * @param {string} gameType - e.g. 'chess', 'backgammon'
 * @param {string} roomId - game room ID
 * @param {object|null} winner - { id, name } or null for draw
 * @param {object|null} loser - { id, name } or null for draw
 * @param {string[]} drawPlayers - [{id, name}, ...] if draw
 */
async function recordResult(supabase, gameType, roomId, winner, loser, drawPlayers = []) {
  const game = GAME_TYPE_MAP[gameType] || gameType;
  const isDraw = !winner;

  try {
    if (isDraw && drawPlayers.length === 2) {
      // Draw — update both players
      const [s1, s2] = await Promise.all([
        getOrCreateStats(supabase, drawPlayers[0].id, drawPlayers[0].name, game),
        getOrCreateStats(supabase, drawPlayers[1].id, drawPlayers[1].name, game),
      ]);

      const elo = calculateElo(s1.elo_rating, s2.elo_rating, s1.total_games, s2.total_games, true);

      await Promise.all([
        supabase.from('player_stats').update({
          draws: s1.draws + 1,
          total_games: s1.total_games + 1,
          elo_rating: elo.winnerNew,
          win_streak: 0,
          last_played: new Date().toISOString(),
        }).eq('id', s1.id),
        supabase.from('player_stats').update({
          draws: s2.draws + 1,
          total_games: s2.total_games + 1,
          elo_rating: elo.loserNew,
          win_streak: 0,
          last_played: new Date().toISOString(),
        }).eq('id', s2.id),
      ]);

      return { draw: true, p1Change: elo.winnerChange, p2Change: elo.loserChange };
    }

    if (!winner || !loser) return null;

    // Win/Loss — update both players
    const [ws, ls] = await Promise.all([
      getOrCreateStats(supabase, winner.id, winner.name, game),
      getOrCreateStats(supabase, loser.id, loser.name, game),
    ]);

    const elo = calculateElo(ws.elo_rating, ls.elo_rating, ws.total_games, ls.total_games);
    const newStreak = ws.win_streak + 1;

    await Promise.all([
      supabase.from('player_stats').update({
        wins: ws.wins + 1,
        total_games: ws.total_games + 1,
        elo_rating: elo.winnerNew,
        win_streak: newStreak,
        best_streak: Math.max(ws.best_streak, newStreak),
        last_played: new Date().toISOString(),
      }).eq('id', ws.id),
      supabase.from('player_stats').update({
        losses: ls.losses + 1,
        total_games: ls.total_games + 1,
        elo_rating: elo.loserNew,
        win_streak: 0,
        last_played: new Date().toISOString(),
      }).eq('id', ls.id),
    ]);

    return {
      draw: false,
      winnerEloChange: elo.winnerChange,
      loserEloChange: elo.loserChange,
      winnerNewElo: elo.winnerNew,
      loserNewElo: elo.loserNew,
    };
  } catch (err) {
    console.error('[Legends] Failed to record result:', err);
    return null;
  }
}

async function getOrCreateStats(supabase, playerId, displayName, game) {
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('game_type', game)
    .single();

  if (data) return data;

  // Create new stats row
  const { data: created, error } = await supabase
    .from('player_stats')
    .insert({
      player_id: playerId,
      display_name: displayName,
      game_type: game,
      elo_rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      total_games: 0,
      win_streak: 0,
      best_streak: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[Legends] Failed to create stats:', error);
    // Race condition: might already exist
    const { data: retry } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('game_type', game)
      .single();
    return retry;
  }

  return created;
}

module.exports = { recordResult, calculateElo, GAME_TYPE_MAP };
