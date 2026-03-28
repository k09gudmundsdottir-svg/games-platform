import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { roomApi, Room, Player } from '@/lib/api';

export type RoomPhase = 'name' | 'choose' | 'create' | 'join' | 'lobby' | 'playing';

type SetGameStateFn = (gameState: any, extraState?: any, currentTurn?: string | null) => void;

interface UseGameRoomOptions {
  gameType: string;
  onGameInit: (roomId: string, players: { id: string; name: string }[], setGameState: SetGameStateFn) => Promise<void>;
}

interface GameRoomState {
  phase: RoomPhase;
  playerName: string;
  playerId: string | null;
  roomCode: string;
  roomId: string | null;
  isHost: boolean;
  players: Player[];
  error: string | null;
  gameState: any;
  extraState: any;
  currentTurn: string | null;
}

export function useGameRoom({ gameType, onGameInit }: UseGameRoomOptions) {
  const [state, setState] = useState<GameRoomState>({
    phase: 'name',
    playerName: '',
    playerId: null,
    roomCode: '',
    roomId: null,
    isHost: false,
    players: [],
    error: null,
    gameState: null,
    extraState: null,
    currentTurn: null,
  });

  const subscriptionRef = useRef<any>(null);
  const roomSubRef = useRef<any>(null);

  const set = useCallback((partial: Partial<GameRoomState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const setPlayerName = useCallback((name: string) => set({ playerName: name }), [set]);
  const setPhase = useCallback((phase: RoomPhase) => set({ phase, error: null }), [set]);
  const setError = useCallback((error: string | null) => set({ error }), [set]);

  // Create room
  const createRoom = useCallback(async () => {
    try {
      const res = await roomApi.create(gameType, state.playerName);
      set({
        phase: 'lobby',
        playerId: res.playerId,
        roomCode: res.roomCode,
        roomId: res.room.id,
        isHost: true,
        players: res.room.player_ids,
        error: null,
      });
    } catch (e: any) {
      set({ error: e.message });
    }
  }, [gameType, state.playerName, set]);

  // Join room
  const joinRoom = useCallback(async (code: string) => {
    try {
      const res = await roomApi.join(code, state.playerName);
      set({
        phase: 'lobby',
        playerId: res.playerId,
        roomCode: code.toUpperCase(),
        roomId: res.room.id,
        isHost: false,
        players: res.room.player_ids,
        error: null,
      });
    } catch (e: any) {
      set({ error: e.message });
    }
  }, [state.playerName, set]);

  // Ref-stable setGameState for use in callbacks
  const setGameState = useCallback((gameState: any, extraState?: any, currentTurn?: string | null) => {
    set({ gameState, ...(extraState !== undefined ? { extraState } : {}), ...(currentTurn !== undefined ? { currentTurn } : {}) });
  }, [set]);

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!state.playerId || !state.roomCode || !state.roomId) return;
    try {
      await roomApi.start(state.roomCode, state.playerId);
      const players = state.players.map(p => ({ id: p.id, name: p.name }));
      await onGameInit(state.roomId, players, setGameState);
      set({ phase: 'playing' });
    } catch (e: any) {
      set({ error: e.message });
    }
  }, [state.playerId, state.roomCode, state.roomId, state.players, onGameInit, set, setGameState]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (state.roomCode && state.playerId) {
      try {
        await roomApi.leave(state.roomCode, state.playerId);
      } catch { /* ignore */ }
    }
    set({
      phase: 'choose',
      roomCode: '',
      roomId: null,
      isHost: false,
      players: [],
      error: null,
    });
  }, [state.roomCode, state.playerId, set]);

  // Subscribe to room changes (lobby)
  useEffect(() => {
    if (!state.roomId || state.phase !== 'lobby') return;

    const channel = supabase
      .channel(`room-${state.roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${state.roomId}` },
        (payload: any) => {
          const room = payload.new as Room;
          if (room.player_ids) {
            set({ players: room.player_ids });
          }
          if (room.status === 'playing' && state.phase === 'lobby') {
            // Non-host: game was started by host, transition to playing
            // We need to wait a moment for game_state to be created
            setTimeout(async () => {
              set({ phase: 'playing' });
            }, 500);
          }
        }
      )
      .subscribe();

    roomSubRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomId, state.phase, set]);

  // Subscribe to game state changes (playing)
  useEffect(() => {
    if (!state.roomId || state.phase !== 'playing') return;

    const channel = supabase
      .channel(`game-${state.roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_state', filter: `room_id=eq.${state.roomId}` },
        (payload: any) => {
          const gs = payload.new;
          if (gs) {
            set({
              gameState: gs.board_state,
              extraState: gs.extra_state,
              currentTurn: gs.current_turn,
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.roomId, state.phase, set]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
      if (roomSubRef.current) supabase.removeChannel(roomSubRef.current);
    };
  }, []);

  return {
    ...state,
    setPlayerName,
    setPhase,
    setError,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    setGameState,
  };
}
