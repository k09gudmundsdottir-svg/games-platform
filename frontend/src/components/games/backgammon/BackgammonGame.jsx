import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function BackgammonGame() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-6">🎲</div>
        <h1 className="text-3xl font-bold text-white mb-2">Backgammon</h1>
        <p className="text-gray-400 mb-8">Coming Soon</p>
        <p className="text-sm text-gray-600 mb-6">
          This game is currently under development. Check back soon for the full experience.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-secondary">
            Home
          </button>
          <button onClick={() => navigate(`/room/${roomCode}`)} className="btn-primary">
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
