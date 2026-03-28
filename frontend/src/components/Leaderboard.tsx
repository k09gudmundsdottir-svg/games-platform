import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp, Medal, Crown, Award } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "DragonSlayer", avatar: "DS", rating: 2847, winStreak: 18, wins: 342, games: "Chess, Checkers", trend: "+12" },
  { rank: 2, name: "QueenGambit", avatar: "QG", rating: 2791, winStreak: 14, wins: 298, games: "Chess, Backgammon", trend: "+8" },
  { rank: 3, name: "CardShark99", avatar: "CS", rating: 2683, winStreak: 11, wins: 276, games: "UNO, War", trend: "+15" },
  { rank: 4, name: "BlitzMaster", avatar: "BM", rating: 2654, winStreak: 9, wins: 251, games: "Chess, Connect Four", trend: "+5" },
  { rank: 5, name: "MemeQueen", avatar: "MQ", rating: 2598, winStreak: 7, wins: 234, games: "What Do You Meme", trend: "+3" },
  { rank: 6, name: "NightOwlX", avatar: "NO", rating: 2541, winStreak: 6, wins: 219, games: "Backgammon, Snap", trend: "+10" },
  { rank: 7, name: "StrategyKing", avatar: "SK", rating: 2487, winStreak: 5, wins: 203, games: "Chess, Checkers", trend: "-2" },
  { rank: 8, name: "LuckyDraw", avatar: "LD", rating: 2432, winStreak: 4, wins: 198, games: "UNO, War", trend: "+7" },
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
  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      <div className="relative container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">
              Global Rankings
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Hall of <span className="text-gradient-gold">Legends</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            The top players across all arenas. Climb the ranks and etch your name in glory.
          </p>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-card"
        >
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] md:grid-cols-[3.5rem_1fr_6rem_6rem_5rem] items-center gap-2 px-4 md:px-6 py-3 border-b border-border/30 bg-secondary/30">
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">#</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Player</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center">Rating</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center hidden md:block">Wins</span>
            <span className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider text-center">Streak</span>
          </div>

          {/* Rows */}
          {leaderboardData.map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`grid grid-cols-[3rem_1fr_5rem_5rem_5rem] md:grid-cols-[3.5rem_1fr_6rem_6rem_5rem] items-center gap-2 px-4 md:px-6 py-3 border-b border-border/10 hover:bg-primary/5 transition-colors duration-200 ${getRankStyle(player.rank)}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg">
                {getRankIcon(player.rank)}
              </div>

              {/* Player Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display text-xs font-bold shrink-0 ${
                  player.rank === 1
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary border border-border/30 text-muted-foreground"
                }`}>
                  {player.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground truncate">{player.name}</p>
                  <p className="text-[10px] font-body text-muted-foreground truncate hidden md:block">{player.games}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="text-center">
                <p className="text-sm font-display font-bold text-foreground">{player.rating.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-0.5">
                  <TrendingUp className={`w-2.5 h-2.5 ${player.trend.startsWith("+") ? "text-primary" : "text-destructive"}`} />
                  <span className={`text-[10px] font-body font-medium ${player.trend.startsWith("+") ? "text-primary" : "text-destructive"}`}>
                    {player.trend}
                  </span>
                </div>
              </div>

              {/* Wins */}
              <div className="text-center hidden md:block">
                <p className="text-sm font-display font-medium text-foreground">{player.wins}</p>
              </div>

              {/* Win Streak */}
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-display font-bold text-foreground">{player.winStreak}</span>
              </div>
            </motion.div>
          ))}

          {/* View All */}
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
