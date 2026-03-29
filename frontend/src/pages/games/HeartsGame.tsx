import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playCardDeal, playCardShuffle, playVictoryFanfare, playMiss, playPieceSelect, playPieceDeselect } from "@/lib/sounds";

// ── Types ──────────────────────────────────────────────────────────────────────

type Suit = "S" | "H" | "D" | "C";
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
interface Card { suit: Suit; rank: Rank }
type Player = 0 | 1 | 2 | 3; // 0=South(You), 1=West, 2=North, 3=East
type PassDir = "left" | "right" | "across" | "none";

const SUITS: Suit[] = ["C", "D", "S", "H"];
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const PASS_CYCLE: PassDir[] = ["left", "right", "across", "none"];
const PLAYER_NAMES = ["You", "West", "North", "East"];
const POINT_LIMIT = 100;

// ── Helpers ────────────────────────────────────────────────────────────────────

const suitSymbol = (s: Suit) => ({ S: "♠", H: "♥", D: "♦", C: "♣" }[s]);
const suitColor = (s: Suit) => (s === "H" || s === "D" ? "text-red-500" : "text-slate-200");
const rankLabel = (r: Rank) => ({ 11: "J", 12: "Q", 13: "K", 14: "A" }[r] ?? String(r));
const cardKey = (c: Card) => `${c.suit}${c.rank}`;
const cardLabel = (c: Card) => `${rankLabel(c.rank)}${suitSymbol(c.suit)}`;
const isQS = (c: Card) => c.suit === "S" && c.rank === 12;
const cardPoints = (c: Card) => (c.suit === "H" ? 1 : isQS(c) ? 13 : 0);
const cardSort = (a: Card, b: Card) => SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || a.rank - b.rank;

function makeDeck(): Card[] {
  const d: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) d.push({ suit, rank });
  return d;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function deal(): Card[][] {
  const deck = shuffle(makeDeck());
  return [deck.slice(0, 13).sort(cardSort), deck.slice(13, 26).sort(cardSort), deck.slice(26, 39).sort(cardSort), deck.slice(39).sort(cardSort)];
}

function passTarget(from: Player, dir: PassDir): Player {
  if (dir === "left") return ((from + 1) % 4) as Player;
  if (dir === "right") return ((from + 3) % 4) as Player;
  return ((from + 2) % 4) as Player;
}

function trickWinner(trick: { player: Player; card: Card }[]): Player {
  const leadSuit = trick[0].card.suit;
  let best = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (trick[i].card.suit === leadSuit && trick[i].card.rank > best.card.rank) best = trick[i];
  }
  return best.player;
}

function trickPoints(trick: { player: Player; card: Card }[]): number {
  return trick.reduce((s, t) => s + cardPoints(t.card), 0);
}

// ── AI Logic ───────────────────────────────────────────────────────────────────

function aiPickPassCards(hand: Card[]): Card[] {
  const sorted = [...hand].sort((a, b) => {
    if (isQS(a)) return -1; if (isQS(b)) return 1;
    if (a.suit === "S" && a.rank >= 12) return -1; if (b.suit === "S" && b.rank >= 12) return 1;
    if (a.suit === "H" && b.suit !== "H") return -1; if (b.suit === "H" && a.suit !== "H") return 1;
    return b.rank - a.rank;
  });
  return sorted.slice(0, 3);
}

function aiChooseCard(hand: Card[], trick: { player: Player; card: Card }[], heartsBroken: boolean, isFirstTrick: boolean): Card {
  const leadSuit = trick.length > 0 ? trick[0].card.suit : null;
  const matching = leadSuit ? hand.filter(c => c.suit === leadSuit) : [];

  if (trick.length === 0) {
    // Leading
    if (isFirstTrick) return hand.find(c => c.suit === "C" && c.rank === 2)!;
    const safe = hand.filter(c => c.suit !== "H" && !isQS(c));
    const leadable = heartsBroken ? hand : (safe.length > 0 ? safe : hand);
    return leadable.sort((a, b) => a.rank - b.rank)[0];
  }

  if (matching.length > 0) {
    // Must follow suit
    const trickHasPoints = trick.some(t => cardPoints(t.card) > 0);
    const highestLead = Math.max(...trick.filter(t => t.card.suit === leadSuit).map(t => t.card.rank));
    if (trick.length === 3 && !trickHasPoints) {
      // Last to play, trick is safe — play highest under-card or highest
      const under = matching.filter(c => c.rank < highestLead);
      return (under.length > 0 ? under : matching).sort((a, b) => b.rank - a.rank)[0];
    }
    // Play lowest to avoid winning points
    return matching.sort((a, b) => a.rank - b.rank)[0];
  }

  // Can't follow suit — dump points
  if (isFirstTrick) {
    const noPoints = hand.filter(c => !cardPoints(c));
    return (noPoints.length > 0 ? noPoints : hand).sort((a, b) => b.rank - a.rank)[0];
  }
  const qs = hand.find(c => isQS(c));
  if (qs) return qs;
  const hearts = hand.filter(c => c.suit === "H").sort((a, b) => b.rank - a.rank);
  if (hearts.length > 0) return hearts[0];
  return hand.sort((a, b) => b.rank - a.rank)[0];
}

// ── Card Component ─────────────────────────────────────────────────────────────

const CardFace = ({ card, small, faceDown }: { card: Card; small?: boolean; faceDown?: boolean }) => {
  if (faceDown) {
    return (
      <div className={`${small ? "w-10 h-14" : "w-16 h-24"} rounded-lg bg-gradient-to-br from-indigo-800 to-indigo-950 border border-indigo-600/40 shadow-md flex items-center justify-center`}>
        <div className={`${small ? "w-6 h-8" : "w-10 h-14"} rounded border border-indigo-500/30 bg-indigo-900/50`} />
      </div>
    );
  }
  const color = suitColor(card.suit);
  return (
    <div className={`${small ? "w-10 h-14" : "w-16 h-24"} rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/60 shadow-md flex flex-col items-center justify-center relative`}>
      <span className={`${small ? "text-xs" : "text-sm"} font-bold absolute top-1 left-1.5 ${color}`}>{rankLabel(card.rank)}</span>
      <span className={`${small ? "text-lg" : "text-2xl"} ${color}`}>{suitSymbol(card.suit)}</span>
      <span className={`${small ? "text-xs" : "text-sm"} font-bold absolute bottom-1 right-1.5 rotate-180 ${color}`}>{rankLabel(card.rank)}</span>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

type Phase = "passing" | "playing" | "trickEnd" | "handEnd" | "gameOver";

const HeartsGame = () => {
  const [hands, setHands] = useState<Card[][]>(() => deal());
  const [phase, setPhase] = useState<Phase>("passing");
  const [passDir, setPassDir] = useState<PassDir>("left");
  const [handNumber, setHandNumber] = useState(0);
  const [scores, setScores] = useState([0, 0, 0, 0]);
  const [handPoints, setHandPoints] = useState([0, 0, 0, 0]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [currentTrick, setCurrentTrick] = useState<{ player: Player; card: Card }[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(0);
  const [heartsBroken, setHeartsBroken] = useState(false);
  const [isFirstTrick, setIsFirstTrick] = useState(true);
  const [trickWinnerP, setTrickWinnerP] = useState<Player | null>(null);
  const [tricksPlayed, setTricksPlayed] = useState(0);
  const [handSummary, setHandSummary] = useState<number[] | null>(null);
  const [gameWinner, setGameWinner] = useState<number | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up AI timer on unmount
  useEffect(() => () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); }, []);

  // ── Determine playable cards for human ───────────────────────────────────
  const getPlayable = useCallback((hand: Card[]): Set<string> => {
    if (phase !== "playing" || currentPlayer !== 0) return new Set();
    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const playable = new Set<string>();

    if (currentTrick.length === 0) {
      // Leading
      if (isFirstTrick) {
        const c2 = hand.find(c => c.suit === "C" && c.rank === 2);
        if (c2) { playable.add(cardKey(c2)); return playable; }
      }
      for (const c of hand) {
        if (!heartsBroken && c.suit === "H") continue;
        playable.add(cardKey(c));
      }
      // If only hearts left, allow them
      if (playable.size === 0) hand.forEach(c => playable.add(cardKey(c)));
      return playable;
    }

    const matching = hand.filter(c => c.suit === leadSuit);
    if (matching.length > 0) {
      matching.forEach(c => playable.add(cardKey(c)));
    } else {
      if (isFirstTrick) {
        // Can't play points on first trick
        const noPoints = hand.filter(c => !cardPoints(c));
        (noPoints.length > 0 ? noPoints : hand).forEach(c => playable.add(cardKey(c)));
      } else {
        hand.forEach(c => playable.add(cardKey(c)));
      }
    }
    return playable;
  }, [phase, currentPlayer, currentTrick, heartsBroken, isFirstTrick]);

  // ── Start hand ───────────────────────────────────────────────────────────
  const startHand = useCallback(() => {
    const h = deal();
    setHands(h);
    setHandPoints([0, 0, 0, 0]);
    setCurrentTrick([]);
    setHeartsBroken(false);
    setIsFirstTrick(true);
    setTricksPlayed(0);
    setTrickWinnerP(null);
    setHandSummary(null);
    const dir = PASS_CYCLE[handNumber % 4];
    setPassDir(dir);
    setSelectedCards([]);
    playCardShuffle();
    if (dir === "none") {
      setPhase("playing");
      const starter = h.findIndex(hand => hand.some(c => c.suit === "C" && c.rank === 2)) as Player;
      setCurrentPlayer(starter);
    } else {
      setPhase("passing");
    }
  }, [handNumber]);

  // Initialize
  useEffect(() => { startHand(); }, []);

  // ── Pass cards ───────────────────────────────────────────────────────────
  const confirmPass = useCallback(() => {
    if (selectedCards.length !== 3 || passDir === "none") return;
    const newHands = hands.map(h => [...h]);

    // Collect pass sets for each player
    const passes: Card[][] = [[], [], [], []];
    // Human passes selected cards
    passes[0] = selectedCards.map(k => newHands[0].find(c => cardKey(c) === k)!);
    // AI picks passes
    for (let p = 1; p <= 3; p++) passes[p] = aiPickPassCards(newHands[p]);

    // Remove from hands
    for (let p = 0; p < 4; p++) {
      const keys = new Set(passes[p].map(cardKey));
      newHands[p] = newHands[p].filter(c => !keys.has(cardKey(c)));
    }
    // Add to targets
    for (let p = 0; p < 4; p++) {
      const target = passTarget(p as Player, passDir);
      newHands[target].push(...passes[p]);
      newHands[target].sort(cardSort);
    }

    setHands(newHands);
    setSelectedCards([]);
    playCardDeal();
    setPhase("playing");
    const starter = newHands.findIndex(hand => hand.some(c => c.suit === "C" && c.rank === 2)) as Player;
    setCurrentPlayer(starter);
  }, [selectedCards, passDir, hands]);

  // ── Play a card ──────────────────────────────────────────────────────────
  const playCard = useCallback((player: Player, card: Card) => {
    // Remove from hand
    setHands(prev => {
      const n = prev.map(h => [...h]);
      n[player] = n[player].filter(c => cardKey(c) !== cardKey(card));
      return n;
    });

    const newTrick = [...currentTrick, { player, card }];
    setCurrentTrick(newTrick);
    playCardFlip();

    if (card.suit === "H" && !heartsBroken) setHeartsBroken(true);

    if (newTrick.length === 4) {
      // Trick complete
      const winner = trickWinner(newTrick);
      const pts = trickPoints(newTrick);
      setTrickWinnerP(winner);
      setHandPoints(prev => { const n = [...prev]; n[winner] += pts; return n; });
      setPhase("trickEnd");
      const newTricksPlayed = tricksPlayed + 1;
      setTricksPlayed(newTricksPlayed);

      aiTimerRef.current = setTimeout(() => {
        setCurrentTrick([]);
        setTrickWinnerP(null);
        setIsFirstTrick(false);

        if (newTricksPlayed === 13) {
          // Hand over
          setHandPoints(prev => {
            const hp = [...prev];
            // Check shoot the moon
            const moonShooter = hp.findIndex(p => p === 26);
            let finalPts: number[];
            if (moonShooter >= 0) {
              finalPts = hp.map((_, i) => i === moonShooter ? 0 : 26);
            } else {
              finalPts = hp;
            }
            setHandSummary(finalPts);
            setScores(s => {
              const ns = s.map((v, i) => v + finalPts[i]);
              const max = Math.max(...ns);
              if (max >= POINT_LIMIT) {
                const minScore = Math.min(...ns);
                setGameWinner(ns.indexOf(minScore));
                setPhase("gameOver");
                playVictoryFanfare();
              } else {
                setPhase("handEnd");
              }
              return ns;
            });
            return prev;
          });
        } else {
          setPhase("playing");
          setCurrentPlayer(winner);
        }
      }, 1200);
    } else {
      const next = ((player + 1) % 4) as Player;
      setCurrentPlayer(next);
    }
  }, [currentTrick, heartsBroken, tricksPlayed]);

  // ── AI plays ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" || currentPlayer === 0) return;
    aiTimerRef.current = setTimeout(() => {
      const hand = hands[currentPlayer];
      if (hand.length === 0) return;
      const card = aiChooseCard(hand, currentTrick, heartsBroken, isFirstTrick);
      playCard(currentPlayer, card);
    }, 500 + Math.random() * 400);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [phase, currentPlayer, hands, currentTrick, heartsBroken, isFirstTrick, playCard]);

  // ── Human card click ─────────────────────────────────────────────────────
  const onCardClick = (card: Card) => {
    if (phase === "passing") {
      const k = cardKey(card);
      if (selectedCards.includes(k)) {
        setSelectedCards(prev => prev.filter(x => x !== k));
        playPieceDeselect();
      } else if (selectedCards.length < 3) {
        setSelectedCards(prev => [...prev, k]);
        playPieceSelect();
      }
      return;
    }
    if (phase !== "playing" || currentPlayer !== 0) return;
    const playable = getPlayable(hands[0]);
    if (!playable.has(cardKey(card))) { playMiss(); return; }
    playCard(0, card);
  };

  // ── Next hand ────────────────────────────────────────────────────────────
  const nextHand = () => { setHandNumber(n => n + 1); setTimeout(() => startHand(), 50); };
  const newGame = () => { setScores([0, 0, 0, 0]); setHandNumber(0); setGameWinner(null); setTimeout(() => startHand(), 50); };

  const playable = getPlayable(hands[0]);
  const myHand = hands[0] || [];

  // ── Trick card positions ─────────────────────────────────────────────────
  const trickPositions: Record<number, string> = { 0: "bottom-0", 1: "left-0 top-1/2 -translate-y-1/2", 2: "top-0", 3: "right-0 top-1/2 -translate-y-1/2" };
  const trickLabels: Record<number, string> = { 0: "left-1/2 -translate-x-1/2 bottom-0", 1: "left-0 top-1/2 -translate-y-1/2", 2: "left-1/2 -translate-x-1/2 top-0", 3: "right-0 top-1/2 -translate-y-1/2" };

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider mb-3">Scores</h3>
        <div className="space-y-2">
          {PLAYER_NAMES.map((name, i) => (
            <div key={name} className={`flex items-center justify-between px-3 py-2 rounded-lg ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-secondary/50 border border-border/30"}`}>
              <span className={`text-xs font-display font-semibold ${i === 0 ? "text-primary" : "text-foreground"}`}>{name}</span>
              <div className="flex items-center gap-2">
                {handPoints[i] > 0 && <span className="text-[10px] text-red-400">(+{handPoints[i]})</span>}
                <span className="text-sm font-display font-bold text-foreground">{scores[i]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/20 pt-3">
        <div className="text-[10px] font-body text-muted-foreground space-y-1">
          <p>Hand #{handNumber + 1} &middot; Pass: {passDir}</p>
          <p>Tricks: {tricksPlayed}/13</p>
          <p>Hearts broken: {heartsBroken ? "Yes" : "No"}</p>
        </div>
      </div>
      <div className="border-t border-border/20 pt-3">
        <h4 className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mb-2">Rules</h4>
        <ul className="text-[10px] font-body text-muted-foreground space-y-1 list-disc list-inside">
          <li>♥ = 1 pt, Q♠ = 13 pts</li>
          <li>Must follow suit</li>
          <li>2♣ leads first trick</li>
          <li>Hearts can't lead until broken</li>
          <li>Take all hearts + Q♠ = shoot the moon</li>
          <li>Game ends at {POINT_LIMIT} pts</li>
        </ul>
      </div>
    </div>
  );

  return (
    <GameLayout title="Hearts" sidebar={sidebar} enableChat>
      <div className="flex flex-col items-center justify-between h-full p-4 select-none relative">

        {/* ── North (Player 2) hand ─────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-secondary border border-border/30 flex items-center justify-center">
            <span className="font-display text-[9px] font-bold text-muted-foreground">N</span>
          </div>
          <span className="text-xs font-display font-medium text-foreground">North</span>
          <div className="flex -space-x-4 ml-2">
            {(hands[2] || []).map((_, i) => (
              <CardFace key={i} card={{ suit: "S", rank: 2 }} small faceDown />
            ))}
          </div>
        </div>

        {/* ── Middle row: West, Trick Area, East ────────────── */}
        <div className="flex items-center justify-between w-full max-w-3xl flex-1">
          {/* West (Player 1) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-md bg-secondary border border-border/30 flex items-center justify-center">
              <span className="font-display text-[9px] font-bold text-muted-foreground">W</span>
            </div>
            <span className="text-[10px] font-display text-foreground">West</span>
            <div className="flex flex-col -space-y-8">
              {(hands[1] || []).slice(0, 6).map((_, i) => (
                <CardFace key={i} card={{ suit: "S", rank: 2 }} small faceDown />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">{(hands[1] || []).length} cards</span>
          </div>

          {/* ── Trick Area ──────────────────────────────────── */}
          <div className="relative w-52 h-44 mx-4">
            {/* Position labels */}
            {[0, 1, 2, 3].map(p => {
              const px = p === 0 ? "left-1/2 -translate-x-1/2 bottom-0" : p === 1 ? "-left-2 top-1/2 -translate-y-1/2" : p === 2 ? "left-1/2 -translate-x-1/2 -top-1" : "right-0 top-1/2 -translate-y-1/2";
              const played = currentTrick.find(t => t.player === p);
              const isWinner = trickWinnerP === p;
              const cx = p === 0 ? "left-1/2 -translate-x-1/2 bottom-1" : p === 1 ? "left-2 top-1/2 -translate-y-1/2" : p === 2 ? "left-1/2 -translate-x-1/2 top-1" : "right-2 top-1/2 -translate-y-1/2";
              return (
                <div key={p} className={`absolute ${cx}`}>
                  {played ? (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${isWinner ? "ring-2 ring-yellow-400 rounded-lg" : ""}`}>
                      <CardFace card={played.card} />
                    </motion.div>
                  ) : (
                    currentPlayer === p && phase === "playing" && (
                      <div className="w-16 h-24 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                      </div>
                    )
                  )}
                </div>
              );
            })}
            {/* Center label */}
            {currentTrick.length === 0 && phase === "playing" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-display">{PLAYER_NAMES[currentPlayer]}'s lead</span>
              </div>
            )}
          </div>

          {/* East (Player 3) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-md bg-secondary border border-border/30 flex items-center justify-center">
              <span className="font-display text-[9px] font-bold text-muted-foreground">E</span>
            </div>
            <span className="text-[10px] font-display text-foreground">East</span>
            <div className="flex flex-col -space-y-8">
              {(hands[3] || []).slice(0, 6).map((_, i) => (
                <CardFace key={i} card={{ suit: "S", rank: 2 }} small faceDown />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">{(hands[3] || []).length} cards</span>
          </div>
        </div>

        {/* ── Player Hand (South) ───────────────────────────── */}
        <div className="w-full max-w-2xl">
          {phase === "passing" && passDir !== "none" && (
            <div className="text-center mb-2">
              <span className="text-sm font-display font-semibold text-foreground">Select 3 cards to pass {passDir}</span>
              {selectedCards.length === 3 && (
                <motion.button
                  initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  onClick={confirmPass}
                  className="ml-3 px-4 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-xs font-display font-bold hover:bg-primary/30 transition-colors"
                >
                  Confirm Pass
                </motion.button>
              )}
            </div>
          )}
          <div className="flex justify-center">
            <div className="flex -space-x-3" style={{ perspective: "600px" }}>
              {myHand.map((card, i) => {
                const k = cardKey(card);
                const isSelected = selectedCards.includes(k);
                const isPlayableCard = phase === "playing" && playable.has(k);
                const isPassPhase = phase === "passing";
                const dimmed = phase === "playing" && currentPlayer === 0 && !playable.has(k);
                const canClick = isPassPhase || (phase === "playing" && currentPlayer === 0);
                const totalCards = myHand.length;
                const mid = (totalCards - 1) / 2;
                const angle = (i - mid) * 2.5;
                const yOff = Math.abs(i - mid) * 2;

                return (
                  <motion.div
                    key={k}
                    onClick={() => canClick && onCardClick(card)}
                    whileHover={canClick ? { y: -12, scale: 1.08, zIndex: 50 } : {}}
                    animate={{ y: isSelected ? -20 : 0, rotate: angle }}
                    style={{ marginTop: yOff, zIndex: i }}
                    className={`relative cursor-pointer transition-opacity ${dimmed ? "opacity-40" : ""}`}
                  >
                    <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border-2 shadow-md flex flex-col items-center justify-center relative
                      ${isSelected ? "border-primary ring-2 ring-primary/40" : isPlayableCard ? "border-green-400/60 hover:border-green-400" : "border-slate-300/60"}`}
                    >
                      <span className={`text-[10px] md:text-xs font-bold absolute top-0.5 left-1 ${suitColor(card.suit)}`}>{rankLabel(card.rank)}</span>
                      <span className={`text-lg md:text-2xl ${suitColor(card.suit)}`}>{suitSymbol(card.suit)}</span>
                      <span className={`text-[10px] md:text-xs font-bold absolute bottom-0.5 right-1 rotate-180 ${suitColor(card.suit)}`}>{rankLabel(card.rank)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-1">
            <span className="text-[10px] text-muted-foreground font-display">
              {phase === "playing" && currentPlayer === 0 ? "Your turn — pick a card" : phase === "playing" ? `${PLAYER_NAMES[currentPlayer]} is thinking...` : ""}
            </span>
          </div>
        </div>

        {/* ── Trick End Overlay ──────────────────────────────── */}
        <AnimatePresence>
          {phase === "trickEnd" && trickWinnerP !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-xl px-6 py-3 border border-border/40 shadow-lg">
                <span className="text-sm font-display font-bold text-foreground">{PLAYER_NAMES[trickWinnerP]} takes the trick</span>
                {trickPoints(currentTrick) > 0 && (
                  <span className="ml-2 text-sm text-red-400 font-bold">+{trickPoints(currentTrick)} pts</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hand End Overlay ───────────────────────────────── */}
        <AnimatePresence>
          {phase === "handEnd" && handSummary && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 bg-background/80 backdrop-blur-sm"
            >
              <div className="bg-card rounded-2xl border border-border/40 shadow-2xl p-6 w-80">
                <h2 className="text-lg font-display font-bold text-foreground text-center mb-4">Hand Complete</h2>
                {handSummary.some(p => p === 0 && handPoints.some(hp => hp === 26)) && (
                  <div className="text-center mb-3 text-yellow-400 font-display font-bold text-sm">Shot the Moon!</div>
                )}
                <div className="space-y-2 mb-4">
                  {PLAYER_NAMES.map((name, i) => (
                    <div key={name} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-secondary/50">
                      <span className="text-sm font-display text-foreground">{name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${handSummary[i] > 0 ? "text-red-400" : "text-green-400"}`}>
                          +{handSummary[i]}
                        </span>
                        <span className="text-sm font-display font-bold text-foreground">{scores[i]}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={nextHand}
                  className="w-full py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary font-display font-bold text-sm hover:bg-primary/30 transition-colors">
                  Next Hand
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Game Over Overlay ──────────────────────────────── */}
        <AnimatePresence>
          {phase === "gameOver" && gameWinner !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-50 bg-background/85 backdrop-blur-md"
            >
              <div className="bg-card rounded-2xl border border-border/40 shadow-2xl p-8 w-96 text-center">
                <div className="text-4xl mb-2">{gameWinner === 0 ? "🏆" : "💔"}</div>
                <h2 className="text-xl font-display font-bold text-foreground mb-1">
                  {gameWinner === 0 ? "You Win!" : `${PLAYER_NAMES[gameWinner]} Wins!`}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">Game over — someone reached {POINT_LIMIT} points</p>
                <div className="space-y-2 mb-5">
                  {PLAYER_NAMES.map((name, i) => [...Array(1)].map(() => ({ name, i })))
                    .flat()
                    .sort((a, b) => scores[a.i] - scores[b.i])
                    .map(({ name, i }, rank) => (
                      <div key={name} className={`flex justify-between items-center px-4 py-2 rounded-lg ${i === gameWinner ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
                          <span className={`text-sm font-display font-semibold ${i === gameWinner ? "text-primary" : "text-foreground"}`}>{name}</span>
                        </div>
                        <span className="text-lg font-display font-bold text-foreground">{scores[i]}</span>
                      </div>
                    ))}
                </div>
                <button onClick={newGame}
                  className="w-full py-2.5 rounded-lg bg-primary/20 border border-primary/40 text-primary font-display font-bold text-sm hover:bg-primary/30 transition-colors">
                  New Game
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default HeartsGame;
