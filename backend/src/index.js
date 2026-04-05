const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const roomRoutes = require('./rooms/routes');
const chessRoutes = require('./games/chess/routes');
const backgammonRoutes = require('./games/backgammon/routes');
const memeRoutes = require('./games/meme/routes');
const unoRoutes = require('./games/uno/routes');
const connect4Routes = require('./games/connect4/routes');
const checkersRoutes = require('./games/checkers/routes');
const snapRoutes = require('./games/snap/routes');
const warRoutes = require('./games/war/routes');
const videoRoutes = require('./video/routes');
const leaderboardRoutes = require('./scoring/routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client (service role for server-side operations)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mjphpctvuxmbjhmcscoj.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// Make supabase available to routes
app.locals.supabase = supabase;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AzureNexus Games API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/games/chess', chessRoutes);
app.use('/api/games/backgammon', backgammonRoutes);
app.use('/api/games/meme', memeRoutes);
app.use('/api/games/uno', unoRoutes);
app.use('/api/games/connect4', connect4Routes);
app.use('/api/games/checkers', checkersRoutes);
app.use('/api/games/snap', snapRoutes);
app.use('/api/games/war', warRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.listen(PORT, () => {
  console.log(`AzureNexus Games API running on port ${PORT}`);
});
