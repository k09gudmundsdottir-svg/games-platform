import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GamesGrid from "@/components/GamesGrid";
import Leaderboard from "@/components/Leaderboard";
import Tournaments from "@/components/Tournaments";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <GamesGrid />
      <Leaderboard />
      <Tournaments />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
