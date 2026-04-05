-- ══════════════════════════════════════════════════════════════════
-- PlayVault Legends — Player Stats & Leaderboard
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS player_stats (
    id BIGSERIAL PRIMARY KEY,
    player_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Player',
    game_type TEXT NOT NULL,
    elo_rating INT NOT NULL DEFAULT 1200,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    total_games INT NOT NULL DEFAULT 0,
    win_streak INT NOT NULL DEFAULT 0,
    best_streak INT NOT NULL DEFAULT 0,
    last_played TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, game_type)
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_stats_game_elo ON player_stats(game_type, elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_elo ON player_stats(elo_rating DESC);

-- RLS
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_read_stats ON player_stats FOR SELECT TO anon USING (true);
CREATE POLICY service_stats ON player_stats FOR ALL TO service_role USING (true);

-- Realtime for live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE player_stats;
