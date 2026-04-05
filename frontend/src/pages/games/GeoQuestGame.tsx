import { useState, useCallback, useEffect, useRef } from "react";
import GameLayout from "@/components/GameLayout";
import { countries, getRandomCountries, Country } from "@/data/trivia/countries";
import { playCorrectDing, playBuzzerWrong, playVictoryFanfare } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Landmark, MapPin, Flag, RotateCcw, Trophy, Star, Flame, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GameMode = "country" | "capitals" | "landmarks" | "continents";
type GameState = "menu" | "playing" | "feedback" | "results";

interface GeoQuestion {
  prompt: string;
  flag?: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUESTIONS_PER_ROUND = 15;
const POINTS_PER_CORRECT = 100;
const FEEDBACK_DELAY = 1500;

const ALL_CONTINENTS: Country["continent"][] = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

const MODE_CONFIG: Record<
  GameMode,
  { label: string; desc: string; icon: typeof Globe }
> = {
  country: {
    label: "Guess Country",
    desc: "Identify the nation from its flag",
    icon: Flag,
  },
  capitals: {
    label: "Capitals",
    desc: "Match countries to their capitals",
    icon: MapPin,
  },
  landmarks: {
    label: "Landmarks",
    desc: "Name the country from a landmark",
    icon: Landmark,
  },
  continents: {
    label: "Continents",
    desc: "Place countries on the right continent",
    icon: Globe,
  },
};

// ---------------------------------------------------------------------------
// Question generation helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number
): string[] {
  const filtered = pool.filter((x) => x !== correct);
  return shuffle(filtered).slice(0, count);
}

function generateQuestions(mode: GameMode): GeoQuestion[] {
  switch (mode) {
    case "country": {
      const selected = getRandomCountries(QUESTIONS_PER_ROUND);
      const allNames = countries.map((c) => c.name);
      return selected.map((c) => {
        const distractors = pickDistractors(allNames, c.name, 3);
        return {
          prompt: "Which country does this flag belong to?",
          flag: c.flag,
          correctAnswer: c.name,
          options: shuffle([c.name, ...distractors]),
          explanation: `${c.flag} is the flag of ${c.name}, located in ${c.continent}.`,
        };
      });
    }

    case "capitals": {
      const selected = getRandomCountries(QUESTIONS_PER_ROUND);
      const allCapitals = countries.map((c) => c.capital);
      return selected.map((c) => {
        const distractors = pickDistractors(allCapitals, c.capital, 3);
        return {
          prompt: `What is the capital of ${c.name}?`,
          flag: c.flag,
          correctAnswer: c.capital,
          options: shuffle([c.capital, ...distractors]),
          explanation: `${c.capital} is the capital of ${c.name}.`,
        };
      });
    }

    case "landmarks": {
      const withLandmarks = countries.filter(
        (c) => c.landmarks && c.landmarks.length > 0
      );
      const selected = shuffle(withLandmarks).slice(0, QUESTIONS_PER_ROUND);
      const allNames = countries.map((c) => c.name);
      return selected.map((c) => {
        const landmark =
          c.landmarks![Math.floor(Math.random() * c.landmarks!.length)];
        const distractors = pickDistractors(allNames, c.name, 3);
        return {
          prompt: `Which country is home to "${landmark}"?`,
          flag: c.flag,
          correctAnswer: c.name,
          options: shuffle([c.name, ...distractors]),
          explanation: `${landmark} is located in ${c.name} ${c.flag}.`,
        };
      });
    }

    case "continents": {
      const selected = getRandomCountries(QUESTIONS_PER_ROUND);
      return selected.map((c) => {
        const distractors = pickDistractors(
          ALL_CONTINENTS,
          c.continent,
          3
        );
        return {
          prompt: `Which continent is ${c.name} in?`,
          flag: c.flag,
          correctAnswer: c.continent,
          options: shuffle([c.continent, ...distractors]),
          explanation: `${c.name} ${c.flag} is located in ${c.continent}.`,
        };
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ScorePopup = ({ points }: { points: number }) => (
  <motion.span
    initial={{ opacity: 1, y: 0, scale: 1 }}
    animate={{ opacity: 0, y: -40, scale: 1.4 }}
    transition={{ duration: 0.8 }}
    className="absolute -top-2 right-0 font-display text-sm font-bold text-primary pointer-events-none"
  >
    +{points}
  </motion.span>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const GeoQuestGame = () => {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [mode, setMode] = useState<GameMode>("country");
  const [questions, setQuestions] = useState<GeoQuestion[]>([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const currentQuestion = questions[questionIdx] as GeoQuestion | undefined;

  const startGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    const q = generateQuestions(selectedMode);
    setQuestions(q);
    setQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setGameState("playing");
  }, []);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (gameState !== "playing" || !currentQuestion) return;
      setSelectedAnswer(answer);
      setGameState("feedback");

      const isCorrect = answer === currentQuestion.correctAnswer;
      if (isCorrect) {
        playCorrectDing();
        setScore((s) => s + POINTS_PER_CORRECT);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setCorrectCount((c) => c + 1);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 800);
      } else {
        playBuzzerWrong();
        setStreak(0);
      }

      feedbackTimer.current = setTimeout(() => {
        if (questionIdx + 1 >= questions.length) {
          if (isCorrect) {
            // small delay so victory doesn't overlap with ding
            setTimeout(() => playVictoryFanfare(), 200);
          }
          setGameState("results");
        } else {
          setQuestionIdx((i) => i + 1);
          setSelectedAnswer(null);
          setGameState("playing");
        }
      }, FEEDBACK_DELAY);
    },
    [gameState, currentQuestion, questionIdx, questions.length]
  );

  const goToMenu = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setGameState("menu");
    setSelectedAnswer(null);
  }, []);

  // -------------------------------------------------------------------------
  // Render: Menu
  // -------------------------------------------------------------------------

  if (gameState === "menu") {
    return (
      <GameLayout title="GeoQuest">
        <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-md aspect-[4/3] rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shadow-glow">
                <Globe className="w-14 h-14 text-primary" />
              </div>
              <p className="font-display text-lg font-bold text-foreground">
                GeoQuest
              </p>
              <p className="font-body text-sm text-muted-foreground text-center max-w-xs">
                Test your geography knowledge across {countries.length} countries.
                Choose a mode to begin.
              </p>
            </div>
          </motion.div>

          {/* Mode cards */}
          <div className="w-full max-w-lg grid grid-cols-2 gap-3">
            {(Object.keys(MODE_CONFIG) as GameMode[]).map((m, i) => {
              const cfg = MODE_CONFIG[m];
              const Icon = cfg.icon;
              return (
                <motion.button
                  key={m}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => startGame(m)}
                  className="group flex flex-col gap-2 p-4 rounded-xl bg-secondary/50 border border-border/30 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cfg.label}
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground">
                      {cfg.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-auto">
                    <span className="text-[10px] font-body text-primary/70 group-hover:text-primary transition-colors">
                      Play now
                    </span>
                    <ChevronRight className="w-3 h-3 text-primary/50 group-hover:text-primary transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </GameLayout>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Playing / Feedback
  // -------------------------------------------------------------------------

  if ((gameState === "playing" || gameState === "feedback") && currentQuestion) {
    const progress = ((questionIdx + 1) / questions.length) * 100;
    const isFeedback = gameState === "feedback";

    return (
      <GameLayout title="GeoQuest">
        <div className="flex flex-col h-full">
          {/* Top stats bar */}
          <div className="px-4 py-3 border-b border-border/20 bg-card/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-display text-xs font-semibold text-muted-foreground">
                {questionIdx + 1}{" "}
                <span className="text-muted-foreground/50">/</span>{" "}
                {questions.length}
              </span>
              <div className="w-24 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {streak > 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-display text-xs font-bold text-orange-400">
                    {streak}
                  </span>
                </motion.div>
              )}
              <div className="relative flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="font-display text-sm font-bold text-foreground">
                  {score}
                </span>
                <AnimatePresence>
                  {showPopup && <ScorePopup points={POINTS_PER_CORRECT} />}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Question area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={questionIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-5 w-full max-w-lg"
              >
                {/* Flag display for country mode */}
                {currentQuestion.flag && mode === "country" && (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-6xl select-none"
                  >
                    {currentQuestion.flag}
                  </motion.div>
                )}

                {/* Question text */}
                <h2 className="font-display text-lg sm:text-xl font-bold text-foreground text-center leading-snug">
                  {currentQuestion.prompt}
                </h2>

                {/* Answer buttons */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === currentQuestion.correctAnswer;

                    let btnClass =
                      "bg-secondary/50 border border-border/30 hover:border-primary/40 hover:bg-secondary/70";
                    if (isFeedback) {
                      if (isCorrect) {
                        btnClass =
                          "bg-emerald-500/15 border-2 border-emerald-400/60 text-emerald-300";
                      } else if (isSelected && !isCorrect) {
                        btnClass =
                          "bg-red-500/15 border-2 border-red-400/60 text-red-300";
                      } else {
                        btnClass =
                          "bg-secondary/30 border border-border/20 opacity-50";
                      }
                    }

                    return (
                      <motion.button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={isFeedback}
                        animate={
                          isFeedback && isSelected && isCorrect
                            ? { scale: [1, 1.04, 1] }
                            : isFeedback && isSelected && !isCorrect
                            ? { x: [0, -6, 6, -4, 4, 0] }
                            : {}
                        }
                        transition={{ duration: 0.4 }}
                        className={`px-4 py-3 rounded-xl font-body text-sm font-medium text-foreground transition-all duration-200 cursor-pointer disabled:cursor-default ${btnClass}`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback explanation */}
                <AnimatePresence>
                  {isFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full text-center px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/15"
                    >
                      <p className="font-body text-xs text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mode label */}
          <div className="px-4 py-2 border-t border-border/20 flex items-center justify-between shrink-0">
            <span className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">
              {MODE_CONFIG[mode].label}
            </span>
            <button
              onClick={goToMenu}
              className="font-body text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Quit
            </button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Results
  // -------------------------------------------------------------------------

  const accuracy = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const grade =
    accuracy >= 90
      ? { label: "Geography Master", color: "text-primary" }
      : accuracy >= 70
      ? { label: "World Traveler", color: "text-emerald-400" }
      : accuracy >= 50
      ? { label: "Explorer", color: "text-blue-400" }
      : { label: "Tourist", color: "text-muted-foreground" };

  return (
    <GameLayout title="GeoQuest">
      <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md flex flex-col items-center gap-6"
        >
          {/* Trophy */}
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary" />
          </div>

          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Round Complete
            </h2>
            <p className={`font-display text-sm font-semibold mt-1 ${grade.color}`}>
              {grade.label}
            </p>
          </div>

          {/* Stats grid */}
          <div className="w-full grid grid-cols-2 gap-3">
            {[
              { label: "Score", value: score.toLocaleString(), icon: Star },
              { label: "Accuracy", value: `${accuracy}%`, icon: Flag },
              {
                label: "Correct",
                value: `${correctCount} / ${questions.length}`,
                icon: Globe,
              },
              {
                label: "Best Streak",
                value: bestStreak.toString(),
                icon: Flame,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary/50 border border-border/30"
              >
                <stat.icon className="w-4 h-4 text-primary mb-0.5" />
                <span className="font-display text-lg font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startGame(mode)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 font-display text-sm font-semibold text-primary hover:bg-primary/25 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </motion.button>
            <button
              onClick={goToMenu}
              className="w-full px-4 py-3 rounded-xl bg-secondary/40 border border-border/30 font-display text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
            >
              Change Mode
            </button>
          </div>
        </motion.div>
      </div>
    </GameLayout>
  );
};

export default GeoQuestGame;
