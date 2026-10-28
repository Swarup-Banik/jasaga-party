"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { ChatMessage, UserProfile, MessageReplyReference, TypingUser } from "@/types/chat";
import { VoiceParticipant } from "@/types/voice";
import { ChatMessageItem } from "./ChatMessageItem";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
  typingUsers?: TypingUser[];
  voiceParticipants?: VoiceParticipant[];
  onReact: (messageId: string, emoji: string) => void;
  onStartReply: (replyRef: MessageReplyReference) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUser,
  typingUsers = [],
  voiceParticipants = [],
  onReact,
  onStartReply,
  onEditMessage,
  onDeleteMessage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLengthRef = useRef(messages.length);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
      setIsAtBottom(true);
      setUnreadCount(0);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 60;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  // Track unread messages and auto-scroll when at bottom
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isAtBottom) {
      scrollToBottom("smooth");
    } else if (isNewMessage) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages, isAtBottom]);

  // Initial instant scroll to bottom
  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  return (
    <div className="relative flex-1 w-full overflow-hidden flex flex-col min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-8">
            <span className="text-2xl mb-2">💬</span>
            <p>No messages yet.</p>
            <p className="text-[11px] text-slate-600">Say hi to everyone in the party!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAuthorSpeaking = voiceParticipants.some(
              (p) => p.userId === msg.sender.id && p.isSpeaking
            );

            return (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                currentUser={currentUser}
                isSpeaking={isAuthorSpeaking}
                onReact={onReact}
                onStartReply={onStartReply}
                onEditMessage={onEditMessage}
                onDeleteMessage={onDeleteMessage}
              />
            );
          })
        )}
      </div>

      {/* Typing Indicator Banner */}
      {typingUsers.length > 0 && (
        <div className="px-3 py-1 bg-theater-950/90 border-t border-theater-850 flex items-center gap-1.5 text-[11px] text-purple-300/90 select-none shrink-0">
          <span className="flex gap-0.5 items-center mr-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce [animation-delay:0.4s]" />
          </span>
          <span className="truncate max-w-[220px]">
            {typingUsers.length === 1
              ? `${typingUsers[0].name} is typing...`
              : `${typingUsers.map((u) => u.name).join(", ")} are typing...`}
          </span>
        </div>
      )}

      {/* New messages jump-down pill */}
      {!isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-brand-purple text-white text-xs font-medium shadow-lg hover:bg-brand-violet transition-all flex items-center gap-1.5 border border-purple-400/30 animate-bounce motion-reduce:animate-none z-10"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>{unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? "s" : ""}` : "New messages"}</span>
        </button>
      )}
    </div>
  );
};
