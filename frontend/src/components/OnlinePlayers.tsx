/**
 * PlayVault — Online Players Panel
 * Shows who's online. Click a player to challenge them.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Swords, X, ChevronDown } from "lucide-react";
import { useChallenge, OnlinePlayer } from "@/contexts/ChallengeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

const OnlinePlayers = () => {
  const { user } = useAuth();
  const { onlinePlayers, sendChallenge, outgoingChallenge } = useChallenge();
  const [expanded, setExpanded] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);
  const location = useLocation();

  // Hide when in an active game (URL has ?game= param or on a /play/ page with game param)
  const isInGame = location.search.includes("game=");
  if (!user || isInGame) return null;

  const available = onlinePlayers.filter((p) => p.status === "online");
  const inGame = onlinePlayers.filter((p) => p.status === "in_game");

  const handleChallenge = (player: OnlinePlayer, gameType: "chess" | "backgammon") => {
    sendChallenge(player.id, gameType);
    setSelectedPlayer(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-72">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-t-xl bg-card border border-border/30 border-b-0"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-display font-semibold text-sm text-foreground">
            Online
          </span>
          {onlinePlayers.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
              {onlinePlayers.length}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Player list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-b-xl border border-border/30 bg-card shadow-xl"
          >
            <div className="max-h-80 overflow-y-auto">
              {onlinePlayers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No one else is online</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Invite a friend to play!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {/* Available players */}
                  {available.map((player) => (
                    <div key={player.id} className="relative">
                      <button
                        onClick={() => setSelectedPlayer(selectedPlayer?.id === player.id ? null : player)}
                        disabled={!!outgoingChallenge}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors disabled:opacity-50"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {player.avatarUrl || player.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">{player.displayName}</p>
                          <p className="text-[10px] text-green-400">Online</p>
                        </div>
                        <Swords className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Challenge options dropdown */}
                      <AnimatePresence>
                        {selectedPlayer?.id === player.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-secondary/20 border-t border-border/10"
                          >
                            <div className="px-4 py-2 flex gap-2">
                              <button
                                onClick={() => handleChallenge(player, "chess")}
                                className="flex-1 py-2 rounded-lg text-xs font-display font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                              >
                                Chess
                              </button>
                              <button
                                onClick={() => handleChallenge(player, "backgammon")}
                                className="flex-1 py-2 rounded-lg text-xs font-display font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                              >
                                Backgammon
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* In-game players */}
                  {inGame.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border/20 flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {player.avatarUrl || player.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-card" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{player.displayName}</p>
                        <p className="text-[10px] text-amber-400">In Game</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlinePlayers;
