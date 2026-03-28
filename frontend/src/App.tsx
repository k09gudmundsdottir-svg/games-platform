import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ChessGame from "./pages/games/ChessGame.tsx";
import BackgammonGame from "./pages/games/BackgammonGame.tsx";
import CheckersGame from "./pages/games/CheckersGame.tsx";
import ConnectFourGame from "./pages/games/ConnectFourGame.tsx";
import UnoGame from "./pages/games/UnoGame.tsx";
import WarGame from "./pages/games/WarGame.tsx";
import SnapGame from "./pages/games/SnapGame.tsx";
import MemeGame from "./pages/games/MemeGame.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/play/chess" element={<ChessGame />} />
          <Route path="/play/backgammon" element={<BackgammonGame />} />
          <Route path="/play/checkers" element={<CheckersGame />} />
          <Route path="/play/connect-four" element={<ConnectFourGame />} />
          <Route path="/play/uno" element={<UnoGame />} />
          <Route path="/play/war" element={<WarGame />} />
          <Route path="/play/snap" element={<SnapGame />} />
          <Route path="/play/what-do-you-meme" element={<MemeGame />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
