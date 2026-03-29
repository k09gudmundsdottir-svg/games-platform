import { useState, useEffect, useRef, useCallback } from "react";
import GameLayout from "@/components/GameLayout";
import { playPiecePlace, playPieceSelect, playPieceDeselect } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import type { Square, Move } from "chess.js";

/* ─── Piece SVG URLs (Cburnett set from Wikimedia Commons) ─── */
const PIECE_IMAGES: Record<string, string> = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
};

/* ─── Chess.com board colors ─── */
const LIGHT_SQ = "#f0d9b5";
const DARK_SQ = "#b58863";
const LIGHT_LABEL = "#f0d9b5";
const DARK_LABEL = "#b58863";
const LAST_MOVE_LIGHT = "#f7ec59";
const LAST_MOVE_DARK = "#dbc34d";
const SELECTED_LIGHT = "#f7ec59";
const SELECTED_DARK = "#dbc34d";

const fileLabels = ["a", "b", "c", "d", "e", "f", "g", "h"];
const rankLabels = ["8", "7", "6", "5", "4", "3", "2", "1"];

/* ─── Time controls ─── */
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

/* ─── Captured pieces ordering ─── */
const PIECE_ORDER: Record<string, number> = { q: 0, r: 1, b: 2, n: 3, p: 4 };
const PIECE_VALUES_SIMPLE: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };

/* ─── Helpers ─── */
const sqToRC = (sq: Square): [number, number] => [8 - parseInt(sq[1]), sq.charCodeAt(0) - 97];
const rcToSq = (r: number, c: number): Square => `${String.fromCharCode(97 + c)}${8 - r}` as Square;
const pieceImgKey = (color: "w" | "b", type: string) => `${color}${type.toUpperCase()}`;

/* ─── Sub-components ─── */

const ChessClock = ({ seconds, isActive, isLow }: { seconds: number; isActive: boolean; isLow: boolean }) => (
  <div
    className="px-3 py-1 rounded font-mono text-base font-bold tracking-wider transition-colors"
    style={{
      backgroundColor: isActive ? (isLow ? "#b33430" : "#4a7a2e") : "#3a3a3a",
      color: isActive ? "#ffffff" : "#aaaaaa",
    }}
  >
    {formatTime(seconds)}
  </div>
);

const CapturedPieces = ({ pieces, advantage }: { pieces: string[]; advantage: number }) => {
  const sorted = [...pieces].sort((a, b) => (PIECE_ORDER[a] ?? 9) - (PIECE_ORDER[b] ?? 9));
  return (
    <div className="flex items-center gap-0 h-5 min-h-[20px]">
      {sorted.map((p, i) => {
        const color = p === p.toUpperCase() ? "w" : "b";
        const imgKey = `${color}${p.toUpperCase()}`;
        return (
          <img
            key={`${p}-${i}`}
            src={PIECE_IMAGES[imgKey]}
            alt={p}
            className="h-4 w-4 -mr-0.5"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
          />
        );
      })}
      {advantage > 0 && (
        <span className="text-xs font-semibold text-muted-foreground ml-1">+{advantage}</span>
      )}
    </div>
  );
};

const PlayerBar = ({
  name, isWhite, isTop, time, isActive, inCheck, capturedPieces, advantage,
}: {
  name: string; isWhite: boolean; isTop: boolean; time: number;
  isActive: boolean; inCheck: boolean;
  capturedPieces: string[]; advantage: number;
}) => (
  <div className={`flex items-center justify-between w-full max-w-[min(95vw,95vh,600px)] px-0.5 py-1 ${isTop ? "mb-0.5" : "mt-0.5"}`}>
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div
        className="w-8 h-8 rounded flex items-center justify-center shadow-sm"
        style={{
          backgroundColor: isWhite ? "#f0f0f0" : "#2a2a2a",
          border: `1px solid ${isWhite ? "#ccc" : "#555"}`,
        }}
      >
        <img
          src={isWhite ? PIECE_IMAGES.wK : PIECE_IMAGES.bK}
          alt={isWhite ? "White" : "Black"}
          className="w-6 h-6"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground truncate">{name}</span>
          {inCheck && <span className="text-[10px] font-bold text-red-500">CHECK</span>}
        </div>
        <CapturedPieces pieces={capturedPieces} advantage={advantage} />
      </div>
    </div>
    <ChessClock seconds={time} isActive={isActive} isLow={time < 60} />
  </div>
);

const TimeControlPicker = ({ onSelect }: { onSelect: (time: number, increment: number) => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    style={{ borderRadius: 0 }}
  >
    <div className="bg-[#312e2b] border border-[#4a4744] rounded-xl p-4 sm:p-6 shadow-2xl max-w-xs w-full mx-4">
      <h3 className="text-sm sm:text-base font-bold text-white text-center mb-1">Select Time Control</h3>
      <p className="text-[10px] sm:text-xs text-[#9b9895] text-center mb-4">Choose your pace</p>
      <div className="grid grid-cols-1 gap-2">
        {TIME_CONTROLS.map((tc) => (
          <motion.button
            key={tc.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(tc.time, tc.increment)}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-[#4a7a2e] transition-colors touch-manipulation"
            style={{ backgroundColor: "#3a3a3a", border: "1px solid #4a4744" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">&#9201;</span>
              <span className="text-sm font-semibold text-white">{tc.label}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[#9b9895] font-medium uppercase tracking-wider">{tc.subtitle}</span>
          </motion.button>
        ))}
      </div>
    </div>
  </motion.div>
);

const PromotionDialog = ({ color, onSelect }: { color: "w" | "b"; onSelect: (piece: string) => void }) => {
  const pieces = color === "w" ? ["q", "r", "b", "n"] : ["q", "r", "b", "n"];
  const imgColor = color;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#312e2b] border border-[#4a4744] rounded-xl p-4 shadow-2xl">
        <p className="text-xs text-[#9b9895] text-center mb-3">Promote pawn to:</p>
        <div className="flex gap-2">
          {pieces.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(p)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center touch-manipulation"
              style={{ backgroundColor: "#4a4744", border: "1px solid #5a5754" }}
            >
              <img src={PIECE_IMAGES[`${imgColor}${p.toUpperCase()}`]} alt={p} className="w-10 h-10 sm:w-12 sm:h-12" />
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
    className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  >
    <div className="bg-[#312e2b] border border-[#4a4744] rounded-xl p-6 shadow-2xl text-center">
      <p className="text-lg font-bold text-white mb-4">{message}</p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNewGame}
        className="px-6 py-2.5 rounded-lg font-semibold text-sm touch-manipulation"
        style={{ backgroundColor: "#81b64c", color: "#fff" }}
      >
        New Game
      </motion.button>
    </div>
  </motion.div>
);

const MoveHistorySidebar = ({ moves }: { moves: { num: number; white: string; black?: string }[] }) => (
  <div className="p-3">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
    <div className="space-y-0">
      {moves.length === 0 && <p className="text-xs text-muted-foreground/50">No moves yet</p>}
      {moves.map((m) => (
        <div
          key={m.num}
          className="flex items-center text-xs py-0.5 px-1"
          style={{ backgroundColor: m.num % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}
        >
          <span className="w-7 text-muted-foreground/50 font-mono">{m.num}.</span>
          <span className="flex-1 text-foreground font-medium">{m.white}</span>
          <span className="flex-1 text-muted-foreground">{m.black || ""}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─── AI Engine (minimax with chess.js) ─── */
const PIECE_VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,10,10,10,10,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};

const getPstValue = (type: string, color: "w" | "b", r: number, c: number): number => {
  const idx = color === "w" ? (7 - r) * 8 + c : r * 8 + c;
  return PST[type]?.[idx] || 0;
};

const evaluatePosition = (chess: Chess): number => {
  let score = 0;
  let whiteBishops = 0, blackBishops = 0;

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const val = PIECE_VAL[cell.type] || 0;
      const pst = getPstValue(cell.type, cell.color, r, c);
      if (cell.color === "w") {
        score += val + pst;
        if (cell.type === "b") whiteBishops++;
      } else {
        score -= val + pst;
        if (cell.type === "b") blackBishops++;
      }
    }
  }

  // Bishop pair bonus
  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;

  // Mobility bonus
  const currentMoves = chess.moves().length;
  const turnSign = chess.turn() === "w" ? 1 : -1;
  score += turnSign * currentMoves * 0.5;

  // Check bonus
  if (chess.isCheck()) {
    score += chess.turn() === "b" ? 20 : -20;
  }

  return score;
};

let nodeCount = 0;
const MAX_NODES = 50000;

const orderMoves = (moves: Move[]): Move[] => {
  return moves.sort((a, b) => {
    let sa = 0, sb = 0;
    // MVV-LVA
    if (a.captured) sa += (PIECE_VAL[a.captured] || 0) * 10 - (PIECE_VAL[a.piece] || 0);
    if (b.captured) sb += (PIECE_VAL[b.captured] || 0) * 10 - (PIECE_VAL[b.piece] || 0);
    // Promotions
    if (a.promotion) sa += PIECE_VAL[a.promotion] || 0;
    if (b.promotion) sb += PIECE_VAL[b.promotion] || 0;
    // Center preference
    const [ar, ac] = sqToRC(a.to as Square);
    const [br, bc] = sqToRC(b.to as Square);
    sa += (7 - Math.abs(3.5 - ar) - Math.abs(3.5 - ac)) * 2;
    sb += (7 - Math.abs(3.5 - br) - Math.abs(3.5 - bc)) * 2;
    return sb - sa;
  });
};

const quiesce = (chess: Chess, alpha: number, beta: number, maximizing: boolean, depth: number): number => {
  nodeCount++;
  if (nodeCount > MAX_NODES) return evaluatePosition(chess);
  const standPat = evaluatePosition(chess);
  if (depth <= 0) return standPat;

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  // Only search captures
  const captures = chess.moves({ verbose: true }).filter(m => m.captured);
  for (const move of orderMoves(captures)) {
    chess.move(move);
    const score = quiesce(chess, alpha, beta, !maximizing, depth - 1);
    chess.undo();
    if (maximizing) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }
  return maximizing ? alpha : beta;
};

const minimax = (chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number => {
  nodeCount++;
  if (nodeCount > MAX_NODES) return evaluatePosition(chess);

  if (chess.isCheckmate()) return maximizing ? -99999 + (5 - depth) : 99999 - (5 - depth);
  if (chess.isDraw() || chess.isStalemate()) return 0;
  if (depth === 0) return quiesce(chess, alpha, beta, maximizing, 2);

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const ev = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getComputerMove = (chess: Chess): Move | null => {
  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) return null;

  nodeCount = 0;
  let bestMove = moves[0];
  let bestScore = Infinity; // Computer is black (minimizing)
  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, 3, -Infinity, Infinity, true);
    chess.undo();
    if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
};

const getHintMove = (chess: Chess): { move: Move; reason: string } | null => {
  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) return null;

  nodeCount = 0;
  let bestMove = moves[0];
  let bestScore = -Infinity; // Hint is for white (maximizing)
  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, 3, -Infinity, Infinity, false);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  const pieceName = (p: string) => ({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[p] || p);
  let reason = `Move ${pieceName(bestMove.piece)} from ${bestMove.from} to ${bestMove.to}`;
  if (bestMove.captured) reason += ` — captures ${pieceName(bestMove.captured)}!`;
  else if (bestScore > 500) reason += " — strong positional advantage";
  else if (bestScore > 100) reason += " — improves your position";
  else reason += " — best available move";

  // Check if gives check
  chess.move(bestMove);
  if (chess.isCheck()) reason += " (gives check!)";
  chess.undo();

  return { move: bestMove, reason };
};

/* ─── Main component ─── */
const ChessGame = () => {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ num: number; white: string; black?: string }[]>([]);
  const [whiteTime, setWhiteTime] = useState(10 * 60);
  const [blackTime, setBlackTime] = useState(10 * 60);
  const [increment, setIncrement] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeSelected, setTimeSelected] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);
  const [helpMode, setHelpMode] = useState(false);
  const [hint, setHint] = useState<{ from: Square; to: Square; reason: string } | null>(null);
  const [hintThinking, setHintThinking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const turn = chess.turn();
  const whiteInCheck = turn === "w" && chess.isCheck();
  const blackInCheck = turn === "b" && chess.isCheck();

  // Material advantage
  const whiteMaterial = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES_SIMPLE[p] || 0), 0);
  const blackMaterial = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES_SIMPLE[p] || 0), 0);
  const whiteAdvantage = whiteMaterial - blackMaterial;
  const blackAdvantage = blackMaterial - whiteMaterial;

  const handleTimeSelect = (time: number, inc: number) => {
    setWhiteTime(time);
    setBlackTime(time);
    setIncrement(inc);
    setTimeSelected(true);
  };

  const handleNewGame = () => {
    chess.reset();
    setFen(chess.fen());
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameStarted(false);
    setTimeSelected(false);
    setGameOver(null);
    setPendingPromotion(null);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setHint(null);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    intervalRef.current = setInterval(() => {
      if (chess.turn() === "w") {
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
  }, [fen, gameStarted, gameOver]);

  // Check for checkmate/stalemate/draw
  useEffect(() => {
    if (gameOver) return;
    if (chess.isCheckmate()) {
      setGameOver(chess.turn() === "w" ? "Black wins by checkmate!" : "White wins by checkmate!");
    } else if (chess.isStalemate()) {
      setGameOver("Draw by stalemate!");
    } else if (chess.isDraw()) {
      setGameOver("Draw!");
    }
  }, [fen, gameOver]);

  const executeMove = useCallback((from: Square, to: Square, promotion?: string) => {
    const turnBefore = chess.turn();
    const moveNumBefore = chess.moveNumber();
    const result = chess.move({ from, to, promotion });
    if (!result) return null;

    setFen(chess.fen());
    setLastMove({ from, to });
    setSelected(null);
    setHint(null);
    setLegalMoves([]);

    // Track captured pieces
    if (result.captured) {
      if (turnBefore === "w") {
        setCapturedByWhite(prev => [...prev, result.captured!]);
      } else {
        setCapturedByBlack(prev => [...prev, result.captured!]);
      }
    }

    // Update move history using SAN notation
    setMoveHistory(prev => {
      const copy = [...prev];
      if (turnBefore === "w") {
        copy.push({ num: moveNumBefore, white: result.san });
      } else {
        if (copy.length > 0) {
          copy[copy.length - 1] = { ...copy[copy.length - 1], black: result.san };
        }
      }
      return copy;
    });

    // Increment
    if (increment > 0) {
      if (turnBefore === "w") setWhiteTime(t => t + increment);
      else setBlackTime(t => t + increment);
    }

    if (!gameStarted) setGameStarted(true);
    playPiecePlace();
    if (navigator.vibrate) navigator.vibrate(15);

    return result;
  }, [chess, gameStarted, increment]);

  // Computer AI move (black)
  useEffect(() => {
    if (chess.turn() !== "b" || gameOver || !timeSelected) return;
    const timer = setTimeout(() => {
      try {
        const move = getComputerMove(chess);
        if (move) {
          executeMove(move.from as Square, move.to as Square, move.promotion);
        }
      } catch (e) {
        console.error("AI error:", e);
        const fallbackMoves = chess.moves({ verbose: true });
        if (fallbackMoves.length > 0) {
          const fm = fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
          executeMove(fm.from as Square, fm.to as Square, fm.promotion);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [fen, gameOver, timeSelected]);

  const handleSquareClick = (r: number, c: number) => {
    if (gameOver || pendingPromotion) return;
    if (chess.turn() === "b") return;

    const sq = rcToSq(r, c);
    const board = chess.board();
    const cell = board[r][c];

    if (selected) {
      // Deselect
      if (selected === sq) {
        setSelected(null);
        setLegalMoves([]);
        playPieceDeselect();
        if (navigator.vibrate) navigator.vibrate(5);
        return;
      }

      // Select another own piece
      if (cell && cell.color === "w") {
        const moves = chess.moves({ square: sq, verbose: true });
        setSelected(sq);
        setLegalMoves(moves.map(m => m.to as Square));
        playPieceSelect();
        if (navigator.vibrate) navigator.vibrate(8);
        return;
      }

      // Check legal move
      const isLegal = legalMoves.includes(sq);
      if (!isLegal) return;

      // Promotion check
      const selectedCell = board[sqToRC(selected)[0]][sqToRC(selected)[1]];
      if (selectedCell && selectedCell.type === "p" && selectedCell.color === "w" && r === 0) {
        setPendingPromotion({ from: selected, to: sq });
        return;
      }

      executeMove(selected, sq);
    } else if (cell) {
      if (cell.color !== "w") return;
      const moves = chess.moves({ square: sq, verbose: true });
      setSelected(sq);
      setLegalMoves(moves.map(m => m.to as Square));
      playPieceSelect();
      if (navigator.vibrate) navigator.vibrate(8);
    }
  };

  const handlePromotion = (promoteTo: string) => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, promoteTo);
    setPendingPromotion(null);
  };

  const board = chess.board();

  const isSelectedSq = (r: number, c: number) => selected === rcToSq(r, c);
  const isLastMoveSq = (r: number, c: number) => {
    const sq = rcToSq(r, c);
    return lastMove?.from === sq || lastMove?.to === sq;
  };
  const isLegalTarget = (r: number, c: number) => legalMoves.includes(rcToSq(r, c));

  const getSquareColor = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 1;
    if (isSelectedSq(r, c)) return isDark ? SELECTED_DARK : SELECTED_LIGHT;
    if (isLastMoveSq(r, c)) return isDark ? LAST_MOVE_DARK : LAST_MOVE_LIGHT;
    return isDark ? DARK_SQ : LIGHT_SQ;
  };

  // King in check square
  const findKing = (color: "w" | "b"): [number, number] | null => {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell && cell.type === "k" && cell.color === color) return [r, c];
      }
    return null;
  };

  const whiteKingPos = findKing("w");
  const blackKingPos = findKing("b");

  const isKingInCheckSq = (r: number, c: number) => {
    if (whiteInCheck && whiteKingPos && whiteKingPos[0] === r && whiteKingPos[1] === c) return true;
    if (blackInCheck && blackKingPos && blackKingPos[0] === r && blackKingPos[1] === c) return true;
    return false;
  };

  return (
    <GameLayout title="Chess" sidebar={<MoveHistorySidebar moves={moveHistory} />} isSkillGame enableChat>
      <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4">
        {/* Black player (opponent, top) */}
        <PlayerBar
          name="Computer"
          isWhite={false}
          isTop
          time={blackTime}
          isActive={turn === "b"}
          inCheck={blackInCheck}
          capturedPieces={capturedByBlack}
          advantage={blackAdvantage > 0 ? blackAdvantage : 0}
        />

        <div
          className="w-full max-w-[min(95vw,95vh,600px)] aspect-square relative"
          style={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 8px 40px rgba(0,0,0,0.2)",
          }}
        >
          {!timeSelected && <TimeControlPicker onSelect={handleTimeSelect} />}
          {pendingPromotion && <PromotionDialog color={turn} onSelect={handlePromotion} />}
          {gameOver && <GameOverOverlay message={gameOver} onNewGame={handleNewGame} />}

          <div
            className={`grid grid-cols-8 w-full h-full ${!timeSelected ? "blur-sm" : ""}`}
            style={{ overflow: "hidden" }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const legal = isLegalTarget(r, c);
                const isCapture = legal && cell !== null;
                const checkSq = isKingInCheckSq(r, c);
                const sqColor = getSquareColor(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    className="aspect-square flex items-center justify-center relative cursor-pointer select-none"
                    style={{
                      backgroundColor: sqColor,
                      ...(checkSq
                        ? {
                            background: `radial-gradient(ellipse at center, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0.3) 40%, ${sqColor} 70%)`,
                          }
                        : {}),
                    }}
                    onClick={() => handleSquareClick(r, c)}
                  >
                    {/* Rank labels on left edge */}
                    {c === 0 && (
                      <span
                        className="absolute top-[2px] left-[3px] text-[10px] sm:text-[11px] font-bold leading-none select-none pointer-events-none"
                        style={{ color: isDark ? LIGHT_LABEL : DARK_LABEL }}
                      >
                        {rankLabels[r]}
                      </span>
                    )}
                    {/* File labels on bottom edge */}
                    {r === 7 && (
                      <span
                        className="absolute bottom-[2px] right-[3px] text-[10px] sm:text-[11px] font-bold leading-none select-none pointer-events-none"
                        style={{ color: isDark ? LIGHT_LABEL : DARK_LABEL }}
                      >
                        {fileLabels[c]}
                      </span>
                    )}

                    {/* Chess piece */}
                    <AnimatePresence mode="popLayout">
                      {cell && (
                        <motion.img
                          key={`${cell.color}${cell.type}-${r}-${c}`}
                          src={PIECE_IMAGES[pieceImgKey(cell.color, cell.type)]}
                          alt={`${cell.color}${cell.type}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className="select-none pointer-events-none"
                          style={{
                            width: "80%",
                            height: "80%",
                            filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.3))",
                          }}
                          draggable={false}
                        />
                      )}
                    </AnimatePresence>

                    {/* Legal move: small grey dot (empty square) */}
                    {legal && !cell && (
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: "28%",
                          height: "28%",
                          backgroundColor: "rgba(0,0,0,0.15)",
                        }}
                      />
                    )}

                    {/* Legal capture: grey ring around square */}
                    {isCapture && (
                      <div
                        className="absolute rounded-full"
                        style={{
                          width: "85%",
                          height: "85%",
                          border: "5px solid rgba(0,0,0,0.15)",
                          boxSizing: "border-box",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* White player (you, bottom) */}
        <PlayerBar
          name="You"
          isWhite
          isTop={false}
          time={whiteTime}
          isActive={turn === "w"}
          inCheck={whiteInCheck}
          capturedPieces={capturedByWhite}
          advantage={whiteAdvantage > 0 ? whiteAdvantage : 0}
        />

        {/* Hint display */}
        {hint && (
          <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: "#2d6ea3", color: "#fff" }}>
            <div className="font-semibold mb-0.5">Hint</div>
            <div>{hint.reason}</div>
            <button onClick={() => setHint(null)} className="mt-1 text-[10px] opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {timeSelected && !gameOver && (
            <button
              onClick={() => setGameOver("You resigned. Computer wins!")}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
              style={{ backgroundColor: "#b33430", color: "#fff" }}
            >
              Resign
            </button>
          )}
          {timeSelected && !gameOver && chess.turn() === "w" && (
            <button
              onClick={() => {
                if (hintThinking) return;
                setHintThinking(true);
                setHint(null);
                setTimeout(() => {
                  const h = getHintMove(chess);
                  if (h) {
                    const fromSq = h.move.from as Square;
                    const toSq = h.move.to as Square;
                    setHint({ from: fromSq, to: toSq, reason: h.reason });
                    setSelected(fromSq);
                    const moves = chess.moves({ square: fromSq, verbose: true });
                    setLegalMoves(moves.map(m => m.to as Square));
                  }
                  setHintThinking(false);
                }, 50);
              }}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
              style={{ backgroundColor: "#2d6ea3", color: "#fff" }}
            >
              {hintThinking ? "Thinking..." : "Hint"}
            </button>
          )}
          <button
            onClick={() => setHelpMode(!helpMode)}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
            style={{ backgroundColor: helpMode ? "#e6912e" : "#555", color: "#fff" }}
          >
            {helpMode ? "Help ON" : "Help"}
          </button>
          <button
            onClick={handleNewGame}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
            style={{ backgroundColor: "#81b64c", color: "#fff" }}
          >
            New Game
          </button>
        </div>

        {/* Help mode info */}
        {helpMode && (
          <div className="mt-2 p-3 rounded-lg text-[11px] leading-relaxed" style={{ backgroundColor: "rgba(230,145,46,0.1)", border: "1px solid rgba(230,145,46,0.3)", color: "#e6912e" }}>
            <div className="font-bold mb-1">Help Mode Active</div>
            <div className="space-y-1 text-foreground/70">
              <p>Click any piece to see where it can move (green dots)</p>
              <p>Circles = empty squares you can move to</p>
              <p>Rings = opponent pieces you can capture</p>
              <p>Click "Hint" to see the best move the AI recommends</p>
              <p>Yellow squares = the last move played</p>
              <p>Red glow = your king is in check -- you MUST protect it</p>
              <p>The AI evaluates thousands of positions to find the best move</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default ChessGame;
