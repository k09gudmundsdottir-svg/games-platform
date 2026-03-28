import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, DoorOpen, Plus, User, Crown, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameLayout from "@/components/GameLayout";
import { useGameRoom, RoomPhase } from "@/hooks/useGameRoom";
import { connect4Api } from "@/lib/api";

const ROWS = 6;
const COLS = 7;

// ── Room Lobby Overlay ──────────────────────────────────────────────────────

interface RoomOverlayProps {
  phase: RoomPhase;
  playerName: string;
  setPlayerName: (n: string) => void;
  setPhase: (p: RoomPhase) => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
  leaveRoom: () => void;
  isHost: boolean;
  players: { id: string; name: string; ready: boolean }[];
  roomCode: string;
  error: string | null;
}

const RoomOverlay = ({
  phase, playerName, setPlayerName, setPhase, createRoom, joinRoom,
  startGame, leaveRoom, isHost, players, roomCode, error,
}: RoomOverlayProps) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (phase === "playing") return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="font-display text-xl font-bold text-foreground">Connect Four</h3>
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-body">{error}</div>
          )}

          <AnimatePresence mode="wait">
            {phase === "name" && (
              <motion.div key="name" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-body text-muted-foreground">Enter your display name</p>
                </div>
                <input type="text" placeholder="Your name..." value={playerName}
                  onChange={e => setPlayerName(e.target.value)} maxLength={20} autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && playerName.trim()) setPhase("choose"); }}
                  className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-center text-lg" />
                <button disabled={!playerName.trim()} onClick={() => setPhase("choose")}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Continue</button>
              </motion.div>
            )}

            {phase === "choose" && (
              <motion.div key="choose" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                <p className="text-center text-sm font-body text-muted-foreground mb-2">Welcome, <span className="text-foreground font-medium">{playerName}</span></p>
                <button onClick={createRoom} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow"><Plus className="w-5 h-5 text-primary" /></div>
                  <div className="text-left"><p className="font-display font-semibold text-foreground">Create Room</p><p className="text-xs font-body text-muted-foreground">Generate a code to share</p></div>
                </button>
                <button onClick={() => setPhase("join")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow"><DoorOpen className="w-5 h-5 text-primary" /></div>
                  <div className="text-left"><p className="font-display font-semibold text-foreground">Join Room</p><p className="text-xs font-body text-muted-foreground">Enter a code to join a friend</p></div>
                </button>
              </motion.div>
            )}

            {phase === "join" && (
              <motion.div key="join" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-body text-muted-foreground mb-3">Enter the room code</p>
                  <input type="text" placeholder="ABCD12" value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} maxLength={6} autoFocus
                    onKeyDown={e => { if (e.key === "Enter" && joinCode.length >= 4) joinRoom(joinCode); }}
                    className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-display text-2xl font-bold text-foreground text-center tracking-[0.3em] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setPhase("choose"); setJoinCode(""); }} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Back</button>
                  <button disabled={joinCode.length < 4} onClick={() => joinRoom(joinCode)} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Join Game</button>
                </div>
              </motion.div>
            )}

            {phase === "lobby" && (
              <motion.div key="lobby" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                {isHost && roomCode && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
                    <span className="text-xs font-body text-muted-foreground">Room Code:</span>
                    <span className="font-display font-bold text-foreground tracking-widest">{roomCode}</span>
                    <button onClick={handleCopy} className="w-7 h-7 rounded-md bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-display font-medium text-foreground">Players</span></div>
                    <span className="text-xs font-body text-muted-foreground">{players.length} / 2</span>
                  </div>
                  <div className="space-y-2">
                    {players.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          {i === 0 ? <Crown className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1"><p className="text-sm font-display font-medium text-foreground">{p.name}</p>{i === 0 && <p className="text-[10px] font-body text-primary">Host</p>}</div>
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </motion.div>
                    ))}
                    {players.length < 2 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/30">
                        <div className="w-9 h-9 rounded-lg bg-secondary/30 border border-border/20 flex items-center justify-center"><User className="w-4 h-4 text-muted-foreground/30" /></div>
                        <p className="text-sm font-body text-muted-foreground/40">Waiting...</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">{[0, 1, 2].map(i => (<motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />))}</div>
                  <span className="text-xs font-body text-muted-foreground">{players.length >= 2 ? "Ready to start!" : "Waiting for opponent..."}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={leaveRoom} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Leave</button>
                  {isHost ? (
                    <button disabled={players.length < 2} onClick={startGame} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">Start Game</button>
                  ) : (
                    <div className="flex-1 py-2.5 rounded-lg bg-secondary border border-border/30 text-sm font-display font-medium text-muted-foreground text-center">Waiting for host...</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// ── Win detection for highlighting ──────────────────────────────────────────

function findWinningCells(board: (number | null)[][]): [number, number][] {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const val = board[r][c];
      if (val === null) continue;
      for (const [dr, dc] of directions) {
        const cells: [number, number][] = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === val) {
            cells.push([nr, nc]);
          } else break;
        }
        if (cells.length >= 4) return cells;
      }
    }
  }
  return [];
}

// ── Game Over Overlay ───────────────────────────────────────────────────────

const GameOverOverlay = ({ status, winner, onNewGame }: { status: string; winner: any; onNewGame: () => void }) => {
  const navigate = useNavigate();
  let title = "Game Over";
  let subtitle = "";
  if (status === "won") { title = "Victory!"; subtitle = `${winner?.name || "Unknown"} wins!`; }
  else if (status === "draw") { title = "Draw!"; subtitle = "The board is full."; }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-2xl border border-border/50 bg-card shadow-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">{status === "won" ? "\uD83C\uDFC6" : "\uD83E\uDD1D"}</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm font-body text-muted-foreground mb-6">{subtitle}</p>
        <div className="flex gap-3">
          <button onClick={() => navigate("/")} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Home</button>
          <button onClick={onNewGame} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow">New Game</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const ConnectFourGame = () => {
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGameInit = useCallback(async (roomId: string, players: { id: string; name: string }[], setGS: (gs: any, es?: any, ct?: string | null) => void) => {
    const res = await connect4Api.init(roomId, players);
    setGS(res.boardState, { status: "active", lastMove: null, winner: null }, res.currentTurn);
  }, []);

  const room = useGameRoom({ gameType: "connect4", onGameInit: handleGameInit });

  const gameState = room.gameState;
  const extraState = room.extraState;
  const isGameOver = extraState && extraState.status && extraState.status !== "active";

  // Determine my color
  const myPlayerNum = gameState?.player1?.id === room.playerId ? 1 : 2;
  const myColor = myPlayerNum === 1 ? "red" : "yellow";
  const isMyTurn = room.currentTurn === room.playerId;

  const board: (number | null)[][] = gameState?.board || Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const winningCells = isGameOver && extraState?.status === "won" ? findWinningCells(board) : [];

  const myInfo = myPlayerNum === 1 ? gameState?.player1 : gameState?.player2;
  const opponentInfo = myPlayerNum === 1 ? gameState?.player2 : gameState?.player1;

  const handleDrop = async (col: number) => {
    if (!room.roomId || !room.playerId || !isMyTurn || isGameOver || loading) return;
    // Check if column is full
    if (board[0][col] !== null) return;

    setLoading(true);
    try {
      const res = await connect4Api.drop(room.roomId, room.playerId, col);
      room.setGameState(
        { ...gameState, board: res.board, moveHistory: res.moveHistory },
        { status: res.gameStatus, lastMove: res.lastMove, winner: res.winner },
        res.currentTurn,
      );
    } catch (e: any) {
      room.setError(e.message);
      setTimeout(() => room.setError(null), 3000);
    }
    setLoading(false);
  };

  const isWinningCell = (r: number, c: number) => winningCells.some(([wr, wc]) => wr === r && wc === c);

  return (
    <GameLayout title="Connect Four">
      {room.phase !== "playing" && (
        <RoomOverlay
          phase={room.phase} playerName={room.playerName} setPlayerName={room.setPlayerName}
          setPhase={room.setPhase} createRoom={room.createRoom} joinRoom={room.joinRoom}
          startGame={room.startGame} leaveRoom={room.leaveRoom} isHost={room.isHost}
          players={room.players} roomCode={room.roomCode} error={room.error}
        />
      )}

      {isGameOver && <GameOverOverlay status={extraState.status} winner={extraState.winner} onNewGame={() => window.location.reload()} />}

      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        {/* Player Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${myColor === "red" ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-[hsl(50,80%,55%)] shadow-[0_0_8px_hsl(50,80%,55%,0.5)]"}`} />
            <span className="text-sm font-display font-semibold text-foreground">{myInfo?.name || room.playerName || "You"}</span>
          </div>
          <div className={`px-3 py-1 rounded-lg ${isMyTurn ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border/30"}`}>
            <span className={`font-display text-xs font-bold ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
              {isMyTurn ? "Your turn" : `${opponentInfo?.name || "Opponent"}'s turn`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full ${myColor === "red" ? "bg-[hsl(50,80%,55%)] shadow-[0_0_8px_hsl(50,80%,55%,0.5)]" : "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"}`} />
            <span className="text-sm font-display font-semibold text-foreground">{opponentInfo?.name || "Waiting..."}</span>
          </div>
        </div>

        {/* Board */}
        <div className="rounded-xl bg-[hsl(220,40%,18%)] p-3 border border-border/30 shadow-card">
          {/* Column drop buttons */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {Array.from({ length: COLS }).map((_, c) => (
              <button
                key={c}
                onClick={() => handleDrop(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                disabled={!isMyTurn || isGameOver as boolean || board[0][c] !== null}
                className={`h-7 rounded-md transition-colors flex items-center justify-center ${
                  hoverCol === c && isMyTurn ? "bg-primary/30" : "bg-secondary/40 hover:bg-primary/20"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span className="text-xs text-muted-foreground">{"\u25BC"}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const winning = isWinningCell(r, c);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-[hsl(220,30%,12%)] border flex items-center justify-center transition-all ${
                      winning ? "border-foreground/60 scale-110" : "border-border/20"
                    } ${hoverCol === c && !cell && isMyTurn ? "bg-[hsl(220,30%,15%)]" : ""}`}
                  >
                    {cell !== null && (
                      <motion.div
                        initial={{ y: -(r + 1) * 48, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                        className={`w-[80%] h-[80%] rounded-full ${
                          cell === 1
                            ? `bg-primary ${winning ? "shadow-[0_0_20px_hsl(var(--primary)/0.8)] animate-pulse" : "shadow-[0_0_12px_hsl(var(--primary)/0.4)]"}`
                            : `bg-[hsl(50,80%,55%)] ${winning ? "shadow-[0_0_20px_hsl(50,80%,55%,0.8)] animate-pulse" : "shadow-[0_0_12px_hsl(50,80%,55%,0.4)]"}`
                        }`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Error */}
        {room.error && room.phase === "playing" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-body text-center">
            {room.error}
          </motion.div>
        )}
      </div>
    </GameLayout>
  );
};

export default ConnectFourGame;
