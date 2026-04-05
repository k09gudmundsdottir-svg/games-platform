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
import gameGeoquest from "@/assets/game-geoquest.jpg";
import gameSpeedquiz from "@/assets/game-speedquiz.jpg";
import gameChallenge from "@/assets/game-challenge.jpg";
import gameNationmatch from "@/assets/game-nationmatch.jpg";

const categories = ["All", "Board", "Card", "Party", "Trivia"];

const games = [
  { title: "Chess", image: gameChess, players: "2", duration: "10-60 min", rating: 4.9, category: "Board", online: 12847, requiresCamera: false, slug: "chess" },
  { title: "Backgammon", image: gameBackgammon, players: "2", duration: "10-30 min", rating: 4.7, category: "Board", online: 3291, requiresCamera: false, slug: "backgammon" },
  { title: "Hearts", image: gameSnap, players: "4", duration: "15-30 min", rating: 4.8, category: "Card", online: 8432, requiresCamera: false, slug: "hearts" },
  { title: "Gin Rummy", image: gameWar, players: "2", duration: "10-20 min", rating: 4.7, category: "Card", online: 5219, requiresCamera: false, slug: "gin-rummy" },
  { title: "Solitaire", image: gameUno, players: "1", duration: "5-15 min", rating: 4.6, category: "Card", online: 24561, requiresCamera: false, slug: "solitaire" },
  { title: "Checkers", image: gameCheckers, players: "2", duration: "10-30 min", rating: 4.6, category: "Board", online: 2764, requiresCamera: false, slug: "checkers" },
  { title: "Connect Four", image: gameConnect4, players: "2", duration: "5-15 min", rating: 4.5, category: "Board", online: 1983, requiresCamera: false, slug: "connect-four" },
  { title: "UNO", image: gameUno, players: "2-8", duration: "10-25 min", rating: 4.8, category: "Card", online: 6153, requiresCamera: false, slug: "uno" },
  { title: "War", image: gameWar, players: "2", duration: "15-30 min", rating: 4.3, category: "Card", online: 2104, requiresCamera: false, slug: "war" },
  { title: "Snap", image: gameSnap, players: "1", duration: "5-15 min", rating: 4.4, category: "Card", online: 1876, requiresCamera: false, slug: "snap" },
  { title: "What Do You Meme", image: gameMeme, players: "3-8", duration: "20-45 min", rating: 4.7, category: "Party", online: 4521, requiresCamera: true, slug: "what-do-you-meme" },
  { title: "GeoQuest", image: gameGeoquest, players: "1", duration: "5-20 min", rating: 4.8, category: "Trivia", online: 481, requiresCamera: false, slug: "geoquest" },
  { title: "Speed Quiz", image: gameSpeedquiz, players: "1", duration: "3-10 min", rating: 4.6, category: "Trivia", online: 276, requiresCamera: false, slug: "speed-quiz" },
  { title: "Challenge", image: gameChallenge, players: "1", duration: "5-15 min", rating: 4.7, category: "Trivia", online: 154, requiresCamera: false, slug: "challenge" },
  { title: "Nation Match", image: gameNationmatch, players: "1", duration: "5-10 min", rating: 4.5, category: "Trivia", online: 203, requiresCamera: false, slug: "nation-match" },
];

const GamesGrid = () => {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? games : games.filter((g) => g.category === active);

  const isAll = active === "All";
  const mainGames = isAll ? filtered.filter((g) => g.category !== "Trivia") : filtered;
  const triviaGames = isAll ? filtered.filter((g) => g.category === "Trivia") : [];

  return (
    <section id="games-grid" className="py-24 relative">
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

        {/* Main Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainGames.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>

        {/* Trivia Divider & Grid (All view only) */}
        {isAll && triviaGames.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 my-14"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/60 border border-border/30">
                <span className="text-[10px] font-display font-bold text-primary uppercase tracking-widest">Trivia</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {triviaGames.map((game, i) => (
                <GameCard key={game.title} {...game} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default GamesGrid;
