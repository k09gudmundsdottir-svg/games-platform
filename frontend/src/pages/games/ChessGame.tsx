import { useState, useEffect, useRef } from "react";
import GameLayout from "@/components/GameLayout";
import { playPiecePlace, playPieceSelect, playPieceDeselect } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import {
  createInitialState, getLegalMoves, makeMove, isInCheck, isCheckmate, isStalemate,
  type GameState, type Pos,
} from "@/lib/chessEngine";

const pieceMap: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const fileLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rankLabels = ["8", "7", "6", "5", "4", "3", "2", "1"];

const TIME_CONTROLS = [
  { label: "3 min", subtitle: "Blitz", time: 3 * 60, increment: 0 },
  { label: "5 min", subtitle: "Blitz", time: 5 * 60, increment: 0 },
  { label: "10 min", subtitle: "Rapid", time: 10 * 60, increment: 0 },
  { label: "15+10", subtitle: "Rapid", time: 15 * 60, increment: 10 },
  { label: "30 min", subtitle: "Classical", time: 30 * 60, increment: 0 },
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const ChessClock = ({ seconds, isActive, isLow }: { seconds: number; isActive: boolean; isLow: boolean }) => (
  <div
    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-mono text-sm sm:text-base font-bold tracking-wider transition-colors ${
      isActive
        ? isLow
          ? "bg-red-500/20 text-red-400 animate-pulse"
          : "bg-primary/15 text-primary"
        : "bg-muted/40 text-muted-foreground/60"
    }`}
  >
    {formatTime(seconds)}
  </div>
);

const PlayerBar = ({
  name, isWhite, isTop, time, isActive, inCheck
}: {
  name: string; isWhite: boolean; isTop: boolean; time: number; isActive: boolean; inCheck: boolean;
}) => (
  <div className={`flex items-center justify-between w-full max-w-[min(95vw,95vh,600px)] px-1 sm:px-2 py-1.5 sm:py-2 ${isTop ? "mb-1" : "mt-1"}`}>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shadow-md ${
        isWhite ? "bg-[#f0d9b5] text-[#5d3a1a]" : "bg-[#5d3a1a] text-[#f0d9b5]"
      } ${inCheck ? "ring-2 ring-red-500 animate-pulse" : ""}`}>
        {isWhite ? "♔" : "♚"}
      </div>
      <span className="text-xs sm:text-sm font-display font-semibold text-foreground">{name}</span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {inCheck && <span className="text-[10px] sm:text-xs font-bold text-red-400">CHECK</span>}
    </div>
    <ChessClock seconds={time} isActive={isActive} isLow={time < 60} />
  </div>
);

const TimeControlPicker = ({ onSelect }: { onSelect: (time: number, increment: number) => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md"
  >
    <div className="bg-card border border-border/40 rounded-xl p-4 sm:p-6 shadow-2xl max-w-xs w-full mx-4">
      <h3 className="text-sm sm:text-base font-display font-bold text-foreground text-center mb-1">Select Time Control</h3>
      <p className="text-[10px] sm:text-xs text-muted-foreground text-center mb-4">Choose your pace</p>
      <div className="grid grid-cols-1 gap-2">
        {TIME_CONTROLS.map((tc) => (
          <motion.button
            key={tc.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(tc.time, tc.increment)}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30 hover:bg-primary/10 border border-border/20 hover:border-primary/30 transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⏱</span>
              <span className="text-sm font-display font-semibold text-foreground">{tc.label}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">{tc.subtitle}</span>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

const PromotionDialog = ({ color, onSelect }: { color: "white" | "black"; onSelect: (piece: string) => void }) => {
  const pieces = color === "white" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md"
    >
      <div className="bg-card border border-border/40 rounded-xl p-4 shadow-2xl">
        <p className="text-xs text-muted-foreground text-center mb-3 font-display">Promote pawn to:</p>
        <div className="flex gap-2">
          {pieces.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(p)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted/40 hover:bg-primary/15 border border-border/30 flex items-center justify-center text-3xl sm:text-4xl touch-manipulation"
            >
              {pieceMap[p]}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const GameOverOverlay = ({ message, onNewGame }: { message: string; onNewGame: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md"
  >
    <div className="bg-card border border-border/40 rounded-xl p-6 shadow-2xl text-center">
      <p className="text-lg font-display font-bold text-foreground mb-2">{message}</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNewGame}
        className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm touch-manipulation"
      >
        New Game
      </motion.button>
    </div>
  </motion.div>
);

const MoveHistorySidebar = ({ moves }: { moves: { num: number; white: string; black?: string }[] }) => (
  <div className="p-3">
    <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
    <div className="space-y-1">
      {moves.length === 0 && <p className="text-xs text-muted-foreground/50">No moves yet</p>}
      {moves.map((m) => (
        <div key={m.num} className="flex items-center text-xs font-body">
          <span className="w-6 text-muted-foreground/50">{m.num}.</span>
          <span className="flex-1 text-foreground">{m.white}</span>
          <span className="flex-1 text-muted-foreground">{m.black || ""}</span>
        </div>
      ))}
    </div>
  </div>
);

const ChessGame = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selected, setSelected] = useState<Pos | null>(null);
  const [legalMoves, setLegalMoves] = useState<Pos[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Pos; to: Pos } | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ num: number; white: string; black?: string }[]>([]);
  const [whiteTime, setWhiteTime] = useState(10 * 60);
  const [blackTime, setBlackTime] = useState(10 * 60);
  const [increment, setIncrement] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Pos; to: Pos } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const whiteInCheck = isInCheck(gameState.board, "white");
  const blackInCheck = isInCheck(gameState.board, "black");

  const handleTimeSelect = (time: number, inc: number) => {
    setWhiteTime(time);
    setBlackTime(time);
    setIncrement(inc);
    setTimeSelected(true);
  };

  const handleNewGame = () => {
    setGameState(createInitialState());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameStarted(false);
    setTimeSelected(false);
    setGameOver(null);
    setPendingPromotion(null);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    intervalRef.current = setInterval(() => {
      if (gameState.turn === "white") {
        setWhiteTime(t => {
          if (t <= 1) { setGameOver("Black wins on time!"); return 0; }
          return t - 1;
        });
      } else {
        setBlackTime(t => {
          if (t <= 1) { setGameOver("White wins on time!"); return 0; }
          return t - 1;
        });
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState.turn, gameStarted, gameOver]);

  // Check for checkmate/stalemate after each state change
  useEffect(() => {
    if (gameOver) return;
    if (isCheckmate(gameState)) {
      setGameOver(gameState.turn === "white" ? "Black wins by checkmate!" : "White wins by checkmate!");
    } else if (isStalemate(gameState)) {
      setGameOver("Draw by stalemate!");
    }
  }, [gameState, gameOver]);

  const executeMove = (from: Pos, to: Pos, promoteTo?: string) => {
    const result = makeMove(gameState, from, to, promoteTo);
    setGameState(result.newState);
    setLastMove({ from, to });
    setSelected(null);
    setLegalMoves([]);

    // Update move history
    setMoveHistory(prev => {
      const copy = [...prev];
      if (gameState.turn === "white") {
        copy.push({ num: gameState.fullmoveNumber, white: result.notation });
      } else {
        if (copy.length > 0) {
          copy[copy.length - 1] = { ...copy[copy.length - 1], black: result.notation };
        }
      }
      return copy;
    });

    // Increment
    if (increment > 0) {
      if (gameState.turn === "white") setWhiteTime(t => t + increment);
      else setBlackTime(t => t + increment);
    }

    if (!gameStarted) setGameStarted(true);
    playPiecePlace();
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleSquareClick = (r: number, c: number) => {
    if (gameOver || pendingPromotion) return;

    const piece = gameState.board[r][c];

    if (selected) {
      const [sr, sc] = selected;
      // Deselect
      if (sr === r && sc === c) {
        setSelected(null);
        setLegalMoves([]);
        playPieceDeselect();
        if (navigator.vibrate) navigator.vibrate(5);
        return;
      }

      // Try to select another own piece instead
      if (piece && ((gameState.turn === "white" && piece === piece.toUpperCase()) ||
                     (gameState.turn === "black" && piece === piece.toLowerCase()))) {
        const moves = getLegalMoves(gameState, [r, c]);
        setSelected([r, c]);
        setLegalMoves(moves);
        playPieceSelect();
        if (navigator.vibrate) navigator.vibrate(8);
        return;
      }

      // Check if this is a legal move
      const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
      if (!isLegal) return;

      // Check for promotion
      const movingPiece = gameState.board[sr][sc];
      const promoRow = gameState.turn === "white" ? 0 : 7;
      if (movingPiece.toLowerCase() === "p" && r === promoRow) {
        setPendingPromotion({ from: [sr, sc], to: [r, c] });
        return;
      }

      executeMove([sr, sc], [r, c]);
    } else if (piece) {
      // Only select own pieces
      const isOwn = (gameState.turn === "white" && piece === piece.toUpperCase()) ||
                    (gameState.turn === "black" && piece === piece.toLowerCase());
      if (!isOwn) return;

      const moves = getLegalMoves(gameState, [r, c]);
      setSelected([r, c]);
      setLegalMoves(moves);
      playPieceSelect();
      if (navigator.vibrate) navigator.vibrate(8);
    }
  };

  const handlePromotion = (promoteTo: string) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, promoteTo);
    setPendingPromotion(null);
  };

  const isSelectedSq = (r: number, c: number) => selected?.[0] === r && selected?.[1] === c;
  const isLastMoveSq = (r: number, c: number) =>
    (lastMove?.from[0] === r && lastMove?.from[1] === c) ||
    (lastMove?.to[0] === r && lastMove?.to[1] === c);
  const isLegalTarget = (r: number, c: number) =>
    legalMoves.some(([mr, mc]) => mr === r && mc === c);

  return (
    <GameLayout title="Chess" sidebar={<MoveHistorySidebar moves={moveHistory} />} isSkillGame enableChat>
      <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4">
        <PlayerBar name="Opponent" isWhite={false} isTop time={blackTime} isActive={gameState.turn === "black"} inCheck={blackInCheck} />

        <div className="w-full max-w-[min(95vw,95vh,600px)] aspect-square relative">
          {!timeSelected && <TimeControlPicker onSelect={handleTimeSelect} />}
          {pendingPromotion && <PromotionDialog color={gameState.turn} onSelect={handlePromotion} />}
          {gameOver && <GameOverOverlay message={gameOver} onNewGame={handleNewGame} />}

          <div className={`grid grid-cols-8 w-full h-full rounded-md overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${!timeSelected ? "blur-sm" : ""}`}>
            {gameState.board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const sq = isSelectedSq(r, c);
                const lm = isLastMoveSq(r, c);
                const legal = isLegalTarget(r, c);
                const isCapture = legal && piece !== "";

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    className="aspect-square flex items-center justify-center relative cursor-pointer touch-manipulation select-none"
                    style={{
                      backgroundColor: sq
                        ? "#829769"
                        : lm
                        ? isDark ? "#aaa23a" : "#cdd26a"
                        : isDark
                        ? "#b58863"
                        : "#f0d9b5",
                    }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSquareClick(r, c)}
                  >
                    {c === 0 && (
                      <span className={`absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-bold leading-none ${
                        isDark ? "text-[#f0d9b5]/70" : "text-[#b58863]/70"
                      }`}>
                        {rankLabels[r]}
                      </span>
                    )}
                    {r === 7 && (
                      <span className={`absolute bottom-0.5 right-0.5 text-[8px] sm:text-[10px] font-bold leading-none ${
                        isDark ? "text-[#f0d9b5]/70" : "text-[#b58863]/70"
                      }`}>
                        {fileLabels[c]}
                      </span>
                    )}

                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.span
                          key={`${piece}-${r}-${c}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className={`text-[clamp(1.8rem,8vw,3.2rem)] leading-none select-none drop-shadow-md ${
                            piece === piece.toUpperCase()
                              ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
                              : "text-[#1a1a1a] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                          }`}
                        >
                          {pieceMap[piece]}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Legal move dot */}
                    {legal && !piece && (
                      <div className="absolute w-[26%] h-[26%] rounded-full bg-black/25" />
                    )}
                    {/* Legal capture ring */}
                    {isCapture && (
                      <div className="absolute inset-[6%] rounded-full border-[3px] sm:border-4 border-black/25" />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <PlayerBar name="You" isWhite isTop={false} time={whiteTime} isActive={gameState.turn === "white"} inCheck={whiteInCheck} />
      </div>
    </GameLayout>
  );
};

export default ChessGame;
