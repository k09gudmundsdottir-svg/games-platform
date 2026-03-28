import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Copy, Check, Crown, User, Users, Plus, DoorOpen } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { backgammonApi } from "@/lib/api";
import { useGameRoom } from "@/hooks/useGameRoom";

/* ── Types ────────────────────────────────────────────────────────────── */

interface PointData {
  count: number;
  player: number;
}

interface LegalMove {
  from: number | string;
  to: number | string;
  die: number;
}

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

/* ── Room Flow (inline, same pattern) ──────────────────────────────────── */

const RoomFlow = ({ room, onStart }: { room: ReturnType<typeof useGameRoom>; onStart: () => void }) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const minPlayers = 2;

  const handleCopy = () => {
    navigator.clipboard.writeText(room.roomCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {room.phase === "name" && (
            <motion.div key="name" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">Backgammon</h2>
                <p className="text-sm font-body text-muted-foreground">Enter your display name</p>
              </div>
              <input type="text" placeholder="Your name..." value={room.playerName} onChange={(e) => room.setPlayerName(e.target.value)} maxLength={20} className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-center text-lg" autoFocus onKeyDown={(e) => { if (e.key === "Enter" && room.playerName.trim()) room.setPhase("choose"); }} />
              <button disabled={!room.playerName.trim()} onClick={() => room.setPhase("choose")} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Continue</button>
            </motion.div>
          )}
          {room.phase === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <p className="text-center text-sm font-body text-muted-foreground mb-2">Welcome, <span className="text-foreground font-medium">{room.playerName}</span></p>
              <button onClick={() => room.createRoom()} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow"><Plus className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-semibold text-foreground">Create Room</p><p className="text-xs font-body text-muted-foreground">Generate a code to share</p></div>
              </button>
              <button onClick={() => room.setPhase("join")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow"><DoorOpen className="w-5 h-5 text-primary" /></div>
                <div className="text-left"><p className="font-display font-semibold text-foreground">Join Room</p><p className="text-xs font-body text-muted-foreground">Enter a code to join</p></div>
              </button>
              {room.error && <p className="text-xs text-destructive text-center font-body">{room.error}</p>}
            </motion.div>
          )}
          {room.phase === "join" && (
            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-sm font-body text-muted-foreground mb-3">Enter the room code</p>
                <input type="text" placeholder="Room code..." value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-display text-2xl font-bold text-foreground text-center tracking-widest focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { room.setPhase("choose"); setJoinCode(""); }} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Back</button>
                <button disabled={joinCode.length < 4} onClick={() => room.joinRoom(joinCode)} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Join</button>
              </div>
              {room.error && <p className="text-xs text-destructive text-center font-body">{room.error}</p>}
            </motion.div>
          )}
          {room.phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5 p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              {room.isHost && room.roomCode && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <span className="text-xs font-body text-muted-foreground">Room Code:</span>
                  <span className="font-display font-bold text-foreground tracking-widest">{room.roomCode}</span>
                  <button onClick={handleCopy} className="w-7 h-7 rounded-md bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">{copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}</button>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-display font-medium text-foreground">Players</span></div><span className="text-xs font-body text-muted-foreground">{room.players.length} / {minPlayers}</span></div>
                <div className="space-y-2">
                  {room.players.map((player, i) => (
                    <motion.div key={player.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">{i === 0 ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}</div>
                      <div className="flex-1"><p className="text-sm font-display font-medium text-foreground">{player.name}</p>{i === 0 && <p className="text-[10px] font-body text-primary">Host</p>}</div>
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </motion.div>
                  ))}
                  {Array.from({ length: Math.max(0, minPlayers - room.players.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/30"><div className="w-9 h-9 rounded-lg bg-secondary/30 border border-border/20 flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground/30" /></div><p className="text-sm font-body text-muted-foreground/40">Waiting...</p></div>
                  ))}
                </div>
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

/* ── Checker piece ─────────────────────────────────────────────────────── */

const Checker = ({ player, highlighted, onClick, small }: { player: number; highlighted?: boolean; onClick?: () => void; small?: boolean }) => {
  const size = small ? "w-5 h-5" : "w-7 h-7 md:w-8 md:h-8";
  const colors = player === 1
    ? "bg-primary/90 border-primary shadow-[0_0_6px_rgba(212,175,55,0.3)]"
    : "bg-muted-foreground/70 border-muted-foreground shadow-[0_0_6px_rgba(150,150,150,0.2)]";
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.15 } : {}}
      onClick={onClick}
      className={`${size} rounded-full border-2 ${colors} ${highlighted ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent" : ""} ${onClick ? "cursor-pointer" : ""} transition-all`}
    />
  );
};

/* ── Board Triangle (Point) ────────────────────────────────────────────── */

const BoardPoint = ({
  index,
  point,
  isTop,
  highlighted,
  isSelected,
  isTarget,
  onClickPiece,
  onClickTarget,
}: {
  index: number;
  point: PointData | null;
  isTop: boolean;
  highlighted: boolean;
  isSelected: boolean;
  isTarget: boolean;
  onClickPiece?: () => void;
  onClickTarget?: () => void;
}) => {
  const darkTriangle = index % 2 === 0;
  const triColor = darkTriangle ? "border-l-primary/25 border-r-primary/25" : "border-l-secondary/70 border-r-secondary/70";
  const triColorTop = darkTriangle ? "border-l-primary/25 border-r-primary/25" : "border-l-secondary/70 border-r-secondary/70";

  const pieces = point ? Array.from({ length: Math.min(point.count, 5) }) : [];
  const overflow = point && point.count > 5 ? point.count - 5 : 0;

  return (
    <div
      className={`flex-1 flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center relative ${isTarget ? "cursor-pointer" : ""} ${isSelected ? "bg-emerald-400/10" : isTarget ? "bg-yellow-400/10" : ""}`}
      onClick={isTarget ? onClickTarget : undefined}
      style={{ minWidth: 0 }}
    >
      {/* Triangle shape using CSS */}
      <div
        className={`w-full ${isTop ? "border-b-0" : "border-t-0"}`}
        style={{
          width: 0,
          height: 0,
          borderLeft: "22px solid transparent",
          borderRight: "22px solid transparent",
          ...(isTop
            ? { borderTop: `80px solid ${darkTriangle ? "rgba(212,175,55,0.2)" : "rgba(120,120,120,0.25)"}` }
            : { borderBottom: `80px solid ${darkTriangle ? "rgba(212,175,55,0.2)" : "rgba(120,120,120,0.25)"}` }),
          alignSelf: "center",
        }}
      />
      {/* Pieces stacked on top of triangle */}
      <div className={`flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center gap-0.5 absolute ${isTop ? "top-0 pt-1" : "bottom-0 pb-1"}`}>
        {pieces.map((_, j) => (
          <Checker
            key={j}
            player={point!.player}
            highlighted={highlighted && j === (isTop ? pieces.length - 1 : 0)}
            onClick={highlighted && j === (isTop ? pieces.length - 1 : 0) ? onClickPiece : undefined}
          />
        ))}
        {overflow > 0 && (
          <span className="text-[9px] font-display font-bold text-white/70">+{overflow}</span>
        )}
      </div>
      {/* Point number */}
      <span className={`text-[8px] font-body text-muted-foreground/40 ${isTop ? "mt-auto pt-0.5" : "mb-auto pb-0.5"}`}>
        {index + 1}
      </span>
      {/* Target indicator */}
      {isTarget && (
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`absolute ${isTop ? "bottom-2" : "top-2"} w-4 h-4 rounded-full bg-yellow-400/50 border border-yellow-400`}
        />
      )}
    </div>
  );
};

/* ── Main Game Component ───────────────────────────────────────────────── */

const BackgammonGame = () => {
  const [points, setPoints] = useState<(PointData | null)[]>(Array(24).fill(null));
  const [bar, setBar] = useState<Record<number, number>>({ 1: 0, 2: 0 });
  const [off, setOff] = useState<Record<number, number>>({ 1: 0, 2: 0 });
  const [dice, setDice] = useState<number[]>([]);
  const [remainingDice, setRemainingDice] = useState<number[]>([]);
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<number | string | null>(null);
  const [playerNum, setPlayerNum] = useState<number>(0);
  const [player1, setPlayer1] = useState<{ id: string; name: string } | null>(null);
  const [player2, setPlayer2] = useState<{ id: string; name: string } | null>(null);
  const [status, setStatus] = useState<string>("awaiting_roll");
  const [winner, setWinner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cubeValue, setCubeValue] = useState(1);
  const [noMovesMsg, setNoMovesMsg] = useState(false);

  const room = useGameRoom({
    gameType: "backgammon",
    onGameInit: async (roomId, players) => {
      const res = await backgammonApi.init(roomId, players);
      return res;
    },
  });

  const isMyTurn = room.currentTurn === room.playerId;

  // Fetch initial state
  const fetchState = useCallback(async () => {
    if (!room.roomId) return;
    try {
      const data = await backgammonApi.state(room.roomId);
      const bs = data.board_state;
      const extra = data.extra_state;
      setPoints(bs.points);
      setBar(bs.bar);
      setOff(bs.off);
      setPlayer1(bs.player1);
      setPlayer2(bs.player2);
      setCubeValue(bs.doublingCube?.value || 1);
      if (room.playerId === bs.player1?.id) setPlayerNum(1);
      else if (room.playerId === bs.player2?.id) setPlayerNum(2);
      if (extra.status) setStatus(extra.status);
      if (extra.dice) setDice(extra.dice);
      if (extra.remainingDice) setRemainingDice(extra.remainingDice);
      if (extra.winner) setWinner(extra.winner);
    } catch {}
  }, [room.roomId, room.playerId]);

  useEffect(() => {
    if (room.phase === "playing") fetchState();
  }, [room.phase, fetchState]);

  // Realtime updates
  useEffect(() => {
    if (!room.gameState || !room.playerId) return;
    const bs = room.gameState;
    const extra = room.extraState;
    if (bs.points) setPoints(bs.points);
    if (bs.bar) setBar(bs.bar);
    if (bs.off) setOff(bs.off);
    if (bs.player1) setPlayer1(bs.player1);
    if (bs.player2) setPlayer2(bs.player2);
    if (bs.doublingCube) setCubeValue(bs.doublingCube.value);
    if (room.playerId === bs.player1?.id) setPlayerNum(1);
    else if (room.playerId === bs.player2?.id) setPlayerNum(2);
    if (extra?.status) setStatus(extra.status);
    if (extra?.dice) setDice(extra.dice);
    if (extra?.remainingDice) setRemainingDice(extra.remainingDice);
    if (extra?.winner) setWinner(extra.winner);
    // When status changes to awaiting_move and it's our turn, fetch legal moves
    if (extra?.status === "awaiting_move" && room.currentTurn === room.playerId) {
      backgammonApi.legalMoves(room.roomId!, room.playerId).then(res => {
        setLegalMoves(res.moves || []);
      }).catch(() => {});
    } else {
      setLegalMoves([]);
    }
  }, [room.gameState, room.extraState, room.playerId, room.currentTurn, room.roomId]);

  const handleRoll = useCallback(async () => {
    if (!room.roomId || !room.playerId || !isMyTurn || loading) return;
    setLoading(true);
    setNoMovesMsg(false);
    try {
      const res = await backgammonApi.roll(room.roomId, room.playerId);
      setDice(res.dice);
      if (res.noMoves) {
        setLegalMoves([]);
        setNoMovesMsg(true);
        setTimeout(() => setNoMovesMsg(false), 2000);
      } else {
        setLegalMoves(res.legalMoves || []);
      }
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, isMyTurn, loading]);

  const handleClickPiece = useCallback((from: number | string) => {
    if (!isMyTurn || status !== "awaiting_move") return;
    // Check if this piece has a legal move
    const moves = legalMoves.filter(m => m.from === from);
    if (moves.length === 0) return;
    setSelectedFrom(from);
  }, [isMyTurn, status, legalMoves]);

  const handleClickTarget = useCallback(async (to: number | string) => {
    if (!room.roomId || !room.playerId || selectedFrom === null || loading) return;
    setLoading(true);
    try {
      const res = await backgammonApi.move(room.roomId, room.playerId, selectedFrom, to);
      if (res.points) setPoints(res.points);
      if (res.bar) setBar(res.bar);
      if (res.off) setOff(res.off);
      if (res.remainingDice) setRemainingDice(res.remainingDice);
      if (res.legalMoves) setLegalMoves(res.legalMoves);
      if (res.gameStatus) setStatus(res.gameStatus);
      if (res.winner) setWinner(res.winner);
      setSelectedFrom(null);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, selectedFrom, loading]);

  // Which points have legal moves from them
  const highlightedSources = new Set(legalMoves.map(m => m.from));
  // If a piece is selected, which targets are valid
  const validTargets = selectedFrom !== null
    ? new Set(legalMoves.filter(m => m.from === selectedFrom).map(m => m.to))
    : new Set();

  // Calculate pip counts
  const calcPips = (pNum: number) => {
    let pips = 0;
    for (let i = 0; i < 24; i++) {
      const p = points[i];
      if (p && p.player === pNum) {
        pips += p.count * (pNum === 1 ? i + 1 : 24 - i);
      }
    }
    pips += (bar[pNum] || 0) * 25;
    return pips;
  };

  const opponentName = playerNum === 1 ? player2?.name : player1?.name;
  const myName = playerNum === 1 ? player1?.name : player2?.name;

  // Determine board orientation: player 1 sees from bottom-right, player 2 from bottom-left
  // Top row: points displayed 13-24 (or reversed for player 2)
  // Bottom row: points displayed 12-1 (or reversed)

  // For player 1: top row = indices 12..23 (left to right), bottom = indices 11..0 (left to right)
  // For player 2: top row = indices 11..0 (left to right), bottom = indices 12..23 (left to right)

  const topIndices = playerNum === 2
    ? Array.from({ length: 12 }, (_, i) => 11 - i)
    : Array.from({ length: 12 }, (_, i) => 12 + i);

  const bottomIndices = playerNum === 2
    ? Array.from({ length: 12 }, (_, i) => 12 + i)
    : Array.from({ length: 12 }, (_, i) => 11 - i);

  if (room.phase !== "playing") {
    return (
      <GameLayout title="Backgammon">
        <RoomFlow room={room} onStart={room.startGame} />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Backgammon">
      <div className="flex flex-col items-center justify-center h-full p-2 md:p-4 relative">
        {/* Winner overlay */}
        <AnimatePresence>
          {winner && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="p-10 rounded-2xl border border-primary/50 bg-card text-center shadow-2xl">
                <span className="text-6xl block mb-4">{winner.id === room.playerId ? "\uD83C\uDF89" : "\uD83D\uDE22"}</span>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">{winner.id === room.playerId ? "You Win!" : `${winner.name} Wins!`}</h2>
                <p className="text-sm font-body text-muted-foreground">Game Over{cubeValue > 1 ? ` (x${cubeValue} stakes)` : ""}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player info - opponent */}
        <div className="flex items-center justify-between w-full max-w-[640px] mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full border-2 ${playerNum === 1 ? "bg-muted-foreground/70 border-muted-foreground" : "bg-primary/90 border-primary"}`} />
            <span className="text-sm font-display font-medium text-foreground">{opponentName || "Opponent"}</span>
            <span className="text-xs font-body text-muted-foreground ml-2">Pip: {calcPips(playerNum === 1 ? 2 : 1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-body text-muted-foreground">Off: {off[playerNum === 1 ? 2 : 1] || 0}</span>
            {cubeValue > 1 && (
              <span className="text-[10px] font-display font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">x{cubeValue}</span>
            )}
          </div>
        </div>

        {/* Board */}
        <div className="w-full max-w-[640px] rounded-xl border border-border/30 bg-[hsl(25,20%,12%)] overflow-hidden shadow-xl">
          {/* Top half */}
          <div className="flex" style={{ height: 140 }}>
            <div className="flex-1 flex">
              {topIndices.slice(0, 6).map((idx) => (
                <BoardPoint
                  key={idx}
                  index={idx}
                  point={points[idx]}
                  isTop={true}
                  highlighted={highlightedSources.has(idx)}
                  isSelected={selectedFrom === idx}
                  isTarget={validTargets.has(idx)}
                  onClickPiece={() => handleClickPiece(idx)}
                  onClickTarget={() => handleClickTarget(idx)}
                />
              ))}
            </div>
            {/* Bar */}
            <div className="w-10 bg-[hsl(25,15%,8%)] border-x border-border/20 flex flex-col items-center justify-start pt-2 gap-0.5">
              {Array.from({ length: bar[playerNum === 1 ? 2 : 1] || 0 }).map((_, i) => (
                <Checker key={i} player={playerNum === 1 ? 2 : 1} small />
              ))}
            </div>
            <div className="flex-1 flex">
              {topIndices.slice(6, 12).map((idx) => (
                <BoardPoint
                  key={idx}
                  index={idx}
                  point={points[idx]}
                  isTop={true}
                  highlighted={highlightedSources.has(idx)}
                  isSelected={selectedFrom === idx}
                  isTarget={validTargets.has(idx)}
                  onClickPiece={() => handleClickPiece(idx)}
                  onClickTarget={() => handleClickTarget(idx)}
                />
              ))}
            </div>
            {/* Bearing off tray - opponent */}
            <div className="w-10 bg-[hsl(25,12%,6%)] border-l border-border/20 flex flex-col items-center justify-start pt-2 gap-0.5">
              {Array.from({ length: Math.min(off[playerNum === 1 ? 2 : 1] || 0, 10) }).map((_, i) => (
                <div key={i} className="w-6 h-2 rounded-sm bg-muted-foreground/40" />
              ))}
            </div>
          </div>

          {/* Center bar with dice */}
          <div className="flex items-center justify-center gap-3 py-3 bg-[hsl(25,15%,8%)] border-y border-border/20">
            {dice.length > 0 && dice.map((d, i) => {
              const DIcon = diceIcons[d - 1];
              const isUsed = i >= remainingDice.length;
              return (
                <motion.div key={i} initial={{ rotate: -360 }} animate={{ rotate: 0 }} transition={{ duration: 0.5 }}>
                  <DIcon className={`w-9 h-9 ${isUsed ? "text-muted-foreground/30" : "text-primary"}`} />
                </motion.div>
              );
            })}
            {status === "awaiting_roll" && isMyTurn && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRoll}
                disabled={loading}
                className="ml-3 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40"
              >
                {loading ? "Rolling..." : "Roll Dice"}
              </motion.button>
            )}
            {status === "awaiting_roll" && !isMyTurn && (
              <span className="text-xs font-body text-muted-foreground">Opponent's turn to roll...</span>
            )}
            {status === "awaiting_move" && isMyTurn && legalMoves.length > 0 && !selectedFrom && (
              <span className="text-xs font-body text-primary ml-2">Click a highlighted piece to move</span>
            )}
            {status === "awaiting_move" && isMyTurn && selectedFrom !== null && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs font-body text-yellow-400">Click a target point</span>
                <button onClick={() => setSelectedFrom(null)} className="text-xs text-muted-foreground underline">Cancel</button>
              </div>
            )}
            {noMovesMsg && (
              <span className="text-xs font-display text-destructive ml-2">No legal moves - turn passed</span>
            )}
          </div>

          {/* Bottom half */}
          <div className="flex" style={{ height: 140 }}>
            <div className="flex-1 flex">
              {bottomIndices.slice(0, 6).map((idx) => (
                <BoardPoint
                  key={idx}
                  index={idx}
                  point={points[idx]}
                  isTop={false}
                  highlighted={highlightedSources.has(idx)}
                  isSelected={selectedFrom === idx}
                  isTarget={validTargets.has(idx)}
                  onClickPiece={() => handleClickPiece(idx)}
                  onClickTarget={() => handleClickTarget(idx)}
                />
              ))}
            </div>
            {/* Bar */}
            <div className="w-10 bg-[hsl(25,15%,8%)] border-x border-border/20 flex flex-col items-center justify-end pb-2 gap-0.5">
              {Array.from({ length: bar[playerNum] || 0 }).map((_, i) => (
                <Checker
                  key={i}
                  player={playerNum}
                  highlighted={highlightedSources.has("bar")}
                  onClick={highlightedSources.has("bar") && i === (bar[playerNum] || 1) - 1 ? () => handleClickPiece("bar") : undefined}
                />
              ))}
            </div>
            <div className="flex-1 flex">
              {bottomIndices.slice(6, 12).map((idx) => (
                <BoardPoint
                  key={idx}
                  index={idx}
                  point={points[idx]}
                  isTop={false}
                  highlighted={highlightedSources.has(idx)}
                  isSelected={selectedFrom === idx}
                  isTarget={validTargets.has(idx)}
                  onClickPiece={() => handleClickPiece(idx)}
                  onClickTarget={() => handleClickTarget(idx)}
                />
              ))}
            </div>
            {/* Bearing off tray - player */}
            <div
              className={`w-10 bg-[hsl(25,12%,6%)] border-l border-border/20 flex flex-col items-center justify-end pb-2 gap-0.5 ${validTargets.has("off") ? "cursor-pointer bg-yellow-400/10" : ""}`}
              onClick={validTargets.has("off") ? () => handleClickTarget("off") : undefined}
            >
              {Array.from({ length: Math.min(off[playerNum] || 0, 10) }).map((_, i) => (
                <div key={i} className="w-6 h-2 rounded-sm bg-primary/50" />
              ))}
              {validTargets.has("off") && (
                <motion.div animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 rounded-full bg-yellow-400/50 border border-yellow-400 mt-1" />
              )}
            </div>
          </div>
        </div>

        {/* Player info - self */}
        <div className="flex items-center justify-between w-full max-w-[640px] mt-2">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full border-2 ${playerNum === 1 ? "bg-primary/90 border-primary" : "bg-muted-foreground/70 border-muted-foreground"}`} />
            <span className="text-sm font-display font-medium text-foreground">{myName || "You"}</span>
            <span className="text-xs font-body text-muted-foreground ml-2">Pip: {calcPips(playerNum)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-body text-muted-foreground">Off: {off[playerNum] || 0}</span>
            {isMyTurn && <span className="text-xs font-display text-primary font-semibold animate-pulse">Your Turn</span>}
          </div>
        </div>

        {room.error && <p className="text-xs text-destructive text-center font-body mt-2">{room.error}</p>}
      </div>
    </GameLayout>
  );
};

export default BackgammonGame;
