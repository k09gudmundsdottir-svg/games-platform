export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "milestone" | "streak" | "skill" | "social" | "explorer";
  condition: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  eloRating: number;
  gamesPlayed: Record<string, number>;
}

export const achievements: Achievement[] = [
  // Milestone achievements
  {
    id: "first_blood",
    title: "First Blood",
    description: "Play your first game",
    icon: "\u{1F3AE}",
    category: "milestone",
    condition: (stats) => stats.totalGames >= 1,
  },
  {
    id: "rising_star",
    title: "Rising Star",
    description: "Play 10 games",
    icon: "\u{2B50}",
    category: "milestone",
    condition: (stats) => stats.totalGames >= 10,
  },
  {
    id: "veteran",
    title: "Veteran",
    description: "Play 50 games",
    icon: "\u{1F396}\uFE0F",
    category: "milestone",
    condition: (stats) => stats.totalGames >= 50,
  },
  {
    id: "century",
    title: "Century",
    description: "Play 100 games",
    icon: "\u{1F4AF}",
    category: "milestone",
    condition: (stats) => stats.totalGames >= 100,
  },
  {
    id: "first_win",
    title: "First Win",
    description: "Win your first game",
    icon: "\u{1F3C6}",
    category: "milestone",
    condition: (stats) => stats.wins >= 1,
  },
  {
    id: "dominant",
    title: "Dominant",
    description: "Win 10 games",
    icon: "\u{1F4AA}",
    category: "milestone",
    condition: (stats) => stats.wins >= 10,
  },
  {
    id: "champion",
    title: "Champion",
    description: "Win 50 games",
    icon: "\u{1F451}",
    category: "milestone",
    condition: (stats) => stats.wins >= 50,
  },

  // Streak achievements
  {
    id: "on_fire",
    title: "On Fire",
    description: "Achieve a 3-game win streak",
    icon: "\u{1F525}",
    category: "streak",
    condition: (stats) => stats.bestStreak >= 3,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Achieve a 5-game win streak",
    icon: "\u{26A1}",
    category: "streak",
    condition: (stats) => stats.bestStreak >= 5,
  },
  {
    id: "legendary",
    title: "Legendary",
    description: "Achieve a 10-game win streak",
    icon: "\u{1F30B}",
    category: "streak",
    condition: (stats) => stats.bestStreak >= 10,
  },
  {
    id: "comeback_kid",
    title: "Comeback Kid",
    description: "Win after being on a 3-loss streak",
    icon: "\u{1F4A5}",
    category: "streak",
    condition: (stats) => stats.bestStreak >= 3 && stats.wins > 0,
  },

  // Skill achievements
  {
    id: "sharp_mind",
    title: "Sharp Mind",
    description: "Reach 1300 ELO rating",
    icon: "\u{1F9E0}",
    category: "skill",
    condition: (stats) => stats.eloRating >= 1300,
  },
  {
    id: "master",
    title: "Master",
    description: "Reach 1500 ELO rating",
    icon: "\u{1F393}",
    category: "skill",
    condition: (stats) => stats.eloRating >= 1500,
  },
  {
    id: "grandmaster",
    title: "Grandmaster",
    description: "Reach 1800 ELO rating",
    icon: "\u{1F48E}",
    category: "skill",
    condition: (stats) => stats.eloRating >= 1800,
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Maintain a win rate above 70% with 20+ games played",
    icon: "\u{1F3AF}",
    category: "skill",
    condition: (stats) =>
      stats.totalGames >= 20 && stats.wins / stats.totalGames > 0.7,
  },

  // Explorer achievements
  {
    id: "all_rounder",
    title: "All-Rounder",
    description: "Play 3 different game types",
    icon: "\u{1F30D}",
    category: "explorer",
    condition: (stats) => Object.keys(stats.gamesPlayed).length >= 3,
  },
  {
    id: "renaissance",
    title: "Renaissance",
    description: "Play 5 different game types",
    icon: "\u{1F3A8}",
    category: "explorer",
    condition: (stats) => Object.keys(stats.gamesPlayed).length >= 5,
  },
  {
    id: "marathon",
    title: "Marathon",
    description: "Play 25 games in a single game type",
    icon: "\u{1F3C3}",
    category: "explorer",
    condition: (stats) =>
      Object.values(stats.gamesPlayed).some((count) => count >= 25),
  },
  {
    id: "trivia_king",
    title: "Trivia King",
    description: "Play all 4 trivia game modes",
    icon: "\u{1F4DA}",
    category: "explorer",
    condition: (stats) => {
      const triviaGames = [
        "GeoQuest",
        "Speed Quiz",
        "Challenge",
        "Nation Match",
      ];
      return triviaGames.every(
        (game) => (stats.gamesPlayed[game] ?? 0) > 0
      );
    },
  },

  // Social achievements
  {
    id: "socializer",
    title: "Socializer",
    description: "Play 5 multiplayer games",
    icon: "\u{1F91D}",
    category: "social",
    condition: (stats) => stats.totalGames >= 5,
  },
];

/**
 * Returns all achievements the player has unlocked based on their stats.
 */
export function getUnlockedAchievements(stats: PlayerStats): Achievement[] {
  return achievements.filter((a) => a.condition(stats));
}

/**
 * Returns up to 3 locked achievements that are closest to being unlocked.
 * Proximity is estimated by how close the player's stats are to each threshold.
 */
export function getNextAchievements(stats: PlayerStats): Achievement[] {
  const locked = achievements.filter((a) => !a.condition(stats));

  const scored = locked.map((a) => ({
    achievement: a,
    progress: estimateProgress(a.id, stats),
  }));

  scored.sort((a, b) => b.progress - a.progress);

  return scored.slice(0, 3).map((s) => s.achievement);
}

/**
 * Estimates how close a player is to unlocking a given achievement (0 to 1).
 */
function estimateProgress(id: string, stats: PlayerStats): number {
  switch (id) {
    case "first_blood":
      return stats.totalGames / 1;
    case "rising_star":
      return stats.totalGames / 10;
    case "veteran":
      return stats.totalGames / 50;
    case "century":
      return stats.totalGames / 100;
    case "first_win":
      return stats.wins / 1;
    case "dominant":
      return stats.wins / 10;
    case "champion":
      return stats.wins / 50;
    case "on_fire":
      return stats.bestStreak / 3;
    case "unstoppable":
      return stats.bestStreak / 5;
    case "legendary":
      return stats.bestStreak / 10;
    case "comeback_kid":
      return Math.min(stats.bestStreak / 3, 0.5) + (stats.wins > 0 ? 0.5 : 0);
    case "sharp_mind":
      return Math.min(stats.eloRating / 1300, 1);
    case "master":
      return Math.min(stats.eloRating / 1500, 1);
    case "grandmaster":
      return Math.min(stats.eloRating / 1800, 1);
    case "perfectionist": {
      const gamesProgress = Math.min(stats.totalGames / 20, 1);
      const winRate =
        stats.totalGames > 0 ? stats.wins / stats.totalGames : 0;
      const rateProgress = Math.min(winRate / 0.7, 1);
      return (gamesProgress + rateProgress) / 2;
    }
    case "all_rounder":
      return Object.keys(stats.gamesPlayed).length / 3;
    case "renaissance":
      return Object.keys(stats.gamesPlayed).length / 5;
    case "marathon": {
      const maxPlayed = Math.max(0, ...Object.values(stats.gamesPlayed));
      return maxPlayed / 25;
    }
    case "trivia_king": {
      const triviaGames = [
        "GeoQuest",
        "Speed Quiz",
        "Challenge",
        "Nation Match",
      ];
      const played = triviaGames.filter(
        (g) => (stats.gamesPlayed[g] ?? 0) > 0
      ).length;
      return played / 4;
    }
    case "socializer":
      return stats.totalGames / 5;
    default:
      return 0;
  }
}
