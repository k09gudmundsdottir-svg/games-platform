import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Copy, Check, DoorOpen, Plus, User, Crown, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameLayout from "@/components/GameLayout";
import { useGameRoom, RoomPhase } from "@/hooks/useGameRoom";
import { chessApi } from "@/lib/api";

// ── Piece rendering ─────────────────────────────────────────────────────────

const pieceUnicode: Record<string, string> = {
  K: "\u2654", Q: "\u2655", R: "\u2656", B: "\u2657", N: "\u2658", P: "\u2659",
  k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F",
};

function fenToBoard(fen: string): string[][] {
  const rows = fen.split(" ")[0].split("/");
  return rows.map(row => {
    const cells: string[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) cells.push("");
      } else {
        cells.push(ch);
      }
    }
    return cells;
  });
}

function squareName(row: number, col: number, flipped: boolean): string {
  const r = flipped ? row : 7 - row;
  const c = flipped ? 7 - col : col;
  return String.fromCharCode(97 + c) + (r + 1);
}

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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="font-display text-xl font-bold text-foreground">Chess</h3>
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive font-body">
              {error}
            </div>
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
                <input
                  type="text" placeholder="Your name..." value={playerName}
                  onChange={e => setPlayerName(e.target.value)} maxLength={20} autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && playerName.trim()) setPhase("choose"); }}
                  className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-center text-lg"
                />
                <button disabled={!playerName.trim()} onClick={() => setPhase("choose")}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue
                </button>
              </motion.div>
            )}

            {phase === "choose" && (
              <motion.div key="choose" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                <p className="text-center text-sm font-body text-muted-foreground mb-2">
                  Welcome, <span className="text-foreground font-medium">{playerName}</span>
                </p>
                <button onClick={createRoom} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-display font-semibold text-foreground">Create Room</p>
                    <p className="text-xs font-body text-muted-foreground">Generate a code to share</p>
                  </div>
                </button>
                <button onClick={() => setPhase("join")} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                    <DoorOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-display font-semibold text-foreground">Join Room</p>
                    <p className="text-xs font-body text-muted-foreground">Enter a code to join a friend</p>
                  </div>
                </button>
              </motion.div>
            )}

            {phase === "join" && (
              <motion.div key="join" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-body text-muted-foreground mb-3">Enter the room code</p>
                  <input
                    type="text" placeholder="ABCD12" value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} maxLength={6} autoFocus
                    onKeyDown={e => { if (e.key === "Enter" && joinCode.length >= 4) joinRoom(joinCode); }}
                    className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-display text-2xl font-bold text-foreground text-center tracking-[0.3em] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
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
                        <div className="flex-1">
                          <p className="text-sm font-display font-medium text-foreground">{p.name}</p>
                          {i === 0 && <p className="text-[10px] font-body text-primary">Host</p>}
                        </div>
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
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
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

// ── Game Over Overlay ───────────────────────────────────────────────────────

const GameOverOverlay = ({ status, winner, onNewGame }: { status: string; winner: any; onNewGame: () => void }) => {
  const navigate = useNavigate();
  let title = "Game Over";
  let subtitle = "";
  if (status === "checkmate") { title = "Checkmate!"; subtitle = `${winner?.name || "Unknown"} wins!`; }
  else if (status === "stalemate") { title = "Stalemate"; subtitle = "The game is a draw."; }
  else if (status === "draw") { title = "Draw"; subtitle = "The game is a draw."; }
  else if (status === "resigned") { title = "Resignation"; subtitle = `${winner?.name || "Unknown"} wins!`; }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-2xl border border-border/50 bg-card shadow-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">{status === "checkmate" || status === "resigned" ? "\u2654" : "\u00BD"}</span>
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

// ── Move History Sidebar ────────────────────────────────────────────────────

const MoveHistory = ({ moves }: { moves: any[] }) => {
  const pairs: { num: number; white: string; black: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i]?.san || "",
      black: moves[i + 1]?.san || "",
    });
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
      {pairs.length === 0 && <p className="text-xs font-body text-muted-foreground/50">No moves yet</p>}
      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {pairs.map(m => (
          <div key={m.num} className="flex items-center text-xs font-body">
            <span className="w-6 text-muted-foreground/50">{m.num}.</span>
            <span className="flex-1 text-foreground">{m.white}</span>
            <span className="flex-1 text-muted-foreground">{m.black}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Captured Pieces ─────────────────────────────────────────────────────────

const CapturedPieces = ({ pieces, color }: { pieces: string[]; color: "white" | "black" }) => {
  const map: Record<string, string> = color === "white"
    ? { p: "\u265F", r: "\u265C", n: "\u265E", b: "\u265D", q: "\u265B" }
    : { p: "\u2659", r: "\u2656", n: "\u2658", b: "\u2657", q: "\u2655" };

  return (
    <div className="flex flex-wrap gap-0.5 min-h-[20px]">
      {pieces.map((p, i) => (
        <span key={i} className="text-sm opacity-60">{map[p] || p}</span>
      ))}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const ChessGame = () => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGameInit = useCallback(async (roomId: string, players: { id: string; name: string }[], setGS: (gs: any, es?: any, ct?: string | null) => void) => {
    const res = await chessApi.init(roomId, players);
    setGS(res.boardState, { status: "active", lastMove: null, isCheck: false }, res.currentTurn);
  }, []);

  const room = useGameRoom({ gameType: "chess", onGameInit: handleGameInit });

  const gameState = room.gameState;
  const extraState = room.extraState;
  const isGameOver = extraState && extraState.status && extraState.status !== "active";

  // Determine player color
  const myColor = gameState?.white?.id === room.playerId ? "white" : "black";
  const isFlipped = myColor === "black";
  const isMyTurn = room.currentTurn === room.playerId;

  // Parse board from FEN
  const board = gameState?.fen ? fenToBoard(gameState.fen) : fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

  const opponentInfo = myColor === "white" ? gameState?.black : gameState?.white;
  const myInfo = myColor === "white" ? gameState?.white : gameState?.black;

  // Click on a square
  const handleSquareClick = async (displayRow: number, displayCol: number) => {
    if (!room.roomId || !room.playerId || isGameOver || loading) return;

    const sq = squareName(displayRow, displayCol, isFlipped);
    const actualRow = isFlipped ? 7 - displayRow : displayRow;
    const actualCol = isFlipped ? 7 - displayCol : displayCol;
    const piece = board[actualRow]?.[actualCol] || "";

    // If clicking a legal move destination -> make the move
    if (selectedSquare && legalMoves.includes(sq)) {
      setLoading(true);
      try {
        // Backend defaults promotion to queen, always pass 'q' for simplicity
        const res = await chessApi.move(room.roomId, room.playerId, selectedSquare, sq, "q");
        room.setGameState(
          { ...gameState, fen: res.fen, moveHistory: res.moveHistory, captured: res.captured },
          { status: res.gameStatus, lastMove: res.san ? { from: selectedSquare, to: sq, san: res.san } : null, isCheck: res.isCheck, winner: res.winner },
          res.currentTurn,
        );
      } catch (e: any) {
        room.setError(e.message);
        setTimeout(() => room.setError(null), 3000);
      }
      setSelectedSquare(null);
      setLegalMoves([]);
      setLoading(false);
      return;
    }

    // If clicking own piece -> select it and fetch legal moves
    const isPieceOwn = piece && ((myColor === "white" && piece === piece.toUpperCase()) || (myColor === "black" && piece === piece.toLowerCase()));

    if (isPieceOwn && isMyTurn) {
      setSelectedSquare(sq);
      try {
        const res = await chessApi.legalMoves(room.roomId, sq);
        setLegalMoves(res.moves.map(m => m.to));
      } catch {
        setLegalMoves([]);
      }
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handleResign = async () => {
    if (!room.roomId || !room.playerId) return;
    try {
      const res = await chessApi.resign(room.roomId, room.playerId);
      room.setGameState(gameState, { status: "resigned", winner: res.winner });
    } catch (e: any) {
      room.setError(e.message);
    }
  };

  const handleNewGame = () => {
    window.location.reload();
  };

  const moveHistory = gameState?.moveHistory || [];
  const captured = gameState?.captured || { white: [], black: [] };

  const sidebar = (
    <div className="flex flex-col h-full">
      <MoveHistory moves={moveHistory} />
      {room.phase === "playing" && (
        <div className="mt-auto p-3 border-t border-border/20">
          <button onClick={handleResign} disabled={isGameOver as boolean}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-destructive/30 text-destructive text-xs font-display font-medium hover:bg-destructive/10 transition-colors disabled:opacity-30">
            <Flag className="w-3 h-3" /> Resign
          </button>
        </div>
      )}
    </div>
  );

  return (
    <GameLayout title="Chess" sidebar={sidebar}>
      {room.phase !== "playing" && (
        <RoomOverlay
          phase={room.phase} playerName={room.playerName} setPlayerName={room.setPlayerName}
          setPhase={room.setPhase} createRoom={room.createRoom} joinRoom={room.joinRoom}
          startGame={room.startGame} leaveRoom={room.leaveRoom} isHost={room.isHost}
          players={room.players} roomCode={room.roomCode} error={room.error}
        />
      )}

      {isGameOver && <GameOverOverlay status={extraState.status} winner={extraState.winner} onNewGame={handleNewGame} />}

      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[min(90vw,560px)] aspect-square">
          {/* Opponent Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border/30 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-muted-foreground">
                {(opponentInfo?.name || "?").substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">{opponentInfo?.name || "Waiting..."}</p>
              <p className="text-[10px] font-body text-muted-foreground">{myColor === "white" ? "Black" : "White"}</p>
            </div>
            <div className="ml-auto">
              <CapturedPieces pieces={myColor === "white" ? captured.black : captured.white} color={myColor === "white" ? "black" : "white"} />
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-8 border border-border/30 rounded-lg overflow-hidden shadow-card relative">
            {Array.from({ length: 8 }).map((_, displayRow) =>
              Array.from({ length: 8 }).map((_, displayCol) => {
                const actualRow = isFlipped ? 7 - displayRow : displayRow;
                const actualCol = isFlipped ? 7 - displayCol : displayCol;
                const piece = board[actualRow]?.[actualCol] || "";
                const isDark = (actualRow + actualCol) % 2 === 1;
                const sq = squareName(displayRow, displayCol, isFlipped);
                const isSelected = selectedSquare === sq;
                const isLegal = legalMoves.includes(sq);
                const isLastMove = extraState?.lastMove && (extraState.lastMove.from === sq || extraState.lastMove.to === sq);
                const isKingInCheck = extraState?.isCheck && ((piece === "K" && gameState?.fen?.includes(" b ")) || (piece === "k" && gameState?.fen?.includes(" w ")));

                return (
                  <div
                    key={`${displayRow}-${displayCol}`}
                    onClick={() => handleSquareClick(displayRow, displayCol)}
                    className={`aspect-square flex items-center justify-center cursor-pointer relative transition-all ${
                      isDark ? "bg-primary/15" : "bg-secondary/60"
                    } ${isSelected ? "ring-2 ring-primary z-10" : ""} ${isLastMove ? "bg-primary/25" : ""} ${isKingInCheck ? "bg-destructive/30" : ""}`}
                  >
                    {/* Legal move indicator */}
                    {isLegal && !piece && (
                      <div className="absolute w-[30%] h-[30%] rounded-full bg-primary/40" />
                    )}
                    {isLegal && piece && (
                      <div className="absolute inset-0 ring-2 ring-primary/50 rounded-sm" />
                    )}

                    {piece && (
                      <span className={`text-2xl md:text-3xl select-none drop-shadow-md ${
                        piece === piece.toUpperCase() ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {pieceUnicode[piece]}
                      </span>
                    )}

                    {/* Rank/file labels */}
                    {displayCol === 0 && (
                      <span className="absolute top-0.5 left-0.5 text-[8px] font-body text-muted-foreground/40 select-none">
                        {isFlipped ? actualRow + 1 : 8 - displayRow}
                      </span>
                    )}
                    {displayRow === 7 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-body text-muted-foreground/40 select-none">
                        {String.fromCharCode(97 + (isFlipped ? 7 - displayCol : displayCol))}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* My Info */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-primary">
                {(myInfo?.name || room.playerName || "?").substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">{myInfo?.name || room.playerName || "You"}</p>
              <p className="text-[10px] font-body text-muted-foreground">{myColor === "white" ? "White" : "Black"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CapturedPieces pieces={myColor === "white" ? captured.white : captured.black} color={myColor} />
              {room.phase === "playing" && (
                <div className={`px-3 py-1 rounded-lg ${isMyTurn ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border/30"}`}>
                  <span className={`font-display text-xs font-bold ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
                    {isMyTurn ? "Your turn" : "Waiting..."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error display */}
          {room.error && room.phase === "playing" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-body text-center">
              {room.error}
            </motion.div>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default ChessGame;
