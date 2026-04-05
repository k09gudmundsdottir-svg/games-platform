/**
 * PlayVault Challenge System — Presence + Challenges + Game Creation
 *
 * Presence: Supabase Realtime Presence on "playvault:presence"
 * Challenges: Supabase table subscriptions (INSERT for incoming, UPDATE for status)
 * Games: Created on accept, both players auto-navigate
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────

export interface OnlinePlayer {
  id: string;
  displayName: string;
  avatarUrl: string;
  status: "online" | "in_game";
  currentGame: string | null;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  game_type: "chess" | "backgammon";
  status: string;
  game_id: string | null;
  created_at: string;
  expires_at: string;
  // Enriched from presence
  challengerName?: string;
}

interface ChallengeContextType {
  onlinePlayers: OnlinePlayer[];
  incomingChallenge: Challenge | null;
  outgoingChallenge: Challenge | null;
  sendChallenge: (targetUserId: string, gameType: "chess" | "backgammon") => Promise<void>;
  acceptChallenge: (challengeId: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  cancelChallenge: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextType>({
  onlinePlayers: [],
  incomingChallenge: null,
  outgoingChallenge: null,
  sendChallenge: async () => {},
  acceptChallenge: async () => {},
  declineChallenge: async () => {},
  cancelChallenge: async () => {},
});

export const useChallenge = () => useContext(ChallengeContext);

// ── Initial game states ────────────────────────────────────

const INITIAL_CHESS_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const INITIAL_BACKGAMMON_STATE = {
  board: (() => {
    const b = new Array(24).fill(0);
    b[0] = -2; b[5] = 5; b[7] = 3; b[11] = -5;
    b[12] = 5; b[16] = -3; b[18] = -5; b[23] = 2;
    return b;
  })(),
  bar: { white: 0, black: 0 },
  off: { white: 0, black: 0 },
  dice: [],
};

// ── Provider ───────────────────────────────────────────────

export const ChallengeProvider = ({ children, userId, displayName, avatarUrl }: {
  children: ReactNode;
  userId: string | null;
  displayName: string;
  avatarUrl: string;
}) => {
  const navigate = useNavigate();
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<Challenge | null>(null);
  const presenceRef = useRef<RealtimeChannel | null>(null);
  const challengeSubRef = useRef<RealtimeChannel | null>(null);
  const playersMapRef = useRef<Map<string, OnlinePlayer>>(new Map());

  // ── Presence ─────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel("playvault:presence", {
      config: { presence: { key: userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const players: OnlinePlayer[] = [];
      const map = new Map<string, OnlinePlayer>();

      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (key === userId) return;
        const p = presences[0];
        const player: OnlinePlayer = {
          id: key,
          displayName: p.display_name || "Player",
          avatarUrl: p.avatar_url || "",
          status: p.status || "online",
          currentGame: p.current_game || null,
        };
        players.push(player);
        map.set(key, player);
      });

      setOnlinePlayers(players);
      playersMapRef.current = map;
    });

    // Listen for incoming challenge broadcast (instant — no DB delay)
    channel.on("broadcast", { event: "challenge-sent" }, ({ payload }: any) => {
      if (payload.targetUserId === userId && payload.status === "pending") {
        setIncomingChallenge({
          ...payload,
          challengerName: payload.challengerName || "Someone",
        } as Challenge);
        setTimeout(() => {
          setIncomingChallenge((prev) => prev?.id === payload.id ? null : prev);
        }, 60000);
      }
    });

    // Listen for challenge-accepted broadcast (backup for postgres_changes)
    channel.on("broadcast", { event: "challenge-accepted" }, ({ payload }: any) => {
      if (payload.challengerId === userId && payload.gameId) {
        setOutgoingChallenge(null);
        const path = payload.gameType === "chess"
          ? `/play/chess?game=${payload.gameId}`
          : `/play/backgammon-online?game=${payload.gameId}`;
        navigate(path);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          display_name: displayName,
          avatar_url: avatarUrl,
          status: "online",
          current_game: null,
        });
      }
    });

    presenceRef.current = channel;

    return () => {
      channel.unsubscribe();
      presenceRef.current = null;
    };
  }, [userId, displayName, avatarUrl, navigate]);

  // ── Challenge subscriptions ──────────────────────────────

  useEffect(() => {
    if (!userId) return;

    // Subscribe to challenges table changes for this user
    const channel = supabase
      .channel("challenges-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "challenges",
          filter: `challenged_id=eq.${userId}`,
        },
        (payload) => {
          const challenge = payload.new as Challenge;
          if (challenge.status === "pending") {
            // Enrich with challenger name from presence
            const challenger = playersMapRef.current.get(challenge.challenger_id);
            challenge.challengerName = challenger?.displayName || "Someone";
            setIncomingChallenge(challenge);

            // Auto-expire after 60 seconds
            setTimeout(() => {
              setIncomingChallenge((prev) =>
                prev?.id === challenge.id ? null : prev
              );
            }, 60000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "challenges",
          filter: `challenger_id=eq.${userId}`,
        },
        (payload) => {
          const challenge = payload.new as Challenge;

          if (challenge.status === "accepted" && challenge.game_id) {
            // Challenge accepted — navigate to game!
            setOutgoingChallenge(null);
            const path = challenge.game_type === "chess"
              ? `/play/chess?game=${challenge.game_id}`
              : `/play/backgammon-online?game=${challenge.game_id}`;
            navigate(path);
          } else if (challenge.status === "declined" || challenge.status === "expired") {
            setOutgoingChallenge(null);
          }
        }
      )
      .subscribe();

    challengeSubRef.current = channel;

    return () => {
      channel.unsubscribe();
      challengeSubRef.current = null;
    };
  }, [userId, navigate]);

  // ── Actions ──────────────────────────────────────────────

  const sendChallenge = useCallback(async (targetUserId: string, gameType: "chess" | "backgammon") => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        challenger_id: userId,
        challenged_id: targetUserId,
        game_type: gameType,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send challenge:", error);
      return;
    }

    setOutgoingChallenge(data as Challenge);

    // Broadcast challenge via presence channel as instant backup
    if (presenceRef.current) {
      const challengerPlayer = playersMapRef.current.get(userId);
      presenceRef.current.send({
        type: "broadcast",
        event: "challenge-sent",
        payload: {
          ...(data as Challenge),
          challengerName: displayName,
          targetUserId,
        },
      });
    }
  }, [userId, displayName]);

  const acceptChallenge = useCallback(async (challengeId: string) => {
    if (!userId || !incomingChallenge) return;

    const challenge = incomingChallenge;
    const gameType = challenge.game_type;

    // Randomly assign colors
    const isWhite = Math.random() > 0.5;
    const whiteId = isWhite ? challenge.challenger_id : challenge.challenged_id;
    const blackId = isWhite ? challenge.challenged_id : challenge.challenger_id;

    // Create the game
    const initialState = gameType === "chess"
      ? { fen: INITIAL_CHESS_FEN }
      : INITIAL_BACKGAMMON_STATE;

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        game_type: gameType,
        white_player_id: whiteId,
        black_player_id: blackId,
        game_state: initialState,
        current_turn: whiteId,
      })
      .select()
      .single();

    if (gameError || !game) {
      console.error("Failed to create game:", gameError);
      return;
    }

    // Update challenge with game_id and status
    const { error: updateError } = await supabase
      .from("challenges")
      .update({
        status: "accepted",
        game_id: game.id,
        responded_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    if (updateError) {
      console.error("Failed to update challenge:", updateError);
    }

    // Also broadcast acceptance via presence channel as backup
    // (postgres_changes can be delayed)
    if (presenceRef.current) {
      presenceRef.current.send({
        type: "broadcast",
        event: "challenge-accepted",
        payload: {
          challengeId,
          gameId: game.id,
          gameType,
          challengerId: challenge.challenger_id,
        },
      });
    }

    setIncomingChallenge(null);

    // Navigate to the game
    const path = gameType === "chess"
      ? `/play/chess?game=${game.id}`
      : `/play/backgammon-online?game=${game.id}`;
    navigate(path);
  }, [userId, incomingChallenge, navigate]);

  const declineChallenge = useCallback(async (challengeId: string) => {
    await supabase
      .from("challenges")
      .update({
        status: "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", challengeId);

    setIncomingChallenge(null);
  }, []);

  const cancelChallenge = useCallback(async () => {
    if (!outgoingChallenge) return;

    await supabase
      .from("challenges")
      .update({ status: "cancelled" })
      .eq("id", outgoingChallenge.id);

    setOutgoingChallenge(null);
  }, [outgoingChallenge]);

  return (
    <ChallengeContext.Provider value={{
      onlinePlayers,
      incomingChallenge,
      outgoingChallenge,
      sendChallenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
    }}>
      {children}
    </ChallengeContext.Provider>
  );
};
