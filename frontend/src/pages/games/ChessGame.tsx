import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, Square, Move } from "chess.js";
import GameLayout from "@/components/GameLayout";
import { playPiecePlace } from "@/lib/sounds";

const PIECE_SYMBOLS: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];
const CENTER_SQUARES = ["e4", "d4", "e5", "d5"];
const CAPTURE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function evaluateMove(game: Chess, move: Move): number {
  let score = 0;
  if (move.captured) score += CAPTURE_VALUES[move.captured] * 10;
  if (CENTER_SQUARES.includes(move.to)) score += 3;
  game.move(move.san);
  if (game.inCheck()) score += 5;
  if (game.isCheckmate()) score += 1000;
  game.undo();
  score += Math.random() * 2;
  return score;
}

function getComputerMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const s = evaluateMove(game, m);
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

interface MoveHistoryProps {
  history: string[];
}

const MoveHistory = ({ history }: MoveHistoryProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history.length]);

  const pairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, white: history[i], black: history[i + 1] });
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
      <div className="space-y-1">
        {pairs.map((m) => (
          <div key={m.num} className="flex items-center text-xs font-body">
            <span className="w-7 text-muted-foreground/50 shrink-0">{m.num}.</span>
            <span className="flex-1 text-foreground font-medium">{m.white}</span>
            <span className="flex-1 text-muted-foreground">{m.black ?? ""}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {history.length === 0 && (
        <p className="text-xs text-muted-foreground/60 font-body italic">No moves yet</p>
      )}
    </div>
  );
};

const CapturedPieces = ({ pieces, color }: { pieces: string[]; color: "w" | "b" }) => {
  const sorted = [...pieces].sort((a, b) => (CAPTURE_VALUES[b] ?? 0) - (CAPTURE_VALUES[a] ?? 0));
  return (
    <div className="flex flex-wrap gap-0.5 min-h-[28px] items-center">
      {sorted.map((p, i) => (
        <span key={i} className="text-lg select-none opacity-70">
          {PIECE_SYMBOLS[`${color}${p}`]}
        </span>
      ))}
    </div>
  );
};

const ChessGame = () => {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const checkGameOver = useCallback((g: Chess) => {
    if (g.isCheckmate()) {
      setGameOver(g.turn() === "w" ? "Checkmate — Black wins!" : "Checkmate — White wins!");
    } else if (g.isStalemate()) {
      setGameOver("Stalemate — Draw!");
    } else if (g.isDraw()) {
      setGameOver("Draw!");
    }
  }, []);

  const doComputerMove = useCallback((g: Chess) => {
    setThinking(true);
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      const move = getComputerMove(g);
      if (move) {
        const result = g.move({ from: move.from, to: move.to, promotion: "q" });
        if (result) {
          playPiecePlace();
          if (result.captured) setCapturedBlack(prev => [...prev, result.captured!]);
          setLastMove({ from: result.from as Square, to: result.to as Square });
          setMoveHistory(prev => [...prev, result.san]);
          setGame(new Chess(g.fen()));
          checkGameOver(g);
        }
      }
      setThinking(false);
    }, delay);
  }, [checkGameOver]);

  const handleSquareClick = useCallback((sq: Square) => {
    if (gameOver || thinking || game.turn() !== "w") return;

    const piece = game.get(sq);

    if (selected) {
      if (legalMoves.includes(sq)) {
        const g = new Chess(game.fen());
        const result = g.move({ from: selected, to: sq, promotion: "q" });
        if (result) {
          playPiecePlace();
          if (result.captured) setCapturedWhite(prev => [...prev, result.captured!]);
          setLastMove({ from: result.from as Square, to: result.to as Square });
          setMoveHistory(prev => [...prev, result.san]);
          setSelected(null);
          setLegalMoves([]);
          setGame(new Chess(g.fen()));
          checkGameOver(g);
          if (!g.isGameOver()) doComputerMove(g);
          return;
        }
      }
      if (piece && piece.color === "w") {
        setSelected(sq);
        setLegalMoves(game.moves({ square: sq, verbose: true }).map(m => m.to as Square));
        return;
      }
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    if (piece && piece.color === "w") {
      setSelected(sq);
      setLegalMoves(game.moves({ square: sq, verbose: true }).map(m => m.to as Square));
    }
  }, [game, selected, legalMoves, gameOver, thinking, checkGameOver, doComputerMove]);

  const handleNewGame = useCallback(() => {
    const g = new Chess();
    setGame(g);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setThinking(false);
    setGameOver(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setMoveHistory([]);
  }, []);

  const handleResign = useCallback(() => {
    if (!gameOver) setGameOver("You resigned — Black wins!");
  }, [gameOver]);

  const board = game.board();

  const sidebar = (
    <div className="flex flex-col h-full">
      <MoveHistory history={moveHistory} />
      <div className="mt-auto p-3 border-t border-border/20 space-y-2">
        <button
          onClick={handleNewGame}
          className="w-full px-3 py-2 text-xs font-display font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          New Game
        </button>
        <button
          onClick={handleResign}
          disabled={!!gameOver}
          className="w-full px-3 py-2 text-xs font-display font-semibold rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Resign
        </button>
      </div>
    </div>
  );

  return (
    <GameLayout title="Chess" sidebar={sidebar} isSkillGame>
      <div className="flex items-center justify-center h-full p-4">
        <div className="flex flex-col gap-2 w-full max-w-[min(85vw,560px)]">
          {/* Computer captured pieces + label */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-display font-semibold text-muted-foreground">♚ Computer (Black)</span>
              {thinking && (
                <span className="text-[10px] font-body text-primary animate-pulse">Thinking...</span>
              )}
            </div>
            <CapturedPieces pieces={capturedWhite} color="w" />
          </div>

          {/* Board with coordinates */}
          <div className="relative">
            {/* File labels top */}
            <div className="flex ml-6 mr-0">
              {FILES.map(f => (
                <div key={f} className="flex-1 text-center text-[10px] font-body text-muted-foreground/50 pb-0.5">{f}</div>
              ))}
            </div>

            <div className="flex">
              {/* Rank labels left */}
              <div className="flex flex-col w-6 shrink-0">
                {RANKS.map(r => (
                  <div key={r} className="flex-1 flex items-center justify-center text-[10px] font-body text-muted-foreground/50">{r}</div>
                ))}
              </div>

              {/* Board grid */}
              <div className="flex-1 aspect-square grid grid-cols-8 border border-border/30 rounded-lg overflow-hidden shadow-card">
                {board.map((row, r) =>
                  row.map((piece, c) => {
                    const sq = `${FILES[c]}${RANKS[r]}` as Square;
                    const isDark = (r + c) % 2 === 1;
                    const isSelected = selected === sq;
                    const isLegal = legalMoves.includes(sq);
                    const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
                    const inCheck = game.inCheck() && piece?.type === "k" && piece.color === game.turn();

                    let bgClass = isDark ? "bg-[#b58863]" : "bg-[#f0d9b5]";
                    if (isSelected) bgClass = "bg-[#829769]";
                    else if (isLastMove) bgClass = isDark ? "bg-[#cda64e]" : "bg-[#f6ec7e]";
                    else if (inCheck) bgClass = "bg-red-500/60";

                    return (
                      <div
                        key={sq}
                        className={`aspect-square flex items-center justify-center cursor-pointer relative transition-colors ${bgClass} hover:brightness-110`}
                        onClick={() => handleSquareClick(sq)}
                      >
                        {piece && (
                          <span
                            className={`text-3xl md:text-4xl select-none drop-shadow-sm ${
                              piece.color === "w" ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]" : "text-gray-900 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
                            }`}
                          >
                            {PIECE_SYMBOLS[`${piece.color}${piece.type}`]}
                          </span>
                        )}
                        {isLegal && (
                          <div className={`absolute inset-0 flex items-center justify-center ${piece ? "" : ""}`}>
                            {piece ? (
                              <div className="w-full h-full rounded-full border-[3px] border-green-500/60" />
                            ) : (
                              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500/50" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rank labels right */}
              <div className="flex flex-col w-6 shrink-0">
                {RANKS.map(r => (
                  <div key={r} className="flex-1 flex items-center justify-center text-[10px] font-body text-muted-foreground/50">{r}</div>
                ))}
              </div>
            </div>

            {/* File labels bottom */}
            <div className="flex ml-6 mr-6">
              {FILES.map(f => (
                <div key={f} className="flex-1 text-center text-[10px] font-body text-muted-foreground/50 pt-0.5">{f}</div>
              ))}
            </div>
          </div>

          {/* Player captured pieces + label */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-display font-semibold text-foreground">♔ You (White)</span>
            <CapturedPieces pieces={capturedBlack} color="b" />
          </div>

          {/* Status bar */}
          <div className="text-center">
            {game.inCheck() && !gameOver && (
              <span className="text-xs font-display font-semibold text-destructive">Check!</span>
            )}
          </div>
        </div>
      </div>

      {/* Game over overlay */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border/30 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <div className="text-4xl mb-4">
              {gameOver.includes("White wins") ? "🏆" : gameOver.includes("Draw") || gameOver.includes("Stalemate") ? "🤝" : "💀"}
            </div>
            <h2 className="text-lg font-display font-bold text-foreground mb-2">Game Over</h2>
            <p className="text-sm font-body text-muted-foreground mb-6">{gameOver}</p>
            <button
              onClick={handleNewGame}
              className="px-6 py-2.5 text-sm font-display font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
};

export default ChessGame;
