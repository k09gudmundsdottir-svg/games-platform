import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Users } from "lucide-react";
import GameLayout from "@/components/GameLayout";
import { playDiceRoll, playPiecePlace, unlockAudio } from "@/lib/sounds";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

const supabase = createClient(
  "https://mjphpctvuxmbjhmcscoj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcGhwY3R2dXhtYmpobWNzY29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjgzMzQsImV4cCI6MjA4NzgwNDMzNH0.dsmzK7SS4_RSC5wbN6ifhjRlOSbfDZjIcfh2MKkDQIs"
);

const diceIcons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const haptic = (style: "light" | "medium" | "heavy" = "light") => {
  if (navigator.vibrate) navigator.vibrate(style === "light" ? 10 : style === "medium" ? 25 : 50);
};

// Standard backgammon starting position
// Gold (positive) moves from point 24 toward point 1 (index 23→0)
// Silver (negative) moves from point 1 toward point 24 (index 0→23)
// Point N = index N-1
const INITIAL_BOARD: number[] = (() => {
  const b = new Array(24).fill(0);
  // Gold: 2 on point 24, 5 on point 13, 3 on point 8, 5 on point 6
  b[23] = 2;  // point 24
  b[12] = 5;  // point 13
  b[7] = 3;   // point 8
  b[5] = 5;   // point 6
  // Silver: 2 on point 1, 5 on point 12, 3 on point 17, 5 on point 19
  b[0] = -2;   // point 1
  b[11] = -5;  // point 12
  b[16] = -3;  // point 17
  b[18] = -5;  // point 19
  return b;
})();

const genRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

type Phase = "lobby" | "playing" | "gameover";
type PlayerRole = "gold" | "silver";

// Gold moves high→low (indices 23→0), positive board values
// Silver moves low→high (indices 0→23), negative board values

const BackgammonOnline = () => {
  const { user } = useAuth();
  // Lobby state
  const [phase, setPhase] = useState<Phase>("lobby");
  const [playerName, setPlayerName] = useState(user?.username || "");
  const [roomCode, setRoomCode] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [myRole, setMyRole] = useState<PlayerRole | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reactions
  const [floatingReaction, setFloatingReaction] = useState<{ emoji: string; id: number } | null>(null);

  // Game state
  const [board, setBoard] = useState<number[]>([...INITIAL_BOARD]);
  const [dice, setDice] = useState<number[]>([]);
  const [movesLeft, setMovesLeft] = useState<number[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [goldBar, setGoldBar] = useState(0);
  const [silverBar, setSilverBar] = useState(0);
  const [goldOff, setGoldOff] = useState(0);
  const [silverOff, setSilverOff] = useState(0);
  const [message, setMessage] = useState("Waiting for opponent...");
  const [winner, setWinner] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isGold = myRole === "gold";
  const myBar = isGold ? goldBar : silverBar;
  const oppBar = isGold ? silverBar : goldBar;
  const myOff = isGold ? goldOff : silverOff;
  const oppOff = isGold ? silverOff : goldOff;

  // Cleanup channel on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const gameIdRef = useRef<string | null>(new URLSearchParams(window.location.search).get("game"));
  const phaseRef = useRef<Phase>("lobby");

  const broadcastState = useCallback((updates: {
    board: number[]; dice: number[]; movesLeft: number[];
    goldBar: number; silverBar: number; goldOff: number; silverOff: number;
    turn: PlayerRole; message: string; winner?: string;
  }) => {
    channelRef.current?.send({
      type: "broadcast", event: "game-state", payload: updates,
    });
    // Persist to Supabase for recovery on refresh
    if (gameIdRef.current) {
      supabase.from("games").update({
        game_state: updates,
        current_turn: updates.turn === "gold" ? "white" : "black",
        last_move_at: new Date().toISOString(),
        ...(updates.winner ? { status: "completed", ended_at: new Date().toISOString() } : {}),
      }).eq("id", gameIdRef.current).then(() => {});
    }
  }, []);

  const setupChannel = useCallback((code: string, role: PlayerRole) => {
    const channel = supabase.channel(`backgammon-${code}`, {
      config: { presence: { key: role } },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      setBoard(payload.board);
      setDice(payload.dice);
      setMovesLeft(payload.movesLeft);
      setGoldBar(payload.goldBar);
      setSilverBar(payload.silverBar);
      setGoldOff(payload.goldOff);
      setSilverOff(payload.silverOff);
      setIsMyTurn(payload.turn === role);
      setMessage(payload.message);
      if (payload.winner) {
        setWinner(payload.winner);
        setPhase("gameover");
      }
    });

    channel.on("broadcast", { event: "reaction" }, ({ payload }) => {
      if (payload.from !== role) {
        setFloatingReaction({ emoji: payload.emoji, id: Date.now() });
        setTimeout(() => setFloatingReaction(null), 2500);
      }
    });

    channel.on("broadcast", { event: "chat-msg" }, ({ payload }) => {
      const msg = { sender: payload.sender, text: payload.text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setChatMessages(prev => [...prev, msg]);
      setChatOpen(open => { if (!open) setUnread(u => u + 1); return open; });
    });

    channel.on("broadcast", { event: "start-game" }, () => {
      setPhase("playing");
      setBoard([...INITIAL_BOARD]);
      setDice([]); setMovesLeft([]);
      setGoldBar(0); setSilverBar(0); setGoldOff(0); setSilverOff(0);
      setIsMyTurn(role === "gold");
      setMessage(role === "gold" ? "Your turn — roll the dice" : "Opponent's turn...");
      setWinner(null);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setPlayerCount(count);
      // Extract opponent name
      for (const key of Object.keys(state)) {
        if (key !== role) {
          const presences = state[key] as Array<{ name?: string }>;
          if (presences?.[0]?.name) setOpponentName(presences[0].name as string);
        }
      }
      // When both players are in, host starts the game (only if not already playing)
      if (count >= 2 && role === "gold" && phaseRef.current === "lobby") {
        setTimeout(() => {
          channel.send({ type: "broadcast", event: "start-game", payload: {} });
          setPhase("playing");
          setBoard([...INITIAL_BOARD]);
          setDice([]); setMovesLeft([]);
          setGoldBar(0); setSilverBar(0); setGoldOff(0); setSilverOff(0);
          setIsMyTurn(true);
          setMessage("Your turn — roll the dice");
          setWinner(null);
        }, 500);
      }
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ name: playerName || "Player", role });
      }
    });
  }, [playerName]);

  // Keep phaseRef in sync for use inside memoized callbacks
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [matchmaking, setMatchmaking] = useState(false);

  // Sync name from auth
  useEffect(() => {
    if (user?.username && !playerName) setPlayerName(user.username);
  }, [user]);

  // ── Auto-start from challenge system (?game=UUID) ────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    if (!gameId || !user?.id) return;
    gameIdRef.current = gameId;

    const loadGame = async () => {
      const { data: game, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (error || !game) {
        console.error("Failed to load game:", error);
        return;
      }

      // Determine role
      const role: PlayerRole = game.white_player_id === user.id ? "gold" : "silver";
      const name = user.username || "Player";

      setPlayerName(name);
      setRoomCode(gameId.slice(0, 6).toUpperCase());
      setMyRole(role);
      unlockAudio();

      // Restore saved game state if a game is in progress (has turn field = moves were made)
      const saved = game.game_state;
      if (saved && saved.turn && saved.board && Array.isArray(saved.board)) {
        setPhase("playing");
        setBoard(saved.board);
        setDice(saved.dice || []);
        setMovesLeft(saved.movesLeft || []);
        setGoldBar(saved.goldBar || 0);
        setSilverBar(saved.silverBar || 0);
        setGoldOff(saved.goldOff || 0);
        setSilverOff(saved.silverOff || 0);
        setIsMyTurn(saved.turn === role);
        setMessage(saved.turn === role ? "Your turn — roll the dice" : "Opponent's turn...");
        if (saved.winner) { setWinner(saved.winner); setPhase("gameover"); }
      }

      setupChannel(`game-${gameId}`, role);
    };

    loadGame();
  }, [user?.id]);

  const startMatchmaking = () => {
    unlockAudio();
    setMatchmaking(true);

    // Join matchmaking channel via Supabase Realtime presence
    const mmChannel = supabase.channel("mm-backgammon", {
      config: { presence: { key: `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` } },
    });

    mmChannel.on("presence", { event: "sync" }, () => {
      const state = mmChannel.presenceState();
      const players = Object.entries(state);

      if (players.length >= 2) {
        // Sort by join time to assign roles deterministically
        const sorted = players.sort((a: any, b: any) =>
          (a[1][0]?.joined_at || 0) - (b[1][0]?.joined_at || 0)
        );
        const myKey = mmChannel.presenceRef;
        const isFirst = sorted[0][0] === myKey || sorted[0][1][0]?.name === playerName;

        // First player = gold (creates room), second = silver
        const code = sorted[0][1][0]?.room_code || genRoomCode();
        const role: PlayerRole = isFirst ? "gold" : "silver";

        setRoomCode(code);
        setMyRole(role);
        window.location.hash = `${code}-${role}-${encodeURIComponent(playerName)}`;
        setupChannel(code, role);
        setMatchmaking(false);
        mmChannel.unsubscribe();
      }
    });

    mmChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await mmChannel.track({
          name: playerName,
          room_code: genRoomCode(),
          joined_at: Date.now(),
        });
      }
    });

    // Store for cleanup
    (window as any).__mmChannel = mmChannel;
  };

  const cancelMatchmaking = () => {
    setMatchmaking(false);
    const ch = (window as any).__mmChannel;
    if (ch) { ch.unsubscribe(); (window as any).__mmChannel = null; }
  };

  // Auto-rejoin on refresh if hash contains room info
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const parts = hash.split("-");
    if (parts.length >= 3) {
      const code = parts[0];
      const role = parts[1] as PlayerRole;
      const name = decodeURIComponent(parts.slice(2).join("-"));
      if (code.length === 6 && (role === "gold" || role === "silver")) {
        setPlayerName(name);
        setRoomCode(code);
        setMyRole(role);
        unlockAudio();
        setTimeout(() => setupChannel(code, role), 100);
      }
    }
    return () => cancelMatchmaking();
  }, []);

  // ── Game logic ──

  const canBearOff = useCallback((b: number[], bar: number, isGoldPlayer: boolean) => {
    if (bar > 0) return false;
    if (isGoldPlayer) {
      for (let i = 6; i < 24; i++) { if (b[i] > 0) return false; }
    } else {
      for (let i = 0; i < 18; i++) { if (b[i] < 0) return false; }
    }
    return true;
  }, []);

  const getValidMoves = useCallback((from: number, moves: number[], b: number[], bar: number): number[] => {
    const targets: number[] = [];
    const unique = [...new Set(moves)];
    const amGold = isGold;
    for (const die of unique) {
      if (from === -1) {
        // Re-enter from bar
        const target = amGold ? (24 - die) : (die - 1);
        if (target >= 0 && target < 24) {
          const val = b[target];
          if (amGold ? val >= -1 : val <= 1) targets.push(target);
        }
        continue;
      }
      const target = amGold ? from - die : from + die;
      // Bearing off
      if (amGold && target < 0 && canBearOff(b, bar, true)) {
        if (target === -1) { targets.push(-2); }
        else {
          let hasLower = false;
          for (let i = from - 1; i >= 0; i--) { if (b[i] > 0) { hasLower = true; break; } }
          if (!hasLower) targets.push(-2);
        }
      } else if (!amGold && target >= 24 && canBearOff(b, bar, false)) {
        if (target === 24) { targets.push(24); }
        else {
          let hasHigher = false;
          for (let i = from + 1; i < 24; i++) { if (b[i] < 0) { hasHigher = true; break; } }
          if (!hasHigher) targets.push(24);
        }
      } else if (target >= 0 && target < 24) {
        const val = b[target];
        if (amGold ? val >= -1 : val <= 1) targets.push(target);
      }
    }
    return [...new Set(targets)];
  }, [isGold, canBearOff]);

  const hasAnyValidMove = useCallback((moves: number[]): boolean => {
    if (myBar > 0) return getValidMoves(-1, moves, board, myBar).length > 0;
    for (let i = 0; i < 24; i++) {
      const val = board[i];
      if (isGold ? val > 0 : val < 0) {
        if (getValidMoves(i, moves, board, myBar).length > 0) return true;
      }
    }
    return false;
  }, [board, myBar, isGold, getValidMoves]);

  const rollDice = () => {
    if (!isMyTurn || dice.length > 0) return;
    haptic("medium");
    playDiceRoll();
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const newMoves = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    setDice([d1, d2]);
    setMovesLeft(newMoves);

    // Broadcast dice to opponent immediately so they can see the roll
    broadcastState({
      board, dice: [d1, d2], movesLeft: newMoves, goldBar, silverBar, goldOff, silverOff,
      turn: myRole!, message: `${playerName} rolled ${d1} & ${d2}`,
    });

    const canMove = (() => {
      if (myBar > 0) return getValidMoves(-1, newMoves, board, myBar).length > 0;
      for (let i = 0; i < 24; i++) {
        const val = board[i];
        if (isGold ? val > 0 : val < 0) {
          if (getValidMoves(i, newMoves, board, myBar).length > 0) return true;
        }
      }
      return false;
    })();

    if (!canMove) {
      const msg = `Rolled ${d1} & ${d2} — no valid moves`;
      setMessage(msg);
      setTimeout(() => {
        setDice([]); setMovesLeft([]);
        setIsMyTurn(false);
        const nextTurn: PlayerRole = isGold ? "silver" : "gold";
        setMessage("Opponent's turn...");
        broadcastState({
          board, dice: [], movesLeft: [], goldBar, silverBar, goldOff, silverOff,
          turn: nextTurn, message: "Your turn — roll the dice",
        });
      }, 1500);
    } else {
      setMessage(`Rolled ${d1} & ${d2}`);
    }
  };

  const endTurn = useCallback((newBoard: number[], remainingMoves: number[], gBar: number, sBar: number, gOff: number, sOff: number) => {
    // Check win
    const myPieces = isGold
      ? newBoard.reduce((s, v) => s + (v > 0 ? v : 0), 0) + gBar
      : newBoard.reduce((s, v) => s + (v < 0 ? Math.abs(v) : 0), 0) + sBar;

    if (myPieces === 0) {
      const winMsg = `${playerName || (isGold ? "Gold" : "Silver")} wins!`;
      setWinner(winMsg);
      setPhase("gameover");
      setMessage(winMsg);
      broadcastState({
        board: newBoard, dice: [], movesLeft: [], goldBar: gBar, silverBar: sBar,
        goldOff: gOff, silverOff: sOff, turn: isGold ? "gold" : "silver",
        message: `${playerName || (isGold ? "Gold" : "Silver")} wins!`, winner: winMsg,
      });
      return;
    }

    if (remainingMoves.length === 0) {
      setDice([]); setMovesLeft([]);
      setIsMyTurn(false);
      const nextTurn: PlayerRole = isGold ? "silver" : "gold";
      setMessage("Opponent's turn...");
      broadcastState({
        board: newBoard, dice: [], movesLeft: [], goldBar: gBar, silverBar: sBar,
        goldOff: gOff, silverOff: sOff, turn: nextTurn,
        message: "Your turn — roll the dice",
      });
      return;
    }

    // Check if remaining moves are possible
    const bar = isGold ? gBar : sBar;
    let canMove = false;
    if (bar > 0) {
      canMove = getValidMoves(-1, remainingMoves, newBoard, bar).length > 0;
    } else {
      for (let i = 0; i < 24; i++) {
        const val = newBoard[i];
        if (isGold ? val > 0 : val < 0) {
          if (getValidMoves(i, remainingMoves, newBoard, bar).length > 0) { canMove = true; break; }
        }
      }
    }
    if (!canMove) {
      setMessage("No valid moves left");
      setTimeout(() => {
        setDice([]); setMovesLeft([]);
        setIsMyTurn(false);
        const nextTurn: PlayerRole = isGold ? "silver" : "gold";
        setMessage("Opponent's turn...");
        broadcastState({
          board: newBoard, dice: [], movesLeft: [], goldBar: gBar, silverBar: sBar,
          goldOff: gOff, silverOff: sOff, turn: nextTurn,
          message: "Your turn — roll the dice",
        });
      }, 1000);
    }
  }, [isGold, playerName, broadcastState, getValidMoves]);

  const makeMove = (from: number, to: number, dieUsed: number) => {
    haptic("medium");
    playPiecePlace();
    const newBoard = [...board];
    let gBar = goldBar, sBar = silverBar, gOff = goldOff, sOff = silverOff;

    // Remove piece from source
    if (from === -1) {
      if (isGold) gBar--; else sBar--;
    } else {
      if (isGold) newBoard[from]--; else newBoard[from]++;
    }

    // Bearing off
    const bearOffTarget = isGold ? -2 : 24;
    if (to === bearOffTarget) {
      if (isGold) gOff++; else sOff++;
    } else {
      // Hit opponent blot?
      if (isGold && newBoard[to] === -1) { newBoard[to] = 0; sBar++; }
      else if (!isGold && newBoard[to] === 1) { newBoard[to] = 0; gBar++; }
      // Place piece
      if (isGold) newBoard[to]++; else newBoard[to]--;
    }

    // Remove used die
    const idx = movesLeft.indexOf(dieUsed);
    const remaining = [...movesLeft];
    if (idx !== -1) remaining.splice(idx, 1);

    setBoard(newBoard); setMovesLeft(remaining);
    setGoldBar(gBar); setSilverBar(sBar); setGoldOff(gOff); setSilverOff(sOff);

    // Broadcast intermediate state so opponent sees live
    const myTurnStill = remaining.length > 0;
    broadcastState({
      board: newBoard, dice, movesLeft: remaining, goldBar: gBar, silverBar: sBar,
      goldOff: gOff, silverOff: sOff, turn: isGold ? "gold" : "silver",
      message: myTurnStill ? "Opponent is moving..." : "Your turn — roll the dice",
    });

    endTurn(newBoard, remaining, gBar, sBar, gOff, sOff);
  };

  const handlePointClick = (pointIndex: number) => {
    if (!isMyTurn || movesLeft.length === 0) return;
    haptic("light");
    const bar = isGold ? goldBar : silverBar;

    if (bar > 0) {
      const targets = getValidMoves(-1, movesLeft, board, bar);
      if (targets.includes(pointIndex)) {
        const dieUsed = isGold ? (24 - pointIndex) : (pointIndex + 1);
        makeMove(-1, pointIndex, dieUsed);
      }
      return;
    }

    if (selectedPoint === null) {
      const val = board[pointIndex];
      if ((isGold ? val > 0 : val < 0) && getValidMoves(pointIndex, movesLeft, board, bar).length > 0) {
        setSelectedPoint(pointIndex);
      }
    } else if (selectedPoint === pointIndex) {
      setSelectedPoint(null);
    } else {
      const targets = getValidMoves(selectedPoint, movesLeft, board, bar);
      if (targets.includes(pointIndex)) {
        const dieUsed = Math.abs(pointIndex - selectedPoint);
        makeMove(selectedPoint, pointIndex, dieUsed);
        setSelectedPoint(null);
      } else {
        const val = board[pointIndex];
        if ((isGold ? val > 0 : val < 0) && getValidMoves(pointIndex, movesLeft, board, bar).length > 0) {
          setSelectedPoint(pointIndex);
        } else {
          setSelectedPoint(null);
        }
      }
    }
  };

  const handleBearOff = () => {
    if (selectedPoint === null) return;
    const bearOffTarget = isGold ? -2 : 24;
    const targets = getValidMoves(selectedPoint, movesLeft, board, isGold ? goldBar : silverBar);
    if (targets.includes(bearOffTarget)) {
      const dieNeeded = isGold ? selectedPoint : (24 - selectedPoint);
      const actualDie = movesLeft.find(d => d >= dieNeeded);
      if (actualDie != null) makeMove(selectedPoint, bearOffTarget, actualDie);
      setSelectedPoint(null);
    }
  };

  const resetGame = () => {
    setBoard([...INITIAL_BOARD]); setDice([]); setMovesLeft([]); setSelectedPoint(null);
    setGoldBar(0); setSilverBar(0); setGoldOff(0); setSilverOff(0);
    setWinner(null); setPhase("playing");
    const startAsGold = isGold;
    setIsMyTurn(startAsGold);
    setMessage(startAsGold ? "Your turn — roll the dice" : "Opponent's turn...");
    channelRef.current?.send({ type: "broadcast", event: "start-game", payload: {} });
  };

  // ── Derived state ──

  const validTargets = useMemo(() => {
    if (!isMyTurn || movesLeft.length === 0 || selectedPoint === null) return new Set<number>();
    return new Set(getValidMoves(selectedPoint, movesLeft, board, isGold ? goldBar : silverBar));
  }, [isMyTurn, selectedPoint, movesLeft, board, isGold, goldBar, silverBar, getValidMoves]);

  const selectablePoints = useMemo(() => {
    if (!isMyTurn || movesLeft.length === 0) return new Set<number>();
    const bar = isGold ? goldBar : silverBar;
    if (bar > 0) return new Set<number>();
    const pts = new Set<number>();
    for (let i = 0; i < 24; i++) {
      const val = board[i];
      if ((isGold ? val > 0 : val < 0) && getValidMoves(i, movesLeft, board, bar).length > 0) pts.add(i);
    }
    return pts;
  }, [isMyTurn, board, movesLeft, isGold, goldBar, silverBar, getValidMoves]);

  const pipCount = useMemo(() => {
    let gold = 0, silver = 0;
    board.forEach((v, i) => {
      if (v > 0) gold += v * (i + 1); // Gold wants to go to 0
      if (v < 0) silver += Math.abs(v) * (24 - i); // Silver wants to go to 24
    });
    gold += goldBar * 25;
    silver += silverBar * 25;
    return { gold, silver };
  }, [board, goldBar, silverBar]);

  const DiceIcon1 = dice.length >= 2 ? diceIcons[dice[0] - 1] : null;
  const DiceIcon2 = dice.length >= 2 ? diceIcons[dice[1] - 1] : null;

  const topLeft = [12, 13, 14, 15, 16, 17];
  const topRight = [18, 19, 20, 21, 22, 23];
  const bottomLeft = [11, 10, 9, 8, 7, 6];
  const bottomRight = [5, 4, 3, 2, 1, 0];

  // ── Rendering ──

  const sendChat = () => {
    if (!chatInput.trim() || !channelRef.current) return;
    const msg = { sender: playerName, text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages(prev => [...prev, msg]);
    channelRef.current.send({ type: "broadcast", event: "chat-msg", payload: { sender: playerName, text: chatInput.trim() } });
    setChatInput("");
    setTimeout(() => document.getElementById("chat-input")?.focus(), 50);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const ChatBubble = () => (
    <>
      <button onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setUnread(0); }}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-all shadow-lg">
        <span className="text-lg">💬</span>
        {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
      </button>
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-72 h-96 rounded-2xl border border-border/50 bg-card shadow-2xl flex flex-col overflow-hidden"
          onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">💬 Chat with {opponentName || "opponent"}</span>
            <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === playerName ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-1.5 rounded-xl text-xs ${
                  msg.sender === playerName ? "bg-primary/15 text-foreground rounded-br-sm" : "bg-secondary/80 text-foreground rounded-bl-sm"
                }`}>{msg.text}</div>
                <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{msg.sender} · {msg.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-t border-border/30 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="Type a message..." autoFocus id="chat-input"
              className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/30" />
            <button onClick={sendChat} className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25">
              <span className="text-xs">➤</span>
            </button>
          </div>
        </div>
      )}
    </>
  );

  const Checker = ({ isPlayerGold, isSelected, isSelectable, small, dimmed }: {
    isPlayerGold: boolean; isSelected?: boolean; isSelectable?: boolean; small?: boolean; dimmed?: boolean;
  }) => {
    const sizeClass = small ? "sm:w-5 sm:h-5 md:w-6 md:h-6" : "sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11";
    const sizeStyle = small
      ? { width: "clamp(14px, 3.8vw, 20px)", height: "clamp(14px, 3.8vw, 20px)" }
      : { width: "clamp(20px, 6.2vw, 28px)", height: "clamp(20px, 6.2vw, 28px)" };
    return (
      <div className={`${sizeClass} rounded-full relative flex-shrink-0 transition-all duration-200 ${
        isSelected ? "scale-110 z-20" : ""
      } ${isSelectable ? "cursor-pointer" : ""} ${dimmed ? "opacity-50" : ""}`}
        style={sizeStyle}
      >
        <div className={`absolute inset-0 rounded-full ${
          isPlayerGold
            ? "bg-gradient-to-b from-[hsl(38,90%,62%)] to-[hsl(32,85%,40%)]"
            : "bg-gradient-to-b from-[hsl(0,0%,82%)] to-[hsl(0,0%,52%)]"
        } ${isSelected ? "shadow-[0_0_16px_4px_hsl(38,90%,55%/0.6)]" : ""}`} />
        <div className={`absolute inset-[3px] rounded-full ${
          isPlayerGold
            ? "bg-gradient-to-br from-[hsl(40,95%,65%)] via-[hsl(38,90%,55%)] to-[hsl(30,80%,42%)]"
            : "bg-gradient-to-br from-[hsl(0,0%,88%)] via-[hsl(0,0%,75%)] to-[hsl(0,0%,58%)]"
        }`} />
        <div className={`absolute inset-[5px] rounded-full ${
          isPlayerGold
            ? "bg-gradient-to-b from-[hsl(42,100%,78%/0.5)] to-transparent"
            : "bg-gradient-to-b from-[hsl(0,0%,95%/0.5)] to-transparent"
        }`} style={{ height: "40%" }} />
      </div>
    );
  };

  const renderPoint = (index: number, isTop: boolean) => {
    const count = board[index];
    const absCount = Math.abs(count);
    const pointIsGold = count > 0;
    const isSelected = selectedPoint === index;
    const isTarget = validTargets.has(index);
    const isSelectable = selectablePoints.has(index) && selectedPoint === null;
    const maxShow = Math.min(absCount, 5);
    const overflow = absCount > 5 ? absCount : 0;
    const isEven = index % 2 === 0;
    const isMyPiece = isGold ? pointIsGold : !pointIsGold;
    const dimPieces = !isMyTurn && absCount > 0;

    return (
      <motion.div
        key={index}
        ref={(el: HTMLDivElement | null) => { pointRefs.current[index] = el; }}
        className={`flex-1 flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center relative cursor-pointer touch-manipulation`}
        style={{ minWidth: "clamp(20px, 6vw, 28px)" }}
        onClick={() => handlePointClick(index)}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
      >
        <svg viewBox="0 0 48 120" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`tri-o-${index}`} x1="0" y1={isTop ? "0" : "1"} x2="0" y2={isTop ? "1" : "0"}>
              <stop offset="0%" stopColor={isEven ? "hsl(38, 55%, 38%)" : "hsl(25, 25%, 22%)"} />
              <stop offset="100%" stopColor={isEven ? "hsl(38, 45%, 28%)" : "hsl(25, 18%, 15%)"} />
            </linearGradient>
          </defs>
          <polygon
            points={isTop ? "2,0 46,0 24,116" : "2,120 46,120 24,4"}
            fill={`url(#tri-o-${index})`}
            stroke={isTarget ? "hsl(38, 90%, 55%)" : isEven ? "hsl(38, 40%, 30%)" : "hsl(25, 15%, 18%)"}
            strokeWidth={isTarget ? "2" : "0.5"}
          />
          {isTarget && (
            <polygon
              points={isTop ? "2,0 46,0 24,116" : "2,120 46,120 24,4"}
              fill="hsl(38, 90%, 55%)" opacity="0.12"
            />
          )}
        </svg>
        <div className={`absolute ${isTop ? "top-0" : "bottom-0"} flex ${isTop ? "flex-col" : "flex-col-reverse"} items-center`}>
          {Array.from({ length: maxShow }).map((_, j) => (
            <motion.div key={j} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: j * 0.03 }}
              style={j > 0 ? { marginTop: isTop ? "clamp(-8px, -1.2vw, -2px)" : undefined, marginBottom: !isTop ? "clamp(-8px, -1.2vw, -2px)" : undefined } : undefined}
            >
              <Checker
                isPlayerGold={pointIsGold}
                isSelected={isSelected && j === maxShow - 1}
                isSelectable={isSelectable && j === maxShow - 1}
                dimmed={!isMyPiece && dimPieces}
              />
              {j === maxShow - 1 && overflow > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-bold text-primary-foreground drop-shadow-md">{overflow}</span>
              )}
            </motion.div>
          ))}
        </div>
        {isTarget && absCount === 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`absolute ${isTop ? "top-8 sm:top-10" : "bottom-8 sm:bottom-10"} w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary/30 border border-primary/60`}
          />
        )}
      </motion.div>
    );
  };

  // ── Lobby UI ──

  if (phase === "lobby" && !roomCode) {
    return (
      <GameLayout title="Backgammon Online" >
        <div className="flex items-center justify-center h-full p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">Backgammon Online</h2>
              <p className="text-sm text-muted-foreground font-body">Play with a friend in real-time with video chat</p>
            </div>
            <div className="space-y-3">
              {!user && (
                <input
                  value={playerName} onChange={e => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 font-body"
                />
              )}
              {user && (
                <p className="text-center text-sm text-foreground font-display font-semibold">Playing as {playerName}</p>
              )}
              {!matchmaking ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={startMatchmaking} disabled={!playerName.trim()}
                  className="w-full px-6 py-3 rounded-xl font-display font-semibold text-sm text-primary-foreground disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, hsl(38, 90%, 55%), hsl(28, 85%, 42%))", boxShadow: "0 6px 24px -4px hsl(38, 90%, 55% / 0.4)" }}>
                  Play Online
                </motion.button>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-3 py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="font-display font-semibold text-foreground">Finding opponent...</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Waiting for another player to join. Video chat will start automatically.
                  </p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={cancelMatchmaking}
                    className="px-6 py-2 rounded-xl font-display font-medium text-sm border border-border/30 text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </GameLayout>
    );
  }

  if (phase === "lobby" && roomCode) {
    return (
      <GameLayout title="Backgammon Online" >
        <div className="flex items-center justify-center h-full p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold text-foreground">Opponent found!</h2>
              <p className="text-sm text-muted-foreground font-body">Connecting...</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="font-body">{playerCount} / 2 connected</span>
            </div>
            <p className="text-xs text-muted-foreground/60 font-body">
              You are <span className="text-primary font-semibold">{myRole === "gold" ? "Gold" : "Silver"}</span>
            </p>
          </div>
        </div>
      </GameLayout>
    );
  }

  // ── Game / Gameover board UI ──

  const bearOffTarget = isGold ? -2 : 24;
  const showBearOff = isMyTurn && selectedPoint !== null && validTargets.has(bearOffTarget);
  const myLabel = playerName || (isGold ? "Gold" : "Silver");
  const oppLabel = opponentName || (isGold ? "Silver" : "Gold");

  return (
    <GameLayout title="Backgammon Online" >
      <div className="flex flex-col items-center h-full p-0 sm:p-2 md:p-3 gap-0 sm:gap-2">
        {/* Scoreboard — compact on mobile */}
        <div className="w-full max-w-[100vw] sm:max-w-[900px] flex items-center justify-between px-1 py-0 sm:py-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Checker isPlayerGold={!isGold} small />
            <div>
              <p className="font-display text-xs sm:text-sm font-semibold text-foreground tracking-wide">{oppLabel}</p>
              <p className="text-[9px] sm:text-[11px] font-body text-muted-foreground">
                Pip <span className="text-foreground font-semibold">{isGold ? pipCount.silver : pipCount.gold}</span>
                <span className="mx-2 text-border">|</span>
                Off <span className="text-primary font-semibold">{oppOff}</span>
              </p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={message} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              className={`text-[10px] sm:text-xs font-body text-center max-w-[180px] ${isMyTurn ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {message}
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="font-display text-xs sm:text-sm font-semibold text-foreground tracking-wide">{myLabel} (You)</p>
              <p className="text-[9px] sm:text-[11px] font-body text-muted-foreground">
                Off <span className="text-primary font-semibold">{myOff}</span>
                <span className="mx-2 text-border">|</span>
                Pip <span className="text-foreground font-semibold">{isGold ? pipCount.gold : pipCount.silver}</span>
              </p>
            </div>
            <Checker isPlayerGold={isGold} small />
          </div>
        </div>

        {/* Board */}
        <div ref={boardRef} className="w-full max-w-[100vw] sm:max-w-[900px] rounded-lg sm:rounded-2xl overflow-hidden relative flex-1 flex flex-col min-h-0 max-h-[72vh]"
          style={{
            background: "linear-gradient(145deg, hsl(25, 20%, 14%) 0%, hsl(20, 18%, 8%) 100%)",
            border: "1.5px solid hsl(38, 40%, 25%)",
            boxShadow: "0 20px 60px -15px hsl(0 0% 0% / 0.7), inset 0 1px 0 hsl(38, 30%, 25% / 0.3)",
          }}>
          {/* Point numbers - top */}
          <div className="flex px-1 pt-1 shrink-0">
            <div className="flex-1 flex">{topLeft.map(i => <div key={i} className="flex-1 text-center"><span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span></div>)}</div>
            <div className="sm:w-10 md:w-14" style={{ width: "clamp(24px, 7vw, 32px)" }} />
            <div className="flex-1 flex">{topRight.map(i => <div key={i} className="flex-1 text-center"><span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span></div>)}</div>
          </div>
          {/* Top half */}
          <div className="flex px-1 flex-1 min-h-0">
            <div className="flex-1 flex">{topLeft.map(i => renderPoint(i, true))}</div>
            <div className="sm:w-10 md:w-14 flex flex-col items-center justify-start gap-0.5 sm:gap-1 pt-2 sm:pt-3"
              style={{ width: "clamp(24px, 7vw, 32px)", background: "linear-gradient(180deg, hsl(20, 15%, 7%) 0%, hsl(20, 12%, 10%) 100%)", borderLeft: "1px solid hsl(38, 25%, 18%)", borderRight: "1px solid hsl(38, 25%, 18%)" }}>
              {Array.from({ length: silverBar }).map((_, j) => <Checker key={j} isPlayerGold={false} small />)}
            </div>
            <div className="flex-1 flex">{topRight.map(i => renderPoint(i, true))}</div>
          </div>
          {/* Center with dice */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-1.5 sm:py-3 mx-1 rounded-lg shrink-0"
            style={{ background: "linear-gradient(90deg, hsl(20, 15%, 7%) 0%, hsl(20, 12%, 10%) 50%, hsl(20, 15%, 7%) 100%)" }}>
            {DiceIcon1 && DiceIcon2 && (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <motion.div key={`d1-${dice[0]}-${dice[1]}`} initial={{ rotate: -360, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(38, 85%, 58%), hsl(32, 80%, 42%))", boxShadow: "0 4px 12px hsl(0 0% 0% / 0.5), inset 0 1px 2px hsl(45, 100%, 80% / 0.3)" }}>
                  <DiceIcon1 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary-foreground" />
                </motion.div>
                <motion.div key={`d2-${dice[1]}-${dice[0]}`} initial={{ rotate: 360, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.1 }}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(38, 85%, 58%), hsl(32, 80%, 42%))", boxShadow: "0 4px 12px hsl(0 0% 0% / 0.5), inset 0 1px 2px hsl(45, 100%, 80% / 0.3)" }}>
                  <DiceIcon2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary-foreground" />
                </motion.div>
              </div>
            )}
            {movesLeft.length > 0 && isMyTurn && (
              <div className="flex gap-1.5">
                {movesLeft.map((m, i) => (
                  <span key={i} className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-display font-bold text-primary border border-primary/30"
                    style={{ background: "hsl(38, 90%, 55% / 0.1)" }}>{m}</span>
                ))}
              </div>
            )}
          </div>
          {/* Bottom half */}
          <div className="flex px-1 flex-1 min-h-0">
            <div className="flex-1 flex">{bottomLeft.map(i => renderPoint(i, false))}</div>
            <div className="sm:w-10 md:w-14 flex flex-col-reverse items-center justify-start gap-0.5 sm:gap-1 pb-2 sm:pb-3"
              style={{ width: "clamp(24px, 7vw, 32px)", background: "linear-gradient(180deg, hsl(20, 12%, 10%) 0%, hsl(20, 15%, 7%) 100%)", borderLeft: "1px solid hsl(38, 25%, 18%)", borderRight: "1px solid hsl(38, 25%, 18%)" }}>
              {Array.from({ length: goldBar }).map((_, j) => <Checker key={j} isPlayerGold small />)}
            </div>
            <div className="flex-1 flex">{bottomRight.map(i => renderPoint(i, false))}</div>
          </div>
          {/* Point numbers - bottom */}
          <div className="flex px-1 pb-1 shrink-0">
            <div className="flex-1 flex">{bottomLeft.map(i => <div key={i} className="flex-1 text-center"><span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span></div>)}</div>
            <div className="sm:w-10 md:w-14" style={{ width: "clamp(24px, 7vw, 32px)" }} />
            <div className="flex-1 flex">{bottomRight.map(i => <div key={i} className="flex-1 text-center"><span className="text-[7px] sm:text-[9px] font-display text-muted-foreground/40 tracking-widest">{i + 1}</span></div>)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-4 shrink-0">
          {isMyTurn && dice.length === 0 && phase === "playing" && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={rollDice}
              className="px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-display font-semibold text-xs sm:text-sm text-primary-foreground tracking-wide"
              style={{ background: "linear-gradient(135deg, hsl(38, 90%, 55%), hsl(28, 85%, 42%))", boxShadow: "0 6px 24px -4px hsl(38, 90%, 55% / 0.4), inset 0 1px 0 hsl(45, 100%, 80% / 0.2)" }}>
              Roll Dice
            </motion.button>
          )}
          {showBearOff && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleBearOff}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-display font-semibold text-xs sm:text-sm text-primary border border-primary/30"
              style={{ background: "hsl(38, 90%, 55% / 0.1)" }}>
              Bear Off
            </motion.button>
          )}
          {phase === "gameover" && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={resetGame}
              className="px-5 py-2 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-display font-semibold text-xs sm:text-sm text-primary-foreground tracking-wide"
              style={{ background: "linear-gradient(135deg, hsl(38, 90%, 55%), hsl(28, 85%, 42%))", boxShadow: "0 6px 24px -4px hsl(38, 90%, 55% / 0.4)" }}>
              <RotateCcw className="w-3.5 h-3.5 inline mr-2" /> Rematch
            </motion.button>
          )}
        </div>

        {/* Turn indicator */}
        {phase === "playing" && !isMyTurn && dice.length === 0 && (
          <p className="text-xs text-muted-foreground font-body mt-2 animate-pulse">Waiting for {oppLabel} to roll...</p>
        )}
      </div>
      {phase === "playing" && typeof window !== "undefined" && window.innerWidth >= 640 && <ChatBubble />}

      {/* Floating reaction */}
      <AnimatePresence>
        {floatingReaction && (
          <motion.div
            key={floatingReaction.id}
            initial={{ opacity: 0, scale: 0.3, y: 0 }}
            animate={{ opacity: 1, scale: 1.4, y: -120 }}
            exit={{ opacity: 0, scale: 0.5, y: -200 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          >
            <span className="text-7xl sm:text-8xl drop-shadow-2xl">{floatingReaction.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji reaction bar */}
      {phase === "playing" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-t border-border/30">
          <div className="flex items-center justify-center gap-0.5 px-1 py-1.5 overflow-x-auto scrollbar-hide">
            {[
              { emoji: "👏", label: "Great move" },
              { emoji: "🎲", label: "Lucky roll" },
              { emoji: "😤", label: "Frustration" },
              { emoji: "😂", label: "Funny" },
              { emoji: "🔥", label: "On fire" },
              { emoji: "💀", label: "Devastating" },
              { emoji: "🧠", label: "Big brain" },
              { emoji: "😱", label: "Shocked" },
              { emoji: "🫡", label: "Respect" },
              { emoji: "💤", label: "Hurry up" },
              { emoji: "🍀", label: "Lucky" },
              { emoji: "👀", label: "I see you" },
              { emoji: "🥶", label: "Cold blooded" },
              { emoji: "🏳️", label: "I give up" },
              { emoji: "🤝", label: "Good game" },
            ].map(({ emoji, label }) => (
              <motion.button
                key={emoji}
                whileTap={{ scale: 1.5 }}
                onClick={() => {
                  channelRef.current?.send({
                    type: "broadcast",
                    event: "reaction",
                    payload: { emoji, from: myRole },
                  });
                  // Show own reaction briefly
                  setFloatingReaction({ emoji, id: Date.now() });
                  setTimeout(() => setFloatingReaction(null), 2500);
                }}
                className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-secondary/60 active:bg-primary/20 transition-colors"
                title={label}
              >
                <span className="text-lg sm:text-xl">{emoji}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </GameLayout>
  );
};

export default BackgammonOnline;
