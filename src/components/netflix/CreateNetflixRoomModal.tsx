"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Crown,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Play,
  ArrowRight,
  Radio,
  Sparkles,
} from "lucide-react";

interface CreateNetflixRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensionStatus: {
    installed: boolean;
    version?: string;
    netflixTabOpen?: boolean;
    netflixWatchActive?: boolean;
  };
  userName: string;
}

export const CreateNetflixRoomModal: React.FC<CreateNetflixRoomModalProps> = ({
  isOpen,
  onClose,
  extensionStatus,
  userName,
}) => {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [step, setStep] = useState<"form" | "created">("form");
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate readable code e.g. JSG-82K4
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `JSG-${randomHex}`;
    setCreatedRoomCode(code);
    setStep("created");
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/netflix/${createdRoomCode}?role=guest`;
    navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleStartWatching = () => {
    onClose();
    router.push(`/netflix/${createdRoomCode}?role=host${roomName ? `&title=${encodeURIComponent(roomName)}` : ""}`);
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

        {step === "form" ? (
          <div>
            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-wide">
                  CREATE NETFLIX ROOM
                </h3>
                <p className="text-xs text-purple-300/80 font-medium">
                  Host an authoritative sync session for your friends
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Room Name Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Room Name <span className="text-slate-500 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Friday Night Anime"
                  className="w-full px-4 py-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all text-sm font-medium"
                />
              </div>

              {/* Role Indicator Card */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">👑 Host Role</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/40">
                      Authoritative
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    You will be the playback controller. When you play, pause, seek, or change episodes in Netflix, your friends&apos; tabs follow in real-time.
                  </p>
                </div>
              </div>

              {/* Netflix Pre-flight Status Checks */}
              <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  System Pre-Check
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-purple-400" />
                    JASAGA Netflix Extension:
                  </span>
                  {extensionStatus.installed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected (v{extensionStatus.version || "1.0.0"})
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Extension Not Detected
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-purple-400" />
                    Netflix Tab Detected:
                  </span>
                  {extensionStatus.netflixTabOpen ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {extensionStatus.netflixWatchActive ? "Active Video Page" : "Netflix Open"}
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      No Netflix Tab Open
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Create Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Room Created Success Screen */
          <div className="text-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
              🎉
            </div>

            <h3 className="text-2xl font-black text-white tracking-wide mb-1">
              Room Created
            </h3>
            <p className="text-xs text-purple-300/80 mb-6">
              Share the code or link with friends to watch together
            </p>

            {/* Room Code Display */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 mb-6 flex flex-col items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                ROOM CODE
              </span>
              <span className="text-3xl font-mono font-black text-white tracking-widest bg-black/40 px-6 py-2 rounded-xl border border-purple-500/30 shadow-inner">
                {createdRoomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-purple-200 hover:text-white flex items-center gap-2 transition-all"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Invite Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Invite</span>
                  </>
                )}
              </button>
            </div>

            {/* Waiting Status / Participant Preview */}
            <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 text-left mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Waiting for friends...</span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">👑 You</span>
                  <span className="text-slate-300 font-semibold">{userName} (Host)</span>
                </div>
                <span className="text-purple-300 font-semibold flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>
            </div>

            {/* Start Watching Button */}
            <button
              onClick={handleStartWatching}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_35px_rgba(168,85,247,0.5)] hover:shadow-[0_0_45px_rgba(168,85,247,0.7)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Watching</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
