import GameLayout from "@/components/GameLayout";
import { playPiecePlace } from "@/lib/sounds";

const initialBoard = () => {
  const b: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = "black";
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) b[r][c] = "red";
  return b;
};

const board = initialBoard();

const CheckersGame = () => {
  return (
    <GameLayout title="Checkers" isSkillGame>
      <div className="flex items-center justify-center h-full p-4">
        <div className="w-full max-w-[min(90vw,520px)] aspect-square">
          <div className="grid grid-cols-8 border border-border/30 rounded-lg overflow-hidden shadow-card">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`aspect-square flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/40 hover:z-10 transition-all ${
                      isDark ? "bg-primary/15" : "bg-secondary/60"
                    }`}
                    onClick={() => { if (piece) playPiecePlace(); }}
                  >
                    {piece && (
                      <div className={`w-[70%] h-[70%] rounded-full border-2 shadow-lg ${
                        piece === "red"
                          ? "bg-primary/80 border-primary shadow-primary/20"
                          : "bg-muted-foreground/70 border-muted-foreground shadow-muted-foreground/20"
                      }`} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default CheckersGame;
