import GameLayout from "@/components/GameLayout";
import { Globe, MapPin, Flag, Trophy, Timer, Zap, Target, TrendingUp } from "lucide-react";

const modes = [
  { name: "Guess Country", desc: "Identify nations by outline", icon: Globe, players: 342 },
  { name: "Continents", desc: "Master the world map", icon: MapPin, players: 189 },
  { name: "Speed Quiz", desc: "Race against the clock", icon: Zap, players: 276 },
  { name: "Challenge", desc: "Battle friends live", icon: Target, players: 154 },
];

const Sidebar = () => (
  <div className="p-3 space-y-4">
    <div>
      <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Stats</h3>
      <div className="space-y-2">
        {[
          { label: "Countries Mastered", value: "47 / 195", icon: Flag },
          { label: "Current Streak", value: "12 days", icon: TrendingUp },
          { label: "Global Rank", value: "#1,247", icon: Trophy },
          { label: "Best Time", value: "4.2s", icon: Timer },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/20">
            <stat.icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-body text-muted-foreground truncate">{stat.label}</p>
              <p className="text-xs font-display font-semibold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-display text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Leaderboard</h3>
      <div className="space-y-1">
        {[
          { rank: 1, name: "MapMaster", score: 9840, flag: "🇩🇪" },
          { rank: 2, name: "GeoWizard", score: 9710, flag: "🇯🇵" },
          { rank: 3, name: "AtlasKing", score: 9650, flag: "🇧🇷" },
          { rank: 4, name: "WorldRunner", score: 9420, flag: "🇮🇸" },
          { rank: 5, name: "NavPro", score: 9380, flag: "🇰🇷" },
        ].map((p) => (
          <div key={p.rank} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-secondary/30 transition-colors">
            <span className={`text-[10px] font-display font-bold w-4 text-center ${p.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>{p.rank}</span>
            <span className="text-xs">{p.flag}</span>
            <span className="text-[11px] font-body text-foreground flex-1 truncate">{p.name}</span>
            <span className="text-[10px] font-display font-medium text-muted-foreground">{p.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const GeoQuestGame = () => {
  return (
    <GameLayout title="GeoQuest" sidebar={<Sidebar />}>
      <div className="flex flex-col items-center justify-center h-full p-6 gap-8">
        {/* Globe placeholder */}
        <div className="relative w-full max-w-md aspect-square rounded-2xl bg-secondary/30 border border-border/30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="relative flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center shadow-glow">
              <Globe className="w-16 h-16 text-primary" />
            </div>
            <p className="font-display text-sm font-semibold text-foreground">Select a Game Mode</p>
            <p className="font-body text-xs text-muted-foreground text-center max-w-xs">
              Choose a mode below to start playing. Compete globally and climb the leaderboard.
            </p>
          </div>
        </div>

        {/* Mode cards */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.name}
              className="group flex flex-col gap-2 p-4 rounded-xl bg-gradient-card border border-border/30 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <mode.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-body text-muted-foreground">{mode.players}</span>
                </div>
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{mode.name}</p>
                <p className="font-body text-[11px] text-muted-foreground">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </GameLayout>
  );
};

export default GeoQuestGame;
