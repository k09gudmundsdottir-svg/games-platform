import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playCardShuffle, playVictoryFanfare } from "@/lib/sounds";
import { Crown } from "lucide-react";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

// ─── Meme Templates ───
const MEME_TEMPLATES = [
  { name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg" },
  { name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
  { name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
  { name: "UNO Draw 25", url: "https://i.imgflip.com/3lmzyx.jpg" },
  { name: "Bernie Asking", url: "https://i.imgflip.com/3oevdk.jpg" },
  { name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
  { name: "Left Exit 12", url: "https://i.imgflip.com/22bdq6.jpg" },
  { name: "Expanding Brain", url: "https://i.imgflip.com/1jwhww.jpg" },
  { name: "Running Away Balloon", url: "https://i.imgflip.com/261o3j.jpg" },
  { name: "Waiting Skeleton", url: "https://i.imgflip.com/2fm6x.jpg" },
  { name: "One Does Not Simply", url: "https://i.imgflip.com/1bij.jpg" },
  { name: "Batman Slapping Robin", url: "https://i.imgflip.com/9ehk.jpg" },
  { name: "Ancient Aliens", url: "https://i.imgflip.com/26am.jpg" },
  { name: "Futurama Fry", url: "https://i.imgflip.com/1bgw.jpg" },
  { name: "Hide the Pain Harold", url: "https://i.imgflip.com/gk5el.jpg" },
  { name: "Disaster Girl", url: "https://i.imgflip.com/23ls.jpg" },
  { name: "Roll Safe", url: "https://i.imgflip.com/1h7in3.jpg" },
  { name: "Panik Kalm Panik", url: "https://i.imgflip.com/3qqcim.png" },
  { name: "Always Has Been", url: "https://i.imgflip.com/46e43q.png" },
  { name: "Mocking SpongeBob", url: "https://i.imgflip.com/1otk96.jpg" },
];

// ─── 150 Caption Cards ───
const ALL_CAPTIONS: string[] = [
  // Awkward social situations (1-20)
  "When you wave back at someone who wasn't waving at you",
  "When you say 'you too' after the waiter says 'enjoy your meal'",
  "When you pull a push door in front of everyone",
  "When someone says 'tell me about yourself' and you forget who you are",
  "When you accidentally make eye contact with a stranger for too long",
  "When you laugh at a joke you didn't hear",
  "When you're mid-story and realize nobody is listening",
  "When someone starts singing happy birthday and you don't know where to look",
  "When you send a text to the wrong person",
  "When you walk into the wrong meeting room and just sit down",
  "When you hold the door for someone who's too far away",
  "When you say goodbye then walk the same direction",
  "When your stomach growls during a silent exam",
  "When you trip on nothing and look back at the ground",
  "When someone asks how you are and you actually start telling them",
  "When you pretend to text so you don't have to talk to people",
  "When you call your teacher 'mom' in front of the whole class",
  "When you hear your own voice in a recording",
  "When you accidentally like a photo from 3 years ago while stalking",
  "When someone catches you talking to yourself",

  // Tech/internet culture (21-40)
  "When the code compiles on the first try",
  "When you close 47 browser tabs after finishing a project",
  "When the WiFi drops for 0.3 seconds",
  "When you Google a problem and the only result is your own unanswered post from 2019",
  "When someone says 'just use Excel' for everything",
  "When your password needs a uppercase, lowercase, number, symbol, and a blood sacrifice",
  "When you fix a bug by adding a random semicolon",
  "When you read the error message and it's in a language you don't speak",
  "When Stack Overflow says your question is a duplicate",
  "When autocorrect fixes your word to something worse",
  "When you clear your browser history just in case",
  "When you realize you've been debugging a typo for 3 hours",
  "When someone asks you to fix their printer because you're 'good with computers'",
  "When the AI chatbot says 'I'm sorry, I can't help with that'",
  "When you finally find the bug and it was a missing comma",
  "When someone emails you to ask if you got their email",
  "When your phone dies at 23% battery",
  "When you accidentally hit Reply All",
  "When the loading bar gets stuck at 99%",
  "When you have 14,000 unread emails and zero regrets",

  // Work life (41-60)
  "When the meeting that could've been an email lasts 2 hours",
  "When your boss says 'let's circle back on that'",
  "When you pretend to take notes but you're just doodling",
  "When the intern knows more than you",
  "When someone says 'we're like a family here'",
  "When you're on mute and give an entire speech",
  "When it's 4:59 PM and someone schedules a meeting for 5:00",
  "When you get voluntold for a project",
  "When your lunch break is technically 30 minutes but spiritually infinite",
  "When someone steals your labeled food from the office fridge",
  "When you say 'happy to help' but are absolutely not happy",
  "When the deadline was yesterday",
  "When you mark yourself as 'busy' on your calendar to avoid meetings",
  "When management says 'we need to do more with less'",
  "When you write a professional email while absolutely fuming",
  "When someone asks for your honest opinion and then gets offended",
  "When you dress up for a Zoom meeting from the waist up only",
  "When the new hire is already getting promoted",
  "When you accidentally unmute during a rant about the meeting",
  "When your out-of-office reply becomes your personality",

  // Relationships (61-80)
  "When bae says 'I'm fine' in that tone",
  "When you see your ex at the grocery store",
  "When your crush texts back after 3 days with 'lol'",
  "When you stalk your partner's following list at 2 AM",
  "When someone says 'we need to talk' and your soul leaves your body",
  "When your mom calls you by your full name",
  "When your friend cancels plans and you're secretly relieved",
  "When you introduce your partner to your weird family",
  "When your siblings snitch on you for no reason",
  "When you realize you and your pet have the same personality",
  "When your best friend knows too much about you",
  "When your date says they don't like dogs",
  "When your parents learn how to use emojis",
  "When grandma discovers Facebook",
  "When you third-wheel so hard you become the wheel",
  "When your friend starts dating your other friend and you're stuck in the middle",
  "When someone reads your message and doesn't reply",
  "When your partner says 'guess what' and you panic",
  "When you have to pretend to like your friend's terrible cooking",
  "When your ex posts a glow-up photo",

  // Food (81-100)
  "When the pizza arrives 5 minutes early",
  "When you eat the last slice and blame it on the dog",
  "When your food order is wrong but you eat it anyway because confrontation",
  "When someone says 'I'm not hungry' then eats all your fries",
  "When the microwave beeps at 3 AM and the whole house wakes up",
  "When you cook for the first time and the fire alarm is your timer",
  "When the waiter walks by with food that's not yours",
  "When you forgot your lunch at home",
  "When someone asks for a bite and takes half your meal",
  "When the restaurant says '15-minute wait' and it's been 45 minutes",
  "When you discover a new snack that changes your entire worldview",
  "When you say 'I'll have a salad' and then order pasta",
  "When the fridge is full but there's nothing to eat",
  "When someone judges you for having cereal for dinner",
  "When the drive-through gets your order perfectly right",
  "When you're on a diet and someone brings donuts to the office",
  "When you take a photo of your food before eating because priorities",
  "When you finish your meal first and stare at everyone else's plate",
  "When you bite into a surprise jalapeño",
  "When someone says 'it's an acquired taste' and you know it's terrible",

  // Animals (101-115)
  "When your cat stares at nothing in the corner at 3 AM",
  "When the dog acts like you've been gone 7 years but it's been 10 minutes",
  "When your pet sits on your laptop during an important meeting",
  "When the neighborhood squirrel has more confidence than you",
  "When your dog judges you for eating on the couch",
  "When the cat knocks something off the table while maintaining eye contact",
  "When you talk to your pet in a baby voice and someone overhears",
  "When your fish is the only one who truly understands you",
  "When a random dog on the street lets you pet them",
  "When the spider in your room disappears and now you can never relax",
  "When your cat brings you a 'gift' and you have to act grateful",
  "When the dog zooms around the house for absolutely no reason",
  "When you realize birds are just government drones",
  "When your pet has a better social life than you",
  "When you share your dinner with your dog because those eyes",

  // Existential dread (116-135)
  "When you realize it's not the weekend, it's only Tuesday",
  "When Sunday night hits and you feel the dread creeping in",
  "When you lie in bed and remember that embarrassing thing from 2014",
  "When you check your bank account and immediately close the app",
  "When someone asks 'where do you see yourself in 5 years'",
  "When you realize you're now the age your parents were when they seemed old",
  "When you have 3 existential crises before breakfast",
  "When you hear your favorite song on the 'oldies' station",
  "When you wake up before your alarm and just stare at the ceiling",
  "When you try to be productive but Netflix auto-plays the next episode",
  "When you realize your childhood is now considered 'retro'",
  "When you forget why you walked into a room",
  "When the year is almost over and you've done nothing on your resolution list",
  "When you realize adulting is just Googling how to do things",
  "When you can't tell if you're tired or if this is just your personality now",
  "When you sneeze and your back goes out",
  "When you start a sentence with 'back in my day'",
  "When you read the terms and conditions... just kidding, nobody does that",
  "When you realize your sleep schedule is just a suggestion",
  "When you set 15 alarms and still sleep through all of them",

  // Gen Z humor (136-150)
  "No thoughts, just vibes",
  "It's giving main character energy",
  "POV: You forgot to save",
  "Me pretending to understand the meeting",
  "This hits different at 3 AM",
  "Bestie that's a red flag",
  "Living rent-free in my head since forever",
  "Tell me you're sleep-deprived without telling me",
  "That's lowkey the most unhinged thing I've ever heard",
  "When the serotonin hits just right",
  "Caught in 4K doing absolutely nothing productive",
  "The audacity. The absolute audacity.",
  "Manifesting everything except motivation",
  "My toxic trait is thinking I can finish this in 5 minutes",
  "And I took that personally",
];

// ─── Players ───
const PLAYERS = ["You", "Jordan", "Casey", "Alex"] as const;
type PlayerName = (typeof PLAYERS)[number];

// ─── Types ───
interface PlayerState {
  name: PlayerName;
  hand: string[];
  score: number;
}

interface Submission {
  player: PlayerName;
  caption: string;
}

type Phase = "picking" | "waiting" | "reveal" | "judging" | "winner" | "gameOver";

// ─── Shuffle utility ───
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Build initial state ───
function buildInitialState() {
  const deck = shuffle([...ALL_CAPTIONS]);
  const memeDeck = shuffle([...MEME_TEMPLATES]);
  const judgeIndex = Math.floor(Math.random() * 4);

  const players: PlayerState[] = PLAYERS.map((name) => ({
    name,
    hand: deck.splice(0, 7),
    score: 0,
  }));

  return { deck, memeDeck, players, judgeIndex };
}

// ─── Confetti ───
const ConfettiParticle = ({ delay, x }: { delay: number; x: number }) => {
  const colors = ["hsl(38 92% 55%)", "hsl(28 85% 45%)", "hsl(45 100% 65%)", "hsl(38 70% 40%)", "hsl(50 90% 70%)"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 4 + Math.random() * 6;
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -(80 + Math.random() * 120), 60 + Math.random() * 80],
        x: [0, x * (0.5 + Math.random()), x * (0.8 + Math.random() * 0.5)],
        scale: [1, 1.3, 0.3],
        rotate: [0, Math.random() * 720 - 360],
      }}
      transition={{ duration: 1.4 + Math.random() * 0.6, delay, ease: "easeOut" }}
      className="absolute rounded-sm pointer-events-none"
      style={{ width: size, height: size * (0.6 + Math.random() * 0.8), background: color, boxShadow: `0 0 4px ${color}`, top: "50%", left: "50%" }}
    />
  );
};

// ─── Card Back ───
const CardBack = () => (
  <div
    className="w-full h-full rounded-2xl overflow-hidden relative"
    style={{ background: "#0d0d1a", boxShadow: "0 8px 32px -8px rgba(0,0,0,0.7)", border: "1.5px solid hsl(38 70% 40% / 0.5)" }}
  >
    <div className="absolute inset-0 opacity-[0.12]" style={{
      backgroundImage: `linear-gradient(45deg, hsl(38 80% 50%) 25%, transparent 25%), linear-gradient(-45deg, hsl(38 80% 50%) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(38 80% 50%) 75%), linear-gradient(-45deg, transparent 75%, hsl(38 80% 50%) 75%)`,
      backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    }} />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rotate-45 border border-[hsl(38_70%_50%/0.3)] flex items-center justify-center">
        <div className="w-10 h-10 border border-[hsl(38_70%_50%/0.2)] flex items-center justify-center">
          <div className="w-4 h-4 bg-[hsl(38_70%_50%/0.15)]" />
        </div>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-[8px] font-bold tracking-[0.15em] uppercase -rotate-45 opacity-60" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
        WDYM
      </span>
    </div>
  </div>
);

// ─── Hand Card ───
const MemeCard = ({ caption, index, isSelected, onClick, totalCards, disabled }: {
  caption: string; index: number; isSelected: boolean; onClick: () => void; totalCards: number; disabled?: boolean;
}) => {
  const mid = (totalCards - 1) / 2;
  const offset = index - mid;
  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      initial={{ rotateY: 180, opacity: 0 }}
      animate={{ rotateY: 0, opacity: disabled ? 0.5 : 1, y: isSelected ? -28 : 0, rotate: isSelected ? 0 : offset * 3, x: offset * 4, scale: isSelected ? 1.08 : 1 }}
      whileHover={disabled ? {} : { y: -18, scale: 1.05, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ perspective: 800, transformStyle: "preserve-3d" }}
      className={`shrink-0 relative ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <div
        className={`relative w-[120px] md:w-[140px] h-[170px] md:h-[195px] rounded-2xl overflow-hidden transition-shadow duration-300 ${isSelected ? "shadow-[0_0_30px_-4px_hsl(38_92%_55%/0.5)]" : "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]"}`}
        style={{ background: "#0d0d1a" }}
      >
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          border: isSelected ? "2px solid hsl(38 92% 55%)" : "1.5px solid hsl(38 70% 40% / 0.5)",
          boxShadow: isSelected ? "inset 0 0 20px hsl(38 92% 55% / 0.15), 0 0 20px hsl(38 92% 55% / 0.3)" : "inset 0 0 12px hsl(38 92% 55% / 0.06)",
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
          <div className="flex items-end justify-end mt-auto">
            <span className="text-[7px] tracking-wider uppercase" style={{ color: "hsl(38 70% 50% / 0.3)", fontFamily: "'JetBrains Mono', monospace" }}>CAPTION</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Reveal Card (3D flip) ───
const RevealCard = ({ caption, isFlipped, isWinner, isLoser, onClick, dealDelay }: {
  caption: string; isFlipped: boolean; isWinner: boolean; isLoser: boolean; onClick: () => void; dealDelay: number;
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  useEffect(() => {
    if (isWinner && isFlipped) {
      const t = setTimeout(() => setShowConfetti(true), 300);
      return () => clearTimeout(t);
    }
  }, [isWinner, isFlipped]);

  const confetti = Array.from({ length: 40 }, (_, i) => ({ id: i, delay: Math.random() * 0.3, x: (Math.random() - 0.5) * 200 }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: isLoser ? 0.3 : 1, y: 0, scale: isWinner && isFlipped ? 1.1 : isLoser ? 0.92 : 1 }}
      transition={{ delay: dealDelay, type: "spring", stiffness: 200, damping: 18 }}
      onClick={onClick}
      className="relative cursor-pointer"
      style={{ perspective: 800 }}
    >
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
          {confetti.map((p) => <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />)}
        </div>
      )}
      {isWinner && isFlipped && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0.6], scale: [0.8, 1.15, 1.05] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute -inset-3 rounded-3xl pointer-events-none z-10"
          style={{ boxShadow: "0 0 40px hsl(38 92% 55% / 0.4), 0 0 80px hsl(38 92% 55% / 0.15)", border: "2px solid hsl(38 92% 55% / 0.6)" }}
        />
      )}
      <motion.div
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-[130px] md:w-[150px] h-[180px] md:h-[210px]"
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
          backfaceVisibility: "hidden", background: "#0d0d1a",
          border: isWinner && isFlipped ? "2px solid hsl(38 92% 55%)" : "1.5px solid hsl(38 70% 40% / 0.5)",
          boxShadow: isWinner && isFlipped ? "0 0 30px hsl(38 92% 55% / 0.3)" : "0 8px 32px -8px rgba(0,0,0,0.7)",
        }}>
          <div className="relative flex flex-col h-full p-3 md:p-3.5">
            <div className="text-center mb-auto">
              <span className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(38 80% 55%)", fontFamily: "'JetBrains Mono', monospace" }}>What Do You Meme</span>
              <div className="mx-auto mt-1 w-8 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, hsl(38 70% 50% / 0.4), transparent)" }} />
            </div>
            <div className="flex-1 flex items-center justify-center px-1">
              <p className="text-center text-[11px] md:text-xs font-bold leading-snug" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{caption}</p>
            </div>
            <div className="flex items-end justify-end mt-auto">
              <span className="text-[7px] tracking-wider uppercase" style={{ color: "hsl(38 70% 50% / 0.3)", fontFamily: "'JetBrains Mono', monospace" }}>CAPTION</span>
            </div>
          </div>
          {isWinner && isFlipped && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
              className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))", boxShadow: "0 0 16px hsl(38 92% 55% / 0.5)" }}>
              <Crown className="w-4 h-4 text-[#0d0d1a]" />
            </motion.div>
          )}
        </div>
        {/* Back */}
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <CardBack />
          {!isFlipped && (
            <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
              <motion.span animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                className="text-[8px] font-bold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55% / 0.6)" }}>
                TAP TO REVEAL
              </motion.span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Scoreboard Sidebar ───
const Scoreboard = ({ players, judgeIndex, targetScore }: { players: PlayerState[]; judgeIndex: number; targetScore: number }) => (
  <div className="p-3 space-y-2">
    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-center mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
      SCOREBOARD
    </p>
    <p className="text-[9px] text-center mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
      First to {targetScore} wins
    </p>
    {[...players].sort((a, b) => b.score - a.score).map((p) => {
      const isJudge = players[judgeIndex].name === p.name;
      const isYou = p.name === "You";
      return (
        <div key={p.name} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isYou ? "bg-primary/5 border border-primary/20" : "bg-secondary/50 border border-border/30"}`}>
          {isJudge && <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(38 92% 55%)" }} />}
          <span className={`text-xs font-bold flex-1 ${isYou ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {p.name}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: targetScore }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{
                background: i < p.score ? "hsl(38 92% 55%)" : "hsl(240 10% 20%)",
                boxShadow: i < p.score ? "0 0 6px hsl(38 92% 55% / 0.4)" : "none",
              }} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Gold Button ───
const GoldButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105"
    style={{
      background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(28 85% 45%))", color: "#0d0d1a",
      boxShadow: "0 0 30px -6px hsl(38 92% 55% / 0.4)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
    }}>
    {children}
  </button>
);

// ─── Main Game ───
const WINNING_SCORE = 5;

const MemeGame = () => {
  const [phase, setPhase] = useState<Phase>("picking");
  const [deck, setDeck] = useState<string[]>([]);
  const [memeDeck, setMemeDeck] = useState<typeof MEME_TEMPLATES>([]);
  const [memeIndex, setMemeIndex] = useState(0);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [judgeIndex, setJudgeIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [aiSubmitCount, setAiSubmitCount] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [winnerSub, setWinnerSub] = useState<Submission | null>(null);
  const [playerSubmitted, setPlayerSubmitted] = useState(false);
  const initRef = useRef(false);

  // Initialize game
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const state = buildInitialState();
    setDeck(state.deck);
    setMemeDeck(state.memeDeck);
    setPlayers(state.players);
    setJudgeIndex(state.judgeIndex);
    playCardShuffle();
  }, []);

  const currentMeme = memeDeck[memeIndex] || MEME_TEMPLATES[0];
  const isPlayerJudge = players.length > 0 && players[judgeIndex]?.name === "You";
  const aiPlayers = players.filter((p) => p.name !== "You");
  const playerState = players.find((p) => p.name === "You");

  // Determine phase on mount based on judge
  useEffect(() => {
    if (players.length === 0) return;
    if (round === 1 && phase === "picking") {
      setPhase(isPlayerJudge ? "waiting" : "picking");
    }
  }, [players, isPlayerJudge]);

  // AI auto-submit for picking/waiting phase
  const aiSubmitRef = useRef(false);
  useEffect(() => {
    if (players.length === 0) return;
    if (phase !== "picking" && phase !== "waiting") return;
    if (aiSubmitRef.current) return;
    aiSubmitRef.current = true;

    const nonJudgeAI = aiPlayers.filter((p) => p.name !== players[judgeIndex]?.name);

    const timers = nonJudgeAI.map((aiP, idx) => {
      const delay = 1000 + Math.random() * 2000 + idx * 800;
      return setTimeout(() => {
        const cardIdx = Math.floor(Math.random() * aiP.hand.length);
        const caption = aiP.hand[cardIdx];
        setSubmissions((prev) => {
          if (prev.find((s) => s.player === aiP.name)) return prev;
          return [...prev, { player: aiP.name, caption }];
        });
        playCardFlip();
      }, delay);
    });

    return () => timers.forEach(clearTimeout);
  }, [phase, players, judgeIndex]);

  // Check if all submissions are in to move to reveal
  const totalNonJudge = players.length > 0 ? players.filter((_, i) => i !== judgeIndex).length : 0;
  const totalSubmitted = submissions.length;

  useEffect(() => {
    if (totalSubmitted === totalNonJudge && totalNonJudge > 0 && (phase === "picking" || phase === "waiting")) {
      const t = setTimeout(() => {
        playCardShuffle();
        setPhase("reveal");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [totalSubmitted, totalNonJudge, phase]);

  // Player picks a card
  const handlePlayerSubmit = useCallback(() => {
    if (selectedCard === null || !playerState || playerSubmitted) return;
    const caption = playerState.hand[selectedCard];
    setSubmissions((prev) => [...prev, { player: "You", caption }]);
    setPlayerSubmitted(true);
    playCardFlip();
  }, [selectedCard, playerState, playerSubmitted]);

  // Flip a reveal card
  const handleFlip = useCallback((index: number) => {
    if (phase !== "reveal" || flippedCards.has(index)) return;
    playCardFlip();
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      if (next.size === submissions.length) {
        setTimeout(() => setPhase("judging"), 800);
      }
      return next;
    });
  }, [phase, flippedCards, submissions.length]);

  // AI judge picks winner
  useEffect(() => {
    if (phase !== "judging" || isPlayerJudge) return;
    const t = setTimeout(() => {
      // AI judge: slight bias toward longer captions
      const weights = submissions.map((s) => s.caption.length + Math.random() * 30);
      const maxIdx = weights.indexOf(Math.max(...weights));
      const winner = submissions[maxIdx];
      setWinnerSub(winner);
      playVictoryFanfare();
      setPlayers((prev) => prev.map((p) => p.name === winner.player ? { ...p, score: p.score + 1 } : p));
      setPhase("winner");
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, isPlayerJudge, submissions]);

  // Player judge picks winner
  const handleJudgePick = useCallback((sub: Submission) => {
    setWinnerSub(sub);
    playVictoryFanfare();
    setPlayers((prev) => prev.map((p) => p.name === sub.player ? { ...p, score: p.score + 1 } : p));
    setPhase("winner");
  }, []);

  // Check for game over
  useEffect(() => {
    if (phase === "winner") {
      const won = players.find((p) => p.score >= WINNING_SCORE);
      if (won) {
        const t = setTimeout(() => setPhase("gameOver"), 2500);
        return () => clearTimeout(t);
      }
    }
  }, [phase, players]);

  // Next round
  const handleNextRound = useCallback(() => {
    // Remove played cards from hands, draw back to 7
    setPlayers((prev) => {
      let currentDeck = [...deck];
      const discards: string[] = [];

      const updated = prev.map((p) => {
        const sub = submissions.find((s) => s.player === p.name);
        let hand = sub ? p.hand.filter((c) => c !== sub.caption) : [...p.hand];
        // If hand is already short for some reason, keep it
        discards.push(...(sub ? [sub.caption] : []));

        while (hand.length < 7 && currentDeck.length > 0) {
          hand.push(currentDeck.pop()!);
        }
        return { ...p, hand };
      });

      // If deck is low, reshuffle discards back in
      if (currentDeck.length < 10) {
        currentDeck = shuffle([...currentDeck, ...discards]);
      }
      setDeck(currentDeck);
      return updated;
    });

    const nextJudge = (judgeIndex + 1) % 4;
    const nextMemeIdx = (memeIndex + 1) % memeDeck.length;
    const nextRound = round + 1;

    setJudgeIndex(nextJudge);
    setMemeIndex(nextMemeIdx);
    setRound(nextRound);
    setSelectedCard(null);
    setSubmissions([]);
    setFlippedCards(new Set());
    setWinnerSub(null);
    setPlayerSubmitted(false);
    aiSubmitRef.current = false;

    const nextIsPlayerJudge = players[nextJudge]?.name === "You";
    setPhase(nextIsPlayerJudge ? "waiting" : "picking");
    playCardShuffle();
  }, [deck, submissions, judgeIndex, memeIndex, memeDeck.length, round, players]);

  // New game
  const handleNewGame = useCallback(() => {
    initRef.current = false;
    const state = buildInitialState();
    setDeck(state.deck);
    setMemeDeck(state.memeDeck);
    setPlayers(state.players);
    setJudgeIndex(state.judgeIndex);
    setMemeIndex(0);
    setRound(1);
    setSelectedCard(null);
    setSubmissions([]);
    setFlippedCards(new Set());
    setWinnerSub(null);
    setPlayerSubmitted(false);
    aiSubmitRef.current = false;
    setPhase(state.players[state.judgeIndex].name === "You" ? "waiting" : "picking");
    playCardShuffle();
  }, []);

  if (players.length === 0) return null;

  const judgeName = players[judgeIndex]?.name || "?";
  const shuffledSubs = submissions; // already anonymous during reveal

  const sidebar = <Scoreboard players={players} judgeIndex={judgeIndex} targetScore={WINNING_SCORE} />;

  return (
    <GameLayout title="What Do You Meme" sidebar={sidebar}>
      <div className="flex flex-col h-full">
        {/* Top content area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Round + Judge header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">
                Round {round}
              </span>
              <span className="text-xs font-body text-muted-foreground flex items-center gap-1">
                <Crown className="w-3 h-3 inline" style={{ color: "hsl(38 92% 55%)" }} /> Judge: {judgeName}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {/* ── PICKING PHASE ── */}
              {phase === "picking" && (
                <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative rounded-xl border-2 border-border/30 overflow-hidden shadow-card-hover bg-secondary">
                    <img src={currentMeme.url} alt={currentMeme.name} className="w-full aspect-square object-contain bg-white" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm border border-border/30">
                      <span className="text-[10px] font-display font-semibold text-foreground">{currentMeme.name}</span>
                    </div>
                  </div>
                  {/* Submission progress */}
                  <div className="mt-3 text-center">
                    <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.5)" }}>
                      {totalSubmitted}/{totalNonJudge} submitted
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── WAITING (player is judge) ── */}
              {phase === "waiting" && (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative rounded-xl border-2 border-border/30 overflow-hidden shadow-card-hover bg-secondary">
                    <img src={currentMeme.url} alt={currentMeme.name} className="w-full aspect-square object-contain bg-white" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm border border-border/30">
                      <span className="text-[10px] font-display font-semibold text-foreground">{currentMeme.name}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm font-bold tracking-[0.1em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                      You are the judge this round
                    </p>
                    <p className="text-[10px] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                      Waiting for players to submit...
                    </p>
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-2">
                      <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.6)" }}>
                        {totalSubmitted}/{totalNonJudge} submitted
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ── REVEAL PHASE ── */}
              {phase === "reveal" && (
                <motion.div key="reveal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {/* Meme image small */}
                  <div className="relative rounded-xl border border-border/30 overflow-hidden mb-4 max-w-[200px] mx-auto">
                    <img src={currentMeme.url} alt={currentMeme.name} className="w-full aspect-square object-contain bg-white" />
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                      TAP TO REVEAL
                    </p>
                    <p className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                      Flip each card to see the captions
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {shuffledSubs.map((sub, i) => (
                      <RevealCard
                        key={i}
                        caption={sub.caption}
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

              {/* ── JUDGING PHASE ── */}
              {phase === "judging" && (
                <motion.div key="judging" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="relative rounded-xl border border-border/30 overflow-hidden mb-4 max-w-[200px] mx-auto">
                    <img src={currentMeme.url} alt={currentMeme.name} className="w-full aspect-square object-contain bg-white" />
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-sm font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                      {isPlayerJudge ? "PICK THE FUNNIEST" : `${judgeName} IS JUDGING...`}
                    </p>
                    {isPlayerJudge && (
                      <p className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                        Click the caption you think is funniest
                      </p>
                    )}
                    {!isPlayerJudge && (
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <p className="text-[10px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                          Thinking...
                        </p>
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {submissions.map((sub, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={isPlayerJudge ? () => handleJudgePick(sub) : undefined}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isPlayerJudge ? "cursor-pointer hover:scale-[1.02]" : ""}`}
                        style={{
                          background: "hsl(240 10% 9%)",
                          border: "1px solid hsl(240 8% 18% / 0.5)",
                        }}
                        whileHover={isPlayerJudge ? { borderColor: "hsl(38 70% 50% / 0.4)" } : {}}
                      >
                        <p className="text-xs font-bold leading-snug flex-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4" }}>
                          "{sub.caption}"
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── WINNER PHASE ── */}
              {phase === "winner" && winnerSub && (
                <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-5">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }} className="text-5xl mb-3">
                      <Crown className="w-12 h-12 mx-auto" style={{ color: "hsl(38 92% 55%)" }} />
                    </motion.div>
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="text-lg font-bold tracking-[0.1em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                      {winnerSub.player} WINS THE ROUND!
                    </motion.p>
                  </div>
                  {/* Winning combo */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="relative mx-auto rounded-2xl overflow-hidden p-5" style={{
                      background: "#0d0d1a", border: "2px solid hsl(38 92% 55%)",
                      boxShadow: "0 0 40px hsl(38 92% 55% / 0.3), 0 0 80px hsl(38 92% 55% / 0.1)", maxWidth: 320,
                    }}>
                    <div className="rounded-lg overflow-hidden mb-3 max-w-[180px] mx-auto">
                      <img src={currentMeme.url} alt={currentMeme.name} className="w-full aspect-square object-contain bg-white" />
                    </div>
                    <p className="text-center text-sm font-bold leading-snug relative" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4" }}>
                      "{winnerSub.caption}"
                    </p>
                    <p className="text-center text-[10px] mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.6)" }}>
                      -- {winnerSub.player}
                    </p>
                    {/* Confetti */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible">
                      {Array.from({ length: 30 }, (_, i) => (
                        <ConfettiParticle key={i} delay={Math.random() * 0.5} x={(Math.random() - 0.5) * 200} />
                      ))}
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="flex justify-center mt-5">
                    <GoldButton onClick={handleNextRound}>NEXT ROUND</GoldButton>
                  </motion.div>
                </motion.div>
              )}

              {/* ── GAME OVER ── */}
              {phase === "gameOver" && (
                <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="text-6xl mb-4">
                      <Crown className="w-16 h-16 mx-auto" style={{ color: "hsl(38 92% 55%)" }} />
                    </motion.div>
                    <p className="text-2xl font-bold tracking-[0.1em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                      GAME OVER
                    </p>
                    {(() => {
                      const winner = [...players].sort((a, b) => b.score - a.score)[0];
                      return (
                        <p className="text-lg mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4" }}>
                          {winner.name} wins with {winner.score} points!
                        </p>
                      );
                    })()}
                  </div>
                  {/* Final scores */}
                  <div className="space-y-2 max-w-xs mx-auto mb-6">
                    {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{
                        background: i === 0 ? "hsl(240 10% 12%)" : "hsl(240 10% 9%)",
                        border: i === 0 ? "1.5px solid hsl(38 70% 50% / 0.4)" : "1px solid hsl(240 8% 18% / 0.3)",
                      }}>
                        <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: i === 0 ? "hsl(38 92% 55%)" : "hsl(40 15% 60%)" }}>
                          #{i + 1}
                        </span>
                        <span className="text-xs font-bold flex-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f0ece4" }}>
                          {p.name}
                        </span>
                        <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                          {p.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <GoldButton onClick={handleNewGame}>PLAY AGAIN</GoldButton>
                  </div>
                  {/* Confetti */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {Array.from({ length: 50 }, (_, i) => (
                      <ConfettiParticle key={i} delay={Math.random() * 1} x={(Math.random() - 0.5) * 400} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Player's Hand (bottom) ── */}
        <AnimatePresence>
          {phase === "picking" && !playerSubmitted && playerState && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="border-t p-4 pb-6"
              style={{ borderColor: "hsl(38 70% 40% / 0.15)", background: "linear-gradient(180deg, hsl(240 12% 7%) 0%, hsl(240 15% 5%) 100%)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-4 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.5)" }}>
                Pick your best caption
              </p>
              <div className="flex items-end justify-center gap-1 md:gap-1.5 overflow-x-auto pb-2 px-4">
                {playerState.hand.map((caption, i) => (
                  <MemeCard
                    key={caption}
                    caption={caption}
                    index={i}
                    isSelected={selectedCard === i}
                    onClick={() => setSelectedCard(i === selectedCard ? null : i)}
                    totalCards={playerState.hand.length}
                  />
                ))}
              </div>
              <AnimatePresence>
                {selectedCard !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex justify-center mt-4">
                    <GoldButton onClick={handlePlayerSubmit}>SUBMIT CAPTION</GoldButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          {phase === "picking" && playerSubmitted && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t p-6 text-center"
              style={{ borderColor: "hsl(38 70% 40% / 0.15)", background: "linear-gradient(180deg, hsl(240 12% 7%) 0%, hsl(240 15% 5%) 100%)" }}>
              <p className="text-sm font-bold tracking-[0.1em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 80% 55%)" }}>
                Caption submitted!
              </p>
              <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[10px] mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "hsl(38 70% 50% / 0.4)" }}>
                Waiting for other players...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default MemeGame;
