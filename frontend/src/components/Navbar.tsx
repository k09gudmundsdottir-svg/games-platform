import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Games", href: "#games" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Tournaments", href: "#tournaments" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/70"
    >
      <div className="container flex items-center justify-between h-16 px-4 md:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:shadow-glow transition-shadow duration-300">
            <Gamepad2 className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Play<span className="text-gradient-gold">Vault</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group">
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border/30 hover:border-primary/20 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="font-display text-[10px] font-bold text-primary">{user.avatar}</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-display font-semibold text-foreground leading-none">{user.username}</p>
                  <p className="text-[10px] font-body text-muted-foreground leading-none mt-0.5">{user.elo.Chess} ELO</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-body text-foreground hover:bg-secondary transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-body text-destructive hover:bg-secondary transition-colors border-t border-border/20"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate("/login")} className="px-5 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-glow">
                Play Now
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="block py-2 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ))}
              {isLoggedIn && user ? (
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <button onClick={() => { setMobileOpen(false); navigate("/profile"); }} className="w-full py-2.5 text-sm font-display font-medium text-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
                    Profile
                  </button>
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full py-2.5 text-sm font-display font-medium text-destructive border border-border rounded-lg hover:bg-secondary transition-colors">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-border/50 flex gap-3">
                  <button onClick={() => { setMobileOpen(false); navigate("/login"); }} className="flex-1 py-2.5 text-sm font-body font-medium text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => { setMobileOpen(false); navigate("/login"); }} className="flex-1 py-2.5 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground">
                    Play Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
