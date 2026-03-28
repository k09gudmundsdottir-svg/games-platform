import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const GAMES = [
  {
    id: 'chess',
    name: 'Chess',
    icon: '♟',
    players: '2 players',
    description: 'The classic game of strategy. Outmaneuver your opponent and capture the king.',
    gradient: 'from-amber-500/20 to-orange-600/20',
    border: 'hover:border-amber-500/50',
    iconColor: 'text-amber-400',
    available: true,
  },
  {
    id: 'backgammon',
    name: 'Backgammon',
    icon: '🎲',
    players: '2 players',
    description: 'Race your pieces off the board. A timeless blend of strategy and luck.',
    gradient: 'from-emerald-500/20 to-teal-600/20',
    border: 'hover:border-emerald-500/50',
    iconColor: 'text-emerald-400',
    available: false,
  },
  {
    id: 'meme',
    name: 'What Do You Meme',
    icon: '😂',
    players: '3-8 players',
    description: 'Caption meme images and vote for the funniest. Video chat required.',
    gradient: 'from-pink-500/20 to-rose-600/20',
    border: 'hover:border-pink-500/50',
    iconColor: 'text-pink-400',
    available: false,
  },
  {
    id: 'uno',
    name: 'UNO',
    icon: '🃏',
    players: '2-6 players',
    description: 'Match colors and numbers. Play action cards to sabotage your friends.',
    gradient: 'from-red-500/20 to-red-600/20',
    border: 'hover:border-red-500/50',
    iconColor: 'text-red-400',
    available: false,
  },
  {
    id: 'connect4',
    name: 'Connect Four',
    icon: '🔴',
    players: '2 players',
    description: 'Drop discs and be the first to connect four in a row. Simple yet deep.',
    gradient: 'from-blue-500/20 to-cyan-600/20',
    border: 'hover:border-blue-500/50',
    iconColor: 'text-blue-400',
    available: false,
  },
  {
    id: 'checkers',
    name: 'Checkers',
    icon: '⬛',
    players: '2 players',
    description: 'Jump and capture your way to victory. King your pieces for double power.',
    gradient: 'from-violet-500/20 to-purple-600/20',
    border: 'hover:border-violet-500/50',
    iconColor: 'text-violet-400',
    available: false,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // { game, mode: 'create' | 'join' }
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function openGameModal(game) {
    setError('');
    setRoomCode('');
    setModal({ game });
  }

  async function handleCreate() {
    if (!playerName.trim()) {
      setError('Enter your display name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('player_name', playerName.trim());
      const room = await api.rooms.create({
        game_type: modal.game.id,
        player_name: playerName.trim(),
      });
      localStorage.setItem('player_id', room.player_id);
      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!playerName.trim()) {
      setError('Enter your display name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Enter the room code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('player_name', playerName.trim());
      const room = await api.rooms.join(roomCode.trim().toUpperCase(), {
        player_name: playerName.trim(),
      });
      localStorage.setItem('player_id', room.player_id);
      navigate(`/room/${room.code}`);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4">
            <span className="gradient-text">AzureNexus</span>{' '}
            <span className="text-white">Games</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time multiplayer games with friends. Pick a game, share the code, and play.
          </p>
        </header>

        {/* Quick Join */}
        <div className="max-w-md mx-auto mb-16">
          <div className="glass rounded-2xl p-4 flex gap-3">
            <input
              type="text"
              placeholder="Enter room code to join..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all text-center font-mono text-lg tracking-widest uppercase"
            />
            <button
              onClick={() => {
                if (roomCode.trim()) {
                  setModal({ game: null });
                }
              }}
              className="btn-primary whitespace-nowrap"
            >
              Join Game
            </button>
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => openGameModal(game)}
              className={`group relative text-left bg-gradient-to-br ${game.gradient} bg-gray-900 border border-gray-800 ${game.border} rounded-2xl p-6 shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-brand-500/50`}
            >
              {!game.available && (
                <span className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                  Coming Soon
                </span>
              )}
              <div className={`text-5xl mb-4 ${game.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {game.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
              <p className="text-sm font-medium text-gray-400 mb-3">{game.players}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{game.description}</p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-sm text-gray-600">
          <p>AzureNexus Games &mdash; Built for fun, designed for competition.</p>
        </footer>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { setModal(null); setError(''); }}
        >
          <div
            className="w-full max-w-md card animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {modal.game ? modal.game.name : 'Join Game'}
                </h2>
                {modal.game && (
                  <p className="text-sm text-gray-400 mt-1">{modal.game.players}</p>
                )}
              </div>
              <button
                onClick={() => { setModal(null); setError(''); }}
                className="btn-ghost text-gray-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  className="input-field"
                  autoFocus
                />
              </div>

              {!modal.game && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Room Code</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="input-field text-center font-mono text-lg tracking-widest uppercase"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                {modal.game ? (
                  <>
                    <button
                      onClick={handleCreate}
                      disabled={loading || !modal.game.available}
                      className="btn-primary flex-1"
                    >
                      {loading ? 'Creating...' : 'Create Room'}
                    </button>
                    <button
                      onClick={() => setModal({ game: null })}
                      className="btn-secondary flex-1"
                    >
                      Join Existing
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Joining...' : 'Join Room'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
