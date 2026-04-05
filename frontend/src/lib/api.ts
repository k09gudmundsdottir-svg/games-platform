const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

// ── Room APIs ───────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  ready: boolean;
}

export interface Room {
  id: string;
  game_type: string;
  room_code: string;
  status: string;
  host_player_id: string;
  player_ids: Player[];
  settings: Record<string, unknown>;
  created_at: string;
}

export const roomApi = {
  create: (gameType: string, hostName: string) =>
    request<{ room: Room; playerId: string; roomCode: string }>('/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ gameType, hostName }),
    }),

  join: (roomCode: string, playerName: string) =>
    request<{ room: Room; playerId: string }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName }),
    }),

  get: (roomCode: string) =>
    request<{ room: Room }>(`/rooms/${roomCode}`),

  ready: (roomCode: string, playerId: string) =>
    request<{ players: Player[] }>(`/rooms/${roomCode}/ready`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  start: (roomCode: string, playerId: string) =>
    request<{ status: string }>(`/rooms/${roomCode}/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  leave: (roomCode: string, playerId: string) =>
    request<{ players?: Player[]; deleted?: boolean }>(`/rooms/${roomCode}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),
};

// ── Chess APIs ──────────────────────────────────────────────────────────────

export const chessApi = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<{ boardState: any; currentTurn: string }>('/games/chess/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  move: (roomId: string, playerId: string, from: string, to: string, promotion?: string) =>
    request<any>('/games/chess/move', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, from, to, promotion }),
    }),

  legalMoves: (roomId: string, square: string) =>
    request<{ moves: { to: string; flags: string; san: string }[] }>('/games/chess/legal-moves', {
      method: 'POST',
      body: JSON.stringify({ roomId, square }),
    }),

  state: (roomId: string) =>
    request<any>(`/games/chess/state/${roomId}`),

  resign: (roomId: string, playerId: string) =>
    request<any>('/games/chess/resign', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),
};

// ── Connect 4 APIs ──────────────────────────────────────────────────────────

export const connect4Api = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<{ boardState: any; currentTurn: string }>('/games/connect4/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  drop: (roomId: string, playerId: string, column: number) =>
    request<any>('/games/connect4/drop', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, column }),
    }),

  state: (roomId: string) =>
    request<any>(`/games/connect4/state/${roomId}`),
};

// ── Checkers APIs ───────────────────────────────────────────────────────────

export const checkersApi = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<{ boardState: any; currentTurn: string }>('/games/checkers/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  move: (roomId: string, playerId: string, from: { row: number; col: number }, to: { row: number; col: number }) =>
    request<any>('/games/checkers/move', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, from, to }),
    }),

  legalMoves: (roomId: string, playerId: string, from?: { row: number; col: number }) =>
    request<{ moves: any[] }>('/games/checkers/legal-moves', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, from }),
    }),

  state: (roomId: string) =>
    request<any>(`/games/checkers/state/${roomId}`),
};

// ── UNO APIs ───────────────────────────────────────────────────────────────

export const unoApi = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<any>('/games/uno/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  playCard: (roomId: string, playerId: string, cardId: number, chosenColor?: string) =>
    request<any>('/games/uno/play-card', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, cardId, chosenColor }),
    }),

  drawCard: (roomId: string, playerId: string) =>
    request<any>('/games/uno/draw-card', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),

  callUno: (roomId: string, playerId: string, targetPlayerId?: string) =>
    request<any>('/games/uno/call-uno', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, targetPlayerId }),
    }),

  state: (roomId: string, playerId?: string) =>
    request<any>(`/games/uno/state/${roomId}${playerId ? `?playerId=${playerId}` : ''}`),
};

// ── Backgammon APIs ────────────────────────────────────────────────────────

export const backgammonApi = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<any>('/games/backgammon/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  roll: (roomId: string, playerId: string) =>
    request<any>('/games/backgammon/roll', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),

  move: (roomId: string, playerId: string, from: number | string, to: number | string) =>
    request<any>('/games/backgammon/move', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, from, to }),
    }),

  legalMoves: (roomId: string, playerId: string) =>
    request<any>('/games/backgammon/legal-moves', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),

  double: (roomId: string, playerId: string) =>
    request<any>('/games/backgammon/double', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),

  doubleResponse: (roomId: string, playerId: string, accept: boolean) =>
    request<any>('/games/backgammon/double-response', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, accept }),
    }),

  state: (roomId: string) =>
    request<any>(`/games/backgammon/state/${roomId}`),
};

// ── Meme Game APIs ─────────────────────────────────────────────────────────

export const memeApi = {
  init: (roomId: string, players: { id: string; name: string }[]) =>
    request<any>('/games/meme/init', {
      method: 'POST',
      body: JSON.stringify({ roomId, players }),
    }),

  submitCaption: (roomId: string, playerId: string, cardId: number) =>
    request<any>('/games/meme/submit-caption', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, cardId }),
    }),

  judgePick: (roomId: string, playerId: string, winnerIndex: number) =>
    request<any>('/games/meme/judge-pick', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId, winnerIndex }),
    }),

  nextRound: (roomId: string, playerId: string) =>
    request<any>('/games/meme/next-round', {
      method: 'POST',
      body: JSON.stringify({ roomId, playerId }),
    }),

  state: (roomId: string, playerId?: string) =>
    request<any>(`/games/meme/state/${roomId}${playerId ? `?playerId=${playerId}` : ''}`),
};

// ── Legends / Leaderboard ──────────────────────────────────────────────────

export const legendsApi = {
  recordResult: (opts: {
    gameType: string;
    winnerId: string;
    winnerName: string;
    loserId: string;
    loserName: string;
    isDraw?: boolean;
  }) =>
    request<any>('/leaderboard/record', {
      method: 'POST',
      body: JSON.stringify(opts),
    }),

  leaderboard: (game?: string, limit = 50) =>
    request<any>(`/leaderboard?game=${game || 'All'}&limit=${limit}`),

  playerStats: (playerId: string) =>
    request<any>(`/leaderboard/player/${playerId}`),
};
