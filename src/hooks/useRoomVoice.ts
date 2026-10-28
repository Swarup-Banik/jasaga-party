"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { UserProfile, PresenceUser } from "@/types/chat";
import { VoiceStatus, VoiceParticipant, VoiceSignalPayload } from "@/types/voice";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseRoomVoiceProps {
  roomId: string;
  user: UserProfile;
  onlineMembers: PresenceUser[];
}

export function useRoomVoice({ roomId, user, onlineMembers }: UseRoomVoiceProps) {
  const [status, setStatus] = useState<VoiceStatus>("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<VoiceParticipant[]>([]);
  const [availableAudioDevices, setAvailableAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Map of peerId -> RTCPeerConnection
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  // Map of peerId -> HTMLAudioElement
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // Batched candidate accumulator: peerId -> RTCIceCandidateInit[]
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const candidateTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const userRef = useRef(user);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    userRef.current = user;
    statusRef.current = status;
    isMutedRef.current = isMuted;
  }, [user, status, isMuted]);

  // Enumerate input devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      setAvailableAudioDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch {
      // Ignore device enumeration errors
    }
  }, [selectedDeviceId]);

  // Dispatch signaling message over Supabase Realtime or BroadcastChannel fallback
  const sendSignal = useCallback(async (payload: VoiceSignalPayload) => {
    if (supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "voice_signal",
        payload,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "voice_signal",
        payload,
      });
    }
  }, []);

  // Flush batched ICE candidates to target peer in a single message
  const flushCandidates = useCallback((targetPeerId: string) => {
    const list = pendingCandidatesRef.current.get(targetPeerId);
    if (!list || list.length === 0) return;

    pendingCandidatesRef.current.delete(targetPeerId);
    candidateTimersRef.current.delete(targetPeerId);

    sendSignal({
      type: "candidates",
      from: userRef.current.id,
      to: targetPeerId,
      roomId,
      candidates: list,
      timestamp: Date.now(),
    });
  }, [roomId, sendSignal]);

  // Queue an ICE candidate for debounced batching (200ms)
  const queueCandidate = useCallback((targetPeerId: string, candidate: RTCIceCandidateInit) => {
    const existing = pendingCandidatesRef.current.get(targetPeerId) || [];
    existing.push(candidate);
    pendingCandidatesRef.current.set(targetPeerId, existing);

    if (!candidateTimersRef.current.has(targetPeerId)) {
      const timer = setTimeout(() => {
        flushCandidates(targetPeerId);
      }, 200);
      candidateTimersRef.current.set(targetPeerId, timer);
    }
  }, [flushCandidates]);

  // Clean up a specific peer connection
  const closePeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    const audioEl = remoteAudioElementsRef.current.get(peerId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      remoteAudioElementsRef.current.delete(peerId);
    }
    setVoiceParticipants((prev) => prev.filter((p) => p.userId !== peerId));
  }, []);

  // Create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current.has(peerId)) {
      return peerConnectionsRef.current.get(peerId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    // Add local audio tracks if we have local stream
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        let audioEl = remoteAudioElementsRef.current.get(peerId);
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          // @ts-expect-error playsInline is valid on HTMLAudioElement in iOS Safari
          audioEl.playsInline = true;
          audioEl.style.display = "none";
          document.body.appendChild(audioEl);
          remoteAudioElementsRef.current.set(peerId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.play().catch((err) => {
          console.warn("Audio element autoplay restricted:", err);
        });
      }
    };

    // Handle ICE candidates with batching
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        queueCandidate(peerId, event.candidate.toJSON());
      } else {
        // ICE gathering complete, flush any pending candidates immediately
        flushCandidates(peerId);
      }
    };

    // Handle peer connection state change
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePeer(peerId);
      }
    };

    return pc;
  }, [closePeer, queueCandidate, flushCandidates]);

  // Initiate an offer to another peer
  const initiateOffer = useCallback(async (targetPeerId: string) => {
    try {
      const pc = createPeerConnection(targetPeerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      await sendSignal({
        type: "offer",
        from: userRef.current.id,
        to: targetPeerId,
        roomId,
        sdp: pc.localDescription!,
        isMuted: isMutedRef.current,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error(`Failed to create WebRTC offer to ${targetPeerId}:`, err);
    }
  }, [createPeerConnection, roomId, sendSignal]);

  // Handle incoming signaling messages
  const handleSignal = useCallback(async (payload: VoiceSignalPayload) => {
    if (!payload || payload.from === userRef.current.id) return;

    // Filter signals not meant for us (unless room broadcast like voice_join or voice_leave)
    if (payload.to && payload.to !== userRef.current.id) return;

    const senderId = payload.from;

    switch (payload.type) {
      case "voice_join": {
        // Peer announced they joined voice
        // Find peer profile in onlineMembers or fallback
        const peerMember = onlineMembers.find((m) => m.id === senderId || m.user.id === senderId);
        const peerName = peerMember?.user.name || `User ${senderId.slice(0, 4)}`;
        const peerAvatar = peerMember?.user.avatar || "👤";
        const peerColor = peerMember?.user.color || "from-purple-600 to-indigo-600";

        setVoiceParticipants((prev) => {
          if (prev.some((p) => p.userId === senderId)) return prev;
          return [
            ...prev,
            {
              userId: senderId,
              userName: peerName,
              avatar: peerAvatar,
              color: peerColor,
              isMuted: !!payload.isMuted,
              isSpeaking: false,
              joinedAt: Date.now(),
            },
          ];
        });

        // If we are currently connected to voice, initiate WebRTC offer to the newly joined peer
        if (statusRef.current === "connected" && localStreamRef.current) {
          await initiateOffer(senderId);
        }
        break;
      }

      case "offer": {
        if (!payload.sdp || statusRef.current !== "connected") return;

        try {
          const pc = createPeerConnection(senderId);
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // Flush any pending candidates for this peer
          flushCandidates(senderId);

          await sendSignal({
            type: "answer",
            from: userRef.current.id,
            to: senderId,
            roomId,
            sdp: pc.localDescription!,
            isMuted: isMutedRef.current,
            timestamp: Date.now(),
          });

          // Ensure participant exists in list
          const peerMember = onlineMembers.find((m) => m.id === senderId || m.user.id === senderId);
          setVoiceParticipants((prev) => {
            if (prev.some((p) => p.userId === senderId)) return prev;
            return [
              ...prev,
              {
                userId: senderId,
                userName: peerMember?.user.name || `User ${senderId.slice(0, 4)}`,
                avatar: peerMember?.user.avatar || "👤",
                color: peerMember?.user.color || "from-purple-600 to-indigo-600",
                isMuted: !!payload.isMuted,
                isSpeaking: false,
                joinedAt: Date.now(),
              },
            ];
          });
        } catch (err) {
          console.error(`Failed to handle WebRTC offer from ${senderId}:`, err);
        }
        break;
      }

      case "answer": {
        if (!payload.sdp) return;
        try {
          const pc = peerConnectionsRef.current.get(senderId);
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            flushCandidates(senderId);
          }
        } catch (err) {
          console.error(`Failed to handle WebRTC answer from ${senderId}:`, err);
        }
        break;
      }

      case "candidates": {
        if (!payload.candidates || payload.candidates.length === 0) return;
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          for (const cand of payload.candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.warn("Failed to add ICE candidate:", err);
            }
          }
        }
        break;
      }

      case "voice_state": {
        setVoiceParticipants((prev) =>
          prev.map((p) => {
            if (p.userId !== senderId) return p;
            return {
              ...p,
              isMuted: payload.isMuted !== undefined ? payload.isMuted : p.isMuted,
              isSpeaking: payload.isSpeaking !== undefined ? payload.isSpeaking : p.isSpeaking,
            };
          })
        );
        break;
      }

      case "voice_leave": {
        closePeer(senderId);
        break;
      }
    }
  }, [onlineMembers, statusRef, initiateOffer, createPeerConnection, flushCandidates, sendSignal, roomId, closePeer]);

  // Setup channel listeners on mount
  useEffect(() => {
    isMountedRef.current = true;
    refreshDevices();

    const client = getSupabaseClient();
    const hasSupabase = isSupabaseConfigured() && client !== null;

    if (hasSupabase && client) {
      const channelName = `room:${roomId}`;
      const channel = client.channel(channelName);
      supabaseChannelRef.current = channel;

      channel.on("broadcast", { event: "voice_signal" }, ({ payload }) => {
        if (payload) handleSignal(payload as VoiceSignalPayload);
      });
    } else {
      const channelName = `stream_watchparty_${roomId}`;
      try {
        const bc = new BroadcastChannel(channelName);
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === "voice_signal" && payload) {
            handleSignal(payload as VoiceSignalPayload);
          }
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      isMountedRef.current = false;
      supabaseChannelRef.current = null;
      broadcastChannelRef.current?.close();
    };
  }, [roomId, handleSignal, refreshDevices]);

  // Audio level monitoring for active speaking detection
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSpeaking = false;
      let throttleTimestamp = 0;

      const checkVolume = () => {
        if (!isMountedRef.current || !analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for human voice in quiet/ambient room
        const speakingNow = !isMutedRef.current && average > 20;

        if (speakingNow !== lastSpeaking) {
          lastSpeaking = speakingNow;
          setIsSpeaking(speakingNow);

          const now = Date.now();
          if (now - throttleTimestamp > 400) {
            throttleTimestamp = now;
            sendSignal({
              type: "voice_state",
              from: userRef.current.id,
              roomId,
              isSpeaking: speakingNow,
              isMuted: isMutedRef.current,
              timestamp: now,
            });
          }
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn("AudioContext monitoring not available:", e);
    }
  }, [roomId, sendSignal]);

  // Stop audio monitoring
  const stopAudioMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Join Voice Action
  const joinVoice = async () => {
    if (status === "connecting" || status === "connected") return;

    setStatus("connecting");
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice chat is not supported on this browser.");
      }

      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? {
              deviceId: { exact: selectedDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Start audio volume analysis
      startAudioMonitoring(stream);

      setStatus("connected");
      setIsMuted(false);

      // Add self to voice participants
      const selfParticipant: VoiceParticipant = {
        userId: user.id,
        userName: user.name,
        avatar: user.avatar,
        color: user.color,
        isMuted: false,
        isSpeaking: false,
        joinedAt: Date.now(),
      };
      setVoiceParticipants((prev) => {
        const filtered = prev.filter((p) => p.userId !== user.id);
        return [...filtered, selfParticipant];
      });

      // Announce voice join to entire room
      await sendSignal({
        type: "voice_join",
        from: user.id,
        roomId,
        isMuted: false,
        timestamp: Date.now(),
      });

      // Refresh devices list now that permission is granted
      refreshDevices();
    } catch (err: unknown) {
      console.error("Failed to join voice chat:", err);
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isDenied) {
        setStatus("permission_denied");
        setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser.");
      } else {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Failed to access microphone.");
      }
    }
  };

  // Leave Voice Action
  const leaveVoice = useCallback(async () => {
    stopAudioMonitoring();

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Remove remote audio elements
    remoteAudioElementsRef.current.forEach((el) => {
      el.pause();
      el.srcObject = null;
      el.remove();
    });
    remoteAudioElementsRef.current.clear();

    // Clear candidate timers
    candidateTimersRef.current.forEach((t) => clearTimeout(t));
    candidateTimersRef.current.clear();
    pendingCandidatesRef.current.clear();

    // Announce departure
    sendSignal({
      type: "voice_leave",
      from: userRef.current.id,
      roomId,
      timestamp: Date.now(),
    });

    setStatus("disconnected");
    setIsMuted(false);
    setIsSpeaking(false);
    setVoiceParticipants([]);
  }, [stopAudioMonitoring, sendSignal, roomId]);

  // Toggle Mute Action
  const toggleMute = () => {
    if (status !== "connected") return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // Update self in participant list
    setVoiceParticipants((prev) =>
      prev.map((p) => (p.userId === user.id ? { ...p, isMuted: nextMuted } : p))
    );

    // Broadcast mute state change
    sendSignal({
      type: "voice_state",
      from: user.id,
      roomId,
      isMuted: nextMuted,
      timestamp: Date.now(),
    });
  };

  // Select different input microphone
  const changeInputDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (status === "connected" && localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        // Replace tracks in active peer connections
        const newTrack = stream.getAudioTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
          if (sender && newTrack) {
            sender.replaceTrack(newTrack);
          }
        });

        // Stop old stream tracks
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = stream;
        newTrack.enabled = !isMuted;

        stopAudioMonitoring();
        startAudioMonitoring(stream);
      } catch (err) {
        console.error("Failed to switch audio input device:", err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusRef.current === "connected") {
        leaveVoice();
      }
    };
  }, [leaveVoice]);

  return {
    status,
    isMuted,
    isSpeaking,
    voiceParticipants,
    availableAudioDevices,
    selectedDeviceId,
    errorMessage,
    joinVoice,
    leaveVoice,
    toggleMute,
    changeInputDevice,
  };
}
