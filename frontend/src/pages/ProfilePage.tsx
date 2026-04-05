import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Target, Flame, Calendar, Gamepad2, TrendingUp, TrendingDown, Minus, Clock, Award, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { legendsApi } from "@/lib/api";
import {
  achievements,
  getUnlockedAchievements,
  getNextAchievements,
  type PlayerStats,
} from "@/lib/achievements";

const gameList = ["Chess", "Backgammon", "Checkers", "Connect Four", "UNO", "War", "Snap", "What Do You Meme"];

const gameIcons: Record<string, string> = {
  Chess: "\u265A",
  Backgammon: "\u2680",
  Checkers: "\u26C0",
  "Connect Four": "\u26AB",
  UNO: "\u{1F0CF}",
  War: "\u2694\uFE0F",
  Snap: "\u26A1",
  "What Do You Meme": "\u{1F602}",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface MatchRecord {
  game: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  eloChange: number;
  date: string;
}

const ProfilePage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setMatchLoading(true);
    legendsApi
      .matchHistory(user.id)
      .then((data: any) => {
        if (cancelled) return;
        const matches: MatchRecord[] = Array.isArray(data)
          ? data.slice(0, 20)
          : Array.isArray(data?.matches)
            ? data.matches.slice(0, 20)
            : [];
        setMatchHistory(matches);
        setMatchError(false);
      })
      .catch(() => {
        if (!cancelled) setMatchError(true);
      })
      .finally(() => {
        if (!cancelled) setMatchLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  if (!isLoggedIn || !user) {
    navigate("/login");
    return null;
  }

  const totalWins = Object.values(user.wins).reduce((a, b) => a + b, 0);
  const totalLosses = Object.values(user.losses).reduce((a, b) => a + b, 0);
  const winRate = user.totalGames > 0 ? Math.round((totalWins / user.totalGames) * 100) : 0;

  // Build PlayerStats for the achievements system
  const maxElo = Math.max(1200, ...Object.values(user.elo));
  const gamesPlayed: Record<string, number> = {};
  for (const game of gameList) {
    const count = (user.wins[game] || 0) + (user.losses[game] || 0);
    if (count > 0) gamesPlayed[game] = count;
  }

  const playerStats: PlayerStats = {
    totalGames: user.totalGames,
    wins: totalWins,
    losses: totalLosses,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    eloRating: maxElo,
    gamesPlayed,
  };

  // Compute streak from recent matches (local + API)
  const allMatches = matchHistory.length > 0 ? matchHistory : user.recentMatches;
  let currentStreak = 0;
  for (const m of allMatches) {
    if (m.result === "win") currentStreak++;
    else break;
  }
  let bestStreak = currentStreak;
  let streak = 0;
  for (const m of allMatches) {
    if (m.result === "win") {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }
  playerStats.winStreak = currentStreak;
  playerStats.bestStreak = bestStreak;

  const unlockedAchievements = getUnlockedAchievements(playerStats);
  const nextAchievements = getNextAchievements(playerStats);
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const totalAchievements = achievements.length;

  // Combine match data: prefer API history, fall back to user.recentMatches
  const displayMatches: MatchRecord[] =
    matchHistory.length > 0
      ? matchHistory
      : user.recentMatches.map((m) => ({ ...m, result: m.result as "win" | "loss" | "draw" }));

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

        {/* Match History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Match History</h2>
          </div>

          {matchLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-body text-muted-foreground mt-2">Loading matches...</p>
            </div>
          ) : matchError && displayMatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-body text-muted-foreground">Match history unavailable</p>
            </div>
          ) : displayMatches.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-body text-muted-foreground">No matches yet -- challenge someone!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayMatches.map((match, i) => {
                const isWin = match.result === "win";
                const isDraw = match.result === "draw";
                const resultLabel = isWin ? "Win" : isDraw ? "Draw" : "Loss";
                const resultColor = isWin
                  ? "text-primary bg-primary/10"
                  : isDraw
                    ? "text-yellow-400 bg-yellow-400/10"
                    : "text-destructive bg-destructive/10";
                const iconBg = isWin
                  ? "bg-primary/10"
                  : isDraw
                    ? "bg-yellow-400/10"
                    : "bg-destructive/10";
                const eloColor = match.eloChange > 0
                  ? "text-primary"
                  : match.eloChange < 0
                    ? "text-destructive"
                    : "text-muted-foreground";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                      {isWin ? (
                        <TrendingUp className="w-4 h-4 text-primary" />
                      ) : isDraw ? (
                        <Minus className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                    </div>

                    <span className="text-lg" title={match.game}>
                      {gameIcons[match.game] || "\u{1F3AE}"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-medium text-foreground truncate">
                        {match.game} vs {match.opponent}
                      </p>
                      <p className="text-[10px] font-body text-muted-foreground">
                        {timeAgo(match.date)}
                      </p>
                    </div>

                    <span className={`text-[10px] font-display font-semibold px-2 py-0.5 rounded-full ${resultColor}`}>
                      {resultLabel}
                    </span>

                    <span className={`text-sm font-display font-bold min-w-[3rem] text-right ${eloColor}`}>
                      {match.eloChange > 0 ? "+" : ""}{match.eloChange}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Achievements</h2>
            </div>
            <span className="text-xs font-body text-muted-foreground px-3 py-1 rounded-full bg-secondary/50 border border-border/30">
              {unlockedAchievements.length}/{totalAchievements} unlocked
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-secondary/50 border border-border/20 mb-6 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedAchievements.length / totalAchievements) * 100}%` }}
              transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-primary"
            />
          </div>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-3">Unlocked</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {unlockedAchievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-2xl block mb-1">{achievement.icon}</span>
                    <p className="text-xs font-display font-semibold text-primary">{achievement.title}</p>
                    <p className="text-[10px] font-body text-muted-foreground mt-0.5">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Next / Locked Achievements */}
          {nextAchievements.length > 0 && (
            <div>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-3">Up Next</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {nextAchievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="rounded-xl bg-secondary/30 border border-border/20 p-3 text-center opacity-60"
                  >
                    <div className="relative inline-block mb-1">
                      <span className="text-2xl grayscale">{achievement.icon}</span>
                      <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-0.5 -right-1" />
                    </div>
                    <p className="text-xs font-display font-semibold text-muted-foreground">{achievement.title}</p>
                    <p className="text-[10px] font-body text-muted-foreground/70 mt-0.5">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {unlockedAchievements.length === 0 && nextAchievements.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm font-body text-muted-foreground">Play some games to start earning achievements!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
