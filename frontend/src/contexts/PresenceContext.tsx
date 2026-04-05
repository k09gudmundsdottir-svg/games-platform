import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  "https://mjphpctvuxmbjhmcscoj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcGhwY3R2dXhtYmpobWNzY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjgzMzQsImV4cCI6MjA4NzgwNDMzNH0.dsmzK7SS4_RSC5wbN6ifhjRlOSbfDZjIcfh2MKkDQIs"
);

export interface OnlineUser {
  id: string;
  username: string;
  avatar: string;
  status: "online" | "in-game";
  currentGame?: string;
}

export interface GameInvite {
  from: OnlineUser;
  game: string;
  slug: string;
  roomId: string;
  timestamp: number;
}

interface PresenceContextType {
  onlineUsers: OnlineUser[];
  pendingInvite: GameInvite | null;
  sendInvite: (toUserId: string, game: string, slug: string) => void;
  acceptInvite: () => string | null; // returns roomId
  declineInvite: () => void;
  setMyStatus: (status: "online" | "in-game", game?: string) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  pendingInvite: null,
  sendInvite: () => {},
  acceptInvite: () => null,
  declineInvite: () => {},
  setMyStatus: () => {},
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children, user }: { children: ReactNode; user: any }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [pendingInvite, setPendingInvite] = useState<GameInvite | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const myId = user?.id || "";
  const myName = user?.username || (user as any)?.email?.split("@")[0] || "Player";
  const myAvatar = user?.avatar || "";

  useEffect(() => {
    if (!myId) return;

    // Join presence channel
    const ch = supabase.channel("game-lobby", {
      config: { presence: { key: myId } },
    });

    // Track presence
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const users: OnlineUser[] = [];
      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (key === myId) return; // Don't show ourselves
        const p = presences[0];
        users.push({
          id: key,
          username: p.username || "Player",
          avatar: p.avatar || "",
          status: p.status || "online",
          currentGame: p.currentGame,
        });
      });
      setOnlineUsers(users);
    });

    // Listen for game invites
    ch.on("broadcast", { event: "game-invite" }, ({ payload }) => {
      if (payload.toUserId === myId) {
        setPendingInvite(payload.invite as GameInvite);
        // Auto-expire invite after 30 seconds
        setTimeout(() => setPendingInvite((prev) =>
          prev?.timestamp === payload.invite.timestamp ? null : prev
        ), 30000);
      }
    });

    // Listen for invite accepted
    ch.on("broadcast", { event: "invite-accepted" }, ({ payload }) => {
      if (payload.fromUserId === myId) {
        // The other player accepted — navigate to the game room
        window.dispatchEvent(new CustomEvent("invite-accepted", { detail: payload }));
      }
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({
          username: myName,
          avatar: myAvatar,
          status: "online",
          online_at: new Date().toISOString(),
        });
      }
    });

    setChannel(ch);

    return () => {
      ch.unsubscribe();
    };
  }, [myId, myName, myAvatar]);

  const sendInvite = useCallback((toUserId: string, game: string, slug: string) => {
    if (!channel) return;
    const roomId = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const invite: GameInvite = {
      from: { id: myId, username: myName, avatar: myAvatar, status: "online" },
      game,
      slug,
      roomId,
      timestamp: Date.now(),
    };
    channel.send({
      type: "broadcast",
      event: "game-invite",
      payload: { toUserId, invite },
    });
    // Navigate to waiting room
    window.location.href = `/play/${slug}-online?room=${roomId}&waiting=true`;
  }, [channel, myId, myName, myAvatar]);

  const acceptInvite = useCallback(() => {
    if (!pendingInvite || !channel) return null;
    const { roomId, slug } = pendingInvite;
    // Notify the inviter
    channel.send({
      type: "broadcast",
      event: "invite-accepted",
      payload: {
        fromUserId: pendingInvite.from.id,
        acceptedBy: myName,
        roomId,
        slug,
      },
    });
    setPendingInvite(null);
    return roomId;
  }, [pendingInvite, channel, myName]);

  const declineInvite = useCallback(() => {
    setPendingInvite(null);
  }, []);

  const setMyStatus = useCallback((status: "online" | "in-game", game?: string) => {
    if (!channel) return;
    channel.track({
      username: myName,
      avatar: myAvatar,
      status,
      currentGame: game,
      online_at: new Date().toISOString(),
    });
  }, [channel, myName, myAvatar]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, pendingInvite, sendInvite, acceptInvite, declineInvite, setMyStatus }}>
      {children}
    </PresenceContext.Provider>
  );
};
