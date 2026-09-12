"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Tv, ArrowRight, Compass } from "lucide-react";
import { generateRoomId } from "@/lib/utils";

const PRESET_SOURCES = [
  { name: "YouTube Anime", url: "https://www.youtube.com", icon: "📺" },
  { name: "Crunchyroll", url: "https://www.crunchyroll.com", icon: "🟠" },
  { name: "Twitch", url: "https://www.twitch.tv", icon: "🟣" },
  { name: "Chainsaw OST", url: "https://www.youtube.com/watch?v=dFlDRhvM4b0", icon: "🪚" },
];

export const CreateRoomCard: React.FC = () => {
  const router = useRouter();
  const [roomTitle, setRoomTitle] = useState("");
  const [startUrl, setStartUrl] = useState("https://www.youtube.com");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const roomId = generateRoomId();
    // Navigate to party room
    router.push(`/room/${roomId}?title=${encodeURIComponent(roomTitle.trim() || "Cinema Lounge")}`);
  };

  return (
    <div className="bg-theater-900/90 border border-theater-750 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Create Party Room</h2>
            <p className="text-xs text-slate-400">Launch an interactive virtual browser theater</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Party Room Name
            </label>
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="e.g. Friday Movie Night, Anime Marathon..."
              className="w-full px-3.5 py-2.5 bg-theater-850 border border-theater-750 focus:border-brand-purple rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Website / Stream Source
            </label>
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
              {PRESET_SOURCES.map((source) => (
                <button
                  key={source.name}
                  type="button"
                  onClick={() => setStartUrl(source.url)}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border transition-all shrink-0 ${
                    startUrl === source.url
                      ? "bg-brand-purple/20 border-brand-purple text-brand-purple font-medium"
                      : "bg-theater-850 border-theater-750 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{source.icon}</span>
                  <span>{source.name}</span>
                </button>
              ))}
            </div>

            <input
              type="url"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              required
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-theater-850 border border-theater-750 focus:border-brand-purple rounded-xl text-xs text-slate-200 font-mono outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full mt-2 py-3 bg-gradient-to-r from-brand-violet via-brand-purple to-brand-indigo hover:opacity-95 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Launching Theater...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Watch Party</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 pt-3 border-t border-theater-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Instant Cloud VM allocation</span>
        <span className="text-emerald-400 font-medium">Free Access</span>
      </div>
    </div>
  );
};
