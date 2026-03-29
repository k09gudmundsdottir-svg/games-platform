import { useState, useEffect, useRef, useCallback } from "react";
import GameLayout from "@/components/GameLayout";
import { playPiecePlace, playPieceSelect, playPieceDeselect } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import {
  createInitialState, getLegalMoves, makeMove, isInCheck, isCheckmate, isStalemate,
  type GameState, type Pos,
} from "@/lib/chessEngine";

/* ─── Piece SVG URLs (Cburnett set from Wikimedia Commons) ─── */
const PIECE_IMAGES: Record<string, string> = {
  K: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  Q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  R: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  B: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  N: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  P: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
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
const PIECE_VALUES: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 };

/* ─── Sub-components ─── */

const ChessClock = ({ seconds, isActive, isLow }: { seconds: number; isActive: boolean; isLow: boolean }) => (
  <div
    className="px-3 py-1 rounded font-mono text-base font-bold tracking-wider transition-colors"
    style={{
      backgroundColor: isActive
        ? isLow ? "#b33430" : "#4a7a2e"
        : "#3a3a3a",
      color: isActive
        ? "#ffffff"
        : "#aaaaaa",
    }}
  >
    {formatTime(seconds)}
  </div>
);

const CapturedPieces = ({
  pieces,
  advantage,
}: {
  pieces: string[];
  advantage: number;
}) => {
  const sorted = [...pieces].sort((a, b) => (PIECE_ORDER[a.toLowerCase()] ?? 9) - (PIECE_ORDER[b.toLowerCase()] ?? 9));
  return (
    <div className="flex items-center gap-0 h-5 min-h-[20px]">
      {sorted.map((p, i) => (
        <img
          key={`${p}-${i}`}
          src={PIECE_IMAGES[p]}
          alt={p}
          className="h-4 w-4 -mr-0.5"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}
        />
      ))}
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
          src={isWhite ? PIECE_IMAGES.K : PIECE_IMAGES.k}
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

const PromotionDialog = ({ color, onSelect }: { color: "white" | "black"; onSelect: (piece: string) => void }) => {
  const pieces = color === "white" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
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
              <img src={PIECE_IMAGES[p]} alt={p} className="w-10 h-10 sm:w-12 sm:h-12" />
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

/* ─── AI opponent (simple random legal move) ─── */
// ── Strong Chess AI (depth 5 + quiescence + full evaluation) ────
const PIECE_VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,10,10,10,10,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};

const getPST = (piece: string, r: number, c: number): number => {
  const p = piece.toLowerCase();
  const isWhite = piece === piece.toUpperCase();
  const idx = isWhite ? (7 - r) * 8 + c : r * 8 + c;
  return PST[p]?.[idx] || 0;
};

const evaluateBoard = (state: GameState): number => {
  let score = 0;
  let whiteBishops = 0, blackBishops = 0;
  let whiteMobility = 0, blackMobility = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const val = PIECE_VAL[p.toLowerCase()] || 0;
      const pst = getPST(p, r, c);
      const isWhite = p === p.toUpperCase();

      if (isWhite) {
        score += val + pst;
        if (p === "B") whiteBishops++;
        whiteMobility += getLegalMoves(state, [r, c]).length;
      } else {
        score -= val + pst;
        if (p === "b") blackBishops++;
        blackMobility += getLegalMoves(state, [r, c]).length;
      }

      // Pawn structure
      if (p.toLowerCase() === "p") {
        // Doubled pawns penalty
        for (let rr = r + 1; rr < 8; rr++) {
          const pp = state.board[rr][c];
          if (pp && pp.toLowerCase() === "p" && (pp === pp.toUpperCase()) === isWhite) {
            if (isWhite) score -= 15; else score += 15;
          }
        }
        // Passed pawn bonus
        const dir = isWhite ? -1 : 1;
        let passed = true;
        for (let rr = r + dir; rr >= 0 && rr < 8; rr += dir) {
          for (let cc = Math.max(0, c - 1); cc <= Math.min(7, c + 1); cc++) {
            const pp = state.board[rr][cc];
            if (pp && pp.toLowerCase() === "p" && (pp === pp.toUpperCase()) !== isWhite) {
              passed = false; break;
            }
          }
          if (!passed) break;
        }
        if (passed) {
          const advancement = isWhite ? (7 - r) : r;
          const bonus = advancement * advancement * 3;
          if (isWhite) score += bonus; else score -= bonus;
        }
      }

      // Rook on open file
      if (p.toLowerCase() === "r") {
        let openFile = true;
        for (let rr = 0; rr < 8; rr++) {
          if (state.board[rr][c]?.toLowerCase() === "p") { openFile = false; break; }
        }
        if (openFile) { if (isWhite) score += 20; else score -= 20; }
      }
    }
  }

  // Bishop pair bonus
  if (whiteBishops >= 2) score += 30;
  if (blackBishops >= 2) score -= 30;

  // Mobility bonus (0.5 per legal move)
  score += (whiteMobility - blackMobility) * 0.5;

  // Check bonus
  if (isInCheck(state, "black")) score += 20;
  if (isInCheck(state, "white")) score -= 20;

  return score;
};

const getAllMoves = (state: GameState): { from: Pos; to: Pos }[] => {
  const moves: { from: Pos; to: Pos }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p) continue;
      const isOwn = state.turn === "white" ? p === p.toUpperCase() : p === p.toLowerCase();
      if (!isOwn) continue;
      for (const to of getLegalMoves(state, [r, c])) moves.push({ from: [r, c], to });
    }
  }
  return moves;
};

// Move ordering for better pruning
const orderMoves = (moves: { from: Pos; to: Pos }[], state: GameState): { from: Pos; to: Pos }[] => {
  return moves.sort((a, b) => {
    let sa = 0, sb = 0;
    const capA = state.board[a.to[0]][a.to[1]];
    const capB = state.board[b.to[0]][b.to[1]];
    // MVV-LVA: most valuable victim, least valuable attacker
    if (capA) sa += (PIECE_VAL[capA.toLowerCase()] || 0) * 10 - (PIECE_VAL[state.board[a.from[0]][a.from[1]]?.toLowerCase()] || 0);
    if (capB) sb += (PIECE_VAL[capB.toLowerCase()] || 0) * 10 - (PIECE_VAL[state.board[b.from[0]][b.from[1]]?.toLowerCase()] || 0);
    // Center moves
    sa += (7 - Math.abs(3.5 - a.to[0]) - Math.abs(3.5 - a.to[1])) * 2;
    sb += (7 - Math.abs(3.5 - b.to[0]) - Math.abs(3.5 - b.to[1])) * 2;
    return sb - sa;
  });
};

let nodeCount = 0;
const MAX_NODES = 15000; // Keep moves instant

const quiesce = (state: GameState, alpha: number, beta: number, maximizing: boolean, depth: number): number => {
  nodeCount++;
  if (nodeCount > MAX_NODES) return evaluateBoard(state);
  const standPat = evaluateBoard(state);
  if (depth <= 0) return standPat;

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  const moves = getAllMoves(state).filter(m => state.board[m.to[0]][m.to[1]] !== "");
  for (const move of orderMoves(moves, state)) {
    const newState = makeMove(state, move.from, move.to);
    const score = quiesce(newState, alpha, beta, !maximizing, depth - 1);
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

const minimax = (state: GameState, depth: number, alpha: number, beta: number, maximizing: boolean): number => {
  nodeCount++;
  if (nodeCount > MAX_NODES) return evaluateBoard(state);
  if (depth === 0) return quiesce(state, alpha, beta, maximizing, 1);

  const moves = orderMoves(getAllMoves(state), state);
  if (moves.length === 0) {
    if (isInCheck(state, state.turn)) return maximizing ? -99999 + (5 - depth) : 99999 - (5 - depth);
    return 0;
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const ev = minimax(makeMove(state, move.from, move.to), depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const ev = minimax(makeMove(state, move.from, move.to), depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getComputerMove = (state: GameState): { from: Pos; to: Pos } | null => {
  const moves = orderMoves(getAllMoves(state), state);
  if (moves.length === 0) return null;

  nodeCount = 0;
  let bestMove = moves[0];
  let bestScore = Infinity;
  for (const move of moves) {
    const score = minimax(makeMove(state, move.from, move.to), 2, -Infinity, Infinity, true);
    if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
};

const getHintMove = (state: GameState): { from: Pos; to: Pos; reason: string } | null => {
  const moves = orderMoves(getAllMoves(state), state);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = minimax(makeMove(state, move.from, move.to), 3, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  // Generate reason
  const target = state.board[bestMove.to[0]][bestMove.to[1]];
  const piece = state.board[bestMove.from[0]][bestMove.from[1]];
  const pieceName = (p: string) => ({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[p.toLowerCase()] || p);
  const files = "abcdefgh";
  const fromSq = `${files[bestMove.from[1]]}${8 - bestMove.from[0]}`;
  const toSq = `${files[bestMove.to[1]]}${8 - bestMove.to[0]}`;

  let reason = `Move ${pieceName(piece || "")} from ${fromSq} to ${toSq}`;
  if (target) reason += ` — captures ${pieceName(target)}!`;
  else if (bestScore > 500) reason += " — strong positional advantage";
  else if (bestScore > 100) reason += " — improves your position";
  else reason += " — best available move";

  // Check if the move gives check
  const newState = makeMove(state, bestMove.from, bestMove.to);
  if (isInCheck(newState, "black")) reason += " (gives check!)";

  return { ...bestMove, reason };
};

/* ─── Main component ─── */
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
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]); // pieces white has captured (black pieces)
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]); // pieces black has captured (white pieces)
  const [helpMode, setHelpMode] = useState(false);
  const [hint, setHint] = useState<{ from: Pos; to: Pos } | null>(null);
  const [hintThinking, setHintThinking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const whiteInCheck = isInCheck(gameState.board, "white");
  const blackInCheck = isInCheck(gameState.board, "black");

  // Material advantage
  const whiteMaterial = capturedByWhite.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 0), 0);
  const blackMaterial = capturedByBlack.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 0), 0);
  const whiteAdvantage = whiteMaterial - blackMaterial;
  const blackAdvantage = blackMaterial - whiteMaterial;

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
    setCapturedByWhite([]);
    setCapturedByBlack([]);
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

  // Check for checkmate/stalemate
  useEffect(() => {
    if (gameOver) return;
    if (isCheckmate(gameState)) {
      setGameOver(gameState.turn === "white" ? "Black wins by checkmate!" : "White wins by checkmate!");
    } else if (isStalemate(gameState)) {
      setGameOver("Draw by stalemate!");
    }
  }, [gameState, gameOver]);

  const executeMove = useCallback((from: Pos, to: Pos, promoteTo?: string) => {
    const result = makeMove(gameState, from, to, promoteTo);
    setGameState(result.newState);
    setLastMove({ from, to });
    setSelected(null);
    setHint(null);
    setLegalMoves([]);

    // Track captured pieces
    if (result.captured) {
      if (gameState.turn === "white") {
        setCapturedByWhite(prev => [...prev, result.captured]);
      } else {
        setCapturedByBlack(prev => [...prev, result.captured]);
      }
    }

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

    return result.newState;
  }, [gameState, gameStarted, increment]);

  // Computer AI move (black)
  useEffect(() => {
    if (gameState.turn !== "black" || gameOver || !timeSelected) return;
    const timer = setTimeout(() => {
      try {
        nodeCount = 0;
        const move = getComputerMove(gameState);
        if (move) {
          const piece = gameState.board[move.from[0]][move.from[1]];
          const promoRow = 7;
          if (piece === "p" && move.to[0] === promoRow) {
            executeMove(move.from, move.to, "q");
          } else {
            executeMove(move.from, move.to);
          }
      }
      } catch (e) {
        console.error("AI error:", e);
        // Fallback: pick any random legal move
        const fallbackMoves = getAllMoves(gameState);
        if (fallbackMoves.length > 0) {
          const fm = fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
          executeMove(fm.from, fm.to);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [gameState.turn, gameOver, timeSelected]);

  const handleSquareClick = (r: number, c: number) => {
    if (gameOver || pendingPromotion) return;
    if (gameState.turn === "black") return; // Player is white only

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

      // Select another own piece
      if (piece && piece === piece.toUpperCase()) {
        const moves = getLegalMoves(gameState, [r, c]);
        setSelected([r, c]);
        setLegalMoves(moves);
        playPieceSelect();
        if (navigator.vibrate) navigator.vibrate(8);
        return;
      }

      // Check legal move
      const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
      if (!isLegal) return;

      // Promotion check
      const movingPiece = gameState.board[sr][sc];
      if (movingPiece === "P" && r === 0) {
        setPendingPromotion({ from: [sr, sc], to: [r, c] });
        return;
      }

      executeMove([sr, sc], [r, c]);
    } else if (piece) {
      // Only select white pieces (player is white)
      if (piece !== piece.toUpperCase()) return;
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

  const getSquareColor = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 1;
    if (isSelectedSq(r, c)) return isDark ? SELECTED_DARK : SELECTED_LIGHT;
    if (isLastMoveSq(r, c)) return isDark ? LAST_MOVE_DARK : LAST_MOVE_LIGHT;
    return isDark ? DARK_SQ : LIGHT_SQ;
  };

  // King in check square
  const whiteKingPos = (() => {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (gameState.board[r][c] === "K") return [r, c];
    return null;
  })();

  const blackKingPos = (() => {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (gameState.board[r][c] === "k") return [r, c];
    return null;
  })();

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
          isActive={gameState.turn === "black"}
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
          {pendingPromotion && <PromotionDialog color={gameState.turn} onSelect={handlePromotion} />}
          {gameOver && <GameOverOverlay message={gameOver} onNewGame={handleNewGame} />}

          <div
            className={`grid grid-cols-8 w-full h-full ${!timeSelected ? "blur-sm" : ""}`}
            style={{ overflow: "hidden" }}
          >
            {gameState.board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const legal = isLegalTarget(r, c);
                const isCapture = legal && piece !== "";
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
                      {piece && (
                        <motion.img
                          key={`${piece}-${r}-${c}`}
                          src={PIECE_IMAGES[piece]}
                          alt={piece}
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
                    {legal && !piece && (
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
          isActive={gameState.turn === "white"}
          inCheck={whiteInCheck}
          capturedPieces={capturedByWhite}
          advantage={whiteAdvantage > 0 ? whiteAdvantage : 0}
        />

        {/* Hint display */}
        {hint && (
          <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: "#2d6ea3", color: "#fff" }}>
            <div className="font-semibold mb-0.5">💡 Hint</div>
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
          {timeSelected && !gameOver && gameState.turn === "white" && (
            <button
              onClick={() => {
                if (hintThinking) return;
                setHintThinking(true);
                setHint(null);
                setTimeout(() => {
                  const h = getHintMove(gameState);
                  if (h) {
                    setHint(h);
                    setSelected(h.from);
                    setLegalMoves(getLegalMoves(gameState, h.from));
                  }
                  setHintThinking(false);
                }, 50);
              }}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
              style={{ backgroundColor: "#2d6ea3", color: "#fff" }}
            >
              {hintThinking ? "Thinking..." : "💡 Hint"}
            </button>
          )}
          <button
            onClick={() => setHelpMode(!helpMode)}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-colors touch-manipulation"
            style={{ backgroundColor: helpMode ? "#e6912e" : "#555", color: "#fff" }}
          >
            {helpMode ? "📖 Help ON" : "📖 Help"}
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
            <div className="font-bold mb-1">📖 Help Mode Active</div>
            <div className="space-y-1 text-foreground/70">
              <p>• Click any piece to see where it can move (green dots)</p>
              <p>• Circles = empty squares you can move to</p>
              <p>• Rings = opponent pieces you can capture</p>
              <p>• Click "💡 Hint" to see the best move the AI recommends</p>
              <p>• Yellow squares = the last move played</p>
              <p>• Red glow = your king is in check — you MUST protect it</p>
              <p>• The AI evaluates thousands of positions to find the best move</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default ChessGame;
