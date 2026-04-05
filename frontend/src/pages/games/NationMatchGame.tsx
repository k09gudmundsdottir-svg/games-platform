import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import GameLayout from "@/components/GameLayout";
import {
  playCorrectDing,
  playBuzzerWrong,
  playVictoryFanfare,
  playPiecePlace,
} from "@/lib/sounds";
import { getRandomCountries, Country } from "@/data/trivia/countries";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, XCircle, CheckCircle2, RotateCcw, Trophy, Zap, Flag } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type GamePhase = "setup" | "playing" | "results";
type Difficulty = "easy" | "medium" | "hard";

interface CardItem {
  id: string;
  countryName: string;
  type: "flag" | "name";
  label: string;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; label: string; baseScore: number }> = {
  easy: { pairs: 6, label: "Easy", baseScore: 1000 },
  medium: { pairs: 9, label: "Medium", baseScore: 2000 },
  hard: { pairs: 12, label: "Hard", baseScore: 3000 },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function NationMatchGame() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Game state
  const [flagCards, setFlagCards] = useState<CardItem[]>([]);
  const [nameCards, setNameCards] = useState<CardItem[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wrongPair, setWrongPair] = useState<{ flag: string; name: string } | null>(null);
  const [correctPair, setCorrectPair] = useState<{ flag: string; name: string } | null>(null);
  const [score, setScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalPairs = DIFFICULTY_CONFIG[difficulty].pairs;

  // ─── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ─── Start Game ─────────────────────────────────────────────────────────────

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      const config = DIFFICULTY_CONFIG[diff];
      const countries = getRandomCountries(config.pairs);

      const flags: CardItem[] = countries.map((c) => ({
        id: `flag-${c.name}`,
        countryName: c.name,
        type: "flag",
        label: c.flag,
      }));

      const names: CardItem[] = countries.map((c) => ({
        id: `name-${c.name}`,
        countryName: c.name,
        type: "name",
        label: c.name,
      }));

      setFlagCards(shuffle(flags));
      setNameCards(shuffle(names));
      setSelectedFlag(null);
      setSelectedName(null);
      setMatchedPairs(new Set());
      setMistakes(0);
      setElapsed(0);
      setWrongPair(null);
      setCorrectPair(null);
      setScore(0);
      setPhase("playing");
      playPiecePlace();
    },
    []
  );

  // ─── Check Match ────────────────────────────────────────────────────────────

  const checkMatch = useCallback(
    (flagId: string, nameId: string) => {
      const flag = flagCards.find((c) => c.id === flagId);
      const name = nameCards.find((c) => c.id === nameId);
      if (!flag || !name) return;

      if (flag.countryName === name.countryName) {
        // Correct match
        playCorrectDing();
        setCorrectPair({ flag: flagId, name: nameId });

        setTimeout(() => {
          setMatchedPairs((prev) => {
            const next = new Set(prev);
            next.add(flag.countryName);
            // Check if game is complete
            if (next.size === totalPairs) {
              if (timerRef.current) clearInterval(timerRef.current);
              const config = DIFFICULTY_CONFIG[difficulty];
              const finalScore = Math.max(
                0,
                config.baseScore - elapsed * 10 - mistakes * 100
              );
              setScore(finalScore);
              setTimeout(() => {
                playVictoryFanfare();
                setPhase("results");
              }, 400);
            }
            return next;
          });
          setCorrectPair(null);
          setSelectedFlag(null);
          setSelectedName(null);
        }, 500);
      } else {
        // Wrong match
        playBuzzerWrong();
        setMistakes((prev) => prev + 1);
        setWrongPair({ flag: flagId, name: nameId });

        setTimeout(() => {
          setWrongPair(null);
          setSelectedFlag(null);
          setSelectedName(null);
        }, 600);
      }
    },
    [flagCards, nameCards, totalPairs, difficulty, elapsed, mistakes]
  );

  // ─── Card Selection ─────────────────────────────────────────────────────────

  const handleFlagClick = useCallback(
    (id: string, countryName: string) => {
      if (matchedPairs.has(countryName) || wrongPair || correctPair) return;

      if (selectedFlag === id) {
        setSelectedFlag(null);
        return;
      }

      setSelectedFlag(id);
      playPiecePlace();

      if (selectedName) {
        checkMatch(id, selectedName);
      }
    },
    [selectedFlag, selectedName, matchedPairs, wrongPair, correctPair, checkMatch]
  );

  const handleNameClick = useCallback(
    (id: string, countryName: string) => {
      if (matchedPairs.has(countryName) || wrongPair || correctPair) return;

      if (selectedName === id) {
        setSelectedName(null);
        return;
      }

      setSelectedName(id);
      playPiecePlace();

      if (selectedFlag) {
        checkMatch(selectedFlag, id);
      }
    },
    [selectedFlag, selectedName, matchedPairs, wrongPair, correctPair, checkMatch]
  );

  // ─── Card State Helper ──────────────────────────────────────────────────────

  const getCardState = (
    id: string,
    countryName: string,
    type: "flag" | "name"
  ): "default" | "selected" | "correct" | "wrong" | "matched" => {
    if (matchedPairs.has(countryName)) return "matched";
    if (correctPair && (correctPair.flag === id || correctPair.name === id))
      return "correct";
    if (wrongPair && (wrongPair.flag === id || wrongPair.name === id))
      return "wrong";
    if (type === "flag" && selectedFlag === id) return "selected";
    if (type === "name" && selectedName === id) return "selected";
    return "default";
  };

  // ─── Renders ────────────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <GameLayout title="Nation Match" isSkillGame>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flag className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Nation Match
              </h1>
            </div>
            <p className="font-body text-muted-foreground text-base max-w-md mx-auto">
              Match each flag to its country name. Be quick and accurate for the best score!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {(["easy", "medium", "hard"] as Difficulty[]).map((diff, i) => {
              const config = DIFFICULTY_CONFIG[diff];
              return (
                <motion.button
                  key={diff}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(diff)}
                  className={`
                    flex flex-col items-center gap-2 px-8 py-6 rounded-2xl border transition-colors cursor-pointer
                    ${
                      diff === "easy"
                        ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60"
                        : diff === "medium"
                        ? "bg-primary/10 border-primary/30 hover:border-primary/60"
                        : "bg-red-500/10 border-red-500/30 hover:border-red-500/60"
                    }
                  `}
                >
                  <span className="font-display text-lg font-bold text-foreground">
                    {config.label}
                  </span>
                  <span className="font-body text-sm text-muted-foreground">
                    {config.pairs} pairs
                  </span>
                  <span className="font-body text-xs text-muted-foreground/70">
                    Base: {config.baseScore} pts
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-secondary/50 border border-border/30 rounded-xl px-6 py-4 max-w-sm text-center"
          >
            <p className="font-body text-sm text-muted-foreground">
              <span className="text-primary font-semibold">Tip:</span> Tap a flag, then tap the matching country name. Faster matches earn higher scores!
            </p>
          </motion.div>
        </div>
      </GameLayout>
    );
  }

  if (phase === "results") {
    const config = DIFFICULTY_CONFIG[difficulty];
    const timePenalty = elapsed * 10;
    const mistakePenalty = mistakes * 100;

    return (
      <GameLayout title="Nation Match" isSkillGame>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Trophy className="w-16 h-16 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold text-foreground"
          >
            All Matched!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-secondary/50 border border-border/30 rounded-2xl p-6 w-full max-w-sm space-y-4"
          >
            <div className="text-center">
              <p className="font-body text-sm text-muted-foreground mb-1">Final Score</p>
              <p className="font-display text-5xl font-bold text-primary">{score}</p>
            </div>

            <div className="h-px bg-border/30" />

            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Difficulty</span>
                <span className="text-foreground font-semibold">{config.label} ({config.pairs} pairs)</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Base Score</span>
                <span className="text-foreground">+{config.baseScore}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Time ({formatTime(elapsed)})</span>
                <span className="text-red-400">-{timePenalty}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Mistakes ({mistakes})</span>
                <span className="text-red-400">-{mistakePenalty}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(difficulty)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 font-display font-semibold text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase("setup")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/50 border border-border/30 hover:border-border/60 font-display font-semibold text-foreground transition-colors cursor-pointer"
            >
              Change Difficulty
            </motion.button>
          </motion.div>
        </div>
      </GameLayout>
    );
  }

  // ─── Playing Phase ────────────────────────────────────────────────────────────

  return (
    <GameLayout title="Nation Match" isSkillGame>
      <div className="flex flex-col gap-4 px-2 sm:px-4 pb-6 max-w-4xl mx-auto w-full">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-secondary/50 border border-border/30 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-bold text-foreground">
              {formatTime(elapsed)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-display text-sm font-bold text-foreground">
              {matchedPairs.size}/{totalPairs}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="font-display text-sm font-bold text-foreground">
              {mistakes}
            </span>
          </div>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-6">
          {/* Flags Column */}
          <div className="space-y-2">
            <p className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Flags
            </p>
            <AnimatePresence>
              {flagCards.map((card) => {
                const state = getCardState(card.id, card.countryName, "flag");
                if (state === "matched") {
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0, opacity: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="h-0 overflow-hidden"
                    />
                  );
                }
                return (
                  <motion.button
                    key={card.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: state === "selected" ? 1.03 : 1,
                    }}
                    whileHover={{ scale: state === "selected" ? 1.03 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleFlagClick(card.id, card.countryName)}
                    className={`
                      w-full flex items-center justify-center py-4 rounded-xl border transition-all duration-200 cursor-pointer
                      ${
                        state === "selected"
                          ? "border-primary shadow-[0_0_12px_hsl(38,90%,55%/0.3)] bg-primary/10"
                          : state === "correct"
                          ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                          : state === "wrong"
                          ? "border-red-400 bg-red-500/20 animate-[shake_0.4s_ease-in-out]"
                          : "bg-secondary/50 border-border/30 hover:border-border/60"
                      }
                    `}
                  >
                    <span className="text-3xl select-none">{card.label}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Names Column */}
          <div className="space-y-2">
            <p className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Countries
            </p>
            <AnimatePresence>
              {nameCards.map((card) => {
                const state = getCardState(card.id, card.countryName, "name");
                if (state === "matched") {
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0, opacity: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="h-0 overflow-hidden"
                    />
                  );
                }
                return (
                  <motion.button
                    key={card.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: state === "selected" ? 1.03 : 1,
                    }}
                    whileHover={{ scale: state === "selected" ? 1.03 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleNameClick(card.id, card.countryName)}
                    className={`
                      w-full flex items-center justify-center py-4 rounded-xl border transition-all duration-200 cursor-pointer
                      ${
                        state === "selected"
                          ? "border-primary shadow-[0_0_12px_hsl(38,90%,55%/0.3)] bg-primary/10"
                          : state === "correct"
                          ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                          : state === "wrong"
                          ? "border-red-400 bg-red-500/20 animate-[shake_0.4s_ease-in-out]"
                          : "bg-secondary/50 border-border/30 hover:border-border/60"
                      }
                    `}
                  >
                    <span className="font-body text-sm sm:text-base font-medium text-foreground select-none">
                      {card.label}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Shake keyframes injected via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </GameLayout>
  );
}
