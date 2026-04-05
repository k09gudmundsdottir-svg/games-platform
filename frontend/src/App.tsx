import React, { Suspense } from "react";
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

// Lazy-loaded pages
const LoginPage = React.lazy(() => import("./pages/LoginPage.tsx"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage.tsx"));
const PrivacyPage = React.lazy(() => import("./pages/PrivacyPage.tsx"));
const TermsPage = React.lazy(() => import("./pages/TermsPage.tsx"));

// Lazy-loaded game pages
const ChessGame = React.lazy(() => import("./pages/games/ChessGame.tsx"));
const BackgammonGame = React.lazy(() => import("./pages/games/BackgammonGame.tsx"));
const CheckersGame = React.lazy(() => import("./pages/games/CheckersGame.tsx"));
const ConnectFourGame = React.lazy(() => import("./pages/games/ConnectFourGame.tsx"));
const UnoGame = React.lazy(() => import("./pages/games/UnoGame.tsx"));
const WarGame = React.lazy(() => import("./pages/games/WarGame.tsx"));
const SnapGame = React.lazy(() => import("./pages/games/SnapGame.tsx"));
const MemeGame = React.lazy(() => import("./pages/games/MemeGame.tsx"));
const SolitaireGame = React.lazy(() => import("./pages/games/SolitaireGame.tsx"));
const HeartsGame = React.lazy(() => import("./pages/games/HeartsGame.tsx"));
const GinRummyGame = React.lazy(() => import("./pages/games/GinRummyGame.tsx"));
const BackgammonOnline = React.lazy(() => import("./pages/games/BackgammonOnline.tsx"));
const GeoQuestGame = React.lazy(() => import("./pages/games/GeoQuestGame.tsx"));
const SpeedQuizGame = React.lazy(() => import("./pages/games/SpeedQuizGame.tsx"));
const ChallengeGame = React.lazy(() => import("./pages/games/ChallengeGame.tsx"));
const NationMatchGame = React.lazy(() => import("./pages/games/NationMatchGame.tsx"));

const LoadingScreen = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0a0f",
      zIndex: 9999,
    }}
  >
    <style>{`
      @keyframes kat-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <div
      style={{
        width: 48,
        height: 48,
        border: "4px solid rgba(212, 175, 55, 0.2)",
        borderTopColor: "#d4af37",
        borderRadius: "50%",
        animation: "kat-spin 0.8s linear infinite",
        marginBottom: 16,
      }}
    />
    <span
      style={{
        color: "#d4af37",
        fontFamily: "var(--font-display), serif",
        fontSize: 18,
        letterSpacing: 1,
      }}
    >
      Loading...
    </span>
  </div>
);

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
            <Suspense fallback={<LoadingScreen />}>
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
            </Suspense>
          </TooltipProvider>
        </ChallengeWrapper>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
