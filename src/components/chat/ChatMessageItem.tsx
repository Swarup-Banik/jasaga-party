"use client";

import React, { useState } from "react";
import { ChatMessage, UserProfile, MessageReplyReference } from "@/types/chat";
import { formatTime } from "@/lib/utils";
import { getEmojiOnlyInfo } from "@/lib/emoji";
import { Reply, Edit2, Trash2, Smile, Check, X } from "lucide-react";

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUser: UserProfile;
  isSpeaking?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onStartReply: (replyRef: MessageReplyReference) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

const COMMON_QUICK_REACTIONS = ["❤️", "🔥", "😂", "👍", "🍿"];

// Helper component for spoiler tags: ||spoiler text||
const SpoilerText: React.FC<{ content: string }> = ({ content }) => {
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});

  // Match ||spoiler|| patterns
  const parts: Array<{ text: string; isSpoiler: boolean; index: number }> = [];
  const regex = /\|\|(.*?)\|\|/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: content.substring(lastIndex, match.index),
        isSpoiler: false,
        index: counter++,
      });
    }
    parts.push({
      text: match[1],
      isSpoiler: true,
      index: counter++,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({
      text: content.substring(lastIndex),
      isSpoiler: false,
      index: counter++,
    });
  }

  if (parts.length === 0) {
    return <span>{content}</span>;
  }

  return (
    <span>
      {parts.map((part) => {
        if (!part.isSpoiler) {
          return <span key={part.index}>{part.text}</span>;
        }

        const isRevealed = revealedIndices[part.index];

        return (
          <span
            key={part.index}
            onClick={() =>
              setRevealedIndices((prev) => ({
                ...prev,
                [part.index]: !isRevealed,
              }))
            }
            title={isRevealed ? "Click to hide spoiler" : "Spoiler! Click to reveal"}
            className={`inline-block mx-0.5 px-1.5 py-0.2 rounded text-[11px] font-medium cursor-pointer transition-all ${
              isRevealed
                ? "bg-theater-800 text-slate-100 border border-theater-700"
                : "bg-theater-750 text-transparent select-none filter blur-[4px] hover:blur-[2px] border border-theater-650"
            }`}
          >
            {part.text}
          </span>
        );
      })}
    </span>
  );
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUser,
  isSpeaking,
  onReact,
  onStartReply,
  onEditMessage,
  onDeleteMessage,
}) => {
  const isMe = message.sender.id === currentUser.id;
  const isSystem = message.type === "system" || message.sender.id === "system";
  const isAction = message.type === "action";

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  // Standalone emoji detection
  const { isEmojiOnly, count: emojiCount } = getEmojiOnlyInfo(message.content);

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

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onEditMessage?.(message.id, editText.trim());
    setIsEditing(false);
  };

  // Extract reaction chips
  const reactionEntries: Array<{ emoji: string; count: number; hasReacted: boolean }> = [];
  if (message.reactions) {
    for (const [emoji, val] of Object.entries(message.reactions)) {
      if (Array.isArray(val)) {
        if (val.length > 0) {
          reactionEntries.push({
            emoji,
            count: val.length,
            hasReacted: val.includes(currentUser.id),
          });
        }
      } else if (typeof val === "number" && val > 0) {
        reactionEntries.push({
          emoji,
          count: val,
          hasReacted: false,
        });
      }
    }
  }

  return (
    <div
      className={`relative flex items-start gap-2.5 my-2.5 group transition-opacity ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}
      onMouseLeave={() => setShowQuickReactions(false)}
    >
      {/* Avatar with speaking wave */}
      <div
        className={`w-7 h-7 rounded-full bg-gradient-to-tr ${message.sender.color} flex items-center justify-center text-xs shrink-0 shadow-md transition-all ${
          isSpeaking ? "ring-2 ring-emerald-400 shadow-emerald-500/30 animate-pulse" : ""
        }`}
        title={isSpeaking ? `${message.sender.name} (Speaking)` : message.sender.name}
      >
        {message.sender.avatar}
      </div>

      {/* Bubble Content Area */}
      <div
        className={`flex flex-col max-w-[82%] min-w-0 ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Name, time, and edited tag */}
        <div className="flex items-center gap-1.5 mb-0.5 px-1">
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
          {message.isEdited && !message.isDeleted && (
            <span className="text-[9px] text-slate-500 italic">(edited)</span>
          )}
        </div>

        {/* Reply Preview Quote (if replying to another message) */}
        {message.replyTo && (
          <div
            className={`flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-2 py-0.5 rounded-lg bg-theater-900/90 border-l-2 border-brand-purple max-w-full truncate ${
              isMe ? "mr-1" : "ml-1"
            }`}
          >
            <Reply className="w-2.5 h-2.5 text-brand-purple shrink-0" />
            <span className="font-semibold text-slate-300 shrink-0">
              {message.replyTo.senderName}:
            </span>
            <span className="truncate italic text-slate-400">
              {message.replyTo.content}
            </span>
          </div>
        )}

        {/* Message Bubble, Standalone Emoji, or Inline Edit Box */}
        <div className="relative group/bubble max-w-full">
          {message.isDeleted ? (
            <div className="px-3 py-1.5 rounded-xl text-xs italic text-slate-500 bg-theater-900/50 border border-theater-800/80">
              This message was deleted
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-1.5 p-2 bg-theater-900 rounded-xl border border-brand-purple/50 shadow-lg min-w-[220px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                maxLength={500}
                className="w-full bg-theater-950 border border-theater-750 focus:border-brand-purple rounded-lg px-2.5 py-1 text-xs text-slate-100 outline-none"
              />
              <div className="flex items-center justify-end gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.content);
                  }}
                  className="px-2 py-0.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editText.trim()}
                  className="px-2 py-0.5 rounded bg-brand-purple text-white hover:bg-brand-violet font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            </form>
          ) : isEmojiOnly ? (
            /* Standalone Unboxed Emoji Message */
            <div
              className={`select-none transition-transform duration-150 inline-block ${
                emojiCount === 1
                  ? "text-[2.75rem] leading-none py-1 px-1 hover:scale-110 active:scale-95 motion-reduce:hover:scale-100"
                  : "text-[2rem] leading-tight py-1 px-1 flex flex-wrap items-center gap-1.5"
              }`}
              aria-label={`Emoji message: ${message.content}`}
              role="img"
            >
              {message.content}
            </div>
          ) : (
            /* Regular Chat Bubble */
            <div
              className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                isMe
                  ? "bg-gradient-to-r from-brand-violet to-brand-purple text-white rounded-tr-xs"
                  : "bg-theater-850 border border-theater-750 text-slate-200 rounded-tl-xs"
              }`}
            >
              <SpoilerText content={message.content} />
            </div>
          )}

          {/* Hover Action Menu */}
          {!message.isDeleted && !isEditing && (
            <div
              className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-0.5 bg-theater-900 border border-theater-750 rounded-lg p-0.5 shadow-lg ${
                isMe ? "left-0 -translate-x-3/4" : "right-0 translate-x-3/4"
              }`}
            >
              {/* Quick Reactions Toggle */}
              <button
                type="button"
                onClick={() => setShowQuickReactions(!showQuickReactions)}
                className="p-1 rounded hover:bg-theater-800 text-slate-400 hover:text-amber-400 transition-colors"
                title="React"
              >
                <Smile className="w-3 h-3" />
              </button>

              {/* Reply Button */}
              <button
                type="button"
                onClick={() =>
                  onStartReply({
                    id: message.id,
                    senderName: isMe ? "You" : message.sender.name,
                    content: message.content,
                  })
                }
                className="p-1 rounded hover:bg-theater-800 text-slate-400 hover:text-brand-purple transition-colors"
                title="Reply"
              >
                <Reply className="w-3 h-3" />
              </button>

              {/* Edit (if own message) */}
              {isMe && onEditMessage && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded hover:bg-theater-800 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Edit message"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}

              {/* Delete (if own message) */}
              {isMe && onDeleteMessage && (
                <button
                  type="button"
                  onClick={() => onDeleteMessage(message.id)}
                  className="p-1 rounded hover:bg-theater-800 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Quick Emoji Menu Flyout */}
          {showQuickReactions && (
            <div
              className={`absolute bottom-full mb-1 z-30 flex items-center gap-1 p-1 bg-theater-900 border border-theater-750 rounded-xl shadow-2xl animate-in fade-in duration-100 ${
                isMe ? "right-0" : "left-0"
              }`}
            >
              {COMMON_QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowQuickReactions(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-theater-800 hover:scale-125 transition-transform text-xs"
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowQuickReactions(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Reaction Chips Row */}
        {reactionEntries.length > 0 && !message.isDeleted && (
          <div
            className={`flex flex-wrap gap-1 mt-1 max-w-full ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            {reactionEntries.map(({ emoji, count, hasReacted }) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all select-none hover:scale-105 active:scale-95 ${
                  hasReacted
                    ? "bg-brand-purple/20 border-brand-purple/80 text-purple-200 shadow-sm"
                    : "bg-theater-900/90 border-theater-750 text-slate-400 hover:text-slate-200 hover:border-slate-600"
                }`}
                title={`${count} reaction${count > 1 ? "s" : ""}`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-mono">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
