import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw, Play, Pause } from "lucide-react";
import GameLayout from "@/components/GameLayout";

/* ── Card data ─────────────────────────────────────────────────────────── */

const suits = ["\u2660", "\u2665", "\u2666", "\u2663"] as const;
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const isRed = (suit: string) => suit === "\u2665" || suit === "\u2666";

interface Card {
  suit: string;
  value: string;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of suits) {
    for (const v of values) {
      deck.push({ suit: s, value: v });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/* ── Playing Card Component ────────────────────────────────────────────── */

const PlayingCard = ({ card, large, flipping }: { card: Card | null; large?: boolean; flipping?: boolean }) => {
  const w = large ? "w-32 h-48 md:w-40 md:h-56" : "w-24 h-36 md:w-28 md:h-40";
  const textSize = large ? "text-5xl md:text-6xl" : "text-3xl md:text-4xl";
  const suitSize = large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl";

  if (!card) {
    return (
      <div className={`${w} rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border-2 border-border/20 flex items-center justify-center shadow-card`}>
        <span className="font-display text-2xl font-bold text-muted-foreground/20">?</span>
      </div>
    );
  }

  const red = isRed(card.suit);

  return (
    <motion.div
      key={`${card.value}${card.suit}${Date.now()}`}
      initial={flipping ? { rotateY: 90, scale: 0.8 } : false}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${w} rounded-xl bg-card border-2 ${red ? "border-red-400/30" : "border-border/30"} shadow-card-hover flex flex-col items-center justify-center relative overflow-hidden`}
    >
      {/* Top-left */}
      <span className={`absolute top-2 left-2.5 font-display text-sm font-bold ${red ? "text-red-400" : "text-foreground"}`}>
        {card.value}
      </span>
      <span className={`absolute top-5 left-2.5 text-xs ${red ? "text-red-400" : "text-foreground"}`}>
        {card.suit}
      </span>
      {/* Center */}
      <span className={`${textSize} font-display font-bold ${red ? "text-red-400" : "text-foreground"}`}>
        {card.value}
      </span>
      <span className={`${suitSize} ${red ? "text-red-400" : "text-foreground"}`}>
        {card.suit}
      </span>
      {/* Bottom-right */}
      <span className={`absolute bottom-2 right-2.5 font-display text-sm font-bold rotate-180 ${red ? "text-red-400" : "text-foreground"}`}>
        {card.value}
      </span>
    </motion.div>
  );
};

/* ── Main Component ────────────────────────────────────────────────────── */

const SnapGame = () => {
  const [deck, setDeck] = useState<Card[]>(() => createDeck());
  const [cardIndex, setCardIndex] = useState(0);
  const [prevCard, setPrevCard] = useState<Card | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [speed, setSpeed] = useState(1500);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const flipRef = useRef<ReturnType<typeof setInterval>>();

  // Timer countdown
  useEffect(() => {
    if (gameState !== "playing" || paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, paused]);

  // Auto-flip cards
  useEffect(() => {
    if (gameState !== "playing" || paused) return;
    flipRef.current = setInterval(() => {
      setCardIndex((prev) => {
        const next = prev + 1;
        if (next >= deck.length) {
          // Reshuffle
          setDeck(createDeck());
          return 0;
        }
        return next;
      });
    }, speed);
    return () => clearInterval(flipRef.current);
  }, [gameState, paused, speed, deck]);

  // Update cards when index changes
  useEffect(() => {
    if (gameState !== "playing") return;
    setPrevCard(cardIndex > 0 ? deck[cardIndex - 1] : null);
    setCurrentCard(deck[cardIndex]);
  }, [cardIndex, deck, gameState]);

  const startGame = () => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setCardIndex(0);
    setPrevCard(null);
    setCurrentCard(newDeck[0]);
    setScore(0);
    setMisses(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(60);
    setMessage(null);
    setGameState("playing");
    setPaused(false);
  };

  const handleSnap = useCallback(() => {
    if (gameState !== "playing" || paused) return;

    if (prevCard && currentCard && currentCard.value === prevCard.value) {
      const points = 10 + streak * 5;
      setScore((s) => s + points);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setMessage({ text: `SNAP! +${points}`, type: "success" });
      // Speed up slightly on success
      setSpeed((s) => Math.max(600, s - 50));
    } else {
      setMisses((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
      setStreak(0);
      setMessage({ text: "Miss! -5", type: "error" });
    }
    setTimeout(() => setMessage(null), 1000);
  }, [gameState, paused, prevCard, currentCard, streak]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (gameState === "ready" || gameState === "finished") {
          startGame();
        } else {
          handleSnap();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, handleSnap]);

  return (
    <GameLayout title="Snap">
      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        {/* Ready / Finished screen */}
        {(gameState === "ready" || gameState === "finished") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm max-w-md"
          >
            {gameState === "finished" ? (
              <>
                <span className="text-6xl block mb-4">{score >= 100 ? "\uD83C\uDF1F" : score >= 50 ? "\u2B50" : "\uD83D\uDC4D"}</span>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">Time's Up!</h2>
                <div className="grid grid-cols-3 gap-4 my-6">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-primary">{score}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-foreground">{bestStreak}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-muted-foreground">{misses}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase">Misses</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">Snap!</h2>
                <p className="text-sm font-body text-muted-foreground mb-2">Press SNAP when two consecutive cards match in value.</p>
                <p className="text-xs font-body text-muted-foreground mb-6">Build streaks for bonus points. Cards speed up as you go!</p>
              </>
            )}
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow"
            >
              {gameState === "finished" ? "Play Again" : "Start Game"}
            </button>
            <p className="text-[10px] font-body text-muted-foreground mt-3">Press Space or Enter</p>
          </motion.div>
        )}

        {/* Playing */}
        {gameState === "playing" && (
          <>
            {/* Stats bar */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-primary">{score}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Score</p>
              </div>
              <div className="text-center">
                <p className={`font-display text-2xl font-bold ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-foreground"}`}>{timeLeft}s</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Time</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl font-bold text-foreground">{streak}</p>
                <p className="text-[10px] font-body text-muted-foreground uppercase">Streak</p>
              </div>
              <button
                onClick={() => setPaused(!paused)}
                className="w-9 h-9 rounded-lg bg-secondary border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>

            {/* Cards */}
            <div className="flex items-center gap-6">
              {/* Previous Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-display text-muted-foreground uppercase">Previous</span>
                <PlayingCard card={prevCard} />
              </div>

              {/* Separator */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-muted-foreground/30 font-display text-2xl font-bold">{"\u2192"}</span>
                {prevCard && currentCard && prevCard.value === currentCard.value && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="text-xs font-display font-bold text-primary"
                  >
                    MATCH!
                  </motion.span>
                )}
              </div>

              {/* Current Card */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-display text-muted-foreground uppercase">Current</span>
                <PlayingCard card={currentCard} large flipping />
              </div>
            </div>

            {/* Message */}
            <div className="h-8">
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`text-xl font-display font-bold ${message.type === "success" ? "text-primary" : "text-destructive"}`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Snap Button */}
            {!paused && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleSnap}
                className="px-14 py-5 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-xl hover:opacity-90 transition-opacity shadow-glow flex items-center gap-3"
              >
                <Zap className="w-6 h-6" />
                SNAP!
              </motion.button>
            )}

            {paused && (
              <div className="text-center">
                <p className="font-display text-lg font-bold text-foreground mb-2">Paused</p>
                <button onClick={() => setPaused(false)} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm">Resume</button>
              </div>
            )}

            <p className="text-[10px] font-body text-muted-foreground">Press Space to snap</p>
          </>
        )}
      </div>
    </GameLayout>
  );
};

export default SnapGame;
