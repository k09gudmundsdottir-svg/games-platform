import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playSnapBuzz, playMiss } from "@/lib/sounds";

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const isRed = (suit: string) => suit === "♥" || suit === "♦";
const randomCard = () => ({
  suit: suits[Math.floor(Math.random() * 4)],
  value: values[Math.floor(Math.random() * 13)],
});

const SnapGame = () => {
  const [currentCard, setCurrentCard] = useState(randomCard());
  const [prevCard, setPrevCard] = useState<null | { suit: string; value: string }>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [autoFlip, setAutoFlip] = useState(true);

  const flipCard = useCallback(() => {
    playCardFlip();
    setPrevCard(currentCard);
    setCurrentCard(randomCard());
    setMessage(null);
  }, [currentCard]);

  useEffect(() => {
    if (!autoFlip) return;
    const id = setInterval(flipCard, 2000);
    return () => clearInterval(id);
  }, [autoFlip, flipCard]);

  const handleSnap = () => {
    if (prevCard && currentCard.value === prevCard.value) {
      playSnapBuzz();
      setScore((s) => ({ ...s, player: s.player + 1 }));
      setMessage("SNAP! 🎉");
    } else {
      playMiss();
      setMessage("Miss! ❌");
    }
    setTimeout(() => setMessage(null), 1500);
  };

  return (
    <GameLayout title="Snap">
      <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
        {/* Score */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-body text-muted-foreground uppercase">You</p>
            <p className="font-display text-2xl font-bold text-primary">{score.player}</p>
          </div>
          <span className="text-muted-foreground/30 font-display text-lg">vs</span>
          <div className="text-center">
            <p className="text-[10px] font-body text-muted-foreground uppercase">Opponent</p>
            <p className="font-display text-2xl font-bold text-foreground">{score.opponent}</p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex items-center gap-4">
          {/* Previous Card */}
          <div className="w-24 h-36 md:w-32 md:h-44 rounded-xl bg-secondary/40 border border-border/20 flex items-center justify-center">
            {prevCard ? (
              <div className="text-center">
                <span className={`text-2xl md:text-3xl font-display font-bold ${isRed(prevCard.suit) ? "text-primary" : "text-foreground"}`}>
                  {prevCard.value}
                </span>
                <span className={`block text-xl ${isRed(prevCard.suit) ? "text-primary" : "text-foreground"}`}>
                  {prevCard.suit}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground/20 font-display text-sm">Previous</span>
            )}
          </div>

          {/* Current Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentCard.value}${currentCard.suit}${Date.now()}`}
              initial={{ rotateY: 90, scale: 0.8 }}
              animate={{ rotateY: 0, scale: 1 }}
              className="w-28 h-40 md:w-36 md:h-52 rounded-xl bg-card border-2 border-border/30 shadow-card-hover flex flex-col items-center justify-center"
            >
              <span className={`text-4xl md:text-5xl font-display font-bold ${isRed(currentCard.suit) ? "text-primary" : "text-foreground"}`}>
                {currentCard.value}
              </span>
              <span className={`text-3xl md:text-4xl ${isRed(currentCard.suit) ? "text-primary" : "text-foreground"}`}>
                {currentCard.suit}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-2xl font-display font-bold text-primary"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Snap Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSnap}
          className="px-12 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity shadow-glow flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          SNAP!
        </motion.button>
      </div>
    </GameLayout>
  );
};

export default SnapGame;
