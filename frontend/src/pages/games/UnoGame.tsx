import { useState } from "react";
import { motion } from "framer-motion";
import GameLayout from "@/components/GameLayout";

const cardColors: Record<string, string> = {
  red: "from-[hsl(0,70%,45%)] to-[hsl(0,60%,35%)]",
  blue: "from-[hsl(220,70%,45%)] to-[hsl(220,60%,35%)]",
  green: "from-[hsl(140,60%,35%)] to-[hsl(140,50%,28%)]",
  yellow: "from-[hsl(50,80%,50%)] to-[hsl(50,70%,40%)]",
};

interface UnoCard {
  color: string;
  value: string;
}

const hand: UnoCard[] = [
  { color: "red", value: "7" },
  { color: "blue", value: "3" },
  { color: "green", value: "Skip" },
  { color: "yellow", value: "2" },
  { color: "red", value: "+2" },
  { color: "blue", value: "9" },
  { color: "green", value: "1" },
];

const UnoGame = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  return (
    <GameLayout title="UNO">
      <div className="flex flex-col items-center justify-between h-full p-4">
        {/* Opponent info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border/30 flex items-center justify-center">
            <span className="font-display text-xs font-bold text-muted-foreground">OP</span>
          </div>
          <span className="text-sm font-display font-medium text-foreground">Opponent</span>
          <div className="flex gap-1 ml-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-6 h-9 rounded bg-secondary border border-border/30" />
            ))}
          </div>
        </div>

        {/* Center Play Area */}
        <div className="flex items-center gap-6">
          {/* Draw Pile */}
          <div className="w-20 h-32 md:w-24 md:h-36 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 border-2 border-border/30 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors shadow-card">
            <span className="font-display text-2xl font-bold text-muted-foreground">UNO</span>
          </div>

          {/* Discard Pile */}
          <div className={`w-20 h-32 md:w-24 md:h-36 rounded-xl bg-gradient-to-br ${cardColors.red} border-2 border-border/20 flex items-center justify-center shadow-card`}>
            <span className="font-display text-3xl font-bold text-foreground">5</span>
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex items-end justify-center pb-2">
          {hand.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -20 }}
              onClick={() => setSelectedCard(i === selectedCard ? null : i)}
              className={`relative w-16 h-24 md:w-20 md:h-30 rounded-xl bg-gradient-to-br ${cardColors[card.color]} border-2 cursor-pointer transition-all duration-200 flex items-center justify-center -ml-3 first:ml-0 shadow-lg hover:z-20 ${
                selectedCard === i ? "border-foreground -translate-y-4 z-20" : "border-border/20"
              }`}
              style={{ zIndex: selectedCard === i ? 20 : i }}
            >
              <span className="font-display text-xl md:text-2xl font-bold text-foreground drop-shadow-md">
                {card.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
};

export default UnoGame;
