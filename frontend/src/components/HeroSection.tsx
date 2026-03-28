import { motion } from "framer-motion";
import { Play, Sparkles, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Gaming atmosphere"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-gradient-glow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse-glow" />
          <span className="text-xs font-body font-medium text-primary">
            Season 4 Now Live — New Tournaments Daily
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
        >
          Where Legends
          <br />
          <span className="text-gradient-gold">Come to Play</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-xl mx-auto text-base md:text-lg font-body text-muted-foreground mb-10"
        >
          Chess, Backgammon, UNO, Checkers and more — all in one premium platform.
          Challenge friends or compete globally.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="group flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm shadow-glow hover:opacity-90 transition-all">
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Start Playing Free
          </button>
          <button className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl border border-border bg-secondary/50 text-secondary-foreground font-display font-medium text-sm hover:bg-secondary transition-colors">
            <Users className="w-4 h-4" />
            Browse Games
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex items-center justify-center gap-8 md:gap-16 mt-16 pt-8 border-t border-border/30"
        >
          {[
            { value: "2.4M+", label: "Active Players" },
            { value: "8", label: "Classic Games" },
            { value: "50K+", label: "Daily Matches" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-xl md:text-2xl font-bold text-gradient-gold">
                {stat.value}
              </div>
              <div className="text-xs font-body text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
