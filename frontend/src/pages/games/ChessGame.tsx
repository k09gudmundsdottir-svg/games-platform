import GameLayout from "@/components/GameLayout";

const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const pieceMap: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

const moves = [
  { num: 1, white: "e4", black: "e5" },
  { num: 2, white: "Nf3", black: "Nc6" },
  { num: 3, white: "Bb5", black: "a6" },
  { num: 4, white: "Ba4", black: "Nf6" },
];

const MoveHistory = () => (
  <div className="p-3">
    <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">Move History</h3>
    <div className="space-y-1">
      {moves.map((m) => (
        <div key={m.num} className="flex items-center text-xs font-body">
          <span className="w-6 text-muted-foreground/50">{m.num}.</span>
          <span className="flex-1 text-foreground">{m.white}</span>
          <span className="flex-1 text-muted-foreground">{m.black}</span>
        </div>
      ))}
    </div>
  </div>
);

const ChessGame = () => {
  return (
    <GameLayout title="Chess" sidebar={<MoveHistory />}>
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[min(90vw,560px)] aspect-square">
          {/* Player Info Top */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary border border-border/30 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-muted-foreground">OP</span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Opponent</p>
              <p className="text-[10px] font-body text-muted-foreground">Rating: 1850</p>
            </div>
            <div className="ml-auto px-3 py-1 rounded-lg bg-secondary border border-border/30">
              <span className="font-display text-sm font-bold text-foreground">9:42</span>
            </div>
          </div>

          {/* Board */}
          <div className="grid grid-cols-8 border border-border/30 rounded-lg overflow-hidden shadow-card">
            {initialBoard.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/40 hover:z-10 transition-all ${
                      isDark ? "bg-primary/15" : "bg-secondary/60"
                    }`}
                  >
                    {piece && (
                      <span className={`text-2xl md:text-3xl select-none ${piece === piece.toUpperCase() ? "text-foreground" : "text-muted-foreground"}`}>
                        {pieceMap[piece]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Player Info Bottom */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-display text-xs font-bold text-primary">YO</span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">You</p>
              <p className="text-[10px] font-body text-muted-foreground">Rating: 1720</p>
            </div>
            <div className="ml-auto px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <span className="font-display text-sm font-bold text-primary">10:00</span>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default ChessGame;
