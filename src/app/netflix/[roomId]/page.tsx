"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tv,
  Crown,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Activity,
  Send,
  Radio,
  Sparkles,
  Lock,
  Eye,
  MessageSquare,
  Flame,
  LogOut,
  ChevronRight,
  Puzzle,
} from "lucide-react";
import { useRoomUser } from "@/hooks/useRoomUser";
import { useNetflixSync } from "@/hooks/useNetflixSync";
import { NetflixSyncRole } from "@/types/netflix";
import { UserProfileModal } from "@/components/lobby/UserProfileModal";

function NetflixRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = (params?.roomId as string) || "lounge";
  const initialRole = (searchParams?.get("role") as NetflixSyncRole) || "guest";
  const customTitle = searchParams?.get("title") || "";

  const { user, updateProfile, isLoaded } = useRoomUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "participants" | "sync">("chat");

  // Waiting Room state: if user joins as host or guest before playback starts, they can be in waiting room or watch room
  const [isWatching, setIsWatching] = useState<boolean>(initialRole === "host" ? false : false);

  // Episode change notification toast
  const [episodeToast, setEpisodeToast] = useState<{ show: boolean; mediaId: string }>({ show: false, mediaId: "" });
  const prevMediaIdRef = useRef<string>("");

  const {
    role,
    isHost,
    isHostOnline,
    extensionStatus,
    roomPlaybackState,
    driftMetrics,
    messages,
    participants,
    reactions,
    eventLog,
    triggerPlay,
    triggerPause,
    triggerSeek,
    requestResync,
    sendChatMessage,
    sendReaction,
  } = useNetflixSync({ roomId, user, initialRole });

  // Detect episode changes to show the temporary notification toast
  useEffect(() => {
    if (roomPlaybackState.mediaId && prevMediaIdRef.current && roomPlaybackState.mediaId !== prevMediaIdRef.current) {
      setEpisodeToast({ show: true, mediaId: roomPlaybackState.mediaId });
      const timer = setTimeout(() => {
        setEpisodeToast((prev) => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
    prevMediaIdRef.current = roomPlaybackState.mediaId;
  }, [roomPlaybackState.mediaId]);

  // If host starts playing, automatically switch any waiting guests to watching mode
  useEffect(() => {
    if (roomPlaybackState.isPlaying || roomPlaybackState.position > 0) {
      setIsWatching(true);
    }
  }, [roomPlaybackState.isPlaying, roomPlaybackState.position]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/netflix/${roomId}?role=guest`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) sec = 0;
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const quickEmojis = ["❤️", "😂", "🔥", "😭", "💀", "😱"];

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen bg-[#07070d] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
        <span className="text-xs text-purple-300 font-mono tracking-wider">Loading Netflix Party room...</span>
      </div>
    );
  }

  const netflixWatchUrl = roomPlaybackState.mediaId
    ? `https://www.netflix.com/watch/${roomPlaybackState.mediaId}`
    : "https://www.netflix.com";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#07070d] text-slate-100 overflow-hidden select-none font-sans antialiased">
      {/* ======================================================== */}
      {/* TOP BAR */}
      {/* ======================================================== */}
      <header className="h-16 border-b border-purple-500/15 px-4 sm:px-6 flex items-center justify-between bg-[#0a0a14]/90 backdrop-blur-md shrink-0 z-30">
        {/* Left: Brand Logo & Room ID */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-slate-400 hover:text-white border border-purple-500/20 transition-all group"
            title="Leave to Lobby"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Glowing N mark */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400/30">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide">
                  {customTitle || `Netflix Party #${roomId}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 border border-purple-500/40 text-purple-300">
                  Netflix Party
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <span>Room Code:</span>
                <span className="text-purple-300 font-bold">#{roomId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Connection Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Realtime Connected</span>
          <span className="text-slate-600">•</span>
          <span className={`font-semibold ${extensionStatus.installed ? "text-emerald-400" : "text-amber-400"}`}>
            {extensionStatus.installed ? "Extension Paired" : "Extension Missing"}
          </span>
        </div>

        {/* Right Actions: Copy Invite, Profile, Leave */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-xs text-purple-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Invite</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 transition-all"
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-xs shadow`}>
              {user.avatar}
            </div>
            <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{user.name}</span>
          </button>

          <Link
            href="/"
            className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-500/30 transition-all"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CONDITIONAL: WAITING ROOM vs MAIN WATCHING ROOM */}
      {/* ======================================================== */}
      {!isWatching ? (
        /* ======================================================== */
        /* SCREEN 8: DEDICATED WAITING ROOM SCREEN */
        /* ======================================================== */
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-y-auto">
          {/* Ambient Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />

          <div className="w-full max-w-xl rounded-3xl bg-[#0c0c16]/90 border border-purple-500/30 p-8 shadow-[0_0_50px_rgba(139,92,246,0.2)] text-center relative z-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white text-2xl mx-auto shadow-[0_0_25px_rgba(168,85,247,0.5)]">
              👑
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
                JASAGA NETFLIX PARTY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Waiting Room
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isHost
                  ? "Your room is ready! Wait for friends to join, then start watching."
                  : "Waiting for host to start watching..."}
              </p>
            </div>

            {/* Room Code Banner */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                ROOM CODE
              </span>
              <span className="text-3xl font-mono font-black text-white tracking-widest bg-black/40 px-6 py-1.5 rounded-xl border border-purple-500/30">
                {roomId}
              </span>
              <button
                onClick={handleCopyLink}
                className="mt-1 px-4 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-bold text-purple-200 hover:text-white flex items-center gap-2 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Share Invite Link"}</span>
              </button>
            </div>

            {/* Participant Roster */}
            <div className="text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Participants ({participants.length || 1})</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {participants.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-xs shadow`}>
                        {user.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{user.name}</span>
                        <span className="text-[10px] text-purple-300">{isHost ? "👑 Host" : "👥 Guest"}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      🟢 Connected
                    </span>
                  </div>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.user.id}
                      className="p-3 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${p.user.color} flex items-center justify-center text-xs shadow`}>
                          {p.user.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{p.user.name}</span>
                            {p.user.id === user.id && <span className="text-[9px] text-slate-500">(You)</span>}
                          </div>
                          <span className="text-[10px] text-purple-300 font-medium">
                            {p.role === "host" ? "👑 Host" : "👥 Guest"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        🟢 Connected
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Waiting Notice / Host Action */}
            <div className="pt-2">
              {isHost ? (
                <button
                  onClick={() => setIsWatching(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_35px_rgba(168,85,247,0.5)] hover:shadow-[0_0_45px_rgba(168,85,247,0.7)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Watching</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-center gap-3 text-xs text-purple-200">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>Waiting for host to start watching... Guests cannot modify playback authority.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* SCREEN 9: MAIN NETFLIX PARTY ROOM SCREEN */
        /* ======================================================== */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Episode Change Temporary Toast Notification */}
          {episodeToast.show && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
              <div className="px-5 py-3 rounded-2xl bg-[#120e24] border border-purple-500/50 shadow-[0_0_35px_rgba(168,85,247,0.6)] flex items-center gap-3 text-white text-xs font-bold">
                <span className="text-base">🎬</span>
                <div>
                  <span className="block text-purple-300 text-[10px] uppercase tracking-wider">Host Changed Episode</span>
                  <span>Episode ID: #{episodeToast.mediaId}</span>
                </div>
              </div>
            </div>
          )}

          {/* LEFT 65%: Large Netflix Viewing Center & Controls */}
          <main className="w-full lg:w-[68%] h-full p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto border-r border-purple-500/10">
            {/* Host Disconnected Alert Banner */}
            {!isHost && !isHostOnline && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/60 shadow-lg flex items-center gap-3 text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-amber-300">Host Disconnected</span>
                  <span>Host disconnected — room playback authority unavailable. Playback is held at current position.</span>
                </div>
              </div>
            )}

            {/* Viewing Screen Container (Reference Image Layout) */}
            <div className="relative w-full aspect-video sm:aspect-[16/9] rounded-3xl bg-gradient-to-b from-[#100d20] via-[#090812] to-[#06050b] border border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden flex flex-col justify-between p-6 group">
              {/* Cinematic Ambient Background Glow */}
              <div className="absolute inset-0 bg-radial-gradient from-purple-900/10 via-transparent to-transparent pointer-events-none" />

              {/* Floating Reactions Rendering Area */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {reactions.map((rx) => (
                  <div
                    key={rx.id}
                    className="absolute text-4xl animate-float-up pointer-events-none drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]"
                    style={{
                      left: `${20 + (parseInt(rx.id.slice(-2), 16) % 60)}%`,
                      bottom: "20%",
                    }}
                  >
                    {rx.emoji}
                  </div>
                ))}
              </div>

              {/* Top Row inside Viewport */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-white font-black text-xs shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                    N
                  </div>
                  <span className="text-xs font-bold text-white tracking-wide">
                    {customTitle || "Netflix Sync Theater"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {roomPlaybackState.isPlaying ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>PLAYING</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[11px] font-bold flex items-center gap-1.5">
                      <span>⏸ PAUSED</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Center Cinematic Slate */}
              <div className="relative z-10 text-center space-y-3 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-500 flex items-center justify-center text-white font-black text-3xl mx-auto shadow-[0_0_35px_rgba(168,85,247,0.6)] border border-purple-400/40">
                  N
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                    {roomPlaybackState.mediaId ? `Episode #${roomPlaybackState.mediaId}` : "Synchronized Netflix Session"}
                  </h3>
                  <p className="text-xs text-purple-300/80 font-medium max-w-md mx-auto mt-1">
                    Your personal Netflix tab is connected and following the host in real-time.
                  </p>
                </div>

                {/* Direct Open Tab link */}
                <a
                  href={netflixWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-sm group"
                >
                  <span>Open Your Netflix Tab</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              {/* Bottom Synchronized Info Bar (Section 9) */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-[#090814]/90 border border-purple-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Left: Synced status */}
                <div className="flex items-center gap-3">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SYNCED</span>
                  </span>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Episode</span>
                    <span className="text-white font-bold truncate max-w-[180px] sm:max-w-xs block font-mono">
                      {roomPlaybackState.mediaId ? `Stranger Things S01E07 (#${roomPlaybackState.mediaId})` : "Waiting for host play..."}
                    </span>
                  </div>
                </div>

                {/* Right: Current Timecode */}
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Playback Position</span>
                  <span className="font-mono font-black text-purple-300 text-sm tracking-wider">
                    {formatSeconds(roomPlaybackState.position)} / 1:12:00
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Reactions Bar Below Viewing Area (Section 15) */}
            <div className="p-3 rounded-2xl bg-[#0c0c16]/90 border border-purple-500/20 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 pl-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Quick Reactions:</span>
              </span>

              <div className="flex items-center gap-2">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 hover:border-purple-500/60 text-lg sm:text-base hover:scale-125 active:scale-95 transition-all shadow"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Control Console: Host Authority (Section 10) vs Guest Spectator (Section 11) */}
            <div className="p-5 rounded-3xl bg-[#0c0c16]/90 border border-purple-500/25 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/15">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    {isHost ? <Crown className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-purple-400" />}
                    <span>{isHost ? "👑 You are Host" : "👀 Watching with the host"}</span>
                  </span>
                  <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                    {isHost ? "Authoritative Controller" : "🔒 Playback controlled by host"}
                  </span>
                </div>

                {!isHost && (
                  <button
                    onClick={requestResync}
                    className="px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request Resync</span>
                  </button>
                )}
              </div>

              {/* Host Controls */}
              {isHost ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={triggerPlay}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Host Play</span>
                    </button>

                    <button
                      onClick={triggerPause}
                      className="px-4 py-2.5 rounded-2xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-white text-xs font-bold flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Host Pause</span>
                    </button>

                    <button
                      onClick={() => triggerSeek(Math.max(0, roomPlaybackState.position - 10))}
                      className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 transition-all"
                      title="Seek -10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => triggerSeek(roomPlaybackState.position + 10)}
                      className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 transition-all"
                      title="Seek +10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium">
                    Controls apply immediately to your tab and sync all connected guests.
                  </p>
                </div>
              ) : (
                /* Guest View (Section 11) */
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>The host ({roomPlaybackState.hostName || "Host"}) controls playback. Your player automatically matches their state.</span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-400 shrink-0">
                    Drift: <span className="text-emerald-400 font-bold">{driftMetrics.inSync ? "< 1.0s (In Sync)" : `${driftMetrics.driftSeconds.toFixed(2)}s`}</span>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT 35%: Sidebar with Participants, Sync Status, and Chat */}
          <aside className="w-full lg:w-[32%] h-full bg-[#0a0a14] border-l border-purple-500/10 flex flex-col shrink-0 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="h-12 border-b border-purple-500/15 flex items-center px-4 bg-[#080710]/90 shrink-0">
              <button
                onClick={() => setActiveSidebarTab("chat")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === "chat"
                    ? "bg-purple-600/30 border border-purple-500/40 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("participants")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === "participants"
                    ? "bg-purple-600/30 border border-purple-500/40 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members ({participants.length || 1})</span>
              </button>

              <button
                onClick={() => setActiveSidebarTab("sync")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeSidebarTab === "sync"
                    ? "bg-purple-600/30 border border-purple-500/40 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
              {/* TAB 1: REALTIME CHAT (Section 14) */}
              {activeSidebarTab === "chat" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-400/40" />
                        <span>No messages yet. Say hello to your watch party!</span>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender.id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                              {msg.sender.name}
                            </span>
                            <div
                              className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs ${
                                isMe
                                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-br-none"
                                  : "bg-purple-950/40 border border-purple-500/20 text-slate-200 rounded-bl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="pt-3 border-t border-purple-500/15 flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: PARTICIPANTS (Section 16) */}
              {activeSidebarTab === "participants" && (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Participants ({participants.length || 1})
                  </h4>

                  {participants.length === 0 ? (
                    <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-xs shadow`}>
                          {user.avatar}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{user.name}</span>
                          <span className="text-[10px] text-purple-300">{isHost ? "👑 Host" : "👥 Guest"}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">🟢 Connected</span>
                    </div>
                  ) : (
                    participants.map((p) => (
                      <div
                        key={p.user.id}
                        className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${p.user.color} flex items-center justify-center text-xs shadow`}>
                            {p.user.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{p.user.name}</span>
                              {p.user.id === user.id && <span className="text-[9px] text-slate-500">(You)</span>}
                            </div>
                            <span className="text-[10px] text-purple-300 font-medium">
                              {p.role === "host" ? "👑 Host" : "👥 Guest"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          🟢 Connected
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: SYNC STATUS (Section 12) */}
              {activeSidebarTab === "sync" && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                  {/* Extension Status Card */}
                  <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/25 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                      Extension & Player Status
                    </span>

                    {/* Check 1 */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-purple-400" />
                        Extension:
                      </span>
                      {extensionStatus.installed ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Missing</span>
                        </span>
                      )}
                    </div>

                    {/* Check 2 */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-purple-400" />
                        Netflix Tab:
                      </span>
                      {extensionStatus.netflixTab.isWatch ? (
                        <span className="text-emerald-400 font-bold">Watch Page Active</span>
                      ) : extensionStatus.netflixTab.found ? (
                        <span className="text-amber-400 font-bold">Tab Open</span>
                      ) : (
                        <span className="text-slate-500 font-bold">Not Found</span>
                      )}
                    </div>

                    {/* Check 3 */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        Room State:
                      </span>
                      <span className="text-emerald-400 font-bold">Synchronized</span>
                    </div>

                    {/* Retry button */}
                    <button
                      onClick={requestResync}
                      className="w-full py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry / Force Resync</span>
                    </button>
                  </div>

                  {/* Telemetry info */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-slate-800 space-y-2 text-[11px] font-mono">
                    <span className="text-slate-500 uppercase tracking-wider block text-[9px]">Technical Telemetry</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sequence:</span>
                      <span className="text-white font-bold">#{roomPlaybackState.sequence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Drift:</span>
                      <span className="text-emerald-400 font-bold">{driftMetrics.signedDriftSeconds.toFixed(2)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transit Latency:</span>
                      <span className="text-purple-300 font-bold">{driftMetrics.latencyMs}ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={updateProfile}
      />
    </div>
  );
}

export default function NetflixRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#07070d] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
          <span className="text-xs text-purple-300 font-mono tracking-wider">Loading Netflix Party room...</span>
        </div>
      }
    >
      <NetflixRoomContent />
    </Suspense>
  );
}
