import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Landing from './components/platform/Landing';
import RoomLobby from './components/platform/RoomLobby';
import ChessGame from './components/games/chess/ChessGame';
import BackgammonGame from './components/games/backgammon/BackgammonGame';
import MemeGame from './components/games/meme/MemeGame';
import UnoGame from './components/games/uno/UnoGame';
import Connect4Game from './components/games/connect4/Connect4Game';
import CheckersGame from './components/games/checkers/CheckersGame';

const GAME_COMPONENTS = {
  chess: ChessGame,
  backgammon: BackgammonGame,
  meme: MemeGame,
  uno: UnoGame,
  connect4: Connect4Game,
  checkers: CheckersGame,
};

function GameRouter() {
  // The game type is determined by the room data.
  // For now, render based on URL or fallback to chess.
  // In production, the room's game_type would drive this.
  return <ChessGame />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a href="/" className="btn-primary">Go Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:roomCode" element={<RoomLobby />} />
        <Route path="/game/:roomCode" element={<GameRouter />} />
        <Route path="/game/:roomCode/chess" element={<ChessGame />} />
        <Route path="/game/:roomCode/backgammon" element={<BackgammonGame />} />
        <Route path="/game/:roomCode/meme" element={<MemeGame />} />
        <Route path="/game/:roomCode/uno" element={<UnoGame />} />
        <Route path="/game/:roomCode/connect4" element={<Connect4Game />} />
        <Route path="/game/:roomCode/checkers" element={<CheckersGame />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
