import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playCardDeal, playVictoryFanfare, playPieceSelect, playPieceDeselect } from "@/lib/sounds";

// --- Types ---
interface Card { suit: string; rank: string; id: number }
type Phase = "draw" | "discard" | "knock-prompt" | "round-over" | "game-over";

// --- Constants ---
const SUITS = ["♠", "♥", "♦", "♣"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const RANK_INDEX: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i]));
const isRed = (s: string) => s === "♥" || s === "♦";
const cardValue = (r: string) => (r === "A" ? 1 : ["J", "Q", "K"].includes(r) ? 10 : parseInt(r));

// --- Deck helpers ---
const makeDeck = (): Card[] => {
  const d: Card[] = [];
  let id = 0;
  for (const suit of SUITS) for (const rank of RANKS) d.push({ suit, rank, id: id++ });
  return d;
};

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// --- Meld detection ---
type Meld = Card[];

const findBestMelds = (hand: Card[]): { melds: Meld[]; deadwood: Card[]; deadwoodValue: number } => {
  const allSets: Meld[] = [];
  const allRuns: Meld[] = [];

  // Find sets (same rank, different suits)
  const byRank: Record<string, Card[]> = {};
  hand.forEach(c => { (byRank[c.rank] ??= []).push(c); });
  for (const cards of Object.values(byRank)) {
    if (cards.length >= 3) {
      if (cards.length === 4) allSets.push([...cards]);
      for (let i = 0; i < cards.length; i++)
        for (let j = i + 1; j < cards.length; j++)
          for (let k = j + 1; k < cards.length; k++) allSets.push([cards[i], cards[j], cards[k]]);
    }
  }

  // Find runs (consecutive same suit)
  const bySuit: Record<string, Card[]> = {};
  hand.forEach(c => { (bySuit[c.suit] ??= []).push(c); });
  for (const cards of Object.values(bySuit)) {
    const sorted = [...cards].sort((a, b) => RANK_INDEX[a.rank] - RANK_INDEX[b.rank]);
    for (let len = sorted.length; len >= 3; len--) {
      for (let start = 0; start <= sorted.length - len; start++) {
        const run = sorted.slice(start, start + len);
        const consecutive = run.every((c, i) => i === 0 || RANK_INDEX[c.rank] === RANK_INDEX[run[i - 1].rank] + 1);
        if (consecutive) allRuns.push(run);
      }
    }
  }

  const allMelds = [...allSets, ...allRuns];
  let bestResult = { melds: [] as Meld[], deadwood: [...hand], deadwoodValue: hand.reduce((s, c) => s + cardValue(c.rank), 0) };

  const tryMelds = (remaining: Card[], chosen: Meld[], idx: number) => {
    const dw = remaining.reduce((s, c) => s + cardValue(c.rank), 0);
    if (dw < bestResult.deadwoodValue) bestResult = { melds: [...chosen], deadwood: [...remaining], deadwoodValue: dw };
    for (let i = idx; i < allMelds.length; i++) {
      const meld = allMelds[i];
      if (meld.every(c => remaining.some(r => r.id === c.id))) {
        const next = remaining.filter(r => !meld.some(m => m.id === r.id));
        tryMelds(next, [...chosen, meld], i + 1);
      }
    }
  };

  tryMelds(hand, [], 0);
  return bestResult;
};

// --- AI logic ---
const aiDecideDrawSource = (discardTop: Card, hand: Card[]): "discard" | "stock" => {
  const withDiscard = [...hand, discardTop];
  const currentBest = findBestMelds(hand);
  const newBest = findBestMelds(withDiscard);
  // Draw from discard if it forms a new meld or significantly reduces deadwood
  return newBest.melds.length > currentBest.melds.length || newBest.deadwoodValue < currentBest.deadwoodValue - 3
    ? "discard" : "stock";
};

const aiDecideDiscard = (hand: Card[]): number => {
  let bestIdx = 0, bestDW = Infinity;
  for (let i = 0; i < hand.length; i++) {
    const remaining = hand.filter((_, j) => j !== i);
    const { deadwoodValue } = findBestMelds(remaining);
    if (deadwoodValue < bestDW) { bestDW = deadwoodValue; bestIdx = i; }
  }
  return bestIdx;
};

// --- Card component ---
const CardFace = ({ card, onClick, selected, small }: { card: Card; onClick?: () => void; selected?: boolean; small?: boolean }) => (
  <motion.div
    layout
    whileHover={onClick ? { y: -4, scale: 1.04 } : undefined}
    onClick={onClick}
    className={`${small ? "w-14 h-20" : "w-16 h-24 md:w-20 md:h-28"} rounded-xl bg-white border-2 flex flex-col items-center justify-center cursor-pointer select-none shrink-0 shadow-md transition-all
      ${selected ? "border-primary ring-2 ring-primary/40 -translate-y-2" : "border-gray-200 hover:border-gray-300"}`}
  >
    <span className={`${small ? "text-sm" : "text-lg md:text-xl"} font-display font-bold leading-none ${isRed(card.suit) ? "text-red-500" : "text-gray-900"}`}>
      {card.rank}
    </span>
    <span className={`${small ? "text-base" : "text-xl md:text-2xl"} leading-none ${isRed(card.suit) ? "text-red-500" : "text-gray-900"}`}>
      {card.suit}
    </span>
  </motion.div>
);

const CardBack = ({ small, count }: { small?: boolean; count?: number }) => (
  <div className={`${small ? "w-14 h-20" : "w-16 h-24 md:w-20 md:h-28"} rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 border-2 border-blue-600 flex items-center justify-center shadow-md shrink-0 relative`}>
    <div className="w-[70%] h-[70%] rounded-lg border border-blue-400/30 flex items-center justify-center">
      <span className="text-blue-300/60 text-lg font-bold">♠</span>
    </div>
    {count !== undefined && (
      <span className="absolute bottom-1 right-1.5 text-[9px] font-display font-bold text-blue-300/70">{count}</span>
    )}
  </div>
);

// --- Main Game ---
const GinRummyGame = () => {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [cpuHand, setCpuHand] = useState<Card[]>([]);
  const [stock, setStock] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("draw");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [roundMsg, setRoundMsg] = useState("");
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [roundNum, setRoundNum] = useState(1);
  const [showMelds, setShowMelds] = useState<{ player: ReturnType<typeof findBestMelds>; cpu: ReturnType<typeof findBestMelds> } | null>(null);

  const dealNewRound = useCallback(() => {
    const deck = shuffle(makeDeck());
    const p = deck.slice(0, 10);
    const c = deck.slice(10, 20);
    const remaining = deck.slice(20);
    const discard = [remaining.pop()!];
    setPlayerHand(p.sort((a, b) => RANK_INDEX[a.rank] - RANK_INDEX[b.rank]));
    setCpuHand(c);
    setStock(remaining);
    setDiscardPile(discard);
    setPhase("draw");
    setSelectedCard(null);
    setIsPlayerTurn(true);
    setShowMelds(null);
    setRoundMsg("");
    playCardDeal();
  }, []);

  useEffect(() => { dealNewRound(); }, [dealNewRound]);

  const playerAnalysis = useMemo(() => findBestMelds(playerHand), [playerHand]);
  const canKnock = playerAnalysis.deadwoodValue <= 10 && playerAnalysis.deadwoodValue > 0;
  const canGin = playerAnalysis.deadwoodValue === 0 && playerHand.length === 10;

  // --- Player actions ---
  const drawCard = (source: "stock" | "discard") => {
    if (phase !== "draw" || !isPlayerTurn) return;
    playCardFlip();
    if (source === "stock" && stock.length > 0) {
      const newStock = [...stock];
      const drawn = newStock.pop()!;
      setStock(newStock);
      setPlayerHand(prev => [...prev, drawn].sort((a, b) => RANK_INDEX[a.rank] - RANK_INDEX[b.rank]));
    } else if (source === "discard" && discardPile.length > 0) {
      const newDiscard = [...discardPile];
      const drawn = newDiscard.pop()!;
      setDiscardPile(newDiscard);
      setPlayerHand(prev => [...prev, drawn].sort((a, b) => RANK_INDEX[a.rank] - RANK_INDEX[b.rank]));
    }
    setPhase("discard");
  };

  const discardCard = () => {
    if (phase !== "discard" || selectedCard === null) return;
    playCardFlip();
    const card = playerHand[selectedCard];
    setPlayerHand(prev => prev.filter((_, i) => i !== selectedCard));
    setDiscardPile(prev => [...prev, card]);
    setSelectedCard(null);
    setPhase("draw");
    setIsPlayerTurn(false);
    setTimeout(cpuTurn, 800);
  };

  const handleKnock = (isGin: boolean) => {
    const pAnalysis = findBestMelds(playerHand);
    const cAnalysis = findBestMelds(cpuHand);
    endRound(pAnalysis, cAnalysis, "player", isGin);
  };

  // --- CPU turn ---
  const cpuTurn = () => {
    const discardTop = discardPile[discardPile.length - 1];
    const source = discardTop ? aiDecideDrawSource(discardTop, cpuHand) : "stock";
    let newHand = [...cpuHand];
    const newStock = [...stock];
    const newDiscard = [...discardPile];

    if (source === "discard" && newDiscard.length > 0) {
      newHand.push(newDiscard.pop()!);
    } else if (newStock.length > 0) {
      newHand.push(newStock.pop()!);
    }

    playCardFlip();
    const discIdx = aiDecideDiscard(newHand);
    const discarded = newHand.splice(discIdx, 1)[0];
    newDiscard.push(discarded);

    setCpuHand(newHand);
    setStock(newStock);
    setDiscardPile(newDiscard);

    const analysis = findBestMelds(newHand);
    if (analysis.deadwoodValue === 0) {
      setTimeout(() => {
        const pAnalysis = findBestMelds(playerHand);
        endRound(pAnalysis, analysis, "cpu", true);
      }, 400);
    } else if (analysis.deadwoodValue <= 5) {
      setTimeout(() => {
        const pAnalysis = findBestMelds(playerHand);
        endRound(pAnalysis, analysis, "cpu", false);
      }, 400);
    } else {
      setIsPlayerTurn(true);
      setPhase("draw");
    }
  };

  // --- End round ---
  const endRound = (
    pAnalysis: ReturnType<typeof findBestMelds>,
    cAnalysis: ReturnType<typeof findBestMelds>,
    knocker: "player" | "cpu",
    isGin: boolean
  ) => {
    setShowMelds({ player: pAnalysis, cpu: cAnalysis });
    let pDW = pAnalysis.deadwoodValue;
    let cDW = cAnalysis.deadwoodValue;
    let pts = 0;
    let msg = "";

    if (knocker === "player") {
      if (isGin) {
        pts = cDW + 25;
        msg = `Gin! You score ${pts} points!`;
        setPlayerScore(s => s + pts);
      } else if (cDW <= pDW) {
        // Undercut
        pts = pDW - cDW + 25;
        msg = `Undercut! Computer scores ${pts} points.`;
        setCpuScore(s => s + pts);
      } else {
        pts = cDW - pDW;
        msg = `Knock! You score ${pts} points.`;
        setPlayerScore(s => s + pts);
      }
    } else {
      if (isGin) {
        pts = pDW + 25;
        msg = `Computer gets Gin! Scores ${pts} points.`;
        setCpuScore(s => s + pts);
      } else if (pDW <= cDW) {
        // Undercut
        pts = cDW - pDW + 25;
        msg = `You undercut! You score ${pts} points.`;
        setPlayerScore(s => s + pts);
      } else {
        pts = pDW - cDW;
        msg = `Computer knocks. Scores ${pts} points.`;
        setCpuScore(s => s + pts);
      }
    }

    setRoundMsg(msg);
    playVictoryFanfare();
    const newPS = knocker === "player" && (isGin || cDW > pDW) ? playerScore + pts : playerScore;
    const newCS = knocker === "cpu" && (isGin || pDW > cDW) ? cpuScore + pts : cpuScore;
    const underPS = knocker === "cpu" && pDW <= cDW ? playerScore + pts : newPS;
    const underCS = knocker === "player" && cDW <= pDW ? cpuScore + pts : newCS;

    setPhase(underPS >= 100 || underCS >= 100 ? "game-over" : "round-over");
  };

  const startNextRound = () => { setRoundNum(r => r + 1); dealNewRound(); };
  const resetGame = () => { setPlayerScore(0); setCpuScore(0); setRoundNum(1); dealNewRound(); };

  // --- Sidebar ---
  const sidebar = (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-xs font-display font-bold text-foreground mb-2 uppercase tracking-wider">Scores</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-xs font-display font-semibold text-primary">You</span>
            <span className="text-sm font-display font-bold text-primary">{playerScore}</span>
          </div>
          <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-secondary/50 border border-border/30">
            <span className="text-xs font-display font-semibold text-muted-foreground">Computer</span>
            <span className="text-sm font-display font-bold text-foreground">{cpuScore}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border/20 pt-3">
        <p className="text-[10px] font-body text-muted-foreground mb-1">Round {roundNum} &middot; First to 100</p>
        <p className="text-[10px] font-body text-muted-foreground">Stock: {stock.length} cards</p>
      </div>
      <div className="border-t border-border/20 pt-3">
        <h3 className="text-xs font-display font-bold text-foreground mb-1.5 uppercase tracking-wider">Deadwood</h3>
        <div className={`text-2xl font-display font-bold text-center py-2 rounded-lg border ${
          playerAnalysis.deadwoodValue === 0 ? "text-green-400 bg-green-500/10 border-green-500/20" :
          playerAnalysis.deadwoodValue <= 10 ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" :
          "text-red-400 bg-red-500/10 border-red-500/20"
        }`}>
          {playerAnalysis.deadwoodValue}
        </div>
        <p className="text-[10px] font-body text-muted-foreground mt-1 text-center">
          {playerAnalysis.melds.length} meld{playerAnalysis.melds.length !== 1 ? "s" : ""} formed
        </p>
      </div>
      <div className="border-t border-border/20 pt-3 space-y-1">
        <h3 className="text-xs font-display font-bold text-foreground mb-1 uppercase tracking-wider">How to Play</h3>
        <p className="text-[10px] font-body text-muted-foreground leading-relaxed">
          Draw from stock or discard pile, then discard one card. Form melds (3-4 of a kind or 3+ consecutive same suit).
          Knock when deadwood is 10 or less. Gin = 0 deadwood for bonus points.
        </p>
      </div>
    </div>
  );

  // --- Render meld groups ---
  const renderMeldSection = (label: string, analysis: ReturnType<typeof findBestMelds>) => (
    <div className="space-y-2">
      <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {analysis.melds.map((meld, i) => (
        <div key={i} className="flex gap-1 items-center">
          <span className="text-[9px] text-muted-foreground mr-1">Meld {i + 1}:</span>
          {meld.map(c => <CardFace key={c.id} card={c} small />)}
        </div>
      ))}
      {analysis.deadwood.length > 0 && (
        <div className="flex gap-1 items-center flex-wrap">
          <span className="text-[9px] text-red-400 mr-1">Deadwood ({analysis.deadwoodValue}):</span>
          {analysis.deadwood.map(c => <CardFace key={c.id} card={c} small />)}
        </div>
      )}
    </div>
  );

  return (
    <GameLayout title="Gin Rummy" sidebar={sidebar} enableChat>
      <div className="h-full flex flex-col items-center justify-between p-4 gap-3 relative">
        {/* Opponent hand */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Computer</span>
          <div className="flex gap-[-8px]" style={{ gap: "-6px" }}>
            {cpuHand.map((_, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? "-10px" : 0 }}>
                <CardBack />
              </div>
            ))}
          </div>
        </div>

        {/* Center: stock + discard */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-display text-muted-foreground">Stock</span>
            <div
              onClick={() => phase === "draw" && isPlayerTurn && drawCard("stock")}
              className={`${phase === "draw" && isPlayerTurn ? "cursor-pointer hover:scale-105 transition-transform" : "opacity-70"}`}
            >
              <CardBack count={stock.length} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-display text-muted-foreground">Discard</span>
            <div
              onClick={() => {
                if (phase === "draw" && isPlayerTurn && discardPile.length > 0) drawCard("discard");
                else if (phase === "discard" && selectedCard !== null) discardCard();
              }}
              className={`${(phase === "draw" && isPlayerTurn) || (phase === "discard" && selectedCard !== null) ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
            >
              {discardPile.length > 0 ? (
                <CardFace card={discardPile[discardPile.length - 1]} />
              ) : (
                <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-border/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Empty</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status / action buttons */}
        <div className="flex items-center gap-3 min-h-[36px]">
          {phase === "draw" && isPlayerTurn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-body text-muted-foreground">
              Draw from stock or discard pile
            </motion.p>
          )}
          {phase === "discard" && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-body text-muted-foreground">
              Select a card to discard{selectedCard !== null ? ", then click the discard pile" : ""}
            </motion.p>
          )}
          {phase === "draw" && !isPlayerTurn && (
            <p className="text-xs font-body text-muted-foreground animate-pulse">Computer is thinking...</p>
          )}
          {phase === "discard" && canKnock && (
            <button onClick={() => handleKnock(false)}
              className="px-4 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-display font-bold hover:bg-yellow-500/25 transition-colors">
              Knock
            </button>
          )}
          {phase === "discard" && canGin && (
            <button onClick={() => handleKnock(true)}
              className="px-4 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-display font-bold hover:bg-green-500/25 transition-colors">
              Gin!
            </button>
          )}
        </div>

        {/* Player hand */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center" style={{ gap: "4px" }}>
            {playerHand.map((card, i) => (
              <CardFace
                key={card.id}
                card={card}
                selected={selectedCard === i}
                onClick={() => {
                  if (phase === "discard") {
                    if (selectedCard === i) { setSelectedCard(null); playPieceDeselect(); }
                    else { setSelectedCard(i); playPieceSelect(); }
                  }
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-display font-semibold text-primary uppercase tracking-wider mt-1">Your Hand</span>
        </div>

        {/* Round-over overlay */}
        <AnimatePresence>
          {(phase === "round-over" || phase === "game-over") && showMelds && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border/30 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
              >
                <h2 className="text-lg font-display font-bold text-foreground text-center mb-1">
                  {phase === "game-over" ? "Game Over!" : "Round Over"}
                </h2>
                <p className="text-sm font-body text-primary text-center mb-4">{roundMsg}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/20">
                    {renderMeldSection("Your Hand", showMelds.player)}
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/20">
                    {renderMeldSection("Computer's Hand", showMelds.cpu)}
                  </div>
                </div>

                <div className="flex justify-between items-center px-4 py-2 rounded-lg bg-secondary/50 border border-border/20 mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">You</p>
                    <p className="text-lg font-display font-bold text-primary">{playerScore}</p>
                  </div>
                  <span className="text-xs font-display text-muted-foreground">SCORE</span>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Computer</p>
                    <p className="text-lg font-display font-bold text-foreground">{cpuScore}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  {phase === "game-over" ? (
                    <button onClick={resetGame}
                      className="px-6 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-display font-bold hover:bg-primary/25 transition-colors">
                      New Game
                    </button>
                  ) : (
                    <button onClick={startNextRound}
                      className="px-6 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-display font-bold hover:bg-primary/25 transition-colors">
                      Next Round
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameLayout>
  );
};

export default GinRummyGame;
