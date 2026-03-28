import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Users, Zap, Crown, Calendar, ChevronRight } from "lucide-react";

interface Tournament {
  id: number;
  title: string;
  game: string;
  prizePool: string;
  entryFee: string;
  players: { current: number; max: number };
  startsAt: Date;
  status: "registering" | "starting_soon" | "live";
  tier: "gold" | "silver" | "bronze";
}

const tournaments: Tournament[] = [
  {
    id: 1, title: "Grand Masters Invitational", game: "Chess", prizePool: "$5,000",
    entryFee: "Free", players: { current: 247, max: 256 }, tier: "gold",
    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000), status: "registering",
  },
  {
    id: 2, title: "UNO Blitz Championship", game: "UNO", prizePool: "$2,500",
    entryFee: "$5", players: { current: 189, max: 512 }, tier: "silver",
    startsAt: new Date(Date.now() + 8 * 60 * 60 * 1000 + 42 * 60 * 1000), status: "registering",
  },
  {
    id: 3, title: "Backgammon Royale", game: "Backgammon", prizePool: "$1,500",
    entryFee: "$3", players: { current: 64, max: 128 }, tier: "bronze",
    startsAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 8 * 60 * 1000), status: "registering",
  },
  {
    id: 4, title: "Meme Wars Live", game: "What Do You Meme", prizePool: "$1,000",
    entryFee: "Free", players: { current: 78, max: 100 }, tier: "silver",
    startsAt: new Date(Date.now() + 45 * 60 * 1000), status: "starting_soon",
  },
];

const tierStyles: Record<string, { badge: string; border: string; glow: string }> = {
  gold: {
    badge: "bg-primary/15 text-primary border-primary/30",
    border: "border-primary/20 hover:border-primary/40",
    glow: "hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.2)]",
  },
  silver: {
    badge: "bg-muted/30 text-muted-foreground border-border/40",
    border: "border-border/30 hover:border-border/60",
    glow: "hover:shadow-[0_0_30px_-5px_hsl(var(--muted-foreground)/0.1)]",
  },
  bronze: {
    badge: "bg-[hsl(25,60%,50%)]/10 text-[hsl(25,60%,50%)] border-[hsl(25,60%,50%)]/20",
    border: "border-[hsl(25,60%,50%)]/15 hover:border-[hsl(25,60%,50%)]/30",
    glow: "hover:shadow-[0_0_30px_-5px_hsl(25,60%,50%,0.15)]",
  },
};

const Countdown = ({ target }: { target: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      {[
        { val: pad(timeLeft.h), label: "h" },
        { val: pad(timeLeft.m), label: "m" },
        { val: pad(timeLeft.s), label: "s" },
      ].map((unit, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/40 font-display text-sm font-bold">:</span>}
          <div className="w-9 h-10 rounded-lg bg-secondary border border-border/30 flex flex-col items-center justify-center">
            <span className="font-display text-sm font-bold text-foreground leading-none">{unit.val}</span>
            <span className="text-[8px] font-body text-muted-foreground/60 uppercase">{unit.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const TournamentCard = ({ tournament, index }: { tournament: Tournament; index: number }) => {
  const style = tierStyles[tournament.tier];
  const fillPct = (tournament.players.current / tournament.players.max) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`rounded-2xl border bg-card/80 backdrop-blur-sm p-5 transition-all duration-500 ${style.border} ${style.glow}`}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}>
              {tournament.game}
            </span>
            {tournament.status === "starting_soon" && (
              <span className="flex items-center gap-1 text-[10px] font-display font-semibold text-primary animate-pulse">
                <Zap className="w-3 h-3" /> Starting Soon
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-bold text-foreground truncate">{tournament.title}</h3>
        </div>
      </div>

      {/* Prize & Timer */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</p>
          <p className="font-display text-2xl font-bold text-gradient-gold">{tournament.prizePool}</p>
        </div>
        <div>
          <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1 text-right">Starts In</p>
          <Countdown target={tournament.startsAt} />
        </div>
      </div>

      {/* Players Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-body text-muted-foreground">
              {tournament.players.current} / {tournament.players.max} players
            </span>
          </div>
          <span className="text-xs font-body text-muted-foreground">
            Entry: <span className="text-foreground font-medium">{tournament.entryFee}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${fillPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
          />
        </div>
      </div>

      {/* Register Button */}
      <button
        className={`w-full py-2.5 rounded-lg font-display font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
          tournament.status === "starting_soon"
            ? "bg-primary text-primary-foreground shadow-glow hover:opacity-90"
            : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
        }`}
      >
        {tournament.status === "starting_soon" ? "Join Now" : "Register"}
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const Tournaments = () => {
  return (
    <section id="tournaments" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-30" />
      <div className="relative container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">
              Upcoming Events
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Compete for <span className="text-gradient-gold">Glory</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            Enter tournaments, climb the brackets, and win real prizes. New events every day.
          </p>
        </motion.div>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tournaments.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} />
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <button className="px-8 py-3 rounded-full text-sm font-display font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border/30 hover:border-primary/20 transition-all duration-300">
            View All Tournaments
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Tournaments;
