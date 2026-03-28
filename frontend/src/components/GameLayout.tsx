import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, PanelRightClose, PanelRightOpen, ArrowLeft, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameLayoutProps {
  title: string;
  children: ReactNode;
  sidebar?: ReactNode;
  forceVideoPanel?: boolean;
}

const VideoPanel = ({ collapsed, onToggle, forced }: { collapsed: boolean; onToggle: () => void; forced?: boolean }) => {
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: forced ? 320 : 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b border-border/20">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              <span className="text-xs font-display font-semibold text-foreground">
                {forced ? "Video Chat" : "Voice / Video"}
              </span>
            </div>
            {!forced && (
              <button onClick={onToggle} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Video Feeds */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto">
            {/* Self */}
            <div className="relative aspect-video rounded-xl bg-secondary/80 border border-border/30 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-primary">You</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/60 backdrop-blur-sm">
                <span className="text-[10px] font-body text-foreground">You</span>
              </div>
            </div>

            {/* Opponent */}
            <div className="relative aspect-video rounded-xl bg-secondary/80 border border-border/30 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border/30 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-muted-foreground">?</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-background/60 backdrop-blur-sm">
                <span className="text-[10px] font-body text-foreground">Opponent</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-3 border-t border-border/20 flex items-center justify-center gap-2">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${micOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive/20 text-destructive"}`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${videoOn ? "bg-secondary text-foreground hover:bg-secondary/80" : "bg-destructive/20 text-destructive"}`}
            >
              {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GameLayout = ({ title, children, sidebar, forceVideoPanel }: GameLayoutProps) => {
  const [videoPanelOpen, setVideoPanelOpen] = useState(!!forceVideoPanel);
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-12 border-b border-border/30 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-sm font-bold text-foreground">{title}</h1>
          <span className="text-[10px] font-body text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border/30">
            Room: XK4M9P
          </span>
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
            <button
              onClick={() => setVideoPanelOpen(!videoPanelOpen)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {videoPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {sidebar && (
            <div className="w-56 border-l border-border/20 bg-card/30 overflow-y-auto hidden lg:block">
              {sidebar}
            </div>
          )}
        </div>

        {/* Video Panel */}
        <VideoPanel
          collapsed={!videoPanelOpen}
          onToggle={() => setVideoPanelOpen(false)}
          forced={forceVideoPanel}
        />
      </div>
    </div>
  );
};

export default GameLayout;
