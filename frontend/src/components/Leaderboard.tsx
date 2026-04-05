import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Medal, Crown, Award, Target, Loader2 } from "lucide-react";

const gameFilters = ["All", "Chess", "Backgammon", "Checkers", "Connect Four", "UNO", "War", "Snap", "What Do You Meme"];

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  game: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  winStreak: number;
  bestStreak: number;
  lastPlayed: string | null;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-primary" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-5 h-5 text-[hsl(25,60%,50%)]" />;
  return <span className="text-sm font-display font-bold text-muted-foreground">#{rank}</span>;
};

const getRankStyle = (rank: number) => {
  if (rank === 1) return "bg-primary/5 border-primary/20";
  if (rank <= 3) return "bg-secondary/80 border-border/40";
  return "bg-secondary/40 border-border/20";
};

const Leaderboard = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = activeFilter !== "All" ? `?game=${encodeURIComponent(activeFilter)}` : "";
        const res = await fetch(`/api/leaderboard${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [activeFilter]);

  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      <div className="relative container px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Global Rankings</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Hall of <span className="text-gradient-gold">Legends</span></h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">Top players across all arenas, sorted by ELO. Filter by game to see who dominates.</p>
        </motion.div>

        {/* Game Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {gameFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-display font-medium transition-all duration-300 ${
                activeFilter === f ? "bg-primary text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-card">
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_4rem_4rem_4rem] md:grid-cols-[3.5rem_1fr_6rem_5rem_5rem_5rem] items-center gap-2 px-4 md:px-6 py-3 border-b border-border/30 bg-secondary/30">
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">#</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Player</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center">ELO</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center hidden md:block">Win %</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center hidden md:block">Game</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center">Streak</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm font-body text-muted-foreground">Loading rankings...</p>
            </div>
          )}

          {/* Rows */}
          {!loading && leaderboard.map((player, i) => (
            <motion.div
              key={`${player.playerId}-${player.game}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`grid grid-cols-[3rem_1fr_5rem_4rem_4rem_4rem] md:grid-cols-[3.5rem_1fr_6rem_5rem_5rem_5rem] items-center gap-2 px-4 md:px-6 py-3 border-b border-border/10 hover:bg-primary/5 transition-colors duration-200 ${getRankStyle(player.rank)}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg">{getRankIcon(player.rank)}</div>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display text-xs font-bold shrink-0 ${player.rank === 1 ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary border border-border/30 text-muted-foreground"}`}>
                  {player.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{player.name}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{player.wins}W {player.losses}L{player.draws > 0 ? ` ${player.draws}D` : ""}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-display font-bold text-foreground">{player.rating.toLocaleString()}</p>
              </div>
              <div className="text-center hidden md:flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-primary" />
                <span className="text-xs font-body text-foreground">{player.winRate}%</span>
              </div>
              <div className="text-center hidden md:block">
                <p className="text-[10px] font-body text-muted-foreground truncate">{player.game}</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-display font-bold text-foreground">{player.winStreak}</span>
              </div>
            </motion.div>
          ))}

          {!loading && leaderboard.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Trophy className="w-10 h-10 text-primary/30 mx-auto mb-4" />
              <p className="font-display font-semibold text-foreground mb-1">No legends yet</p>
              <p className="text-sm font-body text-muted-foreground">Challenge a friend and be the first on the board.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Leaderboard;
