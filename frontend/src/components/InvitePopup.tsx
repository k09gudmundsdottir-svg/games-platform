import { motion, AnimatePresence } from "framer-motion";
import { usePresence } from "@/contexts/PresenceContext";
import { useNavigate } from "react-router-dom";
import { Check, X, Swords } from "lucide-react";

const InvitePopup = () => {
  const { pendingInvite, acceptInvite, declineInvite } = usePresence();
  const navigate = useNavigate();

  const handleAccept = () => {
    const roomId = acceptInvite();
    if (roomId && pendingInvite) {
      navigate(`/play/${pendingInvite.slug}-online?room=${roomId}`);
    }
  };

  return (
    <AnimatePresence>
      {pendingInvite && (
        <motion.div
          initial={{ opacity: 0, y: -80, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 right-4 z-[200] w-80 rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-pulse pointer-events-none" />

          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Swords className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">Game Invite!</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary font-semibold">{pendingInvite.from.username}</span> wants to play
                </p>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3 mb-3 text-center">
              <p className="font-display font-bold text-foreground">{pendingInvite.game}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Video chat auto-enabled</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/15 text-primary font-display font-semibold text-sm border border-primary/30 hover:bg-primary/25 transition-all"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={declineInvite}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary/50 text-muted-foreground font-display font-medium text-sm border border-border/50 hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>

          {/* Auto-dismiss timer bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 30, ease: "linear" }}
            className="h-1 bg-primary/40"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvitePopup;
