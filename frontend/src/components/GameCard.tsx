import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Star, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RoomDialog from "./RoomDialog";
import MatchmakingDialog from "./MatchmakingDialog";

interface GameCardProps {
  title: string;
  image: string;
  players: string;
  duration: string;
  rating: number;
  category: string;
  online: number;
  index: number;
  requiresCamera?: boolean;
  slug: string;
  externalUrl?: string;
}

const skillGames = ["Chess", "Backgammon", "Checkers", "Connect Four", "Hearts", "Gin Rummy", "Solitaire"];
const triviaGames = ["GeoQuest", "Speed Quiz", "Challenge", "Nation Match"];

const GameCard = ({ title, image, players, duration, rating, category, online, index, requiresCamera, slug, externalUrl }: GameCardProps) => {
  const [roomOpen, setRoomOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const isSkillGame = skillGames.includes(title);

  const handlePlay = () => {
    if (triviaGames.includes(title)) {
      navigate(`/play/${slug}`);
      return;
    }
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (isSkillGame) {
      setMatchOpen(true);
    } else {
      setRoomOpen(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        whileHover={{ y: -8 }}
        className="group relative rounded-2xl overflow-hidden bg-gradient-card border border-border/50 shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-500 cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={image} alt={title} loading="lazy" width={640} height={800} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-border/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-body font-medium text-foreground">
              {triviaGames.includes(title) ? "Solo" : "vs AI"}
            </span>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[10px] font-display font-semibold text-primary uppercase tracking-wider">{category}</span>
            </div>
            {requiresCamera && (
              <div className="px-2 py-1 rounded-full bg-accent/80 border border-primary/30 flex items-center gap-1">
                <Video className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-body font-medium text-primary">📹</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">{title}</h3>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /><span className="text-xs font-body">{players} players</span></div>
            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><span className="text-xs font-body">{duration}</span></div>
            <div className="flex items-center gap-1 ml-auto"><Star className="w-3.5 h-3.5 fill-primary text-primary" /><span className="text-xs font-body font-medium text-foreground">{rating}</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePlay} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-display font-semibold text-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300">
              {isSkillGame ? "Play" : "Play Now"}
            </button>
            {externalUrl ? (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2.5 rounded-lg bg-secondary/60 text-muted-foreground font-display font-medium text-sm hover:text-foreground hover:bg-secondary transition-all duration-300 border border-border/30">
                Visit
              </a>
            ) : (
              <button onClick={() => navigate(`/play/${slug}`)} className="px-3 py-2.5 rounded-lg bg-secondary/60 text-muted-foreground font-display font-medium text-sm hover:text-foreground hover:bg-secondary transition-all duration-300 border border-border/30">
                Preview
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {isSkillGame ? (
        <MatchmakingDialog open={matchOpen} onClose={() => setMatchOpen(false)} gameTitle={title} slug={slug} />
      ) : (
        <RoomDialog open={roomOpen} onClose={() => setRoomOpen(false)} gameTitle={title} requiresCamera={requiresCamera} />
      )}
    </>
  );
};

export default GameCard;
