/**
 * PlayVault VideoRoom — LiveKit-powered video/audio for all game types.
 * Handles 2-player (chess, backgammon) and multi-player (What Do You Meme, up to 5).
 * Auto-adapts grid layout based on participant count.
 */
import { useState, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useTracks,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface VideoRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  gameType: string;
  maxParticipants?: number;
  compact?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

// ── Token fetcher ──────────────────────────────────────────

async function fetchToken(roomName: string, participantId: string, participantName: string, gameType: string) {
  const res = await fetch("/api/video/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomName, participantId, participantName, gameType }),
  });
  if (!res.ok) throw new Error("Failed to get video token");
  return res.json() as Promise<{ token: string; wsUrl: string }>;
}

// ── Grid layout ────────────────────────────────────────────

function gridClass(count: number) {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  return "grid-cols-3 grid-rows-2";
}

// ── Video tile ─────────────────────────────────────────────

function Tile({ trackRef, isLocal }: { trackRef: any; isLocal: boolean }) {
  const name = trackRef.participant?.name || trackRef.participant?.identity || "Player";
  const hasVideo = trackRef.publication && !trackRef.publication.isMuted;

  return (
    <div className={`relative rounded-md overflow-hidden bg-secondary/80 flex items-center justify-center ${
      isLocal ? "border border-green-500/40" : "border border-border/30"
    }`} style={{ aspectRatio: "4/3", maxHeight: 100 }}>
      {hasVideo ? (
        <VideoTrack trackRef={trackRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="text-2xl">👤</span>
          <span className="text-[10px]">{name}</span>
        </div>
      )}
      <div className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
        {isLocal && <span className="text-green-400 text-[8px]">●</span>}
        {name}
      </div>
    </div>
  );
}

// ── Video grid ─────────────────────────────────────────────

function VideoGrid({ compact }: { compact: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const room = useRoomContext();

  if (room.state === "connecting") {
    return (
      <div className="flex items-center justify-center h-20 text-muted-foreground text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Connecting video...
      </div>
    );
  }

  if (compact) {
    // Compact: tiny inline tiles
    return (
      <div className="flex gap-1 p-1 justify-center">
        {tracks.map((track) => (
          <div key={track.participant.identity}
            className={`w-10 h-10 rounded-md overflow-hidden bg-secondary/80 flex items-center justify-center ${
              track.participant.identity === localParticipant.identity ? "border border-green-500/40" : "border border-border/30"
            }`}>
            {track.publication && !track.publication.isMuted ? (
              <VideoTrack trackRef={track} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="text-[10px]">👤</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass(tracks.length)} gap-1 p-1`}
      style={{ maxHeight: tracks.length <= 2 ? 120 : 200 }}>
      {tracks.map((track) => (
        <Tile
          key={track.participant.identity}
          trackRef={track}
          isLocal={track.participant.identity === localParticipant.identity}
        />
      ))}
    </div>
  );
}

// ── Controls ───────────────────────────────────────────────

function Controls({ onLeave, compact }: { onLeave: () => void; compact?: boolean }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();

  if (compact) {
    return (
      <div className="flex gap-1 px-1 py-0.5 justify-center">
        <button onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          className={`w-7 h-7 rounded-md flex items-center justify-center ${
            isMicrophoneEnabled ? "bg-secondary border border-green-500/30 text-foreground" : "bg-secondary border border-border/30 text-muted-foreground"
          }`}>
          {isMicrophoneEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </button>
        <button onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={`w-7 h-7 rounded-md flex items-center justify-center ${
            isCameraEnabled ? "bg-secondary border border-green-500/30 text-foreground" : "bg-secondary border border-border/30 text-muted-foreground"
          }`}>
          {isCameraEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
        </button>
        <button onClick={onLeave}
          className="w-7 h-7 rounded-md flex items-center justify-center bg-secondary border border-red-500/30 text-red-400">
          <PhoneOff className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 px-2 py-1.5 justify-center border-t border-border/20">
      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          isMicrophoneEnabled ? "bg-secondary border border-green-500/30 text-foreground" : "bg-secondary border border-border/30 text-muted-foreground"
        }`}>
        {isMicrophoneEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        {isMicrophoneEnabled ? "Mute" : "Unmute"}
      </button>
      <button
        onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          isCameraEnabled ? "bg-secondary border border-green-500/30 text-foreground" : "bg-secondary border border-border/30 text-muted-foreground"
        }`}>
        {isCameraEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
        {isCameraEnabled ? "Cam off" : "Cam on"}
      </button>
      <button onClick={onLeave}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-secondary border border-red-500/30 text-red-400">
        <PhoneOff className="w-3 h-3" /> Leave
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export function VideoRoom({
  roomId, userId, userName, gameType,
  maxParticipants = 2, compact = false,
  onConnected, onDisconnected,
}: VideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState("wss://video.games.azurenexus.com");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVideo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchToken(roomId, userId, userName, gameType);
      setToken(result.token);
      setWsUrl(result.wsUrl);
      setActive(true);
    } catch (e: any) {
      setError(e.message || "Could not start video");
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, userName, gameType]);

  const stopVideo = useCallback(() => {
    setToken(null);
    setActive(false);
    onDisconnected?.();
  }, [onDisconnected]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center p-3 gap-2">
        <button onClick={startVideo} disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all ${
            loading ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
          }`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          {loading ? "Joining..." : maxParticipants > 2 ? "Join Video" : "Start Video Chat"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-card/80 border border-border/30 rounded-xl overflow-hidden">
      <LiveKitRoom
        token={token!}
        serverUrl={wsUrl}
        connect={true}
        audio={true}
        video={true}
        onConnected={onConnected}
        onDisconnected={stopVideo}
        options={{
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
          videoCaptureDefaults: { resolution: { width: 640, height: 480, frameRate: 24 } },
          publishDefaults: {
            simulcast: true,
            videoSimulcastLayers: [
              { width: 320, height: 240, encoding: { maxBitrate: 120_000, maxFramerate: 15 } },
              { width: 640, height: 480, encoding: { maxBitrate: 400_000, maxFramerate: 24 } },
            ],
          },
        }}
      >
        <RoomAudioRenderer volume={1.0} />
        <VideoGrid compact={compact} />
        <Controls onLeave={stopVideo} compact={compact} />
      </LiveKitRoom>
    </div>
  );
}
