import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://mjphpctvuxmbjhmcscoj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcGhwY3R2dXhtYmpobWNzY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjgzMzQsImV4cCI6MjA4NzgwNDMzNH0.dsmzK7SS4_RSC5wbN6ifhjRlOSbfDZjIcfh2MKkDQIs"
);

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  country: string;
  countryFlag: string;
  joinDate: string;
  elo: Record<string, number>;
  wins: Record<string, number>;
  losses: Record<string, number>;
  totalGames: number;
  favouriteGame: string;
  recentMatches: { game: string; opponent: string; result: "win" | "loss"; eloChange: number; date: string }[];
}

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (method: "google" | "email" | "signup", email?: string, password?: string) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
}

const defaultGames = ["Chess", "Backgammon", "Checkers", "Connect Four", "UNO", "War", "Snap", "What Do You Meme"];
const defaultElo: Record<string, number> = {};
const defaultWins: Record<string, number> = {};
const defaultLosses: Record<string, number> = {};
defaultGames.forEach(g => { defaultElo[g] = 1200; defaultWins[g] = 0; defaultLosses[g] = 0; });

function buildProfile(user: any): UserProfile {
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email?.split("@")[0] || "Player";
  return {
    id: user.id,
    username: name,
    email: user.email || "",
    avatar: name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    country: "",
    countryFlag: "🌍",
    joinDate: user.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    elo: { ...defaultElo },
    wins: { ...defaultWins },
    losses: { ...defaultLosses },
    totalGames: 0,
    favouriteGame: "Chess",
    recentMatches: [],
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => null,
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Handle OAuth redirect hash
      if (window.location.hash.includes("access_token")) {
        await supabase.auth.getSession();
        window.history.replaceState(null, "", window.location.pathname);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(buildProfile(session.user));
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ? buildProfile(session.user) : null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (method: "google" | "email" | "signup", email?: string, password?: string) => {
    if (method === "google") {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    } else if (method === "signup" && email && password) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return error.message;
      return null;
    } else if (method === "email" && email && password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      return null;
    }
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
