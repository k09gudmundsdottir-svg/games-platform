import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playCardShuffle, playVictoryFanfare } from "@/lib/sounds";
import { GripVertical, Crown, Award, Medal } from "lucide-react";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

const MEME_TEMPLATES = [
  { id: "181913649", name: "Drake Hotline Bling" },
  { id: "112126428", name: "Distracted Boyfriend" },
  { id: "87743020", name: "Two Buttons" },
  { id: "102156234", name: "Mocking SpongeBob" },
  { id: "97984", name: "Disaster Girl" },
  { id: "438680", name: "Batman Slapping Robin" },
  { id: "93895088", name: "Expanding Brain" },
  { id: "124822590", name: "Left Exit 12 Off Ramp" },
  { id: "217743513", name: "UNO Draw 25" },
  { id: "131087935", name: "Running Away Balloon" },
  { id: "222403160", name: "Bernie Mittens" },
  { id: "252600902", name: "Always Has Been" },
  { id: "4087833", name: "Waiting Skeleton" },
  { id: "61579", name: "One Does Not Simply" },
  { id: "101470", name: "Ancient Aliens" },
  { id: "89370399", name: "Roll Safe" },
  { id: "119139145", name: "Blank Nut Button" },
  { id: "61520", name: "Futurama Fry" },
  { id: "27813981", name: "Hide the Pain Harold" },
  { id: "188390779", name: "Panik Kalm Panik" },
];

const getRandomMeme = () => MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];
const memeUrl = (id: string) => `https://i.imgflip.com/${id}.jpg`;

const captionCards = [
  "When you realize it's Monday tomorrow",
  "Me trying to adult",
  "That look when pizza arrives",
  "When someone says 'we need to talk'",
  "My face during meetings",
  "Expectations vs. Reality",
  "When WiFi disconnects for 2 seconds",
  "POV: You forgot to save",
  "When the code compiles on first try",
  "Me pretending to understand the meeting",
  "My browser tabs vs my RAM",
  "When you hear your own voice on a recording",
  "The group chat at 3 AM",
  "When autocorrect ruins everything",
  "My weekend plans vs reality",
];

// Simulated submissions from other players
const submittedCaptions = [
  { player: "Jordan", caption: "When the code compiles on first try" },
  { player: "Casey", caption: "POV: You forgot to save" },
  { player: "Alex", caption: "Me pretending to understand the meeting" },
  { player: "You", caption: "" }, // will be replaced with player's pick
];

const WINNER_INDEX = 2; // "Alex" wins in this demo

/* ─── Confetti Particle ─── */
const ConfettiParticle = ({ delay, x }: { delay: number; x: number }) => {
  const gold = [
    "hsl(38 92% 55%)",
    "hsl(28 85% 45%)",
    "hsl(45 100% 65%)",
    "hsl(38 70% 40%)",
    "hsl(50 90% 70%)",
  ];
  const color = gold[Math.floor(Math.random() * gold.length)];
  const size = 4 + Math.random() * 6;
  const rotate = Math.random() * 720 - 360;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -(80 + Math.random() * 120), 60 + Math.random() * 80],
        x: [0, x * (0.5 + Math.random()), x * (0.8 + Math.random() * 0.5)],
        scale: [1, 1.3, 0.3],
        rotate: [0, rotate],
      }}
      transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: "easeOut" }}
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size * (0.6 + Math.random() * 0.8),
        background: color,
        boxShadow: `0 0 4px ${color}`,
        top: "50%",
        left: "50%",
      }}
    />
  );
};

/* ─── Card Back (gold geometric pattern) ─── */
const CardBack = ({ width, height }: { width: string; height: string }) => (
  <div
    className={`${width} ${height} rounded-2xl overflow-hidden relative`}
    style={{
      background: "#0d0d1a",
      boxShadow: "0 8px 32px -8px rgba(0,0,0,0.7)",
      border: "1.5px solid hsl(38 70% 40% / 0.5)",
    }}
  >
    {/* Geometric pattern */}
    <div className="absolute inset-0 opacity-[0.12]" style={{
      backgroundImage: `
        linear-gradient(45deg, hsl(38 80% 50%) 25%, transparent 25%),
        linear-gradient(-45deg, hsl(38 80% 50%) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, hsl(38 80% 50%) 75%),
        linear-gradient(-45deg, transparent 75%, hsl(38 80% 50%) 75%)
      `,
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    }} />
    {/* Diamond overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rotate-45 border border-[hsl(38_70%_50%/0.3)] flex items-center justify-center">
        <div className="w-10 h-10 border border-[hsl(38_70%_50%/0.2)] flex items-center justify-center">
          <div className="w-4 h-4 bg-[hsl(38_70%_50%/0.15)]" />
        </div>
      </div>
    </div>
    {/* WDYMeme logo */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span
        className="text-[8px] font-bold tracking-[0.15em] uppercase -rotate-45 opacity-60"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}
      >
        WDYM
      </span>
    </div>
    {/* Inner glow */}
    <div className="absolute inset-0 rounded-2xl" style={{
      boxShadow: "inset 0 0 20px hsl(38 92% 55% / 0.08)",
    }} />
  </div>
);

/* ─── Card Face (for reveal) ─── */
const CardFaceContent = ({ caption, player }: { caption: string; player: string }) => (
  <div className="relative flex flex-col h-full p-3 md:p-3.5">
    <div className="text-center mb-auto">
      <span
        className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "hsl(38 80% 55%)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        What Do You Meme
      </span>
      <div className="mx-auto mt-1 w-8 h-[1px]" style={{
        background: "linear-gradient(90deg, transparent, hsl(38 70% 50% / 0.4), transparent)",
      }} />
    </div>
    <div className="flex-1 flex items-center justify-center px-1">
      <p
        className="text-center text-[11px] md:text-xs font-bold leading-snug"
        style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      >
        {caption}
      </p>
    </div>
    <div className="flex items-end justify-between mt-auto">
      <span className="text-[9px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.6)" }}>
        {player}
      </span>
      <span className="text-[7px] tracking-wider uppercase" style={{ color: "hsl(38 70% 50% / 0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
        CAPTION
      </span>
    </div>
  </div>
);

/* ─── Reveal Card (3D flip) ─── */
const RevealCard = ({
  caption,
  player,
  isFlipped,
  isWinner,
  isLoser,
  onClick,
  dealDelay,
}: {
  caption: string;
  player: string;
  isFlipped: boolean;
  isWinner: boolean;
  isLoser: boolean;
  onClick: () => void;
  dealDelay: number;
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isWinner && isFlipped) {
      const t = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(t);
    }
  }, [isWinner, isFlipped]);

  const confettiParticles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.3,
    x: (Math.random() - 0.5) * 200,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{
        opacity: isLoser ? 0.3 : 1,
        y: 0,
        scale: isWinner && isFlipped ? 1.1 : isLoser ? 0.92 : 1,
      }}
      transition={{ delay: dealDelay, type: "spring", stiffness: 200, damping: 18 }}
      onClick={onClick}
      className="relative cursor-pointer"
      style={{ perspective: 800 }}
    >
      {/* Confetti container */}
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
          {confettiParticles.map((p) => (
            <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
          ))}
        </div>
      )}

      {/* Winner glow ring */}
      {isWinner && isFlipped && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0.6], scale: [0.8, 1.15, 1.05] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute -inset-3 rounded-3xl pointer-events-none z-10"
          style={{
            boxShadow: "0 0 40px hsl(38 92% 55% / 0.4), 0 0 80px hsl(38 92% 55% / 0.15)",
            border: "2px solid hsl(38 92% 55% / 0.6)",
          }}
        />
      )}

      {/* 3D flip container */}
      <motion.div
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-[130px] md:w-[150px] h-[180px] md:h-[210px]"
      >
        {/* Front face (caption) */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            background: "#0d0d1a",
            border: isWinner && isFlipped
              ? "2px solid hsl(38 92% 55%)"
              : "1.5px solid hsl(38 70% 40% / 0.5)",
            boxShadow: isWinner && isFlipped
              ? "0 0 30px hsl(38 92% 55% / 0.3)"
              : "0 8px 32px -8px rgba(0,0,0,0.7)",
          }}
        >
          {/* Linen texture */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zM3 3h1v1H3z' fill='%23fff' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            backgroundSize: "6px 6px",
          }} />
          <CardFaceContent caption={caption} player={player} />

          {/* Winner badge */}
          {isWinner && isFlipped && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
              className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))",
                boxShadow: "0 0 16px hsl(38 92% 55% / 0.5)",
              }}
            >
              <span className="text-sm">👑</span>
            </motion.div>
          )}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <CardBack width="w-full" height="h-full" />
          {/* "Tap to reveal" hint */}
          {!isFlipped && (
            <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
              <motion.span
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[8px] font-bold tracking-widest uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55% / 0.6)" }}
              >
                TAP TO REVEAL
              </motion.span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Hand Card (player's hand) ─── */
const MemeCard = ({
  caption,
  index,
  isSelected,
  onClick,
  totalCards,
}: {
  caption: string;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  totalCards: number;
}) => {
  const mid = (totalCards - 1) / 2;
  const offset = index - mid;
  const rotation = offset * 3;
  const xShift = offset * 4;

  return (
    <motion.div
      onClick={onClick}
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{
        rotateY: 0,
        opacity: 1,
        y: isSelected ? -28 : 0,
        rotate: isSelected ? 0 : rotation,
        x: xShift,
        scale: isSelected ? 1.08 : 1,
      }}
      whileHover={{ y: -18, scale: 1.05, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className="shrink-0 cursor-pointer relative"
    >
      <div
        className={`relative w-[120px] md:w-[140px] h-[170px] md:h-[195px] rounded-2xl overflow-hidden transition-shadow duration-300 ${
          isSelected ? "shadow-[0_0_30px_-4px_hsl(38_92%_55%/0.5)]" : "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]"
        }`}
        style={{ background: "#0d0d1a" }}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: isSelected ? "2px solid hsl(38 92% 55%)" : "1.5px solid hsl(38 70% 40% / 0.5)",
            boxShadow: isSelected
              ? "inset 0 0 20px hsl(38 92% 55% / 0.15), 0 0 20px hsl(38 92% 55% / 0.3)"
              : "inset 0 0 12px hsl(38 92% 55% / 0.06)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zM3 3h1v1H3z' fill='%23fff' fill-opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: "6px 6px",
        }} />
        <div className="relative flex flex-col h-full p-3 md:p-3.5">
          <div className="text-center mb-auto">
            <span className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(38 80% 55%)", fontFamily: "'JetBrains Mono', monospace" }}>
              What Do You Meme
            </span>
            <div className="mx-auto mt-1 w-8 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(38 70% 50% / 0.4), transparent)" }} />
          </div>
          <div className="flex-1 flex items-center justify-center px-1">
            <p className="text-center text-[11px] md:text-xs font-bold leading-snug" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
              {caption}
            </p>
          </div>
          <div className="flex items-end justify-between mt-auto">
            <span className="text-[9px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.6)" }}>
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[7px] tracking-wider uppercase" style={{ color: "hsl(38 70% 50% / 0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
              CAPTION
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Rank Badge ─── */
const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 0) return <Crown className="w-4 h-4" style={{ color: "hsl(38 92% 55%)" }} />;
  if (rank === 1) return <Award className="w-4 h-4" style={{ color: "hsl(0 0% 75%)" }} />;
  if (rank === 2) return <Medal className="w-4 h-4" style={{ color: "hsl(25 60% 45%)" }} />;
  return <span className="text-[10px] font-bold" style={{ color: "hsl(38 70% 50% / 0.4)", fontFamily: "'JetBrains Mono', monospace" }}>#{rank + 1}</span>;
};

/* ─── Judge Ranking Item ─── */
const JudgeRankItem = ({
  entry,
  rank,
}: {
  entry: { player: string; caption: string };
  rank: number;
}) => {
  const isFirst = rank === 0;

  return (
    <Reorder.Item
      value={entry}
      dragListener
      className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isFirst ? "shadow-[0_0_24px_-6px_hsl(38_92%_55%/0.3)]" : ""
      }`}
      style={{
        background: isFirst ? "hsl(240 10% 12%)" : "hsl(240 10% 9%)",
        border: isFirst ? "1.5px solid hsl(38 70% 50% / 0.4)" : "1px solid hsl(240 8% 18% / 0.5)",
      }}
      whileDrag={{
        scale: 1.03,
        boxShadow: "0 12px 40px -8px hsl(38 92% 55% / 0.25)",
        zIndex: 50,
      }}
      layout
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    >
      {/* Drag handle */}
      <GripVertical className="w-4 h-4 shrink-0 opacity-30" />

      {/* Rank badge */}
      <div className="w-6 flex items-center justify-center shrink-0">
        <RankBadge rank={rank} />
      </div>

      {/* Caption */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold leading-snug truncate"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: isFirst ? "#f0ece4" : "hsl(40 15% 70%)",
          }}
        >
          {entry.caption}
        </p>
        <p className="text-[9px] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
          {entry.player}
        </p>
      </div>

      {/* Position indicator */}
      {isFirst && (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm"
        >
          👑
        </motion.div>
      )}
    </Reorder.Item>
  );
};

/* ─── Main Game ─── */
type Phase = "picking" | "reveal" | "judging" | "winner";

const MemeGame = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("picking");
  const [currentMeme, setCurrentMeme] = useState(getRandomMeme());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [winnerRevealed, setWinnerRevealed] = useState(false);
  const [rankedCaptions, setRankedCaptions] = useState<typeof submittedCaptions>([]);

  const revealCaptions = submittedCaptions.map((s, i) => ({
    ...s,
    caption: i === 3 && selectedCard !== null ? captionCards[selectedCard] : s.caption,
  }));

  const handleSubmit = useCallback(() => {
    if (selectedCard !== null) {
      playCardShuffle();
      setPhase("reveal");
    }
  }, [selectedCard]);

  const handleFlip = useCallback((index: number) => {
    if (phase !== "reveal") return;
    if (flippedCards.has(index)) return;

    playCardFlip();

    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    // When all flipped → transition to judging phase
    if (flippedCards.size + 1 === revealCaptions.length) {
      setTimeout(() => {
        setRankedCaptions([...revealCaptions]);
        setPhase("judging");
      }, 800);
    }
  }, [phase, flippedCards, revealCaptions]);

  const handleCrownWinner = () => {
    playVictoryFanfare();
    setPhase("winner");
    setWinnerRevealed(true);
  };

  const handleNextRound = () => {
    setSelectedCard(null);
    setPhase("picking");
    setFlippedCards(new Set());
    setWinnerRevealed(false);
    setRankedCaptions([]);
    setCurrentMeme(getRandomMeme());
  };

  // The winner is always rank 0 in the judge's ordering
  const winnerEntry = rankedCaptions[0];

  return (
    <GameLayout title="What Do You Meme" forceVideoPanel>
      <div className="flex flex-col h-full">
        {/* Top content area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">
                Round 3 of 10
              </span>
              <span className="text-xs font-body text-muted-foreground">Judge: Alex</span>
            </div>

            <AnimatePresence mode="wait">
              {/* PICKING PHASE */}
              {phase === "picking" && (
                <motion.div key="meme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative rounded-xl border-2 border-border/30 overflow-hidden shadow-card-hover bg-secondary">
                    <img src={memeUrl(currentMeme.id)} alt={currentMeme.name}
                      className="w-full aspect-square object-contain bg-white" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm border border-border/30">
                      <span className="text-[10px] font-display font-semibold text-foreground">{currentMeme.name}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* REVEAL PHASE */}
              {phase === "reveal" && (
                <motion.div key="reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-bold tracking-[0.15em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}
                    >
                      JUDGE IS REVEALING...
                    </motion.p>
                    <p className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                      Tap each card to flip
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {revealCaptions.map((entry, i) => (
                      <RevealCard
                        key={i}
                        caption={entry.caption}
                        player={entry.player}
                        isFlipped={flippedCards.has(i)}
                        isWinner={false}
                        isLoser={false}
                        onClick={() => handleFlip(i)}
                        dealDelay={i * 0.15}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* JUDGING PHASE — drag-to-rank */}
              {phase === "judging" && (
                <motion.div key="judging" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-4">
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-sm font-bold tracking-[0.15em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}
                    >
                      ⚖️ JUDGE'S RANKING
                    </motion.p>
                    <p className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                      Drag to rank — funniest on top
                    </p>
                  </div>

                  <Reorder.Group
                    axis="y"
                    values={rankedCaptions}
                    onReorder={(newOrder) => {
                      playCardFlip();
                      setRankedCaptions(newOrder);
                    }}
                    className="flex flex-col gap-2"
                  >
                    {rankedCaptions.map((entry, i) => (
                      <JudgeRankItem key={entry.player} entry={entry} rank={i} />
                    ))}
                  </Reorder.Group>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center mt-5"
                  >
                    <button
                      onClick={handleCrownWinner}
                      className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 flex items-center gap-2"
                      style={{
                        background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))",
                        color: "#0d0d1a",
                        boxShadow: "0 0 30px -6px hsl(38 92% 55% / 0.4)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <Crown className="w-4 h-4" />
                      CROWN THE WINNER
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* WINNER PHASE */}
              {phase === "winner" && winnerEntry && (
                <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-5">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                      className="text-5xl mb-3"
                    >
                      🏆
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg font-bold tracking-[0.1em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}
                    >
                      {winnerEntry.player} WINS!
                    </motion.p>
                  </div>

                  {/* Winning card large */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="relative mx-auto rounded-2xl overflow-hidden p-5"
                    style={{
                      background: "#0d0d1a",
                      border: "2px solid hsl(38 92% 55%)",
                      boxShadow: "0 0 40px hsl(38 92% 55% / 0.3), 0 0 80px hsl(38 92% 55% / 0.1)",
                      maxWidth: 280,
                    }}
                  >
                    {/* Linen texture */}
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0zM3 3h1v1H3z' fill='%23fff' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                      backgroundSize: "6px 6px",
                    }} />
                    <div className="text-center mb-2">
                      <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(38 80% 55%)", fontFamily: "'JetBrains Mono', monospace" }}>
                        What Do You Meme
                      </span>
                    </div>
                    <p className="text-center text-sm font-bold leading-snug relative" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4" }}>
                      "{winnerEntry.caption}"
                    </p>
                    <p className="text-center text-[10px] mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.6)" }}>
                      — {winnerEntry.player}
                    </p>
                    {/* Crown badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", stiffness: 400 }}
                      className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))",
                        boxShadow: "0 0 20px hsl(38 92% 55% / 0.5)",
                      }}
                    >
                      <span className="text-lg">👑</span>
                    </motion.div>
                  </motion.div>

                  {/* Final ranking summary */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-4 flex flex-col gap-1"
                  >
                    {rankedCaptions.slice(1).map((entry, i) => (
                      <div
                        key={entry.player}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg opacity-50"
                        style={{ background: "hsl(240 10% 9%)", border: "1px solid hsl(240 8% 16% / 0.3)" }}
                      >
                        <RankBadge rank={i + 1} />
                        <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(40 15% 60%)" }}>
                          {entry.player}: {entry.caption}
                        </span>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="flex justify-center mt-5"
                  >
                    <button
                      onClick={handleNextRound}
                      className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))",
                        color: "#0d0d1a",
                        boxShadow: "0 0 30px -6px hsl(38 92% 55% / 0.4)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      NEXT ROUND →
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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

        {/* Caption Cards Hand - Bottom (only during picking phase) */}
        <AnimatePresence>
          {phase === "picking" && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="border-t p-4 pb-6"
              style={{
                borderColor: "hsl(38 70% 40% / 0.15)",
                background: "linear-gradient(180deg, hsl(240 12% 7%) 0%, hsl(240 15% 5%) 100%)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.5)" }}
              >
                Pick your best caption
              </p>

              <div className="flex items-end justify-center gap-1 md:gap-1.5 overflow-x-auto pb-2 px-4">
                {captionCards.map((caption, i) => (
                  <MemeCard
                    key={i}
                    caption={caption}
                    index={i}
                    isSelected={selectedCard === i}
                    onClick={() => setSelectedCard(i === selectedCard ? null : i)}
                    totalCards={captionCards.length}
                  />
                ))}
              </div>

              <AnimatePresence>
                {selectedCard !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-center mt-4"
                  >
                    <button
                      onClick={handleSubmit}
                      className="px-10 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))",
                        color: "#0d0d1a",
                        boxShadow: "0 0 30px -6px hsl(38 92% 55% / 0.4), 0 4px 12px -2px rgba(0,0,0,0.5)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.05em",
                      }}
                    >
                      SUBMIT CAPTION
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default MemeGame;
