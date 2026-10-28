"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, PhoneOff, ChevronUp, AlertCircle, Headphones } from "lucide-react";
import { VoiceStatus, VoiceParticipant } from "@/types/voice";

interface VoiceMicButtonProps {
  status: VoiceStatus;
  isMuted: boolean;
  isSpeaking: boolean;
  voiceParticipants: VoiceParticipant[];
  availableAudioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  errorMessage?: string | null;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onChangeInputDevice: (deviceId: string) => void;
  disabled?: boolean;
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  status,
  isMuted,
  isSpeaking,
  voiceParticipants,
  availableAudioDevices,
  selectedDeviceId,
  errorMessage,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onChangeInputDevice,
  disabled,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close options popover on outside click or Escape
  useEffect(() => {
    if (!showOptions) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowOptions(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const handleMainClick = () => {
    if (disabled) return;

    if (status === "disconnected" || status === "error" || status === "permission_denied") {
      onJoinVoice();
    } else if (status === "connected") {
      onToggleMute();
    }
  };

  return (
    <div className="relative inline-flex items-center shrink-0" ref={popoverRef}>
      {/* Floating Secondary Voice Controls Popover */}
      {showOptions && (
        <div
          className="absolute bottom-full right-0 mb-2 z-40 bg-theater-900/98 backdrop-blur-md border border-theater-750/90 rounded-2xl shadow-2xl p-3 w-64 select-none anime-purple-glow animate-in fade-in slide-in-from-bottom-2 duration-150"
          role="dialog"
          aria-label="Voice settings"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-theater-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Watch Party Voice</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {voiceParticipants.length} connected
            </span>
          </div>

          {/* Active Voice Participants */}
          <div className="py-2 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              In Call:
            </span>
            {voiceParticipants.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">No one else is in voice yet.</p>
            ) : (
              voiceParticipants.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between text-xs py-0.5 px-1 rounded-lg bg-theater-950/50"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`w-5 h-5 rounded-full bg-gradient-to-tr ${p.color} flex items-center justify-center text-[10px] shrink-0 ${
                        p.isSpeaking ? "ring-2 ring-emerald-400 animate-pulse" : ""
                      }`}
                    >
                      {p.avatar}
                    </span>
                    <span className="truncate text-slate-300 font-medium">{p.userName}</span>
                  </div>
                  {p.isMuted ? (
                    <MicOff className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : p.isSpeaking ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  ) : (
                    <Mic className="w-3 h-3 text-emerald-400 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Microphone device selection */}
          {availableAudioDevices.length > 1 && (
            <div className="py-2 border-t border-theater-800/80">
              <label
                htmlFor="voice-device-select"
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mb-1"
              >
                <Headphones className="w-3 h-3 text-brand-purple" />
                <span>Input Device</span>
              </label>
              <select
                id="voice-device-select"
                value={selectedDeviceId}
                onChange={(e) => onChangeInputDevice(e.target.value)}
                className="w-full bg-theater-950 border border-theater-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none"
              >
                {availableAudioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Disconnect from Voice button */}
          <div className="pt-2 border-t border-theater-800/80">
            <button
              type="button"
              onClick={() => {
                onLeaveVoice();
                setShowOptions(false);
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave Voice</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Microphone Action Button */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleMainClick}
          disabled={disabled || status === "connecting"}
          title={
            status === "permission_denied"
              ? errorMessage || "Microphone access denied. Click to retry."
              : status === "error"
              ? errorMessage || "Voice error. Click to retry."
              : status === "connected"
              ? isMuted
                ? "Unmute Microphone"
                : "Mute Microphone"
              : "Join Watch Party Voice"
          }
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 ${
            status === "connected"
              ? isMuted
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30"
                : isSpeaking
                ? "bg-emerald-500/30 border border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-500/20"
                : "bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30"
              : status === "connecting"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse"
              : status === "permission_denied" || status === "error"
              ? "bg-rose-950/40 border border-rose-600/40 text-rose-400 hover:bg-rose-900/40"
              : "bg-theater-850 hover:bg-theater-800 border border-theater-750 text-slate-400 hover:text-slate-200"
          }`}
          aria-label={
            status === "connected"
              ? isMuted
                ? "Unmute Microphone"
                : "Mute Microphone"
              : "Join Voice"
          }
        >
          {status === "connected" ? (
            isMuted ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )
          ) : status === "permission_denied" || status === "error" ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Small popover toggle trigger when connected */}
        {status === "connected" && (
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={`w-4 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-theater-800 transition-colors ${
              showOptions ? "text-brand-purple" : ""
            }`}
            title="Voice options & participants"
          >
            <ChevronUp className={`w-3 h-3 transition-transform ${showOptions ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
};
