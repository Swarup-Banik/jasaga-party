"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  NetflixPlaybackEvent,
  NetflixSyncRole,
  NetflixEventType,
  NetflixExtensionStatus,
  NetflixDriftMetrics,
  NetflixRoomParticipant,
  NetflixResyncRequest,
  NetflixRoomState,
} from "@/types/netflix";
import {
  generatePairingSession,
  validateIncomingPlaybackEvent,
  applyPlaybackEvent,
  calculateDrift,
  calculateExpectedPlaybackPosition,
  recordSeenEventId,
} from "@/lib/netflixSyncEngine";
import { UserProfile, ChatMessage } from "@/types/chat";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface UseNetflixSyncProps {
  roomId: string;
  user: UserProfile;
  initialRole?: NetflixSyncRole;
}

export function useNetflixSync({ roomId, user, initialRole = "guest" }: UseNetflixSyncProps) {
  // Role & Authority
  const [role, setRole] = useState<NetflixSyncRole>(initialRole);
  const isHost = role === "host";
  const [isHostOnline, setIsHostOnline] = useState<boolean>(true);

  // Extension status
  const [extensionStatus, setExtensionStatus] = useState<NetflixExtensionStatus>({
    installed: false,
    paired: false,
    netflixTab: { found: false, isWatch: false },
  });

  // Authoritative Room Playback State
  const [roomPlaybackState, setRoomPlaybackState] = useState<NetflixRoomState>({
    roomId,
    hostId: isHost ? user.id : "",
    hostName: isHost ? user.name : "Host",
    isPlaying: false,
    position: 0,
    mediaId: "",
    lastUpdated: Date.now(),
    sequence: 0,
  });

  // Drift Analysis (Calculated, with anti-stutter cooldown protection)
  const [driftMetrics, setDriftMetrics] = useState<NetflixDriftMetrics>({
    localGuestPosition: 0,
    estimatedHostPosition: 0,
    driftSeconds: 0,
    signedDriftSeconds: 0,
    latencyMs: 0,
    inSync: true,
    needsMinorNudge: false,
    needsSeekCorrection: false,
  });

  // Realtime Chat, Participants & Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<NetflixRoomParticipant[]>([]);
  const [eventLog, setEventLog] = useState<NetflixPlaybackEvent[]>([]);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; senderName: string; timestamp: number }[]>([]);

  // Refs for tracking state and duplicate cache across hook updates
  const sequenceRef = useRef<number>(0);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const localPlayerStateRef = useRef<NetflixExtensionStatus["netflixTab"]["playerState"]>(null);
  const isMountedRef = useRef<boolean>(true);
  const roomPlaybackStateRef = useRef<NetflixRoomState>(roomPlaybackState);
  roomPlaybackStateRef.current = roomPlaybackState;
  const broadcastAuthoritativeEventRef = useRef<((eventType: NetflixEventType, position: number, mediaId: string) => void) | null>(null);

  // Helper to send message to extension via jasaga-bridge.js
  const sendToExtension = useCallback((action: string, payload?: unknown): Promise<unknown> => {
    return new Promise((resolve) => {
      const requestId = `jasaga_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        resolve({ error: "Extension response timeout" });
      }, 3000);

      const handler = (event: MessageEvent) => {
        if (
          event.source === window &&
          event.data &&
          event.data.source === "JASAGA_EXT_BRIDGE" &&
          event.data.requestId === requestId
        ) {
          clearTimeout(timeout);
          window.removeEventListener("message", handler);
          resolve(event.data.data);
        }
      };

      window.addEventListener("message", handler);
      window.postMessage(
        {
          target: "JASAGA_EXT_BRIDGE",
          action,
          payload,
          requestId,
        },
        window.location.origin
      );
    });
  }, []);

  // 1. Initial Extension Discovery & Short-Lived Room Pairing
  useEffect(() => {
    isMountedRef.current = true;

    async function checkAndPairExtension() {
      const hasDomTag = typeof document !== "undefined" && !!document.documentElement.dataset.jasagaNetflixExt;
      const pingRes = (await sendToExtension("PING")) as { installed?: boolean; version?: string } | null;

      const isInstalled = hasDomTag || (pingRes && pingRes.installed === true);

      if (isInstalled) {
        // Query full status
        const statusRes = (await sendToExtension("GET_STATUS")) as {
          extensionVersion?: string;
          netflixTab?: NetflixExtensionStatus["netflixTab"];
        } | null;

        // Generate short-lived pairing session token (15-min expiry)
        const pairingSession = generatePairingSession(roomId, role, user.id);
        await sendToExtension("PAIR_ROOM", pairingSession);

        if (isMountedRef.current) {
          setExtensionStatus({
            installed: true,
            version: statusRes?.extensionVersion || "1.0.0",
            paired: true,
            pairedRoomId: roomId,
            pairedRole: role,
            netflixTab: statusRes?.netflixTab || { found: false, isWatch: false },
          });
        }
      } else {
        if (isMountedRef.current) {
          setExtensionStatus((prev) => ({ ...prev, installed: false }));
        }
      }
    }

    checkAndPairExtension();

    // Listen for incoming extension telemetry pushes
    const handleExtensionPush = (event: MessageEvent) => {
      if (event.source !== window || !event.data || event.data.source !== "JASAGA_EXT_BRIDGE") return;

      const { action, data } = event.data;

      // 1. Discrete User Actions (Debounced & Loop-Protected)
      if (action === "NETFLIX_ACTION_PUSH" && data) {
        // Prevent circular feedback loops: ignore programmatic actions dispatched by extension
        if (data.isProgrammatic) {
          return;
        }

        if (role === "host") {
          const actionType = data.action;
          const currentMedia = data.episodeId || roomPlaybackStateRef.current.mediaId || "unknown";
          const currentPos = typeof data.currentTimeSec === "number" ? data.currentTimeSec : 0;

          if (actionType === "USER_PLAY") {
            if (!roomPlaybackStateRef.current.isPlaying) {
              broadcastAuthoritativeEventRef.current?.("PLAY", currentPos, currentMedia);
            }
          } else if (actionType === "USER_PAUSE") {
            if (roomPlaybackStateRef.current.isPlaying) {
              broadcastAuthoritativeEventRef.current?.("PAUSE", currentPos, currentMedia);
            }
          } else if (actionType === "SEEK_COMMITTED") {
            broadcastAuthoritativeEventRef.current?.("SEEK", currentPos, currentMedia);
          } else if (actionType === "EPISODE_NAVIGATED") {
            if (data.episodeId && data.episodeId !== roomPlaybackStateRef.current.mediaId) {
              broadcastAuthoritativeEventRef.current?.("EPISODE_CHANGE", 0, data.episodeId);
            }
          }
        }
      } else if (action === "NETFLIX_TELEMETRY_PUSH" && data) {
        localPlayerStateRef.current = data;
        setExtensionStatus((prev) => ({
          ...prev,
          netflixTab: {
            ...prev.netflixTab,
            found: true,
            isWatch: true,
            playerState: data,
          },
        }));

        // If host, check if episode transition occurred in background telemetry
        if (role === "host") {
          if (data.episodeId && data.episodeId !== roomPlaybackStateRef.current.mediaId) {
            broadcastAuthoritativeEventRef.current?.("EPISODE_CHANGE", data.currentTimeSec || 0, data.episodeId);
          }
        }
      } else if (action === "NETFLIX_STATUS_CHANGE" && data) {
        setExtensionStatus((prev) => ({
          ...prev,
          netflixTab: {
            ...prev.netflixTab,
            found: true,
            url: data.netflixUrl,
            isWatch: data.isWatch,
          },
        }));
      } else if (action === "NETFLIX_TAB_CLOSED") {
        setExtensionStatus((prev) => ({
          ...prev,
          netflixTab: { found: false, isWatch: false, playerState: null },
        }));
      }
    };

    window.addEventListener("message", handleExtensionPush);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("message", handleExtensionPush);
      sendToExtension("UNPAIR_ROOM").catch(() => {});
    };
  }, [roomId, role, user.id, sendToExtension]);

  // 2. Authoritative Event Broadcast (Host Only)
  const broadcastAuthoritativeEvent = useCallback(
    (eventType: NetflixEventType, position: number, mediaId: string) => {
      if (role !== "host") {
        console.warn(`[NetflixSync] Non-host attempted to broadcast authoritative event: ${eventType}`);
        return;
      }

      sequenceRef.current += 1;
      const event: NetflixPlaybackEvent = {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        roomId,
        senderId: user.id,
        senderRole: "host",
        role: "host",
        eventType,
        type: eventType,
        mediaId: mediaId || roomPlaybackStateRef.current.mediaId || "unknown",
        position: Math.round(position * 100) / 100,
        timestamp: Date.now(),
        sequence: sequenceRef.current,
        playbackRate: 1.0,
      };

      // Add to seen cache to avoid self-echo re-processing (bounded LRU)
      recordSeenEventId(seenEventIdsRef.current, event.eventId);

      // Apply locally to room state
      const newState = applyPlaybackEvent(roomPlaybackStateRef.current, event);
      setRoomPlaybackState(newState);

      // Log event
      setEventLog((prev) => [event, ...prev.slice(0, 49)]);

      // Broadcast over Supabase Realtime
      if (supabaseChannelRef.current) {
        supabaseChannelRef.current.send({
          type: "broadcast",
          event: "netflix_playback_event",
          payload: event,
        });
      }
    },
    [roomId, role, user.id]
  );
  broadcastAuthoritativeEventRef.current = broadcastAuthoritativeEvent;

  // 3. Supabase Realtime Channel Subscription & Validation Layer
  useEffect(() => {
    const client = getSupabaseClient();
    if (!isSupabaseConfigured() || !client) return;

    const channelName = `netflix-room:${roomId}`;
    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: user.id },
      },
    });

    supabaseChannelRef.current = channel;

    // Process incoming broadcast events through strict validation engine
    channel.on("broadcast", { event: "netflix_playback_event" }, ({ payload }) => {
      if (!payload) return;
      const event = payload as NetflixPlaybackEvent;

      // Validate through pure validation engine
      const validation = validateIncomingPlaybackEvent(
        event,
        roomPlaybackStateRef.current,
        seenEventIdsRef.current
      );

      if (!validation.valid) {
        console.warn(`[NetflixSync] Rejected event #${event.sequence} (${event.type || event.eventType}): ${validation.status} - ${validation.reason}`);
        return;
      }

      // Mark eventId as seen in bounded cache
      recordSeenEventId(seenEventIdsRef.current, event.eventId);

      // Log event
      setEventLog((prev) => [event, ...prev.slice(0, 49)]);

      // Apply event to state
      const updatedState = applyPlaybackEvent(roomPlaybackStateRef.current, event);
      setRoomPlaybackState(updatedState);

      // If GUEST: Command local extension to match host playback state
      if (role === "guest") {
        const evType = event.type || event.eventType;
        const now = Date.now();
        const targetPos = calculateExpectedPlaybackPosition(event, now);

        if (evType === "EPISODE_CHANGE") {
          const currentGuestEpisode = localPlayerStateRef.current?.episodeId;
          if (event.mediaId && event.mediaId !== currentGuestEpisode) {
            sendToExtension("NAVIGATE_TO_EPISODE", { mediaId: event.mediaId });
          }
        } else if (evType === "PLAY") {
          const currentPos = localPlayerStateRef.current?.currentTimeSec || 0;
          if (Math.abs(currentPos - targetPos) > 1.5) {
            sendToExtension("EXECUTE_COMMAND", { command: "SEEK", args: { targetSeconds: targetPos } });
          }
          sendToExtension("EXECUTE_COMMAND", { command: "PLAY" });
        } else if (evType === "PAUSE") {
          sendToExtension("EXECUTE_COMMAND", { command: "PAUSE" });
          sendToExtension("EXECUTE_COMMAND", {
            command: "SEEK",
            args: { targetSeconds: typeof event.position === "number" ? event.position : targetPos },
          });
        } else if (evType === "SEEK" || evType === "RESYNC" || evType === "INITIAL_SYNC") {
          sendToExtension("EXECUTE_COMMAND", {
            command: "SEEK",
            args: { targetSeconds: targetPos },
          });
          if (roomPlaybackStateRef.current.isPlaying) {
            sendToExtension("EXECUTE_COMMAND", { command: "PLAY" });
          } else {
            sendToExtension("EXECUTE_COMMAND", { command: "PAUSE" });
          }
        }
      }
    });

    // Handle guest resync requests
    channel.on("broadcast", { event: "netflix_resync_request" }, ({ payload }) => {
      if (!payload) return;
      // Only authoritative host responds to resync requests
      if (role === "host") {
        const currentPos = localPlayerStateRef.current?.currentTimeSec || roomPlaybackStateRef.current.position;
        const currentMedia = localPlayerStateRef.current?.episodeId || roomPlaybackStateRef.current.mediaId;
        broadcastAuthoritativeEventRef.current?.("RESYNC", currentPos, currentMedia);
      }
    });

    // Handle Room Chat
    channel.on("broadcast", { event: "netflix_chat_message" }, ({ payload }) => {
      if (payload) {
        setMessages((prev) => [...prev, payload as ChatMessage]);
      }
    });

    // Handle Floating Reactions
    channel.on("broadcast", { event: "netflix_reaction" }, ({ payload }) => {
      if (payload) {
        setReactions((prev) => [...prev.slice(-15), payload]);
      }
    });

    // Handle Presence Tracking & Host Online Detection
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const members: NetflixRoomParticipant[] = [];
      Object.entries(state).forEach(([, presences]) => {
        const first = (presences as unknown as NetflixRoomParticipant[])[0];
        if (first && first.user) {
          members.push(first);
        }
      });
      setParticipants(members);

      // Verify whether the authoritative host is active in the room
      const hostFound = members.some(
        (m) => m.role === "host" || (roomPlaybackStateRef.current.hostId && m.user?.id === roomPlaybackStateRef.current.hostId)
      );
      setIsHostOnline(role === "host" ? true : hostFound);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user,
          role,
          onlineAt: new Date().toISOString(),
          isWatchingOnNetflix: extensionStatus.netflixTab.isWatch,
        });

        // If guest just joined or reconnected, request state from host (Late Join / Reconnect Handling)
        if (role === "guest") {
          channel.send({
            type: "broadcast",
            event: "netflix_resync_request",
            payload: {
              requestId: `req_${Date.now()}`,
              roomId,
              guestId: user.id,
              guestPosition: localPlayerStateRef.current?.currentTimeSec || 0,
              timestamp: Date.now(),
            } as NetflixResyncRequest,
          });
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, role, user, sendToExtension, extensionStatus.netflixTab.isWatch]);

  // 4. Periodic Lightweight Heartbeat (Host only, every 5s if playing, 10s if paused — Discrete signals)
  useEffect(() => {
    if (role !== "host") return;

    const interval = setInterval(() => {
      const isPlaying = localPlayerStateRef.current?.isPlaying ?? roomPlaybackStateRef.current.isPlaying;
      const pos = localPlayerStateRef.current?.currentTimeSec ?? roomPlaybackStateRef.current.position;
      const media = localPlayerStateRef.current?.episodeId ?? roomPlaybackStateRef.current.mediaId;

      broadcastAuthoritativeEventRef.current?.("HEARTBEAT", pos, media);
    }, 5000);

    return () => clearInterval(interval);
  }, [role]);

  // 5. Drift Model: Calculates drift with cooldown protection (Guest only)
  const lastDriftCorrectionRef = useRef<number>(0);

  useEffect(() => {
    if (role === "host") return;

    const driftInterval = setInterval(() => {
      const guestPos = localPlayerStateRef.current?.currentTimeSec || 0;
      const metrics = calculateDrift(guestPos, roomPlaybackStateRef.current);
      setDriftMetrics(metrics);

      // Auto-correct if large drift (>= 2.5s) and not in cooldown (min 5 seconds)
      if (metrics.needsSeekCorrection && roomPlaybackStateRef.current.isPlaying) {
        const now = Date.now();
        if (now - lastDriftCorrectionRef.current > 5000) {
          lastDriftCorrectionRef.current = now;
          sendToExtension("EXECUTE_COMMAND", {
            command: "SEEK",
            args: { targetSeconds: metrics.estimatedHostPosition },
          });
        }
      }
    }, 1500);

    return () => clearInterval(driftInterval);
  }, [role, sendToExtension]);

  // Command dispatchers for UI
  const triggerPlay = () => {
    const pos = localPlayerStateRef.current?.currentTimeSec || roomPlaybackStateRef.current.position;
    const media = localPlayerStateRef.current?.episodeId || roomPlaybackStateRef.current.mediaId;
    if (isHost) {
      broadcastAuthoritativeEvent("PLAY", pos, media);
      sendToExtension("EXECUTE_COMMAND", { command: "PLAY" });
    } else {
      // Guest local interaction does not change room state; restores to host
      requestResync();
    }
  };

  const triggerPause = () => {
    const pos = localPlayerStateRef.current?.currentTimeSec || roomPlaybackStateRef.current.position;
    const media = localPlayerStateRef.current?.episodeId || roomPlaybackStateRef.current.mediaId;
    if (isHost) {
      broadcastAuthoritativeEvent("PAUSE", pos, media);
      sendToExtension("EXECUTE_COMMAND", { command: "PAUSE" });
    } else {
      // Guest local interaction does not change room state; restores to host
      requestResync();
    }
  };

  const triggerSeek = (targetSeconds: number) => {
    const media = localPlayerStateRef.current?.episodeId || roomPlaybackStateRef.current.mediaId;
    if (isHost) {
      broadcastAuthoritativeEvent("SEEK", targetSeconds, media);
      sendToExtension("EXECUTE_COMMAND", { command: "SEEK", args: { targetSeconds } });
    } else {
      // Guest local interaction does not change room state; restores to host
      requestResync();
    }
  };

  const requestResync = () => {
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: "broadcast",
        event: "netflix_resync_request",
        payload: {
          requestId: `resync_${Date.now()}`,
          roomId,
          guestId: user.id,
          guestPosition: localPlayerStateRef.current?.currentTimeSec || 0,
          timestamp: Date.now(),
        } as NetflixResyncRequest,
      });
    }
  };

  const sendChatMessage = (text: string) => {
    const msg: ChatMessage = {
      id: `nf_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      sender: user,
      content: text,
      timestamp: Date.now(),
      type: "message",
    };

    setMessages((prev) => [...prev, msg]);

    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: "broadcast",
        event: "netflix_chat_message",
        payload: msg,
      });
    }
  };

  const sendReaction = (emoji: string) => {
    const rx = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      senderName: user.name,
      timestamp: Date.now(),
    };

    setReactions((prev) => [...prev.slice(-15), rx]);

    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: "broadcast",
        event: "netflix_reaction",
        payload: rx,
      });
    }
  };

  return {
    role,
    isHost,
    isHostOnline,
    setRole,
    extensionStatus,
    roomPlaybackState,
    driftMetrics,
    messages,
    participants,
    reactions,
    eventLog,
    triggerPlay,
    triggerPause,
    triggerSeek,
    requestResync,
    sendChatMessage,
    sendReaction,
  };
}
