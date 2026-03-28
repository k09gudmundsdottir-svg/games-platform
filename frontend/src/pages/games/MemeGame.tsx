import { useState } from "react";
import { motion } from "framer-motion";
import GameLayout from "@/components/GameLayout";

const captionCards = [
  "When you realize it's Monday tomorrow",
  "Me trying to adult",
  "That look when pizza arrives",
  "When someone says 'we need to talk'",
  "My face during meetings",
  "Expectations vs. Reality",
  "When WiFi disconnects for 2 seconds",
];

const MemeGame = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  return (
    <GameLayout title="What Do You Meme" forceVideoPanel>
      <div className="flex flex-col h-full">
        {/* Meme Image - Top Center */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {/* Round info */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Round 3 of 10</span>
              <span className="text-xs font-body text-muted-foreground">Judge: Alex</span>
            </div>

            {/* Meme Image */}
            <div className="relative rounded-xl border-2 border-border/30 overflow-hidden shadow-card-hover bg-secondary">
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/60">
                <div className="text-center p-6">
                  <span className="text-6xl mb-4 block">😂</span>
                  <p className="font-display text-lg font-bold text-foreground">Meme Image</p>
                  <p className="text-xs font-body text-muted-foreground mt-1">
                    The meme image would appear here
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-display font-semibold text-primary">MEME</span>
              </div>
            </div>

            {/* Scores */}
            <div className="flex items-center justify-center gap-4 mt-3">
              {["You: 2", "Alex: 1", "Jordan: 3", "Casey: 2"].map((s) => (
                <span key={s} className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border/20">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Caption Cards Hand - Bottom */}
        <div className="border-t border-border/20 bg-card/30 p-4">
          <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
            Pick your best caption
          </p>
          <div className="flex items-end justify-center gap-2 overflow-x-auto pb-2 px-2">
            {captionCards.map((caption, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedCard(i === selectedCard ? null : i)}
                className={`shrink-0 w-28 md:w-32 h-36 md:h-40 rounded-xl p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  selectedCard === i
                    ? "bg-primary/15 border-2 border-primary shadow-glow -translate-y-2"
                    : "bg-card border border-border/30 hover:border-border/60"
                }`}
              >
                <p className="text-[11px] md:text-xs font-body font-medium text-foreground leading-tight">
                  {caption}
                </p>
                <div className="flex items-center justify-end">
                  <span className="text-[9px] font-body text-muted-foreground">#{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {selectedCard !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-3"
            >
              <button className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow">
                Submit Caption
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default MemeGame;
