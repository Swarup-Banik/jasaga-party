"use client";

import React, { useState, useRef } from "react";
import { Send, Smile } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const COMMON_EMOJIS = ["😀", "😂", "🥰", "😎", "🤔", "🥳", "🔥", "🍿", "👀", "🙌", "❤️", "👍"];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
    setShowEmojiPicker(false);
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative p-3 bg-theater-950 border-t border-theater-800">
      {/* Mini Emoji Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-3 right-3 mb-2 p-2 rounded-xl bg-theater-900 border border-theater-750 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-1.5 font-medium">
            <span>Insert Emoji</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                className="h-8 flex items-center justify-center rounded-lg hover:bg-theater-800 text-lg hover:scale-110 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Send a message..."
            disabled={disabled}
            maxLength={500}
            className="w-full bg-theater-850 hover:bg-theater-800/80 focus:bg-theater-850 border border-theater-750 focus:border-brand-purple rounded-xl py-2 pl-3.5 pr-9 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2.5 text-slate-400 hover:text-brand-purple transition-colors p-1"
            title="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-8 h-8 rounded-xl bg-gradient-to-r from-brand-violet to-brand-purple text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
          title="Send message (Enter)"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
