import { useState } from "react";
import { motion } from "framer-motion";
import GameCard from "./GameCard";

import gameChess from "@/assets/game-chess.jpg";
import gameBackgammon from "@/assets/game-backgammon.jpg";
import gameUno from "@/assets/game-uno.jpg";
import gameCheckers from "@/assets/game-checkers.jpg";
import gameMeme from "@/assets/game-meme.jpg";
import gameConnect4 from "@/assets/game-connect4.jpg";
import gameWar from "@/assets/game-war.jpg";
import gameSnap from "@/assets/game-snap.jpg";

const categories = ["All", "Board", "Card", "Party"];

const games = [
  { title: "Chess", image: gameChess, players: "2", duration: "10-60 min", rating: 4.9, category: "Board", online: 12847, requiresCamera: false, slug: "chess" },
  { title: "Backgammon", image: gameBackgammon, players: "2", duration: "10-30 min", rating: 4.7, category: "Board", online: 3291, requiresCamera: false, slug: "backgammon" },
  { title: "Checkers", image: gameCheckers, players: "2", duration: "10-30 min", rating: 4.6, category: "Board", online: 2764, requiresCamera: false, slug: "checkers" },
  { title: "Connect Four", image: gameConnect4, players: "2", duration: "5-15 min", rating: 4.5, category: "Board", online: 1983, requiresCamera: false, slug: "connect-four" },
  { title: "UNO", image: gameUno, players: "2-8", duration: "10-25 min", rating: 4.8, category: "Card", online: 6153, requiresCamera: false, slug: "uno" },
  { title: "War", image: gameWar, players: "2-4", duration: "15-30 min", rating: 4.3, category: "Card", online: 2104, requiresCamera: false, slug: "war" },
  { title: "Snap", image: gameSnap, players: "2-6", duration: "5-15 min", rating: 4.4, category: "Card", online: 1876, requiresCamera: false, slug: "snap" },
  { title: "What Do You Meme", image: gameMeme, players: "3-8", duration: "20-45 min", rating: 4.7, category: "Party", online: 4521, requiresCamera: true, slug: "what-do-you-meme" },
];

const GamesGrid = () => {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? games : games.filter((g) => g.category === active);

  return (
    <section id="games" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="relative container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-gradient-gold">Arena</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-md mx-auto">
            Classic games reimagined with stunning visuals, real-time multiplayer, and ranked competitive play.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-sm font-display font-medium transition-all duration-300 ${
                active === cat
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesGrid;
