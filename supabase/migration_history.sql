CREATE TABLE IF NOT EXISTS match_history (
    id BIGSERIAL PRIMARY KEY,
    game_type TEXT NOT NULL,
    winner_id TEXT NOT NULL,
    winner_name TEXT NOT NULL,
    loser_id TEXT NOT NULL,
    loser_name TEXT NOT NULL,
    winner_elo_change INT DEFAULT 0,
    loser_elo_change INT DEFAULT 0,
    is_draw BOOLEAN DEFAULT FALSE,
    played_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_winner ON match_history(winner_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_loser ON match_history(loser_id, played_at DESC);
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_read_history ON match_history FOR SELECT TO anon USING (true);
CREATE POLICY service_write_history ON match_history FOR ALL TO service_role USING (true);
