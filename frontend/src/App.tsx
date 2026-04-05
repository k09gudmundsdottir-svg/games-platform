import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import ChallengePopup from "@/components/ChallengePopup";
import OnlinePlayers from "@/components/OnlinePlayers";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ChessGame from "./pages/games/ChessGame.tsx";
import BackgammonGame from "./pages/games/BackgammonGame.tsx";
import CheckersGame from "./pages/games/CheckersGame.tsx";
import ConnectFourGame from "./pages/games/ConnectFourGame.tsx";
import UnoGame from "./pages/games/UnoGame.tsx";
import WarGame from "./pages/games/WarGame.tsx";
import SnapGame from "./pages/games/SnapGame.tsx";
import MemeGame from "./pages/games/MemeGame.tsx";
import SolitaireGame from "./pages/games/SolitaireGame.tsx";
import HeartsGame from "./pages/games/HeartsGame.tsx";
import GinRummyGame from "./pages/games/GinRummyGame.tsx";
import BackgammonOnline from "./pages/games/BackgammonOnline.tsx";
import GeoQuestGame from "./pages/games/GeoQuestGame.tsx";
import SpeedQuizGame from "./pages/games/SpeedQuizGame.tsx";
import ChallengeGame from "./pages/games/ChallengeGame.tsx";
import NationMatchGame from "./pages/games/NationMatchGame.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";

const queryClient = new QueryClient();

const ChallengeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return (
    <ChallengeProvider
      userId={user?.id || null}
      displayName={user?.username || ""}
      avatarUrl={user?.avatar || ""}
    >
      <ChallengePopup />
      <OnlinePlayers />
      {children}
    </ChallengeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ChallengeWrapper>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/play/chess" element={<ChessGame />} />
              <Route path="/play/backgammon" element={<BackgammonGame />} />
              <Route path="/play/backgammon-online" element={<BackgammonOnline />} />
              <Route path="/play/checkers" element={<CheckersGame />} />
              <Route path="/play/connect-four" element={<ConnectFourGame />} />
              <Route path="/play/uno" element={<UnoGame />} />
              <Route path="/play/war" element={<WarGame />} />
              <Route path="/play/snap" element={<SnapGame />} />
              <Route path="/play/what-do-you-meme" element={<MemeGame />} />
              <Route path="/play/solitaire" element={<SolitaireGame />} />
              <Route path="/play/hearts" element={<HeartsGame />} />
              <Route path="/play/gin-rummy" element={<GinRummyGame />} />
              <Route path="/play/geoquest" element={<GeoQuestGame />} />
              <Route path="/play/speed-quiz" element={<SpeedQuizGame />} />
              <Route path="/play/challenge" element={<ChallengeGame />} />
              <Route path="/play/nation-match" element={<NationMatchGame />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ChallengeWrapper>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
