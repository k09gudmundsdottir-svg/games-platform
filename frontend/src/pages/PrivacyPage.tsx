import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">PlayVault</strong> ("we", "us") operates games.azurenexus.com. This policy describes how we collect and use your information.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Information We Collect</h2>
        <p>When you sign in with Google, we receive your name, email address, and profile picture. We use this to create your PlayVault account and display your name to other players.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To authenticate you and maintain your session</li>
          <li>To display your name and avatar to other players</li>
          <li>To track game statistics (wins, losses, ELO rating)</li>
          <li>To enable real-time multiplayer features</li>
        </ul>
        <h2 className="text-foreground font-semibold text-base pt-2">Data Storage</h2>
        <p>Your data is stored securely on Supabase (hosted in the EU). We do not sell or share your personal data with third parties.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Voice Chat</h2>
        <p>Voice chat uses peer-to-peer WebRTC connections. Audio is transmitted directly between players and is not recorded or stored on our servers.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Your Rights</h2>
        <p>You can delete your account and all associated data at any time by contacting us. Under GDPR, you have the right to access, correct, or delete your personal data.</p>
        <h2 className="text-foreground font-semibold text-base pt-2">Contact</h2>
        <p>For privacy questions, contact us at the email associated with this domain.</p>
        <p className="text-xs text-muted-foreground/60 pt-4">Last updated: April 2026</p>
      </div>
    </div>
  );
};

export default PrivacyPage;
