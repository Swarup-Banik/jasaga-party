"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  ChatMessage,
  ReactionBurst,
  PresenceUser,
  UserProfile,
  MediaSyncPayload,
  MessageReplyReference,
  TypingUser,
} from "@/types/chat";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

interface UseSupabaseChatProps {
  roomId: string;
  user: UserProfile;
}

export function useSupabaseChat({ roomId, user }: UseSupabaseChatProps) {
  // Initialize messages from sessionStorage to retain chat history & reactions across renders/refreshes
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(`jasaga_chat_messages_${roomId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Ignore sessionStorage read errors
      }
    }
    return [];
  });

  const [onlineMembers, setOnlineMembers] = useState<PresenceUser[]>([]);
  const [reactions, setReactions] = useState<ReactionBurst[]>([]);
  const [controller, setController] = useState<UserProfile | null>(null);
  const [currentMedia, setCurrentMedia] = useState<{ url: string; title: string } | null>(null);
  const [isUsingSupabase, setIsUsingSupabase] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "fallback">("connecting");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isMountedRef = useRef(true);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Persist messages & reactions to sessionStorage so page refreshes or re-renders don't lose reactions
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        sessionStorage.setItem(`jasaga_chat_messages_${roomId}`, JSON.stringify(messages.slice(-50)));
      } catch {
        // Ignore sessionStorage quota / privacy errors
      }
    }
  }, [messages, roomId]);

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
    setTimeout(() => {
      if (isMountedRef.current) {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }
    }, 2500);
  }, []);

  // Helper to apply message reaction idempotently with explicit action to prevent double-toggle on echo
  const applyReaction = useCallback(
    (messageId: string, emoji: string, userId: string, action?: "add" | "remove") => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          const currentReactions: Record<string, string[]> = {};
          if (msg.reactions) {
            for (const [k, v] of Object.entries(msg.reactions)) {
              if (Array.isArray(v)) {
                currentReactions[k] = [...v];
              } else if (typeof v === "number") {
                currentReactions[k] = [];
              }
            }
          }

          const userList = currentReactions[emoji] || [];
          const hasReacted = userList.includes(userId);

          // If explicit action is given ("add" or "remove"), enforce it idempotently
          const shouldAdd = action ? action === "add" : !hasReacted;

          if (shouldAdd) {
            if (!hasReacted) {
              currentReactions[emoji] = [...userList, userId];
            }
          } else {
            if (hasReacted) {
              const filtered = userList.filter((id) => id !== userId);
              if (filtered.length === 0) {
                delete currentReactions[emoji];
              } else {
                currentReactions[emoji] = filtered;
              }
            }
          }

          return { ...msg, reactions: currentReactions };
        })
      );
    },
    []
  );

  // Helper to edit message locally
  const applyEdit = useCallback((messageId: string, newContent: string, senderId?: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        if (senderId && msg.sender.id !== senderId) return msg;
        return { ...msg, content: newContent, isEdited: true };
      })
    );
  }, []);

  // Helper to delete message locally
  const applyDelete = useCallback((messageId: string, senderId?: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        if (senderId && msg.sender.id !== senderId) return msg;
        return { ...msg, isDeleted: true, content: "" };
      })
    );
  }, []);

  // Helper to update typing users
  const applyTyping = useCallback((userId: string, userName: string, isTyping: boolean) => {
    if (userId === userRef.current.id) return;
    setTypingUsers((prev) => {
      if (!isTyping) {
        return prev.filter((u) => u.id !== userId);
      }
      const filtered = prev.filter((u) => u.id !== userId);
      return [...filtered, { id: userId, name: userName, timestamp: Date.now() }];
    });
  }, []);

  // Prune typing users after 3 seconds of inactivity
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const active = prev.filter((u) => now - u.timestamp < 3000);
        return active.length === prev.length ? prev : active;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const client = getSupabaseClient();
    const hasSupabase = isSupabaseConfigured() && client !== null;
    setIsUsingSupabase(hasSupabase);

    // Initial system greeting (only if room message feed is empty)
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
        .on("broadcast", { event: "message_reaction" }, ({ payload }) => {
          if (payload) {
            const { messageId, emoji, userId, action } = payload as {
              messageId: string;
              emoji: string;
              userId: string;
              action?: "add" | "remove";
            };
            applyReaction(messageId, emoji, userId, action);
          }
        })
        .on("broadcast", { event: "edit_message" }, ({ payload }) => {
          if (payload) {
            const { messageId, newContent, userId } = payload as {
              messageId: string;
              newContent: string;
              userId: string;
            };
            applyEdit(messageId, newContent, userId);
          }
        })
        .on("broadcast", { event: "delete_message" }, ({ payload }) => {
          if (payload) {
            const { messageId, userId } = payload as {
              messageId: string;
              userId: string;
            };
            applyDelete(messageId, userId);
          }
        })
        .on("broadcast", { event: "typing_indicator" }, ({ payload }) => {
          if (payload) {
            const { userId, userName, isTyping } = payload as {
              userId: string;
              userName: string;
              isTyping: boolean;
            };
            applyTyping(userId, userName, isTyping);
          }
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
          } else if (type === "message_reaction" && payload) {
            applyReaction(payload.messageId, payload.emoji, payload.userId, payload.action);
          } else if (type === "edit_message" && payload) {
            applyEdit(payload.messageId, payload.newContent, payload.userId);
          } else if (type === "delete_message" && payload) {
            applyDelete(payload.messageId, payload.userId);
          } else if (type === "typing_indicator" && payload) {
            applyTyping(payload.userId, payload.userName, payload.isTyping);
          } else if (type === "change_control") {
            setController(payload?.user || null);
          } else if (type === "sync_media" && payload) {
            setCurrentMedia({ url: payload.url, title: payload.title });
          } else if (type === "presence_announce" && payload) {
            setOnlineMembers((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
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

        const selfMember: PresenceUser = {
          id: user.id,
          user,
          onlineAt: new Date().toISOString(),
        };
        setOnlineMembers([selfMember]);

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
    // Intentionally track user.id rather than full user object reference to avoid re-subscribing on re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user.id, addMessageSafe, triggerReactionSafe, applyReaction, applyEdit, applyDelete, applyTyping]);

  // Send message method (supports optional replyTo)
  const sendMessage = async (content: string, replyTo?: MessageReplyReference) => {
    if (!content.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      roomId,
      sender: user,
      content: content.trim(),
      timestamp: Date.now(),
      type: "message",
      replyTo: replyTo || undefined,
      reactions: {},
    };

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

  // Toggle message reaction with explicit action to prevent double-toggle on echo
  const reactToMessage = async (messageId: string, emoji: string) => {
    // 1. Determine explicit action based on current state
    let action: "add" | "remove" = "add";
    const target = messages.find((m) => m.id === messageId);
    if (target?.reactions && target.reactions[emoji]) {
      const currentVal = target.reactions[emoji];
      if (Array.isArray(currentVal) && currentVal.includes(user.id)) {
        action = "remove";
      }
    }

    // 2. Optimistically apply explicit reaction
    applyReaction(messageId, emoji, user.id, action);

    // 3. Broadcast explicit action
    const payload = { messageId, emoji, userId: user.id, action };
    try {
      if (isUsingSupabase && supabaseChannelRef.current) {
        const sendResult = await supabaseChannelRef.current.send({
          type: "broadcast",
          event: "message_reaction",
          payload,
        });
        if (sendResult !== "ok") {
          console.warn("Supabase reaction send status:", sendResult);
        }
      } else {
        broadcastChannelRef.current?.postMessage({
          type: "message_reaction",
          payload,
        });
      }
    } catch (err) {
      console.error("Failed to broadcast reaction:", err);
      // Rollback optimistic reaction on failure
      const rollbackAction = action === "add" ? "remove" : "add";
      applyReaction(messageId, emoji, user.id, rollbackAction);
    }
  };

  // Edit message content
  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    applyEdit(messageId, newContent.trim(), user.id);

    const payload = { messageId, newContent: newContent.trim(), userId: user.id };
    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "edit_message",
        payload,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "edit_message",
        payload,
      });
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    applyDelete(messageId, user.id);

    const payload = { messageId, userId: user.id };
    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "delete_message",
        payload,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "delete_message",
        payload,
      });
    }
  };

  // Emit typing indicator
  const setTyping = async (isTyping: boolean) => {
    const payload = { userId: user.id, userName: user.name, isTyping };
    if (isUsingSupabase && supabaseChannelRef.current) {
      await supabaseChannelRef.current.send({
        type: "broadcast",
        event: "typing_indicator",
        payload,
      });
    } else {
      broadcastChannelRef.current?.postMessage({
        type: "typing_indicator",
        payload,
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
    typingUsers,
    sendMessage,
    reactToMessage,
    editMessage,
    deleteMessage,
    setTyping,
    sendReaction,
    toggleControl,
    syncMedia,
  };
}
