/**
 * PlayVault Legends — Leaderboard API
 */
const express = require('express');
const router = express.Router();

// GET /api/leaderboard?game=Chess&limit=50
router.get('/', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { game, limit = 50 } = req.query;

  let query = supabase
    .from('player_stats')
    .select('*')
    .gt('total_games', 0)
    .order('elo_rating', { ascending: false })
    .limit(parseInt(limit) || 50);

  if (game && game !== 'All') {
    query = query.eq('game_type', game);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const leaderboard = (data || []).map((row, i) => ({
    rank: i + 1,
    playerId: row.player_id,
    name: row.display_name,
    game: row.game_type,
    rating: row.elo_rating,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    totalGames: row.total_games,
    winRate: row.total_games > 0 ? Math.round((row.wins / row.total_games) * 100) : 0,
    winStreak: row.win_streak,
    bestStreak: row.best_streak,
    lastPlayed: row.last_played,
  }));

  res.json(leaderboard);
});

// GET /api/leaderboard/player/:playerId
router.get('/player/:playerId', async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { playerId } = req.params;

  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .order('elo_rating', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
