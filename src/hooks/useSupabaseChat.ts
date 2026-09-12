"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ChatMessage, ReactionBurst, PresenceUser, UserProfile, MediaSyncPayload } from "@/types/chat";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface UseSupabaseChatProps {
  roomId: string;
  user: UserProfile;
}

export function useSupabaseChat({ roomId, user }: UseSupabaseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<PresenceUser[]>([]);
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);
  const [controller, setController] = useState<UserProfile | null>(null);
  const [currentMedia, setCurrentMedia] = useState<{ url: string; title: string } | null>(null);
  const [isUsingSupabase, setIsUsingSupabase] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "fallback">("connecting");

  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isMountedRef = useRef(true);

  // Helper to add message avoiding duplicates
  const addMessageSafe = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Helper to trigger reaction burst
  const triggerReactionSafe = useCallback((reaction: ReactionBurst) => {
    setReactions((prev) => [...prev, reaction]);
    // Auto cleanup after 2.5s
    setTimeout(() => {
      if (isMountedRef.current) {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }
    }, 2500);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const client = getSupabaseClient();
    const hasSupabase = isSupabaseConfigured() && client !== null;
    setIsUsingSupabase(hasSupabase);

    // Initial system greeting
    const welcomeMsg: ChatMessage = {
      id: `system-welcome-${roomId}`,
      roomId,
      sender: {
        id: "system",
        name: "Theater Bot",
        avatar: "🎬",
        color: "from-purple-600 to-indigo-600",
      },
      content: `Welcome to watch party room #${roomId}! Grab some popcorn and enjoy the stream.`,
      timestamp: Date.now(),
      type: "system",
    };
    addMessageSafe(welcomeMsg);

    if (hasSupabase && client) {
      // Connect with real Supabase Realtime across all devices
      const channelName = `room:${roomId}`;
      const channel = client.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id },
        },
      });

      supabaseChannelRef.current = channel;

      channel
        .on("broadcast", { event: "chat_message" }, ({ payload }) => {
          if (payload) addMessageSafe(payload as ChatMessage);
        })
        .on("broadcast", { event: "reaction_burst" }, ({ payload }) => {
          if (payload) triggerReactionSafe(payload as ReactionBurst);
        })
        .on("broadcast", { event: "change_control" }, ({ payload }) => {
          if (payload) setController((payload as { user: UserProfile | null }).user);
        })
        .on("broadcast", { event: "sync_media" }, ({ payload }) => {
          if (payload) {
            const media = payload as MediaSyncPayload;
            setCurrentMedia({ url: media.url, title: media.title });
          }
        })
        .on("presence", { event: "sync" }, () => {
          const presenceState = channel.presenceState();
          const members: PresenceUser[] = [];
          Object.entries(presenceState).forEach(([key, presences]) => {
            const first = (presences as unknown as Array<{ user: UserProfile; onlineAt: string }>)[0];
            if (first && first.user) {
              members.push({
                id: key,
                user: first.user,
                onlineAt: first.onlineAt || new Date().toISOString(),
              });
            }
          });
          setOnlineMembers(members);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
            await channel.track({
              user,
              onlineAt: new Date().toISOString(),
            });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Supabase Realtime channel status:", status);
          }
        });

      return () => {
        isMountedRef.current = false;
        supabaseChannelRef.current = null;
        client.removeChannel(channel);
      };
    } else {
      // Browser BroadcastChannel fallback for multi-tab testing
      setConnectionStatus("fallback");
      const channelName = `stream_watchparty_${roomId}`;
      let bc: BroadcastChannel | null = null;

      try {
        bc = new BroadcastChannel(channelName);
        broadcastChannelRef.current = bc;

        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === "chat_message" && payload) {
            addMessageSafe(payload);
          } else if (type === "reaction_burst" && payload) {
            triggerReactionSafe(payload);
          } else if (type === "change_control") {
            setController(payload?.user || null);
          } else if (type === "sync_media" && payload) {
            setCurrentMedia({ url: payload.url, title: payload.title });
          } else if (type === "presence_announce" && payload) {
            setOnlineMembers((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
            // Respond with our presence so new member learns about us
            bc?.postMessage({
              type: "presence_reply",
              payload: {
                id: user.id,
                user,
                onlineAt: new Date().toISOString(),
              },
            });
          } else if (type === "presence_reply" && payload) {
            setOnlineMembers((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
          }
        };

        // Add self to members
        const selfMember: PresenceUser = {
          id: user.id,
          user,
          onlineAt: new Date().toISOString(),
        };
        setOnlineMembers([selfMember]);

        // Announce presence to other tabs
        bc.postMessage({
          type: "presence_announce",
          payload: selfMember,
        });
      } catch (e) {
        console.warn("BroadcastChannel not supported or restricted", e);
      }

      return () => {
        isMountedRef.current = false;
        bc?.close();
      };
    }
  }, [roomId, user, addMessageSafe, triggerReactionSafe]);

  // Send message method
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      roomId,
      sender: user,
      content: content.trim(),
      timestamp: Date.now(),
      type: "message",
    };

    // Optimistically add message locally
    addMessageSafe(newMessage);

    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: newMessage,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "chat_message",
        payload: newMessage,
      });
    }
  };

  // Send reaction burst
  const sendReaction = async (emoji: string) => {
    const burst: ReactionBurst = {
      id: `burst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      emoji,
      senderName: user.name,
      senderColor: user.color,
      xPercent: 10 + Math.random() * 80,
    };

    // Optimistically render reaction locally
    triggerReactionSafe(burst);

    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "reaction_burst",
        payload: burst,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "reaction_burst",
        payload: burst,
      });
    }
  };

  // Request or toggle control
  const toggleControl = async () => {
    const nextController = controller?.id === user.id ? null : user;
    setController(nextController);

    // System message announcing control change
    const actionText = nextController
      ? `${user.name} took control of the virtual browser.`
      : `${user.name} released virtual browser control.`;

    const systemMsg: ChatMessage = {
      id: `sys-ctrl-${Date.now()}`,
      roomId,
      sender: {
        id: "system",
        name: "Theater Bot",
        avatar: "🎮",
        color: "from-emerald-500 to-teal-600",
      },
      content: actionText,
      timestamp: Date.now(),
      type: "action",
    };
    addMessageSafe(systemMsg);

    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "change_control",
        payload: { user: nextController },
      });
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: systemMsg,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "change_control",
        payload: { user: nextController },
      });
      broadcastChannelRef.current?.postMessage({
        type: "chat_message",
        payload: systemMsg,
      });
    }
  };

  // Synchronize media/stream URL across all connected party devices
  const syncMedia = async (url: string, title?: string) => {
    if (!url.trim()) return;

    const mediaTitle = title || url;
    setCurrentMedia({ url, title: mediaTitle });

    const payload: MediaSyncPayload = {
      url,
      title: mediaTitle,
      senderName: user.name,
      timestamp: Date.now(),
    };

    const systemMsg: ChatMessage = {
      id: `sys-media-${Date.now()}`,
      roomId,
      sender: {
        id: "system",
        name: "Theater Bot",
        avatar: "🎬",
        color: "from-purple-600 to-indigo-600",
      },
      content: `Now playing: ${mediaTitle}`,
      timestamp: Date.now(),
      type: "action",
    };
    addMessageSafe(systemMsg);

    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "sync_media",
        payload,
      });
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: systemMsg,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "sync_media",
        payload,
      });
      broadcastChannelRef.current?.postMessage({
        type: "chat_message",
        payload: systemMsg,
      });
    }
  };

  return {
    messages,
    onlineMembers,
    reactions,
    controller,
    currentMedia,
    isUsingSupabase,
    connectionStatus,
    sendMessage,
    sendReaction,
    toggleControl,
    syncMedia,
  };
}
