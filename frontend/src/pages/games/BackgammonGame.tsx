import { useState } from "react";
import { motion } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { playDiceRoll } from "@/lib/sounds";

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const BackgammonGame = () => {
  const [dice, setDice] = useState([3, 5]);

  const rollDice = () => {
    playDiceRoll();
    setDice([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
  };

  const DiceIcon1 = diceIcons[dice[0] - 1];
  const DiceIcon2 = diceIcons[dice[1] - 1];

  // Simplified board representation
  const topPoints = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    pieces: i === 0 ? 5 : i === 4 ? 3 : i === 6 ? 5 : i === 11 ? 2 : 0,
    color: i === 0 || i === 4 || i === 6 ? "opponent" : i === 11 ? "player" : null,
  }));
  const bottomPoints = Array.from({ length: 12 }, (_, i) => ({
    id: i + 12,
    pieces: i === 0 ? 2 : i === 5 ? 5 : i === 7 ? 3 : i === 11 ? 5 : 0,
    color: i === 0 ? "opponent" : i === 5 || i === 7 || i === 11 ? "player" : null,
  }));

  return (
    <GameLayout title="Backgammon">
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[600px]">
          {/* Board */}
          <div className="rounded-xl border border-border/30 bg-[hsl(25,20%,12%)] overflow-hidden shadow-card">
            {/* Top half */}
            <div className="flex border-b border-border/20">
              <div className="flex-1 flex">
                {topPoints.slice(0, 6).map((pt) => (
                  <div key={pt.id} className="flex-1 flex flex-col items-center pt-1">
                    <div className={`w-full h-24 md:h-32 clip-triangle-down ${pt.id % 2 === 0 ? "bg-primary/20" : "bg-secondary/60"}`} />
                    <div className="flex flex-col items-center gap-0.5 -mt-20 md:-mt-28 relative z-10">
                      {Array.from({ length: pt.pieces }).map((_, j) => (
                        <div
                          key={j}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                            pt.color === "player"
                              ? "bg-primary/80 border-primary"
                              : "bg-muted-foreground/60 border-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-8 bg-[hsl(25,15%,8%)] border-x border-border/20" />
              <div className="flex-1 flex">
                {topPoints.slice(6, 12).map((pt) => (
                  <div key={pt.id} className="flex-1 flex flex-col items-center pt-1">
                    <div className={`w-full h-24 md:h-32 clip-triangle-down ${pt.id % 2 === 0 ? "bg-primary/20" : "bg-secondary/60"}`} />
                    <div className="flex flex-col items-center gap-0.5 -mt-20 md:-mt-28 relative z-10">
                      {Array.from({ length: pt.pieces }).map((_, j) => (
                        <div
                          key={j}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                            pt.color === "player"
                              ? "bg-primary/80 border-primary"
                              : "bg-muted-foreground/60 border-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center bar with dice */}
            <div className="flex items-center justify-center gap-3 py-3 bg-[hsl(25,15%,8%)]">
              <motion.div whileTap={{ scale: 0.9 }}>
                <DiceIcon1 className="w-10 h-10 text-primary" />
              </motion.div>
              <motion.div whileTap={{ scale: 0.9 }}>
                <DiceIcon2 className="w-10 h-10 text-primary" />
              </motion.div>
              <button
                onClick={rollDice}
                className="ml-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow"
              >
                Roll
              </button>
            </div>

            {/* Bottom half */}
            <div className="flex border-t border-border/20">
              <div className="flex-1 flex">
                {bottomPoints.slice(0, 6).map((pt) => (
                  <div key={pt.id} className="flex-1 flex flex-col-reverse items-center pb-1">
                    <div className={`w-full h-24 md:h-32 clip-triangle-up ${pt.id % 2 === 0 ? "bg-secondary/60" : "bg-primary/20"}`} />
                    <div className="flex flex-col-reverse items-center gap-0.5 -mb-20 md:-mb-28 relative z-10">
                      {Array.from({ length: pt.pieces }).map((_, j) => (
                        <div
                          key={j}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                            pt.color === "player"
                              ? "bg-primary/80 border-primary"
                              : "bg-muted-foreground/60 border-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-8 bg-[hsl(25,15%,8%)] border-x border-border/20" />
              <div className="flex-1 flex">
                {bottomPoints.slice(6, 12).map((pt) => (
                  <div key={pt.id} className="flex-1 flex flex-col-reverse items-center pb-1">
                    <div className={`w-full h-24 md:h-32 clip-triangle-up ${pt.id % 2 === 0 ? "bg-secondary/60" : "bg-primary/20"}`} />
                    <div className="flex flex-col-reverse items-center gap-0.5 -mb-20 md:-mb-28 relative z-10">
                      {Array.from({ length: pt.pieces }).map((_, j) => (
                        <div
                          key={j}
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 ${
                            pt.color === "player"
                              ? "bg-primary/80 border-primary"
                              : "bg-muted-foreground/60 border-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default BackgammonGame;
