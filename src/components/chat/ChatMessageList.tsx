"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { ChatMessage, UserProfile } from "@/types/chat";
import { ChatMessageItem } from "./ChatMessageItem";

interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUser: UserProfile;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  currentUser,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceToBottom < 60);
  };

  // Auto-scroll when new messages arrive if user is already at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isAtBottom]);

  // Initial instant scroll to bottom
  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  return (
    <div className="relative flex-1 w-full overflow-hidden flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-8">
            <span className="text-2xl mb-2">💬</span>
            <p>No messages yet.</p>
            <p className="text-[11px] text-slate-600">Say hi to everyone in the party!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      {/* New messages jump-down pill */}
      {!isAtBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-brand-purple text-white text-xs font-medium shadow-lg hover:bg-brand-violet transition-all flex items-center gap-1.5 border border-purple-400/30 animate-bounce"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>New messages</span>
        </button>
      )}
    </div>
  );
};
