import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Target, Flame, Calendar, Gamepad2, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const gameList = ["Chess", "Backgammon", "Checkers", "Connect Four", "UNO", "War", "Snap", "What Do You Meme"];

const ProfilePage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn || !user) {
    navigate("/login");
    return null;
  }

  const totalWins = Object.values(user.wins).reduce((a, b) => a + b, 0);
  const totalLosses = Object.values(user.losses).reduce((a, b) => a + b, 0);
  const winRate = user.totalGames > 0 ? Math.round((totalWins / user.totalGames) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      <div className="relative container px-4 md:px-8 py-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">Back</span>
        </button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 md:p-8 mb-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">{user.avatar}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{user.username}</h1>
                <span className="text-xl">{user.countryFlag}</span>
              </div>
              <p className="text-sm font-body text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-body text-muted-foreground">Joined {new Date(user.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Gamepad2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-display font-semibold text-primary">{user.favouriteGame}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Games", value: user.totalGames, icon: Gamepad2 },
            { label: "Wins", value: totalWins, icon: Trophy },
            { label: "Win Rate", value: `${winRate}%`, icon: Target },
            { label: "Losses", value: totalLosses, icon: Flame },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card/80 p-4 text-center"
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-body text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ELO Per Game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 mb-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4">ELO Ratings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gameList.map((game) => {
              const elo = user.elo[game] || 1200;
              const w = user.wins[game] || 0;
              const l = user.losses[game] || 0;
              return (
                <div key={game} className="rounded-xl border border-border/30 bg-secondary/30 p-3">
                  <p className="text-xs font-body text-muted-foreground mb-1">{game}</p>
                  <p className="font-display text-lg font-bold text-foreground">{elo}</p>
                  <p className="text-[10px] font-body text-muted-foreground">{w}W / {l}L</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6"
        >
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Recent Matches</h2>
          <div className="space-y-2">
            {user.recentMatches.map((match, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/20">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${match.result === "win" ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {match.result === "win" ? (
                    <TrendingUp className="w-4 h-4 text-primary" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-foreground">{match.game} vs {match.opponent}</p>
                  <p className="text-[10px] font-body text-muted-foreground">{match.date}</p>
                </div>
                <span className={`text-sm font-display font-bold ${match.result === "win" ? "text-primary" : "text-destructive"}`}>
                  {match.eloChange > 0 ? "+" : ""}{match.eloChange}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
