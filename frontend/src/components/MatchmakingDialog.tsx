import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Link2, Copy, Check, Loader2, Swords, Monitor, Users, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/contexts/PresenceContext";

interface MatchmakingDialogProps {
  open: boolean;
  onClose: () => void;
  gameTitle: string;
  slug?: string;
}

const MatchmakingDialog = ({ open, onClose, gameTitle, slug }: MatchmakingDialogProps) => {
  const [mode, setMode] = useState<"choose" | "matchmaking" | "friend-link" | "online-friends">("choose");
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const friendLink = `https://games.azurenexus.com/play/${slug || gameTitle.toLowerCase()}-online`;

  // Safe presence hook — won't crash if context unavailable
  let onlineUsers: any[] = [];
  let sendInviteFn: any = () => {};
  try {
    const presence = usePresence();
    onlineUsers = presence.onlineUsers || [];
    sendInviteFn = presence.sendInvite;
  } catch { /* presence not available */ }

  useEffect(() => {
    if (mode !== "matchmaking") { setSearchTime(0); return; }
    const interval = setInterval(() => setSearchTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(friendLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setMode("choose");
    setSearchTime(0);
    onClose();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/30">
              <h3 className="font-display text-xl font-bold text-foreground">{gameTitle}</h3>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* Choose Mode */}
                {mode === "choose" && (
                  <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <button onClick={() => setMode("online-friends")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow relative">
                        <Users className="w-5 h-5 text-primary" />
                        {onlineUsers.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-card">{onlineUsers.length}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Play a Friend</p>
                        <p className="text-xs font-body text-muted-foreground">{onlineUsers.length > 0 ? `${onlineUsers.length} online — invite to play` : "See who's online"}</p>
                      </div>
                    </button>

                    <button onClick={() => setMode("matchmaking")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <Search className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Play Online</p>
                        <p className="text-xs font-body text-muted-foreground">Instant matchmaking with any player</p>
                      </div>
                    </button>

                    <button onClick={() => setMode("friend-link")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <Link2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Share Link</p>
                        <p className="text-xs font-body text-muted-foreground">Send a link — no account needed</p>
                      </div>
                    </button>

                    <button onClick={() => { handleClose(); navigate(`/play/${slug || gameTitle.toLowerCase()}`); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <Monitor className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Play vs Computer</p>
                        <p className="text-xs font-body text-muted-foreground">Practice against AI — start instantly</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* Online Friends */}
                {mode === "online-friends" && (
                  <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <button onClick={() => setMode("choose")} className="text-muted-foreground hover:text-foreground text-xs">← Back</button>
                    {onlineUsers.length === 0 ? (
                      <div className="text-center py-6 space-y-3">
                        <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                        <p className="font-display font-semibold text-foreground">No one online</p>
                        <p className="text-xs text-muted-foreground">Share a link instead</p>
                        <button onClick={() => setMode("friend-link")} className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">Share Link</button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {onlineUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-secondary/30">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                  {u.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                              </div>
                              <div>
                                <p className="font-display font-semibold text-foreground text-sm">{u.username}</p>
                                <p className="text-[10px] text-muted-foreground">{u.status === "in-game" ? `Playing ${u.currentGame}` : "Online"}</p>
                              </div>
                            </div>
                            <button onClick={() => { sendInviteFn(u.id, gameTitle, slug || gameTitle.toLowerCase()); setInviteSent(u.id); }}
                              disabled={inviteSent === u.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${inviteSent === u.id ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                              {inviteSent === u.id ? <><Check className="w-3 h-3" /> Sent</> : <><Send className="w-3 h-3" /> Invite</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Matchmaking Spinner */}
                {mode === "matchmaking" && (
                  <motion.div key="matchmaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ borderTopColor: "hsl(var(--primary))" }}
                      />
                      <div className="absolute inset-3 rounded-full bg-primary/5 flex items-center justify-center">
                        <Swords className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-foreground">Finding opponent…</p>
                      <p className="text-sm font-body text-muted-foreground mt-1">Search time: {formatTime(searchTime)}</p>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}

                {/* Friend Link */}
                {mode === "friend-link" && (
                  <motion.div key="friend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-display text-lg font-bold text-foreground">Share this link</p>
                      <p className="text-xs font-body text-muted-foreground mt-1">Your friend clicks and joins instantly</p>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
                      <input
                        readOnly
                        value={friendLink}
                        className="flex-1 bg-transparent text-xs font-body text-foreground focus:outline-none truncate"
                      />
                      <button
                        onClick={handleCopy}
                        className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Waiting for friend */}
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      <span className="text-xs font-body text-muted-foreground">Waiting for friend to join…</span>
                    </div>

                    <button
                      onClick={() => setMode("choose")}
                      className="w-full py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    >
                      Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchmakingDialog;
