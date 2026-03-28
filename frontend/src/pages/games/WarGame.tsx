import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import { playCardFlip } from "@/lib/sounds";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const randomCard = () => ({
  suit: suits[Math.floor(Math.random() * 4)],
  value: values[Math.floor(Math.random() * 13)],
});

const isRed = (suit: string) => suit === "♥" || suit === "♦";

const WarGame = () => {
  const [playerCard, setPlayerCard] = useState<{ suit: string; value: string } | null>(null);
  const [opponentCard, setOpponentCard] = useState<{ suit: string; value: string } | null>(null);
  const [flipping, setFlipping] = useState(false);

  const flipCards = () => {
    setFlipping(true);
    playCardFlip();
    setPlayerCard(null);
    setOpponentCard(null);
    setTimeout(() => {
      setPlayerCard(randomCard());
      setOpponentCard(randomCard());
      setFlipping(false);
    }, 600);
  };

  const CardDisplay = ({ card, label }: { card: { suit: string; value: string } | null; label: string }) => (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <AnimatePresence mode="wait">
        {card ? (
          <motion.div
            key={`${card.value}${card.suit}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-28 h-40 md:w-36 md:h-52 rounded-xl bg-card border-2 border-border/30 shadow-card flex flex-col items-center justify-center"
          >
            <span className={`text-4xl md:text-5xl font-display font-bold ${isRed(card.suit) ? "text-primary" : "text-foreground"}`}>
              {card.value}
            </span>
            <span className={`text-3xl md:text-4xl ${isRed(card.suit) ? "text-primary" : "text-foreground"}`}>
              {card.suit}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-28 h-40 md:w-36 md:h-52 rounded-xl bg-gradient-to-br from-primary/20 to-secondary border-2 border-border/30 shadow-card flex items-center justify-center"
          >
            <span className="font-display text-3xl font-bold text-muted-foreground/30">?</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <GameLayout title="War">
      <div className="flex flex-col items-center justify-center h-full p-4 gap-8">
        {/* Score */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-body text-muted-foreground uppercase">You</p>
            <p className="font-display text-2xl font-bold text-primary">12</p>
          </div>
          <span className="text-muted-foreground/30 font-display text-lg">vs</span>
          <div className="text-center">
            <p className="text-[10px] font-body text-muted-foreground uppercase">Opponent</p>
            <p className="font-display text-2xl font-bold text-foreground">10</p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex items-center gap-8 md:gap-16">
          <CardDisplay card={playerCard} label="Your Card" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground/30 font-display text-2xl font-bold">⚔</span>
          </div>
          <CardDisplay card={opponentCard} label="Opponent" />
        </div>

        {/* Flip Button */}
        <button
          onClick={flipCards}
          disabled={flipping}
          className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40"
        >
          {flipping ? "Flipping..." : "Flip Cards"}
        </button>
      </div>
    </GameLayout>
  );
};

export default WarGame;
