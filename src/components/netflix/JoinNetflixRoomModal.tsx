"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Radio,
  Play,
  LogIn,
} from "lucide-react";

interface JoinNetflixRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensionStatus: {
    installed: boolean;
    version?: string;
    netflixTabOpen?: boolean;
    netflixWatchActive?: boolean;
  };
}

export const JoinNetflixRoomModal: React.FC<JoinNetflixRoomModalProps> = ({
  isOpen,
  onClose,
  extensionStatus,
}) => {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCode.trim().replace(/^#/, "");
    if (!clean) {
      setErrorMsg("Please enter a valid room code.");
      return;
    }
    onClose();
    router.push(`/netflix/${clean}?role=guest`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-[#0c0c16] border border-purple-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(139,92,246,0.25)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/30 blur-[60px] pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-500/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-wide">
              JOIN NETFLIX PARTY
            </h3>
            <p className="text-xs text-purple-300/80 font-medium">
              Synchronize your personal Netflix session with friends
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          {/* Room Code Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Room Code or URL
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setErrorMsg("");
              }}
              placeholder="e.g. JSG-82K4"
              className="w-full px-4 py-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 font-mono font-bold tracking-wider text-center text-lg transition-all"
              autoFocus
            />
            {errorMsg && <p className="text-red-400 text-xs mt-1.5 font-medium">{errorMsg}</p>}
          </div>

          {/* Role Explanation Card */}
          <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3 text-xs text-slate-300">
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              You will join as a <strong>Guest</strong>. Your Netflix player will automatically follow the host&apos;s playback.
            </span>
          </div>

          {/* Pre-flight Diagnostic Checks */}
          <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Connection Status
            </span>

            {/* Extension Check */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                Extension Installed:
              </span>
              {extensionStatus.installed ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Installed (v{extensionStatus.version || "1.0.0"})
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Extension Missing
                </span>
              )}
            </div>

            {/* Netflix Tab Check */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-purple-400" />
                Netflix Detected:
              </span>
              {extensionStatus.netflixTabOpen ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {extensionStatus.netflixWatchActive ? "Active Video Page" : "Netflix Open"}
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Not Detected
                </span>
              )}
            </div>
          </div>

          {/* Netflix Not Detected Helper Alert */}
          {!extensionStatus.netflixTabOpen && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Open Netflix in another tab to continue.</span>
              </div>
              <a
                href="https://www.netflix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all shrink-0"
              >
                <span>Open Netflix</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Join Room Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Join Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
