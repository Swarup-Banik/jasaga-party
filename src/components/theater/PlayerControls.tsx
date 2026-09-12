"use client";

import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  MousePointer,
  Sparkles,
  Wifi,
  ExternalLink,
} from "lucide-react";
import { UserProfile } from "@/types/chat";

interface PlayerControlsProps {
  isMuted: boolean;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onReload: () => void;
  controller: UserProfile | null;
  currentUser: UserProfile;
  onToggleControl: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isMuted,
  volume,
  onVolumeChange,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onReload,
  controller,
  currentUser,
  onToggleControl,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const isController = controller?.id === currentUser.id;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-theater-900/90 backdrop-blur-md border-t border-theater-800 text-sm">
      {/* Left controls: Audio & Stream Info */}
      <div className="flex items-center gap-3">
        {/* Mute/Volume */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-theater-800 transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {showVolumeSlider && (
            <div className="absolute left-9 bottom-1/2 translate-y-1/2 flex items-center bg-theater-850 px-3 py-1.5 rounded-lg border border-theater-700 shadow-xl z-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-theater-700 rounded-lg appearance-none cursor-pointer accent-brand-purple"
              />
              <span className="text-[11px] font-mono text-slate-400 ml-2 w-7">
                {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          )}
        </div>

        {/* Reload */}
        <button
          onClick={onReload}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-theater-800 transition-colors"
          title="Reload virtual browser"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Status / Latency badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theater-850/80 border border-theater-800 text-xs text-slate-400">
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>1080p 60fps</span>
          <span className="text-theater-600">•</span>
          <span className="text-emerald-400 font-mono">18ms</span>
        </div>
      </div>

      {/* Center: Collaborative Control status */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleControl}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
            isController
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "bg-theater-800 hover:bg-theater-750 text-slate-300 border border-theater-700 hover:border-theater-600"
          }`}
          title={isController ? "Click to release control" : "Click to control the virtual browser"}
        >
          <MousePointer className={`w-3.5 h-3.5 ${isController ? "animate-bounce" : ""}`} />
          <span>
            {isController
              ? "You Have Control"
              : controller
              ? `${controller.name} in Control`
              : "Take Control"}
          </span>
        </button>
      </div>

      {/* Right controls: Fullscreen */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-theater-800 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Theater Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-brand-purple" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
