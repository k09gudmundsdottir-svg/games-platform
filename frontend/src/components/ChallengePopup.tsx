/**
 * PlayVault — Incoming Challenge Notification
 * Shows when another player challenges you. Accept or Decline.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useChallenge } from "@/contexts/ChallengeContext";
import { Check, X, Swords, Loader2 } from "lucide-react";

const ChallengePopup = () => {
  const { incomingChallenge, outgoingChallenge, acceptChallenge, declineChallenge, cancelChallenge } = useChallenge();

  return (
    <>
      {/* Incoming challenge */}
      <AnimatePresence>
        {incomingChallenge && (
          <motion.div
            initial={{ opacity: 0, y: -80, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-4 right-4 z-[200] w-80 rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-pulse pointer-events-none" />

            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground text-sm">Challenge!</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-primary font-semibold">{incomingChallenge.challengerName}</span> wants to play
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 mb-3 text-center">
                <p className="font-display font-bold text-foreground capitalize">{incomingChallenge.game_type}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Video chat enabled</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => acceptChallenge(incomingChallenge.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/15 text-primary font-display font-semibold text-sm border border-primary/30 hover:bg-primary/25 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => declineChallenge(incomingChallenge.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary/50 text-muted-foreground font-display font-medium text-sm border border-border/50 hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>

            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 60, ease: "linear" }}
              className="h-1 bg-primary/40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing challenge (waiting for response) */}
      <AnimatePresence>
        {outgoingChallenge && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 right-4 z-[200] w-72 rounded-2xl border border-border/30 bg-card shadow-xl overflow-hidden"
          >
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm font-display font-semibold text-foreground">
                Waiting for response...
              </p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {outgoingChallenge.game_type} challenge sent
              </p>
              <button
                onClick={cancelChallenge}
                className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-border/30 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 60, ease: "linear" }}
              className="h-1 bg-primary/20"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChallengePopup;
