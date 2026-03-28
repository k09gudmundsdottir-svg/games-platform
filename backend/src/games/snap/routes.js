// Snap is client-side only — no server logic needed
// This stub exists so the Express router doesn't error
const { Router } = require('express');
const router = Router();

router.get('/info', (req, res) => {
  res.json({ game: 'snap', type: 'client-side', description: 'Single-player card matching game' });
});

module.exports = router;
