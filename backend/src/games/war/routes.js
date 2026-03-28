// War is client-side only — no server logic needed
const { Router } = require('express');
const router = Router();

router.get('/info', (req, res) => {
  res.json({ game: 'war', type: 'client-side', description: 'Single-player card game vs computer' });
});

module.exports = router;
