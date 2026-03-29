import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, PanelRightClose, PanelRightOpen, ArrowLeft, Users, Clock, Flag, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameLayoutProps {
  title: string;
  children: ReactNode;
  sidebar?: ReactNode;
  forceVideoPanel?: boolean;
  isSkillGame?: boolean;
  enableChat?: boolean;
}

const PlayerBar = ({ name, avatar, elo, flag, isYou, timeLeft }: { name: string; avatar: string; elo: number; flag: string; isYou?: boolean; timeLeft: string }) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isYou ? "bg-primary/5 border border-primary/20" : "bg-secondary/50 border border-border/30"}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isYou ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border/30"}`}>
      <span className={`font-display text-[10px] font-bold ${isYou ? "text-primary" : "text-muted-foreground"}`}>{avatar}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-display font-semibold text-foreground truncate">{name}</p>
        <span className="text-xs">{flag}</span>
      </div>
      <p className="text-[10px] font-body text-muted-foreground">{elo} ELO</p>
    </div>
    <div className={`px-2.5 py-1 rounded-lg ${isYou ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border/30"}`}>
      <span className={`font-display text-xs font-bold ${isYou ? "text-primary" : "text-foreground"}`}>{timeLeft}</span>
    </div>
  </div>
);

const VideoPanel = ({ collapsed, onToggle, forced }: { collapsed: boolean; onToggle: () => void; forced?: boolean }) => {
  // Generate a unique room name based on the page URL
  const roomName = `azurenexus-${window.location.pathname.replace(/\//g, "-").replace(/^-/, "")}`;

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: forced ? 360 : 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b border-border/20">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <span className="text-xs font-display font-semibold text-foreground">{forced ? "Video Chat" : "Voice / Video"}</span>
            </div>
            {!forced && (
              <button onClick={onToggle} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`https://video.games.azurenexus.com/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&interfaceConfig.SHOW_CHROME_EXTENSION_BANNER=false&interfaceConfig.MOBILE_APP_PROMO=false&interfaceConfig.HIDE_INVITE_MORE_HEADER=true&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup"]`}
              allow="camera; microphone; display-capture"
              className="w-full h-full border-0"
              title="Video Chat"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const aiChatResponses = [
  "Good move!", "Interesting...", "Hmm, let me think about that.",
  "Nice one!", "I didn't see that coming.", "Well played.",
  "You're good at this!", "That was bold.", "Clever strategy.",
  "I need to step up my game.", "Not bad!", "Let's see how this plays out.",
  "GG so far!", "You're making this tough.", "Respect. 👏",
];

interface ChatMsg { sender: string; text: string; time: string }

const ChatPanel = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { sender: "Computer", text: "Good luck, have fun! 🎮", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [input, setInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { sender: "You", text: input.trim(), time: now }]);
    setInput("");
    setTimeout(() => {
      const reply = aiChatResponses[Math.floor(Math.random() * aiChatResponses.length)];
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [...prev, { sender: "Computer", text: reply, time: t }]);
      if (!chatOpen) setUnread(prev => prev + 1);
    }, 1000 + Math.random() * 2000);
  };

  return (
    <>
      <button onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setUnread(0); }}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-all shadow-lg">
        <MessageCircle className="w-4.5 h-4.5" />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-72 h-96 rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-display font-semibold text-foreground">Game Chat</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                    msg.sender === "You" ? "bg-primary/15 text-foreground rounded-br-sm" : "bg-secondary/80 text-foreground rounded-bl-sm"
                  }`}>{msg.text}</div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{msg.sender} · {msg.time}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-2 border-t border-border/30 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30" />
              <button onClick={sendMessage}
                className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors">
                <Send className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const GameLayout = ({ title, children, sidebar, forceVideoPanel, isSkillGame, enableChat }: GameLayoutProps) => {
  const [videoPanelOpen, setVideoPanelOpen] = useState(!!forceVideoPanel);
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b border-border/30 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-sm font-bold text-foreground">{title}</h1>
          {!isSkillGame && (
            <span className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border/30">Room: XK4M9P</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-body">12:34</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-body">2 / 2</span>
          </div>
          {!forceVideoPanel && (
            <button onClick={() => setVideoPanelOpen(!videoPanelOpen)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {videoPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Skill Game Player Bars */}
      {isSkillGame && (
        <div className="px-4 py-2 border-b border-border/20 bg-card/30 flex items-center gap-3">
          <div className="flex-1">
            <PlayerBar name="GoldKnight" avatar="GK" elo={1450} flag="🇺🇸" isYou timeLeft="10:00" />
          </div>
          <span className="font-display text-xs font-bold text-muted-foreground">VS</span>
          <div className="flex-1">
            <PlayerBar name="SilverFox" avatar="SF" elo={1380} flag="🇬🇧" timeLeft="9:42" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">{children}</div>
          {sidebar && (
            <div className="w-56 border-l border-border/20 bg-card/30 overflow-y-auto hidden lg:block">{sidebar}</div>
          )}
        </div>
        <VideoPanel collapsed={!videoPanelOpen} onToggle={() => setVideoPanelOpen(false)} forced={forceVideoPanel} />
      </div>
      {enableChat && <ChatPanel />}
    </div>
  );
};

export default GameLayout;
