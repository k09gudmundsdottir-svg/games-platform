import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for subscribing to Supabase Realtime changes on the game_state table.
 *
 * @param {string} roomCode - The room code to filter game state updates.
 * @param {function} onUpdate - Callback invoked with the new game state payload.
 * @returns {{ gameState: object|null, connected: boolean, error: string|null }}
 */
export function useRealtime(roomCode, onUpdate) {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep the callback ref current without causing re-subscriptions
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!roomCode) return;

    const channelName = `game:${roomCode}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const newState = payload.new;
          setGameState(newState);
          if (onUpdateRef.current) {
            onUpdateRef.current(newState, payload.eventType);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          if (onUpdateRef.current) {
            onUpdateRef.current(payload.new, payload.eventType, 'room');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          setError(null);
        } else if (status === 'CLOSED') {
          setConnected(false);
        } else if (status === 'CHANNEL_ERROR') {
          setConnected(false);
          setError('Realtime connection error');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnected(false);
    };
  }, [roomCode]);

  const broadcast = useCallback(
    (event, payload) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        });
      }
    },
    []
  );

  return { gameState, connected, error, broadcast };
}

export default useRealtime;
