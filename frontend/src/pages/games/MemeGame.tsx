import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Crown, User, Users, Plus, DoorOpen, Trophy, Sparkles } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { memeApi } from "@/lib/api";
import { useGameRoom } from "@/hooks/useGameRoom";

/* ── Types ────────────────────────────────────────────────────────────── */

interface CaptionCard {
  id: number;
  text: string;
}

interface MemeTemplate {
  id: string;
  name: string;
}

interface PlayerScore {
  id: string;
  name: string;
  score: number;
}

interface Submission {
  index?: number;
  caption: string;
  playerId?: string;
  playerName?: string;
}

/* ── Confetti Effect ──────────────────────────────────────────────────── */

const Confetti = () => {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    color: ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500", "bg-pink-500", "bg-purple-500"][i % 6],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "100vh", opacity: 0, rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className={`absolute ${p.color} rounded-sm`}
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
};

/* ── Room Flow ─────────────────────────────────────────────────────────── */

const RoomFlow = ({ room, onStart }: { room: ReturnType<typeof useGameRoom>; onStart: () => void }) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const minPlayers = 3;

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
                  <span className="text-3xl">😂</span>
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1">What Do You Meme</h2>
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
                <div className="text-left"><p className="font-display font-semibold text-foreground">Create Room</p><p className="text-xs font-body text-muted-foreground">Generate a code to share (3-8 players)</p></div>
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
                <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-display font-medium text-foreground">Players</span></div><span className="text-xs font-body text-muted-foreground">{room.players.length} / {minPlayers} min</span></div>
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

/* ── Scoreboard Sidebar ────────────────────────────────────────────────── */

const ScoreSidebar = ({ players, judgeId, winScore }: { players: PlayerScore[]; judgeId: string; winScore: number }) => (
  <div className="p-3">
    <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1">Scoreboard</h3>
    <p className="text-[10px] font-body text-muted-foreground mb-3">First to {winScore} wins</p>
    <div className="space-y-2">
      {[...players].sort((a, b) => b.score - a.score).map((p) => (
        <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg ${p.id === judgeId ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {p.id === judgeId && <Crown className="w-3 h-3 text-primary shrink-0" />}
            <span className="text-xs font-display font-medium text-foreground truncate">{p.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: winScore }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i < p.score ? "bg-primary" : "bg-secondary border border-border/30"}`}
              />
            ))}
          </div>
          <span className="text-xs font-display font-bold text-foreground w-4 text-right">{p.score}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ── Main Game Component ───────────────────────────────────────────────── */

const MemeGame = () => {
  const [hand, setHand] = useState<CaptionCard[]>([]);
  const [currentMeme, setCurrentMeme] = useState<MemeTemplate | null>(null);
  const [phase, setPhase] = useState<string>("submitting");
  const [round, setRound] = useState(1);
  const [judge, setJudge] = useState<{ id: string; name: string } | null>(null);
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [totalExpected, setTotalExpected] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [roundWinner, setRoundWinner] = useState<Submission | null>(null);
  const [gameWinner, setGameWinner] = useState<PlayerScore | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memeError, setMemeError] = useState(false);
  const winScore = 5;

  const room = useGameRoom({
    gameType: "meme",
    onGameInit: async (roomId, roomPlayers) => {
      await memeApi.init(roomId, roomPlayers);
    },
  });

  const isJudge = judge?.id === room.playerId;

  // Fetch initial state
  const fetchState = useCallback(async () => {
    if (!room.roomId || !room.playerId) return;
    try {
      const data = await memeApi.state(room.roomId, room.playerId);
      if (data.yourHand) setHand(data.yourHand);
      if (data.currentMeme) { setCurrentMeme(data.currentMeme); setMemeError(false); }
      if (data.phase) setPhase(data.phase);
      if (data.round) setRound(data.round);
      if (data.judge) setJudge(data.judge);
      if (data.players) setPlayers(data.players);
      if (data.submissionCount !== undefined) setSubmissionCount(data.submissionCount);
      if (data.totalExpected !== undefined) setTotalExpected(data.totalExpected);
      if (data.hasSubmitted !== undefined) setHasSubmitted(data.hasSubmitted);
      if (data.submissions) setSubmissions(data.submissions);
      if (data.roundWinner) setRoundWinner(data.roundWinner);
      if (data.extra_state?.winner) setGameWinner(data.extra_state.winner);
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

    if (bs.hands?.[room.playerId]) setHand(bs.hands[room.playerId]);
    if (bs.currentMeme) { setCurrentMeme(bs.currentMeme); setMemeError(false); }
    if (bs.phase) setPhase(bs.phase);
    if (bs.round) setRound(bs.round);
    if (bs.players) {
      setPlayers(bs.players.map((p: any) => ({ id: p.id, name: p.name, score: p.score })));
      const j = bs.players[bs.judgeIndex];
      if (j) setJudge(j);
    }
    if (bs.submissions !== undefined) {
      setSubmissionCount(bs.submissions.length);
      setTotalExpected(bs.players.length - 1);
      setHasSubmitted(bs.submissions.some((s: any) => s.playerId === room.playerId));
    }

    if (extra?.phase === "judging") {
      setPhase("judging");
      // Fetch to get judge's view of submissions
      fetchState();
    }
    if (extra?.phase === "results") {
      setPhase("results");
      if (extra.roundWinner) setRoundWinner(extra.roundWinner);
      if (extra.winner) setGameWinner(extra.winner);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      fetchState();
    }
    if (extra?.phase === "submitting") {
      setPhase("submitting");
      setHasSubmitted(false);
      setSelectedCard(null);
      setRoundWinner(null);
      setSubmissions([]);
      fetchState();
    }
  }, [room.gameState, room.extraState, room.playerId, fetchState]);

  const handleSubmitCaption = useCallback(async () => {
    if (!room.roomId || !room.playerId || selectedCard === null || loading) return;
    const card = hand[selectedCard];
    if (!card) return;
    setLoading(true);
    try {
      const res = await memeApi.submitCaption(room.roomId, room.playerId, card.id);
      if (res.yourHand) setHand(res.yourHand);
      setHasSubmitted(true);
      setSelectedCard(null);
      if (res.submissionCount !== undefined) setSubmissionCount(res.submissionCount);
      if (res.phase) setPhase(res.phase);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, selectedCard, hand, loading]);

  const handleJudgePick = useCallback(async (index: number) => {
    if (!room.roomId || !room.playerId || loading) return;
    setLoading(true);
    try {
      const res = await memeApi.judgePick(room.roomId, room.playerId, index);
      if (res.roundWinner) setRoundWinner(res.roundWinner);
      if (res.scores) setPlayers(res.scores);
      if (res.gameWinner) setGameWinner(res.gameWinner);
      if (res.allSubmissions) setSubmissions(res.allSubmissions);
      setPhase("results");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, loading]);

  const handleNextRound = useCallback(async () => {
    if (!room.roomId || !room.playerId || loading) return;
    setLoading(true);
    try {
      const res = await memeApi.nextRound(room.roomId, room.playerId);
      if (res.currentMeme) { setCurrentMeme(res.currentMeme); setMemeError(false); }
      if (res.judge) setJudge(res.judge);
      if (res.round) setRound(res.round);
      if (res.scores) setPlayers(res.scores);
      setPhase("submitting");
      setHasSubmitted(false);
      setSelectedCard(null);
      setRoundWinner(null);
      setSubmissions([]);
    } catch (err: any) {
      room.setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [room.roomId, room.playerId, loading]);

  const sidebar = room.phase === "playing" ? (
    <ScoreSidebar players={players} judgeId={judge?.id || ""} winScore={winScore} />
  ) : undefined;

  if (room.phase !== "playing") {
    return (
      <GameLayout title="What Do You Meme" forceVideoPanel>
        <RoomFlow room={room} onStart={room.startGame} />
      </GameLayout>
    );
  }

  return (
    <GameLayout title="What Do You Meme" forceVideoPanel sidebar={sidebar}>
      <div className="flex flex-col h-full relative">
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && <Confetti />}
        </AnimatePresence>

        {/* Game winner overlay */}
        <AnimatePresence>
          {gameWinner && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="p-10 rounded-2xl border border-primary/50 bg-card text-center shadow-2xl">
                <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {gameWinner.id === room.playerId ? "You Win the Game!" : `${gameWinner.name} Wins the Game!`}
                </h2>
                <p className="text-sm font-body text-muted-foreground">First to {winScore} points</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top area - Meme + Phase content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
          {/* Round info */}
          <div className="flex items-center justify-between w-full max-w-lg mb-3">
            <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Round {round}</span>
            <div className="flex items-center gap-2">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs font-body text-muted-foreground">Judge: {judge?.name || "?"}</span>
            </div>
          </div>

          {/* Meme Image */}
          <div className="w-full max-w-lg">
            <div className="relative rounded-xl border-2 border-border/30 overflow-hidden shadow-card-hover bg-secondary">
              {currentMeme && !memeError ? (
                <img
                  src={`https://i.imgflip.com/${currentMeme.id}.jpg`}
                  alt={currentMeme.name}
                  className="w-full max-h-[300px] object-contain bg-black"
                  onError={() => setMemeError(true)}
                />
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/60">
                  <div className="text-center p-6">
                    <span className="text-6xl mb-4 block">😂</span>
                    <p className="font-display text-lg font-bold text-foreground">{currentMeme?.name || "Meme Image"}</p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="text-[10px] font-display font-semibold text-primary">{currentMeme?.name || "MEME"}</span>
              </div>
            </div>
          </div>

          {/* Phase-specific content */}
          <div className="w-full max-w-lg mt-4">
            <AnimatePresence mode="wait">
              {/* SUBMITTING PHASE */}
              {phase === "submitting" && (
                <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isJudge ? (
                    <div className="text-center py-6">
                      <Crown className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h3 className="font-display text-lg font-bold text-foreground mb-1">You are the Judge</h3>
                      <p className="text-sm font-body text-muted-foreground mb-3">Waiting for players to submit captions...</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${totalExpected > 0 ? (submissionCount / totalExpected) * 100 : 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-xs font-body text-muted-foreground">{submissionCount}/{totalExpected}</span>
                      </div>
                    </div>
                  ) : hasSubmitted ? (
                    <div className="text-center py-6">
                      <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
                      <h3 className="font-display text-lg font-bold text-foreground mb-1">Caption Submitted!</h3>
                      <p className="text-sm font-body text-muted-foreground">Waiting for others... ({submissionCount}/{totalExpected})</p>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* JUDGING PHASE */}
              {phase === "judging" && (
                <motion.div key="judging" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isJudge ? (
                    <div>
                      <p className="text-center text-sm font-display font-semibold text-primary uppercase tracking-wider mb-4">Pick the funniest caption</p>
                      <div className="space-y-2">
                        {submissions.map((sub, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => handleJudgePick(sub.index ?? i)}
                            className="w-full p-4 rounded-xl border border-border/30 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                          >
                            <p className="text-sm font-body text-foreground group-hover:text-primary transition-colors">{sub.caption}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Crown className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
                      <h3 className="font-display text-lg font-bold text-foreground mb-1">Judge is Deciding...</h3>
                      <p className="text-sm font-body text-muted-foreground">{judge?.name} is picking the funniest caption</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* RESULTS PHASE */}
              {phase === "results" && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {roundWinner && (
                    <div className="text-center py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 10, stiffness: 200 }}
                      >
                        <span className="text-4xl block mb-3">{"\uD83C\uDFC6"}</span>
                        <h3 className="font-display text-lg font-bold text-foreground mb-1">
                          {roundWinner.playerName || "Winner"} wins this round!
                        </h3>
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 mt-3 mb-4">
                          <p className="text-sm font-body text-foreground font-medium italic">"{roundWinner.caption}"</p>
                        </div>
                      </motion.div>

                      {/* All submissions revealed */}
                      {submissions.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          <p className="text-[10px] font-display text-muted-foreground uppercase tracking-wider mb-2">All Submissions</p>
                          {submissions.map((sub, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-left ${sub.playerId === roundWinner.playerId ? "bg-primary/10 border border-primary/20" : "bg-secondary/30"}`}>
                              <span className="text-xs font-display font-medium text-muted-foreground w-16 truncate">{sub.playerName}</span>
                              <span className="text-xs font-body text-foreground flex-1">"{sub.caption}"</span>
                              {sub.playerId === roundWinner.playerId && <Trophy className="w-3 h-3 text-primary shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}

                      {!gameWinner && (
                        <button
                          onClick={handleNextRound}
                          disabled={loading}
                          className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40"
                        >
                          {loading ? "Loading..." : "Next Round"}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom - Caption Cards (only during submitting phase for non-judges) */}
        {phase === "submitting" && !isJudge && !hasSubmitted && (
          <div className="border-t border-border/20 bg-card/30 p-4">
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              Pick your best caption
            </p>
            <div className="flex items-end justify-center gap-2 overflow-x-auto pb-2 px-2">
              {hand.map((card, i) => (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -8 }}
                  onClick={() => setSelectedCard(i === selectedCard ? null : i)}
                  className={`shrink-0 w-28 md:w-32 h-36 md:h-40 rounded-xl p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    selectedCard === i
                      ? "bg-primary/15 border-2 border-primary shadow-glow -translate-y-2"
                      : "bg-card border border-border/30 hover:border-border/60"
                  }`}
                >
                  <p className="text-[11px] md:text-xs font-body font-medium text-foreground leading-tight">{card.text}</p>
                  <div className="flex items-center justify-end">
                    <span className="text-[9px] font-body text-muted-foreground">#{i + 1}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {selectedCard !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex justify-center mt-3">
                  <button
                    onClick={handleSubmitCaption}
                    disabled={loading}
                    className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40"
                  >
                    {loading ? "Submitting..." : "Submit Caption"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {room.error && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
            <p className="text-xs text-destructive bg-card/90 px-3 py-1 rounded-full border border-destructive/30">{room.error}</p>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default MemeGame;
