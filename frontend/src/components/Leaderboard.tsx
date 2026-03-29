import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Medal, Crown, Award, Target } from "lucide-react";

const gameFilters = ["All", "Chess", "Backgammon", "Checkers", "Connect Four", "UNO", "War", "Snap", "What Do You Meme"];

const leaderboardData = [
  { rank: 1, name: "DragonSlayer", avatar: "DS", rating: 2847, winRate: 78, winStreak: 18, flag: "🇺🇸", games: "Chess" },
  { rank: 2, name: "QueenGambit", avatar: "QG", rating: 2791, winRate: 74, winStreak: 14, flag: "🇬🇧", games: "Chess" },
  { rank: 3, name: "CardShark99", avatar: "CS", rating: 2683, winRate: 71, winStreak: 11, flag: "🇨🇦", games: "UNO" },
  { rank: 4, name: "BlitzMaster", avatar: "BM", rating: 2654, winRate: 69, winStreak: 9, flag: "🇩🇪", games: "Connect Four" },
  { rank: 5, name: "MemeQueen", avatar: "MQ", rating: 2598, winRate: 67, winStreak: 7, flag: "🇦🇺", games: "What Do You Meme" },
  { rank: 6, name: "NightOwlX", avatar: "NO", rating: 2541, winRate: 65, winStreak: 6, flag: "🇯🇵", games: "Backgammon" },
  { rank: 7, name: "StrategyKing", avatar: "SK", rating: 2487, winRate: 63, winStreak: 5, flag: "🇫🇷", games: "Checkers" },
  { rank: 8, name: "LuckyDraw", avatar: "LD", rating: 2432, winRate: 61, winStreak: 4, flag: "🇧🇷", games: "War" },
  { rank: 9, name: "SnapMaster", avatar: "SM", rating: 2398, winRate: 59, winStreak: 3, flag: "🇰🇷", games: "Snap" },
  { rank: 10, name: "DiceKing", avatar: "DK", rating: 2356, winRate: 58, winStreak: 2, flag: "🇮🇳", games: "Backgammon" },
];

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

  const filtered = activeFilter === "All" ? leaderboardData : leaderboardData.filter((p) => p.games === activeFilter);

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

          {/* Rows */}
          {filtered.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`grid grid-cols-[3rem_1fr_5rem_4rem_4rem_4rem] md:grid-cols-[3.5rem_1fr_6rem_5rem_5rem_5rem] items-center gap-2 px-4 md:px-6 py-3 border-b border-border/10 hover:bg-primary/5 transition-colors duration-200 ${getRankStyle(player.rank)}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg">{getRankIcon(player.rank)}</div>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display text-xs font-bold shrink-0 ${player.rank === 1 ? "bg-primary/15 text-primary border border-primary/30" : "bg-secondary border border-border/30 text-muted-foreground"}`}>
                  {player.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{player.name}</p>
                    <span className="text-sm">{player.flag}</span>
                  </div>
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
                <p className="text-[10px] font-body text-muted-foreground truncate">{player.games}</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-display font-bold text-foreground">{player.winStreak}</span>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-body text-muted-foreground">No players found for this game yet.</p>
            </div>
          )}

          <div className="px-6 py-4 text-center">
            <button className="px-6 py-2 rounded-full text-sm font-display font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border/30 hover:border-primary/20 transition-all duration-300">
              View Full Rankings
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Leaderboard;
