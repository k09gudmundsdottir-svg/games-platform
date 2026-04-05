const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const router = express.Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIyfmB36L2K35K';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'kzC3YqT5dM9GAlLqkoOWzlIezacvh7CmSZRjOBtTEVM';
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || 'wss://video.games.azurenexus.com';

/**
 * POST /api/video/token
 * Body: { roomName, participantId, participantName, gameType }
 * Returns: { token, wsUrl }
 */
router.post('/token', async (req, res) => {
  try {
    const { roomName, participantId, participantName, gameType } = req.body;

    if (!roomName || !participantId || !participantName) {
      return res.status(400).json({ error: 'roomName, participantId, and participantName are required' });
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantId,
      name: participantName,
      ttl: '4h',
      metadata: JSON.stringify({ gameType }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      hidden: false,
    });

    const token = await at.toJwt();
    return res.json({ token, wsUrl: LIVEKIT_WS_URL });
  } catch (err) {
    console.error('Video token error:', err);
    return res.status(500).json({ error: 'Failed to generate video token' });
  }
});

module.exports = router;
