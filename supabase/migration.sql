-- ══════════════════════════════════════════════════════════════════
-- AzureNexus Games — Supabase Schema Migration
-- ══════════════════════════════════════════════════════════════════

-- Game rooms (supports 2-8 players)
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type TEXT NOT NULL CHECK (game_type IN ('chess', 'backgammon', 'meme', 'uno', 'connect4', 'checkers')),
    room_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    host_player_id TEXT NOT NULL,
    player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game state (one row per active game)
CREATE TABLE IF NOT EXISTS game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    board_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_turn TEXT,
    extra_state JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id)
);

-- Move history
CREATE TABLE IF NOT EXISTS game_moves (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    move_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- What Do You Meme: submissions per round
CREATE TABLE IF NOT EXISTS meme_submissions (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id TEXT NOT NULL,
    caption_card TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- What Do You Meme: scores
CREATE TABLE IF NOT EXISTS meme_scores (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    UNIQUE(room_id, player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_code ON game_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_state_room ON game_state(room_id);
CREATE INDEX IF NOT EXISTS idx_moves_room ON game_moves(room_id);
CREATE INDEX IF NOT EXISTS idx_meme_sub_room ON meme_submissions(room_id, round_number);
CREATE INDEX IF NOT EXISTS idx_meme_scores_room ON meme_scores(room_id);

-- RLS
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_scores ENABLE ROW LEVEL SECURITY;

-- Anon read all
CREATE POLICY anon_read_rooms ON game_rooms FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_state ON game_state FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_moves ON game_moves FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_meme_sub ON meme_submissions FOR SELECT TO anon USING (true);
CREATE POLICY anon_read_meme_scores ON meme_scores FOR SELECT TO anon USING (true);

-- Anon write for game rooms and state (needed for client-side persistence)
CREATE POLICY anon_write_rooms ON game_rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_rooms ON game_rooms FOR UPDATE TO anon USING (true);
CREATE POLICY anon_write_state ON game_state FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_state ON game_state FOR UPDATE TO anon USING (true);

-- Service role full access
CREATE POLICY service_rooms ON game_rooms FOR ALL TO service_role USING (true);
CREATE POLICY service_state ON game_state FOR ALL TO service_role USING (true);
CREATE POLICY service_moves ON game_moves FOR ALL TO service_role USING (true);
CREATE POLICY service_meme_sub ON meme_submissions FOR ALL TO service_role USING (true);
CREATE POLICY service_meme_scores ON meme_scores FOR ALL TO service_role USING (true);

-- Realtime: enable for game_state (main sync channel)
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER state_updated_at BEFORE UPDATE ON game_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
