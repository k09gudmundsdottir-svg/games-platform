import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { playDiceRoll, playPiecePlace } from "@/lib/sounds";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// Haptic feedback for mobile
const haptic = (style: "light" | "medium" | "heavy" = "light") => {
  if (navigator.vibrate) {
    navigator.vibrate(style === "light" ? 10 : style === "medium" ? 25 : 50);
  }
};

const INITIAL_BOARD: number[] = (() => {
  const b = new Array(24).fill(0);
  b[0] = 2; b[11] = 5; b[16] = 3; b[18] = 5;
  b[23] = -2; b[12] = -5; b[7] = -3; b[5] = -5;
  return b;
})();

type GameState = "rolling" | "moving" | "computer" | "gameover";

const BackgammonGame = () => {
  const [board, setBoard] = useState<number[]>([...INITIAL_BOARD]);
  const [dice, setDice] = useState<number[]>([]);
  const [movesLeft, setMovesLeft] = useState<number[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>("rolling");
  const [playerBar, setPlayerBar] = useState(0);
  const [computerBar, setComputerBar] = useState(0);
  const [playerOff, setPlayerOff] = useState(0);
  const [computerOff, setComputerOff] = useState(0);
  const [message, setMessage] = useState("Roll to begin");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [flyingPiece, setFlyingPiece] = useState<{ fromX: number; fromY: number; toX: number; toY: number; isPlayer: boolean } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const pipCount = useMemo(() => {
    let player = 0, computer = 0;
    board.forEach((v, i) => {
      if (v > 0) player += v * (24 - i);
      if (v < 0) computer += Math.abs(v) * (i + 1);
    });
    player += playerBar * 25;
    computer += computerBar * 25;
    return { player, computer };
  }, [board, playerBar, computerBar]);

  const canBearOff = useCallback(() => {
    if (playerBar > 0) return false;
    for (let i = 0; i < 18; i++) { if (board[i] > 0) return false; }
    return true;
  }, [board, playerBar]);

  const getValidMoves = useCallback((from: number, moves: number[]): number[] => {
    const validTargets: number[] = [];
    const uniqueMoves = [...new Set(moves)];
    for (const die of uniqueMoves) {
      if (from === -1) {
        const target = die - 1;
        if (board[target] >= -1) validTargets.push(target);
        continue;
      }
      const target = from + die;
      if (target >= 24 && canBearOff()) {
        if (target === 24) { validTargets.push(24); }
        else {
          let hasHigher = false;
          for (let i = from + 1; i < 24; i++) { if (board[i] > 0) { hasHigher = true; break; } }
          if (!hasHigher && from >= 18) validTargets.push(24);
        }
        continue;
      }
      if (target < 24 && board[target] >= -1) validTargets.push(target);
    }
    return [...new Set(validTargets)];
  }, [board, canBearOff]);

  const hasValidMoves = useCallback((moves: number[]): boolean => {
    if (playerBar > 0) return getValidMoves(-1, moves).length > 0;
    for (let i = 0; i < 24; i++) {
      if (board[i] > 0 && getValidMoves(i, moves).length > 0) return true;
    }
    return false;
  }, [board, playerBar, getValidMoves]);

  const getValidMovesForBoard = (b: number[], from: number, moves: number[]): number[] => {
    const targets: number[] = [];
    for (const die of [...new Set(moves)]) {
      const target = from + die;
      if (target >= 24) {
        let allHome = true;
        for (let i = 0; i < 18; i++) { if (b[i] > 0) { allHome = false; break; } }
        if (allHome && playerBar === 0) {
          if (target === 24) targets.push(24);
          else { let h = false; for (let i = from + 1; i < 24; i++) { if (b[i] > 0) { h = true; break; } } if (!h) targets.push(24); }
        }
      } else if (b[target] >= -1) targets.push(target);
    }
    return [...new Set(targets)];
  };

  const removeDie = (dieUsed: number): number[] => {
    const idx = movesLeft.indexOf(dieUsed);
    if (idx === -1) return movesLeft;
    const copy = [...movesLeft];
    copy.splice(idx, 1);
    return copy;
  };

  const checkTurnEnd = (remaining: number[], currentBoard: number[]) => {
    let playerPieces = 0;
    currentBoard.forEach(v => { if (v > 0) playerPieces += v; });
    if (playerPieces === 0 && playerBar === 0) {
      setGameState("gameover");
      setMessage("You win!");
      return;
    }
    if (remaining.length === 0) { setTimeout(() => computerTurn(), 800); return; }
    let canMove = false;
    if (playerBar > 0) { canMove = getValidMoves(-1, remaining).length > 0; }
    else { for (let i = 0; i < 24; i++) { if (currentBoard[i] > 0 && getValidMovesForBoard(currentBoard, i, remaining).length > 0) { canMove = true; break; } } }
    if (!canMove) { setMessage("No valid moves"); setTimeout(() => computerTurn(), 800); }
  };

  const rollDice = () => {
    haptic("medium");
    playDiceRoll();
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    setDice([d1, d2]);
    const newMoves = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    setMovesLeft(newMoves);
    if (hasValidMoves(newMoves)) {
      setGameState("moving");
      setMessage(`Rolled ${d1} & ${d2}`);
    } else {
      setMessage(`Rolled ${d1} & ${d2} — no moves`);
      setTimeout(() => computerTurn(), 1000);
    }
  };

  const getPointPosition = (pointIndex: number): { x: number; y: number } | null => {
    const el = pointRefs.current[pointIndex];
    const boardEl = boardRef.current;
    if (!el || !boardEl) return null;
    const boardRect = boardEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      x: elRect.left + elRect.width / 2 - boardRect.left,
      y: elRect.top + elRect.height / 2 - boardRect.top,
    };
  };

  const makeMove = (from: number, to: number, dieUsed: number) => {
    // Calculate flying animation positions
    const fromPos = from === -1 ? null : getPointPosition(from);
    const toPos = to === 24 ? null : getPointPosition(to);

    const isPlayer = true;

    if (fromPos && toPos) {
      // Animate the piece flying
      setFlyingPiece({ fromX: fromPos.x, fromY: fromPos.y, toX: toPos.x, toY: toPos.y, isPlayer });
      setTimeout(() => setFlyingPiece(null), 400);
    }

    const newBoard = [...board];
    // Delay the actual board update slightly so flying piece is visible
    const applyMove = () => {
      haptic("medium");
      playPiecePlace();
      if (from === -1) setPlayerBar(prev => prev - 1);
      else newBoard[from]--;
      if (to === 24) {
        setPlayerOff(prev => prev + 1);
        setMoveHistory(prev => [...prev.slice(-5), `${from + 1} → off`]);
        setBoard(newBoard);
        const remaining = removeDie(dieUsed);
        setMovesLeft(remaining);
        checkTurnEnd(remaining, newBoard);
        return;
      }
      if (newBoard[to] === -1) { newBoard[to] = 0; setComputerBar(prev => prev + 1); }
      newBoard[to]++;
      setMoveHistory(prev => [...prev.slice(-5), from === -1 ? `bar → ${to + 1}` : `${from + 1} → ${to + 1}`]);
      setBoard(newBoard);
      const remaining = removeDie(dieUsed);
      setMovesLeft(remaining);
      checkTurnEnd(remaining, newBoard);
    };

    if (fromPos && toPos) {
      setTimeout(() => applyMove(), 350);
    } else {
      applyMove();
    }
  };

  const handlePointClick = (pointIndex: number) => {
    haptic("light");
    if (gameState !== "moving") return;
    if (playerBar > 0) {
      const targets = getValidMoves(-1, movesLeft);
      if (targets.includes(pointIndex)) {
        makeMove(-1, pointIndex, pointIndex + 1);
      }
      return;
    }
    if (selectedPoint === null) {
      if (board[pointIndex] > 0 && getValidMoves(pointIndex, movesLeft).length > 0) {
        setSelectedPoint(pointIndex);
      }
    } else if (selectedPoint === pointIndex) {
      setSelectedPoint(null);
    } else {
      const targets = getValidMoves(selectedPoint, movesLeft);
      if (targets.includes(pointIndex)) {
        makeMove(selectedPoint, pointIndex, pointIndex - selectedPoint);
        setSelectedPoint(null);
      } else if (board[pointIndex] > 0 && getValidMoves(pointIndex, movesLeft).length > 0) {
        setSelectedPoint(pointIndex);
      } else {
        setSelectedPoint(null);
      }
    }
  };

  const handleBearOff = () => {
    if (selectedPoint === null) return;
    const targets = getValidMoves(selectedPoint, movesLeft);
    if (targets.includes(24)) {
      const dieNeeded = 24 - selectedPoint;
      const actualDie = movesLeft.find(d => d >= dieNeeded);
      if (actualDie) makeMove(selectedPoint, 24, actualDie);
      setSelectedPoint(null);
    }
  };

  const computerTurn = () => {
    setGameState("computer");
    setMessage("Opponent's turn...");
    const runComputer = async () => {
      await new Promise(r => setTimeout(r, 800));
      const cd1 = Math.ceil(Math.random() * 6);
      const cd2 = Math.ceil(Math.random() * 6);
      const cMoves = cd1 === cd2 ? [cd1, cd1, cd1, cd1] : [cd1, cd2];
      setDice([cd1, cd2]);
      setMessage(`Opponent rolled ${cd1} and ${cd2}${cd1 === cd2 ? " — doubles!" : ""}`);

      // Pause to let player see the dice
      await new Promise(r => setTimeout(r, 1200));

      let currentBoard = [...board];
      let curBar = computerBar;
      let curOff = computerOff;

      // Plan all moves first
      const planned: { from: number; to: number; isOff?: boolean }[] = [];
      for (const die of cMoves) {
        if (curBar > 0) {
          const target = 24 - die;
          if (currentBoard[target] <= 1) {
            if (currentBoard[target] === 1) { currentBoard[target] = 0; }
            currentBoard[target]--;
            curBar--;
            planned.push({ from: -1, to: target });
            continue;
          }
          continue;
        }
        let allHome = true;
        for (let i = 6; i < 24; i++) { if (currentBoard[i] < 0) { allHome = false; break; } }
        let moved = false;
        for (let i = 23; i >= 0; i--) {
          if (currentBoard[i] >= 0 || moved) continue;
          const target = i - die;
          if (target < 0) {
            if (allHome && curBar === 0) {
              if (target === -1 || (() => { for (let j = i + 1; j < 24; j++) { if (currentBoard[j] < 0) return false; } return true; })()) {
                currentBoard[i]++; curOff++;
                planned.push({ from: i, to: -1, isOff: true });
                moved = true;
              }
            }
            continue;
          }
          if (currentBoard[target] <= 1) {
            if (currentBoard[target] === 1) { currentBoard[target] = 0; }
            currentBoard[i]++; currentBoard[target]--;
            planned.push({ from: i, to: target });
            moved = true;
          }
        }
      }

      // Now replay the moves one by one with animation
      let replayBoard = [...board];
      let replayBar = computerBar;
      let replayOff = computerOff;

      for (const move of planned) {
        // Show flying piece animation
        const fromEl = move.from === -1 ? document.querySelector('[data-bar="computer"]') : document.querySelector(`[data-point="${move.from}"]`);
        const toEl = move.isOff ? document.querySelector('[data-off="computer"]') : document.querySelector(`[data-point="${move.to}"]`);
        if (fromEl && toEl) {
          const fr = fromEl.getBoundingClientRect();
          const tr = toEl.getBoundingClientRect();
          setFlyingPiece({ fromX: fr.left + fr.width / 2, fromY: fr.top + fr.height / 2, toX: tr.left + tr.width / 2, toY: tr.top + tr.height / 2, isPlayer: false });
        }

        await new Promise(r => setTimeout(r, 600));
        setFlyingPiece(null);
        playPiecePlace();

        // Apply this single move to replay board
        if (move.from === -1) {
          replayBar--;
          replayBoard[move.to]--;
          setComputerBar(replayBar);
        } else if (move.isOff) {
          replayBoard[move.from]++;
          replayOff++;
          setComputerOff(replayOff);
        } else {
          if (replayBoard[move.to] === 1) { replayBoard[move.to] = 0; setPlayerBar(prev => prev + 1); }
          replayBoard[move.from]++;
          replayBoard[move.to]--;
        }
        setBoard([...replayBoard]);
        setMoveHistory(prev => [...prev.slice(-5), move.from === -1 ? `bar → ${move.to + 1}` : move.isOff ? `${move.from + 1} → off` : `${move.from + 1} → ${move.to + 1}`]);

        await new Promise(r => setTimeout(r, 400));
      }

      // Check win
      let compPieces = 0;
      replayBoard.forEach(v => { if (v < 0) compPieces += Math.abs(v); });
      if (compPieces === 0 && replayBar === 0) {
        setGameState("gameover");
        setMessage("Opponent wins");
        return;
      }

      await new Promise(r => setTimeout(r, 500));
      setGameState("rolling");
      setMessage("Your turn — roll");
    };
    runComputer();
  };

  const resetGame = () => {
    setBoard([...INITIAL_BOARD]); setDice([]); setMovesLeft([]); setSelectedPoint(null);
    setGameState("rolling"); setPlayerBar(0); setComputerBar(0); setPlayerOff(0);
    setComputerOff(0); setMessage("Roll to begin"); setMoveHistory([]);
  };

  const validTargets = useMemo(() => {
    if (gameState !== "moving" || selectedPoint === null) return new Set<number>();
    return new Set(getValidMoves(selectedPoint, movesLeft));
  }, [gameState, selectedPoint, movesLeft, getValidMoves]);

  const selectablePoints = useMemo(() => {
    if (gameState !== "moving") return new Set<number>();
    if (playerBar > 0) return new Set<number>();
    const pts = new Set<number>();
    for (let i = 0; i < 24; i++) {
      if (board[i] > 0 && getValidMoves(i, movesLeft).length > 0) pts.add(i);
    }
    return pts;
  }, [gameState, board, movesLeft, playerBar, getValidMoves]);

  const DiceIcon1 = dice.length ? diceIcons[dice[0] - 1] : null;
  const DiceIcon2 = dice.length ? diceIcons[dice[1] - 1] : null;

  // Board layout: top = points 13→24 (left to right), bottom = points 12→1 (left to right)
  const topLeft = [12, 13, 14, 15, 16, 17];
  const topRight = [18, 19, 20, 21, 22, 23];
  const bottomLeft = [11, 10, 9, 8, 7, 6];
  const bottomRight = [5, 4, 3, 2, 1, 0];

  const Checker = ({ isPlayer, isSelected, isSelectable, small }: { isPlayer: boolean; isSelected?: boolean; isSelectable?: boolean; small?: boolean }) => {
    const size = small ? "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" : "w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11";
    return (
      <div className={`${size} rounded-full relative flex-shrink-0 transition-all duration-200 ${
        isSelected ? "scale-110 z-20" : ""
      } ${isSelectable ? "cursor-pointer" : ""}`}
      >
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full ${
          isPlayer
            ? "bg-gradient-to-b from-[hsl(38,90%,62%)] to-[hsl(32,85%,40%)]"
            : "bg-gradient-to-b from-[hsl(0,0%,82%)] to-[hsl(0,0%,52%)]"
        } ${isSelected ? "shadow-[0_0_16px_4px_hsl(38,90%,55%/0.6)]" : ""}`} />
        {/* Inner disc with subtle concentric ring */}
        <div className={`absolute inset-[3px] rounded-full ${
          isPlayer
            ? "bg-gradient-to-br from-[hsl(40,95%,65%)] via-[hsl(38,90%,55%)] to-[hsl(30,80%,42%)]"
            : "bg-gradient-to-br from-[hsl(0,0%,88%)] via-[hsl(0,0%,75%)] to-[hsl(0,0%,58%)]"
        }`} />
        {/* Glossy highlight */}
        <div className={`absolute inset-[5px] rounded-full ${
          isPlayer
            ? "bg-gradient-to-b from-[hsl(42,100%,78%/0.5)] to-transparent"
            : "bg-gradient-to-b from-[hsl(0,0%,95%/0.5)] to-transparent"
        }`} style={{ height: "40%" }} />
      </div>
    );
  };

  const renderPoint = (index: number, isTop: boolean) => {
    const count = board[index];
    const absCount = Math.abs(count);
    const isPlayer = count > 0;
    const isSelected = selectedPoint === index;
    const isTarget = validTargets.has(index);
    const isSelectable = selectablePoints.has(index) && selectedPoint === null;
    const maxShow = Math.min(absCount, 5);
    const overflow = absCount > 5 ? absCount : 0;
    const isEven = index % 2 === 0;

    return (
      <motion.div
        key={index}
        ref={(el: HTMLDivElement | null) => { pointRefs.current[index] = el; }}
        className={`flex-1 flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center relative cursor-pointer min-w-[28px] touch-manipulation`}
        onClick={() => handlePointClick(index)}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        {/* Triangle */}
        <svg viewBox="0 0 48 120" className="w-full h-[90px] sm:h-[120px] md:h-[160px] lg:h-[200px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`tri-${index}`} x1="0" y1={isTop ? "0" : "1"} x2="0" y2={isTop ? "1" : "0"}>
              <stop offset="0%" stopColor={isEven ? "hsl(38, 55%, 38%)" : "hsl(25, 25%, 22%)"} />
              <stop offset="100%" stopColor={isEven ? "hsl(38, 45%, 28%)" : "hsl(25, 18%, 15%)"} />
            </linearGradient>
          </defs>
          <polygon
            points={isTop ? "2,0 46,0 24,116" : "2,120 46,120 24,4"}
            fill={`url(#tri-${index})`}
            stroke={isTarget ? "hsl(38, 90%, 55%)" : isEven ? "hsl(38, 40%, 30%)" : "hsl(25, 15%, 18%)"}
            strokeWidth={isTarget ? "2" : "0.5"}
          />
          {isTarget && (
            <polygon
              points={isTop ? "2,0 46,0 24,116" : "2,120 46,120 24,4"}
              fill="hsl(38, 90%, 55%)"
              opacity="0.12"
            />
          )}
        </svg>

        {/* Pieces stack */}
        <div className={`absolute ${isTop ? "top-1" : "bottom-1"} flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center`}
          style={{ gap: "1px" }}
        >
          {Array.from({ length: maxShow }).map((_, j) => (
            <motion.div
              key={j}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: j * 0.03 }}
            >
              <Checker
                isPlayer={isPlayer}
                isSelected={isSelected && j === maxShow - 1}
                isSelectable={isSelectable && j === maxShow - 1}
              />
              {j === maxShow - 1 && overflow > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-bold text-primary-foreground drop-shadow-md">
                  {overflow}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Target glow dot */}
        {isTarget && absCount === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`absolute ${isTop ? "top-8 sm:top-10" : "bottom-8 sm:bottom-10"} w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/30 border border-primary/60`}
          />
        )}
      </motion.div>
    );
  };

  const OffTray = ({ count, isPlayer }: { count: number; isPlayer: boolean }) => (
    <div className="flex flex-col items-center gap-0.5">
      {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
        <Checker key={i} isPlayer={isPlayer} small />
      ))}
      {count > 5 && (
        <span className="text-[10px] font-display font-bold text-primary mt-0.5">×{count}</span>
      )}
    </div>
  );

  return (
    <GameLayout title="Backgammon" isSkillGame>
      <div className="flex flex-col items-center justify-center h-full p-1 sm:p-2 md:p-3 gap-1 sm:gap-2">
        {/* Scoreboard */}
        <div className="w-full max-w-[900px] flex items-center justify-between mb-1 sm:mb-2 px-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Checker isPlayer={false} small />
            <div>
              <p className="font-display text-xs sm:text-sm font-semibold text-foreground tracking-wide">Opponent</p>
              <p className="text-[9px] sm:text-[11px] font-body text-muted-foreground">
                Pip <span className="text-foreground font-semibold">{pipCount.computer}</span>
                <span className="mx-2 text-border">|</span>
                Off <span className="text-primary font-semibold">{computerOff}</span>
              </p>
            </div>
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            <motion.div
              key={message}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[10px] sm:text-xs font-body text-muted-foreground text-center max-w-[100px] sm:max-w-[180px] hidden sm:block"
            >
              {message}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="font-display text-xs sm:text-sm font-semibold text-foreground tracking-wide">You</p>
              <p className="text-[9px] sm:text-[11px] font-body text-muted-foreground">
                Off <span className="text-primary font-semibold">{playerOff}</span>
                <span className="mx-2 text-border">|</span>
                Pip <span className="text-foreground font-semibold">{pipCount.player}</span>
              </p>
            </div>
            <Checker isPlayer small />
          </div>
        </div>

        {/* Board frame */}
        <div ref={boardRef} className="w-full max-w-[900px] rounded-xl sm:rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(145deg, hsl(25, 20%, 14%) 0%, hsl(20, 18%, 8%) 100%)",
            border: "1.5px solid hsl(38, 40%, 25%)",
            boxShadow: "0 20px 60px -15px hsl(0 0% 0% / 0.7), inset 0 1px 0 hsl(38, 30%, 25% / 0.3)",
          }}
        >
          {/* Flying piece animation overlay */}
          <AnimatePresence>
            {flyingPiece && (
              <motion.div
                className="absolute z-50 pointer-events-none"
                initial={{ left: flyingPiece.fromX - 18, top: flyingPiece.fromY - 18 }}
                animate={{ left: flyingPiece.toX - 18, top: flyingPiece.toY - 18 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.8 }}
              >
                <div className="w-9 h-9 rounded-full relative" style={{ filter: "drop-shadow(0 4px 12px hsl(38, 90%, 55% / 0.5))" }}>
                  <div className={`absolute inset-0 rounded-full ${
                    flyingPiece.isPlayer
                      ? "bg-gradient-to-b from-[hsl(38,90%,62%)] to-[hsl(32,85%,40%)]"
                      : "bg-gradient-to-b from-[hsl(0,0%,82%)] to-[hsl(0,0%,52%)]"
                  }`} />
                  <div className={`absolute inset-[3px] rounded-full ${
                    flyingPiece.isPlayer
                      ? "bg-gradient-to-br from-[hsl(40,95%,65%)] via-[hsl(38,90%,55%)] to-[hsl(30,80%,42%)]"
                      : "bg-gradient-to-br from-[hsl(0,0%,88%)] via-[hsl(0,0%,75%)] to-[hsl(0,0%,58%)]"
                  }`} />
                  <div className={`absolute inset-[5px] rounded-full ${
                    flyingPiece.isPlayer
                      ? "bg-gradient-to-b from-[hsl(42,100%,78%/0.5)] to-transparent"
                      : "bg-gradient-to-b from-[hsl(0,0%,95%/0.5)] to-transparent"
                  }`} style={{ height: "40%" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Point numbers - top */}
          <div className="flex px-1 pt-2">
            <div className="flex-1 flex">
              {topLeft.map(i => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="w-8 sm:w-10 md:w-14" />
            <div className="flex-1 flex">
              {topRight.map(i => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top half of board */}
          <div className="flex px-1">
            <div className="flex-1 flex">
              {topLeft.map(i => renderPoint(i, true))}
            </div>
            {/* Bar center */}
            <div className="w-8 sm:w-10 md:w-14 flex flex-col items-center justify-start gap-0.5 sm:gap-1 pt-2 sm:pt-3"
              style={{ background: "linear-gradient(180deg, hsl(20, 15%, 7%) 0%, hsl(20, 12%, 10%) 100%)", borderLeft: "1px solid hsl(38, 25%, 18%)", borderRight: "1px solid hsl(38, 25%, 18%)" }}
            >
              {Array.from({ length: computerBar }).map((_, j) => (
                <Checker key={j} isPlayer={false} small />
              ))}
            </div>
            <div className="flex-1 flex">
              {topRight.map(i => renderPoint(i, true))}
            </div>
          </div>

          {/* Center divider with dice */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-2 sm:py-3 mx-1 my-0.5 sm:my-1 rounded-lg"
            style={{ background: "linear-gradient(90deg, hsl(20, 15%, 7%) 0%, hsl(20, 12%, 10%) 50%, hsl(20, 15%, 7%) 100%)" }}
          >
            {DiceIcon1 && DiceIcon2 && (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <motion.div
                  key={`d1-${dice[0]}-${Date.now()}`}
                  initial={{ rotate: -360, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(38, 85%, 58%), hsl(32, 80%, 42%))", boxShadow: "0 4px 12px hsl(0 0% 0% / 0.5), inset 0 1px 2px hsl(45, 100%, 80% / 0.3)" }}
                >
                  <DiceIcon1 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary-foreground" />
                </motion.div>
                <motion.div
                  key={`d2-${dice[1]}-${Date.now()}`}
                  initial={{ rotate: 360, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(38, 85%, 58%), hsl(32, 80%, 42%))", boxShadow: "0 4px 12px hsl(0 0% 0% / 0.5), inset 0 1px 2px hsl(45, 100%, 80% / 0.3)" }}
                >
                  <DiceIcon2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary-foreground" />
                </motion.div>
              </div>
            )}

            {movesLeft.length > 0 && gameState === "moving" && (
              <div className="flex gap-1.5">
                {movesLeft.map((m, i) => (
                  <span key={i} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-display font-bold text-primary border border-primary/30"
                    style={{ background: "hsl(38, 90%, 55% / 0.1)" }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom half of board */}
          <div className="flex px-1">
            <div className="flex-1 flex">
              {bottomLeft.map(i => renderPoint(i, false))}
            </div>
            <div className="w-8 sm:w-10 md:w-14 flex flex-col-reverse items-center justify-start gap-0.5 sm:gap-1 pb-2 sm:pb-3"
              style={{ background: "linear-gradient(180deg, hsl(20, 12%, 10%) 0%, hsl(20, 15%, 7%) 100%)", borderLeft: "1px solid hsl(38, 25%, 18%)", borderRight: "1px solid hsl(38, 25%, 18%)" }}
            >
              {Array.from({ length: playerBar }).map((_, j) => (
                <Checker key={j} isPlayer small />
              ))}
            </div>
            <div className="flex-1 flex">
              {bottomRight.map(i => renderPoint(i, false))}
            </div>
          </div>

          {/* Point numbers - bottom */}
          <div className="flex px-1 pb-2">
            <div className="flex-1 flex">
              {bottomLeft.map(i => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="w-8 sm:w-10 md:w-14" />
            <div className="flex-1 flex">
              {bottomRight.map(i => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-4">
          {gameState === "rolling" && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={rollDice}
              className="px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-display font-semibold text-xs sm:text-sm text-primary-foreground tracking-wide"
              style={{
                background: "linear-gradient(135deg, hsl(38, 90%, 55%), hsl(28, 85%, 42%))",
                boxShadow: "0 6px 24px -4px hsl(38, 90%, 55% / 0.4), inset 0 1px 0 hsl(45, 100%, 80% / 0.2)",
              }}
            >
              Roll Dice
            </motion.button>
          )}

          {gameState === "moving" && selectedPoint !== null && validTargets.has(24) && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleBearOff}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-display font-semibold text-xs sm:text-sm text-primary border border-primary/30"
              style={{ background: "hsl(38, 90%, 55% / 0.1)" }}
            >
              Bear Off
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={resetGame}
            className="px-3 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl font-display text-xs sm:text-sm text-muted-foreground border border-border/30 flex items-center gap-1.5 sm:gap-2 hover:text-foreground hover:border-border/50 transition-colors"
            style={{ background: "hsl(240, 8%, 12%)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Game
          </motion.button>
        </div>

        {/* Move history */}
        {moveHistory.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            {moveHistory.slice(-4).map((m, i) => (
              <span key={i} className="text-[10px] font-body text-muted-foreground/50 px-2 py-0.5 rounded-md"
                style={{ background: "hsl(240, 8%, 10%)" }}
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default BackgammonGame;
