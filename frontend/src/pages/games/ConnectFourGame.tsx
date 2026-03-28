import { useState } from "react";
import { motion } from "framer-motion";
import GameLayout from "@/components/GameLayout";

const ROWS = 6;
const COLS = 7;

const ConnectFourGame = () => {
  const [board, setBoard] = useState<(null | "red" | "yellow")[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [turn, setTurn] = useState<"red" | "yellow">("red");

  const dropPiece = (col: number) => {
    const newBoard = board.map((r) => [...r]);
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!newBoard[row][col]) {
        newBoard[row][col] = turn;
        setBoard(newBoard);
        setTurn(turn === "red" ? "yellow" : "red");
        return;
      }
    }
  };

  return (
    <GameLayout title="Connect Four">
      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        {/* Turn Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${turn === "red" ? "bg-primary" : "bg-[hsl(50,80%,55%)]"}`} />
          <span className="text-sm font-display font-semibold text-foreground">
            {turn === "red" ? "Your" : "Opponent's"} turn
          </span>
        </div>

        {/* Board */}
        <div className="rounded-xl bg-[hsl(220,40%,18%)] p-3 border border-border/30 shadow-card">
          {/* Column drop buttons */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {Array.from({ length: COLS }).map((_, c) => (
              <button
                key={c}
                onClick={() => dropPiece(c)}
                className="h-6 rounded-md bg-secondary/40 hover:bg-primary/20 transition-colors flex items-center justify-center"
              >
                <span className="text-xs text-muted-foreground">▼</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {board.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[hsl(220,30%,12%)] border border-border/20 flex items-center justify-center"
                >
                  {cell && (
                    <motion.div
                      initial={{ y: -100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                      className={`w-[80%] h-[80%] rounded-full ${
                        cell === "red"
                          ? "bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                          : "bg-[hsl(50,80%,55%)] shadow-[0_0_12px_hsl(50,80%,55%,0.4)]"
                      }`}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ConnectFourGame;
