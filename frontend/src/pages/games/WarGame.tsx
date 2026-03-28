import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, RotateCcw, Trophy } from "lucide-react";
import GameLayout from "@/components/GameLayout";

/* ── Card data ─────────────────────────────────────────────────────────── */

const suits = ["\u2660", "\u2665", "\u2666", "\u2663"] as const;
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
const isRed = (suit: string) => suit === "\u2665" || suit === "\u2666";

interface Card {
  suit: string;
  value: string;
  rank: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of suits) {
    for (let i = 0; i < values.length; i++) {
      deck.push({ suit: s, value: values[i], rank: i + 2 });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

type BattleResult = "win" | "lose" | "war" | null;

/* ── Playing Card Component ────────────────────────────────────────────── */

const PlayingCard = ({ card, faceDown, className }: { card: Card | null; faceDown?: boolean; className?: string }) => {
  if (!card) {
    return <div className={`w-28 h-40 md:w-32 md:h-48 rounded-xl bg-secondary/30 border-2 border-dashed border-border/20 ${className || ""}`} />;
  }

  if (faceDown) {
    return (
      <div className={`w-28 h-40 md:w-32 md:h-48 rounded-xl bg-gradient-to-br from-primary/20 via-secondary to-primary/10 border-2 border-border/30 shadow-card flex items-center justify-center ${className || ""}`}>
        <div className="w-16 h-24 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-center">
          <span className="font-display text-lg font-bold text-primary/40">W</span>
        </div>
      </div>
    );
  }

  const red = isRed(card.suit);

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`w-28 h-40 md:w-32 md:h-48 rounded-xl bg-card border-2 ${red ? "border-red-400/30" : "border-border/30"} shadow-card-hover flex flex-col items-center justify-center relative ${className || ""}`}
    >
      <span className={`absolute top-2 left-2.5 font-display text-sm font-bold ${red ? "text-red-400" : "text-foreground"}`}>{card.value}</span>
      <span className={`absolute top-5 left-2.5 text-xs ${red ? "text-red-400" : "text-foreground"}`}>{card.suit}</span>
      <span className={`text-4xl md:text-5xl font-display font-bold ${red ? "text-red-400" : "text-foreground"}`}>{card.value}</span>
      <span className={`text-3xl md:text-4xl ${red ? "text-red-400" : "text-foreground"}`}>{card.suit}</span>
      <span className={`absolute bottom-2 right-2.5 font-display text-sm font-bold rotate-180 ${red ? "text-red-400" : "text-foreground"}`}>{card.value}</span>
    </motion.div>
  );
};

/* ── Main Component ────────────────────────────────────────────────────── */

const WarGame = () => {
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [cpuDeck, setCpuDeck] = useState<Card[]>([]);
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [cpuCard, setCpuCard] = useState<Card | null>(null);
  const [warCards, setWarCards] = useState<{ player: Card[]; cpu: Card[] }>({ player: [], cpu: [] });
  const [result, setResult] = useState<BattleResult>(null);
  const [warMode, setWarMode] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready");
  const [winner, setWinner] = useState<"player" | "cpu" | null>(null);
  const [battles, setBattles] = useState(0);
  const [wars, setWars] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const startGame = useCallback(() => {
    const deck = createDeck();
    setPlayerDeck(deck.slice(0, 26));
    setCpuDeck(deck.slice(26));
    setPlayerCard(null);
    setCpuCard(null);
    setWarCards({ player: [], cpu: [] });
    setResult(null);
    setWarMode(false);
    setFlipping(false);
    setGameState("playing");
    setWinner(null);
    setBattles(0);
    setWars(0);
    setMessage(null);
  }, []);

  // Check for game over
  useEffect(() => {
    if (gameState !== "playing") return;
    if (playerDeck.length === 0 && !flipping && result !== null) {
      setGameState("finished");
      setWinner("cpu");
    } else if (cpuDeck.length === 0 && !flipping && result !== null) {
      setGameState("finished");
      setWinner("player");
    }
  }, [playerDeck.length, cpuDeck.length, gameState, flipping, result]);

  const resolveBattle = useCallback((pCard: Card, cCard: Card, pDeck: Card[], cDeck: Card[], accPlayer: Card[], accCpu: Card[]) => {
    setBattles((b) => b + 1);

    if (pCard.rank > cCard.rank) {
      // Player wins - collect all cards
      const won = [pCard, cCard, ...accPlayer, ...accCpu];
      // Shuffle winnings
      for (let i = won.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [won[i], won[j]] = [won[j], won[i]];
      }
      setPlayerDeck([...pDeck, ...won]);
      setCpuDeck([...cDeck]);
      setResult("win");
      setWarMode(false);
      setWarCards({ player: [], cpu: [] });
      setMessage(`You win! (+${won.length} cards)`);
    } else if (cCard.rank > pCard.rank) {
      // CPU wins
      const won = [pCard, cCard, ...accPlayer, ...accCpu];
      for (let i = won.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [won[i], won[j]] = [won[j], won[i]];
      }
      setCpuDeck([...cDeck, ...won]);
      setPlayerDeck([...pDeck]);
      setResult("lose");
      setWarMode(false);
      setWarCards({ player: [], cpu: [] });
      setMessage(`CPU wins! (+${won.length} cards)`);
    } else {
      // WAR!
      setResult("war");
      setWarMode(true);
      setWars((w) => w + 1);
      setMessage("WAR!");

      // Each player puts 3 cards face down (or whatever they have)
      const pWarCount = Math.min(3, pDeck.length);
      const cWarCount = Math.min(3, cDeck.length);

      if (pWarCount === 0 || cWarCount === 0) {
        // One player can't complete the war
        if (pWarCount === 0) {
          setGameState("finished");
          setWinner("cpu");
        } else {
          setGameState("finished");
          setWinner("player");
        }
        return;
      }

      const pWarCards = pDeck.splice(0, pWarCount);
      const cWarCards = cDeck.splice(0, cWarCount);

      setWarCards({
        player: [...accPlayer, pCard, ...pWarCards],
        cpu: [...accCpu, cCard, ...cWarCards],
      });
      setPlayerDeck([...pDeck]);
      setCpuDeck([...cDeck]);
    }
  }, []);

  const flipCards = useCallback(() => {
    if (flipping || gameState !== "playing") return;

    const pDeck = [...playerDeck];
    const cDeck = [...cpuDeck];

    if (pDeck.length === 0 || cDeck.length === 0) {
      setGameState("finished");
      setWinner(pDeck.length === 0 ? "cpu" : "player");
      return;
    }

    setFlipping(true);
    setResult(null);
    setMessage(null);

    const pCard = pDeck.shift()!;
    const cCard = cDeck.shift()!;

    setPlayerCard(pCard);
    setCpuCard(cCard);

    // Collect any accumulated war cards
    const accPlayer = warCards.player;
    const accCpu = warCards.cpu;

    setTimeout(() => {
      resolveBattle(pCard, cCard, pDeck, cDeck, accPlayer, accCpu);
      setFlipping(false);
    }, 800);
  }, [flipping, gameState, playerDeck, cpuDeck, warCards, resolveBattle]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (gameState === "ready" || gameState === "finished") startGame();
        else flipCards();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, flipCards, startGame]);

  const resultColor = result === "win" ? "text-primary" : result === "lose" ? "text-destructive" : result === "war" ? "text-yellow-400" : "";

  return (
    <GameLayout title="War">
      <div className="flex flex-col items-center justify-center h-full p-4 gap-6">
        {/* Ready / Finished */}
        {(gameState === "ready" || gameState === "finished") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm max-w-md"
          >
            {gameState === "finished" ? (
              <>
                <span className="text-6xl block mb-4">{winner === "player" ? "\uD83C\uDFC6" : "\uD83D\uDE14"}</span>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {winner === "player" ? "You Win!" : "CPU Wins!"}
                </h2>
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-primary">{battles}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase">Battles</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-yellow-400">{wars}</p>
                    <p className="text-[10px] font-body text-muted-foreground uppercase">Wars</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Swords className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">War</h2>
                <p className="text-sm font-body text-muted-foreground mb-2">Classic card game vs the computer.</p>
                <p className="text-xs font-body text-muted-foreground mb-6">Higher card wins. Ties cause WAR -- 3 cards face down, then flip again!</p>
              </>
            )}
            <button onClick={startGame} className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow">
              {gameState === "finished" ? "Play Again" : "Start Game"}
            </button>
            <p className="text-[10px] font-body text-muted-foreground mt-3">Press Space to play</p>
          </motion.div>
        )}

        {/* Playing */}
        {gameState === "playing" && (
          <>
            {/* Deck counts */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-body text-muted-foreground uppercase mb-1">Your Deck</p>
                <p className="font-display text-2xl font-bold text-primary">{playerDeck.length}</p>
              </div>
              <div className="flex flex-col items-center">
                <Swords className="w-5 h-5 text-muted-foreground/40 mb-1" />
                <span className="text-[10px] font-body text-muted-foreground">Battle #{battles + 1}</span>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-body text-muted-foreground uppercase mb-1">CPU Deck</p>
                <p className="font-display text-2xl font-bold text-foreground">{cpuDeck.length}</p>
              </div>
            </div>

            {/* War cards (face down cards in war) */}
            {warMode && warCards.player.length > 0 && (
              <div className="flex items-center gap-8">
                <div className="flex -space-x-6">
                  {warCards.player.slice(-3).map((_, i) => (
                    <PlayingCard key={`pw-${i}`} card={{ suit: "", value: "", rank: 0 }} faceDown className="!w-20 !h-28 md:!w-24 md:!h-32" />
                  ))}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="px-3 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/40"
                >
                  <span className="text-sm font-display font-bold text-yellow-400">WAR!</span>
                </motion.div>
                <div className="flex -space-x-6">
                  {warCards.cpu.slice(-3).map((_, i) => (
                    <PlayingCard key={`cw-${i}`} card={{ suit: "", value: "", rank: 0 }} faceDown className="!w-20 !h-28 md:!w-24 md:!h-32" />
                  ))}
                </div>
              </div>
            )}

            {/* Main battle cards */}
            <div className="flex items-center gap-8 md:gap-16">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-display font-semibold text-muted-foreground uppercase">You</span>
                <PlayingCard card={playerCard} />
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-muted-foreground/30 font-display text-3xl font-bold">{"\u2694"}</span>
                <AnimatePresence>
                  {result && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`text-sm font-display font-bold ${resultColor}`}
                    >
                      {result === "win" ? "WIN" : result === "lose" ? "LOSE" : "TIE"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-display font-semibold text-muted-foreground uppercase">CPU</span>
                <PlayingCard card={cpuCard} />
              </div>
            </div>

            {/* Message */}
            <div className="h-6">
              <AnimatePresence>
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-sm font-display font-bold ${resultColor}`}
                  >
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Flip Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={flipCards}
              disabled={flipping}
              className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 flex items-center gap-3"
            >
              <Swords className="w-5 h-5" />
              {warMode ? "Flip War Cards" : "Flip Cards"}
            </motion.button>

            {/* Progress bar */}
            <div className="w-64 flex items-center gap-2">
              <span className="text-[10px] font-body text-primary">{playerDeck.length}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(playerDeck.length / 52) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-body text-muted-foreground">{cpuDeck.length}</span>
            </div>

            <p className="text-[10px] font-body text-muted-foreground">Press Space to flip</p>
          </>
        )}
      </div>
    </GameLayout>
  );
};

export default WarGame;
