import { motion } from "framer-motion";
import { Zap, Shield, Globe, Trophy, Headphones, BarChart3 } from "lucide-react";

const features = [
  { icon: Zap, title: "Instant Matchmaking", desc: "Find opponents in under 3 seconds with our intelligent ranking system." },
  { icon: Shield, title: "Anti-Cheat Engine", desc: "Fair play guaranteed with real-time behavioral analysis and detection." },
  { icon: Globe, title: "Global Servers", desc: "Low-latency gameplay across 12 regions worldwide for seamless matches." },
  { icon: Trophy, title: "Ranked Seasons", desc: "Climb the leaderboard through seasonal competitive play and earn rewards." },
  { icon: Headphones, title: "Voice & Chat", desc: "Built-in voice chat and messaging to coordinate with friends in-game." },
  { icon: BarChart3, title: "Deep Analytics", desc: "Track your performance with detailed stats, replays, and improvement tips." },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 border-t border-border/30">
      <div className="container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Built for <span className="text-gradient-gold">Serious</span> Players
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            Every feature designed to deliver the best online gaming experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group p-6 rounded-2xl bg-gradient-card border border-border/50 hover:border-primary/20 shadow-card hover:shadow-card-hover transition-all duration-500"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-500">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground mb-2">{f.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
