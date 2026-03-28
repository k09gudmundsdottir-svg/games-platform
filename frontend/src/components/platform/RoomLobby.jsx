import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useRealtime } from '../../hooks/useRealtime';
import JitsiPanel from '../shared/JitsiPanel';

export default function RoomLobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showJitsi, setShowJitsi] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const playerId = localStorage.getItem('player_id');
  const playerName = localStorage.getItem('player_name') || 'Player';

  const isHost = room?.host_id === playerId;
  const currentPlayer = room?.players?.find((p) => p.id === playerId);
  const readyCount = room?.players?.filter((p) => p.ready).length || 0;
  const totalPlayers = room?.players?.length || 0;

  // Min players depends on game type
  const minPlayers = room?.game_type === 'meme' ? 3 : 2;
  const canStart = isHost && readyCount >= minPlayers && totalPlayers >= minPlayers;

  // Fetch room data on mount
  useEffect(() => {
    async function fetchRoom() {
      try {
        const data = await api.rooms.get(roomCode);
        setRoom(data);
        if (data.status === 'playing') {
          navigate(`/game/${roomCode}`, { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Room not found');
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [roomCode, navigate]);

  // Realtime updates
  const handleRealtimeUpdate = useCallback(
    (newData, eventType, source) => {
      if (source === 'room') {
        setRoom((prev) => ({ ...prev, ...newData }));
        if (newData.status === 'playing') {
          navigate(`/game/${roomCode}`, { replace: true });
        }
      }
    },
    [navigate, roomCode]
  );

  useRealtime(roomCode, handleRealtimeUpdate);

  async function handleToggleReady() {
    try {
      const updated = await api.rooms.toggleReady(roomCode);
      setRoom((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStartGame() {
    if (!canStart) return;
    setStartingGame(true);
    try {
      await api.rooms.start(roomCode);
      navigate(`/game/${roomCode}`);
    } catch (err) {
      setError(err.message);
      setStartingGame(false);
    }
  }

  async function handleLeave() {
    try {
      await api.rooms.leave(roomCode);
      navigate('/');
    } catch {
      navigate('/');
    }
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const gameTypeLabels = {
    chess: 'Chess',
    backgammon: 'Backgammon',
    meme: 'What Do You Meme',
    uno: 'UNO',
    connect4: 'Connect Four',
    checkers: 'Checkers',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleLeave} className="btn-ghost text-gray-400">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Leave
          </button>
          <span className="text-sm text-gray-500">
            {gameTypeLabels[room?.game_type] || room?.game_type}
          </span>
        </div>

        {/* Room Code */}
        <div className="text-center mb-10">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Room Code</p>
          <button
            onClick={copyRoomCode}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-900 border-2 border-dashed border-gray-700 hover:border-brand-500/50 transition-all duration-200"
          >
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-[0.3em] text-white">
              {roomCode}
            </span>
            <span className="text-gray-500 group-hover:text-brand-400 transition-colors">
              {copied ? (
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </span>
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {copied ? 'Copied!' : 'Click to copy and share with friends'}
          </p>
        </div>

        {/* Player List */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Players ({totalPlayers})
            </h3>
            <span className="text-sm text-gray-400">
              {readyCount}/{totalPlayers} ready
            </span>
          </div>

          <div className="space-y-3">
            {room?.players?.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                  player.ready
                    ? 'bg-green-500/5 border-green-500/30'
                    : 'bg-gray-800/50 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      player.ready
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {player.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {player.name}
                      {player.id === room.host_id && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 uppercase tracking-wider font-bold">
                          Host
                        </span>
                      )}
                      {player.id === playerId && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-400 uppercase tracking-wider font-bold">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    player.ready ? 'text-green-400' : 'text-gray-500'
                  }`}
                >
                  {player.ready ? 'Ready' : 'Not ready'}
                </span>
              </div>
            ))}

            {/* Empty slots */}
            {room && totalPlayers < 2 && (
              <div className="flex items-center justify-center px-4 py-3 rounded-xl border border-dashed border-gray-800 text-gray-600 text-sm">
                Waiting for more players...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleToggleReady}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              currentPlayer?.ready
                ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-750'
                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/25'
            }`}
          >
            {currentPlayer?.ready ? 'Cancel Ready' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!canStart || startingGame}
              className="btn-primary flex-1"
            >
              {startingGame ? 'Starting...' : canStart ? 'Start Game' : `Need ${minPlayers} ready players`}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
            {error}
          </p>
        )}

        {/* Video Chat Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowJitsi(!showJitsi)}
            className="btn-ghost text-brand-400"
          >
            {showJitsi ? 'Hide Video Chat' : 'Enable Video Chat'}
          </button>
        </div>
      </div>

      {showJitsi && (
        <JitsiPanel
          roomCode={roomCode}
          mandatory={room?.game_type === 'meme'}
          displayName={playerName}
        />
      )}
    </div>
  );
}
