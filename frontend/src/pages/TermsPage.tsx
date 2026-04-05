import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Terms of Service</h1>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>Welcome to <strong className="text-foreground">PlayVault</strong>. By using games.azurenexus.com, you agree to these terms.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Service Description</h2>
        <p>PlayVault is a free online multiplayer games platform. We provide chess, backgammon, and other board games with real-time play and voice chat.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">User Conduct</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Be respectful to other players</li>
          <li>Do not use abusive language in voice or text chat</li>
          <li>Do not attempt to cheat or exploit the system</li>
          <li>Do not create multiple accounts to manipulate rankings</li>
        </ul>
        <h2 className="text-foreground font-semibold text-base pt-2">Account</h2>
        <p>You are responsible for your account. We may suspend or terminate accounts that violate these terms.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Disclaimer</h2>
        <p>PlayVault is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Changes</h2>
        <p>We may update these terms at any time. Continued use of PlayVault constitutes acceptance of the updated terms.</p>
        <p className="text-xs text-muted-foreground/60 pt-4">Last updated: April 2026</p>
      </div>
    </div>
  );
};

export default TermsPage;
