"use client";

import React from "react";
import { ReactionBurst } from "@/types/chat";

interface FloatingReactionsProps {
  reactions: ReactionBurst[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {reactions.map((burst) => (
        <div
          key={burst.id}
          className="absolute bottom-12 animate-float-up flex flex-col items-center select-none"
          style={{
            left: `${burst.xPercent || 50}%`,
          }}
        >
          <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            {burst.emoji}
          </span>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 mt-1 rounded-full bg-theater-950/80 border border-theater-700 text-theater-300 shadow-md whitespace-nowrap"
          >
            {burst.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
