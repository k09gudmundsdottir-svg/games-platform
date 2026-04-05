import { useState, useEffect, useCallback, useRef } from "react";
import GameLayout from "@/components/GameLayout";
import {
  playCorrectDing,
  playBuzzerWrong,
  playVictoryFanfare,
  playCountdownBeep,
} from "@/lib/sounds";
import { getQuestions, TriviaQuestion } from "@/data/trivia/questions";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bot,
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Swords,
  Brain,
  Star,
  ChevronRight,
  RotateCcw,
  Target,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type GamePhase =
  | "setup"
  | "question"
  | "answering"
  | "ai_thinking"
  | "reveal"
  | "results";

type Difficulty = "easy" | "medium" | "hard";

interface RoundResult {
  question: TriviaQuestion;
  playerAnswer: string | null;
  aiAnswer: string;
  playerCorrect: boolean;
  aiCorrect: boolean;
  playerScore: number;
  aiScore: number;
  timeLeft: number;
}

const AI_NAMES = [
  "Dr. Quiz",
  "BrainBot",
  "Trivia Titan",
  "The Professor",
  "Quiz Master",
  "Nerd King",
];

const AI_ACCURACY: Record<Difficulty, number> = {
  easy: 0.5,
  medium: 0.7,
  hard: 0.85,
};

const TOTAL_QUESTIONS = 10;
const TIMER_SECONDS = 12;
const BASE_SCORE = 100;
const MAX_TIME_BONUS = 50;
const REVEAL_DURATION = 2000;

// ─── Confetti Particle ──────────────────────────────────────────────────────────

const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-sm"
    style={{ backgroundColor: color }}
    initial={{
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
    }}
    animate={{
      x: (Math.random() - 0.5) * 400,
      y: Math.random() * -300 - 50,
      rotate: Math.random() * 720 - 360,
      opacity: 0,
      scale: Math.random() * 0.5 + 0.5,
    }}
    transition={{
      duration: 2 + Math.random(),
      delay,
      ease: "easeOut",
    }}
  />
);

const Confetti = () => {
  const colors = [
    "#FFD700",
    "#FFA500",
    "#FF6347",
    "#7B68EE",
    "#00CED1",
    "#FF69B4",
    "#32CD32",
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiParticle
          key={i}
          delay={i * 0.03}
          color={colors[i % colors.length]}
        />
      ))}
    </div>
  );
};

// ─── Score Bar ──────────────────────────────────────────────────────────────────

const ScoreBar = ({
  playerScore,
  aiScore,
}: {
  playerScore: number;
  aiScore: number;
}) => {
  const total = playerScore + aiScore || 1;
  const playerPct = Math.round((playerScore / total) * 100);
  const aiPct = 100 - playerPct;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-[10px] font-display font-bold mb-1">
        <span className="text-amber-400">{playerScore}</span>
        <span className="text-slate-400">{aiScore}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary/50 border border-border/20 overflow-hidden flex">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full"
          initial={{ width: "50%" }}
          animate={{ width: `${playerPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-r-full"
          initial={{ width: "50%" }}
          animate={{ width: `${aiPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Player Card (Top Header) ───────────────────────────────────────────────────

const PlayerHeader = ({
  name,
  score,
  isAI,
  isCorrect,
  showResult,
  isThinking,
}: {
  name: string;
  score: number;
  isAI: boolean;
  isCorrect?: boolean;
  showResult: boolean;
  isThinking?: boolean;
}) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="relative">
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
          isAI
            ? "bg-slate-800/60 border-slate-500/50"
            : "bg-amber-900/30 border-amber-500/50"
        } ${
          showResult && isCorrect !== undefined
            ? isCorrect
              ? "!border-emerald-400 !bg-emerald-500/10"
              : "!border-red-400 !bg-red-500/10"
            : ""
        }`}
      >
        {isAI ? (
          <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300" />
        ) : (
          <User className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
        )}
        {isThinking && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-slate-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      <AnimatePresence>
        {showResult && isCorrect !== undefined && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -bottom-1 -right-1"
          >
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 fill-red-400/20" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <div className="text-center">
      <p
        className={`font-display text-xs font-bold ${
          isAI ? "text-slate-300" : "text-amber-400"
        }`}
      >
        {name}
      </p>
      <p className="font-display text-sm sm:text-base font-bold text-foreground">
        {score}
      </p>
    </div>
  </div>
);

// ─── Timer Ring ─────────────────────────────────────────────────────────────────

const TimerRing = ({ seconds, total }: { seconds: number; total: number }) => {
  const pct = seconds / total;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - pct);
  const color =
    seconds <= 3 ? "text-red-400" : seconds <= 6 ? "text-amber-400" : "text-primary";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-secondary/50"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-linear`}
        />
      </svg>
      <span
        className={`absolute font-display text-sm font-bold ${color}`}
      >
        {seconds}
      </span>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const ChallengeGame = () => {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [aiName, setAiName] = useState("");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [playerAnswer, setPlayerAnswer] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeRef = useRef(TIMER_SECONDS);

  // ── Cleanup timer on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const name = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    setAiName(name);
    const q = getQuestions({ count: TOTAL_QUESTIONS });
    setQuestions(q);
    setCurrentIndex(0);
    setPlayerScore(0);
    setAiScore(0);
    setResults([]);
    setPlayerAnswer(null);
    setAiAnswer(null);
    setPhase("question");
    startTimer();
  }, []);

  // ── Timer logic ───────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimer(TIMER_SECONDS);
    answerTimeRef.current = TIMER_SECONDS;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        const next = prev - 1;
        answerTimeRef.current = next;
        if (next <= 3) playCountdownBeep();
        return next;
      });
    }, 1000);
  }, []);

  // ── When timer hits 0, auto-submit no answer ─────────────────────────────────
  useEffect(() => {
    if (timer === 0 && phase === "question" && playerAnswer === null) {
      handlePlayerAnswer(null);
    }
  }, [timer, phase, playerAnswer]);

  // ── Handle player answer ──────────────────────────────────────────────────────
  const handlePlayerAnswer = useCallback(
    (answer: string | null) => {
      if (phase !== "question" || playerAnswer !== null) return;
      if (timerRef.current) clearInterval(timerRef.current);

      const timeLeft = answerTimeRef.current;
      setPlayerAnswer(answer);
      setPhase("ai_thinking");

      // AI "thinks" for 1-3 seconds
      const thinkTime = 1000 + Math.random() * 2000;
      setTimeout(() => {
        const q = questions[currentIndex];
        const accuracy = AI_ACCURACY[difficulty];
        const aiCorrect = Math.random() < accuracy;
        let aiPick: string;

        const correctAnswer = q.answers[q.correctIndex];
        if (aiCorrect) {
          aiPick = correctAnswer;
        } else {
          const wrongOptions = q.answers.filter((o) => o !== correctAnswer);
          aiPick = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }

        setAiAnswer(aiPick);

        // Calculate scores
        const playerCorrect = answer === correctAnswer;
        const aiIsCorrect = aiPick === correctAnswer;

        const timeBonus = Math.round((timeLeft / TIMER_SECONDS) * MAX_TIME_BONUS);
        const playerRoundScore = playerCorrect ? BASE_SCORE + timeBonus : 0;
        const aiRoundScore = aiIsCorrect ? BASE_SCORE + Math.round(Math.random() * MAX_TIME_BONUS) : 0;

        if (playerCorrect) playCorrectDing();
        else if (answer !== null) playBuzzerWrong();
        else playBuzzerWrong(); // timeout

        setPlayerScore((prev) => prev + playerRoundScore);
        setAiScore((prev) => prev + aiRoundScore);

        const roundResult: RoundResult = {
          question: q,
          playerAnswer: answer,
          aiAnswer: aiPick,
          playerCorrect,
          aiCorrect: aiIsCorrect,
          playerScore: playerRoundScore,
          aiScore: aiRoundScore,
          timeLeft,
        };

        setResults((prev) => [...prev, roundResult]);
        setPhase("reveal");

        // After reveal, proceed to next question or results
        setTimeout(() => {
          if (currentIndex + 1 < TOTAL_QUESTIONS) {
            setCurrentIndex((prev) => prev + 1);
            setPlayerAnswer(null);
            setAiAnswer(null);
            setPhase("question");
            startTimer();
          } else {
            setPhase("results");
            // Final scores need to be checked after state update
          }
        }, REVEAL_DURATION);
      }, thinkTime);
    },
    [phase, playerAnswer, questions, currentIndex, difficulty, startTimer]
  );

  // ── Play victory/defeat sound on results ──────────────────────────────────────
  useEffect(() => {
    if (phase === "results") {
      if (playerScore >= aiScore) {
        playVictoryFanfare();
      } else {
        playBuzzerWrong();
      }
    }
  }, [phase]);

  // ── Current question shortcut ─────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];

  // ── Stat helpers for results ──────────────────────────────────────────────────
  const playerCorrectCount = results.filter((r) => r.playerCorrect).length;
  const aiCorrectCount = results.filter((r) => r.aiCorrect).length;
  const avgTime =
    results.length > 0
      ? (
          results.reduce((sum, r) => sum + (TIMER_SECONDS - r.timeLeft), 0) /
          results.length
        ).toFixed(1)
      : "0";
  const playerWon = playerScore > aiScore;
  const isTie = playerScore === aiScore;

  // ─── Setup Phase ──────────────────────────────────────────────────────────────

  const renderSetup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full p-4 sm:p-6 gap-6"
    >
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-primary/10 border border-primary/20 flex items-center justify-center mb-3">
          <Swords className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Challenge Mode
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-sm">
          Go head-to-head against an AI opponent. 10 questions, 12 seconds each.
          Who will reign supreme?
        </p>
      </div>

      {/* Difficulty selection */}
      <div className="w-full max-w-md space-y-3">
        <p className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
          Choose Difficulty
        </p>
        <div className="grid grid-cols-3 gap-3">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
            const labels: Record<Difficulty, { name: string; desc: string; color: string }> = {
              easy: { name: "Easy", desc: "AI: 50% accuracy", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
              medium: { name: "Medium", desc: "AI: 70% accuracy", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
              hard: { name: "Hard", desc: "AI: 85% accuracy", color: "text-red-400 border-red-500/30 bg-red-500/5" },
            };
            const info = labels[d];
            const selected = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`relative flex flex-col items-center gap-1 p-4 rounded-xl border transition-all duration-200 ${
                  selected
                    ? `${info.color} shadow-lg scale-[1.02]`
                    : "border-border/30 bg-card/50 hover:border-border/50 hover:bg-card/80"
                }`}
              >
                {selected && (
                  <motion.div
                    layoutId="difficulty-ring"
                    className="absolute inset-0 rounded-xl border-2 border-primary/40"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Target className={`w-5 h-5 ${selected ? info.color.split(" ")[0] : "text-muted-foreground"}`} />
                <span className={`font-display text-sm font-bold ${selected ? info.color.split(" ")[0] : "text-foreground"}`}>
                  {info.name}
                </span>
                <span className="font-body text-[10px] text-muted-foreground">
                  {info.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI opponent preview */}
      <div className="w-full max-w-md p-4 rounded-xl bg-card/50 border border-border/30">
        <p className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Your Opponent
        </p>
        <div className="flex items-center justify-center gap-8">
          {/* Player */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-amber-900/30 border-2 border-amber-500/50 flex items-center justify-center">
              <User className="w-7 h-7 text-amber-400" />
            </div>
            <span className="font-display text-xs font-bold text-amber-400">You</span>
          </div>

          <div className="font-display text-lg font-bold text-muted-foreground">VS</div>

          {/* AI */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-slate-800/60 border-2 border-slate-500/50 flex items-center justify-center">
              <Bot className="w-7 h-7 text-slate-300" />
            </div>
            <span className="font-display text-xs font-bold text-slate-300">???</span>
          </div>
        </div>
      </div>

      {/* Start button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={startGame}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-background font-display text-sm font-bold shadow-lg hover:shadow-primary/20 transition-shadow flex items-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Start Challenge
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );

  // ─── Question / Answering / AI Thinking / Reveal Phases ───────────────────────

  const renderPlaying = () => {
    if (!currentQuestion) return null;

    const isRevealing = phase === "reveal";
    const isAiThinking = phase === "ai_thinking";
    const hasAnswered = playerAnswer !== null || phase !== "question";
    const lastResult = results[results.length - 1];
    const playerCorrectThisRound = isRevealing && lastResult?.playerCorrect;
    const aiCorrectThisRound = isRevealing && lastResult?.aiCorrect;

    return (
      <div className="flex flex-col h-full p-3 sm:p-6 gap-4">
        {/* ── Top: VS Header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <PlayerHeader
            name="You"
            score={playerScore}
            isAI={false}
            isCorrect={playerCorrectThisRound}
            showResult={isRevealing}
          />

          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Q{currentIndex + 1}/{TOTAL_QUESTIONS}
            </div>
            <TimerRing seconds={timer} total={TIMER_SECONDS} />
          </div>

          <PlayerHeader
            name={aiName}
            score={aiScore}
            isAI={true}
            isCorrect={aiCorrectThisRound}
            showResult={isRevealing}
            isThinking={isAiThinking}
          />
        </div>

        {/* ── Score Bar ────────────────────────────────────────────────────────── */}
        <ScoreBar playerScore={playerScore} aiScore={aiScore} />

        {/* ── Question Card ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Category badge */}
              {currentQuestion.category && (
                <div className="flex justify-center mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-display text-[10px] font-bold text-primary uppercase tracking-wider">
                    {currentQuestion.category}
                  </span>
                </div>
              )}

              {/* Question text */}
              <div className="p-5 sm:p-6 rounded-2xl bg-card/80 border border-border/30 backdrop-blur-sm mb-4">
                <p className="font-body text-sm sm:text-base text-foreground text-center leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQuestion.answers.map((option, idx) => {
                  const isPlayerPick = playerAnswer === option;
                  const isCorrectAnswer = idx === currentQuestion.correctIndex;
                  const isAiPick = aiAnswer === option;

                  let btnClass =
                    "relative w-full p-3.5 rounded-xl border text-left font-body text-sm transition-all duration-200 ";

                  if (isRevealing) {
                    if (isCorrectAnswer) {
                      btnClass +=
                        "bg-emerald-500/10 border-emerald-500/40 text-emerald-300";
                    } else if (isPlayerPick || isAiPick) {
                      btnClass +=
                        "bg-red-500/10 border-red-500/30 text-red-300";
                    } else {
                      btnClass +=
                        "bg-card/30 border-border/20 text-muted-foreground opacity-50";
                    }
                  } else if (isPlayerPick) {
                    btnClass +=
                      "bg-primary/15 border-primary/40 text-primary ring-1 ring-primary/20";
                  } else if (hasAnswered) {
                    btnClass +=
                      "bg-card/30 border-border/20 text-muted-foreground opacity-50 cursor-default";
                  } else {
                    btnClass +=
                      "bg-card/50 border-border/30 text-foreground hover:border-primary/30 hover:bg-primary/5 cursor-pointer active:scale-[0.98]";
                  }

                  return (
                    <motion.button
                      key={option}
                      disabled={hasAnswered}
                      onClick={() => handlePlayerAnswer(option)}
                      whileHover={!hasAnswered ? { scale: 1.01 } : undefined}
                      whileTap={!hasAnswered ? { scale: 0.98 } : undefined}
                      className={btnClass}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-secondary/60 border border-border/30 flex items-center justify-center font-display text-[10px] font-bold text-muted-foreground shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {isRevealing && isCorrectAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {isRevealing && !isCorrectAnswer && (isPlayerPick || isAiPick) && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </span>

                      {/* Indicator pills */}
                      {isRevealing && (isPlayerPick || isAiPick) && (
                        <div className="flex gap-1 mt-1.5 ml-8">
                          {isPlayerPick && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-display font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
                              YOU
                            </span>
                          )}
                          {isAiPick && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-display font-bold bg-slate-500/20 text-slate-400 border border-slate-500/20">
                              AI
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* AI Thinking indicator */}
          <AnimatePresence>
            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-500/20"
              >
                <Brain className="w-4 h-4 text-slate-400" />
                <span className="font-body text-xs text-slate-400">
                  {aiName} is thinking
                </span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-slate-400 font-body text-xs"
                >
                  ...
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reveal feedback */}
          <AnimatePresence>
            {isRevealing && lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 text-xs font-display"
              >
                <span
                  className={`px-3 py-1.5 rounded-lg border ${
                    lastResult.playerCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  You: {lastResult.playerCorrect ? `+${lastResult.playerScore}` : "+0"}
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg border ${
                    lastResult.aiCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {aiName}: {lastResult.aiCorrect ? `+${lastResult.aiScore}` : "+0"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // ─── Results Phase ────────────────────────────────────────────────────────────

  const renderResults = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-start h-full p-4 sm:p-6 overflow-y-auto gap-6"
    >
      {/* Confetti for winner */}
      {playerWon && <Confetti />}

      {/* Result headline */}
      <div className="text-center space-y-2 pt-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          {playerWon ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-primary/10 border-2 border-amber-500/40 flex items-center justify-center mb-3">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
          ) : isTie ? (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-500/20 to-slate-400/10 border-2 border-slate-500/40 flex items-center justify-center mb-3">
              <Swords className="w-10 h-10 text-slate-300" />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-600/20 to-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center mb-3">
              <Brain className="w-10 h-10 text-slate-400" />
            </div>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-2xl sm:text-3xl font-bold"
        >
          {playerWon ? (
            <span className="text-amber-400">Victory!</span>
          ) : isTie ? (
            <span className="text-slate-300">It's a Tie!</span>
          ) : (
            <span className="text-foreground">{aiName} Wins</span>
          )}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="font-body text-sm text-muted-foreground"
        >
          {playerWon
            ? "You outsmarted the machine. Well played!"
            : isTie
            ? "A perfectly matched battle of wits."
            : "The AI proved too strong this time. Try again!"}
        </motion.p>
      </div>

      {/* Final score comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="flex items-end justify-center gap-8 mb-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                playerWon
                  ? "bg-amber-900/30 border-amber-400"
                  : "bg-amber-900/20 border-amber-500/30"
              }`}
            >
              <User className="w-8 h-8 text-amber-400" />
            </div>
            <span className="font-display text-xs font-bold text-amber-400">You</span>
            <span className="font-display text-2xl font-bold text-foreground">
              {playerScore}
            </span>
          </div>

          <div className="font-display text-sm text-muted-foreground mb-8">VS</div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                !playerWon && !isTie
                  ? "bg-slate-800/60 border-slate-400"
                  : "bg-slate-800/40 border-slate-500/30"
              }`}
            >
              <Bot className="w-8 h-8 text-slate-300" />
            </div>
            <span className="font-display text-xs font-bold text-slate-300">
              {aiName}
            </span>
            <span className="font-display text-2xl font-bold text-foreground">
              {aiScore}
            </span>
          </div>
        </div>

        <ScoreBar playerScore={playerScore} aiScore={aiScore} />
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-md grid grid-cols-3 gap-3"
      >
        {[
          {
            label: "Your Accuracy",
            value: `${playerCorrectCount}/${TOTAL_QUESTIONS}`,
            icon: Target,
            color: "text-amber-400",
          },
          {
            label: "AI Accuracy",
            value: `${aiCorrectCount}/${TOTAL_QUESTIONS}`,
            icon: Bot,
            color: "text-slate-400",
          },
          {
            label: "Avg Response",
            value: `${avgTime}s`,
            icon: Clock,
            color: "text-primary",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/50 border border-border/30"
          >
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="font-display text-lg font-bold text-foreground">
              {stat.value}
            </span>
            <span className="font-body text-[10px] text-muted-foreground text-center">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Round-by-round breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="w-full max-w-md"
      >
        <p className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center">
          Round Breakdown
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/20 text-xs"
            >
              <span className="font-display font-bold text-muted-foreground w-5 text-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-foreground truncate text-[11px]">
                  {r.question.question}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.playerCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-muted-foreground">/</span>
                {r.aiCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex gap-3 pb-6"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase("setup")}
          className="px-5 py-2.5 rounded-xl border border-border/30 bg-card/50 text-foreground font-display text-sm font-semibold hover:bg-card/80 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={startGame}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-background font-display text-sm font-bold shadow-lg hover:shadow-primary/20 transition-shadow flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Rematch
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <GameLayout title="Challenge" isSkillGame>
      {phase === "setup" && renderSetup()}
      {(phase === "question" ||
        phase === "answering" ||
        phase === "ai_thinking" ||
        phase === "reveal") &&
        renderPlaying()}
      {phase === "results" && renderResults()}
    </GameLayout>
  );
};

export default ChallengeGame;
