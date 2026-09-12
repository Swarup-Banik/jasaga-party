"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, ArrowRight, Hash } from "lucide-react";

export const JoinRoomCard: React.FC = () => {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = inputVal.trim();
    if (!trimmed) {
      setError("Please enter a room code or invite URL");
      return;
    }

    let targetRoomId = trimmed;

    // Check if user pasted a full URL
    if (trimmed.includes("/room/")) {
      const parts = trimmed.split("/room/");
      targetRoomId = parts[1]?.split("?")[0]?.split("#")[0] || "";
    } else if (trimmed.startsWith("#")) {
      targetRoomId = trimmed.slice(1);
    }

    if (!targetRoomId) {
      setError("Invalid room link or code");
      return;
    }

    router.push(`/room/${targetRoomId}`);
  };

  return (
    <div className="bg-theater-900/90 border border-theater-750 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Join Watch Party</h2>
            <p className="text-xs text-slate-400">Enter your friend&apos;s room code or invite link</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Party Code or Invite Link
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 font-mono text-sm">
                <Hash className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setError("");
                }}
                placeholder="e.g. cyber-cinema-402 or paste full URL"
                className="w-full pl-9 pr-3.5 py-2.5 bg-theater-850 border border-theater-750 focus:border-brand-cyan rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner font-mono"
              />
            </div>
            {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
          </div>

          <div className="p-3 rounded-xl bg-theater-850/60 border border-theater-800 text-[11px] text-slate-400">
            💡 <strong>Quick tip:</strong> Joining a room puts you in the same virtual browser session with shared audio, video, and real-time chat.
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-theater-800 hover:bg-theater-750 active:scale-[0.99] text-white border border-theater-700 hover:border-theater-600 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>Enter Room</span>
            <ArrowRight className="w-4 h-4 text-brand-cyan group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      <div className="mt-4 pt-3 border-t border-theater-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>No sign-up required</span>
        <span className="text-brand-cyan font-mono font-medium">Synced Streams</span>
      </div>
    </div>
  );
};
