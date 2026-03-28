import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, DoorOpen, Plus, User, Crown, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GameLayout from "@/components/GameLayout";
import { useGameRoom, RoomPhase } from "@/hooks/useGameRoom";
import { checkersApi } from "@/lib/api";

// Piece constants matching backend
const EMPTY = 0;
const P1 = 1;
const P1_KING = 2;
const P2 = 3;
const P2_KING = 4;

function isOwnPiece(piece: number, playerNum: number): boolean {
  if (playerNum === 1) return piece === P1 || piece === P1_KING;
  return piece === P2 || piece === P2_KING;
}

function isKing(piece: number): boolean {
  return piece === P1_KING || piece === P2_KING;
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
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="font-display text-xl font-bold text-foreground">Checkers</h3>
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

// ── Game Over Overlay ───────────────────────────────────────────────────────

const GameOverOverlay = ({ status, winner, onNewGame }: { status: string; winner: any; onNewGame: () => void }) => {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm rounded-2xl border border-border/50 bg-card shadow-2xl p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">{"\uD83C\uDFC6"}</span>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Game Over!</h2>
        <p className="text-sm font-body text-muted-foreground mb-6">{winner?.name || "Unknown"} wins!</p>
        <div className="flex gap-3">
          <button onClick={() => navigate("/")} className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">Home</button>
          <button onClick={onNewGame} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow">New Game</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Move History Sidebar ────────────────────────────────────────────────────

const MoveHistory = ({ moves, player1Name, player2Name }: { moves: any[]; player1Name: string; player2Name: string }) => (
  <div className="p-3">
    <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
    {moves.length === 0 && <p className="text-xs font-body text-muted-foreground/50">No moves yet</p>}
    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
      {moves.map((m, i) => (
        <div key={i} className="flex items-center text-xs font-body gap-2">
          <span className="w-5 text-muted-foreground/50">{i + 1}.</span>
          <span className="text-foreground">
            ({m.from.row},{m.from.col}) {"\u2192"} ({m.to.row},{m.to.col})
          </span>
          {m.captures && m.captures.length > 0 && (
            <span className="text-primary text-[10px]">+{m.captures.length} cap</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────

const CheckersGame = () => {
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [legalMoves, setLegalMoves] = useState<any[]>([]);
  const [allLegalMoves, setAllLegalMoves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGameInit = useCallback(async (roomId: string, players: { id: string; name: string }[], setGS: (gs: any, es?: any, ct?: string | null) => void) => {
    const res = await checkersApi.init(roomId, players);
    setGS(res.boardState, { status: "active", lastMove: null, winner: null }, res.currentTurn);
  }, []);

  const room = useGameRoom({ gameType: "checkers", onGameInit: handleGameInit });

  const gameState = room.gameState;
  const extraState = room.extraState;
  const isGameOver = extraState && extraState.status && extraState.status !== "active";

  // Player 1 is at bottom (rows 5-7), Player 2 is at top (rows 0-2)
  const myPlayerNum = gameState?.player1?.id === room.playerId ? 1 : 2;
  const isFlipped = myPlayerNum === 2; // Player 2 sees board flipped
  const isMyTurn = room.currentTurn === room.playerId;

  const board: number[][] = gameState?.board || Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  const capturedCount = gameState?.capturedCount || { player1: 0, player2: 0 };

  const myInfo = myPlayerNum === 1 ? gameState?.player1 : gameState?.player2;
  const opponentInfo = myPlayerNum === 1 ? gameState?.player2 : gameState?.player1;

  // Fetch all legal moves when it becomes my turn
  useEffect(() => {
    if (!room.roomId || !room.playerId || !isMyTurn || isGameOver) {
      setAllLegalMoves([]);
      return;
    }
    checkersApi.legalMoves(room.roomId, room.playerId).then(res => {
      setAllLegalMoves(res.moves);
    }).catch(() => setAllLegalMoves([]));
  }, [room.roomId, room.playerId, isMyTurn, isGameOver, room.currentTurn]);

  const handleSquareClick = async (displayRow: number, displayCol: number) => {
    if (!room.roomId || !room.playerId || isGameOver || loading) return;

    const actualRow = isFlipped ? 7 - displayRow : displayRow;
    const actualCol = isFlipped ? 7 - displayCol : displayCol;
    const piece = board[actualRow]?.[actualCol] ?? EMPTY;

    // If we have a selected piece and clicking on a legal move destination
    if (selectedPiece) {
      const matchingMove = legalMoves.find(
        m => m.to.row === actualRow && m.to.col === actualCol
      );
      if (matchingMove) {
        setLoading(true);
        try {
          const res = await checkersApi.move(room.roomId, room.playerId, selectedPiece, { row: actualRow, col: actualCol });
          room.setGameState(
            { ...gameState, board: res.board, moveHistory: res.moveHistory, capturedCount: res.capturedCount },
            { status: res.gameStatus, lastMove: res.lastMove, winner: res.winner },
            res.currentTurn,
          );
        } catch (e: any) {
          room.setError(e.message);
          setTimeout(() => room.setError(null), 3000);
        }
        setSelectedPiece(null);
        setLegalMoves([]);
        setAllLegalMoves([]);
        setLoading(false);
        return;
      }
    }

    // Selecting own piece
    if (isMyTurn && piece !== EMPTY && isOwnPiece(piece, myPlayerNum)) {
      const pieceMoves = allLegalMoves.filter(
        m => m.from.row === actualRow && m.from.col === actualCol
      );
      if (pieceMoves.length > 0) {
        setSelectedPiece({ row: actualRow, col: actualCol });
        setLegalMoves(pieceMoves);
      } else {
        setSelectedPiece(null);
        setLegalMoves([]);
      }
    } else {
      setSelectedPiece(null);
      setLegalMoves([]);
    }
  };

  const isLegalTarget = (actualRow: number, actualCol: number) =>
    legalMoves.some(m => m.to.row === actualRow && m.to.col === actualCol);

  const isMovablePiece = (actualRow: number, actualCol: number) =>
    allLegalMoves.some(m => m.from.row === actualRow && m.from.col === actualCol);

  const moveHistory = gameState?.moveHistory || [];

  const sidebar = (
    <MoveHistory
      moves={moveHistory}
      player1Name={gameState?.player1?.name || "Player 1"}
      player2Name={gameState?.player2?.name || "Player 2"}
    />
  );

  return (
    <GameLayout title="Checkers" sidebar={sidebar}>
      {room.phase !== "playing" && (
        <RoomOverlay
          phase={room.phase} playerName={room.playerName} setPlayerName={room.setPlayerName}
          setPhase={room.setPhase} createRoom={room.createRoom} joinRoom={room.joinRoom}
          startGame={room.startGame} leaveRoom={room.leaveRoom} isHost={room.isHost}
          players={room.players} roomCode={room.roomCode} error={room.error}
        />
      )}

      {isGameOver && <GameOverOverlay status={extraState.status} winner={extraState.winner} onNewGame={() => window.location.reload()} />}

      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[min(90vw,520px)] aspect-square">
          {/* Opponent Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border/30 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-muted-foreground">
                {(opponentInfo?.name || "?").substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">{opponentInfo?.name || "Waiting..."}</p>
              <p className="text-[10px] font-body text-muted-foreground">
                {myPlayerNum === 1 ? "Black (top)" : "Red (bottom)"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-body text-muted-foreground">
                Captured: {myPlayerNum === 1 ? capturedCount.player2 : capturedCount.player1}
              </span>
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-8 border border-border/30 rounded-lg overflow-hidden shadow-card">
            {Array.from({ length: 8 }).map((_, displayRow) =>
              Array.from({ length: 8 }).map((_, displayCol) => {
                const actualRow = isFlipped ? 7 - displayRow : displayRow;
                const actualCol = isFlipped ? 7 - displayCol : displayCol;
                const piece = board[actualRow]?.[actualCol] ?? EMPTY;
                const isDark = (actualRow + actualCol) % 2 === 1;
                const isSelected = selectedPiece?.row === actualRow && selectedPiece?.col === actualCol;
                const isLegal = isLegalTarget(actualRow, actualCol);
                const canMove = isMyTurn && isOwnPiece(piece, myPlayerNum) && isMovablePiece(actualRow, actualCol);
                const isLastMove = extraState?.lastMove && (
                  (extraState.lastMove.from.row === actualRow && extraState.lastMove.from.col === actualCol) ||
                  (extraState.lastMove.to.row === actualRow && extraState.lastMove.to.col === actualCol)
                );

                const isP1Piece = piece === P1 || piece === P1_KING;
                const isP2Piece = piece === P2 || piece === P2_KING;
                const isPieceKing = isKing(piece);

                return (
                  <div
                    key={`${displayRow}-${displayCol}`}
                    onClick={() => handleSquareClick(displayRow, displayCol)}
                    className={`aspect-square flex items-center justify-center relative transition-all ${
                      isDark ? "bg-primary/15" : "bg-secondary/60"
                    } ${isSelected ? "ring-2 ring-primary z-10" : ""} ${isLastMove ? "bg-primary/25" : ""} ${
                      isDark ? "cursor-pointer" : ""
                    }`}
                  >
                    {/* Legal move indicator */}
                    {isLegal && piece === EMPTY && (
                      <div className="absolute w-[30%] h-[30%] rounded-full bg-primary/40" />
                    )}
                    {isLegal && piece !== EMPTY && (
                      <div className="absolute inset-1 ring-2 ring-primary/50 rounded-full" />
                    )}

                    {/* Piece */}
                    {piece !== EMPTY && (
                      <div className={`w-[70%] h-[70%] rounded-full border-2 shadow-lg flex items-center justify-center transition-all ${
                        isP1Piece
                          ? `bg-primary/80 border-primary shadow-primary/20 ${canMove ? "ring-1 ring-primary/40" : ""}`
                          : `bg-muted-foreground/70 border-muted-foreground shadow-muted-foreground/20 ${canMove ? "ring-1 ring-muted-foreground/40" : ""}`
                      } ${isSelected ? "scale-110" : ""}`}>
                        {isPieceKing && (
                          <span className="text-xs font-bold select-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            {"\u265A"}
                          </span>
                        )}
                      </div>
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
              <p className="text-[10px] font-body text-muted-foreground">
                {myPlayerNum === 1 ? "Red (bottom)" : "Black (top)"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs font-body text-muted-foreground">
                Captured: {myPlayerNum === 1 ? capturedCount.player1 : capturedCount.player2}
              </span>
              {room.phase === "playing" && (
                <div className={`px-3 py-1 rounded-lg ${isMyTurn ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border/30"}`}>
                  <span className={`font-display text-xs font-bold ${isMyTurn ? "text-primary" : "text-muted-foreground"}`}>
                    {isMyTurn ? "Your turn" : "Waiting..."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
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

export default CheckersGame;
