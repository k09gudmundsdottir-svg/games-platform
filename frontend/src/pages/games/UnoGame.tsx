import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Crown, User, Users, Plus, DoorOpen, X, RotateCcw, RotateCw } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { unoApi } from "@/lib/api";
import { useGameRoom } from "@/hooks/useGameRoom";

/* ── Card appearance helpers ────────────────────────────────────────────── */

const colorMap: Record<string, string> = {
  red: "from-red-600 to-red-800",
  blue: "from-blue-600 to-blue-800",
  green: "from-emerald-600 to-emerald-800",
  yellow: "from-yellow-500 to-yellow-700",
};

const colorBorder: Record<string, string> = {
  red: "border-red-400",
  blue: "border-blue-400",
  green: "border-emerald-400",
  yellow: "border-yellow-400",
};

const colorPickerColors = [
  { name: "red", bg: "bg-red-600 hover:bg-red-500", ring: "ring-red-400" },
  { name: "blue", bg: "bg-blue-600 hover:bg-blue-500", ring: "ring-blue-400" },
  { name: "green", bg: "bg-emerald-600 hover:bg-emerald-500", ring: "ring-emerald-400" },
  { name: "yellow", bg: "bg-yellow-500 hover:bg-yellow-400", ring: "ring-yellow-400" },
];

const currentColorIndicator: Record<string, string> = {
  red: "bg-red-600",
  blue: "bg-blue-600",
  green: "bg-emerald-600",
  yellow: "bg-yellow-500",
};

function cardLabel(value: string): string {
  switch (value) {
    case "skip": return "\u2298";
    case "reverse": return "\u27F2";
    case "draw2": return "+2";
    case "wild": return "\uD83C\uDF08";
    case "wild_draw4": return "+4";
    default: return value;
  }
}

interface UnoCardData {
  id: number;
  color: string | null;
  value: string;
  type: string;
}

/* ── Room Entry UI (reuses the same pattern as RoomDialog but inline) ── */

interface RoomFlowProps {
  room: ReturnType<typeof useGameRoom>;
  minPlayers: number;
  onStart: () => void;
}

const RoomFlow = ({ room, minPlayers, onStart }: RoomFlowProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(room.roomCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Name entry */}
          {room.phase === "name" && (
            <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">UNO</h2>
                <p className="text-sm font-body text-muted-foreground">Enter your display name</p>
              </div>
              <input
                type="text"
                placeholder="Your name..."
                value={room.playerName}
                onChange={(e) => room.setPlayerName(e.target.value)}
                maxLength={20}
                className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-center text-lg"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && room.playerName.trim()) room.setPhase("choose"); }}
              />
              <button
                disabled={!room.playerName.trim()}
                onClick={() => room.setPhase("choose")}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Choose create or join */}
          {room.phase === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <p className="text-center text-sm font-body text-muted-foreground mb-2">
                Welcome, <span className="text-foreground font-medium">{room.playerName}</span>
              </p>
              <button onClick={() => room.createRoom()} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-foreground">Create Room</p>
                  <p className="text-xs font-body text-muted-foreground">Generate a code to share</p>
                </div>
              </button>
              <button onClick={() => room.setPhase("join")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                  <DoorOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-semibold text-foreground">Join Room</p>
                  <p className="text-xs font-body text-muted-foreground">Enter a code to join</p>
                </div>
              </button>
              {room.error && <p className="text-xs text-destructive text-center font-body">{room.error}</p>}
            </motion.div>
          )}

          {/* Join code entry */}
          {room.phase === "join" && (
            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-sm font-body text-muted-foreground mb-3">Enter the room code</p>
                <input
                  type="text"
                  placeholder="Room code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-display text-2xl font-bold text-foreground text-center tracking-widest focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { room.setPhase("choose"); setJoinCode(""); }} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Back</button>
                <button disabled={joinCode.length < 4} onClick={() => room.joinRoom(joinCode)} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Join</button>
              </div>
              {room.error && <p className="text-xs text-destructive text-center font-body">{room.error}</p>}
            </motion.div>
          )}

          {/* Lobby */}
          {room.phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              {room.isHost && room.roomCode && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <span className="text-xs font-body text-muted-foreground">Room Code:</span>
                  <span className="font-display font-bold text-foreground tracking-widest">{room.roomCode}</span>
                  <button onClick={handleCopy} className="w-7 h-7 rounded-md bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                    {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-display font-medium text-foreground">Players</span>
                  </div>
                  <span className="text-xs font-body text-muted-foreground">{room.players.length} / {minPlayers} min</span>
                </div>
                <div className="space-y-2">
                  {room.players.map((player, i) => (
                    <motion.div key={player.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        {i === 0 ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-display font-medium text-foreground">{player.name}</p>
                        {i === 0 && <p className="text-[10px] font-body text-primary">Host</p>}
                      </div>
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </motion.div>
                  ))}
                  {Array.from({ length: Math.max(0, minPlayers - room.players.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/30">
                      <div className="w-9 h-9 rounded-lg bg-secondary/30 border border-border/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                      <p className="text-sm font-body text-muted-foreground/40">Waiting...</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
                <span className="text-xs font-body text-muted-foreground">
                  {room.players.length >= minPlayers ? "Ready to start!" : "Waiting for players..."}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={room.leaveRoom} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Leave</button>
                {room.isHost ? (
                  <button disabled={room.players.length < minPlayers} onClick={onStart} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Start Game</button>
                ) : (
                  <div className="flex-1 py-2.5 rounded-lg bg-secondary border border-border/30 text-sm font-display font-medium text-muted-foreground text-center">Waiting for host...</div>
                )}
              </div>
              {room.error && <p className="text-xs text-destructive text-center font-body">{room.error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ── Color Picker Overlay ──────────────────────────────────────────────── */

const ColorPicker = ({ onPick }: { onPick: (color: string) => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-8 rounded-2xl border border-border/50 bg-card shadow-2xl"
    >
      <p className="text-center font-display font-bold text-foreground mb-6 text-lg">Choose a color</p>
      <div className="grid grid-cols-2 gap-4">
        {colorPickerColors.map((c) => (
          <button
            key={c.name}
            onClick={() => onPick(c.name)}
            className={`w-20 h-20 rounded-2xl ${c.bg} transition-all hover:scale-110 hover:ring-4 ${c.ring} shadow-lg`}
          />
        ))}
      </div>
    </motion.div>
  </motion.div>
);

/* ── UNO Card Component ────────────────────────────────────────────────── */

interface CardProps {
  card: UnoCardData;
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  index?: number;
  total?: number;
  small?: boolean;
}

const UnoCard = ({ card, playable, selected, onClick, index = 0, total = 1, small }: CardProps) => {
  const color = card.color || "red";
  const isWild = card.type === "wild";
  const gradient = isWild
    ? "from-gray-700 via-gray-800 to-gray-900"
    : colorMap[color] || colorMap.red;
  const border = isWild
    ? (selected ? "border-foreground" : playable ? "border-white/50" : "border-gray-600")
    : (selected ? "border-foreground" : playable ? colorBorder[color] || "border-white/50" : "border-white/10");

  const fanAngle = total > 1 ? ((index - (total - 1) / 2) * Math.min(6, 50 / total)) : 0;
  const fanY = total > 1 ? Math.abs(index - (total - 1) / 2) * 4 : 0;

  if (small) {
    return (
      <div className={`w-8 h-12 rounded-md bg-gradient-to-br ${gradient} border ${border} flex items-center justify-center shadow`}>
        <span className="font-display text-xs font-bold text-white drop-shadow">{cardLabel(card.value)}</span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={playable ? { y: -24, scale: 1.08 } : {}}
      onClick={playable || selected ? onClick : undefined}
      className={`relative w-16 h-24 md:w-[72px] md:h-[108px] rounded-xl bg-gradient-to-br ${gradient} border-2 ${border} flex flex-col items-center justify-center shadow-lg transition-all duration-150 ${
        playable ? "cursor-pointer hover:z-30" : "opacity-60 cursor-default"
      } ${selected ? "-translate-y-6 z-30 ring-2 ring-white/60 scale-105" : ""}`}
      style={{
        transform: `rotate(${fanAngle}deg) translateY(${fanY}px)${selected ? " translateY(-24px) scale(1.05)" : ""}`,
        zIndex: selected ? 30 : index,
        marginLeft: index === 0 ? 0 : total > 8 ? -12 : -8,
      }}
    >
      {/* Top-left corner */}
      <span className="absolute top-1 left-1.5 font-display text-[10px] font-bold text-white/90">{cardLabel(card.value)}</span>
      {/* Center symbol */}
      <span className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-md">
        {cardLabel(card.value)}
      </span>
      {/* Wild rainbow indicator */}
      {isWild && (
        <div className="flex gap-0.5 mt-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
        </div>
      )}
      {/* Bottom-right corner */}
      <span className="absolute bottom-1 right-1.5 font-display text-[10px] font-bold text-white/90 rotate-180">{cardLabel(card.value)}</span>
    </motion.div>
  );
};

/* ── Card Back (for opponents) ─────────────────────────────────────────── */

const CardBack = ({ count }: { count: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: Math.min(count, 7) }).map((_, i) => (
      <div
        key={i}
        className="w-6 h-9 rounded-md bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center shadow"
        style={{ marginLeft: i === 0 ? 0 : -10 }}
      >
        <span className="font-display text-[7px] font-bold text-gray-400">U</span>
      </div>
    ))}
    {count > 7 && (
      <span className="text-xs font-body text-muted-foreground ml-1">+{count - 7}</span>
    )}
  </div>
);

/* ── Main Game Component ───────────────────────────────────────────────── */

const UnoGame = () => {
  const [hand, setHand] = useState<UnoCardData[]>([]);
  const [topCard, setTopCard] = useState<UnoCardData | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("red");
  const [direction, setDirection] = useState(1);
  const [drawPending, setDrawPending] = useState(0);
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<number | null>(null);
  const [showUnoButton, setShowUnoButton] = useState(false);
  const [calledUno, setCalledUno] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const room = useGameRoom({
    gameType: "uno",
    onGameInit: async (roomId, players) => {
      const res = await unoApi.init(roomId, players);
      return res;
    },
  });

  // Fetch initial state when game starts
  const fetchState = useCallback(async () => {
    if (!room.roomId || !room.playerId) return;
    try {
      const data = await unoApi.state(room.roomId, room.playerId);
      if (data.yourHand) setHand(data.yourHand);
      if (data.topCard) setTopCard(data.topCard);
      if (data.currentColor) setCurrentColor(data.currentColor);
      if (data.direction !== undefined) setDirection(data.direction);
      if (data.drawPending !== undefined) setDrawPending(data.drawPending);
      if (data.cardCounts) setCardCounts(data.cardCounts);
      if (data.extra_state?.winner) setWinner(data.extra_state.winner);
      if (data.extra_state?.lastAction) {
        const la = data.extra_state.lastAction;
        if (la.type === "play") setLastAction(`Played ${la.card?.value || "card"}`);
        else if (la.type === "draw") setLastAction(`Drew ${la.count} card(s)`);
        else if (la.type === "uno_catch") setLastAction("UNO catch!");
      }
    } catch {
      // state not ready yet
    }
  }, [room.roomId, room.playerId]);

  useEffect(() => {
    if (room.phase === "playing") {
      fetchState();
    }
  }, [room.phase, fetchState]);

  // React to realtime game state changes
  useEffect(() => {
    if (!room.gameState || !room.playerId) return;
    const bs = room.gameState;
    const extra = room.extraState;

    if (bs.hands && bs.hands[room.playerId]) {
      setHand(bs.hands[room.playerId]);
    }
    if (bs.discardPile && bs.discardPile.length > 0) {
      setTopCard(bs.discardPile[bs.discardPile.length - 1]);
    }
    if (bs.currentColor) setCurrentColor(bs.currentColor);
    if (bs.direction !== undefined) setDirection(bs.direction);
    if (bs.drawPending !== undefined) setDrawPending(bs.drawPending);
    if (bs.players) {
      const counts: Record<string, number> = {};
      for (const p of bs.players) {
        counts[p.id] = bs.hands?.[p.id]?.length ?? p.cardCount ?? 0;
      }
      setCardCounts(counts);
    }
    if (extra?.winner) setWinner(extra.winner);
    if (extra?.lastAction) {
      const la = extra.lastAction;
      if (la.type === "play") setLastAction(`Played ${la.card?.value || "card"}`);
      else if (la.type === "draw") setLastAction(`Drew ${la.count} card(s)`);
      else if (la.type === "uno_catch") setLastAction("UNO catch!");
    }
  }, [room.gameState, room.extraState, room.playerId]);

  // Show UNO button when at 2 cards
  useEffect(() => {
    setShowUnoButton(hand.length === 2 && !calledUno);
  }, [hand.length, calledUno]);

  const isMyTurn = room.currentTurn === room.playerId;

  // Check if a card is playable
  const isPlayable = useCallback((card: UnoCardData) => {
    if (!isMyTurn) return false;
    if (card.type === "wild") return drawPending === 0 || (card.value === "wild_draw4" && topCard?.value === "wild_draw4");
    if (drawPending > 0) {
      if (topCard?.value === "draw2" && card.value === "draw2") return true;
      return false;
    }
    if (card.color === currentColor) return true;
    if (card.value === topCard?.value) return true;
    return false;
  }, [isMyTurn, drawPending, currentColor, topCard]);

  const handlePlayCard = useCallback(async (cardId: number, chosenColor?: string) => {
    if (!room.roomId || !room.playerId || loading) return;
    setLoading(true);
    try {
      const res = await unoApi.playCard(room.roomId, room.playerId, cardId, chosenColor);
      if (res.yourHand) setHand(res.yourHand);
      if (res.topCard) setTopCard(res.topCard);
      if (res.currentColor) setCurrentColor(res.currentColor);
      if (res.direction !== undefined) setDirection(res.direction);
      if (res.drawPending !== undefined) setDrawPending(res.drawPending);
      if (res.cardCounts) setCardCounts(res.cardCounts);
      if (res.winner) setWinner(res.winner);
      setSelectedCard(null);
      setCalledUno(false);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, loading]);

  const handleCardClick = useCallback((index: number) => {
    const card = hand[index];
    if (!isPlayable(card)) return;

    if (selectedCard === index) {
      // Confirm play
      if (card.type === "wild") {
        setPendingWildCardId(card.id);
        setShowColorPicker(true);
      } else {
        handlePlayCard(card.id);
      }
    } else {
      setSelectedCard(index);
    }
  }, [hand, selectedCard, isPlayable, handlePlayCard]);

  const handleColorPick = useCallback((color: string) => {
    if (pendingWildCardId !== null) {
      handlePlayCard(pendingWildCardId, color);
    }
    setShowColorPicker(false);
    setPendingWildCardId(null);
  }, [pendingWildCardId, handlePlayCard]);

  const handleDrawCard = useCallback(async () => {
    if (!room.roomId || !room.playerId || !isMyTurn || loading) return;
    setLoading(true);
    try {
      const res = await unoApi.drawCard(room.roomId, room.playerId);
      if (res.yourHand) setHand(res.yourHand);
      if (res.cardCounts) setCardCounts(res.cardCounts);
      setSelectedCard(null);
      setCalledUno(false);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, isMyTurn, loading]);

  const handleCallUno = useCallback(async () => {
    if (!room.roomId || !room.playerId) return;
    try {
      await unoApi.callUno(room.roomId, room.playerId);
      setCalledUno(true);
      setShowUnoButton(false);
    } catch (err: any) {
      room.setError(err.message);
    }
  }, [room.roomId, room.playerId]);

  // Other players (exclude self)
  const otherPlayers = room.players.filter(p => p.id !== room.playerId);

  // If not playing yet, show room flow
  if (room.phase !== "playing") {
    return (
      <GameLayout title="UNO">
        <RoomFlow room={room} minPlayers={2} onStart={room.startGame} />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="UNO">
      <div className="flex flex-col h-full relative">
        {/* Color picker overlay */}
        <AnimatePresence>
          {showColorPicker && <ColorPicker onPick={handleColorPick} />}
        </AnimatePresence>

        {/* Winner overlay */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="p-10 rounded-2xl border border-primary/50 bg-card text-center shadow-2xl"
              >
                <span className="text-6xl block mb-4">
                  {winner.id === room.playerId ? "\uD83C\uDF89" : "\uD83D\uDE22"}
                </span>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {winner.id === room.playerId ? "You Win!" : `${winner.name} Wins!`}
                </h2>
                <p className="text-sm font-body text-muted-foreground">Game Over</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top - Other players */}
        <div className="flex items-center justify-center gap-6 py-3 px-4 border-b border-border/10">
          {otherPlayers.map((player) => {
            const count = cardCounts[player.id] || 0;
            const isCurrent = room.currentTurn === player.id;
            return (
              <div key={player.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isCurrent ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-display font-bold ${isCurrent ? "bg-primary text-primary-foreground" : "bg-secondary border border-border/30 text-muted-foreground"}`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-display font-medium text-foreground">{player.name}</p>
                  <p className="text-[10px] font-body text-muted-foreground">{count} cards</p>
                </div>
                <CardBack count={count} />
              </div>
            );
          })}
        </div>

        {/* Center - Play area */}
        <div className="flex-1 flex items-center justify-center gap-8 relative">
          {/* Direction indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {direction === 1 ? (
              <RotateCw className="w-5 h-5 text-primary/60" />
            ) : (
              <RotateCcw className="w-5 h-5 text-primary/60" />
            )}
            <span className="text-[10px] font-body text-muted-foreground">
              {direction === 1 ? "Clockwise" : "Counter-clockwise"}
            </span>
          </div>

          {/* Current color indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-body text-muted-foreground">Color:</span>
            <div className={`w-5 h-5 rounded-full ${currentColorIndicator[currentColor] || "bg-gray-500"} border-2 border-white/20`} />
          </div>

          {/* Turn / Draw pending indicator */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2">
            {isMyTurn ? (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-display font-semibold text-primary"
              >
                Your Turn{drawPending > 0 ? ` (must draw ${drawPending} or stack)` : ""}
              </motion.span>
            ) : (
              <span className="text-xs font-body text-muted-foreground">
                Waiting for opponent...
              </span>
            )}
          </div>

          {/* Draw Pile */}
          <motion.div
            whileHover={isMyTurn ? { scale: 1.05 } : {}}
            whileTap={isMyTurn ? { scale: 0.95 } : {}}
            onClick={handleDrawCard}
            className={`w-20 h-32 md:w-24 md:h-36 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 border-2 flex items-center justify-center shadow-xl transition-all ${
              isMyTurn ? "border-primary/40 cursor-pointer hover:border-primary/70 hover:shadow-glow" : "border-gray-600 cursor-default"
            }`}
          >
            <div className="text-center">
              <span className="font-display text-lg font-bold text-white/90 block">UNO</span>
              <span className="text-[10px] font-body text-white/40">Draw</span>
            </div>
          </motion.div>

          {/* Discard Pile */}
          {topCard && (
            <motion.div
              key={topCard.id}
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className={`w-20 h-32 md:w-24 md:h-36 rounded-xl bg-gradient-to-br ${
                topCard.type === "wild"
                  ? "from-gray-700 via-gray-800 to-gray-900"
                  : colorMap[topCard.color || "red"]
              } border-2 border-white/20 flex flex-col items-center justify-center shadow-xl`}
            >
              <span className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                {cardLabel(topCard.value)}
              </span>
              {topCard.type === "wild" && (
                <div className="flex gap-0.5 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                </div>
              )}
            </motion.div>
          )}

          {/* Last action */}
          {lastAction && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-body text-muted-foreground/60 bg-secondary/40 px-2 py-0.5 rounded-full">{lastAction}</span>
            </div>
          )}
        </div>

        {/* UNO button */}
        <AnimatePresence>
          {showUnoButton && isMyTurn && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-40 right-6 z-40"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                onClick={handleCallUno}
                className="px-6 py-3 rounded-xl bg-red-600 text-white font-display font-bold text-lg hover:bg-red-500 transition-colors shadow-lg ring-4 ring-red-600/30"
              >
                UNO!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Hand */}
        <div className="border-t border-border/20 bg-card/30 px-4 pt-3 pb-4">
          {room.error && (
            <p className="text-xs text-destructive text-center font-body mb-2">{room.error}</p>
          )}
          <div className="flex items-end justify-center pb-1" style={{ minHeight: 120 }}>
            {hand.map((card, i) => (
              <UnoCard
                key={card.id}
                card={card}
                playable={isPlayable(card)}
                selected={selectedCard === i}
                onClick={() => handleCardClick(i)}
                index={i}
                total={hand.length}
              />
            ))}
          </div>
          <div className="flex items-center justify-center mt-1 gap-3">
            <span className="text-[10px] font-body text-muted-foreground">{hand.length} cards</span>
            {isMyTurn && <span className="text-[10px] font-display text-primary font-semibold">Click a card once to select, again to play</span>}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default UnoGame;
