import { useState, useEffect, useCallback, useRef } from "react";
import GameLayout from "@/components/GameLayout";
import { playCardFlip, playCardDeal, playVictoryFanfare, playMiss, playPieceSelect, playCardShuffle } from "@/lib/sounds";

// --- Types ---
type Suit = "♠" | "♥" | "♦" | "♣";
type Value = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
interface Card { suit: Suit; value: Value; faceUp: boolean; id: number; }
interface Selection { source: string; index: number; count: number; }
interface HistoryEntry { stock: Card[]; waste: Card[]; tableau: Card[][]; foundations: Card[][]; }

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const VALUES: Value[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const isRed = (s: Suit) => s === "♥" || s === "♦";
const valIdx = (v: Value) => VALUES.indexOf(v);

const cloneCards = (cards: Card[]) => cards.map(c => ({ ...c }));
const cloneState = (st: { stock: Card[]; waste: Card[]; tableau: Card[][]; foundations: Card[][]; }): HistoryEntry => ({
  stock: cloneCards(st.stock), waste: cloneCards(st.waste),
  tableau: st.tableau.map(cloneCards), foundations: st.foundations.map(cloneCards),
});

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  for (const suit of SUITS) for (const value of VALUES) deck.push({ suit, value, faceUp: false, id: id++ });
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function initGame() {
  const deck = createDeck();
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[idx++];
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(idx).map(c => { c.faceUp = false; return c; });
  return { stock, waste: [] as Card[], tableau, foundations: [[], [], [], []] as Card[][] };
}

// --- Card Component ---
const CARD_W = 60, CARD_H = 85;

const CardBack = ({ onClick, className = "" }: { onClick?: () => void; className?: string }) => (
  <div onClick={onClick} className={`rounded-lg border border-border/50 flex items-center justify-center cursor-pointer select-none shrink-0 ${className}`}
    style={{ width: CARD_W, height: CARD_H, background: "repeating-linear-gradient(45deg, #1e3a5f, #1e3a5f 4px, #15304f 4px, #15304f 8px)" }}>
    <div className="w-8 h-10 rounded border border-blue-400/30" />
  </div>
);

const CardFace = ({ card, selected, onClick, onDoubleClick, dimmed, className = "" }: {
  card: Card; selected?: boolean; onClick?: () => void; onDoubleClick?: () => void; dimmed?: boolean; className?: string;
}) => {
  const red = isRed(card.suit);
  return (
    <div onClick={onClick} onDoubleClick={onDoubleClick}
      className={`rounded-lg border-2 flex flex-col justify-between p-1 cursor-pointer select-none shrink-0 transition-all ${className}
        ${selected ? "border-primary ring-2 ring-primary/40 -translate-y-1" : "border-border/40"}
        ${dimmed ? "opacity-50" : ""}`}
      style={{ width: CARD_W, height: CARD_H, background: "var(--card, #fff)" }}>
      <div className={`text-xs font-bold leading-none ${red ? "text-red-500" : "text-foreground"}`}>
        {card.value}<br /><span className="text-[10px]">{card.suit}</span>
      </div>
      <div className={`text-xl text-center leading-none ${red ? "text-red-500" : "text-foreground"}`}>{card.suit}</div>
      <div className={`text-xs font-bold leading-none self-end rotate-180 ${red ? "text-red-500" : "text-foreground"}`}>
        {card.value}<br /><span className="text-[10px]">{card.suit}</span>
      </div>
    </div>
  );
};

const EmptySlot = ({ label, onClick, className = "" }: { label?: string; onClick?: () => void; className?: string }) => (
  <div onClick={onClick} className={`rounded-lg border-2 border-dashed border-border/30 flex items-center justify-center shrink-0 ${className}`}
    style={{ width: CARD_W, height: CARD_H }}>
    {label && <span className="text-lg text-muted-foreground/40">{label}</span>}
  </div>
);

// --- Confetti ---
const Confetti = () => {
  const colors = ["#f44336","#e91e63","#9c27b0","#2196f3","#4caf50","#ff9800","#ffeb3b"];
  const particles = useRef(Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 2, dur: 2 + Math.random() * 2,
    color: colors[i % colors.length], size: 4 + Math.random() * 6, drift: (Math.random() - 0.5) * 40,
  }))).current;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute animate-bounce" style={{
          left: `${p.x}%`, top: -20, width: p.size, height: p.size, background: p.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `confettiFall ${p.dur}s ${p.delay}s linear infinite`,
          transform: `translateX(${p.drift}px) rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity:1; } 100% { transform: translateY(100vh) rotate(720deg); opacity:0; } }`}</style>
    </div>
  );
};

// --- Main Game ---
export default function SolitaireGame() {
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [tableau, setTableau] = useState<Card[][]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startNewGame = useCallback(() => {
    const g = initGame();
    setStock(g.stock); setWaste(g.waste); setTableau(g.tableau); setFoundations(g.foundations);
    setSelection(null); setMoves(0); setTimer(0); setGameWon(false); setHistory([]);
    playCardShuffle();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, []);

  useEffect(() => { startNewGame(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [startNewGame]);

  const checkWin = useCallback((f: Card[][]) => {
    if (f.every(pile => pile.length === 13)) {
      setGameWon(true); playVictoryFanfare();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const saveHistory = () => setHistory(h => [...h, cloneState({ stock, waste, tableau, foundations })]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setStock(prev.stock); setWaste(prev.waste); setTableau(prev.tableau); setFoundations(prev.foundations);
    setHistory(h => h.slice(0, -1)); setSelection(null); setMoves(m => m + 1);
  };

  const flipTopCards = (tab: Card[][]) => {
    for (const col of tab) {
      if (col.length > 0 && !col[col.length - 1].faceUp) col[col.length - 1].faceUp = true;
    }
  };

  // --- Stock click: draw 3 ---
  const clickStock = () => {
    if (gameWon) return;
    saveHistory();
    if (stock.length === 0) {
      const newStock = [...waste].reverse().map(c => { c.faceUp = false; return c; });
      setStock(newStock); setWaste([]); playCardFlip();
    } else {
      const draw = Math.min(3, stock.length);
      const drawn = stock.slice(stock.length - draw).reverse().map(c => { c.faceUp = true; return c; });
      setStock(stock.slice(0, stock.length - draw)); setWaste([...waste, ...drawn]); playCardDeal();
    }
    setSelection(null); setMoves(m => m + 1);
  };

  // --- Can place on foundation? ---
  const canPlaceOnFoundation = (card: Card, fIdx: number): boolean => {
    const pile = foundations[fIdx];
    if (pile.length === 0) return card.value === "A";
    const top = pile[pile.length - 1];
    return top.suit === card.suit && valIdx(card.value) === valIdx(top.value) + 1;
  };

  // --- Can place on tableau? ---
  const canPlaceOnTableau = (card: Card, colIdx: number): boolean => {
    const col = tableau[colIdx];
    if (col.length === 0) return card.value === "K";
    const top = col[col.length - 1];
    return top.faceUp && isRed(card.suit) !== isRed(top.suit) && valIdx(card.value) === valIdx(top.value) - 1;
  };

  // --- Try auto-move to foundation ---
  const tryAutoFoundation = (card: Card, source: string, srcIdx: number) => {
    for (let fi = 0; fi < 4; fi++) {
      if (canPlaceOnFoundation(card, fi)) {
        saveHistory();
        const newF = foundations.map(cloneCards);
        newF[fi].push({ ...card, faceUp: true });
        const newTab = tableau.map(cloneCards);
        const newWaste = cloneCards(waste);
        if (source === "waste") { newWaste.pop(); }
        else if (source === "tableau") { newTab[srcIdx].pop(); flipTopCards(newTab); }
        setFoundations(newF); setTableau(newTab); setWaste(newWaste);
        setMoves(m => m + 1); setSelection(null); playCardFlip(); checkWin(newF);
        return true;
      }
    }
    return false;
  };

  // --- Handle selection & movement ---
  const handleSelect = (source: string, index: number, cardIndex: number) => {
    if (gameWon) return;

    // If nothing selected, select this card
    if (!selection) {
      if (source === "waste") {
        if (waste.length === 0) return;
        setSelection({ source: "waste", index: 0, count: 1 }); playPieceSelect();
      } else if (source === "tableau") {
        const col = tableau[index];
        const card = col[cardIndex];
        if (!card.faceUp) return;
        const count = col.length - cardIndex;
        setSelection({ source: "tableau", index, count }); playPieceSelect();
      } else if (source === "foundation") {
        const pile = foundations[index];
        if (pile.length === 0) return;
        setSelection({ source: "foundation", index, count: 1 }); playPieceSelect();
      }
      return;
    }

    // Something is selected -- try to move it
    const getSelectedCards = (): Card[] => {
      if (selection.source === "waste") return [waste[waste.length - 1]];
      if (selection.source === "foundation") return [foundations[selection.index][foundations[selection.index].length - 1]];
      const col = tableau[selection.index];
      return col.slice(col.length - selection.count);
    };

    const cards = getSelectedCards();
    if (!cards.length) { setSelection(null); return; }
    const bottomCard = cards[0];

    // Clicking same source = deselect
    if (source === selection.source && index === selection.index) { setSelection(null); return; }

    // Target is foundation
    if (source === "foundation" && cards.length === 1 && canPlaceOnFoundation(bottomCard, index)) {
      saveHistory();
      const newF = foundations.map(cloneCards);
      newF[index].push({ ...bottomCard, faceUp: true });
      const newTab = tableau.map(cloneCards);
      const newWaste = cloneCards(waste);
      if (selection.source === "waste") newWaste.pop();
      else if (selection.source === "tableau") { newTab[selection.index].splice(-selection.count); flipTopCards(newTab); }
      else if (selection.source === "foundation") newF[selection.index].pop();
      setFoundations(newF); setTableau(newTab); setWaste(newWaste);
      setMoves(m => m + 1); setSelection(null); playCardFlip(); checkWin(newF);
      return;
    }

    // Target is tableau
    if (source === "tableau" && canPlaceOnTableau(bottomCard, index)) {
      saveHistory();
      const newTab = tableau.map(cloneCards);
      const newWaste = cloneCards(waste);
      const newF = foundations.map(cloneCards);
      if (selection.source === "waste") { newTab[index].push({ ...waste[waste.length - 1], faceUp: true }); newWaste.pop(); }
      else if (selection.source === "tableau") {
        const moved = newTab[selection.index].splice(-selection.count);
        newTab[index].push(...moved); flipTopCards(newTab);
      } else if (selection.source === "foundation") {
        newTab[index].push({ ...foundations[selection.index][foundations[selection.index].length - 1], faceUp: true });
        newF[selection.index].pop();
      }
      setTableau(newTab); setWaste(newWaste); setFoundations(newF);
      setMoves(m => m + 1); setSelection(null); playCardDeal();
      return;
    }

    // Invalid move: either re-select or play miss
    if (source === "waste" && waste.length > 0) {
      setSelection({ source: "waste", index: 0, count: 1 }); playPieceSelect();
    } else if (source === "tableau") {
      const col = tableau[index];
      if (col.length > 0 && col[cardIndex]?.faceUp) {
        setSelection({ source: "tableau", index, count: col.length - cardIndex }); playPieceSelect();
      } else { setSelection(null); playMiss(); }
    } else if (source === "foundation" && foundations[index].length > 0) {
      setSelection({ source: "foundation", index, count: 1 }); playPieceSelect();
    } else { setSelection(null); playMiss(); }
  };

  const handleDoubleClick = (source: string, index: number) => {
    if (gameWon) return;
    setSelection(null);
    let card: Card | undefined;
    if (source === "waste") card = waste[waste.length - 1];
    else if (source === "tableau") { const col = tableau[index]; card = col[col.length - 1]; }
    if (card) tryAutoFoundation(card, source, index);
  };

  const isSelected = (source: string, index: number, cardIndex?: number): boolean => {
    if (!selection) return false;
    if (selection.source !== source) return false;
    if (source === "waste") return true;
    if (source === "foundation") return selection.index === index;
    if (source === "tableau") {
      const col = tableau[index];
      const startIdx = col.length - selection.count;
      return selection.index === index && cardIndex !== undefined && cardIndex >= startIdx;
    }
    return false;
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const foundationSuits: Suit[] = ["♠","♥","♦","♣"];

  const maxTableauLen = Math.max(...(tableau.length ? tableau.map(c => c.length) : [0]), 1);

  return (
    <GameLayout title="Solitaire">
      <div className="h-full flex flex-col items-center p-4 gap-3 overflow-auto">
        {/* Controls */}
        <div className="flex items-center gap-4 w-full max-w-[520px]">
          <button onClick={startNewGame} className="px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-xs font-display font-semibold text-primary hover:bg-primary/25 transition-colors">
            New Game
          </button>
          <button onClick={undo} disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/40 text-xs font-display font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Undo
          </button>
          <div className="flex-1" />
          <span className="text-xs font-body text-muted-foreground">Moves: <span className="font-semibold text-foreground">{moves}</span></span>
          <span className="text-xs font-body text-muted-foreground">Time: <span className="font-semibold text-foreground">{fmtTime(timer)}</span></span>
        </div>

        {/* Top row: Stock, Waste, Foundations */}
        <div className="flex items-start gap-3 w-full max-w-[520px]">
          {/* Stock */}
          {stock.length > 0 ? <CardBack onClick={clickStock} /> : <EmptySlot label="↻" onClick={clickStock} />}

          {/* Waste */}
          <div className="relative" style={{ width: CARD_W, height: CARD_H }}>
            {waste.length === 0 ? <EmptySlot /> : (
              <CardFace card={waste[waste.length - 1]} selected={isSelected("waste", 0)}
                onClick={() => handleSelect("waste", 0, 0)}
                onDoubleClick={() => handleDoubleClick("waste", 0)} />
            )}
          </div>

          <div className="flex-1" />

          {/* Foundations */}
          {foundations.map((pile, fi) => (
            <div key={fi} onClick={() => handleSelect("foundation", fi, 0)}>
              {pile.length === 0 ? (
                <EmptySlot label={foundationSuits[fi]} onClick={() => handleSelect("foundation", fi, 0)} />
              ) : (
                <CardFace card={pile[pile.length - 1]} selected={isSelected("foundation", fi)}
                  onClick={() => handleSelect("foundation", fi, 0)} />
              )}
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div className="flex gap-2 w-full max-w-[520px]" style={{ minHeight: CARD_H + maxTableauLen * 20 }}>
          {tableau.map((col, ci) => (
            <div key={ci} className="relative flex-1" style={{ minWidth: CARD_W - 4 }}>
              {col.length === 0 ? (
                <EmptySlot label="K" onClick={() => handleSelect("tableau", ci, 0)} />
              ) : (
                col.map((card, ri) => (
                  <div key={card.id} className="absolute left-0" style={{ top: ri * 20, zIndex: ri }}>
                    {card.faceUp ? (
                      <CardFace card={card} selected={isSelected("tableau", ci, ri)}
                        onClick={() => handleSelect("tableau", ci, ri)}
                        onDoubleClick={ri === col.length - 1 ? () => handleDoubleClick("tableau", ci) : undefined} />
                    ) : (
                      <CardBack className="cursor-default" />
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Win overlay */}
        {gameWon && (
          <>
            <Confetti />
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
              <div className="bg-card border border-border/50 rounded-2xl p-8 text-center shadow-2xl space-y-4">
                <h2 className="text-3xl font-display font-bold text-primary">You Win!</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Completed in <span className="font-semibold text-foreground">{moves}</span> moves
                  and <span className="font-semibold text-foreground">{fmtTime(timer)}</span>
                </p>
                <button onClick={startNewGame}
                  className="px-6 py-2 rounded-xl bg-primary/15 border border-primary/30 text-sm font-display font-semibold text-primary hover:bg-primary/25 transition-colors">
                  Play Again
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </GameLayout>
  );
}
