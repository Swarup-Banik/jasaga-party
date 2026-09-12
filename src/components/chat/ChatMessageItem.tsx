"use client";

import React from "react";
import { ChatMessage, UserProfile } from "@/types/chat";
import { formatTime } from "@/lib/utils";

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUser: UserProfile;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUser,
}) => {
  const isMe = message.sender.id === currentUser.id;
  const isSystem = message.type === "system" || message.sender.id === "system";
  const isAction = message.type === "action";

  // System or action announcement
  if (isSystem || isAction) {
    return (
      <div className="flex items-center justify-center my-2 select-none">
        <div className="px-3 py-1 rounded-full bg-theater-850/70 border border-theater-800 text-[11px] text-slate-400 max-w-[90%] text-center flex items-center gap-1.5 shadow-sm">
          <span>{message.sender.avatar}</span>
          <span className="font-medium text-slate-300">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-2.5 my-2.5 group transition-opacity ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full bg-gradient-to-tr ${message.sender.color} flex items-center justify-center text-xs shrink-0 shadow-md`}
        title={message.sender.name}
      >
        {message.sender.avatar}
      </div>

      {/* Bubble Content */}
      <div
        className={`flex flex-col max-w-[80%] ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Name and time */}
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span
            className={`text-[11px] font-semibold ${
              isMe ? "text-brand-purple" : "text-slate-300"
            }`}
          >
            {isMe ? "You" : message.sender.name}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Message Bubble */}
        <div
          className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
            isMe
              ? "bg-gradient-to-r from-brand-violet to-brand-purple text-white rounded-tr-xs"
              : "bg-theater-850 border border-theater-750 text-slate-200 rounded-tl-xs"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
