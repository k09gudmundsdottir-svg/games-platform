import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, DoorOpen, Plus, Video, User, Crown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RoomDialogProps {
  open: boolean;
  onClose: () => void;
  gameTitle: string;
  requiresCamera?: boolean;
}

const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const fakeNames = ["Alex", "Jordan", "Casey", "Morgan", "Riley", "Sam", "Taylor"];

const slugMap: Record<string, string> = {
  "What Do You Meme": "what-do-you-meme",
  "UNO": "uno",
  "Snap": "snap",
  "War": "war",
};

const RoomDialog = ({ open, onClose, gameTitle, requiresCamera }: RoomDialogProps) => {
  const [mode, setMode] = useState<"name" | "choose" | "create" | "join" | "lobby">("name");
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<{ name: string; isHost: boolean }[]>([]);

  // Simulate players joining the lobby
  useEffect(() => {
    if (mode !== "lobby") return;
    const initial = [{ name: playerName || "You", isHost }];
    setLobbyPlayers(initial);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const addPlayer = (delay: number) => {
      const t = setTimeout(() => {
        setLobbyPlayers((prev) => {
          if (prev.length >= 4) return prev;
          const available = fakeNames.filter((n) => !prev.some((p) => p.name === n));
          if (!available.length) return prev;
          const name = available[Math.floor(Math.random() * available.length)];
          return [...prev, { name, isHost: false }];
        });
      }, delay);
      timers.push(t);
    };

    addPlayer(2000);
    addPlayer(4500);
    addPlayer(8000);

    return () => timers.forEach(clearTimeout);
  }, [mode, playerName, isHost]);

  const handleCreate = () => {
    setRoomCode(generateCode());
    setIsHost(true);
    setMode("lobby");
  };

  const handleJoinGame = () => {
    setIsHost(false);
    setMode("lobby");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setMode("name");
    setPlayerName("");
    setRoomCode("");
    setJoinCode("");
    setCopied(false);
    setIsHost(false);
    setLobbyPlayers([]);
    onClose();
  };

  const minPlayers = gameTitle === "What Do You Meme" ? 3 : 2;

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
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">{gameTitle}</h3>
                {requiresCamera && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Video className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-body text-muted-foreground">Camera & mic required</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* Name Entry */}
                {mode === "name" && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                        <User className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm font-body text-muted-foreground">Enter your display name</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Your name..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      maxLength={20}
                      className="w-full py-3 px-4 rounded-xl bg-secondary border border-border/50 font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-center text-lg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && playerName.trim()) setMode("choose");
                      }}
                    />
                    <button
                      disabled={!playerName.trim()}
                      onClick={() => setMode("choose")}
                      className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {/* Choose Create or Join */}
                {mode === "choose" && (
                  <motion.div
                    key="choose"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    <p className="text-center text-sm font-body text-muted-foreground mb-2">
                      Welcome, <span className="text-foreground font-medium">{playerName}</span>
                    </p>
                    <button
                      onClick={handleCreate}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Create Room</p>
                        <p className="text-xs font-body text-muted-foreground">Generate a 6-digit code to share</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setMode("join")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:shadow-glow transition-shadow">
                        <DoorOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">Join Room</p>
                        <p className="text-xs font-body text-muted-foreground">Enter a code to join a friend</p>
                      </div>
                    </button>
                  </motion.div>
                )}

                {/* Join Code Entry */}
                {mode === "join" && (
                  <motion.div
                    key="join"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div className="text-center">
                      <p className="text-sm font-body text-muted-foreground mb-3">Enter the 6-digit room code</p>
                      <div className="flex gap-1.5 justify-center">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            value={joinCode[i] || ""}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              if (/^[A-Z0-9]?$/.test(val)) {
                                const newCode = joinCode.split("");
                                newCode[i] = val;
                                setJoinCode(newCode.join(""));
                                if (val && e.target.nextElementSibling instanceof HTMLInputElement) {
                                  e.target.nextElementSibling.focus();
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !joinCode[i] && e.target instanceof HTMLInputElement) {
                                const prev = e.target.previousElementSibling;
                                if (prev instanceof HTMLInputElement) prev.focus();
                              }
                            }}
                            className="w-11 h-14 rounded-lg bg-secondary border border-border/50 text-center font-display text-2xl font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setMode("choose"); setJoinCode(""); }}
                        className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      >
                        Back
                      </button>
                      <button
                        disabled={joinCode.length < 6}
                        onClick={handleJoinGame}
                        className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Join Game
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Waiting Lobby */}
                {mode === "lobby" && (
                  <motion.div
                    key="lobby"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    {/* Room Code Display (host only) */}
                    {isHost && roomCode && (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/30">
                        <span className="text-xs font-body text-muted-foreground">Room Code:</span>
                        <span className="font-display font-bold text-foreground tracking-widest">{roomCode}</span>
                        <button
                          onClick={handleCopy}
                          className="w-7 h-7 rounded-md bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    {/* Players List */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-display font-medium text-foreground">Players</span>
                        </div>
                        <span className="text-xs font-body text-muted-foreground">
                          {lobbyPlayers.length} / {minPlayers} min
                        </span>
                      </div>

                      <div className="space-y-2">
                        {lobbyPlayers.map((player, i) => (
                          <motion.div
                            key={player.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/30"
                          >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                              {player.isHost ? (
                                <Crown className="w-4 h-4 text-primary" />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-display font-medium text-foreground">{player.name}</p>
                              {player.isHost && (
                                <p className="text-[10px] font-body text-primary">Host</p>
                              )}
                            </div>
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          </motion.div>
                        ))}

                        {/* Empty slots */}
                        {Array.from({ length: Math.max(0, minPlayers - lobbyPlayers.length) }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border/30"
                          >
                            <div className="w-9 h-9 rounded-lg bg-secondary/30 border border-border/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-body text-muted-foreground/40">Waiting...</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Waiting indicator */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-body text-muted-foreground">
                        {lobbyPlayers.length >= minPlayers ? "Ready to start!" : "Waiting for players..."}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setMode("choose"); setLobbyPlayers([]); }}
                        className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm font-display font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      >
                        Leave
                      </button>
                      {isHost ? (
                        <button
                          disabled={lobbyPlayers.length < minPlayers}
                          onClick={() => {
                            const slug = slugMap[gameTitle] || gameTitle.toLowerCase().replace(/\s+/g, "-");
                            handleClose();
                            navigate(`/play/${slug}`);
                          }}
                          className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-display font-semibold hover:opacity-90 transition-opacity shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Start Game
                        </button>
                      ) : (
                        <div className="flex-1 py-2.5 rounded-lg bg-secondary border border-border/30 text-sm font-display font-medium text-muted-foreground text-center">
                          Waiting for host...
                        </div>
                      )}
                    </div>
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

export default RoomDialog;
