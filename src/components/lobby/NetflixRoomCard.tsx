"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Film, Users, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { generateRoomId } from "@/lib/utils";

export const NetflixRoomCard: React.FC = () => {
  const router = useRouter();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingExtension, setIsCheckingExtension] = useState(true);
  const [extensionStatus, setExtensionStatus] = useState<{
    installed: boolean;
    version?: string;
    netflixTabOpen?: boolean;
    netflixWatchActive?: boolean;
  }>({
    installed: false,
  });

  // Check extension presence via DOM tag & window message
  const verifyExtension = () => {
    setIsCheckingExtension(true);
    const hasDomTag = typeof document !== "undefined" && !!document.documentElement.dataset.jasagaNetflixExt;

    const requestId = `ping_${Date.now()}`;
    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      setExtensionStatus({ installed: hasDomTag });
      setIsCheckingExtension(false);
    }, 800);

    const handler = (e: MessageEvent) => {
      if (e.source === window && e.data?.source === "JASAGA_EXT_BRIDGE" && e.data.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        // Fetch Netflix tab status
        const statusReqId = `status_${Date.now()}`;
        const statusHandler = (se: MessageEvent) => {
          if (se.source === window && se.data?.source === "JASAGA_EXT_BRIDGE" && se.data.requestId === statusReqId) {
            window.removeEventListener("message", statusHandler);
            const res = se.data.data;
            setExtensionStatus({
              installed: true,
              version: res?.extensionVersion || "1.0.0",
              netflixTabOpen: res?.netflixTab?.found || false,
              netflixWatchActive: res?.netflixTab?.isWatch || false,
            });
            setIsCheckingExtension(false);
          }
        };
        window.addEventListener("message", statusHandler);
        window.postMessage({ target: "JASAGA_EXT_BRIDGE", action: "GET_STATUS", requestId: statusReqId }, window.location.origin);
      }
    };

    window.addEventListener("message", handler);
    window.postMessage({ target: "JASAGA_EXT_BRIDGE", action: "PING", requestId }, window.location.origin);
  };

  useEffect(() => {
    verifyExtension();
  }, []);

  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomId = `nf-${generateRoomId().slice(0, 6)}`;
    router.push(`/netflix/${newRoomId}?role=host`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    const cleanId = joinRoomId.trim().replace(/^#/, "");
    router.push(`/netflix/${cleanId}?role=guest`);
  };

  return (
    <div className="w-full max-w-4xl p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-red-950/40 via-theater-900/90 to-theater-950 border border-red-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Subtle red ambient gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 blur-[90px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-rose-600/10 blur-[80px] pointer-events-none rounded-full" />

      {/* Card Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-red-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(229,9,20,0.5)] shrink-0">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-wide text-white">
                Netflix Watch Party
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-[10px] text-red-300 font-bold uppercase tracking-wider">
                Phase 1 Live
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Synchronize personal Netflix playback with your friends via local browser companion
            </p>
          </div>
        </div>

        {/* Extension Live Telemetry Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {isCheckingExtension ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theater-850/80 border border-slate-700 text-slate-400 text-xs font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
              <span>Checking Extension...</span>
            </div>
          ) : extensionStatus.installed ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extension Active (v{extensionStatus.version || "1.0.0"})</span>
              {extensionStatus.netflixWatchActive ? (
                <span className="text-[10px] bg-red-600/30 border border-red-500/40 text-red-300 px-1.5 py-0.5 rounded-md font-mono">
                  ● Watching Netflix
                </span>
              ) : extensionStatus.netflixTabOpen ? (
                <span className="text-[10px] bg-amber-600/30 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">
                  Netflix Tab Open
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Extension Required for Netflix Sync</span>
            </div>
          )}

          <button
            onClick={verifyExtension}
            title="Recheck extension connection"
            className="p-1.5 rounded-lg bg-theater-850 hover:bg-theater-800 text-slate-400 hover:text-white border border-slate-700/60 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Row: Create Room (Host) vs Join Room (Guest) */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* CREATE ROOM CARD */}
        <div className="p-5 rounded-2xl bg-theater-900/80 border border-red-900/30 flex flex-col justify-between hover:border-red-500/40 transition-all group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                <Film className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Create Netflix Room</h4>
              <span className="text-[10px] font-semibold text-purple-400 bg-purple-900/40 border border-purple-500/30 px-1.5 py-0.2 rounded-md ml-auto">
                Host Authority
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Host a Netflix watch party. Your playback events (Play, Pause, Seek, Episode changes) will be the authoritative source for everyone in the room.
            </p>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white text-xs font-bold shadow-[0_0_15px_rgba(229,9,20,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Launching Room...</span>
              </>
            ) : (
              <>
                <span>Create Netflix Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* JOIN ROOM CARD */}
        <div className="p-5 rounded-2xl bg-theater-900/80 border border-red-900/30 flex flex-col justify-between hover:border-red-500/40 transition-all">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Join Netflix Room</h4>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-900/40 border border-blue-500/30 px-1.5 py-0.2 rounded-md ml-auto">
                Guest Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Enter the room code shared by your host to sync your personal Netflix player with the party.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room Code (e.g. nf-a8f3b2)"
                className="flex-1 px-3.5 py-2 bg-theater-850 border border-theater-750 focus:border-red-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 font-mono outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!joinRoomId.trim()}
                className="px-4 py-2 bg-theater-800 hover:bg-theater-750 border border-slate-700 hover:border-red-500/50 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Strict Privacy & Safety Confirmation Banner */}
      <div className="relative z-10 mt-5 pt-4 border-t border-red-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-300">100% Privacy & DRM Isolated:</strong> Every participant streams on their own personal Netflix subscription. Zero passwords, cookies, tokens, or video bytes are transmitted.
          </span>
        </div>

        <a
          href="https://www.netflix.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors shrink-0"
        >
          <span>Open Netflix</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
