"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Users,
  Tv,
  Share2,
  MessageSquare,
  Sparkles,
  Settings,
} from "lucide-react";
import { UserProfile, PresenceUser } from "@/types/chat";

interface TheaterHeaderProps {
  roomId: string;
  roomName?: string;
  currentUser: UserProfile;
  onlineMembers: PresenceUser[];
  onOpenProfile: () => void;
  onToggleMobileChat: () => void;
  isMobileChatOpen: boolean;
  unreadCount?: number;
}

export const TheaterHeader: React.FC<TheaterHeaderProps> = ({
  roomId,
  roomName,
  currentUser,
  onlineMembers,
  onOpenProfile,
  onToggleMobileChat,
  isMobileChatOpen,
  unreadCount = 0,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRoomLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/room/${roomId}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-theater-950 border-b border-theater-800 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3 md:gap-5">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 font-black text-sm tracking-wide bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              JASAGA<span className="text-brand-purple"> PARTY</span>
            </div>
            <div className="text-[10px] text-purple-400 font-mono font-medium -mt-1 tracking-wider uppercase">
              アニメ・シアター
            </div>
          </div>
        </Link>

        <div className="h-6 w-px bg-theater-800 hidden sm:block" />

        {/* Room Badge */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h1 className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
              {roomName || `Room: ${roomId}`}
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span>#{roomId}</span>
            </div>
          </div>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theater-850 hover:bg-theater-800 border border-theater-700 text-xs text-slate-300 hover:text-white transition-all shadow-sm group"
            title="Copy watch party invite link"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-brand-purple group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline">Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right controls: Viewers count, User info, and Mobile Chat Toggle */}
      <div className="flex items-center gap-3">
        {/* Active viewers pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-theater-900 border border-theater-800 text-xs text-slate-300 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-white">
            {Math.max(onlineMembers.length, 1)}
          </span>
          <span className="hidden sm:inline text-slate-400">watching</span>
        </div>

        {/* User profile button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-theater-900 hover:bg-theater-850 border border-theater-800 transition-colors"
          title="Customize profile"
        >
          <div
            className={`w-7 h-7 rounded-full bg-gradient-to-tr ${currentUser.color} flex items-center justify-center text-sm shadow-md`}
          >
            {currentUser.avatar}
          </div>
          <span className="hidden md:inline text-xs font-medium text-slate-300 max-w-[100px] truncate">
            {currentUser.name}
          </span>
          <Settings className="w-3 h-3 text-slate-500 hidden md:block" />
        </button>

        {/* Mobile / Small Screen Chat Drawer Toggle */}
        <button
          onClick={onToggleMobileChat}
          className="lg:hidden relative p-2 rounded-xl bg-theater-850 hover:bg-theater-800 border border-theater-700 text-slate-300 transition-colors"
          title="Toggle Chat"
        >
          <MessageSquare className="w-5 h-5 text-brand-purple" />
          {!isMobileChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-theater-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
