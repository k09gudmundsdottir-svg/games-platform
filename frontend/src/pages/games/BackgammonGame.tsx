import { useState, useCallback, useEffect, useRef } from "react";
import GameLayout from "@/components/GameLayout";
import { playPiecePlace, playDiceRoll, playVictoryFanfare } from "@/lib/sounds";

/* ── Types ─────────────────────────────────────────────────────── */
type Player = "player" | "computer";
interface BoardState {
  points: number[];      // 24 slots: positive = player checkers, negative = computer
  bar: [number, number]; // [player on bar, computer on bar]
  off: [number, number]; // [player borne off, computer borne off]
}

/* ── Helpers ───────────────────────────────────────────────────── */
const rollDie = () => Math.floor(Math.random() * 6) + 1;

const initialBoard = (): BoardState => {
  const pts = Array(24).fill(0);
  // Player (positive) moves high→low (index 23→0). Standard setup:
  // 2 on point-24(idx23), 5 on point-13(idx12), 3 on point-8(idx7), 5 on point-6(idx5)
  pts[23] = 2; pts[12] = 5; pts[7] = 3; pts[5] = 5;
  // Computer (negative) mirrors:
  // 2 on point-1(idx0), 5 on point-12(idx11), 3 on point-17(idx16), 5 on point-19(idx18)
  pts[0] = -2; pts[11] = -5; pts[16] = -3; pts[18] = -5;
  return { points: pts, bar: [0, 0], off: [0, 0] };
};

const cloneBoard = (b: BoardState): BoardState => ({
  points: [...b.points], bar: [b.bar[0], b.bar[1]], off: [b.off[0], b.off[1]],
});

const pipCount = (board: BoardState, who: Player): number => {
  let pips = 0;
  for (let i = 0; i < 24; i++) {
    if (who === "player" && board.points[i] > 0) pips += board.points[i] * (i + 1);
    if (who === "computer" && board.points[i] < 0) pips += Math.abs(board.points[i]) * (24 - i);
  }
  pips += (who === "player" ? board.bar[0] : board.bar[1]) * 25;
  return pips;
};

const allInHome = (board: BoardState, who: Player): boolean => {
  if (who === "player") {
    if (board.bar[0] > 0) return false;
    for (let i = 6; i < 24; i++) if (board.points[i] > 0) return false;
    return true;
  }
  if (board.bar[1] > 0) return false;
  for (let i = 0; i < 18; i++) if (board.points[i] < 0) return false;
  return true;
};

const highestPoint = (board: BoardState, who: Player): number => {
  if (who === "player") {
    for (let i = 5; i >= 0; i--) if (board.points[i] > 0) return i + 1;
    return 0;
  }
  for (let i = 18; i < 24; i++) if (board.points[i] < 0) return 24 - i;
  return 0;
};

/** Returns valid [from, to] pairs for a single die. from=-1 means bar, to=-1 means bear off. */
const movesForDie = (board: BoardState, who: Player, die: number): [number, number][] => {
  const moves: [number, number][] = [];
  const sign = who === "player" ? 1 : -1;
  const barCount = who === "player" ? board.bar[0] : board.bar[1];

  if (barCount > 0) {
    const dest = who === "player" ? 24 - die : die - 1;
    if (dest >= 0 && dest < 24) {
      const v = board.points[dest];
      if (v * sign >= 0 || Math.abs(v) === 1) moves.push([-1, dest]);
    }
    return moves; // must re-enter before anything else
  }

  for (let i = 0; i < 24; i++) {
    if (board.points[i] * sign <= 0) continue;
    const dest = who === "player" ? i - die : i + die;
    if (dest >= 0 && dest < 24) {
      const v = board.points[dest];
      if (v * sign >= 0 || Math.abs(v) === 1) moves.push([i, dest]);
    }
  }

  if (allInHome(board, who)) {
    for (let i = 0; i < 24; i++) {
      if (board.points[i] * sign <= 0) continue;
      const dist = who === "player" ? i + 1 : 24 - i;
      if (dist === die) {
        moves.push([i, -1]);
      } else if (dist < die && dist === highestPoint(board, who)) {
        moves.push([i, -1]);
      }
    }
  }
  return moves;
};

const applyMove = (board: BoardState, who: Player, from: number, to: number): BoardState => {
  const b = cloneBoard(board);
  const sign = who === "player" ? 1 : -1;
  const bi = who === "player" ? 0 : 1;
  const obi = who === "player" ? 1 : 0;

  if (from === -1) b.bar[bi]--;
  else b.points[from] -= sign;

  if (to === -1) {
    b.off[bi]++;
  } else {
    if (b.points[to] * sign < 0 && Math.abs(b.points[to]) === 1) {
      b.bar[obi]++;
      b.points[to] = sign;
    } else {
      b.points[to] += sign;
    }
  }
  return b;
};

const anyMoveExists = (board: BoardState, who: Player, dice: number[]): boolean => {
  for (const d of dice) if (movesForDie(board, who, d).length > 0) return true;
  return false;
};

/* ── Computer AI ───────────────────────────────────────────────── */
const scoreMove = (board: BoardState, from: number, to: number): number => {
  let s = 0;
  if (to === -1) return 50;
  if (board.points[to] > 0 && board.points[to] === 1) s += 30; // hit player blot
  const after = applyMove(board, "computer", from, to);
  if (Math.abs(after.points[to]) >= 2) s += 15;
  if (from >= 0 && Math.abs(board.points[from]) === 2) s -= 10;
  if (Math.abs(after.points[to]) === 1) s -= 12;
  if (to >= 0) s += to * 0.5; // advance toward home (higher index = closer)
  if (from === -1) s += 20;
  return s;
};

const computerPlan = (board: BoardState, dice: number[]): [number, number, number][] => {
  // Returns array of [from, to, dieIndex] — tries both orderings for 2-dice
  const perms: number[][] = dice.length === 2 && dice[0] !== dice[1]
    ? [[0, 1], [1, 0]] : [dice.map((_, i) => i)];

  let bestSeq: [number, number, number][] = [];
  let bestScore = -Infinity;

  for (const order of perms) {
    const seq: [number, number, number][] = [];
    let cur = cloneBoard(board);
    let totalScore = 0;

    for (const di of order) {
      const moves = movesForDie(cur, "computer", dice[di]);
      if (moves.length === 0) continue;
      let best = moves[0], bs = -Infinity;
      for (const m of moves) {
        const sc = scoreMove(cur, m[0], m[1]);
        if (sc > bs) { bs = sc; best = m; }
      }
      seq.push([best[0], best[1], di]);
      totalScore += bs;
      cur = applyMove(cur, "computer", best[0], best[1]);
    }

    if (seq.length > bestSeq.length || (seq.length === bestSeq.length && totalScore > bestScore)) {
      bestSeq = seq;
      bestScore = totalScore;
    }
  }
  return bestSeq;
};

/* ── Point label helpers ──────────────────────────────────────── */
const ptLabel = (idx: number) => idx + 1;      // 1-based point number for display
const fmtFrom = (f: number) => f === -1 ? "bar" : String(ptLabel(f));
const fmtTo = (t: number) => t === -1 ? "off" : String(ptLabel(t));

/* ── Component ─────────────────────────────────────────────────── */
const BackgammonGame = () => {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [turn, setTurn] = useState<Player>("player");
  const [dice, setDice] = useState<number[]>([]);
  const [usedDice, setUsedDice] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [validDests, setValidDests] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState<Player | null>(null);
  const [log, setLog] = useState<string[]>(["Your turn -- roll the dice!"]);
  const [thinking, setThinking] = useState(false);
  const movable = useRef<Set<number>>(new Set());
  const compTimer = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addLog = useCallback((m: string) => setLog(p => [m, ...p].slice(0, 60)), []);
  const winner = (b: BoardState): Player | null => b.off[0] >= 15 ? "player" : b.off[1] >= 15 ? "computer" : null;

  const remaining = useCallback(() => dice.filter((_, i) => !usedDice[i]), [dice, usedDice]);

  const computeMovable = useCallback((b: BoardState, rem: number[]) => {
    const s = new Set<number>();
    for (const d of rem) for (const [f] of movesForDie(b, "player", d)) s.add(f);
    return s;
  }, []);

  /* ── Player actions ──────────────────────────────────────────── */
  const handleRoll = useCallback(() => {
    if (turn !== "player" || dice.length > 0 || gameOver) return;
    playDiceRoll();
    const d1 = rollDie(), d2 = rollDie();
    const nd = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    const nu = nd.map(() => false);
    setDice(nd); setUsedDice(nu);
    addLog(`You rolled ${d1} and ${d2}${d1 === d2 ? " -- doubles!" : ""}`);
    if (!anyMoveExists(board, "player", nd)) {
      addLog("No valid moves available. Turn passes.");
      setTimeout(() => { setDice([]); setUsedDice([]); setTurn("computer"); }, 200);
    } else {
      movable.current = computeMovable(board, nd);
    }
  }, [turn, dice, board, gameOver, addLog, computeMovable]);

  const handleSelect = useCallback((ptIdx: number) => {
    if (turn !== "player" || dice.length === 0 || gameOver) return;
    if (!movable.current.has(ptIdx)) return;
    const dests = new Set<number>();
    for (const d of remaining()) {
      for (const [f, t] of movesForDie(board, "player", d)) {
        if (f === ptIdx) dests.add(t);
      }
    }
    if (dests.size === 0) return;
    setSelected(ptIdx);
    setValidDests(Array.from(dests));
  }, [turn, dice, gameOver, remaining, board]);

  const handleMove = useCallback((dest: number) => {
    if (selected === null) return;
    let dieIdx = -1;
    for (let i = 0; i < dice.length; i++) {
      if (usedDice[i]) continue;
      if (movesForDie(board, "player", dice[i]).some(([f, t]) => f === selected && t === dest)) {
        dieIdx = i; break;
      }
    }
    if (dieIdx === -1) return;

    const nb = applyMove(board, "player", selected, dest);
    const nu = [...usedDice]; nu[dieIdx] = true;
    playPiecePlace();
    addLog(`You: ${fmtFrom(selected)} \u2192 ${fmtTo(dest)}`);

    const w = winner(nb);
    if (w) {
      setBoard(nb); setGameOver(w); setDice([]); playVictoryFanfare();
      addLog("You win!"); setSelected(null); setValidDests([]); return;
    }
    setBoard(nb); setUsedDice(nu); setSelected(null); setValidDests([]);
    const rem = dice.filter((_, i) => !nu[i]);
    if (rem.length === 0 || !anyMoveExists(nb, "player", rem)) {
      if (rem.length > 0) addLog("No more valid moves.");
      setTimeout(() => { setDice([]); setUsedDice([]); setTurn("computer"); }, 100);
    } else {
      movable.current = computeMovable(nb, rem);
    }
  }, [selected, dice, usedDice, board, addLog, computeMovable]);

  /* ── Computer turn ───────────────────────────────────────────── */
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (turn !== "computer" || gameOver || thinking) return;
    setThinking(true);

    const runComputer = async () => {
      await new Promise(r => setTimeout(r, 800));
      playDiceRoll();
      const d1 = rollDie(), d2 = rollDie();
      const cd = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
      setDice(cd); setUsedDice(cd.map(() => false));
      addLog(`Computer rolled ${d1} and ${d2}${d1 === d2 ? " -- doubles!" : ""}`);

      // Pause to let player see the dice
      await new Promise(r => setTimeout(r, 1200));

      const plan = computerPlan(boardRef.current, cd);

      if (plan.length === 0) {
        addLog("Computer has no valid moves.");
        await new Promise(r => setTimeout(r, 800));
        setDice([]); setUsedDice([]); setTurn("player"); setThinking(false);
        addLog("Your turn -- roll the dice!");
        return;
      }

      let cur = cloneBoard(boardRef.current);
      const usedArr = cd.map(() => false);
      for (let idx = 0; idx < plan.length; idx++) {
        const [from, to, di] = plan[idx];
        await new Promise(r => setTimeout(r, 700));
        cur = applyMove(cur, "computer", from, to);
        usedArr[di] = true;
        playPiecePlace();
        addLog(`Computer: ${fmtFrom(from)} \u2192 ${fmtTo(to)}`);
        setBoard(cloneBoard(cur));
        setUsedDice([...usedArr]);

        const w = winner(cur);
        if (w) {
          setGameOver(w); setDice([]); addLog("Computer wins!"); setThinking(false);
          return;
        }
      }
      await new Promise(r => setTimeout(r, 600));
      setDice([]); setUsedDice([]); setTurn("player"); setThinking(false);
      addLog("Your turn -- roll the dice!");
    };

    runComputer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameOver]);

  const newGame = () => {
    compTimer.current.forEach(clearTimeout); compTimer.current = [];
    setBoard(initialBoard()); setTurn("player"); setDice([]); setUsedDice([]);
    setSelected(null); setValidDests([]); setGameOver(null); setThinking(false);
    setLog(["Your turn -- roll the dice!"]); movable.current = new Set();
  };

  /* ── Render helpers ──────────────────────────────────────────── */
  const Checker = ({ who, count, ptIdx, top }: { who: Player; count: number; ptIdx: number; top: boolean }) => {
    const n = Math.min(Math.abs(count), 5);
    const total = Math.abs(count);
    const isP = who === "player";
    const canClick = turn === "player" && dice.length > 0 && !gameOver && isP && movable.current.has(ptIdx);
    const isSel = selected === ptIdx;

    return (
      <div className={`flex ${top ? "flex-col" : "flex-col-reverse"} items-center gap-0.5`}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i}
            onClick={canClick ? () => handleSelect(ptIdx) : undefined}
            className={`w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] rounded-full border-2 flex items-center justify-center
              text-[9px] font-bold select-none transition-all
              ${isP ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300/80 text-amber-900 shadow-md shadow-amber-900/20"
                    : "bg-gradient-to-br from-gray-300 to-gray-500 border-gray-200/80 text-gray-700 shadow-md shadow-gray-900/20"}
              ${canClick ? "cursor-pointer ring-2 ring-emerald-400/60 hover:scale-110" : ""}
              ${isSel ? "ring-2 ring-cyan-400 scale-110 z-20" : ""}`}
          >
            {i === n - 1 && total > 5 ? total : ""}
          </div>
        ))}
      </div>
    );
  };

  const Point = ({ idx, top }: { idx: number; top: boolean }) => {
    const v = board.points[idx];
    const isDest = validDests.includes(idx);
    const col = top ? idx - 12 : 11 - idx;
    const dark = col % 2 === 0;

    return (
      <div key={idx}
        onClick={isDest ? () => handleMove(idx) : undefined}
        className={`flex-1 flex ${top ? "flex-col items-center pt-0.5" : "flex-col-reverse items-center pb-0.5"}
          relative min-h-[130px] sm:min-h-[150px] ${isDest ? "cursor-pointer" : ""}`}
      >
        <div className={`absolute ${top ? "top-0" : "bottom-0"} inset-x-0 mx-auto`}
          style={{
            width: "100%", height: "115px",
            clipPath: top ? "polygon(0 0, 100% 0, 50% 100%)" : "polygon(50% 0, 0 100%, 100% 100%)",
            background: dark
              ? "linear-gradient(to bottom, #7B5B2E, #5A4220)"
              : "linear-gradient(to bottom, #C9963A, #A67B28)",
            opacity: isDest ? 1 : 0.65,
          }} />
        {isDest && (
          <div className={`absolute ${top ? "top-0" : "bottom-0"} inset-x-0 mx-auto z-[5]`}
            style={{
              width: "100%", height: "115px",
              clipPath: top ? "polygon(0 0, 100% 0, 50% 100%)" : "polygon(50% 0, 0 100%, 100% 100%)",
              background: "rgba(52, 211, 153, 0.30)",
            }} />
        )}
        <div className="relative z-10">
          {v !== 0 && <Checker who={v > 0 ? "player" : "computer"} count={v} ptIdx={idx} top={top} />}
        </div>
        <span className={`absolute ${top ? "bottom-0.5" : "top-0.5"} text-[7px] text-amber-300/30 font-mono select-none`}>
          {ptLabel(idx)}
        </span>
      </div>
    );
  };

  const BarCheckers = ({ who }: { who: Player }) => {
    const c = who === "player" ? board.bar[0] : board.bar[1];
    if (c === 0) return null;
    const isP = who === "player";
    const canClick = isP && turn === "player" && dice.length > 0 && !gameOver && movable.current.has(-1);
    return (
      <div className="flex flex-col items-center gap-0.5">
        {Array.from({ length: Math.min(c, 4) }).map((_, i) => (
          <div key={i}
            onClick={canClick ? () => handleSelect(-1) : undefined}
            className={`w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] rounded-full border-2 flex items-center justify-center
              text-[9px] font-bold select-none
              ${isP ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300/80 text-amber-900 shadow-md"
                    : "bg-gradient-to-br from-gray-300 to-gray-500 border-gray-200/80 text-gray-700 shadow-md"}
              ${canClick ? "cursor-pointer ring-2 ring-emerald-400/60 hover:scale-110" : ""}
              ${selected === -1 && isP ? "ring-2 ring-cyan-400 scale-110" : ""}`}
          >
            {i === Math.min(c, 4) - 1 && c > 4 ? c : ""}
          </div>
        ))}
      </div>
    );
  };

  const OffTray = ({ who }: { who: Player }) => {
    const c = who === "player" ? board.off[0] : board.off[1];
    const isP = who === "player";
    const isDest = isP && validDests.includes(-1);
    return (
      <div onClick={isDest ? () => handleMove(-1) : undefined}
        className={`w-10 sm:w-14 flex flex-col ${isP ? "justify-end pb-2" : "justify-start pt-2"} items-center
          border-l border-amber-900/40 ${isDest ? "cursor-pointer" : ""}`}
        style={{ background: "linear-gradient(180deg, #1a0f08, #251509)" }}>
        {isDest && <span className="text-[9px] text-emerald-400 font-bold animate-pulse mb-1">BEAR OFF</span>}
        {c > 0 && (
          <div className={`flex ${isP ? "flex-col-reverse" : "flex-col"} items-center gap-px`}>
            {Array.from({ length: Math.min(c, 8) }).map((_, i) => (
              <div key={i} className={`w-6 h-[6px] rounded-sm ${isP
                ? "bg-gradient-to-r from-amber-400 to-amber-600 border border-amber-300/40"
                : "bg-gradient-to-r from-gray-300 to-gray-500 border border-gray-200/40"}`} />
            ))}
            {c > 8 && <span className={`text-[8px] font-bold ${isP ? "text-amber-400" : "text-gray-400"}`}>{c}</span>}
          </div>
        )}
      </div>
    );
  };

  // Point indices for each row
  const topPts = Array.from({ length: 12 }, (_, i) => 12 + i);    // idx 12..23
  const botPts = Array.from({ length: 12 }, (_, i) => 11 - i);    // idx 11..0

  const sidebar = (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-display font-bold text-foreground">Move Log</h3>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {log.map((m, i) => (
          <p key={i} className={`text-[10px] font-body leading-tight ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>{m}</p>
        ))}
      </div>
    </div>
  );

  return (
    <GameLayout title="Backgammon" sidebar={sidebar}>
      <div className="flex flex-col items-center justify-center h-full p-2 sm:p-4 gap-3">
        {/* Info bar */}
        <div className="flex items-center gap-4 sm:gap-6 w-full max-w-[720px] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border border-gray-200" />
            <span className="font-display font-semibold text-foreground">Computer</span>
            <span className="text-[10px] text-muted-foreground font-body">Pip {pipCount(board, "computer")}</span>
            <span className="text-[10px] text-emerald-400 font-body">Off {board.off[1]}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-body">Off {board.off[0]}</span>
            <span className="text-[10px] text-muted-foreground font-body">Pip {pipCount(board, "player")}</span>
            <span className="font-display font-semibold text-foreground">You</span>
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300" />
          </div>
        </div>

        {/* Board */}
        <div className="w-full max-w-[720px] rounded-xl overflow-hidden shadow-2xl border border-amber-900/50"
          style={{ background: "linear-gradient(135deg, #2C1810 0%, #3D2417 50%, #2C1810 100%)" }}>

          {/* Top row */}
          <div className="flex">
            <div className="flex flex-1">{topPts.slice(0, 6).map(i => <Point key={i} idx={i} top />)}</div>
            <div className="w-10 sm:w-12 flex flex-col items-center justify-start pt-2"
              style={{ background: "linear-gradient(180deg, #1a0f08, #2a1a10)" }}>
              <BarCheckers who="computer" />
            </div>
            <div className="flex flex-1">{topPts.slice(6).map(i => <Point key={i} idx={i} top />)}</div>
            <OffTray who="computer" />
          </div>

          {/* Middle bar / dice */}
          <div className="flex items-center justify-center gap-2 py-2 sm:py-3"
            style={{ background: "linear-gradient(90deg, #1a0f08 0%, #2a1a10 50%, #1a0f08 100%)" }}>
            {dice.length > 0 ? dice.map((d, i) => (
              <div key={i} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                font-display font-bold text-lg select-none
                ${usedDice[i]
                  ? "bg-gray-700/50 text-gray-500 line-through border border-gray-600/30"
                  : "bg-gradient-to-br from-gray-100 to-gray-300 text-gray-900 border border-gray-400 shadow-lg"}`}>
                {d}
              </div>
            )) : (
              <span className="text-xs text-amber-200/40 font-body select-none">
                {thinking ? "" : (gameOver ? "" : "Roll to begin")}
              </span>
            )}
            {thinking && <span className="text-xs text-amber-200/50 font-body animate-pulse ml-2">Computer thinking...</span>}
          </div>

          {/* Bottom row */}
          <div className="flex">
            <div className="flex flex-1">{botPts.slice(0, 6).map(i => <Point key={i} idx={i} top={false} />)}</div>
            <div className="w-10 sm:w-12 flex flex-col items-center justify-end pb-2"
              style={{ background: "linear-gradient(180deg, #2a1a10, #1a0f08)" }}>
              <BarCheckers who="player" />
            </div>
            <div className="flex flex-1">{botPts.slice(6).map(i => <Point key={i} idx={i} top={false} />)}</div>
            <OffTray who="player" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!gameOver && turn === "player" && dice.length === 0 && !thinking && (
            <button onClick={handleRoll}
              className="px-5 py-2 rounded-lg font-display text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600
                text-white shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-105 active:scale-95">
              Roll Dice
            </button>
          )}
          <button onClick={newGame}
            className="px-4 py-2 rounded-lg font-display text-xs font-semibold bg-secondary text-foreground
              border border-border/30 hover:bg-secondary/80 transition-all">
            New Game
          </button>
        </div>

        {/* Game over banner */}
        {gameOver && (
          <div className={`px-6 py-3 rounded-xl border text-center ${
            gameOver === "player"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
            <p className="font-display font-bold text-lg">{gameOver === "player" ? "You Win!" : "Computer Wins!"}</p>
          </div>
        )}

        {/* Status line */}
        <p className="text-[11px] font-body text-muted-foreground text-center max-w-md">{log[0]}</p>
      </div>
    </GameLayout>
  );
};

export default BackgammonGame;
