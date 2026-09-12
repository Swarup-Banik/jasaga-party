"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface EmojiPickerBarProps {
  onSelectEmoji: (emoji: string) => void;
  onBurstReaction: (emoji: string) => void;
}

const QUICK_REACTIONS = ["🪚", "💣", "🌸", "🐶", "🍿", "🔥", "❤️", "⚡"];

export const EmojiPickerBar: React.FC<EmojiPickerBarProps> = ({
  onBurstReaction,
}) => {
  return (
    <div className="px-3 py-1.5 bg-theater-950/60 border-t border-theater-850 flex items-center justify-between gap-1 select-none">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-purple" />
          Burst:
        </span>
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onBurstReaction(emoji)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-theater-800 hover:scale-125 active:scale-95 transition-all text-base shrink-0"
            title={`Send ${emoji} reaction burst`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
