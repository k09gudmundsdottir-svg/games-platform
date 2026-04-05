/**
 * webrtc-voice.ts
 * Robust WebRTC voice chat for mobile multiplayer (iOS + Android)
 *
 * Deterministic roles: lower userId = caller, higher = answerer.
 * No race conditions. Supabase Realtime broadcast for signaling.
 */

import { SupabaseClient } from "@supabase/supabase-js";

type VoiceStatus = "idle" | "waiting" | "connecting" | "connected" | "error";

interface VoiceChatOptions {
  supabase: SupabaseClient;
  channelName: string;
  myUserId: string;
  opponentUserId: string;
  onStatusChange?: (status: VoiceStatus) => void;
}

export function createVoiceChat({
  supabase,
  channelName,
  myUserId,
  opponentUserId,
  onStatusChange = () => {},
}: VoiceChatOptions) {

  let pc: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let signalingChannel: any = null;
  let active = false;
  let status: VoiceStatus = "idle";
  let reconnectTimer: any = null;
  let destroyCalled = false;

  // Deterministic role: lower userId is always the "caller"
  const isCaller = myUserId < opponentUserId;
  const SIGNAL_TOPIC = `voice-${channelName}`;

  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  function setStatus(s: VoiceStatus) {
    status = s;
    onStatusChange(s);
  }

  // ── Signaling ────────────────────────────────────────────

  function setupSignaling() {
    if (signalingChannel) supabase.removeChannel(signalingChannel);

    signalingChannel = supabase.channel(SIGNAL_TOPIC, {
      config: { broadcast: { self: false } },
    });

    signalingChannel.on("broadcast", { event: "offer" }, async ({ payload }: any) => {
      if (payload.to !== myUserId) return;
      await handleOffer(payload.offer);
    });

    signalingChannel.on("broadcast", { event: "answer" }, async ({ payload }: any) => {
      if (payload.to !== myUserId) return;
      await handleAnswer(payload.answer);
    });

    signalingChannel.on("broadcast", { event: "ice" }, async ({ payload }: any) => {
      if (payload.to !== myUserId) return;
      await handleIce(payload.candidate);
    });

    signalingChannel.on("broadcast", { event: "ready" }, ({ payload }: any) => {
      if (payload.from !== opponentUserId) return;
      if (isCaller && active && pc && pc.signalingState === "stable") {
        createOffer();
      }
    });

    signalingChannel.on("broadcast", { event: "hangup" }, ({ payload }: any) => {
      if (payload.from !== opponentUserId) return;
      teardownPeer();
      setStatus("idle");
    });

    signalingChannel.subscribe((state: string) => {
      if (state === "SUBSCRIBED" && active) {
        sendSignal("ready", { from: myUserId });
        if (isCaller) {
          createOffer();
        } else {
          setStatus("waiting");
        }
      }
    });
  }

  async function sendSignal(event: string, payload: any) {
    if (!signalingChannel) return;
    try {
      await signalingChannel.send({
        type: "broadcast",
        event,
        payload: { to: opponentUserId, from: myUserId, ...payload },
      });
    } catch (e) {
      console.warn("[voice] signal send failed:", e);
    }
  }

  // ── PeerConnection ───────────────────────────────────────

  function createPeer() {
    teardownPeer();
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStream) {
      localStream.getTracks().forEach(track => pc!.addTrack(track, localStream!));
    }

    pc.ontrack = (e) => {
      const audio = document.getElementById("voice-audio-remote") as HTMLAudioElement
        || createAudioElement();
      audio.srcObject = e.streams[0];
      audio.play().catch(err => {
        console.warn("[voice] remote audio play failed:", err);
      });
      setStatus("connected");
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal("ice", { candidate });
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc?.iceConnectionState;
      if (s === "connected" || s === "completed") {
        setStatus("connected");
        clearReconnectTimer();
      } else if (s === "failed") {
        if (isCaller && pc) {
          pc.restartIce();
          createOffer({ iceRestart: true });
        }
      } else if (s === "disconnected") {
        scheduleReconnect();
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isCaller && pc && pc.signalingState === "stable") {
        await createOffer();
      }
    };
  }

  // Boost Opus bitrate in SDP for WhatsApp-quality audio
  function enhanceSDP(sdp: string): string {
    // Set Opus to 48kbps mono (WhatsApp-tier), enable FEC and DTX
    return sdp.replace(
      /a=fmtp:111 /g,
      "a=fmtp:111 maxaveragebitrate=48000;stereo=0;sprop-stereo=0;useinbandfec=1;usedtx=1;"
    );
  }

  async function createOffer(options: any = {}) {
    if (!pc) return;
    setStatus("connecting");
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        ...options,
      });
      // Enhance SDP before setting
      offer.sdp = enhanceSDP(offer.sdp || "");
      await pc.setLocalDescription(offer);
      await sendSignal("offer", { offer: pc.localDescription });
    } catch (e) {
      console.error("[voice] createOffer error:", e);
      setStatus("error");
    }
  }

  async function handleOffer(offer: RTCSessionDescriptionInit) {
    if (!active) return;
    if (!pc) createPeer();
    setStatus("connecting");
    try {
      if (pc!.signalingState !== "stable") {
        await pc!.setLocalDescription({ type: "rollback" } as any);
      }
      await pc!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc!.createAnswer();
      answer.sdp = enhanceSDP(answer.sdp || "");
      await pc!.setLocalDescription(answer);
      await sendSignal("answer", { answer: pc!.localDescription });
    } catch (e) {
      console.error("[voice] handleOffer error:", e);
      setStatus("error");
    }
  }

  async function handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!pc) return;
    try {
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (e) {
      console.error("[voice] handleAnswer error:", e);
    }
  }

  async function handleIce(candidate: RTCIceCandidateInit) {
    if (!pc) return;
    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch {}
  }

  function teardownPeer() {
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      pc.close();
      pc = null;
    }
  }

  // ── Reconnect ────────────────────────────────────────────

  function scheduleReconnect() {
    clearReconnectTimer();
    if (!active || destroyCalled) return;
    reconnectTimer = setTimeout(async () => {
      createPeer();
      if (isCaller) await createOffer();
    }, 3000);
  }

  function clearReconnectTimer() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  }

  // ── Mic ──────────────────────────────────────────────────

  async function getMic(): Promise<boolean> {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });
      return true;
    } catch (e) {
      console.error("[voice] getUserMedia failed:", e);
      setStatus("error");
      return false;
    }
  }

  function stopMic() {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
  }

  // ── Audio element ────────────────────────────────────────

  function createAudioElement(): HTMLAudioElement {
    const audio = document.createElement("audio");
    audio.id = "voice-audio-remote";
    audio.playsInline = true;
    audio.autoplay = true;
    audio.style.display = "none";
    document.body.appendChild(audio);
    return audio;
  }

  // ── Public API ───────────────────────────────────────────

  async function toggle() {
    if (destroyCalled) return;

    if (!active) {
      setStatus("connecting");
      active = true;

      // 1. Pre-create audio element inside user gesture for iOS/Chrome
      if (!document.getElementById("voice-audio-remote")) {
        const a = createAudioElement();
        a.play().catch(() => {});
      }

      // 2. Get microphone
      const ok = await getMic();
      if (!ok) { active = false; return; }

      // 3. Create peer + signaling
      createPeer();
      setupSignaling();
    } else {
      active = false;
      clearReconnectTimer();
      sendSignal("hangup", {});
      teardownPeer();
      stopMic();
      if (signalingChannel) { supabase.removeChannel(signalingChannel); signalingChannel = null; }
      const audio = document.getElementById("voice-audio-remote");
      if (audio) { (audio as HTMLAudioElement).srcObject = null; audio.remove(); }
      setStatus("idle");
    }
  }

  function destroy() {
    destroyCalled = true;
    clearReconnectTimer();
    if (active) sendSignal("hangup", {});
    teardownPeer();
    stopMic();
    if (signalingChannel) { supabase.removeChannel(signalingChannel); signalingChannel = null; }
    const audio = document.getElementById("voice-audio-remote");
    if (audio) { (audio as HTMLAudioElement).srcObject = null; audio.remove(); }
  }

  return {
    toggle,
    destroy,
    get status() { return status; },
    get active() { return active; },
  };
}
