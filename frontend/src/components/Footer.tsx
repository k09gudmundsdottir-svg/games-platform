import { Gamepad2 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Gamepad2 className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display text-base font-bold">
                Play<span className="text-gradient-gold">Vault</span>
              </span>
            </div>
            <p className="font-body text-xs text-muted-foreground leading-relaxed">
              The premium destination for classic board and card games. Play, compete, and connect.
            </p>
          </div>
          {[
            { title: "Games", links: ["Chess", "Backgammon", "UNO", "Checkers", "Connect Four"] },
            { title: "Platform", links: ["Tournaments", "Leaderboard", "Friends", "Clubs"] },
            { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-muted-foreground">
            © 2026 PlayVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((link) => (
              <a key={link} href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
