"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Tv,
  Sparkles,
  MessageSquare,
  Globe,
  Share2,
  KeyRound,
  ShieldCheck,
  Zap,
  Users,
  Film,
  Flame,
  Search,
  Compass,
  ArrowRight,
} from "lucide-react";
import { CreateRoomCard } from "@/components/lobby/CreateRoomCard";
import { JoinRoomCard } from "@/components/lobby/JoinRoomCard";
import { UserProfileModal } from "@/components/lobby/UserProfileModal";
import { ChainsawManCompanions } from "@/components/anime/ChainsawManCompanions";
import { MediaSearchSection } from "@/components/media/MediaSearchSection";
import { useRoomUser } from "@/hooks/useRoomUser";

type LobbyTab = "launcher" | "search" | "features";

export default function LobbyPage() {
  const { user, updateProfile } = useRoomUser();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<LobbyTab>("launcher");

  return (
    <div className="min-h-screen bg-theater-950 flex flex-col justify-between text-slate-200 relative overflow-x-hidden">
      {/* Anime Background Ambient Purple Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-purple-700/15 via-violet-800/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-fuchsia-900/10 via-purple-900/10 to-transparent blur-[100px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-20 h-20 border-b border-theater-800/80 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-violet via-brand-purple to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] anime-purple-glow">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                JASAGA<span className="text-brand-purple"> PARTY</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-[10px] text-purple-300 font-mono">
                CSMan Anime Ed.
              </span>
            </div>
            <div className="text-[10px] text-purple-400/90 font-mono tracking-widest uppercase -mt-0.5 font-semibold flex items-center gap-1">
              <span>シアター</span>
              <span className="text-slate-600">•</span>
              <span>Hyperbeam Virtual Theater</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Switcher (Desktop) */}
        <nav className="hidden md:flex items-center p-1 rounded-xl bg-theater-900/90 border border-purple-500/20 shadow-inner">
          <button
            onClick={() => setActiveTab("launcher")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "launcher"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🚀 Watch Party
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "search"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Search & Summaries</span>
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "features"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            💡 Features
          </button>
        </nav>

        {/* User Identity Pill */}
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-theater-900 hover:bg-theater-850 border border-purple-500/30 hover:border-purple-400/50 transition-all shadow-md group anime-purple-border"
          title="Click to edit your username and avatar"
        >
          <div
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${user.color} flex items-center justify-center text-sm shadow`}
          >
            {user.avatar}
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
            {user.name}
          </span>
          <span className="text-[10px] text-brand-purple font-medium hidden sm:inline">
            Edit
          </span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 flex-1 flex flex-col items-center">
        {/* Compact, Clean Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3 shadow-sm">
            <span className="text-sm">🪚</span>
            <span className="text-amber-400 font-bold">チェンソーマン</span>
            <span className="text-purple-400">•</span>
            <span>Denji & Reze Edition</span>
            <span className="text-sm">🌸</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-2 leading-tight">
            Stream Anime & Movies Together with{" "}
            <span className="bg-gradient-to-r from-brand-violet via-brand-purple to-pink-400 bg-clip-text text-transparent">
              Cloud Browsing
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Interactive virtual browser theater with synchronized playback, collaborative controls, real-time chat, and instant anime & movie summaries.
          </p>
        </div>

        {/* Mobile Segment Navigation Bar (< 768px) */}
        <div className="flex md:hidden items-center p-1 rounded-xl bg-theater-900/90 border border-purple-500/20 shadow-inner mb-6 w-full max-w-sm justify-between">
          <button
            onClick={() => setActiveTab("launcher")}
            className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
              activeTab === "launcher"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400"
            }`}
          >
            🚀 Party
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
              activeTab === "search"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400"
            }`}
          >
            🔍 Search
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
              activeTab === "features"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400"
            }`}
          >
            💡 Info
          </button>
        </div>

        {/* TAB 1: PARTY LAUNCHER (CLEAN & NEAT SIDE-BY-SIDE) */}
        {activeTab === "launcher" && (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-6">
              <CreateRoomCard />
              <JoinRoomCard />
            </div>

            {/* Clean Prompt to Search Content */}
            <div className="w-full max-w-4xl p-4 rounded-2xl bg-theater-900/60 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Not sure what to watch?
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Search any anime, movie, or show from the internet and read executive summaries before launching.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("search")}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
              >
                <span>Browse & Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INTERNET MEDIA SEARCH & AI SUMMARY */}
        {activeTab === "search" && (
          <div className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200">
            <MediaSearchSection />
          </div>
        )}

        {/* TAB 3: FEATURES & ARCHITECTURE */}
        {activeTab === "features" && (
          <div className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h3 className="text-xl font-bold text-white mb-1">
                How JASAGA PARTY Works
              </h3>
              <p className="text-xs text-slate-400">
                Built with modern web standards, cloud virtualization, and real-time websockets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-theater-900/70 border border-purple-900/30">
                <div className="w-9 h-9 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  75% Cinema Viewport
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dedicated Chromium virtual browser powered by Hyperbeam with full audio, multi-viewer sync, and take-over controls.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-theater-900/70 border border-purple-900/30">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  25% Real-Time Chat
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Supabase Realtime messaging with live viewer presence, quick Chainsaw Man emojis (🪚, 💣, 🐶), and floating reaction bursts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-theater-900/70 border border-purple-900/30">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Share2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">
                  1-Click Room Links
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant party code generation with zero registration needed. Share with friends to sync up immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-theater-800/80 py-5 px-6 max-w-7xl mx-auto w-full text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>JASAGA PARTY • Chainsaw Man Anime Edition • Next.js & Tailwind CSS</span>
        <div className="flex items-center gap-4">
          <span className="text-purple-400 font-medium">Hyperbeam Cloud</span>
          <span>•</span>
          <span className="text-purple-400 font-medium">Supabase Realtime</span>
        </div>
      </footer>

      {/* Profile Edit Modal */}
      <UserProfileModal
        user={user}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={updateProfile}
      />

      {/* Moving Denji & Reze Anime Companions */}
      <ChainsawManCompanions />
    </div>
  );
}
