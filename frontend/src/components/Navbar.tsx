import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Menu, X, Trophy, Users, Flame } from "lucide-react";

const navLinks = [
  { label: "Games", href: "#games" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Community", href: "#community" },
  { label: "Tournaments", href: "#tournaments" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </button>
          <button className="px-5 py-2 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-glow">
            Play Now
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
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
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-border/50 flex gap-3">
                <button className="flex-1 py-2.5 text-sm font-body font-medium text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
                  Sign In
                </button>
                <button className="flex-1 py-2.5 text-sm font-display font-semibold rounded-lg bg-primary text-primary-foreground">
                  Play Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
