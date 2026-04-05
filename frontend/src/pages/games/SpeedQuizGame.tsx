import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import {
  playCorrectDing,
  playBuzzerWrong,
  playVictoryFanfare,
  playTickTock,
  playCountdownBeep,
} from "@/lib/sounds";
import { getQuestions, TriviaQuestion, TriviaCategory } from "@/data/trivia/questions";
import { useTriviaTimer } from "@/hooks/useTriviaTimer";
import {
  Zap,
  Trophy,
  Target,
  Clock,
  Flame,
  RotateCcw,
  ChevronRight,
  Brain,
  Star,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type GamePhase = "setup" | "countdown" | "playing" | "feedback" | "results";

type Difficulty = "Easy" | "Medium" | "Hard";

const DIFFICULTY_TIME: Record<Difficulty, number> = {
  Easy: 15,
  Medium: 10,
  Hard: 7,
};

const TOTAL_QUESTIONS = 15;

const CATEGORIES: (TriviaCategory | "All")[] = [
  "All",
  "Geography",
  "History",
  "Science",
  "Sports",
  "Entertainment",
  "General",
];

const CATEGORY_ICONS: Record<string, string> = {
  All: "🌍",
  Geography: "🗺️",
  History: "📜",
  Science: "🔬",
  Sports: "⚽",
  Entertainment: "🎬",
  General: "💡",
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 8) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

// ---------------------------------------------------------------------------
// Floating score pop component
// ---------------------------------------------------------------------------

interface FloatingScoreProps {
  points: number;
  multiplier: number;
  id: number;
}

const FloatingScore = ({ points, multiplier }: FloatingScoreProps) => (
  <motion.div
    initial={{ opacity: 1, y: 0, scale: 0.5 }}
    animate={{ opacity: 0, y: -60, scale: 1.2 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.9, ease: "easeOut" }}
    className="absolute top-0 right-4 pointer-events-none z-30"
  >
    <span className="font-display text-2xl font-bold text-primary drop-shadow-lg">
      +{points}
      {multiplier > 1 && (
        <span className="text-amber-400 text-lg ml-1">x{multiplier}</span>
      )}
    </span>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Circular timer ring
// ---------------------------------------------------------------------------

interface TimerRingProps {
  percent: number; // 0..1
  timeLeft: number;
  totalTime: number;
}

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const TimerRing = ({ percent, timeLeft, totalTime }: TimerRingProps) => {
  const offset = RING_CIRCUMFERENCE * (1 - percent);
  const fraction = timeLeft / totalTime;

  let strokeColor = "stroke-primary"; // gold
  if (fraction < 0.2) strokeColor = "stroke-red-500";
  else if (fraction < 0.4) strokeColor = "stroke-amber-500";

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* track */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          className="stroke-secondary/40"
          strokeWidth="8"
        />
        {/* progress */}
        <motion.circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          className={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display text-3xl font-bold ${
            fraction < 0.2
              ? "text-red-400"
              : fraction < 0.4
              ? "text-amber-400"
              : "text-primary"
          }`}
        >
          {Math.ceil(timeLeft)}
        </span>
        <span className="text-[10px] font-body text-muted-foreground uppercase tracking-wider">
          seconds
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Setup screen
// ---------------------------------------------------------------------------

interface SetupProps {
  onStart: (cat: TriviaCategory | "All", diff: Difficulty) => void;
}

const SetupScreen = ({ onStart }: SetupProps) => {
  const [category, setCategory] = useState<TriviaCategory | "All">("All");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full gap-8 px-4"
    >
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          <h1 className="font-display text-4xl font-bold text-foreground">
            Speed Quiz
          </h1>
        </div>
        <p className="font-body text-muted-foreground text-sm max-w-sm">
          Answer {TOTAL_QUESTIONS} questions as fast as you can. Faster answers earn
          more points. Build streaks for multipliers!
        </p>
      </div>

      {/* Category */}
      <div className="w-full max-w-md space-y-2">
        <label className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Category
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2.5 rounded-xl text-xs font-display font-semibold transition-all border ${
                category === cat
                  ? "bg-primary/15 border-primary/40 text-primary shadow-sm"
                  : "bg-secondary/50 border-border/30 text-muted-foreground hover:border-primary/20 hover:text-foreground"
              }`}
            >
              <span className="block text-base mb-0.5">
                {CATEGORY_ICONS[cat]}
              </span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="w-full max-w-md space-y-2">
        <label className="font-display text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Difficulty
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-4 py-3 rounded-xl font-display font-semibold transition-all border ${
                difficulty === diff
                  ? "bg-primary/15 border-primary/40 text-primary shadow-sm"
                  : "bg-secondary/50 border-border/30 text-muted-foreground hover:border-primary/20 hover:text-foreground"
              }`}
            >
              <span className="block text-sm">{diff}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5">
                {DIFFICULTY_TIME[diff]}s / question
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Start */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onStart(category, difficulty)}
        className="px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-display text-lg font-bold shadow-lg hover:shadow-primary/30 transition-shadow"
      >
        Start Quiz
        <ChevronRight className="inline-block w-5 h-5 ml-1 -mt-0.5" />
      </motion.button>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Countdown overlay
// ---------------------------------------------------------------------------

interface CountdownOverlayProps {
  value: number | "GO!";
}

const CountdownOverlay = ({ value }: CountdownOverlayProps) => (
  <motion.div
    key={String(value)}
    initial={{ scale: 0.3, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 2, opacity: 0 }}
    transition={{ duration: 0.45 }}
    className="flex items-center justify-center h-full"
  >
    <span className="font-display text-8xl font-black text-primary drop-shadow-2xl">
      {value}
    </span>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Results screen
// ---------------------------------------------------------------------------

interface ResultsProps {
  score: number;
  correct: number;
  total: number;
  avgTime: number;
  bestStreak: number;
  onPlayAgain: () => void;
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.15, duration: 0.4 },
  }),
};

const ResultsScreen = ({
  score,
  correct,
  total,
  avgTime,
  bestStreak,
  onPlayAgain,
}: ResultsProps) => {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  useEffect(() => {
    playVictoryFanfare();
  }, []);

  const stats = [
    { icon: <Trophy className="w-5 h-5 text-primary" />, label: "Score", value: score.toLocaleString() },
    { icon: <Target className="w-5 h-5 text-emerald-400" />, label: "Accuracy", value: `${accuracy}%` },
    { icon: <Clock className="w-5 h-5 text-sky-400" />, label: "Avg Time", value: `${avgTime.toFixed(1)}s` },
    { icon: <Flame className="w-5 h-5 text-amber-400" />, label: "Best Streak", value: String(bestStreak) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full gap-8 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="text-center"
      >
        <Star className="w-12 h-12 text-primary mx-auto mb-2" />
        <h2 className="font-display text-3xl font-bold text-foreground">
          Quiz Complete!
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          {correct}/{total} correct answers
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            variants={statVariants}
            initial="hidden"
            animate="visible"
            className="bg-secondary/50 border border-border/30 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {s.icon}
              <span className="text-xs font-body text-muted-foreground">
                {s.label}
              </span>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              {s.value}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 1 } }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onPlayAgain}
        className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg hover:shadow-primary/30 transition-shadow flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Play Again
      </motion.button>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main game component
// ---------------------------------------------------------------------------

const SpeedQuizGame = () => {
  // -- game state --
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScoreProps[]>([]);
  const [countdownVal, setCountdownVal] = useState<number | "GO!">(3);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const floatingIdRef = useRef(0);
  const tickPlayedRef = useRef(false);
  const questionStartRef = useRef(0);

  const totalTime = DIFFICULTY_TIME[difficulty];

  // -- timer --
  const handleExpire = useCallback(() => {
    // time ran out — wrong answer
    if (phase !== "playing") return;
    playBuzzerWrong();
    setIsCorrect(false);
    setSelectedAnswer(-1); // sentinel for "no answer"
    setStreak(0);
    setPhase("feedback");
    setTimeout(() => advanceQuestion(), 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const { timeLeft, isRunning, start, reset } = useTriviaTimer(
    totalTime,
    handleExpire
  );

  // Play tick-tock sound when under 3s
  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft <= 3 && timeLeft > 0 && phase === "playing") {
      if (!tickPlayedRef.current) {
        playTickTock();
        tickPlayedRef.current = true;
      }
      // re-enable after each full second boundary
      const sec = Math.ceil(timeLeft);
      const id = setTimeout(() => {
        tickPlayedRef.current = false;
      }, 900);
      return () => clearTimeout(id);
    } else {
      tickPlayedRef.current = false;
    }
  }, [timeLeft, isRunning, phase]);

  // -- start game --
  const handleStart = (cat: TriviaCategory | "All", diff: Difficulty) => {
    const q = getQuestions(TOTAL_QUESTIONS, cat);
    setQuestions(q);
    setDifficulty(diff);
    setCurrentIdx(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setTotalTimeSpent(0);
    setFloatingScores([]);
    setPhase("countdown");
    runCountdown(diff);
  };

  const runCountdown = (diff: Difficulty) => {
    const steps: (number | "GO!")[] = [3, 2, 1, "GO!"];
    steps.forEach((val, i) => {
      setTimeout(() => {
        setCountdownVal(val);
        playCountdownBeep();
        if (val === "GO!") {
          setTimeout(() => {
            setPhase("playing");
            reset(DIFFICULTY_TIME[diff]);
            setTimeout(() => {
              start();
              questionStartRef.current = Date.now();
            }, 10);
          }, 400);
        }
      }, i * 700);
    });
  };

  // -- answer a question --
  const handleAnswer = (answerIdx: number) => {
    if (phase !== "playing" || selectedAnswer !== null) return;

    const q = questions[currentIdx];
    const correct = answerIdx === q.correctIndex;
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    setTotalTimeSpent((prev) => prev + elapsed);

    setSelectedAnswer(answerIdx);
    setIsCorrect(correct);

    if (correct) {
      playCorrectDing();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));

      const mult = getStreakMultiplier(newStreak);
      const basePoints = Math.round(100 * (timeLeft / totalTime));
      const points = Math.round(basePoints * mult);

      setScore((prev) => prev + points);
      setCorrectCount((prev) => prev + 1);

      // floating score
      const fid = ++floatingIdRef.current;
      setFloatingScores((prev) => [
        ...prev,
        { points, multiplier: mult, id: fid },
      ]);
      setTimeout(() => {
        setFloatingScores((prev) => prev.filter((f) => f.id !== fid));
      }, 1000);
    } else {
      playBuzzerWrong();
      setStreak(0);
    }

    setPhase("feedback");
    setTimeout(() => advanceQuestion(), 1200);
  };

  // -- advance to next question --
  const advanceQuestion = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setPhase("results");
      return;
    }
    setCurrentIdx(nextIdx);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setPhase("playing");
    reset(totalTime);
    setTimeout(() => {
      start();
      questionStartRef.current = Date.now();
    }, 10);
  };

  // -- play again --
  const handlePlayAgain = () => {
    setPhase("setup");
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  // -- derived --
  const currentQuestion = questions[currentIdx] as TriviaQuestion | undefined;
  const streakMultiplier = getStreakMultiplier(streak);
  const avgTime =
    correctCount + (questions.length - correctCount) > 0
      ? totalTimeSpent / Math.min(currentIdx + 1, questions.length)
      : 0;

  // -- render --
  return (
    <GameLayout title="Speed Quiz" isSkillGame>
      <div className="relative flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ---- SETUP ---- */}
          {phase === "setup" && (
            <SetupScreen key="setup" onStart={handleStart} />
          )}

          {/* ---- COUNTDOWN ---- */}
          {phase === "countdown" && (
            <CountdownOverlay key="countdown" value={countdownVal} />
          )}

          {/* ---- PLAYING / FEEDBACK ---- */}
          {(phase === "playing" || phase === "feedback") && currentQuestion && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Top bar: score, streak, question counter */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-4">
                  {/* Score */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-primary" />
                      <motion.span
                        key={score}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        className="font-display text-sm font-bold text-foreground"
                      >
                        {score.toLocaleString()}
                      </motion.span>
                    </div>
                    <AnimatePresence>
                      {floatingScores.map((f) => (
                        <FloatingScore key={f.id} {...f} />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Streak */}
                  {streak > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <span className="text-sm">🔥</span>
                      <span className="font-display text-xs font-bold text-amber-400">
                        {streak} streak
                      </span>
                      {streakMultiplier > 1 && (
                        <span className="font-display text-[10px] font-bold text-amber-300 ml-1">
                          x{streakMultiplier}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Question counter */}
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  <span className="font-display text-sm font-semibold text-muted-foreground">
                    {currentIdx + 1}/{questions.length}
                  </span>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
                {/* Timer ring */}
                <TimerRing
                  percent={timeLeft / totalTime}
                  timeLeft={timeLeft}
                  totalTime={totalTime}
                />

                {/* Category badge */}
                <span className="px-3 py-1 rounded-full bg-secondary/60 border border-border/30 text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">
                  {CATEGORY_ICONS[currentQuestion.category]}{" "}
                  {currentQuestion.category}
                </span>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-xl md:text-2xl font-bold text-foreground text-center max-w-lg leading-snug"
                  >
                    {currentQuestion.question}
                  </motion.h2>
                </AnimatePresence>

                {/* Answer buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {currentQuestion.answers.map((answer, idx) => {
                    let btnClass =
                      "bg-secondary/50 border-border/30 text-foreground hover:border-primary/40 hover:bg-primary/5";

                    if (phase === "feedback") {
                      if (idx === currentQuestion.correctIndex) {
                        btnClass =
                          "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
                      } else if (
                        idx === selectedAnswer &&
                        idx !== currentQuestion.correctIndex
                      ) {
                        btnClass =
                          "bg-red-500/15 border-red-500/40 text-red-300";
                      } else {
                        btnClass =
                          "bg-secondary/30 border-border/20 text-muted-foreground opacity-50";
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, duration: 0.2 }}
                        onClick={() => handleAnswer(idx)}
                        disabled={phase === "feedback"}
                        className={`px-4 py-3.5 rounded-xl border font-body text-sm font-medium transition-all ${btnClass}`}
                      >
                        <span className="font-display text-xs text-muted-foreground mr-2">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {answer}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback text */}
                <AnimatePresence>
                  {phase === "feedback" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`font-display text-sm font-semibold ${
                        isCorrect ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isCorrect
                        ? "Correct!"
                        : `Wrong! Answer: ${
                            currentQuestion.answers[
                              currentQuestion.correctIndex
                            ]
                          }`}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress bar at bottom */}
              <div className="h-1 bg-secondary/30">
                <motion.div
                  className="h-full bg-primary/60"
                  initial={false}
                  animate={{
                    width: `${
                      ((currentIdx + (phase === "feedback" ? 1 : 0)) /
                        questions.length) *
                      100
                    }%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* ---- RESULTS ---- */}
          {phase === "results" && (
            <ResultsScreen
              key="results"
              score={score}
              correct={correctCount}
              total={questions.length}
              avgTime={avgTime}
              bestStreak={bestStreak}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default SpeedQuizGame;
