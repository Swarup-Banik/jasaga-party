"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Tv,
  Film,
  Users,
  Settings,
  Search,
  Bell,
  Plus,
  Play,
  Puzzle,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Info,
} from "lucide-react";
import { CreateNetflixRoomModal } from "./CreateNetflixRoomModal";
import { JoinNetflixRoomModal } from "./JoinNetflixRoomModal";
import { UserProfileModal } from "@/components/lobby/UserProfileModal";
import { useRoomUser } from "@/hooks/useRoomUser";

interface NetflixDashboardProps {
  onSwitchToWatchParty?: () => void;
}

export const NetflixDashboard: React.FC<NetflixDashboardProps> = ({ onSwitchToWatchParty }) => {
  const router = useRouter();
  const { user, updateProfile } = useRoomUser();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  // Extension status checking
  const [extensionStatus, setExtensionStatus] = useState<{
    installed: boolean;
    version?: string;
    netflixTabOpen?: boolean;
    netflixWatchActive?: boolean;
  }>({
    installed: false,
  });

  useEffect(() => {
    const hasDomTag = typeof document !== "undefined" && !!document.documentElement.dataset.jasagaNetflixExt;
    const requestId = `ping_${Date.now()}`;

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      setExtensionStatus({ installed: hasDomTag });
    }, 600);

    const handler = (e: MessageEvent) => {
      if (e.source === window && e.data?.source === "JASAGA_EXT_BRIDGE" && e.data.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        // Query detailed status
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
          }
        };
        window.addEventListener("message", statusHandler);
        window.postMessage({ target: "JASAGA_EXT_BRIDGE", action: "GET_STATUS", requestId: statusReqId }, window.location.origin);
      }
    };

    window.addEventListener("message", handler);
    window.postMessage({ target: "JASAGA_EXT_BRIDGE", action: "PING", requestId }, window.location.origin);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
    };
  }, []);

  // Popular on Netflix demo titles
  const popularShows = [
    {
      id: "80057281",
      title: "STRANGER THINGS",
      gradient: "from-rose-950/80 via-black to-red-950/90",
      accent: "#e50914",
      sub: "Season 4 Live",
    },
    {
      id: "80189685",
      title: "THE WITCHER",
      gradient: "from-slate-900/90 via-black to-indigo-950/90",
      accent: "#6366f1",
      sub: "Fantasy Drama",
    },
    {
      id: "80192098",
      title: "MONEY HEIST",
      gradient: "from-red-950/80 via-black to-amber-950/90",
      accent: "#ef4444",
      sub: "La Casa De Papel",
    },
    {
      id: "81231974",
      title: "WEDNESDAY",
      gradient: "from-purple-950/90 via-black to-slate-950/90",
      accent: "#a855f7",
      sub: "Mystery Series",
    },
    {
      id: "81033280",
      title: "SPIDER-MAN",
      gradient: "from-blue-950/90 via-black to-red-950/90",
      accent: "#3b82f6",
      sub: "Into the Spider-Verse",
    },
    {
      id: "81435684",
      title: "ARCANE",
      gradient: "from-cyan-950/90 via-black to-purple-950/90",
      accent: "#06b6d4",
      sub: "League of Legends",
    },
  ];

  const handleCardClick = (show: (typeof popularShows)[0]) => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-[#07070d] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-purple-500/30 selection:text-white antialiased">
      {/* ======================================================== */}
      {/* 1. LEFT SIDEBAR (Desktop Fixed, Responsive Mobile Drawer) */}
      {/* ======================================================== */}
      <aside className="w-full md:w-64 bg-[#0a0a14] border-r border-purple-500/10 flex flex-col shrink-0 p-5 justify-between">
        <div className="space-y-8">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] group-hover:scale-105 transition-transform">
              <span className="font-black text-xl text-white tracking-tighter">J</span>
            </div>
            <div>
              <div className="font-black text-base tracking-wider text-white flex items-center gap-1.5">
                <span>JASAGA</span>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30">
                  PARTY
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 font-medium">Watch Together Anywhere</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={onSwitchToWatchParty}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20 text-xs font-bold transition-all text-left group"
            >
              <Home className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>Home</span>
            </button>

            <button
              onClick={onSwitchToWatchParty}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20 text-xs font-bold transition-all text-left group"
            >
              <Tv className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>Watch Party</span>
            </button>

            {/* Active Netflix Party Item */}
            <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-900/60 to-purple-800/40 border border-purple-500/40 text-white text-xs font-black shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <div className="flex items-center gap-3.5">
                <Film className="w-4 h-4 text-purple-300" />
                <span className="tracking-wide">Netflix Party</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                New
              </span>
            </div>

            <button
              onClick={onSwitchToWatchParty}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20 text-xs font-bold transition-all text-left group"
            >
              <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>My Rooms</span>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20 text-xs font-bold transition-all text-left group"
            >
              <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>Friends</span>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20 text-xs font-bold transition-all text-left group"
            >
              <Settings className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User Profile Pill at Bottom of Sidebar */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full p-3 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-between transition-all group mt-6"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-sm shadow`}>
              {user.avatar}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">
                {user.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
        </button>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-10 border-b border-purple-500/10 flex items-center justify-between shrink-0 bg-[#07070d]/80 backdrop-blur-md sticky top-0 z-30">
          {/* Search Box */}
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search rooms and friends"
              placeholder="Search rooms, friends..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
            />
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-3 pl-4">
            <button
              onClick={() => setShowLearnMoreModal(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-purple-950/30 transition-all border border-transparent hover:border-purple-500/20"
              title="Extension Info"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-xs shadow border border-purple-500/30`}
            >
              {user.avatar}
            </button>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <div className="p-6 sm:p-10 space-y-12 max-w-7xl mx-auto w-full">
          {/* ======================================================== */}
          {/* HERO SECTION */}
          {/* ======================================================== */}
          <section className="relative rounded-3xl bg-gradient-to-br from-[#120f26] via-[#0d0b1a] to-[#080710] border border-purple-500/30 p-8 sm:p-12 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-10 left-10 w-72 h-72 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Typography & CTAs (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Glowing NETFLIX Heading with stylized N */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-violet-400 flex items-center justify-center text-white font-black text-3xl sm:text-4xl shadow-[0_0_30px_rgba(168,85,247,0.7)] shrink-0 border border-purple-400/40">
                    N
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-widest drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                      NETFLIX
                    </h1>
                    <p className="text-base sm:text-lg text-purple-300 font-serif italic tracking-wide mt-0.5">
                      Watch Together. Feel Closer.
                    </p>
                  </div>
                </div>

                {/* Subtext description */}
                <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed font-normal">
                  Sync your own Netflix session with friends.
                  <br />
                  <span className="text-purple-200/90 font-medium">No shared accounts. Just great stories, together.</span>
                </p>

                {/* Hero Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Netflix Room</span>
                  </button>

                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="py-3.5 px-6 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200 hover:text-white font-bold text-sm tracking-wide transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                  >
                    <Play className="w-4 h-4 text-purple-400 fill-current" />
                    <span>Join Netflix Room</span>
                  </button>
                </div>

                {/* Extension status subtext below buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-purple-300 font-medium">
                    <Puzzle className="w-4 h-4 text-purple-400" />
                    <span>Requires JASAGA Netflix Extension</span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => setShowLearnMoreModal(true)}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors hover:underline"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: High-Res Cinematic Visual (5 Cols) */}
              <div className="lg:col-span-5 relative">
                <div className="relative w-full aspect-video sm:aspect-[16/10] rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.3)] group">
                  <Image
                    src="/netflix/hero-viewers.jpg"
                    alt="Friends watching Netflix together in purple lounge"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  {/* Subtle purple gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#120f26] via-transparent to-transparent opacity-40" />

                  {/* Live sync pill badge */}
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/70 border border-purple-500/40 backdrop-blur-md flex items-center gap-2 text-[11px] text-purple-200 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Extension Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 2. WHY NETFLIX PARTY? SECTION (4 CARDS) */}
          {/* ======================================================== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
              <span>Why Netflix Party?</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/90 border border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Your Own Accounts
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Everyone uses their own Netflix account. No sharing, no compromises.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/90 border border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Real-time Sync
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Play, pause, seek, and switch episodes together with friends.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/90 border border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Safe & Secure
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    We never access your passwords, cookies or personal data.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/90 border border-purple-500/20 hover:border-purple-500/40 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    Watch with Friends
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Chat, react and enjoy your favorite shows and movies together.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. HOW NETFLIX PARTY WORKS (4 INTERCONNECTED STEPS) */}
          {/* ======================================================== */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              How Netflix Party Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/80 border border-purple-500/20 relative">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold mb-4">
                  <Puzzle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  Step 1
                </span>
                <h4 className="text-sm font-bold text-white mb-1.5">Install Extension</h4>
                <p className="text-xs text-slate-400">
                  Add the JASAGA Netflix Extension to your browser.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/80 border border-purple-500/20 relative">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  Step 2
                </span>
                <h4 className="text-sm font-bold text-white mb-1.5">Create or Join Room</h4>
                <p className="text-xs text-slate-400">
                  Start a new room or join with a room code.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/80 border border-purple-500/20 relative">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold mb-4">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  Step 3
                </span>
                <h4 className="text-sm font-bold text-white mb-1.5">Watch Together</h4>
                <p className="text-xs text-slate-400">
                  Sync your own Netflix session with friends in real-time.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-3xl bg-[#0c0c16]/80 border border-purple-500/20 relative">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold mb-4">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                  Step 4
                </span>
                <h4 className="text-sm font-bold text-white mb-1.5">Chat & Enjoy</h4>
                <p className="text-xs text-slate-400">
                  React, chat and make memories together.
                </p>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. POPULAR ON NETFLIX (6 STREAMING CARDS) */}
          {/* ======================================================== */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-purple-400 fill-purple-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  Popular on Netflix
                </h2>
              </div>
              <a
                href="https://www.netflix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition-colors group"
              >
                <span>Browse Netflix</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Carousel / Grid of 6 Cinematic Title Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularShows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => handleCardClick(show)}
                  className="group cursor-pointer rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/60 bg-[#0d0b18] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex flex-col relative aspect-[2/3] justify-between p-4"
                >
                  {/* Subtle Red Netflix 'N' in top-left */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className="font-black text-red-600 text-sm font-sans drop-shadow-[0_0_8px_rgba(229,9,20,0.6)]">
                      N
                    </span>
                    <span className="text-[9px] uppercase font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      Party
                    </span>
                  </div>

                  {/* Dark Cinematic Gradient Center */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-b ${show.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />

                  {/* Title and Badge at bottom */}
                  <div className="relative z-10 pt-16">
                    <h4 className="text-xs font-black tracking-wider text-white group-hover:text-purple-200 transition-colors drop-shadow">
                      {show.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-300 font-medium">
                      {show.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <CreateNetflixRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        extensionStatus={extensionStatus}
        userName={user.name}
      />

      <JoinNetflixRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        extensionStatus={extensionStatus}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={updateProfile}
      />

      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#0c0c16] border border-purple-500/30 p-6 sm:p-7 shadow-[0_0_40px_rgba(139,92,246,0.3)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">About JASAGA Netflix Sync</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              JASAGA Party synchronizes playback between friends using their own personal, authorized Netflix sessions in the browser.
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>🔒 <strong>Zero Credentials</strong>: We never access passwords, cookies, or account data.</p>
              <p>🎬 <strong>DRM Intact</strong>: Widevine and protected video streams remain untouched.</p>
              <p>👑 <strong>Host Control</strong>: The party host controls play, pause, seek, and episode changes.</p>
            </div>
            <button
              onClick={() => setShowLearnMoreModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
